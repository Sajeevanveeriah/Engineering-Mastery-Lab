# Known limitations — Engineering Workbench v0.1.0

## Verification status

- **Windows x64 is the only platform verified by an actual build** (local
  MSI/NSIS build on the dev host, 2026-07-11). macOS and Linux CI workflows
  are present and syntactically valid but had not produced a verified runner
  result at the time of writing — run the `Desktop packages` workflow to
  verify them.
- ngspice and KiCad integration is **fixture-verified** (captured/representative
  tool output driven through `MemoryBridge`). Real-tool end-to-end runs were
  not executed on the development host because neither tool is installed
  there. First run against real installations should follow the release
  checklist's functional verification.
- The desktop UI is the same React code verified in the browser; a visual
  pass inside the Tauri webview itself has not been recorded.

## Functional boundaries

- No schematic or PCB editor: the workbench validates and simulates files you
  author in KiCad/text editors. "Open in KiCad" hands off to the OS.
- ngspice runs are batch-mode only; interactive/plot commands are not
  supported, and `.control` blocks in user netlists are rejected by design.
- AC results are recorded as magnitude and phase columns (no complex raw
  vectors); operating-point results come from `print all` parsing.
- KiCad BOM export needs KiCad 8+, ERC JSON 8+, board render 9+; with older
  versions those capabilities fail with an explanatory message.
- Manifest `schemaVersion` 1 only; newer versions are rejected (no migration
  yet), and there is no schematic capture of requirement pass/fail criteria —
  the evidence report records results, not verdicts.
- Workspace writes are atomic-with-fallback: on Windows, replacing an existing
  file has a brief non-atomic window (ADR-0003).
- Symlinks inside a workspace are not rejected; do not open untrusted
  workspaces (see SECURITY.md).
- Evidence reports are Markdown only (no HTML render in v0.1).
- Cancellation kills the external process but does not roll back partial
  output files; re-running overwrites them deterministically.
- The recent-projects list and tool-path overrides live in browser storage
  (per machine, per profile), not in the workspace.

## Out of scope for v0.1 (by design)

CAD geometry kernel, graphical editors, FEM/CFD/multibody solvers, cloud
auth/sync, AI-generated designs, mobile, auto-update, bundled ngspice/KiCad,
code signing/notarisation.
