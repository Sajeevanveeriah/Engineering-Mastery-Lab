import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { skillDomains, type SkillDomain } from "../data/skills";
import { domainScores, overallProgress } from "../lib/metrics";

const priorityBadge: Record<SkillDomain["priority"], { label: string; cls: string }> = {
  preserve: { label: "Preserve strength", cls: "ok" },
  refresh: { label: "Priority refresh", cls: "warn" },
  build: { label: "Build capability", cls: "info" }
};

type PriorityFilter = "all" | SkillDomain["priority"];

export function SkillsMatrix() {
  const { progress, update } = useProgress();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([skillDomains[0]?.id]));
  const summary = overallProgress(progress);
  const scoreMap = useMemo(() => new Map(domainScores(progress).map((score) => [score.domainId, score])), [progress]);

  const visibleDomains = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return skillDomains.filter((domain) => {
      if (priority !== "all" && domain.priority !== priority) return false;
      if (!needle) return true;
      const searchable = [
        domain.name,
        domain.summary,
        ...domain.levels.flatMap((level) => [level.name, level.practice, level.proofArtefact, ...level.outcomes])
      ].join(" ").toLowerCase();
      return searchable.includes(needle);
    });
  }, [priority, query]);

  const setRating = (id: string, level: number) => update((state) => ({
    ...state,
    skillRatings: {
      ...state.skillRatings,
      [id]: { level, evidence: state.skillRatings[id]?.evidence ?? "" }
    }
  }));

  const setEvidence = (id: string, evidence: string) => update((state) => ({
    ...state,
    skillRatings: {
      ...state.skillRatings,
      [id]: { level: state.skillRatings[id]?.level ?? 0, evidence }
    }
  }));

  const toggleDomain = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="page skills-page">
      <PageHeader
        eyebrow="Evidence-led self-assessment"
        title="Skills matrix"
        description="Rate capability from 0 to 5, then attach the artefact that proves the rating. Use filters to focus on strengths to preserve, refresh priorities or deliberate build areas."
        meta={<span>{summary.ratedSkills} of {summary.totalSkills} skill levels rated</span>}
      />

      <div className="skills-toolbar" role="search" aria-label="Filter the skills matrix">
        <div className="search-field">
          <Icon name="search" size={18} />
          <label className="sr-only" htmlFor="skill-search">Search skills</label>
          <input id="skill-search" type="search" value={query} placeholder="Search domains, outcomes or practice tasks" onChange={(event) => setQuery(event.target.value)} />
          {query && <button className="icon-button" type="button" aria-label="Clear skill search" onClick={() => setQuery("")}><Icon name="close" size={17} /></button>}
        </div>
        <div className="filter-field">
          <label htmlFor="priority-filter">Priority</label>
          <select id="priority-filter" value={priority} onChange={(event) => setPriority(event.target.value as PriorityFilter)}>
            <option value="all">All priorities</option>
            <option value="preserve">Preserve strength</option>
            <option value="refresh">Priority refresh</option>
            <option value="build">Build capability</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn btn--quiet" type="button" onClick={() => setExpanded(new Set(visibleDomains.map((domain) => domain.id)))}>Expand shown</button>
          <button className="btn btn--quiet" type="button" onClick={() => setExpanded(new Set())}>Collapse all</button>
        </div>
      </div>

      <div className="matrix-summary" aria-live="polite">
        <span>Showing {visibleDomains.length} of {skillDomains.length} domains</span>
        <span>Changes save automatically in this browser</span>
      </div>

      <div className="skill-domain-list">
        {visibleDomains.map((domain) => {
          const badge = priorityBadge[domain.priority];
          const score = scoreMap.get(domain.id)!;
          const isOpen = expanded.has(domain.id) || Boolean(query.trim());
          const evidenceCount = domain.levels.filter((level) => progress.skillRatings[level.id]?.evidence.trim()).length;
          return (
            <section className={`skill-domain${isOpen ? " skill-domain--open" : ""}`} key={domain.id} aria-labelledby={`${domain.id}-heading`}>
              <button className="skill-domain__toggle" type="button" aria-expanded={isOpen} aria-controls={`${domain.id}-content`} onClick={() => toggleDomain(domain.id)}>
                <div className="skill-domain__identity">
                  <span className="skill-domain__score">{score.score}%</span>
                  <div>
                    <div className="skill-domain__titleline">
                      <h2 id={`${domain.id}-heading`}>{domain.name}</h2>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p>{domain.summary}</p>
                  </div>
                </div>
                <div className="skill-domain__status">
                  <span>{score.ratedSkills}/{score.totalSkills} rated</span>
                  <span>{evidenceCount}/{domain.levels.length} evidenced</span>
                  <Icon name="chevron" size={20} />
                </div>
              </button>

              <div id={`${domain.id}-content`} hidden={!isOpen} className="skill-domain__content">
                <div className="skill-level-grid">
                  {domain.levels.map((level) => {
                    const rating = progress.skillRatings[level.id];
                    return (
                      <article className="skill-level-card" key={level.id}>
                        <div className="skill-level-card__header">
                          <div><span className="eyebrow">Capability level</span><h3>{level.name}</h3></div>
                          {rating?.level ? <span className="rating-chip">{rating.level}/5</span> : <span className="badge">Unrated</span>}
                        </div>
                        <div className="skill-level-card__body">
                          <div>
                            <h4>Outcomes</h4>
                            <ul>{level.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                          </div>
                          <div className="practice-block">
                            <h4>Practice task</h4>
                            <p>{level.practice}</p>
                            {level.simulation && <Link to={level.simulation}>Open linked simulator <Icon name="arrow-right" size={15} /></Link>}
                          </div>
                          <div className="proof-block">
                            <h4>Expected proof</h4>
                            <p>{level.proofArtefact}</p>
                          </div>
                        </div>
                        <div className="skill-level-card__inputs">
                          <div className="form-field">
                            <label htmlFor={`${level.id}-rating`}>Self-rating</label>
                            <select id={`${level.id}-rating`} value={rating?.level ?? 0} onChange={(event) => setRating(level.id, Number(event.target.value))}>
                              <option value={0}>0 · No evidence yet</option>
                              <option value={1}>1 · Aware</option>
                              <option value={2}>2 · Guided practice</option>
                              <option value={3}>3 · Independent</option>
                              <option value={4}>4 · Advanced delivery</option>
                              <option value={5}>5 · Can teach and review</option>
                            </select>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`${level.id}-evidence`}>Evidence link or description</label>
                            <textarea
                              id={`${level.id}-evidence`}
                              rows={2}
                              placeholder="Report, calculation, test record, commit or screenshot"
                              value={rating?.evidence ?? ""}
                              onChange={(event) => setEvidence(level.id, event.target.value)}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {visibleDomains.length === 0 && (
        <div className="card empty-state">
          <Icon name="search" size={30} />
          <h2>No matching skills</h2>
          <p className="muted">Change the search or priority filter to show more domains.</p>
          <button className="btn" type="button" onClick={() => { setQuery(""); setPriority("all"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
