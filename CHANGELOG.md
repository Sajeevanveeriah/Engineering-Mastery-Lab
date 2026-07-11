# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — Unreleased (branch `feature/engineering-workbench-v0.1`)

### Added
- Tauri 2 desktop shell with a typed IPC command boundary (tool detection,
  allow-listed process execution with timeouts/output caps/cancellation,
  workspace-scoped file IO, SHA-256 hashing).
- Adapter contract v1 and capability registry; all seven built-in TypeScript
  simulation engines registered alongside external tools.
- ngspice adapter: netlist validation, operating point, DC sweep, AC and
  transient analyses, parsed output, CSV export, fixture-based tests, three
  documented example circuits.
- KiCad CLI adapter: ERC, DRC, netlist/BOM/gerber/drill export and board
  render with version gating and structured findings.
- Portable project workspaces with a versioned `workbench.json` manifest,
  atomic writes, recent projects, and an example workspace under `examples/`.
- Toolchain diagnostics screen with executable overrides and remediation.
- Deterministic Markdown evidence report generator.
- Cross-platform CI: web + Rust quality gates and unsigned desktop packaging
  with artefact verification and SHA-256 checksums.
- Documentation suite: architecture ADRs, installation, development setup,
  adapter authoring, troubleshooting, security policy, licence inventory,
  release checklist, known limitations.

### Unchanged
- All existing learning labs, routes, challenges, progress storage and the
  GitHub Pages web deployment.
