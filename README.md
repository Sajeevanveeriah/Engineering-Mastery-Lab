# Engineering Workbench

Engineering Workbench v0.1.0 is a functional completion candidate that combines
the Engineering Mastery Lab learning application with a local desktop project
workflow. The shared React and TypeScript interface runs in the browser and in
a Tauri 2 desktop shell. Desktop-only features use a narrow Rust command
boundary for workspace files, ngspice, KiCad CLI and evidence capture.

This branch is not a production release. The current implementation and its
remaining release gates are recorded in
[docs/Release-Readiness-Report.md](docs/Release-Readiness-Report.md).

## What is included

### Learning application

- A redesigned responsive dashboard with progress, current sprint, priority
  skills, module status and portfolio evidence.
- A searchable skills matrix covering 15 domains and 3 levels per domain.
- Seven guided learning pathways.
- Eight engineering labs, each using the complete Learn, Simulate, Challenge,
  Diagnose, Build, Evidence, Reflect and Next cycle:
  - PID control
  - Electrical and electronics
  - Embedded systems
  - PLC and SCADA
  - Robotics
  - AI and ML
  - Mechanical dynamics
  - Professional engineering practice
- Responsive navigation, light and dark themes, keyboard-operated tabs,
  accessible chart descriptions and progress export, import and undo.
- Browser-local storage only. No account, backend or telemetry is required.

### Desktop project workbench

- Create and open portable workspace directories with a validated,
  versioned `workbench.json` manifest.
- Author project metadata, requirements, requirement links and typed simulation
  or validation configurations in the app.
- Create and edit bounded text inputs under `circuits/` and `requirements/`.
- Run registered built-in analyses, ngspice simulations and KiCad CLI checks.
- Inspect status, duration, quantities, plots, findings and generated files.
- Capture the exact adapter result and pre-run input SHA-256 hashes in
  `evidence/latest-run.json`.
- Generate a deterministic Markdown evidence report at
  `reports/evidence.md`. Reports distinguish linked requirements from verified
  outcomes and call out missing, failed or stale evidence.
- Diagnose external-tool availability and use safe static SPICE validation in
  the browser without executing a process.

ngspice and KiCad are not bundled. The workbench reports missing-tool states
without disabling the learning application.

## Desktop workspace authority

The desktop renderer cannot grant itself access to an arbitrary path. A
workspace root must first be selected through the Rust-controlled native folder
picker. The canonical root is authorised for the current desktop session, and
all workspace file commands and tool runs require an exact match to that
authority.

Recent-project entries are convenience identifiers stored in browser storage.
After a restart, opening a recent project requires re-selecting its folder in
the native picker. The selected canonical root must match the saved recent
location before any project file is read.

## Workspace layout

```text
<project>/
  workbench.json
  requirements/
  circuits/
  pcb/
  simulations/
  results/
  evidence/
    latest-run.json
  reports/
```

An example is available at
[`examples/rc-filter-workspace`](examples/rc-filter-workspace).

## Security boundary

- External programs are launched with argument vectors, never shell strings.
- Rust allow-lists tool identities, operations, input types and output zones.
- ngspice receives only generated batch decks that pass a Rust-side grammar
  check immediately before spawn.
- Paths are workspace-relative, lexically checked and canonicalised with
  symlink and junction containment checks.
- File replacement uses a flushed unique sibling temporary file and atomic
  same-directory replacement. There is no delete-the-old-file fallback.
- Process timeouts, cancellation and 2 MiB output caps are enforced.
- The desktop capability manifest does not grant external open or reveal
  access.

See [SECURITY.md](SECURITY.md) and
[ADR-0004](docs/adr/ADR-0004-External-Process-Security.md) for the threat model
and residual risks.

## Setup

Node.js 20 or newer is required. Node.js 22 is recommended.

```bash
npm install
npm run dev
```

## Quality commands

```bash
npm run lint
npm test
npm run build
```

Desktop development also needs the stable Rust toolchain and the platform
webview dependencies described in
[docs/Development-Setup.md](docs/Development-Setup.md).

```bash
npm run tauri dev
npm run build:desktop
```

Run Rust checks from `src-tauri/`:

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

The latest recorded checks are evidence, not a promise that a changed working
tree remains green. Consult the release-readiness report before publishing.

## Web and desktop behaviour

| Capability | Web build | Tauri desktop |
|---|---|---|
| Learning labs and progress | Available | Available |
| Static SPICE validation | Available | Available |
| Local workspace files | Explanatory fallback | Native picker authority required |
| External ngspice or KiCad execution | Not available | Available when installed and detected |
| Workspace run receipts and reports | Not available | Available |

The GitHub Pages workflow in `.github/workflows/deploy.yml` builds the shared
web application. `HashRouter` keeps deep links compatible with static hosting.

## Documentation

- [Architecture](docs/Architecture.md)
- [Installation](docs/Installation.md)
- [Development setup](docs/Development-Setup.md)
- [Adapter authoring guide](docs/Adapter-Authoring-Guide.md)
- [Known limitations](docs/Known-Limitations.md)
- [Release checklist](docs/Release-Checklist.md)
- [Release-readiness report](docs/Release-Readiness-Report.md)
- [Completion receipt](docs/20260711-Engineering-Workbench-Completion-Receipt-Rev00.md)
- [Architecture decision records](docs/adr)

## Licence and engineering use

This project is licensed under the [MIT License](LICENSE). You may use, copy,
modify and distribute the software subject to the licence terms and preservation
of the copyright and licence notice.

The learning simulations are simplified educational models using synthetic or
user-supplied data. They do not demonstrate compliance with an engineering
standard and do not replace professional engineering judgement, verified
calculations, vendor instructions or safety procedures.
