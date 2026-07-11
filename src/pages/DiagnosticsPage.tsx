import { useCallback, useEffect, useState } from "react";
import { AdapterInfo, DetectionResult } from "../lib/adapters/contract";
import { createRegistry } from "../lib/adapters/instance";
import { getPlatformBridge } from "../lib/platform/tauriBridge";
import { loadToolSettings, saveToolSettings, ToolSettings } from "../lib/settings";

interface Row {
  info: AdapterInfo;
  detection: DetectionResult | null;
}

export function DiagnosticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<ToolSettings>(() => loadToolSettings());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (currentSettings: ToolSettings) => {
    setBusy(true);
    try {
      const bridge = await getPlatformBridge();
      setIsDesktop(bridge !== null);
      const registry = createRegistry(currentSettings);
      const next: Row[] = [];
      for (const info of registry.list()) {
        const adapter = registry.get(info.id)!;
        let detection: DetectionResult;
        try {
          detection = await adapter.detect(bridge);
        } catch (err) {
          detection = { ready: false, error: err instanceof Error ? err.message : String(err) };
        }
        next.push({ info, detection });
      }
      setRows(next);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOverride = (key: keyof ToolSettings, value: string) => {
    const next = { ...settings, [key]: value.trim() || undefined };
    setSettings(next);
    saveToolSettings(next);
  };

  return (
    <section aria-labelledby="diagnostics-heading">
      <h1 id="diagnostics-heading">Toolchain diagnostics</h1>
      <p className="muted">
        Status of every simulation engine and external tool. The app stays fully usable when external tools are
        missing — affected capabilities simply report what to install.
      </p>
      {isDesktop === false && (
        <div className="card" role="note">
          <strong>Web build:</strong> external tools (ngspice, KiCad) run only in the Engineering Workbench desktop
          app. Built-in simulation engines work everywhere.
        </div>
      )}
      <table className="diagnostics-table">
        <caption className="sr-only">Detected engineering tools and their readiness</caption>
        <thead>
          <tr>
            <th scope="col">Tool</th>
            <th scope="col">Status</th>
            <th scope="col">Version</th>
            <th scope="col">Executable</th>
            <th scope="col">Capabilities</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ info, detection }) => (
            <tr key={info.id}>
              <th scope="row">{info.name}</th>
              <td>
                {detection === null ? (
                  "checking…"
                ) : detection.ready ? (
                  <span className="badge">ready</span>
                ) : (
                  <span>
                    <strong>unavailable</strong>
                    {detection.error && <div className="small muted">{detection.error}</div>}
                    {detection.remediation && <div className="small">{detection.remediation}</div>}
                  </span>
                )}
              </td>
              <td>{detection?.version ?? "—"}</td>
              <td className="small">{detection?.executablePath ?? "—"}</td>
              <td className="small">
                <ul className="capability-list">
                  {info.capabilities.map((c) => (
                    <li key={c.id}>
                      <code>{c.id}</code> — {c.title}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isDesktop && (
        <div className="card">
          <h2>Executable path overrides</h2>
          <p className="muted small">
            Leave blank to search PATH and well-known install locations. Changes apply on re-detect.
          </p>
          <div className="slider-row">
            <label htmlFor="ngspice-path">ngspice executable</label>
            <input
              id="ngspice-path"
              type="text"
              value={settings.ngspicePath ?? ""}
              placeholder="e.g. C:\Spice64\bin\ngspice_con.exe"
              onChange={(e) => updateOverride("ngspicePath", e.target.value)}
            />
          </div>
          <div className="slider-row">
            <label htmlFor="kicad-path">kicad-cli executable</label>
            <input
              id="kicad-path"
              type="text"
              value={settings.kicadCliPath ?? ""}
              placeholder="e.g. C:\Program Files\KiCad\9.0\bin\kicad-cli.exe"
              onChange={(e) => updateOverride("kicadCliPath", e.target.value)}
            />
          </div>
        </div>
      )}

      <p>
        <button className="btn" onClick={() => void refresh(settings)} disabled={busy}>
          {busy ? "Detecting…" : "Re-detect tools"}
        </button>
      </p>
    </section>
  );
}
