# ADR-0005: Web/desktop code sharing via a platform bridge

Date: 2026-07-11 · Status: Accepted

## Context

The same React codebase must serve the GitHub Pages web app (no filesystem, no processes) and
the Tauri desktop app (full workbench). Sprinkling `window.__TAURI__` checks through pages
would rot quickly and make the pure logic untestable.

## Decision

- A single `PlatformBridge` interface (`src/lib/platform/bridge.ts`) declares every desktop
  capability the app uses: tool detection, process execution, workspace file IO, hashing,
  dialogs, opening paths.
- `detectPlatform()` returns a `TauriBridge` when running inside Tauri, otherwise `null`; UI
  features that need the bridge render an informative "desktop only" state instead of failing.
- Tests use `MemoryBridge`, an in-memory implementation with scriptable tool behaviour, which
  is also how ngspice/KiCad adapters are verified on machines without the real tools.
- Pure logic (simulation maths, netlist generation, parsers, manifest validation, report
  generation) imports neither React nor the bridge — it takes plain data in and out.
- Vite `base` stays `/engineering-mastery-lab/` for web; the Tauri build sets `TAURI_BUILD=1`
  which switches it to `./`. `HashRouter` keeps routing identical in both.

## Consequences

- The web bundle gains only the small bridge-detection module; `@tauri-apps/api` is imported
  dynamically so the Pages build carries no dead desktop weight.
- Every desktop feature is testable headlessly through `MemoryBridge`.
- One UI codebase, two build targets, no forked pages.
