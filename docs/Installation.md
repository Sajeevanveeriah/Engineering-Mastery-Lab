# Installation

## Web app (learning labs only)

No installation. Open the GitHub Pages site, or serve `dist/` from any static
host. External tools (ngspice, KiCad) are desktop-only.

## Desktop app (Engineering Workbench)

Unsigned installers are produced by CI (`Desktop packages` workflow) and by a
local build (`npm run build:desktop`):

| Platform | Artefact | Notes |
|---|---|---|
| Windows | `.msi` / `-setup.exe` | Unsigned: SmartScreen will warn ("More info → Run anyway"). Needs WebView2 (preinstalled on Windows 10/11). |
| macOS | `.dmg` / `.app` | Unsigned and un-notarised: right-click → Open on first launch. |
| Linux | `.deb` / `.rpm` / `.AppImage` | Requires webkit2gtk 4.1 at runtime. |

Verify downloads against the `SHA256SUMS-<platform>.txt` file uploaded with
each build.

## External tools (optional, desktop only)

The workbench integrates with tools you install yourself; nothing is bundled.

### ngspice

- Windows: install from <https://ngspice.sourceforge.io> (typically
  `C:\Spice64`). The console binary `ngspice_con.exe` is preferred and found
  automatically in `C:\Spice64\bin`.
- macOS: `brew install ngspice`.
- Linux: `sudo apt install ngspice` (or distro equivalent).

### KiCad (kicad-cli)

- Install KiCad 7, 8 or 9 from <https://www.kicad.org/download/>. `kicad-cli`
  ships with it. Some capabilities need newer versions: BOM export and ERC
  JSON require KiCad 8+, board rendering requires KiCad 9+.

After installing, open **Diagnostics** in the app and press **Re-detect
tools**. If a tool is installed somewhere unusual, set its executable path in
the same screen. The app remains fully usable without either tool — affected
capabilities report what is missing and how to fix it.
