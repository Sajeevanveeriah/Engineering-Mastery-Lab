# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Target version: 0.2.0.

The verification record below is the v0.1.0 completion baseline. The v0.2.0
release checks must be refreshed after the Toolbox and CAD changes are merged.

### Added

- An Engineering Toolbox with twelve input-validated preliminary-design
  calculators, searchable discipline filters, visible assumptions and JSON
  calculation-record export.
- A multi-category unit converter and a searchable reference table containing
  indicative mechanical and thermal properties for common engineering
  materials.
- A bounded parametric CAD Studio for mounting plates, circular flanges,
  spacers or bushings, and angle brackets, with interactive 3D inspection,
  standard views, a dimensioned drawing view and geometry validation.
- CAD area, volume, mass and bounding-envelope calculations with selectable
  reference materials and density.
- Binary STL, OpenSCAD, SVG drawing and versioned design JSON export, plus
  browser-profile draft storage and validated design JSON import.
- A complete Labs index, not-found route and application-level error boundary.
- A redesigned dashboard, responsive application shell, mobile navigation and
  consistent page headers, icons, empty states, status messages and controls.
- Search and filter controls for the 15-domain skills matrix and tracked views
  for seven learning pathways.
- Keyboard-operated module tabs, persistent simulator state, challenge notes,
  reflection status and clearer evidence actions across all eight labs.
- Desktop project creation and opening, project metadata editing, requirement
  authoring, traceability links and typed run-configuration authoring.
- Bounded text-file creation and editing for circuit and requirement inputs.
- Strict latest-run receipts at `evidence/latest-run.json`, including the exact
  adapter result, capture time and pre-run input hashes.
- Evidence reporting that separates links from verification and identifies
  absent, failed, mismatched and incomplete run evidence.
- A Rust-controlled native workspace picker with session-scoped canonical root
  authority for every workspace file and tool command.
- Recent-project reauthorisation through native folder re-selection and exact
  saved-root comparison before file access.
- Integration coverage for workspace creation, configuration, execution,
  receipt persistence, report generation, failed reruns and corrupt receipts.

### Changed

- Reframed the dashboard and navigation as an engineering command centre with
  direct access to the Toolbox, CAD Studio and Project Workbench.
- Extended the architecture, platform-parity and known-limitations
  documentation for the Toolbox and bounded CAD layer.
- Reworked visual styling into a responsive semantic light and dark theme with
  accessible contrast, reduced-motion handling and forced-colour support.
- Upgraded plots with descriptions, data tables, non-finite value handling and
  distinguishable line, scatter and dashed series.
- Added precise numeric entry alongside sliders.
- Made progress import reversible within the current session.
- Hardened atomic workspace writes with unique sibling temporary files,
  flushing, synchronisation and same-directory replacement without deleting
  the previous file first.
- Tightened tool detection to supported executable names, successful exit and
  tool-specific version output. KiCad discovery includes version 10 paths.
- Confined ngspice inputs to generated decks and KiCad inputs and outputs to
  declared workspace zones.

### Security

- Added Rust-side ngspice generated-deck grammar validation immediately before
  process spawn, including rejection of user control blocks, shell or process
  escape commands and transitive include or library directives.
- Added session-authorised workspace roots so renderer-provided absolute paths
  cannot independently establish file or process authority.
- Preserved no-shell process execution, canonical path containment, output
  caps, timeouts and cancellation.
- Kept external open and reveal capability ungranted.

### Verification

- Recorded final `npm run lint`, 18 Vitest files with 152 passing tests, a
  production web build, a Windows-targeted Tauri frontend build,
  `cargo fmt --check`, Clippy with warnings denied and 39 passing Rust tests.
- Recorded Tauri capability generation, a zero-vulnerability dependency audit,
  a 90-case responsive route audit and a successful Windows release build.
- Produced non-empty Windows MSI and NSIS bundles with recorded SHA-256 hashes.
  Installation, signing and interactive packaged-runtime smoke testing remain
  open, along with the real-tool, cross-platform and public-release gates in
  the release-readiness report.
