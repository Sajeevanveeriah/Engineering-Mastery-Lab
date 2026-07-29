import { useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { capabilityStages, masteryModules } from "../data/masteryCurriculum";
import { rebootMilestones, rebootSessions, rebootWeeklyReviewTemplate } from "../data/rebootCurriculum";
import { progressDimensions, rebootProgress, stageProgress, weeklyReviewDue } from "../lib/curriculum";

function DimensionBars({ values, label }: {
  values: { exposure: number; practice: number; evidence: number; mastery: number };
  label: string;
}) {
  return (
    <div className="dimension-bars" aria-label={`${label}: exposure ${values.exposure} percent, practice ${values.practice} percent, evidence ${values.evidence} percent, mastery ${values.mastery} percent`}>
      {(["exposure", "practice", "evidence", "mastery"] as const).map((dimension) => (
        <div key={dimension}><span>{dimension}</span><span className="dimension-bars__track"><span style={{ width: `${values[dimension]}%` }} /></span><strong>{values[dimension]}%</strong></div>
      ))}
    </div>
  );
}

export function ProgressAnalysisPage() {
  const { progress, update } = useProgress();
  const currentDate = new Date();
  const reviewMeta = weeklyReviewDue(progress.weeklyReviews, currentDate);
  const reviewKey = reviewMeta.weekKey;
  const savedReview = progress.weeklyReviews[reviewKey];
  const [completedBlocks, setCompletedBlocks] = useState(savedReview?.completedBlocks ?? 0);
  const [evidenceCount, setEvidenceCount] = useState(savedReview?.evidenceCount ?? 0);
  const [reflection, setReflection] = useState(savedReview?.reflection ?? "");
  const [reviewMessage, setReviewMessage] = useState("");
  const reboot = rebootProgress(progress);
  const records = Object.values(progress.curriculumRecords);
  const confidenceRecords = records.filter((record) => record.confidence !== null);
  const averageConfidence = confidenceRecords.length > 0
    ? confidenceRecords.reduce((sum, record) => sum + (record.confidence ?? 0), 0) / confidenceRecords.length
    : null;
  const verifiedAmongConfident = confidenceRecords.filter((record) => record.gateResult === "passed").length;
  const saveWeeklyReview = () => {
    const timestamp = new Date().toISOString();
    const boundedCompleted = Math.max(0, Math.min(100, Math.trunc(completedBlocks)));
    const boundedEvidence = Math.max(0, Math.min(100, Math.trunc(evidenceCount)));
    update((current) => ({
      ...current,
      weeklyReviews: {
        ...current.weeklyReviews,
        [reviewKey]: {
          weekKey: reviewKey,
          plannedBlocks: reviewMeta.plannedBlocks,
          completedBlocks: boundedCompleted,
          evidenceCount: boundedEvidence,
          reflection: reflection.trim(),
          createdAt: current.weeklyReviews[reviewKey]?.createdAt ?? timestamp,
          updatedAt: timestamp
        }
      }
    }));
    setCompletedBlocks(boundedCompleted);
    setEvidenceCount(boundedEvidence);
    setReviewMessage(`Saved ${reviewKey} locally.`);
  };

  return (
    <section className="page analysis-progress-page">
      <PageHeader
        eyebrow="Local evidence analytics"
        title="Learning progress analysis"
        description="Exposure, practice, evidence and mastery are calculated independently from stable records. One activity is counted once per learning object; cross-credit is not inferred."
        actions={<Link className="btn" to="/learn/roadmap">Open prerequisite roadmap</Link>}
      />

      <section className="analysis-hero" aria-labelledby="reboot-progress-heading">
        <div><p className="eyebrow">Accelerated reboot</p><h2 id="reboot-progress-heading">S001-S110</h2><p>{reboot.total} stable sessions form the denominator for every displayed percentage.</p></div>
        <DimensionBars values={reboot} label="Accelerated reboot" />
      </section>

      <section className="weekly-review-card" aria-labelledby="current-weekly-review-heading">
        <div>
          <p className="eyebrow">{reviewMeta.due ? "Review due" : "Current review window"}</p>
          <h2 id="current-weekly-review-heading">{reviewKey} weekly review</h2>
          <p>Compare workbook template week {reviewMeta.templateWeek}, with {reviewMeta.plannedBlocks} focused blocks, against completed work and retained evidence. This record stays in local progress storage.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); saveWeeklyReview(); }}>
          <div className="form-grid form-grid--2">
            <label className="form-field"><span>Completed blocks</span><input type="number" min={0} max={100} step={1} value={completedBlocks} onChange={(event) => setCompletedBlocks(Number(event.target.value))} /></label>
            <label className="form-field"><span>Evidence items retained</span><input type="number" min={0} max={100} step={1} value={evidenceCount} onChange={(event) => setEvidenceCount(Number(event.target.value))} /></label>
            <label className="form-field form-field--wide"><span>Short reflection</span><textarea rows={4} maxLength={40_000} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What changed, what is still weak, and what is the next smallest proof?" /></label>
          </div>
          <button className="primary" type="submit">Save weekly review</button>
          {reviewMessage && <p className="inline-message inline-message--success" role="status">{reviewMessage}</p>}
        </form>
      </section>

      <section aria-labelledby="stage-analysis-heading">
        <h2 id="stage-analysis-heading">Capability stages</h2>
        <div className="analysis-stage-grid">
          {capabilityStages.map((stage) => {
            const summary = stageProgress(progress, stage.id);
            return <article key={stage.id}><span className="badge">{stage.id}</span><h3>{stage.title}</h3><p>{masteryModules.filter((module) => module.stageId === stage.id).length} domain modules</p><DimensionBars values={summary} label={stage.title} /></article>;
          })}
        </div>
      </section>

      <section aria-labelledby="milestone-analysis-heading">
        <h2 id="milestone-analysis-heading">Fast-track milestones</h2>
        <div className="table-wrap">
          <table>
            <caption>Milestone exposure, practice, evidence and mastery percentages</caption>
            <thead><tr><th scope="col">Milestone</th><th scope="col">Sessions</th><th scope="col">Exposure</th><th scope="col">Practice</th><th scope="col">Evidence</th><th scope="col">Mastery</th></tr></thead>
            <tbody>{rebootMilestones.map((milestone) => { const ids = rebootSessions.filter((session) => session.milestoneId === milestone.id).map((session) => session.id); const summary = progressDimensions(ids, progress.curriculumRecords); return <tr key={milestone.id}><th scope="row">{milestone.id} - {milestone.name}</th><td>{ids.length}</td><td>{summary.exposure}%</td><td>{summary.practice}%</td><td>{summary.evidence}%</td><td>{summary.mastery}%</td></tr>; })}</tbody>
          </table>
        </div>
      </section>

      <div className="analysis-two-column">
        <section aria-labelledby="confidence-analysis-heading">
          <p className="eyebrow">Self-report versus verification</p><h2 id="confidence-analysis-heading">Confidence comparison</h2>
          {averageConfidence === null ? <div className="empty-state"><strong>No confidence records yet</strong><p>Confidence is optional and never substitutes for a passed gate.</p></div> : <dl className="definition-grid"><div><dt>Average self-report</dt><dd>{averageConfidence.toFixed(1)} / 5</dd></div><div><dt>Records with confidence</dt><dd>{confidenceRecords.length}</dd></div><div><dt>Also gate-passed</dt><dd>{verifiedAmongConfident}</dd></div><div><dt>Not gate-passed</dt><dd>{confidenceRecords.length - verifiedAmongConfident}</dd></div></dl>}
        </section>
        <section aria-labelledby="portfolio-analysis-heading">
          <p className="eyebrow">Accumulated proof</p><h2 id="portfolio-analysis-heading">Portfolio evidence</h2>
          <dl className="definition-grid"><div><dt>Curriculum evidence references</dt><dd>{records.reduce((sum, record) => sum + record.evidenceReferences.length, 0)}</dd></div><div><dt>Manual evidence records</dt><dd>{progress.manualEvidence.length}</dd></div><div><dt>Checked legacy artefacts</dt><dd>{Object.values(progress.artefacts).filter(Boolean).length}</dd></div><div><dt>Completed projects</dt><dd>{Object.values(progress.projects).filter((project) => project.status === "completed").length}</dd></div></dl>
        </section>
      </div>

      <section aria-labelledby="weekly-analysis-heading">
        <h2 id="weekly-analysis-heading">Weekly planned versus completed blocks</h2>
        <div className="table-wrap">
          <table>
            <caption>Twelve-week review template and local completion records</caption>
            <thead><tr><th scope="col">Template week</th><th scope="col">Planned blocks</th><th scope="col">Most recent matching record</th><th scope="col">Completed blocks</th><th scope="col">Evidence items</th></tr></thead>
            <tbody>{rebootWeeklyReviewTemplate.map((week) => {
              const record = Object.values(progress.weeklyReviews)
                .filter((item) => ((Number(item.weekKey.slice(-2)) - 1) % rebootWeeklyReviewTemplate.length) + 1 === week.week)
                .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
              return <tr key={week.week}><th scope="row">Week {week.week}</th><td>{week.plannedBlocks}</td><td>{record?.weekKey ?? "No local record"}</td><td>{record?.completedBlocks ?? 0}</td><td>{record?.evidenceCount ?? 0}</td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
