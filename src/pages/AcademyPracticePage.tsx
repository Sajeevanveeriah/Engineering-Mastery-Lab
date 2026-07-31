import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { buildGuidedAcademyEntry } from "../lib/academy/guidedAcademy";

export function AcademyPracticePage() {
  const { progress } = useProgress();
  const entry = buildGuidedAcademyEntry(
    progress.academy,
    new Date().toISOString()
  );
  const unfinishedChecks = Object.values(progress.academy.lessonRecords).filter(
    (record) => !record.completionEarned
  ).length;
  const developingSkills = Object.values(progress.academy.skillRecords).filter(
    (record) => record.mastery !== "mastered"
  ).length;
  const bookmarkedItems = Object.values(progress.bookmarks).filter(Boolean).length;
  const recommendedRoute = entry.dueReviewCount > 0
    ? "/learn/review"
    : entry.primaryRoute;
  const recommendedTitle = entry.dueReviewCount > 0
    ? `Review ${entry.dueReviewCount} due skill${entry.dueReviewCount === 1 ? "" : "s"}`
    : `Finish ${entry.lessonTitle}`;

  return (
    <section className="page academy-practice-page">
      <PageHeader
        eyebrow="Targeted practice"
        title="Practice"
        description="Work on the activity with the strongest evidence-based reason first."
      />

      <section className="academy-recommended-activity" aria-labelledby="practice-next-heading">
        <div>
          <p className="eyebrow">Recommended now</p>
          <h2 id="practice-next-heading">{recommendedTitle}</h2>
          <p>
            {entry.dueReviewCount > 0
              ? "Retrieval is due now, so reviewing it protects previously demonstrated skill."
              : "This lesson is already in progress, so completing its check is the shortest path forward."}
          </p>
        </div>
        <Link className="btn primary" to={recommendedRoute}>
          Start recommended practice <Icon name="arrow-right" size={17} />
        </Link>
      </section>

      <dl className="academy-practice-summary">
        <div>
          <dt>Due reviews</dt>
          <dd>{entry.dueReviewCount}</dd>
        </div>
        <div>
          <dt>Unfinished lesson checks</dt>
          <dd>{unfinishedChecks}</dd>
        </div>
        <div>
          <dt>Skills still developing</dt>
          <dd>{developingSkills}</dd>
        </div>
        <div>
          <dt>Bookmarked learning items</dt>
          <dd>{bookmarkedItems}</dd>
        </div>
      </dl>

      <section className="academy-practice-secondary" aria-labelledby="practice-secondary-heading">
        <h2 id="practice-secondary-heading">Other practice</h2>
        <div className="simple-link-list">
          <Link to="/learn/review">
            <span>
              <strong>Review queue</strong>
              <small>Scheduled retrieval based on recorded evidence.</small>
            </span>
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link to={entry.primaryRoute}>
            <span>
              <strong>Current lesson check</strong>
              <small>{entry.lessonTitle}</small>
            </span>
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link to="/learn/bookmarks">
            <span>
              <strong>Bookmarked learning items</strong>
              <small>Return to material you deliberately saved.</small>
            </span>
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </section>
    </section>
  );
}
