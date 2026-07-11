const APPLICATION_COMMANDS: &[&str] = &[
    "detect_tool",
    "run_tool",
    "cancel_run",
    "pick_tool_executable",
    "clear_tool_executable",
    "pick_workspace_directory",
    "read_text_file",
    "write_text_file_atomic",
    "list_dir",
    "hash_file",
    "create_dir_all",
    "file_exists",
];

fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(APPLICATION_COMMANDS)),
    )
    .expect("failed to build Engineering Workbench Tauri application");
}
