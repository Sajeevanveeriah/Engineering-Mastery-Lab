# ADR-0006: Engineering Design Studio boundaries and authority

Date: 2026-08-09

Status: Accepted for the task branch, release-gated

## Context

The baseline repository contained a bounded template CAD page and controlled
ngspice and KiCad command adapters. This task branch now contains editable CAD
and EDA domain slices, graphical schematic and PCB workspaces and one exact
B-rep worker path. The task authorises an isolated implementation branch and a normal
push only after every mandatory gate passes. It does not authorise a merge,
deployment, release, global installation, generic process capability, remote
code, billing, telemetry or hosted account dependency.

`CONTRIBUTING.md` previously listed a general CAD kernel and graphical EDA as
out of scope. The current task explicitly supersedes that product scope for
this branch. It does not supersede the existing security, accessibility,
evidence, platform bridge or release controls. No external issue is opened,
because creating an issue would be a separate externally visible mutation.

## Authority record

| Action | Current task authority | Gate before action | Current state |
|---|---|---|---|
| Inspect the configured Git remote | Explicitly requested | Record exact remote and baseline | Complete |
| Create `codex/engineering-design-studio-v1` | Explicitly requested through the task-branch requirement | Clean checkout and verified baseline | Complete |
| Add project-local packages | Authorised only for the required vertical slice | Stages A and B green, exact package and licence review, lockfile-only install | Complete for the exact pair and two reviewed security overrides below |
| Run installed KiCad or ngspice | Authorised only through the existing controlled adapters when available | Session authority, exact executable validation and version capture | Not available |
| Commit and push this task branch | Explicitly authorised after all mandatory gates pass | Task-only diff plus all release gates green | Held |
| Merge, deploy, publish or release | Not authorised | New target-specific approval required | Prohibited |

The verified baseline is
`302e0df8a35de31defc8d779bffa16d975dd8d9e`. Local `main`, cached
`origin/main` and `git ls-remote --heads origin main` all resolved to that
exact SHA before branch creation. The configured remote is
`https://github.com/sajeevanveeriah/engineering-mastery-lab.git`.

Stages A and B passed before dependency installation: 29 focused CAD tests,
137 combined foundation and integration tests, owned ESLint checks and the
whole TypeScript typecheck were green. The dependency action is therefore
limited to `replicad@0.23.1` and `replicad-opencascadejs@0.23.0` as exact
project-local dependencies. It does not authorise a global package, a second
kernel, a provider, a remote script, publication or any other package change.

The post-install production audit reported zero vulnerabilities. The complete
development audit then exposed two high-severity transitive advisories in
`brace-expansion@5.0.8` and `nanoid@3.3.16`. Their patched, API-compatible
versions `5.0.9` and `3.3.17` are MIT-licensed and were reviewed through exact
npm metadata before adding lockfile overrides. These overrides are a bounded
security repair for the existing lint and build toolchains, not new runtime
capabilities.

## Decision

### Product and data ownership

- CAD Studio and EDA Studio are lazy local-first routes.
- Native EML JSON documents own editable feature history and circuit or board
  intent. Meshes and exchange B-reps do not acquire native feature history.
- Core authoring, local persistence, validation and open-format export remain
  free and offline-capable. This task adds no account, paywall, telemetry,
  billing or hosted requirement.
- Browser storage and download or import are the baseline. Desktop workspace
  persistence may use `PlatformBridge` only after the user selects and
  authorises the exact workspace root.

### Geometry authority

- Three.js remains the renderer and mesh interchange layer. It is not an exact
  modelling kernel.
- The release path may contain one OCCT WASM implementation only.
- The selected pair is `replicad@0.23.1` and
  `replicad-opencascadejs@0.23.0`, installed with exact versions after Stages A
  and B passed.
- Replicad owns the high-level modelling adapter. Its matching OCCT build runs
  only inside a lazy, terminable Web Worker. No `occt-import-js` or second
  OpenCascade build is shipped.
- Exact shapes are tessellated into transferable arrays for Three.js. Kernel
  objects never cross the worker boundary.
- Topological naming is not claimed as solved. Failed features retain the last
  valid shape and identify unstable or dangling selections.
- STEP export is within the tested exact slice. STEP preview import returns
  tessellation with assumed millimetres and explicit metadata that topology,
  hierarchy, source units and features are not retained. The preview is tested,
  but immutable exact import is `NOT_VERIFIED`. IGES and BREP import remain
  explicit unsupported formats. No exchange file receives native feature history.

### Dependency and licence review

The current official npm metadata reported:

| Package | Exact version | Declared licence | Unpacked size | Intended role |
|---|---:|---|---:|---|
| `replicad` | 0.23.1 | MIT | 6,450,418 bytes | High-level B-rep API |
| `replicad-opencascadejs` | 0.23.0 | MIT | 22,799,684 bytes | Single tailored OCCT WASM build |

The Replicad documentation recommends loading OpenCascade.js in a Web Worker
and injecting the instance with `setOC`. The current OCCT licensing page states
that OCCT 6.7 and later use LGPL version 2.1 with the Open CASCADE exception.
It also identifies user notice, licence access, corresponding source or build
availability and practical replacement with a modified OCCT as distribution
obligations.

The npm-rendered Replicad README contains stale AGPL wording, while the exact
package metadata, installed `LICENSE`, public source tag and licence-history
commit identify MIT. The exact artefacts, rather than the stale README, are the
recorded licence evidence. Installation for local verification is still not a
licence release decision.

The local package inspection resolved that Replicad inconsistency. The exact
`replicad@0.23.1` tarball identifies source commit
`45b9b8b7c594cd5dc38617edaf220ab4cd72778f` and contains the MIT licence. The
upstream licence history records the explicit MIT relicensing commit before
that release. The stale README text is retained upstream documentation, not
the resolved package licence. The exact `replicad-opencascadejs@0.23.0`
tarball identifies source commit
`19fb8212e0bb12a07a7a49f96950f8903903d469`; the matching public tree contains
the custom binding and build configuration. Binary inspection identifies the
embedded kernel as Open CASCADE Technology 7.6. Copies of both package MIT
licences, LGPL 2.1 and the Open CASCADE Exception 1.0 are stored under
`docs/licenses/`. The reviewed `replicad_single.wasm` is 10,855,736 bytes with
SHA-256
`2E07C45B83267B38D3102EC411FAD11E7CE2ED71854084E461C5AB5FEE94AAFF`.
Source, replacement and rebuild instructions are in `Source-Register.md` and
notices are in `Third-Party-Licences.md`. Final packaging must still prove that
only this one OCCT WASM is emitted. The upstream wrapper build's unpinned Docker
image means bit-for-bit OCCT reproduction remains `NOT_VERIFIED`.

### Archive and EDA dependencies

- STL and 3MF use the installed Three.js add-on loaders.
- 3MF central-directory and relationship checks are implemented locally with
  strict budgets before Three.js expands the archive. No separate general ZIP
  package is added unless the local implementation fails its hostile fixtures.
- EDA uses an original bounded local symbol and footprint palette plus a
  neutral versioned schema. No third-party symbol or footprint library is
  copied.
- Circuit JSON concepts inform the adapter boundary, but a fast-moving viewer
  package does not own the persisted document and no user-authored code runs.

### Native authority

- The existing exact tool IDs, native executable selection, fixed command
  mappings, argument vectors without a shell, authorised workspace roots,
  canonical containment, symlink and junction rejection, cancellation,
  output caps and SHA-256 evidence remain mandatory.
- The renderer does not gain arbitrary executable paths, arguments, file
  access, network fetch, opener, navigation or general shell capability.
- KiCad and ngspice remain separately installed external tools. Fixture-backed
  checks are labelled `FIXTURE_VERIFIED`; absent or unauthorised real tools are
  labelled `NOT_VERIFIED`.

## Resource and failure budgets

Initial implementation budgets are deliberately conservative and must be
measured against the final fixtures:

| Resource | Initial limit |
|---|---:|
| Input file | 64 MiB |
| 3MF entries | 256 |
| 3MF expanded bytes | 128 MiB |
| 3MF per-entry compression ratio | 100:1 |
| Rendered mesh triangles | 2,000,000 |
| CAD command history | 50 by default |
| EDA command history | 100 by default |
| Worker job timeout | 60 seconds |
| Worker count per CAD route | 1 mesh plus 1 exact-kernel worker |

Traversal, absolute paths, backslashes, unsafe URI schemes, external 3MF
relationships, encrypted entries, unsupported archive methods, non-finite
geometry, duplicate IDs, dangling references and future document versions fail
closed. Cancellation, route exit and fatal worker errors terminate workers.

## Consequences

- The implementation can prove a bounded real vertical slice without claiming
  parity with FreeCAD, Fusion, Inventor, SolidWorks, EasyEDA, Eagle, KiCad or
  Altium.
- The OCCT route adds a large lazy payload and LGPL distribution work. This is
  accepted only if measured browser, Tauri and packaged results stay within the
  documented budgets and the full notice and replaceability gate passes.
- Missing KiCad or ngspice does not weaken the in-app work or native security.
  It limits the final status to fixture evidence plus real-tool not verified.
- Any unresolved security, licence, desktop package, visual inspection,
  performance, offline or automated-test failure blocks commit and push.

## Rollback

Before commit, rollback is deletion of task-owned new modules plus surgical
reversion of task-owned integration lines and exact removal of the two selected
packages from `package.json` and `package-lock.json`. Existing CAD, Tauri,
adapter, Academy and Workbench behaviour must remain intact. No user document
is migrated destructively; legacy CAD draft data remains readable and is never
deleted automatically.
