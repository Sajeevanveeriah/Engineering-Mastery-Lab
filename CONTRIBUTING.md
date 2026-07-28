# Contributing

## Ground rules

- Keep pure logic, including simulation maths, parsers, netlist or report
  generation and curriculum calculations, free of React and Tauri imports.
- Every desktop capability goes through `PlatformBridge`; external-tool
  behaviour must be testable with `MemoryBridge` fixtures.
- New external tools require a Rust allow-list entry and injection tests. See
  [Adapter Authoring Guide](docs/Adapter-Authoring-Guide.md).
- Do not remove or weaken path validation, timeouts, cancellation or output
  caps.
- Keep curriculum logic pure. React pages may render and edit records, but
  counts, prerequisite graphs, diagnostic rules, week calculations and
  progress dimensions belong in `src/lib/curriculum.ts`.

## Authoring learning objects

The accelerated reboot source of truth is
`src/data/rebootCurriculum.ts`. It is a reviewed canonical extraction, not a
runtime workbook parser. Do not hand-edit one copied value without reconciling
the authoritative workbook provenance and the complete validation suite.

Every accelerated session needs:

- a stable S-prefixed identifier and content version;
- one milestone, planned-minute value and session kind;
- micro-lesson, build or test, retrieval close and evidence requirement;
- source ids that resolve in the canonical inventory; and
- an explicit proof classification where diagnostic skipping must be blocked.

Every complete curriculum module needs:

- a stable EML-prefixed identifier, stage, domain number and content version;
- valid prerequisite ids and a reachable acyclic position;
- measurable outcomes, vocabulary and symbols;
- equations with SI units and dimension statements;
- a numeric example with raw inputs, formula, rounding rule, expected value
  and an independent method;
- retrieval, practical work, mistakes, diagnostic guidance, evidence and a
  measurable mastery gate;
- source provenance and an accessible visual equivalent; and
- an educational Engineers Australia Stage 1 mapping with the non-accrediting
  boundary retained.

When an identifier changes, add an explicit alias and a conflict test. Never
reuse an old id for different content. Preserve proof-session identity.

Resource changes require provenance, access classification, the workbook
check record, and a dated revalidation result. A failed or blocked resource
must remain visible. Do not infer access from a URL or replace an official
source with unreviewed generated content.

Learning-object changes require focused curriculum tests, complete unit tests,
the production build, affected route and accessibility checks, responsive and
zoom checks, and human pixel inspection of every affected named state.

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:visual-review
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

Run dependency audits separately and report residual advisories without
weakening or hiding them.

## Style

- TypeScript strict; no `any` unless unavoidable and justified.
- Small, reviewable commits with imperative messages such as `feat: ...`,
  `fix: ...`, `docs: ...`, or `ci: ...`.
- UK spelling in documentation and UI copy.
- SI units for engineering values.
- Tests first for new deterministic behaviour; fixtures for tool output.
- Use ASCII punctuation in authored text. U+2013 and U+2014 block release.

## Scope guard

Out of scope: a general CAD kernel, graphical schematic or PCB editor, FEM or
CFD solver, hosted sync, AI-generated designs, bundled third-party engineering
tools, auto-update and code signing. The existing bounded CAD Studio and local
provider-neutral foundations do not broaden those boundaries. Open an issue
before starting work in these areas.
