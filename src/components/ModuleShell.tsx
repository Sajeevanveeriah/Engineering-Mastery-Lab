import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ModuleContent } from "../data/modules";
import { skillDomains } from "../data/skills";
import { moduleProgress } from "../lib/metrics";
import { Icon } from "./Icon";
import { PageHeader } from "./PageHeader";
import { useProgress } from "./ProgressContext";
import { Tabs } from "./Tabs";

/** Standard Learn / Simulate / Challenge / Diagnose / Build / Evidence / Reflect / Next module wrapper. */
export function ModuleShell({ module, simulator }: { module: ModuleContent; simulator: ReactNode }) {
  const { progress, update } = useProgress();
  const [reflection, setReflection] = useState(progress.reflections[module.id] ?? "");
  const [challengeNotes, setChallengeNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(module.challenges.map((challenge) => [challenge.id, progress.challenges[challenge.id]?.notes ?? ""]))
  );
  const [verified, setVerified] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(module.challenges.map((challenge) => [challenge.id, Boolean(progress.challenges[challenge.id]?.passed)]))
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const status = moduleProgress(progress, module);
  const domainName = skillDomains.find((domain) => domain.id === module.domainId)?.name ?? "Applied engineering";

  const setChallenge = (id: string, passed: boolean) => {
    update((state) => ({
      ...state,
      challenges: {
        ...state.challenges,
        [id]: {
          passed,
          completedAt: new Date().toISOString(),
          ...(challengeNotes[id]?.trim() ? { notes: challengeNotes[id].trim() } : {})
        }
      }
    }));
    setActionMessage(passed ? "Challenge recorded as passed with verified criteria." : "Challenge recorded as not passed.");
  };

  const toggleArtefact = (key: string) => update((state) => ({
    ...state,
    artefacts: { ...state.artefacts, [key]: !state.artefacts[key] }
  }));

  const tabs = useMemo(() => [
    {
      id: "learn",
      label: "Learn",
      content: (
        <section className="module-panel card prose" aria-labelledby={`${module.id}-learn-heading`}>
          <div className="module-panel__heading"><span className="step-number">01</span><div><p className="eyebrow">Concept foundation</p><h2 id={`${module.id}-learn-heading`}>Learn the model</h2></div></div>
          {module.learn.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      )
    },
    { id: "simulate", label: "Simulate", content: <section className="module-panel" aria-label={`${module.title} simulator`}>{simulator}</section> },
    {
      id: "challenge",
      label: `Challenge (${status.challengesDone}/${status.challengesTotal})`,
      content: (
        <section className="module-panel" aria-labelledby={`${module.id}-challenge-heading`}>
          <div className="module-section-intro"><p className="eyebrow">Verify before recording</p><h2 id={`${module.id}-challenge-heading`}>Engineering challenges</h2><p>Use the simulator to meet each stated criterion. Record the result only after checking the observable values yourself.</p></div>
          <div className="challenge-grid">
            {module.challenges.map((challenge, index) => {
              const result = progress.challenges[challenge.id];
              const verificationId = `${challenge.id}-verified`;
              return (
                <article className={`challenge-card${result?.passed ? " challenge-card--passed" : ""}`} key={challenge.id}>
                  <div className="challenge-card__header"><span className="step-number">{String(index + 1).padStart(2, "0")}</span><span className={`badge ${result?.passed ? "ok" : ""}`}>{result?.passed ? "Passed" : result ? "Not passed" : "Not attempted"}</span></div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.task}</p>
                  <div className="criteria-box"><strong>Pass criteria</strong><p>{challenge.passCriteria}</p></div>
                  <div className="form-field">
                    <label htmlFor={`${challenge.id}-notes`}>Verification note <span className="muted">(optional)</span></label>
                    <textarea id={`${challenge.id}-notes`} rows={2} value={challengeNotes[challenge.id] ?? ""} placeholder="Record the values or observation that support your result" onChange={(event) => setChallengeNotes((notes) => ({ ...notes, [challenge.id]: event.target.value }))} />
                  </div>
                  <label className="verification-check" htmlFor={verificationId}>
                    <input id={verificationId} type="checkbox" checked={Boolean(verified[challenge.id])} onChange={(event) => setVerified((current) => ({ ...current, [challenge.id]: event.target.checked }))} />
                    <span>I checked the simulator against every pass criterion.</span>
                  </label>
                  <div className="button-row">
                    <button className="primary" type="button" disabled={!verified[challenge.id]} onClick={() => setChallenge(challenge.id, true)}><Icon name="check" size={16} /> Record pass</button>
                    <button type="button" onClick={() => setChallenge(challenge.id, false)}>Record not passed</button>
                  </div>
                  {result?.completedAt && <p className="small muted">Last recorded {new Date(result.completedAt).toLocaleString("en-AU")}</p>}
                </article>
              );
            })}
          </div>
        </section>
      )
    },
    {
      id: "diagnose",
      label: "Diagnose",
      content: (
        <section className="module-panel card" aria-labelledby={`${module.id}-diagnose-heading`}>
          <div className="module-panel__heading"><span className="step-number">04</span><div><p className="eyebrow">Fault reasoning</p><h2 id={`${module.id}-diagnose-heading`}>Diagnose observed behaviour</h2></div></div>
          <div className="table-scroll" tabIndex={0} aria-label={`${module.title} diagnostic table`}>
            <table><thead><tr><th scope="col">Observed fault</th><th scope="col">Likely cause</th></tr></thead><tbody>{module.diagnose.map((item) => <tr key={item.fault}><th scope="row">{item.fault}</th><td>{item.cause}</td></tr>)}</tbody></table>
          </div>
        </section>
      )
    },
    {
      id: "build",
      label: "Build",
      content: (
        <section className="module-panel card build-brief" aria-labelledby={`${module.id}-build-heading`}>
          <div className="module-panel__heading"><span className="step-number">05</span><div><p className="eyebrow">Mini project</p><h2 id={`${module.id}-build-heading`}>Take it into hardware or code</h2></div></div>
          <p className="build-brief__task">{module.build}</p>
          <div className="safety-note"><Icon name="alert" size={19} /><p><strong>Real-world boundary.</strong> Use appropriate low-voltage practices, isolation, manufacturer guidance and verified safety controls. Never transfer a simulation procedure directly to live machinery.</p></div>
        </section>
      )
    },
    {
      id: "evidence",
      label: `Evidence (${status.evidenceDone}/${status.evidenceTotal})`,
      content: (
        <section className="module-panel card" aria-labelledby={`${module.id}-evidence-heading`}>
          <div className="module-panel__heading"><span className="step-number">06</span><div><p className="eyebrow">Portfolio record</p><h2 id={`${module.id}-evidence-heading`}>Capture evidence</h2></div></div>
          <p className="muted">Tick an item only when the artefact exists outside this checklist and can be reviewed.</p>
          <ul className="evidence-list">
            {module.evidence.map((item, index) => {
              const key = `${module.id}-ev${index}`;
              return <li key={key}><input id={key} type="checkbox" checked={Boolean(progress.artefacts[key])} onChange={() => toggleArtefact(key)} /><label htmlFor={key}><span>{item}</span><small>{progress.artefacts[key] ? "Recorded as complete" : "Evidence required"}</small></label></li>;
            })}
          </ul>
        </section>
      )
    },
    {
      id: "reflect",
      label: "Reflect",
      content: (
        <section className="module-panel card" aria-labelledby={`${module.id}-reflect-heading`}>
          <div className="module-panel__heading"><span className="step-number">07</span><div><p className="eyebrow">Engineering judgement</p><h2 id={`${module.id}-reflect-heading`}>Record the learning</h2></div></div>
          <div className="reflection-prompt"><Icon name="report" size={22} /><p>{module.reflect}</p></div>
          <div className="form-field"><label htmlFor={`${module.id}-reflection`}>Reflection</label><textarea id={`${module.id}-reflection`} rows={7} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What changed in your understanding, and what evidence supports it?" /></div>
          <button className="primary" type="button" onClick={() => { update((state) => ({ ...state, reflections: { ...state.reflections, [module.id]: reflection } })); setActionMessage("Reflection saved in this browser."); }}><Icon name="save" size={16} /> Save reflection</button>
        </section>
      )
    },
    {
      id: "next",
      label: "Next",
      content: (
        <section className="module-panel card next-step" aria-labelledby={`${module.id}-next-heading`}>
          <div><p className="eyebrow">Continue the pathway</p><h2 id={`${module.id}-next-heading`}>Recommended next module</h2><p>Carry the evidence and questions from this module into the next practical context.</p></div>
          <Link className="btn primary" to={module.next.route}>{module.next.label}<Icon name="arrow-right" size={17} /></Link>
        </section>
      )
    }
  ], [actionMessage, challengeNotes, module, progress, reflection, simulator, status, verified]);

  return (
    <section className="page module-page">
      <PageHeader
        eyebrow={domainName}
        title={module.title}
        description="Work through the full engineering cycle. Simulator state is preserved while you move between sections, and live timed simulations pause when hidden."
        meta={<><span>{status.percent}% complete</span><span>{status.done} of {status.total} milestones</span></>}
        actions={<Link className="btn" to="/labs">All laboratories</Link>}
      />
      <div className="module-progress-strip"><div className="progress-bar" role="progressbar" aria-label={`${module.title} completion`} aria-valuenow={status.percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${status.percent}%` }} /></div></div>
      {actionMessage && <p className="inline-message inline-message--success" role="status">{actionMessage}<button className="icon-button" type="button" aria-label="Dismiss message" onClick={() => setActionMessage(null)}><Icon name="close" size={15} /></button></p>}
      <Tabs initial="simulate" ariaLabel={`${module.title} learning cycle`} tabs={tabs} />
    </section>
  );
}
