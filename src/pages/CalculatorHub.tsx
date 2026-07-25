import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { toolsCatalogue } from "../data/catalogue";

export function CalculatorHub() {
  const calculators = toolsCatalogue.filter((tool) => tool.type === "Calculator");
  return (
    <section className="page">
      <PageHeader eyebrow="Existing engineering models" title="Engineering calculators" description="Open the preserved validated calculators inside their learning context, where assumptions, challenge criteria, and evidence requirements remain visible." />
      <div className="simple-link-list">{calculators.map((tool) => <Link key={tool.id} to={tool.route}><span><strong>{tool.title}</strong><small>{tool.description}</small></span><span className="badge">{tool.discipline}</span></Link>)}</div>
      <div className="safety-note safety-note--neutral"><p><strong>Calculation boundary.</strong> These simplified educational models support learning and checking. They do not replace independently verified engineering calculations, ratings, standards, or professional judgement.</p></div>
    </section>
  );
}
