import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academyUnits
} from "../data/academy/catalogue";
import { buildGuidedAcademyEntry } from "../lib/academy/guidedAcademy";
import { academyCourseProgressCounts } from "../lib/academy/navigation";

export function AcademyProgressPage() {
  const { progress } = useProgress();
  const entry = buildGuidedAcademyEntry(
    progress.academy,
    new Date().toISOString()
  );
  const completedLessons = Object.values(progress.academy.lessonRecords).filter(
    (record) => record.completionEarned
  ).length;
  const recordedSkills = Object.keys(progress.academy.skillRecords).length;
  const projectEvidence = Object.values(progress.projects).reduce(
    (total, project) => total + project.checkedEvidenceIds.length,
    0
  );

  return (
    <section className="page academy-progress-page">
      <PageHeader
        eyebrow="Your local learning record"
        title="Progress"
        description="See what is complete, what evidence exists and what to do next."
      />

      <section className="academy-progress-next" aria-labelledby="progress-next-heading">
        <div>
          <p className="eyebrow">Next action</p>
          <h2 id="progress-next-heading">{entry.lessonTitle}</h2>
          <p>{entry.courseTitle} - {entry.unitTitle}</p>
        </div>
        <Link className="btn primary" to={entry.primaryRoute}>
          {entry.primaryLabel} <Icon name="arrow-right" size={17} />
        </Link>
      </section>

      <dl className="academy-progress-evidence">
        <div>
          <dt>Lessons complete</dt>
          <dd>{completedLessons} of 175</dd>
        </div>
        <div>
          <dt>Skill records</dt>
          <dd>{recordedSkills}</dd>
        </div>
        <div>
          <dt>Reviews due</dt>
          <dd>{entry.dueReviewCount}</dd>
        </div>
        <div>
          <dt>Project evidence items</dt>
          <dd>{projectEvidence}</dd>
        </div>
      </dl>

      <section className="academy-course-progress-list" aria-labelledby="course-progress-heading">
        <div className="section-heading section-heading--outside">
          <div>
            <p className="eyebrow">Academy completion</p>
            <h2 id="course-progress-heading">Courses and units</h2>
          </div>
        </div>
        <ol>
          {academyCourses.map((course) => {
            const counts = academyCourseProgressCounts(
              progress.academy,
              course,
              academyUnits
            );
            return (
              <li key={course.id}>
                <div>
                  <strong>{course.title}</strong>
                  <span>{counts.completed} of {counts.total} lessons complete</span>
                </div>
                <progress value={counts.percent} max={100}>{counts.percent}%</progress>
                <span>{counts.percent}%</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="academy-progress-links" aria-labelledby="progress-details-heading">
        <h2 id="progress-details-heading">Detailed evidence</h2>
        <p>
          Weekly templates, accelerated-session analysis, diagnostics and exports
          remain available as secondary evidence tools.
        </p>
        <div className="button-row">
          <Link className="btn secondary" to="/tools/progress">Open detailed analysis</Link>
          <Link className="btn secondary" to="/portfolio">Review portfolio evidence</Link>
        </div>
      </section>
    </section>
  );
}
