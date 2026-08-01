import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academyUnitPrerequisiteMap,
  academyUnitSeeds,
  academyUnits
} from "../data/academy/catalogue";
import { buildGuidedAcademyEntry } from "../lib/academy/guidedAcademy";
import {
  academyCourseProgressCounts,
  academyCourseRoute,
  academyLessonRoute,
  academyUnitProgressCounts,
  academyUnitRoute,
  bestAssessmentScore
} from "../lib/academy/navigation";

export function AcademyCataloguePage() {
  const { progress } = useProgress();
  const [searchParams] = useSearchParams();
  const browseMode = searchParams.get("browse") === "1";
  const entry = buildGuidedAcademyEntry(
    progress.academy,
    new Date().toISOString()
  );
  const completedCourseIds = useMemo(
    () => new Set(
      academyCourses
        .filter((course) => {
          const counts = academyCourseProgressCounts(
            progress.academy,
            course,
            academyUnits
          );
          const challengeScore = bestAssessmentScore(
            progress.academy,
            course.challenge.id
          );
          return (
            counts.completed === counts.total
            && challengeScore !== null
            && challengeScore >= course.challenge.requiredScorePercent
          );
        })
        .map((course) => course.id)
    ),
    [progress.academy]
  );
  const completedUnitIds = useMemo(
    () => new Set(
      academyUnits
        .filter((unit) => {
          const counts = academyUnitProgressCounts(progress.academy, unit);
          return counts.completed === counts.total;
        })
        .map((unit) => unit.id)
    ),
    [progress.academy]
  );
  const recommendedCourse = academyCourses.find((course) => (
    !completedCourseIds.has(course.id)
    && course.prerequisiteCourseIds.every((courseId) => completedCourseIds.has(courseId))
  )) ?? academyCourses.at(-1)!;
  const currentCourse = academyCourses.find((course) => course.id === entry.courseId)
    ?? recommendedCourse;
  const displayedCourse = completedCourseIds.has(currentCourse.id)
    ? recommendedCourse
    : currentCourse;
  const displayedUnits = displayedCourse.unitIds
    .map((unitId) => academyUnits.find((unit) => unit.id === unitId))
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit));
  const initialExpandedUnit = displayedUnits.find((unit) => unit.id === entry.unitId)
    ?? displayedUnits.find((unit) => !completedUnitIds.has(unit.id))
    ?? displayedUnits[0];
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(
    initialExpandedUnit?.id ?? null
  );
  const visibleCourses = browseMode ? academyCourses : [displayedCourse];

  return (
    <section className="page academy-path-page">
      <PageHeader
        eyebrow="Your ordered Academy"
        title="Learn"
        description="Follow one dependency-ordered pathway from first principles to professional engineering proof."
      />

      <section className="academy-path-now" aria-labelledby="academy-path-now-heading">
        <div>
          <p className="eyebrow">
            {entry.mode === "new" ? "Recommended start" : "Continue from your saved section"}
          </p>
          <h2 id="academy-path-now-heading">{entry.lessonTitle}</h2>
          <p>
            {entry.courseTitle} - {entry.unitTitle} - {entry.sectionTitle}
          </p>
        </div>
        <div className="academy-path-now__actions">
          <Link className="btn primary" to={entry.primaryRoute}>
            {entry.primaryLabel} <Icon name="arrow-right" size={17} />
          </Link>
          {entry.dueReviewCount > 0 && (
            <Link className="btn secondary" to="/practice">
              Review due skills ({entry.dueReviewCount})
            </Link>
          )}
        </div>
      </section>

      <div className="academy-path-summary" aria-label="Academy curriculum totals">
        <span><strong>5</strong> courses</span>
        <span><strong>25</strong> units</span>
        <span><strong>175</strong> lessons</span>
        <Link to={browseMode ? "/learn" : "/learn?browse=1"}>
          {browseMode ? "Return to recommended path" : "Browse the full curriculum"}
        </Link>
      </div>

      <section className="academy-course-path" aria-label="Academy course pathway">
        {visibleCourses.map((course) => {
          const courseProgress = academyCourseProgressCounts(
            progress.academy,
            course,
            academyUnits
          );
          const missingCoursePrerequisites = course.prerequisiteCourseIds.filter(
            (courseId) => !completedCourseIds.has(courseId)
          );
          const courseLocked = missingCoursePrerequisites.length > 0;
          const courseUnits = course.id === displayedCourse.id
            ? displayedUnits
            : course.unitIds
              .map((unitId) => academyUnits.find((unit) => unit.id === unitId))
              .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit));
          const courseState = completedCourseIds.has(course.id)
            ? "Complete"
            : courseLocked
              ? "Locked"
              : course.id === displayedCourse.id
                ? "Current"
                : "Available";

          return (
            <article
              className={`academy-path-course academy-path-course--${courseState.toLowerCase()}`}
              key={course.id}
            >
              <header>
                <div>
                  <span className="badge">{courseState}</span>
                  <p className="eyebrow">Course {academyCourses.indexOf(course) + 1} of 5</p>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                </div>
                <div className="academy-progress-line">
                  <strong>{courseProgress.percent}%</strong>
                  <progress value={courseProgress.percent} max={100}>
                    {courseProgress.percent}%
                  </progress>
                  <span>
                    {courseProgress.completed} of {courseProgress.total} lessons complete
                  </span>
                </div>
              </header>

              {courseLocked && (
                <p className="academy-path-prerequisite">
                  Complete{" "}
                  {missingCoursePrerequisites
                    .map((courseId) => academyCourses.find((item) => item.id === courseId)?.title)
                    .filter(Boolean)
                    .join(", ")}{" "}
                  before starting this course.
                </p>
              )}

              {course.id === displayedCourse.id && (
                <ol className="academy-unit-path">
                  {courseUnits.map((unit, unitIndex) => {
                    const seed = academyUnitSeeds.find((candidate) => candidate.id === unit.id);
                    const counts = academyUnitProgressCounts(progress.academy, unit);
                    const missingUnitPrerequisites = (
                      academyUnitPrerequisiteMap[unit.id] ?? []
                    ).filter(
                      (unitId) => !completedUnitIds.has(unitId)
                    );
                    const unitLocked = missingUnitPrerequisites.length > 0;
                    const unitState = counts.completed === counts.total
                      ? "complete"
                      : unitLocked
                        ? "locked"
                        : counts.started > 0
                          ? "in-progress"
                          : "available";
                    const expanded = expandedUnitId === unit.id;

                    return (
                      <li
                        key={unit.id}
                        className={`academy-unit-step academy-unit-step--${unitState}`}
                      >
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={`${unit.id}-lessons`}
                          onClick={() => setExpandedUnitId(expanded ? null : unit.id)}
                        >
                          <span className="academy-unit-step__number" aria-hidden="true">
                            {unitIndex + 1}
                          </span>
                          <span>
                            <strong>{unit.title}</strong>
                            <small>
                              {unitState === "complete"
                                ? "Complete"
                                : unitState === "in-progress"
                                  ? `${counts.percent}% complete`
                                  : unitState === "locked"
                                    ? "Locked"
                                    : "Available"}
                            </small>
                          </span>
                          <Icon
                            className={expanded ? "is-expanded" : ""}
                            name="chevron"
                            size={17}
                          />
                        </button>

                        {expanded && (
                          <div id={`${unit.id}-lessons`} className="academy-unit-step__lessons">
                            {unitLocked ? (
                              <p>
                                Complete{" "}
                                {missingUnitPrerequisites
                                  .map((unitId) => academyUnits.find((item) => item.id === unitId)?.title)
                                  .filter(Boolean)
                                  .join(", ")}{" "}
                                to unlock this unit.
                              </p>
                            ) : (
                              <>
                                <ol>
                                  {unit.lessonIds.map((lessonId, lessonIndex) => {
                                    const record = progress.academy.lessonRecords[lessonId];
                                    const state = record?.completionEarned
                                      ? "Complete"
                                      : record
                                        ? "In progress"
                                        : lessonId === entry.lessonId
                                          ? "Next"
                                          : "Available";
                                    return (
                                      <li key={lessonId}>
                                        <Link
                                          to={academyLessonRoute(course.id, unit.id, lessonId)}
                                        >
                                          <span>{seed?.lessonTitles[lessonIndex] ?? lessonId}</span>
                                          <small>{state}</small>
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ol>
                                <Link
                                  className="btn secondary"
                                  to={academyUnitRoute(course.id, unit.id)}
                                >
                                  View unit details
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}

              {course.id !== displayedCourse.id && !courseLocked && (
                <Link className="academy-path-course__quiet-link" to={academyCourseRoute(course.id)}>
                  Preview course
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <aside className="academy-path-more">
        <p>
          Legacy maps, source inventories, diagnostics, laboratories and tools remain
          available under More.
        </p>
        <Link to="/more">Open More</Link>
      </aside>
    </section>
  );
}
