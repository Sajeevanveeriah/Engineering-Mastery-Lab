# ADR-0005: Web and desktop code sharing through a platform bridge

Date: 2026-07-11

Status: Accepted, amended by the completion branch

## Context

The same React codebase serves the static GitHub Pages application, which has
no local filesystem or process authority, and the Tauri desktop application,
which adds bounded Project Workbench capability. Direct
`window.__TAURI_INTERNALS__` checks throughout pages would couple application
logic to one host and make pure engineering models harder to verify.

## Decision

- `PlatformBridge` in `src/lib/platform/bridge.ts` is the only frontend seam
  for tool detection, native executable selection, typed tool execution,
  authorised workspace file operations, hashing and native workspace
  selection.
- `getPlatformBridge()` returns a cached `TauriBridge` promise in the desktop
  host and `null` in the web build. UI that requires the bridge renders an
  honest desktop-only state.
- `TauriBridge` dynamically imports `@tauri-apps/api/core` and invokes named
  commands only.
- Tests use `MemoryBridge`, an in-memory implementation with scriptable tool
  behaviour. Fixture-backed ngspice and KiCad verification remains labelled as
  fixture-only when the real tool is absent.
- Pure simulation maths, the shared engineering kernel, Project Pack and report
  logic, parsers, manifest validation and provider-neutral ecosystem records
  import neither React nor the platform bridge. They take validated data in and
  return data.
- The current bridge has no arbitrary command, arbitrary argument, external
  open or external reveal operation. The Tauri capability manifest grants no
  opener permission.
- Vite uses `/Engineering-Mastery-Lab/` for the web build and `./` when
  `TAURI_ENV_PLATFORM` is present for a desktop build. `HashRouter` keeps route
  handling compatible with static hosting and the desktop webview.

## Consequences

- The static web build cannot acquire desktop authority from browser state or a
  supplied path.
- The Tauri API module is absent from eager web execution and loads only when
  the desktop host is detected.
- Every desktop operation remains visible as a typed bridge method, named Tauri
  command, Rust validator and explicit capability permission.
- Kernel, interchange, flagship and Phase 5 local-foundation logic can be
  verified without a Tauri runtime.
- Web and desktop share one application and one route model without forked
  pages.
- Adding a new native capability requires a separate bridge, command, Rust
  boundary, capability and security review. A TypeScript interface alone does
  not grant authority.
