import { Navigate, Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { pathwayById } from "../data/pathways";

export function PathwayDetail() {
  const { pathwayId = "" } = useParams();
  const pathway = pathwayById(pathwayId);
  const { progress, update } = useProgress();
  if (!pathway) return <Navigate to="/learn/pathways" replace />;
  const state = progress.pathways[pathway.id];
  const completed = new Set(state?.completedStepIds ?? []);
  const nextStep = pathway.steps.find((step) => !completed.has(step.id)) ?? pathway.steps[0];
  const bookmarked = Boolean(progress.bookmarks[bookmarkKey("pathway", pathway.id)]);

  const enrol = () => {
    const now = new Date().toISOString();
    update((current) => ({
      ...current,
      pathways: {
        ...current.pathways,
        [pathway.id]: current.pathways[pathway.id] ?? {
          status: "enrolled",
          enrolledAt: now,
          lastStepId: pathway.steps[0]?.id ?? "",
          completedStepIds: []
        }
      }
    }));
  };

  const toggleComplete = (stepId: string) => update((current) => {
    const existing = current.pathways[pathway.id] ?? {
      status: "enrolled" as const,
      enrolledAt: new Date().toISOString(),
      lastStepId: stepId,
      completedStepIds: []
    };
    const nextCompleted = existing.completedStepIds.includes(stepId)
      ? existing.completedStepIds.filter((id) => id !== stepId)
      : [...existing.completedStepIds, stepId];
    return {
      ...current,
      pathways: {
        ...current.pathways,
        [pathway.id]: {
          ...existing,
          status: nextCompleted.length === pathway.steps.length ? "completed" : "enrolled",
          lastStepId: stepId,
          completedStepIds: nextCompleted
        }
      }
    };
  });

  return (
    <section className="page detail-page">
      <Link className="back-link" to="/learn/pathways">Back to pathways</Link>
      <header className="detail-hero">
        <div><p className="eyebrow">{pathway.disciplines.join(" / ")}</p><h1>{pathway.name}</h1><p>{pathway.purpose}</p><div className="detail-meta"><span>{pathway.difficulty}</span><span>{pathway.effortHours} indicative hours</span><span>{pathway.steps.length} evidence-led steps</span></div></div>
        <div className="detail-hero__actions">
          <button className="icon-button" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} pathway bookmark`} aria-pressed={bookmarked} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("pathway", pathway.id)]: !bookmarked } }))}><Icon name={bookmarked ? "check" : "plus"} /></button>
          {!state ? <button className="primary" type="button" onClick={enrol}>Enrol locally</button> : <Link className="btn primary" to={nextStep.route}>{completed.size === pathway.steps.length ? "Review pathway" : "Resume next step"}</Link>}
        </div>
      </header>
      <div className="detail-columns">
        <div>
          <section aria-labelledby="pathway-outcomes"><h2 id="pathway-outcomes">Outcomes</h2><ul className="check-list">{pathway.outcomes.map((item) => <li key={item}><Icon name="check" size={17} />{item}</li>)}</ul></section>
          <section aria-labelledby="pathway-journey"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Ordered journey</p><h2 id="pathway-journey">Steps and evidence</h2></div><strong>{completed.size}/{pathway.steps.length}</strong></div>
            <ol className="journey-list">
              {pathway.steps.map((step, index) => (
                <li key={step.id} className={completed.has(step.id) ? "complete" : ""}>
                  <span>{completed.has(step.id) ? <Icon name="check" size={16} /> : index + 1}</span>
                  <div><p className="eyebrow">{step.type}</p><h3><Link to={step.route} onClick={() => {
                    if (!state) enrol();
                    update((current) => {
                      const entry = current.pathways[pathway.id];
                      return entry ? { ...current, pathways: { ...current.pathways, [pathway.id]: { ...entry, lastStepId: step.id } } } : current;
                    });
                  }}>{step.label}</Link></h3><p><strong>Evidence expected:</strong> {step.evidence}</p></div>
                  <label className="completion-check"><input type="checkbox" checked={completed.has(step.id)} onChange={() => toggleComplete(step.id)} /><span>Evidence checked</span></label>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="detail-aside">
          <section><h2>Who this is for</h2><p>{pathway.targetLearner}</p></section>
          <section><h2>Prerequisites</h2><ul>{pathway.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h2>Completion rule</h2><p>{pathway.completionRule}</p></section>
          <section><h2>Next recommendation</h2><Link to={pathway.next.route}>{pathway.next.label}</Link></section>
        </aside>
      </div>
    </section>
  );
}
