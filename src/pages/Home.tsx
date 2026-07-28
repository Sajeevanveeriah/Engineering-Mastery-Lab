import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { capabilityStages, masteryModules } from "../data/masteryCurriculum";
import { pathways } from "../data/pathways";
import { projects } from "../data/projects";
import { REBOOT_CONTENT_VERSION } from "../data/rebootCurriculum";
import {
  currentMilestone,
  currentProjectRelease,
  evidenceCompletedSince,
  nextUnfinishedSession,
  rebootProgress,
  weeklyReviewDue
} from "../lib/curriculum";
import { artefactCount, challengePassCount, overallProgress } from "../lib/metrics";

const recentTypeLabels = {
  lab: "Laboratory",
  pathway: "Pathway",
  project: "Project",
  tool: "Tool",
  skill: "Skill"
} as const;

export function Home() {
  const { progress } = useProgress();
  const overall = overallProgress(progress);
  const evidence = artefactCount(progress);
  const recommendedPathway = pathways.find((item) => item.id === progress.profile?.recommendedPathwayId) ?? pathways[0];
  const currentPathway = [...pathways]
    .filter((pathway) => Boolean(progress.pathways[pathway.id]))
    .sort((left, right) =>
      progress.pathways[right.id].enrolledAt.localeCompare(progress.pathways[left.id].enrolledAt)
    )[0] ?? recommendedPathway;
  const currentPathwayState = progress.pathways[currentPathway.id];
  const completedPathwaySteps = currentPathway.steps.filter((step) =>
    currentPathwayState?.completedStepIds.includes(step.id)
  );
  const pathwayPercent = currentPathway.steps.length === 0
    ? 0
    : Math.round((completedPathwaySteps.length / currentPathway.steps.length) * 100);
  const nextPathwayStep = currentPathway.steps.find((step) =>
    !currentPathwayState?.completedStepIds.includes(step.id)
  );
  const nextSession = nextUnfinishedSession(progress.curriculumRecords);
  const milestone = currentMilestone(progress.curriculumRecords);
  const projectRelease = currentProjectRelease(progress.curriculumRecords);
  const rebootSummary = rebootProgress(progress);
  const currentMasteryModule = masteryModules.find((module) => {
    const record = progress.curriculumRecords[module.id];
    return record?.status !== "done" || record?.gateResult !== "passed";
  }) ?? masteryModules[masteryModules.length - 1];
  const currentStage = capabilityStages.find((stage) => stage.id === currentMasteryModule.stageId)
    ?? capabilityStages[0];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const evidenceThisWeek = evidenceCompletedSince(
    progress.curriculumRecords,
    startOfWeek.toISOString()
  );
  const review = weeklyReviewDue(progress.weeklyReviews, now);
  const activeProjectEntry = Object.entries(progress.projects).find(([, state]) => state.status === "active");
  const activeProject = activeProjectEntry ? projects.find((item) => item.id === activeProjectEntry[0]) : undefined;
  const recentWork = progress.recentItems.slice(0, 4);
  const isNew = overall.done === 0
    && Object.keys(progress.pathways).length === 0
    && Object.keys(progress.projects).length === 0
    && progress.recentItems.length === 0;

  return (
    <section className="page product-home">
      <PageHeader
        eyebrow={progress.profile ? `Local profile${progress.profile.displayName ? ` - ${progress.profile.displayName}` : ""}` : "Guest mode"}
        title="Today"
        description={isNew
          ? "Build capability you can prove through structured laboratories, practical projects, and recorded evidence."
          : "Continue where the evidence leads across your recent work, current pathway, and active project."}
        actions={<button className="btn btn--ghost" type="button" onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}><Icon name="search" size={17} /> Find anything</button>}
      />

      <section className="home-continue" aria-labelledby="continue-heading">
        <div>
          <p className="eyebrow">Continue - {nextSession?.id ?? "Fast-track complete"}</p>
          <h2 id="continue-heading">{nextSession?.topic ?? "Review the reproducible release"}</h2>
          <p>{nextSession?.microLesson ?? "All 110 fast-track sessions have a completion or diagnostic-skip record. Review evidence before claiming mastery."}</p>
          <div className="button-row">
            <Link className="btn primary" to={nextSession ? `/learn/reboot/sessions/${nextSession.id}` : "/learn/reboot"}>
              Continue <Icon name="arrow-right" size={17} />
            </Link>
            <Link className="btn" to="/learn/roadmap">View complete roadmap</Link>
          </div>
        </div>
        <div className="home-continue__metric">
          <strong>{rebootSummary.mastery}%</strong>
          <span>fast-track mastery gates passed</span>
        </div>
      </section>

      <section className="curriculum-now" aria-labelledby="curriculum-now-heading">
        <div className="section-heading section-heading--outside">
          <div>
            <p className="eyebrow">Truthful local record</p>
            <h2 id="curriculum-now-heading">Current learning position</h2>
          </div>
          <span className="badge">Content {REBOOT_CONTENT_VERSION}</span>
        </div>
        <dl className="curriculum-now__facts">
          <div><dt>Capability stage</dt><dd>{currentStage.id} - {currentStage.title}</dd></div>
          <div><dt>Fast-track milestone</dt><dd>{milestone.id} - {milestone.name}</dd></div>
          <div><dt>Rover release</dt><dd>{projectRelease.name}</dd></div>
          <div><dt>Evidence this week</dt><dd>{evidenceThisWeek} recorded item{evidenceThisWeek === 1 ? "" : "s"}</dd></div>
        </dl>
        <div className="minimum-day">
          <div>
            <strong>Minimum viable day</strong>
            <span>Recall for 3 min, run one 10 min smallest useful test, then record evidence for 2 min.</span>
          </div>
          <Link to={nextSession ? `/learn/reboot/sessions/${nextSession.id}` : "/learn/reboot"}>Open the next bounded session</Link>
        </div>
        {review.due && (
          <div className="weekly-review-due" role="status">
            <div><strong>Weekly review due</strong><span>{review.weekKey}, workbook template week {review.templateWeek}: {review.plannedBlocks} planned short blocks.</span></div>
            <Link to="/tools/progress">Review planned versus completed</Link>
          </div>
        )}
      </section>

      <div className="home-question-grid">
        <section aria-labelledby="current-journey-heading">
          <div className="section-heading section-heading--outside"><div><p className="eyebrow">Where am I heading?</p><h2 id="current-journey-heading">Current pathway</h2></div><Link to="/learn/pathways">All pathways</Link></div>
          <article className="bounded-object">
            <span className="badge">{currentPathway.difficulty}</span>
            <h3>{currentPathway.name}</h3>
            <p>{currentPathway.outcomes[0]}</p>
            <dl className="inline-facts">
              <div><dt>Status</dt><dd>{currentPathwayState?.status === "completed" ? "Completed" : currentPathwayState ? "In plan" : "Recommended"}</dd></div>
              <div><dt>Steps</dt><dd>{completedPathwaySteps.length}/{currentPathway.steps.length}</dd></div>
              <div><dt>Recorded</dt><dd>{pathwayPercent}%</dd></div>
              <div><dt>Effort</dt><dd>{currentPathway.effortHours} h</dd></div>
            </dl>
            <Link to={currentPathwayState && nextPathwayStep ? nextPathwayStep.route : `/learn/pathways/${currentPathway.id}`}>
              {currentPathwayState?.status === "completed" ? "Review pathway" : currentPathwayState ? "Continue pathway" : "View pathway"} <Icon name="arrow-right" size={15} />
            </Link>
          </article>
        </section>
        <section aria-labelledby="active-project-heading">
          <div className="section-heading section-heading--outside"><div><p className="eyebrow">What am I applying?</p><h2 id="active-project-heading">Active project</h2></div><Link to="/projects">Project catalogue</Link></div>
          {activeProject ? (
            <article className="bounded-object"><span className="badge">{activeProject.difficulty}</span><h3>{activeProject.title}</h3><p>{activeProject.summary}</p><Link to={`/projects/${activeProject.slug}`}>Resume project <Icon name="arrow-right" size={15} /></Link></article>
          ) : (
            <div className="empty-state"><strong>No active project yet</strong><p>Choose a brief when you are ready to turn learning into evidence.</p><Link className="btn" to="/projects">Find a project</Link></div>
          )}
        </section>
      </div>

      <section className="home-proof" aria-labelledby="proof-heading">
        <div><p className="eyebrow">What have I proved?</p><h2 id="proof-heading">Evidence snapshot</h2><p>These counts reflect recorded work, not accreditation or professional certification.</p></div>
        <dl>
          <div><dt>Passed challenges</dt><dd>{challengePassCount(progress)}</dd></div>
          <div><dt>Checked artefacts</dt><dd>{evidence.done}</dd></div>
          <div><dt>Rated skills</dt><dd>{overall.ratedSkills}</dd></div>
          <div><dt>Completed projects</dt><dd>{Object.values(progress.projects).filter((project) => project.status === "completed").length}</dd></div>
        </dl>
        <Link className="btn" to="/portfolio">Open portfolio</Link>
      </section>

      <section aria-labelledby="recent-work-heading">
        <div className="section-heading section-heading--outside"><div><p className="eyebrow">Where have I been?</p><h2 id="recent-work-heading">Recent work</h2></div><Link to="/learn">Discover learning</Link></div>
        {recentWork.length > 0 ? (
          <div className="simple-link-list">
            {recentWork.map((item, index) => {
              const visited = new Date(item.visitedAt);
              const visitedLabel = Number.isNaN(visited.valueOf())
                ? "Recently opened"
                : `Opened ${visited.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
              return (
                <Link key={`${item.type}-${item.id}-${index}`} to={item.route}>
                  <span><strong>{item.title}</strong><small>{visitedLabel}</small></span>
                  <span className="badge">{recentTypeLabels[item.type]}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No recent work yet</strong>
            <p>Open a pathway, laboratory, project, skill, or tool and it can appear here when that object records a visit.</p>
            <Link className="btn" to="/learn">Discover learning</Link>
          </div>
        )}
      </section>
    </section>
  );
}
