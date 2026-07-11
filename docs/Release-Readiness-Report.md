# Release-readiness report: Engineering Workbench v0.1.0

Branch: `saj/complete-engineering-workbench`

Assessment date: 2026-07-11

Status: **Functional completion candidate, not a production release**

## Decision

The current branch materially completes the requested application workflow and
visual standard represented by the repository, its existing v0.1 workbench
scope and the current completion task. It provides a coherent learning
application, desktop project authoring, controlled engineering-tool execution,
strict run receipts and evidence reporting.

Production release is not approved. Current evidence includes a fresh Windows
release application plus MSI and NSIS bundles, but those installers were not
installed, signed or interactively smoke-tested. It does not include real
ngspice or KiCad execution, macOS or Linux runtime results, a formal
accessibility assessment or a public licence.

No repository source found in this task can prove functions that were requested
outside the current chat, current files and the public v0.1 workbench history.
This report therefore evaluates the observable implementation rather than
claiming undocumented requirements were satisfied.

## Implemented completion scope

### Product and visual experience

- Responsive desktop sidebar and mobile drawer with grouped navigation.
- Redesigned light and dark theme, page hierarchy, cards, tables, forms,
  statuses, empty states and consistent iconography.
- Dashboard command centre with sprint, priorities, module progress, portfolio
  state and reversible progress import.
- Eight labs, each retaining the complete eight-step learning cycle.
- Searchable 15-domain by 3-level skills matrix and seven learning pathways.
- Accessible tab relationships and keyboard behaviour, persistent hidden-panel
  state, improved plots and precise slider input.

### Workbench workflow

- Native-authorised project creation and opening.
- Project metadata, requirement, traceability and typed configuration editing.
- Bounded circuit and requirement text-file editing.
- Save and close flows with dirty-state and active-run guards.
- Built-in, ngspice and KiCad adapter execution with result inspection.
- Input hashes captured before execution and exact latest-result persistence.
- Deterministic reports that distinguish configuration links from actual run
  evidence and identify missing, failed or mismatched evidence.
- Recent projects that require native folder re-selection and exact saved-root
  comparison after restart.

### Rust trust boundary

- Session-scoped canonical workspace authority established only by the native
  picker and required by all file and run commands.
- Canonical path containment, including existing symlink and junction targets.
- Atomic same-directory replacement without deleting the destination first.
- No-shell process execution with timeouts, cancellation, bounded output and a
  bounded post-process reader drain.
- Tool-specific executable checks, KiCad 10 discovery and confined workspace
  input and output zones.
- Rust-side ngspice generated-deck validation immediately before spawn.

## Recorded verification

These checks ran after the workspace-authority, security and recent-project
reauthorisation changes.

| Check | Observed result |
|---|---|
| TypeScript strict check | `npm run lint` passed |
| TypeScript tests | 18 files, 152 tests passed |
| Web production build | Passed, 81 modules, CSS 45.98 kB, JS 427.49 kB |
| Windows-targeted Tauri frontend build | Passed |
| Rust formatting | `cargo fmt --check` passed |
| Rust lint | Clippy passed for all targets and features with warnings denied |
| Rust tests | 39 passed |
| Tauri capabilities | Generation and capability checks passed |
| Dependency audit | 0 vulnerabilities |
| Responsive route audit | 90 of 90 route and width cases passed with maximum overflow 0 |
| Windows desktop build | Release application, MSI and NSIS produced successfully |
| Diff hygiene | `git diff --check` passed after documentation reconciliation; line-ending warnings only |

The Windows artefacts were verified as non-empty and hashed. They were not
installed, signed or launched through an interactive packaged-runtime smoke
test.

### Windows package evidence

| Artefact | Size | SHA-256 |
|---|---:|---|
| `src-tauri/target/release/engineering-workbench.exe` | 9,499,648 bytes | Not recorded |
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-MSI-Rev00.msi` | 3,256,320 bytes | `61a51da386d27d704f19c1c7f7127ab1b6412abcb3a7cdfec5b044f7e1bdfc39` |
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-Setup-Rev00.exe` | 2,217,646 bytes | `be5d27d0250fb6c3007be208468785336a286c44c8a72e9274be74b507ced468` |

The named MSI and NSIS deliverables are copies of the verified source bundles
and retain the same hashes. `certutil -hashfile` independently reproduced the
hashes for the source bundles and compliant deliverable copies.

## Visual and interaction evidence

- The redesigned dashboard was rendered and inspected at desktop and mobile
  sizes.
- The mobile drawer was observed opening, closing with Escape and restoring
  focus to its trigger.
- Module state was observed surviving navigation between simulator and
  challenge panels.
- Arrow-key tab selection was observed.
- Contrast calculations recorded no failures for the checked semantic text and
  chart tokens.
- A 15-route by 6-width responsive audit passed all 90 cases at 320, 390, 480,
  768, 1024 and 1280 CSS pixels with maximum document overflow 0.

This is strong manual and scripted browser evidence, not a formal accessibility
or Tauri-webview certification.

## Residual risk matrix

| Risk | Evidence state | Release action |
|---|---|---|
| Real ngspice and KiCad execution | Fixtures only | Run representative cases on installed tools |
| Current Windows package | Fresh application, MSI and NSIS built and hashed | Install and interactively smoke-test both installer paths |
| macOS and Linux | No actual runner or runtime result | Run and inspect packages on both platforms |
| Process descendants | Direct child only | Add platform process-tree containment or document acceptance |
| Executable provenance | Name and banner checks only | Define trusted installation or signature policy |
| Deck validation-to-use race | Narrow residual race | Consider immutable file handle or controlled copy strategy |
| Accessibility | Responsive and browser interaction checks only | Run axe, assistive-technology and zoom review |
| Public redistribution | No licence | Choose licence and refresh notices |
| Evidence history | One latest receipt | Add append-only history only if required by product scope |

## Release decision gates

The candidate is ready for continued desktop validation and packaging. It is
not ready for a production or public release until the mandatory items in
[Release-Checklist.md](Release-Checklist.md) are completed and recorded against
the exact release commit.

## Rollback

The completion work is isolated on `saj/complete-engineering-workbench` and is
currently represented by working-tree changes over commit `ba8b722`. Before
discarding or switching away, create a reviewed commit or backup. To return to
the prior tracked baseline after preserving any needed work, restore from
commit `ba8b722` or switch to `feature/engineering-workbench-v0.1`. Do not use
destructive reset or clean commands until untracked completion files have been
backed up or committed.
