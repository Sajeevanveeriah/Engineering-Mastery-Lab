import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import type { AdapterInfo, DetectionResult, ValidationIssue } from "../lib/adapters/contract";
import { createRegistry } from "../lib/adapters/instance";
import { MAX_NETLIST_BYTES, validateNetlist } from "../lib/adapters/ngspice/netlist";
import type { ToolId } from "../lib/platform/bridge";
import { getPlatformBridge } from "../lib/platform/tauriBridge";

interface Row {
  info: AdapterInfo;
  detection: DetectionResult;
}

interface ToolActionStatus {
  tone: "success" | "neutral" | "error";
  message: string;
}

function toolForAdapter(adapterId: string): ToolId | null {
  if (adapterId === "ngspice") return "ngspice";
  if (adapterId === "kicad") return "kicad-cli";
  return null;
}

const sampleNetlist = `* RC low-pass filter
V1 in 0 AC 1
R1 in out 1k
C1 out 0 100n
.end
`;

const kicadMinimumVersion: Record<string, number> = {
  "kicad.erc": 8,
  "kicad.drc": 8,
  "kicad.export-netlist": 7,
  "kicad.export-bom": 8,
  "kicad.export-gerbers": 7,
  "kicad.export-drill": 7,
  "kicad.render": 9
};

function capabilityAvailable(row: Row, capabilityId: string): { ready: boolean; note?: string } {
  if (!row.detection.ready) return { ready: false, note: "Tool unavailable" };
  if (row.info.id !== "kicad") return { ready: true };
  const minimum = kicadMinimumVersion[capabilityId];
  const major = Number(row.detection.version?.match(/\d+/)?.[0]);
  if (minimum && Number.isFinite(major) && major < minimum) return { ready: false, note: `Requires KiCad ${minimum}+` };
  return { ready: true, ...(minimum ? { note: `KiCad ${minimum}+` } : {}) };
}

export function DiagnosticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [toolActionStatus, setToolActionStatus] = useState<ToolActionStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [netlist, setNetlist] = useState("");
  const [netlistIssues, setNetlistIssues] = useState<ValidationIssue[] | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setLoadError(null);
    try {
      const bridge = await getPlatformBridge();
      setIsDesktop(bridge !== null);
      const registry = createRegistry();
      const next = await Promise.all(registry.list().map(async (info): Promise<Row> => {
        try {
          return { info, detection: await registry.get(info.id)!.detect(bridge) };
        } catch (error) {
          return { info, detection: { ready: false, error: error instanceof Error ? error.message : String(error) } };
        }
      }));
      setRows(next);
    } catch (error) {
      setRows([]);
      setIsDesktop(false);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const readyCount = rows.filter((row) => row.detection.ready).length;
  const externalRows = rows.filter((row) => row.info.kind === "external");
  const externalReady = externalRows.filter((row) => row.detection.ready).length;
  const capabilityCount = rows.reduce((sum, row) => sum + row.info.capabilities.length, 0);
  const validationSummary = useMemo(() => {
    if (!netlistIssues) return null;
    return {
      errors: netlistIssues.filter((issue) => issue.severity === "error").length,
      warnings: netlistIssues.filter((issue) => issue.severity === "warning").length
    };
  }, [netlistIssues]);

  const chooseExecutable = async (adapterId: string, label: string) => {
    const tool = toolForAdapter(adapterId);
    if (!tool) return;
    setActiveTool(tool);
    setToolActionStatus(null);
    try {
      const bridge = await getPlatformBridge();
      if (!bridge) throw new Error("Executable selection is available only in the desktop app.");
      const detection = await bridge.pickToolExecutable(tool);
      if (!detection) {
        setToolActionStatus({ tone: "neutral", message: `${label} selection was cancelled. The existing session choice was kept.` });
        return;
      }
      setToolActionStatus({ tone: "success", message: `${label} was selected and validated by the desktop host.` });
      await refresh();
    } catch (error) {
      setToolActionStatus({ tone: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setActiveTool(null);
    }
  };

  const useAutoDetect = async (adapterId: string, label: string) => {
    const tool = toolForAdapter(adapterId);
    if (!tool) return;
    setActiveTool(tool);
    setToolActionStatus(null);
    try {
      const bridge = await getPlatformBridge();
      if (!bridge) throw new Error("Tool auto-detection is available only in the desktop app.");
      await bridge.clearToolExecutable(tool);
      setToolActionStatus({ tone: "success", message: `${label} now uses trusted desktop auto-detection for this session.` });
      await refresh();
    } catch (error) {
      setToolActionStatus({ tone: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setActiveTool(null);
    }
  };

  const validate = () => setNetlistIssues(validateNetlist(netlist));

  return (
    <section className="page diagnostics-page" aria-busy={busy}>
      <PageHeader
        eyebrow="Environment readiness"
        title="Toolchain diagnostics"
        description="See what is available on this machine, which capabilities each adapter can run and what action is required before an engineering workflow starts."
        actions={<button className="btn primary" type="button" onClick={() => void refresh()} disabled={busy || activeTool !== null}><Icon name="refresh" size={17} /> {busy ? "Detecting tools" : "Re-detect tools"}</button>}
      />

      <div className="metric-grid diagnostics-metrics">
        <article className="metric-card"><span className="metric-card__icon"><Icon name="diagnostics" /></span><div><span>Adapters ready</span><strong>{busy ? "…" : `${readyCount}/${rows.length}`}</strong></div></article>
        <article className="metric-card"><span className="metric-card__icon"><Icon name="workbench" /></span><div><span>External tools</span><strong>{busy ? "…" : `${externalReady}/${externalRows.length}`}</strong></div></article>
        <article className="metric-card"><span className="metric-card__icon"><Icon name="labs" /></span><div><span>Capabilities listed</span><strong>{busy ? "…" : capabilityCount}</strong></div></article>
      </div>

      {isDesktop === false && (
        <div className="safety-note safety-note--neutral" role="note">
          <Icon name="info" size={20} />
          <p><strong>Web build.</strong> Built-in learning simulators and the static netlist check below work in the browser. Installed ngspice and KiCad executables can be used only from the desktop application.</p>
        </div>
      )}

      {isDesktop && (
        <div className="safety-note safety-note--neutral" role="note">
          <Icon name="info" size={20} />
          <p><strong>Desktop-controlled executables.</strong> Choose a file through the native window below. The desktop host checks the expected filename and version response, then keeps the approved path only for this app session. Web content cannot submit an executable path.</p>
        </div>
      )}

      {loadError && <div className="inline-message inline-message--error" role="alert"><Icon name="alert" size={18} /><span>Diagnostics could not be loaded: {loadError}</span><button className="btn" type="button" onClick={() => void refresh()}>Retry</button></div>}
      {toolActionStatus && <div className={`inline-message inline-message--${toolActionStatus.tone}`} role={toolActionStatus.tone === "error" ? "alert" : "status"}><Icon name={toolActionStatus.tone === "error" ? "alert" : toolActionStatus.tone === "success" ? "check" : "info"} size={18} /><span>{toolActionStatus.message}</span></div>}

      <section className="diagnostics-section" aria-labelledby="adapter-status-heading">
        <div className="section-heading section-heading--outside"><div><p className="eyebrow">Detected environment</p><h2 id="adapter-status-heading">Adapters and capabilities</h2></div></div>
        {busy && rows.length === 0 ? (
          <div className="diagnostic-grid" aria-live="polite">
            {[0, 1, 2, 3].map((item) => <div className="card skeleton-card" key={item}><span /><span /><span /></div>)}
            <span className="sr-only">Detecting available tools and adapters.</span>
          </div>
        ) : (
          <div className="diagnostic-grid">
            {rows.map((row) => (
              <article className="diagnostic-card" key={row.info.id}>
                <div className="diagnostic-card__header">
                  <div><span className="eyebrow">{row.info.kind === "builtin" ? "Built-in engine" : "External tool"}</span><h3>{row.info.name}</h3></div>
                  <span className={`status-badge ${row.detection.ready ? "status-badge--ok" : "status-badge--unavailable"}`}><span aria-hidden="true" />{row.detection.ready ? "Ready" : "Unavailable"}</span>
                </div>
                <dl className="diagnostic-meta">
                  <div><dt>Version</dt><dd>{row.detection.version ?? "Not detected"}</dd></div>
                  {row.info.kind === "external" && <div><dt>Executable</dt><dd><code>{row.detection.executablePath ?? "Not resolved"}</code></dd></div>}
                </dl>
                {isDesktop && row.info.kind === "external" && (
                  <div className="button-row" aria-label={`${row.info.name} executable controls`}>
                    <button className="primary" type="button" disabled={busy || activeTool !== null} onClick={() => void chooseExecutable(row.info.id, row.info.name)}><Icon name="folder" size={16} /> {activeTool === toolForAdapter(row.info.id) ? "Choosing" : "Choose executable"}</button>
                    <button type="button" disabled={busy || activeTool !== null} onClick={() => void useAutoDetect(row.info.id, row.info.name)}><Icon name="refresh" size={16} /> Use auto-detect</button>
                  </div>
                )}
                {!row.detection.ready && (row.detection.error || row.detection.remediation) && (
                  <div className="diagnostic-remediation"><Icon name="alert" size={17} /><div>{row.detection.error && <strong>{row.detection.error}</strong>}{row.detection.remediation && <p>{row.detection.remediation}</p>}</div></div>
                )}
                <div className="capability-block"><h4>Capabilities</h4><ul>{row.info.capabilities.map((capability) => { const support = capabilityAvailable(row, capability.id); return <li key={capability.id}><span className={`capability-state ${support.ready ? "capability-state--ready" : ""}`}><Icon name={support.ready ? "check" : "close"} size={14} /></span><div><strong>{capability.title}</strong><p>{capability.description}</p>{support.note && <small>{support.note}</small>}</div></li>; })}</ul></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card netlist-validator" aria-labelledby="netlist-validator-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Works in web and desktop</p><h2 id="netlist-validator-heading">SPICE netlist safety check</h2></div>
          {validationSummary && <span className={`status-badge ${validationSummary.errors ? "status-badge--unavailable" : "status-badge--ok"}`}><span aria-hidden="true" />{validationSummary.errors ? `${validationSummary.errors} errors` : "No blocking errors"}</span>}
        </div>
        <p className="muted">Run the same static checks used before an ngspice batch analysis. This checks structure and rejects control blocks or shell escapes; it does not prove the circuit is electrically correct.</p>
        <div className="form-field"><label htmlFor="netlist-text">Netlist text</label><textarea id="netlist-text" className="code-input" rows={12} maxLength={MAX_NETLIST_BYTES} value={netlist} placeholder="Paste a SPICE netlist ending with .end" onChange={(event) => { setNetlist(event.target.value); setNetlistIssues(null); }} /></div>
        <div className="netlist-validator__footer"><span className="small muted">{new Blob([netlist]).size.toLocaleString("en-AU")} of {MAX_NETLIST_BYTES.toLocaleString("en-AU")} bytes</span><div className="button-row"><button type="button" onClick={() => { setNetlist(sampleNetlist); setNetlistIssues(null); }}>Load safe example</button><button type="button" onClick={() => { setNetlist(""); setNetlistIssues(null); }} disabled={!netlist}>Clear</button><button className="primary" type="button" onClick={validate}>Validate netlist</button></div></div>
        {netlistIssues && (
          <div className={`validation-results ${validationSummary?.errors ? "validation-results--error" : "validation-results--ok"}`} role={validationSummary?.errors ? "alert" : "status"}>
            <h3>{validationSummary?.errors ? "Netlist needs changes" : validationSummary?.warnings ? "Netlist is usable with warnings" : "Netlist passed the static check"}</h3>
            {netlistIssues.length === 0 ? <p>No validation issues were found.</p> : <ul>{netlistIssues.map((issue, index) => <li key={`${issue.message}-${index}`}><span className={`badge ${issue.severity === "error" ? "danger" : "warn"}`}>{issue.severity}</span>{issue.message}</li>)}</ul>}
          </div>
        )}
      </section>
    </section>
  );
}
