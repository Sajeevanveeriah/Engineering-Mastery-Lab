# Contributing

## Ground rules

- Keep pure logic (simulation maths, parsers, netlist/report generation) free
  of React and Tauri imports.
- Every desktop capability goes through `PlatformBridge`; external-tool
  behaviour must be testable with `MemoryBridge` fixtures.
- New external tools require a Rust allow-list entry and injection tests —
  see [docs/Adapter-Authoring-Guide.md](docs/Adapter-Authoring-Guide.md).
- Do not remove or weaken path validation, timeouts or output caps.

## Before opening a PR

```bash
npm run lint && npm test && npm run build
cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

All of these run in CI (`.github/workflows/ci.yml`) and must be green.

## Style

- TypeScript strict; no `any` unless unavoidable and justified.
- Small, reviewable commits with imperative messages
  (`feat: …`, `fix: …`, `docs: …`, `ci: …`).
- UK spelling in documentation and UI copy.
- Tests first for new deterministic behaviour; fixtures for tool output.

## Scope guard (v0.1)

Out of scope: CAD kernels, graphical schematic/PCB editors, FEM/CFD solvers,
cloud sync, AI-generated designs, bundling third-party tools, auto-update and
code signing. Open an issue before starting work in these areas.
