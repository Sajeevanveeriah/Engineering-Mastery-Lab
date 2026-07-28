import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

export function NotFoundPage() {
  return (
    <section className="page page--narrow">
      <PageHeader
        eyebrow="Route not found"
        title="That workspace view does not exist"
        description="The address may be old or incomplete. No progress data was changed."
      />
      <div className="card empty-state">
        <Icon name="pathways" size={32} />
        <h2>Return to a known route</h2>
        <p className="muted">Open Today to continue, or browse the complete learning catalogue.</p>
        <div className="button-row button-row--centre">
          <Link className="btn primary" to="/">
            Today
          </Link>
          <Link className="btn" to="/learn">
            Browse learning
          </Link>
        </div>
      </div>
    </section>
  );
}
