# Release checklist for v0.1.x

Use this checklist against the exact release working tree or commit. A result
from an earlier source state is supporting evidence only.

## Current completion evidence

The following results were recorded on 2026-07-11 after the workspace-authority,
security and recent-project reauthorisation changes.

| Gate | Recorded result | Current status |
|---|---|---|
| `npm run lint` | Passed | Current source evidence |
| `npm test` | 18 files, 152 tests passed | Current source evidence |
| `npm run build` | Passed, 81 modules, CSS 45.98 kB, JS 427.49 kB | Current source evidence |
| Windows-targeted Tauri frontend build | Passed | Current source evidence |
| `cargo fmt --check` | Passed | Current Rust evidence |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed | Current Rust evidence |
| `cargo test` | 39 passed | Current Rust evidence |
| Tauri capability generation | Passed | Current Rust and capability evidence |
| npm dependency audit | 0 vulnerabilities | Current dependency evidence |
| Responsive route audit | 90 of 90 cases passed at 6 widths, maximum document overflow 0 | Current browser evidence |
| `npm run build:desktop` | Passed; release application, MSI and NSIS produced | Bundles built and hashed, not installed or smoke-tested |
| `git diff --check` | Passed after documentation reconciliation | Line-ending conversion warnings only |
| Secret-pattern review | No actual secret found; one text false positive was reviewed | Current review evidence |

Windows bundle evidence:

| Deliverable | Size | SHA-256 |
|---|---:|---|
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-MSI-Rev00.msi` | 3,256,320 bytes | `61a51da386d27d704f19c1c7f7127ab1b6412abcb3a7cdfec5b044f7e1bdfc39` |
| `src-tauri/target/release/bundle/deliverables/20260711-Engineering-Workbench-Windows-x64-Setup-Rev00.exe` | 2,217,646 bytes | `be5d27d0250fb6c3007be208468785336a286c44c8a72e9274be74b507ced468` |

The release executable was also verified non-empty at 9,499,648 bytes. No
installer launch, signature or installation result is claimed.

## Immediate completion-branch gates

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

- [x] Check every route at 320, 390, 480, 768, 1024 and 1280 CSS pixels after
      the final build. All 90 cases passed with maximum document overflow 0.
- [ ] Verify the mobile drawer opens, traps focus, closes with Escape and
      returns focus to its trigger.
- [ ] Verify tab Arrow Left, Arrow Right, Home and End behaviour with focus and
      active-panel relationships.
- [ ] Verify light, dark, reduced-motion and forced-colour modes.
- [ ] Run an automated accessibility scan and a keyboard plus screen-reader
      pass. Record the tool, browser, operating system and findings.
- [ ] Verify browser zoom at 200 and 400 percent on representative routes.
- [ ] Confirm charts have meaningful titles, units, series labels and usable
      text or table alternatives.

## Platform and release mechanics

- [ ] Verify Windows, macOS and Linux by actual package jobs. Workflow presence
      alone is not verification.
- [ ] Confirm package version consistency in `package.json`,
      `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
- [ ] Choose and add a repository licence before any public release.
- [ ] Refresh third-party licence evidence for the final lockfiles.
- [ ] Decide signing, notarisation, installer trust and update strategy.
- [ ] Date the changelog and create a release commit only after every required
      gate is green.
- [ ] Push the tag only after approval, then verify checksums and one clean-host
      installation per supported platform.

## Release decision

The current branch may be described as a functional completion candidate. It
must not be described as a production release while any real-tool,
cross-platform, packaged-runtime, accessibility or licence gate above remains
open.
