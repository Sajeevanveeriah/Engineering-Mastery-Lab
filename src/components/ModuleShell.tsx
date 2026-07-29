import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import type { ModuleContent } from "../data/modules";
import { projects } from "../data/projects";
import { skillDomains } from "../data/skills";
import { moduleProgress } from "../lib/metrics";
import { Icon } from "./Icon";
import { PageHeader } from "./PageHeader";
import { useProgress } from "./ProgressContext";
import { TabPanelActivityProvider } from "./Tabs";

const stages = [
  { id: "learn", label: "Learn", phase: "understand" },
  { id: "simulate", label: "Simulate", phase: "practise" },
  { id: "challenge", label: "Challenge", phase: "practise" },
  { id: "diagnose", label: "Diagnose", phase: "apply" },
  { id: "build", label: "Build", phase: "apply" },
  { id: "evidence", label: "Evidence", phase: "prove" },
  { id: "reflect", label: "Reflect", phase: "prove" },
  { id: "next", label: "Next", phase: "prove" }
] as const;
type StageId = typeof stages[number]["id"];

const phases = [
  { id: "understand", label: "Understand", description: "Learn, outcomes, and prerequisites" },
  { id: "practise", label: "Practise", description: "Simulate and meet challenge criteria" },
  { id: "apply", label: "Apply", description: "Diagnose behaviour and build" },
  { id: "prove", label: "Prove", description: "Capture evidence, reflect, and continue" }
] as const;

function isStageId(value: string | null): value is StageId {
  return stages.some((stage) => stage.id === value);
}

export function ModuleShell({ module, simulator }: { module: ModuleContent; simulator: ReactNode }) {
  const { progress, update } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("stage");
  const stored = progress.labPositions[module.id]?.stageId;
  const initial = isStageId(requested) ? requested : isStageId(stored) ? stored : "learn";
  const [active, setActiveState] = useState<StageId>(initial);
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
  const relatedProject = projects.find((project) => project.linkedLabs.includes(module.id));
  const activeIndex = stages.findIndex((stage) => stage.id === active);
  const activePhase = stages[activeIndex].phase;

  useEffect(() => {
    if (isStageId(requested) && requested !== active) setActiveState(requested);
  }, [active, requested]);

  useEffect(() => {
    const now = new Date().toISOString();
    update((state) => {
      const position = state.labPositions[module.id];
      const visited = position?.visitedStageIds.includes(active) ? position.visitedStageIds : [...(position?.visitedStageIds ?? []), active];
      return {
        ...state,
        labPositions: { ...state.labPositions, [module.id]: { stageId: active, visitedStageIds: visited, updatedAt: now } },
        recentItems: [
          { id: module.id, type: "lab" as const, title: module.title, route: `/learn/labs/${module.id}`, visitedAt: now },
          ...state.recentItems.filter((item) => !(item.type === "lab" && item.id === module.id))
        ].slice(0, 20)
      };
    });
  }, [active, module.id, module.title, update]);

  const setActive = (stage: StageId) => {
    setActiveState(stage);
    setSearchParams({ stage }, { replace: true });
  };

  const setChallenge = useCallback((id: string, passed: boolean) => {
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
  }, [challengeNotes, update]);

  const toggleArtefact = useCallback((key: string) => update((state) => ({
    ...state,
    artefacts: { ...state.artefacts, [key]: !state.artefacts[key] }
  })), [update]);

  const isComplete = (stage: StageId) => {
    if (stage === "challenge") return module.challenges.every((challenge) => progress.challenges[challenge.id]?.passed);
    if (stage === "evidence") return module.evidence.every((_, index) => progress.artefacts[`${module.id}-ev${index}`]);
    if (stage === "reflect") return Boolean(progress.reflections[module.id]?.trim());
    if (stage === "next") return status.percent === 100;
    return false;
  };
  const isVisited = (stage: StageId) => Boolean(progress.labPositions[module.id]?.visitedStageIds.includes(stage));

  const panels = useMemo<Record<StageId, ReactNode>>(() => ({
    learn: (
      <section className="module-panel prose" aria-labelledby={`${module.id}-learn-heading`}>
        <div className="module-panel__heading"><span className="step-number">01</span><div><p className="eyebrow">Concept foundation</p><h2 id={`${module.id}-learn-heading`}>Learn the model</h2></div></div>
        <div className="learning-boundary"><strong>Before you begin</strong><p>Use the stated model assumptions and challenge criteria as learning boundaries. Record evidence only after independently checking the observable result.</p></div>
        {module.learn.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
    ),
    simulate: <section className="module-panel" aria-label={`${module.title} simulator`}>{simulator}</section>,
    challenge: (
      <section className="module-panel" aria-labelledby={`${module.id}-challenge-heading`}>
        <div className="module-section-intro"><p className="eyebrow">Verify before recording</p><h2 id={`${module.id}-challenge-heading`}>Engineering challenges</h2><p>Every pass criterion is visible before a completion record can be created.</p></div>
        <div className="challenge-grid">{module.challenges.map((challenge, index) => {
          const result = progress.challenges[challenge.id];
          const verificationId = `${challenge.id}-verified`;
          return <article className={`challenge-card${result?.passed ? " challenge-card--passed" : ""}`} key={challenge.id}><div className="challenge-card__header"><span className="step-number">{String(index + 1).padStart(2, "0")}</span><span className={`badge ${result?.passed ? "ok" : ""}`}>{result?.passed ? "Passed" : result ? "Not passed" : "Not attempted"}</span></div><h3>{challenge.title}</h3><p>{challenge.task}</p><div className="criteria-box"><strong>Pass criteria</strong><p>{challenge.passCriteria}</p></div><div className="form-field"><label htmlFor={`${challenge.id}-notes`}>Verification note <span className="muted">(optional)</span></label><textarea id={`${challenge.id}-notes`} rows={2} value={challengeNotes[challenge.id] ?? ""} onChange={(event) => setChallengeNotes((notes) => ({ ...notes, [challenge.id]: event.target.value }))} /></div><label className="verification-check" htmlFor={verificationId}><input id={verificationId} type="checkbox" checked={Boolean(verified[challenge.id])} onChange={(event) => setVerified((current) => ({ ...current, [challenge.id]: event.target.checked }))} /><span>I checked every stated pass criterion.</span></label><div className="button-row"><button className="primary" type="button" disabled={!verified[challenge.id]} onClick={() => setChallenge(challenge.id, true)}><Icon name="check" size={16} /> Record pass</button><button type="button" onClick={() => setChallenge(challenge.id, false)}>Record not passed</button></div></article>;
        })}</div>
      </section>
    ),
    diagnose: (
      <section className="module-panel" aria-labelledby={`${module.id}-diagnose-heading`}>
        <div className="module-panel__heading"><span className="step-number">04</span><div><p className="eyebrow">Fault reasoning</p><h2 id={`${module.id}-diagnose-heading`}>Diagnose observed behaviour</h2></div></div>
        <div className="table-scroll" tabIndex={0} aria-label={`${module.title} diagnostic table`}><table><thead><tr><th scope="col">Observed fault</th><th scope="col">Likely cause</th></tr></thead><tbody>{module.diagnose.map((item) => <tr key={item.fault}><th scope="row">{item.fault}</th><td>{item.cause}</td></tr>)}</tbody></table></div>
      </section>
    ),
    build: (
      <section className="module-panel build-brief" aria-labelledby={`${module.id}-build-heading`}>
        <div className="module-panel__heading"><span className="step-number">05</span><div><p className="eyebrow">Mini project</p><h2 id={`${module.id}-build-heading`}>Apply the model</h2></div></div><p className="build-brief__task">{module.build}</p><div className="safety-note"><Icon name="alert" size={19} /><p><strong>Real-world boundary.</strong> Use appropriate low-voltage practice, isolation, manufacturer guidance, and verified safety controls. Never transfer a simulation procedure directly to live machinery.</p></div>
      </section>
    ),
    evidence: (
      <section className="module-panel" aria-labelledby={`${module.id}-evidence-heading`}>
        <div className="module-panel__heading"><span className="step-number">06</span><div><p className="eyebrow">Prove record</p><h2 id={`${module.id}-evidence-heading`}>Capture evidence</h2></div></div><p className="muted">Tick an item only when the artefact exists outside this checklist and can be reviewed.</p><ul className="evidence-list">{module.evidence.map((item, index) => { const key = `${module.id}-ev${index}`; return <li key={key}><input id={key} type="checkbox" checked={Boolean(progress.artefacts[key])} onChange={() => toggleArtefact(key)} /><label htmlFor={key}><span>{item}</span><small>{progress.artefacts[key] ? "Recorded as complete" : "Evidence required"}</small></label></li>; })}</ul>
      </section>
    ),
    reflect: (
      <section className="module-panel" aria-labelledby={`${module.id}-reflect-heading`}>
        <div className="module-panel__heading"><span className="step-number">07</span><div><p className="eyebrow">Engineering judgement</p><h2 id={`${module.id}-reflect-heading`}>Record the learning</h2></div></div><div className="reflection-prompt"><Icon name="report" size={22} /><p>{module.reflect}</p></div><div className="form-field"><label htmlFor={`${module.id}-reflection`}>Reflection</label><textarea id={`${module.id}-reflection`} rows={7} value={reflection} onChange={(event) => setReflection(event.target.value)} /></div><button className="primary" type="button" onClick={() => { update((state) => ({ ...state, reflections: { ...state.reflections, [module.id]: reflection } })); setActionMessage("Reflection saved locally."); }}><Icon name="save" size={16} /> Save reflection</button>
      </section>
    ),
    next: (
      <section className="module-panel next-step" aria-labelledby={`${module.id}-next-heading`}>
        <div><p className="eyebrow">{status.percent === 100 ? "Laboratory evidence complete" : "Continue the journey"}</p><h2 id={`${module.id}-next-heading`}>{status.percent === 100 ? "Apply and present the work" : "Recommended next learning"}</h2><p>{status.percent === 100 ? "Move into a relevant practical project or curate the evidence in your portfolio." : "Complete the remaining challenge, evidence, and reflection records before treating the lab as complete."}</p></div>
        <div className="button-row">{relatedProject && <Link className="btn primary" to={`/projects/${relatedProject.slug}`}>{relatedProject.title}<Icon name="arrow-right" size={17} /></Link>}<Link className="btn" to="/portfolio">Open Prove</Link><Link className="btn btn--quiet" to={module.next.route.replace("/labs/", "/learn/labs/").replace("/skills", "/learn/skills").replace("/pathways", "/learn/pathways")}>{module.next.label.replace(/^Dashboard\b/, "Today").replace(/\s+[\u2013\u2014]\s+/g, " - ")}</Link></div>
      </section>
    )
  }), [
    challengeNotes,
    module,
    progress,
    reflection,
    relatedProject,
    setChallenge,
    simulator,
    status.percent,
    toggleArtefact,
    update,
    verified
  ]);

  return (
    <section className="page module-page">
      <PageHeader eyebrow={domainName} title={module.title} description="Move through four clear phases while the eight original learning stages remain individually addressable and measurable." meta={<><span>{status.percent}% evidence progress</span><span>{status.done} of {status.total} recorded milestones</span></>} actions={<Link className="btn" to="/learn/labs">All laboratories</Link>} />
      <div className="module-progress-strip"><div className="progress-bar" role="progressbar" aria-label={`${module.title} completion`} aria-valuenow={status.percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${status.percent}%` }} /></div></div>
      {actionMessage && <p className="inline-message inline-message--success" role="status">{actionMessage}<button className="icon-button" type="button" aria-label="Dismiss message" onClick={() => setActionMessage(null)}><Icon name="close" size={15} /></button></p>}
      <div className="guided-lab">
        <aside className="journey-rail" aria-label="Laboratory journey">
          {phases.map((phase, phaseIndex) => {
            const phaseStages = stages.filter((stage) => stage.phase === phase.id);
            const phaseComplete = phaseStages.every((stage) => isComplete(stage.id));
            return <section key={phase.id} className={activePhase === phase.id ? "active" : ""}><button type="button" onClick={() => setActive(phaseStages[0].id)} aria-current={activePhase === phase.id ? "step" : undefined}><span>{phaseComplete ? <Icon name="check" size={16} /> : phaseIndex + 1}</span><strong>{phase.label}</strong><small>{phase.description}</small></button><ol>{phaseStages.map((stage) => <li key={stage.id}><button type="button" className={active === stage.id ? "active" : ""} aria-current={active === stage.id ? "step" : undefined} onClick={() => setActive(stage.id)}><span>{stage.label}</span><small>{isComplete(stage.id) ? "Complete" : isVisited(stage.id) ? "Visited" : "Not visited"}</small></button></li>)}</ol></section>;
          })}
        </aside>
        <div className="journey-content">
          <div className="mobile-stage-control"><label htmlFor="lab-stage">Current learning stage</label><select id="lab-stage" value={active} onChange={(event) => setActive(event.target.value as StageId)}>{stages.map((stage) => <option value={stage.id} key={stage.id}>{phases.find((phase) => phase.id === stage.phase)?.label}: {stage.label}</option>)}</select><span>Stage {activeIndex + 1} of {stages.length}</span></div>
          {stages.map((stage) => <div key={stage.id} role="region" aria-label={`${stage.label} stage`} hidden={active !== stage.id}><TabPanelActivityProvider active={active === stage.id}>{panels[stage.id]}</TabPanelActivityProvider></div>)}
          <nav className="journey-controls" aria-label="Laboratory stage controls"><button type="button" disabled={activeIndex === 0} onClick={() => setActive(stages[activeIndex - 1].id)}>Previous stage</button><span>{phases.find((phase) => phase.id === activePhase)?.label}: {stages[activeIndex].label}</span><button className="primary" type="button" disabled={activeIndex === stages.length - 1} onClick={() => setActive(stages[activeIndex + 1].id)}>Next stage</button></nav>
        </div>
      </div>
    </section>
  );
}
