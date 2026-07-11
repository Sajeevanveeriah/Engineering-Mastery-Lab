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
    let root = validated_root(&options.workspace_root).map_err(|e| e.to_string())?;
    let args = request.build_args()?;
    let program = resolve_program(request.tool_id(), options.tool_path_override.as_deref())?;

    let cancel_flag = options.cancel_id.as_ref().map(|id| {
        let flag = Arc::new(AtomicBool::new(false));
        state
            .0
            .lock()
            .expect("cancel registry lock")
            .insert(id.clone(), Arc::clone(&flag));
        flag
    });

    let timeout_ms = options.timeout_ms;
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        let mut command = Command::new(program);
        command.args(args).current_dir(root);
        run_with_limits(command, timeout_ms, cancel_flag)
    })
    .await
    .map_err(|e| format!("execution task failed: {e}"))?;

    if let Some(id) = options.cancel_id {
        state.0.lock().expect("cancel registry lock").remove(&id);
    }
    outcome
}

#[tauri::command]
fn cancel_run(state: tauri::State<'_, CancelRegistry>, cancel_id: String) -> bool {
    match state
        .0
        .lock()
        .expect("cancel registry lock")
        .get(&cancel_id)
    {
        Some(flag) => {
            flag.store(true, Ordering::Relaxed);
            true
        }
        None => false,
    }
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
