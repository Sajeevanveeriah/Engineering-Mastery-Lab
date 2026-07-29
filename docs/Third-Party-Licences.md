# Third-party dependency and licence inventory

Release target v0.2.0, refreshed 2026-07-29 from `package-lock.json` and
`src-tauri/Cargo.lock`. This records declared lockfile licence metadata and is
not an independent legal opinion.

## Direct npm dependencies (production)

| Package | Licence |
|---|---|
| @tauri-apps/api 2.11.1 | Apache-2.0 OR MIT |
| react 19.2.7 | MIT |
| react-dom 19.2.7 | MIT |
| react-router 8.3.0 | MIT |
| three 0.185.1 | MIT |

The production npm tree contains seven lockfile entries: six MIT entries and
one Apache-2.0 OR MIT entry. The two transitive production packages are
`cookie-es` 3.1.1 and `scheduler` 0.27.0, both MIT.

The complete npm lockfile contains 237 package entries and every entry declares
a licence. The declaration counts are 168 MIT, 20 Apache-2.0, 14 MPL-2.0,
13 Apache-2.0 OR MIT, 11 ISC, six BSD-2-Clause, two BSD-3-Clause, and one each
for CC-BY-4.0, BlueOak-1.0.0 and 0BSD. Direct development dependencies are
MIT, Apache-2.0, Apache-2.0 OR MIT, or MPL-2.0; the MPL-2.0 direct dependency is
`@axe-core/playwright` 4.12.1.

## Rust crate tree (`src-tauri`, `cargo metadata --locked --offline`, 2026-07-29)

The locked metadata contains 467 packages and every package declares a
licence. The exact declaration counts are:

| Count | Licence expression |
|---:|---|
| 218 | MIT OR Apache-2.0 |
| 119 | MIT |
| 35 | Apache-2.0 OR MIT |
| 19 | MIT/Apache-2.0 |
| 18 | Unicode-3.0 |
| 17 | Zlib OR Apache-2.0 OR MIT |
| 5 | MPL-2.0 |
| 4 | Unlicense OR MIT |
| 3 | Apache-2.0/MIT |
| 3 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| 3 | Apache-2.0 |
| 2 | Unlicense/MIT |
| 2 | MIT OR Apache-2.0 OR Zlib |
| 2 | MIT OR Apache-2.0 OR LGPL-2.1-or-later |
| 2 | BSD-3-Clause OR MIT OR Apache-2.0 |
| 2 | BSD-3-Clause |
| 2 | BSD-2-Clause OR Apache-2.0 OR MIT |
| 1 | Apache-2.0 WITH LLVM-exception |
| 1 | 0BSD OR MIT OR Apache-2.0 |
| 1 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| 1 | Apache-2.0 AND MIT |
| 1 | CC0-1.0 OR MIT-0 OR Apache-2.0 |
| 1 | BSD-3-Clause AND MIT |
| 1 | BSD-3-Clause/MIT |
| 1 | ISC |
| 1 | MIT OR Zlib OR Apache-2.0 |
| 1 | Apache-2.0 / MIT |
| 1 | Zlib |

The five MPL-2.0 entries use file-level copyleft. No locked crate declares a
GPL-only or LGPL-only licence; the two expressions containing
LGPL-2.1-or-later also offer MIT or Apache-2.0.

## External tools (not distributed with this app)

| Tool | Licence | Relationship |
|---|---|---|
| ngspice | BSD-3-Clause (with some GPL-licensed optional parts) | Executed as a separate user-installed process; not linked or bundled |
| KiCad / kicad-cli | GPL-3.0-or-later | Executed as a separate user-installed process; not linked or bundled |

These tools are recorded as separately invoked, user-installed processes and
are not bundled by v0.2.0. This inventory does not determine downstream legal
or licensing obligations.

## Repository licence

The repository declares the MIT licence. The current production npm packages
declare MIT or Apache-2.0 OR MIT, and the Rust licence expressions are recorded
above. Regenerate this inventory and review the applicable licence texts and
notices whenever either lockfile changes.
