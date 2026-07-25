import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey } from "../data/catalogue";
import { modules } from "../data/modules";
import { pathways, type Difficulty } from "../data/pathways";
import { skillDomains } from "../data/skills";
import { moduleProgress } from "../lib/metrics";

type Format = "All" | "Pathway" | "Laboratory" | "Skill";

export function LearnHub({ initialFormat = "All" }: { initialFormat?: Format }) {
  const { progress, update } = useProgress();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<Format>(initialFormat);
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [discipline, setDiscipline] = useState("All");
  const disciplines = [...new Set(pathways.flatMap((pathway) => pathway.disciplines))].sort();

  const items = useMemo(() => {
    const all = [
      ...pathways.map((pathway) => ({
        id: pathway.id,
        title: pathway.name,
        description: pathway.purpose,
        format: "Pathway" as const,
        difficulty: pathway.difficulty,
        discipline: pathway.disciplines.join(", "),
        duration: `${pathway.effortHours} h`,
        route: `/learn/pathways/${pathway.id}`,
        progress: progress.pathways[pathway.id]?.status === "completed" ? 100 :
          Math.round(((progress.pathways[pathway.id]?.completedStepIds.length ?? 0) / pathway.steps.length) * 100)
      })),
      ...modules.map((module) => {
        const state = moduleProgress(progress, module);
        return {
          id: module.id,
          title: module.title,
          description: module.learn[0],
          format: "Laboratory" as const,
          difficulty: "Intermediate" as const,
          discipline: module.domainId,
          duration: "2-4 h",
          route: `/learn/labs/${module.id}`,
          progress: state.percent
        };
      }),
      ...skillDomains.map((domain) => ({
        id: domain.id,
        title: domain.name,
        description: `Assess ${domain.levels.length} evidence-led capability levels.`,
        format: "Skill" as const,
        difficulty: "Foundation" as const,
        discipline: domain.name,
        duration: "15 min",
        route: `/learn/skills?domain=${domain.id}`,
        progress: Math.round((domain.levels.filter((level) => (progress.skillRatings[level.id]?.level ?? 0) > 0).length / domain.levels.length) * 100)
      }))
    ];
    const term = query.trim().toLocaleLowerCase("en-AU");
    return all.filter((item) =>
      (format === "All" || item.format === format) &&
      (difficulty === "All" || item.difficulty === difficulty) &&
      (discipline === "All" || item.discipline.toLocaleLowerCase("en-AU").includes(discipline.toLocaleLowerCase("en-AU"))) &&
      (!term || `${item.title} ${item.description} ${item.discipline}`.toLocaleLowerCase("en-AU").includes(term))
    );
  }, [difficulty, discipline, format, progress, query]);

  const toggleBookmark = (item: typeof items[number]) => {
    const type = item.format === "Pathway" ? "pathway" : item.format === "Laboratory" ? "lab" : "tool";
    const key = bookmarkKey(type, item.id);
    update((state) => ({ ...state, bookmarks: { ...state.bookmarks, [key]: !state.bookmarks[key] } }));
  };

  return (
    <section className="page catalogue-page">
      <PageHeader eyebrow="Structured discovery" title="Learn" description="Choose a coherent pathway, focused laboratory, or evidence-led skill. Filters change discovery only - they never change your records." />
      <nav className="hub-tabs" aria-label="Learn sections">
        {(["All", "Pathway", "Laboratory", "Skill"] as Format[]).map((item) => <button key={item} className={format === item ? "active" : ""} type="button" aria-pressed={format === item} onClick={() => setFormat(item)}>{item === "All" ? "Discover" : `${item}s`}</button>)}
        <Link to="/learn/bookmarks">Bookmarks</Link>
      </nav>
      <div className="catalogue-filters">
        <div className="filter-search"><Icon name="search" size={18} /><label className="sr-only" htmlFor="learn-search">Search learning catalogue</label><input id="learn-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by outcome or discipline" /></div>
        <label>Discipline<select value={discipline} onChange={(event) => setDiscipline(event.target.value)}><option>All</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option>All</option><option>Foundation</option><option>Intermediate</option><option>Advanced</option></select></label>
      </div>
      <p className="results-count" role="status">{items.length} learning options</p>
      <div className="catalogue-list">
        {items.map((item) => {
          const type = item.format === "Pathway" ? "pathway" : item.format === "Laboratory" ? "lab" : "tool";
          const bookmarked = Boolean(progress.bookmarks[bookmarkKey(type, item.id)]);
          const state = item.progress >= 100 ? "Review" : item.progress > 0 ? "Continue" : "Start";
          return (
            <article key={`${item.format}-${item.id}`} className="catalogue-row">
              <div className="catalogue-row__type"><span>{item.format}</span><small>{item.discipline}</small></div>
              <div><h2>{item.title}</h2><p>{item.description}</p><div className="catalogue-row__meta"><span>{item.difficulty}</span><span>{item.duration}</span><span>{item.progress}% recorded</span></div></div>
              <div className="catalogue-row__actions">
                <button className="icon-button" type="button" aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${item.title}`} aria-pressed={bookmarked} onClick={() => toggleBookmark(item)}><Icon name={bookmarked ? "check" : "plus"} /></button>
                <Link className="btn primary" to={item.route}>{state}</Link>
              </div>
            </article>
          );
        })}
        {items.length === 0 && <div className="empty-state"><strong>No learning option matches these filters</strong><p>Clear one filter or try a broader outcome.</p><button type="button" onClick={() => { setQuery(""); setFormat("All"); setDifficulty("All"); setDiscipline("All"); }}>Clear filters</button></div>}
      </div>
    </section>
  );
}
