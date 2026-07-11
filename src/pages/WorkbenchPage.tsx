import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LinePlot } from "../components/LinePlot";
import { PageHeader } from "../components/PageHeader";
import { Tabs } from "../components/Tabs";
import { useWorkbenchSession } from "../components/WorkbenchContext";
import { WorkspaceConfigEditor } from "../components/WorkspaceConfigEditor";
import { WorkspaceFileEditor } from "../components/WorkspaceFileEditor";
import type { AdapterResult } from "../lib/adapters/contract";
import { failureResult } from "../lib/adapters/contract";
import { createRegistry } from "../lib/adapters/instance";
import type { PlatformBridge } from "../lib/platform/bridge";
import {
  buildEvidenceReport,
  type InputFileRecord,
  type SimulationRun,
  type ToolRecord
} from "../lib/report/evidence";
import {
  createLatestRunReceipt,
  latestRunReceiptToSimulationRun,
  loadLatestRunReceipt,
  persistLatestRunReceipt,
  validateLatestRunReceipt,
  validateLatestRunReceiptAgainstWorkspace,
  type LatestRunReceipt
} from "../lib/report/receipt";
import { captureSimulationInputs, collectSimulationInputPaths, hashSimulationInputs, simulationIdsUsingInputPath, type CapturedSimulationInputs } from "../lib/workspace/inputs";
import { affectedSimulationIds, type SimulationConfig, type WorkspaceManifest } from "../lib/workspace/manifest";
import {
  createWorkspace,
  forgetRecentProject,
  openWorkspace,
  rememberRecentProject,
  saveWorkspace
} from "../lib/workspace/workspace";

const APP_VERSION = "0.1.0";
const CHART_COLOURS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

interface StatusMessage {
  tone: "success" | "error" | "neutral";
  text: string;
}

function removeRecordKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function removeRecordKeys<T>(record: Record<string, T>, keys: Set<string>): Record<string, T> {
  if (![...keys].some((key) => key in record)) return record;
  const next = { ...record };
  keys.forEach((key) => delete next[key]);
  return next;
}

function workspaceIdentifiersMatch(left: string, right: string): boolean {
  const normalise = (value: string) => value.replace(/\\/g, "/").replace(/\/+$/, "");
  const normalisedLeft = normalise(left);
  const normalisedRight = normalise(right);
  const windowsPath = /^[a-z]:\//i.test(normalisedLeft) || normalisedLeft.startsWith("//");
  return windowsPath
    ? normalisedLeft.toLocaleLowerCase("en-AU") === normalisedRight.toLocaleLowerCase("en-AU")
    : normalisedLeft === normalisedRight;
}

function formatNumber(value: number): string {
  if (Number.isNaN(value)) return "not available";
  if (!Number.isFinite(value)) return value > 0 ? "positive infinity" : "negative infinity";
  return new Intl.NumberFormat("en-AU", { maximumSignificantDigits: 7 }).format(value);
}

function resultTone(result: AdapterResult): string {
  if (result.status === "ok") return "success";
  if (result.status === "cancelled" || result.status === "timeout") return "warning";
  return "danger";
}

function ResultCard({
  simulation,
  result,
  receipt,
  persisted,
  running,
  disabled,
  onRun,
  onCancel
}: {
  simulation: SimulationConfig;
  result?: AdapterResult;
  receipt?: LatestRunReceipt;
  persisted: boolean;
  running: boolean;
  disabled: boolean;
  onRun: () => void;
  onCancel: () => void;
}) {
  const table = result?.tables.find((candidate) => candidate.columns.length >= 2);
  const scalars = Object.entries(result?.scalars ?? {});

  return (
    <article className={`run-card${running ? " run-card--running" : ""}`}>
      <header className="run-card__header">
        <div>
          <span className="badge">{simulation.capabilityId}</span>
          <h3>{simulation.title}</h3>
          <code>{simulation.id}</code>
        </div>
        <div className="button-row">
          {running ? (
            <button type="button" className="btn btn--danger-quiet" onClick={onCancel}>
              <Icon name="close" size={16} /> Cancel
            </button>
          ) : (
            <button type="button" className="primary" disabled={disabled} onClick={onRun}>
              <Icon name="refresh" size={16} /> {result ? "Run again" : "Run"}
            </button>
          )}
        </div>
      </header>

      <div className="run-card__trace">
        <span>
          <strong>Requirements</strong>
          {simulation.requirementIds.length ? simulation.requirementIds.join(", ") : "No links"}
        </span>
        <span>
          <strong>Input</strong>
          {collectSimulationInputPaths(simulation)[0] ?? "In-app parameters"}
        </span>
      </div>

      {running && (
        <div className="run-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div><strong>Execution in progress</strong><span>Inputs were captured before the adapter started.</span></div>
        </div>
      )}

      {!running && !result && (
        <div className="compact-empty compact-empty--inline">
          <p>No result has been captured for this configuration.</p>
        </div>
      )}

      {!running && result && (
        <div className="result-view" aria-live="polite">
          <div className={`result-summary result-summary--${resultTone(result)}`}>
            <div>
              <span className="status-badge"><span />{result.status}</span>
              <strong>{result.message}</strong>
            </div>
            <dl>
              <div><dt>Duration</dt><dd>{result.durationMs === undefined ? "Not recorded" : `${formatNumber(result.durationMs)} ms`}</dd></div>
              <div><dt>Engine</dt><dd>{result.toolVersion ?? "Not recorded"}</dd></div>
              <div><dt>Receipt</dt><dd>{receipt && persisted ? `Persisted ${new Date(receipt.capturedUtc).toLocaleString("en-AU")}` : "Session only"}</dd></div>
            </dl>
          </div>

          {table && (
            <LinePlot
              title={table.title}
              xLabel={`${table.columns[0].name}${table.columns[0].unit ? ` (${table.columns[0].unit})` : ""}`}
              series={table.columns.slice(1, 4).map((column, index) => ({
                name: `${column.name}${column.unit ? ` (${column.unit})` : ""}`,
                color: CHART_COLOURS[index],
                points: table.columns[0].values.map((x, pointIndex) => ({ x, y: column.values[pointIndex] }))
              }))}
            />
          )}

          {scalars.length > 0 && (
            <div className="table-scroll" tabIndex={0} aria-label={`${simulation.title} result quantities`}>
              <table>
                <caption>Calculated result quantities</caption>
                <thead><tr><th scope="col">Quantity</th><th scope="col">Value</th></tr></thead>
                <tbody>{scalars.map(([name, value]) => <tr key={name}><th scope="row"><code>{name}</code></th><td>{formatNumber(value)}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {result.diagnostics.length > 0 && (
            <section className="result-section" aria-labelledby={`${simulation.id}-findings`}>
              <h4 id={`${simulation.id}-findings`}>Findings</h4>
              <ul className="finding-list">
                {result.diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.severity}-${index}`} className={`finding finding--${diagnostic.severity}`}>
                    <strong>{diagnostic.severity}</strong><span>{diagnostic.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.generatedFiles.length > 0 && (
            <section className="result-section" aria-labelledby={`${simulation.id}-outputs`}>
              <h4 id={`${simulation.id}-outputs`}>Generated outputs</h4>
              <ul className="output-list">
                {result.generatedFiles.map((file) => (
                  <li key={`${file.relPath}-${file.kind}`}><Icon name="file" size={16} /><span><code>{file.relPath}</code><small>{file.kind}{file.sha256 ? `, SHA-256 ${file.sha256.slice(0, 12)}...` : ""}</small></span></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

export function WorkbenchPage() {
  const {
    bridge,
    bridgeError,
    workspace,
    setWorkspace,
    recents,
    setRecents,
    results,
    setResults,
    receipts,
    setReceipts,
    sessionReceipts,
    setSessionReceipts,
    running,
    setRunning,
    dirty,
    manifestDirty,
    setDirty,
    setDraftDirty,
    clearDraftDirty,
    unsavedSummary,
    abortRef
  } = useWorkbenchSession();
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [lastReportUtc, setLastReportUtc] = useState<string | null>(null);
  const registry = useMemo(() => createRegistry(), []);
  const adapters = useMemo(() => registry.list(), [registry]);
  const workspaceRef = useRef(workspace);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  const setConfigurationDraftDirty = useCallback((value: boolean) => setDraftDirty("configuration-draft", value), [setDraftDirty]);
  const setFileDraftDirty = useCallback((value: boolean) => setDraftDirty("file-draft", value), [setDraftDirty]);

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setWorkspace(null);
    setResults({});
    setReceipts({});
    setSessionReceipts({});
    setRunning(null);
    setDirty(false);
    clearDraftDirty();
    setLastReportUtc(null);
  }, [abortRef, clearDraftDirty, setDirty, setReceipts, setResults, setRunning, setSessionReceipts, setWorkspace]);

  const openAt = useCallback(async (root: string) => {
    if (!bridge || running !== null) return;
    if (dirty && !window.confirm(`Open another project and discard unsaved ${unsavedSummary} changes or drafts?`)) return;
    setMessage({ tone: "neutral", text: "Opening project and checking the latest run receipt." });
    try {
      const nextWorkspace = await openWorkspace(bridge, root);
      let restored: LatestRunReceipt | null = null;
      let receiptWarning: string | null = null;
      try {
        restored = await loadLatestRunReceipt(bridge, root, nextWorkspace.manifest);
      } catch (error) {
        receiptWarning = `The project opened, but its latest-run receipt was rejected: ${error instanceof Error ? error.message : String(error)}`;
      }
      setWorkspace(nextWorkspace);
      setResults(restored ? { [restored.simulationId]: restored.result } : {});
      setReceipts(restored ? { [restored.simulationId]: restored } : {});
      setSessionReceipts(restored ? { [restored.simulationId]: restored } : {});
      setDirty(false);
      clearDraftDirty();
      setLastReportUtc(null);
      setRecents(rememberRecentProject({ root, name: nextWorkspace.manifest.name }));
      setMessage(receiptWarning
        ? { tone: "error", text: receiptWarning }
        : { tone: "success", text: restored ? `Opened “${nextWorkspace.manifest.name}” and restored its latest run.` : `Opened “${nextWorkspace.manifest.name}”.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    }
  }, [bridge, clearDraftDirty, dirty, running, setDirty, setReceipts, setRecents, setResults, setSessionReceipts, setWorkspace, unsavedSummary]);

  const pickAndOpen = async () => {
    if (!bridge) return;
    const root = await bridge.pickDirectory("Open Engineering Workbench project");
    if (root) await openAt(root);
  };

  const reauthoriseAndOpen = async (recent: { root: string; name: string }) => {
    if (!bridge) return;
    const selectedRoot = await bridge.pickDirectory(`Re-authorise and open ${recent.name}`);
    if (!selectedRoot) {
      setMessage({ tone: "neutral", text: "Recent project opening was cancelled. No files were read." });
      return;
    }
    if (!workspaceIdentifiersMatch(selectedRoot, recent.root)) {
      setMessage({
        tone: "error",
        text: `The selected folder does not match the saved location for “${recent.name}”. Choose ${recent.root} or use Open project for a different workspace.`
      });
      return;
    }
    await openAt(selectedRoot);
  };

  const pickAndCreate = async () => {
    if (!bridge) return;
    const name = createName.trim();
    if (!name) {
      setMessage({ tone: "error", text: "Enter a project name before choosing a folder." });
      return;
    }
    const root = await bridge.pickDirectory("Choose the folder that will hold this project");
    if (!root) {
      setMessage({ tone: "neutral", text: "Project creation was cancelled. No files were written." });
      return;
    }
    try {
      const nextWorkspace = await createWorkspace(bridge, root, name, createDescription.trim());
      setWorkspace(nextWorkspace);
      setResults({});
      setReceipts({});
      setSessionReceipts({});
      setDirty(false);
      clearDraftDirty();
      setLastReportUtc(null);
      setRecents(rememberRecentProject({ root, name }));
      setCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      setMessage({ tone: "success", text: `Created “${name}”. Add requirements, files and a runnable configuration next.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    }
  };

  const saveProject = async () => {
    if (!bridge || !workspace) return;
    try {
      const manifest = await saveWorkspace(bridge, workspace);
      setWorkspace({ ...workspace, manifest });
      setRecents(rememberRecentProject({ root: workspace.root, name: manifest.name }));
      setDirty(false);
      setMessage({ tone: "success", text: "Project manifest saved to workbench.json." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    }
  };

  const closeProject = () => {
    if (running !== null) return;
    if (dirty && !window.confirm(`Close this project and discard unsaved ${unsavedSummary} changes or drafts?`)) return;
    resetSession();
    setMessage({ tone: "neutral", text: "Project closed. Workspace files were not changed." });
  };

  const changeManifest = (manifest: WorkspaceManifest) => {
    if (!workspace) return;
    const affected = affectedSimulationIds(workspace.manifest, manifest);
    if (affected.size > 0) {
      setResults((current) => removeRecordKeys(current, affected));
      setSessionReceipts((current) => removeRecordKeys(current, affected));
      setReceipts((current) => removeRecordKeys(current, affected));
    }
    setWorkspace({ ...workspace, manifest });
    setDirty(true);
  };

  const recordResult = async (
    targetBridge: PlatformBridge,
    simulation: SimulationConfig,
    result: AdapterResult,
    capturedInputs: CapturedSimulationInputs,
    runManifest: WorkspaceManifest
  ) => {
    const currentWorkspace = workspaceRef.current;
    if (!currentWorkspace) return;
    const receipt = createLatestRunReceipt({
      simulationId: simulation.id,
      capturedUtc: new Date().toISOString(),
      inputFiles: capturedInputs.inputFiles,
      result
    }, runManifest);
    try {
      validateLatestRunReceipt(receipt, currentWorkspace.manifest);
    } catch {
      setMessage({ tone: "error", text: "The run finished after its configuration changed. Its result was not attached to the edited project." });
      return;
    }
    setResults((current) => ({ ...current, [simulation.id]: result }));
    setSessionReceipts((current) => ({ ...current, [simulation.id]: receipt }));
    try {
      const persistence = await persistLatestRunReceipt(
        targetBridge,
        currentWorkspace.root,
        receipt,
        currentWorkspace.manifest
      );
      if (persistence.persistence === "session-only") {
        setMessage({ tone: "error", text: `The run finished and remains session-only because its receipt could not be saved: ${persistence.error}` });
        return;
      }
      const saved = persistence.receipt;
      const latestWorkspace = workspaceRef.current;
      if (!latestWorkspace || latestWorkspace.root !== currentWorkspace.root) return;
      try {
        validateLatestRunReceipt(saved, latestWorkspace.manifest);
      } catch {
        setMessage({ tone: "error", text: "The project definition changed while the receipt was being saved. The session result was not marked as persisted." });
        return;
      }
      setReceipts({ [simulation.id]: saved });
      setMessage({ tone: result.status === "ok" ? "success" : "neutral", text: `Run finished with status “${result.status}”. The latest-run receipt was saved.` });
    } catch (error) {
      setMessage({ tone: "error", text: `The run finished and remains session-only because its receipt could not be validated: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const runSimulation = async (simulation: SimulationConfig) => {
    if (!bridge || !workspace || running !== null) return;
    if (dirty) {
      setMessage({ tone: "error", text: "Save the project manifest before running a configuration so the receipt matches workbench.json." });
      return;
    }
    const hit = registry.resolveCapability(simulation.capabilityId);
    if (!hit) {
      setMessage({ tone: "error", text: `No adapter provides capability “${simulation.capabilityId}”.` });
      return;
    }
    setResults((current) => removeRecordKey(current, simulation.id));
    setSessionReceipts((current) => removeRecordKey(current, simulation.id));
    setRunning(simulation.id);
    setMessage({ tone: "neutral", text: `Capturing inputs and starting “${simulation.title}”.` });
    const controller = new AbortController();
    abortRef.current = controller;
    let capturedInputs: CapturedSimulationInputs | null = null;
    let result: AdapterResult;
    const runManifest = structuredClone(workspace.manifest);
    try {
      capturedInputs = await captureSimulationInputs(bridge, workspace.root, simulation, runManifest);
      result = await hit.adapter.execute(
        { capabilityId: simulation.capabilityId, params: simulation.params },
        { bridge, workspaceRoot: workspace.root, signal: controller.signal }
      );
    } catch (error) {
      result = failureResult(
        simulation.capabilityId,
        controller.signal.aborted ? "cancelled" : "failed",
        controller.signal.aborted
          ? "Operation cancelled by the user."
          : `Adapter execution failed before a structured result was returned: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    try {
      if (capturedInputs) {
        await recordResult(bridge, simulation, result, capturedInputs, runManifest);
      } else {
        setResults((current) => ({ ...current, [simulation.id]: result }));
        setMessage({ tone: "error", text: "The run failed before its inputs could be captured. The result is session-only and no receipt was created." });
      }
    } finally {
      setRunning(null);
      abortRef.current = null;
    }
  };

  const generateReport = async () => {
    if (!bridge || !workspace || running !== null || reporting) return;
    if (dirty) {
      setMessage({ tone: "error", text: "Save the project manifest before generating evidence so the report matches workbench.json." });
      return;
    }
    setReporting(true);
    setMessage({ tone: "neutral", text: "Detecting tools, checking current hashes and assembling the evidence report." });
    try {
      const tools: ToolRecord[] = [];
      for (const info of registry.list()) {
        const adapter = registry.get(info.id);
        if (!adapter) continue;
        const detection = await adapter.detect(bridge);
        tools.push({
          name: info.name,
          ready: detection.ready,
          version: detection.version,
          executablePath: detection.executablePath,
          error: detection.error
        });
      }

      const inputMap = new Map<string, InputFileRecord>();
      for (const simulation of workspace.manifest.simulations) {
        const inputFiles = await hashSimulationInputs(bridge, workspace.root, simulation, workspace.manifest);
        inputFiles.forEach((file) => inputMap.set(file.relPath, file));
      }

      const runs: SimulationRun[] = [];
      const limitations: string[] = [];
      for (const simulation of workspace.manifest.simulations) {
        const sessionReceipt = sessionReceipts[simulation.id];
        if (sessionReceipt) {
          try {
            const validated = await validateLatestRunReceiptAgainstWorkspace(
              bridge,
              workspace.root,
              sessionReceipt,
              workspace.manifest
            );
            const persisted = receipts[simulation.id]?.capturedUtc === validated.capturedUtc;
            runs.push(latestRunReceiptToSimulationRun(validated, persisted ? "persisted" : "session-only"));
          } catch (error) {
            limitations.push(
              `Excluded stale result for simulation ${JSON.stringify(simulation.id)}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        } else if (results[simulation.id]) {
          runs.push({ simulationId: simulation.id, result: results[simulation.id], persistence: "session-only" });
        }
      }

      const generatedUtc = new Date().toISOString();
      const report = buildEvidenceReport({
        manifest: workspace.manifest,
        appVersion: APP_VERSION,
        generatedUtc,
        tools,
        inputFiles: [...inputMap.values()],
        runs,
        limitations
      });
      await bridge.createDirAll(workspace.root, "reports");
      await bridge.writeTextFileAtomic(workspace.root, "reports/evidence.md", report);
      setLastReportUtc(generatedUtc);
      setMessage({ tone: "success", text: "Evidence report written to reports/evidence.md." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setReporting(false);
    }
  };

  const handleFileSaved = (relPath: string) => {
    const currentWorkspace = workspaceRef.current;
    if (!currentWorkspace) return;
    const affected = simulationIdsUsingInputPath(currentWorkspace.manifest, relPath);
    if (affected.size > 0) {
      setResults((current) => removeRecordKeys(current, affected));
      setSessionReceipts((current) => removeRecordKeys(current, affected));
      setReceipts((current) => removeRecordKeys(current, affected));
    }
    setMessage({
      tone: "success",
      text: affected.size > 0
        ? `${relPath} was saved. ${affected.size} affected session result${affected.size === 1 ? " was" : "s were"} cleared.`
        : `${relPath} is ready for a configuration.`
    });
  };

  if (bridge === undefined) {
    return (
      <section>
        <PageHeader eyebrow="Desktop engineering" title="Project workbench" description="Initialising the protected workspace bridge." />
        <div className="diagnostic-grid" aria-busy="true" aria-label="Loading project workbench">
          {[1, 2].map((item) => <div className="card skeleton-card" key={item}><span /><span /><span /></div>)}
        </div>
      </section>
    );
  }

  if (bridge === null) {
    return (
      <section>
        <PageHeader
          eyebrow="Desktop engineering"
          title="Project workbench"
          description="Create controlled project workspaces, run engineering adapters and produce traceable evidence in the desktop application."
          actions={<Link className="btn" to="/diagnostics"><Icon name="diagnostics" size={17} /> Open browser diagnostics</Link>}
        />
        <div className="inline-message inline-message--neutral" role="status">
          <Icon name="info" size={18} />
          <span>{bridgeError ?? "The browser build cannot read local projects or execute installed engineering tools. Learning labs and static netlist validation remain available."}</span>
        </div>
        <div className="workbench-capability-grid" aria-label="Desktop workbench capability overview">
          {[
            ["folder", "Controlled workspaces", "Create and reopen a standard project structure with a validated manifest."],
            ["electrical", "Engineering adapters", "Run built-in analyses, ngspice simulations and KiCad checks from typed configurations."],
            ["report", "Evidence receipts", "Capture input hashes, exact results and deterministic traceability reports."],
            ["diagnostics", "Safe diagnostics", "Check tool readiness and validate SPICE source without executing it."]
          ].map(([icon, title, copy]) => (
            <article className="card" key={title}><Icon name={icon as "folder"} /><h2>{title}</h2><p>{copy}</p></article>
          ))}
        </div>
      </section>
    );
  }

  if (!workspace) {
    return (
      <section>
        <PageHeader
          eyebrow="Desktop engineering"
          title="Project workbench"
          description="Move from an acceptance requirement to a configured run, an inspected result and a reproducible evidence report. Project data remains in the folder you select."
          actions={<><button type="button" className="primary" onClick={() => setCreateOpen(true)}><Icon name="plus" size={17} /> New project</button><button type="button" onClick={() => void pickAndOpen()}><Icon name="folder" size={17} /> Open project</button></>}
        />
        {message && <p className={`inline-message inline-message--${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

        {createOpen && (
          <section className="card create-project" aria-labelledby="create-project-heading">
            <div className="section-heading"><div><p className="eyebrow">New local workspace</p><h2 id="create-project-heading">Define the project</h2></div><button type="button" className="icon-button" aria-label="Cancel new project" onClick={() => setCreateOpen(false)}><Icon name="close" /></button></div>
            <div className="form-grid form-grid--2">
              <div className="form-field"><label htmlFor="new-project-name">Project name</label><input id="new-project-name" autoFocus value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="Motor controller verification" /></div>
              <div className="form-field form-field--wide"><label htmlFor="new-project-description">Description</label><textarea id="new-project-description" rows={3} value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} placeholder="Purpose, system boundary and evidence objective" /></div>
            </div>
            <div className="create-project__footer"><p><Icon name="info" size={16} /> The selected folder receives workbench.json and standard project subfolders. Existing unrelated files are not deleted.</p><div className="button-row"><button type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button type="button" className="primary" onClick={() => void pickAndCreate()}><Icon name="folder" size={16} /> Choose folder and create</button></div></div>
          </section>
        )}

        <div className="workbench-onboarding">
          <section className="card workbench-onboarding__flow" aria-labelledby="workbench-flow-heading">
            <p className="eyebrow">Complete workflow</p>
            <h2 id="workbench-flow-heading">One project, four controlled stages</h2>
            <ol className="workflow-steps">
              <li><span>01</span><div><strong>Define</strong><p>Record project metadata, acceptance requirements and traceability links.</p></div></li>
              <li><span>02</span><div><strong>Configure</strong><p>Create source files and typed simulation or validation configurations.</p></div></li>
              <li><span>03</span><div><strong>Run</strong><p>Capture input hashes before execution, then inspect findings, quantities and outputs.</p></div></li>
              <li><span>04</span><div><strong>Evidence</strong><p>Persist the latest receipt and generate a deterministic Markdown report.</p></div></li>
            </ol>
          </section>

          <section className="card recent-projects" aria-labelledby="recent-projects-heading">
            <div className="section-heading"><div><p className="eyebrow">Continue</p><h2 id="recent-projects-heading">Recent projects</h2></div></div>
            {recents.length === 0 ? <div className="compact-empty"><p>No recent desktop projects are recorded on this device.</p></div> : (
              <ul>{recents.map((recent) => <li key={recent.root}><button type="button" aria-label={`Re-authorise and open ${recent.name}`} onClick={() => void reauthoriseAndOpen(recent)}><Icon name="folder" size={18} /><span><strong>{recent.name}</strong><small>{recent.root}</small><small>Re-select this folder to authorise access</small></span></button><button type="button" className="icon-button" aria-label={`Remove ${recent.name} from recent projects`} onClick={() => setRecents(forgetRecentProject(recent.root))}><Icon name="close" size={16} /></button></li>)}</ul>
            )}
          </section>
        </div>
      </section>
    );
  }

  const completedRuns = Object.keys(results).length;
  const latestReceipt = Object.values(receipts).sort((a, b) => b.capturedUtc.localeCompare(a.capturedUtc))[0];
  const latestSessionReceipt = Object.values(sessionReceipts).sort((a, b) => b.capturedUtc.localeCompare(a.capturedUtc))[0];
  const latestSessionPersisted = Boolean(
    latestSessionReceipt && receipts[latestSessionReceipt.simulationId]?.capturedUtc === latestSessionReceipt.capturedUtc
  );

  return (
    <section className="workbench-project">
      <PageHeader
        eyebrow="Open project"
        title={workspace.manifest.name}
        description={workspace.manifest.description || "Add a clear system boundary and evidence objective in Project definition."}
        meta={<><code className="project-path">{workspace.root}</code>{dirty && <span className="unsaved-indicator"><span /> Unsaved {unsavedSummary}</span>}</>}
        actions={<><button type="button" className="primary" disabled={!manifestDirty || running !== null} onClick={() => void saveProject()}><Icon name="save" size={17} /> Save project</button><button type="button" disabled={running !== null} onClick={closeProject}><Icon name="close" size={17} /> Close</button></>}
      />
      {message && <p className={`inline-message inline-message--${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

      <div className="metric-grid workbench-metrics" aria-label="Project summary">
        <div className="metric"><span>Requirements</span><strong>{workspace.manifest.requirements.length}</strong><small>acceptance statements</small></div>
        <div className="metric"><span>Configurations</span><strong>{workspace.manifest.simulations.length}</strong><small>runnable definitions</small></div>
        <div className="metric"><span>Session results</span><strong>{completedRuns}</strong><small>of {workspace.manifest.simulations.length} configured</small></div>
        <div className="metric"><span>Latest receipt</span><strong>{latestSessionReceipt && !latestSessionPersisted ? "Session only" : latestReceipt ? "Persisted" : "None"}</strong><small>{latestSessionReceipt ? new Date(latestSessionReceipt.capturedUtc).toLocaleString("en-AU") : "run a configuration"}</small></div>
      </div>

      <Tabs
        ariaLabel="Project workbench stages"
        tabs={[
          {
            id: "define",
            label: "1. Define",
            content: <WorkspaceConfigEditor manifest={workspace.manifest} adapters={adapters} onChange={changeManifest} onDraftDirtyChange={setConfigurationDraftDirty} onSimulationRemoved={(simulationId) => { setResults((current) => removeRecordKey(current, simulationId)); setSessionReceipts((current) => removeRecordKey(current, simulationId)); setReceipts((current) => removeRecordKey(current, simulationId)); }} />
          },
          {
            id: "files",
            label: "2. Files",
            content: <WorkspaceFileEditor key={workspace.root} bridge={bridge} workspaceRoot={workspace.root} onDirtyChange={setFileDraftDirty} onSaved={handleFileSaved} />
          },
          {
            id: "run",
            label: `3. Run (${completedRuns}/${workspace.manifest.simulations.length})`,
            content: (
              <section className="run-stage" aria-labelledby="run-stage-heading">
                <div className="section-heading"><div><p className="eyebrow">Controlled execution</p><h2 id="run-stage-heading">Run and inspect</h2><p>Each run clears its previous display, hashes declared input files before execution and saves the exact adapter result as the project’s latest receipt.</p></div></div>
                {dirty && <p className="inline-message inline-message--neutral"><Icon name="info" size={17} /> Save manifest changes before running so every receipt matches the project definition on disk.</p>}
                {workspace.manifest.simulations.length === 0 ? <div className="card compact-empty"><p>Add a simulation or validation configuration in Define before running evidence.</p></div> : <div className="run-list">{workspace.manifest.simulations.map((simulation) => { const sessionReceipt = sessionReceipts[simulation.id]; return <ResultCard key={simulation.id} simulation={simulation} result={results[simulation.id]} receipt={sessionReceipt} persisted={Boolean(sessionReceipt && receipts[simulation.id]?.capturedUtc === sessionReceipt.capturedUtc)} running={running === simulation.id} disabled={running !== null || dirty} onRun={() => void runSimulation(simulation)} onCancel={() => abortRef.current?.abort()} />; })}</div>}
              </section>
            )
          },
          {
            id: "evidence",
            label: "4. Evidence",
            content: (
              <section className="evidence-stage" aria-labelledby="evidence-stage-heading">
                <div className="section-heading"><div><p className="eyebrow">Reproducibility package</p><h2 id="evidence-stage-heading">Generate the evidence report</h2><p>The report records project metadata, requirement links, current input hashes, tool versions, configured analyses, captured receipt metadata, results, findings and reproduction steps.</p></div></div>
                <div className="evidence-stage__grid">
                  <article className="card report-card">
                    <div className="report-card__icon"><Icon name="report" size={24} /></div>
                    <div><h3>Markdown evidence report</h3><code>reports/evidence.md</code><p>Existing report content is replaced only after the complete report has been assembled.</p>{lastReportUtc && <small>Last generated {new Date(lastReportUtc).toLocaleString("en-AU")}</small>}</div>
                    <button type="button" className="primary" disabled={dirty || running !== null || reporting} title={dirty ? "Save the project before generating evidence" : undefined} onClick={() => void generateReport()}>{reporting ? <span className="spinner" aria-hidden="true" /> : <Icon name="report" size={17} />}{reporting ? "Generating" : "Generate report"}</button>
                  </article>
                  <article className="card receipt-card">
                    <h3>Receipt stored on disk</h3>
                    {latestReceipt ? <dl><div><dt>Configuration</dt><dd>{latestReceipt.simulationId}</dd></div><div><dt>Captured UTC</dt><dd>{latestReceipt.capturedUtc}</dd></div><div><dt>Input hashes</dt><dd>{latestReceipt.inputFiles.length}</dd></div><div><dt>Missing inputs</dt><dd>{latestReceipt.missingInputPaths.length}</dd></div><div><dt>Result status</dt><dd>{latestReceipt.result.status}</dd></div><div><dt>Receipt file</dt><dd><code>evidence/latest-run.json</code></dd></div></dl> : <div className="compact-empty"><p>No persisted receipt exists in this session yet. Session-only results are labelled in Run and in generated reports.</p></div>}
                    <p className="small muted">The project keeps one latest receipt between sessions. Reports explicitly mark missing, stale, failed or incomplete evidence instead of treating a link as verification.</p>
                  </article>
                </div>
              </section>
            )
          }
        ]}
      />
    </section>
  );
}
