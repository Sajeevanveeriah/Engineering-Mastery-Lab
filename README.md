# Engineering Mastery Lab

Engineering Mastery Lab is a structured engineering learning product for
building, simulating, applying, and proving practical capability. It combines
guided laboratories, coherent pathways, substantial project briefs, local
engineering tools, and learner-generated portfolio evidence.

The shared React and TypeScript application runs as a static GitHub Pages web
application and in a Tauri 2 desktop shell. Project Workbench is an advanced
desktop tool inside the product. It is not the product's master identity.

Build, simulate and prove real engineering capability.

## Product structure

The global application has five primary destinations:

- Today: one clear continue action, current pathway, active project, recent
  work across the product, the next accelerated session, current capability
  stage, milestone, rover release, weekly review, and an evidence snapshot.
- Learn: the complete E0-E4 prerequisite roadmap, the S001-S110 accelerated
  reboot, practical diagnostics, a source inventory, pathways, laboratories,
  five flagship engineering workflows, skills, discovery, and bookmarks.
- Build: four workbook-derived rover releases plus 12 retained data-driven
  engineering briefs with milestones, validation, notes, evidence, estimates,
  and local state.
- Analyse: calculators, unit conversion, materials reference, the shared
  engineering project workspace, curriculum progress analysis, CAD Studio,
  Project Workbench, and diagnostics.
- Prove: the defensible rover capstone, challenge, artefact, reflection, skill,
  project, and manual evidence with print, JSON, and Markdown exports.

Pricing, Settings, About, search, and the local profile are secondary actions
in the top bar.

## Guided learning

The complete curriculum adds five dependency-ordered capability stages:

- E0 Engineering Starter
- E1 Undergraduate Foundations
- E2 Mechatronics Core
- E3 Robotics and AI Specialisation
- E4 R&D Mastery and Proof

Those stages contain 25 substantive domain modules. Every module includes
prerequisites, measurable outcomes, vocabulary and symbols, equations with SI
units, a worked numeric example with an independent check, retrieval practice,
a practical task, diagnostic guidance, evidence requirements, a mastery gate,
source provenance, an accessible visual equivalent, and non-accrediting
Engineers Australia Stage 1 educational mapping.

The accelerated reboot is the workbook-derived execution track. It contains
exactly 110 stable sessions, S001-S110, grouped into milestones M0-M9 and four
rover releases. Its total plan is 2,750 minutes, or 45 hours 50 minutes.
Practical diagnostic scores of 3 or 4 may skip ordinary lesson sessions.
Milestone proof and release sessions remain mandatory.

Ten resumable pathways cover:

- Controls and Automation
- Embedded and Electronics
- Robotics and Autonomy
- AI and ML for Engineers
- Industrial Systems and SCADA
- Mechanical Design and Dynamics
- Engineering Analysis and Calculations
- Mechatronics Integration
- Verification and Professional Practice
- Software Engineering for Engineers

Every laboratory retains the original eight stages:

```text
Learn -> Simulate -> Challenge -> Diagnose -> Build -> Evidence -> Reflect -> Next
```

The interface groups them into Understand, Practise, Apply, and Prove. Each
stage remains addressable, timed simulators remain mounted, and the existing
panel-activity context pauses PLC and robotics timers while their simulator is
hidden.

Five flagship workflows add deeper, fixture-backed learning for controls,
robotics and autonomy, embedded electronics and sensing, mechanical design and
dynamics, and applied AI and ML. Each workflow retains prerequisites, outcomes,
equations, a deterministic fixture, challenge criteria, failure cases, a
rubric, and links into Build and Prove.

## Local profile and progress

First-run onboarding creates an optional versioned local learner profile from a
goal, disciplines, experience level, weekly effort, and optional display name.
Deterministic rules recommend a pathway. Onboarding can be skipped and edited
later.

Progress schema version 4 stores:

- every version 1 skill rating, challenge result, reflection, artefact, sprint
  item, and theme;
- profile and onboarding state;
- pathway enrolments and completed step identifiers;
- laboratory stage positions;
- bookmarks and recent items;
- project milestones, evidence, notes, and state;
- validated local engineering workspace records containing bounded project
  bundle JSON;
- manual evidence and evidence-based achievements;
- theme and accessibility preferences;
- bounded unknown version 1 fields under `legacy`.
- selected System, Light, or Dark appearance separately from the resolved
  light or dark presentation;
- curriculum records with completion state, blocker, confidence, actual
  minutes, notes, evidence references, attempt count, diagnostic result,
  mastery-gate result, completion time, and content version; and
- weekly planned-versus-completed review records.

Version 1, version 2, and version 3 imports are migrated deterministically.
Existing explicit Light or Dark choices remain explicit; a missing new
preference defaults to System. Stable content aliases migrate only when the
mapping is unambiguous, and conflicting current and aliased records block the
import. Import
validation remains
bounded by file size, collection size, key safety, string length, URL, route,
timestamp, and nesting checks. Prototype-pollution keys are rejected. Settings
provides a validated preview and exact in-session undo after import or reset.

All profile and progress data stays in the current browser profile or desktop
webview. There is no account, live cloud sync, billing, or telemetry endpoint.

## Tools and desktop capability

The web and desktop builds include the learning laboratories, a validated
engineering-calculator catalogue, unit conversion, materials reference,
parametric CAD Studio, portfolio, and static SPICE validation.

The lazy-loaded engineering project workspace at `/tools/engineering` provides
the local foundations for a shared engineering kernel:

- engineering project schema version 2 with unit-bearing variables, SI base
  values, provenance, assumptions, validation state, uncertainty metadata and
  calculation-version references;
- bounded CSV and JSON datasets, named scenarios, deterministic scenario
  comparison, controlled plain-text notebook blocks and acyclic evidence
  lineage;
- a motor-sizing vertical slice covering continuous and peak torque, speed and
  mechanical power without selecting a commercial motor;
- project bundle schema version 2 with deterministic version 1 migration,
  SHA-256 integrity checking, import preview, conflict reporting and
  in-session undo;
- data-only Project Pack schema version 1 with compatibility metadata,
  virtual-file manifest, licence and provenance; and
- deterministic Markdown and JSON engineering reports with accessible chart
  tables, limitations and integrity metadata.

The five flagship routes and engineering workspace are route-local lazy
chunks. Their pure kernel, interchange and ecosystem modules do not add native
authority.

The Tauri desktop build additionally provides Project Workbench:

- authorised local workspace selection;
- bounded text-file operations;
- built-in analyses;
- typed ngspice and KiCad CLI adapters;
- persisted run receipts and evidence reports;
- desktop capability diagnostics.

ngspice and KiCad are not bundled. Their missing states remain explicit and do
not disable the learning product.

CAD Studio is lazy-loaded and uses Three.js only inside its route chunk. It
supports bounded plate, flange, spacer, and angle templates with 3D and drawing
previews, validation, mass properties, local draft storage, and STL, OpenSCAD,
SVG, and JSON exports. A WebGL capability check, defensive renderer creation,
local fallback and route recovery keep parameters, drawing preview and exports
usable when 3D rendering is unavailable. It is not a general CAD kernel or
manufacturing-certified CAD. Project Workbench and Diagnostics are also
lazy-loaded behind local route recovery.

## Desktop security boundary

The redesign does not change the Rust authority or Tauri capability boundary:

- the renderer cannot authorise an arbitrary filesystem path;
- a native picker establishes a canonical workspace root for the session;
- every filesystem and tool request must remain inside that canonical root;
- paths are checked for lexical and canonical containment, including symlinks
  and Windows junctions;
- external tools receive allow-listed argument vectors without a shell;
- timeouts, cancellation, output caps, safe relative paths, and atomic file
  replacement remain enforced;
- the capability manifest grants no external open or reveal permission.

See [SECURITY.md](SECURITY.md) and
[ADR-0004](docs/adr/ADR-0004-External-Process-Security.md).

## Commercial extension boundary

Pure TypeScript interfaces define local learner, progress, entitlement, billing
availability, and product-event providers. The current application uses:

- a local learner provider;
- a local progress provider;
- an open-source-preview entitlement provider that keeps every current feature
  available;
- billing availability set to false;
- a no-op product event provider.

Provider-neutral Phase 5 foundations also define bounded local reference
records for version-vector synchronisation, explicit conflict resolution,
tombstones, idempotent operation receipts, export and recovery, curated
content manifests, synthetic cohort fixtures, and privacy-thresholded educator
aggregates. These modules are local and data-only. Hosted identity,
synchronisation, billing, collaboration, cohorts and educator analytics remain
unavailable and no network provider is connected.

The Pricing page describes possible Free, Pro, and Teams or Educators hosted
offers without a checkout, form submission, external request, or payment
collection.

See
[Product and Monetisation Architecture](docs/20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md).

## Setup

Node.js 22.22 or newer is required.

```bash
npm install
npm run dev
```

Dependencies should be installed only as an explicit setup action. Version
0.2 adds Three.js and its TypeScript declarations for the lazy CAD route.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:visual-review
npm audit --omit=dev --audit-level=high
git diff --check
```

`npm run test:e2e` uses the locked Playwright version and a locally installed
Chromium runtime. Install that runtime once with
`npx playwright install chromium`. Browser tests include route smoke,
keyboard-focus, automated accessibility and reviewed visual-regression states.
`npm run test:visual-review` separately captures the complete required state
set for human inspection; a successful capture command is not itself a visual
pass.

Desktop development also needs the stable Rust toolchain and platform webview
dependencies described in
[Development Setup](docs/Development-Setup.md).

Run Rust checks from `src-tauri/`:

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

Historical completion and release-readiness reports describe dated snapshots.
They do not verify the current changed working tree. Run the commands above
against the exact state being reviewed.

## Static and desktop routing

`HashRouter` keeps route state inside the URL fragment for static GitHub Pages
hosting. The Vite web base remains `/Engineering-Mastery-Lab/`, while the Tauri
frontend uses relative assets.

Legacy aliases remain available for `/labs`, every `/labs/:id`, `/skills`,
`/pathways`, `/toolbox`, `/cad`, `/workbench`, and `/diagnostics`.

The current foundation routes include:

- `/learn/roadmap`
- `/learn/reboot`
- `/learn/reboot/sessions/S001` through `/learn/reboot/sessions/S110`
- `/learn/modules/:moduleId`
- `/learn/diagnostics`
- `/learn/resources`
- `/projects/releases/P1` through `/projects/releases/P4`
- `/tools/progress`
- `/portfolio/capstone`
- `/learn/flagships/controls`
- `/learn/flagships/robotics-autonomy`
- `/learn/flagships/embedded-electronics-sensing`
- `/learn/flagships/mechanical-design-dynamics`
- `/learn/flagships/applied-ai-ml`
- `/tools/engineering`

The verified repository configuration identifies the static deployment route
as:

`https://sajeevanveeriah.github.io/Engineering-Mastery-Lab/`

## Documentation

- [Architecture](docs/Architecture.md)
- [Data and Schema Model](docs/Data-And-Schema-Model.md)
- [Kernel Authoring Guide](docs/Kernel-Authoring-Guide.md)
- [Project Pack Format](docs/Project-Pack-Format.md)
- [Migration Guide](docs/Migration-Guide.md)
- [Curriculum Integration and Verification](docs/20260728-Curriculum-Integration-And-Verification-Rev00.md)
- [Learning Roadmap](docs/Learning_Roadmap.md)
- [Contributing](CONTRIBUTING.md)
- [Product and Monetisation Architecture](docs/20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md)
- [Future Hosted-Provider Integration](docs/Future_Supabase_Integration.md)
- [Release Checklist](docs/Release-Checklist.md)
- [Installation](docs/Installation.md)
- [Development Setup](docs/Development-Setup.md)
- [Known Limitations](docs/Known-Limitations.md)
- [Adapter Authoring Guide](docs/Adapter-Authoring-Guide.md)
- [Security](SECURITY.md)
- [Architecture Decision Records](docs/adr)

## Licence and engineering use

This project is licensed under the [MIT License](LICENSE). Subject to its
terms, the code can be used, copied, modified, distributed, and sold by others.
This statement is not legal advice.

The learning simulations use simplified educational models with synthetic or
user-supplied data. Calculations, reference values, completion records, and
exports do not demonstrate standards compliance, accreditation, professional
licensure, or certified engineering validity. Validate every real-world
engineering decision independently.
