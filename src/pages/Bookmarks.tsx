import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { searchableCatalogue } from "../data/catalogue";

export function Bookmarks() {
  const { progress } = useProgress();
  const items = searchableCatalogue.filter((item) => {
    const type = item.type === "Laboratory" ? "lab" : item.type === "Pathway" ? "pathway" : item.type === "Project" ? "project" : "tool";
    return progress.bookmarks[`${type}:${item.id.replace(/^(lab|pathway|project)-/, "")}`];
  });
  return (
    <section className="page">
      <PageHeader eyebrow="Saved locally" title="Bookmarks" description="Keep useful learning, project, and tool destinations close without changing their progress." />
      <div className="simple-link-list">
        {items.map((item) => <Link key={item.id} to={item.route}><span><strong>{item.title}</strong><small>{item.description}</small></span><span className="badge">{item.type}</span></Link>)}
      </div>
      {items.length === 0 && <div className="empty-state"><strong>No bookmarks yet</strong><p>Use the bookmark control in Learn, Projects, or Tools.</p><Link className="btn" to="/learn">Explore learning</Link></div>}
    </section>
  );
}
