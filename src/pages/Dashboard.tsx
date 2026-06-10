import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../components/ProgressContext";
import { domainScores, recommendedDomain, challengePassCount, artefactCount } from "../lib/metrics";
import { exportProgress, importProgress } from "../lib/storage";
import { modules } from "../data/modules";

const sprintItems = [
  { id: "sprint-sim", label: "Complete one simulation session (any lab)" },
  { id: "sprint-challenge", label: "Pass one challenge with honest verification" },
  { id: "sprint-evidence", label: "Produce one portfolio artefact" },
  { id: "sprint-rate", label: "Update one skill self-rating with evidence" },
  { id: "sprint-reflect", label: "Write one reflection" },
  { id: "sprint-build", label: "Spend 1+ hour on a Build mini project" }
];

export function Dashboard() {
  const { progress, update, replace } = useProgress();
  const scores = domainScores(progress);
  const rec = recommendedDomain(progress);
  const passes = challengePassCount(progress);
  const artefacts = artefactCount(progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const recModule = rec ? modules.find((m) => m.domainId === rec.domainId) : undefined;

  const doExport = () => {
    const blob = new Blob([exportProgress(progress)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engineering-mastery-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    file.text().then((text) => {
      try {
        replace(importProgress(text));
        setImportMsg("Progress imported successfully.");
      } catch (e) {
        setImportMsg(`Import failed: ${e instanceof Error ? e.message : "invalid file"}`);
      }
    });
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">
        A practical learning system for applied engineering: simulate, pass challenges, build evidence.
      </p>

      <div className="grid grid-3" style={{ margin: "0.8rem 0" }}>
        <div className="card metric">
          <div className="label">Challenges passed</div>
          <div className="val">{passes}</div>
        </div>
        <div className="card metric">
          <div className="label">Artefacts collected</div>
          <div className="val">{artefacts.done}</div>
        </div>
        <div className="card metric">
          <div className="label">Recommended next</div>
          <div className="val" style={{ fontSize: "0.95rem" }}>
            {recModule ? <Link to={recModule.route}>{recModule.title}</Link> : rec ? <Link to="/skills">{rec.name} (skills matrix)</Link> : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card" aria-label="Skill score by domain">
          <h2 style={{ marginTop: 0 }}>Skill score by domain</h2>
          {scores.map((s) => (
            <div key={s.domainId} style={{ marginBottom: "0.55rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span>{s.name}</span>
                <span className="muted">
                  {s.score}% · {s.ratedSkills}/{s.totalSkills} rated
                </span>
              </div>
              <div className="progress-bar" role="progressbar" aria-valuenow={s.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name} score`}>
                <div style={{ width: `${s.score}%` }} />
              </div>
            </div>
          ))}
          <p className="small muted">
            Scores come from your self-ratings in the <Link to="/skills">skills matrix</Link>. Rate honestly and attach evidence.
          </p>
        </section>

        <div className="grid">
          <section className="card" aria-label="Weekly sprint checklist">
            <h2 style={{ marginTop: 0 }}>Weekly sprint checklist</h2>
            <ul className="checklist">
              {sprintItems.map((item) => (
                <li key={item.id}>
                  <input
                    id={item.id}
                    type="checkbox"
                    checked={!!progress.sprintChecklist[item.id]}
                    onChange={() =>
                      update((p) => {
                        p.sprintChecklist[item.id] = !p.sprintChecklist[item.id];
                        return p;
                      })
                    }
                  />
                  <label htmlFor={item.id} style={{ color: "inherit" }}>
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                update((p) => {
                  p.sprintChecklist = {};
                  return p;
                })
              }
            >
              Reset for new week
            </button>
          </section>

          <section className="card" aria-label="Progress data">
            <h2 style={{ marginTop: 0 }}>Progress data</h2>
            <p className="small muted">
              Progress is stored in this browser only (localStorage). Export regularly to keep a backup or move devices.
            </p>
            <button className="primary" onClick={doExport}>
              Export progress (JSON)
            </button>{" "}
            <button onClick={() => fileRef.current?.click()}>Import progress</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="sr-only"
              aria-label="Import progress file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
            {importMsg && <p className="small">{importMsg}</p>}
          </section>
        </div>
      </div>

      <section className="card" style={{ marginTop: "0.8rem" }} aria-label="Portfolio artefact tracker">
        <h2 style={{ marginTop: 0 }}>Portfolio artefact tracker</h2>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Artefacts done</th>
              <th>Challenges passed</th>
              <th>Reflection</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => {
              const evDone = m.evidence.filter((_, i) => progress.artefacts[`${m.id}-ev${i}`]).length;
              const chDone = m.challenges.filter((c) => progress.challenges[c.id]?.passed).length;
              return (
                <tr key={m.id}>
                  <td>
                    <Link to={m.route}>{m.title}</Link>
                  </td>
                  <td>
                    {evDone}/{m.evidence.length}
                  </td>
                  <td>
                    {chDone}/{m.challenges.length}
                  </td>
                  <td>{progress.reflections[m.id] ? <span className="badge ok">Written</span> : <span className="badge">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="disclaimer">
        <strong>Educational disclaimer:</strong> all simulations on this site are simplified teaching models using
        synthetic data. They do not replace professional engineering judgement and do not demonstrate compliance with
        any engineering standard.
      </div>
    </div>
  );
}
