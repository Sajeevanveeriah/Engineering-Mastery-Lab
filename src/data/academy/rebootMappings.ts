import type { RebootActivityMapping } from "../../lib/academy/types";
import {
  academyCourses,
  academyUnits,
  skillIdForUnit
} from "./catalogue";

interface RebootMilestoneMap {
  id: string;
  first: number;
  last: number;
  unitIds: string[];
}

const milestoneMaps: RebootMilestoneMap[] = [
  {
    id: "M0",
    first: 1,
    last: 6,
    unitIds: ["EML-E0-D01", "EML-E0-D02"]
  },
  {
    id: "M1",
    first: 7,
    last: 16,
    unitIds: ["EML-E1-D06", "EML-E1-D07"]
  },
  {
    id: "M2",
    first: 17,
    last: 28,
    unitIds: ["EML-E0-D03", "EML-E3-D17"]
  },
  {
    id: "M3",
    first: 29,
    last: 40,
    unitIds: ["EML-E3-D18", "EML-E2-D15"]
  },
  {
    id: "M4",
    first: 41,
    last: 52,
    unitIds: ["EML-E3-D17", "EML-E3-D18", "EML-E2-D16", "EML-E1-D08"]
  },
  {
    id: "M5",
    first: 53,
    last: 66,
    unitIds: ["EML-E3-D19", "EML-E3-D20"]
  },
  {
    id: "M6",
    first: 67,
    last: 78,
    unitIds: ["EML-E2-D11", "EML-E2-D12", "EML-E2-D13", "EML-E2-D14", "EML-E2-D16"]
  },
  {
    id: "M7",
    first: 79,
    last: 90,
    unitIds: ["EML-E3-D21", "EML-E3-D22", "EML-E3-D23"]
  },
  {
    id: "M8",
    first: 91,
    last: 100,
    unitIds: ["EML-E4-D24", "EML-E1-D07", "EML-E3-D18"]
  },
  {
    id: "M9",
    first: 101,
    last: 110,
    unitIds: ["EML-E4-D24", "EML-E4-D25"]
  }
];

export const mandatoryAcademyProofSessionIds = [
  "S006",
  "S016",
  "S028",
  "S040",
  "S052",
  "S066",
  "S078",
  "S090",
  "S100",
  "S110"
] as const;

const proofSet = new Set<string>(mandatoryAcademyProofSessionIds);

const releaseForSequence = (sequence: number): string => {
  if (sequence <= 40) return "P1";
  if (sequence <= 52) return "P2";
  if (sequence <= 66) return "P3";
  return "P4";
};

export interface AcademyRebootSessionPlan {
  sessionId: string;
  topic: string;
  lessonIds: string[];
  additionalRoutes: string[];
}

const sessionPlan = (
  sessionId: string,
  topic: string,
  lessonIds: string[],
  additionalRoutes: string[] = []
): AcademyRebootSessionPlan => ({
  sessionId,
  topic,
  lessonIds,
  additionalRoutes
});

export const academyRebootSessionPlan: AcademyRebootSessionPlan[] = [
  sessionPlan("S001", "What a robot is", ["EML-E3-D17-L01"], ["/learn/pathways/robotics"]),
  sessionPlan("S002", "Units and signals", ["EML-E0-D02-L03", "EML-E2-D15-L01"], ["/tools/converter"]),
  sessionPlan("S003", "Python and terminal", ["EML-E1-D07-L01", "EML-E1-D06-L02"], ["/learn/pathways/software"]),
  sessionPlan("S004", "Git recovery", ["EML-E1-D06-L03"], ["/tools/workbench"]),
  sessionPlan("S005", "Frames and vectors", ["EML-E0-D03-L05", "EML-E3-D17-L02"]),
  sessionPlan("S006", "Problem and acceptance criteria", ["EML-E0-D01-L04", "EML-E4-D24-L01"]),
  sessionPlan("S007", "Linux navigation", ["EML-E1-D06-L02"]),
  sessionPlan("S008", "Pipes, search and permissions", ["EML-E1-D06-L02", "EML-E1-D06-L06"]),
  sessionPlan("S009", "Git repository model", ["EML-E1-D06-L03"]),
  sessionPlan("S010", "Branch, merge and safe undo", ["EML-E1-D06-L03"]),
  sessionPlan("S011", "Python values and control flow", ["EML-E1-D07-L01"]),
  sessionPlan("S012", "Python collections and classes", ["EML-E1-D07-L03", "EML-E1-D07-L04"]),
  sessionPlan("S013", "NumPy arrays", ["EML-E1-D04-L05", "EML-E1-D07-L03"]),
  sessionPlan("S014", "Plotting and readable logs", ["EML-E3-D22-L01", "EML-E0-D01-L06"]),
  sessionPlan("S015", "Python tests", ["EML-E1-D07-L05"]),
  sessionPlan("S016", "Sensor-log analyser", ["EML-E1-D07-L05", "EML-E2-D12-L07"]),
  sessionPlan("S017", "C++ values and functions", ["EML-E1-D07-L02"]),
  sessionPlan("S018", "Classes and RAII", ["EML-E1-D07-L02", "EML-E1-D07-L04"]),
  sessionPlan("S019", "STL containers and algorithms", ["EML-E1-D07-L03"]),
  sessionPlan("S020", "CMake structure", ["EML-E1-D06-L05", "EML-E1-D07-L06"]),
  sessionPlan("S021", "GoogleTest", ["EML-E1-D07-L05"]),
  sessionPlan("S022", "Vectors and bases", ["EML-E0-D03-L05"]),
  sessionPlan("S023", "Matrices and rotations", ["EML-E0-D03-L06"]),
  sessionPlan("S024", "Homogeneous transforms", ["EML-E3-D17-L02"]),
  sessionPlan("S025", "Discrete time and noise", ["EML-E2-D15-L02", "EML-E3-D19-L03"]),
  sessionPlan("S026", "Differential-drive kinematics", ["EML-E3-D17-L07"]),
  sessionPlan("S027", "Odometry integration", ["EML-E3-D20-L01"]),
  sessionPlan("S028", "Transform and odometry library", ["EML-E3-D17-L02", "EML-E3-D20-L01"]),
  sessionPlan("S029", "ROS 2 graph and DDS", ["EML-E3-D18-L01", "EML-E3-D18-L07"]),
  sessionPlan("S030", "Workspace and packages", ["EML-E3-D18-L01"]),
  sessionPlan("S031", "Topics and messages", ["EML-E3-D18-L02"]),
  sessionPlan("S032", "Python publisher and subscriber", ["EML-E3-D18-L02", "EML-E1-D07-L01"]),
  sessionPlan("S033", "C++ publisher and subscriber", ["EML-E3-D18-L02", "EML-E1-D07-L02"]),
  sessionPlan("S034", "Services", ["EML-E3-D18-L03"]),
  sessionPlan("S035", "Actions", ["EML-E3-D18-L03"]),
  sessionPlan("S036", "Parameters and YAML", ["EML-E3-D18-L03", "EML-E1-D06-L04"]),
  sessionPlan("S037", "Launch files", ["EML-E3-D18-L01"]),
  sessionPlan("S038", "QoS and lifecycle", ["EML-E3-D18-L03", "EML-E3-D18-L07"]),
  sessionPlan("S039", "rosbag and diagnostics", ["EML-E3-D18-L07"], ["/tools/diagnostics"]),
  sessionPlan("S040", "Sensor-filter-controller workspace", ["EML-E3-D18-L02", "EML-E2-D15-L04"]),
  sessionPlan("S041", "URDF links and joints", ["EML-E3-D18-L04"]),
  sessionPlan("S042", "Mass, inertia and collision", ["EML-E3-D18-L04", "EML-E3-D17-L05"]),
  sessionPlan("S043", "Xacro parameters", ["EML-E3-D18-L04"]),
  sessionPlan("S044", "TF tree", ["EML-E3-D17-L02", "EML-E3-D18-L04"]),
  sessionPlan("S045", "Gazebo world and physics", ["EML-E3-D18-L05"]),
  sessionPlan("S046", "ROS-Gazebo bridge", ["EML-E3-D18-L05", "EML-E3-D18-L07"]),
  sessionPlan("S047", "ros2_control architecture", ["EML-E3-D18-L06"]),
  sessionPlan("S048", "Differential-drive controller", ["EML-E3-D17-L07", "EML-E3-D18-L06"]),
  sessionPlan("S049", "Feedback and PID", ["EML-E2-D16-L04"], ["/learn/flagships/controls", "/learn/pathways/controls"]),
  sessionPlan("S050", "Saturation and anti-windup", ["EML-E2-D16-L07"]),
  sessionPlan("S051", "CAD and packaging constraints", ["EML-E1-D08-L02", "EML-E1-D08-L07"], ["/tools/cad", "/tools/materials"]),
  sessionPlan("S052", "Robot Zero digital twin", ["EML-E3-D18-L06", "EML-E4-D24-L06"], ["/learn/pathways/mechatronics"]),
  sessionPlan("S053", "Encoder odometry", ["EML-E3-D20-L01"]),
  sessionPlan("S054", "IMU frames and noise", ["EML-E3-D19-L03", "EML-E3-D17-L02"]),
  sessionPlan("S055", "Uncertainty and covariance", ["EML-E3-D19-L03"]),
  sessionPlan("S056", "Kalman intuition", ["EML-E3-D19-L05"]),
  sessionPlan("S057", "Extended Kalman Filter cycle", ["EML-E3-D19-L06"]),
  sessionPlan("S058", "robot_localization configuration", ["EML-E3-D19-L06", "EML-E3-D18-L07"]),
  sessionPlan("S059", "LiDAR and scan quality", ["EML-E3-D20-L03", "EML-E2-D12-L01"]),
  sessionPlan("S060", "Occupancy grids", ["EML-E3-D20-L03"]),
  sessionPlan("S061", "SLAM Toolbox", ["EML-E3-D20-L04"]),
  sessionPlan("S062", "AMCL localisation", ["EML-E3-D20-L02"]),
  sessionPlan("S063", "Planning and costmaps", ["EML-E3-D20-L05"]),
  sessionPlan("S064", "Nav2 behaviour and control", ["EML-E3-D20-L06", "EML-E3-D20-L07"]),
  sessionPlan("S065", "Tuning and failure recovery", ["EML-E3-D20-L07"]),
  sessionPlan("S066", "Autonomous mission benchmark", ["EML-E3-D20-L07"], ["/learn/flagships/robotics-autonomy"]),
  sessionPlan("S067", "MCU, GPIO, timers and interrupts", ["EML-E2-D13-L01", "EML-E2-D13-L03"], ["/learn/pathways/embedded"]),
  sessionPlan("S068", "Toolchain and first firmware", ["EML-E2-D13-L05", "EML-E2-D13-L07"]),
  sessionPlan("S069", "ADC, PWM and encoder capture", ["EML-E2-D13-L04", "EML-E2-D13-L03"]),
  sessionPlan("S070", "UART, I2C, SPI and CAN", ["EML-E2-D14-L05"], ["/learn/pathways/industrial"]),
  sessionPlan("S071", "FreeRTOS tasks and scheduling", ["EML-E2-D13-L06"]),
  sessionPlan("S072", "Queues, mutexes and ISR handoff", ["EML-E2-D13-L06"]),
  sessionPlan("S073", "Power and motor driver boundary", ["EML-E2-D13-L07", "EML-E2-D11-L07"]),
  sessionPlan("S074", "Motor sizing and gearing", ["EML-E2-D09-L04", "EML-E3-D17-L06"], [
    "/learn/flagships/mechanical-design-dynamics",
    "/learn/pathways/mechanical",
    "/tools/calculators"
  ]),
  sessionPlan("S075", "Embedded speed PID", ["EML-E2-D16-L04", "EML-E2-D13-L03"]),
  sessionPlan("S076", "Host-to-MCU bridge", ["EML-E2-D14-L05", "EML-E3-D18-L07"]),
  sessionPlan("S077", "Schematic and BOM", ["EML-E2-D11-L07", "EML-E2-D12-L06"]),
  sessionPlan("S078", "Motor node HIL demonstration", ["EML-E2-D13-L07", "EML-E2-D14-L05"], [
    "/learn/flagships/embedded-electronics-sensing"
  ]),
  sessionPlan("S079", "Image formation", ["EML-E3-D21-L01"]),
  sessionPlan("S080", "OpenCV arrays and colour", ["EML-E3-D21-L02"]),
  sessionPlan("S081", "Filtering, edges and contours", ["EML-E3-D21-L02"]),
  sessionPlan("S082", "Camera calibration", ["EML-E3-D21-L03"]),
  sessionPlan("S083", "Pose from visual features", ["EML-E3-D21-L05", "EML-E3-D21-L06"]),
  sessionPlan("S084", "ML problem and data split", ["EML-E3-D22-L01", "EML-E3-D22-L05"], ["/learn/pathways/ai-ml"]),
  sessionPlan("S085", "Regression and classification", ["EML-E3-D22-L02", "EML-E3-D22-L03"]),
  sessionPlan("S086", "PyTorch quickstart", ["EML-E3-D23-L01", "EML-E3-D23-L02"]),
  sessionPlan("S087", "CNN transfer learning", ["EML-E3-D23-L03"]),
  sessionPlan("S088", "YOLO inference", ["EML-E3-D23-L03", "EML-E3-D23-L06"]),
  sessionPlan("S089", "ROS image pipeline", ["EML-E3-D21-L07", "EML-E3-D18-L02"]),
  sessionPlan("S090", "Perception mission benchmark", ["EML-E3-D23-L07", "EML-E3-D21-L07"], [
    "/learn/flagships/applied-ai-ml"
  ]),
  sessionPlan("S091", "Requirements and verification", ["EML-E4-D24-L01", "EML-E4-D24-L06"], [
    "/learn/pathways/verification"
  ]),
  sessionPlan("S092", "Architecture and interfaces", ["EML-E4-D24-L02", "EML-E4-D24-L03"]),
  sessionPlan("S093", "Failure analysis", ["EML-E4-D24-L04", "EML-E4-D24-L05"]),
  sessionPlan("S094", "Logging and diagnostics", ["EML-E3-D18-L07", "EML-E0-D01-L06"]),
  sessionPlan("S095", "Test pyramid", ["EML-E1-D07-L05", "EML-E4-D24-L06"]),
  sessionPlan("S096", "Continuous integration", ["EML-E1-D06-L05", "EML-E1-D07-L05"]),
  sessionPlan("S097", "Reproducible environment", ["EML-E1-D06-L05", "EML-E4-D25-L02"], ["/tools/engineering"]),
  sessionPlan("S098", "Latency and performance", ["EML-E3-D23-L06", "EML-E3-D18-L07"], ["/learn/pathways/analysis"]),
  sessionPlan("S099", "Safe states and recovery", ["EML-E4-D24-L05", "EML-E2-D14-L04"], [
    "/learn/labs/plc",
    "/learn/pathways/industrial"
  ]),
  sessionPlan("S100", "Full regression mission", ["EML-E4-D24-L06", "EML-E4-D25-L06"], ["/tools/workbench"]),
  sessionPlan("S101", "Capstone user problem", ["EML-E4-D24-L01", "EML-E4-D25-L06"]),
  sessionPlan("S102", "Trade study", ["EML-E4-D24-L03"]),
  sessionPlan("S103", "Backlog, risks and interfaces", ["EML-E4-D25-L01", "EML-E4-D24-L04"], ["/tools/progress"]),
  sessionPlan("S104", "Design review", ["EML-E4-D25-L03"]),
  sessionPlan("S105", "Integrated capstone", ["EML-E4-D25-L06"]),
  sessionPlan("S106", "Benchmark and evidence", ["EML-E4-D24-L06", "EML-E4-D25-L05"]),
  sessionPlan("S107", "README and reproducibility", ["EML-E4-D25-L02", "EML-E1-D06-L05"]),
  sessionPlan("S108", "90-second demo", ["EML-E4-D25-L07"]),
  sessionPlan("S109", "Engineering stories", ["EML-E4-D25-L07"]),
  sessionPlan("S110", "Reproducible portfolio release", ["EML-E4-D25-L06", "EML-E4-D25-L07"])
];

const mappingFromPlan = (plan: AcademyRebootSessionPlan): RebootActivityMapping => {
  const sequence = Number(plan.sessionId.slice(1));
  const lessonIds = [...plan.lessonIds];
  const units = [...new Set(lessonIds.map((lessonId) =>
    academyUnits.find((unit) => unit.lessonIds.includes(lessonId))
  ))].filter((unit): unit is (typeof academyUnits)[number] => Boolean(unit));
  if (units.length === 0) throw new Error(`No Academy units resolved for reboot sequence ${sequence}`);
  const sessionId = plan.sessionId;
  const mandatoryProof = proofSet.has(sessionId);
  const releaseId = releaseForSequence(sequence);
  const releaseRoute = `/projects/releases/${releaseId}`;
  const appliedRoutes = [
    ...units.flatMap((unit) => [unit.laboratoryRoute, unit.projectRoute]),
    ...plan.additionalRoutes,
    releaseRoute
  ].filter((route): route is string => Boolean(route));
  const assessmentIds = units.flatMap((unit) => {
    const course = academyCourses.find((candidate) => candidate.id === unit.courseId);
    return [
      unit.quiz.id,
      unit.unitTest.id,
      ...(mandatoryProof && course ? [course.challenge.id] : [])
    ];
  });

  return {
    sessionId,
    lessonIds,
    assessmentIds: [...new Set(assessmentIds)],
    reviewSkillIds: [...new Set(units.map((unit) => skillIdForUnit(unit.id)))],
    appliedRoutes: [...new Set(appliedRoutes)],
    mandatoryProof
  };
};

export const academyRebootMappings: RebootActivityMapping[] = academyRebootSessionPlan.map(mappingFromPlan);

export const academyRebootMilestoneManifest = milestoneMaps.map((milestone) => ({
  id: milestone.id,
  firstSessionId: `S${String(milestone.first).padStart(3, "0")}`,
  lastSessionId: `S${String(milestone.last).padStart(3, "0")}`,
  unitIds: [...milestone.unitIds]
}));
