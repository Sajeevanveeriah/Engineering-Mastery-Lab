import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import { pathways } from "../data/pathways";
import { projects } from "../data/projects";
import { toolsCatalogue } from "../data/catalogue";
import { artefactCount, challengePassCount, moduleProgress, overallProgress } from "../lib/metrics";

export function Home() {
  const { progress } = useProgress();
  const overall = overallProgress(progress);
  const evidence = artefactCount(progress);
  const recommendedPathway = pathways.find((item) => item.id === progress.profile?.recommendedPathwayId) ?? pathways[0];
  const latest = progress.recentItems[0];
  const firstIncomplete = modules.find((module) => moduleProgress(progress, module).percent < 100) ?? modules[0];
  const continueTarget = latest ?? {
    id: firstIncomplete.id,
    type: "lab" as const,
    title: firstIncomplete.title,
    route: `/learn/labs/${firstIncomplete.id}`,
    visitedAt: ""
  };
  const activeProjectEntry = Object.entries(progress.projects).find(([, state]) => state.status === "active");
  const activeProject = activeProjectEntry ? projects.find((item) => item.id === activeProjectEntry[0]) : undefined;
  const recentTools = progress.recentItems
    .filter((item) => item.type === "tool")
    .map((item) => toolsCatalogue.find((tool) => tool.id === item.id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);
  const isNew = overall.done === 0 && Object.keys(progress.projects).length === 0 && progress.recentItems.length === 0;

  return (
    <section className="page product-home">
      <PageHeader
        eyebrow={progress.profile ? `Local profile${progress.profile.displayName ? ` - ${progress.profile.displayName}` : ""}` : "Guest mode"}
        title={isNew ? "Build capability you can prove" : "Continue where the evidence leads"}
        description="Structured laboratories, practical projects, and engineering evidence in one focused local learning studio."
        actions={<button className="btn btn--ghost" type="button" onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}><Icon name="search" size={17} /> Find anything</button>}
      />

      <section className="home-continue" aria-labelledby="continue-heading">
        <div>
          <p className="eyebrow">What should I do next?</p>
          <h2 id="continue-heading">{isNew ? recommendedPathway.name : continueTarget.title}</h2>
          <p>{isNew ? recommendedPathway.purpose : `Resume your exact last meaningful ${continueTarget.type} location.`}</p>
          <div className="button-row">
            <Link className="btn primary" to={isNew ? `/learn/pathways/${recommendedPathway.id}` : continueTarget.route}>
              {isNew ? "Open recommended pathway" : "Continue"} <Icon name="arrow-right" size={17} />
            </Link>
            {!isNew && <Link className="btn" to="/learn">Explore learning</Link>}
          </div>
        </div>
        <div className="home-continue__metric">
          <strong>{overall.percent}%</strong>
          <span>recorded learning progress</span>
        </div>
      </section>

      <div className="home-question-grid">
        <section aria-labelledby="current-journey-heading">
          <div className="section-heading section-heading--outside"><div><p className="eyebrow">Where am I heading?</p><h2 id="current-journey-heading">Current pathway</h2></div><Link to="/learn/pathways">All pathways</Link></div>
          <article className="bounded-object">
            <span className="badge">{recommendedPathway.difficulty}</span>
            <h3>{recommendedPathway.name}</h3>
            <p>{recommendedPathway.outcomes[0]}</p>
            <dl className="inline-facts"><div><dt>Effort</dt><dd>{recommendedPathway.effortHours} h</dd></div><div><dt>Steps</dt><dd>{recommendedPathway.steps.length}</dd></div></dl>
            <Link to={`/learn/pathways/${recommendedPathway.id}`}>View pathway <Icon name="arrow-right" size={15} /></Link>
          </article>
        </section>
        <section aria-labelledby="active-project-heading">
          <div className="section-heading section-heading--outside"><div><p className="eyebrow">What am I applying?</p><h2 id="active-project-heading">Active project</h2></div><Link to="/projects">Project catalogue</Link></div>
          {activeProject ? (
            <article className="bounded-object"><span className="badge">{activeProject.difficulty}</span><h3>{activeProject.title}</h3><p>{activeProject.summary}</p><Link to={`/projects/${activeProject.slug}`}>Resume project <Icon name="arrow-right" size={15} /></Link></article>
          ) : (
            <div className="empty-state"><strong>No active project yet</strong><p>Choose a brief when you are ready to turn learning into evidence.</p><Link className="btn" to="/projects">Find a project</Link></div>
          )}
        </section>
      </div>

      <section className="home-proof" aria-labelledby="proof-heading">
        <div><p className="eyebrow">What have I proved?</p><h2 id="proof-heading">Evidence snapshot</h2><p>These counts reflect recorded work, not accreditation or professional certification.</p></div>
        <dl>
          <div><dt>Passed challenges</dt><dd>{challengePassCount(progress)}</dd></div>
          <div><dt>Checked artefacts</dt><dd>{evidence.done}</dd></div>
          <div><dt>Rated skills</dt><dd>{overall.ratedSkills}</dd></div>
          <div><dt>Completed projects</dt><dd>{Object.values(progress.projects).filter((project) => project.status === "completed").length}</dd></div>
        </dl>
        <Link className="btn" to="/portfolio">Open portfolio</Link>
      </section>

      <section aria-labelledby="tools-heading">
        <div className="section-heading section-heading--outside"><div><p className="eyebrow">What can help right now?</p><h2 id="tools-heading">{recentTools.length ? "Recent tools" : "Featured tools"}</h2></div><Link to="/tools">All tools</Link></div>
        <div className="simple-link-list">
          {(recentTools.length ? recentTools : toolsCatalogue.slice(0, 3)).map((tool) => (
            <Link key={tool.id} to={tool.route}><span><strong>{tool.title}</strong><small>{tool.description}</small></span><span className="badge">{tool.capability}</span></Link>
          ))}
        </div>
      </section>
    </section>
  );
}
