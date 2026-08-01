import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { projects } from "../data/projects";
import type { Difficulty } from "../data/pathways";
import { rebootProjectReleases } from "../data/rebootCurriculum";
import { hasExactRequiredIds } from "./ProjectDetail";

type BuildState = "available" | "active" | "paused" | "complete";
type StoredBuildState = {
  status: "active" | "paused" | "completed";
  completedMilestoneIds: readonly string[];
  checkedEvidenceIds: readonly string[];
};

const buildStateDetails: Record<
  BuildState,
  { label: string; className: string; description: string }
> = {
  available: { label: "Available", className: "badge", description: "Brief not started" },
  active: { label: "Active", className: "badge info", description: "Work is under way" },
  paused: { label: "Paused", className: "badge warn", description: "Work is retained for later" },
  complete: { label: "Complete", className: "badge ok", description: "Learner checklist completed" }
};

function getBuildState(
  project: (typeof projects)[number],
  state: StoredBuildState | undefined
): BuildState {
  if (!state) return "available";
  if (state.status !== "completed") return state.status;
  const requiredMilestoneIds = project.milestones.map((milestone) => milestone.id);
  const requiredEvidenceIds = project.portfolioEvidence.map((_, index) => `evidence-${index}`);
  return hasExactRequiredIds(state.completedMilestoneIds, requiredMilestoneIds)
    && hasExactRequiredIds(state.checkedEvidenceIds, requiredEvidenceIds)
    ? "complete"
    : "active";
}

export function Projects() {
  const { progress, update } = useProgress();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [stateFilter, setStateFilter] = useState<"All" | BuildState>("All");
  const disciplines = [...new Set(projects.flatMap((project) => project.disciplines))].sort();
  const activeProjectEntry = Object.entries(progress.projects).find(
    ([, state]) => state.status === "active"
  );
  const recommendedProject = (
    activeProjectEntry
      ? projects.find((project) => project.id === activeProjectEntry[0])
      : null
  ) ?? projects.find((project) => project.difficulty === "Foundation") ?? projects[0];
  const recommendedState = progress.projects[recommendedProject.id];
  const recommendedBuildState = getBuildState(recommendedProject, recommendedState);
  const nextMilestone = recommendedProject.milestones.find(
    (milestone) => !recommendedState?.completedMilestoneIds.includes(milestone.id)
  );
  const completedEvidence = recommendedState?.checkedEvidenceIds.length ?? 0;
  const recommendedAction = recommendedBuildState === "active"
    ? "Continue project"
    : recommendedBuildState === "paused"
      ? "Resume project"
      : recommendedBuildState === "complete"
        ? "Review project evidence"
        : "Start recommended project";

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return projects.filter((project) => {
      const state = getBuildState(project, progress.projects[project.id]);
      return (
        (!term
          || `${project.title} ${project.summary} ${project.disciplines.join(" ")}`
            .toLocaleLowerCase("en-AU")
            .includes(term))
        && (discipline === "All" || project.disciplines.includes(discipline))
        && (difficulty === "All" || project.difficulty === difficulty)
        && (stateFilter === "All" || state === stateFilter)
      );
    });
  }, [difficulty, discipline, progress.projects, query, stateFilter]);

  return (
    <section className="page academy-projects-page">
      <PageHeader
        eyebrow="Apply what you are learning"
        title="Projects"
        description="Take one bounded engineering project from prerequisites through evidence."
      />

      <section className="academy-project-recommendation" aria-labelledby="recommended-project-heading">
        <div className="academy-project-recommendation__summary">
          <p className="eyebrow">
            {recommendedBuildState === "active" ? "Active project" : "Recommended project"}
          </p>
          <h2 id="recommended-project-heading">{recommendedProject.title}</h2>
          <p>{recommendedProject.summary}</p>
          <dl className="inline-facts">
            <div><dt>Status</dt><dd>{buildStateDetails[recommendedBuildState].label}</dd></div>
            <div><dt>Indicative effort</dt><dd>{recommendedProject.effortHours} h</dd></div>
            <div>
              <dt>Estimated budget</dt>
              <dd>AUD {recommendedProject.budgetAud.minimum}-{recommendedProject.budgetAud.maximum}</dd>
            </div>
          </dl>
          <div className="safety-note">
            <Icon name="alert" size={18} />
            <p><strong>Safety boundary.</strong> {recommendedProject.safetyBoundary}</p>
          </div>
          <Link className="btn primary" to={`/projects/${recommendedProject.slug}`}>
            {recommendedAction} <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <div className="academy-project-recommendation__detail">
          <section aria-labelledby="project-prerequisites-heading">
            <h3 id="project-prerequisites-heading">Prerequisites to review</h3>
            <ul>
              {recommendedProject.prerequisites.map((prerequisite) => (
                <li key={prerequisite}>{prerequisite}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="project-milestone-heading">
            <h3 id="project-milestone-heading">Next milestone</h3>
            {nextMilestone ? (
              <>
                <strong>{nextMilestone.title}</strong>
                <p>{nextMilestone.description}</p>
                <small>Acceptance: {nextMilestone.validation}</small>
              </>
            ) : (
              <p>All milestones are recorded. Review evidence and completion criteria.</p>
            )}
          </section>
          <section aria-labelledby="project-evidence-heading">
            <h3 id="project-evidence-heading">Evidence checklist</h3>
            <p>
              {completedEvidence} of {recommendedProject.portfolioEvidence.length} items checked
            </p>
            <ul>
              {recommendedProject.portfolioEvidence.map((evidence, index) => (
                <li key={evidence}>
                  {recommendedState?.checkedEvidenceIds.includes(`evidence-${index}`)
                    ? "Complete: "
                    : "Needed: "}
                  {evidence}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <div className="academy-projects-browse-control">
        <button
          className="btn secondary"
          type="button"
          aria-expanded={browseOpen}
          aria-controls="project-browse"
          onClick={() => setBrowseOpen((open) => !open)}
        >
          {browseOpen ? "Hide project browser" : "Browse all projects and releases"}
        </button>
      </div>

      {browseOpen && (
        <div id="project-browse" className="academy-projects-browse">
          <details>
            <summary>Robot Zero rover releases</summary>
            <div className="release-grid">
              {rebootProjectReleases.map((release) => (
                <article key={release.id}>
                  <span className="badge">{release.id}</span>
                  <h3>{release.name}</h3>
                  <p>{release.systemIncrement}</p>
                  <small>
                    {release.sessions} - {release.hardwareRequired === "No"
                      ? "Simulation and software only"
                      : "Hardware optional"}
                  </small>
                  <Link className="btn" to={`/projects/releases/${release.id}`}>
                    Open release brief
                  </Link>
                </article>
              ))}
            </div>
          </details>

          <div className="catalogue-filters">
            <div className="filter-search">
              <Icon name="search" size={18} />
              <label className="sr-only" htmlFor="project-search">Search project briefs</label>
              <input
                id="project-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search briefs and outcomes"
              />
            </div>
            <label>
              Discipline
              <select value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
                <option>All</option>
                {disciplines.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}
              >
                <option>All</option>
                <option>Foundation</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              Project state
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value as typeof stateFilter)}
              >
                <option>All</option>
                <option value="available">Available</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="complete">Complete</option>
              </select>
            </label>
          </div>

          <p className="results-count" role="status">
            {filtered.length} project {filtered.length === 1 ? "brief" : "briefs"}
          </p>
          <div className="project-grid">
            {filtered.map((project) => {
              const state = progress.projects[project.id];
              const buildState = getBuildState(project, state);
              const stateDetails = buildStateDetails[buildState];
              const bookmarked = Boolean(
                progress.bookmarks[bookmarkKey("project", project.id)]
              );
              return (
                <article className="project-card" key={project.id}>
                  <div className="project-card__top">
                    <span className={stateDetails.className}>{stateDetails.label}</span>
                    <button
                      className="btn btn--quiet"
                      type="button"
                      aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${project.title}`}
                      aria-pressed={bookmarked}
                      onClick={() => update((current) => ({
                        ...current,
                        bookmarks: {
                          ...current.bookmarks,
                          [bookmarkKey("project", project.id)]: !bookmarked
                        }
                      }))}
                    >
                      <Icon name={bookmarked ? "check" : "plus"} size={16} />
                      {bookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                  </div>
                  <h2>{project.title}</h2>
                  <p>{project.summary}</p>
                  <Link className="btn primary" to={`/projects/${project.slug}`}>
                    Open project <Icon name="arrow-right" size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
