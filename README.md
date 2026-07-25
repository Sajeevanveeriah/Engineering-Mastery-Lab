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

- Home: one clear continue action, current pathway, active project, recent
  tools, and an evidence snapshot.
- Learn: pathways, laboratories, skills, filters, discovery, and bookmarks.
- Projects: 12 data-driven engineering briefs with milestones, validation,
  notes, evidence, estimates, and local state.
- Tools: calculators, unit conversion, materials reference, CAD Studio,
  Project Workbench, and diagnostics.
- Portfolio: challenge, artefact, reflection, skill, project, and manual
  evidence with print, JSON, and Markdown exports.

Pricing, Settings, About, search, and the local profile are secondary actions
in the top bar.

## Guided learning

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

## Local profile and progress

First-run onboarding creates an optional versioned local learner profile from a
goal, disciplines, experience level, weekly effort, and optional display name.
Deterministic rules recommend a pathway. Onboarding can be skipped and edited
later.

Progress schema version 2 stores:

- every version 1 skill rating, challenge result, reflection, artefact, sprint
  item, and theme;
- profile and onboarding state;
- pathway enrolments and completed step identifiers;
- laboratory stage positions;
- bookmarks and recent items;
- project milestones, evidence, notes, and state;
- manual evidence and evidence-based achievements;
- theme and accessibility preferences;
- bounded unknown version 1 fields under `legacy`.

Version 1 imports are migrated deterministically. Import validation remains
bounded by file size, collection size, key safety, string length, URL, route,
timestamp, and nesting checks. Prototype-pollution keys are rejected. Settings
provides in-session undo after import or reset.

All profile and progress data stays in the current browser profile or desktop
webview. There is no account, live cloud sync, billing, or telemetry endpoint.

## Tools and desktop capability

The web and desktop builds include the learning laboratories, a validated
engineering-calculator catalogue, unit conversion, materials reference,
parametric CAD Studio, portfolio, and static SPICE validation.

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
SVG, and JSON exports. It is not a general CAD kernel or
manufacturing-certified CAD. Project Workbench and Diagnostics are also
lazy-loaded.

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

The Pricing page describes possible Free, Pro, and Teams or Educators hosted
offers without a checkout, form submission, external request, or payment
collection.

See
[Product and Monetisation Architecture](docs/20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md).

## Setup

Node.js 20 or newer is required. Node.js 22 is recommended.

```bash
npm install
npm run dev
```

Dependencies should be installed only as an explicit setup action. Version
0.2 adds Three.js and its TypeScript declarations for the lazy CAD route.

## Quality commands

```bash
npm run lint
npm test
npm run build
git diff --check
```

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

The verified repository configuration identifies the static deployment route
as:

`https://sajeevanveeriah.github.io/Engineering-Mastery-Lab/`

## Documentation

- [Architecture](docs/Architecture.md)
- [Product and Monetisation Architecture](docs/20260725-Engineering-Mastery-Lab-Product-And-Monetisation-Architecture-Rev00.md)
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
