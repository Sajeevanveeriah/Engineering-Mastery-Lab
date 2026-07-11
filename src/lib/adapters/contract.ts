// Adapter contract v1. Every engine — built-in TypeScript simulation or
// external command-line tool — implements this interface and registers in the
// capability registry. Pure data in, pure data out; no React, no Tauri.

import { PlatformBridge } from "../platform/bridge";

export const ADAPTER_CONTRACT_VERSION = 1 as const;

export type AdapterKind = "builtin" | "external";

export interface Capability {
  /** Stable id, namespaced by adapter, e.g. "ngspice.tran". */
  id: string;
  title: string;
  description: string;
}

export interface AdapterInfo {
  id: string;
  name: string;
  kind: AdapterKind;
  contractVersion: typeof ADAPTER_CONTRACT_VERSION;
  capabilities: Capability[];
}

export interface DetectionResult {
  ready: boolean;
  executablePath?: string;
  version?: string;
  error?: string;
  /** Actionable guidance when not ready (install link, settings hint). */
  remediation?: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  field?: string;
}

export interface DataSeries {
  name: string;
  unit?: string;
  values: number[];
}

/** Plot-compatible table: first column is the independent variable. */
export interface DataTable {
  title: string;
  columns: DataSeries[];
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  /** e.g. "ngspice", "kicad-cli erc", "validator". */
  source?: string;
  /** File/sheet/net reference when available. */
  location?: string;
}

export interface GeneratedFile {
  relPath: string;
  /** e.g. "csv", "raw", "gerber", "report", "netlist". */
  kind: string;
  description?: string;
  sha256?: string;
}

export type AdapterStatus =
  | "ok"
  | "failed"
  | "timeout"
  | "cancelled"
  | "tool-missing"
  | "invalid-input";

export interface AdapterResult {
  status: AdapterStatus;
  capabilityId: string;
  /** Human-readable outcome; on failure this states what happened and what to try. */
  message: string;
  tables: DataTable[];
  scalars: Record<string, number>;
  diagnostics: Diagnostic[];
  generatedFiles: GeneratedFile[];
  raw?: { stdout?: string; stderr?: string; truncated?: boolean };
  durationMs?: number;
  toolVersion?: string;
}

export interface AdapterRequest {
  capabilityId: string;
  params: Record<string, unknown>;
}

export interface ExecutionContext {
  bridge: PlatformBridge | null;
  /** Absolute workspace root (desktop only). */
  workspaceRoot?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface EngineAdapter {
  readonly contractVersion: typeof ADAPTER_CONTRACT_VERSION;
  describe(): AdapterInfo;
  detect(bridge: PlatformBridge | null): Promise<DetectionResult>;
  validate(request: AdapterRequest): ValidationIssue[];
  execute(request: AdapterRequest, ctx: ExecutionContext): Promise<AdapterResult>;
}

/** Convenience constructor for failure results with a consistent shape. */
export function failureResult(
  capabilityId: string,
  status: Exclude<AdapterStatus, "ok">,
  message: string,
  extra: Partial<AdapterResult> = {}
): AdapterResult {
  return {
    status,
    capabilityId,
    message,
    tables: [],
    scalars: {},
    diagnostics: [],
    generatedFiles: [],
    ...extra
  };
}
