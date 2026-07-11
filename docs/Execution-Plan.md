# Engineering Workbench v0.1.0 — Execution Plan

Status: living document. Updated as milestones complete. See `Session-State.md` for the current position.

## Mission

Convert `engineering-mastery-lab` (React + TypeScript + Vite learning labs) into a bounded,
production-quality cross-platform desktop application, **Engineering Workbench v0.1.0**, while
preserving the existing web application and GitHub Pages deployment.

## Environment facts (verified 2026-07-11 on the Windows 11 dev host)

| Item | State | Evidence |
|---|---|---|
| Node / npm | v24.18.0 / 11.16.0 | `node --version` |
| Baseline JS tests | 55/55 pass | `npm test` |
| Baseline web build | green (dist ~276 kB js) | `npm run build` |
| Rust toolchain | absent at start; install attempted via winget | `where.exe cargo` empty |
| MSVC (cl.exe) | absent (VS 2022 dir empty) | directory listing |
| ngspice | not installed | `where.exe`, no `C:\Spice64` |
| kicad-cli | not installed | `where.exe`, no `C:\Program Files\KiCad` |

Consequence: ngspice and KiCad adapters are developed and verified through fixtures on this host.
Real-tool integration is marked unverified-on-host. The local Tauri build depends on the Rust +
MSVC install succeeding; if elevation blocks it, this is recorded as an external blocker and the
CI workflow remains the packaging verification path.

## Milestones and dependency order

Each milestone ends with green gates (`npm test`, `npm run lint`, `npm run build`, plus Rust
gates once `src-tauri` exists) and a commit — the commit is the rollback point.

| # | Milestone | Depends on | Acceptance criteria |
|---|---|---|---|
| M1 | Plan, session state, ADRs | — | Documents exist and match the actual codebase |
| M2 | Adapter contract + capability registry (pure TS) | M1 | Versioned contract; built-in TS sim engines registered; unit tests green |
| M3 | Workspace core (manifest, validation, ops) | M2 | Round-trip, invalid-manifest, unknown-version, path-safety tests green; example workspace under `examples/` |
| M4 | ngspice adapter (fixture-based) | M2, M3 | Netlist gen for op/dc/ac/tran; output parsing; CSV export; timeout/cancel/malformed tests; 3 documented example circuits |
| M5 | KiCad CLI adapter (fixture-based) | M2, M3 | Version detection, ERC/DRC parsing, export inventories, missing-tool handling, fixture tests |
| M6 | Evidence report generator | M3–M5 | Deterministic Markdown; identical input ⇒ identical output test |
| M7 | Tauri 2 shell + typed command boundary (Rust) | M2 | `cargo test`/`clippy`/`fmt` green; path-boundary and injection tests; web build unchanged |
| M8 | UI: Workbench + Diagnostics pages | M4–M7 | App usable with tools missing; existing routes untouched; keyboard/theme checks |
| M9 | CI workflows + packaging | M7 | Workflows syntactically valid; three-OS matrix; artefacts + checksums |
| M10 | Documentation suite | M1–M9 | README, architecture, guides, security policy, licence inventory, changelog |
| M11 | Quality gates + fresh verifier agents + release report | all | All local gates green; critical/high findings resolved |

## Explicitly out of scope (deferred beyond v0.1)

CAD kernel, graphical schematic/PCB editors, FEM/CFD/multibody, cloud auth/sync, AI-generated
designs, mobile, auto-update, bundling ngspice/KiCad, code signing, cosmetic redesign,
non-essential refactoring.

## Architecture summary

- **Frontend stays the single UI** (React 18, Vite 6, TypeScript strict). Web build and GitHub
  Pages base path preserved; desktop build switches `base` to `./` via `TAURI_BUILD=1`.
- **Platform bridge** (`src/lib/platform/`): a small typed interface (`PlatformBridge`) with a
  Tauri implementation and an in-memory implementation for the browser and for tests. All
  desktop-only functions live behind it; the web app degrades gracefully.
- **Adapters** (`src/lib/adapters/`): a versioned `AdapterContract` (contract v1). Built-in TS
  simulation engines and external-tool adapters (ngspice, kicad-cli) register in the same
  capability registry. Pure logic (netlist generation, output parsing) has no React or Tauri
  imports and is tested with fixtures.
- **Workspace** (`src/lib/workspace/`): portable project directory with `workbench.json`
  manifest (schemaVersion 1), relative paths only, atomic writes via the bridge.
- **Rust side** (`src-tauri/`): a narrow set of typed commands — tool detection, allow-listed
  external process execution with timeout and output caps, workspace-scoped file IO with
  canonicalised path checks, SHA-256 hashing, dialogs, and explicit "open in default app".
  No shell string concatenation anywhere; processes are spawned with argument vectors.

## Rollback strategy

- One commit per milestone on `feature/engineering-workbench-v0.1`; `main` untouched.
- Additive changes only to existing files (routes, config); existing labs and tests unmodified
  except where a change is required and covered by the existing suite.
- `git revert <milestone commit>` restores the previous green state.
