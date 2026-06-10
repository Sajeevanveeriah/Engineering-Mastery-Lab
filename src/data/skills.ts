// Skills matrix data. Each level has an id used as the key for self-ratings.

export interface SkillLevel {
  id: string;
  name: "Foundation" | "Intermediate" | "Advanced";
  outcomes: string[];
  practice: string;
  simulation: string | null; // route to a lab, if one applies
  proofArtefact: string;
}

export interface SkillDomain {
  id: string;
  name: string;
  summary: string;
  priority: "preserve" | "refresh" | "build";
  levels: SkillLevel[];
}

function levels(
  domainId: string,
  rows: [string[], string, string | null, string][]
): SkillLevel[] {
  const names: SkillLevel["name"][] = ["Foundation", "Intermediate", "Advanced"];
  return rows.map((r, i) => ({
    id: `${domainId}-l${i + 1}`,
    name: names[i],
    outcomes: r[0],
    practice: r[1],
    simulation: r[2],
    proofArtefact: r[3]
  }));
}

export const skillDomains: SkillDomain[] = [
  {
    id: "maths",
    name: "Engineering Maths",
    summary: "Calculus, linear algebra, ODEs and transforms applied to systems.",
    priority: "refresh",
    levels: levels("maths", [
      [["Differentiate and integrate standard functions", "Solve first-order ODEs", "Work with complex numbers"], "Derive the RC charging equation by hand, then verify in the Electrical Lab.", "/labs/electrical", "Hand derivation photo + simulation screenshot"],
      [["Solve second-order ODEs", "Apply Laplace transforms to circuits and plants", "Use matrices for system equations"], "Derive the transfer function of the second-order plant in the PID Lab.", "/labs/pid", "Derivation notes matching simulated response"],
      [["State-space modelling", "Frequency-domain analysis", "Numerical methods and their error behaviour"], "Compare Euler step size effects on the spring-mass-damper simulation.", "/labs/mechanical", "Short report on numerical stability findings"]
    ])
  },
  {
    id: "physics",
    name: "Physics & Dynamics",
    summary: "Mechanics, energy, oscillation and rotational dynamics.",
    priority: "preserve",
    levels: levels("physics", [
      [["Newtonian mechanics", "Energy and power", "Free body diagrams"], "Predict gear output torque by energy balance, verify in the Mechanical Lab.", "/labs/mechanical", "Worked example with verified result"],
      [["Rotational dynamics and inertia", "Damped oscillation", "Resonance"], "Tune the spring-mass-damper to critical damping and explain the response.", "/labs/mechanical", "Annotated response plots for three damping cases"],
      [["Multi-body intuition", "Vibration modes", "Model simplification trade-offs"], "Map a real machine you know onto a one-DOF model and state the assumptions.", "/labs/mechanical", "One-page modelling assumptions memo"]
    ])
  },
  {
    id: "electrical",
    name: "Electrical Fundamentals",
    summary: "Circuit laws, AC analysis, power and machines basics.",
    priority: "refresh",
    levels: levels("electrical", [
      [["Ohm's and Kirchhoff's laws", "Series/parallel networks", "Power dissipation"], "Size a divider for a 5 V to 3.3 V interface and check loading effects.", "/labs/electrical", "Divider design note with tolerance analysis"],
      [["AC impedance", "RC/RL/RLC behaviour", "Filters and cutoff frequency"], "Design an RC low-pass for a 50 Hz noise problem in the Electrical Lab.", "/labs/electrical", "Filter design with Bode-style gain table"],
      [["Transient analysis", "Resonance and damping in RLC", "Practical grounding/noise awareness"], "Explore underdamped vs overdamped RLC and relate to snubber design.", "/labs/electrical", "RLC regime comparison write-up"]
    ])
  },
  {
    id: "electronics",
    name: "Electronics & Sensors",
    summary: "Signal conditioning, ADCs, sensor interfaces and noise.",
    priority: "refresh",
    levels: levels("electronics", [
      [["Sensor signal chains", "Voltage dividers for sensing", "ADC resolution and quantisation"], "Quantise a thermistor divider output with an 8/10/12-bit ADC and compare error.", "/labs/electrical", "ADC resolution selection memo"],
      [["Filtering sensor noise", "Sampling and aliasing basics", "Op-amp conceptual roles"], "Choose an anti-alias filter cutoff for a 100 Hz vibration signal.", "/labs/electrical", "Sampling + filter justification note"],
      [["Full signal chain design", "Error budgets", "EMC-aware layout principles"], "Write an error budget from sensor to ADC code for a chosen sensor.", null, "Signal-chain error budget spreadsheet"]
    ])
  },
  {
    id: "embedded",
    name: "Embedded Systems",
    summary: "Firmware structure, timing, state machines and serial buses.",
    priority: "refresh",
    levels: levels("embedded", [
      [["Finite state machines", "GPIO and debouncing", "Polling loops"], "Drive the FSM simulator through all transitions including fault recovery.", "/labs/embedded", "FSM diagram + event trace screenshot"],
      [["Interrupts vs polling trade-offs", "UART/SPI/I2C framing", "Timing budgets"], "Use the latency simulator to justify an interrupt-driven design for a 1 ms deadline.", "/labs/embedded", "Latency analysis table"],
      [["RTOS concepts", "Driver architecture", "Debugging timing faults"], "Solve the debounce timing-fault challenge and document the root cause.", "/labs/embedded", "Timing-fault debug report"]
    ])
  },
  {
    id: "controls",
    name: "Control Systems",
    summary: "Modelling, PID tuning, stability and performance metrics.",
    priority: "refresh",
    levels: levels("controls", [
      [["Open vs closed loop", "P, I and D actions", "Step-response metrics"], "Complete the P-only tuning challenge in the PID Lab.", "/labs/pid", "Tuned response screenshot with metrics"],
      [["PID tuning methods", "Disturbance rejection", "Actuator saturation and windup"], "Pass the disturbance-rejection challenge within the metric limits.", "/labs/pid", "Tuning log with before/after metrics"],
      [["Second-order dynamics", "Damping ratio effects", "Robustness intuition"], "Tune the second-order plant for under 10% overshoot and 2 s settling.", "/labs/pid", "Documented gain set + justification"]
    ])
  },
  {
    id: "plc",
    name: "PLC / SCADA",
    summary: "Ladder thinking, interlocks, alarms and HMI design.",
    priority: "build",
    levels: levels("plc", [
      [["Scan cycle model", "Seal-in start/stop logic", "Basic alarms"], "Run the conveyor through normal start/stop cycles in the PLC Lab.", "/labs/plc", "Conveyor logic truth table"],
      [["Safety interlocks", "Fault latching and reset", "Alarm management"], "Pass the interlock-failure challenge without an unsafe state.", "/labs/plc", "Interlock test record"],
      [["Process control loops", "HMI/trend design", "FAT-style test scripting"], "Write a FAT script for the tank process and execute it in the simulator.", "/labs/plc", "Completed FAT checklist for tank process"]
    ])
  },
  {
    id: "robotics",
    name: "Robotics",
    summary: "Kinematics, odometry, path following and planning.",
    priority: "refresh",
    levels: levels("robotics", [
      [["Differential-drive kinematics", "Wheel speed to motion mapping", "Pose representation"], "Drive the simulated robot in a square using wheel speed commands.", "/labs/robotics", "Trajectory screenshot with commands listed"],
      [["Odometry and drift", "Waypoint following", "Controller gains for steering"], "Complete the waypoint course and explain odometry drift you observed.", "/labs/robotics", "Odometry drift analysis note"],
      [["Path planning (A*)", "Obstacle avoidance behaviour", "Localisation concepts"], "Plan around the obstacle map with A* and follow the path.", "/labs/robotics", "Planned-vs-actual path comparison"]
    ])
  },
  {
    id: "aiml",
    name: "AI / ML",
    summary: "Regression, classification, anomaly detection, evaluation.",
    priority: "refresh",
    levels: levels("aiml", [
      [["Linear regression mechanics", "Train/test split", "MSE and R²"], "Fit the regression demo and explain what the slope means physically.", "/labs/ml", "Regression result + interpretation paragraph"],
      [["Classification and kNN", "Confusion matrix", "Precision vs recall trade-off"], "Tune k in the classifier and report the confusion matrix changes.", "/labs/ml", "Classifier evaluation table"],
      [["Anomaly detection", "Predictive maintenance framing", "Limits of ML in safety systems"], "Detect injected vibration anomalies and estimate remaining useful life.", "/labs/ml", "Anomaly + RUL mini report with limitations section"]
    ])
  },
  {
    id: "software",
    name: "Software Engineering",
    summary: "Clean code, testing, version control and architecture.",
    priority: "refresh",
    levels: levels("software", [
      [["Functions and modules", "Git basics", "Reading stack traces"], "Clone this repo, run its tests and add one new test case.", null, "Merged commit adding a passing test"],
      [["Unit testing discipline", "Typed interfaces", "Code review habits"], "Write tests for one simulation function before reading its implementation.", null, "Test-first PR with notes"],
      [["Architecture boundaries", "CI pipelines", "Refactoring safely"], "Document this app's architecture boundaries and propose one improvement.", null, "Architecture review memo"]
    ])
  },
  {
    id: "mechanical",
    name: "Mechanical Systems",
    summary: "Drivetrains, structures, vibration and machine elements.",
    priority: "preserve",
    levels: levels("mechanical", [
      [["Gear ratios", "Torque/speed/power", "Unit discipline"], "Size a gearbox for a chosen motor and load in the Mechanical Lab.", "/labs/mechanical", "Gearbox sizing calculation sheet"],
      [["Vibration isolation basics", "Natural frequency", "Damping selection"], "Find the natural frequency of a machine mount and shift it away from excitation.", "/labs/mechanical", "Mount frequency analysis"],
      [["Drivetrain integration", "Tolerance and fits awareness", "Failure modes of machine elements"], "Run an FMEA on a conveyor drivetrain in the Practice Lab.", "/labs/practice", "Drivetrain FMEA export"]
    ])
  },
  {
    id: "simulation",
    name: "Simulation & Modelling",
    summary: "Numerical methods, model validation and simulation literacy.",
    priority: "build",
    levels: levels("simulation", [
      [["Time-step integration", "Model parameters vs reality", "Reading simulation plots"], "Change dt in the PID Lab and observe when the simulation breaks down.", "/labs/pid", "Step-size sensitivity note"],
      [["Model validation thinking", "Linear vs nonlinear effects", "Saturation and limits"], "Show how actuator saturation changes PID behaviour vs the ideal model.", "/labs/pid", "Saturation effects comparison"],
      [["Co-simulation concepts", "Verification vs validation", "Documenting model assumptions"], "Write a model assumptions register for one lab simulation.", null, "Model assumptions register"]
    ])
  },
  {
    id: "safety",
    name: "Safety & Risk",
    summary: "Hazard thinking, interlocks, FMEA and risk registers.",
    priority: "build",
    levels: levels("safety", [
      [["Hazard vs risk", "Hierarchy of controls", "Why interlocks exist"], "List hazards for the conveyor simulation and map controls to each.", "/labs/plc", "Hazard/control mapping table"],
      [["FMEA method", "Severity/occurrence/detection scoring", "Risk registers"], "Build an FMEA for the tank process in the Practice Lab.", "/labs/practice", "Tank process FMEA export"],
      [["Safety functions and trips", "Validation of protective logic", "Honest limits of simulation"], "Prove the high-high trip works under a stuck-open fill valve scenario.", "/labs/plc", "Trip validation test record"]
    ])
  },
  {
    id: "documentation",
    name: "Engineering Documentation",
    summary: "Requirements, test records, decision logs and reports.",
    priority: "refresh",
    levels: levels("documentation", [
      [["Requirement statements", "Traceability concept", "Test evidence"], "Write five requirements for the conveyor and trace them to tests.", "/labs/practice", "Traceability matrix export"],
      [["Test procedures (FAT/SAT)", "Decision records", "Version-controlled docs"], "Generate and complete a FAT checklist in the Practice Lab.", "/labs/practice", "Completed FAT checklist"],
      [["Design reports", "Engineering justification writing", "Audit-ready records"], "Compile a portfolio artefact pack from three completed labs.", null, "Portfolio artefact pack"]
    ])
  },
  {
    id: "delivery",
    name: "Project Delivery",
    summary: "Scoping, estimation, execution and stakeholder communication.",
    priority: "refresh",
    levels: levels("delivery", [
      [["Scope and acceptance criteria", "Task breakdown", "Weekly planning"], "Plan a two-week sprint using the dashboard checklist and review it honestly.", "/", "Sprint plan + retrospective notes"],
      [["Risk-driven planning", "Decision logs", "Progress reporting"], "Keep a decision log for one lab project in the Practice Lab.", "/labs/practice", "Decision log export"],
      [["End-to-end mini project delivery", "Trade-off communication", "Lessons-learned culture"], "Deliver one Build project from any module, from scope to evidence pack.", null, "Complete mini-project evidence pack"]
    ])
  }
];
