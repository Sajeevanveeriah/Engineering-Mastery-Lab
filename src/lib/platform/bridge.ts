// PlatformBridge: the single seam between the web UI and desktop capabilities.
// The web build has no bridge (null); the Tauri build provides TauriBridge;
// tests use MemoryBridge from ./memoryBridge.

export type ToolId = "ngspice" | "kicad-cli";

export interface ToolDetection {
  found: boolean;
  /** Absolute path of the executable actually resolved. */
  path?: string;
  /** Raw version string reported by the tool. */
  version?: string;
  error?: string;
}

export interface ProcessResult {
  /** Null when the process was killed (timeout/cancel) before exiting. */
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  cancelled: boolean;
  /** True when stdout or stderr hit the output cap and was truncated. */
  truncated: boolean;
  durationMs: number;
}

/** Typed, allow-listed process requests. Mirrors the Rust `ToolRunRequest` enum. */
export type ToolRunRequest =
  | {
      tool: "ngspice";
      /** Netlist path relative to the workspace root. */
      netlistRelPath: string;
      /** Directory (workspace-relative) where ngspice writes raw output files. */
      outputDirRelPath: string;
    }
  | {
      tool: "kicad-cli";
      subcommand: KicadSubcommand;
      /** Input design file, workspace-relative. */
      inputRelPath: string;
      /** Output file or directory, workspace-relative. */
      outputRelPath: string;
    };

export type KicadSubcommand =
  | "sch-erc"
  | "pcb-drc"
  | "sch-export-netlist"
  | "sch-export-bom"
  | "pcb-export-gerbers"
  | "pcb-export-drill"
  | "pcb-render";

export interface RunOptions {
  workspaceRoot: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface PlatformBridge {
  readonly isDesktop: boolean;
  detectTool(tool: ToolId): Promise<ToolDetection>;
  /** Choose and host-validate a tool executable with the native file picker. */
  pickToolExecutable(tool: ToolId): Promise<ToolDetection | null>;
  /** Forget a session selection and return to trusted host auto-discovery. */
  clearToolExecutable(tool: ToolId): Promise<void>;
  runTool(request: ToolRunRequest, options: RunOptions): Promise<ProcessResult>;
  readTextFile(root: string, relPath: string, maxBytes?: number): Promise<string>;
  writeTextFileAtomic(root: string, relPath: string, contents: string): Promise<void>;
  listDir(root: string, relPath: string): Promise<string[]>;
  /** SHA-256 of the file contents, lowercase hex. */
  hashFile(root: string, relPath: string): Promise<string>;
  createDirAll(root: string, relPath: string): Promise<void>;
  fileExists(root: string, relPath: string): Promise<boolean>;
  pickDirectory(title: string): Promise<string | null>;
}

/** Default and ceiling for external process timeouts (mirrored in Rust). */
export const DEFAULT_TIMEOUT_MS = 60_000;
export const MAX_TIMEOUT_MS = 300_000;
/** Output cap per stream (mirrored in Rust). */
export const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
