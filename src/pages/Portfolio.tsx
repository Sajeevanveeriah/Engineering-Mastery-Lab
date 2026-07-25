import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import { projects } from "../data/projects";
import { skillDomains } from "../data/skills";
import { exportProgress } from "../lib/storage";

function downloadText(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function Portfolio() {
  const { progress, update } = useProgress();
  const [filter, setFilter] = useState("All");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [completionFilter, setCompletionFilter] = useState("All");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [discipline, setDiscipline] = useState("Cross-discipline");
  const [skills, setSkills] = useState("");
  const [formError, setFormError] = useState("");

  const entries = useMemo<Array<{ id: string; title: string; description: string; discipline: string; type: string; complete: boolean; url?: string }>>(() => {
    const challengeEntries = modules.flatMap((module) => module.challenges
      .filter((challenge) => progress.challenges[challenge.id])
      .map((challenge) => ({ id: challenge.id, title: challenge.title, description: progress.challenges[challenge.id]?.notes || challenge.passCriteria, discipline: module.domainId, type: "Challenge", complete: Boolean(progress.challenges[challenge.id]?.passed) })));
    const artefactEntries = modules.flatMap((module) => module.evidence.map((item, index) => ({ id: `${module.id}-ev${index}`, title: item, description: module.title, discipline: module.domainId, type: "Artefact", complete: Boolean(progress.artefacts[`${module.id}-ev${index}`]) })));
    const reflectionEntries = modules.filter((module) => progress.reflections[module.id]?.trim()).map((module) => ({ id: `reflection-${module.id}`, title: `${module.title} reflection`, description: progress.reflections[module.id], discipline: module.domainId, type: "Reflection", complete: true }));
    const projectEntries = projects.filter((project) => progress.projects[project.id]).map((project) => ({ id: `project-${project.id}`, title: project.title, description: progress.projects[project.id]?.notes || project.summary, discipline: project.disciplines.join(", "), type: "Project", complete: progress.projects[project.id]?.status === "completed" }));
    const manual = progress.manualEvidence.map((item) => ({ id: item.id, title: item.title, description: item.description, discipline: item.discipline, type: "Manual", complete: true, url: item.url }));
    return [...challengeEntries, ...artefactEntries, ...reflectionEntries, ...projectEntries, ...manual];
  }, [progress]);

  const skillEvidence = skillDomains.flatMap((domain) => domain.levels
    .filter((level) => progress.skillRatings[level.id]?.evidence.trim())
    .map((level) => ({ id: level.id, domain: domain.name, level: level.name, evidence: progress.skillRatings[level.id].evidence })));
  const achievements = [
    ...(entries.filter((item) => item.type === "Challenge" && item.complete).length >= 3 ? ["Three verified challenges"] : []),
    ...(modules.some((module) => module.challenges.every((challenge) => progress.challenges[challenge.id]?.passed) && module.evidence.every((_, index) => progress.artefacts[`${module.id}-ev${index}`])) ? ["Complete laboratory evidence set"] : []),
    ...(Object.values(progress.projects).some((project) => project.status === "completed") ? ["Validated project completion record"] : []),
    ...(skillEvidence.length >= 5 ? ["Five skills supported by evidence"] : [])
  ];
  const disciplines = [...new Set(entries.map((entry) => entry.discipline))].sort();
  const visible = entries.filter((entry) =>
    (filter === "All" || entry.type === filter)
    && (disciplineFilter === "All" || entry.discipline === disciplineFilter)
    && (completionFilter === "All" || (completionFilter === "Complete" ? entry.complete : !entry.complete))
  );
  const completedEntryCount = entries.filter((entry) => entry.complete).length;

  const addManual = () => {
    setFormError("");
    if (!title.trim() || !description.trim()) return setFormError("Title and description are required.");
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) return setFormError("Optional URL must begin with http:// or https://.");
    const entry = {
      id: `manual-${crypto.randomUUID()}`,
      title: title.trim(),
      description: description.trim(),
      ...(url.trim() ? { url: url.trim() } : {}),
      linkedSkills: skills.split(",").map((item) => item.trim()).filter(Boolean),
      discipline,
      createdAt: new Date().toISOString()
    };
    update((current) => ({ ...current, manualEvidence: [...current.manualEvidence, entry] }));
    setTitle(""); setDescription(""); setUrl(""); setSkills("");
  };

  const markdown = [
    "# Engineering Mastery Lab Portfolio",
    "",
    "> Learner-generated evidence. This is not a professional licence, qualification, accredited certificate, or standards certification.",
    "",
    ...entries.flatMap((entry) => [`## ${entry.title}`, "", `- Type: ${entry.type}`, `- Discipline: ${entry.discipline}`, "", entry.description, ""]),
    "## Skills with evidence", "",
    ...skillEvidence.flatMap((item) => [`### ${item.domain} - ${item.level}`, "", item.evidence, ""])
  ].join("\n");

  return (
    <section className="page portfolio-page">
      <PageHeader eyebrow="Learner-generated evidence" title="Portfolio" description="Bring passed challenges, checked artefacts, reflections, skills, projects, and manual evidence into one reviewable local record." actions={<div className="button-row"><button type="button" onClick={() => window.print()}>Print view</button><button type="button" onClick={() => downloadText("engineering-mastery-lab-portfolio.md", markdown, "text/markdown")}>Export Markdown</button><button type="button" onClick={() => downloadText("engineering-mastery-lab-progress.json", exportProgress(progress), "application/json")}>Export JSON</button></div>} />
      <div className="safety-note safety-note--neutral"><Icon name="info" size={20} /><p><strong>Evidence boundary.</strong> Completion records are created by the learner. They are not a professional licence, qualification, accredited certificate, or standards certification.</p></div>
      <div className="portfolio-summary"><dl><div><dt>Complete evidence</dt><dd>{completedEntryCount}</dd></div><div><dt>Skills with evidence</dt><dd>{skillEvidence.length}</dd></div><div><dt>Evidence-based achievements</dt><dd>{achievements.length}</dd></div></dl></div>
      <nav className="hub-tabs" aria-label="Portfolio filters"><button type="button" className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}>All</button>{["Challenge", "Artefact", "Reflection", "Project", "Manual"].map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav>
      <div className="portfolio-filter-row">
        <label>Discipline<select value={disciplineFilter} onChange={(event) => setDisciplineFilter(event.target.value)}><option>All</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Completion state<select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value)}><option>All</option><option>Complete</option><option>Pending</option></select></label>
      </div>
      <div className="portfolio-layout">
        <div>
          <section aria-labelledby="portfolio-evidence"><div className="section-heading section-heading--outside"><div><p className="eyebrow">Recorded proof</p><h2 id="portfolio-evidence">Evidence</h2></div><strong>{visible.length}</strong></div>
            <div className="evidence-feed">{visible.map((entry) => <article key={entry.id} className={entry.complete ? "" : "pending"}><div className="evidence-feed__badges"><span className="badge">{entry.type}</span><span className={`badge ${entry.complete ? "ok" : ""}`}>{entry.complete ? "Complete" : "Pending"}</span></div><h3>{entry.title}</h3><p>{entry.description}</p><small>{entry.discipline}</small>{entry.url && <a href={entry.url} target="_blank" rel="noreferrer">Open supporting URL</a>}</article>)}</div>
            {visible.length === 0 && <div className="empty-state"><strong>No evidence in this view</strong><p>Complete a challenge, check an artefact, save a reflection, finish a project, or add a manual entry.</p></div>}
          </section>
          <section aria-labelledby="portfolio-skills"><h2 id="portfolio-skills">Skills with evidence</h2>{skillEvidence.length ? <div className="simple-list">{skillEvidence.map((item) => <article key={item.id}><strong>{item.domain} - {item.level}</strong><p>{item.evidence}</p></article>)}</div> : <div className="empty-state"><strong>No skill evidence yet</strong><p>Add a source, calculation, report, or test record in the Skills matrix.</p></div>}</section>
          <section aria-labelledby="portfolio-achievements"><h2 id="portfolio-achievements">Evidence-based achievements</h2>{achievements.length ? <ul className="achievement-list">{achievements.map((item) => <li key={item}><Icon name="check" size={18} />{item}</li>)}</ul> : <div className="empty-state"><strong>No achievement threshold reached</strong><p>Achievements appear only from recorded challenge, artefact, skill, or project evidence.</p></div>}</section>
        </div>
        <aside className="manual-evidence-form">
          <h2>Add manual evidence</h2><p>Link work completed outside the built-in journeys.</p>
          <div className="form-field"><label htmlFor="evidence-title">Title</label><input id="evidence-title" value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="evidence-description">Description</label><textarea id="evidence-description" rows={5} value={description} maxLength={20000} onChange={(event) => setDescription(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="evidence-url">Supporting URL <span className="muted">(optional)</span></label><input id="evidence-url" type="url" value={url} maxLength={2000} onChange={(event) => setUrl(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="evidence-discipline">Discipline</label><input id="evidence-discipline" value={discipline} maxLength={120} onChange={(event) => setDiscipline(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="evidence-skills">Linked skill IDs <span className="muted">(comma separated)</span></label><input id="evidence-skills" value={skills} onChange={(event) => setSkills(event.target.value)} /></div>
          {formError && <p className="inline-message inline-message--error" role="alert">{formError}</p>}
          <button className="primary" type="button" onClick={addManual}>Add evidence</button>
        </aside>
      </div>
    </section>
  );
}
