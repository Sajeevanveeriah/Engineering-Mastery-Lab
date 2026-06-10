import { Link } from "react-router-dom";
import { pathways } from "../data/pathways";

export function Pathways() {
  return (
    <div>
      <h1>Learning Pathways</h1>
      <p className="muted">
        Each pathway is an ordered route through the labs and the skills matrix. Work top to bottom; record evidence as
        you go.
      </p>
      <div className="grid grid-2">
        {pathways.map((p) => (
          <section className="card" key={p.id} aria-label={p.name}>
            <h2 style={{ marginTop: 0 }}>{p.name}</h2>
            <p className="small muted">{p.audience}</p>
            <ol style={{ paddingLeft: "1.2rem", margin: "0.4rem 0" }}>
              {p.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: "0.3rem" }}>
                  <Link to={s.route}>{s.label}</Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
