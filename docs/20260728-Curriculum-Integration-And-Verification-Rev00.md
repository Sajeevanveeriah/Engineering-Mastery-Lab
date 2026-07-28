# Curriculum integration and verification

## Scope and authority

This document records the implemented curriculum source, product surfaces,
privacy boundary, design system, resource handling and verification contract.
Executable TypeScript validators remain the source of truth if this document
and code differ.

The authoritative source workbook is:

```text
20260726-Robotics-AI-Study-Plan-Rev00.xlsx
SHA-256: a0ffeeb6835603ae0846db7ee201028a5cdd032b8fe54153649b2aff72e4c2b8
```

The workbook itself is not copied into the repository. Production code does
not contain an XLSX parser or read the workbook at runtime.

## Workbook ingestion and provenance

The source workbook contains nine sheets:

1. Start Here
2. Roadmap
3. Session Plan
4. Daily Rhythm
5. Calendar Fit
6. Diagnostics
7. Projects
8. Resources
9. Weekly Review

Authoring-time extraction read the complete workbook package and reviewed all
nine rendered sheets. Independent Open XML counting verified:

- 110 unique ordered sessions, S001-S110;
- 2,750 planned minutes, equal to 45 hours 50 minutes;
- milestone counts of 6, 10, 12, 12, 12, 14, 12, 12, 10 and 10;
- 64 unique resources, of which 61 are referenced by sessions;
- optional resources MIG01, ADV01 and ADV02;
- ten practical diagnostics;
- four rover releases; and
- twelve weekly-review template rows.

`src/data/rebootCurriculum.ts` is the reviewed canonical application
representation. It retains source wording, stable identifiers, source
provenance and workbook validation notes. Session, resource and milestone
counts are recomputed by tests instead of trusted as descriptive metadata.

Private Calendar Fit cell values are excluded. The application retains only a
generic local planning model:

- missing calendar data means unknown, not available;
- fixed commitments and buffers are local user decisions;
- no private event, person, organisation, address or subscription value is
  included in public source.

## Curriculum source map

| Source | Responsibility |
|---|---|
| `src/data/rebootCurriculum.ts` | Workbook provenance, S001-S110, M0-M9, diagnostics, P1-P4, resources, cadence, weekly template and optional resources |
| `src/data/masteryCurriculum.ts` | E0-E4 and 25 complete prerequisite-ordered domain modules |
| `src/data/curriculumMetadata.ts` | Stable alias map and mandatory proof-session set |
| `src/lib/curriculum.ts` | Validation, graph analysis, diagnostic rules, progression, dimensions and ISO-week calculations |
| `src/lib/storage.ts` | Version 4 records, bounded migration, content-id reconciliation and persistence |

## Product surfaces

| Need | Route |
|---|---|
| One next action and current position | `/` |
| Complete prerequisite roadmap | `/learn/roadmap` |
| Accelerated reboot | `/learn/reboot` |
| Stable session detail | `/learn/reboot/sessions/:sessionId` |
| Complete module detail | `/learn/modules/:moduleId` |
| Practical diagnostic decisions | `/learn/diagnostics` |
| Searchable source inventory | `/learn/resources` |
| Rover release detail | `/projects/releases/:releaseId` |
| Progress dimensions and weekly review | `/tools/progress` |
| Capstone traceability and proof | `/portfolio/capstone` |

The new routes are secondary surfaces under the existing five-destination
shell. Existing Phase 0 to Phase 5 routes and retained aliases remain
available.

## Progress and migration

Progress version 4 adds:

- System, Light or Dark preference;
- curriculum records with completion, blocker, confidence, actual minutes,
  notes, evidence, attempts, diagnostic score, gate result, completion time
  and content version;
- ISO-calendar-week review records with planned blocks, completed blocks,
  evidence count and reflection.

Exposure, practice, evidence and mastery use separate predicates and
denominators. Confidence never substitutes for a passed gate. Diagnostic
scores of 3 or 4 may skip ordinary lessons. Proof and release ids remain in a
separate mandatory set.

Version 1, 2 and 3 backups migrate deterministically. Explicit old Light or
Dark choices remain explicit. Missing preference becomes System. Content
aliases migrate only without loss; different legacy and canonical records
block import. Settings shows a validated preview, applies a complete record
atomically in the current session and retains the exact prior bytes for undo.

## Design system and theme

The premium engineering interface uses the tokens in
`src/styles/tokens.css`:

- studio background, surface, ink, muted, line, cobalt, cyan, green, amber and
  red semantic colours;
- body, editorial and monospace font families;
- a 0.25 rem to 3 rem spacing scale;
- reading and wide content measures;
- 6 px, 12 px and 20 px radii;
- small and raised shadows;
- 160 ms and 240 ms motion timings;
- 760 px, 1,024 px and 1,280 px responsive reference points.

Light and Dark palettes use the same semantic token names. System stores the
selection separately and resolves through `prefers-color-scheme`. The
before-paint script applies theme attributes and browser metadata before React
mounts, preventing a deliberate theme flash. Manual Light or Dark overrides
ignore later operating-system changes.

Coordinate-grid surfaces are used only to clarify engineering hierarchy,
traceability or bounded work. They are not decorative status claims. Tables,
cards and progress bars retain text labels and do not rely on colour alone.

## Accessibility contract

The implemented contract includes:

- semantic landmarks and one visible H1 per route;
- skip navigation and focus restoration;
- named navigation, tables, controls and status regions;
- keyboard-operable dialogs and mobile navigation;
- minimum 320 CSS px route containment;
- representative 200 percent and 400 percent browser-reflow equivalents;
- responsive desktop, tablet and mobile layouts;
- reduced-motion, higher-contrast and forced-colour handling;
- text or table equivalents for diagrams, charts, equations and progress;
- no serious or critical automated axe finding in the current tested route
  matrix.

Automated checks are not a formal WCAG conformance claim. Manual screen-reader
testing and non-Chromium browser testing remain separate release gates.

## Resource validation

All 64 workbook resources retain:

- stable resource id;
- track, provider and resource type;
- use instruction and suggested slice;
- access classification;
- workbook check result and date;
- optional newer revalidation note.

Opening a resource is always an explicit user action. No background request,
tracking call or automated external fetch occurs from the resource inventory.
An official label describes workbook provenance, not guaranteed access,
currency or endorsement.

New validation is additive. A resource that was not revalidated in the
implementation run says so. MIG01 records the future ROS 2 Lyrical Luth and
Gazebo Jetty migration review. The current supported lane remains ROS 2 Jazzy
Jalisco with Gazebo Harmonic.

## Privacy and security

- No workbook path or private Calendar Fit value is stored in product data.
- No hosted identity, synchronisation, billing, telemetry or educator service
  is connected.
- Curriculum progress stays in browser or desktop-webview local storage.
- External links open only after a user chooses them.
- Curriculum routes add no Tauri command, filesystem path, process, open,
  reveal, network or secret authority.
- Progress import remains bounded and rejects unsafe keys, unknown fields,
  oversized collections, invalid timestamps, unsupported future versions and
  conflicting content aliases.
- Educational completion and evidence remain learner-generated claims.
- Stage 1 mappings are educational guidance only and not an Engineers
  Australia assessment, accreditation decision or competency claim.

## Verification matrix

| Area | Required evidence |
|---|---|
| Workbook identity | Exact filename, SHA-256, package parse and nine-sheet render |
| Counts | Two independent methods for sessions, minutes, milestones, resources, diagnostics, releases and weekly rows |
| Curriculum integrity | Stable ids, duplicate and reference checks, exact order, DAG cycle and reachability checks |
| Numeric learning content | SI units, dimensions, raw inputs, formula, rounding and independent expected-value recomputation |
| Migration | Version 1, 2 and 3 fixtures, deterministic output, alias success and conflict block |
| Theme | Before-paint state, System light and dark, operating-system changes, manual override and reload |
| Progress | Completion, blocker, confidence, skip, proof, weekly review, reload and exact import undo |
| Routes | Every new route at 320 CSS px plus nearby retained routes and aliases |
| Accessibility | Axe, keyboard, focus, reduced motion, contrast, forced colours and text alternatives |
| Reflow | Width matrix plus representative 200 percent and 400 percent equivalents |
| Visual | Named states for Today, roadmap, M0, M5, M9, S001, S110, diagnostics, modules, releases, progress, capstone, resources, import, theme and mobile navigation |
| Product regression | Complete TypeScript unit suite, production build, browser suite and retained deterministic snapshots |
| Native boundary | Rust format, Clippy and tests; confirm no authority diff |
| Supply chain | Installed-tree check and both production-only and complete npm audits, with every advisory retained |

## Rollback

All implementation changes remain ordinary unstaged repository edits until
separately authorised. Progress imports and resets have exact in-session undo.
No workbook, browser capture, dependency, native capability, commit, tag,
deployment or external service is required to roll back the source changes.
