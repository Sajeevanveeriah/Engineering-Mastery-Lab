# Engineering Workbench (Engineering Mastery Lab)

**Engineering Workbench v0.1.0** is a cross-platform desktop application
(Tauri 2) and web app. It combines the original Engineering Mastery Lab — an
interactive, fully client-side learning site — with a local engineering
workbench: portable project workspaces, ngspice circuit simulation, KiCad CLI
validation/export, toolchain diagnostics and deterministic evidence reports.

The web build (GitHub Pages) keeps every learning lab; the desktop build adds
the external-tool workbench. See [docs/Installation.md](docs/Installation.md)
for both.

## Workbench (desktop) features

- **Project workspaces** — portable directories with a versioned
  `workbench.json` manifest, requirement traceability and standard folders
  (see [examples/rc-filter-workspace](examples/rc-filter-workspace)).
- **ngspice adapter** — netlist validation, DC operating point, DC sweep, AC
  and transient analyses of an already-installed ngspice, with parsed
  numerical output, plots and CSV export.
- **KiCad CLI adapter** — ERC/DRC with structured findings, netlist/BOM/
  gerber/drill export and board rendering via an already-installed
  `kicad-cli`, gated on the detected KiCad version.
- **Toolchain diagnostics** — every engine and tool with executable, version,
  readiness, capabilities and remediation. The app stays fully usable when
  external tools are missing.
- **Evidence reports** — deterministic Markdown reports covering metadata,
  requirements, tool versions, input hashes, configurations, results,
  limitations and reproduction steps.
- **Security model** — no shell strings, allow-listed subcommands, workspace-
  scoped path validation, process timeouts and output caps
  ([ADR-0004](docs/adr/ADR-0004-External-Process-Security.md)).

ngspice and KiCad are **not bundled**; the workbench integrates with existing
installations and degrades gracefully without them.

## Learning labs

An interactive, fully client-side learning experience for applied engineering:
controls, electrical/electronics, embedded systems, PLC/SCADA, robotics,
AI/ML, mechanical dynamics and professional engineering practice.

Learn by **simulating, passing challenges, diagnosing faults and building a
portfolio** — not by reading passive notes.

## Features

- **Dashboard** — domain skill scores, recommended next module, weekly sprint
  checklist, portfolio artefact tracker, JSON progress export/import.
- **Skills matrix** — 15 domains × 3 levels with outcomes, practice tasks,
  linked simulators, self-ratings and evidence fields.
- **7 learning pathways** — ordered routes through the labs.
- **8 interactive labs**, each with the full module structure (Learn /
  Simulate / Challenge / Diagnose / Build / Evidence / Reflect / Next):
  - PID Control (1st/2nd-order plants, disturbance, saturation, step metrics)
  - Electrical & Electronics (Ohm, RC charge/filter, RLC, divider + ADC)
  - Embedded (FSM, debounce, interrupt vs polling, UART/SPI/I2C frames)
  - PLC & SCADA (tank with alarms/trip, conveyor with interlocks, HMI, trend)
  - Robotics (differential drive, noisy odometry, waypoints, A* planner)
  - AI/ML (regression, kNN + confusion matrix, anomaly detection, RUL)
  - Mechanical (gears/power, spring-mass-damper, vibration explorer)
  - Practice (traceability matrix, FMEA, risk register, FAT/SAT, decision log)
- Dark/light mode, mobile-first responsive layout, keyboard-accessible
  controls, no backend, no tracking, no secrets.

## Setup

Requires Node.js 20+ (22 recommended).

```bash
npm install
npm run dev        # local dev server
```

## Test, lint, build

```bash
npm test           # vitest unit tests for all simulation engines + storage
npm run lint       # TypeScript strict type-check (tsc --noEmit)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

## Deploy to GitHub Pages

1. In the repository settings, set **Pages → Source → GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs tests,
   builds and deploys automatically.
3. The site appears at `https://<user>.github.io/engineering-mastery-lab/`.

If you fork under a different repository name, update `base` in
`vite.config.ts` to match.

## Progress data

Progress (ratings, challenges, reflections, artefacts, theme) is stored in
your browser's `localStorage` only. Use **Dashboard → Export progress** to
back it up as JSON and **Import progress** to restore or move devices. The
Practice Lab tools export their artefacts as standalone JSON files.

## Desktop build

Requires the Rust toolchain (stable) plus platform webview dependencies — see
[docs/Development-Setup.md](docs/Development-Setup.md).

```bash
npm run tauri dev      # desktop app with hot reload
npm run build:desktop  # unsigned installers into src-tauri/target/release/bundle/
```

CI builds unsigned Windows/macOS/Linux packages with checksums on version tags
(`.github/workflows/desktop.yml`).

## Documentation

- [docs/Architecture.md](docs/Architecture.md) — layers, components, decisions
- [docs/adr/](docs/adr) — architecture decision records (Tauri, adapters,
  workspace schema, process security, code sharing)
- [docs/Installation.md](docs/Installation.md) — installing the app and tools
- [docs/Development-Setup.md](docs/Development-Setup.md) — dev environment
- [docs/Adapter-Authoring-Guide.md](docs/Adapter-Authoring-Guide.md) — add a tool
- [docs/Troubleshooting.md](docs/Troubleshooting.md) — common problems
- [docs/Known-Limitations.md](docs/Known-Limitations.md) — current boundaries
- [docs/Release-Checklist.md](docs/Release-Checklist.md) — release gates
- [docs/Third-Party-Licences.md](docs/Third-Party-Licences.md) — dependency licences
- [SECURITY.md](SECURITY.md) · [CONTRIBUTING.md](CONTRIBUTING.md) ·
  [CHANGELOG.md](CHANGELOG.md)
- [docs/Learning_Roadmap.md](docs/Learning_Roadmap.md) — suggested 12-week plan
- [docs/Future_Supabase_Integration.md](docs/Future_Supabase_Integration.md) —
  auth/cloud sync/Vercel roadmap

## Licence

Not yet licensed for redistribution (`private: true`, no LICENSE file). All
direct npm dependencies are MIT; the Rust dependency tree is permissive
(MIT/Apache-2.0/BSD/Zlib/Unicode, a few MPL-2.0 crates — file-level copyleft
only), so **MIT**, **Apache-2.0** or dual MIT/Apache-2.0 (the Rust convention)
are all viable. Recommendation: **Apache-2.0** for its explicit patent grant,
given the engineering-tooling audience. Details in
[docs/Third-Party-Licences.md](docs/Third-Party-Licences.md).

## Disclaimer

All simulations are simplified educational models using synthetic data. This
site does not replace professional engineering judgement, does not demonstrate
compliance with any engineering standard, and must never be used as a source
of procedures for live machinery or safety systems.
