import {
  ACADEMY_CONTENT_VERSION,
  ACADEMY_SCHEMA_VERSION,
  type AcademyStage,
  type AssessmentSpec,
  type Course,
  type Skill,
  type SourceReference,
  type Unit
} from "../../lib/academy/types";

export interface AcademyUnitCatalogueSeed {
  id: string;
  stage: AcademyStage;
  title: string;
  description: string;
  lessonTitles: readonly [string, string, string, string, string, string, string];
  laboratoryRoute: string | null;
  projectRoute: string | null;
}

const lessonTitles = (
  first: string,
  second: string,
  third: string,
  fourth: string,
  fifth: string,
  sixth: string,
  seventh: string
): AcademyUnitCatalogueSeed["lessonTitles"] => [
  first,
  second,
  third,
  fourth,
  fifth,
  sixth,
  seventh
];

export const academyUnitSeeds: AcademyUnitCatalogueSeed[] = [
  {
    id: "EML-E0-D01",
    stage: "E0",
    title: "Learning practice and engineering questions",
    description: "Build a repeatable way to learn, frame, test and document engineering questions from first principles.",
    lessonTitles: lessonTitles(
      "How technical learning works",
      "Retrieval practice and spaced review",
      "Decomposing an engineering problem",
      "Scientific questions and falsifiable hypotheses",
      "Experiments, variables and fair comparisons",
      "Technical notes and evidence trails",
      "Reading diagrams, datasheets and technical documentation"
    ),
    laboratoryRoute: "/learn/labs/practice",
    projectRoute: "/projects/mechatronic-evidence-pack"
  },
  {
    id: "EML-E0-D02",
    stage: "E0",
    title: "SI units, measurement and uncertainty",
    description: "Develop numerical fluency, measurement discipline, SI notation and honest uncertainty statements.",
    lessonTitles: lessonTitles(
      "Arithmetic fluency and engineering estimates",
      "Fractions, ratios, percentages and scientific notation",
      "SI base quantities and derived units",
      "Dimensions, conversions and plausibility checks",
      "Measurement resolution and significant figures",
      "Error, uncertainty and repeated measurements",
      "Calibration and traceable measurement plans"
    ),
    laboratoryRoute: "/learn/labs/electrical",
    projectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "EML-E0-D03",
    stage: "E0",
    title: "Algebra, vectors and coordinate frames",
    description: "Build algebra, geometry and spatial reasoning needed for later mechanics, controls and robotics.",
    lessonTitles: lessonTitles(
      "Numbers, symbols and algebraic expressions",
      "Rearranging engineering equations",
      "Functions, graphs and rates of change",
      "Geometry and trigonometry for physical systems",
      "Coordinate systems, vectors and reference frames",
      "Matrices and geometric transformations",
      "Complex numbers and engineering representations"
    ),
    laboratoryRoute: "/learn/labs/robotics",
    projectRoute: "/projects/mobile-robot"
  },
  {
    id: "EML-E1-D04",
    stage: "E1",
    title: "Calculus, linear algebra and statistics",
    description: "Use calculus, linear algebra, probability and numerical reasoning to describe changing engineering systems.",
    lessonTitles: lessonTitles(
      "Differential calculus and local change",
      "Integral calculus and accumulated quantity",
      "Multivariable calculus and coupled sensitivity",
      "Ordinary differential equations and dynamic models",
      "Linear algebra, matrices, transformations and eigenmodes",
      "Inverse functions and inverse differentiation",
      "Probability, statistics, numerical methods and optimisation"
    ),
    laboratoryRoute: "/learn/labs/mechanical",
    projectRoute: "/projects/vibration-rig"
  },
  {
    id: "EML-E1-D05",
    stage: "E1",
    title: "Physics foundations for engineered systems",
    description: "Connect physical laws to measurable motion, energy, fields, heat, fluids, materials and transducers.",
    lessonTitles: lessonTitles(
      "Kinematics and Newtonian mechanics",
      "Statics, dynamics and momentum",
      "Work, energy, power and rotation",
      "Oscillation, vibration and waves",
      "Electricity and magnetism",
      "Thermodynamics, heat transfer and fluid mechanics",
      "Material behaviour and the physics of sensors and actuators"
    ),
    laboratoryRoute: "/learn/labs/mechanical",
    projectRoute: "/projects/motor-gearbox"
  },
  {
    id: "EML-E1-D06",
    stage: "E1",
    title: "Linux, Git and reproducible computing",
    description: "Operate a transparent computing environment with traceable files, versions, data and repeatable commands.",
    lessonTitles: lessonTitles(
      "Binary, logic and computer fundamentals",
      "Linux command-line navigation and files",
      "Git history, branches and version control",
      "Files, data formats and application interfaces",
      "Reproducible engineering computation",
      "Networking and secure computing fundamentals",
      "Documentation, environments and maintainable workflows"
    ),
    laboratoryRoute: "/learn/labs/practice",
    projectRoute: "/projects/mechatronic-evidence-pack"
  },
  {
    id: "EML-E1-D07",
    stage: "E1",
    title: "Programming and software architecture",
    description: "Learn programming from zero, then organise, test and reason about reliable engineering software.",
    lessonTitles: lessonTitles(
      "Programming concepts from zero with Python",
      "C and modern C++ for engineering",
      "Data structures, algorithms and complexity",
      "Object-oriented and functional design",
      "Debugging and deterministic testing",
      "Software architecture and state machines",
      "Concurrency, networking and secure coding"
    ),
    laboratoryRoute: "/learn/labs/embedded",
    projectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "EML-E1-D08",
    stage: "E1",
    title: "Engineering graphics, CAD and tolerances",
    description: "Communicate manufacturable geometry through sketches, models, drawings, tolerances and inspection plans.",
    lessonTitles: lessonTitles(
      "Sketch geometry and design intent",
      "Parametric CAD modelling",
      "Engineering drawings and projection",
      "Fits, limits and tolerance stacks",
      "Geometric dimensioning and tolerancing",
      "Metrology and drawing verification",
      "Designing a manufacturable parametric mount"
    ),
    laboratoryRoute: "/learn/labs/mechanical",
    projectRoute: "/projects/parametric-mount"
  },
  {
    id: "EML-E2-D09",
    stage: "E2",
    title: "Mechanics, materials and machine elements",
    description: "Select and analyse materials, structures, joints and transmission elements under realistic loads.",
    lessonTitles: lessonTitles(
      "Engineering materials and selection",
      "Stress, strain and failure",
      "Beams, shafts and fasteners",
      "Bearings, gears, belts and chains",
      "Springs, couplings, mechanisms and linkages",
      "Machine design, power transmission and tribology",
      "Mechanical safety, inspection and maintenance"
    ),
    laboratoryRoute: "/learn/labs/mechanical",
    projectRoute: "/projects/motor-gearbox"
  },
  {
    id: "EML-E2-D10",
    stage: "E2",
    title: "Manufacturing, assembly and lifecycle",
    description: "Choose manufacturing and assembly processes using geometry, capability, cost, quality and lifecycle evidence.",
    lessonTitles: lessonTitles(
      "Manufacturing process selection",
      "Machining and process capability",
      "Sheet-metal design and fabrication",
      "Casting and moulding",
      "Additive manufacturing",
      "Design for manufacture and assembly",
      "Metrology, quality, lifecycle and sustainability"
    ),
    laboratoryRoute: "/learn/labs/mechanical",
    projectRoute: "/projects/parametric-mount"
  },
  {
    id: "EML-E2-D11",
    stage: "E2",
    title: "Circuits, power and energy storage",
    description: "Analyse electrical networks and choose electronic, power and protection elements with explicit limits.",
    lessonTitles: lessonTitles(
      "Charge, voltage, current, resistance and DC power",
      "Kirchhoff laws and network analysis",
      "AC circuits, capacitors, inductors and frequency response",
      "Diodes, transistors and analogue switching",
      "Operational amplifiers and analogue signal conditioning",
      "Digital logic, combinational and sequential circuits",
      "Power supplies, batteries, drives, PCB practice and protection"
    ),
    laboratoryRoute: "/learn/labs/electrical",
    projectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "EML-E2-D12",
    stage: "E2",
    title: "Sensors, instrumentation and calibration",
    description: "Trace physical quantities through sensors, conditioning, conversion, calibration and diagnostic instruments.",
    lessonTitles: lessonTitles(
      "Sensor principles and transduction",
      "Instrumentation chains and calibration models",
      "Signal conditioning and operational amplifiers",
      "ADC, DAC, quantisation and resolution",
      "Grounding, shielding and electromagnetic compatibility",
      "Multimeters, oscilloscopes and logic analysers",
      "Data acquisition and a calibrated sensor logger"
    ),
    laboratoryRoute: "/learn/labs/electrical",
    projectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "EML-E2-D13",
    stage: "E2",
    title: "Microcontrollers and real-time design",
    description: "Design firmware around microcontroller hardware, deadlines, concurrency, power and observable failures.",
    lessonTitles: lessonTitles(
      "Microcontroller architecture, memory and registers",
      "GPIO and safe digital interfacing",
      "Interrupts, timers and PWM",
      "ADC, DAC and direct memory access",
      "Embedded C and C++ design",
      "Real-time behaviour, RTOS scheduling and concurrency",
      "Power, bootloaders, debugging and hardware-in-the-loop"
    ),
    laboratoryRoute: "/learn/labs/embedded",
    projectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "EML-E2-D14",
    stage: "E2",
    title: "Robust embedded and robotics communication",
    description: "Build event-driven automation and communication paths from field I/O to interoperable networked systems.",
    lessonTitles: lessonTitles(
      "Industrial I/O, relays, contactors and actuators",
      "PLC fundamentals, ladder logic and structured text",
      "Sequential and event-driven automation",
      "SCADA, HMI, interlocks and alarm management",
      "UART, SPI, I2C and CAN in system context",
      "Modbus, MQTT and OPC UA",
      "Ethernet, TCP/IP, DDS, industrial networks and commissioning"
    ),
    laboratoryRoute: "/learn/labs/plc",
    projectRoute: "/projects/plc-cell"
  },
  {
    id: "EML-E2-D15",
    stage: "E2",
    title: "Signals, sampling and filtering",
    description: "Represent, sample, transform and filter signals without hiding aliasing, noise or model assumptions.",
    lessonTitles: lessonTitles(
      "Signals, systems and physical information",
      "Continuous and discrete signals",
      "Sampling, reconstruction and aliasing",
      "Analogue and digital filtering",
      "Fourier and frequency-domain concepts",
      "Transfer functions, block diagrams and state space",
      "System identification, noise and data acquisition"
    ),
    laboratoryRoute: "/learn/labs/electrical",
    projectRoute: "/projects/condition-monitoring"
  },
  {
    id: "EML-E2-D16",
    stage: "E2",
    title: "System modelling, feedback and motor control",
    description: "Model dynamic plants, close feedback loops and verify practical control behaviour under limits and noise.",
    lessonTitles: lessonTitles(
      "Physical and differential-equation models",
      "Feedback, transient and steady-state response",
      "Stability and closed-loop reasoning",
      "PID control from proportional action to tuning",
      "Frequency response and robustness",
      "Digital control, state estimation and motor drives",
      "Identification, saturation, noise and anti-windup"
    ),
    laboratoryRoute: "/learn/labs/pid",
    projectRoute: "/projects/temperature-controller"
  },
  {
    id: "EML-E3-D17",
    stage: "E3",
    title: "Robot kinematics, dynamics and actuation",
    description: "Relate robot geometry, motion, force and actuation across mobile and manipulator architectures.",
    lessonTitles: lessonTitles(
      "Robot components and architectures",
      "Coordinate frames and transformations",
      "Forward kinematics",
      "Inverse kinematics and Jacobians",
      "Robot dynamics",
      "Actuators, transmissions and motor selection",
      "Mobile motion, manipulation and physical safety"
    ),
    laboratoryRoute: "/learn/labs/robotics",
    projectRoute: "/projects/mobile-robot"
  },
  {
    id: "EML-E3-D18",
    stage: "E3",
    title: "ROS 2 and robot simulation integration",
    description: "Compose inspectable ROS 2 software, robot models and simulations into a testable robotic system.",
    lessonTitles: lessonTitles(
      "ROS 2 graph and workspace fundamentals",
      "Nodes, topics and message interfaces",
      "Services, actions and lifecycle behaviour",
      "URDF, Xacro and robot models",
      "Gazebo simulation and sensor models",
      "ros2_control, Nav2 and integrated simulation",
      "DDS, debugging, testing and deployment"
    ),
    laboratoryRoute: "/learn/labs/robotics",
    projectRoute: "/projects/releases/P2"
  },
  {
    id: "EML-E3-D19",
    stage: "E3",
    title: "Bayesian estimation and sensor fusion",
    description: "Represent uncertainty explicitly and fuse imperfect observations into testable state estimates.",
    lessonTitles: lessonTitles(
      "Probability as engineering belief under evidence",
      "Bayes rule and conditional reasoning",
      "Noise, covariance and uncertainty propagation",
      "Complementary filters and weighted fusion",
      "Kalman-filter foundations",
      "Extended Kalman filters and nonlinear sensors",
      "Fusion validation, consistency and failure diagnosis"
    ),
    laboratoryRoute: "/learn/labs/robotics",
    projectRoute: "/projects/releases/P3"
  },
  {
    id: "EML-E3-D20",
    stage: "E3",
    title: "Localisation, SLAM and motion planning",
    description: "Estimate mobile-robot pose, build maps and plan repeatable motion through uncertain environments.",
    lessonTitles: lessonTitles(
      "Encoders, odometry and drift",
      "Localisation with landmarks and maps",
      "Occupancy maps and mapping sensors",
      "SLAM front ends, back ends and loop closure",
      "Graph and grid path planning",
      "Trajectory generation and motion control",
      "Nav2 missions, recovery and benchmark evidence"
    ),
    laboratoryRoute: "/learn/labs/robotics",
    projectRoute: "/projects/releases/P3"
  },
  {
    id: "EML-E3-D21",
    stage: "E3",
    title: "Computer vision geometry and pose",
    description: "Turn camera measurements into calibrated geometric evidence for perception and robot pose.",
    lessonTitles: lessonTitles(
      "Image formation and camera models",
      "Pixels, colour spaces and image filtering",
      "Camera calibration and distortion",
      "Projective geometry and coordinate transforms",
      "Features, descriptors and matching",
      "Depth, pose and multi-view reasoning",
      "Vision for robotics, uncertainty and safe limits"
    ),
    laboratoryRoute: "/learn/labs/ml",
    projectRoute: "/projects/releases/P4"
  },
  {
    id: "EML-E3-D22",
    stage: "E3",
    title: "Machine learning foundations and evaluation",
    description: "Prepare data, build transparent baselines and evaluate machine-learning claims without leakage.",
    lessonTitles: lessonTitles(
      "Data preparation and exploratory analysis",
      "Regression and residual reasoning",
      "Classification and decision thresholds",
      "Clustering and unsupervised learning",
      "Features, splits, metrics and data leakage",
      "Bias, variance, overfitting and reproducibility",
      "Time series, anomaly detection and sensor-data ML"
    ),
    laboratoryRoute: "/learn/labs/ml",
    projectRoute: "/projects/predictive-maintenance"
  },
  {
    id: "EML-E3-D23",
    stage: "E3",
    title: "AI/ML integration for robots",
    description: "Integrate learned components into robots with bounded latency, reproducibility and safety claims.",
    lessonTitles: lessonTitles(
      "Neural-network foundations",
      "Deep learning and optimisation",
      "Convolutional networks for perception",
      "Transformers for engineering sequences",
      "Reinforcement-learning foundations",
      "Edge AI, compression and deployment",
      "MLOps, robotics integration, safety, bias and uncertainty"
    ),
    laboratoryRoute: "/learn/labs/ml",
    projectRoute: "/projects/releases/P4"
  },
  {
    id: "EML-E4-D24",
    stage: "E4",
    title: "Systems engineering, safety and verification",
    description: "Translate needs into an architecture and a traceable body of safety, reliability and verification evidence.",
    lessonTitles: lessonTitles(
      "Stakeholder needs and measurable requirements",
      "Functional decomposition and system architectures",
      "Interfaces and evidence-led trade studies",
      "Risk management, FMEA and hazard analysis",
      "Safety engineering and reliability",
      "Verification, validation and experimental design",
      "Configuration, change control and technical readiness"
    ),
    laboratoryRoute: "/learn/labs/practice",
    projectRoute: "/projects/mechatronic-evidence-pack"
  },
  {
    id: "EML-E4-D25",
    stage: "E4",
    title: "Professional engineering and capstone proof",
    description: "Plan, communicate and defend an integrated capstone using ethical, reproducible professional evidence.",
    lessonTitles: lessonTitles(
      "Project planning and decision records",
      "Technical reports and reproducible evidence",
      "Design reviews and engineering argument",
      "Ethics, sustainability and professional responsibility",
      "Portfolio evidence and claim boundaries",
      "Capstone integration and release",
      "Interview demonstrations and professional proof"
    ),
    laboratoryRoute: "/learn/labs/practice",
    projectRoute: "/portfolio/capstone"
  }
];

export const academyCourseMeta: Record<AcademyStage, Omit<Course, "unitIds" | "challenge" | "estimatedMinutes">> = {
  E0: {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: "ACADEMY-E0",
    stage: "E0",
    title: "Learning and quantitative foundations",
    description: "Start from zero with learning practice, measurement, algebra and spatial reasoning.",
    prerequisiteCourseIds: [],
    outcomes: [
      "Frame testable engineering questions",
      "Calculate and communicate with SI quantities",
      "Use algebra, geometry, vectors and reference frames"
    ],
    sourceIds: ["SRC-OPENSTAX-STUDY", "SRC-BIPM-SI", "SRC-OPENSTAX-PRECALCULUS-2E"]
  },
  E1: {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: "ACADEMY-E1",
    stage: "E1",
    title: "Core engineering and computing foundations",
    description: "Develop undergraduate mathematics, physics, computing, programming and design communication.",
    prerequisiteCourseIds: ["ACADEMY-E0"],
    outcomes: [
      "Model physical systems with mathematics",
      "Create reproducible engineering software",
      "Communicate geometry and tolerances"
    ],
    sourceIds: [
      "SRC-MIT-OCW-CALCULUS-REVISITED",
      "SRC-MIT-6-100L",
      "SRC-CPP-CORE-GUIDELINES"
    ]
  },
  E2: {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: "ACADEMY-E2",
    stage: "E2",
    title: "Mechatronic components, signals, electronics and control",
    description: "Integrate mechanics, manufacturing, electronics, firmware, communications, signals and feedback.",
    prerequisiteCourseIds: ["ACADEMY-E1"],
    outcomes: [
      "Select and analyse mechatronic components",
      "Design observable embedded and communication behaviour",
      "Model, identify and control dynamic systems"
    ],
    sourceIds: ["SRC-MIT-2-737", "SRC-ARM-CMSIS-DRIVER", "SRC-MIT-2-14"]
  },
  E3: {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: "ACADEMY-E3",
    stage: "E3",
    title: "Robotics, perception and AI/ML",
    description: "Build robot motion, software, estimation, autonomy, vision and learned components from verified prerequisites.",
    prerequisiteCourseIds: ["ACADEMY-E2"],
    outcomes: [
      "Model and control robot motion",
      "Integrate ROS 2 estimation, SLAM and planning",
      "Evaluate and deploy bounded AI/ML components"
    ],
    sourceIds: [
      "SRC-ROS2-JAZZY-CLI",
      "SRC-GAZEBO-HARMONIC-ROS2",
      "SRC-OPENCV-5-TUTORIALS",
      "SRC-SCIKIT-USER-GUIDE"
    ]
  },
  E4: {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: "ACADEMY-E4",
    stage: "E4",
    title: "Systems engineering, professional proof and capstone integration",
    description: "Turn an integrated engineering system into traceable safety, verification and professional evidence.",
    prerequisiteCourseIds: ["ACADEMY-E3"],
    outcomes: [
      "Develop traceable requirements and architectures",
      "Plan risk, reliability, verification and validation",
      "Defend a reproducible capstone and bounded professional claims"
    ],
    sourceIds: [
      "SRC-NASA-SE-HANDBOOK",
      "SRC-NIST-DOE",
      "SRC-ENGINEERS-AUSTRALIA-ETHICS"
    ]
  }
};

export const lessonIdsForUnit = (unitId: string): string[] =>
  Array.from({ length: 7 }, (_, index) => `${unitId}-L${String(index + 1).padStart(2, "0")}`);

export const questionId = (lessonId: string, questionNumber: number): string =>
  `${lessonId}-Q${String(questionNumber).padStart(2, "0")}`;

export const skillIdForUnit = (unitId: string): string => `SKILL-${unitId.slice(4)}`;

export const academyLessonMinutePattern = [38, 41, 44, 47, 50, 53, 56] as const;
export const academyUnitEstimatedMinutes =
  academyLessonMinutePattern.reduce((total, minutes) => total + minutes, 0) + 20 + 35;

export const academyUnitPrerequisiteMap: Record<string, string[]> = {
  "EML-E0-D01": [],
  "EML-E0-D02": ["EML-E0-D01"],
  "EML-E0-D03": ["EML-E0-D02"],
  "EML-E1-D04": ["EML-E0-D03"],
  "EML-E1-D05": ["EML-E1-D04"],
  "EML-E1-D06": ["EML-E0-D01"],
  "EML-E1-D07": ["EML-E1-D06"],
  "EML-E1-D08": ["EML-E0-D02", "EML-E0-D03"],
  "EML-E2-D09": ["EML-E1-D05", "EML-E1-D08"],
  "EML-E2-D10": ["EML-E1-D08", "EML-E2-D09"],
  "EML-E2-D11": ["EML-E1-D05"],
  "EML-E2-D12": ["EML-E0-D02", "EML-E2-D11"],
  "EML-E2-D13": ["EML-E1-D07", "EML-E2-D11", "EML-E2-D12"],
  "EML-E2-D14": ["EML-E2-D13"],
  "EML-E2-D15": ["EML-E1-D04", "EML-E2-D12"],
  "EML-E2-D16": ["EML-E1-D04", "EML-E1-D05", "EML-E2-D15"],
  "EML-E3-D17": ["EML-E0-D03", "EML-E2-D09", "EML-E2-D16"],
  "EML-E3-D18": ["EML-E1-D07", "EML-E2-D14", "EML-E3-D17"],
  "EML-E3-D19": ["EML-E1-D04", "EML-E2-D12", "EML-E2-D16"],
  "EML-E3-D20": ["EML-E3-D17", "EML-E3-D18", "EML-E3-D19"],
  "EML-E3-D21": ["EML-E0-D03", "EML-E1-D04", "EML-E1-D07"],
  "EML-E3-D22": ["EML-E1-D04", "EML-E1-D07"],
  "EML-E3-D23": ["EML-E2-D13", "EML-E2-D14", "EML-E3-D18", "EML-E3-D22"],
  "EML-E4-D24": ["EML-E2-D10", "EML-E2-D14", "EML-E3-D20", "EML-E3-D23"],
  "EML-E4-D25": ["EML-E4-D24"]
};

export const academyUnitSourceMap: Record<string, readonly string[]> = {
  "EML-E0-D01": [
    "SRC-OPENSTAX-STUDY",
    "SRC-OPENSTAX-SCIENTIFIC-METHOD",
    "SRC-NASA-SE-HANDBOOK",
    "SRC-DOE-DRAWINGS"
  ],
  "EML-E0-D02": ["SRC-BIPM-SI", "SRC-NIST-TN-1297"],
  "EML-E0-D03": ["SRC-OPENSTAX-PRECALCULUS-2E", "SRC-MIT-18-06SC"],
  "EML-E1-D04": [
    "SRC-MIT-OCW-CALCULUS-REVISITED",
    "SRC-MIT-18-02SC",
    "SRC-MIT-18-03SC",
    "SRC-MIT-18-05",
    "SRC-MIT-18-06SC"
  ],
  "EML-E1-D05": ["SRC-OPENSTAX-UNIVERSITY-PHYSICS-1", "SRC-OPENSTAX-UNIVERSITY-PHYSICS-2"],
  "EML-E1-D06": ["SRC-MIT-MISSING-SEMESTER", "SRC-PRO-GIT"],
  "EML-E1-D07": ["SRC-MIT-6-100L", "SRC-MIT-6-005", "SRC-CPP-CORE-GUIDELINES"],
  "EML-E1-D08": ["SRC-AUTODESK-FUSION-CAD-90", "SRC-DOE-DRAWINGS", "SRC-ASME-Y14-5"],
  "EML-E2-D09": ["SRC-MIT-2-001", "SRC-MIT-2-72"],
  "EML-E2-D10": ["SRC-MIT-2-008", "SRC-NIST-ADDITIVE-MANUFACTURING"],
  "EML-E2-D11": ["SRC-MIT-OCW-CIRCUITS-6002", "SRC-MIT-6-622", "SRC-MIT-10-626"],
  "EML-E2-D12": ["SRC-MIT-6-071J", "SRC-MIT-2-737", "SRC-NIST-TN-1297"],
  "EML-E2-D13": ["SRC-MIT-2-737", "SRC-MIT-6-004-C18", "SRC-FREERTOS-DEVELOPER-DOCS"],
  "EML-E2-D14": [
    "SRC-MIT-2-737",
    "SRC-PLCOPEN-IEC-61131-3",
    "SRC-ISA-101",
    "SRC-ISA-18",
    "SRC-ARM-CMSIS-DRIVER",
    "SRC-MODBUS-SPECIFICATIONS",
    "SRC-OASIS-MQTT-5",
    "SRC-OPC-UA-PART-1",
    "SRC-RFC-9293",
    "SRC-OMG-DDS-1-4"
  ],
  "EML-E2-D15": ["SRC-MIT-6-003"],
  "EML-E2-D16": ["SRC-MIT-2-14"],
  "EML-E3-D17": ["SRC-MIT-2-12"],
  "EML-E3-D18": [
    "SRC-ROS2-JAZZY-CLI",
    "SRC-ROS2-CONTROL-JAZZY",
    "SRC-GAZEBO-HARMONIC-ROS2",
    "SRC-GAZEBO-HARMONIC-SENSORS"
  ],
  "EML-E3-D19": ["SRC-MIT-6-041SC", "SRC-MIT-16-322"],
  "EML-E3-D20": ["SRC-NAV2-MAPPING-LOCALISATION", "SRC-NAV2-CONCEPTS"],
  "EML-E3-D21": ["SRC-OPENCV-5-TUTORIALS"],
  "EML-E3-D22": ["SRC-SCIKIT-USER-GUIDE", "SRC-SCIKIT-COMMON-PITFALLS"],
  "EML-E3-D23": [
    "SRC-PYTORCH-BASICS",
    "SRC-PYTORCH-CNN-TRANSFER",
    "SRC-PYTORCH-TRANSFORMER",
    "SRC-PYTORCH-DQN",
    "SRC-EXECUTORCH-BEGINNER",
    "SRC-NIST-AI-RMF-1"
  ],
  "EML-E4-D24": ["SRC-NASA-SE-HANDBOOK", "SRC-NASA-SYSTEM-SAFETY-V2", "SRC-NIST-DOE"],
  "EML-E4-D25": [
    "SRC-ENGINEERS-AUSTRALIA-STAGE-1",
    "SRC-ENGINEERS-AUSTRALIA-ETHICS",
    "SRC-NASA-SE-HANDBOOK"
  ]
};

const unitQuiz = (seed: AcademyUnitCatalogueSeed): AssessmentSpec => ({
  id: `${seed.id}-QUIZ`,
  kind: "unit-quiz",
  title: `${seed.title} quiz`,
  questionIds: lessonIdsForUnit(seed.id).map((lessonId) => questionId(lessonId, 1)),
  requiredScorePercent: 80,
  requiredAppliedEvidence: false,
  timeLimitMinutes: null
});

const unitTest = (seed: AcademyUnitCatalogueSeed): AssessmentSpec => ({
  id: `${seed.id}-TEST`,
  kind: "unit-test",
  title: `${seed.title} unit test`,
  questionIds: lessonIdsForUnit(seed.id).flatMap((lessonId) => [
    questionId(lessonId, 5),
    questionId(lessonId, 6)
  ]),
  requiredScorePercent: 85,
  requiredAppliedEvidence: seed.laboratoryRoute !== null || seed.projectRoute !== null,
  timeLimitMinutes: null
});

export const academyUnits: Unit[] = academyUnitSeeds.map((seed) => ({
  schemaVersion: ACADEMY_SCHEMA_VERSION,
  contentVersion: ACADEMY_CONTENT_VERSION,
  id: seed.id,
  legacyModuleId: seed.id,
  courseId: `ACADEMY-${seed.stage}`,
  title: seed.title,
  description: seed.description,
  prerequisiteSkillIds: (academyUnitPrerequisiteMap[seed.id] ?? []).map(skillIdForUnit),
  lessonIds: lessonIdsForUnit(seed.id),
  quiz: unitQuiz(seed),
  unitTest: unitTest(seed),
  laboratoryRoute: seed.laboratoryRoute,
  projectRoute: seed.projectRoute,
  masterySummary: `Explain, calculate where relevant, diagnose a failure and retain applied evidence for "${seed.title}".`
}));

const courseChallenge = (stage: AcademyStage, units: Unit[]): AssessmentSpec => ({
  id: `ACADEMY-${stage}-CHALLENGE`,
  kind: "course-challenge",
  title: `${academyCourseMeta[stage].title} course challenge`,
  questionIds: units.flatMap((unit) => [
    questionId(unit.lessonIds[2], 4),
    questionId(unit.lessonIds[6], 6)
  ]),
  requiredScorePercent: 90,
  requiredAppliedEvidence: true,
  timeLimitMinutes: null
});

export const academyCourses: Course[] = (["E0", "E1", "E2", "E3", "E4"] as AcademyStage[]).map((stage) => {
  const units = academyUnits.filter((unit) => unit.courseId === `ACADEMY-${stage}`);
  return {
    ...academyCourseMeta[stage],
    unitIds: units.map((unit) => unit.id),
    estimatedMinutes: units.length * academyUnitEstimatedMinutes,
    challenge: courseChallenge(stage, units)
  };
});

export const academySkills: Skill[] = academyUnits.map((unit) => ({
  id: skillIdForUnit(unit.id),
  title: unit.title,
  description: `Demonstrate explainable and applied competence across ${unit.description.charAt(0).toLocaleLowerCase("en-AU")}${unit.description.slice(1)}`,
  prerequisiteSkillIds: [...unit.prerequisiteSkillIds],
  unitIds: [unit.id],
  lessonIds: [...unit.lessonIds],
  requiresAppliedEvidence: unit.laboratoryRoute !== null || unit.projectRoute !== null
}));

export const academyAssessments: AssessmentSpec[] = [
  ...academyUnits.flatMap((unit) => [unit.quiz, unit.unitTest]),
  ...academyCourses.map((course) => course.challenge)
];

export const academySources: SourceReference[] = [
  {
    id: "SRC-BIPM-SI",
    title: "The International System of Units, SI Brochure",
    organisation: "Bureau International des Poids et Mesures",
    url: "https://www.bipm.org/en/publications/si-brochure",
    kind: "standard",
    licence: "CC BY 4.0",
    attribution: "BIPM, The International System of Units, 9th edition, updated 2026",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NIST-TN-1297",
    title: "NIST Technical Note 1297: Guidelines for Evaluating and Expressing Measurement Uncertainty",
    organisation: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/pml/nist-technical-note-1297",
    kind: "official-documentation",
    licence: "Public information except marked third-party material; credit NIST",
    attribution: "National Institute of Standards and Technology, Technical Note 1297",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENSTAX-STUDY",
    title: "College Success 6.2: Studying",
    organisation: "OpenStax, Rice University",
    url: "https://openstax.org/books/college-success/pages/6-2-studying",
    kind: "textbook",
    licence: "CC BY-NC-SA 4.0; current OpenStax attribution and AI-ingestion restrictions apply",
    attribution: "OpenStax, College Success, section 6.2 Studying",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-OCW-CALCULUS-REVISITED",
    title: "Calculus Revisited: Single Variable Calculus",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/res-18-006-calculus-revisited-single-variable-calculus-fall-2010/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, Calculus Revisited, Prof. Herbert Gross",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-OCW-CIRCUITS-6002",
    title: "6.002 Circuits and Electronics",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.002 Circuits and Electronics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENSTAX-SCIENTIFIC-METHOD",
    title: "Physics 1.2: The Scientific Methods",
    organisation: "Texas Education Agency; hosted by OpenStax, Rice University",
    url: "https://openstax.org/books/physics/pages/1-2-the-scientific-methods",
    kind: "textbook",
    licence: "CC BY 4.0; OpenStax separately requires permission for LLM training or generative-AI ingestion; third-party material may differ",
    attribution: "Texas Education Agency, Physics 1.2 The Scientific Methods; access for free at https://openstax.org/books/physics/pages/1-introduction",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-CPP-CORE-GUIDELINES",
    title: "C++ Core Guidelines",
    organisation: "C++ Core Guidelines project",
    url: "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines.html",
    kind: "official-documentation",
    licence: "Custom Standard C++ Foundation licence; personal or internal business use only; retain the copyright and permission notice; no trademark rights are granted",
    attribution: "C++ Core Guidelines, editors Bjarne Stroustrup and Herb Sutter",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENSTAX-PRECALCULUS-2E",
    title: "Precalculus 2e",
    organisation: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/precalculus-2e",
    kind: "textbook",
    licence: "CC BY-NC-SA 4.0; current OpenStax attribution and AI-ingestion restrictions apply",
    attribution: "OpenStax, Precalculus 2e",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-18-06SC",
    title: "18.06SC Linear Algebra",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 18.06SC Linear Algebra",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-18-02SC",
    title: "18.02SC Multivariable Calculus",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 18.02SC Multivariable Calculus",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-18-03SC",
    title: "18.03SC Differential Equations",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 18.03SC Differential Equations",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-18-05",
    title: "18.05 Introduction to Probability and Statistics",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 18.05 Introduction to Probability and Statistics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NASA-SE-HANDBOOK",
    title: "NASA Systems Engineering Handbook",
    organisation: "National Aeronautics and Space Administration",
    url: "https://www.nasa.gov/reference/systems-engineering-handbook/",
    kind: "official-documentation",
    licence: "United States Government publication; acknowledge NASA; logos and third-party material excluded",
    attribution: "NASA Systems Engineering Handbook, NASA/SP-2016-6105 Rev 2",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-AUTODESK-FUSION-CAD-90",
    title: "Learn Fusion for CAD in 90 Minutes",
    organisation: "Autodesk",
    url: "https://www.autodesk.com/learn/ondemand/course/learn-fusion-for-cad-in-90-minutes",
    kind: "courseware",
    licence: "Link-out only; Autodesk terms prohibit redistribution or framing without permission",
    attribution: "Autodesk, Learn Fusion for CAD in 90 Minutes; no Autodesk endorsement",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-DOE-DRAWINGS",
    title: "DOE Fundamentals Handbook: Engineering Symbology, Prints, and Drawings, Volume 1",
    organisation: "United States Department of Energy",
    url: "https://www.energy.gov/ehss/articles/doe-hdbk-10161-93",
    kind: "official-documentation",
    licence: "United States Government publication; third-party material may differ",
    attribution: "United States Department of Energy, DOE-HDBK-1016/1-93; archived handbook",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ASME-Y14-5",
    title: "ASME Y14.5 Dimensioning and Tolerancing",
    organisation: "American Society of Mechanical Engineers",
    url: "https://www.asme.org/codes-standards/find-codes-standards/y14-5-dimensioning-tolerancing",
    kind: "standard",
    licence: "Link-out only; ASME terms apply and the full standard is paid and copyrighted",
    attribution: "ASME Y14.5 Dimensioning and Tolerancing; standards pointer only",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NIST-ADDITIVE-MANUFACTURING",
    title: "Additive Manufacturing",
    organisation: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/additive-manufacturing",
    kind: "official-documentation",
    licence: "Public information except marked third-party material; credit NIST",
    attribution: "National Institute of Standards and Technology, Additive Manufacturing",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-RFC-9293",
    title: "RFC 9293: Transmission Control Protocol",
    organisation: "RFC Editor",
    url: "https://www.rfc-editor.org/rfc/rfc9293.html",
    kind: "standard",
    licence: "IETF Trust Legal Provisions; Revised BSD applies only to identified code components",
    attribution: "RFC Editor, RFC 9293, Transmission Control Protocol",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENSTAX-UNIVERSITY-PHYSICS-1",
    title: "University Physics Volume 1",
    organisation: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/university-physics-volume-1",
    kind: "textbook",
    licence: "CC BY-NC-SA 4.0; current OpenStax attribution and AI-ingestion restrictions apply",
    attribution: "OpenStax, University Physics Volume 1",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENSTAX-UNIVERSITY-PHYSICS-2",
    title: "University Physics Volume 2",
    organisation: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/university-physics-volume-2",
    kind: "textbook",
    licence: "CC BY-NC-SA 4.0; current OpenStax attribution and AI-ingestion restrictions apply",
    attribution: "OpenStax, University Physics Volume 2",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-MISSING-SEMESTER",
    title: "The Missing Semester of Your CS Education",
    organisation: "Massachusetts Institute of Technology",
    url: "https://missing.csail.mit.edu/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0",
    attribution: "MIT Missing Semester course contributors",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PRO-GIT",
    title: "Pro Git, Second Edition",
    organisation: "Git project",
    url: "https://git-scm.com/book/en/v2.html",
    kind: "textbook",
    licence: "CC BY-NC-SA 3.0",
    attribution: "Pro Git by Scott Chacon and Ben Straub",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-100L",
    title: "6.100L Introduction to CS and Programming Using Python",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.100L Introduction to CS and Programming Using Python",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-005",
    title: "6.005 Software Construction",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-005-software-construction-spring-2016/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.005 Software Construction",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-001",
    title: "2.001 Mechanics and Materials I",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.001 Mechanics and Materials I",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-72",
    title: "2.72 Elements of Mechanical Design",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.72 Elements of Mechanical Design",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-008",
    title: "2.008 Design and Manufacturing II",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.008 Design and Manufacturing II",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-622",
    title: "6.622 Power Electronics",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-622-power-electronics-spring-2023/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.622 Power Electronics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-10-626",
    title: "10.626 Electrochemical Energy Systems",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/10-626-electrochemical-energy-systems-spring-2014/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 10.626 Electrochemical Energy Systems",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-071J",
    title: "6.071J Introduction to Electronics, Signals, and Measurement",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-071j-introduction-to-electronics-signals-and-measurement-spring-2006/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.071J Introduction to Electronics, Signals, and Measurement",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-737",
    title: "2.737 Mechatronics",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-737-mechatronics-fall-2014/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.737 Mechatronics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-004-C18",
    title: "6.004 Computation Structures, Chapter 18: Devices and Interrupts",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c18/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.004 Computation Structures, Chapter 18",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-FREERTOS-DEVELOPER-DOCS",
    title: "FreeRTOS Kernel Developer Documentation",
    organisation: "FreeRTOS",
    url: "https://www.freertos.org/Documentation/02-Kernel/02-Kernel-features/00-Developer-docs",
    kind: "official-documentation",
    licence: "Link-out only; FreeRTOS kernel and software are MIT, but this website documentation page does not separately grant reuse rights for its prose",
    attribution: "FreeRTOS Kernel Developer Documentation",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PLCOPEN-IEC-61131-3",
    title: "Status of the IEC 61131-3 Standard",
    organisation: "PLCopen",
    url: "https://www.plcopen.org/standards/logic/iec-61131-3/status-iec-61131-3-standard/",
    kind: "standard",
    licence: "Link-out only; PLCopen website copyright and IEC standard terms apply",
    attribution: "PLCopen, Status of the IEC 61131-3 Standard; standards overview only",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ARM-CMSIS-DRIVER",
    title: "CMSIS-Driver Overview",
    organisation: "Arm",
    url: "https://arm-software.github.io/CMSIS_6/main/Driver/index.html",
    kind: "official-documentation",
    licence: "Apache 2.0",
    attribution: "Arm CMSIS-Driver documentation",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ISA-101",
    title: "ISA-101 Series of Standards for Human-Machine Interfaces",
    organisation: "International Society of Automation",
    url: "https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards",
    kind: "standard",
    licence: "Link-out only; ISA copyright terms apply and ISA IP must not be entered into AI tools",
    attribution: "International Society of Automation, ISA-101 series; standards pointer only",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ISA-18",
    title: "ISA-18 Series of Standards for Alarm Management",
    organisation: "International Society of Automation",
    url: "https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards",
    kind: "standard",
    licence: "Link-out only; ISA copyright terms apply and ISA IP must not be entered into AI tools",
    attribution: "International Society of Automation, ISA-18 series; standards pointer only",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MODBUS-SPECIFICATIONS",
    title: "Modbus Specifications and Implementation Guides",
    organisation: "Modbus Organization",
    url: "https://www.modbus.org/modbus-specifications",
    kind: "standard",
    licence: "Modbus EULA; complete-copy distribution requires all notices and the EULA",
    attribution: "Modbus Organization, Modbus Specifications and Implementation Guides",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OASIS-MQTT-5",
    title: "MQTT Version 5.0",
    organisation: "OASIS Open",
    url: "https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html",
    kind: "standard",
    licence: "OASIS specification notice; copies and explanatory derivatives require notices and the specification text may not be modified",
    attribution: "OASIS Open, MQTT Version 5.0, OASIS Standard, 7 March 2019",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPC-UA-PART-1",
    title: "OPC Unified Architecture Part 1: Overview and Concepts",
    organisation: "OPC Foundation",
    url: "https://reference.opcfoundation.org/specs/OPC-10000-1",
    kind: "standard",
    licence: "Link-out only; OPC specification terms prohibit copying or redistribution without permission",
    attribution: "OPC Foundation, OPC 10000-1, Overview and Concepts",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OMG-DDS-1-4",
    title: "Data Distribution Service Specification Version 1.4",
    organisation: "Object Management Group",
    url: "https://www.omg.org/spec/DDS/1.4/",
    kind: "standard",
    licence: "Link-out only; the specification permits limited unmodified informational copying with its notices, but prohibits modification, network posting and commercial transfer",
    attribution: "Object Management Group, Data Distribution Service 1.4; no endorsement",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-003",
    title: "6.003 Signals and Systems",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.003 Signals and Systems",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-14",
    title: "2.14 Analysis and Design of Feedback Control Systems",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-14-analysis-and-design-of-feedback-control-systems-spring-2014/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.14 Analysis and Design of Feedback Control Systems",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-2-12",
    title: "2.12 Introduction to Robotics",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 2.12 Introduction to Robotics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ROS2-JAZZY-CLI",
    title: "ROS 2 Jazzy Beginner CLI Tools Tutorials",
    organisation: "Open Robotics",
    url: "https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools.html",
    kind: "official-documentation",
    licence: "CC BY 4.0",
    attribution: "ROS 2 Documentation contributors, Jazzy beginner CLI tutorials",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ROS2-CONTROL-JAZZY",
    title: "ros2_control Jazzy Getting Started",
    organisation: "ROS Controls",
    url: "https://control.ros.org/jazzy/doc/getting_started/getting_started.html",
    kind: "official-documentation",
    licence: "Apache 2.0",
    attribution: "ros2_control contributors, Jazzy Getting Started",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-GAZEBO-HARMONIC-ROS2",
    title: "Gazebo Harmonic ROS 2 Integration",
    organisation: "Open Robotics",
    url: "https://gazebosim.org/docs/harmonic/ros2_integration/",
    kind: "official-documentation",
    licence: "CC BY 4.0",
    attribution: "Gazebo documentation contributors, Harmonic ROS 2 Integration",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-GAZEBO-HARMONIC-SENSORS",
    title: "Gazebo Harmonic Sensors",
    organisation: "Open Robotics",
    url: "https://gazebosim.org/docs/harmonic/sensors/",
    kind: "official-documentation",
    licence: "CC BY 4.0",
    attribution: "Gazebo documentation contributors, Harmonic Sensors",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-6-041SC",
    title: "6.041SC Probabilistic Systems Analysis and Applied Probability",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 6.041SC Probabilistic Systems Analysis and Applied Probability",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-MIT-16-322",
    title: "16.322 Stochastic Estimation and Control",
    organisation: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/courses/16-322-stochastic-estimation-and-control-fall-2004/",
    kind: "courseware",
    licence: "CC BY-NC-SA 4.0; course-specific third-party exclusions and MIT name rules apply",
    attribution: "MIT OpenCourseWare, 16.322 Stochastic Estimation and Control",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NAV2-MAPPING-LOCALISATION",
    title: "Nav2 Mapping and Localisation",
    organisation: "Open Navigation",
    url: "https://docs.nav2.org/setup_guides/sensors/mapping_localization.html",
    kind: "official-documentation",
    licence: "Apache-2.0 for the docs.nav2.org documentation repository; separately licensed third-party media may differ",
    attribution: "Nav2 documentation contributors, Mapping and Localisation",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NAV2-CONCEPTS",
    title: "Nav2 Navigation Concepts",
    organisation: "Open Navigation",
    url: "https://docs.nav2.org/concepts/",
    kind: "official-documentation",
    licence: "Apache-2.0 for the docs.nav2.org documentation repository; separately licensed third-party media may differ",
    attribution: "Nav2 documentation contributors, Navigation Concepts",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-OPENCV-5-TUTORIALS",
    title: "OpenCV 5 Tutorials",
    organisation: "Open Source Vision Foundation",
    url: "https://docs.opencv.org/5.0/tutorials/tutorials.html",
    kind: "official-documentation",
    licence: "Apache 2.0",
    attribution: "OpenCV project, OpenCV 5 Tutorials",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-SCIKIT-USER-GUIDE",
    title: "scikit-learn User Guide",
    organisation: "scikit-learn developers",
    url: "https://scikit-learn.org/stable/user_guide.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "scikit-learn developers, User Guide",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-SCIKIT-COMMON-PITFALLS",
    title: "scikit-learn Common Pitfalls and Recommended Practices",
    organisation: "scikit-learn developers",
    url: "https://scikit-learn.org/stable/common_pitfalls.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "scikit-learn developers, Common Pitfalls and Recommended Practices",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PYTORCH-BASICS",
    title: "PyTorch Learn the Basics",
    organisation: "PyTorch Foundation",
    url: "https://docs.pytorch.org/tutorials/beginner/basics/intro",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "PyTorch documentation contributors, Learn the Basics",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PYTORCH-CNN-TRANSFER",
    title: "PyTorch Transfer Learning for Computer Vision",
    organisation: "PyTorch Foundation",
    url: "https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "PyTorch documentation contributors, Transfer Learning for Computer Vision",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PYTORCH-TRANSFORMER",
    title: "PyTorch Transformer Building Blocks",
    organisation: "PyTorch Foundation",
    url: "https://docs.pytorch.org/tutorials/intermediate/transformer_building_blocks.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "PyTorch documentation contributors, Transformer Building Blocks",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-PYTORCH-DQN",
    title: "PyTorch Reinforcement Learning DQN Tutorial",
    organisation: "PyTorch Foundation",
    url: "https://docs.pytorch.org/tutorials/intermediate/reinforcement_q_learning.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "PyTorch documentation contributors, Reinforcement Learning DQN Tutorial",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-EXECUTORCH-BEGINNER",
    title: "ExecuTorch Beginner Pathway",
    organisation: "PyTorch Foundation",
    url: "https://docs.pytorch.org/executorch/stable/pathway-beginner.html",
    kind: "official-documentation",
    licence: "BSD 3-Clause",
    attribution: "ExecuTorch documentation contributors, Beginner Pathway",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NIST-AI-RMF-1",
    title: "Artificial Intelligence Risk Management Framework 1.0",
    organisation: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    kind: "official-documentation",
    licence: "Public information except marked third-party material; credit NIST",
    attribution: "National Institute of Standards and Technology, AI RMF 1.0",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NASA-SYSTEM-SAFETY-V2",
    title: "NASA System Safety Handbook, Volume 2",
    organisation: "National Aeronautics and Space Administration",
    url: "https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20150015500.pdf",
    kind: "official-documentation",
    licence: "United States Government publication; acknowledge NASA; logos and third-party material excluded",
    attribution: "NASA System Safety Handbook, Volume 2, NASA/SP-2014-612",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-NIST-DOE",
    title: "NIST/SEMATECH e-Handbook: Process Improvement",
    organisation: "National Institute of Standards and Technology",
    url: "https://www.itl.nist.gov/div898/handbook/pri/pri.htm",
    kind: "official-documentation",
    licence: "Public information except marked third-party material; credit NIST",
    attribution: "NIST/SEMATECH e-Handbook of Statistical Methods, Process Improvement",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ENGINEERS-AUSTRALIA-STAGE-1",
    title: "Stage 1 Competency Standard for Professional Engineers",
    organisation: "Engineers Australia",
    url: "https://www.engineersaustralia.org.au/publications/stage-1-competency-standard-professional-engineers",
    kind: "standard",
    licence: "Link-out only; Engineers Australia copyright and website terms apply",
    attribution: "Engineers Australia, Stage 1 Competency Standard for Professional Engineers; no endorsement",
    lastValidated: "2026-07-30",
    optional: true
  },
  {
    id: "SRC-ENGINEERS-AUSTRALIA-ETHICS",
    title: "Engineers Australia Code of Ethics",
    organisation: "Engineers Australia",
    url: "https://www.engineersaustralia.org.au/publications/code-ethics",
    kind: "standard",
    licence: "Link-out only; Engineers Australia copyright and website terms apply",
    attribution: "Engineers Australia, Code of Ethics; no endorsement",
    lastValidated: "2026-07-30",
    optional: true
  }
];

export interface AcademyRouteManifestEntry {
  id: string;
  category: "laboratory" | "flagship" | "tool" | "pathway" | "release";
  route: string;
}

export const academyRequiredRoutes: AcademyRouteManifestEntry[] = [
  ...["pid", "electrical", "embedded", "plc", "robotics", "ml", "mechanical", "practice"].map((id) => ({
    id: `lab-${id}`,
    category: "laboratory" as const,
    route: `/learn/labs/${id}`
  })),
  ...[
    "controls",
    "robotics-autonomy",
    "embedded-electronics-sensing",
    "mechanical-design-dynamics",
    "applied-ai-ml"
  ].map((id) => ({
    id: `flagship-${id}`,
    category: "flagship" as const,
    route: `/learn/flagships/${id}`
  })),
  ...[
    ["calculators", "/tools/calculators"],
    ["converter", "/tools/converter"],
    ["materials", "/tools/materials"],
    ["engineering", "/tools/engineering"],
    ["cad", "/tools/cad"],
    ["workbench", "/tools/workbench"],
    ["diagnostics", "/tools/diagnostics"],
    ["progress", "/tools/progress"]
  ].map(([id, route]) => ({
    id: `tool-${id}`,
    category: "tool" as const,
    route
  })),
  ...[
    "controls",
    "embedded",
    "robotics",
    "ai-ml",
    "industrial",
    "mechanical",
    "analysis",
    "mechatronics",
    "verification",
    "software"
  ].map((id) => ({
    id: `pathway-${id}`,
    category: "pathway" as const,
    route: `/learn/pathways/${id}`
  })),
  ...["P1", "P2", "P3", "P4"].map((id) => ({
    id: `release-${id}`,
    category: "release" as const,
    route: `/projects/releases/${id}`
  }))
];
