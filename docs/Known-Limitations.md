# Known limitations

## Release classification

Engineering Workbench v0.2.0 is a functional completion candidate. It is not a
production release and is not cleared for public redistribution.

## Verification gaps

- Installer, responsive-route and dependency-audit evidence currently records
  the v0.1.0 completion baseline. The v0.2.0 Toolbox and CAD changes require a
  refreshed release verification run.
- The completion changes were built into fresh non-empty Windows x64 MSI and
  NSIS bundles and their SHA-256 hashes were recorded. The installers have not
  been installed, signed or interactively smoke-tested, so packaged runtime
  behaviour remains unverified.
- macOS and Linux runtime and package behaviour is unverified. Source and CI
  configuration are not substitutes for actual runner results.
- ngspice and KiCad were not installed on the development host used for the
  completion checks. Their parsers and adapter workflows are fixture-tested,
  but a real-tool end-to-end run remains required.
- Browser rendering received manual review and the final responsive audit
  passed all 90 route and width cases with zero document overflow. There is no
  automated axe, NVDA, VoiceOver, browser-zoom or formal WCAG conformance
  assessment.
- No current end-to-end test crosses the actual Tauri webview and IPC runtime.
  Rust command tests and TypeScript `MemoryBridge` tests verify each side, but
  not a packaged-process contract.

## Workspace boundaries

- Root authority lasts only for the current desktop session. Recent projects
  must be re-selected in the native folder picker after restart. A different
  selected root is rejected rather than silently opening another location.
- Recent identifiers and tool-path overrides are local browser-profile state,
  not portable workspace data.
- Manifest schema version 1 and receipt schema version 1 are supported. Newer,
  missing or malformed versions are rejected; there is no migration framework.
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
- Cancellation kills the direct child but does not provide complete descendant
  process-tree containment on every supported operating system.
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
- Reports are Markdown only. There is no PDF or HTML rendering pipeline.
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
  binary STL, OpenSCAD source, SVG drawing and Engineering Workbench design
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

## Product boundaries

- The browser build cannot read local workspaces or execute installed tools.
  It shows a clear desktop-only explanation and keeps the learning application
  available.
- External open and reveal is not implemented. A TypeScript bridge method
  remains for future work, but there is no current UI action or Tauri grant.
- There is no cloud sync, collaboration, account system, mobile application,
  auto-update, code signing, notarisation, bundled ngspice or bundled KiCad.
- There is no FEM, CFD, multibody solver, general CAD geometry kernel or
  production safety-controller integration.
- The repository includes an MIT licence, but public release still requires a
  refreshed third-party licence review and completion of the release gates.
