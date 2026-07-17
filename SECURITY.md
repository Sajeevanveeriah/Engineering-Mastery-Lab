# Security policy

## Release status

Version 0.2.0 is a functional completion candidate, not a published production
release. Security findings should be reported through a private GitHub security
advisory for this repository. Include the affected platform, reproduction
steps, expected behaviour and observed behaviour. Do not disclose an unpatched
vulnerability in a public issue.

## Trust boundary

The browser build does not read local project folders or execute local tools.
Desktop capabilities cross a typed Tauri command boundary into Rust. Renderer
data, workspace content, manifests, receipts, file names and tool output are
treated as untrusted inputs.

## Implemented controls

1. **Native workspace authority.** Only the Rust-controlled folder picker can
   register a workspace root. The canonical root is stored in a session-scoped
   allow-list, currently capped at 64 roots. All workspace file commands and
   tool runs reject roots that were not registered in the current desktop
   session.
2. **Recent-project reauthorisation.** A recent entry stores an identifier, not
   continuing authority. The user must re-select the folder after restart and
   the selected canonical location must match the saved recent location before
   the app opens it.
3. **No shell.** External processes are created with argument vectors using
   `std::process::Command`. Production paths do not interpolate user input into
   a shell command.
4. **Tool allow-list.** Only ngspice and KiCad CLI requests represented by the
   typed Rust request enum can run. Input types, operations and output zones are
   checked before spawn.
5. **Executable checks.** Overrides must be files with a supported executable
   name and must return a successful, tool-specific version response. This is a
   compatibility check, not cryptographic attestation.
6. **ngspice deck grammar.** ngspice runs only generated batch decks under
   `simulations/`. Rust validates the generated marker and command grammar,
   rejects user control blocks, shell and process escape forms, and rejects
   include or library directives immediately before launch. `-n` and `-b` are
   supplied by Rust.
7. **Workspace path containment.** Relative paths reject traversal, absolute
   forms, drive and UNC prefixes, backslashes, NUL, NTFS alternate streams and
   Windows device names. Existing ancestors are canonicalised so symlink or
   junction escapes are blocked.
8. **Atomic file replacement.** Writes use a unique same-directory temporary
   file created with exclusive creation, then flush and synchronise it before
   an atomic replacement. Windows uses `MoveFileExW` with replace and
   write-through flags. Replacement failure preserves the previous file.
9. **Process limits.** The default run timeout is 60 s and the hard ceiling is
   300 s. Each output stream is capped at 2 MiB. Reader drain time is bounded
   and incomplete drains are marked truncated.
10. **Least-privilege capabilities.** The Tauri manifest grants only the named
    application commands. External open or reveal access is not granted.
11. **Bounded receipts.** Latest-run receipts have a strict schema, safe paths,
    manifest and capability matching, bounded collections and an 8 MiB size
    ceiling. Invalid or corrupt receipts fail closed.

## Residual risks and boundaries

- Real ngspice and KiCad end-to-end execution has not been verified on this
  completion branch.
- Tool identity is not cryptographically attested. A deliberately substituted
  binary could imitate a valid file name and version banner.
- Cancellation kills the direct child. Complete descendant process-tree
  containment is not implemented on every platform.
- External tools run with the current user's privileges and retain their own
  parser and implementation risks.
- There is a narrow validation-to-use race if another process can rewrite an
  approved generated deck between the final validation and the operating
  system opening it.
- Atomic replacement protects each file, not a multi-file transaction. A
  cancelled tool can leave partial generated outputs.
- macOS and Linux runtime and package behaviour are not verified by current
  completion evidence.
- The `openPath` TypeScript bridge method remains in source for future work,
  but no current UI action or Tauri capability grants external opening.

See [Known Limitations](docs/Known-Limitations.md) and
[ADR-0004](docs/adr/ADR-0004-External-Process-Security.md) for release impact
and verification requirements.
