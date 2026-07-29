import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  REBOOT_CONTENT_VERSION,
  rebootCadence,
  rebootMilestones,
  rebootResources,
  rebootSessions
} from "../data/rebootCurriculum";
import { canSkipAfterDiagnostic, isProofSession } from "../lib/curriculum";
import type { LearningRecord, LearningStatus, MasteryGateResult } from "../lib/storage";
import { NotFoundPage } from "./NotFoundPage";

function blankRecord(): LearningRecord {
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
    contentVersion: REBOOT_CONTENT_VERSION
  };
}

export function RebootSessionPage() {
  const { sessionId = "" } = useParams();
  const { progress, update } = useProgress();
  const session = rebootSessions.find((candidate) => candidate.id === sessionId.toUpperCase());
  const saved = session ? progress.curriculumRecords[session.id] : undefined;
  const [draft, setDraft] = useState<LearningRecord>(() => saved ?? blankRecord());
  const [evidenceText, setEvidenceText] = useState(() => saved?.evidenceReferences.join("\n") ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(saved ?? blankRecord());
    setEvidenceText(saved?.evidenceReferences.join("\n") ?? "");
    setMessage("");
  }, [saved, sessionId]);

  if (!session) return <NotFoundPage />;
  const milestone = rebootMilestones.find((candidate) => candidate.id === session.milestoneId)!;
  const resources = session.resourceIds.map((resourceId) =>
    rebootResources.find((resource) => resource.id === resourceId)
  ).filter((resource): resource is (typeof rebootResources)[number] => Boolean(resource));
  const proof = isProofSession(session);
  const skipAllowed = draft.diagnosticScore !== null
    && canSkipAfterDiagnostic(session, draft.diagnosticScore);
  const previous = rebootSessions[session.sequence - 2];
  const next = rebootSessions[session.sequence];

  const save = () => {
    const evidenceReferences = evidenceText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const status = draft.status === "skipped-diagnostic" && !skipAllowed
      ? "in-progress"
      : draft.status;
    const nextRecord: LearningRecord = {
      ...draft,
      status,
      evidenceReferences,
      completedAt: status === "done" || status === "skipped-diagnostic"
        ? (draft.completedAt ?? now)
        : null,
      contentVersion: REBOOT_CONTENT_VERSION
    };
    update((state) => ({
      ...state,
      curriculumRecords: { ...state.curriculumRecords, [session.id]: nextRecord }
    }));
    setDraft(nextRecord);
    setMessage("Local session record saved.");
  };

  const updateStatus = (status: LearningStatus) => {
    if (status === "skipped-diagnostic" && !skipAllowed) return;
    setDraft((current) => ({ ...current, status }));
  };

  return (
    <section className="page session-page">
      <PageHeader
        eyebrow={`${session.id} - ${milestone.id} ${milestone.name}`}
        title={session.topic}
        description={`${session.mode} session - ${session.plannedMinutes} planned min. Short evidence records support progress; they do not independently prove professional competence.`}
        actions={<Link className="btn" to={`/learn/reboot#milestone-${milestone.id}`}>Back to {milestone.id}</Link>}
      />

      <div className="session-layout">
        <main>
          <section className="session-object" aria-labelledby="micro-lesson-heading">
            <p className="eyebrow">Up to {rebootCadence.microLessonMaximumMinutes} min</p>
            <h2 id="micro-lesson-heading">Micro-lesson</h2>
            <p>{session.microLesson}</p>
          </section>
          <section className="session-object session-object--build" aria-labelledby="build-test-heading">
            <p className="eyebrow">About {rebootCadence.buildOrTestMinutes} min</p>
            <h2 id="build-test-heading">Build or test</h2>
            <p>{session.buildOrTest}</p>
          </section>
          <section className="session-object" aria-labelledby="retrieval-heading">
            <p className="eyebrow">{rebootCadence.recallMinutes} min recall, {rebootCadence.evidenceAndCloseMinutes} min close</p>
            <h2 id="retrieval-heading">Retrieval and close</h2>
            <p>{session.retrievalAndClose}</p>
          </section>
          <section className="evidence-requirement" aria-labelledby="evidence-requirement-heading">
            <p className="eyebrow">Required proof</p>
            <h2 id="evidence-requirement-heading">Evidence requirement</h2>
            <p>{session.evidenceRequirement}</p>
            {proof && <p className="inline-message inline-message--neutral"><strong>Mandatory milestone proof.</strong> A diagnostic score cannot skip this {session.mode.toLocaleLowerCase("en-AU")} session.</p>}
          </section>
          <section aria-labelledby="session-resources-heading">
            <h2 id="session-resources-heading">Resources for this session</h2>
            <p>Links open only when you choose them. No background link or runtime request occurs.</p>
            <div className="resource-list">
              {resources.map((resource) => (
                <article key={resource.id}>
                  <div><span className="badge">{resource.id}</span><small>{resource.authority}</small></div>
                  <h3>{resource.name}</h3>
                  <p>{resource.exactUse}</p>
                  <dl><div><dt>Suggested slice</dt><dd>{resource.suggestedSliceMinutes} min</dd></div><div><dt>Workbook check</dt><dd>{resource.linkCheckResult}, {resource.linkCheckDate}</dd></div></dl>
                  <a className="btn" href={resource.originalUrl} target="_blank" rel="noopener noreferrer">Open {resource.provider}</a>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="session-record" aria-labelledby="session-record-heading">
          <p className="eyebrow">Local progress v4</p>
          <h2 id="session-record-heading">Record the attempt</h2>
          <label>
            <span>Completion state</span>
            <select value={draft.status} onChange={(event) => updateStatus(event.target.value as LearningStatus)}>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
              <option value="skipped-diagnostic" disabled={!skipAllowed}>Skipped after diagnostic</option>
            </select>
          </label>
          <label>
            <span>Diagnostic score, 0 to 4</span>
            <select
              value={draft.diagnosticScore ?? ""}
              onChange={(event) => {
                const diagnosticScore = event.target.value === "" ? null : Number(event.target.value);
                setDraft((current) => ({
                  ...current,
                  diagnosticScore,
                  status: current.status === "skipped-diagnostic"
                    && (diagnosticScore === null || !canSkipAfterDiagnostic(session, diagnosticScore))
                    ? "in-progress"
                    : current.status
                }));
              }}
            >
              <option value="">Not scored</option>
              {[0, 1, 2, 3, 4].map((score) => <option value={score} key={score}>{score}</option>)}
            </select>
            <small>A score of 3 or 4 permits lesson skips. Proof remains mandatory.</small>
          </label>
          <label>
            <span>Confidence, 1 to 5</span>
            <select
              value={draft.confidence ?? ""}
              onChange={(event) => setDraft((current) => ({
                ...current,
                confidence: event.target.value === "" ? null : Number(event.target.value)
              }))}
            >
              <option value="">Not reported</option>
              {[1, 2, 3, 4, 5].map((score) => <option value={score} key={score}>{score}</option>)}
            </select>
            <small>Confidence is self-reported and is never shown as proven mastery.</small>
          </label>
          <label><span>Actual minutes</span><input type="number" min={0} max={100000} step={1} value={draft.actualMinutes} onChange={(event) => setDraft((current) => ({ ...current, actualMinutes: Number(event.target.value) }))} /></label>
          <label><span>Attempt count</span><input type="number" min={0} max={10000} step={1} value={draft.attemptCount} onChange={(event) => setDraft((current) => ({ ...current, attemptCount: Number(event.target.value) }))} /></label>
          <label>
            <span>Gate result</span>
            <select value={draft.gateResult} onChange={(event) => setDraft((current) => ({ ...current, gateResult: event.target.value as MasteryGateResult }))}>
              <option value="not-assessed">Not assessed</option>
              <option value="passed">Passed against stated gate</option>
              <option value="study-required">Study required</option>
            </select>
          </label>
          <label><span>Exact blocker, separate from completion</span><textarea rows={3} value={draft.blocker ?? ""} onChange={(event) => setDraft((current) => ({ ...current, blocker: event.target.value || null }))} placeholder="After 10 blocked min, record the exact blocker and smallest useful test." /></label>
          <label><span>Evidence references, one per line</span><textarea rows={4} value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} placeholder="Local path, report ID, test result or safe URL" /></label>
          <label><span>Notes</span><textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
          <button className="primary" type="button" onClick={save}>Save local record</button>
          {message && <p role="status" className="inline-message inline-message--success">{message}</p>}
          <p className="muted">Saved content version: {draft.contentVersion}</p>
        </aside>
      </div>

      <nav className="session-pagination" aria-label="Reboot session navigation">
        {previous ? <Link to={`/learn/reboot/sessions/${previous.id}`}>Previous: {previous.id}</Link> : <span />}
        {next ? <Link to={`/learn/reboot/sessions/${next.id}`}>Next: {next.id}</Link> : <Link to="/portfolio/capstone">Open capstone proof</Link>}
      </nav>
    </section>
  );
}
