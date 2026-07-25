export type Difficulty = "Foundation" | "Intermediate" | "Advanced";
export type PathwayStepType = "lab" | "project" | "tool" | "skill";

export interface PathwayStep {
  id: string;
  type: PathwayStepType;
  itemId: string;
  label: string;
  route: string;
  evidence: string;
}

export interface Pathway {
  id: string;
  name: string;
  purpose: string;
  targetLearner: string;
  outcomes: string[];
  prerequisites: string[];
  difficulty: Difficulty;
  effortHours: number;
  disciplines: string[];
  steps: PathwayStep[];
  completionRule: string;
  evidenceExpected: string[];
  next: { label: string; route: string };
}

const lab = (id: string, label: string, evidence: string): PathwayStep => ({
  id: `lab-${id}`,
  type: "lab",
  itemId: id,
  label,
  route: `/learn/labs/${id}`,
  evidence
});

const project = (id: string, label: string, evidence: string): PathwayStep => ({
  id: `project-${id}`,
  type: "project",
  itemId: id,
  label,
  route: `/projects/${id}`,
  evidence
});

const skill = (id: string, label: string): PathwayStep => ({
  id: `skill-${id}`,
  type: "skill",
  itemId: id,
  label,
  route: "/learn/skills",
  evidence: "A self-rating supported by a calculation, test result, report, or source link."
});

const tool = (id: string, label: string, route: string, evidence: string): PathwayStep => ({
  id: `tool-${id}`,
  type: "tool",
  itemId: id,
  label,
  route,
  evidence
});

export const pathways: Pathway[] = [
  {
    id: "controls",
    name: "Controls and Automation",
    purpose: "Move from dynamic-system intuition to tuned feedback and industrial interlocks.",
    targetLearner: "Engineers building or refreshing practical control-system capability.",
    outcomes: ["Model first and second-order plants", "Tune and verify PID behaviour", "Explain industrial trips and interlocks"],
    prerequisites: ["Algebra", "Basic time-domain plotting"],
    difficulty: "Intermediate",
    effortHours: 18,
    disciplines: ["Controls", "Automation"],
    steps: [
      lab("mechanical", "Understand second-order dynamics", "A damping and resonance comparison."),
      lab("pid", "Tune and verify a feedback loop", "A PID challenge record with measured criteria."),
      lab("plc", "Apply control thinking to an industrial process", "An interlock and trip test record."),
      project("temperature-controller", "Build a closed-loop temperature controller", "A validated controller evidence pack.")
    ],
    completionRule: "Complete each ordered step and its stated evidence requirement.",
    evidenceExpected: ["Response plots", "Controller verification", "Interlock test", "Project validation pack"],
    next: { label: "Mechatronics Integration", route: "/learn/pathways/mechatronics" }
  },
  {
    id: "embedded",
    name: "Embedded and Electronics",
    purpose: "Connect analogue signals to deterministic firmware behaviour.",
    targetLearner: "Learners developing sensor interfaces and embedded control systems.",
    outcomes: ["Design basic signal conditioning", "Reason about ADC resolution", "Verify state, timing, and bus behaviour"],
    prerequisites: ["Basic circuits", "Programming fundamentals"],
    difficulty: "Intermediate",
    effortHours: 16,
    disciplines: ["Electrical", "Embedded"],
    steps: [
      lab("electrical", "Condition and measure electrical signals", "Divider, filter, and damping results."),
      lab("embedded", "Build reliable firmware behaviour", "FSM, debounce, and latency evidence."),
      project("sensor-data-logger", "Create a sensor signal chain and data logger", "A calibrated data and validation record."),
      skill("embedded", "Rate embedded capability with evidence")
    ],
    completionRule: "Complete both labs, the project validation criteria, and an evidence-backed skill rating.",
    evidenceExpected: ["Circuit calculations", "Firmware event traces", "Calibration data", "Skill evidence"],
    next: { label: "Robotics and Autonomy", route: "/learn/pathways/robotics" }
  },
  {
    id: "robotics",
    name: "Robotics and Autonomy",
    purpose: "Integrate motion, estimation, planning, and verification in a mobile-robot context.",
    targetLearner: "Mechatronics and robotics learners moving from components to autonomy.",
    outcomes: ["Model differential drive motion", "Compare odometry with ground truth", "Plan and validate collision-free paths"],
    prerequisites: ["Coordinate geometry", "Basic programming"],
    difficulty: "Intermediate",
    effortHours: 20,
    disciplines: ["Robotics", "Software"],
    steps: [
      lab("robotics", "Model, estimate, and plan robot motion", "A route, odometry error, and path-planning result."),
      lab("embedded", "Verify timing and control-state behaviour", "A bounded timing and FSM record."),
      project("mobile-robot", "Develop a two-motor robot with odometry", "A motion and estimation validation pack."),
      skill("robotics", "Rate robotics capability with evidence")
    ],
    completionRule: "Pass the linked challenges and complete every project milestone.",
    evidenceExpected: ["Robot trajectory", "Odometry comparison", "Timing evidence", "Project test record"],
    next: { label: "AI and ML for Engineers", route: "/learn/pathways/ai-ml" }
  },
  {
    id: "ai-ml",
    name: "AI and ML for Engineers",
    purpose: "Apply transparent data models to regression, classification, anomalies, and condition prediction.",
    targetLearner: "Engineers who need explainable data workflows rather than black-box demonstrations.",
    outcomes: ["Interpret regression and classification metrics", "Separate train and test evidence", "State model limitations"],
    prerequisites: ["Basic statistics", "Tabular data familiarity"],
    difficulty: "Intermediate",
    effortHours: 16,
    disciplines: ["AI and ML", "Data"],
    steps: [
      lab("ml", "Build and challenge transparent models", "Regression, classification, and anomaly results."),
      project("predictive-maintenance", "Run a predictive-maintenance data study", "A reproducible analysis with limitations."),
      project("condition-monitoring", "Build a condition-monitoring demonstrator", "A labelled signal and threshold verification."),
      skill("ai-ml", "Rate AI and ML capability with evidence")
    ],
    completionRule: "Pass all AI/ML lab challenges and satisfy one project's validation criteria.",
    evidenceExpected: ["Model metrics", "Confusion matrix", "Anomaly validation", "Model limitations"],
    next: { label: "Verification and Professional Practice", route: "/learn/pathways/verification" }
  },
  {
    id: "industrial",
    name: "Industrial Systems and SCADA",
    purpose: "Design observable, testable industrial sequences with alarms and safe state transitions.",
    targetLearner: "Automation learners preparing for PLC, HMI, commissioning, or SCADA work.",
    outcomes: ["Explain scan-based control", "Verify latches and interlocks", "Produce FAT-ready test evidence"],
    prerequisites: ["Boolean logic", "Basic process concepts"],
    difficulty: "Intermediate",
    effortHours: 18,
    disciplines: ["Automation", "Industrial"],
    steps: [
      lab("plc", "Operate and diagnose an industrial process", "Alarm, interlock, and trip records."),
      lab("practice", "Turn behaviour into traceable verification", "Requirements, FMEA, and FAT evidence."),
      project("plc-cell", "Specify a conveyor and tank cell", "A validated PLC cell evidence pack."),
      skill("plc-scada", "Rate PLC and SCADA capability with evidence")
    ],
    completionRule: "Complete both labs and every required PLC-cell validation criterion.",
    evidenceExpected: ["Sequence trace", "Alarm response", "FMEA", "FAT checklist"],
    next: { label: "Mechatronics Integration", route: "/learn/pathways/mechatronics" }
  },
  {
    id: "mechanical",
    name: "Mechanical Design and Dynamics",
    purpose: "Turn mechanical requirements into feasible sizing, vibration, and mounting decisions.",
    targetLearner: "Engineers refreshing practical mechanics and design verification.",
    outcomes: ["Check torque, speed, and power", "Calculate natural frequency and damping", "Define testable design constraints"],
    prerequisites: ["SI units", "Algebra"],
    difficulty: "Foundation",
    effortHours: 15,
    disciplines: ["Mechanical", "Dynamics"],
    steps: [
      lab("mechanical", "Analyse gearing and vibration", "Sizing and resonance calculations."),
      project("motor-gearbox", "Complete a motor and gearbox sizing study", "A requirements-to-selection calculation pack."),
      project("vibration-rig", "Design a vibration-isolation test rig", "A test method and measured response."),
      tool("cad-studio", "Develop a parametric mounting concept", "/tools/cad", "A local SVG concept export.")
    ],
    completionRule: "Complete the lab and demonstrate both sizing and vibration validation.",
    evidenceExpected: ["Power reconciliation", "Frequency calculation", "Test method", "Mounting concept"],
    next: { label: "Engineering Analysis and Calculations", route: "/learn/pathways/analysis" }
  },
  {
    id: "analysis",
    name: "Engineering Analysis and Calculations",
    purpose: "Build disciplined calculation habits with units, bounds, assumptions, and independent checks.",
    targetLearner: "Learners who need a stronger quantitative foundation across disciplines.",
    outcomes: ["Preserve units and signs", "Check physical bounds", "Reconcile analytic and simulated results"],
    prerequisites: ["Secondary-school algebra"],
    difficulty: "Foundation",
    effortHours: 14,
    disciplines: ["Analysis", "Electrical", "Mechanical"],
    steps: [
      lab("electrical", "Verify circuit calculations", "A divider and filter calculation."),
      lab("mechanical", "Verify power and dynamics calculations", "A torque-speed and damping check."),
      lab("pid", "Compare response metrics with design targets", "A response-metric verification note."),
      tool("converter", "Check units with the local converter", "/tools/converter", "A recorded conversion and dimensional check.")
    ],
    completionRule: "Complete the linked quantitative challenges and record assumptions for each.",
    evidenceExpected: ["Raw inputs", "Equations", "Units", "Independent simulation comparison"],
    next: { label: "Controls and Automation", route: "/learn/pathways/controls" }
  },
  {
    id: "mechatronics",
    name: "Mechatronics Integration",
    purpose: "Integrate mechanical, electrical, embedded, control, and verification work into one system.",
    targetLearner: "Broad engineers ready to connect discipline-specific work.",
    outcomes: ["Define subsystem interfaces", "Manage cross-domain constraints", "Build an evidence-led integration plan"],
    prerequisites: ["One completed discipline pathway"],
    difficulty: "Advanced",
    effortHours: 24,
    disciplines: ["Mechatronics", "Systems"],
    steps: [
      lab("electrical", "Define the signal boundary", "An interface calculation."),
      lab("embedded", "Define deterministic behaviour", "A state and timing record."),
      lab("pid", "Close and verify the control loop", "A controller validation."),
      project("mechatronic-evidence-pack", "Deliver a small-system evidence pack", "Requirements, FMEA, FAT, and evidence.")
    ],
    completionRule: "Complete every step and link all project evidence to a stated requirement.",
    evidenceExpected: ["Interface specification", "State model", "Control test", "Traceable evidence pack"],
    next: { label: "Verification and Professional Practice", route: "/learn/pathways/verification" }
  },
  {
    id: "verification",
    name: "Verification and Professional Practice",
    purpose: "Make engineering claims reviewable through requirements, risks, tests, and evidence.",
    targetLearner: "Engineers preparing portfolio, delivery, assurance, or commissioning records.",
    outcomes: ["Write testable requirements", "Prioritise failure modes", "Produce traceable acceptance evidence"],
    prerequisites: ["One practical engineering task"],
    difficulty: "Intermediate",
    effortHours: 14,
    disciplines: ["Verification", "Professional Practice"],
    steps: [
      lab("practice", "Build traceability, FMEA, and acceptance records", "A completed professional-practice artefact set."),
      project("mechatronic-evidence-pack", "Create a complete evidence pack", "A traceable requirement-to-test pack."),
      tool("workbench", "Capture bounded project evidence", "/tools/workbench", "A local run receipt or documented web fallback."),
      skill("documentation", "Rate documentation capability with evidence")
    ],
    completionRule: "Complete the practice lab and produce a traceable evidence pack.",
    evidenceExpected: ["Requirements", "FMEA", "FAT record", "Decision log"],
    next: { label: "Software Engineering for Engineers", route: "/learn/pathways/software" }
  },
  {
    id: "software",
    name: "Software Engineering for Engineers",
    purpose: "Apply versioned, testable, security-aware software practice to engineering tools.",
    targetLearner: "Engineers building scripts, simulations, integrations, or desktop engineering software.",
    outcomes: ["Trace data through a system", "Distinguish pure logic from platform authority", "Create reproducible verification evidence"],
    prerequisites: ["Programming fundamentals"],
    difficulty: "Advanced",
    effortHours: 18,
    disciplines: ["Software", "Verification"],
    steps: [
      lab("practice", "Define evidence and acceptance criteria", "A testable requirement and verification plan."),
      lab("ml", "Inspect testable data logic", "A reproducible model result."),
      tool("diagnostics", "Understand desktop capability boundaries", "/tools/diagnostics", "A capability and limitation record."),
      tool("workbench", "Inspect the typed project workflow", "/tools/workbench", "A safe local workflow record.")
    ],
    completionRule: "Complete both lab evidence requirements and document the platform authority boundary.",
    evidenceExpected: ["Test result", "Architecture trace", "Capability limitation", "Reproducible workflow"],
    next: { label: "Mechatronics Integration", route: "/learn/pathways/mechatronics" }
  }
];

export function pathwayById(id: string): Pathway | undefined {
  return pathways.find((pathway) => pathway.id === id);
}
