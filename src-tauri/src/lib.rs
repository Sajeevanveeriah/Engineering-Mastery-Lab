mod paths;
mod process;
mod tool_authority;
mod tools;
mod workspace_authority;
mod workspace_fs;

use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use process::{run_with_limits, ProcessOutcome};
use tauri_plugin_dialog::DialogExt;
use tool_authority::ToolAuthority;
use tools::{is_known_tool, resolve_program, validated_root, ToolDetection, ToolRunRequest};
use workspace_authority::WorkspaceAuthority;

/// Cancellation registry: cancelId → flag. Entries are removed when the run
/// finishes so the map cannot grow unboundedly.
#[derive(Default)]
struct CancelRegistry(Mutex<HashMap<String, Arc<AtomicBool>>>);

impl CancelRegistry {
    fn register(&self, id: &str) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        self.0
            .lock()
            .expect("cancel registry lock")
            .insert(id.to_string(), Arc::clone(&flag));
        flag
    }

    fn remove(&self, id: &str) {
        self.0.lock().expect("cancel registry lock").remove(id);
    }

    /// Signal cancellation for an in-flight run. Returns false when the id is
    /// unknown (e.g. the run already finished and was removed).
    fn cancel(&self, id: &str) -> bool {
        match self.0.lock().expect("cancel registry lock").get(id) {
            Some(flag) => {
                flag.store(true, Ordering::Relaxed);
                true
            }
            None => false,
        }
    }
}

/// Validated pre-spawn plan: workspace root, program path and argument vector.
#[derive(Debug)]
struct RunPlan {
    program: std::path::PathBuf,
    args: Vec<String>,
    root: std::path::PathBuf,
}

/// Assemble and validate everything needed before spawning, in a fixed order:
/// workspace root, then argument vector (which re-validates every path), then
/// program resolution. Path/argument errors short-circuit before the tool is
/// ever resolved or launched. Extracted from `run_tool` so the ordering and
/// failure semantics are unit-testable without a Tauri runtime.
fn prepare_run(
    workspace_root: &str,
    request: &ToolRunRequest,
    selected_tool_path: Option<&Path>,
) -> Result<RunPlan, String> {
    let root = validated_root(workspace_root).map_err(|e| e.to_string())?;
    let args = request.build_args()?;
    request.validate_command_boundary(&root)?;
    let program = resolve_program(request.tool_id(), selected_tool_path)?;
    Ok(RunPlan {
        program,
        args,
        root,
    })
}

fn prepare_authorised_run(
    workspace_authority: &WorkspaceAuthority,
    tool_authority: &ToolAuthority,
    workspace_root: &str,
    request: &ToolRunRequest,
) -> Result<RunPlan, String> {
    let root = workspace_authority.require_root_string(workspace_root)?;
    let selected = tool_authority.selected(request.tool_id())?;
    prepare_run(&root, request, selected.as_deref())
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunToolOptions {
    workspace_root: String,
    timeout_ms: Option<u64>,
    cancel_id: Option<String>,
}

#[tauri::command]
async fn detect_tool(
    tool_authority: tauri::State<'_, ToolAuthority>,
    tool: String,
) -> Result<ToolDetection, String> {
    let authority = tool_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || authority.detect(&tool))
        .await
        .map_err(|error| format!("detection task failed: {error}"))
}

#[tauri::command]
async fn run_tool(
    cancellations: tauri::State<'_, CancelRegistry>,
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    tool_authority: tauri::State<'_, ToolAuthority>,
    request: ToolRunRequest,
    options: RunToolOptions,
) -> Result<ProcessOutcome, String> {
    let workspace_authority = workspace_authority.inner().clone();
    let tool_authority = tool_authority.inner().clone();
    let plan = prepare_authorised_run(
        &workspace_authority,
        &tool_authority,
        &options.workspace_root,
        &request,
    )?;

    let cancel_flag = options
        .cancel_id
        .as_ref()
        .map(|id| cancellations.register(id));

    let timeout_ms = options.timeout_ms;
    let requested_root = options.workspace_root.clone();
    let RunPlan {
        program,
        args,
        root,
    } = plan;
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        let current_root = workspace_authority.require_root(&requested_root)?;
        if current_root != root {
            return Err("authorised workspace root changed before tool launch".to_string());
        }
        let current_program = tool_authority.resolve(request.tool_id())?;
        if current_program != program {
            return Err(
                "selected executable changed before tool launch; run the action again".to_string(),
            );
        }
        // Re-check after executable detection and immediately before the
        // actual tool spawn, narrowing the validation-to-use window for a deck
        // that may be writable by another workspace operation.
        request.validate_command_boundary(&current_root)?;
        let mut command = Command::new(current_program);
        command.args(args).current_dir(current_root);
        run_with_limits(command, timeout_ms, cancel_flag)
    })
    .await
    .map_err(|e| format!("execution task failed: {e}"))?;

    if let Some(id) = options.cancel_id {
        cancellations.remove(&id);
    }
    outcome
}

#[tauri::command]
async fn pick_tool_executable(
    app: tauri::AppHandle,
    tool_authority: tauri::State<'_, ToolAuthority>,
    tool: String,
) -> Result<Option<ToolDetection>, String> {
    if !is_known_tool(&tool) {
        return Err(format!("unknown tool {tool:?}"));
    }
    let picker_title = match tool.as_str() {
        tools::TOOL_NGSPICE => "Choose the installed ngspice executable",
        tools::TOOL_KICAD => "Choose the installed kicad-cli executable",
        _ => unreachable!("tool identifier was validated"),
    };
    let selected = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .set_title(picker_title)
            .blocking_pick_file()
    })
    .await
    .map_err(|error| format!("executable picker task failed: {error}"))?;

    match selected {
        Some(path) => {
            let path = path
                .into_path()
                .map_err(|error| format!("selected executable path is invalid: {error}"))?;
            tool_authority.authorise_selected(&tool, &path).map(Some)
        }
        None => Ok(None),
    }
}

#[tauri::command]
fn clear_tool_executable(
    tool_authority: tauri::State<'_, ToolAuthority>,
    tool: String,
) -> Result<(), String> {
    tool_authority.clear(&tool)
}

#[tauri::command]
fn cancel_run(state: tauri::State<'_, CancelRegistry>, cancel_id: String) -> bool {
    state.cancel(&cancel_id)
}

#[tauri::command]
async fn pick_workspace_directory(
    app: tauri::AppHandle,
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    title: String,
) -> Result<Option<String>, String> {
    let title = title.trim();
    if title.is_empty() || title.chars().count() > 200 {
        return Err("folder picker title must contain 1 to 200 characters".to_string());
    }
    let title = title.to_string();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        app.dialog().file().set_title(title).blocking_pick_folder()
    })
    .await
    .map_err(|error| format!("folder picker task failed: {error}"))?;

    match selected {
        Some(path) => path
            .into_path()
            .map_err(|error| format!("selected folder path is invalid: {error}"))
            .and_then(|path| workspace_authority.authorise_selected_root(path))
            .map(Some),
        None => Ok(None),
    }
}

#[tauri::command]
async fn read_text_file(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
    max_bytes: Option<u64>,
) -> Result<String, String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::read_text_file(&root, &rel_path, max_bytes)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn write_text_file_atomic(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
    contents: String,
) -> Result<(), String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::write_text_file_atomic(&root, &rel_path, &contents)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn list_dir(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
) -> Result<Vec<String>, String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::list_dir(&root, &rel_path)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn hash_file(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
) -> Result<String, String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::hash_file(&root, &rel_path)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn create_dir_all(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
) -> Result<(), String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::create_dir_all(&root, &rel_path)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn file_exists(
    workspace_authority: tauri::State<'_, WorkspaceAuthority>,
    root: String,
    rel_path: String,
) -> Result<bool, String> {
    let authority = workspace_authority.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let root = authority.require_root_string(&root)?;
        workspace_fs::file_exists(&root, &rel_path)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CancelRegistry::default())
        .manage(WorkspaceAuthority::default())
        .manage(ToolAuthority::default())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_tool,
            run_tool,
            cancel_run,
            pick_tool_executable,
            clear_tool_executable,
            pick_workspace_directory,
            read_text_file,
            write_text_file_atomic,
            list_dir,
            hash_file,
            create_dir_all,
            file_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tools::ToolRunRequest;

    fn temp_root(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("ewb-lib-{name}-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        dir.to_string_lossy().into_owned()
    }

    #[test]
    fn prepare_run_rejects_unsafe_paths_before_resolving_the_tool() {
        // An injection attempt in the netlist path must fail at build_args,
        // BEFORE resolve_program is reached - so this errors even though the
        // tool may not be installed (it never gets that far).
        let root = temp_root("prep");
        let request = ToolRunRequest::Ngspice {
            netlist_rel_path: "../escape.cir".into(),
            output_dir_rel_path: "results".into(),
        };
        let err = prepare_run(&root, &request, None).unwrap_err();
        assert!(err.contains("forbidden component") || err.contains("workspace-relative"));
    }

    #[test]
    fn prepare_run_rejects_invalid_workspace_root_first() {
        let request = ToolRunRequest::Ngspice {
            netlist_rel_path: "circuits/rc.cir".into(),
            output_dir_rel_path: "results".into(),
        };
        let err = prepare_run("Z:/no/such/root", &request, None).unwrap_err();
        assert!(err.contains("workspace root is invalid"));
    }

    #[test]
    fn authorised_prepare_rejects_arbitrary_existing_root_before_tool_resolution() {
        let root = temp_root("unauthorised-prep");
        let request = ToolRunRequest::Ngspice {
            netlist_rel_path: "simulations/run.deck.cir".into(),
            output_dir_rel_path: "results".into(),
        };
        let authority = WorkspaceAuthority::default();
        let tools = ToolAuthority::default();

        let error = prepare_authorised_run(&authority, &tools, &root, &request).unwrap_err();

        assert!(
            error.contains("not authorised"),
            "unexpected error: {error}"
        );
    }

    #[test]
    fn authorised_prepare_accepts_registered_root_before_request_validation() {
        let root = std::path::PathBuf::from(temp_root("authorised-prep"));
        let authority = WorkspaceAuthority::default();
        let tools = ToolAuthority::default();
        let authorised = authority.authorise_selected_root(root).unwrap();
        let request = ToolRunRequest::Ngspice {
            netlist_rel_path: "../escape.cir".into(),
            output_dir_rel_path: "results".into(),
        };

        let error = prepare_authorised_run(&authority, &tools, &authorised, &request).unwrap_err();

        assert!(
            error.contains("forbidden component") || error.contains("workspace-relative"),
            "registered root should reach request validation: {error}"
        );
    }

    #[test]
    fn prepare_run_rejects_unsafe_deck_before_resolving_the_tool() {
        let root = temp_root("unsafe-deck");
        let simulations = std::path::Path::new(&root).join("simulations");
        std::fs::create_dir_all(&simulations).unwrap();
        std::fs::write(
            simulations.join("unsafe.deck.cir"),
            "* malicious\n.cont\n+rol\nsh\n+ell whoami\n\n* --- generated by Engineering Workbench; do not edit ---\n.control\nset filetype=ascii\nop\nprint all\nquit\n.endc\n.end\n",
        )
        .unwrap();
        let request = ToolRunRequest::Ngspice {
            netlist_rel_path: "simulations/unsafe.deck.cir".into(),
            output_dir_rel_path: "results".into(),
        };

        // The content error proves validation ran before executable detection;
        // the result is independent of whether ngspice is installed.
        let err = prepare_run(&root, &request, None).unwrap_err();
        assert!(err.contains("forbidden user"), "unexpected error: {err}");
    }

    #[test]
    fn cancel_registry_signals_only_known_ids_and_cleans_up() {
        let reg = CancelRegistry::default();
        // Unknown id: cancel is a no-op returning false.
        assert!(!reg.cancel("missing"));

        let flag = reg.register("run-1");
        assert!(!flag.load(Ordering::Relaxed));
        // Cancelling a registered id flips its flag and reports success.
        assert!(reg.cancel("run-1"));
        assert!(flag.load(Ordering::Relaxed));

        // After removal (run finished), a late cancel returns false and does
        // not panic - the exact "cancel after complete" path.
        reg.remove("run-1");
        assert!(!reg.cancel("run-1"));
    }
}
