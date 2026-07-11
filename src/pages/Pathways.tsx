import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import { pathways } from "../data/pathways";
import { moduleProgress, overallProgress } from "../lib/metrics";

const pathwayIcons: Record<string, IconName> = {
  controls: "control",
  embedded: "embedded",
  robotics: "robotics",
  automation: "plc",
  electrical: "electrical",
  software: "workbench",
  professional: "practice"
};

export function Pathways() {
  const { progress } = useProgress();
  const summary = overallProgress(progress);

  const progressForRoute = (route: string): number | null => {
    const module = modules.find((item) => item.route === route);
    if (module) return moduleProgress(progress, module).percent;
    if (route === "/skills") return summary.totalSkills ? Math.round((summary.ratedSkills / summary.totalSkills) * 100) : 0;
    return null;
  };

  return (
    <section className="page pathways-page">
      <PageHeader
        eyebrow="Outcome-led routes"
        title="Learning pathways"
        description="Pick the route that matches the outcome you need now. Each pathway links practical laboratories, evidence work and the skills matrix in a deliberate order."
        meta={<span>{pathways.length} guided routes across the engineering stack</span>}
      />

      <div className="pathway-grid">
        {pathways.map((pathway, pathwayIndex) => {
          const tracked = pathway.steps.map((step) => progressForRoute(step.route)).filter((value): value is number => value !== null);
          const pathwayProgress = tracked.length ? Math.round(tracked.reduce((sum, value) => sum + value, 0) / tracked.length) : 0;
          const nextStep = pathway.steps.find((step) => (progressForRoute(step.route) ?? 0) < 100) ?? pathway.steps[0];
          return (
            <article className="pathway-card" key={pathway.id}>
              <div className="pathway-card__header">
                <div className="pathway-card__icon"><Icon name={pathwayIcons[pathway.id] ?? "pathways"} size={24} /></div>
                <div>
                  <span className="eyebrow">Pathway {String(pathwayIndex + 1).padStart(2, "0")}</span>
                  <h2>{pathway.name}</h2>
                </div>
                {tracked.length > 0 && <span className="pathway-card__percent">{pathwayProgress}%</span>}
              </div>
              <p className="pathway-card__audience">{pathway.audience}</p>
              {tracked.length > 0 && (
                <div className="progress-bar" role="progressbar" aria-label={`${pathway.name} tracked progress`} aria-valuenow={pathwayProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${pathwayProgress}%` }} />
                </div>
              )}
              <ol className="pathway-steps">
                {pathway.steps.map((step, index) => {
                  const trackedProgress = progressForRoute(step.route);
                  const complete = trackedProgress === 100;
                  return (
                    <li key={`${step.label}-${index}`}>
                      <span className={`pathway-step__marker${complete ? " pathway-step__marker--complete" : ""}`}>
                        {complete ? <Icon name="check" size={15} /> : index + 1}
                      </span>
                      <div>
                        <Link to={step.route}>{step.label}</Link>
                        {trackedProgress !== null && <span>{complete ? "Complete" : `${trackedProgress}% complete`}</span>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Link className="btn pathway-card__action" to={nextStep.route}>
                Open next step <Icon name="arrow-right" size={17} />
              </Link>
            </article>
          );
        })}
      </div>

      <div className="safety-note safety-note--neutral" role="note">
        <Icon name="target" size={20} />
        <p><strong>Progress is evidence-led.</strong> A tracked percentage reflects completed challenges, artefacts, reflections or ratings in the linked screen. Informational steps that have no completion record are shown without a percentage.</p>
      </div>
    </section>
  );
}
