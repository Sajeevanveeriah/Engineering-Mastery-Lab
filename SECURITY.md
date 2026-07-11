# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a vulnerability

Open a private GitHub security advisory on this repository (Security →
Report a vulnerability). Please include reproduction steps and affected
platform. Expect an acknowledgement within 7 days. Do not open public issues
for unpatched vulnerabilities.

## Security model (v0.1)

The desktop app executes local engineering tools against user-chosen project
directories. Design invariants (details in
[docs/adr/ADR-0004](docs/adr/ADR-0004-External-Process-Security.md)):

- **No shell.** External processes are spawned with argument vectors; user
  data is never interpolated into a shell string.
- **Allow-listed programs.** Only ngspice and kicad-cli can run, each with a
  fixed set of subcommands built in Rust from typed requests.
- **Workspace-scoped paths.** Every path from the frontend is validated as a
  plain relative path (no `..`, absolute paths, drive letters, UNC, NUL or
  backslashes) and joined to a canonicalised workspace root.
- **Resource limits.** Per-run timeout (default 60 s, hard ceiling 300 s) and
  a 2 MiB cap per output stream, with explicit truncation flags.
- **Structured errors** for missing tools, spawn failures, timeouts and path
  violations.
- **No network access** initiated by the app at runtime; no telemetry; no
  credentials handled or stored.
- Netlists are checked for `.control` blocks and shell escapes before a run
  deck is generated.

## Known boundaries

- Symlinks inside a workspace that point outside it are not resolved-and-
  rejected in v0.1; do not open untrusted workspaces containing symlinks.
- Installers are unsigned in v0.1 — verify SHA-256 checksums from CI.
- External tools themselves (ngspice, KiCad) run with the user's privileges;
  simulating a malicious design file is subject to those tools' own parsers.
