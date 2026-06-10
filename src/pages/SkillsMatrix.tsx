import { Link } from "react-router-dom";
import { skillDomains } from "../data/skills";
import { useProgress } from "../components/ProgressContext";

const priorityBadge: Record<string, { label: string; cls: string }> = {
  preserve: { label: "Strength — preserve", cls: "ok" },
  refresh: { label: "Priority refresh", cls: "warn" },
  build: { label: "New capability", cls: "" }
};

export function SkillsMatrix() {
  const { progress, update } = useProgress();

  const setRating = (id: string, level: number) =>
    update((p) => {
      p.skillRatings[id] = { level, evidence: p.skillRatings[id]?.evidence ?? "" };
      return p;
    });

  const setEvidence = (id: string, evidence: string) =>
    update((p) => {
      p.skillRatings[id] = { level: p.skillRatings[id]?.level ?? 0, evidence };
      return p;
    });

  return (
    <div>
      <h1>Skills Matrix</h1>
      <p className="muted">
        Rate yourself 0 (no exposure) to 5 (can teach it). A rating without evidence is a guess — link the artefact,
        commit, screenshot or report that proves it.
      </p>
      {skillDomains.map((d) => {
        const badge = priorityBadge[d.priority];
        return (
          <section className="card" key={d.id} style={{ marginBottom: "0.8rem" }} aria-label={d.name}>
            <h2 style={{ marginTop: 0 }}>
              {d.name} <span className={`badge ${badge.cls}`}>{badge.label}</span>
            </h2>
            <p className="small muted">{d.summary}</p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "9rem" }}>Level</th>
                  <th>Outcomes, practice & proof</th>
                  <th style={{ width: "8rem" }}>Self-rating</th>
                  <th style={{ width: "16rem" }}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {d.levels.map((lvl) => {
                  const r = progress.skillRatings[lvl.id];
                  return (
                    <tr key={lvl.id}>
                      <td>{lvl.name}</td>
                      <td>
                        <ul className="small" style={{ margin: "0 0 0.3rem", paddingLeft: "1.1rem" }}>
                          {lvl.outcomes.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                        <p className="small">
                          <strong>Practice:</strong> {lvl.practice}{" "}
                          {lvl.simulation && <Link to={lvl.simulation}>Open simulator</Link>}
                        </p>
                        <p className="small muted">
                          <strong>Proof artefact:</strong> {lvl.proofArtefact}
                        </p>
                      </td>
                      <td>
                        <select
                          aria-label={`Self rating for ${d.name} ${lvl.name}`}
                          value={r?.level ?? 0}
                          onChange={(e) => setRating(lvl.id, Number(e.target.value))}
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 0 ? "— unrated" : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`Evidence for ${d.name} ${lvl.name}`}
                          style={{ width: "100%" }}
                          placeholder="Link or description of proof"
                          value={r?.evidence ?? ""}
                          onChange={(e) => setEvidence(lvl.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
