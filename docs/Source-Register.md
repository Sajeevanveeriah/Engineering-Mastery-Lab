# Engineering Design Studio source register

## Purpose

This register identifies the source, version, licence, distribution boundary
and verification status of Engineering Design Studio dependencies and external
formats. It is evidence for release review, not legal advice. Exact installed
package files and built artefacts override an upstream README or this document.

## Distributed CAD components

| Component | Exact version or revision | Public source | Licence evidence | Distribution and verification |
|---|---|---|---|---|
| Replicad | npm `0.23.1`, source commit `45b9b8b7c594cd5dc38617edaf220ab4cd72778f` | <https://github.com/sgenoud/replicad/tree/45b9b8b7c594cd5dc38617edaf220ab4cd72778f/packages/replicad> | Installed package `LICENSE`; `docs/licenses/replicad-0.23.1-MIT.txt` | MIT JavaScript API. Exact package and source tag reviewed. |
| Replicad OpenCascade.js wrapper | npm `0.23.0`, source commit `19fb8212e0bb12a07a7a49f96950f8903903d469` | <https://github.com/sgenoud/replicad/tree/19fb8212e0bb12a07a7a49f96950f8903903d469/packages/replicad-opencascadejs> | Installed package `LICENSE`; `docs/licenses/replicad-opencascadejs-0.23.0-MIT.txt` | MIT wrapper and binding source. Exact package reviewed. |
| Open CASCADE Technology | Binary identifies OCCT 7.6 | <https://github.com/Open-Cascade-SAS/OCCT/tree/V7_6_0> and <https://dev.opencascade.org/release> | `docs/licenses/OCCT-7.6-LGPL-2.1.txt`; `docs/licenses/OCCT-7.6-Open-CASCADE-Exception-1.0.txt` | LGPL-2.1 with Open CASCADE Exception 1.0. Source/build/replacement notice required. Bit-for-bit rebuild is `NOT_VERIFIED`. |
| Three.js | npm `0.185.1` | <https://github.com/mrdoob/three.js/tree/r185> | Installed package licence and lockfile metadata | MIT renderer plus STLLoader and ThreeMFLoader. Existing project dependency. |

The reviewed OCCT asset is `replicad_single.wasm`, 10,855,736 bytes, SHA-256
`2E07C45B83267B38D3102EC411FAD11E7CE2ED71854084E461C5AB5FEE94AAFF`.
Production source imports only that asset from the dedicated worker. The final
built and packaged asset inventories must independently prove that exactly one
OCCT WASM was emitted.

### Source, rebuild and replacement route

1. Obtain the application source from
   <https://github.com/sajeevanveeriah/engineering-mastery-lab> at the exact
   distributed application commit.
2. Obtain Replicad and its wrapper at the exact commits above, and OCCT 7.6
   source from the recorded upstream tag.
3. Review the wrapper binding and build files at the exact wrapper commit. The
   upstream build currently references an unpinned `donalffons/opencascade.js`
   Docker image, so a reproducible image digest and independent rebuild remain
   required before claiming bit-for-bit correspondence.
4. Build a compatible replacement `replicad_single.wasm`, retain the expected
   binding surface and place it at the same project-local worker asset path.
5. Run the full type, unit, build, browser, desktop, licence, security,
   performance and visual gates. A replacement is not accepted merely because
   it loads.

This route provides practical replaceability. It does not promise ABI stability
across arbitrary OCCT or wrapper revisions.

## External tools not distributed

| Tool | Public source | Licence boundary | Application relationship | Current evidence |
|---|---|---|---|---|
| KiCad and `kicad-cli` | <https://gitlab.com/kicad/code/kicad> | GPL-3.0-or-later program, separately installed | Typed desktop process adapter only; no KiCad code is linked or bundled | Versions 7/8/9/10 and all seven capability paths are `FIXTURE_VERIFIED`; installed tool is `NOT_VERIFIED` |
| ngspice | <https://sourceforge.net/projects/ngspice/> | Separately installed program; upstream contains BSD and separately described optional components | Typed desktop batch adapter only; no ngspice code is linked or bundled | Controlled voltage-divider fixture is `FIXTURE_VERIFIED`; installed tool is `NOT_VERIFIED` |

External executables run with the user's privileges. Their licences, parser
risks and output correctness remain separate from the MIT application.

## Open-format specifications

| Format | Primary source pointer | Implemented boundary |
|---|---|---|
| STL | De facto format; no single normative owner | Bounded ASCII and binary triangle import; unit is always user interpretation |
| 3MF Core | <https://github.com/3MFConsortium/spec_core> | Core geometry, components, transforms and base materials within strict ZIP and relationship budgets |
| STEP | <https://www.iso.org/standard/63141.html> | Export and explicitly lossy tessellated preview are tested. Immutable exact import is `NOT_VERIFIED`; the preview assumes mm and reports lost topology, hierarchy, units and features |
| KiCad 6+ files | <https://dev-docs.kicad.org/en/file-formats/sexpr-intro/> | Bounded semantic schematic and PCB subset with deterministic loss report |
| SPICE/ngspice | <https://ngspice.sourceforge.io/docs.html> | Fixed generated voltage-divider deck and bounded result fixture; no arbitrary control/include execution |

Access to a specification page does not grant a right to copy third-party
symbol, footprint, model or prose libraries. The bundled EDA palette is
original project data.

## Release maintenance

For every dependency or kernel update, record exact package versions, source
commits, licence files, lockfile audit, built asset names and hashes, WASM count,
source/build availability and replacement evidence. Do not inherit a prior
licence or security pass across versions.
