# Engineering Mastery Lab architecture

## Status and scope

Engineering Mastery Lab is one React and TypeScript product with two runtime
modes:

- The static web build provides learning, projects, local tools, portfolio
  evidence, and browser-local persistence.
- The Tauri desktop build adds Project Workbench, authorised local workspaces,
  external engineering-tool adapters, run receipts, and evidence reports.

There is no application backend, account, remote sync, payment, or telemetry
connection. Future hosted capabilities are represented by lean TypeScript
provider boundaries and declarative entitlement metadata.

## Product and route hierarchy

```text
Engineering Mastery Lab
  Home
  Learn
    Pathways
    Laboratories
    Skills
    Bookmarks
  Projects
    Catalogue
    Detail, milestones, notes, evidence
  Tools
    Calculators
    Unit converter
    Materials reference
    CAD Studio
    Project Workbench
    Diagnostics
  Portfolio
    Evidence
    Skills
    Achievements
    Export
```

Search, Pricing, Settings, About, and local profile controls sit outside the
five-item primary navigation.

`HashRouter` remains the routing mechanism for static GitHub Pages. Canonical
routes use `/learn`, `/projects`, `/tools`, and `/portfolio`. Legacy aliases
redirect old lab, skills, pathways, toolbox, CAD, Workbench, and diagnostics
links to the new hierarchy.

## Frontend layers

| Area | Responsibility |
|---|---|
| `src/data/` | Declarative modules, skills, pathways, projects, search items, plans, and entitlements |
| `src/lib/storage.ts` | Progress schema version 2, version 1 migration, import validation, and persistence |
| `src/lib/providers.ts` | Learner, progress, entitlement, billing-availability, and product-event seams |
| `src/lib/recommendation.ts` | Pure deterministic onboarding recommendation |
| `src/lib/simulations/` | Existing pure engineering simulation functions |
| `src/lib/adapters/` | Existing versioned adapter contract and tool-specific logic |
| `src/lib/workspace/` | Existing manifest schema, workspace operations, and input hashing |
| `src/lib/report/` | Existing run receipt and Markdown evidence reporting |
| `src/lib/platform/` | The only frontend seam for local filesystem and process capability |
| `src/components/` | Product shell, command palette, onboarding, lab journey, plots, and workspace editors |
| `src/pages/` | Home, Learn, projects, tools, portfolio, commercial information, settings, labs, and desktop workflows |
| `src/styles/` | Legacy feature styles plus product tokens and coherent product layout or component styles |
| `src/tests/` | Simulation, migration, catalogue, provider, storage, adapter, workspace, receipt, report, and workflow tests |

## Application shell and discovery

`Layout` renders exactly five primary destinations in the desktop rail and
mobile bottom navigation. It retains the existing unsaved Project Workbench
navigation guard.

`CommandPalette` opens with Ctrl+K or Meta+K. It searches one declarative
catalogue covering laboratories, pathways, projects, skills, calculators,
references, and tools. Results include type, discipline, description, and
destination. The modal supplies an accessible name, focus containment,
keyboard navigation, Escape handling, and visible selected state.

## Local learner profile

Onboarding appears when `onboardingComplete` is false. The learner can:

- select one primary goal;
- select engineering disciplines;
- select foundation, intermediate, or advanced experience;
- select preferred weekly effort;
- optionally provide a display name;
- skip without losing application access.

`recommendPathway` applies deterministic goal, discipline, and experience
rules. The profile is schema version 1 inside progress schema version 2. It can
be edited in Settings. It is not an account or sign-in flow.

## Progress schema version 2

`ProgressState` version 2 preserves all version 1 fields and adds:

- local profile and onboarding completion;
- pathway enrolments, last step, and completed step identifiers;
- laboratory stage position and visited stage identifiers;
- bookmarks and recent items;
- project state, milestones, evidence, and notes;
- manual evidence and evidence-based achievement identifiers;
- theme and accessibility preferences;
- bounded `legacy` storage for unknown version 1 root fields.

Load order is the version 2 key, then the version 1 key, then a clean local
state. Version 1 is never deleted during migration.

Import accepts versions 1 and 2. Validation bounds JSON character count,
collection count, key length, string length, array length, legacy depth,
timestamps, internal routes, and optional HTTP or HTTPS URLs. Unsafe keys such
as `__proto__`, `prototype`, and `constructor` are rejected at every validated
record boundary. Unknown version 2 root fields are rejected.

Settings owns export, import, reset, confirmation, and in-session undo.

## Learning and project completion

Pathway completion is based on unique ordered step identifiers, not a route
average. Repeated destinations therefore do not create duplicate progress.

`ModuleShell` groups the original eight stages into four phases:

```text
Understand: Learn
Practise: Simulate, Challenge
Apply: Diagnose, Build
Prove: Evidence, Reflect, Next
```

Every stage has a URL query identifier, visible status, previous or next
controls, and a mobile select control. A new lab starts at Learn. A returning
lab resumes the stored stage. All stage panels remain mounted.

`TabPanelActivityProvider` preserves the existing nested activity context.
Timed PLC and robotics effects therefore stop while their simulator is hidden.
Challenge criteria and evidence requirements remain visible before records are
created.

Projects are declarative. State stores milestone identifiers, evidence
identifiers, notes, and active, paused, or completed status. Completion is
disabled until every project milestone and required evidence item is checked.

## Portfolio

Portfolio entries are derived from existing challenge results, artefact flags,
reflections, skill evidence, completed projects, and manual evidence. Derived
achievement labels require recorded evidence thresholds.

Print, JSON, and Markdown exports state that records are learner-generated and
are not accreditation, a qualification, a professional licence, or standards
certification.

## Commercial provider boundaries

The current provider composition is:

```text
localLearnerProvider
localProgressProvider
openSourceEntitlementProvider
localBillingProvider (available = false)
noOpProductEventProvider
```

Open-source preview mode returns every declared current entitlement. Pricing
metadata may describe future plan differences but cannot lock a local feature.
No provider performs a network request.

See
[Product and Monetisation Architecture](20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md).

## Lazy capability loading

CAD Studio, Project Workbench, and Diagnostics use React lazy routes. The
initial Home route does not import their chunks. No Three.js dependency exists
in the repository. CAD Studio uses local SVG geometry and is isolated in its
own lazy chunk so a future CAD engine can be integrated without affecting Home.

## Desktop command boundary

The Rust application registers only these command groups:

| Group | Commands |
|---|---|
| Workspace authority | `pick_workspace_directory` |
| Workspace files | `read_text_file`, `write_text_file_atomic`, `list_dir`, `hash_file`, `create_dir_all`, `file_exists` |
| Engineering tools | `detect_tool`, `run_tool`, `cancel_run` |

The renderer cannot establish root authority by supplying an absolute string.
The native picker canonicalises and registers the selected directory. Every
file command and tool run requires the exact canonical root to remain
authorised for the session.

Recent Project Workbench entries do not bypass this rule. Reopening one invokes
the native picker and compares the selected root with the stored display
identifier before any workspace API is called.

## Workspace and evidence flow

```text
Select authorised root
  -> create or validate workbench.json
  -> author requirements, files, and configurations
  -> save manifest
  -> hash inputs
  -> execute typed adapter
  -> capture result
  -> atomically save evidence/latest-run.json
  -> compare receipt hashes
  -> atomically save reports/evidence.md
```

The workspace manifest describes intended configuration. The run receipt
records one actual result and input hashes. Reports distinguish linked
requirements from verified outcomes and identify missing, failed, stale, or
incomplete evidence.

## External tool execution and file replacement

Rust constructs arguments from typed requests and re-validates paths and
tool-specific boundaries:

- ngspice receives a generated deck beneath `simulations/`, writes beneath
  `results/`, passes a native grammar check, and runs with `-n -b`;
- KiCad operations accept only declared schematic or PCB extensions and write
  only beneath `results/`;
- executable overrides require supported names and product-specific version
  output;
- execution uses no shell and enforces timeout, cancellation, and output caps.

Atomic file replacement uses a unique sibling temporary file, flush and
synchronisation, then same-directory replacement. It has no delete-first
fallback.

## Compatibility decisions

The Tauri display product name and window title are Engineering Mastery Lab.
The bundle identifier remains
`com.sajeevanveeriah.engineeringworkbench` to preserve application identity and
upgrade compatibility. Changing the identifier would create a separate desktop
application identity and is not required for user-facing rebranding.

The Rust crate and executable name remain `engineering-workbench` because they
are compatibility-sensitive implementation identifiers for the advanced
Project Workbench capability.

## Boundaries and limitations

- The desktop app is a controlled orchestrator, not a CAD, SPICE, or PCB
  engine.
- CAD Studio provides a 2D SVG concept, not manufacturing-certified CAD.
- Material properties are indicative learning references, not design
  allowables.
- No cloud identity, database, sync, billing, or telemetry is connected.
- Cross-platform source exists, but only actually run platform checks should be
  claimed.
- See [Known Limitations](Known-Limitations.md) for additional verification
  gaps and [ADR-0004](adr/ADR-0004-External-Process-Security.md) for security
  trade-offs.
