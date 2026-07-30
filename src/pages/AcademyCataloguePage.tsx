import { Link } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academyUnits
} from "../data/academy/catalogue";
import {
  academyCourseProgressCounts,
  academyCourseRoute,
  bestAssessmentScore
} from "../lib/academy/navigation";

export function AcademyCataloguePage() {
  const { progress } = useProgress();
  const resume = progress.academy.resumeCursor;
  const now = Date.now();
  const dueReviewSkillIds = new Set(
    Object.values(progress.academy.skillRecords)
      .filter((record) => (
        record.mastery === "review-due"
        || (record.reviewDueAt !== null && Date.parse(record.reviewDueAt) <= now)
      ))
      .map((record) => record.skillId)
  );
  for (const review of Object.values(progress.academy.reviewStates)) {
    if (
      review.state === "due"
      || (review.state === "scheduled" && Date.parse(review.dueAt) <= now)
    ) {
      dueReviewSkillIds.add(review.targetId);
    }
  }
  const dueReviews = dueReviewSkillIds.size;
  const completedCourseIds = new Set(
    academyCourses
      .filter((course) => {
        const counts = academyCourseProgressCounts(progress.academy, course, academyUnits);
        const challengeScore = bestAssessmentScore(progress.academy, course.challenge.id);
        return (
          counts.completed === counts.total
          && challengeScore !== null
          && challengeScore >= course.challenge.requiredScorePercent
        );
      })
      .map((course) => course.id)
  );
  const recommendedCourseId = academyCourses.find((course) => (
    !completedCourseIds.has(course.id)
    && course.prerequisiteCourseIds.every((courseId) => completedCourseIds.has(courseId))
  ))?.id;

  return (
    <section className="page academy-catalogue-page">
      <PageHeader
        eyebrow="Self-contained beginner academy"
        title="Engineering Academy"
        description="Learn engineering inside the app through complete lessons, worked examples, guided practice, laboratories, assessments and scheduled review. External media is optional context, never the lesson."
      />

      {resume && (
        <section className="academy-resume-card" aria-labelledby="academy-resume-heading">
          <div>
            <p className="eyebrow">Exact resume point</p>
            <h2 id="academy-resume-heading">Continue where you stopped</h2>
            <p>
              Resume lesson {resume.lessonId} at the last recorded teaching block. Your notes,
              attempts and progress remain local to this device.
            </p>
          </div>
          <Link className="btn" to={`${resume.route}?resume=${encodeURIComponent(resume.blockId)}`}>
            Resume exact position
          </Link>
        </section>
      )}

      <section className="academy-learning-loop" aria-labelledby="academy-loop-heading">
        <div>
          <p className="eyebrow">The learning behaviour</p>
          <h2 id="academy-loop-heading">Understand, practise, apply, prove, review</h2>
          <p>
            Each unit moves from beginner explanation to checked engineering evidence. Mastery is
            earned by performance and retained through review, not by page visits.
          </p>
        </div>
        <ol aria-label="Academy mastery loop">
          <li><span>1</span><strong>Learn</strong><small>Native teaching and accessible mathematics</small></li>
          <li><span>2</span><strong>Practise</strong><small>Hints, feedback and worked solutions</small></li>
          <li><span>3</span><strong>Apply</strong><small>Laboratories, tools and projects</small></li>
          <li><span>4</span><strong>Prove</strong><small>Quizzes, tests and course challenges</small></li>
          <li><span>5</span><strong>Review</strong><small>Retrieval when evidence becomes due</small></li>
        </ol>
      </section>

      <div className="academy-catalogue-toolbar">
        <div>
          <strong>5 courses</strong>
          <span>25 units</span>
          <span>175 complete lessons</span>
        </div>
        <Link className="btn secondary" to="/learn/review">
          Review queue {dueReviews > 0 ? `(${dueReviews} due)` : ""}
        </Link>
      </div>

      <section className="academy-course-grid" aria-label="Academy courses">
        {academyCourses.map((course) => {
          const counts = academyCourseProgressCounts(progress.academy, course, academyUnits);
          const missingPrerequisites = course.prerequisiteCourseIds.filter(
            (courseId) => !completedCourseIds.has(courseId)
          );
          const courseState = completedCourseIds.has(course.id)
            ? "Complete"
            : missingPrerequisites.length > 0
              ? "Locked"
              : course.id === recommendedCourseId
                ? "Recommended"
                : "Available";
          return (
            <article key={course.id} className="academy-course-card">
              <div className="academy-course-card__topline">
                <span className="badge">{course.stage}</span>
                <span className={`badge ${courseState === "Complete" ? "success" : ""}`}>
                  {courseState}
                </span>
                <span>{course.unitIds.length} units</span>
              </div>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <ul>{course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
              <div className="academy-progress-line">
                <div>
                  <strong>{counts.percent}%</strong>
                  <span>{counts.completed}/{counts.total} lessons complete</span>
                </div>
                <progress value={counts.percent} max={100}>{counts.percent}%</progress>
              </div>
              <Link className="btn" to={academyCourseRoute(course.id)}>
                {courseState === "Locked"
                  ? "Preview course and prerequisites"
                  : counts.started > 0
                    ? "Continue course"
                    : "Open course"}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="academy-legacy-bridge" aria-labelledby="academy-reboot-bridge-heading">
        <div>
          <p className="eyebrow">Existing curriculum preserved</p>
          <h2 id="academy-reboot-bridge-heading">E0-E4 and S001-S110 now point into one learning system</h2>
          <p>
            The original mastery modules, accelerated reboot sessions, laboratories, rover
            releases and tools remain available. Their activity mappings now lead to internal
            lessons, assessments, review skills and applied evidence.
          </p>
        </div>
        <div>
          <Link className="btn secondary" to="/learn/roadmap">View E0-E4 coverage</Link>
          <Link className="btn secondary" to="/learn/reboot">View S001-S110 mappings</Link>
        </div>
      </section>
    </section>
  );
}
