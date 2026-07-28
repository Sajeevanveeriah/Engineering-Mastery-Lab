import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey, type ProgressItemTypeForBookmark } from "../data/catalogue";
import { displayDiscipline } from "../data/displayLabels";
import { flagshipCatalogue } from "../data/engineeringExperiences";
import { modules } from "../data/modules";
import { pathways, type Difficulty } from "../data/pathways";
import { skillDomains } from "../data/skills";
import { moduleProgress, overallProgress } from "../lib/metrics";

type Format = "All" | "Pathway" | "Laboratory" | "Skill";
type LearningObjectFormat = Exclude<Format, "All">;

interface LearningObject {
  id: string;
  title: string;
  description: string;
  format: LearningObjectFormat;
  difficulty?: Difficulty;
  disciplines: string[];
  detail: string;
  route: string;
  progress: number;
  bookmarkType: ProgressItemTypeForBookmark;
}

const formatTabs: Array<{ value: Format; label: string }> = [
  { value: "All", label: "Discover" },
  { value: "Pathway", label: "Pathways" },
  { value: "Laboratory", label: "Laboratories" },
  { value: "Skill", label: "Skills" }
];

function actionLabel(item: LearningObject): string {
  if (item.format === "Pathway") {
    if (item.progress >= 100) return "Review pathway";
    if (item.progress > 0) return "Continue pathway";
    return "Start pathway";
  }
  if (item.format === "Laboratory") {
    if (item.progress >= 100) return "Review laboratory";
    if (item.progress > 0) return "Continue laboratory";
    return "Open laboratory";
  }
  if (item.progress >= 100) return "Review skills";
  if (item.progress > 0) return "Continue assessment";
  return "Assess skills";
}

function progressLabel(item: LearningObject): string {
  if (item.format === "Pathway") return `${item.progress}% of pathway steps recorded`;
  if (item.format === "Laboratory") return `${item.progress}% of laboratory evidence recorded`;
  return `${item.progress}% of skill levels rated`;
}

export function LearnHub({ initialFormat = "All" }: { initialFormat?: Format }) {
  const { progress, update } = useProgress();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<Format>(initialFormat);
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [discipline, setDiscipline] = useState("All");
  const mastery = overallProgress(progress);
  const completedPathways = pathways.filter((pathway) => progress.pathways[pathway.id]?.status === "completed").length;

  const catalogueItems = useMemo<LearningObject[]>(() => [
    ...pathways.map((pathway): LearningObject => {
      const state = progress.pathways[pathway.id];
      const completedSteps = pathway.steps.filter((step) => state?.completedStepIds.includes(step.id)).length;
      return {
        id: pathway.id,
        title: pathway.name,
        description: pathway.purpose,
        format: "Pathway",
        difficulty: pathway.difficulty,
        disciplines: pathway.disciplines,
        detail: `${pathway.effortHours} indicative hours`,
        route: `/learn/pathways/${pathway.id}`,
        progress: pathway.steps.length === 0 ? 0 : Math.round((completedSteps / pathway.steps.length) * 100),
        bookmarkType: "pathway"
      };
    }),
    ...modules.map((module): LearningObject => {
      const state = moduleProgress(progress, module);
      return {
        id: module.id,
        title: module.title,
        description: module.learn[0],
        format: "Laboratory",
        disciplines: [displayDiscipline(module.domainId)],
        detail: `${state.done}/${state.total} evidence milestones recorded`,
        route: `/learn/labs/${module.id}`,
        progress: state.percent,
        bookmarkType: "lab"
      };
    }),
    ...skillDomains.map((domain): LearningObject => {
      const ratedLevels = domain.levels.filter((level) => (progress.skillRatings[level.id]?.level ?? 0) > 0).length;
      return {
        id: domain.id,
        title: domain.name,
        description: `Assess evidence across ${domain.levels.map((level) => level.name).join(", ")} capability levels.`,
        format: "Skill",
        disciplines: [domain.name],
        detail: `${ratedLevels}/${domain.levels.length} capability levels rated`,
        route: `/learn/skills?domain=${domain.id}`,
        progress: domain.levels.length === 0 ? 0 : Math.round((ratedLevels / domain.levels.length) * 100),
        bookmarkType: "skill"
      };
    })
  ], [progress]);

  const disciplineOptions = useMemo(() => {
    const relevant = format === "All"
      ? catalogueItems
      : catalogueItems.filter((item) => item.format === format);
    return [...new Set(relevant.flatMap((item) => item.disciplines))].sort((left, right) =>
      left.localeCompare(right, "en-AU")
    );
  }, [catalogueItems, format]);

  const items = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return catalogueItems.filter((item) =>
      (format === "All" || item.format === format)
      && (difficulty === "All" || item.difficulty === difficulty)
      && (discipline === "All" || item.disciplines.includes(discipline))
      && (!term || `${item.title} ${item.description} ${item.format} ${item.disciplines.join(" ")}`
        .toLocaleLowerCase("en-AU")
        .includes(term))
    );
  }, [catalogueItems, difficulty, discipline, format, query]);

  const isBookmarked = (item: LearningObject) =>
    Boolean(
      progress.bookmarks[bookmarkKey(item.bookmarkType, item.id)]
      || (item.format === "Skill" && progress.bookmarks[bookmarkKey("tool", item.id)])
    );

  const toggleBookmark = (item: LearningObject) => {
    const bookmarked = isBookmarked(item);
    const key = bookmarkKey(item.bookmarkType, item.id);
    update((state) => {
      const bookmarks = { ...state.bookmarks, [key]: !bookmarked };
      if (item.format === "Skill" && bookmarked) bookmarks[bookmarkKey("tool", item.id)] = false;
      return { ...state, bookmarks };
    });
  };

  const selectFormat = (nextFormat: Format) => {
    setFormat(nextFormat);
    setDifficulty("All");
    setDiscipline("All");
  };

  const emptyObjectLabel = format === "All"
    ? "learning object"
    : format === "Pathway"
      ? "pathway"
      : format === "Laboratory"
        ? "laboratory"
        : "skill domain";

  return (
    <section className="page catalogue-page">
      <PageHeader
        eyebrow="Structured discovery"
        title="Learn"
        description="Follow the complete engineering curriculum, use the accelerated Robotics and AI/ML Reboot, or discover focused pathways, laboratories and evidence-led skills."
      />

      <section className="curriculum-entry-grid" aria-label="Curriculum entry points">
        <Link to="/learn/roadmap">
          <span className="badge">E0-E4</span>
          <h2>Complete curriculum</h2>
          <p>Twenty-five prerequisite-aware domains from engineering starter knowledge to R&D proof.</p>
          <strong>Open roadmap <Icon name="arrow-right" size={16} /></strong>
        </Link>
        <Link to="/learn/reboot">
          <span className="badge">S001-S110</span>
          <h2>Robotics and AI/ML Reboot</h2>
          <p>The authoritative 45 h 50 min fast-track, diagnostics and four rover releases.</p>
          <strong>Open fast-track <Icon name="arrow-right" size={16} /></strong>
        </Link>
        <Link to="/learn/diagnostics">
          <span className="badge">10 practical checks</span>
          <h2>Diagnostics</h2>
          <p>Use evidence to identify gaps. Passing can skip lessons, never proof sessions.</p>
          <strong>Run diagnostics <Icon name="arrow-right" size={16} /></strong>
        </Link>
        <Link to="/learn/resources">
          <span className="badge">64 sources</span>
          <h2>Resource library</h2>
          <p>Original provenance, authority labels and separate version-sensitive revalidation dates.</p>
          <strong>Browse resources <Icon name="arrow-right" size={16} /></strong>
        </Link>
      </section>

      <section className="home-proof" aria-labelledby="mastery-overview-heading">
        <div>
          <p className="eyebrow">Mastery overview</p>
          <h2 id="mastery-overview-heading">Recorded learning</h2>
          <p>These values summarise local records. They are not accreditation or professional certification.</p>
        </div>
        <dl>
          <div><dt>Learning record</dt><dd>{mastery.percent}%</dd></div>
          <div><dt>Laboratories complete</dt><dd>{mastery.completedModules}/{mastery.totalModules}</dd></div>
          <div><dt>Skill levels rated</dt><dd>{mastery.ratedSkills}/{mastery.totalSkills}</dd></div>
          <div><dt>Pathways complete</dt><dd>{completedPathways}/{pathways.length}</dd></div>
        </dl>
        <Link className="btn" to="/learn/skills">Review skills</Link>
      </section>

      <section aria-labelledby="flagship-workflows-heading">
        <div className="section-heading section-heading--outside">
          <div>
            <p className="eyebrow">End-to-end depth</p>
            <h2 id="flagship-workflows-heading">Flagship engineering workflows</h2>
          </div>
        </div>
        <p>Each workflow connects verified equations, a deterministic model, diagnosis, a Build application, a kernel-backed record, and portfolio evidence. Educational results require independent engineering review before physical use.</p>
        <div className="simple-link-list">
          {flagshipCatalogue.map((item) => (
            <Link key={item.id} to={item.route}>
              <span><strong>{item.title}</strong><small>{item.summary}</small></span>
              <span className="badge">{item.disciplines.join(" and ")}</span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="hub-tabs" aria-label="Learn sections">
        {formatTabs.map((item) => (
          <button
            key={item.value}
            className={format === item.value ? "active" : ""}
            type="button"
            aria-pressed={format === item.value}
            onClick={() => selectFormat(item.value)}
          >
            {item.label}
          </button>
        ))}
        <Link to="/learn/bookmarks">Bookmarks</Link>
      </nav>

      <div className="catalogue-filters">
        <div className="filter-search">
          <Icon name="search" size={18} />
          <label className="sr-only" htmlFor="learn-search">Search learning catalogue</label>
          <input id="learn-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by outcome, object, or discipline" />
        </div>
        <label>
          {format === "Skill" ? "Skill domain" : "Discipline"}
          <select value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
            <option>All</option>
            {disciplineOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {format === "Pathway" && (
          <label>
            Pathway level
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
              <option>All</option>
              <option>Foundation</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
        )}
      </div>

      <p className="results-count" role="status">{items.length} {items.length === 1 ? "result" : "results"}</p>
      <div className="catalogue-list">
        {items.map((item) => {
          const bookmarked = isBookmarked(item);
          return (
            <article key={`${item.format}-${item.id}`} className="catalogue-row">
              <div className="catalogue-row__type">
                <span>{item.format}</span>
                <small>{item.disciplines.join(", ")}</small>
              </div>
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="catalogue-row__meta">
                  {item.difficulty && <span>{item.difficulty}</span>}
                  <span>{item.detail}</span>
                  <span>{progressLabel(item)}</span>
                </div>
              </div>
              <div className="catalogue-row__actions">
                <button
                  className="btn"
                  type="button"
                  aria-label={`${bookmarked ? "Remove" : "Add"} bookmark for ${item.title}`}
                  aria-pressed={bookmarked}
                  onClick={() => toggleBookmark(item)}
                >
                  <Icon name={bookmarked ? "check" : "plus"} size={16} />
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <Link className="btn primary" to={item.route}>{actionLabel(item)}</Link>
              </div>
            </article>
          );
        })}
        {items.length === 0 && (
          <div className="empty-state">
            <strong>No {emptyObjectLabel} matches these filters</strong>
            <p>Clear one filter or try a broader outcome or discipline.</p>
            <button type="button" onClick={() => { setQuery(""); selectFormat("All"); }}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}
