# Release checklist

Use this checklist against the exact release working tree or commit. A result
from an earlier source state is supporting evidence only.

## Earlier Phase 0 and Phase 1 checkpoint

The following checks were run on 2026-07-28 against the uncommitted
`saj/complete-engineering-workbench` working tree that started at
`48aeec3c0c02d5b412de178f18ef65548167c27a`. They were recorded before the
later Phase 1.1 through Phase 5 foundation changes. They verify that earlier
checkpoint only. They do not verify the complete current working tree, promote
it to a release, verify a packaged desktop runtime, or replace the open checks
later in this document.

| Gate | Current result | Evidence scope |
|---|---|---|
| `npm run lint` | Passed with zero warnings | Complete current repository |
| `npm run typecheck` | Passed | Complete current TypeScript source |
| `npm test` | 28 files and 223 tests passed | Current unit and integrity suites |
| `npm run build` | Passed; 118 modules transformed | Current production web build |
| `npm run test:e2e` | 70 automated browser tests passed in Playwright Chromium | Production-build-backed route, interaction, responsive, accessibility, deterministic visual regression and recovery matrix |
| Axe automated accessibility checks | 11 states passed with no serious or critical findings | Ten representative routes plus new-user onboarding |
| `npm run test:visual-review` plus required human review | 18 states captured and inspected | Onboarding, Today empty and seeded, Learn, pathway, laboratory Learn and simulator, Build, project, Analyse, calculators, CAD happy and fallback paths, Prove empty and representative, mobile drawer, dark mode and reduced motion; capture success alone is not a visual pass |
| Visual regression snapshots | 4 deterministic snapshots passed | Today empty, dark Learn, viewport mobile drawer and CAD fallback |
| CAD WebGL recovery | 5 lifecycle and recovery tests passed | Preflight failure, constructor failure, retry, safe exit, non-blank live framebuffer, unmount and remount cleanup |
| Route-local lazy-load recovery | Passed | Tool failure remained inside the affected route |
| Responsive routes | 25 canonical routes passed at 320 CSS pixels; five primary-route widths also passed at 320, 390, 768, 1024 and 1440 CSS pixels | No tested document-level horizontal overflow |
| Browser zoom equivalent | Passed at 200 percent and 400 percent on four representative task routes | Effective CSS viewports model browser reflow |
| `cargo fmt --check` | Passed | Current Rust source |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed | Current Rust targets and features |
| `cargo test` | 49 tests passed | Current Rust command, path, process and workspace boundaries |
| `npm audit --omit=dev --audit-level=high` | Passed the required high-severity gate; two moderate React Router advisories remain | Production dependency tree; npm reports an available audit fix, but no production dependency update was authorised or applied |
| Full `npm audit --audit-level=high` | Failed: one high PostCSS development-tree finding and two moderate React Router findings remain | Development and production dependency tree; npm reports an available audit fix, but no dependency update was authorised or applied |

The final Chromium run used Chrome for Testing 151.0.7922.34. WebGL
framebuffer sampling found more than 16 distinct sampled colours and no WebGL
error before the rendered model was inspected. The visual-review capture
rasterises the live framebuffer because the standard headless screenshot path
does not composite the WebGL layer; the functional test reads the live
framebuffer independently.

## Current Phase 1.1 through Phase 5 checkpoint

The following checks were run on 2026-07-28 against the final application
source in the uncommitted `saj/complete-engineering-workbench` working tree at
unchanged HEAD `48aeec3c0c02d5b412de178f18ef65548167c27a`. Documentation and
browser-test-only corrections followed the application build; runtime source
was unchanged and packaged runtime content was not affected.

| Gate | Current result | Evidence scope |
|---|---|---|
| `npm run typecheck` | Passed | Complete TypeScript source |
| `npm run lint` | Passed with zero warnings | Complete repository |
| `npm test` | 41 files and 333 tests passed | Complete unit, migration, integrity, security and domain suites |
| `npm run build` | Passed; 155 modules transformed | Production web build with separate CAD, flagship, engineering-workspace and desktop-workbench chunks |
| `npm run test:e2e` | 118 of 118 tests passed | Installed Playwright Chromium, including every canonical route, retained legacy alias, progress-import undo and print-media containment |
| Axe automated accessibility checks | 18 of 18 states passed with no serious or critical findings | Representative routes and onboarding |
| Deterministic visual snapshots | 6 of 6 browser-specific snapshots passed | Today, Learn, mobile shell, CAD, motor sizing and flagship workflow |
| `npm run test:visual-review` plus human inspection | 37 of 37 captures passed and all 37 PNGs were inspected at original resolution | Phase 0/1 states, kernel states, all five flagship desktop and mobile states, Project Pack/report, Prove and hosted-unavailable states |
| `npm ls --depth=0` | Passed | Installed top-level dependency tree |
| `npm audit --omit=dev --audit-level=moderate` | Failed: 2 moderate vulnerable-package entries remain | Three advisory records: two open-redirect paths and one SSR-hydration path; no dependency change was authorised |
| Full `npm audit --audit-level=high` | Failed: 2 moderate and 5 high vulnerable-package entries remain | React Router production advisories plus one PostCSS development advisory propagated through the Vite toolchain |
| `cargo fmt --check` | Passed | Current Rust source |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed | All Rust targets and features |
| `cargo test` | 49 tests passed | Native command, path, process and workspace boundaries |
| `npm run build:desktop` | Passed | Fresh Windows release executable, MSI and NSIS built from the final application source |
| Packaged runtime launch | Passed | Fresh release executable exposed a responding window titled `Engineering Mastery Lab` and was then closed |
| `git diff --check` and U+2013/U+2014 scans | Passed | Final tracked and untracked source, tests and documentation |

Fresh Windows artefact evidence:

| Deliverable | Size | SHA-256 | Signature |
|---|---:|---|---|
| `src-tauri/target/release/engineering-workbench.exe` | 9,572,352 bytes | `ff62a5c8222b03566256085618f0388395b4f566e749d6a34e070b8a654c3fee` | Not signed |
| `src-tauri/target/release/bundle/msi/Engineering Mastery Lab_0.2.0_x64_en-US.msi` | 3,448,832 bytes | `9f5ef5d0f16f69ef4a1acf13a6c3049a1593b2f934ef63ddd7fe51a4d0d27b1b` | Not signed |
| `src-tauri/target/release/bundle/nsis/Engineering Mastery Lab_0.2.0_x64-setup.exe` | 2,430,719 bytes | `b806f00ae21f4f88491cbb42548895a3d9f788d8b35bf3d919975262a3eefcca` | Not signed |

The final browser matrix directly covered 35 canonical or not-found routes at
320 CSS pixels, all 15 retained legacy redirects, five primary destinations at
320, 390, 768, 1024 and 1440 CSS pixels, four representative 200 percent or
400 percent reflow cases, keyboard focus containment and restoration, reduced
motion, higher contrast and forced colours. The visual review separately
covered 37 desktop and mobile rendered states. Generated Playwright review
output was removed after inspection; the six intentional deterministic
baselines remain under `e2e/__snapshots__/`.

Still not run for the complete Phase 1.1 through Phase 5 working tree:

- Manual NVDA, JAWS or VoiceOver screen-reader verification.
- Firefox, WebKit, Safari or non-Chromium visual and interaction verification.
- MSI or NSIS installation, signing or clean-host installation.
- Real ngspice and KiCad execution.
- macOS and Linux builds or package jobs.
- Networked CI execution.

## Phase 1.1 through Phase 5 current-source gates

Record results here only after running each gate against the exact final
reviewed tree. Do not copy counts from the earlier checkpoint.

### Repository and retention

- [x] Reconfirm repository root, branch, HEAD, staged state, unstaged state and
      untracked files.
- [x] Compare the final tree with the preserved pre-task tracked and untracked
      manifests.
- [x] Confirm there was no stage, stash, commit, push, merge, rebase, tag,
      deployment, publication, external-service connection or permission
      expansion.
- [x] Run `git diff --check`.
- [x] Scan source and documentation for unauthorised U+2013 and U+2014
      characters.
- [x] Inspect generated outputs and remove only task-generated transient
      captures or reports. Preserve source-controlled fixtures and pre-existing
      user files.

### Shared kernel and migration

- [x] Run focused unit tests for units, variables, datasets, scenarios,
      notebook, evidence graph, bundle migration and motor sizing.
- [x] Verify progress version 1 to version 3 and version 2 to version 3
      migration twice with identical output.
- [x] Verify project bundle version 1 to version 2 migration, current bundle
      clean import, digest failure, unsafe keys, oversize input and future
      version rejection.
- [x] Verify unit dimensions, base conversions, physical minima, valid ranges,
      zero, negative, non-finite and boundary inputs.
- [x] Independently recompute the reference motor torque, speed, angular
      velocity and mechanical power values.
- [x] Verify baseline and alternate scenarios recalculate after clean import
      within the declared numeric tolerance.
- [x] Verify scenario duplicate, rename, protected baseline and confirmed
      unreferenced deletion.
- [x] Verify malformed CSV and JSON, duplicate headings, mixed types, null
      cells, unsafe keys and size limits.
- [x] Verify notebook sanitisation and typed-reference rules.
- [x] Verify evidence broken-reference and directed-cycle rejection.

### Flagship workflows

- [x] Verify controls, robotics and autonomy, embedded electronics and sensing,
      mechanical design and dynamics, and applied AI and ML flagship routes.
- [x] For each flagship, inspect prerequisites, outcomes, workflow sequence,
      equations, deterministic fixture, expected values, challenge, failure
      cases, rubric, limitations and Build or Prove links.
- [x] Recalculate each material fixture output through an independent test path
      where technically practical.
- [x] Verify completion and evidence records are learner-generated local data
      and are not presented as accreditation or certification.

### Project Pack and reports

- [x] Create, export and clean-import Project Pack version 1.
- [x] Verify kernel compatibility, licence, provenance, rubric weight,
      deterministic manifest path, media type, byte count and hash.
- [x] Verify traversal, absolute path, reserved device, executable extension,
      executable content, unsafe key, oversize, schema, manifest and integrity
      rejection.
- [x] Verify duplicate stable pack ids require an explicit integrity-hash
      selection.
- [x] Generate Markdown and JSON engineering reports twice from identical
      explicit inputs and compare complete bytes and hashes.
- [x] Inspect SI and display inputs, assumptions, tolerances, model versions,
      dataset provenance, results, validation, warnings, limits, lineage,
      environment and integrity.
- [x] Inspect every chart's accessible table alternative and print layout.

### Adapter ecosystem and native boundary

- [x] Verify adapter descriptor version, semantic version, namespaced
      capability ids, input and output schema versions, timeout range, output
      limit and cancellation state.
- [x] Verify ready, missing, disabled, unknown, cancelled-before-start,
      timeout, failed and malformed-output fixture states.
- [x] Confirm fixture evidence remains labelled
      `deterministic-fixture-only`.
- [x] Re-run TypeScript adapter, workspace, receipt and report tests.
- [x] Re-run Rust formatting, Clippy and complete Rust tests.
- [x] Confirm the current bridge and Tauri capability manifest expose only
      named commands and no arbitrary process, path, open or reveal authority.
- [x] Verify timeout and cancellation descendant containment in source tests.

### Provider-neutral Phase 5 foundations

- [x] Verify version-vector equal, dominance and concurrent relationships.
- [x] Verify duplicate operation idempotency and rejection of identifier reuse
      with different content.
- [x] Verify tombstone deletion, explicit restoration, stale input and
      fast-forward behaviour.
- [x] Verify keep-current, accept-incoming, latest-updated and merged-payload
      conflict strategies, including deletion conflicts.
- [x] Verify bounded sync export, operation receipts and deterministic recovery.
- [x] Verify opaque identifier, payload, depth, collection and unsafe-key
      limits.
- [x] Verify synthetic cohort roles, assignments, completion and evidence
      review constraints.
- [x] Verify aggregates release at the configured minimum learner group size
      and suppress participant and outcome counts below it.
- [x] Verify hosted identity, synchronisation, billing, collaboration, cohorts
      and educator analytics remain unavailable and no provider makes a network
      request.

### Complete application verification

- [x] Run `npm run lint`.
- [x] Run `npm run typecheck`.
- [x] Run the complete `npm test`.
- [x] Run `npm run build`.
- [x] Run `npm run test:e2e` with the authorised installed browser runtime.
- [x] Run `npm run test:visual-review`, inspect every required screenshot
      manually and rerun affected states after any repair.
- [x] Verify all canonical and legacy routes, keyboard focus, route-local error
      recovery, responsive widths, browser reflow, light, dark, reduced-motion,
      higher-contrast and forced-colour states.
- [x] Inspect the five flagship routes and engineering workspace motor,
      scenario, dataset, invalid-import, notebook, lineage, Project Pack,
      report and hosted-capability states.
- [x] Reproduce the original CAD WebGL failure and verify root-cause recovery,
      local fallback, retry, safe exit, retained non-WebGL functions and nearby
      CAD regression paths.
- [x] Run the production-only and complete dependency audits. Record every
      advisory and do not relabel a failed audit as passed.
- [x] Build the Tauri frontend and desktop package only when within current
      authority. Inspect the actual packaged runtime before claiming it.

## Historical completion evidence

The following results were recorded on 2026-07-11 after the workspace-authority,
security and recent-project reauthorisation changes. They are retained as a
dated snapshot only and do not verify the current working tree.

| Gate | Recorded result | Evidence scope |
|---|---|---|
| `npm run lint` | Passed | Historical snapshot |
| `npm test` | 18 files, 152 tests passed | Historical snapshot |
| `npm run build` | Passed, 81 modules, CSS 45.98 kB, JS 427.49 kB | Historical snapshot |
| Windows-targeted Tauri frontend build | Passed | Historical snapshot |
| `cargo fmt --check` | Passed | Historical snapshot |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed | Historical snapshot |
| `cargo test` | 39 passed | Historical snapshot |
| Tauri capability generation | Passed | Historical snapshot |
| npm dependency audit | 0 vulnerabilities | Historical snapshot |
| Responsive route audit | 90 of 90 cases passed at 6 widths, maximum document overflow 0 | Historical snapshot |
| `npm run build:desktop` | Passed; release application, MSI and NSIS produced | Historical bundles, not installed or smoke-tested |
| `git diff --check` | Passed after documentation reconciliation | Historical snapshot |
| Secret-pattern review | No actual secret found; one text false positive was reviewed | Historical snapshot |

Windows bundle evidence:

| Deliverable | Size | SHA-256 |
|---|---:|---|
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-MSI-Rev00.msi` | 3,256,320 bytes | `61a51da386d27d704f19c1c7f7127ab1b6412abcb3a7cdfec5b044f7e1bdfc39` |
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-Setup-Rev00.exe` | 2,217,646 bytes | `be5d27d0250fb6c3007be208468785336a286c44c8a72e9274be74b507ced468` |

The release executable was also verified non-empty at 9,499,648 bytes. No
installer launch, signature or installation result is claimed.

## Historical completion-branch gates

- [x] Run lint, tests and both web frontend build modes after the recent-project
      reauthorisation UI patch.
- [x] Run Rust formatting, Clippy and 39 Rust tests after the authority changes.
- [x] Run the complete 90-case responsive audit after the Practice Lab fix.
- [x] Build and hash non-empty Windows x64 MSI and NSIS bundles.
- [ ] Install and interactively smoke-test both Windows installer paths.
- [x] Review final documentation claims and run `git diff --check` after the
      documentation reconciliation.

## Functional desktop verification

- [x] Build fresh Windows desktop installers from the completion working tree.
- [ ] Launch the packaged app and confirm native folder selection registers
      session authority.
- [ ] Create a project, add a requirement, create a text input, add a typed
      configuration, save, close and reopen it.
- [ ] Restart the app, choose a recent entry, re-select the exact saved folder
      and confirm it opens.
- [ ] For a recent entry, select a different folder and confirm the mismatch is
      rejected before a project file is read.
- [ ] Confirm an arbitrary existing absolute root is rejected until selected
      through the native picker.
- [ ] Confirm the missing-tool state is actionable and does not crash or block
      the learning application.
- [ ] With a real ngspice installation, execute representative operating-point,
      DC, AC and transient cases and inspect persisted outputs.
- [ ] Confirm malicious ngspice control, include, library and process-escape
      inputs fail at the Rust command boundary.
- [ ] With a real KiCad 8, 9 or 10 installation, execute the capabilities
      supported by that version and inspect result files.
- [ ] Run a configuration, inspect `evidence/latest-run.json`, change an input
      and confirm the report identifies the hash mismatch.
- [ ] Generate `reports/evidence.md` twice from identical explicit inputs and
      confirm byte-identical output where timestamps are held constant.
- [ ] Cancel a run and inspect the workspace for partial external-tool output.

## UI and accessibility verification

- [x] Historical 90-case route-width audit retained above. The earlier Phase 0
      and Phase 1 matrix separately covered every canonical route at 320 CSS
      pixels and every primary route at 320, 390, 768, 1024 and 1440 CSS
      pixels.
- [x] Verify the mobile drawer opens, traps focus, closes with Escape and
      returns focus to its trigger.
- [ ] Verify tab Arrow Left, Arrow Right, Home and End behaviour with focus and
      active-panel relationships.
- [x] Verify light, dark, reduced-motion, higher-contrast and forced-colour
      browser states in the current Chromium matrix.
- [x] Run automated axe and keyboard checks in Chromium and record the current
      results above.
- [ ] Run a manual screen-reader pass with NVDA, JAWS or VoiceOver.
- [x] Verify browser reflow equivalents at 200 and 400 percent on
      representative routes.
- [x] Confirm charts have meaningful titles, units, series labels and usable
      text or table alternatives.

### Manual screen-reader checklist - NOT RUN

Status for the complete Phase 1.1 through Phase 5 working tree: **NOT RUN**.
Do not mark any item complete without naming the screen reader, version,
browser or desktop webview, operating system and tested build.

- [ ] Start with a clean local profile and complete or skip onboarding.
- [ ] Navigate the five primary destinations, secondary actions and footer by
      landmarks and headings.
- [ ] Open, search, move through and close the command palette; confirm focus
      returns to the trigger.
- [ ] Verify each flagship heading hierarchy, prerequisites, workflow sequence,
      equation, fixture table, challenge, failure cases, rubric and linked
      action.
- [ ] In the engineering workspace, move through the section navigation and
      confirm the selected state is announced.
- [ ] Read the motor-sizing result and typed-variable tables with row and column
      headers, values and units.
- [ ] Change scenario selection and confirm changed-input and changed-output
      tables remain understandable without visual position.
- [ ] Trigger invalid dataset input and confirm the error is announced once,
      associated with the task and does not move focus unexpectedly.
- [ ] Add a sanitised notebook note and confirm status, content and reference
      labels are announced.
- [ ] Read the evidence-lineage table as source, relation and target.
- [ ] Preview bundle and Project Pack imports, confirm conflicts or integrity
      status are announced, cancel, apply and use in-session undo.
- [ ] Read the Project Pack manifest and report integrity summaries without
      relying on truncated visual hash prefixes alone.
- [ ] Read report chart tables and print-view content in logical order.
- [ ] Trigger CAD WebGL fallback and route-local recovery; confirm the fallback
      explanation, retry and safe-exit actions are named.
- [ ] Verify Settings announces hosted capabilities as unavailable and
      distinguishes local reference behaviour from hosted service.
- [ ] Verify all dialogs trap focus, Escape behaviour is appropriate and focus
      returns to the invoking control.
- [ ] Verify native desktop-only controls and missing-tool states if a packaged
      runtime is separately in scope.

## Platform and release mechanics

- [ ] Verify Windows, macOS and Linux by actual package jobs. Workflow presence
      alone is not verification.
- [x] Confirm package version consistency in `package.json`,
      `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
- [x] Confirm the repository licence. The current source contains the MIT
      licence.
- [ ] Refresh third-party licence evidence for the final lockfiles.
- [ ] Decide signing, notarisation, installer trust and update strategy.
- [ ] Date the changelog and create a release commit only after every required
      gate is green.
- [ ] Push the tag only after approval, then verify checksums and one clean-host
      installation per supported platform.

## Release decision

A reviewed branch may be described as a functional completion candidate only
when its current-source gates are recorded below and pass. It must not be
described as a production release while any applicable real-tool,
cross-platform, packaged-runtime or accessibility gate remains open.
