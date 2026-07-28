import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import { projects } from "../data/projects";
import { skillDomains } from "../data/skills";
import { exportProgress } from "../lib/storage";
import { hasExactRequiredIds } from "./ProjectDetail";

type EvidenceType = "Challenge" | "Artefact" | "Reflection" | "Project" | "Manual";
type EvidenceStateFilter = "All" | "Complete" | "In progress";

export interface PortfolioEntry {
  id: string;
  title: string;
  description: string;
  discipline: string;
  type: EvidenceType;
  complete: boolean;
  stateLabel: string;
  provenance: string;
  linkedSkillIds: string[];
  url?: string;
}

export interface PendingRequirementGroup {
  moduleId: string;
  moduleTitle: string;
  discipline: string;
  items: string[];
}

export interface PortfolioSkillEvidence {
  domain: string;
  level: string;
  evidence: string;
}

export interface PortfolioAchievement {
  label: string;
  basis: string;
}

export interface PortfolioMarkdownInput {
  completedEntries: PortfolioEntry[];
  workInProgressEntries: PortfolioEntry[];
  pendingRequirementGroups: PendingRequirementGroup[];
  skillEvidence: PortfolioSkillEvidence[];
  achievements: PortfolioAchievement[];
}

const evidenceTypes: EvidenceType[] = ["Challenge", "Artefact", "Reflection", "Project", "Manual"];
const skillDomainLabels = new Map(skillDomains.map((domain) => [domain.id, domain.name] as const));
const skillLevelLabels = new Map(skillDomains.flatMap((domain) =>
  domain.levels.map((level) => [level.id, `${domain.name} - ${level.name}`] as const)
));
const engineeringWorkspacePresentation: Record<string, {
  title: string;
  discipline: string;
  linkedSkillIds: string[];
}> = {
  "motor-sizing-study": {
    title: "Motor sizing engineering record",
    discipline: "Mechanical and cross-discipline",
    linkedSkillIds: ["mechanical", "controls"]
  },
  "controls-flagship": {
    title: "Controls deterministic kernel record",
    discipline: "Controls",
    linkedSkillIds: ["controls"]
  },
  "robotics-autonomy-flagship": {
    title: "Robotics and autonomy deterministic kernel record",
    discipline: "Robotics",
    linkedSkillIds: ["robotics"]
  },
  "embedded-electronics-sensing-flagship": {
    title: "Embedded electronics and sensing deterministic kernel record",
    discipline: "Embedded and electronics",
    linkedSkillIds: ["embedded", "electronics"]
  },
  "mechanical-design-dynamics-flagship": {
    title: "Mechanical design and dynamics deterministic kernel record",
    discipline: "Mechanical",
    linkedSkillIds: ["mechanical"]
  },
  "applied-ai-ml-flagship": {
    title: "Applied AI and ML deterministic kernel record",
    discipline: "AI and ML",
    linkedSkillIds: ["aiml"]
  }
};

function disciplineLabel(value: string): string {
  return skillDomainLabels.get(value) ?? value;
}

function linkedSkillLabel(id: string): string {
  const known = skillDomainLabels.get(id) ?? skillLevelLabels.get(id);
  if (known) return known;
  if (id === "ai-ml") return skillDomainLabels.get("aiml") ?? "AI / ML";
  if (id === "plc-scada") return skillDomainLabels.get("plc") ?? "PLC / SCADA";
  return id.split("-").filter(Boolean).map((part) => part.charAt(0).toLocaleUpperCase("en-AU") + part.slice(1)).join(" ");
}

export function escapePortfolioMarkdownText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[!-/:-@[-`{-~]/g, "\\$&");
}

function portfolioMarkdownEntry(entry: PortfolioEntry): string[] {
  return [
    `### ${escapePortfolioMarkdownText(entry.title)}`,
    "",
    `- Type: ${escapePortfolioMarkdownText(entry.type)}`,
    `- State: ${escapePortfolioMarkdownText(entry.stateLabel)}`,
    `- Discipline: ${escapePortfolioMarkdownText(entry.discipline)}`,
    ...(entry.linkedSkillIds.length
      ? [`- Linked skills: ${escapePortfolioMarkdownText(entry.linkedSkillIds.map(linkedSkillLabel).join(", "))}`]
      : []),
    ...(entry.url
      ? [`- Learner-provided URL (plain text): ${escapePortfolioMarkdownText(entry.url)}`]
      : []),
    `- Provenance: ${escapePortfolioMarkdownText(entry.provenance)}`,
    "",
    escapePortfolioMarkdownText(entry.description),
    ""
  ];
}

export function buildPortfolioMarkdown(input: PortfolioMarkdownInput): string {
  return [
    "# Engineering Mastery Lab Portfolio",
    "",
    "> Learner-generated local records. They are not independently assessed evidence, a professional licence, a qualification, an accredited certificate, or standards certification.",
    "",
    "## Completed evidence records",
    "",
    ...input.completedEntries.flatMap(portfolioMarkdownEntry),
    "## Work in progress",
    "",
    ...input.workInProgressEntries.flatMap(portfolioMarkdownEntry),
    "## Unconfirmed catalogue evidence requirements",
    "",
    ...input.pendingRequirementGroups.flatMap((group) => [
      `### ${escapePortfolioMarkdownText(group.moduleTitle)}`,
      "",
      `- Discipline: ${escapePortfolioMarkdownText(group.discipline)}`,
      ...group.items.map((item) => `- ${escapePortfolioMarkdownText(item)}`),
      ""
    ]),
    "## Skills with learner-provided evidence notes",
    "",
    ...input.skillEvidence.flatMap((item) => [
      `### ${escapePortfolioMarkdownText(item.domain)} - ${escapePortfolioMarkdownText(item.level)}`,
      "",
      escapePortfolioMarkdownText(item.evidence),
      ""
    ]),
    "## Achievements from local record thresholds",
    "",
    ...input.achievements.flatMap((item) => [
      `- ${escapePortfolioMarkdownText(item.label)}`,
      `  - ${escapePortfolioMarkdownText(item.basis)}`
    ])
  ].join("\n");
}

function downloadText(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function EvidenceCard({ entry }: { entry: PortfolioEntry }) {
  const linkedSkills = entry.linkedSkillIds.map(linkedSkillLabel);
  return (
    <article className={entry.complete ? "" : "pending"}>
      <div className="evidence-feed__badges">
        <span className="badge">{entry.type}</span>
        <span className={`badge ${entry.complete ? "ok" : "warn"}`}>{entry.stateLabel}</span>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.description}</p>
      <small><strong>Discipline:</strong> {entry.discipline}</small>
      {linkedSkills.length > 0 && <small><strong>Linked skills:</strong> {linkedSkills.join(", ")}</small>}
      <small><strong>Provenance:</strong> {entry.provenance}</small>
      {entry.url && <a href={entry.url} target="_blank" rel="noreferrer">Open learner-provided URL</a>}
    </article>
  );
}

export function Portfolio() {
  const { progress, update } = useProgress();
  const [filter, setFilter] = useState<"All" | EvidenceType>("All");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [completionFilter, setCompletionFilter] = useState<EvidenceStateFilter>("All");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [discipline, setDiscipline] = useState("Cross-discipline");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const entries = useMemo<PortfolioEntry[]>(() => {
    const recorded: PortfolioEntry[] = [];

    for (const module of modules) {
      const moduleDiscipline = disciplineLabel(module.domainId);
      for (const challenge of module.challenges) {
        const result = progress.challenges[challenge.id];
        if (!result) continue;
        recorded.push({
          id: challenge.id,
          title: challenge.title,
          description: result.notes?.trim() || `Pass requirement: ${challenge.passCriteria}`,
          discipline: moduleDiscipline,
          type: "Challenge",
          complete: result.passed,
          stateLabel: result.passed ? "Pass recorded" : "Attempt recorded",
          provenance: `Local challenge state from ${module.title}. It is not an independent assessment.`,
          linkedSkillIds: [module.domainId]
        });
      }

      module.evidence.forEach((item, index) => {
        const id = `${module.id}-ev${index}`;
        if (!progress.artefacts[id]) return;
        recorded.push({
          id,
          title: item,
          description: `Evidence requirement from ${module.title}.`,
          discipline: moduleDiscipline,
          type: "Artefact",
          complete: true,
          stateLabel: "Availability confirmed",
          provenance: "The learner ticked this item as available. The app does not store or inspect the asset.",
          linkedSkillIds: [module.domainId]
        });
      });

      const reflection = progress.reflections[module.id]?.trim();
      if (reflection) {
        recorded.push({
          id: `reflection-${module.id}`,
          title: `${module.title} reflection`,
          description: reflection,
          discipline: moduleDiscipline,
          type: "Reflection",
          complete: true,
          stateLabel: "Reflection saved",
          provenance: "Learner-authored reflection stored in local progress.",
          linkedSkillIds: [module.domainId]
        });
      }
    }

    for (const project of projects) {
      const projectProgress = progress.projects[project.id];
      if (!projectProgress) continue;
      const requiredMilestoneIds = project.milestones.map((milestone) => milestone.id);
      const requiredEvidenceIds = project.portfolioEvidence.map((_, index) => `evidence-${index}`);
      const hasValidCompletion = projectProgress.status === "completed"
        && hasExactRequiredIds(projectProgress.completedMilestoneIds, requiredMilestoneIds)
        && hasExactRequiredIds(projectProgress.checkedEvidenceIds, requiredEvidenceIds);
      recorded.push({
        id: `project-${project.id}`,
        title: project.title,
        description: projectProgress.notes.trim() || project.summary,
        discipline: project.disciplines.join(", "),
        type: "Project",
        complete: hasValidCompletion,
        stateLabel: hasValidCompletion
          ? "Completion recorded"
          : projectProgress.status === "completed"
            ? "Completion needs review"
            : projectProgress.status === "paused"
              ? "Paused build"
              : "Active build",
        provenance: "Learner-managed milestone, evidence, and notes record. The app does not independently validate the project.",
        linkedSkillIds: project.linkedSkills
      });
    }

    for (const item of progress.manualEvidence) {
      recorded.push({
        id: item.id,
        title: item.title,
        description: item.description,
        discipline: disciplineLabel(item.discipline),
        type: "Manual",
        complete: true,
        stateLabel: "Learner-added record",
        provenance: "Manually added by the learner. Any linked URL and its contents are not reviewed by the app.",
        linkedSkillIds: item.linkedSkills,
        url: item.url
      });
    }

    for (const workspace of Object.values(progress.engineeringWorkspaces)) {
      const presentation = engineeringWorkspacePresentation[workspace.projectId] ?? {
        title: "Engineering project bundle",
        discipline: "Cross-discipline",
        linkedSkillIds: []
      };
      recorded.push({
        id: `engineering-workspace-${workspace.projectId}`,
        title: presentation.title,
        description: "Versioned local variables, scenarios, calculation records, notebook blocks, and evidence lineage were retained in a portable project bundle.",
        discipline: presentation.discipline,
        type: "Artefact",
        complete: true,
        stateLabel: "Validated local bundle retained",
        provenance: `Local progress schema version 4 record saved ${new Date(workspace.updatedAt).toLocaleDateString("en-AU")}. The integrity digest detects corruption but is not authentication or independent engineering validation.`,
        linkedSkillIds: presentation.linkedSkillIds
      });
    }

    return recorded;
  }, [progress]);

  const pendingRequirementGroups = useMemo<PendingRequirementGroup[]>(() => modules
    .map((module) => ({
      moduleId: module.id,
      moduleTitle: module.title,
      discipline: disciplineLabel(module.domainId),
      items: module.evidence.filter((_, index) => !progress.artefacts[`${module.id}-ev${index}`])
    }))
    .filter((group) => group.items.length > 0), [progress.artefacts]);

  const skillEvidence = skillDomains.flatMap((domain) => domain.levels
    .filter((level) => progress.skillRatings[level.id]?.evidence.trim())
    .map((level) => ({ id: level.id, domain: domain.name, level: level.name, evidence: progress.skillRatings[level.id].evidence })));
  const achievements = [
    ...(entries.filter((item) => item.type === "Challenge" && item.complete).length >= 3 ? [{
      id: "three-challenge-passes",
      label: "Three challenge pass records",
      basis: "Threshold: at least three local challenge records are marked passed."
    }] : []),
    ...(modules.some((module) => module.challenges.every((challenge) => progress.challenges[challenge.id]?.passed) && module.evidence.every((_, index) => progress.artefacts[`${module.id}-ev${index}`])) ? [{
      id: "laboratory-checklist",
      label: "One laboratory checklist completed",
      basis: "Threshold: every challenge is marked passed and every evidence item is checked in one laboratory."
    }] : []),
    ...(entries.some((entry) => entry.type === "Project" && entry.complete) ? [{
      id: "project-completion",
      label: "One project completion checklist recorded",
      basis: "Threshold: at least one local project record has complete status with exact requirement membership."
    }] : []),
    ...(skillEvidence.length >= 5 ? [{
      id: "five-skill-notes",
      label: "Evidence notes recorded for five skills",
      basis: "Threshold: at least five skill levels contain learner-provided evidence notes."
    }] : [])
  ];
  const completedEntries = entries.filter((entry) => entry.complete);
  const workInProgressEntries = entries.filter((entry) => !entry.complete);
  const disciplines = [...new Set([
    ...entries.map((entry) => entry.discipline),
    ...pendingRequirementGroups.map((group) => group.discipline)
  ])].sort();
  const matchesEntryFilters = (entry: PortfolioEntry) =>
    (filter === "All" || entry.type === filter)
    && (disciplineFilter === "All" || entry.discipline === disciplineFilter);
  const visibleCompleted = completionFilter === "In progress" ? [] : completedEntries.filter(matchesEntryFilters);
  const visibleWorkInProgress = completionFilter === "Complete" ? [] : workInProgressEntries.filter(matchesEntryFilters);
  const showPendingRequirements = completionFilter !== "Complete" && (filter === "All" || filter === "Artefact");
  const visiblePendingGroups = showPendingRequirements
    ? pendingRequirementGroups.filter((group) => disciplineFilter === "All" || group.discipline === disciplineFilter)
    : [];
  const visiblePendingCount = visiblePendingGroups.reduce((total, group) => total + group.items.length, 0);
  const pendingRequirementCount = pendingRequirementGroups.reduce((total, group) => total + group.items.length, 0);

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((current) => current.includes(skillId)
      ? current.filter((id) => id !== skillId)
      : [...current, skillId]);
  };

  const addManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!title.trim() || !description.trim()) return setFormError("Title and description are required.");
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) return setFormError("Optional URL must begin with http:// or https://.");
    const entry = {
      id: `manual-${crypto.randomUUID()}`,
      title: title.trim(),
      description: description.trim(),
      ...(url.trim() ? { url: url.trim() } : {}),
      linkedSkills: selectedSkillIds,
      discipline,
      createdAt: new Date().toISOString()
    };
    update((current) => ({ ...current, manualEvidence: [...current.manualEvidence, entry] }));
    setTitle("");
    setDescription("");
    setUrl("");
    setSelectedSkillIds([]);
  };

  const markdown = buildPortfolioMarkdown({
    completedEntries,
    workInProgressEntries,
    pendingRequirementGroups,
    skillEvidence,
    achievements
  });

  return (
    <section className="page portfolio-page">
      <PageHeader
        eyebrow="Learner-generated evidence"
        title="Prove"
        description="Curate completed records, active work, skill evidence notes, and local achievement thresholds without presenting learner assertions as independent validation."
        actions={<div className="button-row"><button type="button" onClick={() => window.print()}>Print view</button><button type="button" onClick={() => downloadText("engineering-mastery-lab-portfolio.md", markdown, "text/markdown")}>Export Markdown</button><button type="button" onClick={() => downloadText("engineering-mastery-lab-progress.json", exportProgress(progress), "application/json")}>Export JSON</button></div>}
      />
      <section className="capstone-entry" aria-labelledby="capstone-entry-heading">
        <div><p className="eyebrow">End-to-end R&D proof</p><h2 id="capstone-entry-heading">Defensible rover capstone</h2><p>Trace stakeholder need through requirements, architecture, risk, tests and results before making a portfolio claim.</p></div>
        <Link className="btn primary" to="/portfolio/capstone">Open capstone evidence matrix</Link>
      </section>
      <div className="safety-note safety-note--neutral"><Icon name="info" size={20} /><p><strong>Evidence and provenance boundary.</strong> This view is derived from local progress state, learner-entered notes, learner-confirmed checkboxes, and learner-provided links. The app does not inspect linked assets or provide independent assessment. These records are not a professional licence, qualification, accredited certificate, or standards certification.</p></div>
      <div className="portfolio-summary"><dl><div><dt>Completed records</dt><dd>{completedEntries.length}</dd></div><div><dt>Work in progress</dt><dd>{workInProgressEntries.length}</dd></div><div><dt>Skills with evidence notes</dt><dd>{skillEvidence.length}</dd></div><div><dt>Record thresholds reached</dt><dd>{achievements.length}</dd></div></dl></div>
      {entries.length === 0 && (
        <section className="card" aria-labelledby="first-evidence-heading">
          <p className="eyebrow">First evidence record</p>
          <h2 id="first-evidence-heading">Prove one claim at a time</h2>
          <p>Complete a challenge, save a reflection, confirm an artefact that actually exists, or start a Build brief. Unconfirmed catalogue requirements remain summarised below until you choose to inspect them.</p>
        </section>
      )}
      <nav className="hub-tabs" aria-label="Evidence type filters"><button type="button" className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}>All records</button>{evidenceTypes.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav>
      <div className="portfolio-filter-row">
        <label>Discipline<select value={disciplineFilter} onChange={(event) => setDisciplineFilter(event.target.value)}><option>All</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Record state<select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value as EvidenceStateFilter)}><option>All</option><option>Complete</option><option>In progress</option></select></label>
      </div>
      <div className="portfolio-layout">
        <div>
          {completionFilter !== "In progress" && (
            <section aria-labelledby="completed-evidence-heading">
              <div className="section-heading section-heading--outside"><div><p className="eyebrow">Completed learner records</p><h2 id="completed-evidence-heading">Completed evidence</h2></div><strong>{visibleCompleted.length}</strong></div>
              {visibleCompleted.length > 0 ? <div className="evidence-feed">{visibleCompleted.map((entry) => <EvidenceCard entry={entry} key={entry.id} />)}</div> : <div className="empty-state"><strong>No completed evidence matches this view</strong><p>Change the filters, or complete and retain one evidence record before presenting it here.</p></div>}
            </section>
          )}
          {completionFilter !== "Complete" && (
            <section aria-labelledby="work-in-progress-heading">
              <div className="section-heading section-heading--outside"><div><p className="eyebrow">Recorded activity</p><h2 id="work-in-progress-heading">Work in progress</h2></div><strong>{visibleWorkInProgress.length}</strong></div>
              {visibleWorkInProgress.length > 0 ? <div className="evidence-feed">{visibleWorkInProgress.map((entry) => <EvidenceCard entry={entry} key={entry.id} />)}</div> : <div className="empty-state"><strong>No work in progress matches this view</strong><p>Started or paused Build records and recorded challenge attempts appear here.</p></div>}
            </section>
          )}
          {showPendingRequirements && (
            <section aria-labelledby="pending-requirements-heading">
              <p className="eyebrow">Progressive detail</p>
              <h2 id="pending-requirements-heading">Unconfirmed evidence requirements</h2>
              {visiblePendingCount > 0 ? (
                <details>
                  <summary><strong>{visiblePendingCount} catalogue requirements remain unconfirmed</strong></summary>
                  <p>These are prompts from the learning catalogue, not evidence records and not work the app claims you have started.</p>
                  {visiblePendingGroups.map((group) => (
                    <details key={group.moduleId}>
                      <summary>{group.moduleTitle} - {group.items.length} remaining</summary>
                      <p><strong>Discipline:</strong> {group.discipline}</p>
                      <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                    </details>
                  ))}
                </details>
              ) : <div className="empty-state"><strong>No unconfirmed requirements match this view</strong><p>Change the discipline or evidence type filter to inspect another catalogue area.</p></div>}
            </section>
          )}
          <section aria-labelledby="portfolio-skills"><p className="eyebrow">Learner-provided support</p><h2 id="portfolio-skills">Skills with evidence notes</h2><p>These notes come from the Skills matrix. They describe learner-provided support and are not independent competency assessments.</p>{skillEvidence.length ? <div className="simple-list">{skillEvidence.map((item) => <article key={item.id}><strong>{item.domain} - {item.level}</strong><p>{item.evidence}</p><small>Provenance: learner-entered skill evidence note.</small></article>)}</div> : <div className="empty-state"><strong>No skill evidence notes yet</strong><p>Add a source, calculation, report, or test record in the Skills matrix.</p></div>}</section>
          <section aria-labelledby="portfolio-achievements"><p className="eyebrow">Local thresholds</p><h2 id="portfolio-achievements">Achievements from local records</h2><p>These labels report thresholds in the saved learner record. They do not represent external review, accreditation, or certification.</p>{achievements.length ? <ul className="achievement-list">{achievements.map((item) => <li key={item.id}><Icon name="check" size={18} /><span><strong>{item.label}</strong><small>{item.basis}</small></span></li>)}</ul> : <div className="empty-state"><strong>No local record threshold reached</strong><p>Thresholds use recorded challenge passes, checked artefacts, skill evidence notes, and Build completion states.</p></div>}</section>
        </div>
        <aside>
          <details className="manual-evidence-form">
            <summary><strong>Add manual evidence</strong></summary>
            <p>Record work completed outside the built-in journeys. You are responsible for the description, links, skill mapping, and reviewability of the evidence.</p>
            <form onSubmit={addManual}>
              <div className="form-field"><label htmlFor="evidence-title">Title</label><input id="evidence-title" value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} /></div>
              <div className="form-field"><label htmlFor="evidence-description">Description</label><textarea id="evidence-description" rows={5} value={description} maxLength={20000} onChange={(event) => setDescription(event.target.value)} /></div>
              <div className="form-field"><label htmlFor="evidence-url">Supporting URL <span className="muted">(optional)</span></label><input id="evidence-url" type="url" value={url} maxLength={2000} onChange={(event) => setUrl(event.target.value)} /></div>
              <div className="form-field"><label htmlFor="evidence-discipline">Discipline</label><select id="evidence-discipline" value={discipline} onChange={(event) => setDiscipline(event.target.value)}><option>Cross-discipline</option>{skillDomains.map((domain) => <option key={domain.id} value={domain.name}>{domain.name}</option>)}</select></div>
              <fieldset>
                <legend>Linked skills <span className="muted">(optional)</span></legend>
                <p>Choose skills from the existing catalogue. The stable catalogue IDs are stored with this record.</p>
                <div className="choice-grid choice-grid--compact">
                  {skillDomains.map((domain) => <label key={domain.id}><input type="checkbox" checked={selectedSkillIds.includes(domain.id)} onChange={() => toggleSkill(domain.id)} /><span>{domain.name}</span></label>)}
                </div>
              </fieldset>
              {formError && <p className="inline-message inline-message--error" role="alert">{formError}</p>}
              <button className="primary" type="submit">Add learner record</button>
            </form>
          </details>
        </aside>
      </div>
      <p className="muted">Catalogue context: {pendingRequirementCount} evidence requirements are currently unconfirmed across all laboratories. Expand the grouped summary above to inspect them.</p>
    </section>
  );
}
