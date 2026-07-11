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

`evidence/latest-run.json` uses a separate receipt schema version 1.

- It stores one latest run, not a history.
- It records the simulation identifier, capture time, exact adapter result and
  SHA-256 hashes of declared inputs that existed immediately before execution.
- Validation checks the manifest simulation and capability relationship, safe
  paths, timestamps, hashes, result shape, collection limits and an 8 MiB
  total size ceiling.
- Non-finite result numbers use a lossless tagged JSON representation.
- Corrupt or unsupported receipts fail closed and are not converted into a
  synthetic result.

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
