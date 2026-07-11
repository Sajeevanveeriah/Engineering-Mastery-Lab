# ADR-0004: External process and workspace security model

Date: 2026-07-11

Status: Accepted, amended by the completion branch

## Context

The desktop application executes installed engineering tools against
user-selected project content. Renderer data, paths, manifests, netlists, tool
overrides and generated files must not become command injection, path escape or
unbounded resource use.

A renderer-controlled absolute `workspaceRoot` is not an authority mechanism.
The trusted host must establish which roots the user approved and enforce that
decision for every command.

## Decision

### Workspace authority

1. Rust owns the native folder picker through `pick_workspace_directory`.
2. The selected directory is canonicalised and stored in a session-scoped
   `WorkspaceAuthority` allow-list, capped at 64 roots.
3. Renderer-provided root strings are treated as identifiers. Every filesystem
   command and `run_tool` call must resolve to an exact authorised canonical
   root.
4. `run_tool` rechecks authority and the request boundary before process spawn.
5. Recent-project entries require native re-selection and exact saved-root
   comparison before project opening.

### Path controls

- Workspace file arguments are POSIX-style relative paths.
- Empty, overlong, absolute, traversal, backslash, drive, UNC, NUL, alternate
  stream and reserved-device forms are rejected before filesystem access.
- The deepest existing ancestor is canonicalised to block symlink or junction
  escape. A validated non-existent tail contains only normal path components.
- Tool requests also enforce capability-specific zones. ngspice uses generated
  decks under `simulations/` and outputs under `results/`. KiCad input
  extensions must match the requested schematic or PCB operation, and outputs
  remain under `results/`.

### Process construction and limits

- Production execution uses `std::process::Command` with an argument vector.
  No shell string is constructed.
- `ToolRunRequest` is a typed Rust allow-list for ngspice and KiCad CLI
  operations. The frontend cannot submit arbitrary arguments.
- Timeout defaults to 60 s and is clamped to 300 s.
- stdout and stderr are each capped at 2 MiB while their pipes continue to be
  drained. Reader completion has one shared 500 ms post-process deadline;
  incomplete capture is marked truncated.
- Cancellation is registered by identifier and kills the direct child.

### ngspice command boundary

- The adapter produces a marked generated run deck.
- Immediately before spawn, Rust checks the marker and an allow-listed generated
  control grammar.
- User sections containing control blocks, include or library directives,
  shell, system or exec forms are rejected, including continued or split
  variants covered by tests.
- Generated output paths must remain in `results/`.
- Rust supplies `-n -b`; project content cannot replace those launch flags.

### Executable detection

- Overrides must exist as files and use a supported executable name.
- Detection requires exit code zero and a tool-specific ngspice or KiCad
  version output.
- Windows KiCad discovery includes version 10, 9, 8 and 7 locations, while each
  capability still applies its minimum supported version.
- These controls reduce accidental or obvious substitution. They are not a
  cryptographic proof of executable origin.

### File replacement and capabilities

- Workspace writes use flushed, synchronised, unique sibling temporary files
  and atomic same-directory replacement. The old destination is never deleted
  as a fallback.
- The Tauri capability manifest grants only the named command permissions.
- External open and reveal is deferred. The current capability manifest grants
  no opener permission and the UI exposes no open-in-external-app action.

## Rejected alternatives

- **Renderer-declared absolute roots:** rejected because the caller would also
  define its own authority.
- **Persistent recent-project authority:** rejected because browser storage is
  not a trusted permission store.
- **Shell commands:** rejected because quoting and metacharacter handling would
  expand the injection surface.
- **Configurable raw argument arrays:** rejected because they bypass the typed
  review boundary.
- **Delete destination then rename:** rejected because failure could destroy
  the prior valid file.
- **Enable generic open or reveal now:** rejected because it is not required by
  the current workflow and would broaden host access.

## Consequences and residual risks

- Every new tool or operation requires a Rust allow-list and capability review.
- Advanced ngspice inputs that rely on includes, libraries or custom control
  blocks are intentionally unsupported.
- Real-tool behaviour still requires verification with installed ngspice and
  KiCad versions.
- A malicious binary could imitate an accepted file name and version banner.
- Direct-child cancellation does not guarantee descendant process-tree
  containment on every platform.
- A narrow validation-to-use race remains if another process can rewrite a
  generated deck between the final content check and file opening by ngspice.
- External tools retain the current user's privileges and their own parser
  vulnerabilities.
- A cancelled run can leave partial output files. Atomic application writes do
  not form a transaction over external-tool output directories.
