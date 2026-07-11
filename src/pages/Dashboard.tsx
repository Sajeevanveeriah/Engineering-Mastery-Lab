import { useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import {
  artefactCount,
  challengePassCount,
  domainScores,
  moduleProgress,
  overallProgress,
  sprintProgress
} from "../lib/metrics";
import { exportProgress, importProgress, type ProgressState } from "../lib/storage";

const sprintItems = [
  { id: "sprint-sim", label: "Complete one simulation session" },
  { id: "sprint-challenge", label: "Pass one challenge with verified criteria" },
  { id: "sprint-evidence", label: "Produce one portfolio artefact" },
  { id: "sprint-rate", label: "Update one skill rating with evidence" },
  { id: "sprint-reflect", label: "Write one module reflection" },
  { id: "sprint-build", label: "Spend at least one hour on a build" }
];

export function Dashboard() {
  const { progress, update, replace } = useProgress();
  const summary = overallProgress(progress);
  const artefacts = artefactCount(progress);
  const passes = challengePassCount(progress);
  const sprint = sprintProgress(progress, sprintItems.map((item) => item.id));
  const scores = [...domainScores(progress)].sort((a, b) => a.score - b.score);
  const moduleStats = modules.map((module) => ({ module, status: moduleProgress(progress, module) }));
  const recommended = moduleStats.find(({ status }) => status.percent < 100) ?? moduleStats[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ type: "success" | "error" | "neutral"; text: string } | null>(null);
  const [importRollback, setImportRollback] = useState<ProgressState | null>(null);

  const doExport = () => {
    const blob = new Blob([exportProgress(progress)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `engineering-workbench-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setImportMsg({ type: "success", text: "Progress backup exported." });
  };

  const doImport = async (file: File) => {
    try {
      const imported = importProgress(await file.text());
      const importedRatings = Object.values(imported.skillRatings).filter((rating) => rating.level > 0).length;
      const importedPasses = Object.values(imported.challenges).filter((challenge) => challenge.passed).length;
      const approved = window.confirm(
        `Replace the progress currently stored in this app with “${file.name}”?\n\n` +
          `The file contains ${importedRatings} rated skills and ${importedPasses} passed challenges. ` +
          "Export the current progress first if you may need to restore it."
      );
      if (!approved) {
        setImportMsg({ type: "neutral", text: "Import cancelled. Existing progress was kept." });
        return;
      }
      setImportRollback(structuredClone(progress));
      replace(imported);
      setImportMsg({ type: "success", text: "Progress imported successfully. You can undo this import until the app is closed or another import is completed." });
    } catch (error) {
      setImportMsg({ type: "error", text: `Import failed: ${error instanceof Error ? error.message : "invalid file"}` });
    }
  };

  const resetSprint = () => {
    if (!window.confirm("Reset all six weekly sprint items? This does not change lab, skill or evidence progress.")) return;
    update((state) => ({ ...state, sprintChecklist: {} }));
  };

  return (
    <section className="page dashboard-page">
      <PageHeader
        eyebrow="Learning command centre"
        title="Engineering mastery dashboard"
        description="Choose the next practical task, keep the weekly plan honest and turn completed work into evidence you can reuse."
        actions={
          <Link className="btn primary" to="/labs">
            Browse laboratories <Icon name="arrow-right" size={17} />
          </Link>
        }
      />

      <section className="dashboard-hero" aria-labelledby="next-action-heading">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Recommended next action</p>
          <h2 id="next-action-heading">{recommended.module.title}</h2>
          <p>{recommended.status.done > 0 ? "Continue the module and close its next incomplete milestone." : "Start with the simulator, then verify the first challenge against its stated pass criteria."}</p>
          <div className="button-row">
            <Link className="btn primary" to={recommended.module.route}>
              {recommended.status.done > 0 ? "Continue module" : "Start module"}
              <Icon name="arrow-right" size={17} />
            </Link>
            <Link className="btn btn--ghost" to="/pathways">View pathways</Link>
          </div>
        </div>
        <div className="progress-ring" style={{ "--progress": `${summary.percent * 3.6}deg` } as CSSProperties} aria-label={`Overall learning progress ${summary.percent}%`}>
          <div>
            <strong>{summary.percent}%</strong>
            <span>overall</span>
          </div>
        </div>
      </section>

      <div className="metric-grid dashboard-metrics">
        <article className="metric-card">
          <span className="metric-card__icon"><Icon name="labs" /></span>
          <div><span>Modules complete</span><strong>{summary.completedModules}<small> / {summary.totalModules}</small></strong></div>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon"><Icon name="target" /></span>
          <div><span>Challenges passed</span><strong>{passes}</strong></div>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon"><Icon name="file" /></span>
          <div><span>Evidence artefacts</span><strong>{artefacts.done}<small> / {artefacts.total}</small></strong></div>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon"><Icon name="skills" /></span>
          <div><span>Skills rated</span><strong>{summary.ratedSkills}<small> / {summary.totalSkills}</small></strong></div>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="card dashboard-sprint" aria-labelledby="sprint-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">This week</p>
              <h2 id="sprint-heading">Engineering sprint</h2>
            </div>
            <span className="section-heading__metric">{sprint.done}/{sprint.total}</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-label="Weekly sprint completion" aria-valuenow={sprint.percent} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${sprint.percent}%` }} />
          </div>
          <ul className="checklist checklist--spacious">
            {sprintItems.map((item) => (
              <li key={item.id}>
                <input
                  id={item.id}
                  type="checkbox"
                  checked={Boolean(progress.sprintChecklist[item.id])}
                  onChange={() => update((state) => ({
                    ...state,
                    sprintChecklist: { ...state.sprintChecklist, [item.id]: !state.sprintChecklist[item.id] }
                  }))}
                />
                <label htmlFor={item.id}>{item.label}</label>
              </li>
            ))}
          </ul>
          <button className="btn btn--quiet" type="button" onClick={resetSprint}>Reset weekly sprint</button>
        </section>

        <section className="card dashboard-skills" aria-labelledby="skill-priorities-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lowest current scores</p>
              <h2 id="skill-priorities-heading">Skill priorities</h2>
            </div>
            <Link to="/skills">Open matrix</Link>
          </div>
          <div className="domain-progress-list">
            {scores.slice(0, 6).map((score) => (
              <div key={score.domainId} className="domain-progress">
                <div className="progress-label">
                  <span>{score.name}</span>
                  <span>{score.score}% · {score.ratedSkills}/{score.totalSkills} rated</span>
                </div>
                <div className="progress-bar" role="progressbar" aria-label={`${score.name} score`} aria-valuenow={score.score} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${score.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="small muted">Scores are self-assessments. Attach a report, commit, calculation or test record before relying on a rating.</p>
        </section>
      </div>

      <section className="dashboard-section" aria-labelledby="module-progress-heading">
        <div className="section-heading section-heading--outside">
          <div>
            <p className="eyebrow">Active curriculum</p>
            <h2 id="module-progress-heading">Module progress</h2>
          </div>
          <Link to="/labs">View all eight labs</Link>
        </div>
        <div className="module-progress-grid">
          {moduleStats.slice(0, 4).map(({ module, status }) => (
            <Link className="module-progress-card" to={module.route} key={module.id}>
              <div className="module-progress-card__header">
                <strong>{module.title}</strong>
                <span>{status.percent}%</span>
              </div>
              <div className="progress-bar"><div style={{ width: `${status.percent}%` }} /></div>
              <span>{status.done} of {status.total} milestones</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--lower">
        <section className="card" aria-labelledby="portfolio-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Evidence coverage</p>
              <h2 id="portfolio-heading">Portfolio tracker</h2>
            </div>
          </div>
          <div className="table-scroll" tabIndex={0} aria-label="Portfolio progress table">
            <table className="compact-table">
              <thead><tr><th scope="col">Module</th><th scope="col">Evidence</th><th scope="col">Challenges</th><th scope="col">Reflection</th></tr></thead>
              <tbody>
                {moduleStats.map(({ module, status }) => (
                  <tr key={module.id}>
                    <th scope="row"><Link to={module.route}>{module.title.replace(" Lab", "")}</Link></th>
                    <td>{status.evidenceDone}/{status.evidenceTotal}</td>
                    <td>{status.challengesDone}/{status.challengesTotal}</td>
                    <td>{status.reflectionDone ? <span className="status-text status-text--ok"><Icon name="check" size={15} /> Saved</span> : <span className="muted">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card data-card" aria-labelledby="progress-data-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Local data</p>
              <h2 id="progress-data-heading">Backup and restore</h2>
            </div>
          </div>
          <p className="muted">Learning progress stays in this browser profile. Export a JSON backup before clearing browser data or moving devices.</p>
          <div className="button-stack">
            <button className="btn primary" type="button" onClick={doExport}><Icon name="download" size={17} /> Export backup</button>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()}><Icon name="upload" size={17} /> Import backup</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a progress backup file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void doImport(file);
              event.target.value = "";
            }}
          />
          {importMsg && (
            <p className={`inline-message inline-message--${importMsg.type}`} role={importMsg.type === "error" ? "alert" : "status"}>
              {importMsg.text}
            </p>
          )}
          {importRollback && (
            <button
              className="btn btn--quiet"
              type="button"
              onClick={() => {
                replace(importRollback);
                setImportRollback(null);
                setImportMsg({ type: "success", text: "The progress state from before the import was restored." });
              }}
            >
              Undo last import
            </button>
          )}
        </section>
      </div>

      <div className="safety-note" role="note">
        <Icon name="alert" size={20} />
        <p><strong>Educational boundary.</strong> Every simulation is a simplified synthetic model. It does not demonstrate standards compliance and must not be used as a procedure for live machinery or safety systems.</p>
      </div>
    </section>
  );
}
