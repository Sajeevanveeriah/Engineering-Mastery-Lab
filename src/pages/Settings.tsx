import { useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Onboarding } from "../components/Onboarding";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { emptyProgress, exportProgress, importProgress, type ProgressState } from "../lib/storage";

const sprintItems = [
  ["sprint-sim", "Complete one simulation session"],
  ["sprint-challenge", "Pass one challenge with verified criteria"],
  ["sprint-evidence", "Produce one portfolio artefact"],
  ["sprint-rate", "Update one skill rating with evidence"],
  ["sprint-reflect", "Write one module reflection"],
  ["sprint-build", "Spend at least one hour on a build"]
] as const;

export function Settings() {
  const { progress, update, replace } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error" | "neutral"; text: string } | null>(null);
  const [rollback, setRollback] = useState<ProgressState | null>(null);

  const exportBackup = () => {
    const url = URL.createObjectURL(new Blob([exportProgress(progress)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `engineering-mastery-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: "success", text: "Version 2 progress backup exported." });
  };
  const importBackup = async (file: File) => {
    try {
      const imported = importProgress(await file.text());
      if (!window.confirm(`Replace current local progress with "${file.name}"? An in-session undo will be available.`)) return setMessage({ kind: "neutral", text: "Import cancelled. Existing progress was kept." });
      setRollback(structuredClone(progress));
      replace(imported);
      setMessage({ kind: "success", text: "Progress imported and validated. Undo remains available in this session." });
    } catch (error) {
      setMessage({ kind: "error", text: `Import failed safely: ${error instanceof Error ? error.message : "invalid file"}` });
    }
  };
  const reset = () => {
    if (!window.confirm("Reset learning, pathway, project, evidence, bookmark, and planner records? Your local profile and display preferences will be kept, and an in-session undo will be available.")) return;
    setRollback(structuredClone(progress));
    replace({ ...structuredClone(emptyProgress), profile: progress.profile, onboardingComplete: true, theme: progress.theme, accessibility: progress.accessibility });
    setMessage({ kind: "success", text: "Local learning records were reset. Profile and display preferences were kept. Undo is available in this session." });
  };

  return (
    <section className="page settings-page">
      <PageHeader eyebrow="Local control" title="Settings" description="Manage your local profile, planner, display preferences, and versioned progress data." />
      <div className="settings-sections">
        <section><div className="section-heading"><div><p className="eyebrow">Guest or local profile</p><h2>Learning profile</h2></div><button type="button" onClick={() => setEditingProfile(true)}>{progress.profile ? "Edit profile" : "Create profile"}</button></div><p>{progress.profile ? `${progress.profile.displayName || "Local learner"} - ${progress.profile.experience}, ${progress.profile.weeklyEffortHours} hours per week.` : "Guest mode is active. No sign-in is required."}</p></section>
        <section><h2>Appearance and accessibility</h2><div className="settings-controls"><label><span>Colour theme</span><select value={progress.theme} onChange={(event) => update((state) => ({ ...state, theme: event.target.value as "light" | "dark" }))}><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="switch-row"><span><b>Reduce motion</b><small>Disable non-essential transitions.</small></span><input type="checkbox" checked={progress.accessibility.reducedMotion} onChange={(event) => update((state) => ({ ...state, accessibility: { ...state.accessibility, reducedMotion: event.target.checked } }))} /></label><label className="switch-row"><span><b>Higher contrast</b><small>Strengthen borders and muted text.</small></span><input type="checkbox" checked={progress.accessibility.highContrast} onChange={(event) => update((state) => ({ ...state, accessibility: { ...state.accessibility, highContrast: event.target.checked } }))} /></label></div></section>
        <section><div className="section-heading"><div><p className="eyebrow">Optional planner</p><h2>Weekly sprint</h2></div><button type="button" onClick={() => update((state) => ({ ...state, sprintChecklist: {} }))}>Clear planner</button></div><ul className="checklist checklist--spacious">{sprintItems.map(([id, label]) => <li key={id}><input id={id} type="checkbox" checked={Boolean(progress.sprintChecklist[id])} onChange={() => update((state) => ({ ...state, sprintChecklist: { ...state.sprintChecklist, [id]: !state.sprintChecklist[id] } }))} /><label htmlFor={id}>{label}</label></li>)}</ul></section>
        <section><h2>Backup, restore, and reset</h2><p>Exports use progress schema version 2. Valid version 1 backups are migrated deterministically during import.</p><div className="button-row"><button className="primary" type="button" onClick={exportBackup}><Icon name="download" size={17} /> Export JSON</button><button type="button" onClick={() => fileRef.current?.click()}><Icon name="upload" size={17} /> Import JSON</button><button className="danger" type="button" onClick={reset}>Reset learning records</button></div><input ref={fileRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose progress backup" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importBackup(file); event.target.value = ""; }} />{message && <p className={`inline-message inline-message--${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}{rollback && <button type="button" onClick={() => { replace(rollback); setRollback(null); setMessage({ kind: "success", text: "The previous in-session state was restored." }); }}>Undo last import or reset</button>}</section>
        <section><h2>Current data boundary</h2><p>Progress, preferences, and profile data remain in this browser or desktop webview. There is no account, live cloud sync, billing, or telemetry endpoint.</p></section>
      </div>
      {editingProfile && <div className="settings-profile-dialog" role="dialog" aria-modal="true" aria-label="Edit local learner profile"><Onboarding forceOpen onClose={() => setEditingProfile(false)} /></div>}
    </section>
  );
}
