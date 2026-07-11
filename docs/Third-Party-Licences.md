# Third-party dependency and licence inventory

As of 2026-07-11, branch `feature/engineering-workbench-v0.1`.

## Direct npm dependencies (production)

| Package | Licence |
|---|---|
| react, react-dom | MIT |
| react-router-dom | MIT |
| @tauri-apps/api | MIT OR Apache-2.0 |
| @tauri-apps/plugin-dialog | MIT OR Apache-2.0 |
| @tauri-apps/plugin-opener | MIT OR Apache-2.0 |

Direct dev dependencies (typescript, vite, vitest, @vitejs/plugin-react,
@tauri-apps/cli, @types/*) are MIT or Apache-2.0-compatible.

Production npm tree summary (`license-checker`, 2026-07-11): MIT ×8,
MIT OR Apache-2.0 ×2, Apache-2.0 OR MIT ×1, plus this package (UNLICENSED).

## Rust crate tree (src-tauri, `cargo metadata`, 2026-07-11)

~500 crates, all permissive or weak-copyleft:

- Overwhelmingly MIT and/or Apache-2.0 (≈460 crates).
- Unicode-3.0 ×18 (ICU data crates), Zlib variants, BSD-2/3-Clause, ISC,
  Unlicense, 0BSD, CC0 — all permissive.
- **MPL-2.0 ×5** (e.g. resvg/usvg family): file-level copyleft only; linking
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
derivative work; no bundling occurs in v0.1.

## Licence options for this repository

The dependency tree imposes no copyleft on the app's own licence. Viable:

1. **MIT** — simplest, maximum adoption.
2. **Apache-2.0** — adds an explicit patent grant and contribution terms
   (**recommended** for engineering tooling).
3. **Dual MIT OR Apache-2.0** — Rust-ecosystem convention.

Action before making the repository public: choose one, add `LICENSE`, change
`package.json`/`Cargo.toml` licence fields from `UNLICENSED` accordingly, and
regenerate this inventory.
