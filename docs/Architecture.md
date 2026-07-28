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
  Today
  Learn
    Pathways
    Laboratories
    Flagship engineering workflows
    Skills
    Bookmarks
  Build
    Catalogue
    Detail, milestones, notes, evidence
  Analyse
    Calculators
    Unit converter
    Materials reference
    Engineering project workspace
    CAD Studio
    Project Workbench
    Diagnostics
  Prove
    Evidence
    Skills
    Achievements
    Export
```

Search, Pricing, Settings, About, and local profile controls sit outside the
five-item primary navigation.

The primary product labels do not change canonical routes. `HashRouter` remains
the routing mechanism for static GitHub Pages. Canonical routes use `/`,
`/learn`, `/projects`, `/tools`, and `/portfolio`. Legacy aliases redirect old
lab, skills, pathways, toolbox, CAD, Workbench, and diagnostics links to the
new hierarchy.

## Frontend layers

| Area | Responsibility |
|---|---|
| `src/data/` | Declarative modules, skills, pathways, flagship workflows, projects, search items, plans, and entitlements |
| `src/lib/storage.ts` | Progress schema version 3, deterministic version 1 and version 2 migration, import validation, engineering workspace records, and persistence |
| `src/lib/kernel/` | Pure engineering units, variables, datasets, scenarios, notebook, evidence graph, project bundle, and motor-sizing vertical slice |
| `src/lib/interchange/` | Data-only Project Packs, deterministic engineering reports, canonical JSON, and provider-neutral adapter descriptors |
| `src/lib/ecosystem/` | Local reference sync records, explicit conflict resolution, synthetic cohorts, privacy-safe aggregates, curated packs, and hosted-capability state |
| `src/lib/providers.ts` | Learner, progress, entitlement, billing-availability, and product-event seams |
| `src/lib/recommendation.ts` | Pure deterministic onboarding recommendation |
| `src/lib/simulations/` | Existing pure engineering simulation functions |
| `src/lib/adapters/` | Existing versioned adapter contract and tool-specific logic |
| `src/lib/workspace/` | Existing manifest schema, workspace operations, and input hashing |
| `src/lib/report/` | Existing run receipt and Markdown evidence reporting |
| `src/lib/platform/` | The only frontend seam for local filesystem and process capability |
| `src/components/` | Product shell, command palette, onboarding, lab journey, plots, and workspace editors |
| `src/pages/` | Today, Learn, Build, Analyse, Prove, commercial information, settings, labs, and desktop workflows |
| `src/styles/` | Legacy feature styles plus product tokens and coherent product layout or component styles |
| `src/tests/` | Simulation, migration, catalogue, provider, storage, adapter, workspace, receipt, report, and workflow tests |

## Application shell and discovery

`Layout` renders exactly five primary destinations in the desktop rail and
mobile bottom navigation. It retains the existing unsaved Project Workbench
navigation guard. Those destinations are Today, Learn, Build, Analyse and
Prove. Search, pricing, settings and product information remain secondary.

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
rules. The profile is schema version 1 inside progress schema version 3. It can
be edited in Settings. It is not an account or sign-in flow.

## Progress schema version 3

`ProgressState` version 3 preserves the version 2 learner and progress fields
and adds bounded `engineeringWorkspaces` records. Each workspace record has
schema version 1, a project identifier, validated project bundle JSON and a UTC
update timestamp.

The complete progress record contains:

- local profile and onboarding completion;
- pathway enrolments, last step, and completed step identifiers;
- laboratory stage position and visited stage identifiers;
- bookmarks and recent items;
- project state, milestones, evidence, and notes;
- manual evidence and evidence-based achievement identifiers;
- theme and accessibility preferences;
- validated local engineering workspace records; and
- bounded `legacy` storage for unknown version 1 root fields.

Load order is the version 3 key, then the version 2 key, then the version 1 key,
then a clean local state. Version 1 and version 2 source values are not deleted
during migration. Version 2 migration retains every validated version 2 field
and starts `engineeringWorkspaces` as an empty record. Version 1 migration
retains recognised fields, moves bounded unknown root fields into `legacy`,
marks onboarding complete, and starts all newer collections from deterministic
empty values.

Import accepts versions 1, 2 and 3. Validation bounds JSON character count,
collection count, key length, string length, array length, legacy depth,
timestamps, internal routes, and optional HTTP or HTTPS URLs. Unsafe keys such
as `__proto__`, `prototype`, and `constructor` are rejected at every validated
record boundary. Unknown version 2 and version 3 root fields are rejected.

Settings owns export, import, reset, confirmation, and in-session undo.

## Shared engineering kernel

`src/lib/kernel/` is a pure TypeScript layer. It imports neither React nor the
Tauri bridge. The engineering project schema is version 2 and composes:

- version 1 engineering variables with display values, SI base values, units,
  dimensions, valid ranges, validation status, provenance, assumption status,
  optional tolerance or uncertainty, timestamps and optional calculation
  version references;
- version 1 calculation records with input and output snapshots, equations,
  algorithm identity and version, assumptions, warnings, boundaries, dataset,
  scenario, evidence and project references;
- bounded version 1 datasets with typed columns and explicit null cells;
- one version 1 scenario set with exactly one protected baseline and optional
  named scenarios;
- controlled version 1 notebook blocks containing plain text or typed
  references;
- a version 1 directed evidence graph with broken-reference and cycle checks;
  and
- optional typed motor-sizing inputs.

The unit registry converts compatible values through declared base units and
rejects non-finite values, incompatible dimensions and values below a physical
minimum. The reference motor-sizing model retains gearing, efficiency, load
inertia, angular acceleration, duty cycle and safety factor. It produces
continuous and peak operating requirements and explicitly excludes
manufacturer motor selection, thermal verification and certification.

The engineering project workspace at `/tools/engineering` connects this model
to bounded dataset preview, deterministic scenario comparison, controlled
notebook notes, an accessible lineage table, local progress persistence and
portable interchange. It is a local calculation and evidence surface, not a
general solver, optimisation engine or cloud workspace.

## Portable interchange and reports

Project bundle schema version 2 is canonical JSON containing engineering
project schema version 2 plus a SHA-256 digest. Import verifies the complete
payload before validation or application. Version 1 bundles migrate
deterministically to project version 2. Import preview identifies project,
variable, calculation, dataset, scenario, notebook, evidence-node and
motor-sizing conflicts. Application is in-session and retains an undo value.
The digest detects changed content but is not authentication or a signature.

Project Pack schema version 1 is a bounded, data-only JSON document. It
contains compatibility metadata, a learning sequence, a complete engineering
project, dataset fixtures, notebook templates, an evidence rubric, report
templates, licence and provenance. A derived virtual-file manifest contains
safe relative paths, media types, byte counts and SHA-256 values. Import
rejects executable paths or content, unsafe keys, traversal, unsupported media
types, schema incompatibility, manifest differences and integrity differences.
It does not unpack files or execute content.

Engineering report schema version 1 retains SI and display inputs, assumptions,
tolerances, calculation and model versions, dataset hashes and provenance,
results, accessible chart tables, validation, warnings, limits, lineage,
environment and integrity metadata. Deterministic Markdown and JSON renderers
use the same validated input. Report hashes detect byte changes but do not
authenticate authorship.

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

Build projects are declarative. State stores milestone identifiers, evidence
identifiers, notes, and active, paused, or completed status. Completion is
disabled until every project milestone and required evidence item is checked.

## Prove

Prove entries are derived from existing challenge results, artefact flags,
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

Phase 5 adds separate provider-neutral local foundations in
`src/lib/ecosystem/`. They are not wired to a hosted service:

- opaque identifiers, bounded JSON payloads and canonical records;
- version vectors, tombstones, operation idempotency, conflict detection,
  explicit resolution, export and recovery;
- local curated content-pack manifests;
- synthetic-only cohort, assignment, completion and evidence-review fixtures;
- educator aggregates released only when the learner group meets the minimum
  privacy threshold of five; and
- capability metadata that marks hosted identity, synchronisation, billing,
  collaboration, cohorts and educator analytics unavailable.

The local reference synchronisation provider is an in-memory behavioural
contract, not cloud synchronisation. The cohort and educator implementations
accept synthetic fixtures only. No telemetry or real learner data flows
through these foundations.

See
[Product and Monetisation Architecture](20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md).

## Lazy capability loading

The flagship workflow page, Engineering Toolbox, engineering project
workspace, CAD Studio, Project Workbench, and Diagnostics use React lazy
routes. The initial Today route does not import their chunks. CAD
Studio uses Three.js inside its isolated route chunk for bounded parametric 3D
inspection. Its pure model layer owns validation, mass properties, and STL,
OpenSCAD, SVG, and JSON export preparation without moving Three.js into the
initial application bundle.

Each high-risk lazy tool is wrapped by a route-local error boundary. Route
changes reset obsolete tool error state while the product shell remains
mounted. A retry remounts an ordinary failed tool render; a rejected browser
chunk import reloads the same route because browsers cache failed module
imports inside the current document. CAD checks WebGL before renderer
construction and still catches construction failures after a positive check.
Its local fallback keeps the deterministic drawing, parameters and non-WebGL
exports available. The global boundary remains the last safety net and exposes
no stack trace or local path to normal users.

## Desktop command boundary

The Rust application registers only these command groups:

| Group | Commands |
|---|---|
| Workspace authority | `pick_workspace_directory` |
| Workspace files | `read_text_file`, `write_text_file_atomic`, `list_dir`, `hash_file`, `create_dir_all`, `file_exists` |
| Engineering-tool selection | `pick_tool_executable`, `clear_tool_executable` |
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

Timeout and cancellation terminate a Windows Job Object or Unix process group,
with direct-child termination and reaping as a final fallback. Source tests
cover descendants, but packaged runtime evidence must still be gathered on
every claimed operating system.

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

- The desktop app is a controlled orchestrator around bounded local
  capabilities, not a general SPICE or PCB engine.
- CAD Studio provides template-based parametric parts, 3D inspection, drawing
  output, and bounded exports. It is not a general B-rep kernel,
  manufacturing-certified CAD, or a substitute for production CAD or CAM
  verification.
- Material properties are indicative learning references, not design
  allowables.
- No cloud identity, database, sync, billing, or telemetry is connected.
- Phase 5 provider-neutral foundations are local reference contracts and
  synthetic fixtures, not hosted capability.
- Cross-platform source exists, but only actually run platform checks should be
  claimed.
- See [Known Limitations](Known-Limitations.md) for additional verification
  gaps and [ADR-0004](adr/ADR-0004-External-Process-Security.md) for security
  trade-offs.

## Related implementation guides

- [Data and Schema Model](Data-And-Schema-Model.md)
- [Kernel Authoring Guide](Kernel-Authoring-Guide.md)
- [Project Pack Format](Project-Pack-Format.md)
- [Migration Guide](Migration-Guide.md)
- [Adapter Authoring Guide](Adapter-Authoring-Guide.md)
- [Future Hosted-Provider Integration](Future_Supabase_Integration.md)
