# Engineering Workbench completion plan

Status: implementation complete for the functional candidate; release
verification remains open.

Updated: 2026-07-11

This plan supersedes the original v0.1 milestone plan where it conflicts with
the current completion branch. The original baseline work established Tauri,
adapters and workspaces. The completion pass expanded product function, visual
quality, evidence integrity and the trusted workspace boundary.

## Outcome

Deliver one coherent application that:

1. preserves and improves the complete engineering learning experience,
2. provides an end-to-end desktop project workflow,
3. records actual run evidence instead of implying verification from links,
4. limits local filesystem and process authority at the Rust boundary, and
5. remains honest about real-tool, platform and release verification gaps.

## Workstream status

| Workstream | Acceptance result | State |
|---|---|---|
| Repository and requirement audit | Existing v0.1 branch, public change history, routes, data and tests inspected | Complete |
| Visual system | Responsive semantic theme, desktop and mobile navigation, consistent cards, forms, tables and states | Complete |
| Learning workflow | Dashboard, skills, pathways and eight full-cycle labs integrated | Complete |
| Accessibility foundations | Keyboard tabs, focus handling, reduced motion, forced colours and chart alternatives | Complete, formal audit open |
| Project authoring | Create, open, save, close, requirements, links, configurations and bounded input editor | Complete |
| Execution workflow | Detect, run, cancel, inspect and replace stale in-session results | Complete, real tools open |
| Evidence integrity | Pre-run input hashes, strict latest receipt and deterministic report semantics | Complete |
| Workspace authority | Rust native picker and session-authorised canonical roots for all file and tool commands | Complete |
| Process hardening | Typed allow-list, deck grammar, zones, executable checks, limits and atomic writes | Complete, residual risks recorded |
| Automated checks | 152 TypeScript tests, 39 Rust tests, final web builds, audit and 90-case responsive evidence | Complete for current source |
| Documentation | Current architecture, ADRs, limitations, checklist, readiness and receipt | Complete in working tree |
| Production release | Packaging, real tools, all platforms, formal accessibility and licence | Open |

## Verification sequence

The remaining work should be completed in this order:

1. Install and interactively launch the fresh Windows MSI and NSIS paths.
2. Exercise workspace authority, recents, mismatch rejection, persistence and
   evidence in the packaged runtime.
3. Install and verify representative ngspice and KiCad versions.
4. Run actual macOS and Linux package jobs and smoke tests.
5. Complete accessibility testing with automated, zoom and assistive-technology
   evidence.
6. Resolve or accept the recorded security residuals through review.
7. Choose a licence, refresh notices, create the release commit and only then
   tag or publish.

## Stop conditions

Do not declare a production release if any of these conditions remains:

- a required check has not run against the exact release source,
- a real-tool path is represented only by a fixture,
- a supported platform is represented only by workflow configuration,
- packaged workspace authority has not been exercised,
- a known high-impact security finding is unresolved or unaccepted,
- public redistribution has no licence, or
- documentation overstates the evidence.

## Rollback strategy

The comparison baseline is commit `ba8b722` on
`feature/engineering-workbench-v0.1`. The completion changes are isolated on
`saj/complete-engineering-workbench` but remain working-tree changes until the
parent workflow creates a reviewed commit.

Before any destructive reset or clean:

1. inspect `git status` and the full diff,
2. preserve modified and untracked completion files in a commit or backup,
3. confirm the intended baseline commit, and
4. restore only after the preservation check.

After a completion commit exists, the preferred rollback is a normal revert of
that commit rather than ad hoc file deletion.
