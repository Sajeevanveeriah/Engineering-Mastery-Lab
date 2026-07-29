import { Link } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { REBOOT_CONTENT_VERSION, rebootDiagnostics, rebootSessions } from "../data/rebootCurriculum";
import type { LearningRecord } from "../lib/storage";

function diagnosticRecord(score: number | null, previous?: LearningRecord): LearningRecord {
  return {
    status: score === null ? "not-started" : "done",
    blocker: previous?.blocker ?? null,
    confidence: previous?.confidence ?? null,
    actualMinutes: previous?.actualMinutes ?? 0,
    notes: previous?.notes ?? "",
    evidenceReferences: previous?.evidenceReferences ?? [],
    attemptCount: score === null ? (previous?.attemptCount ?? 0) : (previous?.attemptCount ?? 0) + 1,
    diagnosticScore: score,
    gateResult: score === null ? "not-assessed" : score >= 3 ? "passed" : "study-required",
    completedAt: score === null ? null : new Date().toISOString(),
    contentVersion: REBOOT_CONTENT_VERSION
  };
}

export function CurriculumDiagnosticsPage() {
  const { progress, update } = useProgress();

  const setScore = (milestoneId: string, score: number | null) => {
    const id = `DIAG-${milestoneId}`;
    update((state) => ({
      ...state,
      curriculumRecords: {
        ...state.curriculumRecords,
        [id]: diagnosticRecord(score, state.curriculumRecords[id])
      }
    }));
  };

  return (
    <section className="page diagnostics-curriculum-page">
      <PageHeader
        eyebrow="Ten practical recheck points"
        title="Curriculum diagnostics"
        description="Use a practical task to decide whether lesson sessions need study. Scores 3 and 4 may skip lesson sessions; every milestone proof or release session remains mandatory."
        actions={<Link className="btn" to="/learn/reboot">Back to reboot roadmap</Link>}
      />

      <div className="diagnostic-grid">
        {rebootDiagnostics.map((diagnostic) => {
          const id = `DIAG-${diagnostic.milestoneId}`;
          const record = progress.curriculumRecords[id];
          const score = record?.diagnosticScore ?? null;
          const proof = rebootSessions.find((session) =>
            session.milestoneId === diagnostic.milestoneId
            && (session.mode === "Proof" || session.mode === "Release")
          );
          const passed = score !== null && score >= 3;
          return (
            <article key={diagnostic.milestoneId} className={score === null ? "" : passed ? "diagnostic-card--pass" : "diagnostic-card--study"}>
              <div><span className="badge">{diagnostic.milestoneId}</span><span className="status-badge">{score === null ? "Not scored" : passed ? "Diagnostic pass" : "Study required"}</span></div>
              <h2>{diagnostic.task}</h2>
              <dl>
                <div><dt>Pass evidence</dt><dd>{diagnostic.passEvidence}</dd></div>
                <div><dt>If below 3</dt><dd>{diagnostic.ifBelowThree}</dd></div>
                <div><dt>Recheck</dt><dd>{diagnostic.recheck}</dd></div>
                <div><dt>Mandatory proof</dt><dd>{proof ? `${proof.id} - ${proof.topic}` : "Milestone proof remains required"}</dd></div>
              </dl>
              <label>
                <span>Practical diagnostic score</span>
                <select value={score ?? ""} onChange={(event) => setScore(diagnostic.milestoneId, event.target.value === "" ? null : Number(event.target.value))}>
                  <option value="">Not scored</option>
                  {[0, 1, 2, 3, 4].map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </label>
              {score !== null && (
                <p role="status">{passed
                  ? "Lesson sessions in this milestone may be marked Skipped after diagnostic. Complete the proof session."
                  : "Complete the milestone sessions in order, retain evidence and recheck at the stated point."}</p>
              )}
              {proof && <Link to={`/learn/reboot/sessions/${proof.id}`}>Open mandatory proof {proof.id}</Link>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
