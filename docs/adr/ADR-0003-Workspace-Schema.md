# ADR-0003: Portable workspace and versioned evidence files

Date: 2026-07-11

Status: Accepted, amended by the completion branch

## Context

Engineering projects must remain portable, reviewable in version control and
recoverable after a failed write. Project intent and actual run evidence also
need separate schemas so a configured link is not misrepresented as a verified
result.

The desktop renderer is not trusted to establish access merely by providing an
absolute path. A recent-project identifier from browser storage must not become
persistent filesystem authority.

The Phase 2 through Phase 4 local foundations add a separate browser-local
engineering project model and portable data formats. Those formats must remain
distinct from the authorised desktop workspace manifest and run receipt.

## Decision

### Directory structure

```text
<project>/
  workbench.json
  requirements/
  circuits/
  pcb/
  simulations/
  results/
  evidence/
    latest-run.json
  reports/
```

Additional unrelated files in a selected directory are not deleted during
project creation.

### Manifest schema

`workbench.json` uses manifest schema version 1.

- It contains project metadata, requirements and simulation or validation
  configurations.
- File references are relative POSIX-style paths. Absolute paths, traversal,
  backslashes, drive and UNC forms, NTFS alternate streams and Windows device
  names are rejected.
- Timestamps are ISO-8601 UTC values.
- Serialisation is deterministic so equivalent manifests diff cleanly.
- A newer, missing or malformed schema fails with an actionable error. There
  is no silent migration in v0.1.

### Run receipt schema

`evidence/latest-run.json` uses a separate receipt schema version 2.

- It stores one latest run, not a history.
- It records the simulation identifier, capture time, exact adapter result,
  the captured simulation and requirement definition, SHA-256 hashes of
  declared inputs that existed immediately before execution, and declared
  inputs that were missing.
- Validation checks the manifest simulation and capability relationship, safe
  paths, timestamps, hashes, result shape, collection limits and an 8 MiB
  total size ceiling.
- Non-finite result numbers use a lossless tagged JSON representation.
- Corrupt or unsupported receipts fail closed and are not converted into a
  synthetic result.

### Browser-local engineering project

The shared engineering kernel uses engineering project schema version 2. It
contains versioned variables, calculation records, datasets, a scenario set,
notebook blocks, an evidence graph and optional motor-sizing input. Project
references are validated as a connected record:

- calculations must belong to the project and reference existing variables,
  datasets, scenarios and evidence nodes;
- derived variable calculation-version references must match the recorded
  calculation algorithm and version;
- notebook references must resolve to an allowed calculation, dataset or
  evidence node; and
- the evidence graph must resolve every endpoint and remain acyclic.

The project model is pure TypeScript and grants no desktop filesystem or
process authority.

### Project bundle schema

The portable project bundle uses schema version 2 and contains one engineering
project version 2 plus a SHA-256 digest over canonical JSON.

- Import verifies the exact payload digest before project validation.
- Version 1 bundles migrate deterministically to project version 2. Missing
  collections receive documented empty defaults, missing timestamps receive a
  deterministic epoch default and revision starts at zero.
- Import preview identifies differences at project, variable, calculation,
  dataset, scenario, notebook, evidence-node and motor-sizing scope.
- Application replaces the complete in-session project only after preview and
  can retain one in-session undo value.
- The digest is an integrity check, not authentication, a signature,
  certification or proof of authorship.

### Project Pack and report schemas

Project Pack schema version 1 is a bounded, data-only JSON envelope containing
compatibility metadata, a complete engineering project, learning sequence,
dataset fixtures, notebook templates, evidence rubric, report templates,
licence and provenance.

Its manifest describes virtual JSON, Markdown and plain-text files using safe
relative paths, media types, byte counts and SHA-256 hashes. Import rejects
executable extensions or content, traversal, unsafe object keys, incompatible
schema ranges, mismatched manifests and mismatched integrity values. It does
not unpack or execute virtual files.

Engineering report schema version 1 retains SI and display values,
assumptions, tolerances, model versions, dataset provenance, results,
accessible chart tables, validation, warnings, limits, lineage, environment
and integrity metadata. Markdown and JSON are deterministic for identical
validated inputs.

### Progress storage

Progress schema version 3 stores bounded engineering workspace records
alongside the local learner and progress model. Each record contains a project
id, bundle JSON and update timestamp. Version 1 and version 2 progress backups
migrate deterministically to version 3. They do not become desktop workspace
authority.

### Workspace authority and recents

- A root becomes usable only after the Rust-controlled native folder picker
  canonicalises and registers it for the current desktop session.
- Every workspace filesystem command and external-tool run requires an exact
  registered canonical root.
- Recent projects remain browser-profile convenience state. Their saved paths
  are identifiers, not continuing authority.
- Opening a recent project requires native folder re-selection. The selected
  canonical identifier must match the saved recent root before the workspace
  is opened.

### Atomic replacement

Each workspace text write:

1. validates and resolves the destination under the authorised root,
2. creates a unique sibling temporary file with exclusive creation,
3. writes, flushes and synchronises the complete content,
4. serialises replacement through a process-local lock, and
5. atomically replaces the destination in the same directory.

POSIX uses rename replacement. Windows uses `MoveFileExW` with
replace-existing and write-through flags. There is no fallback that deletes the
existing destination first. If replacement fails, the previous destination is
preserved and temporary cleanup is attempted.

## Consequences

- A workspace can be copied, zipped, reviewed or versioned without rewriting
  absolute project references.
- Project configuration, actual run evidence and generated reports remain
  distinguishable.
- Restarting the desktop application intentionally requires folder
  reauthorisation, including for recents.
- Replacement is safe per file but not transactional across multiple files.
- Only one latest receipt persists across sessions. A future run-history
  feature needs a separate append or indexing design rather than weakening the
  latest receipt contract.
- The built-in editor remains a bounded editor for supported circuit and
  requirement text files, not a general filesystem interface.
- Browser-local engineering bundles and Project Packs can be downloaded,
  reviewed and re-imported without granting an authorised desktop root.
- Project Pack and report hashes make accidental corruption and content changes
  without a corresponding digest recomputation detectable. They do not
  authenticate an author or protect against replacement of both content and
  digest.
