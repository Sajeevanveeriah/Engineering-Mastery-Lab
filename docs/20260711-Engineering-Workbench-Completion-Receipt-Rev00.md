# Engineering Workbench completion receipt

Artefact: `20260711-Engineering-Workbench-Completion-Receipt-Rev00.md`

Prepared and reconciled: 2026-07-11 22:11:15 AEST (UTC+10)

Estimated location: Geelong, Victoria, Australia. This is the labelled fallback
location because no location tool was available in the documentation task.

Release classification: **Functional completion candidate, not a production
release**

Branch: `saj/complete-engineering-workbench`

Tracked comparison baseline: `ba8b722`

## 1. Task boundary

The completion task was to inspect the existing application, close observable
functional and visual gaps, harden the desktop trust boundary, verify the
result and reconcile the repository documentation.

The current request, current worktree and public v0.1 repository history were
treated as the available source of truth. No source available in this task can
prove undocumented requests made outside the current chat or repository. This
receipt therefore records implemented and observed scope without claiming that
unknown historical requirements were satisfied.

No cloud service, email, calendar, deployment or database data was modified.
No external message, deployment, publication, purchase or destructive action
was performed.

## 2. Sources checked

### Repository sources

- Current branch and working tree under
  `C:\Dev\Engineering-Mastery-Lab`.
- Public baseline change history:
  `https://github.com/sajeevanveeriah/engineering-mastery-lab/pull/1`.
- React routes, data, page and component implementation under `src/`.
- Workspace, adapter, report, receipt and platform code under `src/lib/`.
- Rust commands, authority, process, tool and filesystem code under
  `src-tauri/src/`.
- Tauri capability manifest under `src-tauri/capabilities/default.json`.
- Existing tests, fixtures, examples, ADRs and release documentation.

### Primary external references

- W3C ARIA tabs pattern:
  `https://www.w3.org/WAI/ARIA/apg/patterns/tabs/`.
- Tauri capability model:
  `https://v2.tauri.app/security/capabilities/`.
- Tauri security model:
  `https://v2.tauri.app/security/`.
- ngspice manual:
  `https://ngspice.sourceforge.io/docs/ngspice-manual.pdf`.
- KiCad CLI documentation:
  `https://docs.kicad.org/master/en/cli/cli.html`.

### Connector pass

Read-only connector checks were attempted for Google Drive, Gmail, Google
Calendar, GitHub, Vercel, Supabase, Notion, Outlook Calendar and Outlook Email.
The relevant connectors were blocked, unavailable or not useful for this local
repository task, and no connector supplied implementation evidence. No
connector was mutated. This receipt does not claim connector data access.

## 3. Delivered implementation

### Application experience

- Replaced the fragmented shell with a responsive desktop sidebar and mobile
  drawer, grouped navigation, route focus handling, a skip link, error boundary
  and not-found route.
- Added a Labs index and redesigned Dashboard, Skills and Pathways surfaces.
- Preserved all eight labs and their Learn, Simulate, Challenge, Diagnose,
  Build, Evidence, Reflect and Next sequence.
- Added keyboard tab behaviour, persistent simulator state, challenge notes,
  reflection status, precise numeric controls and accessible chart data.
- Added responsive, reduced-motion and forced-colour handling with semantic
  light and dark tokens.
- Added reversible progress import and clearer portfolio and sprint status.

### Desktop workbench

- Added project creation, open, save, close and recent-project workflows.
- Added authoring of metadata, requirements, traceability links, typed
  simulation configurations and bounded circuit or requirement text files.
- Added result inspection for status, timing, quantities, plots, diagnostics
  and generated output hashes.
- Added pre-run hashing of declared inputs.
- Added strict latest-run receipt schema v1 at
  `evidence/latest-run.json` with exact adapter results and bounded validation.
- Added deterministic `reports/evidence.md` generation that distinguishes
  linked configurations from actual evidence and identifies failed, missing or
  mismatched receipts.
- Added recent-project reauthorisation. A recent action now invokes the native
  picker, obtains fresh session authority and opens the project only when the
  selected root exactly matches the saved recent identifier.

### Rust security and reliability

- Added the Rust-controlled native folder picker and session-scoped canonical
  workspace authority required by all workspace file commands and tool runs.
- Hardened workspace path containment, including symlink and junction escape
  checks.
- Replaced delete-first write fallback with flushed, synchronised, unique
  sibling temporary files and atomic same-directory replacement.
- Added Rust-side ngspice generated-deck grammar validation immediately before
  spawn and supplied `-n -b` from Rust.
- Confined ngspice and KiCad inputs and outputs to declared workspace zones.
- Tightened executable detection to supported names, zero exit and
  tool-specific version output. Added KiCad 10 discovery.
- Bounded output-reader drain time and retained explicit truncation reporting.
- Kept external open and reveal ungranted.

## 4. Recorded verification

The following checks were recorded after the workspace-authority, security and
recent-project reauthorisation changes.

| Check | Observed result |
|---|---|
| `npm run lint` | Passed |
| `npm test` | 18 files, 152 tests passed |
| `npm run build` | Passed, 81 modules, CSS 45.98 kB, JS 427.49 kB |
| Windows-targeted Tauri frontend build | Passed |
| `cargo fmt --check` | Passed |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed |
| `cargo test` | 39 tests passed |
| Tauri capability generation | Passed |
| npm dependency audit | Passed, 0 vulnerabilities |
| Responsive route audit | 90 of 90 route and width cases passed; maximum document overflow 0 |
| `npm run build:desktop` | Passed; release application, MSI and NSIS produced |
| `git diff --check` | Passed after documentation reconciliation; line-ending conversion warnings only |

The TypeScript suite included workspace creation, requirement and simulation
configuration, save and reopen, adapter execution, input hashes, receipt
persistence, evidence terminology, failed-result replacement and corrupt
receipt rejection.

The Rust suite included path and authority rejection, allowed registered roots,
atomic write preservation and concurrency, tool-zone rules, generated-deck
grammar, executable detection, timeout, cancellation and output bounds.

## 5. Browser and visual evidence

- The final desktop dashboard render was opened and visually inspected:
  `C:\Users\sajee\.codex\visualizations\2026\07\11\019f508e-5735-7b62-b37d-1f116027e541\20260711-Engineering-Workbench-Final-Desktop-Rev00.jpg`.
- The final mobile dashboard render was opened and visually inspected:
  `C:\Users\sajee\.codex\visualizations\2026\07\11\019f508e-5735-7b62-b37d-1f116027e541\20260711-Engineering-Workbench-Final-Mobile-Rev00.jpg`.
- Browser interaction checks observed mobile Escape close and focus return,
  tab Arrow Right selection and simulator state persistence across panels.
- A contrast calculation recorded no failures for the checked semantic text,
  danger and chart token combinations.
- A 15-route by 6-width audit passed all 90 cases at 320, 390, 480, 768, 1024
  and 1280 CSS pixels with maximum document overflow 0.

Text alternative for both visual artefacts: a light-theme Engineering
Workbench dashboard with a dark navigation rail, prominent current-work card,
four progress metrics, weekly sprint, skill priorities, module progress and a
portfolio evidence section. The mobile artefact stacks the same content into a
single narrow column with a compact top navigation control.

## 6. Windows package artefacts

The Windows release build completed at 22:05 AEST and produced these verified
non-empty artefacts:

| Artefact | Size | SHA-256 |
|---|---:|---|
| `C:\Dev\Engineering-Mastery-Lab\src-tauri\target\release\engineering-workbench.exe` | 9,499,648 bytes | Not recorded in this receipt |
| `C:\Dev\Engineering-Mastery-Lab\src-tauri\target\release\bundle\deliverables\20260711-Engineering-Workbench-Windows-x64-MSI-Rev00.msi` | 3,256,320 bytes | `61a51da386d27d704f19c1c7f7127ab1b6412abcb3a7cdfec5b044f7e1bdfc39` |
| `C:\Dev\Engineering-Mastery-Lab\src-tauri\target\release\bundle\deliverables\20260711-Engineering-Workbench-Windows-x64-Setup-Rev00.exe` | 2,217,646 bytes | `be5d27d0250fb6c3007be208468785336a286c44c8a72e9274be74b507ced468` |

The MSI and NSIS deliverable copies match the hashes of their verified source
bundles. The release application and installers were built and inspected for
existence and size. `certutil -hashfile` independently reproduced both source
bundle hashes and both compliant deliverable hashes. The installers were not
installed, signed or interactively smoke-tested.

## 7. Checks still required

1. Install and interactively smoke-test the Windows MSI and NSIS paths,
   including native picker authority and recent-project mismatch rejection.
2. Run real ngspice and KiCad end-to-end cases.
3. Verify macOS and Linux packages and runtime behaviour.
4. Run automated axe, screen-reader and browser zoom accessibility checks.

## 8. Residual risks and unknowns

| Area | Residual state |
|---|---|
| ngspice and KiCad | Fixture-tested, but real-tool end-to-end execution is not verified |
| Windows package | Fresh MSI and NSIS bundles were built and hashed but not installed, signed or interactively smoke-tested |
| macOS and Linux | Runtime and packaging are not verified |
| Process descendants | Direct child cancellation exists; full process-tree containment does not |
| Executable origin | File name and product banner checks are not cryptographic attestation |
| Generated deck | A narrow validation-to-use rewrite race remains |
| Accessibility | Responsive browser and contrast evidence exists; axe, NVDA, zoom and equivalent formal checks do not |
| Evidence history | One latest receipt persists; there is no append-only run history or signature |
| External opening | No current UI action or capability grants open or reveal |
| Public release | No `LICENSE` file, signing, notarisation or all-platform package evidence |

## 9. Documentation artefacts

This completion reconciliation updated:

- `README.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `docs/Architecture.md`
- `docs/Known-Limitations.md`
- `docs/Release-Checklist.md`
- `docs/Release-Readiness-Report.md`
- `docs/Session-State.md`
- `docs/Execution-Plan.md`
- `docs/adr/ADR-0003-Workspace-Schema.md`
- `docs/adr/ADR-0004-External-Process-Security.md`
- `docs/20260711-Engineering-Workbench-Completion-Receipt-Rev00.md`

## 10. Rollback

The non-destructive comparison point is tracked commit `ba8b722` on
`feature/engineering-workbench-v0.1`. The completion work is currently on
`saj/complete-engineering-workbench` as modified and untracked working-tree
files.

Before a reset, clean or discard action:

1. inspect `git status` and the complete diff,
2. preserve all required modified and untracked files in a reviewed commit or
   backup,
3. verify the baseline commit, and
4. prefer reverting a completion commit once one exists.

No destructive rollback command was executed during this task.

## 11. Completion verdict

The observable application scope is materially complete as a functional
candidate, with a substantially improved visual system, complete in-app project
workflow, strict evidence semantics and a stronger desktop trust boundary.
Production-release completion is not claimed until the outstanding exact-tree,
packaged-runtime, real-tool, platform, accessibility and licence gates are
closed.
