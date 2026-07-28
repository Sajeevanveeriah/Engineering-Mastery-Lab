# Kernel authoring guide

## Purpose

The shared engineering kernel in `src/lib/kernel/` provides pure, versioned,
deterministic engineering data and calculations that can be used by Learn,
Build, Analyse and Prove. Kernel code must remain usable in the static web
application, Tauri desktop application, unit tests, Project Packs and reports
without React, browser storage, network or native-process dependencies.

## Non-negotiable boundary

Kernel modules:

- accept plain data and return plain data;
- import neither React nor Tauri;
- do not read browser storage, files, environment variables or the network;
- do not launch processes or call provider services;
- reject unknown fields, unsafe keys and unsupported schema versions;
- reject non-finite numeric values;
- state units, dimensions, assumptions, limits and algorithm versions; and
- remain deterministic for identical explicit inputs.

UI state, download actions, confirmation dialogs and persistence belong outside
the kernel. Native tool execution belongs behind `PlatformBridge` and the Rust
allow-list.

## Module responsibilities

| Module | Responsibility |
|---|---|
| `limits.ts` | Central bounds for kernel data |
| `validation.ts` | Safe records, keys, identifiers, text, numbers, timestamps and arrays |
| `units.ts` | Versioned unit registry and compatible conversion |
| `variables.ts` | Engineering variables, uncertainty metadata and calculation records |
| `datasets.ts` | Bounded dataset schemas plus CSV and JSON import or export |
| `scenarios.ts` | Baseline, named scenarios, overrides and comparison |
| `notebook.ts` | Controlled plain-text and typed-reference blocks |
| `evidenceGraph.ts` | Directed provenance nodes, edges and cycle checks |
| `motorSizing.ts` | Reference vertical-slice engineering calculation |
| `bundle.ts` | Engineering project schema, canonical bundle, migration, conflict preview and undo store |
| `verticalSlice.ts` | Complete deterministic motor-sizing fixture |
| `index.ts` | Public kernel exports |

## Authoring a unit

Add a unit only when its engineering dimension and conversion to the declared
base unit are clear.

Each unit needs:

```ts
interface EngineeringUnit {
  id: string;
  label: string;
  symbol: string;
  dimension: EngineeringDimension;
  scaleToBase: number;
  offsetToBase: number;
  minimumBase?: number;
}
```

Rules:

1. Use a safe id accepted by `requireIdentifier`.
2. Reuse an existing dimension or add a reviewed dimension deliberately.
3. Store a positive scale and finite offset.
4. Add a physical minimum where the dimension has one, such as absolute
   temperature.
5. Verify conversion both ways with exact known points and nearby values.
6. Test incompatible dimensions, non-finite values, physical lower bounds and
   order of magnitude.

Unit ids are identifiers, not display strings. Use safe ids such as
`rad-per-s`; keep mathematical notation in `symbol`.

## Authoring a variable

An engineering variable must retain enough context for review:

- role and dimension;
- display value and unit;
- independently validated base value;
- declared valid range;
- validation status and messages;
- provenance and assumption status;
- optional tolerance or uncertainty;
- creation and update timestamps; and
- calculation-version reference for a derived value.

Do not infer a base value from an unrelated unit or round it before storage.
Validate range in base units. A value outside the range must be marked invalid,
not silently clamped.

Use `measured`, `specified`, `assumed` and `derived` precisely. A default chosen
for convenience is an assumption, not a measurement.

## Authoring a calculation

Every calculation needs a stable algorithm id and explicit algorithm version.
Increment the algorithm version when equations, interpretation, boundary
conditions, rounding, assumptions or output meaning change materially.

A calculation record must capture:

- the equation or model description;
- complete unit-bearing input snapshots;
- complete unit-bearing output snapshots;
- assumptions, warnings and limits;
- optional dataset and scenario references;
- evidence relationships;
- exact capture timestamp; and
- owning project id.

Never store only the result. Reproduction needs the original display value,
unit, base value, dimension and model version.

For consequential engineering numbers:

1. retain signs, units and coordinate or reference-frame meaning;
2. check zero, negative, missing, extreme and invalid inputs;
3. check dimensional consistency and order of magnitude;
4. verify a known fixture through a second calculation path where practical;
5. separate exact values, assumptions and estimates; and
6. state exclusions instead of fabricating precision.

## Authoring a dataset import

Dataset parsers must be bounded before expensive processing.

For CSV:

- require a header and at least one row;
- require safe unique headings;
- require equal cell counts;
- infer one compatible primitive type per column;
- allow units only on numeric columns; and
- preserve an empty cell as `null`.

For JSON:

- reject unsafe keys before schema interpretation;
- accept either a full validated dataset or a non-empty record array;
- build a deterministic sorted column list; and
- reject mixed incompatible column types.

Do not fetch a remote dataset inside the parser. Network acquisition and
consent belong in a separate provider boundary.

## Authoring scenarios

Every scenario set has one protected baseline. Named scenarios carry only
validated overrides.

An override:

- references an existing variable;
- carries a finite display value and registered unit;
- has the same dimension as the variable; and
- remains within the variable base-unit range.

Comparison must report the base values, delta and relative percentage. When the
baseline is zero, report relative percentage as unavailable rather than
dividing by zero.

Do not present deterministic scenario comparison as optimisation, sensitivity
analysis or uncertainty propagation.

## Authoring notebook blocks

Notebook content is controlled data, not executable content.

- Notes have plain text and no reference.
- Calculation, dataset and evidence blocks require a valid reference.
- Apply `sanitiseNotebookText`.
- Do not add HTML rendering, script execution, remote embeds or code cells to
  the kernel.

A richer editor would require a separate content model, sanitiser, threat model
and accessibility review.

## Authoring evidence lineage

Add a node for every retained provenance object that needs a relationship.
Use only the defined node kinds and relations unless a schema version is
deliberately changed.

Every edge must:

- resolve both endpoints;
- avoid self-reference;
- be unique by source, relation and target; and
- preserve an acyclic directed graph.

Keep the accessible table as the baseline presentation. A visual graph may be
added in the UI only with an equivalent labelled text or table representation.

## Authoring an engineering project

Construct or update a complete candidate and pass it through
`validateEngineeringProject`. Do not mutate a partially validated nested
record.

Validation order matters:

1. root shape, version and timestamps;
2. variables;
3. calculation snapshots;
4. datasets;
5. scenarios against variables;
6. notebook;
7. evidence graph;
8. optional domain input; and
9. cross-project references.

Increment project revision for an accepted content change and set an explicit
UTC update timestamp. Do not use an implicit clock inside pure calculation
functions. The UI may supply a timestamp at the mutation boundary.

## Adding a domain calculation

Use the motor-sizing vertical slice as the reference pattern:

1. Define a typed input with unit-bearing quantities.
2. Validate each quantity against its expected dimension.
3. Normalise to base values once.
4. Validate physical and model boundaries before calculation.
5. Calculate with finite-number checks.
6. Return a typed result containing normalised inputs, assumptions, warnings,
   limits, algorithm id, algorithm version, timestamp and project id.
7. Build a deterministic project fixture containing variables, calculation
   snapshots, dataset, baseline and alternate scenario, notebook and evidence
   graph.
8. Export and clean-import the bundle.
9. Recalculate the baseline and alternate scenarios and compare expected
   values within the declared tolerance.

Do not add automatic commercial product selection, silent safety factors or
unstated acceptance criteria.

## Project bundle integration

`exportProjectBundle` validates the complete project, canonicalises the
payload and computes its digest. `importProjectBundle` verifies bounds, keys,
format, version, digest and project.

When changing the project schema:

- add a new project and bundle version;
- retain an explicit deterministic migration from each supported source
  version;
- document defaults and data that cannot migrate;
- add fixtures for current, previous, malformed, oversized, unsafe-key and
  integrity-failure cases;
- verify clean import reproduces calculations; and
- never accept an unknown version by ignoring fields.

## Test requirements

At minimum, a kernel change needs:

- valid representative inputs;
- every material invalid boundary;
- unit and dimension mismatch cases;
- zero, negative, extreme and non-finite values where applicable;
- duplicate ids and unsafe keys;
- broken and cyclic references;
- deterministic canonical export;
- import integrity failure;
- supported migration fixture;
- clean import and recalculation; and
- a nearby regression path.

Run the narrow test first, then the complete kernel tests, TypeScript
typecheck, lint, full unit suite, production build, affected browser flows and
`git diff --check`.

## Documentation requirement

Update the data and schema model, migration guide, Project Pack format,
architecture, known limitations and release checklist when a change affects a
version, field, limit, migration, security boundary, calculation meaning or
acceptance test.
