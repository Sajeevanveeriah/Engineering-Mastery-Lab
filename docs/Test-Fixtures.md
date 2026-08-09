# Engineering Design Studio test fixtures

## Evidence classes

| Provenance class | Meaning | Permitted claim |
|---|---|---|
| `ORIGINAL_SYNTHETIC` | Created in-repository from the documented schema | Deterministic in-process behaviour only |
| `GENERATED_HOSTILE` | Deliberately malformed or adversarial input | Detector behaviour for the exact case |
| `UPSTREAM_PUBLIC_SAMPLE` | Public upstream sample with source URL, revision and licence recorded | Compatibility with that exact sample |
| `USER_AUTHORED_REDACTED` | User-authored sample approved for repository use with sensitive content removed | Behaviour for that exact retained sample |
| `REAL_TOOL_CAPTURE` | Output captured from a named tool and version through the controlled path | Parser compatibility; real-tool status only if the run receipt is retained and inspected |

Fixtures must not contain personal data, secrets, proprietary designs, copied commercial libraries or unreviewed executable content. Every binary fixture needs a source or generator record, SHA-256 and expected byte count.

## CAD fixture register

| ID | Case | Provenance | Expected result | Detects |
|---|---|---|---|---|
| CAD-DOC-001 | Minimal valid v2 primitive | ORIGINAL_SYNTHETIC | Accept and canonical reopen | Schema baseline |
| CAD-DOC-002 | Version 1 template migration | ORIGINAL_SYNTHETIC | Stable v2 IDs and equivalent dimensions | Migration drift |
| CAD-DOC-003 | Dependency cycle | GENERATED_HOSTILE | Reject with cycle diagnostic | Infinite rebuild graph |
| CAD-DOC-004 | Dangling body, asset and feature IDs | GENERATED_HOSTILE | Reject each reference | Referential corruption |
| CAD-DOC-005 | Future version and unknown parameter unit | GENERATED_HOSTILE | Fail closed | Schema downgrade risk |
| CAD-DOC-006 | NaN, infinity and unsafe count | GENERATED_HOSTILE | Reject | Non-finite geometry |
| CAD-REBUILD-001 | Downstream feature failure with previous valid result | ORIGINAL_SYNTHETIC | Report failure and retain last valid shape | Silent corruption |
| CAD-HISTORY-001 | Undo, redo and edit after undo at limit | ORIGINAL_SYNTHETIC | Deterministic bounded history | State loss |
| STL-001 | ASCII 20 mm cube, 12 triangles | ORIGINAL_SYNTHETIC | 20 x 20 x 20 mm reference with assumed-mm notice | ASCII geometry and unit warning |
| STL-002 | Binary coloured cube | ORIGINAL_SYNTHETIC | Correct geometry with safe colour fallback and no text decode | Binary sniff and colour fallback |
| STL-003 | Truncated binary and missing `endsolid` | GENERATED_HOSTILE | Reject as truncated | Partial-file acceptance |
| STL-004 | Triangle count above limit | GENERATED_HOSTILE | Reject before render | Resource exhaustion |
| STL-005 | Non-finite or empty bounds | GENERATED_HOSTILE | Reject | Renderer poisoning |
| 3MF-001 | Two-component millimetre model | ORIGINAL_SYNTHETIC | Preserve two instances, transforms and material summary | Component hierarchy and transforms |
| 3MF-001B | One-inch cube | ORIGINAL_SYNTHETIC | Resolve bounds to 25.4 mm | Declared-unit conversion |
| 3MF-002 | `../`, absolute, drive and backslash entries | GENERATED_HOSTILE | Reject traversal | Archive path escape |
| 3MF-003 | Encrypted or unsupported compression | GENERATED_HOSTILE | Reject | Opaque expansion |
| 3MF-004 | Excess entries, expanded bytes and ratio | GENERATED_HOSTILE | Reject at matching budget | ZIP bomb defence |
| 3MF-005 | External relationship and URI scheme | GENERATED_HOSTILE | Reject | Network or external-file reach |
| BREP-001 | Sketch, pad and pocket | ORIGINAL_SYNTHETIC | Real OCCT tessellation with through pocket | Sketch-to-solid path |
| BREP-002 | Revolve and union/subtract/intersect | ORIGINAL_SYNTHETIC | Deterministic real OCCT outputs | Exact operation path |
| BREP-003 | Overlarge invalid fillet | GENERATED_HOSTILE | Failing feature identified and prior shape retained | Safe rollback |
| STEP-001 | Exported simple exact solid | ORIGINAL_SYNTHETIC | STEP export contains ISO-10303 data | Exact export path |
| STEP-002 | Reimported simple solid as preview | ORIGINAL_SYNTHETIC | Tessellation plus assumed-mm and four explicit fidelity-loss flags | Silent promotion to exact import |
| STEP-003 | Plate with hole, hierarchy and unit metadata | ORIGINAL_SYNTHETIC | Roadmap exact-import gate; preview must not claim preservation | Silent hierarchy/unit loss |
| IGES-001 | Surface-only and malformed records | GENERATED_HOSTILE | Roadmap: reported handling | Invalid exact topology |

## EDA fixture register

| ID | Case | Provenance | Expected result | Detects |
|---|---|---|---|---|
| EDA-DOC-001 | Minimal valid native document | ORIGINAL_SYNTHETIC | Canonical save and reopen | Schema baseline |
| EDA-DOC-002 | Duplicate IDs and references | GENERATED_HOSTILE | Deterministic rejection | Identity ambiguity |
| EDA-DOC-003 | Missing footprint and pad mapping | GENERATED_HOSTILE | Referential diagnostics | Schematic-PCB drift |
| EDA-DOC-004 | Non-finite coordinates and invalid rules | GENERATED_HOSTILE | Reject | Geometry poisoning |
| EDA-DOC-005 | Unknown key, future version and oversize JSON | GENERATED_HOSTILE | Fail closed | Parser widening |
| EDA-CONN-001 | Wire junction and crossing without junction | ORIGINAL_SYNTHETIC | Distinct expected net graphs | False connection |
| EDA-CONN-002 | Repeated net labels and power symbols | ORIGINAL_SYNTHETIC | Deterministic merged nets | Net naming drift |
| EDA-ERC-001 | Required unconnected input | GENERATED_HOSTILE | Specific ERC diagnostic | Detector adequacy |
| EDA-ERC-002 | Conflicting outputs and power sources | GENERATED_HOSTILE | Specific conflict diagnostics | Electrical conflict detection |
| EDA-DRC-001 | Clearance, width, edge and drill violations | GENERATED_HOSTILE | One diagnostic per supported violation | DRC adequacy |
| EDA-DRC-002 | Vertex-only false-clean and copper continuity controls | GENERATED_HOSTILE | Detect segment proximity and distinguish routed connectivity | Detector adequacy |
| EDA-BOM-001 | Repeated values and natural references | ORIGINAL_SYNTHETIC | Stable grouping and sort | BOM nondeterminism |
| EDA-PNP-001 | Front and back placements at allowed rotations | ORIGINAL_SYNTHETIC | Stable mm and degree output | Side or angle inversion |
| KICAD-SCH-001 | Independent KiCad 7/8/9/10 supported schematic subsets | ORIGINAL_SYNTHETIC | Convert supported intent | Versioned subset baseline |
| KICAD-SCH-002 | Unsupported hierarchical or library construct | GENERATED_HOSTILE | Loss entry or rejection | Silent KiCad loss |
| KICAD-SCH-003 | Deep nesting, malformed token and oversize string | GENERATED_HOSTILE | Bounded rejection | Parser exhaustion |
| KICAD-PCB-001 | Independent KiCad 7/8/9/10 two-layer boards | ORIGINAL_SYNTHETIC | Convert footprints, pads, outline, tracks and vias | PCB subset baseline |
| KICAD-PCB-002 | Zones, hierarchy, extra properties and unsupported rules | GENERATED_HOSTILE | Preserve safe source text and emit complete loss report | Silent board simplification |
| SPICE-001 | Fixed voltage-divider result | ORIGINAL_SYNTHETIC | Stable generated deck and accessible 10 V to 5 V series | Controlled fixture baseline |
| SPICE-002 | `.control`, include, library, shell and system directives | GENERATED_HOSTILE | Reject | Process or file escape |
| SPICE-003 | Malformed, truncated and excessive output | GENERATED_HOSTILE | Failed status with bounded raw output | Parser and output-cap failure |
| TOOL-KICAD-001 | Captured ERC, DRC, BOM, netlist and export output | REAL_TOOL_CAPTURE | Parser fixture passes | Output parser drift |
| TOOL-NGSPICE-001 | Captured success and failure output | REAL_TOOL_CAPTURE | Parser fixture passes | Output parser drift |

## Verification procedure

1. Prove each detector can fail against its named hostile fixture before trusting a clean-fixture pass.
2. Run narrow unit tests for schema, conversion and parser behaviour.
3. Run integration tests for save, reopen, export, cancellation and last-valid recovery.
4. Run browser and Tauri paths separately. A browser pass does not prove desktop authority or packaging.
5. Run installed KiCad and ngspice only through the existing controlled adapters. Capture exact executable identity and version.
6. Inspect generated files in an independent compatible viewer or tool where practical.
7. Inspect every visual state at the full canvas and original pixels for clipping, overlap, contrast, labels, units and reading order.
8. Record `FIXTURE_VERIFIED` and `REAL_TOOL_VERIFIED` independently. Never promote fixture evidence to a real-tool claim.

## Fixture maintenance

Changing a fixture requires review of provenance, expected result and every test that consumes it. Regenerate hashes and byte counts. Do not update an expected output merely to make a test pass; first identify whether the implementation, fixture or expectation is wrong.
