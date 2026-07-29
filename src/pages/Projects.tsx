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

const buildStateDetails: Record<BuildState, { label: string; className: string; description: string }> = {
  available: { label: "Available", className: "badge", description: "Brief not started" },
  active: { label: "Active", className: "badge info", description: "Work is under way" },
  paused: { label: "Paused", className: "badge warn", description: "Work is retained for later" },
  complete: { label: "Complete", className: "badge ok", description: "Learner checklist completed" }
};

function getBuildState(project: (typeof projects)[number], state: StoredBuildState | undefined): BuildState {
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
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [stateFilter, setStateFilter] = useState<"All" | BuildState>("All");
  const disciplines = [...new Set(projects.flatMap((project) => project.disciplines))].sort();
  const firstFoundationProject = projects.find((project) => project.difficulty === "Foundation");
  const isFirstProject = Object.keys(progress.projects).length === 0;
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return projects.filter((project) => {
      const state = getBuildState(project, progress.projects[project.id]);
      return (!term || `${project.title} ${project.summary} ${project.disciplines.join(" ")}`.toLocaleLowerCase("en-AU").includes(term))
        && (discipline === "All" || project.disciplines.includes(discipline))
        && (difficulty === "All" || project.difficulty === difficulty)
        && (stateFilter === "All" || state === stateFilter);
    });
  }, [difficulty, discipline, progress.projects, query, stateFilter]);

  return (
    <section className="page catalogue-page">
      <PageHeader
        eyebrow="Practical application"
        title="Build"
        description="Choose a bounded engineering brief, work through its milestones, and retain the notes and evidence needed for review."
        meta={<span>{projects.length} substantial project briefs</span>}
      />
      <div className="safety-note safety-note--neutral">
        <Icon name="info" size={20} />
        <p><strong>Record boundary.</strong> Project states and completion are learner-managed local records. They do not certify competence or independently validate the engineering work.</p>
      </div>
      <section aria-labelledby="rover-releases-heading">
        <div className="section-heading section-heading--outside">
          <div><p className="eyebrow">Progressive curriculum build</p><h2 id="rover-releases-heading">Robot Zero rover releases</h2></div>
          <Link to="/learn/reboot">View linked sessions</Link>
        </div>
        <div className="release-grid">
          {rebootProjectReleases.map((release) => (
            <article key={release.id}>
              <span className="badge">{release.id}</span>
              <h3>{release.name}</h3>
              <p>{release.systemIncrement}</p>
              <small>{release.sessions} - {release.hardwareRequired === "No" ? "Simulation and software only" : "Hardware optional"}</small>
              <Link className="btn" to={`/projects/releases/${release.id}`}>Open release brief</Link>
            </article>
          ))}
        </div>
      </section>
      {isFirstProject && firstFoundationProject && (
        <section className="card" aria-labelledby="first-build-heading">
          <p className="eyebrow">First build</p>
          <h2 id="first-build-heading">Start with one bounded outcome</h2>
          <p>Open a Foundation brief, read its safety boundary, and define the evidence you will retain before marking work complete.</p>
          <Link className="btn primary" to={`/projects/${firstFoundationProject.slug}`}>
            Open {firstFoundationProject.title}
            <Icon name="arrow-right" size={16} />
          </Link>
        </section>
      )}
      <div className="button-row" aria-label="Build state guide">
        {(Object.keys(buildStateDetails) as BuildState[]).map((key) => (
          <span className={buildStateDetails[key].className} key={key} title={buildStateDetails[key].description}>
            {buildStateDetails[key].label}
          </span>
        ))}
      </div>
      <div className="catalogue-filters">
        <div className="filter-search"><Icon name="search" size={18} /><label className="sr-only" htmlFor="project-search">Search build briefs</label><input id="project-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search briefs and outcomes" /></div>
        <label>Discipline<select value={discipline} onChange={(event) => setDiscipline(event.target.value)}><option>All</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option>All</option><option>Foundation</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label>Build state<select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as typeof stateFilter)}><option>All</option><option value="available">Available</option><option value="active">Active</option><option value="paused">Paused</option><option value="complete">Complete</option></select></label>
      </div>
      <p className="results-count" role="status">{filtered.length} build {filtered.length === 1 ? "brief" : "briefs"}</p>
      <div className="project-grid">
        {filtered.map((project) => {
          const state = progress.projects[project.id];
          const buildState = getBuildState(project, state);
          const stateDetails = buildStateDetails[buildState];
          const bookmarked = Boolean(progress.bookmarks[bookmarkKey("project", project.id)]);
          const action = buildState === "complete" ? "Review record" : buildState === "active" ? "Continue build" : buildState === "paused" ? "Resume build" : "Open brief";
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card__top">
                <span className={stateDetails.className}>{stateDetails.label}</span>
                <button className="btn btn--quiet" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${project.title}`} aria-pressed={bookmarked} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("project", project.id)]: !bookmarked } }))}>
                  <Icon name={bookmarked ? "check" : "plus"} size={16} />
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
              <div><p className="eyebrow">Outcome</p><h2>{project.title}</h2><p>{project.summary}</p></div>
              <div><strong>Disciplines</strong><div className="tag-list">{project.disciplines.map((item) => <span key={item}>{item}</span>)}</div></div>
              <dl className="inline-facts"><div><dt>Difficulty</dt><dd>{project.difficulty}</dd></div><div><dt>Indicative effort</dt><dd>{project.effortHours} h</dd></div><div><dt>Estimated budget</dt><dd>AUD {project.budgetAud.minimum}-{project.budgetAud.maximum}</dd></div></dl>
              <div className="safety-note"><Icon name="alert" size={18} /><p><strong>Safety boundary.</strong> {project.safetyBoundary}</p></div>
              <Link className="btn primary" to={`/projects/${project.slug}`}>{action}<Icon name="arrow-right" size={16} /></Link>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state"><strong>No build brief matches this view</strong><p>Clear the filters to restore every available, active, paused, and complete brief, or search for a broader outcome.</p><button type="button" onClick={() => { setQuery(""); setDiscipline("All"); setDifficulty("All"); setStateFilter("All"); }}>Clear all filters</button></div>}
    </section>
  );
}
