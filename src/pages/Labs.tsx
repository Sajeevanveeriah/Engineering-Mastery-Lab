import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { modules } from "../data/modules";
import { moduleProgress } from "../lib/metrics";

const labMeta: Record<string, { icon: IconName; label: string; description: string }> = {
  pid: {
    icon: "control",
    label: "Controls",
    description: "Tune first and second-order plants, inspect step metrics, saturation and disturbance rejection."
  },
  electrical: {
    icon: "electrical",
    label: "Electrical",
    description: "Explore circuit laws, RC and RLC dynamics, filters, dividers and ADC quantisation."
  },
  embedded: {
    icon: "embedded",
    label: "Embedded",
    description: "Exercise state machines, debounce logic, timing budgets and serial bus framing."
  },
  plc: {
    icon: "plc",
    label: "Automation",
    description: "Operate a tank and conveyor HMI with alarms, trips, latches and interlocks."
  },
  robotics: {
    icon: "robotics",
    label: "Robotics",
    description: "Drive a differential robot, compare odometry, follow waypoints and plan with A*."
  },
  ml: {
    icon: "ml",
    label: "AI and ML",
    description: "Build transparent regression, classification, anomaly and remaining-life demonstrations."
  },
  mechanical: {
    icon: "mechanical",
    label: "Mechanical",
    description: "Analyse gears, power, damping, natural frequency, resonance and vibration response."
  },
  practice: {
    icon: "practice",
    label: "Practice",
    description: "Create traceability, FMEA, risk, FAT and SAT records, plus engineering decision logs."
  }
};

export function Labs() {
  const { progress } = useProgress();
  const completed = modules.filter((module) => moduleProgress(progress, module).percent === 100).length;

  return (
    <section className="page">
      <PageHeader
        eyebrow="Interactive curriculum"
        title="Engineering laboratories"
        description="Use each lab as a complete learning cycle: understand the model, simulate behaviour, verify a challenge, diagnose faults and capture portfolio evidence."
        meta={<span>{completed} of {modules.length} modules complete</span>}
      />

      <div className="lab-catalogue">
        {modules.map((module, index) => {
          const meta = labMeta[module.id] ?? { icon: "labs" as IconName, label: "Laboratory", description: module.learn[0] };
          const status = moduleProgress(progress, module);
          const nextAction = status.percent === 100 ? "Review lab" : status.done > 0 ? "Continue lab" : "Start lab";
          return (
            <article className="lab-card" key={module.id}>
              <div className="lab-card__topline">
                <div className={`lab-icon lab-icon--${module.id}`}><Icon name={meta.icon} size={24} /></div>
                <span className="badge">{meta.label}</span>
                <span className="lab-card__number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <h2>{module.title}</h2>
                <p className="muted">{meta.description}</p>
              </div>
              <div className="lab-card__progress">
                <div className="progress-label">
                  <span>{status.done} of {status.total} milestones</span>
                  <strong>{status.percent}%</strong>
                </div>
                <div className="progress-bar" role="progressbar" aria-label={`${module.title} completion`} aria-valuenow={status.percent} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${status.percent}%` }} />
                </div>
                <div className="lab-card__counts" aria-label="Module progress detail">
                  <span>{status.challengesDone}/{status.challengesTotal} challenges</span>
                  <span>{status.evidenceDone}/{status.evidenceTotal} artefacts</span>
                  <span>{status.reflectionDone ? "Reflection saved" : "Reflection pending"}</span>
                </div>
              </div>
              <Link className="btn lab-card__action" to={module.route}>
                {nextAction}
                <Icon name="arrow-right" size={17} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
