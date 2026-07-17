# Third-party dependency and licence inventory

Working tree target v0.2.0, reviewed 2026-07-17. This human-maintained inventory
covers declared direct dependencies. Regenerate the complete transitive
inventory before release.

## Direct npm dependencies (production)

| Package | Licence |
|---|---|
| react, react-dom | MIT |
| react-router-dom | MIT |
| @tauri-apps/api | MIT OR Apache-2.0 |
| three | MIT |

Direct dev dependencies (typescript, vite, vitest, @vitejs/plugin-react,
@tauri-apps/cli, @types/three and other @types/* packages) are MIT or
Apache-2.0-compatible.

The previous production-tree summary was recorded before Three.js was added
and must not be treated as the v0.2.0 release audit.

## Rust crate tree (src-tauri, `cargo metadata`, 2026-07-11)

Approximately 500 crates, all permissive or weak-copyleft in the recorded
v0.1.0 audit:

- Overwhelmingly MIT and/or Apache-2.0, approximately 460 crates.
- Unicode-3.0, Zlib variants, BSD-2-Clause, BSD-3-Clause, ISC, Unlicense,
  0BSD and CC0 are permissive.
- **MPL-2.0** dependencies, including the resvg and usvg family, use file-level
  copyleft only. Linking
  is fine for MIT/Apache-2.0-licensed applications as long as modifications
  to those crates themselves are shared.
- No GPL/LGPL-only crates. (`MIT OR Apache-2.0 OR LGPL-2.1-or-later` entries
  are satisfied by the MIT/Apache option.)

## External tools (not distributed with this app)

| Tool | Licence | Relationship |
|---|---|---|
| ngspice | BSD-3-Clause (with some GPL-licensed optional parts) | Executed as a separate user-installed process; not linked or bundled |
| KiCad / kicad-cli | GPL-3.0-or-later | Executed as a separate user-installed process; not linked or bundled |

Invoking GPL tools as separate processes does not make this application a
derivative work; no bundling occurs in v0.2.0.

## Repository licence

The repository is licensed under MIT. The dependency tree recorded for v0.1.0
did not impose copyleft on the application's own licence. Three.js is also MIT
licensed.

Action before making the repository public: regenerate this inventory from the
v0.2.0 npm and Rust lockfiles, review bundled notices, and confirm the MIT
licence fields remain aligned across package manifests.
