import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Icon } from "../components/Icon";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { projectById, projects } from "../data/projects";

const projectStateDetails = {
  available: { label: "Available", className: "badge" },
  active: { label: "Active", className: "badge info" },
  paused: { label: "Paused", className: "badge warn" },
  completed: { label: "Complete", className: "badge ok" }
} as const;

export function hasExactRequiredIds(recordedIds: readonly string[], requiredIds: readonly string[]): boolean {
  if (recordedIds.length !== requiredIds.length) return false;
  const recorded = new Set(recordedIds);
  const required = new Set(requiredIds);
  return recorded.size === recordedIds.length
    && required.size === requiredIds.length
    && requiredIds.every((id) => recorded.has(id));
}

export function projectNotesFor(
  projectId: string,
  savedNotes: string,
  draft: Readonly<{ projectId: string; value: string }>
): string {
  return draft.projectId === projectId ? draft.value : savedNotes;
}

export function ProjectDetail() {
  const { projectId = "" } = useParams();
  const project = projectById(projectId);
  const { progress, update } = useProgress();
  const state = project ? progress.projects[project.id] : undefined;
  const [notesDraft, setNotesDraft] = useState(() => ({
    projectId: project?.id ?? "",
    value: state?.notes ?? ""
  }));
  const notes = projectNotesFor(project?.id ?? "", state?.notes ?? "", notesDraft);

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
  const milestoneIds = state?.completedMilestoneIds ?? [];
  const evidenceIds = state?.checkedEvidenceIds ?? [];
  const requiredMilestoneIds = project.milestones.map((milestone) => milestone.id);
  const requiredEvidenceIds = project.portfolioEvidence.map((_, index) => `evidence-${index}`);
  const completeMilestones = new Set(milestoneIds);
  const completeEvidence = new Set(evidenceIds);
  const completeMilestoneCount = project.milestones.filter((milestone) => completeMilestones.has(milestone.id)).length;
  const completeEvidenceCount = project.portfolioEvidence.filter((_, index) => completeEvidence.has(`evidence-${index}`)).length;
  const canComplete = hasExactRequiredIds(milestoneIds, requiredMilestoneIds)
    && hasExactRequiredIds(evidenceIds, requiredEvidenceIds);
  const remainingMilestones = project.milestones.length - completeMilestoneCount;
  const remainingEvidence = project.portfolioEvidence.length - completeEvidenceCount;
  const hasValidCompletionRecord = state?.status === "completed" && canComplete;
  const displayedStatus = state?.status === "completed" && !canComplete ? "active" : state?.status ?? "available";
  const stateDetails = projectStateDetails[displayedStatus];
  const completionGateMessage = canComplete
    ? "Every milestone and evidence requirement is confirmed. You may create a learner completion record."
    : state?.status === "completed"
      ? "The saved Complete state does not exactly match the current milestone and evidence requirements. Reopen the build to review and normalise the record."
      : `${remainingMilestones} milestone ${remainingMilestones === 1 ? "confirmation remains" : "confirmations remain"} and ${remainingEvidence} evidence ${remainingEvidence === 1 ? "confirmation remains" : "confirmations remain"} before completion is available.`;
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

  const reopenForReview = () => update((current) => {
    const existing = current.projects[project.id];
    if (!existing) return current;
    const now = new Date().toISOString();
    return {
      ...current,
      projects: {
        ...current.projects,
        [project.id]: {
          ...existing,
          status: "active",
          updatedAt: now,
          completedMilestoneIds: requiredMilestoneIds.filter((id) => existing.completedMilestoneIds.includes(id)),
          checkedEvidenceIds: requiredEvidenceIds.filter((id) => existing.checkedEvidenceIds.includes(id)),
          notes
        }
      }
    };
  });

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
    const normalisedMilestones = requiredMilestoneIds.filter((requiredId) => existing.completedMilestoneIds.includes(requiredId));
    const normalisedEvidence = requiredEvidenceIds.filter((requiredId) => existing.checkedEvidenceIds.includes(requiredId));
    const values = field === "completedMilestoneIds" ? normalisedMilestones : normalisedEvidence;
    const toggledValues = values.includes(id) ? values.filter((item) => item !== id) : [...values, id];
    return {
      ...current,
      projects: {
        ...current.projects,
        [project.id]: {
          ...existing,
          status: existing.status === "completed" ? "active" : existing.status,
          updatedAt: now,
          completedMilestoneIds: field === "completedMilestoneIds" ? toggledValues : normalisedMilestones,
          checkedEvidenceIds: field === "checkedEvidenceIds" ? toggledValues : normalisedEvidence
        }
      }
    };
  });

  return (
    <section className="page detail-page">
      <Link className="back-link" to="/projects">Back to Build</Link>
      <header className="detail-hero">
        <div>
          <p className="eyebrow">Build brief</p>
          <h1>{project.title}</h1>
          <p><strong>Outcome.</strong> {project.summary}</p>
          <div className="detail-meta">
            <span className={stateDetails.className}>{stateDetails.label}</span>
            <span>{project.disciplines.join(" / ")}</span>
            <span>{project.difficulty}</span>
            <span>{project.effortHours} indicative hours</span>
            <span>AUD {project.budgetAud.minimum}-{project.budgetAud.maximum} estimate</span>
          </div>
        </div>
        <div className="detail-hero__actions">
          <button className="btn btn--quiet" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${project.title}`} aria-pressed={bookmarked} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("project", project.id)]: !bookmarked } }))}>
            <Icon name={bookmarked ? "check" : "plus"} size={16} />
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          {!state && <button className="primary" type="button" onClick={() => setStatus("active")}>Start build</button>}
          {state?.status === "active" && <button type="button" onClick={() => setStatus("paused")}>Pause build</button>}
          {state?.status === "paused" && <button className="primary" type="button" onClick={() => setStatus("active")}>Resume build</button>}
          {state && state.status !== "completed" && <button className="primary" type="button" disabled={!canComplete} title={!canComplete ? "Confirm every milestone and evidence requirement first" : undefined} onClick={() => setStatus("completed")}>Mark complete</button>}
          {state?.status === "completed" && !canComplete && <button className="primary" type="button" onClick={reopenForReview}>Reopen build</button>}
          {hasValidCompletionRecord && <span className="status-text status-text--ok"><Icon name="check" size={16} /> Complete</span>}
          {project.id === "motor-gearbox" && <Link className="btn" to="/tools/engineering">Open motor-sizing workspace</Link>}
        </div>
      </header>
      <div className="safety-note"><Icon name="alert" size={20} /><p><strong>Engineering safety boundary.</strong> {project.safetyBoundary}</p></div>
      <div className="safety-note safety-note--neutral"><Icon name="info" size={20} /><p><strong>Learner record boundary.</strong> Ticked milestones and evidence items are learner assertions stored on this device. The validation requirements remain separate acceptance checks; the app does not inspect files, independently assess the work, certify competence, or certify the design.</p></div>
      <div className="detail-columns">
        <div>
          <section aria-labelledby="project-outcomes"><p className="eyebrow">Intended result</p><h2 id="project-outcomes">Outcomes</h2><ul className="check-list">{project.outcomes.map((item) => <li key={item}><Icon name="target" size={16} />{item}</li>)}</ul></section>
          <section aria-labelledby="project-milestones"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Learner work record</p><h2 id="project-milestones">Milestones</h2></div><strong>{completeMilestoneCount}/{project.milestones.length}</strong></div>
            <p>Tick a milestone only after performing its work step. The acceptance requirement shown beneath it is the condition to check, not a claim that the app has validated it.</p>
            <ol className="milestone-list">{project.milestones.map((milestone, index) => <li key={milestone.id}><label><input type="checkbox" checked={completeMilestones.has(milestone.id)} onChange={() => toggleListItem("completedMilestoneIds", milestone.id)} /><span><b>{index + 1}. {milestone.title}</b><small><strong>Work step:</strong> {milestone.description}</small><em><strong>Acceptance requirement:</strong> {milestone.validation}</em></span></label></li>)}</ol>
          </section>
          <section aria-labelledby="project-notes"><p className="eyebrow">Near the work</p><h2 id="project-notes">Notes and decisions</h2><div className="form-field"><label htmlFor="project-notes-field">Local working notes</label><textarea id="project-notes-field" rows={8} value={notes} maxLength={40000} onChange={(event) => setNotesDraft({ projectId: project.id, value: event.target.value })} onBlur={() => (state || notes.trim()) && setStatus(state?.status === "completed" && !canComplete ? "active" : state?.status ?? "active")} /><small>{state ? "Saved locally when focus leaves this field." : "Entering notes creates an active local project record when focus leaves this field."}</small></div></section>
          <section aria-labelledby="validation-heading">
            <p className="eyebrow">Acceptance checks</p>
            <h2 id="validation-heading">Validation requirements</h2>
            <p>Evaluate these requirements against retained calculations, tests, or observations. Learner progress ticks do not independently prove that a requirement passed.</p>
            <ul className="check-list">{project.validationCriteria.map((item) => <li key={item}><Icon name="target" size={16} />{item}</li>)}</ul>
          </section>
          <section aria-labelledby="evidence-heading"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Learner evidence record</p><h2 id="evidence-heading">Evidence requirements</h2></div><strong>{completeEvidenceCount}/{project.portfolioEvidence.length}</strong></div>
            <p>Tick an item only when the named evidence exists and can be reviewed. The app records your confirmation but does not upload, inspect, or validate the asset.</p>
            <ul className="evidence-list">{project.portfolioEvidence.map((item, index) => { const id = `evidence-${index}`; return <li key={id}><input id={`${project.id}-${id}`} type="checkbox" checked={completeEvidence.has(id)} onChange={() => toggleListItem("checkedEvidenceIds", id)} /><label htmlFor={`${project.id}-${id}`}><span>{item}</span><small>{completeEvidence.has(id) ? "Learner confirmed as available" : "Evidence still required"}</small></label></li>; })}</ul>
            <div className="safety-note safety-note--neutral" aria-live="polite">
              <Icon name="info" size={20} />
              <p><strong>Completion gate.</strong> {completionGateMessage}</p>
            </div>
          </section>
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
