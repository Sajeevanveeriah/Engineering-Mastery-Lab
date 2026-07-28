import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { bookmarkKey, toolPurposeGroups, toolsCatalogue } from "../data/catalogue";

export function ToolsHub() {
  const { progress, update } = useProgress();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return toolsCatalogue.filter((tool) => !term || `${tool.title} ${tool.description} ${tool.discipline} ${tool.keywords.join(" ")}`.toLocaleLowerCase("en-AU").includes(term));
  }, [query]);
  const recent = progress.recentItems.filter((item) => item.type === "tool").slice(0, 4);
  const favourites = toolsCatalogue.filter((tool) => progress.bookmarks[bookmarkKey("tool", tool.id)]);
  const openTool = (tool: typeof toolsCatalogue[number]) => update((current) => ({
    ...current,
    recentItems: [
      { id: tool.id, type: "tool" as const, title: tool.title, route: tool.route, visitedAt: new Date().toISOString() },
      ...current.recentItems.filter((item) => !(item.type === "tool" && item.id === tool.id))
    ].slice(0, 20)
  }));

  return (
    <section className="page tools-page">
      <PageHeader eyebrow="Engineering capability" title="Analyse" description="Choose a bounded tool by purpose without turning every calculator, reference, or workspace into global navigation." />
      <section className="analysis-entry" aria-labelledby="learning-analysis-entry-heading">
        <div><p className="eyebrow">Truthful curriculum metrics</p><h2 id="learning-analysis-entry-heading">Learning progress analysis</h2><p>Compare exposure, practice, evidence and mastery by stage, milestone and domain, with confidence kept separate from verified gates.</p></div>
        <Link className="btn primary" to="/tools/progress">Open progress analysis</Link>
      </section>
      <div className="learning-boundary" role="note">
        <strong>Runtime labels.</strong> Web and Desktop means the in-app capability is available in either runtime. Desktop requires the installed desktop app. These labels do not confirm that optional third-party tools are installed or that results are professionally validated.
      </div>
      <div className="filter-search tools-search"><Icon name="search" size={18} /><label className="sr-only" htmlFor="tools-search">Search tools</label><input id="tools-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by purpose, discipline, or capability" /></div>
      {(recent.length > 0 || favourites.length > 0) && <div className="tool-shelves">
        {favourites.length > 0 && <section><h2>Favourites</h2><div className="simple-link-list">{favourites.map((tool) => <Link key={tool.id} to={tool.route} onClick={() => openTool(tool)}><span><strong>{tool.title}</strong><small>{tool.description}</small></span><span className="badge">{tool.capability}</span></Link>)}</div></section>}
        {recent.length > 0 && <section><h2>Recent</h2><div className="simple-link-list">{recent.map((item) => <Link key={item.id} to={item.route}><span><strong>{item.title}</strong><small>Opened {new Date(item.visitedAt).toLocaleDateString("en-AU")}</small></span></Link>)}</div></section>}
      </div>}
      {toolPurposeGroups.map((group) => {
        const items = visible.filter((tool) => group.toolIds.includes(tool.id));
        if (items.length === 0) return null;
        const headingId = `tool-purpose-${group.id}`;
        return <section className="tool-group" key={group.id} aria-labelledby={headingId}><div className="section-heading section-heading--outside"><div><p className="eyebrow">Purpose</p><h2 id={headingId}>{group.title}</h2></div></div><div className="tool-grid">{items.map((tool) => {
          const favourite = Boolean(progress.bookmarks[bookmarkKey("tool", tool.id)]);
          return <article className="tool-card" key={tool.id}><div><span className="badge">{tool.capability}</span><button className="btn btn--quiet" type="button" aria-label={`${favourite ? "Remove" : "Add"} favourite for ${tool.title}`} aria-pressed={favourite} onClick={() => update((current) => ({ ...current, bookmarks: { ...current.bookmarks, [bookmarkKey("tool", tool.id)]: !favourite } }))}><Icon name={favourite ? "check" : "plus"} size={16} />{favourite ? "Remove from favourites" : "Add to favourites"}</button></div><h3>{tool.title}</h3><p>{tool.description}</p><small>{tool.discipline}</small><Link className="btn" to={tool.route} onClick={() => openTool(tool)}>Open tool</Link></article>;
        })}</div></section>;
      })}
      {visible.length === 0 && <div className="empty-state"><strong>No tool matches this search</strong><p>Try a calculation type, discipline, or capability label.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
    </section>
  );
}
