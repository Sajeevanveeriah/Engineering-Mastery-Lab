# Data and schema model

## Scope and source of truth

This document describes the local data models implemented in:

- `src/lib/storage.ts`
- `src/data/rebootCurriculum.ts`
- `src/data/masteryCurriculum.ts`
- `src/data/curriculumMetadata.ts`
- `src/data/academy/`
- `src/data/academyMedia.ts`
- `src/lib/curriculum.ts`
- `src/lib/academy/`
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
| Browser progress | 5 | Versions 1, 2, 3 and 4 import deterministically to version 5 | Browser or desktop-webview `localStorage` |
| Accelerated reboot curriculum | `2026.07.26` | Canonical reviewed workbook extraction; no runtime XLSX migration | Versioned TypeScript content |
| Complete mastery curriculum | `2026.07.28` | Stable content ids and explicit aliases | Versioned TypeScript content |
| Academy curriculum | Schema 1, content `2026.07.30` | Stable ids; stage payloads are loaded and validated against composed manifests | Versioned TypeScript content |
| Academy progress | Inside progress 5 | Added as an empty validated state during version 1 through version 4 migration | Browser or desktop-webview `localStorage` |
| Curriculum learning record | 1 inside progress 5 | Aliases migrate only when unambiguous | Browser or desktop-webview `localStorage` |
| Weekly review record | 1 inside progress 5 | Added empty during prior-progress migration | Browser or desktop-webview `localStorage` |
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

## Browser progress version 5

`ProgressState` version 5 contains:

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
- weekly review records;
- Academy lesson, assessment, skill, review, recommendation, unfinished-lab
  and exact-resume state; and
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
progress/v5 -> progress/v4 -> progress/v3 -> progress/v2 -> progress/v1
  -> clean version 5 state
```

Version 4 migration uses the retained exact version 4 validator, preserves
every declared version 4 section, extends the allowed recent-item types and
adds an empty Academy state. Version 3 migration validates and retains every
declared version 3 field. Version 2 migration validates and retains every
declared version 2 field, then starts `engineeringWorkspaces` as an empty
record. Version 1 migration retains recognised legacy fields, moves bounded
unknown root fields into `legacy`, marks onboarding complete and starts newer
collections from deterministic empty values. Earlier migrations add empty
curriculum and weekly-review collections before the version 5 upgrade. No
prior record is interpreted as Academy assessment, mastery or completion
evidence.

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

### Academy progress state

The `academy` object has exactly these top-level fields:

```text
lessonRecords
assessmentAttempts
questionAttempts
questionInteractions
skillRecords
unfinishedLabs
recommendationReceipts
reviewStates
resumeCursor
```

Unknown fields are rejected. The collection bounds below are the executable
`PROGRESS_IMPORT_LIMITS` values in `src/lib/storage.ts`, not target population
claims:

| Academy collection | Maximum |
|---|---:|
| Lesson records | 256 |
| Assessment histories | 512 |
| Attempts in one assessment history | 20 |
| Question histories | 512 |
| Attempts in one question history | 20 |
| Question interaction records | 512 |
| Revealed hints in one interaction record | 16 |
| Response-summary entries in one attempt | 128 |
| Video positions in one lesson | 32 |
| Skill records | 512 |
| Evidence entries in one skill record | 64 |
| Transitions in one skill record | 64 |
| Unfinished laboratory records | 128 |
| Recommendation receipts | 100 |
| Review records | 512 |

The entire imported progress JSON remains bounded to 1,000,000 characters.
These collection limits are validated before state replacement.

#### Lesson record

A lesson record stores canonical course, unit and lesson ids, start, update and
optional completion timestamps, last block id, a normalised scroll position
from 0 through 1, bounded optional-video positions, notes, bookmark state and
three completion requirements:

```text
knowledgeChecksPassed
practiceCompleted
appliedEvidenceSatisfied
```

`completionEarned` is valid only when all three requirements are true, and
`completedAt` exists exactly when completion is earned. Timestamps cannot move
backwards. A media position stores seconds, optional duration and update time;
position cannot exceed a known duration.

The resume cursor stores one canonical course, unit, lesson, block and route.
It must reference an existing started lesson, match that record's identity and
last block, and cannot be newer than the lesson record. Course and unit progress
is derived from lesson records; course availability and completion also use
prerequisite-course and course-challenge results. No independent course or unit
completion record is stored.

#### Assessment history

Assessment histories are keyed by assessment or question id. Every attempt
stores an attempt id, matching assessment id, bounded response summary, score
from 0 through 100, unique hint ids, feedback state, solution-reveal state and
start and submit timestamps. Reveal cannot precede shown feedback. Attempts are
chronological and have unique ids. Supported authored question contracts are:

- single choice;
- multiple selection;
- numeric with declared unit conversions and tolerances;
- ordering;
- matching;
- short response;
- diagram;
- static code analysis; and
- deterministic seeded calculation.

`questionAttempts` retains the bounded, learner-visible history for each exact
question identity, including base or retry index, response summary, correctness,
score, misconception keys, variant seed and hint ids. `questionInteractions`
stores the latest resumable UI state for each stable V2 question id: assessment
context, base or retry mode, revealed hint ids and count, solution-reveal state,
retry-disclosure state, latest score and correctness, and update time. A record
cannot change its context or scenario identity, and timestamps cannot move
backwards. V2 attempts additionally require the canonical lesson, assessment,
question, base or retry and hint identities. The deterministic event receipt is
used as the attempt and mastery idempotency key, and the grader's actual
32-bit variant seed is retained rather than a placeholder.

Question content and the grading algorithms are versioned application content,
not user-authored executable input. Displayed code is never executed.

#### Skill mastery and review

A skill record stores its current mastery state, bounded evidence, legal
transition history, a history-truncated flag, optional review due time and
update time. The mastery states are:

```text
not-started -> introduced -> practising -> proficient -> mastered
proficient or mastered -> review-due when its interval expires
review-due -> the achievement state supported by the next evidence evaluation
```

The arrows are a conceptual progression, not the complete transition table.
Explicit current evidence may move an achieved skill back to introduced,
practising or proficient, and the transition reason is retained. `review-due`
preserves the underlying achieved state in the mastery evaluator.

The default evaluator uses:

- at least one instructional, knowledge-check or assessment record for
  introduced;
- a 60 percent average across up to the latest three guided-practice records
  for practising;
- two independent scored activities at 80 percent or higher for proficient;
  and
- a latest delayed review at 90 percent or higher, plus passed applied evidence
  when the skill requires it, for mastered.

Review intervals are a documented configurable heuristic. Proficient intervals
are 7, 14 and 30 days. Mastered intervals are 14, 30, 60 and 120 days. A review
record separately tracks lesson, unit or skill target, scheduled, due,
completed or snoozed state, due time, last review time and update time. Review
state changes are restricted to the transition table in `src/lib/storage.ts`.

#### Laboratory handoff and recommendation receipt

An unfinished laboratory record binds a lab to canonical Academy identity,
status, optional last step, blocker, notes and timestamps. A blocked status
requires a blocker and other statuses reject one. Opening a handoff does not
award lesson completion or skill mastery. The structured return path requires
an observed result, comparison with a criterion and a retained evidence
reference before applied evidence can be recorded.

A recommendation receipt stores a unique receipt id, algorithm version, input
fingerprint, candidate ids, selected recommendation ids, reason codes and
generation time. Selected ids must come from the candidate set. The same
algorithm version and input fingerprint cannot be recorded twice with
conflicting output. Receipts document an accepted deterministic result; they
are not remote analytics.

## Curriculum content contracts

The accelerated curriculum contract contains exactly 110 ordered sessions,
M0-M9, ten practical diagnostics, P1-P4, 64 resources, technology lanes,
cadence, weekly rhythm and twelve weekly-review templates. Session references
use stable ids. Optional MIG01, ADV01 and ADV02 resources remain optional.

The retained mastery curriculum contains stages E0-E4 and 25 domain modules.
Those stable module ids are also the Academy unit identities.

The self-contained Academy contract contains five ordered courses, 25 units and
175 lessons, exactly seven lessons per unit. The five stage payloads contain
21, 35, 56, 49 and 14 lessons respectively. Every lesson has stable identity,
two to five measurable objectives, resolved prerequisites and skills, complete
native blocks, six authored questions, sources and previous or next lesson
links. Formulae retain variables with SI units, assumptions, reviewed
derivations and worked examples with dimensional and independent checks.

The composed manifests cover:

- the course, unit and skill prerequisite graphs;
- 25 unit quizzes, 25 unit tests and five course challenges;
- mandatory subject requirements mapped to lesson, assessment, skill and
  internal applied route;
- all 110 ordered reboot sessions mapped to internal lessons, assessments,
  review skills and applied routes;
- formula and skill-assessment evidence derived from loaded lessons;
- sources, optional media placements and required internal routes; and
- exact legacy E0-E4 unit identities.

Executable validation checks exact S001-S110 ordering, the 2,750-minute total,
milestone counts, duplicate or missing ids, resource references, prerequisite
existence, graph cycles, reachability from entry modules, dimensional worked
examples and the mandatory proof boundary. Academy validation separately checks
the 5-course, 25-unit and 175-lesson contract, resolved sources and media,
assessment question references, prerequisite graphs, formula structure,
coverage mappings and required route reachability.

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
