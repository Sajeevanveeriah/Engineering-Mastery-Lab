import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { searchableCatalogue } from "../data/catalogue";

export function Bookmarks() {
  const { progress } = useProgress();
  const items = searchableCatalogue.filter((item) => {
    if (item.type === "Skill") {
      const domainId = item.id.replace(/^skill-/, "");
      return Boolean(
        progress.bookmarks[`skill:${domainId}`]
        || progress.bookmarks[`tool:${domainId}`]
        || progress.bookmarks[`tool:${item.id}`]
      );
    }
    const type = item.type === "Laboratory"
      ? "lab"
      : item.type === "Pathway"
        ? "pathway"
        : item.type === "Project"
          ? "project"
          : "tool";
    const id = item.id.replace(/^(lab|pathway|project)-/, "");
    return Boolean(progress.bookmarks[`${type}:${id}`]);
  });
  return (
    <section className="page">
      <PageHeader eyebrow="Saved locally" title="Bookmarks" description="Keep useful learning, project, and tool destinations close without changing their progress." />
      <div className="simple-link-list">
        {items.map((item) => <Link key={item.id} to={item.route}><span><strong>{item.title}</strong><small>{item.description}</small></span><span className="badge">{item.type}</span></Link>)}
      </div>
      {items.length === 0 && <div className="empty-state"><strong>No bookmarks yet</strong><p>Use the bookmark control in Learn, Build, or Analyse.</p><Link className="btn" to="/learn">Explore learning</Link></div>}
    </section>
  );
}
