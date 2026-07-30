import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academyUnits
} from "../data/academy/catalogue";
import {
  academyCourseChallengeRoute,
  academyCourseProgressCounts,
  academyCourseRoute,
  academyLessonRoute,
  academyUnitProgressCounts,
  academyUnitRoute,
  bestAssessmentScore
} from "../lib/academy/navigation";

export function AcademyCoursePage() {
  const { courseId = "" } = useParams();
  const { progress } = useProgress();
  const course = academyCourses.find((candidate) => candidate.id === courseId);

  if (!course) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy course"
          title="Course not found"
          description="The requested course identifier does not exist in the reviewed academy catalogue."
        />
        <Link className="btn" to="/learn/courses">Return to academy</Link>
      </section>
    );
  }

  const units = course.unitIds
    .map((unitId) => academyUnits.find((unit) => unit.id === unitId))
    .filter((unit): unit is (typeof academyUnits)[number] => unit !== undefined);
  const counts = academyCourseProgressCounts(progress.academy, course, academyUnits);
  const prerequisiteCourses = course.prerequisiteCourseIds
    .map((prerequisiteId) =>
      academyCourses.find((candidate) => candidate.id === prerequisiteId)
    )
    .filter((candidate): candidate is (typeof academyCourses)[number] => candidate !== undefined)
    .map((prerequisite) => {
      const prerequisiteCounts = academyCourseProgressCounts(
        progress.academy,
        prerequisite,
        academyUnits
      );
      const prerequisiteChallenge = bestAssessmentScore(
        progress.academy,
        prerequisite.challenge.id
      );
      const complete = (
        prerequisiteCounts.completed === prerequisiteCounts.total
        && prerequisiteChallenge !== null
        && prerequisiteChallenge >= prerequisite.challenge.requiredScorePercent
      );
      return { course: prerequisite, complete };
    });
  const courseAvailable = prerequisiteCourses.every((item) => item.complete);
  const firstIncomplete = units
    .flatMap((unit) => unit.lessonIds.map((lessonId) => ({ unit, lessonId })))
    .find(({ lessonId }) => !progress.academy.lessonRecords[lessonId]?.completionEarned);
  const challengeScore = bestAssessmentScore(progress.academy, course.challenge.id);

  return (
    <section className="page academy-course-page">
      <nav className="academy-breadcrumbs" aria-label="Academy breadcrumb">
        <Link to="/learn/courses">Academy</Link><span aria-hidden="true">/</span><span>{course.stage}</span>
      </nav>
      <PageHeader
        eyebrow={`${course.stage} course - ${courseAvailable ? "available" : "prerequisites required"}`}
        title={course.title}
        description={course.description}
      />

      <section className="academy-course-overview">
        <div className="academy-progress-line">
          <div>
            <strong>{counts.percent}%</strong>
            <span>{counts.completed}/{counts.total} lessons complete</span>
          </div>
          <progress value={counts.percent} max={100}>{counts.percent}%</progress>
        </div>
        <dl>
          <div><dt>Units</dt><dd>{units.length}</dd></div>
          <div><dt>Lesson time</dt><dd>{course.estimatedMinutes} min planned</dd></div>
          <div><dt>Challenge target</dt><dd>{course.challenge.requiredScorePercent}%</dd></div>
          <div><dt>Best challenge</dt><dd>{challengeScore === null ? "Not attempted" : `${challengeScore}%`}</dd></div>
        </dl>
        {firstIncomplete && courseAvailable && (
          <Link
            className="btn"
            to={academyLessonRoute(course.id, firstIncomplete.unit.id, firstIncomplete.lessonId)}
          >
            {counts.started > 0 ? "Continue next lesson" : "Start first lesson"}
          </Link>
        )}
        {!courseAvailable && (
          <p role="status">
            This course remains visible for planning. Complete the prerequisite course and its
            challenge before starting the recommended sequence.
          </p>
        )}
      </section>

      <section className="academy-outcomes" aria-labelledby="academy-course-prerequisites-heading">
        <h2 id="academy-course-prerequisites-heading">Prerequisites and availability</h2>
        {prerequisiteCourses.length === 0 ? (
          <p>No prior Academy course is required. This is the recommended beginner starting point.</p>
        ) : (
          <ul>
            {prerequisiteCourses.map(({ course: prerequisite, complete }) => (
              <li key={prerequisite.id}>
                <Link to={academyCourseRoute(prerequisite.id)}>
                  {prerequisite.stage} - {prerequisite.title}
                </Link>: {complete ? "complete" : "required"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="academy-outcomes" aria-labelledby="academy-course-outcomes-heading">
        <h2 id="academy-course-outcomes-heading">What you will be able to do</h2>
        <ul>{course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
      </section>

      <section className="academy-unit-list" aria-labelledby="academy-unit-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ordered units</p>
            <h2 id="academy-unit-list-heading">Build the prerequisites in sequence</h2>
          </div>
        </div>
        {units.map((unit, index) => {
          const unitCounts = academyUnitProgressCounts(progress.academy, unit);
          const earlierUnitsComplete = units.slice(0, index).every((earlierUnit) =>
            earlierUnit.lessonIds.every(
              (lessonId) => progress.academy.lessonRecords[lessonId]?.completionEarned
            )
          );
          const unitAvailable = courseAvailable && earlierUnitsComplete;
          const firstLessonId = unit.lessonIds.find(
            (lessonId) => !progress.academy.lessonRecords[lessonId]?.completionEarned
          ) ?? unit.lessonIds[0];
          return (
            <article key={unit.id} className="academy-unit-row">
              <span className="academy-unit-row__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow">{unit.id}</p>
                <h3>{unit.title}</h3>
                <p>{unit.description}</p>
                <div className="academy-unit-row__meta">
                  <span>{unitAvailable ? "Available" : "Locked for sequence"}</span>
                  <span>{unit.lessonIds.length} lessons</span>
                  <span>{unit.laboratoryRoute ? "Applied laboratory" : "Native practice"}</span>
                  <span>{unitCounts.percent}% complete</span>
                </div>
              </div>
              <div className="academy-unit-row__actions">
                <Link className="btn secondary" to={academyUnitRoute(course.id, unit.id)}>View unit</Link>
                {unitAvailable && (
                  <Link className="btn" to={academyLessonRoute(course.id, unit.id, firstLessonId)}>
                    {unitCounts.started > 0 ? "Continue" : "Start"}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="academy-challenge-card">
        <div>
          <p className="eyebrow">Course mastery gate</p>
          <h2>{course.challenge.title}</h2>
          <p>
            Complete the unit evidence, then reach {course.challenge.requiredScorePercent}% in
            the integrated challenge. Applied proof remains required.
          </p>
        </div>
        {counts.completed === counts.total
          ? (
              <Link className="btn" to={academyCourseChallengeRoute(course.id)}>
                Open course challenge
              </Link>
            )
          : <button className="btn" type="button" disabled>Complete all lessons to unlock</button>}
      </section>
    </section>
  );
}
