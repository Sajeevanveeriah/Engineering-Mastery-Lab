import { useEffect, useMemo, useState } from "react";
import type { AdapterInfo } from "../lib/adapters/contract";
import type { RequirementRef, SimulationConfig, WorkspaceManifest } from "../lib/workspace/manifest";
import { Icon } from "./Icon";

interface Props {
  manifest: WorkspaceManifest;
  adapters: AdapterInfo[];
  onChange: (manifest: WorkspaceManifest) => void;
  onSimulationRemoved?: (simulationId: string) => void;
  onDraftDirtyChange?: (dirty: boolean) => void;
}

interface RequirementDraft {
  originalId?: string;
  id: string;
  title: string;
  sourceRelPath: string;
}

interface SimulationDraft {
  originalId?: string;
  id: string;
  title: string;
  capabilityId: string;
  inputRelPath: string;
  vectors: string;
  requirementIds: string[];
  source: string;
  start: string;
  stop: string;
  step: string;
  fStart: string;
  fStop: string;
  pointsPerDecade: string;
  tStep: string;
  tStop: string;
  advancedJson: string;
}

const emptyRequirement: RequirementDraft = { id: "", title: "", sourceRelPath: "" };

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function slug(value: string, fallback: string): string {
  const result = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return result || fallback;
}

function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function builtinDefaults(capabilityId: string): Record<string, unknown> {
  switch (capabilityId) {
    case "builtin-control.pid-step":
      return { kp: 1.8, ki: 0.8, kd: 0.12, setpoint: 1, tau: 1.5, dt: 0.01, duration: 10 };
    case "builtin-electrical.rc-charge":
      return { r: 1000, c: 0.000001, vs: 5, duration: 0.005 };
    case "builtin-electrical.rlc-step":
      return { r: 100, l: 0.1, c: 0.000001, vs: 5, duration: 0.01 };
    case "builtin-mechanical.spring-mass-damper":
      return { mass: 1, stiffness: 100, damping: 2, x0: 0.1, v0: 0, duration: 5, dt: 0.005 };
    case "builtin-ml.linear-regression":
      return { xs: [1, 2, 3, 4, 5], ys: [2.1, 3.9, 6.2, 8.1, 9.8] };
    case "builtin-plc.tank-fill":
      return { initialLevel: 20, duration: 20, dt: 0.1 };
    case "builtin-robotics.diff-drive":
      return { vLeft: 0.5, vRight: 0.6, wheelBase: 0.3, duration: 10, dt: 0.05 };
    case "builtin-embedded.latency":
      return { pollPeriod: 1, handlerTime: 0.2, isrOverhead: 0.05 };
    default:
      return {};
  }
}

function defaultSimulation(capabilityId: string, title: string, existingIds: string[]): SimulationDraft {
  const base = slug(title || capabilityId.split(".").pop() || "simulation", "simulation");
  return {
    id: uniqueId(base, existingIds),
    title,
    capabilityId,
    inputRelPath: capabilityId.startsWith("kicad.")
      ? capabilityId.includes("pcb") || capabilityId.includes("drc") || capabilityId.includes("gerber") || capabilityId.includes("drill") || capabilityId.includes("render")
        ? "pcb/design.kicad_pcb"
        : "circuits/design.kicad_sch"
      : "circuits/design.cir",
    vectors: "v(out)",
    requirementIds: [],
    source: "V1",
    start: "0",
    stop: "5",
    step: "0.1",
    fStart: "10",
    fStop: "100000",
    pointsPerDecade: "20",
    tStep: "0.00001",
    tStop: "0.01",
    advancedJson: JSON.stringify(builtinDefaults(capabilityId), null, 2)
  };
}

function draftFromSimulation(simulation: SimulationConfig): SimulationDraft {
  const params = simulation.params;
  const analysis = typeof params.analysis === "object" && params.analysis !== null ? params.analysis as Record<string, unknown> : {};
  return {
    originalId: simulation.id,
    id: simulation.id,
    title: simulation.title,
    capabilityId: simulation.capabilityId,
    inputRelPath: String(params.netlistRelPath ?? params.inputRelPath ?? ""),
    vectors: Array.isArray(params.vectors) ? params.vectors.join(", ") : "v(out)",
    requirementIds: [...simulation.requirementIds],
    source: String(analysis.source ?? "V1"),
    start: String(analysis.start ?? 0),
    stop: String(analysis.stop ?? 5),
    step: String(analysis.step ?? 0.1),
    fStart: String(analysis.fStart ?? 10),
    fStop: String(analysis.fStop ?? 100000),
    pointsPerDecade: String(analysis.pointsPerDecade ?? 20),
    tStep: String(analysis.tStep ?? 0.00001),
    tStop: String(analysis.tStop ?? 0.01),
    advancedJson: simulation.capabilityId.startsWith("builtin-") ? JSON.stringify(params, null, 2) : "{}"
  };
}

function safeRelativePath(value: string): boolean {
  return value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) &&
    value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

export function WorkspaceConfigEditor({ manifest, adapters, onChange, onSimulationRemoved, onDraftDirtyChange }: Props) {
  const capabilityOptions = useMemo(() => adapters.flatMap((adapter) => adapter.capabilities
    .filter((capability) => capability.id !== "ngspice.validate")
    .map((capability) => ({ ...capability, adapterName: adapter.name, kind: adapter.kind }))), [adapters]);
  const [requirementDraft, setRequirementDraft] = useState<RequirementDraft | null>(null);
  const [simulationDraft, setSimulationDraft] = useState<SimulationDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    onDraftDirtyChange?.(requirementDraft !== null || simulationDraft !== null);
  }, [onDraftDirtyChange, requirementDraft, simulationDraft]);
  useEffect(() => () => onDraftDirtyChange?.(false), [onDraftDirtyChange]);

  const discardOpenDraft = (): boolean => {
    if ((requirementDraft || simulationDraft) && !window.confirm("Discard the open requirement or configuration draft?")) return false;
    setRequirementDraft(null);
    setSimulationDraft(null);
    setFormError(null);
    return true;
  };

  const beginRequirement = (draft: RequirementDraft) => {
    if (!discardOpenDraft()) return;
    setRequirementDraft(draft);
  };

  const beginSimulation = (draft: SimulationDraft) => {
    if (!discardOpenDraft()) return;
    setSimulationDraft(draft);
  };

  const changeManifest = (patch: Partial<WorkspaceManifest>) => onChange({ ...manifest, ...patch });

  const saveRequirement = () => {
    if (!requirementDraft) return;
    const id = requirementDraft.id.trim();
    const title = requirementDraft.title.trim();
    const sourceRelPath = requirementDraft.sourceRelPath.trim();
    if (!idPattern.test(id)) return setFormError("Requirement ID must use letters, numbers, dots, underscores or hyphens.");
    if (!title) return setFormError("Requirement title is required.");
    if (sourceRelPath && !safeRelativePath(sourceRelPath)) return setFormError("Requirement source must be a safe workspace-relative path using forward slashes.");
    if (manifest.requirements.some((requirement) => requirement.id === id && requirement.id !== requirementDraft.originalId)) return setFormError(`Requirement ID “${id}” already exists.`);

    const next: RequirementRef = { id, title, ...(sourceRelPath ? { sourceRelPath } : {}) };
    const requirements = requirementDraft.originalId
      ? manifest.requirements.map((requirement) => requirement.id === requirementDraft.originalId ? next : requirement)
      : [...manifest.requirements, next];
    const simulations = requirementDraft.originalId && requirementDraft.originalId !== id
      ? manifest.simulations.map((simulation) => ({ ...simulation, requirementIds: simulation.requirementIds.map((requirementId) => requirementId === requirementDraft.originalId ? id : requirementId) }))
      : manifest.simulations;
    changeManifest({ requirements, simulations });
    setRequirementDraft(null);
    setFormError(null);
  };

  const removeRequirement = (requirement: RequirementRef) => {
    const linked = manifest.simulations.filter((simulation) => simulation.requirementIds.includes(requirement.id)).length;
    if (!window.confirm(`Delete requirement ${requirement.id}?${linked ? ` It will also be unlinked from ${linked} simulation configuration(s).` : ""}`)) return;
    changeManifest({
      requirements: manifest.requirements.filter((item) => item.id !== requirement.id),
      simulations: manifest.simulations.map((simulation) => ({ ...simulation, requirementIds: simulation.requirementIds.filter((id) => id !== requirement.id) }))
    });
  };

  const beginNewSimulation = () => {
    const first = capabilityOptions[0];
    if (!first) return setFormError("No adapter capabilities are registered.");
    beginSimulation(defaultSimulation(first.id, first.title, manifest.simulations.map((simulation) => simulation.id)));
  };

  const changeCapability = (capabilityId: string) => {
    if (!simulationDraft) return;
    const option = capabilityOptions.find((capability) => capability.id === capabilityId);
    const fresh = defaultSimulation(capabilityId, option?.title ?? capabilityId, manifest.simulations.filter((simulation) => simulation.id !== simulationDraft.originalId).map((simulation) => simulation.id));
    setSimulationDraft({ ...fresh, originalId: simulationDraft.originalId, id: simulationDraft.originalId ?? fresh.id, requirementIds: simulationDraft.requirementIds });
  };

  const buildSimulationParams = (draft: SimulationDraft): Record<string, unknown> => {
    if (draft.capabilityId.startsWith("builtin-")) {
      const parsed: unknown = JSON.parse(draft.advancedJson || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Advanced parameters must be a JSON object.");
      return parsed as Record<string, unknown>;
    }
    if (draft.capabilityId.startsWith("kicad.")) return { inputRelPath: draft.inputRelPath.trim() };
    const vectors = draft.vectors.split(",").map((value) => value.trim()).filter(Boolean);
    const kind = draft.capabilityId.replace("ngspice.", "");
    if (kind === "op") return { netlistRelPath: draft.inputRelPath.trim(), analysis: { kind: "op" }, vectors: [] };
    if (kind === "dc") return { netlistRelPath: draft.inputRelPath.trim(), analysis: { kind: "dc", source: draft.source.trim(), start: Number(draft.start), stop: Number(draft.stop), step: Number(draft.step) }, vectors };
    if (kind === "ac") return { netlistRelPath: draft.inputRelPath.trim(), analysis: { kind: "ac", pointsPerDecade: Number(draft.pointsPerDecade), fStart: Number(draft.fStart), fStop: Number(draft.fStop) }, vectors };
    if (kind === "tran") return { netlistRelPath: draft.inputRelPath.trim(), analysis: { kind: "tran", tStep: Number(draft.tStep), tStop: Number(draft.tStop) }, vectors };
    return {};
  };

  const saveSimulation = () => {
    if (!simulationDraft) return;
    const id = simulationDraft.id.trim();
    const title = simulationDraft.title.trim();
    if (!idPattern.test(id)) return setFormError("Simulation ID must use letters, numbers, dots, underscores or hyphens.");
    if (!title) return setFormError("Simulation title is required.");
    if (manifest.simulations.some((simulation) => simulation.id === id && simulation.id !== simulationDraft.originalId)) return setFormError(`Simulation ID “${id}” already exists.`);
    if ((simulationDraft.capabilityId.startsWith("ngspice.") || simulationDraft.capabilityId.startsWith("kicad.")) && !safeRelativePath(simulationDraft.inputRelPath.trim())) return setFormError("Input file must be a safe workspace-relative path using forward slashes.");
    try {
      const next: SimulationConfig = { id, title, capabilityId: simulationDraft.capabilityId, params: buildSimulationParams(simulationDraft), requirementIds: simulationDraft.requirementIds };
      const simulations = simulationDraft.originalId
        ? manifest.simulations.map((simulation) => simulation.id === simulationDraft.originalId ? next : simulation)
        : [...manifest.simulations, next];
      changeManifest({ simulations });
      setSimulationDraft(null);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    }
  };

  const removeSimulation = (simulation: SimulationConfig) => {
    if (!window.confirm(`Delete simulation configuration “${simulation.title}”? Existing output files are not deleted.`)) return;
    changeManifest({ simulations: manifest.simulations.filter((item) => item.id !== simulation.id) });
    onSimulationRemoved?.(simulation.id);
  };

  const selectedCapability = simulationDraft ? capabilityOptions.find((capability) => capability.id === simulationDraft.capabilityId) : null;
  const ngspiceKind = simulationDraft?.capabilityId.replace("ngspice.", "");

  return (
    <div className="workspace-editor">
      <section className="card workspace-editor__section" aria-labelledby="project-details-heading">
        <div className="section-heading"><div><p className="eyebrow">Project definition</p><h2 id="project-details-heading">Project details</h2></div></div>
        <div className="form-grid form-grid--2">
          <div className="form-field"><label htmlFor="project-name">Project name</label><input id="project-name" value={manifest.name} onChange={(event) => changeManifest({ name: event.target.value })} /></div>
          <div className="form-field form-field--wide"><label htmlFor="project-description">Description</label><textarea id="project-description" rows={2} value={manifest.description} placeholder="What is being designed, analysed or verified?" onChange={(event) => changeManifest({ description: event.target.value })} /></div>
        </div>
      </section>

      <section className="card workspace-editor__section" aria-labelledby="requirements-editor-heading">
        <div className="section-heading"><div><p className="eyebrow">Traceability</p><h2 id="requirements-editor-heading">Requirements</h2></div><button className="btn" type="button" onClick={() => beginRequirement({ ...emptyRequirement })}><Icon name="plus" size={16} /> Add requirement</button></div>
        {manifest.requirements.length === 0 ? <div className="compact-empty"><p>No requirements are recorded. Add the first acceptance statement before configuring evidence runs.</p></div> : (
          <div className="requirement-list">{manifest.requirements.map((requirement) => { const linked = manifest.simulations.filter((simulation) => simulation.requirementIds.includes(requirement.id)).length; return <article key={requirement.id}><div><strong>{requirement.id}</strong><h3>{requirement.title}</h3>{requirement.sourceRelPath && <code>{requirement.sourceRelPath}</code>}<span>{linked} linked simulation{linked === 1 ? "" : "s"}</span></div><div className="button-row"><button type="button" onClick={() => beginRequirement({ originalId: requirement.id, id: requirement.id, title: requirement.title, sourceRelPath: requirement.sourceRelPath ?? "" })}>Edit</button><button className="btn--danger-quiet" type="button" onClick={() => removeRequirement(requirement)}>Delete</button></div></article>; })}</div>
        )}
        {requirementDraft && <div className="editor-form"><h3>{requirementDraft.originalId ? "Edit requirement" : "New requirement"}</h3><div className="form-grid form-grid--3"><div className="form-field"><label htmlFor="requirement-id">Requirement ID</label><input id="requirement-id" value={requirementDraft.id} placeholder="REQ-001" onChange={(event) => setRequirementDraft((draft) => draft && ({ ...draft, id: event.target.value }))} /></div><div className="form-field form-field--wide"><label htmlFor="requirement-title">Requirement statement</label><input id="requirement-title" value={requirementDraft.title} placeholder="Output shall remain below 3.3 V" onChange={(event) => setRequirementDraft((draft) => draft && ({ ...draft, title: event.target.value }))} /></div><div className="form-field"><label htmlFor="requirement-source">Source file <span className="muted">optional</span></label><input id="requirement-source" value={requirementDraft.sourceRelPath} placeholder="requirements/spec.md" onChange={(event) => setRequirementDraft((draft) => draft && ({ ...draft, sourceRelPath: event.target.value }))} /></div></div><div className="button-row"><button className="primary" type="button" onClick={saveRequirement}><Icon name="save" size={16} /> Save requirement</button><button type="button" onClick={() => { if (window.confirm("Discard this requirement draft?")) { setRequirementDraft(null); setFormError(null); } }}>Cancel</button></div></div>}
      </section>

      <section className="card workspace-editor__section" aria-labelledby="simulations-editor-heading">
        <div className="section-heading"><div><p className="eyebrow">Executable evidence</p><h2 id="simulations-editor-heading">Simulation and validation configurations</h2></div><button className="btn" type="button" onClick={beginNewSimulation}><Icon name="plus" size={16} /> Add configuration</button></div>
        {manifest.simulations.length === 0 ? <div className="compact-empty"><p>No runnable configurations exist. Add a built-in analysis, ngspice run or KiCad validation.</p></div> : (
          <div className="simulation-config-list">{manifest.simulations.map((simulation) => <article key={simulation.id}><div><span className="badge">{simulation.capabilityId}</span><h3>{simulation.title}</h3><code>{simulation.id}</code><p>{simulation.requirementIds.length ? `Linked to ${simulation.requirementIds.join(", ")}` : "No requirements linked"}</p></div><div className="button-row"><button type="button" onClick={() => beginSimulation(draftFromSimulation(simulation))}>Edit</button><button className="btn--danger-quiet" type="button" onClick={() => removeSimulation(simulation)}>Delete</button></div></article>)}</div>
        )}

        {simulationDraft && (
          <div className="editor-form simulation-editor-form">
            <h3>{simulationDraft.originalId ? "Edit configuration" : "New configuration"}</h3>
            <div className="form-grid form-grid--3">
              <div className="form-field"><label htmlFor="simulation-capability">Capability</label><select id="simulation-capability" value={simulationDraft.capabilityId} onChange={(event) => changeCapability(event.target.value)}>{adapters.map((adapter) => <optgroup label={adapter.name} key={adapter.id}>{adapter.capabilities.filter((capability) => capability.id !== "ngspice.validate").map((capability) => <option value={capability.id} key={capability.id}>{capability.title}</option>)}</optgroup>)}</select>{selectedCapability && <small>{selectedCapability.description}</small>}</div>
              <div className="form-field"><label htmlFor="simulation-id">Configuration ID</label><input id="simulation-id" value={simulationDraft.id} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, id: event.target.value }))} /></div>
              <div className="form-field"><label htmlFor="simulation-title">Title</label><input id="simulation-title" value={simulationDraft.title} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, title: event.target.value }))} /></div>
            </div>

            {(simulationDraft.capabilityId.startsWith("ngspice.") || simulationDraft.capabilityId.startsWith("kicad.")) && <div className="form-field"><label htmlFor="simulation-input">Workspace input file</label><input id="simulation-input" value={simulationDraft.inputRelPath} placeholder="circuits/design.cir" onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, inputRelPath: event.target.value }))} /><small>Use a path relative to the project root, with forward slashes.</small></div>}

            {simulationDraft.capabilityId.startsWith("ngspice.") && ngspiceKind !== "op" && <div className="form-field"><label htmlFor="simulation-vectors">Output vectors</label><input id="simulation-vectors" value={simulationDraft.vectors} placeholder="v(out), i(V1)" onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, vectors: event.target.value }))} /><small>Comma-separated ngspice vectors.</small></div>}

            {ngspiceKind === "dc" && <div className="form-grid form-grid--4"><div className="form-field"><label htmlFor="dc-source">Source</label><input id="dc-source" value={simulationDraft.source} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, source: event.target.value }))} /></div><div className="form-field"><label htmlFor="dc-start">Start</label><input id="dc-start" type="number" value={simulationDraft.start} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, start: event.target.value }))} /></div><div className="form-field"><label htmlFor="dc-stop">Stop</label><input id="dc-stop" type="number" value={simulationDraft.stop} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, stop: event.target.value }))} /></div><div className="form-field"><label htmlFor="dc-step">Step</label><input id="dc-step" type="number" value={simulationDraft.step} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, step: event.target.value }))} /></div></div>}
            {ngspiceKind === "ac" && <div className="form-grid form-grid--3"><div className="form-field"><label htmlFor="ac-start">Start frequency (Hz)</label><input id="ac-start" type="number" min="0" value={simulationDraft.fStart} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, fStart: event.target.value }))} /></div><div className="form-field"><label htmlFor="ac-stop">Stop frequency (Hz)</label><input id="ac-stop" type="number" min="0" value={simulationDraft.fStop} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, fStop: event.target.value }))} /></div><div className="form-field"><label htmlFor="ac-points">Points per decade</label><input id="ac-points" type="number" min="1" value={simulationDraft.pointsPerDecade} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, pointsPerDecade: event.target.value }))} /></div></div>}
            {ngspiceKind === "tran" && <div className="form-grid form-grid--2"><div className="form-field"><label htmlFor="tran-step">Time step (s)</label><input id="tran-step" type="number" min="0" step="any" value={simulationDraft.tStep} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, tStep: event.target.value }))} /></div><div className="form-field"><label htmlFor="tran-stop">Stop time (s)</label><input id="tran-stop" type="number" min="0" step="any" value={simulationDraft.tStop} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, tStop: event.target.value }))} /></div></div>}
            {simulationDraft.capabilityId.startsWith("builtin-") && <details className="advanced-editor"><summary>Advanced built-in parameters</summary><div className="form-field"><label htmlFor="advanced-parameters">Parameter object (JSON)</label><textarea id="advanced-parameters" className="code-input" rows={8} value={simulationDraft.advancedJson} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, advancedJson: event.target.value }))} /><small>Leave as an empty object to use the validated built-in defaults.</small></div></details>}

            <fieldset className="requirement-links"><legend>Linked requirements</legend>{manifest.requirements.length === 0 ? <p className="small muted">Add requirements first to create traceability links.</p> : <div className="checkbox-grid">{manifest.requirements.map((requirement) => <label key={requirement.id}><input type="checkbox" checked={simulationDraft.requirementIds.includes(requirement.id)} onChange={(event) => setSimulationDraft((draft) => draft && ({ ...draft, requirementIds: event.target.checked ? [...draft.requirementIds, requirement.id] : draft.requirementIds.filter((id) => id !== requirement.id) }))} /><span><strong>{requirement.id}</strong> {requirement.title}</span></label>)}</div>}</fieldset>
            <div className="button-row"><button className="primary" type="button" onClick={saveSimulation}><Icon name="save" size={16} /> Save configuration</button><button type="button" onClick={() => { if (window.confirm("Discard this configuration draft?")) { setSimulationDraft(null); setFormError(null); } }}>Cancel</button></div>
          </div>
        )}
      </section>
      {formError && <p className="inline-message inline-message--error" role="alert"><Icon name="alert" size={17} />{formError}</p>}
    </div>
  );
}
