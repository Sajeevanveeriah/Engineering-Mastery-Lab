import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  MASTERY_CONTENT_VERSION,
  capabilityStages,
  engineersAustraliaMappingNotice,
  masteryModules
} from "../data/masteryCurriculum";
import { stageProgress } from "../lib/curriculum";

export function CurriculumRoadmap() {
  const { progress } = useProgress();

  return (
    <section className="page curriculum-page">
      <PageHeader
        eyebrow={`Five capability stages - content ${MASTERY_CONTENT_VERSION}`}
        title="Complete engineering curriculum"
        description="A prerequisite-aware route from engineering starter knowledge to defensible end-to-end robotics R&D proof. Exposure, practice, evidence and mastery remain separate local records."
        actions={<Link className="btn" to="/learn/reboot">Open the accelerated reboot</Link>}
      />

      <div className="learning-boundary" role="note">
        <strong>Coverage guidance.</strong> {engineersAustraliaMappingNotice}
      </div>

      <nav className="roadmap-jump" aria-label="Capability stage shortcuts">
        {capabilityStages.map((stage) => <a key={stage.id} href={`#stage-${stage.id}`}>{stage.id}</a>)}
      </nav>

      <div className="capability-roadmap">
        {capabilityStages.map((stage) => {
          const modules = masteryModules.filter((module) => module.stageId === stage.id);
          const summary = stageProgress(progress, stage.id);
          return (
            <section id={`stage-${stage.id}`} className="capability-stage" key={stage.id} aria-labelledby={`stage-${stage.id}-heading`}>
              <header>
                <div>
                  <p className="eyebrow">{stage.id}</p>
                  <h2 id={`stage-${stage.id}-heading`}>{stage.title}</h2>
                  <p>{stage.outcome}</p>
                </div>
                <dl className="stage-progress" aria-label={`${stage.title} progress`}>
                  <div><dt>Exposure</dt><dd>{summary.exposure}%</dd></div>
                  <div><dt>Practice</dt><dd>{summary.practice}%</dd></div>
                  <div><dt>Evidence</dt><dd>{summary.evidence}%</dd></div>
                  <div><dt>Mastery</dt><dd>{summary.mastery}%</dd></div>
                </dl>
              </header>
              <ol className="module-track">
                {modules.map((module) => {
                  const record = progress.curriculumRecords[module.id];
                  return (
                    <li key={module.id}>
                      <Link to={`/learn/modules/${module.id}`}>
                        <span className="module-track__index">{String(module.domainNumber).padStart(2, "0")}</span>
                        <span>
                          <strong>{module.title}</strong>
                          <small>{module.outcomes[0]}</small>
                          <em>{module.prerequisites.length === 0 ? "Entry module" : `Prerequisites: ${module.prerequisites.join(", ")}`}</em>
                        </span>
                        <span className={`status-badge status-badge--${record?.status ?? "not-started"}`}>
                          {record?.gateResult === "passed" ? "Gate passed" : (record?.status ?? "Not started").replaceAll("-", " ")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="prerequisite-map" aria-labelledby="prerequisite-map-heading">
        <p className="eyebrow">Accessible prerequisite map</p>
        <h2 id="prerequisite-map-heading">Dependency paths</h2>
        <p>Each row states the incoming learning dependencies. The ordered stage layout above is the visual equivalent.</p>
        <div className="table-wrap">
          <table>
            <caption>Curriculum module prerequisites</caption>
            <thead><tr><th scope="col">Module</th><th scope="col">Stage</th><th scope="col">Prerequisites</th></tr></thead>
            <tbody>
              {masteryModules.map((module) => (
                <tr key={module.id}>
                  <th scope="row"><Link to={`/learn/modules/${module.id}`}>{module.title}</Link></th>
                  <td>{module.stageId}</td>
                  <td>{module.prerequisites.length > 0 ? module.prerequisites.join(", ") : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

