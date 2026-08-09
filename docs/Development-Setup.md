# Development setup

## Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Node.js | 22.22+ | Frontend build and tests |
| Rust (stable) | 1.77+ | Desktop shell (`src-tauri`) |
| MSVC Build Tools + Windows SDK | VS 2022 | Windows linking |
| Xcode command-line tools | current | macOS linking |
| webkit2gtk 4.1 dev packages | current | Linux webview |

Windows: `winget install Rustlang.Rustup` and
`winget install Microsoft.VisualStudio.2022.BuildTools` (select the
*Desktop development with C++* workload).

Linux (Debian/Ubuntu):
`sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential`.

ngspice and KiCad are **not** required for development; every adapter is
tested through fixtures and the in-memory bridge.

## Commands

```bash
npm ci                  # install locked dependencies
npm run dev             # web dev server (http://localhost:5173)
npm test                # vitest suite (engines, adapters, workspace, report)
npm run lint            # ESLint source and test checks
npm run typecheck       # strict TypeScript validation
npm run build           # production web build (GitHub Pages base path)
npx playwright install chromium # install the compatible browser once
npm run test:e2e        # Playwright routes, a11y, keyboard and visual checks
npm run test:visual-review # capture required states for human pixel inspection
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm run tauri dev       # desktop app with hot reload
npm run build:desktop   # unsigned desktop installers

cd src-tauri
cargo fmt --check       # Rust formatting
cargo clippy --all-targets --all-features -- -D warnings
cargo test              # path/injection/timeout/cancellation/fs tests
```

## Layout

```
src/lib/simulations/   Pure TS engines (no React, no Tauri)
src/lib/engineering/   Pure calculators and unit conversion
src/lib/cad/           CAD schema, validation, metrics, geometry, exports
src/lib/eda/           EDA schema, commands, connectivity, PCB checks, interchange
src/lib/adapters/      Adapter contract, registry, builtin/ngspice/kicad
src/lib/platform/      PlatformBridge: Tauri impl + in-memory test impl
src/lib/workspace/     Manifest schema + project operations
src/lib/report/        Deterministic evidence report
src/pages/             UI (Toolbox + CAD + labs + Workbench + Diagnostics)
src/tests/             Vitest suites and tool-output fixtures
e2e/                   Playwright route, keyboard, a11y and visual tests
src-tauri/src/         Rust: paths, process limits, tool allow-list, fs, IPC
examples/              Committed example workspace (also test input)
docs/adr/              Architecture decision records
```

## Engineering Design Studio development boundaries

- Do not import `replicad`, `replicad-opencascadejs`, Three.js or EDA editor
  modules from the router shell or Academy. CAD and EDA must stay route-local.
- Production exact modelling imports only
  `replicad-opencascadejs/src/replicad_single.wasm?url` from
  `src/lib/cad/brep.worker.ts`. A second OCCT payload is a release failure.
- Run OCCT only in the dedicated worker. Kernel objects do not cross the
  message boundary; transfer typed tessellation buffers.
- Treat the Academy service-worker manifest as Academy-only. Do not add CAD,
  EDA or OCCT assets without a separate product and size decision.
- Use the native EML documents as persistence authority. STL/3MF are mesh
  references, STEP is an immutable exact base and KiCad is a subset exchange.
- External KiCad or ngspice execution must use `PlatformBridge` and the typed
  Rust request enum. Fixture tests do not authorise or prove a real run.

For focused checks, run the CAD document, mesh and B-rep suites and the EDA
document, command, connectivity, PCB and interchange suites before the full
commands above. The final release gate also scans the built output for one
OCCT WASM, audits licences and secrets, exercises browser and packaged desktop
modes, and inspects the actual visual fixtures. Do not record those gates as
passed until the final tree has produced current-session evidence.

Conventions: pure logic stays React- and Tauri-free; every desktop capability
goes through `PlatformBridge`; external-tool behaviour must be reproducible in
tests via `MemoryBridge` fixtures (see the adapter guide).
