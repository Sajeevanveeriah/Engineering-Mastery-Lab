# Project Pack format

## Purpose and boundary

A Project Pack is a bounded, data-only JSON document that carries a learning
sequence, a complete engineering project, fixtures, notebook templates,
evidence rubric, report templates, licence and provenance.

It is not a ZIP file, installer, plugin, executable bundle or native workspace.
Its manifest describes virtual files for inspection and integrity. Import does
not extract those files, execute content, contact a network service or grant
Tauri authority.

The executable source of truth is
`src/lib/interchange/projectPack.ts`.

## Envelope

Project Pack schema version is 1.

```text
ProjectPack
  schemaVersion: 1
  packId
  packVersion
  generatedUtc
  compatibility
  content
  manifest
  integrity
```

`packId` is a safe stable identifier. `packVersion` is a semantic version.
`generatedUtc` is an exact canonical ISO-8601 UTC timestamp.

## Compatibility

```text
kernelSchemaMinimum
kernelSchemaMaximum
applicationVersionRange
```

The included engineering project version must be inside the declared kernel
range. The current motor-sizing pack declares project schema 2 as both minimum
and maximum.

`applicationVersionRange` is descriptive compatibility metadata. The current
validator bounds it as text; it does not execute a package manager or fetch a
compatible application.

## Content

### Learning sequence

One or more uniquely identified steps declare:

- title;
- objective; and
- stage: `learn`, `build`, `analyse` or `prove`.

Order is retained because it is part of the learning design.

### Engineering project

The pack contains one complete validated engineering project version 2.
Variables and calculations must be non-empty. Cross-references, units,
scenarios, notebook and evidence graph are validated by the kernel before a
pack is created or imported.

### Discipline

The discipline is bounded descriptive text. It does not restrict the project's
multidisciplinary use or grant an entitlement.

### Dataset fixtures

At least one version 1 dataset is required. Dataset ids must be unique. Every
dataset passes the kernel's column, row, type, unit, cell, size and unsafe-key
checks.

### Notebook templates

At least one uniquely identified template is required. Each template contains
a validated version 1 notebook with controlled plain text or typed references.

### Evidence rubric

Evidence rubric version 1 contains uniquely identified criteria:

- title;
- requirement; and
- positive weight no greater than 1.

Criterion weights must total 1 within the validator's numeric tolerance.
Rubric metadata is an assessment aid. It is not accreditation or professional
certification.

### Reports

At least one uniquely identified Markdown or JSON report template is required.
JSON bodies must parse and pass deep unsafe-key checks.

These templates are pack content. The deterministic engineering report
generator in `src/lib/interchange/reports.ts` produces separate validated
report artefacts.

### Licence and provenance

The pack declares:

- licence SPDX id, name and text;
- provenance source and author;
- creation timestamp; and
- referenced licence ids.

Provenance must reference the declared licence. This metadata does not
authenticate the producer. A trusted distribution channel and signature model
would be separate future work.

## Virtual-file manifest

The manifest is derived from validated content. It cannot independently choose
what the pack contains.

Each entry has:

```text
path
mediaType
bytes
sha256
```

Allowed media types and matching extensions are:

| Extension | Media type |
|---|---|
| `.json` | `application/json` |
| `.md` | `text/markdown` |
| `.txt` | `text/plain` |

The derived manifest includes:

```text
learning/sequence.json
project/project.json
kernel/variables.json
kernel/calculations.json
kernel/scenarios.json
kernel/evidence-graph.json
datasets/<dataset-id>.json
notebooks/<template-id>.json
evidence/rubric.json
reports/<report-id>.md or .json
licence/LICENCE.txt
licence/metadata.json
provenance/provenance.json
```

Paths must use the shared safe relative-path rules:

- no empty path;
- no absolute, drive, UNC or home-relative form;
- no backslash;
- no empty, current-directory or parent-directory segment;
- no NUL;
- no NTFS alternate stream; and
- no Windows reserved device name.

Executable extensions are rejected, including common application, script,
library, installer and shortcut forms.

The byte count is the UTF-8 length of the canonical virtual-file body. The
SHA-256 value is lower-case hexadecimal over that exact body.

## Whole-pack integrity

```text
algorithm: sha256
contentSha256: 64 lower-case hexadecimal characters
```

The whole-pack hash covers:

- schema version;
- pack identity and version;
- generation timestamp;
- compatibility;
- validated content; and
- derived manifest.

Object keys are canonicalised. Array order is retained. Negative zero is
normalised to zero. Non-finite and non-JSON values are rejected.

The hash detects byte-equivalent content changes. It is not authentication,
proof of authorship, a digital signature, malware scanning, certification or
protection against a producer who can replace the pack and digest together.

## Size and content limits

The serialised Project Pack is bounded to 2,000,000 characters. Additional
limits apply through the kernel and Project Pack validators, including:

- 64 dataset fixtures;
- 64 notebook templates;
- 128 learning steps;
- 128 rubric criteria;
- 64 report templates;
- 1,024 manifest entries;
- 500,000 characters in one report body;
- 100,000 characters in licence text; and
- kernel dataset, notebook, graph and collection limits.

Every string is also inspected recursively for conservative executable-content
patterns. Script markup, `javascript:` forms, selected inline event-handler
forms and shebang lines are rejected. This filter intentionally keeps packs
data-only. It is not a general malware scanner.

## Creation flow

```text
author ProjectPackSource
  -> validate source and engineering project
  -> reject executable content
  -> derive virtual files
  -> validate paths and media types
  -> compute bytes and file hashes
  -> canonicalise payload
  -> compute whole-pack hash
  -> return ProjectPack version 1
```

Use `createProjectPack` and `exportProjectPack`. Do not construct a serialised
envelope by hand.

## Import flow

```text
bound serialised input
  -> parse JSON
  -> reject unsafe keys
  -> validate schema version
  -> validate manifest paths before content
  -> validate source and compatibility
  -> rebuild expected manifest and integrity
  -> compare supplied manifest
  -> compare whole-pack hash
  -> return validated pack
  -> preview in UI
  -> obtain confirmation if content differs
  -> apply complete in-session project
  -> retain undo project
```

No current project state changes before validation and preview complete.

## Local catalogue conflict handling

`resolveProjectPackCatalogue` groups packs by stable pack id.

- A unique id resolves directly.
- A duplicate id fails unless the caller supplies an explicit selected
  `contentSha256`.
- The selected hash must identify exactly one pack.

There is no silent latest-version or filesystem-order precedence.

## Engineering report relationship

Project Packs provide the project, dataset fixtures, provenance and pack hash
used by engineering report schema version 1.

`createEngineeringReportInput` resolves one scenario and retains:

- SI and display values;
- assumptions and tolerances;
- equations and model versions;
- dataset provenance and hashes;
- results and status;
- chart data tables;
- validation, warnings, limits and lineage;
- environment values; and
- Project Pack and report-source hashes.

`generateEngineeringReports` produces deterministic Markdown and canonical
pretty JSON, then hashes each complete artefact.

Report generation does not run a simulation or external tool. The caller must
provide results derived from validated calculations and label their actual
verification boundary.

## Migration policy

Project Pack version 1 is the only supported version. There is no Project Pack
migration. Unknown versions fail closed.

If the format changes:

1. define a new schema version;
2. document every changed field and default;
3. implement an explicit deterministic migration only if all required meaning
   can be preserved;
4. preserve licence, provenance and compatibility;
5. regenerate and verify the manifest;
6. verify clean import and result reproduction; and
7. retain fixtures for supported old, current, malformed, unsafe and future
   versions.

## Authoring checklist

- Use stable safe ids and a semantic pack version.
- Use an exact UTC generation timestamp.
- Declare the exact supported kernel range.
- Include a complete validated project with variables and calculations.
- Include at least one dataset fixture, notebook template, rubric criterion and
  report template.
- Make rubric weights total 1.
- Declare and reference the licence.
- State provenance without claiming authentication.
- Keep every virtual file data-only.
- Export through the canonical implementation.
- Clean-import the exported pack.
- Recalculate the included baseline and alternate scenarios.
- Generate Markdown and JSON reports twice from identical explicit inputs and
  compare bytes and hashes.
- Test traversal, executable, unsafe-key, schema, size, manifest and integrity
  failures.
- Inspect the rendered preview, manifest table and report table alternative.
