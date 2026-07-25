import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { projects } from "../data/projects";
import type { Difficulty } from "../data/pathways";

export function Projects() {
  const { progress, update } = useProgress();
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [stateFilter, setStateFilter] = useState("All");
  const disciplines = [...new Set(projects.flatMap((project) => project.disciplines))].sort();
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return projects.filter((project) => {
      const state = progress.projects[project.id]?.status ?? "not-started";
      return (!term || `${project.title} ${project.summary} ${project.disciplines.join(" ")}`.toLocaleLowerCase("en-AU").includes(term))
        && (discipline === "All" || project.disciplines.includes(discipline))
        && (difficulty === "All" || project.difficulty === difficulty)
        && (stateFilter === "All" || state === stateFilter);
    });
  }, [difficulty, discipline, progress.projects, query, stateFilter]);

  return (
    <section className="page catalogue-page">
      <PageHeader eyebrow="Practical application" title="Projects" description="Turn learning into reviewable engineering evidence through substantial local project briefs, milestones, and validation criteria." meta={<span>{projects.length} substantial project briefs</span>} />
      <div className="catalogue-filters">
        <div className="filter-search"><Icon name="search" size={18} /><label className="sr-only" htmlFor="project-search">Search projects</label><input id="project-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects and outcomes" /></div>
        <label>Discipline<select value={discipline} onChange={(event) => setDiscipline(event.target.value)}><option>All</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option>All</option><option>Foundation</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label>Progress<select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option>All</option><option value="not-started">Not started</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
      </div>
      <p className="results-count" role="status">{filtered.length} projects</p>
      <div className="project-grid">
        {filtered.map((project) => {
          const state = progress.projects[project.id];
          const bookmarked = Boolean(progress.bookmarks[bookmarkKey("project", project.id)]);
          const action = state?.status === "completed" ? "Review" : state ? "Resume" : "View brief";
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card__top"><span className="badge">{project.difficulty}</span><button className="icon-button" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${project.title}`} aria-pressed={bookmarked} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("project", project.id)]: !bookmarked } }))}><Icon name={bookmarked ? "check" : "plus"} /></button></div>
              <div><h2>{project.title}</h2><p>{project.summary}</p></div>
              <div className="tag-list">{project.disciplines.map((item) => <span key={item}>{item}</span>)}</div>
              <dl className="inline-facts"><div><dt>Effort</dt><dd>{project.effortHours} h</dd></div><div><dt>Estimated budget</dt><dd>AUD {project.budgetAud.minimum}-{project.budgetAud.maximum}</dd></div><div><dt>Status</dt><dd>{state?.status ?? "Not started"}</dd></div></dl>
              <Link className="btn primary" to={`/projects/${project.slug}`}>{action}<Icon name="arrow-right" size={16} /></Link>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state"><strong>No project matches these filters</strong><p>Clear one filter or search for a broader outcome.</p><button type="button" onClick={() => { setQuery(""); setDiscipline("All"); setDifficulty("All"); setStateFilter("All"); }}>Clear filters</button></div>}
    </section>
  );
}
