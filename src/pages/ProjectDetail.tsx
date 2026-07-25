import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { projectById, projects } from "../data/projects";

export function ProjectDetail() {
  const { projectId = "" } = useParams();
  const project = projectById(projectId);
  const { progress, update } = useProgress();
  const state = project ? progress.projects[project.id] : undefined;
  const [notes, setNotes] = useState(state?.notes ?? "");

  useEffect(() => {
    if (!project) return;
    const now = new Date().toISOString();
    update((current) => ({
      ...current,
      recentItems: [
        { id: project.id, type: "project" as const, title: project.title, route: `/projects/${project.slug}`, visitedAt: now },
        ...current.recentItems.filter((item) => !(item.type === "project" && item.id === project.id))
      ].slice(0, 20)
    }));
  }, [project, update]);

  if (!project) return <Navigate to="/projects" replace />;
  const completeMilestones = new Set(state?.completedMilestoneIds ?? []);
  const completeEvidence = new Set(state?.checkedEvidenceIds ?? []);
  const canComplete = completeMilestones.size === project.milestones.length && completeEvidence.size === project.portfolioEvidence.length;
  const bookmarked = Boolean(progress.bookmarks[bookmarkKey("project", project.id)]);
  const related = projects.filter((item) => item.id !== project.id && item.disciplines.some((discipline) => project.disciplines.includes(discipline))).slice(0, 3);

  const setStatus = (status: "active" | "paused" | "completed") => {
    const now = new Date().toISOString();
    update((current) => ({
      ...current,
      projects: {
        ...current.projects,
        [project.id]: {
          status,
          startedAt: current.projects[project.id]?.startedAt ?? now,
          updatedAt: now,
          completedMilestoneIds: current.projects[project.id]?.completedMilestoneIds ?? [],
          checkedEvidenceIds: current.projects[project.id]?.checkedEvidenceIds ?? [],
          notes
        }
      }
    }));
  };

  const toggleListItem = (field: "completedMilestoneIds" | "checkedEvidenceIds", id: string) => update((current) => {
    const now = new Date().toISOString();
    const existing = current.projects[project.id] ?? {
      status: "active" as const,
      startedAt: now,
      updatedAt: now,
      completedMilestoneIds: [],
      checkedEvidenceIds: [],
      notes
    };
    const values = existing[field];
    return {
      ...current,
      projects: {
        ...current.projects,
        [project.id]: { ...existing, updatedAt: now, [field]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id] }
      }
    };
  });

  return (
    <section className="page detail-page">
      <Link className="back-link" to="/projects">Back to projects</Link>
      <header className="detail-hero">
        <div><p className="eyebrow">{project.disciplines.join(" / ")}</p><h1>{project.title}</h1><p>{project.summary}</p><div className="detail-meta"><span>{project.difficulty}</span><span>{project.effortHours} indicative hours</span><span>AUD {project.budgetAud.minimum}-{project.budgetAud.maximum} estimate</span></div></div>
        <div className="detail-hero__actions">
          <button className="icon-button" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} project bookmark`} aria-pressed={bookmarked} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("project", project.id)]: !bookmarked } }))}><Icon name={bookmarked ? "check" : "plus"} /></button>
          {!state && <button className="primary" type="button" onClick={() => setStatus("active")}>Start project</button>}
          {state?.status === "active" && <button type="button" onClick={() => setStatus("paused")}>Pause</button>}
          {state?.status === "paused" && <button className="primary" type="button" onClick={() => setStatus("active")}>Resume</button>}
          {state && state.status !== "completed" && <button className="primary" type="button" disabled={!canComplete} title={!canComplete ? "Complete every milestone and evidence item first" : undefined} onClick={() => setStatus("completed")}>Complete project</button>}
          {state?.status === "completed" && <span className="status-text status-text--ok"><Icon name="check" size={16} /> Completed</span>}
        </div>
      </header>
      <div className="safety-note"><Icon name="alert" size={20} /><p><strong>Engineering boundary.</strong> {project.safetyBoundary}</p></div>
      <div className="detail-columns">
        <div>
          <section aria-labelledby="project-outcomes"><h2 id="project-outcomes">Learning outcomes</h2><ul className="check-list">{project.outcomes.map((item) => <li key={item}><Icon name="check" size={16} />{item}</li>)}</ul></section>
          <section aria-labelledby="project-milestones"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Delivery plan</p><h2 id="project-milestones">Milestones</h2></div><strong>{completeMilestones.size}/{project.milestones.length}</strong></div>
            <ol className="milestone-list">{project.milestones.map((milestone, index) => <li key={milestone.id}><label><input type="checkbox" checked={completeMilestones.has(milestone.id)} onChange={() => toggleListItem("completedMilestoneIds", milestone.id)} /><span><b>{index + 1}. {milestone.title}</b><small>{milestone.description}</small><em>Validation: {milestone.validation}</em></span></label></li>)}</ol>
          </section>
          <section aria-labelledby="validation-heading"><h2 id="validation-heading">Validation criteria</h2><ul>{project.validationCriteria.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section aria-labelledby="evidence-heading"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Portfolio boundary</p><h2 id="evidence-heading">Required evidence</h2></div><strong>{completeEvidence.size}/{project.portfolioEvidence.length}</strong></div>
            <ul className="evidence-list">{project.portfolioEvidence.map((item, index) => { const id = `evidence-${index}`; return <li key={id}><input id={`${project.id}-${id}`} type="checkbox" checked={completeEvidence.has(id)} onChange={() => toggleListItem("checkedEvidenceIds", id)} /><label htmlFor={`${project.id}-${id}`}><span>{item}</span><small>{completeEvidence.has(id) ? "Recorded as available" : "Evidence required"}</small></label></li>; })}</ul>
          </section>
          <section aria-labelledby="project-notes"><h2 id="project-notes">Project notes</h2><div className="form-field"><label htmlFor="project-notes-field">Local working notes</label><textarea id="project-notes-field" rows={8} value={notes} maxLength={40000} onChange={(event) => setNotes(event.target.value)} onBlur={() => state && setStatus(state.status)} /><small>Saved locally when focus leaves this field.</small></div></section>
        </div>
        <aside className="detail-aside">
          <section><h2>Budget estimate</h2><p>AUD {project.budgetAud.minimum}-{project.budgetAud.maximum}</p><small>{project.budgetAud.basis}</small></section>
          <section><h2>Prerequisites</h2><ul>{project.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h2>Required software</h2><ul>{project.requiredSoftware.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h2>Optional hardware</h2>{project.optionalHardware.length ? <ul>{project.optionalHardware.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No hardware required.</p>}</section>
          <section><h2>Extension challenges</h2><ul>{project.extensionChallenges.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </aside>
      </div>
      <section aria-labelledby="related-projects"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Continue applying</p><h2 id="related-projects">Related projects</h2></div></div><div className="simple-link-list">{related.map((item) => <Link key={item.id} to={`/projects/${item.slug}`}><span><strong>{item.title}</strong><small>{item.summary}</small></span><span className="badge">{item.difficulty}</span></Link>)}</div></section>
    </section>
  );
}
