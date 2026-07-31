import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { Equation } from "../components/AcademyMath";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { workspaceMathExpressions } from "../data/mathExpressions";
import {
  calculateMotorSizing,
  calculateMotorSizingProjectScenario,
  compareScenarios,
  createMotorSizingVerticalSlice,
  createNotebookBlock,
  exportProjectBundle,
  getEngineeringDimensionLabel,
  getEngineeringUnitSymbol,
  importProjectBundle,
  inspectEvidenceGraph,
  KERNEL_LIMITS,
  parseDatasetCsv,
  previewProjectBundle,
  summariseDataset,
  validateEngineeringProject,
  type EngineeringDataset,
  type EngineeringProject,
  type EngineeringScenario,
  type ProjectBundlePreview
} from "../lib/kernel";
import { readBoundedLocalTextFile } from "../lib/localFileImport";
import {
  PROJECT_PACK_MAX_CHARACTERS,
  createEngineeringReportInput,
  createProjectPack,
  exportProjectPack,
  generateEngineeringReports,
  importProjectPack,
  type EngineeringReportArtefacts,
  type ProjectPack,
  type ProjectPackSource
} from "../lib/interchange";

type WorkspaceSection = "sizing" | "scenarios" | "dataset" | "notebook" | "lineage" | "portable";

const sectionLabels: Array<[WorkspaceSection, string]> = [
  ["sizing", "Motor sizing"],
  ["scenarios", "Scenarios"],
  ["dataset", "Dataset"],
  ["notebook", "Notebook"],
  ["lineage", "Evidence lineage"],
  ["portable", "Bundle and reports"]
];

const datasetExample = [
  "case,torque,speed",
  "continuous,10,600",
  "peak,20,600"
].join("\n");

interface InitialWorkspace {
  project: EngineeringProject;
  message: string;
}

function createInitialWorkspace(bundleJson?: string): InitialWorkspace {
  if (bundleJson) {
    try {
      return {
        project: importProjectBundle(bundleJson).project,
        message: "Validated saved engineering workspace loaded from local progress."
      };
    } catch {
      return {
        project: createMotorSizingVerticalSlice().project,
        message: "The saved workspace could not be validated, so the deterministic reference study was loaded without replacing the saved record."
      };
    }
  }
  return {
    project: createMotorSizingVerticalSlice().project,
    message: "Deterministic reference study loaded. Save only after reviewing its assumptions."
  };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "Not available";
  if (value === 0 || (Math.abs(value) >= 0.001 && Math.abs(value) < 1_000_000)) {
    return Number(value.toPrecision(8)).toString();
  }
  return value.toExponential(7);
}

function formatMeasurement(value: number, unitId: string): string {
  const symbol = getEngineeringUnitSymbol(unitId);
  return `${formatNumber(value)}${symbol ? ` ${symbol}` : ""}`;
}

function downloadText(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function datedFilename(title: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${date}-${title}-Rev00.${extension}`;
}

function replaceOrAppendDataset(project: EngineeringProject, dataset: EngineeringDataset): EngineeringProject {
  const existingIndex = project.datasets.findIndex((item) => item.id === dataset.id);
  const datasets = [...project.datasets];
  if (existingIndex >= 0) datasets[existingIndex] = dataset;
  else datasets.push(dataset);
  return validateEngineeringProject({
    ...project,
    revision: project.revision + 1,
    updatedAt: new Date().toISOString(),
    datasets
  });
}

function createMotorProjectPack(project: EngineeringProject): ProjectPack {
  const source: ProjectPackSource = {
    packId: "motor-sizing-foundations",
    packVersion: "1.0.0",
    generatedUtc: project.updatedAt,
    compatibility: {
      kernelSchemaMinimum: 2,
      kernelSchemaMaximum: 2,
      applicationVersionRange: ">=0.2.0 <1.0.0"
    },
    content: {
      learningSequence: [
        { id: "learn-requirements", title: "Learn the load model", objective: "Define continuous, peak, duty, inertia, gearing, efficiency, and safety assumptions.", projectStage: "learn" },
        { id: "build-scenarios", title: "Build the sizing study", objective: "Retain baseline and alternate scenarios with unit-bearing inputs.", projectStage: "build" },
        { id: "analyse-results", title: "Analyse operating points", objective: "Recompute SI torque, speed, and power with explicit boundaries.", projectStage: "analyse" },
        { id: "prove-lineage", title: "Prove the result lineage", objective: "Retain calculations, notebook records, evidence relationships, and limitations.", projectStage: "prove" }
      ],
      project,
      discipline: "multidisciplinary mechatronics",
      datasetFixtures: project.datasets,
      notebookTemplates: [{
        id: "motor-sizing-notebook",
        title: "Motor sizing notebook",
        notebook: project.notebook
      }],
      evidenceRubric: {
        version: 1,
        criteria: [
          { id: "units", title: "Units and dimensions", requirement: "Every numeric input and result carries a compatible unit and SI value.", weight: 0.25 },
          { id: "assumptions", title: "Assumptions", requirement: "Efficiency, gearing, duty, inertia, acceleration, and safety factor remain explicit.", weight: 0.25 },
          { id: "reproduction", title: "Reproduction", requirement: "Clean import reproduces baseline and alternate results within the declared tolerance.", weight: 0.25 },
          { id: "lineage", title: "Evidence lineage", requirement: "Dataset, scenario, calculation, result, and notebook references resolve without a directed cycle.", weight: 0.25 }
        ]
      },
      reports: [
        { id: "engineering-report-template", title: "Engineering report template", format: "markdown", body: "# Engineering report\n\nGenerated from validated project-pack content.\n" },
        { id: "engineering-report-machine-template", title: "Engineering report machine template", format: "json", body: "{\"status\":\"template\"}" }
      ],
      licence: {
        spdxId: "MIT",
        name: "MIT License",
        text: "MIT License\n\nProject-pack structure and deterministic fixture content are provided under the repository licence."
      },
      provenance: {
        source: "Engineering Mastery Lab deterministic local motor-sizing fixture",
        author: "Engineering Mastery Lab",
        createdUtc: project.createdAt,
        licenceIds: ["MIT"]
      }
    }
  };
  return createProjectPack(source);
}

function createMotorReports(
  pack: ProjectPack,
  project: EngineeringProject
): EngineeringReportArtefacts {
  const scenarioId = project.scenarioSet.baselineId;
  const result = calculateMotorSizingProjectScenario(project, scenarioId);
  const input = createEngineeringReportInput(pack, {
    generatedUtc: project.updatedAt,
    scenarioId,
    numericTolerance: 1e-9,
    tolerances: ["Numeric reproduction tolerance: absolute difference at most 1e-9 for deterministic fixture values."],
    results: [
      { id: "continuous-power", label: "Continuous motor mechanical power", value: result.continuous.mechanicalPowerW, unitId: "W", status: "informational" },
      { id: "continuous-torque", label: "Continuous motor torque", value: result.continuous.motorTorqueNm, unitId: "N.m", status: "informational" },
      { id: "peak-power", label: "Peak motor mechanical power", value: result.peak.mechanicalPowerW, unitId: "W", status: "informational" },
      { id: "peak-torque", label: "Peak motor torque", value: result.peak.motorTorqueNm, unitId: "N.m", status: "informational" }
    ],
    charts: [{
      id: "operating-points",
      title: "Motor operating points",
      columns: ["requirement", "motor torque (N m)", "motor speed (rpm)", "mechanical power (W)"],
      rows: [
        ["continuous", result.continuous.motorTorqueNm, result.continuous.motorSpeedRpm, result.continuous.mechanicalPowerW],
        ["peak", result.peak.motorTorqueNm, result.peak.motorSpeedRpm, result.peak.mechanicalPowerW]
      ]
    }],
    validation: ["Project schema validated.", "Evidence graph references and directed cycles checked.", "Bundle integrity verified on import."],
    warnings: result.warnings,
    limits: result.boundaries,
    lineage: project.evidenceGraph.edges.map((edge) => `${edge.from}:${edge.relation}:${edge.to}`),
    environment: { application: "Engineering Mastery Lab 0.2.0" }
  });
  return generateEngineeringReports(input);
}

export function EngineeringWorkspacePage() {
  const { progress, update } = useProgress();
  const [initial] = useState(() =>
    createInitialWorkspace(progress.engineeringWorkspaces["motor-sizing-study"]?.bundleJson)
  );
  const [project, setProject] = useState(initial.project);
  const [section, setSection] = useState<WorkspaceSection>("sizing");
  const [message, setMessage] = useState<{ kind: "success" | "error" | "neutral"; text: string }>({
    kind: "neutral",
    text: initial.message
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    project.scenarioSet.scenarios.find((item) => item.kind === "named")?.id ?? project.scenarioSet.baselineId
  );
  const [scenarioName, setScenarioName] = useState("");
  const [datasetText, setDatasetText] = useState(datasetExample);
  const [datasetPreview, setDatasetPreview] = useState<EngineeringDataset | null>(null);
  const [notebookText, setNotebookText] = useState("");
  const [bundlePreview, setBundlePreview] = useState<ProjectBundlePreview | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [rollbackProject, setRollbackProject] = useState<EngineeringProject | null>(null);
  const [packPreview, setPackPreview] = useState<ProjectPack | null>(null);
  const bundleFileRef = useRef<HTMLInputElement>(null);
  const packFileRef = useRef<HTMLInputElement>(null);

  const bundleJson = useMemo(() => exportProjectBundle(project), [project]);
  const bundleInspection = useMemo(() => importProjectBundle(bundleJson), [bundleJson]);
  const projectPack = useMemo(() => createMotorProjectPack(project), [project]);
  const projectPackJson = useMemo(() => exportProjectPack(projectPack), [projectPack]);
  const engineeringReports = useMemo(
    () => createMotorReports(projectPack, project),
    [project, projectPack]
  );
  const baselineScenario = project.scenarioSet.scenarios.find(
    (item) => item.id === project.scenarioSet.baselineId
  )!;
  const selectedScenario = project.scenarioSet.scenarios.find(
    (item) => item.id === selectedScenarioId
  ) ?? baselineScenario;
  const selectedScenarioIsReferenced = project.calculations.some(
    (calculation) => calculation.scenarioId === selectedScenario.id
  );
  const scenarioRows = useMemo(
    () => compareScenarios(project.variables, baselineScenario, selectedScenario)
      .filter((row) => row.role === "input" && row.delta !== 0),
    [baselineScenario, project.variables, selectedScenario]
  );
  const baselineResult = useMemo(
    () => project.motorSizing ? calculateMotorSizing(project.motorSizing) : null,
    [project.motorSizing]
  );
  const scenarioResult = useMemo(() => {
    if (!project.motorSizing) return null;
    return calculateMotorSizingProjectScenario(project, selectedScenario.id);
  }, [project, selectedScenario.id]);
  const graphInspection = useMemo(
    () => inspectEvidenceGraph(project.evidenceGraph),
    [project.evidenceGraph]
  );
  const datasetSummary = useMemo(
    () => datasetPreview ? summariseDataset(datasetPreview) : null,
    [datasetPreview]
  );

  const saveWorkspace = () => {
    const updatedAt = new Date().toISOString();
    update((current) => ({
      ...current,
      engineeringWorkspaces: {
        ...current.engineeringWorkspaces,
        [project.id]: {
          schemaVersion: 1,
          projectId: project.id,
          bundleJson,
          updatedAt
        }
      }
    }));
    setMessage({ kind: "success", text: "Validated project bundle saved locally and linked to Prove. Its SHA-256 value is an integrity check, not authentication." });
  };

  const duplicateScenario = () => {
    const source = selectedScenario.kind === "baseline"
      ? project.scenarioSet.scenarios.find((item) => item.kind === "named") ?? selectedScenario
      : selectedScenario;
    let index = 1;
    let id = `scenario-copy-${index}`;
    while (project.scenarioSet.scenarios.some((item) => item.id === id)) {
      index += 1;
      id = `scenario-copy-${index}`;
    }
    const copy: EngineeringScenario = {
      ...structuredClone(source),
      id,
      name: `${source.name} copy`,
      kind: "named"
    };
    applyScenarioSet([...project.scenarioSet.scenarios, copy], id, "Scenario duplicated.");
  };

  const renameScenario = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedScenario.kind === "baseline") {
      setMessage({ kind: "error", text: "The baseline scenario name is protected." });
      return;
    }
    if (!scenarioName.trim()) {
      setMessage({ kind: "error", text: "Enter a scenario name before renaming." });
      return;
    }
    applyScenarioSet(
      project.scenarioSet.scenarios.map((item) => item.id === selectedScenario.id
        ? { ...item, name: scenarioName.trim() }
        : item),
      selectedScenario.id,
      "Scenario renamed."
    );
    setScenarioName("");
  };

  const deleteScenario = () => {
    if (selectedScenario.kind === "baseline") {
      setMessage({ kind: "error", text: "The baseline scenario cannot be deleted." });
      return;
    }
    if (selectedScenarioIsReferenced) {
      setMessage({ kind: "error", text: "This scenario is referenced by a retained calculation. Duplicate it to create an unreferenced scenario that can be deleted safely." });
      return;
    }
    if (!window.confirm(`Delete scenario "${selectedScenario.name}"? This changes only the in-session project until you save.`)) {
      setMessage({ kind: "neutral", text: "Scenario deletion cancelled." });
      return;
    }
    applyScenarioSet(
      project.scenarioSet.scenarios.filter((item) => item.id !== selectedScenario.id),
      project.scenarioSet.baselineId,
      "Scenario deleted."
    );
  };

  const applyScenarioSet = (scenarios: EngineeringScenario[], nextSelection: string, text: string) => {
    try {
      const next = validateEngineeringProject({
        ...project,
        revision: project.revision + 1,
        updatedAt: new Date().toISOString(),
        scenarioSet: { ...project.scenarioSet, scenarios }
      });
      setProject(next);
      setSelectedScenarioId(nextSelection);
      setMessage({ kind: "success", text });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Scenario change failed safely." });
    }
  };

  const previewDataset = () => {
    try {
      const parsed = parseDatasetCsv(datasetText, {
        id: "learner-load-data",
        name: "Learner load data",
        unitIds: { torque: "N.m", speed: "rpm" },
        provenance: {
          sourceLabel: "Learner-provided local CSV content",
          learnerGenerated: true
        }
      });
      setDatasetPreview(parsed);
      setMessage({ kind: "success", text: `Dataset validated: ${parsed.rows.length} rows and ${parsed.columns.length} columns. Missing cells remain explicit null values.` });
    } catch (error) {
      setDatasetPreview(null);
      setMessage({ kind: "error", text: `Dataset import failed safely: ${error instanceof Error ? error.message : "invalid dataset"}` });
    }
  };

  const applyDataset = () => {
    if (!datasetPreview) return;
    try {
      setProject(replaceOrAppendDataset(project, datasetPreview));
      setMessage({ kind: "success", text: "Validated dataset added to the in-session project." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Dataset application failed safely." });
    }
  };

  const addNotebookNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      let noteIndex = 1;
      let id = `learner-note-${noteIndex}`;
      while (project.notebook.blocks.some((item) => item.id === id)) {
        noteIndex += 1;
        id = `learner-note-${noteIndex}`;
      }
      const block = createNotebookBlock(id, "note", notebookText);
      const next = validateEngineeringProject({
        ...project,
        revision: project.revision + 1,
        updatedAt: new Date().toISOString(),
        notebook: { ...project.notebook, blocks: [...project.notebook.blocks, block] }
      });
      setProject(next);
      setNotebookText("");
      setMessage({ kind: "success", text: "Plain-text notebook note added after sanitisation." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Notebook note was rejected." });
    }
  };

  const chooseBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await readBoundedLocalTextFile(
        file,
        KERNEL_LIMITS.bundleCharacters,
        "Project bundle"
      );
      const preview = previewProjectBundle(text, project);
      setPreviewText(text);
      setBundlePreview(preview);
      setMessage({
        kind: "neutral",
        text: `Import preview ready for ${preview.project.name}. ${preview.conflicts.length} conflict records found; current state is unchanged.`
      });
    } catch (error) {
      setPreviewText("");
      setBundlePreview(null);
      setMessage({ kind: "error", text: `Bundle import failed safely: ${error instanceof Error ? error.message : "invalid bundle"}` });
    }
  };

  const applyBundle = () => {
    if (!bundlePreview || !previewText) return;
    if (bundlePreview.conflicts.length > 0 && !window.confirm(`Replace the current in-session project despite ${bundlePreview.conflicts.length} identified conflicts?`)) {
      setMessage({ kind: "neutral", text: "Bundle application cancelled. Current project was kept." });
      return;
    }
    try {
      const imported = importProjectBundle(previewText).project;
      setRollbackProject(structuredClone(project));
      setProject(imported);
      setSelectedScenarioId(imported.scenarioSet.scenarios.find((item) => item.kind === "named")?.id ?? imported.scenarioSet.baselineId);
      setBundlePreview(null);
      setPreviewText("");
      setMessage({ kind: "success", text: "Validated bundle applied atomically in this session. Undo is available." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Bundle application failed safely." });
    }
  };

  const chooseProjectPack = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await readBoundedLocalTextFile(
        file,
        PROJECT_PACK_MAX_CHARACTERS,
        "Project Pack"
      );
      const imported = importProjectPack(text);
      setPackPreview(imported);
      setMessage({
        kind: "neutral",
        text: `Project Pack preview ready for ${imported.content.project.name}. ${imported.manifest.entries.length} manifest entries passed path, type, size, schema, and integrity validation; current state is unchanged.`
      });
    } catch (error) {
      setPackPreview(null);
      setMessage({
        kind: "error",
        text: `Project Pack import failed safely: ${error instanceof Error ? error.message : "invalid Project Pack"}`
      });
    }
  };

  const applyProjectPack = () => {
    if (!packPreview) return;
    const incoming = packPreview.content.project;
    const isDifferent = packPreview.integrity.contentSha256 !== projectPack.integrity.contentSha256;
    if (
      isDifferent &&
      !window.confirm(
        `Apply validated Project Pack "${packPreview.packId}" to the in-session workspace? The current project will remain available through Undo.`
      )
    ) {
      setMessage({ kind: "neutral", text: "Project Pack application cancelled. Current project was kept." });
      return;
    }
    setRollbackProject(structuredClone(project));
    setProject(incoming);
    setSelectedScenarioId(
      incoming.scenarioSet.scenarios.find((item) => item.kind === "named")?.id ??
      incoming.scenarioSet.baselineId
    );
    setPackPreview(null);
    setMessage({
      kind: "success",
      text: "Validated Project Pack applied atomically in this session. No executable content or external service was used, and Undo is available."
    });
  };

  return (
    <section className="page engineering-workspace-page">
      <PageHeader
        eyebrow="Shared engineering kernel"
        title="Engineering project workspace"
        description="Connect Learn, Practise, Projects, and Progress through versioned SI variables, deterministic scenarios, controlled notebook records, evidence lineage, and portable local interchange."
        actions={(
          <div className="button-row">
            <button type="button" onClick={saveWorkspace}><Icon name="check" size={17} /> Save local record</button>
            <button className="primary" type="button" onClick={() => downloadText(datedFilename("Motor-Sizing-Project-Bundle", "json"), bundleJson, "application/json")}><Icon name="download" size={17} /> Export bundle</button>
          </div>
        )}
      />
      <div className="safety-note safety-note--neutral">
        <Icon name="info" size={20} />
        <p><strong>Engineering boundary.</strong> This study calculates requirements and traceability only. It does not select a purchasable motor, certify a design, propagate uncertainty, run optimisation, or replace independent engineering review.</p>
      </div>
      {message && <p className={`inline-message inline-message--${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}

      <nav className="hub-tabs" aria-label="Engineering workspace sections">
        {sectionLabels.map(([id, label]) => <button type="button" key={id} className={section === id ? "active" : ""} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}
      </nav>

      {section === "sizing" && baselineResult && (
        <section aria-labelledby="motor-sizing-heading">
          <p className="eyebrow">Required vertical slice</p>
          <h2 id="motor-sizing-heading">Continuous and peak motor requirements</h2>
          <p>The kernel uses the reviewed SI relationships shown below. Gearing, drivetrain efficiency, acceleration torque, load inertia, duty cycle and safety factor remain explicit inputs or assumptions.</p>
          <Equation
            expression={workspaceMathExpressions["motor-sizing-power"]}
            fallbackText={workspaceMathExpressions["motor-sizing-power"].plainText}
            label="Motor angular-speed and mechanical-power relationships"
          />
          <div className="table-wrap">
            <table>
              <caption>Baseline motor-sizing result</caption>
              <thead><tr><th scope="col">Requirement</th><th scope="col">Output torque</th><th scope="col">Motor torque</th><th scope="col">Motor speed</th><th scope="col">Angular speed</th><th scope="col">Mechanical power</th></tr></thead>
              <tbody>
                <tr><th scope="row">Continuous</th><td>{formatNumber(baselineResult.continuous.outputTorqueNm)} N m</td><td>{formatNumber(baselineResult.continuous.motorTorqueNm)} N m</td><td>{formatNumber(baselineResult.continuous.motorSpeedRpm)} rpm</td><td>{formatNumber(baselineResult.continuous.omegaRadPerSec)} rad/s</td><td>{formatNumber(baselineResult.continuous.mechanicalPowerW)} W</td></tr>
                <tr><th scope="row">Peak</th><td>{formatNumber(baselineResult.peak.outputTorqueNm)} N m</td><td>{formatNumber(baselineResult.peak.motorTorqueNm)} N m</td><td>{formatNumber(baselineResult.peak.motorSpeedRpm)} rpm</td><td>{formatNumber(baselineResult.peak.omegaRadPerSec)} rad/s</td><td>{formatNumber(baselineResult.peak.mechanicalPowerW)} W</td></tr>
              </tbody>
            </table>
          </div>
          <div className="detail-columns">
            <section><h3>Assumptions</h3><ul>{baselineResult.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h3>Warnings and boundaries</h3><ul>{[...baselineResult.warnings, ...baselineResult.boundaries].map((item) => <li key={item}>{item}</li>)}</ul></section>
          </div>
          <section aria-labelledby="kernel-variables-heading">
            <h3 id="kernel-variables-heading">Typed variables and provenance</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">Variable</th><th scope="col">Display value</th><th scope="col">SI value</th><th scope="col">Dimension</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
                <tbody>{project.variables.map((variable) => <tr key={variable.id}><th scope="row">{variable.label}</th><td>{formatMeasurement(variable.value, variable.unitId)}</td><td>{formatNumber(variable.baseValue)}</td><td>{getEngineeringDimensionLabel(variable.dimension)}</td><td>{variable.validation.status}</td><td>{variable.provenance.kind}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {section === "scenarios" && scenarioResult && baselineResult && (
        <section aria-labelledby="scenario-heading">
          <p className="eyebrow">Deterministic comparison</p>
          <h2 id="scenario-heading">Baseline and named scenario</h2>
          <label className="form-field">Scenario<select value={selectedScenario.id} onChange={(event) => setSelectedScenarioId(event.target.value)}>{project.scenarioSet.scenarios.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.kind})</option>)}</select></label>
          <div className="button-row"><button type="button" onClick={duplicateScenario}>Duplicate scenario</button><button className="danger" type="button" onClick={deleteScenario} disabled={selectedScenario.kind === "baseline" || selectedScenarioIsReferenced}>Delete scenario</button></div>
          <form className="inline-form" onSubmit={renameScenario}><label>New scenario name<input value={scenarioName} maxLength={160} onChange={(event) => setScenarioName(event.target.value)} /></label><button type="submit" disabled={selectedScenario.kind === "baseline"}>Rename</button></form>
          <h3>Changed inputs</h3>
          {scenarioRows.length ? <div className="table-wrap"><table><thead><tr><th scope="col">Variable</th><th scope="col">Baseline SI</th><th scope="col">Candidate SI</th><th scope="col">Delta</th><th scope="col">Relative change</th></tr></thead><tbody>{scenarioRows.map((row) => <tr key={row.variableId}><th scope="row">{project.variables.find((item) => item.id === row.variableId)?.label ?? row.variableId}</th><td>{formatNumber(row.baselineValue)}</td><td>{formatNumber(row.candidateValue)}</td><td>{formatNumber(row.delta)}</td><td>{row.relativePercent === null ? "Undefined from zero" : `${formatNumber(row.relativePercent)}%`}</td></tr>)}</tbody></table></div> : <p>No input override differs from baseline.</p>}
          <h3>Changed outputs</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Output</th><th scope="col">Baseline</th><th scope="col">Candidate</th><th scope="col">Difference</th><th scope="col">Unit</th></tr></thead>
              <tbody>
                <tr><th scope="row">Continuous motor power</th><td>{formatNumber(baselineResult.continuous.mechanicalPowerW)}</td><td>{formatNumber(scenarioResult.continuous.mechanicalPowerW)}</td><td>{formatNumber(scenarioResult.continuous.mechanicalPowerW - baselineResult.continuous.mechanicalPowerW)}</td><td>W</td></tr>
                <tr><th scope="row">Peak motor power</th><td>{formatNumber(baselineResult.peak.mechanicalPowerW)}</td><td>{formatNumber(scenarioResult.peak.mechanicalPowerW)}</td><td>{formatNumber(scenarioResult.peak.mechanicalPowerW - baselineResult.peak.mechanicalPowerW)}</td><td>W</td></tr>
                <tr><th scope="row">Continuous motor speed</th><td>{formatNumber(baselineResult.continuous.motorSpeedRpm)}</td><td>{formatNumber(scenarioResult.continuous.motorSpeedRpm)}</td><td>{formatNumber(scenarioResult.continuous.motorSpeedRpm - baselineResult.continuous.motorSpeedRpm)}</td><td>rpm</td></tr>
                <tr><th scope="row">Peak motor speed</th><td>{formatNumber(baselineResult.peak.motorSpeedRpm)}</td><td>{formatNumber(scenarioResult.peak.motorSpeedRpm)}</td><td>{formatNumber(scenarioResult.peak.motorSpeedRpm - baselineResult.peak.motorSpeedRpm)}</td><td>rpm</td></tr>
              </tbody>
            </table>
          </div>
          <p className="muted">This is one-at-a-time deterministic comparison. It is not optimisation, Monte Carlo analysis, or uncertainty propagation.</p>
        </section>
      )}

      {section === "dataset" && (
        <section aria-labelledby="dataset-heading">
          <p className="eyebrow">Bounded local import</p>
          <h2 id="dataset-heading">CSV dataset preview</h2>
          <p>Imports are local, size-bounded, schema-validated, and never fetched remotely. Duplicate headings and invalid numeric or unit declarations are rejected.</p>
          <label className="form-field">CSV content<textarea rows={8} maxLength={KERNEL_LIMITS.datasetCharacters} value={datasetText} onChange={(event) => setDatasetText(event.target.value)} /></label>
          <div className="button-row"><button type="button" onClick={previewDataset}>Validate preview</button><button className="primary" type="button" disabled={!datasetPreview} onClick={applyDataset}>Add validated dataset</button></div>
          {datasetPreview && datasetSummary && <><p><strong>Provenance:</strong> {datasetPreview.provenance.sourceLabel}. {datasetPreview.provenance.licenceId ? `Licence: ${datasetPreview.provenance.licenceId}. ` : "No licence was declared. "}{datasetPreview.provenance.learnerGenerated ? "Learner-generated local data." : "Not labelled as learner-generated."}</p><dl className="metric-grid"><div><dt>Rows</dt><dd>{datasetSummary.rows}</dd></div><div><dt>Columns</dt><dd>{datasetSummary.columns}</dd></div><div><dt>Missing cells</dt><dd>{datasetSummary.missingCells}</dd></div><div><dt>Duplicate rows retained</dt><dd>{datasetSummary.duplicateRows}</dd></div></dl><p className="muted">Duplicate rows are retained and counted so the learner can decide whether repetition is evidence or an import defect.</p><div className="table-wrap"><table><caption>{datasetPreview.name}: {datasetPreview.rows.length} rows</caption><thead><tr>{datasetPreview.columns.map((column) => <th scope="col" key={column.id}>{column.label}{column.unitId ? ` (${column.unitId})` : ""}</th>)}</tr></thead><tbody>{datasetPreview.rows.map((row, rowIndex) => <tr key={`dataset-row-${rowIndex}`}>{datasetPreview.columns.map((column, columnIndex) => columnIndex === 0 ? <th scope="row" key={column.id}>{row[column.id] === null ? "Missing" : String(row[column.id])}</th> : <td key={column.id}>{row[column.id] === null ? "Missing" : String(row[column.id])}</td>)}</tr>)}</tbody></table></div></>}
        </section>
      )}

      {section === "notebook" && (
        <section aria-labelledby="notebook-heading">
          <p className="eyebrow">Controlled local record</p>
          <h2 id="notebook-heading">Engineering notebook</h2>
          <p>Blocks are plain text or typed references. HTML, scripts, remote embeds, and executable cells are not supported.</p>
          <div className="simple-list">{project.notebook.blocks.map((block) => <article key={block.id}><span className="badge">{block.kind}</span><p>{block.text}</p>{block.referenceId && <small>Reference: {project.evidenceGraph.nodes.find((node) => node.id === block.referenceId)?.label ?? block.referenceId}</small>}</article>)}</div>
          <form onSubmit={addNotebookNote}><label className="form-field">Plain-text reflection<textarea value={notebookText} maxLength={20_000} rows={5} onChange={(event) => setNotebookText(event.target.value)} /></label><button className="primary" type="submit">Add sanitised note</button></form>
        </section>
      )}

      {section === "lineage" && (
        <section aria-labelledby="lineage-heading">
          <p className="eyebrow">Directed provenance</p>
          <h2 id="lineage-heading">Evidence lineage</h2>
          <p>{graphInspection.issues.length === 0 ? "Every reference resolves and the directed lineage is acyclic." : `${graphInspection.issues.length} lineage issues require repair.`}</p>
          <div className="table-wrap">
            <table>
              <caption>Accessible evidence graph alternative</caption>
              <thead><tr><th scope="col">Source</th><th scope="col">Relation</th><th scope="col">Target</th></tr></thead>
              <tbody>{project.evidenceGraph.edges.map((edge) => <tr key={`${edge.from}-${edge.relation}-${edge.to}`}><th scope="row">{project.evidenceGraph.nodes.find((node) => node.id === edge.from)?.label ?? edge.from}</th><td>{edge.relation}</td><td>{project.evidenceGraph.nodes.find((node) => node.id === edge.to)?.label ?? edge.to}</td></tr>)}</tbody>
            </table>
          </div>
          {graphInspection.issues.length > 0 && <ul>{graphInspection.issues.map((issue) => <li key={`${issue.code}-${issue.path.join("-")}`}>{issue.message}</li>)}</ul>}
        </section>
      )}

      {section === "portable" && (
        <section aria-labelledby="portable-heading">
          <p className="eyebrow">Portable local interchange</p>
          <h2 id="portable-heading">Bundles, Project Packs, and engineering reports</h2>
          <dl className="metric-grid">
            <div><dt>Schema</dt><dd>Project {project.version}, bundle 2</dd></div>
            <div><dt>Revision</dt><dd>{project.revision}</dd></div>
            <div><dt>Variables</dt><dd>{project.variables.length}</dd></div>
            <div><dt>Datasets</dt><dd>{project.datasets.length}</dd></div>
            <div><dt>Integrity</dt><dd>SHA-256 {bundleInspection.digest.slice(0, 12)}...</dd></div>
          </dl>
          <p>The digest detects accidental corruption in this bundle. It is not authentication, a signature, tamper-proof certification, or proof of authorship.</p>
          <div className="button-row">
            <button type="button" onClick={() => bundleFileRef.current?.click()}><Icon name="upload" size={17} /> Preview bundle import</button>
            <button className="primary" type="button" disabled={!bundlePreview} onClick={applyBundle}>Apply preview</button>
            <button type="button" disabled={!rollbackProject} onClick={() => { if (rollbackProject) { setProject(rollbackProject); setRollbackProject(null); setMessage({ kind: "success", text: "Previous in-session project restored." }); } }}>Undo bundle apply</button>
          </div>
          <input ref={bundleFileRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose project bundle" onChange={(event) => void chooseBundle(event)} />
          {bundlePreview && (
            <div className="card">
              <h3>Import preview: {bundlePreview.project.name}</h3>
              <p>Source version {bundlePreview.sourceVersion}; {bundlePreview.migrated ? "migration required" : "current schema"}; {bundlePreview.conflicts.length} conflict records.</p>
              {bundlePreview.conflicts.length > 0 && <ul>{bundlePreview.conflicts.map((conflict) => <li key={`${conflict.scope}-${conflict.id}`}>{conflict.message}</li>)}</ul>}
            </div>
          )}
          <h3>Reproducibility record</h3>
          <p>The project carries calculation algorithm version, unit-bearing snapshots, dataset provenance, scenario identifiers, warnings, notebook references, and evidence lineage needed to reproduce the deterministic result after clean re-import.</p>

          <section aria-labelledby="project-pack-heading">
            <h3 id="project-pack-heading">Validated Project Pack</h3>
            <p>Project Packs are bounded, data-only JSON documents. Imports reject traversal paths, executable extensions, unsupported media types, schema mismatches, unsafe object keys, oversize content, manifest mismatches, and integrity failures before application.</p>
            <dl className="metric-grid">
              <div><dt>Pack</dt><dd>{projectPack.packId} {projectPack.packVersion}</dd></div>
              <div><dt>Kernel range</dt><dd>{projectPack.compatibility.kernelSchemaMinimum} to {projectPack.compatibility.kernelSchemaMaximum}</dd></div>
              <div><dt>Manifest entries</dt><dd>{projectPack.manifest.entries.length}</dd></div>
              <div><dt>Integrity</dt><dd>SHA-256 {projectPack.integrity.contentSha256.slice(0, 12)}...</dd></div>
            </dl>
            <div className="button-row">
              <button type="button" onClick={() => downloadText(datedFilename("Motor-Sizing-Project-Pack", "json"), projectPackJson, "application/json")}><Icon name="download" size={17} /> Export Project Pack</button>
              <button type="button" onClick={() => packFileRef.current?.click()}><Icon name="upload" size={17} /> Preview Project Pack import</button>
              <button className="primary" type="button" disabled={!packPreview} onClick={applyProjectPack}>Apply validated Project Pack</button>
            </div>
            <input ref={packFileRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose Project Pack" onChange={(event) => void chooseProjectPack(event)} />
            {packPreview && (
              <div className="card" data-testid="project-pack-preview">
                <h4>Import preview: {packPreview.content.project.name}</h4>
                <p>Pack {packPreview.packId} {packPreview.packVersion}; kernel schemas {packPreview.compatibility.kernelSchemaMinimum} to {packPreview.compatibility.kernelSchemaMaximum}; {packPreview.manifest.entries.length} validated manifest entries.</p>
                <p>{packPreview.integrity.contentSha256 === projectPack.integrity.contentSha256 ? "This pack matches the current generated pack." : "This pack differs from the current generated pack and requires explicit confirmation before application."}</p>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <caption>Project Pack virtual-file manifest</caption>
                <thead><tr><th scope="col">Path</th><th scope="col">Media type</th><th scope="col">Bytes</th><th scope="col">SHA-256 prefix</th></tr></thead>
                <tbody>{projectPack.manifest.entries.map((entry) => <tr key={entry.path}><th scope="row"><code>{entry.path}</code></th><td>{entry.mediaType}</td><td>{entry.bytes}</td><td><code>{entry.sha256.slice(0, 12)}...</code></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="engineering-report-heading">
            <h3 id="engineering-report-heading">Deterministic engineering report</h3>
            <p>The Markdown and machine-readable JSON reports retain SI and display inputs, assumptions, tolerances, model versions, dataset hashes and provenance, results, accessible chart tables, validation, warnings, limits, lineage, environment, and report integrity metadata.</p>
            <dl className="metric-grid">
              <div><dt>Markdown SHA-256</dt><dd>{engineeringReports.integrity.markdownSha256.slice(0, 12)}...</dd></div>
              <div><dt>JSON SHA-256</dt><dd>{engineeringReports.integrity.jsonSha256.slice(0, 12)}...</dd></div>
              <div><dt>Scenario</dt><dd>{baselineScenario.name}</dd></div>
              <div><dt>Tolerance</dt><dd>1e-9 absolute</dd></div>
            </dl>
            <div className="button-row">
              <button type="button" onClick={() => downloadText(datedFilename("Motor-Sizing-Engineering-Report", "md"), engineeringReports.markdown, "text/markdown")}><Icon name="download" size={17} /> Export Markdown report</button>
              <button type="button" onClick={() => downloadText(datedFilename("Motor-Sizing-Engineering-Report", "json"), engineeringReports.json, "application/json")}><Icon name="download" size={17} /> Export JSON report</button>
              <button type="button" onClick={() => window.print()}>Print report view</button>
            </div>
            <details>
              <summary>Preview complete Markdown report source</summary>
              <pre className="report-preview">{engineeringReports.markdown}</pre>
            </details>
          </section>

          <div className="button-row"><Link className="btn" to="/projects/motor-gearbox">Review Build brief</Link><Link className="btn" to="/portfolio">Review Prove record</Link></div>
        </section>
      )}
    </section>
  );
}
