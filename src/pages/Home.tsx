import { Link } from "react-router";
import { EngineeringScene } from "../components/EngineeringScene";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import {
  academyCourses,
  academySkills,
  academyUnitSeeds,
  academyUnits
} from "../data/academy/catalogue";
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
import {
  ACADEMY_RECOMMENDATION_ALGORITHM_VERSION,
  buildAcademyHomeRecommendations
} from "../lib/academy/homeRecommendations";
import {
  academyCourseProgressCounts,
  academyUnitProgressCounts
} from "../lib/academy/navigation";
import { artefactCount, challengePassCount, overallProgress } from "../lib/metrics";

const recentTypeLabels = {
  lab: "Laboratory",
  pathway: "Pathway",
  project: "Project",
  tool: "Tool",
  skill: "Skill",
  course: "Course",
  unit: "Unit",
  lesson: "Lesson",
  review: "Review"
} as const;

const productStory = [
  {
    id: "learn",
    icon: "labs",
    title: "Learn through complete internal courses",
    description: "Move through 175 native lessons, worked examples, guided practice, laboratories, assessments and retrieval review, with E0-E4 and S001-S110 preserved as mappings.",
    route: "/learn/courses",
    action: "Enter the Academy"
  },
  {
    id: "build",
    icon: "practice",
    title: "Build engineering evidence",
    description: "Turn structured knowledge into rover releases and serious project briefs with milestones, risks, validation, and local records.",
    route: "/projects",
    action: "Choose a project"
  },
  {
    id: "analyse",
    icon: "workbench",
    title: "Analyse with bounded tools",
    description: "Calculate, convert, model, inspect CAD, compare scenarios, and retain transparent assumptions without pretending to be certified software.",
    route: "/tools",
    action: "Open the toolbox"
  },
  {
    id: "prove",
    icon: "report",
    title: "Prove what the record supports",
    description: "Trace challenges, artefacts, reflections, skills, and project outcomes into portfolio-ready evidence that remains honest about its limits.",
    route: "/portfolio",
    action: "Review evidence"
  }
] as const;

const capabilityShowcase = [
  ["robotics", "Robotics and autonomy", "Motion, odometry, state estimation, sensor fusion, and failure-aware tracking.", "/learn/flagships/robotics-autonomy"],
  ["embedded", "Embedded intelligence", "Sampling, quantisation, filtering, firmware timing, state logic, and fault handling.", "/learn/flagships/embedded-electronics-sensing"],
  ["control", "Control systems", "Dynamic response, PID behaviour, saturation diagnosis, and evidence-led tuning.", "/learn/flagships/controls"],
  ["mechanical", "Mechanical design", "Loads, torque, power, inertia, stress, deflection, tolerance, and model limits.", "/learn/flagships/mechanical-design-dynamics"],
  ["cad", "CAD and physical definition", "Bounded parametric parts, dimensioned drawings, mass properties, and local exports.", "/tools/cad"],
  ["ml", "Applied AI and ML", "Provenance-aware data splits, transparent baselines, held-out metrics, and residual analysis.", "/learn/flagships/applied-ai-ml"]
] as const;

export function Home() {
  const { progress, recordRecommendationReceipt } = useProgress();
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
  const academyHome = buildAcademyHomeRecommendations(
    progress.academy,
    now.toISOString()
  );
  const nextRecommendation = academyHome.recommendations[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const evidenceThisWeek = evidenceCompletedSince(
    progress.curriculumRecords,
    startOfWeek.toISOString()
  );
  const review = weeklyReviewDue(progress.weeklyReviews, now);
  const academyResume = progress.academy.resumeCursor;
  const academyResumeUnit = academyResume
    ? academyUnits.find((unit) => unit.id === academyResume.unitId)
    : undefined;
  const academyResumeCourse = academyResume
    ? academyCourses.find((course) => course.id === academyResume.courseId)
    : undefined;
  const academyResumeSeed = academyResumeUnit
    ? academyUnitSeeds.find((unit) => unit.id === academyResumeUnit.id)
    : undefined;
  const academyResumeLessonIndex = academyResumeUnit && academyResume
    ? academyResumeUnit.lessonIds.indexOf(academyResume.lessonId)
    : -1;
  const academyResumeLessonTitle = academyResumeSeed && academyResumeLessonIndex >= 0
    ? academyResumeSeed.lessonTitles[academyResumeLessonIndex]
    : academyResume?.lessonId;
  const academyContinueRoute = academyResume
    ? `${academyResume.route}?resume=${encodeURIComponent(academyResume.blockId)}`
    : "/learn/courses";
  const academyDueReviews = academyHome.dueReviewSkillIds.length;
  const academyCourseSummaries = academyCourses.map((course) => ({
    course,
    progress: academyCourseProgressCounts(progress.academy, course, academyUnits)
  }));
  const currentAcademyCourses = academyCourseSummaries.filter(
    (summary) => summary.progress.started > 0
  );
  const visibleAcademyCourses = (
    currentAcademyCourses.length > 0
      ? currentAcademyCourses
      : academyCourseSummaries.slice(0, 1)
  ).slice(0, 2);
  const currentAcademyUnit = academyResumeUnit
    ?? academyUnits.find((unit) =>
      unit.lessonIds.some((lessonId) =>
        !progress.academy.lessonRecords[lessonId]?.completionEarned
      )
    );
  const currentAcademyUnitProgress = currentAcademyUnit
    ? academyUnitProgressCounts(progress.academy, currentAcademyUnit)
    : null;
  const activeProjectEntry = Object.entries(progress.projects).find(([, state]) => state.status === "active");
  const activeProject = activeProjectEntry ? projects.find((item) => item.id === activeProjectEntry[0]) : undefined;
  const recentWork = progress.recentItems.slice(0, 4);
  const isNew = overall.done === 0
    && Object.keys(progress.pathways).length === 0
    && Object.keys(progress.projects).length === 0
    && Object.keys(progress.academy.lessonRecords).length === 0
    && progress.recentItems.length === 0;

  const recordRecommendationSelection = () => {
    if (academyHome.recommendations.length === 0) return;
    const alreadyRecorded = progress.academy.recommendationReceipts.some(
      (receipt) =>
        receipt.algorithmVersion === ACADEMY_RECOMMENDATION_ALGORITHM_VERSION
        && receipt.inputFingerprint === academyHome.inputFingerprint
    );
    if (alreadyRecorded) return;
    const generatedAt = new Date().toISOString();
    recordRecommendationReceipt({
      receiptId: `REC-${generatedAt.replace(/\D/g, "")}`,
      algorithmVersion: ACADEMY_RECOMMENDATION_ALGORITHM_VERSION,
      inputFingerprint: academyHome.inputFingerprint,
      candidateIds: academyHome.candidateIds,
      recommendationIds: academyHome.recommendations.map(
        (recommendation) => recommendation.activityId
      ),
      reasonCodes: [
        ...new Set(
          academyHome.recommendations.flatMap(
            (recommendation) => recommendation.reasonCodes
          )
        )
      ],
      generatedAt
    });
  };

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
          <p className="eyebrow">{academyResume ? `Exact resume - ${academyResume.lessonId}` : "Start inside the app"}</p>
          <h2 id="continue-heading">{academyResumeLessonTitle ?? "Begin the Engineering Academy"}</h2>
          <p>{academyResume
            ? `Continue ${academyResumeCourse?.title ?? "your course"} in ${academyResumeUnit?.title ?? "the saved unit"} at the last recorded teaching block. Notes, attempts and the scroll position stay local.`
            : "Learn from genuine beginner explanations through complete native lessons, worked examples, guided practice, laboratories, assessments and review."}</p>
          <div className="button-row">
            <Link className="btn primary" to={academyContinueRoute}>
              {academyResume ? "Resume exact position" : "Enter the Academy"} <Icon name="arrow-right" size={17} />
            </Link>
            <Link className="btn" to="/learn/review">Open review queue</Link>
          </div>
        </div>
        <EngineeringScene
          mastery={rebootSummary.mastery}
          stage={academyResumeCourse?.stage ?? currentStage.id}
          milestone={milestone.id}
          release={projectRelease.id}
        />
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
            <span>Read one teaching block, attempt its guided practice, then record the smallest honest piece of evidence.</span>
          </div>
          <Link to={academyContinueRoute}>{academyResume ? "Resume the exact lesson block" : "Open the beginner Academy"}</Link>
        </div>
        <p className="muted">
          Preserved accelerated sequence:{" "}
          <Link to={nextSession ? `/learn/reboot/sessions/${nextSession.id}` : "/learn/reboot"}>
            {nextSession ? `continue ${nextSession.id}` : "review S001-S110"}
          </Link>.
        </p>
        {academyDueReviews > 0 && (
          <div className="weekly-review-due" role="status">
            <div><strong>Academy review due</strong><span>{academyDueReviews} retrieval review{academyDueReviews === 1 ? "" : "s"} ready now.</span></div>
            <Link to="/learn/review">Open review queue</Link>
          </div>
        )}
        {review.due && (
          <div className="weekly-review-due" role="status">
            <div><strong>Weekly review due</strong><span>{review.weekKey}, workbook template week {review.templateWeek}: {review.plannedBlocks} planned short blocks.</span></div>
            <Link to="/tools/progress">Review planned versus completed</Link>
          </div>
        )}
      </section>

      <section className="home-academy-dashboard" aria-labelledby="academy-dashboard-heading">
        <div className="section-heading section-heading--outside">
          <div>
            <p className="eyebrow">Deterministic local guidance</p>
            <h2 id="academy-dashboard-heading">Your Academy next step</h2>
          </div>
          <Link to="/learn/courses">All courses</Link>
        </div>
        <div className="home-academy-dashboard__grid">
          <article className="bounded-object">
            <span className="badge">{nextRecommendation?.kind ?? "lesson"}</span>
            <h3>{nextRecommendation?.title ?? "Academy sequence complete"}</h3>
            <p>
              {nextRecommendation?.summary
                ?? "No unfinished lesson, due review or laboratory currently needs attention."}
            </p>
            {nextRecommendation
              && nextRecommendation.reason !== nextRecommendation.summary
              && (
                <details className="home-academy-dashboard__reason">
                  <summary>Why this recommendation?</summary>
                  <p>{nextRecommendation.reason}</p>
                </details>
              )}
            <Link
              to={nextRecommendation?.route ?? "/learn/courses"}
              onClick={recordRecommendationSelection}
            >
              {nextRecommendation ? "Open recommended activity" : "Review the catalogue"}{" "}
              <Icon name="arrow-right" size={15} />
            </Link>
          </article>
          <article className="bounded-object">
            <h3>Current courses and unit</h3>
            <ul>
              {visibleAcademyCourses.map(({ course, progress: courseProgress }) => (
                <li key={course.id}>
                  <Link to={`/learn/courses/${course.id}`}>{course.stage} - {course.title}</Link>
                  <span>{courseProgress.completed}/{courseProgress.total} lessons complete</span>
                </li>
              ))}
            </ul>
            {currentAcademyUnit && currentAcademyUnitProgress && (
              <p>
                Current unit: <strong>{currentAcademyUnit.title}</strong>.{" "}
                {currentAcademyUnitProgress.percent}% complete.
              </p>
            )}
          </article>
          <article className="bounded-object">
            <h3>Recent mastery</h3>
            {academyHome.recentMastery.length > 0 ? (
              <ul>
                {academyHome.recentMastery.map((record) => (
                  <li key={record.skillId}>
                    <span>
                      {academySkills.find((skill) => skill.id === record.skillId)?.title
                        ?? record.skillId}
                    </span>
                    <strong>{record.mastery}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No Academy mastery evidence yet. The first knowledge check starts the record.</p>
            )}
          </article>
          <article className="bounded-object">
            <h3>Current laboratory</h3>
            {academyHome.activeLab ? (
              <>
                <p>
                  <strong>{academyHome.activeLab.title}</strong> is{" "}
                  {academyHome.activeLab.status}.
                  {academyHome.activeLab.blocker
                    ? ` Blocker: ${academyHome.activeLab.blocker}`
                    : ""}
                </p>
                <Link to={academyHome.activeLab.route}>Resume laboratory</Link>
              </>
            ) : (
              <p>No unfinished Academy laboratory is recorded.</p>
            )}
          </article>
        </div>
      </section>

      <section className="home-story" aria-labelledby="product-story-heading">
        <div className="home-section-intro">
          <p className="eyebrow">One engineering practice</p>
          <h2 id="product-story-heading">Move from understanding to defensible proof</h2>
          <p>Each destination has a distinct job. Together they form a local, evidence-led engineering loop.</p>
        </div>
        <div className="home-story__grid">
          {productStory.map((item, index) => (
            <article className={`home-story-card home-story-card--${item.id}`} key={item.id}>
              <div className="home-story-card__index"><span>0{index + 1}</span><Icon name={item.icon} size={22} /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link to={item.route}>{item.action} <Icon name="arrow-right" size={15} /></Link>
            </article>
          ))}
        </div>
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

      <section className="home-capabilities" aria-labelledby="capability-showcase-heading">
        <div className="home-section-intro">
          <p className="eyebrow">Connected disciplines</p>
          <h2 id="capability-showcase-heading">Engineering capability, shown through real workflows</h2>
          <p>Open the existing learning, analysis, and design surfaces behind each capability.</p>
        </div>
        <div className="home-capabilities__grid">
          {capabilityShowcase.map(([icon, title, description, route]) => (
            <Link to={route} className="home-capability" key={title}>
              <span className="home-capability__icon"><Icon name={icon} size={22} /></span>
              <span><strong>{title}</strong><small>{description}</small></span>
              <Icon name="arrow-right" size={17} />
            </Link>
          ))}
        </div>
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

      <section className="home-closing" aria-labelledby="closing-continuation-heading">
        <div>
          <p className="eyebrow">{isNew ? "Start with one bounded action" : "Keep the evidence moving"}</p>
          <h2 id="closing-continuation-heading">{academyResume ? `Resume ${academyResume.lessonId}` : "Begin with the first complete lesson"}</h2>
          <p>{isNew
            ? "Learn one idea inside the app, complete its guided practice, and record one honest piece of evidence."
            : "The Academy returns to the saved block, while keeping attempts, evidence and mastery claims separate."}</p>
        </div>
        <Link className="btn primary" to={academyContinueRoute}>
          {academyResume ? "Resume exact position" : "Open the Academy"} <Icon name="arrow-right" size={17} />
        </Link>
      </section>
    </section>
  );
}
