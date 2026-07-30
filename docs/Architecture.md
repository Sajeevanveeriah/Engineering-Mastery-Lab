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
    Self-contained Engineering Academy
      Courses E0-E4
      Units and complete native lessons
      Unit quizzes and tests
      Course challenges
      Mastery review queue
    Accelerated reboot S001-S110
    Practical diagnostics
    Source inventory
    Pathways
    Laboratories
    Flagship engineering workflows
    Skills
    Bookmarks
  Build
    Rover releases P1-P4
    Catalogue
    Detail, milestones, notes, evidence
  Analyse
    Curriculum progress analysis
    Calculators
    Unit converter
    Materials reference
    Engineering project workspace
    CAD Studio
    Project Workbench
    Diagnostics
  Prove
    Defensible rover capstone
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
| `src/data/academy/` | Versioned Academy course, unit, lesson, skill, assessment, coverage, source, route and S001-S110 mapping manifests |
| `src/data/academyMedia.ts` | Reviewed optional-media registry, lesson placement map and privacy-enhanced embed URL construction |
| `src/data/` | Versioned reboot curriculum, retained mastery modules, stable content metadata, skills, pathways, flagship workflows, projects, search items, plans, and entitlements |
| `src/lib/academy/` | Academy curriculum loading and validation, assessment grading, mastery, review, deterministic recommendations, laboratory handoff validation and web offline registration |
| `src/lib/curriculum.ts` | Pure curriculum validation, dependency graph, diagnostic-skip, next-session, milestone, release, dimensional progress, and ISO-week review calculations |
| `src/lib/theme.ts` | System, Light, and Dark preference resolution plus document theme metadata |
| `src/lib/storage.ts` | Progress schema version 5, deterministic version 1 through version 4 migration, content-alias migration, bounded Academy records, import validation, engineering workspace records, curriculum records, weekly reviews, and persistence |
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
| `src/components/` | Product shell, command palette, onboarding, Academy lesson blocks, accessible mathematics, click-to-load media, lab journey, plots, and workspace editors |
| `src/pages/` | Today, Academy catalogue, course, unit, lesson, assessment and review pages, retained Learn surfaces, Build, Analyse, Prove, settings, labs, and desktop workflows |
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
rules. The profile is schema version 1 inside progress schema version 5. It can
be edited in Settings. It is not an account or sign-in flow.

## Progress schema version 5

`ProgressState` version 5 preserves the complete version 4 contract and adds a
bounded `academy` state. Version 4 already introduced the explicit appearance
preference, stable curriculum records and weekly reviews.

The complete progress record contains:

- local profile and onboarding completion;
- pathway enrolments, last step, and completed step identifiers;
- laboratory stage position and visited stage identifiers;
- bookmarks and recent items;
- project state, milestones, evidence, and notes;
- manual evidence and evidence-based achievement identifiers;
- theme and accessibility preferences;
- validated local engineering workspace records;
- selected `system`, `light`, or `dark` theme preference;
- curriculum records keyed by stable learning-object identifier;
- weekly review records keyed by ISO calendar week;
- Academy lesson records with exact course, unit and lesson identity, last
  block, normalised scroll position, video positions, notes, bookmark and
  completion requirements;
- bounded assessment histories, skill mastery evidence and transition history;
- unfinished laboratory handoffs, deterministic recommendation receipts,
  scheduled review state and one exact lesson resume cursor; and
- bounded `legacy` storage for unknown version 1 root fields.

Load order is the version 5 key, then version 4, version 3, version 2, version
1, then a clean version 5 state. Older source values are not deleted during
migration. A validated version 4 record is retained exactly and receives an
empty Academy state; no mastery, assessment or completion evidence is invented.
Earlier migrations retain their declared fields and deterministic defaults
before the same version 4 to version 5 upgrade is applied.

Import accepts versions 1, 2, 3, 4 and 5. Validation bounds JSON character
count, collection count, key length, string length, array length, legacy depth,
timestamps, internal routes, optional HTTP or HTTPS URLs, curriculum record
fields, weekly-review values and every Academy collection. Academy validators
also enforce canonical identifiers and routes, chronological histories,
derived lesson completion, legal mastery and review transitions, and
cross-record resume identity. Unsafe keys such as `__proto__`, `prototype`, and
`constructor` are rejected at every validated record boundary. Unknown fields
in declared current schemas are rejected.

Settings owns export, validated preview, atomic in-session replacement, reset,
confirmation, and exact byte-preserving in-session undo.

## Self-contained Academy architecture

The Academy is an internal teaching system. External resources are provenance
or optional lesson media, not the lesson itself.

```text
catalogue and coverage manifests
  -> lazy E0-E4 stage payloads
  -> course -> unit -> lesson
  -> native teaching blocks and guided questions
  -> persisted attempts and completion requirements
  -> mastery evidence -> review due state
  -> reasoned next-activity recommendation
  -> exact lesson, block and scroll resumption

lesson laboratory callout
  -> validated internal tool or lab route
  -> structured observed result, criterion comparison and evidence reference
  -> retained applied evidence
  -> return to the exact lesson block
```

The first chain is the native learning loop. The second is the bounded
laboratory handoff loop. Opening a lab records unfinished work but does not
award completion or mastery. Applied evidence is accepted only through the
validated return contract.

### Academy content and manifest boundaries

`src/data/academy/catalogue.ts` defines the five ordered courses, 25 retained
units, their prerequisite skill graph, assessment specifications, source
references and required internal routes. Every unit has seven stable lesson
identifiers. The course and unit manifests preserve the existing E0-E4 module
identities.

`src/data/academy/stages/E0.ts` through `E4.ts` are lazy stage payloads. Together
they supply 175 `Lesson` records. A lesson is complete native instruction:
objectives, prerequisites, teaching blocks, formulae, worked examples,
questions, retrieval prompts, optional media references, laboratory routing,
summary, sources and previous or next identity.

`src/data/academy/lessonTeachingProfilesV2/units` supplies one independently
lazy teaching-profile module for each unit. Every module expands seven compact,
lesson-specific authoring plans through the frozen V2 validator before export.
The production lesson route loads only the selected unit profile, then renders
first-principles teaching, bounded terminology, a conceptual model, a worked
case and counterexample, a failure boundary, a misconception clinic, a typed
explorer and four base/retry assessment families. Relevant formulae,
derivations, verified worked examples, diagrams, optional media and laboratory
handoffs from the retained lesson record are interleaved before or after the
V2 assessment rather than discarded.

`src/data/academy/manifests.ts` composes the executable catalogue and exports:

| Manifest | Contract |
|---|---|
| Course and unit catalogues | Ordered E0-E4 ownership, prerequisites and stable ids |
| Skills and assessments | Skill graph, unit quiz, unit test and course challenge identity |
| Mandatory coverage | Requirement to lesson, skill, assessment and applied-route mapping |
| S001-S110 mappings | Ordered internal lesson, assessment, review-skill and applied-route bridges |
| Sources and media | Provenance, licence, validation date, optional-media metadata and lesson placement |
| Required routes | Laboratories, flagships, pathways and rover-release reachability |

Formula and skill-assessment manifests are derived from loaded lessons rather
than being hand-declared as passing. `validateAcademyCurriculum` checks course,
unit, lesson, prerequisite, question, formula, source, media, coverage,
assessment, route and S001-S110 references before the corpus is treated as
valid.

### Assessment, mastery, review and recommendation

The assessment engine grades nine explicit question contracts: single choice,
multiple selection, numeric, ordering, matching, short response, diagram, code
analysis and deterministic seeded calculation. Numeric grading converts only
declared compatible units and applies the authored absolute and relative
tolerances. Displayed code is analysed as text and is never executed.
Progressive hints and worked solutions are separate states, and persisted
attempt records retain response summary, score, hints, feedback, reveal state
and timestamps.

The V2 lesson assessment uses stable question identities for its base and
changed-condition variants. The page stores every hint, explicit solution
reveal, retry disclosure and attempt in progress schema version 5. Reopening a
lesson restores revealed support, retry state, best score and a bounded,
learner-visible attempt-history table. Historical cursors for retired generic
intro, definition, example, visual, concept, misconception, check and practice
blocks resolve to the closest equivalent V2 section; still-present block ids
resume exactly.

The route validates every event against the open lesson's canonical assessment
and question identities before writing. An event-derived receipt makes repeated
delivery idempotent across interaction state, assessment history, question
history and mastery evidence. Best-score hydration reads the bounded attempt
history, so a later lower attempt cannot erase an earlier higher result after a
reload.

Lesson completion is derived from all three stored requirements: knowledge
checks passed, practice completed and applied evidence satisfied. A visit,
video playback or laboratory open cannot independently mark a lesson complete.
Course and unit progress is derived from lesson records rather than stored as
an independent completion flag. Course availability and completion also use
prerequisite-course and course-challenge results. Unit assessment histories
remain separate evidence.

`src/lib/academy/mastery.ts` evaluates evidence deterministically. The default
policy uses a 60 percent recent guided-practice threshold over the latest three
records, two independent scored activities at 80 percent for proficiency, and
a 90 percent delayed review plus required applied evidence for mastery.
Proficient review intervals are 7, 14 and 30 days; mastered intervals are 14,
30, 60 and 120 days. These values are an explicit configurable product
heuristic, not a scientifically perfect memory model. A due review retains the
underlying achieved state, and a decline requires current evidence and a
recorded reason.

`src/lib/academy/recommendation.ts` ranks eligible lesson, assessment, review
and unfinished-laboratory candidates from prerequisite gaps, recent incorrect
responses, optional low-confidence correct responses, due reviews, unfinished
labs, current mastery and course position. Stable ordering resolves ties. The
Today integration records an algorithm version, deterministic input
fingerprint, selected ids and reason codes when a recommendation is accepted;
it does not silently redirect the learner.

### Mathematics, media and offline boundaries

Reviewed formula mappings carry LaTeX, authoritative plain text and spoken
wording. KaTeX runs with MathML output, strict errors, trust disabled and
bounded expansion and output. Trust-requiring TeX commands are prohibited. A
missing or mismatched reviewed mapping falls back to visible plain text.
KaTeX is a presentation layer, not a symbolic algebra or engineering
verification engine.

Optional reviewed MIT OpenCourseWare videos are registered separately from
lessons. No player or provider request exists until the learner selects the
load control. Permitted playback uses `youtube-nocookie.com`, captions,
attribution, a sandboxed frame, exact-origin messaging and a stored bounded
resume position. Every placement has native teaching and an offline fallback;
provider media is never an assessment dependency. The player is withheld when
the rendered layout cannot provide the provider's 200 by 200 pixel minimum.
Live metadata validation is intentionally reported separately from browser and
desktop playback verification.

The production web build writes a content-derived, same-origin offline
manifest after Vite emits the application. Its service worker caches only
exact reviewed-manifest assets in its current versioned cache, rejects ranges,
unsafe paths and resolved paths outside the application scope, and never
caches arbitrary same-origin GET or navigation URLs. Offline navigation falls
back only to the canonical cached `index.html`; unrelated cache namespaces are
not searched. Older Academy caches are removed after a new version activates.
Registration is limited to production HTTP or HTTPS and is skipped inside
Tauri. The desktop package uses its bundled local assets instead.

## Retained curriculum bridges

`src/data/rebootCurriculum.ts` is the reviewed canonical TypeScript extraction
of the authoritative workbook. The production application does not parse
XLSX. Stable identifiers, source provenance and content versions remain data,
while navigation and persistence use the identifiers rather than array
positions or visible labels.

The accelerated curriculum contains:

- sessions S001-S110;
- milestones M0-M9;
- practical diagnostics for every milestone;
- rover releases P1-P4;
- 64 source records;
- technology lanes, cadence, weekly rhythm and twelve-week review templates;
- optional resources that remain visibly optional; and
- a generic local calendar-planning model with no copied private event values.

`src/data/masteryCurriculum.ts` retains the five-stage E0-E4 prerequisite graph
and 25 legacy domain modules. Those module routes and the S001-S110 reboot
routes bridge into the Academy manifests without being deleted. The retained
`validateCurriculum` checks session identity and order, milestone counts,
minute totals, referenced resources, prerequisite existence, cycles,
reachability, worked-example recomputation and evidence structure.

Diagnostic skipping is deliberately narrow. Scores 3 and 4 may satisfy an
ordinary lesson session. Proof and release sessions are listed in a separate
mandatory set and cannot be skipped. Completion, diagnostic evidence and
mastery-gate passage remain distinct progress dimensions.

Academy and retained curriculum routes are lazy-loaded. The initial router shell
does not synchronously import the E0-E4 stage payloads. A lesson loads only its
owning stage; a full Academy validation explicitly loads all stages.

## Theme resolution

The persisted preference is `system`, `light`, or `dark`. The resolved visual
theme is always `light` or `dark`. A before-paint script reads the newest valid
local preference, falls back through older explicit themes, resolves System
through `prefers-color-scheme`, and sets the document attributes, CSS
`color-scheme`, and theme-colour metadata before React mounts. Runtime
operating-system changes are observed only while System is selected.

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

The complete curriculum, accelerated reboot, session detail, module detail,
curriculum diagnostics, resource inventory, rover release, progress analysis,
capstone, flagship workflow page, Engineering Toolbox, engineering project
workspace, CAD Studio, Project Workbench, and Diagnostics use React lazy
routes. The router shell does not synchronously import these route chunks;
opening Today loads the data needed for its live position and Academy
recommendations.
CAD Studio uses Three.js inside its isolated route chunk for bounded parametric
3D inspection. Its pure model layer owns validation, mass properties, and STL,
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
