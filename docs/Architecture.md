# Engineering Workbench architecture

## Status and scope

Engineering Workbench v0.2.0 is one React and TypeScript application with two
runtime modes:

- The web build provides the Engineering Toolbox, bounded parametric CAD,
  learning application, browser-profile state and static SPICE validation.
- The Tauri desktop build adds authorised local workspaces, external
  engineering-tool adapters, persisted run receipts and evidence reports.

There is no application backend. Learning progress and recent-project
identifiers use browser storage. Project data stays inside a user-selected
workspace directory.

## System view

```text
User interface
  Dashboard | Toolbox | CAD | Skills | Labs | Workbench | Diagnostics
        |
        +-- Local engineering engines
        |     calculations | units | CAD geometry | materials | simulations
        |                       |
        |             draft state and file downloads
        |
        +-- Learning state
        |     localStorage | src/lib/simulations | src/lib/metrics
        |
        +-- Desktop adapter registry
              built-in TypeScript adapters | ngspice | KiCad CLI
                         |
                    PlatformBridge
              MemoryBridge | TauriBridge | web null state
                         |
                Typed Tauri IPC commands
        native picker authority | workspace file IO | tool process runner
```

The browser build receives a `null` platform bridge and renders explicit
desktop-only fallbacks. Unit and integration tests use `MemoryBridge` to
exercise workspace and adapter behaviour without granting host access.

## Frontend layers

| Area | Responsibility |
|---|---|
| `src/data/` | Declarative skills, pathway, module and material reference content |
| `src/lib/engineering/` | Pure validated calculators and affine unit conversion |
| `src/lib/cad/` | Parametric CAD model schema, validation, metrics, geometry and deterministic text exports |
| `src/lib/simulations/` | Pure engineering simulation functions |
| `src/lib/adapters/` | Versioned adapter contract, registry and tool-specific request or result handling |
| `src/lib/workspace/` | Manifest schema, workspace operations and input discovery or hashing |
| `src/lib/report/` | Strict run receipt codec and deterministic Markdown evidence reporting |
| `src/lib/platform/` | The only frontend seam for local filesystem and process capabilities |
| `src/components/` | Shared shell, calculators, CAD viewport and drawing, tabs, plots, module workflow and workspace editors |
| `src/pages/` | Dashboard, Toolbox, CAD Studio, matrices, pathways, labs, diagnostics and project workflow |
| `src/tests/` | Calculator, CAD, simulation, storage, workspace, receipt, reporting and workflow tests |

### Engineering Toolbox

Calculator definitions hold their inputs, units, assumptions and calculation
function together. Each function validates finite and physically bounded input
before returning named quantities and conditional warnings. The generic
calculator component renders this schema and can export the entered values,
results and assumptions as a JSON calculation record.

Unit conversion uses a common base unit for each quantity family. Scale and
offset support both multiplicative units and temperature conversion. Material
properties are an indicative in-app reference and are deliberately separate
from certified design allowables.

All Toolbox calculations run in the renderer without filesystem, process or
network authority.

### CAD Studio

CAD Studio uses a versioned `CadDesign` schema for four bounded part templates:
mounting plate, circular flange, spacer or bushing, and angle bracket. The
model layer validates dimensions and feature relationships before metrics or
exports are generated.

The geometry layer builds the selected template with Three.js. The viewport
adds orbit control, standard camera views, a grid, edges and wireframe mode.
The drawing component provides an SVG dimension view. The same validated model
also drives area, volume, mass and bounding-envelope calculations.

The design can be saved to browser-profile storage or imported and exported as
versioned JSON. Export adapters produce binary STL, deterministic OpenSCAD and
SVG drawing files. These are client-side downloads in both web and desktop
modes; they do not bypass desktop workspace authority and are not automatically
captured as project evidence.

### UI state

`ProgressContext` owns learning progress, ratings, challenges, reflections,
artefacts, sprint items and theme. It persists a versioned value through
`src/lib/storage.ts`. Import is validated before use, and the dashboard offers
an in-session undo after replacement.

`WorkbenchContext` owns the current desktop session, including the bridge,
open workspace, results, latest receipts, dirty state, active run and recent
identifiers. The Workbench page blocks run and report operations while the
manifest is dirty so captured evidence stays aligned with `workbench.json`.

### Module workflow

`ModuleShell` implements the common eight-stage cycle:

```text
Learn -> Simulate -> Challenge -> Diagnose -> Build -> Evidence -> Reflect -> Next
```

The tab component follows roving-tabindex keyboard behaviour, keeps panel
state mounted and connects tab and panel roles with stable identifiers. Live
PLC and robotics timers pause when their simulator panel is hidden.

### Plots

`LinePlot` is a dependency-free SVG component. It handles line, scatter and
dashed series, rejects non-finite points from geometry, exposes a text
description and provides a tabular data equivalent. Series remain
distinguishable without relying only on colour.

## Desktop command boundary

The Rust application registers only these command groups:

| Group | Commands |
|---|---|
| Workspace authority | `pick_workspace_directory` |
| Workspace files | `read_text_file`, `write_text_file_atomic`, `list_dir`, `hash_file`, `create_dir_all`, `file_exists` |
| Engineering tools | `detect_tool`, `run_tool`, `cancel_run` |

The renderer cannot establish root authority by supplying an absolute string.
The native picker canonicalises and registers the selected directory in
`WorkspaceAuthority`. Every file command and tool run requires that exact
canonical root to remain authorised for the session.

Recent projects deliberately do not bypass this rule. Their stored roots are
display identifiers. Opening one invokes the native picker again and compares
the selected root with the saved identifier before calling workspace APIs.

## Workspace and evidence flow

```text
Select authorised root
        |
create or validate workbench.json
        |
author requirements, files and configurations
        |
save manifest
        |
hash declared inputs -> execute adapter -> capture exact result
        |
atomic save to evidence/latest-run.json
        |
compare receipt hashes with current inputs
        |
atomic save to reports/evidence.md
```

The workspace manifest and latest-run receipt are separate versioned schemas.
The manifest describes intended project configuration. The receipt records one
actual latest result and the hashes captured before that run. Reports use both
and state when evidence is missing, failed, stale or incomplete.

## External tool execution

Rust constructs command arguments from a typed `ToolRunRequest`. It also
re-validates all paths and tool-specific boundaries:

- ngspice receives a generated deck from `simulations/` and writes under
  `results/`. Rust checks the generated control grammar immediately before
  launch and supplies `-n -b`.
- KiCad commands accept only the declared schematic or PCB input extension and
  write only beneath `results/`.
- Tool overrides must have a supported executable name and return a successful
  product-specific version response.
- Execution uses no shell, a bounded timeout, cancellation and capped output.

## File replacement

`workspace_fs.rs` validates the path, creates a unique sibling temporary file
with exclusive creation, writes, flushes and synchronises it, then replaces the
destination. A process-local lock serialises replacements. POSIX uses a
same-filesystem rename. Windows uses `MoveFileExW` with replace-existing and
write-through flags. There is no fallback that first deletes the destination.

## Routing and deployment

`HashRouter` is retained for static GitHub Pages routes. Vite uses the project
base for the web build and relative assets for the Tauri frontend. The shared
source does not import Tauri modules eagerly in web mode.

## Architectural boundaries

- CAD Studio is a bounded parametric template modeller, not a boundary
  representation CAD kernel. It has no STEP exchange, assemblies, mates,
  constraints or free-form feature modelling.
- The desktop app is a controlled orchestrator for ngspice and KiCad, not a
  replacement SPICE or PCB engine.
- No cloud identity, sync, database or telemetry is required.
- External open and reveal is deferred. No current Tauri capability grants it.
- Cross-platform source and CI configuration exist, but current completion
  evidence does not prove macOS or Linux runtime or packaging.
- See [Known-Limitations.md](Known-Limitations.md) for verification gaps and
  [ADR-0004](adr/ADR-0004-External-Process-Security.md) for security trade-offs.
