# ADR-0003: Portable workspace directory with a versioned JSON manifest

Date: 2026-07-11 · Status: Accepted

## Context

Projects must be portable (copyable between machines and OSes), reviewable in git, and safe
against version skew and partial writes.

## Decision

A workspace is a plain directory:

```
<project>/
  workbench.json      # manifest, schemaVersion 1
  requirements/
  circuits/
  pcb/
  simulations/
  results/
  evidence/
  reports/
```

Manifest rules:

- `schemaVersion: 1` (integer). Opening a manifest with a **greater** version fails with a
  clear "created by a newer version" error; lesser/missing versions fail as invalid. No silent
  migration in v0.1.
- All file references inside the manifest are **relative POSIX-style paths**; absolute paths
  and `..` segments are rejected at validation time.
- Timestamps are ISO-8601 UTC strings; keys are emitted in stable sorted order so identical
  states diff cleanly.
- Writes are atomic where the platform allows: write `workbench.json.tmp`, then rename over the
  target (implemented in the Rust bridge). The previous manifest is never truncated in place.
- Recent-projects list is UI state (localStorage), not part of the workspace.

## Consequences

- A workspace can be zipped, committed or synced with no path fix-ups.
- Unknown-version and malformed manifests produce actionable errors instead of data loss.
- An example workspace ships under `examples/rc-filter-workspace/` and doubles as test input.
