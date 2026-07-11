# Release-Readiness Report — Engineering Workbench v0.1.0

Branch: `feature/engineering-workbench-v0.1` · Host: Windows 11, 2026-07-11

## Summary

The Engineering Mastery Lab web app was converted into **Engineering Workbench
v0.1.0**, a Tauri 2 cross-platform desktop application, without disturbing the
existing labs or the GitHub Pages web deployment. All P0 scope is implemented:
versioned adapter architecture, local workspaces, ngspice and KiCad CLI
adapters, toolchain diagnostics, deterministic evidence reports, cross-platform
CI, and a full public-release documentation suite. Four fresh verifier agents
reviewed the result; all HIGH findings were fixed and re-tested.

## Quality gates (this host)

| Gate | Command | Result |
|---|---|---|
| TS type-check | `npm run lint` | pass |
| TS tests | `npm test` | **130 passed** (14 files) |
| Web build | `npm run build` | pass |
| Rust format | `cargo fmt --check` | pass |
| Rust clippy | `cargo clippy --all-targets -- -D warnings` | pass |
| Rust tests | `cargo test` | **19 passed** |
| Desktop package | `npm run build:desktop` | pass (Windows MSI + NSIS) |
| Dependency audit | `npm audit` | 0 vulnerabilities (after vite 8 / vitest 4 upgrade) |
| Secret scan | repo-wide pattern scan | no secrets, tokens or personal paths |

## Verifier findings and resolution

Four independent reviewers (that did not write the code) covered security,
test/packaging, documentation, and architecture/simulation correctness.

**Fixed (HIGH):**
- Symlink/junction escape of the workspace root — added post-join canonical
  containment check in `src-tauri/src/paths.rs`.
- Stale-artefact hazard: a rerun that exits 0 without producing fresh output
  could report the previous run's data. Added pre-run sentinels in the ngspice
  and KiCad adapters so stale files can never be read as fresh results.
- `kicad.drc` was gated at KiCad 7, where `pcb drc` does not exist — corrected
  to KiCad 8+.

**Fixed (MEDIUM):**
- NTFS alternate data streams and Windows reserved device names now rejected in
  both the Rust and TS path validators.
- `.control`/shell escapes split across SPICE continuation lines now caught via
  a whitespace-stripped compact check.
- Unused `opener:allow-open-path` wildcard capability grant removed (least
  privilege).
- Evidence report labels runs `COMPLETED` (not `PASS`) and adds a findings
  verdict, so a completed-with-errors ERC/DRC is not read as a pass.
- Workbench blocks workspace switching mid-run and aborts in-flight runs on
  open; bridge-init and diagnostics-refresh promise rejections are handled.
- Corrected the RLC example damping-ratio comment (ζ = 0.5).

**Documented rather than fixed (recorded in Known-Limitations.md):**
- Evidence-report input hashes are computed at report time, not run time.
- Directory exports (gerbers/drill) don't use the stale-output sentinel.
- "Open in KiCad" deferred (opener capability removed for least privilege).

## Platform verification

- **Windows x64: verified** by an actual local desktop build (MSI + NSIS
  installers produced).
- **macOS / Linux: unverified on runners.** CI workflows are present and
  YAML-validated but require an actual runner result to be considered verified
  (per the mission's rule against fabricating cross-platform success).

## Definition-of-done check

- Existing functionality operational — yes (all labs/routes/tests preserved;
  web rendering verified in-browser, no console errors).
- P0 features implemented — yes.
- Local quality gates pass — yes (table above).
- Desktop package builds on this host — yes (Windows).
- Cross-platform CI present and syntactically valid — yes.
- Missing external tools fail gracefully — yes (diagnostics + `tool-missing`
  results with remediation).
- Example workspace demonstrates an end-to-end workflow — yes
  (`examples/rc-filter-workspace`, three ngspice analyses).
- Documentation reflects the implementation — yes (verified by a reviewer).
- No secrets/fabricated results/unverifiable claims — confirmed.

## Recommended next actions before making the repository public

1. Run the `Desktop packages` workflow on a tag to verify macOS and Linux
   builds on real runners.
2. Choose and add a licence (recommended: Apache-2.0) and update the
   `UNLICENSED` fields; regenerate the licence inventory.
3. First real-tool run against installed ngspice/KiCad following the release
   checklist's functional verification (adapters are fixture-verified only on
   the dev host).
