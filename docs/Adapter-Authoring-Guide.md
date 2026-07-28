# Adapter authoring guide

An adapter exposes an engine, either in-process TypeScript or an external
command-line tool, through contract v1 (`src/lib/adapters/contract.ts`). The UI,
diagnostics screen and evidence report consume adapters only through the
registry, so a correctly written adapter appears everywhere automatically.

The Phase 4 adapter-ecosystem descriptor in
`src/lib/interchange/adapterEcosystem.ts` is a separate, provider-neutral,
data-only contract. It describes discovery, compatibility, execution policy
and deterministic fixture evidence. It does not grant process or filesystem
authority and it does not replace the existing `EngineAdapter`,
`PlatformBridge` or Rust allow-list.

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
   `failed`, `invalid-input`; each has a human-readable `message` that says
   what happened *and what to do about it*.
5. **Inventory generated files** with workspace-relative paths and SHA-256
   hashes so evidence reports can reference them.
6. **Handle malformed tool output** by returning `failed` with the raw output
   preserved in `raw`; never crash the app on a parser error.

The browser build resolves `getPlatformBridge()` to `null`. The desktop build
dynamically creates `TauriBridge`. Tests use `MemoryBridge`. There is no
external open or reveal method in the current bridge.

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
`run_with_limits`; do not reimplement them. Timeout or cancellation terminates
the Windows Job Object or Unix process group and then reaps the child. A new
adapter must not weaken that process-tree boundary.

The Tauri capability manifest must grant only the named command. Do not add a
shell, generic process, opener, broad filesystem or arbitrary-path capability.

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

Add the adapter in `src/lib/adapters/instance.ts`. Nothing else is needed;
Diagnostics, the Workbench and evidence reports discover it via the registry.

## Provider-neutral descriptor

Use `AdapterEcosystemDescriptor` only when a catalogue or Project Pack needs a
bounded description of an adapter:

```ts
interface AdapterEcosystemDescriptor {
  schemaVersion: 1;
  adapterId: string;
  adapterVersion: string;
  kind: "builtin" | "external";
  availability: AdapterAvailability;
  capabilities: EcosystemCapability[];
  executionPolicy: AdapterExecutionPolicy;
}
```

Descriptor rules:

- the adapter version is a semantic version;
- every capability id is namespaced as `<adapterId>.<capability>`;
- each capability declares input and output schema versions;
- an optional deterministic fixture id identifies test evidence;
- timeout policy is bounded from 50 ms to 120,000 ms;
- output policy is bounded from 1,024 to 16,000,000 bytes; and
- cancellation is declared as cooperative at this descriptor layer.

`planAdapterExecution` hashes a canonical request and returns `ready`,
`blocked-tool-missing`, `blocked-adapter` or `cancelled-before-start`.
`settleAdapterExecution` maps observed elapsed time, cancellation and adapter
status to a deterministic terminal state. Neither function launches, waits for
or terminates a process.

`createDeterministicFixtureResult` validates the declared fixture, enforces the
descriptor output limit and hashes canonical input and output. Its
`verificationBoundary` is exactly `deterministic-fixture-only`. Never present
fixture evidence as proof that an external tool, packaged desktop runtime or
operating-system integration was executed.

## Acceptance checks for a new adapter

Before registration or release:

1. Validate the descriptor and reject duplicate adapter or capability ids.
2. Cover ready, missing, disabled, unknown, timeout, cancellation, non-zero
   exit, malformed output, output-cap and unsafe-path cases.
3. Verify the TypeScript request mirrors a typed Rust enum variant exactly.
4. Verify the Rust argument vector, input zone, output zone and executable
   detection using unit tests.
5. Run the narrow adapter tests, nearby workspace and report regressions,
   TypeScript checks, Rust formatting, Clippy and Rust tests.
6. Run the real tool only when it is installed and explicitly in scope. Label
   fixture-only evidence honestly when it is not.
