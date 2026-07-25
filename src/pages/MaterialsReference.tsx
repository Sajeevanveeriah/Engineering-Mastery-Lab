import { useState } from "react";
import { PageHeader } from "../components/PageHeader";

const materials = [
  { name: "Aluminium alloy, general reference", density: "2,700 kg/m3", modulus: "69 GPa", note: "Properties vary materially by alloy and temper." },
  { name: "Mild steel, general reference", density: "7,850 kg/m3", modulus: "200 GPa", note: "Strength depends on grade, condition, thickness, and standard." },
  { name: "Stainless steel, austenitic reference", density: "8,000 kg/m3", modulus: "193 GPa", note: "Use the specified grade and product form for design." },
  { name: "ABS polymer, indicative", density: "1,040 kg/m3", modulus: "1.5-2.5 GPa", note: "Temperature, print process, and orientation strongly affect behaviour." },
  { name: "PLA polymer, indicative", density: "1,240 kg/m3", modulus: "2.5-3.5 GPa", note: "Printed-part properties are process and orientation dependent." },
  { name: "Plywood, indicative", density: "500-700 kg/m3", modulus: "6-12 GPa", note: "Anisotropic and highly dependent on grade, layup, and moisture." }
];

export function MaterialsReference() {
  const [query, setQuery] = useState("");
  const visible = materials.filter((item) => item.name.toLocaleLowerCase("en-AU").includes(query.toLocaleLowerCase("en-AU")));
  return (
    <section className="page">
      <PageHeader eyebrow="Indicative local reference" title="Materials reference" description="Use these broad values for early learning comparisons only, then replace them with grade-specific, condition-specific primary data." />
      <div className="filter-search"><label htmlFor="materials-search">Search materials</label><input id="materials-search" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="table-scroll" tabIndex={0} aria-label="Indicative materials properties"><table><thead><tr><th scope="col">Material</th><th scope="col">Density</th><th scope="col">Elastic modulus</th><th scope="col">Boundary</th></tr></thead><tbody>{visible.map((material) => <tr key={material.name}><th scope="row">{material.name}</th><td>{material.density}</td><td>{material.modulus}</td><td>{material.note}</td></tr>)}</tbody></table></div>
      <div className="safety-note"><p><strong>Engineering boundary.</strong> Values are indicative ranges, not design allowables, specifications, or certificates. Verify the exact material grade, condition, product form, temperature, manufacturing process, and governing standard.</p></div>
    </section>
  );
}
