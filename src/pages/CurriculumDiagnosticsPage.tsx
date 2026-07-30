import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AcademyQuestionSet,
  type AcademyQuestionAttempt
} from "../components/academy/AcademyQuestion";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { academyRebootMappings } from "../data/academy/rebootMappings";
import { REBOOT_CONTENT_VERSION, rebootDiagnostics, rebootSessions } from "../data/rebootCurriculum";
import { loadAcademyLesson } from "../lib/academy/curriculum";
import type { AcademyQuestion } from "../lib/academy/types";
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
  const {
    progress,
    update,
    recordAssessmentAttempt,
    recordQuestionAttempt
  } = useProgress();
  const [activeMilestoneId, setActiveMilestoneId] = useState("");
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [diagnosticProgress, setDiagnosticProgress] = useState({
    attempted: 0,
    total: 0,
    scorePercent: 0
  });
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const recordScore = (milestoneId: string, score: number) => {
    const id = `DIAG-${milestoneId}`;
    update((state) => ({
      ...state,
      curriculumRecords: {
        ...state.curriculumRecords,
        [id]: diagnosticRecord(score, state.curriculumRecords[id])
      }
    }));
  };

  useEffect(() => {
    let cancelled = false;
    setQuestions([]);
    setLoadError("");
    setResult(null);
    setDiagnosticProgress({ attempted: 0, total: 0, scorePercent: 0 });
    setStartedAt(new Date().toISOString());
    if (!activeMilestoneId) return () => {
      cancelled = true;
    };

    const sessionIds = rebootSessions
      .filter((session) => session.milestoneId === activeMilestoneId)
      .map((session) => session.id);
    const lessonIds = [
      ...new Set(
        academyRebootMappings
          .filter((mapping) => sessionIds.includes(mapping.sessionId))
          .flatMap((mapping) => mapping.lessonIds)
      )
    ];
    setLoading(true);
    void Promise.all(lessonIds.map(loadAcademyLesson))
      .then((lessons) => {
        if (cancelled) return;
        const selectedQuestions = lessons
          .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== null)
          .flatMap((lesson, index) => {
            if (lesson.questions.length === 0) return [];
            return [lesson.questions[index % lesson.questions.length]];
          })
          .slice(0, 4);
        if (selectedQuestions.length !== 4) {
          setLoadError("This diagnostic could not resolve four reviewed Academy questions.");
          return;
        }
        setQuestions(selectedQuestions);
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoadError(
          caught instanceof Error
            ? caught.message
            : "The assessed diagnostic could not be loaded."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMilestoneId]);

  const diagnosticAssessmentId = activeMilestoneId
    ? `ACADEMY-DIAGNOSTIC-${activeMilestoneId}`
    : "";

  const handleQuestionAttempt = (attempt: AcademyQuestionAttempt) => {
    if (!diagnosticAssessmentId) return;
    const submittedAt = new Date().toISOString();
    const attemptId = `ATTEMPT-${crypto.randomUUID()}`;
    recordAssessmentAttempt({
      attemptId,
      assessmentId: diagnosticAssessmentId,
      responseSummary: { [attempt.question.id]: attempt.attempt.responseSummary },
      scorePercent: attempt.grade.scorePercent,
      hintsUsed: attempt.hintIds,
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: attempt.attempt.attemptedAt,
      submittedAt
    });
    recordQuestionAttempt({
      attemptId,
      contextId: diagnosticAssessmentId,
      questionId: attempt.question.id,
      questionType: attempt.question.type,
      attemptedAt: attempt.attempt.attemptedAt,
      responseSummary: attempt.attempt.responseSummary,
      isCorrect: attempt.grade.isCorrect,
      scorePercent: attempt.grade.scorePercent,
      misconceptionKeys: attempt.grade.misconceptionKeys,
      variantSeed: attempt.presentationVariantSeed,
      retryIndex: attempt.retryIndex,
      hintsUsed: attempt.hintIds
    });
  };

  const finishDiagnostic = () => {
    if (
      !activeMilestoneId
      || !diagnosticAssessmentId
      || questions.length !== 4
      || diagnosticProgress.attempted !== 4
    ) return;
    const submittedAt = new Date().toISOString();
    const score = Math.round(diagnosticProgress.scorePercent / 25);
    recordAssessmentAttempt({
      attemptId: `RESULT-${crypto.randomUUID()}`,
      assessmentId: diagnosticAssessmentId,
      responseSummary: {
        RESULT: `${score}/4 from four first-attempt Academy diagnostic questions`
      },
      scorePercent: diagnosticProgress.scorePercent,
      hintsUsed: [],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt,
      submittedAt
    });
    recordScore(activeMilestoneId, score);
    setResult({ score, passed: score >= 3 });
  };

  return (
    <section className="page diagnostics-curriculum-page">
      <PageHeader
        eyebrow="Ten practical recheck points"
        title="Curriculum diagnostics"
        description="Answer four deterministic Academy questions for a milestone, then use the evidence to decide whether familiar instruction may be skipped. Scores 3 and 4 may skip lesson sessions; every practical proof or release remains mandatory."
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
              <button
                className="btn secondary"
                type="button"
                onClick={() => setActiveMilestoneId(diagnostic.milestoneId)}
              >
                {score === null ? "Start assessed diagnostic" : "Retake assessed diagnostic"}
              </button>
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

      {activeMilestoneId && (
        <section
          className="academy-review-workspace"
          aria-labelledby="academy-diagnostic-workspace-heading"
        >
          <div>
            <p className="eyebrow">Automatically scored diagnostic</p>
            <h2 id="academy-diagnostic-workspace-heading">
              {activeMilestoneId} knowledge diagnostic
            </h2>
            <p>
              Four first-attempt questions produce a score from 0 to 4. Hints and solutions
              teach after an attempt; this diagnostic never awards laboratory or project proof.
            </p>
          </div>
          {loading && <p role="status">Loading reviewed Academy questions...</p>}
          {loadError && <p role="alert" className="academy-action-error">{loadError}</p>}
          {questions.length === 4 && (
            <>
              <AcademyQuestionSet
                identity={diagnosticAssessmentId}
                title={`${activeMilestoneId} diagnostic questions`}
                questions={questions}
                requiredScorePercent={75}
                initialScores={{}}
                attemptHistory={progress.academy.questionAttempts}
                scorePolicy="first-attempt"
                onAttempt={handleQuestionAttempt}
                onPassed={() => undefined}
                onProgress={setDiagnosticProgress}
              />
              <div className="academy-assessment-submit">
                <div>
                  <strong>
                    {diagnosticProgress.attempted}/4 answered,{" "}
                    {diagnosticProgress.scorePercent}% first-attempt score
                  </strong>
                  <span>No practical mastery is awarded by this result.</span>
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={diagnosticProgress.attempted !== 4 || result !== null}
                  onClick={finishDiagnostic}
                >
                  Record diagnostic result
                </button>
              </div>
            </>
          )}
          {result && (
            <div className="academy-assessment-result" role="status">
              <h3>{result.passed ? "Diagnostic pass recorded" : "Study recommendation recorded"}</h3>
              <p>
                Score: {result.score}/4.{" "}
                {result.passed
                  ? "Familiar lesson sessions may be skipped, but mandatory proof remains."
                  : "Complete the mapped lessons, then return for a new first-attempt diagnostic."}
              </p>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
