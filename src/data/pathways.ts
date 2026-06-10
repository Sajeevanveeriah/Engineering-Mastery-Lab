// Learning pathways: ordered sequences of modules and matrix work.

export interface PathwayStep {
  label: string;
  route: string;
}

export interface Pathway {
  id: string;
  name: string;
  audience: string;
  steps: PathwayStep[];
}

export const pathways: Pathway[] = [
  {
    id: "controls",
    name: "Controls & Automation",
    audience: "Refresh applied control: from step responses to tuned loops on realistic plants.",
    steps: [
      { label: "Mechanical & Dynamics Lab — second-order systems first", route: "/labs/mechanical" },
      { label: "PID Control Lab — all three challenges", route: "/labs/pid" },
      { label: "PLC & SCADA Lab — control in an industrial frame", route: "/labs/plc" },
      { label: "Skills matrix — rate Controls and Simulation domains", route: "/skills" }
    ]
  },
  {
    id: "embedded",
    name: "Embedded & Electronics",
    audience: "Rebuild firmware confidence: signals in, logic, timing, buses.",
    steps: [
      { label: "Electrical & Electronics Lab — dividers, RC, ADC", route: "/labs/electrical" },
      { label: "Embedded Systems Lab — FSM, debounce, latency, buses", route: "/labs/embedded" },
      { label: "Build task: hardware FSM with debounced input", route: "/labs/embedded" },
      { label: "Skills matrix — rate Embedded and Electronics domains", route: "/skills" }
    ]
  },
  {
    id: "robotics",
    name: "Robotics & Autonomy",
    audience: "Kinematics, odometry honesty, path planning and following.",
    steps: [
      { label: "Robotics Lab — drive a square manually", route: "/labs/robotics" },
      { label: "Robotics Lab — waypoints with odometry noise", route: "/labs/robotics" },
      { label: "Robotics Lab — A* plan and execute", route: "/labs/robotics" },
      { label: "AI/ML Lab — process the robot's data", route: "/labs/ml" }
    ]
  },
  {
    id: "aiml",
    name: "AI/ML for Engineers",
    audience: "From least squares to honest evaluation and maintenance use cases.",
    steps: [
      { label: "AI/ML Lab — regression from scratch", route: "/labs/ml" },
      { label: "AI/ML Lab — classification and confusion matrix", route: "/labs/ml" },
      { label: "AI/ML Lab — anomaly detection and RUL", route: "/labs/ml" },
      { label: "Skills matrix — rate AI/ML with evidence links", route: "/skills" }
    ]
  },
  {
    id: "industrial",
    name: "Industrial Systems & SCADA",
    audience: "Interlocks, alarms, trips and the documentation that proves them.",
    steps: [
      { label: "PLC & SCADA Lab — normal operation", route: "/labs/plc" },
      { label: "PLC & SCADA Lab — interlock and trip drills", route: "/labs/plc" },
      { label: "Practice Lab — FAT checklist and FMEA for the tank", route: "/labs/practice" },
      { label: "Skills matrix — rate PLC/SCADA and Safety domains", route: "/skills" }
    ]
  },
  {
    id: "software",
    name: "Software Engineering for Engineers",
    audience: "Typed code, tests and architecture using this very repository.",
    steps: [
      { label: "Clone this repo, run the test suite", route: "/labs/practice" },
      { label: "Read docs/Architecture.md and trace one simulation end-to-end", route: "/" },
      { label: "Add a unit test for any simulation function", route: "/" },
      { label: "Skills matrix — rate Software domain with commit links", route: "/skills" }
    ]
  },
  {
    id: "professional",
    name: "Professional Engineering Practice",
    audience: "Requirements, risk, decision records and delivery discipline.",
    steps: [
      { label: "Practice Lab — traceability matrix challenge", route: "/labs/practice" },
      { label: "Practice Lab — FMEA and risk register", route: "/labs/practice" },
      { label: "Dashboard — run a weekly sprint with the checklist", route: "/" },
      { label: "Skills matrix — rate Documentation and Delivery domains", route: "/skills" }
    ]
  }
];
