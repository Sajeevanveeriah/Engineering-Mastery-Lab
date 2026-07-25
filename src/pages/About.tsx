import { PageHeader } from "../components/PageHeader";

export function About() {
  return (
    <section className="page narrow-page">
      <PageHeader eyebrow="Product and trust" title="About Engineering Mastery Lab" description="Build, simulate, and prove real engineering capability through structured local learning." />
      <section className="prose"><h2>Product purpose</h2><p>Engineering Mastery Lab combines guided laboratories, practical project briefs, tools, and learner-generated evidence. Project Workbench remains an advanced desktop tool inside the product.</p><h2>Current runtime</h2><p>The same React and TypeScript application runs as a static GitHub Pages web application and in a Tauri desktop shell. Local progress does not require an account.</p><h2>Engineering boundary</h2><p>Simulations, calculations, references, completion records, and evidence exports are educational. They do not establish accreditation, standards compliance, professional licensure, or certified engineering validity.</p><h2>Open-source licence</h2><p>The repository is licensed under MIT. The licence permits reuse, modification, distribution, and commercial use subject to its terms. This is a product statement, not legal advice.</p></section>
    </section>
  );
}
