import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  REBOOT_CONTENT_VERSION,
  rebootMilestones,
  rebootProjectReleases,
  rebootSessions,
  rebootTechnologyLanes
} from "../data/rebootCurriculum";
import { progressDimensions } from "../lib/curriculum";

export function RebootRoadmap() {
  const { progress } = useProgress();

  return (
    <section className="page reboot-page">
      <PageHeader
        eyebrow={`Robotics and AI/ML Reboot - content ${REBOOT_CONTENT_VERSION}`}
        title="Accelerated reboot roadmap"
        description="The complete workbook fast-track: 110 short sessions, 10 practical diagnostics, 10 proof gates and four progressive rover releases. Diagnostic skips never remove proof sessions."
        actions={<Link className="btn" to="/learn/diagnostics">Run a milestone diagnostic</Link>}
      />

      <div className="metric-grid curriculum-counts" aria-label="Fast-track source counts">
        <article><span>Sessions</span><strong>110</strong><small>S001-S110</small></article>
        <article><span>Planned time</span><strong>45 h 50 min</strong><small>2,750 min</small></article>
        <article><span>Resources</span><strong>64</strong><small>61 session-linked</small></article>
        <article><span>Rover releases</span><strong>4</strong><small>Simulation before spending</small></article>
      </div>

      <nav className="roadmap-jump" aria-label="Milestone shortcuts">
        {rebootMilestones.map((milestone) => <a key={milestone.id} href={`#milestone-${milestone.id}`}>{milestone.id}</a>)}
      </nav>

      <div className="milestone-roadmap">
        {rebootMilestones.map((milestone) => {
          const sessions = rebootSessions.filter((session) => session.milestoneId === milestone.id);
          const dimensions = progressDimensions(sessions.map((session) => session.id), progress.curriculumRecords);
          return (
            <section id={`milestone-${milestone.id}`} className="milestone-section" key={milestone.id} aria-labelledby={`${milestone.id}-heading`}>
              <header>
                <div>
                  <p className="eyebrow">{milestone.id} - {milestone.coreBlocks} blocks</p>
                  <h2 id={`${milestone.id}-heading`}>{milestone.name}</h2>
                  <p>{milestone.beginnerMeaning}</p>
                </div>
                <div className="milestone-gauge" aria-label={`${milestone.id} mastery ${dimensions.mastery}%`}>
                  <strong>{dimensions.mastery}%</strong><span>mastery gates</span>
                </div>
              </header>
              <dl className="definition-grid">
                <div><dt>Prerequisite</dt><dd>{milestone.prerequisite}</dd></div>
                <div><dt>Portfolio artefact</dt><dd>{milestone.portfolioArtefact}</dd></div>
                <div><dt>Mastery gate</dt><dd>{milestone.masteryGate}</dd></div>
                <div><dt>Role signal</dt><dd>{milestone.roleSignal}</dd></div>
              </dl>
              <ol className="session-strip">
                {sessions.map((session) => {
                  const record = progress.curriculumRecords[session.id];
                  return (
                    <li key={session.id}>
                      <Link to={`/learn/reboot/sessions/${session.id}`}>
                        <span><b>{session.id}</b><small>{session.mode}</small></span>
                        <strong>{session.topic}</strong>
                        <em>{record?.gateResult === "passed" ? "Gate passed" : (record?.status ?? "not-started").replaceAll("-", " ")}</em>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section aria-labelledby="release-heading">
        <div className="section-heading section-heading--outside"><div><p className="eyebrow">Progressive proof</p><h2 id="release-heading">Rover releases</h2></div></div>
        <div className="release-grid">
          {rebootProjectReleases.map((release) => (
            <article key={release.id}>
              <span className="badge">{release.id}</span>
              <h3>{release.name}</h3>
              <p>{release.systemIncrement}</p>
              <dl>
                <div><dt>Sessions</dt><dd>{release.sessions}</dd></div>
                <div><dt>Spending gate</dt><dd>{release.gateBeforeSpending}</dd></div>
              </dl>
              <Link className="btn" to={`/projects/releases/${release.id}`}>Inspect release brief</Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="technology-lanes-heading">
        <p className="eyebrow">Version-aware environments</p>
        <h2 id="technology-lanes-heading">Technology lanes</h2>
        <div className="table-wrap">
          <table>
            <caption>Reboot environment lanes and migration gates</caption>
            <thead><tr><th scope="col">Lane</th><th scope="col">When</th><th scope="col">OS</th><th scope="col">ROS 2</th><th scope="col">Gazebo</th><th scope="col">Gate</th></tr></thead>
            <tbody>{rebootTechnologyLanes.map((lane) => <tr key={lane.lane}><th scope="row">{lane.lane}</th><td>{lane.when}</td><td>{lane.operatingSystem}</td><td>{lane.ros2}</td><td>{lane.gazebo}</td><td>{lane.gate}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="muted">A newer lane is awareness, not an instruction to migrate. Compatibility, rollback and regression evidence are required first.</p>
      </section>
    </section>
  );
}

