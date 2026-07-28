# Migration guide

## Scope

This guide covers implemented local migrations for:

- browser progress version 1 or version 2 to version 3; and
- engineering project bundle version 1 to version 2.

Project Pack version 1, engineering report version 1, sync record version 1,
cohort version 1, desktop workbench manifest version 1 and desktop latest-run
receipt version 2 do not have a migration path. Unsupported versions fail
closed.

The executable source of truth is `src/lib/storage.ts` and
`src/lib/kernel/bundle.ts`.

## Safety model

- Import validates a bounded complete document before replacing state.
- Unknown current-schema fields fail closed.
- Unsafe prototype-pollution keys are rejected.
- Source records in browser storage are not deleted during fallback migration.
- Settings retains one in-session progress rollback after confirmed import or
  reset.
- The engineering workspace previews a bundle or Project Pack before applying
  it and retains one in-session project rollback.
- A local progress record, project bundle or Project Pack never grants desktop
  workspace authority.

Export a current backup before an intentional migration when the current state
is valid. Do not edit a migration file to bypass a validation error. Repair the
source or keep it unimported.

## Progress version 1 to version 3

### Recognised version 1 fields

- `skillRatings`
- `challenges`
- `reflections`
- `artefacts`
- `sprintChecklist`
- `theme`

Each recognised field passes the current bounded validator.

### Deterministic additions

Migration creates progress version 3 and:

- marks onboarding complete so an existing learner is not forced through new
  onboarding;
- starts profile as null;
- starts pathways, laboratory positions, bookmarks, recent items, Build
  projects, manual evidence, achievements and engineering workspaces empty;
- starts accessibility preferences with reduced motion and high contrast false;
  and
- retains the validated theme or uses light when missing.

### Unknown version 1 fields

Unknown root fields are preserved under `legacy` when their keys and values
pass bounded legacy validation.

Legacy validation accepts JSON-compatible null, Boolean, finite number, bounded
string, bounded array and bounded record values. It rejects unsafe keys,
unsupported values, excessive collection sizes and nesting deeper than the
configured limit.

The migration does not interpret unknown values as new features.

## Progress version 2 to version 3

Version 2 declares all progress fields present before engineering workspace
records:

- version 1 learning fields and theme;
- profile and onboarding;
- pathways and laboratory positions;
- bookmarks and recent items;
- Build projects, manual evidence and achievements;
- accessibility; and
- legacy.

Migration:

1. rejects unsupported version 2 root fields;
2. validates every declared value through the current validators;
3. preserves validated version 2 content;
4. writes `version: 3`; and
5. adds an empty `engineeringWorkspaces` record.

No version 2 learner, progress, project, evidence or preference field is
dropped deliberately.

## Progress version 3 import

Version 3 import requires exactly the declared root fields. Missing optional
sections receive their current empty defaults where the validator permits.
Engineering workspace entries require:

- `schemaVersion: 1`;
- bounded `projectId`;
- bounded `bundleJson`; and
- valid UTC `updatedAt`.

The progress validator bounds one embedded bundle string to 750,000 characters.
The engineering workspace separately validates the bundle before using it.

## Browser storage fallback

The loader checks:

```text
engineering-mastery-lab/progress/v3
engineering-mastery-lab/progress/v2
engineering-mastery-lab/progress/v1
```

The first present, bounded and valid value is returned. Invalid or unavailable
browser storage falls back to a clean in-memory version 3 state. Loading an old
key does not itself delete that key.

Saving writes the version 3 key.

## Project bundle version 1 to version 2

Bundle version 1 uses the same format identifier:

```text
engineering-mastery-lab/project-bundle
```

The importer:

1. bounds and parses the complete JSON;
2. rejects unsafe keys;
3. validates format and version;
4. verifies the optional version 1 digest when present;
5. validates the version 1 project shape;
6. constructs engineering project version 2; and
7. runs full current project and cross-reference validation.

### Version 1 fields retained

- id, name and optional description;
- optional creation and update timestamps;
- variables and calculations;
- datasets;
- scenario set;
- notebook;
- evidence graph; and
- optional motor-sizing input.

### Deterministic defaults

- `description` becomes an empty string when absent.
- `revision` becomes 0.
- Missing creation time becomes `1970-01-01T00:00:00.000Z`.
- Missing update time uses creation time, then the same epoch default.
- Missing variables, calculations and datasets become empty arrays.
- Missing scenario set receives one baseline scenario with id `baseline`.
- Missing notebook receives version 1 with no blocks.
- Missing evidence graph receives version 1 with no nodes or edges.

The migrated project must still satisfy current reference validation. Defaults
do not repair contradictory or dangling source data.

### Bundle version 2 output

A migrated project exports as bundle version 2 with:

- engineering project version 2;
- deterministic canonical JSON; and
- required SHA-256 digest over format, version and project.

Re-exporting does not preserve the old bundle byte layout. It preserves
validated project meaning and produces the current format.

## Project Pack version 1

There is no Project Pack migration.

- Schema version must equal 1.
- Compatibility must include the included engineering project version.
- Manifest and integrity must match content exactly.
- Unknown future versions fail closed.

If a future Project Pack format is required, implement a separate version and
explicit migration only when every learning, engineering, evidence, licence
and provenance field can be preserved.

## Engineering report version 1

There is no report-input migration. The report generator accepts validated
schema version 1 only. Reports should be regenerated from the current validated
Project Pack and engineering project instead of editing an old report into a
new shape.

## Phase 5 local records

Sync record envelope, sync export, cohort snapshot and curated content pack are
all version 1. Unknown versions fail closed.

Recovery validates:

- exact schema and keys;
- opaque identifiers;
- version vectors;
- tombstone and payload relationship;
- record and operation limits;
- unique records and operation ids; and
- one matching operation receipt for every recovered record.

There is no migration from an arbitrary hosted-provider record. A future
provider needs a separately versioned mapping with tenant, ownership,
authorisation, conflict, retention, deletion and audit semantics.

## Desktop manifest and receipt

The authorised desktop workspace continues to use:

- `workbench.json` manifest schema version 1; and
- `evidence/latest-run.json` receipt schema version 2.

Unsupported desktop versions fail closed. Browser progress, engineering
project or Project Pack migration must not rewrite these files.

## Verification matrix

For each implemented migration:

1. Import a complete valid prior-version fixture.
2. Verify every supported source field in the migrated object.
3. Verify deterministic defaults for each absent field.
4. Run the same import twice and compare canonical output.
5. Export the migrated current version and clean-import it.
6. Recalculate retained engineering results and compare within the declared
   tolerance.
7. Verify invalid timestamps, types, units, references and non-finite numbers
   fail.
8. Verify unsafe keys at root and nested boundaries fail.
9. Verify oversized documents and collections fail.
10. Verify unknown future versions fail.
11. Verify current state remains unchanged after failed preview or cancelled
    apply.
12. Verify the in-session rollback restores the previous state after a
    confirmed apply.

## Rollback

Progress import or reset:

1. Use the Settings in-session undo before reloading the application.
2. If that value is no longer available, import the last valid version 3 backup.
3. Keep invalid or unsupported source files outside application state for
   review. Do not force-import them.

Project bundle or Project Pack apply:

1. Use the workspace in-session undo before reloading.
2. If unavailable, import the last valid project bundle or restore the prior
   valid progress backup containing the workspace record.
3. Recalculate the restored baseline and alternate scenario before relying on
   results.

Desktop workbench files:

- use the prior valid file or version-control copy;
- do not infer a migration from browser schemas; and
- reauthorise the workspace through the native folder picker before access.

## Release requirement

Any schema or migration change requires updated fixtures, unit tests, clean
import and recalculation evidence, browser import and rollback checks,
documentation and a full affected acceptance rerun against the exact reviewed
tree.
