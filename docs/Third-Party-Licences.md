# Third-party dependency and licence inventory

Release target v0.2.0, refreshed 2026-07-30 from `package-lock.json` and
`src-tauri/Cargo.lock`. This records declared lockfile licence metadata and is
not an independent legal opinion.

## Direct npm dependencies (production)

| Package | Licence |
|---|---|
| @tauri-apps/api 2.11.1 | Apache-2.0 OR MIT |
| katex 0.18.1 | MIT |
| react 19.2.7 | MIT |
| react-dom 19.2.7 | MIT |
| react-router 8.3.0 | MIT |
| three 0.185.1 | MIT |

The production npm tree contains nine lockfile entries: eight MIT entries and
one Apache-2.0 OR MIT entry. The three transitive production packages are
`commander` 8.3.0, `cookie-es` 3.1.1 and `scheduler` 0.27.0, all MIT.

The complete npm lockfile contains 239 package entries and every entry declares
a licence. The declaration counts are 170 MIT, 20 Apache-2.0, 14 MPL-2.0,
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

## Academy external learning sources

The Academy catalogue records 65 exact, optional HTTPS source pointers, last
live-validated on 2026-07-30. These pages, standards, courses, textbooks and
publications are not npm or Rust dependencies, are not downloaded into the
application and are not required to complete the native lessons or
assessments. A successful URL check does not grant reuse rights.

| Source family | Recorded reuse boundary |
|---|---|
| MIT OpenCourseWare | CC BY-NC-SA 4.0, subject to course-specific third-party exclusions and MIT name rules |
| OpenStax College Success, Precalculus 2e and University Physics Volumes 1 and 2 | CC BY-NC-SA 4.0, with the attribution, third-party and AI-ingestion notices recorded for each work |
| OpenStax Physics, produced for the Texas Education Agency | CC BY 4.0, with the work-specific Texas Education Agency attribution recorded in the source entry |
| BIPM, ROS 2 and Gazebo documentation | CC BY 4.0 under the terms recorded for the relevant source |
| C++ Core Guidelines | Custom Standard C++ Foundation licence limited to personal or internal business use, with notice retention and trademark limits |
| FreeRTOS developer documentation | Link-out only; the FreeRTOS kernel and software are MIT, but no separate reuse right is asserted for the website prose |
| CMSIS, ros2_control, OpenCV, scikit-learn, PyTorch and ExecuTorch | Apache-2.0, BSD-3-Clause or other terms as identified per source record |
| NIST, NASA and United States Department of Energy publications | Government-publication terms, acknowledgement requirements and marked third-party exclusions apply |
| Pro Git and the Missing Semester | CC BY-NC-SA 3.0 or 4.0 as recorded per source |
| Modbus, OASIS MQTT and RFC 9293 | Their respective EULA, specification notice or IETF Trust Legal Provisions apply |
| Nav2 documentation | Apache-2.0 for the docs.nav2.org repository; separately licensed third-party media may differ |
| OMG DDS 1.4 | Link-out only; the specification grants limited unmodified informational copying with notices while prohibiting modification, network posting and commercial transfer |
| Autodesk, ASME, ISA, OPC Foundation, PLCopen and Engineers Australia | Provider-specific website or specification terms apply; Academy links out only and does not frame or redistribute this content |

ST deep links are deliberately absent because the reviewed ST terms do not
permit deep-linking or framing without permission. The authoritative title,
organisation, URL, licence or terms note, attribution and validation date for
each Academy source are maintained in `src/data/academy/catalogue.ts`.

## Repository licence

The repository declares the MIT licence. The current production npm packages
declare MIT or Apache-2.0 OR MIT, and the Rust licence expressions are recorded
above. Regenerate this inventory and review the applicable licence texts and
notices whenever either lockfile changes.
