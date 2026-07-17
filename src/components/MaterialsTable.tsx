import { useMemo, useState } from "react";
import { engineeringMaterials } from "../data/materials";
import { Icon } from "./Icon";

export function MaterialsTable() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("All");
  const families = ["All", ...new Set(engineeringMaterials.map((material) => material.family))];
  const filtered = useMemo(() => engineeringMaterials.filter((material) => {
    const matchesFamily = family === "All" || material.family === family;
    const search = query.trim().toLowerCase();
    return matchesFamily && (!search || `${material.name} ${material.family} ${material.note}`.toLowerCase().includes(search));
  }), [family, query]);

  return (
    <section className="materials-reference" aria-labelledby="materials-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Indicative reference data</p>
          <h2 id="materials-heading">Engineering materials library</h2>
          <p>Use these values for early estimates only. Grade, temper, direction, temperature and processing can change them materially.</p>
        </div>
      </div>
      <div className="materials-toolbar">
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="sr-only">Search materials</span>
          <input type="search" placeholder="Search material or note" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="form-field">
          <span className="sr-only">Filter material family</span>
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            {families.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="table-scroll" tabIndex={0} aria-label="Engineering materials table">
        <table className="materials-table">
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col">Density<br /><small>kg/m3</small></th>
              <th scope="col">Elastic modulus<br /><small>GPa</small></th>
              <th scope="col">Yield<br /><small>MPa</small></th>
              <th scope="col">Thermal k<br /><small>W/m K</small></th>
              <th scope="col">CTE<br /><small>um/m K</small></th>
              <th scope="col">Design note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((material) => (
              <tr key={material.id}>
                <th scope="row"><strong>{material.name}</strong><small>{material.family}</small></th>
                <td>{material.density}</td>
                <td>{material.elasticModulus}</td>
                <td>{material.yieldStrength ?? "Grade-specific"}</td>
                <td>{material.thermalConductivity}</td>
                <td>{material.expansionCoefficient}</td>
                <td>{material.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="compact-empty">No materials match this filter.</p>}
    </section>
  );
}
