# ADR-0002: Versioned adapter contract with a single capability registry

Date: 2026-07-11 · Status: Accepted

## Context

The workbench must expose heterogeneous engines through one surface: pure-TypeScript simulation
engines that already exist in `src/lib/simulations/`, and external command-line tools (ngspice,
kicad-cli) that may be missing, outdated or broken on any given machine. Callers (UI, evidence
reports, future adapters) need capability discovery, validation, execution, cancellation and
structured results without knowing how an adapter is implemented.

## Decision

Define `AdapterContract` v1 in `src/lib/adapters/contract.ts`:

- `contractVersion` — literal `1`; the registry rejects adapters with unknown versions.
- `describe()` — adapter id, display name, kind (`builtin` | `external`), capability list.
- `detect(bridge)` — tool presence + version for external adapters; always-ready for built-ins.
- `validate(request)` — cheap, synchronous-ish input validation returning structured issues.
- `execute(request, ctx)` — returns `AdapterResult` (status, numeric series, diagnostics,
  generated-file inventory, human-readable failure message). `ctx` carries an `AbortSignal`
  and timeout; external adapters forward both to the Rust process runner.

Built-in TS engines are wrapped by thin adapter classes that call the existing pure functions
directly — they are **not** forced through process execution or serialisation.

A single `AdapterRegistry` holds all adapters keyed by id and answers capability queries.

## Consequences

- The diagnostics screen, workbench UI and evidence report all consume one interface.
- Pure simulation mathematics stays framework-free; adapters import it, not vice versa.
- New tools are added by implementing the contract and registering — documented in
  `docs/Adapter-Authoring-Guide.md`.
- Contract changes require a version bump and explicit migration handling in the registry.
