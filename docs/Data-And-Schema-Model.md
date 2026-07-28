# Data and schema model

## Scope and source of truth

This document describes the local data models implemented in:

- `src/lib/storage.ts`
- `src/data/rebootCurriculum.ts`
- `src/data/masteryCurriculum.ts`
- `src/data/curriculumMetadata.ts`
- `src/lib/curriculum.ts`
- `src/lib/kernel/`
- `src/lib/interchange/`
- `src/lib/ecosystem/`
- `src/lib/workspace/`
- `src/lib/report/`

The TypeScript validators are the executable source of truth when this
document and code differ. The schemas are local data contracts. They do not
grant filesystem, process, network, identity, collaboration or billing
authority.

## Schema inventory

| Data contract | Current version | Migration behaviour | Persistence boundary |
|---|---:|---|---|
| Browser progress | 4 | Versions 1, 2 and 3 import deterministically to version 4 | Browser or desktop-webview `localStorage` |
| Accelerated reboot curriculum | `2026.07.26` | Canonical reviewed workbook extraction; no runtime XLSX migration | Versioned TypeScript content |
| Complete mastery curriculum | `2026.07.28` | Stable content ids and explicit aliases | Versioned TypeScript content |
| Curriculum learning record | 1 inside progress 4 | Aliases migrate only when unambiguous | Browser or desktop-webview `localStorage` |
| Weekly review record | 1 inside progress 4 | Added empty during prior-progress migration | Browser or desktop-webview `localStorage` |
| Local learner profile | 1 | Retained inside progress migration | Browser or desktop-webview `localStorage` |
| Engineering workspace record | 1 | Added empty when progress version 1 or 2 migrates | Browser or desktop-webview `localStorage` |
| Engineering project | 2 | Version 1 project migration exists through bundle import | Inside project bundles and workspace records |
| Engineering variable | 1 | No independent migration | Inside engineering project |
| Calculation record | 1 | No independent migration | Inside engineering project |
| Dataset | 1 | No independent migration | Inside engineering project or Project Pack |
| Scenario set and scenario | 1 | No independent migration | Inside engineering project |
| Notebook and notebook block | 1 | No independent migration | Inside engineering project or Project Pack |
| Evidence graph | 1 | No independent migration | Inside engineering project |
| Project bundle | 2 | Version 1 bundle migrates deterministically to version 2 project data | Download, upload and local progress record |
| Project Pack | 1 | Unknown versions fail closed | Data-only JSON import and export |
| Project Pack manifest | 1 | Rebuilt from validated content and compared | Inside Project Pack |
| Evidence rubric | 1 | No independent migration | Inside Project Pack |
| Engineering report input | 1 | Unknown versions fail closed | Deterministic Markdown and JSON generation |
| Adapter ecosystem descriptor | 1 | Unknown versions fail closed | Data-only discovery and fixture metadata |
| Sync record envelope | 1 | Unknown versions fail closed | Local in-memory reference store and export |
| Sync export bundle | 1 | Unknown versions fail closed | Local JSON export and recovery |
| Cohort snapshot | 1 | Unknown versions fail closed | Synthetic local fixture provider |
| Curated content pack | 1 | Unknown versions fail closed | Local in-memory reference provider |
| Desktop workbench manifest | 1 | Unknown versions fail closed | Authorised desktop workspace |
| Desktop latest-run receipt | 2 | Unknown versions fail closed | Authorised desktop workspace |

## Browser progress version 4

`ProgressState` version 4 contains:

- skill ratings, challenge results, reflections, artefact flags and sprint
  checklist state;
- local learner profile and onboarding state;
- pathway and laboratory positions;
- bookmarks and recent items;
- Build project progress and notes;
- manual evidence and achievement identifiers;
- theme and accessibility preferences;
- engineering workspace records; and
- selected theme preference (`system`, `light`, or `dark`);
- curriculum learning records;
- weekly review records; and
- bounded legacy values migrated from unknown version 1 root fields.

An engineering workspace record has:

```text
schemaVersion: 1
projectId: string
bundleJson: string
updatedAt: UTC ISO timestamp
```

The bundle JSON is bounded to 750,000 characters in the progress importer. A
workspace record is a browser-local copy of a project bundle. It is not an
authorised Tauri workspace root.

Load order is:

```text
progress/v4 -> progress/v3 -> progress/v2 -> progress/v1 -> clean version 4 state
```

Version 3 migration validates and retains every declared version 3 field.
Version 2 migration validates and retains every declared version 2 field, then
starts `engineeringWorkspaces` as an empty record. Version 1 migration retains
recognised legacy fields, moves bounded unknown root fields into `legacy`,
marks onboarding complete and starts newer collections from deterministic
empty values. All prior migrations then add empty curriculum and weekly-review
collections.

An explicit old Light or Dark choice remains explicit. A missing new
preference becomes System. System is a stored preference, not a third colour
palette; runtime resolution produces Light or Dark.

### Curriculum learning record

Each record is keyed by a stable session or module identifier and retains:

```text
status: not-started | in-progress | done | diagnostic-skip
blocker: string | null
confidence: integer 1..5 | null
actualMinutes: non-negative integer
notes: bounded string
evidenceReferences: bounded string[]
attemptCount: non-negative integer
diagnosticScore: integer 0..4 | null
gateResult: not-assessed | passed | study-required
completedAt: UTC ISO timestamp | null
contentVersion: bounded version string
```

Completion and blocker are separate. Confidence is self-report and does not
imply a passed gate. A diagnostic score of 3 or 4 can support
`diagnostic-skip` only for an ordinary lesson session. The mandatory proof set
blocks diagnostic skipping for milestone proof and release sessions.

Content-id aliases are declared in `curriculumMetadata.ts`. A legacy id moves
to its canonical id only when the target does not already contain a different
record. Conflicting legacy and canonical records fail closed so that neither
record is silently discarded.

### Weekly review record

Each weekly record is keyed by ISO calendar week as `YYYY-Www`. It retains the
workbook-template planned blocks, completed blocks, evidence count, bounded
reflection, and creation and update timestamps. The workbook's twelve-week
template cycles independently of the ISO week number. UI calculations expose
both values rather than labelling the template index as a calendar week.

## Curriculum content contracts

The accelerated curriculum contract contains exactly 110 ordered sessions,
M0-M9, ten practical diagnostics, P1-P4, 64 resources, technology lanes,
cadence, weekly rhythm and twelve weekly-review templates. Session references
use stable ids. Optional MIG01, ADV01 and ADV02 resources remain optional.

The complete curriculum contract contains stages E0-E4 and 25 domain modules.
Every module contains prerequisites, outcomes, vocabulary, SI equations, a
worked example with independent expected value, retrieval, a practical task,
diagnostic guidance, evidence, a mastery gate, provenance, accessible text and
an educational Stage 1 mapping.

Executable validation checks exact S001-S110 ordering, the 2,750-minute total,
milestone counts, duplicate or missing ids, resource references, prerequisite
existence, graph cycles, reachability from entry modules, dimensional worked
examples and the mandatory proof boundary.

## Engineering project version 2

```text
EngineeringProject
  identity and revision
  variables[]
  calculations[]
  datasets[]
  scenarioSet
  notebook
  evidenceGraph
  optional motorSizing
```

Required project fields are:

- `version`, fixed at 2;
- safe `id`;
- `name` and `description`;
- non-negative integer `revision`;
- canonical UTC `createdAt` and `updatedAt`, where update cannot precede
  creation;
- variables, calculations and datasets;
- one scenario set;
- one notebook; and
- one evidence graph.

Validation sorts identified collections deterministically and rejects unknown
fields, unsafe keys, duplicate ids, broken references, incompatible versions
and non-finite numbers.

## Units and variables

The unit registry is version 1. Each unit declares:

- safe id, label and symbol;
- engineering dimension;
- positive scale to base;
- offset to base; and
- optional physical minimum in base units.

Supported dimensions are dimensionless, length, mass, time, temperature,
force, torque, power, angular speed, angular acceleration and rotational
inertia.

An engineering variable version 1 retains:

- id, label and role (`input`, `assumption` or `derived`);
- dimension, display value, base value and unit id;
- optional minimum and maximum in base units;
- validation status and messages;
- provenance kind and optional reference;
- assumption status (`measured`, `specified`, `assumed` or `derived`);
- optional tolerance or uncertainty, unit and confidence percentage;
- creation and update timestamps;
- optional calculation id, algorithm id and algorithm version reference; and
- optional description.

The supplied base value must match conversion from the display value and unit.
A value outside its declared base range must have `invalid` validation status.

## Calculation records

A calculation record version 1 captures a reproducible result:

- equation;
- algorithm id and algorithm version;
- unit-bearing input and output snapshots;
- assumptions, warnings and model boundaries;
- optional dataset and scenario ids;
- capture timestamp;
- evidence-node ids; and
- project id.

Every snapshot repeats the display value, base value, unit and dimension.
References must resolve inside the same project. A derived variable that points
to a calculation must match the calculation algorithm and version exactly.

## Datasets

Dataset schema version 1 supports numeric, text and Boolean columns. Numeric
columns can declare a registered unit. Cells are a matching primitive or
explicit `null`.

Current kernel limits are:

- 1,000,000 input characters;
- 64 columns;
- 5,000 rows; and
- 2,000 characters in one text cell.

CSV input requires a header and at least one data row. Headers are safe unique
identifiers and each row must have the same cell count. JSON input accepts a
validated dataset object or a non-empty array of compatible records. Mixed
incompatible types, unsafe keys, duplicate columns, non-finite numbers and
unit declarations on non-numeric columns fail closed.

## Scenarios

A scenario set version 1 has exactly one protected baseline and zero or more
named scenarios. An override references an existing variable and carries a
finite value plus a compatible unit. Conversion and declared variable-range
checks happen before the override is accepted.

Comparison resolves baseline and candidate variables to base values and emits
role, dimension, unit, baseline, candidate, delta, optional relative percentage
and changed state. A zero baseline produces `null` relative percentage rather
than division by zero.

Scenario duplication creates a named copy. Rename rejects an empty name.
Deletion rejects the baseline and requires the exact confirmation token from
`scenarioDeletionToken`.

## Notebook

Notebook schema version 1 contains up to 256 blocks. A block is:

- a plain note without a reference; or
- a calculation, dataset or evidence block with a required reference.

Text is bounded to 20,000 characters, normalised to NFC, line endings are
normalised and script, style, markup and bidirectional control characters are
removed. The notebook has no executable cells, remote embeds or HTML renderer.

## Evidence graph

Evidence graph schema version 1 contains nodes and directed edges.

Node kinds are variable, calculation, dataset, scenario, notebook, artefact and
decision. Relations are derives, supports, verifies, documents and compares.

Validation rejects duplicate ids and edges, self-reference, missing endpoints
and directed cycles. Current limits are 1,024 nodes and 4,096 edges.

## Motor-sizing vertical slice

The optional `MotorSizingInput` retains:

- continuous and peak load torque;
- continuous and peak output speed;
- gear ratio;
- drivetrain efficiency;
- load inertia;
- angular acceleration;
- acceleration duty cycle;
- safety factor;
- capture timestamp; and
- project id.

The reference algorithm id is `motor-sizing` and algorithm version is `1.0.0`.
It normalises unit-bearing inputs, calculates acceleration torque, continuous
RMS-duty torque, peak torque, geared motor torque and speed, angular velocity
and mechanical power.

The model rejects negative torque, speed, inertia or acceleration; peak load
below continuous load; non-positive gear ratio; efficiency outside `(0, 1]`;
duty outside `[0, 1]`; and safety factor below 1.

The output is a sizing requirement only. Product selection, thermal limits,
manufacturer curves and certified design acceptance are outside the schema.

## Project bundle version 2

The bundle envelope contains:

```text
format: engineering-mastery-lab/project-bundle
version: 2
project: EngineeringProject version 2
integrity:
  algorithm: SHA-256
  digest: 64 lower-case hexadecimal characters
```

The digest covers canonical format, version and project payload. Import first
bounds the document to 1,000,000 characters, parses JSON, rejects unsafe keys,
checks format and version, recomputes the digest and validates the project.

Import preview can report project, variable, calculation, dataset, scenario,
notebook, evidence-node and motor-sizing conflicts. The in-memory bundle store
supports expected store revision, reject or replace conflict policy and undo.
The workspace page applies a preview to complete in-session state and retains
one rollback project.

## Project Pack version 1

A Project Pack is a data-only JSON document containing:

- stable pack id, semantic pack version and generation timestamp;
- supported engineering-project schema range and application-version range;
- learning sequence and discipline;
- complete engineering project;
- dataset fixtures and notebook templates;
- weighted evidence rubric, with weights totalling exactly 1;
- Markdown and JSON report templates;
- licence and provenance; and
- derived virtual-file manifest and whole-pack integrity hash.

The pack is bounded to 2,000,000 characters. Virtual files are JSON, Markdown
or plain text under safe relative paths. Executable extensions, mismatched media
types, traversal, unsafe object keys, executable text patterns, duplicate paths,
manifest differences and integrity differences are rejected.

The manifest is not an extraction instruction. Import does not write virtual
files or execute content.

## Engineering report version 1

The validated report input retains:

- exact generation timestamp and numeric tolerance;
- project, pack and scenario identity;
- every resolved input in SI and display units;
- assumptions and tolerances;
- equations, algorithm ids and model versions;
- dataset source, provenance and content hash;
- results and status;
- chart data with an accessible table representation;
- validation, warnings, limits and lineage;
- environment state; and
- Project Pack and report-source hashes.

Markdown and JSON artefacts are derived from the same validated input and
receive separate SHA-256 hashes.

## Phase 5 local record foundations

Sync record schema version 1 uses opaque record, actor, device and operation
identifiers, a version vector, canonical UTC update time, tombstone state and a
bounded JSON payload. A tombstone has a null payload and a live record has a
payload.

The local reference store supports:

- creation, update, deletion and explicit restoration;
- equal, left-dominant, right-dominant and concurrent version relationships;
- duplicate, fast-forward, stale and conflict outcomes;
- keep-current, accept-incoming, latest-updated and explicit merged-payload
  conflict strategies;
- operation-id idempotency and rejection of mismatched reuse;
- canonical export with records and processed-operation receipts; and
- deterministic in-memory recovery.

Current ecosystem limits include:

- 64 KiB per JSON object payload;
- 2 MiB per export;
- 1,000 records and 2,000 processed operations per export;
- 32 actors per version vector; and
- JSON depth 8.

Cohort schema version 1 models memberships, assignments, completion summaries
and evidence reviews. The local provider accepts synthetic fixtures only.
Educator aggregates are suppressed below the minimum learner group size of
five and omit participant and outcome counts when suppressed.

These schemas are provider-neutral local foundations. They do not implement
hosted identity, transport, encryption, durable storage, authorisation,
collaboration, billing or telemetry.

## Desktop workbench separation

The desktop `workbench.json` manifest version 1 and
`evidence/latest-run.json` receipt version 2 are distinct from the browser
engineering project and bundle.

Desktop data becomes accessible only after a native folder picker establishes
session authority. Recent paths, progress imports, project bundles, Project
Packs and sync record ids cannot establish that authority.

## Compatibility rule

Writers emit only their current schema version. Readers accept only explicitly
implemented versions. Unknown versions fail closed with an actionable error.
Migration must be deterministic, covered by fixtures, preserve all declared
supported data and never silently grant a new capability.
