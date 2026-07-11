# Release checklist (v0.1.x)

## Quality gates (all must be green)

- [ ] `npm run lint` (strict TypeScript)
- [ ] `npm test` (full vitest suite)
- [ ] `npm run build` (web, GitHub Pages base)
- [ ] `cargo fmt --check` in `src-tauri`
- [ ] `cargo clippy --all-targets -- -D warnings` in `src-tauri`
- [ ] `cargo test` in `src-tauri`
- [ ] `npm run build:desktop` succeeds on at least one host
- [ ] `npm audit --omit=dev --audit-level=high` clean
- [ ] Secret scan of the diff (no keys, tokens, machine paths)

## Functional verification

- [ ] Web build: all lab routes render; Workbench/Diagnostics show correct
      web-mode messaging; no console errors
- [ ] Desktop: create/open/save project; open the example workspace
- [ ] Missing-tool state: Diagnostics shows remediation; runs return
      `tool-missing` without crashing
- [ ] With ngspice installed: the three example circuits run (op/ac/tran) and
      CSVs appear in `results/`
- [ ] Evidence report regenerates byte-identical for an unchanged project
      (except the generation timestamp line)
- [ ] Keyboard navigation and dark/light themes on new screens

## Release mechanics

- [ ] Version bumped consistently: `package.json`, `src-tauri/Cargo.toml`,
      `src-tauri/tauri.conf.json`, `APP_VERSION` in `WorkbenchPage.tsx`
- [ ] CHANGELOG.md updated and dated
- [ ] Licence decision executed (LICENSE file present) if publishing publicly
- [ ] Tag `vX.Y.Z` pushed; `Desktop packages` workflow green on **all three**
      platforms (a platform is verified only by an actual runner result)
- [ ] Checksums file present in each artefact; spot-verify one download
- [ ] Known-Limitations.md reflects reality for this release
