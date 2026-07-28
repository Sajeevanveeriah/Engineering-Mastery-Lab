# Known limitations

## Release classification

Engineering Mastery Lab v0.2.0 is an uncommitted local implementation
candidate on branch `saj/complete-engineering-workbench`. Project Workbench is
one desktop capability inside the product. The current working tree is not a
production release and is not cleared for public redistribution.

## Verification gaps

- The complete current local TypeScript, unit, Chromium, visual and Rust matrix
  is recorded in `Release-Checklist.md`. The production-only audit retains two
  moderate React Router advisories. The complete audit retains those entries
  plus five high PostCSS entries propagated through the development toolchain.
  npm reports no fix for the listed vulnerable package paths. No dependency
  change was authorised.
- The earlier Phase 1.1 through Phase 5 application checkpoint was built into
  fresh non-empty Windows x64 MSI and NSIS bundles and their SHA-256 hashes
  were recorded. Those binaries do not contain the later curriculum
  integration. The earlier release executable opened a responding native
  window titled `Engineering Mastery Lab` and was then closed. The installers
  have not been installed, signed or tested on a clean host.
- macOS and Linux runtime and package behaviour is unverified. Source and CI
  configuration are not substitutes for actual runner results.
- ngspice and KiCad were not installed on the development host used for the
  completion checks. Their parsers and adapter workflows are fixture-tested,
  but a real-tool end-to-end run remains required.
- The current-source browser matrix includes Chromium automation, axe checks,
  reflow, forced colours, deterministic snapshots and 66 named visual-review
  states. Firefox, WebKit, Safari, NVDA, JAWS and VoiceOver remain unverified.
  No formal WCAG conformance claim is made.
- The earlier packaged Tauri webview startup was smoke-tested, but the later
  curriculum integration was not repackaged or launched. No current
  interaction test exercises a complete webview-to-IPC adapter workflow. Rust
  command tests and TypeScript `MemoryBridge` tests verify each side, but not
  that packaged-process contract.

## Workspace boundaries

- Root authority lasts only for the current desktop session. Recent projects
  must be re-selected in the native folder picker after restart. A different
  selected root is rejected rather than silently opening another location.
- Recent identifiers and tool-path overrides are local browser-profile state,
  not portable workspace data.
- Desktop workbench manifest schema version 1 and receipt schema version 2 are
  supported. Newer, missing or malformed versions are rejected; these desktop
  files have no migration framework.
- Browser progress schema version 4 can import deterministic version 1,
  version 2 and version 3 backups. It does not import an unsupported future
  progress version.
- Engineering project schema version 2 and project bundle schema version 2 are
  current. Bundle version 1 has a deterministic migration path. There is no
  general project migration registry.
- The in-app text editor is intentionally limited to supported text inputs in
  `circuits/` and `requirements/`, with a 1 MiB editor limit. It is not a
  general file manager or graphical schematic or PCB editor.
- File replacement is atomic per file, not transactional across several files.
  If project creation stops halfway, some standard directories may already
  exist even though unrelated existing files are not removed.

## Tool execution boundaries

- ngspice is batch-only. User `.control`, include, library, shell, system and
  exec constructs are rejected. This prevents unsafe or transitive commands
  but also excludes legitimate advanced netlists that rely on those features.
- KiCad checks and exports require a compatible CLI. ERC, DRC and BOM use KiCad
  8 or newer, board render uses KiCad 9 or newer, and discovery includes KiCad
  10 paths. Actual compatibility still needs real-tool verification.
- Tool detection is not cryptographic provenance. A malicious replacement
  binary could use an expected file name and imitate a product version banner.
- Timeout and cancellation use a Windows Job Object or Unix process group to
  terminate descendants, with direct-child termination as a fallback. Source
  tests cover the current host path, but packaged behaviour on every supported
  operating system remains unverified.
- A narrow validation-to-use race remains if another process can modify a
  generated deck between final validation and the tool opening the file.
- Cancellation does not roll back partial external-tool outputs. Directory
  exports can also retain obsolete files whose names are no longer emitted by
  a later run.
- Output capture is bounded. If a reader does not drain within the post-process
  deadline, the captured stream is marked truncated rather than blocking.
- External tools run with the current user's privileges and retain their own
  parser and implementation risks.

## Evidence boundaries

- The project persists one latest-run receipt between sessions, not a complete
  run history. A later run replaces `evidence/latest-run.json` atomically.
- The receipt records declared input paths that exist when hashing occurs. A
  missing declared input cannot be hashed and remains an adapter validation
  failure rather than being represented as captured evidence.
- Reports compare receipt hashes with current inputs and state mismatches, but
  they do not sign or notarise evidence.
- Desktop Workbench evidence reports remain Markdown only. The shared
  engineering workspace generates deterministic Markdown and JSON reports and
  offers browser printing; it has no certified PDF renderer or signed report
  pipeline.
- A successful adapter status means execution and parsing completed. It does
  not by itself prove engineering acceptance or regulatory compliance.

## Calculation and materials boundaries

- Toolbox calculators are equation-based screening and preliminary-design
  aids. They expose their main assumptions, but do not select the governing
  standard, load combination, duty cycle, safety factor, tolerance or
  acceptance criterion for a project.
- Results have input validation and deterministic equations, but no general
  uncertainty propagation, significant-figure policy or independent design
  verification workflow.
- The unit converter supports its listed quantity families only. It does not
  perform dimensional analysis across arbitrary compound expressions.
- Material values are indicative reference values. They are not supplier
  certificates, design allowables or substitutes for grade, temper, heat,
  orientation, temperature and process-specific data.
- The voltage-drop tool is a resistive estimate, not cable ampacity,
  protection coordination, installation-method or AS/NZS 3008 selection
  advice. Similar domain-specific warnings shown by other calculators remain
  part of the required engineering review.

## Shared engineering kernel boundaries

- The current engineering project schema is a local TypeScript reference
  kernel, not a general symbolic mathematics, finite-element, optimisation,
  uncertainty-propagation or multidisciplinary solver.
- The unit registry covers a bounded set of dimensions and units. It does not
  parse arbitrary compound unit expressions or prove dimensional consistency
  outside registered quantities.
- Variables can retain tolerance or uncertainty metadata, but the current
  motor-sizing calculation does not propagate uncertainty.
- Scenario comparison is deterministic and one record at a time. It is not a
  parameter sweep, sensitivity study, Monte Carlo analysis or optimiser.
- CSV and JSON dataset imports are bounded and typed, but there is no remote
  fetch, streaming import, spreadsheet formula evaluation or large-data
  engine.
- Notebook blocks are sanitised plain text or typed references. There is no
  executable code cell, rich-text renderer, remote embed or collaborative
  editing.
- The evidence graph validates references and rejects directed cycles. It does
  not authenticate evidence, sign provenance or independently verify a claimed
  relationship.
- The motor-sizing vertical slice calculates continuous and peak requirements.
  It does not choose a product, check manufacturer curves, thermal limits,
  fatigue, electrical drive limits, controls stability or certification.

## Portable interchange boundaries

- Project bundles and Project Packs are JSON documents, not compressed archive
  formats. A Project Pack manifest describes virtual files and does not write
  them to the local filesystem.
- SHA-256 values detect content changes but are not signatures, authentication,
  proof of authorship, notarisation or malicious-content prevention.
- Project Pack schema version 1 has no migration path. Unknown schema versions
  fail closed. Catalogue duplicate ids require an explicit integrity-hash
  selection rather than silent precedence.
- Project Pack executable-content checks are deliberately conservative and may
  reject legitimate prose containing script-like patterns. They are not a
  general malware scanner.
- Report output is deterministic only for identical validated inputs, including
  the explicit timestamp and environment fields. Browser printing depends on
  the host print pipeline.

## CAD boundaries

- CAD Studio is a bounded template-based modelling layer, not a general
  boundary representation, or B-rep, geometry kernel.
- Supported templates are mounting plates, circular flanges, spacers or
  bushings, and angle brackets. There are no free-form sketches, general
  booleans, arbitrary fillets or chamfers, threads, sheet-metal features,
  surfaces or direct modelling.
- There are no assemblies, mates, geometric or dimensional constraints,
  configurations, feature suppression, collaborative revision control or
  product lifecycle management integration.
- STEP, IGES and native commercial CAD formats are not supported. Exports are
  binary STL, OpenSCAD source, SVG drawing and Engineering Mastery Lab design
  JSON.
- STL does not encode units. The exporter models dimensions in millimetres and
  the receiving application must be set to millimetres explicitly.
- SVG output is a template drawing aid, not a standards-compliant production
  drawing. It has no general drawing sheets, title blocks, GD&T, surface finish,
  weld symbols, fit selection, revision approval or tolerance stack analysis.
- Geometry checks cover the supported parameter relationships only. They do
  not verify stress, fatigue, buckling, fits, clearances, fastener selection,
  tool access, minimum wall rules, printability, machinability or regulatory
  compliance.
- CAD drafts live in the browser or webview profile. Downloaded exports are not
  automatically placed in an authorised workbench workspace, linked to
  requirements or captured in an evidence receipt.
- Exported geometry must be inspected in the production CAD or CAM system used
  for release.

## Curriculum and learning-record boundaries

- The complete curriculum and accelerated reboot are educational structures.
  They do not assess professional competency, confer accreditation, replace a
  degree, grant a licence or prove fitness for a real engineering decision.
- Engineers Australia Stage 1 labels are educational mappings only. Engineers
  Australia has not reviewed, endorsed or accredited this implementation.
- Workbook-derived resource checks are dated records. Most resources were not
  fetched again during this implementation run. The interface distinguishes
  retained workbook evidence from newer revalidation.
- External-resource access can change after the recorded date. An official
  label does not guarantee availability, free access, current compatibility or
  endorsement.
- Completion, diagnostic score, confidence, evidence reference and
  mastery-gate result are learner-controlled local records. The application
  does not authenticate evidence or independently observe task performance.
- Diagnostic scores of 3 or 4 can skip ordinary lesson sessions but cannot
  skip proof or release sessions. This rule prevents a software shortcut; it
  does not prove that a diagnostic was performed honestly.
- The 2,750-minute accelerated plan is workbook source data, not a promise of
  completion time. Actual learning time varies and is recorded separately.
- The twelve-week block plan cycles against ISO calendar weeks. It does not
  read private calendars, infer free time, resolve time zones for appointments
  or schedule notifications.
- P1-P4 are local learning releases, not deployed robot releases. Hardware
  purchasing, deployment and safety acceptance remain outside the product.
- The resource inventory can become visually long because all 64 source
  records remain inspectable. Search and track filters reduce the set, but
  there is no server-side pagination.

## Product boundaries

- The browser build cannot read local workspaces or execute installed tools.
  It shows a clear desktop-only explanation and keeps the learning application
  available.
- External open and reveal is not implemented. The current TypeScript bridge,
  UI and Tauri capability manifest expose no such operation.
- There is no cloud sync, collaboration, account system, mobile application,
  auto-update, code signing, notarisation, bundled ngspice or bundled KiCad.
- There is no FEM, CFD, multibody solver, general CAD geometry kernel or
  production safety-controller integration.
- The repository includes an MIT licence, but public release still requires a
  refreshed third-party licence review and completion of the release gates.

## Phase 5 local foundation boundaries

- The local reference synchronisation provider stores records in memory. It is
  not durable cloud synchronisation, multi-device continuity or a network
  protocol.
- Version vectors, tombstones, idempotent operation receipts, explicit
  conflict resolution, export and recovery are behavioural foundations only.
  They do not provide authentication, authorisation, encryption, transport,
  tenant separation, durable audit storage or backup.
- Opaque identifier validation prevents direct names and email addresses in
  identifier fields. A producer must still generate non-personal random or
  explicitly synthetic tokens.
- Cohort and educator providers accept deterministic synthetic fixtures only.
  No real learner, educator or organisation data is supported.
- Aggregate release uses a minimum learner group size of five and suppresses
  all outcome counts below that threshold. This single rule is not a complete
  privacy or re-identification control.
- Hosted identity, synchronisation, billing, collaboration, cohort services
  and educator analytics remain unavailable. The application makes no claim
  that those services exist.
