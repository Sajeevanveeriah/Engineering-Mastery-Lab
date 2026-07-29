import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  createFlagshipKernelPackage,
  flagshipWorkflowSpecifications,
  runFlagshipFixtureSummary,
  type FlagshipDomain
} from "../lib/flagships";
import {
  getEngineeringDimensionLabel,
  getEngineeringUnitSymbol
} from "../lib/kernel";

const routeDomains = new Set<FlagshipDomain>([
  "controls",
  "robotics-autonomy",
  "embedded-electronics-sensing",
  "mechanical-design-dynamics",
  "applied-ai-ml"
]);

function formatValue(value: string | number | boolean): string {
  if (typeof value !== "number") return String(value);
  if (!Number.isFinite(value)) return "Not available";
  if (value === 0 || (Math.abs(value) >= 0.001 && Math.abs(value) < 100_000)) {
    return Number(value.toPrecision(7)).toString();
  }
  return value.toExponential(6);
}

function formatSnapshotValue(value: number, unitId: string): string {
  const symbol = getEngineeringUnitSymbol(unitId);
  return `${formatValue(value)}${symbol ? ` ${symbol}` : ""}`;
}

function downloadJson(filename: string, value: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function datedWorkflowFilename(domain: string): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const title = domain.split("-").map((part) =>
    part.charAt(0).toLocaleUpperCase("en-AU") + part.slice(1)
  ).join("-");
  return `${date}-${title}-Workflow-Rev00.json`;
}

export function FlagshipWorkflowPage() {
  const { flagshipId = "" } = useParams();
  const { progress, update } = useProgress();
  const [message, setMessage] = useState("");
  const domain = routeDomains.has(flagshipId as FlagshipDomain)
    ? flagshipId as FlagshipDomain
    : undefined;
  const workflow = flagshipWorkflowSpecifications.find((candidate) => candidate.domain === domain);
  const fixture = useMemo(
    () => workflow ? runFlagshipFixtureSummary(workflow.id) : undefined,
    [workflow]
  );
  const kernelPackage = useMemo(
    () => workflow && fixture ? createFlagshipKernelPackage(workflow, fixture) : undefined,
    [fixture, workflow]
  );

  if (!workflow || !fixture || !kernelPackage) {
    return (
      <section className="page">
        <PageHeader eyebrow="Learning route" title="Flagship workflow not found" description="Choose one of the five verified local flagship workflows from Learn." />
        <Link className="btn primary" to="/learn">Return to Learn</Link>
      </section>
    );
  }

  const evidenceId = `flagship-fixture-${workflow.domain}`;
  const evidenceSaved = progress.manualEvidence.some((item) => item.id === evidenceId);
  const kernelRecordSaved = Boolean(progress.engineeringWorkspaces[kernelPackage.project.id]);
  const completeRecordSaved = evidenceSaved && kernelRecordSaved;
  const saveEvidence = () => {
    if (completeRecordSaved) {
      setMessage("This validated kernel fixture and evidence record are already present in Prove.");
      return;
    }
    const updatedAt = new Date().toISOString();
    update((current) => ({
      ...current,
      manualEvidence: current.manualEvidence.some((item) => item.id === evidenceId)
        ? current.manualEvidence
        : [...current.manualEvidence, {
          id: evidenceId,
          title: `${workflow.title} deterministic fixture`,
          description: `${fixture.textAlternative} The validated kernel calculation uses algorithm version ${kernelPackage.calculation.algorithmVersion}. This learner-saved record confirms only that the local deterministic fixture was reviewed.`,
          linkedSkills: workflow.linkedSkillIds,
          discipline: workflow.title.split(":")[0],
          createdAt: updatedAt
        }],
      engineeringWorkspaces: {
        ...current.engineeringWorkspaces,
        [kernelPackage.project.id]: {
          schemaVersion: 1,
          projectId: kernelPackage.project.id,
          bundleJson: kernelPackage.bundle,
          updatedAt
        }
      }
    }));
    setMessage("Validated kernel project bundle and learner-generated fixture evidence were added to Prove.");
  };

  return (
    <section className="page flagship-page">
      <Link className="back-link" to="/learn">Back to Learn</Link>
      <PageHeader
        eyebrow="Flagship engineering workflow"
        title={workflow.title}
        description={workflow.summary}
        actions={(
          <div className="button-row">
            <button type="button" onClick={() => downloadJson(datedWorkflowFilename(workflow.domain), { workflow, fixture, kernelProject: kernelPackage.project })}>
              <Icon name="download" size={17} /> Export fixture
            </button>
            <button className="primary" type="button" onClick={saveEvidence} disabled={completeRecordSaved}>
              <Icon name="check" size={17} /> {completeRecordSaved ? "Kernel record saved" : "Add kernel record to Prove"}
            </button>
          </div>
        )}
      />

      <div className="safety-note safety-note--neutral">
        <Icon name="info" size={20} />
        <p><strong>Evidence boundary.</strong> {workflow.safetyBoundary} The fixture is deterministic educational evidence, not independent validation, certification, or authority for physical use.</p>
      </div>
      {message && <p className="inline-message inline-message--success" role="status">{message}</p>}

      <div className="detail-columns">
        <div>
          <section aria-labelledby="flagship-outcomes">
            <p className="eyebrow">Measurable intent</p>
            <h2 id="flagship-outcomes">Prerequisites and outcomes</h2>
            <h3>Prerequisites</h3>
            <ul>{workflow.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3>Measurable outcomes</h3>
            <p className="table-scroll-hint" id="flagship-outcomes-scroll-hint">
              Scroll horizontally to view all columns.
            </p>
            <div
              className="table-wrap"
              role="region"
              aria-label="Measurable outcomes table"
              aria-describedby="flagship-outcomes-scroll-hint"
              tabIndex={0}
            >
              <table>
                <thead><tr><th scope="col">Outcome</th><th scope="col">Measure</th><th scope="col">Pass criterion</th></tr></thead>
                <tbody>{workflow.outcomes.map((item) => <tr key={item.statement}><th scope="row">{item.statement}</th><td>{item.measure}</td><td>{item.passCriterion}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="flagship-sequence">
            <p className="eyebrow">Coherent sequence</p>
            <h2 id="flagship-sequence">Learn, analyse, diagnose, and prove</h2>
            <ol className="milestone-list">
              {workflow.sequence.map((step, index) => (
                <li key={step.id}>
                  <div>
                    <b>{index + 1}. {step.title}</b>
                    <p>{step.action}</p>
                    <small><strong>Verification:</strong> {step.verification}</small>
                    <small><strong>Outputs:</strong> {step.outputs.join(", ")}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="flagship-fixture">
            <p className="eyebrow">Deterministic analyser</p>
            <h2 id="flagship-fixture">{fixture.title} fixture</h2>
            <p>{fixture.textAlternative}</p>
            <p><strong>Provenance:</strong> {fixture.provenance.sourceLabel}. {fixture.provenance.classification} data; licence {fixture.provenance.licenceId}; {fixture.provenance.learnerGenerated ? "learner-generated" : "built-in and not learner-generated"}.</p>
            <dl className="metric-grid">
              {fixture.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{formatValue(metric.value)}{metric.unit && metric.unit !== "1" ? ` ${metric.unit}` : ""}</dd></div>)}
            </dl>
            <p className="table-scroll-hint" id="flagship-fixture-scroll-hint">
              Scroll horizontally to view all columns.
            </p>
            <div
              className="table-wrap"
              role="region"
              aria-label="Deterministic fixture data table"
              aria-describedby="flagship-fixture-scroll-hint"
              tabIndex={0}
            >
              <table>
                <caption>Accessible data alternative for the deterministic fixture</caption>
                <thead><tr>{fixture.table.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                <tbody>{fixture.table.rows.map((row, rowIndex) => <tr key={`${workflow.id}-row-${rowIndex}`}>{row.map((value, columnIndex) => columnIndex === 0 ? <th scope="row" key={fixture.table.columns[columnIndex]}>{formatValue(value)}</th> : <td key={fixture.table.columns[columnIndex]}>{formatValue(value)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {fixture.supportingTables.map((item, tableIndex) => (
              <section key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.textAlternative}</p>
                <p
                  className="table-scroll-hint"
                  id={`${workflow.domain}-supporting-table-${tableIndex}-scroll-hint`}
                >
                  Scroll horizontally to view all columns.
                </p>
                <div
                  className="table-wrap"
                  role="region"
                  aria-label={`${item.title} data table`}
                  aria-describedby={`${workflow.domain}-supporting-table-${tableIndex}-scroll-hint`}
                  tabIndex={0}
                >
                  <table>
                    <caption>{item.title}</caption>
                    <thead><tr>{item.table.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                    <tbody>{item.table.rows.map((row, rowIndex) => <tr key={`${item.title}-row-${rowIndex}`}>{row.map((value, columnIndex) => columnIndex === 0 ? <th scope="row" key={item.table.columns[columnIndex]}>{formatValue(value)}</th> : <td key={item.table.columns[columnIndex]}>{formatValue(value)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>

          <section aria-labelledby="flagship-deterministic-workflow">
            <p className="eyebrow">Reproducible method</p>
            <h2 id="flagship-deterministic-workflow">Deterministic workflow contract</h2>
            <div className="detail-columns">
              <div>
                <h3>Inputs</h3>
                <ul>{workflow.deterministicWorkflow.inputs.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <h3>Expected outputs</h3>
                <ul>{workflow.deterministicWorkflow.expectedOutputs.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
            <h3>Repeatable sequence</h3>
            <ol>{workflow.deterministicWorkflow.steps.map((item) => <li key={item}>{item}</li>)}</ol>
          </section>

          <section aria-labelledby="flagship-equations">
            <p className="eyebrow">Models and limits</p>
            <h2 id="flagship-equations">Equations and SI variables</h2>
            {workflow.equations.map((equation, equationIndex) => (
              <article className="card" key={equation.id}>
                <h3>{equation.expression}</h3>
                <p className="table-scroll-hint" id={`${workflow.domain}-equation-${equationIndex}-scroll-hint`}>
                  Scroll horizontally to view all columns.
                </p>
                <div
                  className="table-wrap"
                  role="region"
                  aria-label={`Variables for ${equation.expression}`}
                  aria-describedby={`${workflow.domain}-equation-${equationIndex}-scroll-hint`}
                  tabIndex={0}
                >
                  <table>
                    <thead><tr><th scope="col">Symbol</th><th scope="col">Quantity</th><th scope="col">SI unit</th></tr></thead>
                    <tbody>{equation.variables.map((variable) => <tr key={`${equation.id}-${variable.symbol}`}><th scope="row">{variable.symbol}</th><td>{variable.quantity}</td><td>{variable.siUnit}</td></tr>)}</tbody>
                  </table>
                </div>
                <p><strong>Assumptions:</strong> {equation.assumptions.join("; ")}</p>
                <p><strong>Valid when:</strong> {equation.validWhen.join("; ")}</p>
              </article>
            ))}
          </section>

          <section>
            <p className="eyebrow">Build and kernel</p>
            <h2>Apply and retain evidence</h2>
            <p>{workflow.linkedApplication.application}</p>
            <dl className="metric-grid">
              <div><dt>Project schema</dt><dd>{kernelPackage.project.version}</dd></div>
              <div><dt>Calculation schema</dt><dd>{kernelPackage.calculation.version}</dd></div>
              <div><dt>Algorithm version</dt><dd>{kernelPackage.calculation.algorithmVersion}</dd></div>
              <div><dt>Notebook blocks</dt><dd>{kernelPackage.project.notebook.blocks.length}</dd></div>
            </dl>
            <section
              className="flagship-record-section"
              aria-labelledby={`${workflow.domain}-kernel-snapshots`}
            >
              <h3 id={`${workflow.domain}-kernel-snapshots`}>Validated kernel calculation snapshots</h3>
              <div className="flagship-record-list">
                {kernelPackage.calculation.inputs.map((snapshot) => (
                  <article className="flagship-record" key={`input-${snapshot.variableId}`}>
                    <h4>{kernelPackage.project.variables.find((variable) => variable.id === snapshot.variableId)?.label ?? "Fixture input"}</h4>
                    <dl>
                      <div><dt>Role</dt><dd>Input</dd></div>
                      <div><dt>Variable</dt><dd>{kernelPackage.project.variables.find((variable) => variable.id === snapshot.variableId)?.label ?? "Fixture input"}</dd></div>
                      <div><dt>Display value</dt><dd>{formatSnapshotValue(snapshot.value, snapshot.unitId)}</dd></div>
                      <div><dt>SI value</dt><dd>{formatValue(snapshot.baseValue)}</dd></div>
                      <div><dt>Dimension</dt><dd>{getEngineeringDimensionLabel(snapshot.dimension)}</dd></div>
                    </dl>
                  </article>
                ))}
                {kernelPackage.calculation.outputs.map((snapshot) => (
                  <article className="flagship-record" key={`output-${snapshot.variableId}`}>
                    <h4>{kernelPackage.project.variables.find((variable) => variable.id === snapshot.variableId)?.label ?? "Fixture output"}</h4>
                    <dl>
                      <div><dt>Role</dt><dd>Output</dd></div>
                      <div><dt>Variable</dt><dd>{kernelPackage.project.variables.find((variable) => variable.id === snapshot.variableId)?.label ?? "Fixture output"}</dd></div>
                      <div><dt>Display value</dt><dd>{formatSnapshotValue(snapshot.value, snapshot.unitId)}</dd></div>
                      <div><dt>SI value</dt><dd>{formatValue(snapshot.baseValue)}</dd></div>
                      <div><dt>Dimension</dt><dd>{getEngineeringDimensionLabel(snapshot.dimension)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
            <div className="simple-list">
              {kernelPackage.project.notebook.blocks.map((block) => <article key={block.id}><span className="badge">{block.kind}</span><p>{block.text}</p></article>)}
            </div>
            <section
              className="flagship-record-section"
              aria-labelledby={`${workflow.domain}-kernel-outputs`}
            >
              <h3 id={`${workflow.domain}-kernel-outputs`}>Kernel-compatible output records</h3>
              <div className="flagship-record-list">
                {workflow.outputs.map((output) => (
                  <article className="flagship-record" key={`${output.kind}-${output.title}`}>
                    <h4>{output.title}</h4>
                    <dl>
                      <div><dt>Record type</dt><dd>{output.kind}</dd></div>
                      <div><dt>Output</dt><dd>{output.title}</dd></div>
                      <div><dt>Required fields</dt><dd>{output.requiredFields.join(", ")}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
            <div className="button-row">
              <Link className="btn" to={`/learn/labs/${workflow.linkedApplication.labId}`}>Open linked laboratory</Link>
              <Link className="btn" to={`/projects/${workflow.linkedApplication.projectId}`}>Open Build brief</Link>
              <Link className="btn primary" to="/tools/engineering">Open engineering workspace</Link>
            </div>
          </section>
        </div>

        <aside>
          <section>
            <p className="eyebrow">Known challenge</p>
            <h2>Challenge and pass criteria</h2>
            <p>{workflow.challenge.prompt}</p>
            <h3>Constraints</h3>
            <ul>{workflow.challenge.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3>Pass criteria</h3>
            <ul>{workflow.challenge.knownPassCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <p className="eyebrow">Failure analysis</p>
            <h2>Diagnose before claiming a result</h2>
            {workflow.failureStates.map((failure) => (
              <details key={failure.id}>
                <summary><strong>{failure.condition}</strong></summary>
                <p><strong>Diagnosis:</strong> {failure.diagnosis}</p>
                <p><strong>Repair:</strong> {failure.repair}</p>
              </details>
            ))}
          </section>
          <section>
            <p className="eyebrow">Accessible alternatives</p>
            <h2>Text and table requirements</h2>
            {workflow.accessibleAlternatives.map((alternative) => (
              <article key={alternative.forOutput}>
                <h3>{alternative.forOutput}</h3>
                <p>{alternative.textSummary}</p>
                <p><strong>Table columns:</strong> {alternative.tableColumns.join(", ")}</p>
              </article>
            ))}
          </section>
          <section>
            <p className="eyebrow">Evidence rubric</p>
            <h2>Portfolio-ready output</h2>
            {workflow.evidenceRubric.map((item) => (
              <article key={item.criterion}>
                <h3>{item.criterion}</h3>
                <p><strong>Required:</strong> {item.requiredEvidence}</p>
                <p><strong>Pass:</strong> {item.passCondition}</p>
              </article>
            ))}
          </section>
        </aside>
      </div>
    </section>
  );
}
