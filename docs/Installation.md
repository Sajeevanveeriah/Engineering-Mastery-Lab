# Installation

## Web app

No installation is required. Open the GitHub Pages site, or serve `dist/` from
any static host. The web build includes the Engineering Toolbox, parametric CAD
Studio, learning labs and static SPICE validation. Calculations and CAD run in
the browser, and CAD or calculation files use the browser download flow.

Authorised project workspaces and external ngspice or KiCad execution remain
desktop-only.

## Desktop app (Engineering Workbench)

Unsigned installers are produced by CI (`Desktop packages` workflow) and by a
local build (`npm run build:desktop`):

The desktop shell includes the same Toolbox and CAD features as the web build.
CAD exports use the webview download flow and are not automatically added to an
authorised project workspace.

| Platform | Artefact | Notes |
|---|---|---|
| Windows | `.msi` / `-setup.exe` | Unsigned: SmartScreen will warn. Select "More info", then "Run anyway". Needs WebView2, which is preinstalled on Windows 10 and 11. |
| macOS | `.dmg` / `.app` | Unsigned and un-notarised: right-click, then select "Open" on first launch. |
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

- Install KiCad 7, 8, 9 or 10 from <https://www.kicad.org/download/>. `kicad-cli`
  ships with it. Some capabilities need newer versions: ERC, DRC and BOM
  export require KiCad 8+; board rendering requires KiCad 9+. Netlist and
  gerber/drill export work on KiCad 7+.

After installing, open **Diagnostics** in the app and press **Re-detect
tools**. If a tool is installed somewhere unusual, set its executable path in
the same screen. The app remains fully usable without either tool; affected
capabilities report what is missing and how to fix it.
