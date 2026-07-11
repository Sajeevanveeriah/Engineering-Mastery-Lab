import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinePlot } from "../components/LinePlot";
import { AdapterResult } from "../lib/adapters/contract";
import { createRegistry } from "../lib/adapters/instance";
import { PlatformBridge } from "../lib/platform/bridge";
import { getPlatformBridge } from "../lib/platform/tauriBridge";
import { loadToolSettings } from "../lib/settings";
import { buildEvidenceReport, InputFileRecord, SimulationRun, ToolRecord } from "../lib/report/evidence";
import { SimulationConfig } from "../lib/workspace/manifest";
import {
  createWorkspace,
  loadRecentProjects,
  OpenWorkspace,
  openWorkspace,
  RecentProject,
  rememberRecentProject,
  saveWorkspace
} from "../lib/workspace/workspace";

const APP_VERSION = "0.1.0";

export function WorkbenchPage() {
  const [bridge, setBridge] = useState<PlatformBridge | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<OpenWorkspace | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>(() => loadRecentProjects());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AdapterResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const registry = useMemo(() => createRegistry(loadToolSettings()), []);

  useEffect(() => {
    getPlatformBridge().then(setBridge, (err) => {
      setBridge(null);
      setError(`Failed to initialise the desktop bridge: ${err instanceof Error ? err.message : String(err)}`);
    });
  }, []);

  const openAt = useCallback(
    async (root: string) => {
      if (running !== null) return; // don't switch workspaces mid-run
      const b = await getPlatformBridge();
      if (!b) return;
      try {
        const ws = await openWorkspace(b, root);
        abortRef.current?.abort();
        abortRef.current = null;
        setWorkspace(ws);
        setResults({});
        setError(null);
        setNotice(`Opened "${ws.manifest.name}".`);
        setRecents(rememberRecentProject({ root, name: ws.manifest.name }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [running]
  );

  const pickAndOpen = async () => {
    if (!bridge) return;
    const root = await bridge.pickDirectory("Open Engineering Workbench project");
    if (root) await openAt(root);
  };

  const pickAndCreate = async () => {
    if (!bridge) return;
    const root = await bridge.pickDirectory("Choose an empty folder for the new project");
    if (!root) return;
    try {
      const name = root.split(/[\\/]/).filter(Boolean).pop() ?? "New project";
      const ws = await createWorkspace(bridge, root, name, "");
      setWorkspace(ws);
      setResults({});
      setError(null);
      setNotice(`Created project "${name}".`);
      setRecents(rememberRecentProject({ root, name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const runSimulation = async (sim: SimulationConfig) => {
    if (!bridge || !workspace) return;
    const hit = registry.resolveCapability(sim.capabilityId);
    if (!hit) {
      setError(`No adapter provides capability "${sim.capabilityId}".`);
      return;
    }
    setRunning(sim.id);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await hit.adapter.execute(
        { capabilityId: sim.capabilityId, params: sim.params },
        { bridge, workspaceRoot: workspace.root, signal: controller.signal }
      );
      setResults((prev) => ({ ...prev, [sim.id]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(null);
      abortRef.current = null;
    }
  };

  const cancelRun = () => abortRef.current?.abort();

  const generateReport = async () => {
    if (!bridge || !workspace) return;
    try {
      const tools: ToolRecord[] = [];
      for (const info of registry.list()) {
        const detection = await registry.get(info.id)!.detect(bridge);
        tools.push({
          name: info.name,
          ready: detection.ready,
          version: detection.version,
          executablePath: detection.executablePath,
          error: detection.error
        });
      }
      const inputFiles: InputFileRecord[] = [];
      const seen = new Set<string>();
      for (const sim of workspace.manifest.simulations) {
        const rel = sim.params.netlistRelPath ?? sim.params.inputRelPath;
        if (typeof rel === "string" && !seen.has(rel)) {
          seen.add(rel);
          if (await bridge.fileExists(workspace.root, rel)) {
            inputFiles.push({ relPath: rel, sha256: await bridge.hashFile(workspace.root, rel) });
          }
        }
      }
      const runs: SimulationRun[] = Object.entries(results).map(([simulationId, result]) => ({ simulationId, result }));
      const report = buildEvidenceReport({
        manifest: workspace.manifest,
        appVersion: APP_VERSION,
        generatedUtc: new Date().toISOString(),
        tools,
        inputFiles,
        runs,
        limitations: []
      });
      await bridge.createDirAll(workspace.root, "reports");
      await bridge.writeTextFileAtomic(workspace.root, "reports/evidence.md", report);
      setNotice("Evidence report written to reports/evidence.md.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const saveProject = async () => {
    if (!bridge || !workspace) return;
    try {
      const manifest = await saveWorkspace(bridge, workspace);
      setWorkspace({ ...workspace, manifest });
      setNotice("Project saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (bridge === undefined) {
    return (
      <section aria-labelledby="workbench-heading">
        <h1 id="workbench-heading">Workbench</h1>
        <p className="muted">Starting…</p>
      </section>
    );
  }

  if (bridge === null) {
    return (
      <section aria-labelledby="workbench-heading">
        <h1 id="workbench-heading">Workbench</h1>
        <div className="card">
          <p>
            The project workbench — local workspaces, ngspice simulation and KiCad validation — is part of the
            <strong> Engineering Workbench desktop app</strong>. This web version includes all learning labs and the
            netlist validator on the Diagnostics page.
          </p>
          <p className="small muted">
            Get the desktop app from the project releases page, or build it locally with <code>npm run build:desktop</code>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="workbench-heading">
      <h1 id="workbench-heading">Workbench</h1>
      {error && (
        <div className="card" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      {notice && !error && (
        <p className="muted" role="status">
          {notice}
        </p>
      )}

      <div className="card">
        <h2>Project</h2>
        <p>
          <button className="btn" onClick={() => void pickAndCreate()} disabled={running !== null}>
            New project…
          </button>{" "}
          <button className="btn" onClick={() => void pickAndOpen()} disabled={running !== null}>
            Open project…
          </button>{" "}
          {workspace && (
            <button className="btn" onClick={() => void saveProject()}>
              Save project
            </button>
          )}
        </p>
        {workspace ? (
          <p>
            <strong>{workspace.manifest.name}</strong>
            <span className="small muted"> — {workspace.root}</span>
          </p>
        ) : (
          <p className="muted">No project open.</p>
        )}
        {recents.length > 0 && !workspace && (
          <>
            <h3>Recent projects</h3>
            <ul>
              {recents.map((r) => (
                <li key={r.root}>
                  <button className="btn" onClick={() => void openAt(r.root)}>
                    {r.name}
                  </button>{" "}
                  <span className="small muted">{r.root}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {workspace && (
        <>
          <div className="card">
            <h2>Requirements</h2>
            {workspace.manifest.requirements.length === 0 ? (
              <p className="muted">None recorded in the manifest.</p>
            ) : (
              <ul>
                {workspace.manifest.requirements.map((r) => (
                  <li key={r.id}>
                    <strong>{r.id}</strong> — {r.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Simulations</h2>
            {workspace.manifest.simulations.length === 0 && <p className="muted">None configured in the manifest.</p>}
            {workspace.manifest.simulations.map((sim) => {
              const result = results[sim.id];
              return (
                <div key={sim.id} className="card">
                  <h3>
                    {sim.title} <code className="small">{sim.capabilityId}</code>
                  </h3>
                  <p>
                    <button className="btn" onClick={() => void runSimulation(sim)} disabled={running !== null}>
                      {running === sim.id ? "Running…" : "Run"}
                    </button>{" "}
                    {running === sim.id && (
                      <button className="btn" onClick={cancelRun}>
                        Cancel
                      </button>
                    )}
                  </p>
                  {result && (
                    <div aria-live="polite">
                      <p>
                        <span className="badge">{result.status}</span> {result.message}
                      </p>
                      {result.tables[0] && result.tables[0].columns.length >= 2 && (
                        <LinePlot
                          title={result.tables[0].title}
                          xLabel={result.tables[0].columns[0].name}
                          series={result.tables[0].columns.slice(1, 4).map((col, i) => ({
                            name: col.name,
                            color: ["#4cc9f0", "#f4a261", "#90be6d"][i],
                            points: result.tables[0].columns[0].values.map((x, idx) => ({ x, y: col.values[idx] }))
                          }))}
                        />
                      )}
                      {Object.keys(result.scalars).length > 0 && (
                        <ul className="small">
                          {Object.entries(result.scalars)
                            .slice(0, 12)
                            .map(([k, v]) => (
                              <li key={k}>
                                <code>{k}</code> = {Number.isNaN(v) ? "n/a" : v.toPrecision(6)}
                              </li>
                            ))}
                        </ul>
                      )}
                      {result.diagnostics.length > 0 && (
                        <ul className="small">
                          {result.diagnostics.slice(0, 20).map((d, i) => (
                            <li key={i}>
                              <strong>{d.severity}</strong>: {d.message}
                            </li>
                          ))}
                        </ul>
                      )}
                      {result.generatedFiles.length > 0 && (
                        <p className="small muted">
                          Outputs: {result.generatedFiles.map((f) => f.relPath).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2>Evidence report</h2>
            <p className="muted small">
              Writes a deterministic Markdown report (metadata, requirement traceability, tool versions, input hashes,
              configurations, results and reproduction steps) to <code>reports/evidence.md</code>.
            </p>
            <button className="btn" onClick={() => void generateReport()}>
              Generate evidence report
            </button>
          </div>
        </>
      )}
    </section>
  );
}
