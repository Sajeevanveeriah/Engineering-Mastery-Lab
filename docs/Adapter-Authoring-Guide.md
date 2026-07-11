# Adapter authoring guide

An adapter exposes an engine — in-process TypeScript or an external command-
line tool — through contract v1 (`src/lib/adapters/contract.ts`). The UI,
diagnostics screen and evidence report consume adapters only through the
registry, so a correctly written adapter appears everywhere automatically.

## The contract

```ts
interface EngineAdapter {
  readonly contractVersion: 1;
  describe(): AdapterInfo;                       // id, name, kind, capabilities
  detect(bridge): Promise<DetectionResult>;      // readiness + version + remediation
  validate(request): ValidationIssue[];          // cheap structural checks
  execute(request, ctx): Promise<AdapterResult>; // structured result
}
```

Rules the registry enforces:

- `contractVersion` must equal 1 (unknown versions are rejected at register time).
- Adapter ids are unique; capability ids must be namespaced `<adapterId>.<cap>`.

Rules you must follow:

1. **Pure logic in plain modules.** Netlist/report generation and output
   parsing live in files with no React or Tauri imports so they are unit-
   testable (see `ngspice/netlist.ts`, `kicad/parse.ts`).
2. **Never bypass the bridge.** All file IO and process execution goes through
   `PlatformBridge`. Never import Tauri APIs in an adapter.
3. **Validate before executing.** `execute` must re-run validation and return
   `invalid-input` (not throw) on bad requests.
4. **Map every failure to a status**: `tool-missing`, `timeout`, `cancelled`,
   `failed`, `invalid-input` — each with a human-readable `message` that says
   what happened *and what to do about it*.
5. **Inventory generated files** with workspace-relative paths and SHA-256
   hashes so evidence reports can reference them.
6. **Handle malformed tool output** by returning `failed` with the raw output
   preserved in `raw` — never crash the app on a parser error.

## External tools need a Rust allow-list entry

The frontend cannot pass raw argument arrays. To integrate a new executable:

1. Add a variant to `ToolRunRequest` in `src-tauri/src/tools.rs` with typed,
   workspace-relative path fields, and map it to a **fixed** argument vector in
   `build_args` (validating every path with `validate_rel_path`).
2. Add detection candidates (`path_candidates`, `well_known_locations`,
   `version_args`).
3. Mirror the request type in `src/lib/platform/bridge.ts` (`ToolRunRequest`).
4. Add Rust unit tests: argument mapping, path-injection rejection, unknown-
   subcommand rejection.

Timeouts, output caps, cancellation and no-shell spawning are provided by
`run_with_limits` — do not reimplement them.

## Testing without the real tool

Use `MemoryBridge` (`src/lib/platform/memoryBridge.ts`):

```ts
const bridge = new MemoryBridge();
bridge.detections.set("mytool", { found: true, path: "/usr/bin/mytool", version: "1.2" });
bridge.seedFile("/ws", "inputs/design.x", "...");
bridge.onRun = (req, opts) => {
  bridge.seedFile(opts.workspaceRoot, "results/out.json", FIXTURE_OUTPUT);
  return { exitCode: 0, stdout: "", stderr: "", timedOut: false, cancelled: false, truncated: false, durationMs: 5 };
};
```

Capture representative real output once (success, failure, malformed) into
`src/tests/fixtures/` and cover at minimum: happy path, missing tool, timeout,
cancellation, non-zero exit, malformed output, unsafe path rejection.

## Registration

Add the adapter in `src/lib/adapters/instance.ts`. Nothing else is needed —
Diagnostics, the Workbench and evidence reports discover it via the registry.
