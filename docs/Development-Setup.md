# Development setup

## Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Node.js | 20+ (22 recommended) | Frontend build and tests |
| Rust (stable) | 1.77+ | Desktop shell (`src-tauri`) |
| MSVC Build Tools + Windows SDK | VS 2022 | Windows linking |
| Xcode command-line tools | current | macOS linking |
| webkit2gtk 4.1 dev packages | current | Linux webview |

Windows: `winget install Rustlang.Rustup` and
`winget install Microsoft.VisualStudio.2022.BuildTools` (select the
*Desktop development with C++* workload).

Linux (Debian/Ubuntu):
`sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential`.

ngspice and KiCad are **not** required for development — every adapter is
tested through fixtures and the in-memory bridge.

## Commands

```bash
npm ci                  # install locked dependencies
npm run dev             # web dev server (http://localhost:5173)
npm test                # vitest suite (engines, adapters, workspace, report)
npm run lint            # strict TypeScript type-check
npm run build           # production web build (GitHub Pages base path)
npm run tauri dev       # desktop app with hot reload
npm run build:desktop   # unsigned desktop installers

cd src-tauri
cargo fmt --check       # Rust formatting
cargo clippy --all-targets -- -D warnings
cargo test              # path/injection/timeout/cancellation/fs tests
```

## Layout

```
src/lib/simulations/   Pure TS engines (no React, no Tauri)
src/lib/adapters/      Adapter contract, registry, builtin/ngspice/kicad
src/lib/platform/      PlatformBridge: Tauri impl + in-memory test impl
src/lib/workspace/     Manifest schema + project operations
src/lib/report/        Deterministic evidence report
src/pages/             UI (labs + WorkbenchPage + DiagnosticsPage)
src/tests/             Vitest suites and tool-output fixtures
src-tauri/src/         Rust: paths, process limits, tool allow-list, fs, IPC
examples/              Committed example workspace (also test input)
docs/adr/              Architecture decision records
```

Conventions: pure logic stays React- and Tauri-free; every desktop capability
goes through `PlatformBridge`; external-tool behaviour must be reproducible in
tests via `MemoryBridge` fixtures (see the adapter guide).
