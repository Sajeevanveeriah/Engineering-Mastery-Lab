# Example workspace: RC Filter Study

A complete Engineering Workbench project demonstrating the end-to-end circuit workflow:
requirements → circuits → ngspice simulations → results → evidence report.

## Contents

- `workbench.json` - project manifest (schemaVersion 1).
- `requirements/spec.md` - three verifiable requirements.
- `circuits/` - three documented example netlists:
  - `rc-lowpass.cir` - RC low-pass filter, fc ≈ 1.59 kHz (AC sweep, REQ-001).
  - `voltage-divider.cir` - 5 V → 3.33 V resistive divider (operating point, REQ-002).
  - `rlc-series.cir` - underdamped series RLC (transient, REQ-003).
- `simulations/`, `results/`, `evidence/`, `reports/` - populated when simulations run.

## How to use

1. Launch the Engineering Workbench desktop app.
2. Workbench → Open project → select this folder.
3. Run each configured simulation (ngspice must be installed - see Diagnostics).
4. Generate the evidence report from the Workbench page; it is written to `reports/`.

Without ngspice installed, the project still opens and validates; simulation runs
report a structured "tool missing" result with remediation guidance.
