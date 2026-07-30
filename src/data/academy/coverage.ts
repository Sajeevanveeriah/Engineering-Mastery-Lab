import type { CurriculumCoverageEntry } from "../../lib/academy/types";
import {
  academyCourses,
  academyUnits,
  lessonIdsForUnit,
  skillIdForUnit
} from "./catalogue";

type CoverageTuple = readonly [subject: string, unitId: string, lessonNumber: number];

interface CoverageSection {
  section: string;
  requirements: readonly CoverageTuple[];
}

const coverageSections: readonly CoverageSection[] = [
  {
    section: "7.1",
    requirements: [
      ["How to learn technical subjects", "EML-E0-D01", 1],
      ["Retrieval practice and spaced review", "EML-E0-D01", 2],
      ["Problem decomposition", "EML-E0-D01", 3],
      ["Units, dimensions and SI notation", "EML-E0-D02", 3],
      ["Measurement and significant figures", "EML-E0-D02", 5],
      ["Uncertainty, error and calibration", "EML-E0-D02", 6],
      ["Scientific method", "EML-E0-D01", 4],
      ["Experiment design", "EML-E0-D01", 5],
      ["Technical note-taking", "EML-E0-D01", 6],
      ["Reading diagrams, datasheets and technical documentation", "EML-E0-D01", 7]
    ]
  },
  {
    section: "7.2",
    requirements: [
      ["Arithmetic and numerical fluency", "EML-E0-D02", 1],
      ["Fractions, ratios, percentages and scientific notation", "EML-E0-D02", 2],
      ["Algebra and rearranging equations", "EML-E0-D03", 2],
      ["Functions and graphs", "EML-E0-D03", 3],
      ["Geometry", "EML-E0-D03", 4],
      ["Trigonometry", "EML-E0-D03", 4],
      ["Coordinate systems", "EML-E0-D03", 5],
      ["Vectors and reference frames", "EML-E0-D03", 5],
      ["Complex numbers", "EML-E0-D03", 7],
      ["Differential calculus", "EML-E1-D04", 1],
      ["Integral calculus", "EML-E1-D04", 2],
      ["Multivariable calculus", "EML-E1-D04", 3],
      ["Ordinary differential equations", "EML-E1-D04", 4],
      ["Linear algebra", "EML-E1-D04", 5],
      ["Matrices and transformations", "EML-E1-D04", 5],
      ["Eigenvalues and eigenvectors", "EML-E1-D04", 5],
      ["Probability", "EML-E1-D04", 7],
      ["Descriptive and inferential statistics", "EML-E1-D04", 7],
      ["Numerical methods", "EML-E1-D04", 7],
      ["Optimisation", "EML-E1-D04", 7],
      ["Discrete mathematics where required", "EML-E1-D07", 3],
      ["Mathematics for signals, controls, robotics and ML", "EML-E2-D15", 6]
    ]
  },
  {
    section: "7.3",
    requirements: [
      ["Kinematics", "EML-E1-D05", 1],
      ["Newtonian mechanics", "EML-E1-D05", 1],
      ["Statics", "EML-E1-D05", 2],
      ["Dynamics", "EML-E1-D05", 2],
      ["Work, energy and power", "EML-E1-D05", 3],
      ["Momentum", "EML-E1-D05", 2],
      ["Rotation", "EML-E1-D05", 3],
      ["Oscillation and vibration", "EML-E1-D05", 4],
      ["Waves", "EML-E1-D05", 4],
      ["Electricity and magnetism", "EML-E1-D05", 5],
      ["Thermodynamics", "EML-E1-D05", 6],
      ["Heat transfer", "EML-E1-D05", 6],
      ["Fluid mechanics", "EML-E1-D05", 6],
      ["Material behaviour", "EML-E1-D05", 7],
      ["Physics of sensors and actuators", "EML-E1-D05", 7]
    ]
  },
  {
    section: "7.4",
    requirements: [
      ["Engineering materials", "EML-E2-D09", 1],
      ["Stress, strain and failure", "EML-E2-D09", 2],
      ["Beams, shafts and fasteners", "EML-E2-D09", 3],
      ["Bearings, gears, belts, chains, springs and couplings", "EML-E2-D09", 4],
      ["Mechanisms and linkages", "EML-E2-D09", 5],
      ["Machine design", "EML-E2-D09", 6],
      ["Mechanical power transmission", "EML-E2-D09", 6],
      ["Tribology and lubrication", "EML-E2-D09", 6],
      ["CAD modelling", "EML-E1-D08", 2],
      ["Engineering drawings", "EML-E1-D08", 3],
      ["Fits, tolerances and GD&T", "EML-E1-D08", 5],
      ["Manufacturing processes", "EML-E2-D10", 1],
      ["Machining", "EML-E2-D10", 2],
      ["Sheet metal", "EML-E2-D10", 3],
      ["Casting and moulding", "EML-E2-D10", 4],
      ["Additive manufacturing", "EML-E2-D10", 5],
      ["DFM and DFA", "EML-E2-D10", 6],
      ["Metrology", "EML-E2-D10", 7],
      ["Thermal and fluid considerations", "EML-E1-D05", 6],
      ["Mechanical safety and maintenance", "EML-E2-D09", 7]
    ]
  },
  {
    section: "7.5",
    requirements: [
      ["Charge, voltage, current, resistance and power", "EML-E2-D11", 1],
      ["DC and AC circuit theory", "EML-E2-D11", 3],
      ["Kirchhoff's laws", "EML-E2-D11", 2],
      ["Network analysis", "EML-E2-D11", 2],
      ["Capacitors and inductors", "EML-E2-D11", 3],
      ["Frequency-domain behaviour", "EML-E2-D11", 3],
      ["Diodes", "EML-E2-D11", 4],
      ["Transistors", "EML-E2-D11", 4],
      ["Operational amplifiers", "EML-E2-D11", 5],
      ["Analogue electronics", "EML-E2-D11", 5],
      ["Digital logic", "EML-E2-D11", 6],
      ["Combinational and sequential circuits", "EML-E2-D11", 6],
      ["Power supplies", "EML-E2-D11", 7],
      ["Batteries and energy storage", "EML-E2-D11", 7],
      ["Power electronics", "EML-E2-D11", 7],
      ["Motors and motor drives", "EML-E2-D16", 6],
      ["PCB fundamentals", "EML-E2-D11", 7],
      ["Sensors and instrumentation", "EML-E2-D12", 2],
      ["Signal conditioning", "EML-E2-D12", 3],
      ["ADC and DAC systems", "EML-E2-D12", 4],
      ["Grounding, shielding and EMC", "EML-E2-D12", 5],
      ["Electrical protection and safety", "EML-E2-D11", 7],
      ["Troubleshooting with multimeters, oscilloscopes and logic analysers", "EML-E2-D12", 6]
    ]
  },
  {
    section: "7.6",
    requirements: [
      ["Binary, logic and computer fundamentals", "EML-E1-D06", 1],
      ["Programming concepts from zero", "EML-E1-D07", 1],
      ["Python", "EML-E1-D07", 1],
      ["C and modern C++", "EML-E1-D07", 2],
      ["Data structures", "EML-E1-D07", 3],
      ["Algorithms", "EML-E1-D07", 3],
      ["Object-oriented and functional concepts", "EML-E1-D07", 4],
      ["Files, data formats and APIs", "EML-E1-D06", 4],
      ["Linux command-line use", "EML-E1-D06", 2],
      ["Git and version control", "EML-E1-D06", 3],
      ["Debugging", "EML-E1-D07", 5],
      ["Testing", "EML-E1-D07", 5],
      ["Software architecture", "EML-E1-D07", 6],
      ["State machines", "EML-E1-D07", 6],
      ["Concurrency", "EML-E1-D07", 7],
      ["Networking fundamentals", "EML-E1-D06", 6],
      ["Reproducible engineering computation", "EML-E1-D06", 5],
      ["Documentation and maintainability", "EML-E1-D06", 7],
      ["Secure coding fundamentals", "EML-E1-D07", 7]
    ]
  },
  {
    section: "7.7",
    requirements: [
      ["Microcontroller architecture", "EML-E2-D13", 1],
      ["Memory, registers and peripherals", "EML-E2-D13", 1],
      ["GPIO", "EML-E2-D13", 2],
      ["Interrupts", "EML-E2-D13", 3],
      ["Timers", "EML-E2-D13", 3],
      ["PWM", "EML-E2-D13", 3],
      ["ADC and DAC", "EML-E2-D13", 4],
      ["DMA", "EML-E2-D13", 4],
      ["UART, SPI and I2C", "EML-E2-D14", 5],
      ["CAN", "EML-E2-D14", 5],
      ["Embedded C/C++", "EML-E2-D13", 5],
      ["Real-time behaviour", "EML-E2-D13", 6],
      ["RTOS concepts", "EML-E2-D13", 6],
      ["Scheduling and concurrency", "EML-E2-D13", 6],
      ["Sensor and actuator interfacing", "EML-E2-D13", 2],
      ["Power management", "EML-E2-D13", 7],
      ["Bootloaders and firmware updates", "EML-E2-D13", 7],
      ["Debugging and instrumentation", "EML-E2-D13", 7],
      ["STM32, ESP32 or equivalent practical workflows", "EML-E2-D13", 7],
      ["Hardware-in-the-loop concepts", "EML-E2-D13", 7]
    ]
  },
  {
    section: "7.8",
    requirements: [
      ["Signals and systems", "EML-E2-D15", 1],
      ["Continuous and discrete signals", "EML-E2-D15", 2],
      ["Sampling and aliasing", "EML-E2-D15", 3],
      ["Filtering", "EML-E2-D15", 4],
      ["Fourier and frequency concepts", "EML-E2-D15", 5],
      ["Physical modelling", "EML-E2-D16", 1],
      ["Differential-equation models", "EML-E2-D16", 1],
      ["Transfer functions", "EML-E2-D15", 6],
      ["Block diagrams", "EML-E2-D15", 6],
      ["State-space models", "EML-E2-D15", 6],
      ["Feedback", "EML-E2-D16", 2],
      ["Stability", "EML-E2-D16", 3],
      ["Transient and steady-state behaviour", "EML-E2-D16", 2],
      ["Frequency response", "EML-E2-D16", 5],
      ["PID control", "EML-E2-D16", 4],
      ["Digital control", "EML-E2-D16", 6],
      ["State estimation", "EML-E2-D16", 6],
      ["System identification", "EML-E2-D16", 7],
      ["Kalman-filter foundations", "EML-E3-D19", 5],
      ["Motor control", "EML-E2-D16", 6],
      ["Practical tuning, saturation, noise and anti-windup", "EML-E2-D16", 7]
    ]
  },
  {
    section: "7.9",
    requirements: [
      ["Sensors, actuators and industrial I/O", "EML-E2-D14", 1],
      ["Relays and contactors", "EML-E2-D14", 1],
      ["PLC fundamentals", "EML-E2-D14", 2],
      ["Ladder logic and structured text", "EML-E2-D14", 2],
      ["Sequential control", "EML-E2-D14", 3],
      ["SCADA and HMI principles", "EML-E2-D14", 4],
      ["Industrial safety and interlocks", "EML-E2-D14", 4],
      ["UART, SPI, I2C and CAN in system context", "EML-E2-D14", 5],
      ["Modbus", "EML-E2-D14", 6],
      ["MQTT", "EML-E2-D14", 6],
      ["OPC UA", "EML-E2-D14", 6],
      ["Ethernet and TCP/IP", "EML-E2-D14", 7],
      ["DDS", "EML-E2-D14", 7],
      ["Industrial networks", "EML-E2-D14", 7],
      ["Event-driven automation", "EML-E2-D14", 3],
      ["Data acquisition", "EML-E2-D12", 7],
      ["Alarm management", "EML-E2-D14", 4],
      ["Commissioning", "EML-E2-D14", 7],
      ["End-to-end automation architecture", "EML-E2-D14", 7]
    ]
  },
  {
    section: "7.10",
    requirements: [
      ["Robot components and architectures", "EML-E3-D17", 1],
      ["Coordinate frames and transformations", "EML-E3-D17", 2],
      ["Forward and inverse kinematics", "EML-E3-D17", 4],
      ["Jacobians", "EML-E3-D17", 4],
      ["Robot dynamics", "EML-E3-D17", 5],
      ["Actuators and transmissions", "EML-E3-D17", 6],
      ["Encoders and odometry", "EML-E3-D20", 1],
      ["Mobile robot motion", "EML-E3-D17", 7],
      ["Manipulation", "EML-E3-D17", 7],
      ["ROS 2 fundamentals", "EML-E3-D18", 1],
      ["Nodes, topics, services and actions", "EML-E3-D18", 3],
      ["URDF and robot models", "EML-E3-D18", 4],
      ["Gazebo or equivalent simulation", "EML-E3-D18", 5],
      ["Nav2 concepts", "EML-E3-D18", 6],
      ["Sensor fusion", "EML-E3-D19", 6],
      ["Extended Kalman filters", "EML-E3-D19", 6],
      ["Localisation", "EML-E3-D20", 2],
      ["Mapping and SLAM", "EML-E3-D20", 4],
      ["Path planning", "EML-E3-D20", 5],
      ["Trajectory generation", "EML-E3-D20", 6],
      ["Motion control", "EML-E3-D20", 6],
      ["Computer vision for robotics", "EML-E3-D21", 7],
      ["Human-robot and robot-environment safety", "EML-E3-D17", 7],
      ["Integration, debugging and deployment", "EML-E3-D18", 7]
    ]
  },
  {
    section: "7.11",
    requirements: [
      ["Data preparation", "EML-E3-D22", 1],
      ["Exploratory analysis", "EML-E3-D22", 1],
      ["Supervised learning", "EML-E3-D22", 2],
      ["Unsupervised learning", "EML-E3-D22", 4],
      ["Regression", "EML-E3-D22", 2],
      ["Classification", "EML-E3-D22", 3],
      ["Clustering", "EML-E3-D22", 4],
      ["Feature engineering", "EML-E3-D22", 5],
      ["Training and validation", "EML-E3-D22", 5],
      ["Metrics", "EML-E3-D22", 5],
      ["Data leakage", "EML-E3-D22", 5],
      ["Bias, variance and overfitting", "EML-E3-D22", 6],
      ["Reproducibility", "EML-E3-D22", 6],
      ["Neural-network foundations", "EML-E3-D23", 1],
      ["Deep learning", "EML-E3-D23", 2],
      ["Convolutional networks", "EML-E3-D23", 3],
      ["Transformers where relevant", "EML-E3-D23", 4],
      ["Computer vision", "EML-E3-D21", 7],
      ["Time-series analysis", "EML-E3-D22", 7],
      ["Anomaly detection", "EML-E3-D22", 7],
      ["Sensor-data ML", "EML-E3-D22", 7],
      ["Reinforcement-learning foundations", "EML-E3-D23", 5],
      ["Edge AI", "EML-E3-D23", 6],
      ["Model compression and deployment", "EML-E3-D23", 6],
      ["MLOps fundamentals", "EML-E3-D23", 7],
      ["Safety, bias, uncertainty and limitations", "EML-E3-D23", 7],
      ["AI/ML integration within robotics and automation", "EML-E3-D23", 7]
    ]
  },
  {
    section: "7.12",
    requirements: [
      ["Stakeholder needs", "EML-E4-D24", 1],
      ["Requirements", "EML-E4-D24", 1],
      ["Functional decomposition", "EML-E4-D24", 2],
      ["Architectures", "EML-E4-D24", 2],
      ["Interfaces", "EML-E4-D24", 3],
      ["Trade studies", "EML-E4-D24", 3],
      ["Risk management", "EML-E4-D24", 4],
      ["FMEA and hazard analysis", "EML-E4-D24", 4],
      ["Safety engineering", "EML-E4-D24", 5],
      ["Reliability", "EML-E4-D24", 5],
      ["Verification and validation", "EML-E4-D24", 6],
      ["Configuration and change management", "EML-E4-D24", 7],
      ["Experimental design", "EML-E4-D24", 6],
      ["Technical reports", "EML-E4-D25", 2],
      ["Design reviews", "EML-E4-D25", 3],
      ["Ethics", "EML-E4-D25", 4],
      ["Sustainability", "EML-E4-D25", 4],
      ["Project planning", "EML-E4-D25", 1],
      ["Portfolio evidence", "EML-E4-D25", 5],
      ["Capstone integration", "EML-E4-D25", 6],
      ["Interview and professional proof", "EML-E4-D25", 7]
    ]
  }
];

export interface AcademyCoverageRequirement {
  requirementId: string;
  section: string;
  subject: string;
  unitId: string;
  lessonNumber: number;
}

export const academyCoverageRequirements: AcademyCoverageRequirement[] = coverageSections.flatMap((section) =>
  section.requirements.map(([subject, unitId, lessonNumber], index) => ({
    requirementId: `COV-${section.section}-${String(index + 1).padStart(2, "0")}`,
    section: section.section,
    subject,
    unitId,
    lessonNumber
  }))
);

export const academyCoverageManifest: CurriculumCoverageEntry[] = academyCoverageRequirements.map((requirement) => {
  const unit = academyUnits.find((candidate) => candidate.id === requirement.unitId);
  if (!unit) throw new Error(`Coverage requirement ${requirement.requirementId} references unknown unit ${requirement.unitId}`);
  const course = academyCourses.find((candidate) => candidate.id === unit.courseId);
  if (!course) throw new Error(`Coverage requirement ${requirement.requirementId} references unknown course ${unit.courseId}`);
  const lessonId = lessonIdsForUnit(unit.id)[requirement.lessonNumber - 1];
  return {
    requirementId: requirement.requirementId,
    subject: requirement.subject,
    courseId: course.id,
    unitId: unit.id,
    lessonId,
    prerequisiteSkillIds: [...unit.prerequisiteSkillIds],
    skillIds: [skillIdForUnit(unit.id)],
    assessmentIds: [unit.quiz.id, unit.unitTest.id, course.challenge.id],
    appliedRoute: unit.laboratoryRoute ?? unit.projectRoute,
    status: "mapped"
  };
});
