// PlatformBridge implementation backed by Tauri IPC. Imported dynamically so
// the web (GitHub Pages) bundle never loads Tauri modules eagerly.

import {
  PlatformBridge,
  ProcessResult,
  RunOptions,
  ToolDetection,
  ToolId,
  ToolRunRequest
} from "./bridge";

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export class TauriBridge implements PlatformBridge {
  readonly isDesktop = true;

  private constructor(private invoke: InvokeFn) {}

  static async create(): Promise<TauriBridge> {
    const { invoke } = await import("@tauri-apps/api/core");
    return new TauriBridge(invoke as InvokeFn);
  }

  detectTool(tool: ToolId): Promise<ToolDetection> {
    return this.invoke<ToolDetection>("detect_tool", { tool });
  }

  pickToolExecutable(tool: ToolId): Promise<ToolDetection | null> {
    return this.invoke<ToolDetection | null>("pick_tool_executable", { tool });
  }

  clearToolExecutable(tool: ToolId): Promise<void> {
    return this.invoke<void>("clear_tool_executable", { tool });
  }

  async runTool(request: ToolRunRequest, options: RunOptions): Promise<ProcessResult> {
    const cancelId = options.signal ? `run-${Math.random().toString(36).slice(2)}` : null;
    let onAbort: (() => void) | undefined;
    if (options.signal && cancelId) {
      onAbort = () => void this.invoke("cancel_run", { cancelId });
      if (options.signal.aborted) {
        return { exitCode: null, stdout: "", stderr: "", timedOut: false, cancelled: true, truncated: false, durationMs: 0 };
      }
      options.signal.addEventListener("abort", onAbort, { once: true });
    }
    try {
      return await this.invoke<ProcessResult>("run_tool", {
        request,
        options: {
          workspaceRoot: options.workspaceRoot,
          timeoutMs: options.timeoutMs ?? null,
          cancelId
        }
      });
    } finally {
      if (options.signal && onAbort) options.signal.removeEventListener("abort", onAbort);
    }
  }

  readTextFile(root: string, relPath: string, maxBytes?: number): Promise<string> {
    return this.invoke<string>("read_text_file", { root, relPath, maxBytes: maxBytes ?? null });
  }

  writeTextFileAtomic(root: string, relPath: string, contents: string): Promise<void> {
    return this.invoke<void>("write_text_file_atomic", { root, relPath, contents });
  }

  listDir(root: string, relPath: string): Promise<string[]> {
    return this.invoke<string[]>("list_dir", { root, relPath });
  }

  hashFile(root: string, relPath: string): Promise<string> {
    return this.invoke<string>("hash_file", { root, relPath });
  }

  createDirAll(root: string, relPath: string): Promise<void> {
    return this.invoke<void>("create_dir_all", { root, relPath });
  }

  fileExists(root: string, relPath: string): Promise<boolean> {
    return this.invoke<boolean>("file_exists", { root, relPath });
  }

  async pickDirectory(title: string): Promise<string | null> {
    return this.invoke<string | null>("pick_workspace_directory", { title });
  }

}

let cached: Promise<PlatformBridge | null> | null = null;

/** Resolve the platform bridge once: TauriBridge on desktop, null on the web. */
export function getPlatformBridge(): Promise<PlatformBridge | null> {
  if (!cached) {
    cached = isTauri() ? TauriBridge.create().then((b): PlatformBridge | null => b) : Promise.resolve(null);
  }
  return cached;
}
