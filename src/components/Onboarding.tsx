import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { pathways } from "../data/pathways";
import type { ExperienceLevel, LearnerGoal, LocalLearnerProfile } from "../lib/storage";
import { recommendPathway } from "../lib/recommendation";
import { FocusDialog } from "./FocusDialog";
import { useProgress } from "./ProgressContext";

const disciplines = ["Controls", "Electrical", "Embedded", "Robotics", "AI and ML", "Industrial", "Mechanical", "Software", "Verification"];
const totalSteps = 5;

const goalLabels: Record<LearnerGoal, string> = {
  foundations: "Build foundations",
  role: "Prepare for a role",
  refresh: "Refresh a discipline",
  project: "Complete a project"
};

const experienceLabels: Record<ExperienceLevel, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

function explainRecommendation(
  goal: LearnerGoal,
  selected: string[],
  experience: ExperienceLevel,
  recommendation: string
): string {
  const recommendedPathway = pathways.find((pathway) => pathway.id === recommendation);
  const selectedMatch = selected.find((discipline) => recommendedPathway?.disciplines.some(
    (pathwayDiscipline) => pathwayDiscipline.toLocaleLowerCase("en-AU") === discipline.toLocaleLowerCase("en-AU")
  ));
  const selectedContext = selected.length > 0 ? selected.join(", ") : "no disciplines";

  if (goal === "project" && experience === "advanced" && recommendation === "mechatronics") {
    return `You chose ${goalLabels[goal]} with ${experienceLabels[experience]} experience, so the project-first rule recommends this multidisciplinary pathway. Your selected disciplines (${selectedContext}) remain available in your local profile.`;
  }
  if (goal === "role" && selected.some((discipline) => discipline.toLocaleLowerCase("en-AU") === "verification") && recommendation === "verification") {
    return `You chose ${goalLabels[goal]} and selected Verification, so the role-preparation rule prioritises the Verification pathway. Your ${experienceLabels[experience]} experience level is retained for context.`;
  }
  if (selectedMatch) {
    return `${selectedMatch} is the first selected discipline that maps to this pathway. Your ${goalLabels[goal].toLocaleLowerCase("en-AU")} goal and ${experienceLabels[experience].toLocaleLowerCase("en-AU")} experience level provide the learning context.`;
  }
  if (goal === "foundations" && recommendation === "analysis") {
    return `You chose ${goalLabels[goal]} and none of the selected disciplines (${selectedContext}) maps to a specialised pathway, so Engineering Analysis is the foundation starting point for your ${experienceLabels[experience].toLocaleLowerCase("en-AU")} level.`;
  }
  if (experience === "advanced" && recommendation === "software") {
    return `None of the selected disciplines (${selectedContext}) maps directly to a pathway, so the advanced-experience fallback recommends Software Engineering for your ${goalLabels[goal].toLocaleLowerCase("en-AU")} goal.`;
  }
  return `None of the selected disciplines (${selectedContext}) maps directly to a specialised pathway. Your ${goalLabels[goal].toLocaleLowerCase("en-AU")} goal and ${experienceLabels[experience].toLocaleLowerCase("en-AU")} experience level use Engineering Analysis as the general starting point.`;
}

export function Onboarding({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const { progress, update } = useProgress();
  const navigate = useNavigate();
  const editing = forceOpen || Boolean(progress.profile);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(progress.profile?.displayName ?? "");
  const [goal, setGoal] = useState<LearnerGoal>(progress.profile?.goal ?? "foundations");
  const [selected, setSelected] = useState<string[]>(progress.profile?.disciplines ?? []);
  const [experience, setExperience] = useState<ExperienceLevel>(progress.profile?.experience ?? "foundation");
  const [effort, setEffort] = useState(progress.profile?.weeklyEffortHours ?? 4);
  const recommendation = useMemo(() => recommendPathway(goal, selected, experience), [experience, goal, selected]);
  const recommended = pathways.find((pathway) => pathway.id === recommendation) ?? pathways[0];
  const recommendationReason = useMemo(
    () => explainRecommendation(goal, selected, experience, recommendation),
    [experience, goal, recommendation, selected]
  );

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

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
    <FocusDialog
      backdropClassName={forceOpen ? "settings-profile-dialog settings-onboarding" : "onboarding-backdrop"}
      dialogClassName="onboarding"
      labelledBy="onboarding-title"
      describedBy="onboarding-description"
      onClose={forceOpen ? () => onClose?.() : skip}
    >
        <div
          className="onboarding__progress"
          role="progressbar"
          aria-label="Profile setup progress"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${totalSteps}`}
          style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}
        >
          {Array.from({ length: totalSteps }, (_, item) => <span key={item} className={item <= step ? "active" : ""} aria-hidden="true" />)}
        </div>
        {step === 0 && (
          <div>
            <p className="eyebrow">Optional local setup</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1} data-dialog-initial-focus>{editing ? "Shape your learning route" : "Build a learning route that fits"}</h1>
            <p id="onboarding-description">This short setup uses your goal, current disciplines, and experience to recommend a starting pathway. The recommendation is guidance, and you can choose another pathway at any time.</p>
            <p>Your profile and progress stay on this device in the current build. There is no account or remote sync, and you can skip setup.</p>
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="eyebrow">Goal</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1}>What are you building towards?</h1>
            <p id="onboarding-description">Choose one primary goal. A display name is optional.</p>
            <fieldset className="choice-grid">
              <legend>Primary goal</legend>
              {(Object.entries(goalLabels) as Array<[LearnerGoal, string]>).map(([value, label]) => (
                <label key={value}><input type="radio" name="goal" value={value} checked={goal === value} onChange={() => setGoal(value)} /><span>{label}</span></label>
              ))}
            </fieldset>
            <div className="form-field"><label htmlFor="profile-name">Display name <span className="muted">(optional)</span></label><input id="profile-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></div>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="eyebrow">Current focus</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1}>Choose the disciplines that matter now</h1>
            <p id="onboarding-description">Select any disciplines you want the recommendation to consider. You can leave all of them unselected.</p>
            <fieldset className="choice-grid choice-grid--compact">
              <legend>Selected disciplines</legend>
              {disciplines.map((discipline) => (
                <label key={discipline}><input type="checkbox" checked={selected.includes(discipline)} onChange={() => setSelected((current) => current.includes(discipline) ? current.filter((item) => item !== discipline) : [...current, discipline])} /><span>{discipline}</span></label>
              ))}
            </fieldset>
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="eyebrow">Level and pace</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1}>Set your current level and weekly pace</h1>
            <p id="onboarding-description">These choices tune the starting point and planning estimate. They do not limit which pathways you can open.</p>
            <div className="form-grid form-grid--2">
              <div className="form-field"><label htmlFor="experience">Experience level</label><select id="experience" value={experience} onChange={(event) => setExperience(event.target.value as ExperienceLevel)}>{(Object.entries(experienceLabels) as Array<[ExperienceLevel, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
              <div className="form-field"><label htmlFor="weekly-effort">Preferred weekly effort</label><select id="weekly-effort" value={effort} onChange={(event) => setEffort(Number(event.target.value))}><option value={2}>2 hours</option><option value={4}>4 hours</option><option value={6}>6 hours</option><option value={8}>8 hours</option><option value={12}>12 hours</option></select></div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <p className="eyebrow">Deterministic recommendation</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1}>{recommended?.name}</h1>
            <p id="onboarding-description">{recommended?.purpose}</p>
            <p><strong>Why this pathway:</strong> {recommendationReason}</p>
            <dl className="recommendation-facts"><div><dt>Level</dt><dd>{recommended?.difficulty}</dd></div><div><dt>Indicative effort</dt><dd>{recommended?.effortHours} hours</dd></div><div><dt>First action</dt><dd>{recommended?.steps[0]?.label}</dd></div></dl>
            <p className="small muted">This is a local deterministic recommendation, not an assessment. You can choose another pathway at any time.</p>
          </div>
        )}
        <div className="onboarding__actions">
          {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)}>Back</button>}
          <span />
          {!editing && <button className="btn btn--quiet" type="button" onClick={skip}>Skip for now</button>}
          {forceOpen && <button type="button" onClick={onClose}>Cancel</button>}
          {step < totalSteps - 1 ? <button className="primary" type="button" onClick={() => setStep((current) => current + 1)}>{step === 0 ? "Start setup" : "Continue"}</button> : <button className="primary" type="button" onClick={save}>Save and go home</button>}
        </div>
    </FocusDialog>
  );
}
