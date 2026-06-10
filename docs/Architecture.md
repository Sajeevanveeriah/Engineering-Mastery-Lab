# Architecture

## Overview

Engineering Mastery Lab is a fully client-side React + TypeScript single-page
app built with Vite. There is no backend: all simulations run in the browser
and all progress lives in `localStorage`, with JSON export/import for backup
and portability.

## Layer separation

```
src/
  lib/simulations/   Pure simulation engines (no React, fully unit tested)
  lib/storage.ts     Progress persistence + import/export validation
  lib/metrics.ts     Domain scoring derived from progress
  data/              Static content: skills matrix, modules, pathways
  components/        Reusable UI (plot, sliders, tabs, module shell, layout)
  pages/             One page per app section; labs wire engines to UI
  tests/             Vitest suites for every engine + storage round-trip
```

Rules enforced by convention:

1. **`lib/` never imports React.** Every equation lives in a pure function so
   it can be tested and reused (e.g. `simulatePid`, `rlcStepResponse`,
   `conveyorScan`, `aStar`, `fitLinearRegression`).
2. **`data/` is declarative content only.** Adding a module or skill domain is
   a data change, not a code change — `ModuleShell`, `SkillsMatrix` and the
   dashboard render whatever the data describes.
3. **Pages own UI state, engines own physics.** Lab pages hold slider state in
   React and call engines via `useMemo` (static plots) or `setInterval`
   (live processes like the tank, conveyor and robot).

## Key components

- **`ModuleShell`** renders the standard module structure (Learn / Simulate /
  Challenge / Diagnose / Build / Evidence / Reflect / Next) around any
  simulator, and binds challenges, artefact checklists and reflections to the
  progress store.
- **`LinePlot`** is a dependency-free SVG plotter used by all labs.
- **`ProgressContext`** loads progress once, persists on every change, and
  applies the theme (`data-theme` attribute drives CSS variables).

## Routing & deployment

`HashRouter` is used so deep links work on GitHub Pages without a 404
workaround. The Vite `base` is `/engineering-mastery-lab/` to match the
project-pages URL. `.github/workflows/deploy.yml` runs tests, builds, and
publishes `dist/` via the official Pages actions on every push to `main`.

## Storage model

`ProgressState` (versioned, currently v1) holds skill ratings + evidence,
challenge results, reflections, artefact checkboxes, sprint checklist and
theme. `importProgress` validates the version and shape before replacing
state. The Practice Lab's artefact builders (FMEA, traceability, risk
register, FAT, decision log) persist under separate `localStorage` keys and
export standalone JSON artefacts.

## Why these choices

- **No charting/state libraries:** keeps the bundle small, the maths visible
  and the code teachable — the app is itself a learning artefact.
- **Deterministic randomness** (`makeRng`, sine-based noise): simulations are
  reproducible and testable.
- **Versioned progress schema:** enables future migration to Supabase (see
  `Future_Supabase_Integration.md`) without breaking existing exports.
