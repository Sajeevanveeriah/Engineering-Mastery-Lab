import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  MASTERY_CONTENT_VERSION,
  capabilityStages,
  engineersAustraliaMappingNotice,
  masteryModules
} from "../data/masteryCurriculum";
import { evaluateNumericCheck } from "../lib/curriculum";
import type { LearningRecord, MasteryGateResult } from "../lib/storage";
import { NotFoundPage } from "./NotFoundPage";

function blankModuleRecord(): LearningRecord {
  return {
    status: "not-started",
    blocker: null,
    confidence: null,
    actualMinutes: 0,
    notes: "",
    evidenceReferences: [],
    attemptCount: 0,
    diagnosticScore: null,
    gateResult: "not-assessed",
    completedAt: null,
    contentVersion: MASTERY_CONTENT_VERSION
  };
}

export function MasteryModulePage() {
  const { moduleId = "" } = useParams();
  const { progress, update } = useProgress();
  const module = masteryModules.find((candidate) => candidate.id === moduleId);
  const saved = module ? progress.curriculumRecords[module.id] : undefined;
  const [draft, setDraft] = useState<LearningRecord>(() => saved ?? blankModuleRecord());
  const [evidenceText, setEvidenceText] = useState(() => saved?.evidenceReferences.join("\n") ?? "");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setDraft(saved ?? blankModuleRecord());
    setEvidenceText(saved?.evidenceReferences.join("\n") ?? "");
    setSavedMessage("");
  }, [moduleId, saved]);

  if (!module) return <NotFoundPage />;
  const stage = capabilityStages.find((candidate) => candidate.id === module.stageId)!;
  const independentValue = evaluateNumericCheck(module.workedExample.check);
  const saveRecord = () => {
    const now = new Date().toISOString();
    const next: LearningRecord = {
      ...draft,
      evidenceReferences: evidenceText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      completedAt: draft.status === "done" ? (draft.completedAt ?? now) : null,
      contentVersion: module.contentVersion
    };
    update((state) => ({ ...state, curriculumRecords: { ...state.curriculumRecords, [module.id]: next } }));
    setDraft(next);
    setSavedMessage("Local module record saved.");
  };

  return (
    <section className="page module-detail-page">
      <PageHeader
        eyebrow={`${module.id} - ${stage.id} ${stage.title}`}
        title={module.title}
        description={module.beginnerExplanation}
        actions={<Link className="btn" to={`/learn/roadmap#stage-${stage.id}`}>Back to {stage.id}</Link>}
      />

      <div className="learning-boundary" role="note"><strong>Educational mapping.</strong> {engineersAustraliaMappingNotice}</div>

      <div className="module-detail-layout">
        <div className="module-detail-content">
          <section aria-labelledby="outcomes-heading">
            <p className="eyebrow">Measurable intent</p><h2 id="outcomes-heading">Learning outcomes</h2>
            <ul className="check-list">{module.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
          </section>
          <section aria-labelledby="prerequisites-heading">
            <h2 id="prerequisites-heading">Prerequisites</h2>
            {module.prerequisites.length > 0
              ? <ul>{module.prerequisites.map((id) => { const prerequisite = masteryModules.find((candidate) => candidate.id === id); return <li key={id}><Link to={`/learn/modules/${id}`}>{prerequisite?.title ?? id}</Link></li>; })}</ul>
              : <p>This is an entry module. No curriculum prerequisite is required.</p>}
          </section>
          <section aria-labelledby="vocabulary-heading">
            <h2 id="vocabulary-heading">Vocabulary and symbols</h2>
            <dl className="definition-grid">{module.vocabulary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
          </section>
          <section className="equation-panel" aria-labelledby="equations-heading">
            <p className="eyebrow">Verified dimensional model</p><h2 id="equations-heading">Equations with SI units</h2>
            {module.equations.map((equation) => (
              <article key={equation.expression}>
                <code>{equation.expression}</code>
                <p><strong>Dimensional check:</strong> {equation.dimensionalCheck}</p>
                <dl>{equation.variables.map((variable) => <div key={variable.symbol}><dt><code>{variable.symbol}</code></dt><dd>{variable.meaning} [{variable.unit}]</dd></div>)}</dl>
              </article>
            ))}
          </section>
          <section className="worked-example" aria-labelledby="worked-example-heading">
            <p className="eyebrow">Worked numeric example</p><h2 id="worked-example-heading">{module.workedExample.prompt}</h2>
            <p><code>{module.workedExample.substitution}</code></p>
            <p className="worked-example__answer"><strong>{module.workedExample.answer.toLocaleString("en-AU")} {module.workedExample.unit}</strong></p>
            <p>{module.workedExample.rounding}</p>
            <div className="verification-strip"><span>Independent evaluator</span><strong>{independentValue.toLocaleString("en-AU")} {module.workedExample.unit}</strong><small>{module.workedExample.check.independentMethod}</small></div>
          </section>
          <div className="learning-action-grid">
            <section><p className="eyebrow">Retrieve</p><h2>Recall without notes</h2><p>{module.retrievalTask}</p></section>
            <section><p className="eyebrow">Build or test</p><h2>Practical task</h2><p>{module.practicalTask}</p></section>
          </div>
          <section aria-labelledby="diagnostic-guidance-heading">
            <h2 id="diagnostic-guidance-heading">Common mistakes and diagnostic guidance</h2>
            <ul>{module.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
            <p><strong>Diagnostic:</strong> {module.diagnosticGuidance}</p>
          </section>
          <section className="mastery-gate" aria-labelledby="mastery-gate-heading">
            <p className="eyebrow">Evidence before claim</p><h2 id="mastery-gate-heading">Mastery gate</h2>
            <p><strong>Evidence:</strong> {module.evidenceRequirement}</p>
            <p><strong>Gate:</strong> {module.masteryGate}</p>
          </section>
          <section aria-labelledby="text-equivalent-heading">
            <h2 id="text-equivalent-heading">Accessible visual equivalent</h2>
            <p>{module.textEquivalent}</p>
          </section>
          {module.designReviewQuestion && <section><h2>Design-review question</h2><blockquote>{module.designReviewQuestion}</blockquote></section>}
          <section aria-labelledby="module-resources-heading">
            <h2 id="module-resources-heading">Resources and provenance</h2>
            <ul>{module.resources.map((resource) => <li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.label}</a> <span className="badge">{resource.authority}</span></li>)}</ul>
            <p><strong>Content basis:</strong> {module.provenance.join("; ")}.</p>
          </section>
        </div>

        <aside className="session-record" aria-labelledby="module-record-heading">
          <p className="eyebrow">Local progress v4</p><h2 id="module-record-heading">Record module proof</h2>
          <label><span>Status</span><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as LearningRecord["status"] }))}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
          <label><span>Confidence, self-report 1 to 5</span><select value={draft.confidence ?? ""} onChange={(event) => setDraft((current) => ({ ...current, confidence: event.target.value === "" ? null : Number(event.target.value) }))}><option value="">Not reported</option>{[1, 2, 3, 4, 5].map((score) => <option key={score}>{score}</option>)}</select></label>
          <label><span>Actual minutes</span><input type="number" min={0} max={100000} value={draft.actualMinutes} onChange={(event) => setDraft((current) => ({ ...current, actualMinutes: Number(event.target.value) }))} /></label>
          <label><span>Attempt count</span><input type="number" min={0} max={10000} value={draft.attemptCount} onChange={(event) => setDraft((current) => ({ ...current, attemptCount: Number(event.target.value) }))} /></label>
          <label><span>Gate result</span><select value={draft.gateResult} onChange={(event) => setDraft((current) => ({ ...current, gateResult: event.target.value as MasteryGateResult }))}><option value="not-assessed">Not assessed</option><option value="passed">Passed against stated gate</option><option value="study-required">Study required</option></select></label>
          <label><span>Exact blocker</span><textarea rows={3} value={draft.blocker ?? ""} onChange={(event) => setDraft((current) => ({ ...current, blocker: event.target.value || null }))} /></label>
          <label><span>Evidence references, one per line</span><textarea rows={5} value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} /></label>
          <label><span>Notes</span><textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
          <button className="primary" type="button" onClick={saveRecord}>Save local record</button>
          {savedMessage && <p role="status" className="inline-message inline-message--success">{savedMessage}</p>}
          <p className="muted">Stage 1 guidance categories: {module.engineersAustraliaStage1.join("; ")}.</p>
        </aside>
      </div>
    </section>
  );
}
