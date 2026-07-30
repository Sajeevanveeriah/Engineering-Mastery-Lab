import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  AcademyQuestionSet,
  type AcademyQuestionAttempt
} from "../components/academy/AcademyQuestion";
import {
  academySkills,
  academyUnits
} from "../data/academy/catalogue";
import {
  currentAssessmentSessionAttempts,
  firstAttemptQuestionScores
} from "../lib/academy/assessment";
import { DEFAULT_SPACED_REVIEW_HEURISTIC } from "../lib/academy/mastery";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import {
  loadAcademyCourse,
  type LoadedAcademyCourse
} from "../lib/academy/curriculum";
import type { AcademyQuestion } from "../lib/academy/types";

function uniqueId(prefix: string): string {
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${random}`;
}

export function AcademyReviewPage() {
  const {
    progress,
    recordAssessmentAttempt,
    recordQuestionAttempt,
    recordSkillEvidence,
    setReviewState
  } = useProgress();
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [loadedCourse, setLoadedCourse] = useState<LoadedAcademyCourse | null | undefined>(undefined);
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);
  const [reviewProgress, setReviewProgress] = useState({ attempted: 0, total: 0, scorePercent: 0 });
  const [reviewStartedAt, setReviewStartedAt] = useState(() => new Date().toISOString());
  const [result, setResult] = useState<{ score: number; state: string } | null>(null);
  const [error, setError] = useState("");
  const selectedSkill = academySkills.find((skill) => skill.id === selectedSkillId);

  const reviewRows = useMemo(() => academySkills
    .map((skill) => {
      const mastery = progress.academy.skillRecords[skill.id];
      const storedReview = progress.academy.reviewStates[`REVIEW-${skill.id}`];
      const dueAt = mastery?.reviewDueAt ?? storedReview?.dueAt ?? null;
      if (!mastery || !dueAt) return null;
      const due = mastery.mastery === "review-due" || Date.parse(dueAt) <= Date.now();
      return { skill, mastery, storedReview, dueAt, due };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((left, right) => {
      if (left.due !== right.due) return left.due ? -1 : 1;
      return Date.parse(left.dueAt) - Date.parse(right.dueAt);
    }), [progress.academy.reviewStates, progress.academy.skillRecords]);

  useEffect(() => {
    let cancelled = false;
    setLoadedCourse(undefined);
    setQuestions([]);
    setReviewProgress({ attempted: 0, total: 0, scorePercent: 0 });
    setResult(null);
    setError("");
    setReviewStartedAt(new Date().toISOString());
    if (!selectedSkill) {
      setLoadedCourse(null);
      return () => {
        cancelled = true;
      };
    }
    const unit = academyUnits.find((candidate) => selectedSkill.unitIds.includes(candidate.id));
    if (!unit) {
      setLoadedCourse(null);
      setError("The review skill does not resolve to an academy unit.");
      return () => {
        cancelled = true;
      };
    }
    void loadAcademyCourse(unit.courseId)
      .then((course) => {
        if (cancelled) return;
        setLoadedCourse(course);
        if (!course) {
          setError("The review course could not be loaded.");
          return;
        }
        const lessonSet = new Set(selectedSkill.lessonIds);
        const selectedLessons = course.lessons.filter((lesson) => lessonSet.has(lesson.id));
        const candidates = selectedLessons.flatMap((lesson, index) => {
          const questionIndex = index % Math.max(1, lesson.questions.length);
          return lesson.questions[questionIndex] ? [lesson.questions[questionIndex]] : [];
        });
        setQuestions(candidates.slice(0, 5));
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoadedCourse(null);
        setError(caught instanceof Error ? caught.message : "The review could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSkill]);

  const reviewAssessmentId = selectedSkill ? `REVIEW-${selectedSkill.id}` : "";
  const attempts = reviewAssessmentId
    ? progress.academy.assessmentAttempts[reviewAssessmentId] ?? []
    : [];
  const initialScores = firstAttemptQuestionScores(
    currentAssessmentSessionAttempts(attempts),
    questions.map((question) => question.id)
  );

  const handleQuestionAttempt = useCallback((attempt: AcademyQuestionAttempt) => {
    if (!reviewAssessmentId) return;
    const attemptId = uniqueId("ATTEMPT");
    recordAssessmentAttempt({
      attemptId,
      assessmentId: reviewAssessmentId,
      responseSummary: { [attempt.question.id]: attempt.attempt.responseSummary },
      scorePercent: attempt.grade.scorePercent,
      hintsUsed: attempt.hintIds,
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: attempt.attempt.attemptedAt,
      submittedAt: new Date().toISOString()
    });
    recordQuestionAttempt({
      attemptId,
      contextId: reviewAssessmentId,
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
  }, [
    recordAssessmentAttempt,
    recordQuestionAttempt,
    reviewAssessmentId
  ]);

  const handleProgress = useCallback((next: typeof reviewProgress) => {
    setReviewProgress(next);
  }, []);

  const finishReview = () => {
    if (
      !selectedSkill
      || !reviewAssessmentId
      || questions.length === 0
      || reviewProgress.attempted !== questions.length
    ) return;
    const timestamp = new Date().toISOString();
    recordAssessmentAttempt({
      attemptId: uniqueId("RESULT"),
      assessmentId: reviewAssessmentId,
      responseSummary: {
        RESULT: `${reviewProgress.scorePercent}% across ${questions.length} retrieval questions`
      },
      scorePercent: reviewProgress.scorePercent,
      hintsUsed: [],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: reviewStartedAt,
      submittedAt: timestamp
    });

    try {
      const plan = planAcademyMasteryEvidence(
        progress.academy,
        selectedSkill,
        {
          evidenceId: uniqueId("EV"),
          kind: "delayed-review",
          referenceId: reviewAssessmentId,
          scorePercent: reviewProgress.scorePercent,
          summary: `${selectedSkill.title} delayed review recorded at ${reviewProgress.scorePercent}%.`,
          recordedAt: timestamp
        },
        timestamp
      );
      recordSkillEvidence(plan);
      const existing = progress.academy.reviewStates[reviewAssessmentId];
      setReviewState({
        reviewId: reviewAssessmentId,
        targetType: "skill",
        targetId: selectedSkill.id,
        state: "completed",
        dueAt: existing?.dueAt ?? timestamp,
        lastReviewedAt: timestamp,
        updatedAt: timestamp
      });
      setResult({ score: reviewProgress.scorePercent, state: plan.nextMastery });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The review evidence could not be recorded.");
    }
  };

  return (
    <section className="page academy-review-page">
      <PageHeader
        eyebrow="Retrieval and retained mastery"
        title="Review queue"
        description="Reconstruct important ideas after a delay, receive feedback, and update mastery from evidence. Review timing is a configurable heuristic, not a scientifically perfect memory model."
      />

      <section className="academy-review-explanation">
        <h2>How this queue works</h2>
        <p>{DEFAULT_SPACED_REVIEW_HEURISTIC.description}</p>
        <div aria-label="Review cycle">
          <span>Proficient evidence</span><b>to</b><span>Scheduled delay</span><b>to</b>
          <span>Retrieval attempt</span><b>to</b><span>Retained or revised mastery</span>
        </div>
      </section>

      <section className="academy-review-list" aria-labelledby="academy-review-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{reviewRows.filter((row) => row.due).length} due now</p>
            <h2 id="academy-review-list-heading">Skill reviews</h2>
          </div>
        </div>
        {reviewRows.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews are scheduled yet</h3>
            <p>Complete guided practice plus independent assessments to earn proficiency and schedule retrieval.</p>
            <Link className="btn" to="/learn/courses">Open the academy</Link>
          </div>
        ) : (
          <ul>
            {reviewRows.map(({ skill, mastery, dueAt, due }) => (
              <li key={skill.id}>
                <div>
                  <span className={`badge ${due ? "warning" : ""}`}>{due ? "Due" : "Scheduled"}</span>
                  <h3>{skill.title}</h3>
                  <p>{skill.description}</p>
                  <small>Current state: {mastery.mastery}. Review: {new Date(dueAt).toLocaleString("en-AU")}.</small>
                </div>
                <button
                  className="btn secondary"
                  type="button"
                  disabled={!due}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  {due ? "Start review" : "Not due yet"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedSkill && (
        <section className="academy-review-workspace" aria-labelledby="academy-review-workspace-heading">
          <div>
            <p className="eyebrow">Delayed retrieval</p>
            <h2 id="academy-review-workspace-heading">{selectedSkill.title}</h2>
          </div>
          {error && <p role="alert" className="academy-action-error">{error}</p>}
          {loadedCourse === undefined && <p role="status">Loading review questions...</p>}
          {loadedCourse && questions.length > 0 && (
            <>
              <AcademyQuestionSet
                identity={reviewAssessmentId}
                title={`${selectedSkill.title} retrieval review`}
                questions={questions}
                requiredScorePercent={90}
                initialScores={initialScores}
                attemptHistory={progress.academy.questionAttempts}
                scorePolicy="first-attempt"
                onAttempt={handleQuestionAttempt}
                onPassed={() => setError("")}
                onProgress={handleProgress}
              />
              <div className="academy-assessment-submit">
                <div>
                  <strong>{reviewProgress.scorePercent}% first-attempt review score</strong>
                  <span>{reviewProgress.attempted}/{reviewProgress.total} questions answered</span>
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={
                    reviewProgress.attempted !== questions.length
                    || result !== null
                  }
                  onClick={finishReview}
                >
                  Record delayed review
                </button>
              </div>
            </>
          )}
          {result && (
            <div className="academy-assessment-result" role="status">
              <h3>Review recorded</h3>
              <p>Score: {result.score}%. Updated mastery state: {result.state}.</p>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
