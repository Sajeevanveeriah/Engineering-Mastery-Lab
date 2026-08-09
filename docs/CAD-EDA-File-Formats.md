# CAD and EDA file formats

## Authority model

| Format class | Examples | Authority after import | Round-trip promise |
|---|---|---|---|
| Native editable | EML CAD JSON v2, EML EDA JSON v1 | Full native document authority | Exact for validated schema fields |
| Mesh reference | STL, 3MF | Reference-only triangles and metadata | No feature history or exact topology claim |
| STEP tessellated preview | STEP | Reference display with assumed millimetres | Tested explicit losses; no exact topology, hierarchy, units or feature history retained |
| Immutable exchange B-rep | STEP target | Exact imported shape, no inferred native history | `NOT_VERIFIED`; IGES/BREP are explicit unsupported formats |
| External authoring subset | KiCad 6+ `.kicad_sch` and `.kicad_pcb` | Converted native EDA subset | Only supported constructs, with loss report |
| Manufacturing output | Gerber, Excellon, BOM, pick-and-place | Derived output, not editable authority | Independently inspect before fabrication |
| Simulation input or output | SPICE deck and parsed ngspice output | Derived analysis evidence | No general SPICE compatibility promise |

## Native CAD JSON v2

The document records millimetres, radians, ordered features, bodies, reference assets and selections. All identifiers are stable and unique. Feature dependencies must be acyclic. Parameters must be finite and use `mm`, `rad`, `kg/m3`, `count` or `ratio`. A mesh asset records format, SHA-256, byte length and `referenceOnly: true`.

Version 1 template designs may migrate deterministically to one primitive feature and one solid body. Unknown future versions fail closed. Native JSON import is bounded to 1,000,000 characters by the current branch foundation.

## STL

STL stores triangle coordinates but no unit. Import therefore requires an explicit interpretation of `mm`, `cm`, `m` or `in`; the selected scale is recorded and geometry is normalised to millimetres. A default must be visible and user-confirmable. Export writes coordinates following the EML millimetre convention, but the receiving application must also be configured for millimetres.

ASCII and binary STL require structural preflight, finite bounds and triangle limits. Imported STL is always a mesh reference. It does not become an exact B-rep or native parametric history.

## 3MF

3MF is a ZIP-based package with a declared model unit. The importer normalises supported units to millimetres and records component transforms and material summaries where supported. Before expansion it checks central-directory bounds, entry count, encrypted entries, compression method, single-entry and total expansion, compression ratio, duplicate paths, traversal, absolute paths and backslashes. External relationships and URI schemes fail closed.

Imported 3MF remains a mesh reference. Unsupported extensions must be reported or rejected, never silently promoted to native features.

## STEP, IGES and BREP

STEP export is implemented through the one selected OCCT worker. STEP preview
import bounds input to 100 MiB and returns tessellation plus metadata declaring
`representation: tessellated-preview`, assumed millimetres, unverified source
units, no hierarchy, no editable features and no exposed exact B-rep. It is
tested as a preview, but is `NOT_VERIFIED` as immutable exchange import and
must not be used as exact design authority. The exact-import acceptance gate
requires a plate-with-hole fixture with retained topology, hierarchy, unit and
loss metadata.

IGES and native BREP import return `UNSUPPORTED_FORMAT` because Replicad 0.23.1
does not expose them. No second kernel or guessed parser is included. They
remain roadmap formats unless the single reviewed kernel path can prove a
bounded implementation.

Every exchange export still requires independent reopening and geometry and
metadata comparison within declared tolerances. A file that opens is not
sufficient round-trip evidence.

## Native EDA JSON v1

The native document contains a schematic and PCB. Coordinates, pad sizes, track widths, via dimensions and board rules are finite millimetre values. Rotation is degrees within bounded enumerations. IDs and annotated references are unique. Symbol-to-footprint and pin-to-pad intent is explicit.

Canonical persistence sorts stable collections and object keys. Unknown top-level keys and future document kinds or versions fail closed. Import is bounded to 5,000,000 bytes by the current branch foundation.

## KiCad 6+ subset

KiCad import and export targets the open S-expression file families introduced in KiCad 6. The exact supported node set must be versioned. At minimum, every conversion records source family, detected version, supported constructs, omitted constructs, approximations and stable object references.

Unsupported hierarchy, zones, rules, properties and nested library graphics
are retained where safe and reported. Re-export of a lossy import requires an
exact acknowledgement token for the current report. Acknowledgement records a
deliberate decision; it does not change the result to lossless.

A loss report entry contains:

- `code`: stable machine-readable reason;
- `message`: concise human explanation;
- `preserved`: what data or fallback remains available.

Loss semantics are strict:

1. `lossless` means every in-scope construct converted and reopened without semantic difference.
2. `lossy-with-report` means the document remains usable but one or more constructs were omitted or approximated, with an entry for each class and affected identity where possible.
3. `rejected` means continuing could misrepresent electrical or physical intent.

Unknown executable-looking content remains data and gains no authority. Legacy KiCad formats before 6 are outside the stated subset unless separately implemented and tested. KiCad CLI capabilities and file parsing are separate: a parser can be fixture-tested without proving a real KiCad run.

## SPICE and ngspice

Generated SPICE is a bounded device and analysis subset. User `.control`, include, library, shell, system and process directives are not allowed through the controlled generation path. Values and suffixes require deterministic formatting. Unsupported devices or models produce diagnostics instead of silent substitutions.

ngspice execution remains desktop-only through the typed Tauri adapter. Parsed fixture output is `FIXTURE_VERIFIED`; only an installed compatible executable, captured version and inspected run can be `REAL_TOOL_VERIFIED`.

## Gerber, Excellon, BOM and pick-and-place

These are derived outputs. Units, coordinate precision, zero suppression, layer identity, drill plating, board side and rotation convention must be explicit. BOM grouping must retain references and warn about missing values or package data. Pick-and-place uses millimetres and degrees with an explicit front or back side.

Fabrication outputs require independent visual inspection and, where practical, comparison with a trusted external viewer. They do not constitute fabrication approval.

## Common import failure rules

- Reject empty, oversized, malformed, truncated and future-version inputs.
- Reject non-finite numbers, duplicate stable identities and dangling references.
- Reject traversal, absolute paths, backslashes, unsafe URI schemes and external archive relationships.
- Enforce cancellation, time and resource limits before and during expensive work.
- Preserve the original file hash and a deterministic conversion or loss report.
- Never treat successful parsing as proof of engineering correctness.
