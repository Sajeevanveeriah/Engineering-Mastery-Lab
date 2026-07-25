import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pathways } from "../data/pathways";
import type { ExperienceLevel, LearnerGoal, LocalLearnerProfile } from "../lib/storage";
import { recommendPathway } from "../lib/recommendation";
import { useProgress } from "./ProgressContext";

const disciplines = ["Controls", "Electrical", "Embedded", "Robotics", "AI and ML", "Industrial", "Mechanical", "Software", "Verification"];

export function Onboarding({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const { progress, update } = useProgress();
  const navigate = useNavigate();
  const editing = forceOpen || Boolean(progress.profile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(progress.profile?.displayName ?? "");
  const [goal, setGoal] = useState<LearnerGoal>(progress.profile?.goal ?? "foundations");
  const [selected, setSelected] = useState<string[]>(progress.profile?.disciplines ?? []);
  const [experience, setExperience] = useState<ExperienceLevel>(progress.profile?.experience ?? "foundation");
  const [effort, setEffort] = useState(progress.profile?.weeklyEffortHours ?? 4);
  const recommendation = useMemo(() => recommendPathway(goal, selected, experience), [experience, goal, selected]);
  const recommended = pathways.find((pathway) => pathway.id === recommendation) ?? pathways[0];

  const save = () => {
    const now = new Date().toISOString();
    const profile: LocalLearnerProfile = {
      version: 1,
      ...(name.trim() ? { displayName: name.trim() } : {}),
      goal,
      disciplines: selected,
      experience,
      weeklyEffortHours: effort,
      recommendedPathwayId: recommendation,
      createdAt: progress.profile?.createdAt ?? now,
      updatedAt: now
    };
    update((state) => ({ ...state, profile, onboardingComplete: true }));
    onClose?.();
    navigate("/");
  };

  const skip = () => {
    update((state) => ({ ...state, onboardingComplete: true }));
    onClose?.();
    navigate("/");
  };

  return (
    <div className={forceOpen ? "settings-onboarding" : "onboarding-backdrop"}>
      <section className="onboarding" role={forceOpen ? undefined : "dialog"} aria-modal={forceOpen ? undefined : true} aria-labelledby="onboarding-title">
        <div className="onboarding__progress" aria-label={`Onboarding step ${step + 1} of 3`}>
          {[0, 1, 2].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}
        </div>
        {step === 0 && (
          <div>
            <p className="eyebrow">Local learner profile</p>
            <h1 id="onboarding-title">{editing ? "Shape your learning route" : "What are you building towards?"}</h1>
            <p>Your choices and progress stay on this device in the current build. There is no account or remote sync.</p>
            <fieldset className="choice-grid">
              <legend>Primary goal</legend>
              {([
                ["foundations", "Build foundations"],
                ["role", "Prepare for a role"],
                ["refresh", "Refresh a discipline"],
                ["project", "Complete a project"]
              ] as Array<[LearnerGoal, string]>).map(([value, label]) => (
                <label key={value}><input type="radio" name="goal" value={value} checked={goal === value} onChange={() => setGoal(value)} /><span>{label}</span></label>
              ))}
            </fieldset>
            <div className="form-field"><label htmlFor="profile-name">Display name <span className="muted">(optional)</span></label><input id="profile-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></div>
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="eyebrow">Focus and pace</p>
            <h1 id="onboarding-title">Choose the disciplines that matter now</h1>
            <fieldset className="choice-grid choice-grid--compact">
              <legend>Selected disciplines</legend>
              {disciplines.map((discipline) => (
                <label key={discipline}><input type="checkbox" checked={selected.includes(discipline)} onChange={() => setSelected((current) => current.includes(discipline) ? current.filter((item) => item !== discipline) : [...current, discipline])} /><span>{discipline}</span></label>
              ))}
            </fieldset>
            <div className="form-grid form-grid--2">
              <div className="form-field"><label htmlFor="experience">Experience level</label><select id="experience" value={experience} onChange={(event) => setExperience(event.target.value as ExperienceLevel)}><option value="foundation">Foundation</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
              <div className="form-field"><label htmlFor="weekly-effort">Preferred weekly effort</label><select id="weekly-effort" value={effort} onChange={(event) => setEffort(Number(event.target.value))}><option value={2}>2 hours</option><option value={4}>4 hours</option><option value={6}>6 hours</option><option value={8}>8 hours</option><option value={12}>12 hours</option></select></div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="eyebrow">Deterministic recommendation</p>
            <h1 id="onboarding-title">{recommended?.name}</h1>
            <p>{recommended?.purpose}</p>
            <dl className="recommendation-facts"><div><dt>Level</dt><dd>{recommended?.difficulty}</dd></div><div><dt>Indicative effort</dt><dd>{recommended?.effortHours} hours</dd></div><div><dt>First action</dt><dd>{recommended?.steps[0]?.label}</dd></div></dl>
            <p className="small muted">Recommendation rule: goal, selected discipline, then experience level. You can choose another pathway at any time.</p>
          </div>
        )}
        <div className="onboarding__actions">
          {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)}>Back</button>}
          <span />
          {!editing && <button className="btn btn--quiet" type="button" onClick={skip}>Skip for now</button>}
          {forceOpen && <button type="button" onClick={onClose}>Cancel</button>}
          {step < 2 ? <button className="primary" type="button" onClick={() => setStep((current) => current + 1)}>Continue</button> : <button className="primary" type="button" onClick={save}>Save and go home</button>}
        </div>
      </section>
    </div>
  );
}
