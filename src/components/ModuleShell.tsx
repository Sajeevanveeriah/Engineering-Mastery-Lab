import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs } from "./Tabs";
import { useProgress } from "./ProgressContext";
import type { ModuleContent } from "../data/modules";

/**
 * Standard module wrapper: renders Learn / Simulate / Challenge / Diagnose /
 * Build / Evidence / Reflect / Next around a lab's simulator UI.
 */
export function ModuleShell({ module, simulator }: { module: ModuleContent; simulator: ReactNode }) {
  const { progress, update } = useProgress();
  const [reflection, setReflection] = useState(progress.reflections[module.id] ?? "");

  const setChallenge = (id: string, passed: boolean) =>
    update((p) => {
      p.challenges[id] = { passed, completedAt: new Date().toISOString() };
      return p;
    });

  const toggleArtefact = (key: string) =>
    update((p) => {
      p.artefacts[key] = !p.artefacts[key];
      return p;
    });

  return (
    <div>
      <h1>{module.title}</h1>
      <Tabs
        initial="simulate"
        tabs={[
          {
            id: "learn",
            label: "Learn",
            content: (
              <div className="card">
                {module.learn.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )
          },
          { id: "simulate", label: "Simulate", content: simulator },
          {
            id: "challenge",
            label: "Challenge",
            content: (
              <div className="grid">
                {module.challenges.map((c) => {
                  const result = progress.challenges[c.id];
                  return (
                    <div className="card" key={c.id}>
                      <h3>
                        {c.title}{" "}
                        {result?.passed ? <span className="badge ok">Passed</span> : <span className="badge">Not passed</span>}
                      </h3>
                      <p>{c.task}</p>
                      <p className="small muted">
                        <strong>Pass criteria:</strong> {c.passCriteria}
                      </p>
                      <p className="small muted">Verify the criteria yourself in the simulator, then record the result honestly.</p>
                      <button className="primary" onClick={() => setChallenge(c.id, true)}>
                        Mark as passed
                      </button>{" "}
                      <button onClick={() => setChallenge(c.id, false)}>Mark as not passed</button>
                    </div>
                  );
                })}
              </div>
            )
          },
          {
            id: "diagnose",
            label: "Diagnose",
            content: (
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Observed fault</th>
                      <th>Likely cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.diagnose.map((d, i) => (
                      <tr key={i}>
                        <td>{d.fault}</td>
                        <td>{d.cause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          },
          {
            id: "build",
            label: "Build",
            content: (
              <div className="card">
                <h3>Mini project</h3>
                <p>{module.build}</p>
                <p className="small muted">
                  Safety note: build projects involve real hardware. Use low voltages, follow manufacturer guidance, and
                  never adapt simulation procedures directly to live machinery.
                </p>
              </div>
            )
          },
          {
            id: "evidence",
            label: "Evidence",
            content: (
              <div className="card">
                <h3>Portfolio artefact checklist</h3>
                <ul className="checklist">
                  {module.evidence.map((e, i) => {
                    const key = `${module.id}-ev${i}`;
                    return (
                      <li key={key}>
                        <input
                          id={key}
                          type="checkbox"
                          checked={!!progress.artefacts[key]}
                          onChange={() => toggleArtefact(key)}
                        />
                        <label htmlFor={key} style={{ color: "inherit" }}>
                          {e}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          },
          {
            id: "reflect",
            label: "Reflect",
            content: (
              <div className="card">
                <h3>Reflection prompt</h3>
                <p>{module.reflect}</p>
                <textarea
                  aria-label="Reflection"
                  rows={5}
                  style={{ width: "100%" }}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
                <p>
                  <button
                    className="primary"
                    onClick={() =>
                      update((p) => {
                        p.reflections[module.id] = reflection;
                        return p;
                      })
                    }
                  >
                    Save reflection
                  </button>
                </p>
              </div>
            )
          },
          {
            id: "next",
            label: "Next",
            content: (
              <div className="card">
                <h3>Recommended next module</h3>
                <p>
                  <Link to={module.next.route}>{module.next.label}</Link>
                </p>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
