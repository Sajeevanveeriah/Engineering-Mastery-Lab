# ADR-0001: Adopt Tauri 2 as the desktop shell

Date: 2026-07-11 · Status: Accepted

## Context

Engineering Workbench v0.1 needs a cross-platform desktop shell that can spawn local processes
(ngspice, kicad-cli), read and write project directories, and package for Windows, macOS and
Linux — while preserving the existing React + TypeScript + Vite frontend and its GitHub Pages
web deployment.

Options considered:

1. **Tauri 2** — Rust core, system webview, first-class Vite integration, small installers
   (~10 MB), typed IPC commands, capability-based permission model, official three-OS CI action.
2. **Electron** — Node core, bundled Chromium (~100 MB+ artefacts), process spawning trivially
   easy but a much larger attack surface and heavier maintenance for a solo project.
3. **PWA + local agent** — keeps everything web, but external-tool execution would require a
   separately installed helper daemon; two artefacts to version and secure.

## Decision

Adopt **Tauri 2**. The frontend remains untouched web code; desktop-only behaviour goes through
a typed command boundary implemented in Rust. The web-only build continues to work by keeping
`src-tauri` fully additive and switching the Vite `base` only when building for Tauri.

## Consequences

- A Rust toolchain (with MSVC on Windows) becomes a build-time dependency for desktop packaging.
- External process security (timeouts, output caps, path validation, no shell strings) is
  implemented once in Rust rather than in JS.
- Installers are small and CI can build all three platforms with `tauri-apps/tauri-action` or
  plain `cargo tauri build` on native runners.
- The system webview differs per OS; the UI sticks to widely supported CSS/JS features already
  in use.
