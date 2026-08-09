# Troubleshooting

## Tool detection

**"ngspice was not found on PATH or in well-known install locations"**
Install ngspice (see Installation.md) or set the executable path in
Diagnostics. On Windows the console binary is `ngspice_con.exe` (usually in
`C:\Spice64\bin`); the GUI `ngspice.exe` also works for batch runs.

**"configured executable does not exist"**
The override path in Diagnostics points at a missing file. Clear the field to
fall back to automatic detection.

**"configured executable did not report a version"**
The file exists but is not the expected tool (or is a wrapper that swallows
`--version`). Point the override at the real binary.

**KiCad capability says "requires kicad-cli 8.0/9.0 or newer"**
ERC, DRC and BOM export need KiCad 8+ (the `pcb drc` and `sch erc` subcommands
did not exist in KiCad 7); board rendering needs KiCad 9+. Netlist and
gerber/drill export work on KiCad 7+. Update KiCad or avoid those capabilities.

## Running simulations

**Result status `timeout`**
The tool exceeded its time limit (default 60 s, ceiling 300 s) and was
stopped. Reduce the analysis span/points or raise the timeout in the run
context.

**"ngspice ran but its output could not be parsed"**
The raw files are kept in `results/` for inspection. Common causes: netlist
warnings that abort the analysis (see the diagnostics list), or a vector name
that does not exist in the circuit (e.g. `v(out)` without an `out` node).

**"Netlist must not contain a .control block"**
The workbench generates its own control section. Remove `.control`/`.endc`
from the netlist and configure the analysis in the simulation instead.

**"exited with code …" with `Error: unknown subckt`/`could not find …`**
The netlist references models or subcircuits that are not defined/included.
Fix the netlist; the full ngspice output is preserved in the result.

## Workspaces

**"This project was created by a newer version of Project Workbench"**
The manifest `schemaVersion` is above what this build supports. Update the app;
the file is never modified on a failed open.

**"No workbench.json found in the selected folder"**
Choose the workspace root (the folder containing `workbench.json`), or create
a new project in an empty folder.

**"Unsafe workspace-relative path rejected"**
Manifest paths must be relative, use forward slashes, and contain no `..`.
Absolute paths and drive letters are rejected by design.

## Building

**Windows: `link.exe` not found**: install VS 2022 Build Tools with the C++
workload.
**Linux: webkit2gtk errors**: install `libwebkit2gtk-4.1-dev` and related
packages (Development-Setup.md).
**SmartScreen/Gatekeeper warnings**: expected for unsigned v0.2 artefacts;
verify SHA-256 checksums instead.

## CAD and EDA Studio

**An STL is the wrong size**: STL has no unit metadata. Reimport or change the
source-unit interpretation and confirm the resulting millimetre bounds. The
assumed-mm warning is expected until the interpretation is confirmed.

**A 3MF is rejected before display**: the package may exceed file, entry,
expanded-byte or compression-ratio limits, contain unsafe paths, use encrypted
or unsupported entries, or reference an external resource. Do not weaken the
preflight to make the file open. Simplify and re-export it from a trusted tool.

**An exact CAD job times out or is cancelled**: the worker is terminated and
replaced. The last valid visible result is retained. Reduce feature complexity
or isolate the failing feature; do not treat a retained shape as a successful
rebuild.

**STEP, IGES or BREP import is unavailable as exact authority**: STEP import is
only an explicitly lossy tessellated preview with assumed millimetres. It does
not retain topology, hierarchy, source units or features. IGES and BREP are
explicitly unsupported by the selected Replicad API. Retain the
source file and use a trusted CAD tool for exact inspection. Do not convert
through an unreviewed online service.

**A KiCad import reports losses**: inspect every loss code and preserved value.
Unsupported hierarchy, zones, rules, properties and library graphics can
change intent. Re-export requires an acknowledgement token but that does not
make the result lossless.

**KiCad or ngspice says fixture verified**: this confirms deterministic local
contracts only. Select an authorised desktop workspace and detect a compatible
installed executable for real-tool evidence. The renderer cannot accept an
arbitrary executable or argument list.

**CAD or EDA is unavailable after an offline browser restart**: the service
worker pre-caches Academy content only. Load the route while connected or use a
verified packaged desktop build. Do not interpret Academy offline status as a
CAD/EDA cache guarantee.
