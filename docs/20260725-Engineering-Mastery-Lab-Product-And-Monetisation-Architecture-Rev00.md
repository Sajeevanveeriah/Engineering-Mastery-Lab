# Engineering Mastery Lab Product and Monetisation Architecture

**Revision:** Rev00  
**Date:** 2026-07-25  
**Status:** Implemented local open-source preview architecture  
**Currency:** AUD for indicative project budgets and future Australian product context

## Product outcome

Engineering Mastery Lab positions structured engineering learning as the
product core:

> Build, simulate and prove real engineering capability.

Project Workbench is one advanced desktop tool inside the product. It is not
the master identity.

## Product hierarchy

```text
Engineering Mastery Lab
  Today
    Continue learning
    Current pathway
    Active project
    Recent work
    Evidence snapshot
  Learn
    Pathways
    Laboratories
    Flagship engineering workflows
    Skills
    Bookmarks
  Build
    Catalogue
    Detail
    Milestones
    Notes
    Evidence
  Analyse
    Calculate and model
    Convert and reference
    Build a shared engineering project record
    Design parts
    Verify and document
    Inspect desktop capability
  Prove
    Evidence
    Skills
    Achievements
    Print, JSON, and Markdown export
```

Pricing, Settings, About, search, and local profile controls are secondary.

## User journeys

### First-run learner

1. Read the local-data boundary.
2. Select goal, disciplines, experience, and weekly effort.
3. Optionally add a display name.
4. Receive a deterministic pathway and first-action recommendation.
5. Open Today or skip onboarding without blocked access.

### Returning learner

1. Open Today.
2. Resume the exact most recent meaningful route.
3. View current pathway and active project.
4. Use evidence counts to choose the next gap.

### Pathway journey

1. Discover with search and filters.
2. Inspect outcomes, prerequisites, effort, steps, evidence, and next route.
3. Enrol locally.
4. Open ordered steps.
5. Mark a unique step complete only after checking its evidence requirement.
6. Resume the first incomplete unique step.

### Laboratory journey

1. Start at Understand and Learn.
2. Practise through simulation and challenge criteria.
3. Apply through diagnosis and build work.
4. Prove through evidence, reflection, and next action.
5. Move into a related Build project or Prove.

### Build journey

1. Filter 12 substantial project briefs.
2. Inspect outcomes, prerequisites, estimate, software, optional hardware,
   safety boundary, milestones, validation, and evidence.
3. Start, pause, or resume locally.
4. Check milestones and evidence.
5. Add notes.
6. Complete only when every required milestone and evidence item is checked.

### Prove journey

1. Aggregate passed challenges, checked artefacts, reflections, evidenced
   skills, completed projects, and manual evidence.
2. Filter by evidence type.
3. Review evidence-based achievements.
4. Print or export JSON and Markdown.

## Data boundary

The current data boundary is browser `localStorage` or the Tauri webview's local
storage. There is no account, hosted database, cloud sync, billing, analytics,
or telemetry request.

Progress schema version 3 contains the local profile, progress, bookmarks,
recent items, project records, evidence, preferences, and bounded engineering
workspace bundle records. Version 1 and version 2 backups migrate
deterministically. Import uses bounded validation and unsafe-key rejection.
Import and reset retain an in-session undo value.

The engineering project workspace uses project schema version 2, project
bundle version 2, Project Pack version 1 and engineering report version 1. The
bundle has deterministic version 1 migration. Project Packs are bounded,
data-only JSON with licence, provenance, compatibility and manifest metadata.
Hashes detect changed content but do not authenticate it.

Project Workbench data remains in a user-selected local workspace and crosses
the existing typed Tauri boundary only after native picker authorisation.

## Provider boundaries

The lean provider model separates product behaviour from future infrastructure:

| Provider | Current implementation | Future implementation boundary |
|---|---|---|
| Learner | Local profile | Hosted identity or organisation membership |
| Progress | Local storage | Authenticated sync with conflict handling |
| Entitlement | Open-source preview, all current features available | Hosted plan and content entitlement evaluation |
| Billing availability | False with explanation | Billing provider availability and customer portal state |
| Product events | No-op | Consent-aware first-party product events |

The providers do not prescribe a backend vendor. They are small interfaces that
can be replaced independently.

Phase 5 adds provider-neutral local foundations for version vectors,
tombstones, operation idempotency, explicit conflict resolution, export and
recovery, curated content manifests, synthetic cohort fixtures and
privacy-thresholded aggregates. These foundations remain data-only and local.
They are not a hosted implementation and do not change the provider states
above.

## Current local-only behaviour

- No sign-in or fake account.
- No payment collection or checkout.
- No external form submission.
- No hosted persistence.
- No entitlement-based feature lock.
- No network telemetry.
- Local profile, progress, notes, bookmarks, and evidence.
- Existing desktop filesystem and process authority unchanged.
- Local engineering project bundles, Project Packs and deterministic reports.
- Local reference synchronisation behaviour and synthetic cohort fixtures only.

## Future hosted architecture

A future hosted implementation can add, in this order:

1. Authenticated learner and organisation identities.
2. Versioned remote progress records with explicit conflict resolution.
3. Content and plan entitlement evaluation.
4. Hosted portfolio files and cross-device sync.
5. Billing status and customer-portal integration.
6. Optional consent-aware product events.
7. Educator cohort and assessment workflows.

The hosted application should keep engineering models pure, retain local
offline capability where practical, and keep filesystem or process authority
inside the desktop boundary.

No future step should place payment or identity logic inside simulation maths,
project data, or evidence validation.

Before any hosted provider is enabled, the product must define and verify:

- authentication, session revocation and least-privilege authorisation;
- tenant separation, organisation membership, record ownership and support
  access;
- data classification, consent, purpose limitation and telemetry controls;
- retention, deletion, tombstone and user-export semantics;
- deterministic conflict handling and auditable resolution;
- audit access and retention;
- incident detection, containment, notification and recovery;
- encrypted backup, tested restore and disaster-recovery objectives; and
- privacy and threat review for the exact provider, data flow and deployment.

## Plan and entitlement model

Stable plan identifiers:

- `free`
- `pro`
- `teams-educators`

Stable entitlement identifiers:

- `starter-learning`
- `full-learning-catalogue`
- `advanced-project-templates`
- `cloud-sync`
- `enhanced-portfolio-exports`
- `assessment-completion-records`
- `ai-tutor`
- `team-cohort-dashboard`

The current `open-source-preview` mode returns true for every declared current
entitlement. Plan metadata cannot remove or silently lock repository features.

Future plan positioning:

| Plan | Intended value | Current state |
|---|---|---|
| Free | Starter hosted learning and local evidence | Represented as metadata |
| Pro | Hosted convenience, full catalogue, advanced projects, sync, richer exports, optional AI tutor | Represented as metadata |
| Teams or Educators | Cohorts, assessment workflows, dashboards, and implementation support | Represented as metadata |

Prices are not set. The application does not show invented AUD prices.

## Evidence-led monetisation options

### Hosted convenience and cross-device sync

Charge for managed identity, reliable hosted storage, multi-device continuity,
backup, and conflict resolution rather than restricting the local educational
code.

### Premium project and assessment packs

Offer deeper industry-context project briefs, datasets, assessor rubrics,
solution guidance, and review workflows as separately managed content.

### Richer portfolio and completion exports

Offer branded templates, structured review packs, assessment summaries, and
verified hosted provenance while clearly separating learner evidence from
accreditation or professional certification.

### Optional AI tutor

A later AI tutor could explain concepts, challenge assumptions, and help review
evidence. It must remain optional, label model limitations, protect private
engineering data, and avoid making certified engineering or safety decisions.

### Educator and team cohorts

Offer cohort assignment, progress overview, rubric-based review, completion
records, organisation controls, and export. Team access requires clear roles
and least-privilege data separation.

### Support and implementation services

Offer curriculum configuration, private deployment, engineering-content
integration, educator onboarding, and desktop-tool adapter support.

### Commercial content or marketplace packs

Curated content packs could cover disciplines, tools, datasets, or assessment
contexts. Licensing, provenance, quality review, and engineering boundaries
must be explicit for every pack.

## MIT licence commercial implications

The repository's current code is licensed under MIT. Subject to the licence
terms, others can use, copy, modify, distribute, and sell the code. This limits
code exclusivity. It does not prevent the project owner from offering paid
hosting, services, premium content, or separate commercial assets.

If commercial exclusivity matters, keep future premium content, trademarks,
hosted operations, proprietary datasets, assessment packs, and separately
licensed assets clearly separated from MIT-licensed code.

This section describes a product-architecture implication. It is not legal
advice. Obtain qualified legal advice for licensing and trademark decisions.

## Deployment constraints

- The web application must remain static-host compatible.
- Hash routing must remain usable on GitHub Pages.
- Vite must retain the verified project base.
- Desktop-only functions must render honest web fallbacks.
- Hosted code must not introduce secrets into the frontend.
- CSP and Tauri capabilities must not be weakened for commercial features.
- Payment, identity, sync, or AI integrations require explicit implementation
  authority, threat modelling, privacy review, and fresh tests.
- The Tauri bundle identifier remains
  `com.sajeevanveeriah.engineeringworkbench` for compatibility.

## Known limitations

- Billing, accounts, sync, and hosted events are intentionally disconnected.
- Collaboration, hosted cohorts and hosted educator analytics are intentionally
  disconnected.
- Local Phase 5 sync, cohort and educator modules are behavioural foundations
  over bounded in-memory records and synthetic fixtures, not hosted services.
- The local profile is not portable without progress export.
- Manual evidence URLs are references, not fetched or verified.
- Achievement labels are local evidence thresholds, not credentials.
- CAD Studio provides bounded parametric templates, 3D inspection, mass
  properties, drawing output, and STL, OpenSCAD, SVG, and JSON exports. It is
  not a general CAD kernel or manufacturing-certified CAD.
- Material data is broad and indicative.
- Project budgets are estimates in AUD and exclude labour, shipping, tools,
  compliance, and regional price variation.
- Existing laboratories are educational models with synthetic inputs.
- Real ngspice and KiCad behaviour depends on separately installed tools and
  the desktop runtime.

## Next production gates

1. Complete fresh browser and desktop visual testing across supported widths.
2. Complete manual keyboard, screen-reader, 200 percent zoom, forced-colour,
   and contrast review.
3. Run real platform CI and packaging evidence for every claimed operating
   system.
4. Run a privacy and threat review before any identity, sync, billing, event, or
   AI connection.
5. Define hosted data ownership, retention, deletion, export, and conflict
   semantics.
6. Define content licensing and trademark boundaries.
7. Validate pricing with customer research before publishing numeric prices.
8. Create support, incident, backup, and recovery procedures.
9. Establish content review and engineering-safety governance.
10. Re-run every release gate against the exact candidate commit and artefacts.

## Product trust statement

Engineering Mastery Lab is commercially extensible because product metadata and
provider boundaries exist without live service coupling. It is not described as
monetisation ready because identity, billing, sync, privacy operations, hosted
security, customer support, and production evidence remain intentionally
unconnected or incomplete.
