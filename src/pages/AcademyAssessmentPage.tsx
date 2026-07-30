import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  AcademyQuestionSet,
  type AcademyQuestionAttempt
} from "../components/academy/AcademyQuestion";
import {
  academyCourses,
  academySkills,
  academyUnits
} from "../data/academy/catalogue";
import {
  academyCourseRoute,
  academyUnitRoute
} from "../lib/academy/navigation";
import {
  bestCompletedAssessmentScore,
  currentAssessmentSessionAttempts,
  firstAttemptQuestionScores
} from "../lib/academy/assessment";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import {
  loadAcademyCourse,
  type LoadedAcademyCourse
} from "../lib/academy/curriculum";
import type { AssessmentSpec } from "../lib/academy/types";

interface AcademyAssessmentPageProps {
  scope: "unit" | "course";
}

function uniqueId(prefix: string): string {
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${random}`;
}

export function AcademyAssessmentPage({ scope }: AcademyAssessmentPageProps) {
  const { courseId = "", unitId = "", assessmentKind = "" } = useParams();
  const {
    progress,
    recordAssessmentAttempt,
    recordQuestionAttempt,
    recordSkillEvidence,
    setReviewState
  } = useProgress();
  const [loadedCourse, setLoadedCourse] = useState<LoadedAcademyCourse | null | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState({
    attempted: 0,
    total: 0,
    scorePercent: 0
  });
  const [assessmentStartedAt, setAssessmentStartedAt] = useState(() => new Date().toISOString());
  const [assessmentSession, setAssessmentSession] = useState(0);

  const course = academyCourses.find((candidate) => candidate.id === courseId);
  const unit = academyUnits.find((candidate) => candidate.id === unitId && candidate.courseId === courseId);
  let assessment: AssessmentSpec | null = null;
  if (course && scope === "course") {
    assessment = course.challenge;
  } else if (unit && scope === "unit") {
    assessment = assessmentKind === "quiz"
      ? unit.quiz
      : assessmentKind === "test"
        ? unit.unitTest
        : null;
  }
  const assessmentId = assessment?.id ?? "";

  useEffect(() => {
    let cancelled = false;
    setLoadedCourse(undefined);
    setLoadError("");
    setActionError("");
    setSubmittedScore(null);
    setAssessmentProgress({ attempted: 0, total: 0, scorePercent: 0 });
    setAssessmentStartedAt(new Date().toISOString());
    setAssessmentSession(0);
    if (!course) {
      setLoadedCourse(null);
      return () => {
        cancelled = true;
      };
    }
    void loadAcademyCourse(course.id)
      .then((value) => {
        if (cancelled) return;
        setLoadedCourse(value);
        if (!value) setLoadError("The selected course content could not be loaded.");
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoadedCourse(null);
        setLoadError(caught instanceof Error ? caught.message : "The assessment could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId, course]);

  const questions = useMemo(() => {
    if (!loadedCourse || !assessment) return [];
    const byId = new Map(
      loadedCourse.lessons.flatMap((lesson) => lesson.questions).map((question) => [question.id, question])
    );
    return assessment.questionIds
      .map((questionId) => byId.get(questionId))
      .filter((question): question is NonNullable<typeof question> => question !== undefined);
  }, [assessment, loadedCourse]);

  const attempts = assessment
    ? progress.academy.assessmentAttempts[assessment.id] ?? []
    : [];
  const currentSessionAttempts = currentAssessmentSessionAttempts(attempts);
  const initialScores = assessmentSession === 0
    ? firstAttemptQuestionScores(
        currentSessionAttempts,
        questions.map((question) => question.id)
      )
    : {};
  const bestScore = bestCompletedAssessmentScore(attempts);
  const appliedLessonIds = scope === "unit" && unit
    ? unit.lessonIds
    : loadedCourse?.lessons.map((lesson) => lesson.id) ?? [];
  const appliedEvidenceSatisfied = !assessment?.requiredAppliedEvidence || (
    appliedLessonIds.length > 0
    && appliedLessonIds.every(
      (targetLessonId) =>
        progress.academy.lessonRecords[targetLessonId]?.requirements.appliedEvidenceSatisfied === true
    )
  );

  const scheduleReview = useCallback((
    skillId: string,
    reviewDueAt: string | null,
    timestamp: string
  ) => {
    if (!reviewDueAt) return;
    const reviewId = `REVIEW-${skillId}`;
    const current = progress.academy.reviewStates[reviewId];
    if (current && current.state !== "scheduled") return;
    setReviewState({
      reviewId,
      targetType: "skill",
      targetId: skillId,
      state: "scheduled",
      dueAt: reviewDueAt,
      lastReviewedAt: current?.lastReviewedAt ?? null,
      updatedAt: timestamp
    });
  }, [progress.academy.reviewStates, setReviewState]);

  const handleQuestionAttempt = useCallback((result: AcademyQuestionAttempt) => {
    if (!assessment) return;
    const attemptId = uniqueId("ATTEMPT");
    recordAssessmentAttempt({
      attemptId,
      assessmentId: assessment.id,
      responseSummary: { [result.question.id]: result.attempt.responseSummary },
      scorePercent: result.grade.scorePercent,
      hintsUsed: result.hintIds,
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: result.attempt.attemptedAt,
      submittedAt: new Date().toISOString()
    });
    recordQuestionAttempt({
      attemptId,
      contextId: assessment.id,
      questionId: result.question.id,
      questionType: result.question.type,
      attemptedAt: result.attempt.attemptedAt,
      responseSummary: result.attempt.responseSummary,
      isCorrect: result.grade.isCorrect,
      scorePercent: result.grade.scorePercent,
      misconceptionKeys: result.grade.misconceptionKeys,
      variantSeed: result.presentationVariantSeed,
      retryIndex: result.retryIndex,
      hintsUsed: result.hintIds
    });
  }, [assessment, recordAssessmentAttempt, recordQuestionAttempt]);

  const recordResult = () => {
    if (!assessment || assessmentProgress.attempted !== questions.length || questions.length === 0) return;
    const timestamp = new Date().toISOString();
    const attemptId = uniqueId("RESULT");
    recordAssessmentAttempt({
      attemptId,
      assessmentId: assessment.id,
      responseSummary: {
        RESULT: `${assessmentProgress.scorePercent}% across ${questions.length} questions`
      },
      scorePercent: assessmentProgress.scorePercent,
      hintsUsed: [],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: assessmentStartedAt,
      submittedAt: timestamp
    });

    const skillIds = [...new Set(questions.flatMap((question) => question.skillIds))];
    for (const skillId of skillIds) {
      const skill = academySkills.find((candidate) => candidate.id === skillId);
      if (!skill) continue;
      try {
        const plan = planAcademyMasteryEvidence(
          progress.academy,
          skill,
          {
            evidenceId: uniqueId("EV"),
            kind: "scored-activity",
            referenceId: assessment.id,
            activityId: assessment.id,
            scorePercent: assessmentProgress.scorePercent,
            summary: `${assessment.title} recorded at ${assessmentProgress.scorePercent}%.`,
            recordedAt: timestamp
          },
          timestamp
        );
        recordSkillEvidence(plan);
        scheduleReview(skill.id, plan.reviewDueAt, timestamp);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Mastery evidence could not be recorded.");
      }
    }
    setSubmittedScore(assessmentProgress.scorePercent);
  };

  const handleProgress = useCallback((next: typeof assessmentProgress) => {
    setAssessmentProgress(next);
  }, []);
  const handlePassed = useCallback(() => {
    setActionError("");
  }, []);
  const startAnotherAttempt = () => {
    setAssessmentSession((current) => current + 1);
    setSubmittedScore(null);
    setAssessmentProgress({
      attempted: 0,
      total: questions.length,
      scorePercent: 0
    });
    setAssessmentStartedAt(new Date().toISOString());
    setActionError("");
  };

  if (loadedCourse === undefined) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy assessment"
          title="Loading assessment"
          description="Loading the complete local question set for this course stage."
        />
        <p role="status">Preparing questions and prior attempts...</p>
      </section>
    );
  }

  if (!course || !assessment || !loadedCourse || questions.length !== assessment.questionIds.length) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy assessment"
          title="Assessment not found"
          description={loadError || "The assessment route or one of its question references is invalid."}
        />
        <Link className="btn" to="/learn/courses">Return to academy</Link>
      </section>
    );
  }

  const scorePass = submittedScore !== null && submittedScore >= assessment.requiredScorePercent;
  const assessmentPass = scorePass && appliedEvidenceSatisfied;
  const backRoute = scope === "unit" && unit
    ? academyUnitRoute(course.id, unit.id)
    : academyCourseRoute(course.id);

  return (
    <section className="page academy-assessment-page">
      <nav className="academy-breadcrumbs" aria-label="Academy breadcrumb">
        <Link to="/learn/courses">Academy</Link><span aria-hidden="true">/</span>
        <Link to={academyCourseRoute(course.id)}>{course.stage}</Link><span aria-hidden="true">/</span>
        {unit && <><Link to={academyUnitRoute(course.id, unit.id)}>{unit.id}</Link><span aria-hidden="true">/</span></>}
        <span>Assessment</span>
      </nav>
      <PageHeader
        eyebrow={assessment.kind.replaceAll("-", " ")}
        title={assessment.title}
        description={`Submit every question, then record the complete first-attempt result. The score target is ${assessment.requiredScorePercent}%. Feedback and solutions remain available for deliberate learning retries.`}
      />

      <section className="academy-assessment-summary">
        <dl>
          <div><dt>Questions</dt><dd>{questions.length}</dd></div>
          <div><dt>Required score</dt><dd>{assessment.requiredScorePercent}%</dd></div>
          <div><dt>Best recorded</dt><dd>{bestScore === null ? "Not attempted" : `${bestScore}%`}</dd></div>
          <div><dt>Applied evidence</dt><dd>{appliedEvidenceSatisfied ? "Satisfied" : "Still required"}</dd></div>
        </dl>
        {!appliedEvidenceSatisfied && (
          <p role="status">
            Score evidence can be recorded now, but the mastery gate remains open until the linked
            lesson activities have applied evidence.
          </p>
        )}
      </section>

      <details className="academy-attempt-history">
        <summary>Durable attempt history ({attempts.length} records)</summary>
        {attempts.length === 0 ? (
          <p>No assessment response has been recorded on this device.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Submitted</th>
                  <th scope="col">Record</th>
                  <th scope="col">Score</th>
                  <th scope="col">Hints</th>
                  <th scope="col">Response summary</th>
                </tr>
              </thead>
              <tbody>
                {[...attempts].reverse().map((attempt) => {
                  const aggregate = Object.prototype.hasOwnProperty.call(
                    attempt.responseSummary,
                    "RESULT"
                  );
                  return (
                    <tr key={attempt.attemptId}>
                      <td>{new Date(attempt.submittedAt).toLocaleString("en-AU")}</td>
                      <td>{aggregate ? "Complete result" : "Question response"}</td>
                      <td>{attempt.scorePercent}%</td>
                      <td>{attempt.hintsUsed.length}</td>
                      <td>{Object.values(attempt.responseSummary).join("; ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </details>

      {actionError && <p className="academy-action-error" role="alert">{actionError}</p>}

      <AcademyQuestionSet
        identity={`${assessment.id}:session:${assessmentSession}`}
        title={assessment.title}
        questions={questions}
        headingLevel={2}
        requiredScorePercent={assessment.requiredScorePercent}
        initialScores={initialScores}
        attemptHistory={progress.academy.questionAttempts}
        scorePolicy="first-attempt"
        onAttempt={handleQuestionAttempt}
        onPassed={handlePassed}
        onProgress={handleProgress}
      />

      <section className="academy-assessment-submit">
        <div>
          <strong>{assessmentProgress.scorePercent}% first-attempt aggregate</strong>
          <span>{assessmentProgress.attempted}/{assessmentProgress.total} questions answered</span>
        </div>
        <button
          className="btn"
          type="button"
          disabled={
            assessmentProgress.attempted !== questions.length
            || submittedScore !== null
          }
          onClick={recordResult}
        >
          Record assessment result
        </button>
      </section>

      {submittedScore !== null && (
        <section
          className={`academy-assessment-result ${assessmentPass ? "academy-assessment-result--pass" : ""}`}
          role="status"
        >
          <h2>{assessmentPass ? "Assessment gate passed" : scorePass ? "Score passed, applied evidence pending" : "Keep practising"}</h2>
          <p>
            Recorded score: {submittedScore}%. Required score: {assessment.requiredScorePercent}%.
            {assessmentPass
              ? " The scored and applied conditions are both satisfied."
              : scorePass
                ? " Return to the linked lesson activities and record the applied result."
                : " Use the feedback, revisit the relevant lesson blocks and submit another attempt."}
          </p>
          <button
            className="btn secondary"
            type="button"
            onClick={startAnotherAttempt}
          >
            Start another assessment attempt
          </button>
        </section>
      )}

      <Link className="btn secondary" to={backRoute}>Return to {scope === "unit" ? "unit" : "course"}</Link>
    </section>
  );
}
