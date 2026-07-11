# ADR-0004: External process execution security model

Date: 2026-07-11 · Status: Accepted

## Context

The desktop app runs external engineering tools against user-supplied project files. Untrusted
values (file names, netlist content, tool paths) must never become command or path injection.

## Decision

All process execution happens in Rust behind typed Tauri commands with these invariants:

1. **No shell.** Processes are spawned with `std::process::Command` using argument vectors.
   No string is ever interpolated into a shell line.
2. **Allow-listed programs and subcommands.** Only `ngspice` and `kicad-cli` can be executed,
   each with a fixed set of subcommands/flags built by Rust from a typed request struct. The
   frontend cannot pass raw argument arrays.
3. **Workspace-scoped paths.** Every file path in a request is a relative path joined to a
   user-chosen workspace root, then canonicalised; requests are rejected unless the resolved
   path stays under the canonicalised root. Absolute paths, `..`, drive-letter and UNC tricks
   are rejected before touching the filesystem.
4. **Timeouts.** Every execution has a caller-supplied timeout clamped to a hard ceiling
   (default 60 s, max 300 s). On expiry the child is killed and the result is marked timed out.
5. **Output caps.** stdout/stderr are truncated at 2 MiB each with an explicit `truncated`
   flag; the app never buffers unbounded output.
6. **Structured errors.** Failures return a typed error enum (tool missing, spawn failure,
   timeout, non-zero exit, path violation) — never a panic and never a raw OS string alone.
7. **Configured tool paths** are validated to exist and be files before use; they are chosen
   through the OS file dialog or settings, not derived from project content.
8. **Opening a project in KiCad** uses the OS default-app opener on a validated path, only on
   an explicit user click.

## Consequences

- Command-injection and path-boundary behaviour is unit-tested in Rust (`src-tauri/src`) and
  the request-building logic is additionally covered by TS fixture tests.
- Adding a tool means extending the allow-list and request types — a reviewable diff, not a
  config change.
