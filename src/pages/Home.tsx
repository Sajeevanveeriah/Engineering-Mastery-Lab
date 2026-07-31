import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academyUnits
} from "../data/academy/catalogue";
import { projects } from "../data/projects";
import { buildGuidedAcademyEntry } from "../lib/academy/guidedAcademy";
import { academyUnitProgressCounts } from "../lib/academy/navigation";

const academyPromises = [
  {
    title: "Learn",
    text: "Build each idea from plain-language teaching and worked examples."
  },
  {
    title: "Practise",
    text: "Use progressive hints, checked solutions and targeted review."
  },
  {
    title: "Build",
    text: "Apply the lesson through laboratories and engineering projects."
  }
] as const;

export function Home() {
  const { progress } = useProgress();
  const entry = buildGuidedAcademyEntry(
    progress.academy,
    new Date().toISOString()
  );
  const currentUnit = academyUnits.find((unit) => unit.id === entry.unitId);
  const unitProgress = currentUnit
    ? academyUnitProgressCounts(progress.academy, currentUnit)
    : null;
  const activeProjectEntry = Object.entries(progress.projects).find(
    ([, state]) => state.status === "active"
  );
  const activeProject = activeProjectEntry
    ? projects.find((project) => project.id === activeProjectEntry[0])
    : null;

  if (entry.mode === "new") {
    return (
      <section className="page guided-home guided-home--new" data-learner-state="new">
        <div className="guided-home__intro">
          <p className="eyebrow">Engineering Mastery Lab</p>
          <h1>Learn engineering from first principles, one clear lesson at a time.</h1>
          <p>
            Follow a dependency-ordered Academy from foundations to mechatronics,
            robotics, autonomy, embedded intelligence and AI/ML.
          </p>
          <div className="guided-home__actions" aria-label="Start learning">
            <Link className="btn primary guided-home__primary" to={entry.primaryRoute}>
              Start from the beginning <Icon name="arrow-right" size={18} />
            </Link>
            <Link className="btn secondary" to="/learn/diagnostics">
              Take a placement check
            </Link>
            <Link className="guided-home__tertiary" to="/learn?browse=1">
              Browse the full curriculum
            </Link>
          </div>
        </div>

        <section className="academy-path-preview" aria-labelledby="academy-preview-heading">
          <div>
            <p className="eyebrow">Your ordered pathway</p>
            <h2 id="academy-preview-heading">From first principles to professional proof</h2>
          </div>
          <ol>
            {academyCourses.map((course, index) => (
              <li key={course.id} className={index === 0 ? "is-current" : ""}>
                <span aria-hidden="true">{index + 1}</span>
                <div>
                  <strong>{course.title}</strong>
                  <small>{index === 0 ? "Start here" : "Unlocks in order"}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="guided-home__promises" aria-label="How the Academy works">
          {academyPromises.map((promise) => (
            <article key={promise.title}>
              <h2>{promise.title}</h2>
              <p>{promise.text}</p>
            </article>
          ))}
        </section>
      </section>
    );
  }

  return (
    <section className="page guided-home guided-home--returning" data-learner-state="returning">
      <div className="guided-home__intro">
        <p className="eyebrow">Continue learning</p>
        <h1>{entry.lessonTitle}</h1>
        <p>
          Continue because this is the next unfinished section in your ordered
          Academy pathway.
        </p>
        <dl className="guided-home__position">
          <div>
            <dt>Course</dt>
            <dd>{entry.courseTitle}</dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{entry.unitTitle}</dd>
          </div>
          <div>
            <dt>Lesson</dt>
            <dd>{entry.lessonTitle}</dd>
          </div>
          <div>
            <dt>Section</dt>
            <dd>{entry.sectionTitle}</dd>
          </div>
        </dl>
        {unitProgress && (
          <div className="guided-home__progress">
            <div>
              <strong>{unitProgress.percent}%</strong>
              <span>
                {unitProgress.completed} of {unitProgress.total} lessons complete
                in this unit
              </span>
            </div>
            <progress value={unitProgress.percent} max={100}>
              {unitProgress.percent}%
            </progress>
          </div>
        )}
        <div className="guided-home__actions" aria-label="Continue learning">
          <Link className="btn primary guided-home__primary" to={entry.primaryRoute}>
            Continue learning <Icon name="arrow-right" size={18} />
          </Link>
          {entry.dueReviewCount > 0 && (
            <Link className="btn secondary" to="/practice">
              Review due skills ({entry.dueReviewCount})
            </Link>
          )}
          <Link className="guided-home__tertiary" to="/learn">
            View the full path
          </Link>
        </div>
      </div>

      {activeProject && (
        <aside className="guided-home__quiet-card" aria-labelledby="active-project-heading">
          <p className="eyebrow">Active project</p>
          <h2 id="active-project-heading">{activeProject.title}</h2>
          <p>{activeProject.summary}</p>
          <Link to={`/projects/${activeProject.slug}`}>
            Continue project <Icon name="arrow-right" size={15} />
          </Link>
        </aside>
      )}
    </section>
  );
}
