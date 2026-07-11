mod paths;
mod process;
mod tools;
mod workspace_fs;

use std::collections::HashMap;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use process::{run_with_limits, ProcessOutcome};
use tools::{
    detect_tool as detect, resolve_program, validated_root, ToolDetection, ToolRunRequest,
};

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
    tool_path_override: Option<&str>,
) -> Result<RunPlan, String> {
    let root = validated_root(workspace_root).map_err(|e| e.to_string())?;
    let args = request.build_args()?;
    let program = resolve_program(request.tool_id(), tool_path_override)?;
    Ok(RunPlan {
        program,
        args,
        root,
    })
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunToolOptions {
    workspace_root: String,
    timeout_ms: Option<u64>,
    tool_path_override: Option<String>,
    cancel_id: Option<String>,
}

#[tauri::command]
async fn detect_tool(tool: String, override_path: Option<String>) -> ToolDetection {
    tauri::async_runtime::spawn_blocking(move || detect(&tool, override_path.as_deref()))
        .await
        .unwrap_or(ToolDetection {
            found: false,
            path: None,
            version: None,
            error: Some("detection task failed".into()),
        })
}

#[tauri::command]
async fn run_tool(
    state: tauri::State<'_, CancelRegistry>,
    request: ToolRunRequest,
    options: RunToolOptions,
) -> Result<ProcessOutcome, String> {
    let plan = prepare_run(
        &options.workspace_root,
        &request,
        options.tool_path_override.as_deref(),
    )?;

    let cancel_flag = options.cancel_id.as_ref().map(|id| state.register(id));

    let timeout_ms = options.timeout_ms;
    let RunPlan {
        program,
        args,
        root,
    } = plan;
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        let mut command = Command::new(program);
        command.args(args).current_dir(root);
        run_with_limits(command, timeout_ms, cancel_flag)
    })
    .await
    .map_err(|e| format!("execution task failed: {e}"))?;

    if let Some(id) = options.cancel_id {
        state.remove(&id);
    }
    outcome
}

#[tauri::command]
fn cancel_run(state: tauri::State<'_, CancelRegistry>, cancel_id: String) -> bool {
    state.cancel(&cancel_id)
}

#[tauri::command]
async fn read_text_file(
    root: String,
    rel_path: String,
    max_bytes: Option<u64>,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        workspace_fs::read_text_file(&root, &rel_path, max_bytes)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn write_text_file_atomic(
    root: String,
    rel_path: String,
    contents: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        workspace_fs::write_text_file_atomic(&root, &rel_path, &contents)
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn list_dir(root: String, rel_path: String) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || workspace_fs::list_dir(&root, &rel_path))
        .await
        .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn hash_file(root: String, rel_path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || workspace_fs::hash_file(&root, &rel_path))
        .await
        .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn create_dir_all(root: String, rel_path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || workspace_fs::create_dir_all(&root, &rel_path))
        .await
        .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
async fn file_exists(root: String, rel_path: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || workspace_fs::file_exists(&root, &rel_path))
        .await
        .map_err(|e| format!("task failed: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CancelRegistry::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
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
        // BEFORE resolve_program is reached — so this errors even though the
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
        // not panic — the exact "cancel after complete" path.
        reg.remove("run-1");
        assert!(!reg.cancel("run-1"));
    }
}
