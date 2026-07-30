import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academySkills,
  academyUnitSeeds,
  academyUnits
} from "../data/academy/catalogue";
import {
  academyCourseRoute,
  academyLessonRoute,
  academyUnitAssessmentRoute,
  academyUnitProgressCounts,
  bestAssessmentScore
} from "../lib/academy/navigation";

export function AcademyUnitPage() {
  const { courseId = "", unitId = "" } = useParams();
  const { progress } = useProgress();
  const course = academyCourses.find((candidate) => candidate.id === courseId);
  const unit = academyUnits.find((candidate) => candidate.id === unitId);
  const seed = academyUnitSeeds.find((candidate) => candidate.id === unitId);

  if (!course || !unit || !seed || unit.courseId !== course.id) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy unit"
          title="Unit not found"
          description="The requested course and unit combination is not present in the reviewed academy catalogue."
        />
        <Link className="btn" to="/learn/courses">Return to academy</Link>
      </section>
    );
  }

  const counts = academyUnitProgressCounts(progress.academy, unit);
  const quizScore = bestAssessmentScore(progress.academy, unit.quiz.id);
  const testScore = bestAssessmentScore(progress.academy, unit.unitTest.id);
  const prerequisiteSkills = unit.prerequisiteSkillIds
    .map((skillId) => academySkills.find((skill) => skill.id === skillId))
    .filter((skill): skill is (typeof academySkills)[number] => skill !== undefined);
  const unitSkill = academySkills.find((skill) => skill.unitIds.includes(unit.id));
  const unitSkillRecord = unitSkill
    ? progress.academy.skillRecords[unitSkill.id]
    : undefined;
  const reviewDue = Boolean(
    unitSkillRecord?.mastery === "review-due"
    || (
      unitSkillRecord?.reviewDueAt
      && Date.parse(unitSkillRecord.reviewDueAt) <= Date.now()
    )
  );

  return (
    <section className="page academy-unit-page">
      <nav className="academy-breadcrumbs" aria-label="Academy breadcrumb">
        <Link to="/learn/courses">Academy</Link><span aria-hidden="true">/</span>
        <Link to={academyCourseRoute(course.id)}>{course.stage}</Link><span aria-hidden="true">/</span>
        <span>{unit.id}</span>
      </nav>
      <PageHeader
        eyebrow={`${unit.id} unit`}
        title={unit.title}
        description={unit.description}
      />

      <section className="academy-unit-overview">
        <div className="academy-progress-line">
          <div>
            <strong>{counts.percent}%</strong>
            <span>{counts.completed}/{counts.total} lessons complete</span>
          </div>
          <progress value={counts.percent} max={100}>{counts.percent}%</progress>
        </div>
        <p>{unit.masterySummary}</p>
        <div className="academy-unit-overview__links">
          {unit.laboratoryRoute && <Link to={unit.laboratoryRoute}>Open linked laboratory</Link>}
          {unit.projectRoute && <Link to={unit.projectRoute}>Open linked project</Link>}
          <Link to={`/learn/modules/${unit.legacyModuleId}`}>View retained E0-E4 module evidence</Link>
        </div>
      </section>

      <section className="academy-outcomes" aria-labelledby="academy-unit-outcomes-heading">
        <h2 id="academy-unit-outcomes-heading">Unit outcomes</h2>
        <ul>
          <li>Explain and apply {seed.lessonTitles[0].toLowerCase()} from first principles.</li>
          <li>Connect {seed.lessonTitles[3].toLowerCase()} to checked engineering decisions.</li>
          <li>Evidence target: {unit.masterySummary}</li>
        </ul>
      </section>

      <section className="academy-outcomes" aria-labelledby="academy-unit-prerequisites-heading">
        <h2 id="academy-unit-prerequisites-heading">Prerequisite skills, mastery and review</h2>
        {prerequisiteSkills.length === 0 ? (
          <p>No prior unit skill is required.</p>
        ) : (
          <ul>
            {prerequisiteSkills.map((skill) => (
              <li key={skill.id}>
                {skill.title}:{" "}
                {progress.academy.skillRecords[skill.id]?.mastery ?? "not-started"}
              </li>
            ))}
          </ul>
        )}
        <p>
          <strong>Current unit mastery:</strong>{" "}
          {unitSkillRecord?.mastery ?? "not-started"}.
          {unitSkillRecord?.reviewDueAt
            ? ` Next review ${reviewDue ? "is due" : "is scheduled"} for ${new Date(unitSkillRecord.reviewDueAt).toLocaleString("en-AU")}.`
            : " Review is scheduled only after sufficient evidence."}
        </p>
        {reviewDue && <Link to="/learn/review">Open the due review</Link>}
      </section>

      <section className="academy-lesson-sequence" aria-labelledby="academy-lesson-sequence-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Seven complete lessons</p>
            <h2 id="academy-lesson-sequence-heading">Learn in sequence, resume exactly</h2>
          </div>
        </div>
        <ol>
          {unit.lessonIds.map((lessonId, index) => {
            const record = progress.academy.lessonRecords[lessonId];
            const sequenceAvailable = unit.lessonIds
              .slice(0, index)
              .every((earlierLessonId) =>
                progress.academy.lessonRecords[earlierLessonId]?.completionEarned
              );
            const state = record?.completionEarned
              ? "Complete"
              : record
                ? "In progress"
                : sequenceAvailable
                  ? "Available"
                  : "Locked for sequence";
            return (
              <li key={lessonId} className={record?.completionEarned ? "complete" : ""}>
                <span>{index + 1}</span>
                <div>
                  <small>{lessonId}</small>
                  <h3>{seed.lessonTitles[index]}</h3>
                  <p>{state}{record?.lastBlockId ? `, last at ${record.lastBlockId}` : ""}</p>
                </div>
                {sequenceAvailable || record ? (
                  <Link className="btn secondary" to={academyLessonRoute(course.id, unit.id, lessonId)}>
                    {record ? "Continue lesson" : "Open lesson"}
                  </Link>
                ) : (
                  <Link
                    className="btn secondary"
                    to={academyLessonRoute(course.id, unit.id, lessonId)}
                    aria-label={`Preview locked lesson ${lessonId}`}
                  >
                    Preview lesson
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="academy-assessment-grid" aria-labelledby="academy-unit-assessments-heading">
        <div>
          <p className="eyebrow">Assessment gates</p>
          <h2 id="academy-unit-assessments-heading">Check understanding, then prove transfer</h2>
        </div>
        <article>
          <span className="badge">Quiz</span>
          <h3>{unit.quiz.title}</h3>
          <p>Target {unit.quiz.requiredScorePercent}%. Best: {quizScore === null ? "not attempted" : `${quizScore}%`}.</p>
          <Link className="btn secondary" to={academyUnitAssessmentRoute(course.id, unit.id, "quiz")}>
            Open quiz
          </Link>
        </article>
        <article>
          <span className="badge">Unit test</span>
          <h3>{unit.unitTest.title}</h3>
          <p>
            Target {unit.unitTest.requiredScorePercent}% plus applied evidence. Best:{" "}
            {testScore === null ? "not attempted" : `${testScore}%`}.
          </p>
          <Link className="btn secondary" to={academyUnitAssessmentRoute(course.id, unit.id, "test")}>
            Open unit test
          </Link>
        </article>
      </section>
    </section>
  );
}
