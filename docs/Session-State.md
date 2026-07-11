# Session state: Engineering Workbench v0.1.0

Branch: `saj/complete-engineering-workbench`

Tracked baseline: `ba8b722`

Last updated: 2026-07-11

Status: **Functional completion candidate with open release gates**

## Current source of truth

Use the current working tree first, then this session state, the dated
completion receipt and the release-readiness report. Earlier milestone counts
and prior package artefacts describe the baseline branch and must not be used
as proof for the current completion source.

## Completed workstreams

| Workstream | Current result |
|---|---|
| Product shell | Responsive sidebar, mobile drawer, route focus, theme, error and not-found states |
| Learning experience | Dashboard command centre, searchable skills, tracked pathways and full eight-stage lab modules |
| Controls and plots | Keyboard tabs, persistent panel state, precise number entry, accessible plots and tables |
| Progress | Versioned local persistence, import validation, backup and in-session import undo |
| Desktop workbench | Create, open, save and close projects; author requirements, links, configurations and bounded text inputs |
| Run evidence | Pre-run input hashes, exact latest receipt, strict receipt validation and deterministic Markdown report |
| Workspace authority | Rust native picker, canonical session root allow-list and authority required by every workspace file command or tool run |
| Process security | No shell, typed allow-list, path zones, ngspice deck grammar, timeouts, cancellation and bounded output |
| File safety | Canonical containment and atomic same-directory replacement without delete-first fallback |
| Integration coverage | Workspace, configuration, run, receipt, report, failure replacement and corrupt-receipt paths |
| Documentation | README, changelog, security, architecture, limitations, ADRs, release gates and completion receipt refreshed |

## Recorded checks

The workspace-authority checkpoint recorded:

- `npm run lint`: passed.
- `npm test`: 18 files and 152 tests passed.
- `npm run build`: passed with 81 modules, CSS 45.98 kB and JS 427.49 kB.
- Windows-targeted Tauri frontend build: passed.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `cargo test`: 39 passed.
- Tauri capability generation: passed.
- npm dependency audit: 0 vulnerabilities.
- Final responsive audit: all 90 route and width cases passed with maximum
  document overflow 0.
- `npm run build:desktop`: passed and produced a non-empty release application,
  MSI and NSIS bundle with recorded hashes.
- `git diff --check`: passed after documentation reconciliation, with
  line-ending conversion warnings only.

Compliant Windows deliverables:

- `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-MSI-Rev00.msi`,
  3,256,320 bytes, SHA-256
  `61a51da386d27d704f19c1c7f7127ab1b6412abcb3a7cdfec5b044f7e1bdfc39`.
- `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-Setup-Rev00.exe`,
  2,217,646 bytes, SHA-256
  `be5d27d0250fb6c3007be208468785336a286c44c8a72e9274be74b507ced468`.

These bundles were built and hashed, not installed, signed or interactively
smoke-tested.

## Recent-project flow

`src/pages/WorkbenchPage.tsx` was then changed so a recent-project action:

1. opens the native folder picker,
2. obtains new session authority from Rust,
3. compares the selected canonical identifier with the saved recent root, and
4. opens the project only when the identifiers match.

A different folder is rejected and cancellation reads no files. Lint, the full
TypeScript test suite, the web production build and the Windows-targeted Tauri
frontend build passed after this change.

## Open release gates

1. Install and interactively smoke-test the fresh Windows MSI and NSIS paths.
2. Run real ngspice and KiCad end-to-end cases.
3. Obtain actual macOS and Linux package and runtime results.
4. Complete automated, zoom and assistive-technology accessibility review.
5. Choose a licence before public redistribution.
6. Decide the acceptable treatment for process descendants, executable
   provenance and the narrow generated-deck race.

## Working-tree and rollback note

The completion work is not represented by the tracked baseline commit. It
includes modified and untracked files. Preserve it with a reviewed commit or
backup before any reset, clean or branch switch intended to discard changes.
The non-destructive comparison point is commit `ba8b722` on
`feature/engineering-workbench-v0.1`.
