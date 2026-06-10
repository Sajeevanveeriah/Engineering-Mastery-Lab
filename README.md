# Engineering Mastery Lab

An interactive, fully client-side learning website for applied engineering:
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

## Documentation

- [docs/Architecture.md](docs/Architecture.md) — layers, components, decisions
- [docs/Learning_Roadmap.md](docs/Learning_Roadmap.md) — suggested 12-week plan
- [docs/Future_Supabase_Integration.md](docs/Future_Supabase_Integration.md) —
  auth/cloud sync/Vercel roadmap

## Disclaimer

All simulations are simplified educational models using synthetic data. This
site does not replace professional engineering judgement, does not demonstrate
compliance with any engineering standard, and must never be used as a source
of procedures for live machinery or safety systems.
