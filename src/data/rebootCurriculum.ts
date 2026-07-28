export const REBOOT_CONTENT_SCHEMA_VERSION = 1 as const;
export const REBOOT_CONTENT_VERSION = "2026.07.26" as const;

export type RebootSessionStatus = "Not started" | "In progress" | "Done" | "Skipped after diagnostic";

export interface RebootSession {
  id: string;
  milestoneId: string;
  sequence: number;
  mode: string;
  topic: string;
  microLesson: string;
  buildOrTest: string;
  retrievalAndClose: string;
  resourceIds: string[];
  evidenceRequirement: string;
  defaultStatus: RebootSessionStatus;
  confidence: number | null;
  plannedMinutes: number;
  notes: string | null;
}

export interface RebootResource {
  id: string;
  track: string;
  name: string;
  provider: string;
  type: string;
  suggestedSliceMinutes: number;
  exactUse: string;
  originalUrl: string;
  authority: string;
  linkCheckResult: string;
  linkCheckDate: string;
}

export const rebootProvenance = {
  sourceFileName: "20260726-Robotics-AI-Study-Plan-Rev00.xlsx",
  sourceSha256: "a0ffeeb6835603ae0846db7ee201028a5cdd032b8fe54153649b2aff72e4c2b8",
  importedAt: "2026-07-28",
  sourceSchema: {
    sheets: ["Start Here", "Roadmap", "Session Plan", "Daily Rhythm", "Calendar Fit", "Diagnostics", "Projects", "Resources", "Weekly Review"],
    sheetCount: 9,
    sessionRange: "Session Plan!A4:N113",
    resourceRange: "Resources!A4:K67"
  },
  privacy: "Calendar Fit values are excluded from public content. Only the generic local planning model below is retained.",
  sourceTreatment: "Session, resource, roadmap, diagnostic and project wording is preserved from the workbook. Dates are ISO-formatted without changing their meaning."
} as const;

export const rebootSessions: RebootSession[] = [
  {
    "id": "S001",
    "milestoneId": "M0",
    "sequence": 1,
    "mode": "Map",
    "topic": "What a robot is",
    "microLesson": "Use five labels: sense, think, act, power and communicate. Define each in one plain sentence.",
    "buildOrTest": "Draw your target rover as five labelled blocks and connect every interface.",
    "retrievalAndClose": "Close the reference and redraw it from memory.",
    "resourceIds": [
      "L01",
      "L02"
    ],
    "evidenceRequirement": "Photo or diagram plus a one-sentence boundary",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S002",
    "milestoneId": "M0",
    "sequence": 2,
    "mode": "Diagnostic",
    "topic": "Units and signals",
    "microLesson": "Review SI base units, sample rate, latency and resolution.",
    "buildOrTest": "Classify ten example robot values by unit, range and update rate.",
    "retrievalAndClose": "Explain why confusing rate and period breaks control.",
    "resourceIds": [
      "MATH01"
    ],
    "evidenceRequirement": "Checked signal table",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S003",
    "milestoneId": "M0",
    "sequence": 3,
    "mode": "Diagnostic",
    "topic": "Python and terminal",
    "microLesson": "Review only the commands or syntax you cannot recall.",
    "buildOrTest": "Run a tiny script that reads five sensor values and reports mean and maximum.",
    "retrievalAndClose": "Recreate the script without copying.",
    "resourceIds": [
      "SYS01",
      "SW01"
    ],
    "evidenceRequirement": "Runnable script and terminal output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S004",
    "milestoneId": "M0",
    "sequence": 4,
    "mode": "Diagnostic",
    "topic": "Git recovery",
    "microLesson": "Read the short Git videos for commit, branch and restore.",
    "buildOrTest": "Create a branch, make a change, commit it and recover a previous version.",
    "retrievalAndClose": "Name working tree, staging area, commit and branch from memory.",
    "resourceIds": [
      "SYS02",
      "SYS03"
    ],
    "evidenceRequirement": "Git log and successful recovery",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S005",
    "milestoneId": "M0",
    "sequence": 5,
    "mode": "Diagnostic",
    "topic": "Frames and vectors",
    "microLesson": "Watch one visual lesson on vectors and transformations.",
    "buildOrTest": "Sketch map, odom, base_link and sensor frames for a rover.",
    "retrievalAndClose": "Point to the transform direction for one measurement.",
    "resourceIds": [
      "MATH01",
      "ROBT01"
    ],
    "evidenceRequirement": "Frame sketch with axes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S006",
    "milestoneId": "M0",
    "sequence": 6,
    "mode": "Proof",
    "topic": "Problem and acceptance criteria",
    "microLesson": "Read the examples on the Projects sheet.",
    "buildOrTest": "Write one user problem and five measurable pass/fail criteria for Robot Zero.",
    "retrievalAndClose": "Explain why each criterion is testable.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Problem statement and five criteria",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S007",
    "milestoneId": "M1",
    "sequence": 7,
    "mode": "Learn",
    "topic": "Linux navigation",
    "microLesson": "Read only Ubuntu command-line sections on pwd, ls, cd, mkdir and paths.",
    "buildOrTest": "Navigate a practice tree and locate files without a graphical file manager.",
    "retrievalAndClose": "Write the five commands from memory.",
    "resourceIds": [
      "SYS01"
    ],
    "evidenceRequirement": "Command history showing correct paths",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S008",
    "milestoneId": "M1",
    "sequence": 8,
    "mode": "Build",
    "topic": "Pipes, search and permissions",
    "microLesson": "Read sections on pipes, redirection, grep and permissions.",
    "buildOrTest": "Filter a small log, redirect errors and inspect file permissions.",
    "retrievalAndClose": "Explain stdin, stdout and stderr.",
    "resourceIds": [
      "SYS01"
    ],
    "evidenceRequirement": "Three working command pipelines",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S009",
    "milestoneId": "M1",
    "sequence": 9,
    "mode": "Learn",
    "topic": "Git repository model",
    "microLesson": "Use Git Learn videos under 10 minutes.",
    "buildOrTest": "Initialise a repository and make three small, meaningful commits.",
    "retrievalAndClose": "Draw working tree to staging to commit.",
    "resourceIds": [
      "SYS02",
      "SYS03"
    ],
    "evidenceRequirement": "Three-commit log",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S010",
    "milestoneId": "M1",
    "sequence": 10,
    "mode": "Build",
    "topic": "Branch, merge and safe undo",
    "microLesson": "Read Pro Git basics on branches and restoring work.",
    "buildOrTest": "Create and merge a feature branch, then safely undo a deliberate bad change.",
    "retrievalAndClose": "State when not to rewrite shared history.",
    "resourceIds": [
      "SYS03"
    ],
    "evidenceRequirement": "Merge graph and recovery note",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S011",
    "milestoneId": "M1",
    "sequence": 11,
    "mode": "Learn",
    "topic": "Python values and control flow",
    "microLesson": "Read Python tutorial sections on values, if, for, while and functions.",
    "buildOrTest": "Write a sensor threshold function with input validation.",
    "retrievalAndClose": "Predict outputs for three edge cases before running.",
    "resourceIds": [
      "SW01"
    ],
    "evidenceRequirement": "Function plus edge-case outputs",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S012",
    "milestoneId": "M1",
    "sequence": 12,
    "mode": "Build",
    "topic": "Python collections and classes",
    "microLesson": "Read only lists, dictionaries, classes and dataclasses.",
    "buildOrTest": "Represent timestamped IMU samples and group them by sensor.",
    "retrievalAndClose": "Explain list versus dictionary choice.",
    "resourceIds": [
      "SW01"
    ],
    "evidenceRequirement": "Small typed data model",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S013",
    "milestoneId": "M1",
    "sequence": 13,
    "mode": "Learn",
    "topic": "NumPy arrays",
    "microLesson": "Read array creation, shape, indexing, broadcasting and basic statistics.",
    "buildOrTest": "Vectorise a moving-average calculation without a Python loop.",
    "retrievalAndClose": "State array shape at each step.",
    "resourceIds": [
      "SW02"
    ],
    "evidenceRequirement": "Vectorised calculation and shape notes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S014",
    "milestoneId": "M1",
    "sequence": 14,
    "mode": "Build",
    "topic": "Plotting and readable logs",
    "microLesson": "Read the first pyplot examples only.",
    "buildOrTest": "Plot time, raw signal and filtered signal with title, axes and SI units.",
    "retrievalAndClose": "Describe one visible anomaly.",
    "resourceIds": [
      "SW03"
    ],
    "evidenceRequirement": "Labelled plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S015",
    "milestoneId": "M1",
    "sequence": 15,
    "mode": "Test",
    "topic": "Python tests",
    "microLesson": "Complete pytest first test and exception sections.",
    "buildOrTest": "Write normal, boundary and invalid-input tests for the filter.",
    "retrievalAndClose": "Explain why each test can fail independently.",
    "resourceIds": [
      "SW04"
    ],
    "evidenceRequirement": "Passing and deliberately failing test output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S016",
    "milestoneId": "M1",
    "sequence": 16,
    "mode": "Proof",
    "topic": "Sensor-log analyser",
    "microLesson": "Review the prior nine blocks, not a new tutorial.",
    "buildOrTest": "Combine parsing, statistics, plot and tests into one small command-line tool.",
    "retrievalAndClose": "Give a 60-second explanation without opening the code.",
    "resourceIds": [
      "SW01",
      "SW02",
      "SW03",
      "SW04"
    ],
    "evidenceRequirement": "Fresh-run instructions, plot and passing tests",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S017",
    "milestoneId": "M2",
    "sequence": 17,
    "mode": "Learn",
    "topic": "C++ values and functions",
    "microLesson": "Use LearnCpp sections on types, functions, references and const.",
    "buildOrTest": "Implement a bounded clamp and angle-normalisation function.",
    "retrievalAndClose": "Predict results at limits and wrap boundaries.",
    "resourceIds": [
      "SW05",
      "SW06"
    ],
    "evidenceRequirement": "Compiled program with boundary output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S018",
    "milestoneId": "M2",
    "sequence": 18,
    "mode": "Build",
    "topic": "Classes and RAII",
    "microLesson": "Read only constructors, destructors, const methods and RAII purpose.",
    "buildOrTest": "Create a small Pose2D class with invariant checks.",
    "retrievalAndClose": "Explain ownership and lifetime in plain language.",
    "resourceIds": [
      "SW05",
      "SW06"
    ],
    "evidenceRequirement": "Pose2D class and usage example",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S019",
    "milestoneId": "M2",
    "sequence": 19,
    "mode": "Learn",
    "topic": "STL containers and algorithms",
    "microLesson": "Read vector, map, algorithm and iterator summaries.",
    "buildOrTest": "Compute statistics for a vector of samples with standard algorithms.",
    "retrievalAndClose": "Choose vector or map for two robot cases.",
    "resourceIds": [
      "SW06"
    ],
    "evidenceRequirement": "Compiled STL example",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S020",
    "milestoneId": "M2",
    "sequence": 20,
    "mode": "Build",
    "topic": "CMake structure",
    "microLesson": "Complete CMake tutorial Step 1 only, then scan library targets.",
    "buildOrTest": "Build a library and executable from separate directories.",
    "retrievalAndClose": "Explain configure versus build.",
    "resourceIds": [
      "SW07"
    ],
    "evidenceRequirement": "Clean CMake build",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S021",
    "milestoneId": "M2",
    "sequence": 21,
    "mode": "Test",
    "topic": "GoogleTest",
    "microLesson": "Read the primer sections on test structure and assertions.",
    "buildOrTest": "Test angle normalisation and Pose2D invariants.",
    "retrievalAndClose": "State what one failed assertion means.",
    "resourceIds": [
      "SW08"
    ],
    "evidenceRequirement": "Passing GoogleTest suite",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S022",
    "milestoneId": "M2",
    "sequence": 22,
    "mode": "Learn",
    "topic": "Vectors and bases",
    "microLesson": "Watch the vectors, span and basis lessons in short slices.",
    "buildOrTest": "Draw a vector in world and robot bases and calculate one coordinate conversion.",
    "retrievalAndClose": "Recreate the basis change from memory.",
    "resourceIds": [
      "MATH01"
    ],
    "evidenceRequirement": "Worked vector conversion",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S023",
    "milestoneId": "M2",
    "sequence": 23,
    "mode": "Learn",
    "topic": "Matrices and rotations",
    "microLesson": "Watch matrix transformation and composition lessons.",
    "buildOrTest": "Implement and test a 2D rotation matrix.",
    "retrievalAndClose": "Explain multiplication order physically.",
    "resourceIds": [
      "MATH01",
      "ROBT01"
    ],
    "evidenceRequirement": "Numeric rotation check",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S024",
    "milestoneId": "M2",
    "sequence": 24,
    "mode": "Build",
    "topic": "Homogeneous transforms",
    "microLesson": "Use Modern Robotics rigid-body motion videos under 10 minutes each.",
    "buildOrTest": "Compose two 2D homogeneous transforms and invert the result.",
    "retrievalAndClose": "Sketch source and destination frames.",
    "resourceIds": [
      "ROBT01"
    ],
    "evidenceRequirement": "Transform code and frame sketch",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S025",
    "milestoneId": "M2",
    "sequence": 25,
    "mode": "Learn",
    "topic": "Discrete time and noise",
    "microLesson": "Review derivative, integral, sample period, mean, variance and Gaussian noise.",
    "buildOrTest": "Simulate a noisy velocity signal and integrate position at two sample periods.",
    "retrievalAndClose": "Explain the change in error.",
    "resourceIds": [
      "MATH02",
      "CTRL01"
    ],
    "evidenceRequirement": "Plot comparing sample periods",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S026",
    "milestoneId": "M2",
    "sequence": 26,
    "mode": "Build",
    "topic": "Differential-drive kinematics",
    "microLesson": "Watch the wheeled-mobile-robot overview or read the matching section.",
    "buildOrTest": "Derive linear and angular velocity from left/right wheel speeds.",
    "retrievalAndClose": "Check straight, rotate and arc cases.",
    "resourceIds": [
      "ROBT01"
    ],
    "evidenceRequirement": "Three verified kinematic cases",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S027",
    "milestoneId": "M2",
    "sequence": 27,
    "mode": "Test",
    "topic": "Odometry integration",
    "microLesson": "Review Euler integration and angle wrapping.",
    "buildOrTest": "Implement one odometry update and compare against hand calculations.",
    "retrievalAndClose": "Explain accumulated error sources.",
    "resourceIds": [
      "ROBT01",
      "CTRL01"
    ],
    "evidenceRequirement": "Unit tests and worked example",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S028",
    "milestoneId": "M2",
    "sequence": 28,
    "mode": "Proof",
    "topic": "Transform and odometry library",
    "microLesson": "Review your own notes only.",
    "buildOrTest": "Package transforms and odometry as a C++ library with CMake and GoogleTest.",
    "retrievalAndClose": "Explain frames, units and two failure modes.",
    "resourceIds": [
      "SW07",
      "SW08",
      "ROBT01"
    ],
    "evidenceRequirement": "Clean build, test output and short design note",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S029",
    "milestoneId": "M3",
    "sequence": 29,
    "mode": "Learn",
    "topic": "ROS 2 graph and DDS",
    "microLesson": "Read ROS concepts on nodes, discovery and middleware.",
    "buildOrTest": "Run a demo and inspect nodes, topics and connections with CLI tools.",
    "retrievalAndClose": "Draw the graph from memory.",
    "resourceIds": [
      "ROS02",
      "ROS03",
      "ROS04"
    ],
    "evidenceRequirement": "Annotated ROS graph",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S030",
    "milestoneId": "M3",
    "sequence": 30,
    "mode": "Build",
    "topic": "Workspace and packages",
    "microLesson": "Read the colcon quick start and package tutorial overview.",
    "buildOrTest": "Create a workspace with one Python and one C++ package.",
    "retrievalAndClose": "Explain source, build, install and log spaces.",
    "resourceIds": [
      "ROS05",
      "ROS06"
    ],
    "evidenceRequirement": "Successful selective build",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S031",
    "milestoneId": "M3",
    "sequence": 31,
    "mode": "Learn",
    "topic": "Topics and messages",
    "microLesson": "Complete the CLI topic tutorial in one capped slice.",
    "buildOrTest": "Inspect type, rate and one message field, then publish a safe test message.",
    "retrievalAndClose": "Explain publisher/subscriber decoupling.",
    "resourceIds": [
      "ROS04"
    ],
    "evidenceRequirement": "Topic inspection output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S032",
    "milestoneId": "M3",
    "sequence": 32,
    "mode": "Build",
    "topic": "Python publisher and subscriber",
    "microLesson": "Read only the minimal Python pub/sub tutorial.",
    "buildOrTest": "Publish a typed simulated range signal and subscribe to it.",
    "retrievalAndClose": "Recreate the node skeleton from memory.",
    "resourceIds": [
      "ROS05"
    ],
    "evidenceRequirement": "Two working Python nodes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S033",
    "milestoneId": "M3",
    "sequence": 33,
    "mode": "Build",
    "topic": "C++ publisher and subscriber",
    "microLesson": "Read only the minimal C++ pub/sub tutorial.",
    "buildOrTest": "Rebuild the same interface in C++ and compare lifecycle and build steps.",
    "retrievalAndClose": "Name three Python/C++ differences.",
    "resourceIds": [
      "ROS05",
      "SW07"
    ],
    "evidenceRequirement": "Two working C++ nodes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S034",
    "milestoneId": "M3",
    "sequence": 34,
    "mode": "Learn",
    "topic": "Services",
    "microLesson": "Read the service/client concept and minimal example.",
    "buildOrTest": "Create a reset-filter service with success and error responses.",
    "retrievalAndClose": "Explain request/response limitations.",
    "resourceIds": [
      "ROS05"
    ],
    "evidenceRequirement": "Service call evidence",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S035",
    "milestoneId": "M3",
    "sequence": 35,
    "mode": "Learn",
    "topic": "Actions",
    "microLesson": "Read action goal, feedback and result concepts.",
    "buildOrTest": "Create a timed rotate action that reports progress and supports cancel.",
    "retrievalAndClose": "Explain why this is not a service.",
    "resourceIds": [
      "ROS05"
    ],
    "evidenceRequirement": "Action feedback and cancel evidence",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S036",
    "milestoneId": "M3",
    "sequence": 36,
    "mode": "Build",
    "topic": "Parameters and YAML",
    "microLesson": "Read parameter and YAML tutorial sections.",
    "buildOrTest": "Move thresholds and sample rate into validated parameters.",
    "retrievalAndClose": "State defaults and invalid-value behaviour.",
    "resourceIds": [
      "ROS02"
    ],
    "evidenceRequirement": "Parameter file and validation output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S037",
    "milestoneId": "M3",
    "sequence": 37,
    "mode": "Build",
    "topic": "Launch files",
    "microLesson": "Read launch basics and substitutions only.",
    "buildOrTest": "Launch all nodes with one file and a selectable configuration.",
    "retrievalAndClose": "Explain process start order and dependencies.",
    "resourceIds": [
      "ROS02"
    ],
    "evidenceRequirement": "One-command launch",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S038",
    "milestoneId": "M3",
    "sequence": 38,
    "mode": "Learn",
    "topic": "QoS and lifecycle",
    "microLesson": "Read reliability, durability, history and lifecycle overview.",
    "buildOrTest": "Run one compatible and one deliberately incompatible QoS case.",
    "retrievalAndClose": "Explain why data disappeared.",
    "resourceIds": [
      "ROS09"
    ],
    "evidenceRequirement": "QoS compatibility observation",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S039",
    "milestoneId": "M3",
    "sequence": 39,
    "mode": "Test",
    "topic": "rosbag and diagnostics",
    "microLesson": "Read recording/playback and diagnostic conventions.",
    "buildOrTest": "Record a short run, replay it and reproduce one plot.",
    "retrievalAndClose": "Explain why replay is valuable for regression.",
    "resourceIds": [
      "ROS10",
      "VIS02"
    ],
    "evidenceRequirement": "Bag file evidence and replay plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S040",
    "milestoneId": "M3",
    "sequence": 40,
    "mode": "Proof",
    "topic": "Sensor-filter-controller workspace",
    "microLesson": "Use no new tutorial.",
    "buildOrTest": "Connect sensor, filter, parameter, service and controller nodes with tests.",
    "retrievalAndClose": "Explain the graph and one QoS decision in 90 seconds.",
    "resourceIds": [
      "ROS02",
      "ROS05",
      "ROS09",
      "TEST01"
    ],
    "evidenceRequirement": "Clean launch, graph, bag and test results",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S041",
    "milestoneId": "M4",
    "sequence": 41,
    "mode": "Learn",
    "topic": "URDF links and joints",
    "microLesson": "Read visual URDF tutorial sections on link, joint and origin.",
    "buildOrTest": "Build a three-link fixed/joint model and inspect it in RViz.",
    "retrievalAndClose": "Predict the child pose before launching.",
    "resourceIds": [
      "ROS08"
    ],
    "evidenceRequirement": "Valid URDF and RViz image",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S042",
    "milestoneId": "M4",
    "sequence": 42,
    "mode": "Build",
    "topic": "Mass, inertia and collision",
    "microLesson": "Read inertial and collision guidance only.",
    "buildOrTest": "Add plausible mass, inertia and simplified collision geometry.",
    "retrievalAndClose": "Check units and positive inertia values.",
    "resourceIds": [
      "ROS08",
      "SIM02"
    ],
    "evidenceRequirement": "Model validation notes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S043",
    "milestoneId": "M4",
    "sequence": 43,
    "mode": "Build",
    "topic": "Xacro parameters",
    "microLesson": "Read Xacro macro and property examples.",
    "buildOrTest": "Convert repeated wheel structures into one reusable macro.",
    "retrievalAndClose": "Explain expansion and parameter flow.",
    "resourceIds": [
      "ROS08"
    ],
    "evidenceRequirement": "Compact Xacro model",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S044",
    "milestoneId": "M4",
    "sequence": 44,
    "mode": "Test",
    "topic": "TF tree",
    "microLesson": "Read tf2 frame and broadcaster tutorials.",
    "buildOrTest": "Publish required static/dynamic transforms and inspect the full tree.",
    "retrievalAndClose": "Identify one prohibited loop or duplicate parent.",
    "resourceIds": [
      "ROS07"
    ],
    "evidenceRequirement": "Complete TF tree with no breaks",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S045",
    "milestoneId": "M4",
    "sequence": 45,
    "mode": "Learn",
    "topic": "Gazebo world and physics",
    "microLesson": "Read Gazebo getting-started world, model and simulation sections.",
    "buildOrTest": "Spawn a box and rover, then change one physical parameter and observe impact.",
    "retrievalAndClose": "State simulation step and real-time factor.",
    "resourceIds": [
      "SIM02"
    ],
    "evidenceRequirement": "Controlled physics comparison",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S046",
    "milestoneId": "M4",
    "sequence": 46,
    "mode": "Build",
    "topic": "ROS-Gazebo bridge",
    "microLesson": "Read the ros_gz bridge syntax and sensor examples.",
    "buildOrTest": "Bridge velocity command, joint state and one sensor topic.",
    "retrievalAndClose": "Explain direction and message type for each bridge.",
    "resourceIds": [
      "SIM03"
    ],
    "evidenceRequirement": "Verified bridge topic list",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S047",
    "milestoneId": "M4",
    "sequence": 47,
    "mode": "Learn",
    "topic": "ros2_control architecture",
    "microLesson": "Read hardware components, controller manager and controllers.",
    "buildOrTest": "Draw command/state interfaces from Nav2 down to wheels.",
    "retrievalAndClose": "Name update-loop boundaries.",
    "resourceIds": [
      "SIM04"
    ],
    "evidenceRequirement": "Control architecture diagram",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S048",
    "milestoneId": "M4",
    "sequence": 48,
    "mode": "Build",
    "topic": "Differential-drive controller",
    "microLesson": "Read the diff-drive controller overview and parameters.",
    "buildOrTest": "Configure wheel names, separation, radius and command timeout.",
    "retrievalAndClose": "Check units and direction signs.",
    "resourceIds": [
      "SIM04"
    ],
    "evidenceRequirement": "Stable teleoperation and odometry",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S049",
    "milestoneId": "M4",
    "sequence": 49,
    "mode": "Learn",
    "topic": "Feedback and PID",
    "microLesson": "Read CTMS PID introduction or one short control video.",
    "buildOrTest": "Simulate P, PI and PID on a simple wheel-speed plant.",
    "retrievalAndClose": "Explain rise time, overshoot and steady-state error.",
    "resourceIds": [
      "CTRL01",
      "CTRL02"
    ],
    "evidenceRequirement": "Comparison plot with units",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S050",
    "milestoneId": "M4",
    "sequence": 50,
    "mode": "Test",
    "topic": "Saturation and anti-windup",
    "microLesson": "Read the anti-windup example summary.",
    "buildOrTest": "Apply command saturation and compare with/without anti-windup.",
    "retrievalAndClose": "Explain integrator windup.",
    "resourceIds": [
      "CTRL03"
    ],
    "evidenceRequirement": "Bounded response plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S051",
    "milestoneId": "M4",
    "sequence": 51,
    "mode": "Build",
    "topic": "CAD and packaging constraints",
    "microLesson": "Complete one Fusion sketch-to-component lesson.",
    "buildOrTest": "Create a simple parametric base plate with wheel and sensor envelopes.",
    "retrievalAndClose": "Check interference and key dimensions.",
    "resourceIds": [
      "CAD01"
    ],
    "evidenceRequirement": "Dimensioned CAD screenshot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S052",
    "milestoneId": "M4",
    "sequence": 52,
    "mode": "Proof",
    "topic": "Robot Zero digital twin",
    "microLesson": "Review acceptance criteria from M0.",
    "buildOrTest": "Run teleop, stop-time, TF, collision and repeatability tests.",
    "retrievalAndClose": "State pass/fail and one next risk.",
    "resourceIds": [
      "SIM02",
      "SIM03",
      "SIM04",
      "ROS07"
    ],
    "evidenceRequirement": "Demo capture and five-result test table",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S053",
    "milestoneId": "M5",
    "sequence": 53,
    "mode": "Learn",
    "topic": "Encoder odometry",
    "microLesson": "Review wheel ticks, distance, velocity and quantisation.",
    "buildOrTest": "Convert synthetic ticks to wheel motion and rover pose.",
    "retrievalAndClose": "Check straight and in-place rotation cases.",
    "resourceIds": [
      "ROBT01"
    ],
    "evidenceRequirement": "Tick-to-pose worksheet",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S054",
    "milestoneId": "M5",
    "sequence": 54,
    "mode": "Learn",
    "topic": "IMU frames and noise",
    "microLesson": "Review accelerometer, gyro, orientation, bias and gravity.",
    "buildOrTest": "Plot a synthetic stationary IMU with bias and noise.",
    "retrievalAndClose": "Identify which terms integrate into drift.",
    "resourceIds": [
      "ROBT01",
      "VIS02"
    ],
    "evidenceRequirement": "Labelled IMU plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S055",
    "milestoneId": "M5",
    "sequence": 55,
    "mode": "Learn",
    "topic": "Uncertainty and covariance",
    "microLesson": "Read covariance as spread and correlation, not a formula list.",
    "buildOrTest": "Create two 2D covariance ellipses and compare confidence.",
    "retrievalAndClose": "Explain what larger diagonal values mean.",
    "resourceIds": [
      "MATH03"
    ],
    "evidenceRequirement": "Covariance sketch or plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S056",
    "milestoneId": "M5",
    "sequence": 56,
    "mode": "Learn",
    "topic": "Kalman intuition",
    "microLesson": "Use a short predict-measure-update explanation.",
    "buildOrTest": "Manually combine one prior and one noisy measurement.",
    "retrievalAndClose": "Explain why uncertainty changes.",
    "resourceIds": [
      "LOC01"
    ],
    "evidenceRequirement": "One worked scalar update",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S057",
    "milestoneId": "M5",
    "sequence": 57,
    "mode": "Build",
    "topic": "Extended Kalman Filter cycle",
    "microLesson": "Review nonlinear state transition and measurement functions.",
    "buildOrTest": "Write pseudocode for predict, innovation, gain and update.",
    "retrievalAndClose": "Name state, control and measurement vectors.",
    "resourceIds": [
      "LOC01"
    ],
    "evidenceRequirement": "Checked EKF pseudocode",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S058",
    "milestoneId": "M5",
    "sequence": 58,
    "mode": "Build",
    "topic": "robot_localization configuration",
    "microLesson": "Read the Nav2 odometry smoothing guide.",
    "buildOrTest": "Fuse wheel odometry and IMU in simulation with explicit frames and covariances.",
    "retrievalAndClose": "Explain every enabled configuration variable.",
    "resourceIds": [
      "LOC01"
    ],
    "evidenceRequirement": "EKF config and before/after plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S059",
    "milestoneId": "M5",
    "sequence": 59,
    "mode": "Learn",
    "topic": "LiDAR and scan quality",
    "microLesson": "Review range, field of view, angle increment and invalid returns.",
    "buildOrTest": "Inspect a LaserScan and remove an invalid/outlier case.",
    "retrievalAndClose": "Explain scan frame and timestamp.",
    "resourceIds": [
      "NAV03"
    ],
    "evidenceRequirement": "Scan statistics and filtered output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S060",
    "milestoneId": "M5",
    "sequence": 60,
    "mode": "Learn",
    "topic": "Occupancy grids",
    "microLesson": "Review log-odds idea and occupied/free/unknown cells.",
    "buildOrTest": "Hand-update a small grid for one beam, then compare to mapping output.",
    "retrievalAndClose": "Explain resolution trade-off.",
    "resourceIds": [
      "NAV03"
    ],
    "evidenceRequirement": "Worked grid and map image",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S061",
    "milestoneId": "M5",
    "sequence": 61,
    "mode": "Build",
    "topic": "SLAM Toolbox",
    "microLesson": "Read the slam_toolbox getting-started and configuration overview.",
    "buildOrTest": "Map a small world with repeatable driving and save the map.",
    "retrievalAndClose": "Identify one loop closure.",
    "resourceIds": [
      "LOC05"
    ],
    "evidenceRequirement": "Saved map and route notes",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S062",
    "milestoneId": "M5",
    "sequence": 62,
    "mode": "Learn",
    "topic": "AMCL localisation",
    "microLesson": "Read the AMCL parameter overview.",
    "buildOrTest": "Localise in the saved map and test one kidnapped-position recovery.",
    "retrievalAndClose": "Explain particles, motion and sensor models.",
    "resourceIds": [
      "LOC06"
    ],
    "evidenceRequirement": "Recovery evidence",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S063",
    "milestoneId": "M5",
    "sequence": 63,
    "mode": "Learn",
    "topic": "Planning and costmaps",
    "microLesson": "Read Nav2 concepts on global/local planning and costmaps.",
    "buildOrTest": "Change inflation radius and compare two paths.",
    "retrievalAndClose": "Explain lethal, inflated and free space.",
    "resourceIds": [
      "NAV02"
    ],
    "evidenceRequirement": "Path comparison image",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S064",
    "milestoneId": "M5",
    "sequence": 64,
    "mode": "Build",
    "topic": "Nav2 behaviour and control",
    "microLesson": "Read the getting-started navigation flow.",
    "buildOrTest": "Send waypoints and inspect planner, controller and behaviour activity.",
    "retrievalAndClose": "Explain one recovery sequence.",
    "resourceIds": [
      "NAV01",
      "NAV02"
    ],
    "evidenceRequirement": "Waypoint mission log",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S065",
    "milestoneId": "M5",
    "sequence": 65,
    "mode": "Test",
    "topic": "Tuning and failure recovery",
    "microLesson": "Read first-time robot setup checklists relevant to your model.",
    "buildOrTest": "Inject blocked path, stale sensor and localisation error cases.",
    "retrievalAndClose": "State safe response and recovery criteria.",
    "resourceIds": [
      "NAV03"
    ],
    "evidenceRequirement": "Three fault-test results",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S066",
    "milestoneId": "M5",
    "sequence": 66,
    "mode": "Proof",
    "topic": "Autonomous mission benchmark",
    "microLesson": "Use the same fixed map and waypoints for every run.",
    "buildOrTest": "Run five missions and record success, time, path length and final pose error.",
    "retrievalAndClose": "Explain variance and worst failure.",
    "resourceIds": [
      "NAV01",
      "VIS01",
      "VIS02"
    ],
    "evidenceRequirement": "Five-run benchmark table and plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S067",
    "milestoneId": "M6",
    "sequence": 67,
    "mode": "Learn",
    "topic": "MCU, GPIO, timers and interrupts",
    "microLesson": "Review MCU execution, digital I/O, timer and interrupt concepts.",
    "buildOrTest": "Write pseudocode for periodic encoder sampling without blocking.",
    "retrievalAndClose": "Explain polling versus interrupt.",
    "resourceIds": [
      "EMB01",
      "EMB02"
    ],
    "evidenceRequirement": "Timing diagram and pseudocode",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S068",
    "milestoneId": "M6",
    "sequence": 68,
    "mode": "Build",
    "topic": "Toolchain and first firmware",
    "microLesson": "Use either ESP-IDF or STM32CubeIDE official quick start, not both.",
    "buildOrTest": "Build, flash and observe a minimal timed output.",
    "retrievalAndClose": "State compiler, target and debug path.",
    "resourceIds": [
      "EMB01",
      "EMB02"
    ],
    "evidenceRequirement": "Build and serial/debug output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S069",
    "milestoneId": "M6",
    "sequence": 69,
    "mode": "Learn",
    "topic": "ADC, PWM and encoder capture",
    "microLesson": "Read peripheral summaries for your chosen MCU.",
    "buildOrTest": "Model input scaling, PWM duty and counter wrap in a host-side test.",
    "retrievalAndClose": "Check ranges and resolution.",
    "resourceIds": [
      "EMB01",
      "EMB02"
    ],
    "evidenceRequirement": "Verified conversion functions",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S070",
    "milestoneId": "M6",
    "sequence": 70,
    "mode": "Learn",
    "topic": "UART, I2C, SPI and CAN",
    "microLesson": "Compare topology, timing, distance and error handling.",
    "buildOrTest": "Choose an interface for IMU, encoder node and host link with reasons.",
    "retrievalAndClose": "Recreate the comparison from memory.",
    "resourceIds": [
      "EMB01"
    ],
    "evidenceRequirement": "Interface decision table",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S071",
    "milestoneId": "M6",
    "sequence": 71,
    "mode": "Learn",
    "topic": "FreeRTOS tasks and scheduling",
    "microLesson": "Read task states, priority, delay and tick sections.",
    "buildOrTest": "Draw a task schedule for sensing, control and communications.",
    "retrievalAndClose": "Identify one starvation risk.",
    "resourceIds": [
      "EMB03"
    ],
    "evidenceRequirement": "Task timeline",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S072",
    "milestoneId": "M6",
    "sequence": 72,
    "mode": "Build",
    "topic": "Queues, mutexes and ISR handoff",
    "microLesson": "Read queue and mutex sections.",
    "buildOrTest": "Design ISR-to-control data flow using a queue and bounded critical section.",
    "retrievalAndClose": "Explain why a mutex is not a message queue.",
    "resourceIds": [
      "EMB04"
    ],
    "evidenceRequirement": "Concurrency diagram",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S073",
    "milestoneId": "M6",
    "sequence": 73,
    "mode": "Learn",
    "topic": "Power and motor driver boundary",
    "microLesson": "Review motor, H-bridge, supply, logic, protection and grounding roles.",
    "buildOrTest": "Draw the power and signal path with fuse, emergency stop and common reference.",
    "retrievalAndClose": "Identify back-EMF and brownout risks.",
    "resourceIds": [
      "ELEC01"
    ],
    "evidenceRequirement": "Power/signal block diagram",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S074",
    "milestoneId": "M6",
    "sequence": 74,
    "mode": "Build",
    "topic": "Motor sizing and gearing",
    "microLesson": "Review torque, speed, power, efficiency and wheel-force equations.",
    "buildOrTest": "Calculate one wheel torque and gear ratio from explicit assumptions.",
    "retrievalAndClose": "Check units and a 2x margin scenario.",
    "resourceIds": [
      "MATH02",
      "CTRL01"
    ],
    "evidenceRequirement": "Worked sizing calculation",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S075",
    "milestoneId": "M6",
    "sequence": 75,
    "mode": "Build",
    "topic": "Embedded speed PID",
    "microLesson": "Review discrete PID, sample time, saturation and encoder feedback.",
    "buildOrTest": "Simulate fixed-rate speed control and tune one stable response.",
    "retrievalAndClose": "Explain chosen sample rate.",
    "resourceIds": [
      "CTRL01",
      "CTRL03"
    ],
    "evidenceRequirement": "Response plot and parameters",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S076",
    "milestoneId": "M6",
    "sequence": 76,
    "mode": "Build",
    "topic": "Host-to-MCU bridge",
    "microLesson": "Read the micro-ROS first application or define a simple framed serial protocol.",
    "buildOrTest": "Implement heartbeat, command timeout and telemetry in simulation or hardware.",
    "retrievalAndClose": "Explain loss-of-link behaviour.",
    "resourceIds": [
      "EMB05"
    ],
    "evidenceRequirement": "Protocol/interface specification",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S077",
    "milestoneId": "M6",
    "sequence": 77,
    "mode": "Build",
    "topic": "Schematic and BOM",
    "microLesson": "Complete the KiCad getting-started schematic sections.",
    "buildOrTest": "Draw MCU, motor driver, encoder, power and connectors with named nets.",
    "retrievalAndClose": "Run electrical rules and review every warning.",
    "resourceIds": [
      "ELEC01"
    ],
    "evidenceRequirement": "ERC result and BOM",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S078",
    "milestoneId": "M6",
    "sequence": 78,
    "mode": "Proof",
    "topic": "Motor node HIL demonstration",
    "microLesson": "Use a simulated plant if physical hardware is unavailable.",
    "buildOrTest": "Run command tracking, timeout, saturation, sensor fault and restart tests.",
    "retrievalAndClose": "Report timing and the worst failure.",
    "resourceIds": [
      "EMB03",
      "EMB04",
      "SIM04"
    ],
    "evidenceRequirement": "Five-result test report",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S079",
    "milestoneId": "M7",
    "sequence": 79,
    "mode": "Learn",
    "topic": "Image formation",
    "microLesson": "Review pixels, focal length, field of view, exposure and distortion.",
    "buildOrTest": "Sketch pinhole projection and list camera variables affecting measurements.",
    "retrievalAndClose": "Explain pixel versus metre coordinates.",
    "resourceIds": [
      "CV01",
      "CV02"
    ],
    "evidenceRequirement": "Camera model sketch",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S080",
    "milestoneId": "M7",
    "sequence": 80,
    "mode": "Build",
    "topic": "OpenCV arrays and colour",
    "microLesson": "Read image read/write, NumPy access and colour conversion.",
    "buildOrTest": "Load an image, inspect shape and convert colour spaces.",
    "retrievalAndClose": "Predict shape and dtype.",
    "resourceIds": [
      "CV01",
      "SW02"
    ],
    "evidenceRequirement": "Script and image outputs",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S081",
    "milestoneId": "M7",
    "sequence": 81,
    "mode": "Build",
    "topic": "Filtering, edges and contours",
    "microLesson": "Read one section each on smoothing, thresholding and contours.",
    "buildOrTest": "Detect a simple target under two lighting conditions.",
    "retrievalAndClose": "Explain one false positive.",
    "resourceIds": [
      "CV01"
    ],
    "evidenceRequirement": "Side-by-side detection result",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S082",
    "milestoneId": "M7",
    "sequence": 82,
    "mode": "Build",
    "topic": "Camera calibration",
    "microLesson": "Read the OpenCV calibration workflow.",
    "buildOrTest": "Calibrate from a supplied or self-captured checkerboard set.",
    "retrievalAndClose": "Report reprojection error and limitations.",
    "resourceIds": [
      "CV02"
    ],
    "evidenceRequirement": "Calibration file and error",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S083",
    "milestoneId": "M7",
    "sequence": 83,
    "mode": "Learn",
    "topic": "Pose from visual features",
    "microLesson": "Review correspondences, PnP and fiducial-marker purpose.",
    "buildOrTest": "Estimate or simulate target pose and transform it into robot frame.",
    "retrievalAndClose": "Trace every frame in the calculation.",
    "resourceIds": [
      "CV02",
      "ROS07"
    ],
    "evidenceRequirement": "Pose pipeline sketch and output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S084",
    "milestoneId": "M7",
    "sequence": 84,
    "mode": "Learn",
    "topic": "ML problem and data split",
    "microLesson": "Complete MLCC framing and dataset/generalisation modules in slices.",
    "buildOrTest": "Define input, label, metric and train/validation/test split for inspection.",
    "retrievalAndClose": "Explain leakage with one example.",
    "resourceIds": [
      "ML01"
    ],
    "evidenceRequirement": "Data card outline",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S085",
    "milestoneId": "M7",
    "sequence": 85,
    "mode": "Learn",
    "topic": "Regression and classification",
    "microLesson": "Complete only the matching MLCC core modules.",
    "buildOrTest": "Calculate confusion-matrix metrics for a small example.",
    "retrievalAndClose": "Choose precision or recall priority and justify it.",
    "resourceIds": [
      "ML01"
    ],
    "evidenceRequirement": "Checked metric calculation",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S086",
    "milestoneId": "M7",
    "sequence": 86,
    "mode": "Build",
    "topic": "PyTorch quickstart",
    "microLesson": "Run the official quickstart in small sections.",
    "buildOrTest": "Load data, define model, train briefly and save/load weights.",
    "retrievalAndClose": "Explain tensor, batch, loss and optimiser.",
    "resourceIds": [
      "ML02"
    ],
    "evidenceRequirement": "Reproducible training output",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S087",
    "milestoneId": "M7",
    "sequence": 87,
    "mode": "Build",
    "topic": "CNN transfer learning",
    "microLesson": "Read the transfer-learning overview and code path.",
    "buildOrTest": "Fine-tune or simulate a small two-class vision task.",
    "retrievalAndClose": "Compare train and validation behaviour.",
    "resourceIds": [
      "ML03"
    ],
    "evidenceRequirement": "Learning curves and model file",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S088",
    "milestoneId": "M7",
    "sequence": 88,
    "mode": "Build",
    "topic": "YOLO inference",
    "microLesson": "Use the Ultralytics quickstart for local inference only.",
    "buildOrTest": "Run detection on a short sample and export timestamped results.",
    "retrievalAndClose": "Explain confidence threshold and NMS.",
    "resourceIds": [
      "ML04"
    ],
    "evidenceRequirement": "Annotated frames and latency",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S089",
    "milestoneId": "M7",
    "sequence": 89,
    "mode": "Build",
    "topic": "ROS image pipeline",
    "microLesson": "Review image topics, timestamps and frame IDs.",
    "buildOrTest": "Publish detections with image timestamp and transformable pose metadata.",
    "retrievalAndClose": "Explain synchronisation risk.",
    "resourceIds": [
      "ROS05",
      "ROS07",
      "CV01"
    ],
    "evidenceRequirement": "Working perception node graph",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S090",
    "milestoneId": "M7",
    "sequence": 90,
    "mode": "Proof",
    "topic": "Perception mission benchmark",
    "microLesson": "Fix the dataset and evaluation script before comparing settings.",
    "buildOrTest": "Report precision, recall, latency and at least five failure examples.",
    "retrievalAndClose": "State where the model should not be trusted.",
    "resourceIds": [
      "ML01",
      "ML03",
      "ML04"
    ],
    "evidenceRequirement": "Metric table, failure gallery and demo",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S091",
    "milestoneId": "M8",
    "sequence": 91,
    "mode": "Learn",
    "topic": "Requirements and verification",
    "microLesson": "Read the NASA handbook sections on requirements and verification only.",
    "buildOrTest": "Rewrite five vague rover goals as measurable shall statements.",
    "retrievalAndClose": "Map each statement to one test.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Requirements-to-test rows",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S092",
    "milestoneId": "M8",
    "sequence": 92,
    "mode": "Build",
    "topic": "Architecture and interfaces",
    "microLesson": "Review component, interface and data-flow views.",
    "buildOrTest": "Create one system context diagram and one interface table.",
    "retrievalAndClose": "Trace one command and one measurement end to end.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Architecture diagram and ICD",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S093",
    "milestoneId": "M8",
    "sequence": 93,
    "mode": "Learn",
    "topic": "Failure analysis",
    "microLesson": "Review severity, likelihood, detection and mitigation.",
    "buildOrTest": "Create a small FMEA for sensor, motor, power and communications faults.",
    "retrievalAndClose": "Name the highest residual risk.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Prioritised FMEA-lite table",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S094",
    "milestoneId": "M8",
    "sequence": 94,
    "mode": "Build",
    "topic": "Logging and diagnostics",
    "microLesson": "Review ROS diagnostics plus Foxglove or PlotJuggler basics.",
    "buildOrTest": "Add timestamps, levels, health values and one useful dashboard layout.",
    "retrievalAndClose": "Explain how to distinguish cause from symptom.",
    "resourceIds": [
      "VIS01",
      "VIS02"
    ],
    "evidenceRequirement": "Diagnostic capture",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S095",
    "milestoneId": "M8",
    "sequence": 95,
    "mode": "Test",
    "topic": "Test pyramid",
    "microLesson": "Review unit, component, integration, HIL and mission test boundaries.",
    "buildOrTest": "Classify existing tests and add the most important missing layer.",
    "retrievalAndClose": "Explain why end-to-end tests alone are insufficient.",
    "resourceIds": [
      "SW04",
      "SW08",
      "TEST01"
    ],
    "evidenceRequirement": "Test inventory and new test",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S096",
    "milestoneId": "M8",
    "sequence": 96,
    "mode": "Build",
    "topic": "Continuous integration",
    "microLesson": "Read the relevant GitHub Actions build-and-test tutorial.",
    "buildOrTest": "Run Python/C++ or ROS tests on every change in a clean environment.",
    "retrievalAndClose": "Explain cache versus reproducibility trade-off.",
    "resourceIds": [
      "TEST02",
      "TEST03"
    ],
    "evidenceRequirement": "Passing CI run",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S097",
    "milestoneId": "M8",
    "sequence": 97,
    "mode": "Build",
    "topic": "Reproducible environment",
    "microLesson": "Read the Development Containers overview only.",
    "buildOrTest": "Document exact OS, ROS/Gazebo pairing and dependencies; optionally add a dev container.",
    "retrievalAndClose": "Explain which version is source of truth.",
    "resourceIds": [
      "DEV01",
      "ROS01",
      "SIM01"
    ],
    "evidenceRequirement": "Environment manifest or dev-container run",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S098",
    "milestoneId": "M8",
    "sequence": 98,
    "mode": "Test",
    "topic": "Latency and performance",
    "microLesson": "Review timestamps, rate, jitter, CPU and memory measures.",
    "buildOrTest": "Measure one sensing-to-command latency path and find the largest contributor.",
    "retrievalAndClose": "Check clock basis and sample count.",
    "resourceIds": [
      "VIS01",
      "VIS02"
    ],
    "evidenceRequirement": "Latency table and plot",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S099",
    "milestoneId": "M8",
    "sequence": 99,
    "mode": "Test",
    "topic": "Safe states and recovery",
    "microLesson": "Review command timeout, watchdog, stop and restart criteria.",
    "buildOrTest": "Inject stale command, lost sensor and node crash cases.",
    "retrievalAndClose": "State which failures require human intervention.",
    "resourceIds": [
      "SYSENG01",
      "SIM04"
    ],
    "evidenceRequirement": "Fault-injection results",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S100",
    "milestoneId": "M8",
    "sequence": 100,
    "mode": "Proof",
    "topic": "Full regression mission",
    "microLesson": "Freeze requirements and test versions.",
    "buildOrTest": "Run clean build, unit, integration, fault and five-run mission tests.",
    "retrievalAndClose": "Summarise passes, failures and residual risk.",
    "resourceIds": [
      "TEST01",
      "TEST02",
      "TEST03",
      "SYSENG01"
    ],
    "evidenceRequirement": "Signed-off regression report",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S101",
    "milestoneId": "M9",
    "sequence": 101,
    "mode": "Define",
    "topic": "Capstone user problem",
    "microLesson": "Review Project options and choose one narrow user outcome.",
    "buildOrTest": "Write context, user, pain, operating environment and non-goals.",
    "retrievalAndClose": "Explain why the problem matters without naming tools.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "One-page problem definition",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S102",
    "milestoneId": "M9",
    "sequence": 102,
    "mode": "Design",
    "topic": "Trade study",
    "microLesson": "Review three feasible architectures.",
    "buildOrTest": "Compare options using weighted criteria for evidence, cost, risk and time.",
    "retrievalAndClose": "Defend the selected option and one rejected option.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Weighted trade-study table",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S103",
    "milestoneId": "M9",
    "sequence": 103,
    "mode": "Plan",
    "topic": "Backlog, risks and interfaces",
    "microLesson": "Review remaining gaps from Diagnostics and Weekly Review.",
    "buildOrTest": "Create a minimal build order with acceptance gate for each increment.",
    "retrievalAndClose": "Identify the critical path.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Prioritised backlog and risk list",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S104",
    "milestoneId": "M9",
    "sequence": 104,
    "mode": "Review",
    "topic": "Design review",
    "microLesson": "Use requirements, architecture, interfaces and test plan only.",
    "buildOrTest": "Run a self-review for missing units, frames, rates, faults and dependencies.",
    "retrievalAndClose": "Answer five adversarial reviewer questions.",
    "resourceIds": [
      "SYSENG01"
    ],
    "evidenceRequirement": "Design-review checklist",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S105",
    "milestoneId": "M9",
    "sequence": 105,
    "mode": "Build",
    "topic": "Integrated capstone",
    "microLesson": "Use existing modules instead of new tutorials.",
    "buildOrTest": "Integrate the smallest vertical slice that senses, decides and acts.",
    "retrievalAndClose": "Explain data and control flow.",
    "resourceIds": [
      "ROS02",
      "SIM04",
      "NAV01"
    ],
    "evidenceRequirement": "Working vertical slice",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S106",
    "milestoneId": "M9",
    "sequence": 106,
    "mode": "Verify",
    "topic": "Benchmark and evidence",
    "microLesson": "Freeze test scenario, seeds and metrics.",
    "buildOrTest": "Run repeated trials and capture raw data, plots and failures.",
    "retrievalAndClose": "Explain confidence and sample limitations.",
    "resourceIds": [
      "VIS01",
      "VIS02"
    ],
    "evidenceRequirement": "Benchmark dataset and report",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S107",
    "milestoneId": "M9",
    "sequence": 107,
    "mode": "Document",
    "topic": "README and reproducibility",
    "microLesson": "Read GitHub README guidance.",
    "buildOrTest": "Write problem, architecture, setup, run, tests, results, limitations and roadmap.",
    "retrievalAndClose": "Ask whether a stranger can reproduce it.",
    "resourceIds": [
      "PORT01"
    ],
    "evidenceRequirement": "Complete repository README",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S108",
    "milestoneId": "M9",
    "sequence": 108,
    "mode": "Communicate",
    "topic": "90-second demo",
    "microLesson": "Write a five-line story: problem, design, proof, failure, next step.",
    "buildOrTest": "Record one concise demo with captions and visible metrics.",
    "retrievalAndClose": "Deliver it once without notes.",
    "resourceIds": [
      "PORT01"
    ],
    "evidenceRequirement": "Captioned 90-second demo",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S109",
    "milestoneId": "M9",
    "sequence": 109,
    "mode": "Interview",
    "topic": "Engineering stories",
    "microLesson": "Select one design decision, one failure and one verification result.",
    "buildOrTest": "Write concise situation-action-evidence-learning stories.",
    "retrievalAndClose": "Answer why, trade-off and what changed.",
    "resourceIds": [
      "PORT01",
      "SYSENG01"
    ],
    "evidenceRequirement": "Three interview stories",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  },
  {
    "id": "S110",
    "milestoneId": "M9",
    "sequence": 110,
    "mode": "Release",
    "topic": "Reproducible portfolio release",
    "microLesson": "Run the release checklist, not new learning.",
    "buildOrTest": "Re-run clean setup and all material tests, tag the evidence locally, and write retrospective.",
    "retrievalAndClose": "State residual risks honestly.",
    "resourceIds": [
      "PORT01",
      "TEST02",
      "TEST03"
    ],
    "evidenceRequirement": "Reproducible final package and retrospective",
    "defaultStatus": "Not started",
    "confidence": null,
    "plannedMinutes": 25,
    "notes": null
  }
];

export const rebootResources: RebootResource[] = [
  {
    "id": "L01",
    "track": "Learning system",
    "name": "Spaced Practice",
    "provider": "The Learning Scientists",
    "type": "Guide",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use the poster and one example; spread practice across days.",
    "originalUrl": "https://www.learningscientists.org/spaced-practice",
    "authority": "Research translation",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "L02",
    "track": "Learning system",
    "name": "Spacing and Retrieval Practice",
    "provider": "The Learning Scientists",
    "type": "Podcast/page",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use the summary and retrieval prompt; do not binge the full archive.",
    "originalUrl": "https://www.learningscientists.org/learning-scientists-podcast/2018/3/7/episode-14-how-students-can-use-spacing-and-retrieval-practice",
    "authority": "Research translation",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SYS01",
    "track": "Computing",
    "name": "Linux command line for beginners",
    "provider": "Ubuntu",
    "type": "Interactive tutorial",
    "suggestedSliceMinutes": 25,
    "exactUse": "Split into two sessions; type every command and stop at the timer.",
    "originalUrl": "https://ubuntu.com/tutorials/command-line-for-beginners",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SYS02",
    "track": "Computing",
    "name": "Git Learn short videos",
    "provider": "Git",
    "type": "Short videos",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use only the four beginner videos, each 4-8 minutes.",
    "originalUrl": "https://git-scm.com/learn",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SYS03",
    "track": "Computing",
    "name": "Pro Git - Git Basics",
    "provider": "Git",
    "type": "Book chapter",
    "suggestedSliceMinutes": 15,
    "exactUse": "Read only the section needed for the current Git action.",
    "originalUrl": "https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW01",
    "track": "Python",
    "name": "The Python Tutorial",
    "provider": "Python Software Foundation",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Read one subsection, then close it and code from memory.",
    "originalUrl": "https://docs.python.org/3/tutorial/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW02",
    "track": "Python",
    "name": "NumPy quickstart",
    "provider": "NumPy",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use array creation, shape, indexing and broadcasting only at first.",
    "originalUrl": "https://numpy.org/doc/stable/user/quickstart.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW03",
    "track": "Python",
    "name": "Pyplot tutorial",
    "provider": "Matplotlib",
    "type": "Documentation",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use first plotting examples and always add labels and SI units.",
    "originalUrl": "https://matplotlib.org/stable/tutorials/pyplot.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW04",
    "track": "Testing",
    "name": "pytest Get Started",
    "provider": "pytest",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Run the first test, exception test and one fixture only.",
    "originalUrl": "https://docs.pytest.org/en/stable/getting-started.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW05",
    "track": "C++",
    "name": "Learn C++",
    "provider": "LearnCpp",
    "type": "Tutorial",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use one numbered lesson per block and type the example yourself.",
    "originalUrl": "https://www.learncpp.com/",
    "authority": "High-quality community",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW06",
    "track": "C++",
    "name": "C++ language reference",
    "provider": "cppreference",
    "type": "Reference",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use for lookup after attempting the task; do not read linearly.",
    "originalUrl": "https://en.cppreference.com/cpp/language",
    "authority": "Community reference",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW07",
    "track": "Build systems",
    "name": "CMake Tutorial",
    "provider": "Kitware",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Complete Step 1, then only the step needed by your project.",
    "originalUrl": "https://cmake.org/cmake/help/latest/guide/tutorial/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SW08",
    "track": "Testing",
    "name": "GoogleTest Primer",
    "provider": "GoogleTest",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Read assertions and test organisation, then write three tests.",
    "originalUrl": "https://google.github.io/googletest/primer.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "MATH01",
    "track": "Maths",
    "name": "Essence of Linear Algebra",
    "provider": "3Blue1Brown",
    "type": "Visual lessons",
    "suggestedSliceMinutes": 15,
    "exactUse": "One short lesson, one hand-drawn example, one retrieval question.",
    "originalUrl": "https://www.3blue1brown.com/topics/linear-algebra",
    "authority": "Expert educational",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "MATH02",
    "track": "Maths",
    "name": "Essence of Calculus",
    "provider": "3Blue1Brown",
    "type": "Visual lessons",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use only derivative, integral and differential-equation intuition needed now.",
    "originalUrl": "https://www.3blue1brown.com/topics/calculus",
    "authority": "Expert educational",
    "linkCheckResult": "Official site",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "MATH03",
    "track": "State estimation",
    "name": "Covariance ellipse explanation",
    "provider": "KalmanFilter.net",
    "type": "Visual guide",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use only covariance and uncertainty intuition before equations.",
    "originalUrl": "https://www.kalmanfilter.net/background.html",
    "authority": "Specialist educational",
    "linkCheckResult": "Official site",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROBT01",
    "track": "Robotics theory",
    "name": "Modern Robotics video supplements",
    "provider": "Northwestern University",
    "type": "Short videos and text",
    "suggestedSliceMinutes": 15,
    "exactUse": "Watch one 3-10 minute video and work one small example.",
    "originalUrl": "https://modernrobotics.northwestern.edu/nu-gm-book-resource/",
    "authority": "University",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CTRL01",
    "track": "Controls",
    "name": "Control Tutorials for MATLAB and Simulink",
    "provider": "University of Michigan",
    "type": "Tutorials",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use one modelling or PID section and reproduce the plot.",
    "originalUrl": "https://ctms.engin.umich.edu/CTMS/index.php?aux=Index_Tutorials",
    "authority": "University",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CTRL02",
    "track": "Controls",
    "name": "Control Tutorials courseware",
    "provider": "MathWorks",
    "type": "Courseware",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use the matching module only; avoid completing the whole course linearly.",
    "originalUrl": "https://www.mathworks.com/academia/courseware/control-tutorials.html",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CTRL03",
    "track": "Controls",
    "name": "PID Controller anti-windup examples",
    "provider": "MathWorks",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Read saturation and anti-windup section, then reproduce a small case.",
    "originalUrl": "https://www.mathworks.com/help/simulink/slref/pidcontroller.html",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS01",
    "track": "ROS 2",
    "name": "ROS 2 Jazzy Ubuntu packages",
    "provider": "Open Robotics",
    "type": "Installation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Reference only after confirming the device and rollback; no install was performed.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html",
    "authority": "Official",
    "linkCheckResult": "Search verified; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS02",
    "track": "ROS 2",
    "name": "ROS 2 Jazzy Tutorials",
    "provider": "Open Robotics",
    "type": "Tutorial index",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use one tutorial section per block and reproduce it without copying.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials.html",
    "authority": "Official",
    "linkCheckResult": "Search verified; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS03",
    "track": "ROS 2",
    "name": "ROS 2 Concepts",
    "provider": "Open Robotics",
    "type": "Concept index",
    "suggestedSliceMinutes": 10,
    "exactUse": "Read only the concept currently being built.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Concepts.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS04",
    "track": "ROS 2",
    "name": "Beginner CLI Tools",
    "provider": "Open Robotics",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Run each inspection command against a live demo.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS05",
    "track": "ROS 2",
    "name": "Beginner Client Libraries",
    "provider": "Open Robotics",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Choose Python or C++ per block; compare only after each works.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Beginner-Client-Libraries.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS06",
    "track": "ROS 2",
    "name": "colcon Quick Start",
    "provider": "colcon",
    "type": "Documentation",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use list, graph, build, test and test-result commands.",
    "originalUrl": "https://colcon.readthedocs.io/en/released/user/quick-start.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS07",
    "track": "ROS 2",
    "name": "tf2 Tutorials",
    "provider": "Open Robotics",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Draw the frame tree before running broadcasters/listeners.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Intermediate/Tf2/Tf2-Main.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS08",
    "track": "ROS 2",
    "name": "URDF Tutorials",
    "provider": "Open Robotics",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Add one structural feature per block and validate immediately.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Intermediate/URDF/URDF-Main.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS09",
    "track": "ROS 2",
    "name": "Quality of Service settings",
    "provider": "Open Robotics",
    "type": "Concept guide",
    "suggestedSliceMinutes": 15,
    "exactUse": "Focus on reliability, durability, history and compatibility.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ROS10",
    "track": "ROS 2",
    "name": "Recording and playing back data",
    "provider": "Open Robotics",
    "type": "Tutorial",
    "suggestedSliceMinutes": 15,
    "exactUse": "Record a short controlled run and reproduce one result from replay.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools/Recording-And-Playing-Back-Data/Recording-And-Playing-Back-Data.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SIM01",
    "track": "Simulation",
    "name": "Installing Gazebo with ROS",
    "provider": "Open Robotics",
    "type": "Compatibility guide",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use the supported pairing table; avoid non-default pairings as a beginner.",
    "originalUrl": "https://gazebosim.org/docs/latest/ros_installation/",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SIM02",
    "track": "Simulation",
    "name": "Gazebo Getting Started",
    "provider": "Open Robotics",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "One world/model/physics task per block.",
    "originalUrl": "https://gazebosim.org/docs/latest/getstarted/",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SIM03",
    "track": "Simulation",
    "name": "ROS 2 and Gazebo integration",
    "provider": "Open Robotics",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Bridge only the messages required by the current robot.",
    "originalUrl": "https://gazebosim.org/docs/latest/ros2_integration/",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SIM04",
    "track": "Robot control",
    "name": "ros2_control Getting Started",
    "provider": "ROS Controls",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Read architecture first, then configure one controller.",
    "originalUrl": "https://control.ros.org/jazzy/doc/getting_started/getting_started.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "LOC01",
    "track": "State estimation",
    "name": "Smoothing odometry with robot_localization",
    "provider": "Nav2",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Trace frames, topics and covariance before copying configuration.",
    "originalUrl": "https://docs.nav2.org/setup_guides/odom/setup_robot_localization.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "LOC05",
    "track": "SLAM",
    "name": "slam_toolbox",
    "provider": "Open Navigation",
    "type": "Repository/docs",
    "suggestedSliceMinutes": 20,
    "exactUse": "Read README setup and parameters relevant to synchronous mapping.",
    "originalUrl": "https://github.com/SteveMacenski/slam_toolbox",
    "authority": "Official project",
    "linkCheckResult": "Official repository",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "LOC06",
    "track": "Localisation",
    "name": "AMCL configuration",
    "provider": "Nav2",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use parameter purpose and change one parameter at a time.",
    "originalUrl": "https://docs.nav2.org/configuration/packages/configuring-amcl.html",
    "authority": "Official",
    "linkCheckResult": "Official site",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "NAV01",
    "track": "Navigation",
    "name": "Nav2 Getting Started",
    "provider": "Nav2",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Run the minimal example, then reproduce it on Robot Zero.",
    "originalUrl": "https://docs.nav2.org/getting_started/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "NAV02",
    "track": "Navigation",
    "name": "Nav2 Navigation Concepts",
    "provider": "Nav2",
    "type": "Concept guide",
    "suggestedSliceMinutes": 15,
    "exactUse": "Read the concept matching the component you are tuning.",
    "originalUrl": "https://docs.nav2.org/concepts/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "NAV03",
    "track": "Navigation",
    "name": "First-Time Robot Setup Guide",
    "provider": "Nav2",
    "type": "Checklist/tutorials",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use as a checklist for TF, sensors, odometry, footprint and plugins.",
    "originalUrl": "https://docs.nav2.org/setup_guides/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "EMB01",
    "track": "Embedded",
    "name": "ESP-IDF Get Started",
    "provider": "Espressif",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Choose ESP32 lane only; build one official example before custom code.",
    "originalUrl": "https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "EMB02",
    "track": "Embedded",
    "name": "Introduction to STM32CubeIDE",
    "provider": "STMicroelectronics",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Choose STM32 lane only; start with an empty project and debugger.",
    "originalUrl": "https://wiki.st.com/stm32mcu/wiki/STM32CubeIDE%3AIntroduction_to_STM32CubeIDE",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "EMB03",
    "track": "Embedded",
    "name": "FreeRTOS tasks",
    "provider": "FreeRTOS",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Focus on states, priorities, delay and scheduling.",
    "originalUrl": "https://freertos.org/Documentation/02-Kernel/02-Kernel-features/01-Tasks-and-co-routines/01-Tasks",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "EMB04",
    "track": "Embedded",
    "name": "FreeRTOS queues, mutexes and semaphores",
    "provider": "FreeRTOS",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use queues for data flow and justify every shared resource.",
    "originalUrl": "https://freertos.org/Documentation/02-Kernel/02-Kernel-features/02-Queues-mutexes-and-semaphores/01-Queues",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "EMB05",
    "track": "Embedded",
    "name": "micro-ROS first application",
    "provider": "micro-ROS",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use only after ROS 2 and MCU basics; otherwise define a serial protocol.",
    "originalUrl": "https://micro.ros.org/docs/tutorials/core/first_application_linux/",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ELEC01",
    "track": "Electronics",
    "name": "Getting Started in KiCad",
    "provider": "KiCad",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Complete schematic first; run ERC and inspect every warning.",
    "originalUrl": "https://docs.kicad.org/8.0/en/getting_started_in_kicad/getting_started_in_kicad.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CAD01",
    "track": "CAD",
    "name": "Fusion Quick Start Guide",
    "provider": "Autodesk",
    "type": "Short course",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use sketch, constraints, component and assembly sections only.",
    "originalUrl": "https://www.autodesk.com/learn/ondemand/curated/fusion-quick-start-guide",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CV01",
    "track": "Computer vision",
    "name": "OpenCV-Python Tutorials",
    "provider": "OpenCV",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "One operation per block; inspect shape, dtype and units.",
    "originalUrl": "https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "CV02",
    "track": "Computer vision",
    "name": "OpenCV Camera Calibration",
    "provider": "OpenCV",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Follow acquisition, calibration, reprojection error and undistortion.",
    "originalUrl": "https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ML01",
    "track": "Machine learning",
    "name": "Machine Learning Crash Course",
    "provider": "Google",
    "type": "Interactive modules",
    "suggestedSliceMinutes": 20,
    "exactUse": "One self-contained module at a time; always complete its exercise.",
    "originalUrl": "https://developers.google.com/machine-learning/crash-course",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ML02",
    "track": "Machine learning",
    "name": "PyTorch Quickstart",
    "provider": "PyTorch",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Split data, model, optimisation and save/load across blocks.",
    "originalUrl": "https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ML03",
    "track": "Machine learning",
    "name": "Transfer Learning for Computer Vision",
    "provider": "PyTorch",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use a small dataset and record train/validation curves.",
    "originalUrl": "https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ML04",
    "track": "Machine learning",
    "name": "Ultralytics Quickstart",
    "provider": "Ultralytics",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use local inference first; train only after dataset and metrics are defined.",
    "originalUrl": "https://docs.ultralytics.com/quickstart/",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "TEST01",
    "track": "Testing",
    "name": "ROS 2 Testing Tutorials",
    "provider": "Open Robotics",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Add the narrowest package test before integration tests.",
    "originalUrl": "https://docs.ros.org/en/jazzy/Tutorials/Intermediate/Testing/Testing-Main.html",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "TEST02",
    "track": "CI",
    "name": "Building and testing Python",
    "provider": "GitHub",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use a minimal workflow that installs dependencies and runs tests.",
    "originalUrl": "https://docs.github.com/en/actions/tutorials/build-and-test-code/python",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "TEST03",
    "track": "CI",
    "name": "Building and testing C++",
    "provider": "GitHub",
    "type": "Documentation",
    "suggestedSliceMinutes": 20,
    "exactUse": "Use configure, build and test stages with a clean runner.",
    "originalUrl": "https://docs.github.com/en/actions/tutorials/build-and-test-code/building-and-testing-cpp",
    "authority": "Official",
    "linkCheckResult": "Official URL; direct fetch limited",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "SYSENG01",
    "track": "Systems engineering",
    "name": "NASA Systems Engineering Handbook",
    "provider": "NASA",
    "type": "Reference",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use only requirements, architecture, risk and verification sections needed now.",
    "originalUrl": "https://www.nasa.gov/reference/systems-engineering-handbook/",
    "authority": "Government primary",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "VIS01",
    "track": "Robot data",
    "name": "Foxglove ROS 2",
    "provider": "Foxglove",
    "type": "Documentation",
    "suggestedSliceMinutes": 15,
    "exactUse": "Use for graph/data inspection and one repeatable layout.",
    "originalUrl": "https://docs.foxglove.dev/docs/getting-started/frameworks/ros2",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "VIS02",
    "track": "Robot data",
    "name": "PlotJuggler",
    "provider": "PlotJuggler",
    "type": "Repository/docs",
    "suggestedSliceMinutes": 15,
    "exactUse": "Plot timestamps, rates, latency and controller response.",
    "originalUrl": "https://github.com/PlotJuggler/PlotJuggler",
    "authority": "Official project",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "PORT01",
    "track": "Portfolio",
    "name": "About repository README files",
    "provider": "GitHub",
    "type": "Documentation",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use as a completeness checklist for the capstone README.",
    "originalUrl": "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "DEV01",
    "track": "Reproducibility",
    "name": "Development Containers",
    "provider": "Dev Container specification",
    "type": "Documentation",
    "suggestedSliceMinutes": 10,
    "exactUse": "Use only after the base build works; pin environment facts.",
    "originalUrl": "https://containers.dev/",
    "authority": "Open specification",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "MIG01",
    "track": "Version awareness",
    "name": "ROS 2 Lyrical Luth release",
    "provider": "Open Robotics",
    "type": "Release page",
    "suggestedSliceMinutes": 10,
    "exactUse": "Read after the capstone; compare migration impact before changing baseline.",
    "originalUrl": "https://docs.ros.org/en/rolling/Get-Started/Releases/Release-Lyrical-Luth.html",
    "authority": "Official",
    "linkCheckResult": "Search verified",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ADV01",
    "track": "Optional specialisation",
    "name": "MoveIt Getting Started",
    "provider": "MoveIt",
    "type": "Tutorial",
    "suggestedSliceMinutes": 20,
    "exactUse": "Optional after M9 if pursuing manipulation or mobile manipulation.",
    "originalUrl": "https://moveit.picknik.ai/main/doc/tutorials/getting_started/getting_started.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  },
  {
    "id": "ADV02",
    "track": "Optional specialisation",
    "name": "Isaac Sim ROS 2 Tutorials",
    "provider": "NVIDIA",
    "type": "Tutorial collection",
    "suggestedSliceMinutes": 20,
    "exactUse": "Optional after M9 for GPU simulation and synthetic perception data.",
    "originalUrl": "https://docs.isaacsim.omniverse.nvidia.com/latest/ros2_tutorials/index.html",
    "authority": "Official",
    "linkCheckResult": "Opened",
    "linkCheckDate": "2026-07-26"
  }
];

export const rebootMilestones = [
  {
    "order": 1,
    "id": "M0",
    "name": "Reset and diagnostic",
    "beginnerMeaning": "Understand the whole robot before learning its parts, then prove what you already know.",
    "prerequisite": "None",
    "coreBlocks": 6,
    "activeHours": 2.5,
    "portfolioArtefact": "One-page sense-think-act system map and five acceptance criteria",
    "masteryGate": "Explain the robot boundary in 90 seconds and pass four practical baseline checks",
    "roleSignal": "Systems thinking and honest baseline",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 2,
    "id": "M1",
    "name": "Computing foundations",
    "beginnerMeaning": "Use Linux, Git and Python confidently enough to build, test and recover work.",
    "prerequisite": "M0",
    "coreBlocks": 10,
    "activeHours": 4.166666666666667,
    "portfolioArtefact": "Tested sensor-log analyser with plots and a clean Git history",
    "masteryGate": "Fresh clone runs, tests pass, and one deliberate fault is diagnosed",
    "roleSignal": "Python, Linux, Git and test discipline",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 3,
    "id": "M2",
    "name": "C++ and robot maths",
    "beginnerMeaning": "Turn vectors, transforms, kinematics and basic probability into working code.",
    "prerequisite": "M1",
    "coreBlocks": 12,
    "activeHours": 5,
    "portfolioArtefact": "C++ transform and differential-drive odometry library with tests",
    "masteryGate": "Derive one pose update, test it numerically, and explain frame conventions",
    "roleSignal": "C++, CMake, kinematics and numerical reasoning",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 4,
    "id": "M3",
    "name": "ROS 2 core",
    "beginnerMeaning": "Build a small distributed robot application using the ROS graph correctly.",
    "prerequisite": "M1 and M2",
    "coreBlocks": 12,
    "activeHours": 5,
    "portfolioArtefact": "Sensor-filter-controller ROS 2 workspace in Python and C++",
    "masteryGate": "Launch from a clean shell, inspect graph and QoS, record a bag, and pass tests",
    "roleSignal": "ROS 2 architecture, DDS and package development",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 5,
    "id": "M4",
    "name": "Robot model, simulation and control",
    "beginnerMeaning": "Create a digital twin that moves for physically credible reasons.",
    "prerequisite": "M2 and M3",
    "coreBlocks": 12,
    "activeHours": 5,
    "portfolioArtefact": "Differential-drive URDF/Xacro robot in RViz and Gazebo with ros2_control",
    "masteryGate": "No broken TF, realistic mass/inertia, stable teleoperation and bounded command response",
    "roleSignal": "URDF, TF, Gazebo, ros2_control, CAD and controls",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 6,
    "id": "M5",
    "name": "Localisation, SLAM and Nav2",
    "beginnerMeaning": "Estimate pose from noisy sensors, map an environment and navigate reliably.",
    "prerequisite": "M3 and M4",
    "coreBlocks": 14,
    "activeHours": 5.833333333333333,
    "portfolioArtefact": "Autonomous simulated rover with EKF, SLAM and repeatable Nav2 mission",
    "masteryGate": "Complete five missions with logged success rate, pose error and recovery behaviour",
    "roleSignal": "Sensor fusion, SLAM, planning and mobile autonomy",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 7,
    "id": "M6",
    "name": "Embedded, electronics and motor control",
    "beginnerMeaning": "Connect real-time sensing and actuation to the higher-level robot system.",
    "prerequisite": "M1, M2 and M4",
    "coreBlocks": 12,
    "activeHours": 5,
    "portfolioArtefact": "Motor-controller node, interface specification, schematic and hardware-in-loop test",
    "masteryGate": "Meet loop timing, command timeout, saturation and fault-state tests",
    "roleSignal": "ESP32/STM32, FreeRTOS, buses, electronics and motor control",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 8,
    "id": "M7",
    "name": "Perception and applied AI/ML",
    "beginnerMeaning": "Turn images into measured detections and feed them into a robot mission.",
    "prerequisite": "M1, M2 and M3",
    "coreBlocks": 12,
    "activeHours": 5,
    "portfolioArtefact": "Calibrated camera pipeline with detection metrics and ROS 2 integration",
    "masteryGate": "Report dataset split, precision/recall, latency and failure examples",
    "roleSignal": "OpenCV, PyTorch, object detection and responsible evaluation",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 9,
    "id": "M8",
    "name": "Integration, testing and reliability",
    "beginnerMeaning": "Make the complete system reproducible, observable and safe under expected faults.",
    "prerequisite": "M3 through M7",
    "coreBlocks": 10,
    "activeHours": 4.166666666666667,
    "portfolioArtefact": "Requirements-to-test matrix, CI, logs, fault tests and regression report",
    "masteryGate": "Clean environment build passes and injected sensor/comms faults reach safe states",
    "roleSignal": "Systems engineering, verification, CI and diagnostics",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  },
  {
    "order": 10,
    "id": "M9",
    "name": "Capstone release and interview proof",
    "beginnerMeaning": "Package the engineering evidence so another engineer can understand and reproduce it.",
    "prerequisite": "M0 through M8",
    "coreBlocks": 10,
    "activeHours": 4.166666666666667,
    "portfolioArtefact": "Flagship rover release, benchmark report, architecture diagram and 90-second demo",
    "masteryGate": "A reviewer can reproduce the demo and you can defend three trade-offs and one failure",
    "roleSignal": "End-to-end robotics R&D and technical communication",
    "defaultStatus": "Not started",
    "defaultCompletion": 0
  }
] as const;

export const rebootDiagnostics = [
  {
    "milestoneId": "M0",
    "task": "Draw sense-think-act-power-communicate boundary and five measurable criteria.",
    "passEvidence": "Coherent diagram, interfaces and testable criteria",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete all M0 blocks",
    "recheck": "After M0 proof"
  },
  {
    "milestoneId": "M1",
    "task": "From a fresh folder, build a Python sensor analyser with Git and three tests.",
    "passEvidence": "Fresh run, clean log and passing tests",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M1 in order",
    "recheck": "After S016"
  },
  {
    "milestoneId": "M2",
    "task": "Derive and code one differential-drive pose update in C++ with tests.",
    "passEvidence": "Correct frames, units and edge cases",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M2 in order",
    "recheck": "After S028"
  },
  {
    "milestoneId": "M3",
    "task": "Create and launch ROS 2 pub/sub, parameter and service nodes; record a bag.",
    "passEvidence": "Clean workspace, graph, bag and tests",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M3 in order",
    "recheck": "After S040"
  },
  {
    "milestoneId": "M4",
    "task": "Model and teleoperate a differential-drive robot with valid TF and inertia.",
    "passEvidence": "Stable simulation and no TF breaks",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M4 in order",
    "recheck": "After S052"
  },
  {
    "milestoneId": "M5",
    "task": "Fuse odometry/IMU, create a map and complete a fixed Nav2 waypoint mission.",
    "passEvidence": "Repeatable mission and logged metrics",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M5 in order",
    "recheck": "After S066"
  },
  {
    "milestoneId": "M6",
    "task": "Design a fixed-rate motor node with timeout, RTOS data flow and schematic.",
    "passEvidence": "Timing, fault behaviour and ERC evidence",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M6 in order",
    "recheck": "After S078"
  },
  {
    "milestoneId": "M7",
    "task": "Calibrate a camera, run detection and report precision, recall and latency.",
    "passEvidence": "Metrics plus failure examples",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M7 in order",
    "recheck": "After S090"
  },
  {
    "milestoneId": "M8",
    "task": "Create requirements-to-test matrix and run one injected-fault regression.",
    "passEvidence": "Traceable requirement and safe response",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M8 in order",
    "recheck": "After S100"
  },
  {
    "milestoneId": "M9",
    "task": "Give a 90-second system explanation and reproduce the project from its README.",
    "passEvidence": "Reproducible run and defensible trade-offs",
    "defaultScore": null,
    "defaultDecision": "Not scored",
    "ifBelowThree": "Complete M9 in order",
    "recheck": "After S110"
  }
] as const;

export const rebootProjectReleases = [
  {
    "id": "P1",
    "name": "P1 Robot Zero Core",
    "userProblem": "A robot project is hard to understand and reproduce when requirements, interfaces and tests are missing.",
    "systemIncrement": "Runnable software skeleton and sensor-log tool",
    "coreComponents": "Python, C++, Git, CMake, tests, system map",
    "acceptanceTests": "Fresh clone; tests pass; one fault diagnosed",
    "portfolioProof": "Diagram, test log and short demo",
    "sessions": "S001-S040",
    "hardwareRequired": "No",
    "gateBeforeSpending": "None",
    "interviewSignal": "Software foundations and ROS 2 architecture"
  },
  {
    "id": "P2",
    "name": "P2 Mobile Rover Digital Twin",
    "userProblem": "Robot behaviours cannot be trusted until geometry, frames and control are physically credible.",
    "systemIncrement": "Teleoperated simulated differential-drive rover",
    "coreComponents": "URDF/Xacro, TF, Gazebo, ros2_control, PID, CAD envelope",
    "acceptanceTests": "TF valid; stable command response; stop timeout; collision test",
    "portfolioProof": "RViz/Gazebo capture and test table",
    "sessions": "S041-S052",
    "hardwareRequired": "No",
    "gateBeforeSpending": "Pass P2 in simulation before choosing parts",
    "interviewSignal": "Modelling, simulation, controls and mechatronics"
  },
  {
    "id": "P3",
    "name": "P3 Autonomous Rover",
    "userProblem": "A mobile robot must estimate pose, map and navigate despite noisy sensors and blocked paths.",
    "systemIncrement": "EKF, SLAM and repeatable Nav2 mission",
    "coreComponents": "Encoders, IMU, LiDAR, robot_localization, slam_toolbox, Nav2",
    "acceptanceTests": "Five fixed missions; success rate, time, path and pose error; fault recovery",
    "portfolioProof": "Benchmark plots, bag replay and mission video",
    "sessions": "S053-S066",
    "hardwareRequired": "No",
    "gateBeforeSpending": "Pass five-run autonomy benchmark",
    "interviewSignal": "State estimation, SLAM, planning and autonomy"
  },
  {
    "id": "P4",
    "name": "P4 Perception-Enabled Inspection Rover",
    "userProblem": "Inspection needs measured visual detection integrated with safe robot behaviour.",
    "systemIncrement": "Camera detection, embedded motor boundary, diagnostics and complete release",
    "coreComponents": "OpenCV, PyTorch/YOLO, ROS image pipeline, MCU/RTOS, CI, requirements",
    "acceptanceTests": "Precision/recall/latency; command timeout; fault tests; clean reproduction",
    "portfolioProof": "Architecture, README, benchmark, failure gallery and 90-second demo",
    "sessions": "S067-S110",
    "hardwareRequired": "Optional",
    "gateBeforeSpending": "Buy only for a documented gap that simulation cannot prove",
    "interviewSignal": "End-to-end robotics R&D, AI/ML and verification"
  }
] as const;

export const rebootTechnologyLanes = [
  {
    "lane": "Start now",
    "when": "M0-M2",
    "operatingSystem": "Use a current working environment",
    "ros2": "Existing environment is acceptable",
    "gazebo": "Not required",
    "reason": "Begin without changing a device",
    "changeMade": "None",
    "gate": "Python/C++ tests pass"
  },
  {
    "lane": "Core portfolio",
    "when": "M3-M9",
    "operatingSystem": "Ubuntu 24.04",
    "ros2": "Jazzy Jalisco LTS",
    "gazebo": "Harmonic LTS",
    "reason": "Mature tutorials and supported pairing",
    "changeMade": "None",
    "gate": "Confirm target device and rollback before install"
  },
  {
    "lane": "Future migration",
    "when": "After M9",
    "operatingSystem": "Ubuntu 26.04",
    "ros2": "Lyrical Luth LTS",
    "gazebo": "Jetty LTS",
    "reason": "Latest LTS awareness without disrupting the reboot",
    "changeMade": "None",
    "gate": "Package compatibility and regression plan"
  }
] as const;

export const rebootCadence = {
  recallMinutes: 3,
  microLessonMaximumMinutes: 10,
  buildOrTestMinutes: 10,
  evidenceAndCloseMinutes: 2,
  defaultCapMinutes: 25,
  blockerReductionMinutes: 10
} as const;

export const rebootWeeklyLearningRhythm = [
  {
    "day": "Monday",
    "primaryLearningMode": "Orient and learn",
    "studyBlocks": 2,
    "portfolioAction": "Define the week's proof",
    "offScreenAction": "Draw system or maths by hand",
    "reviewQuestion": "What is the smallest useful outcome?",
    "fallback": "One block only"
  },
  {
    "day": "Tuesday",
    "primaryLearningMode": "Build",
    "studyBlocks": 3,
    "portfolioAction": "Implement one vertical slice",
    "offScreenAction": "Bench/CAD sketch",
    "reviewQuestion": "What changed in the system?",
    "fallback": "Next unfinished block"
  },
  {
    "day": "Wednesday",
    "primaryLearningMode": "Maths, controls and test",
    "studyBlocks": 2,
    "portfolioAction": "Add a measurable test",
    "offScreenAction": "Walk and explain aloud",
    "reviewQuestion": "What can disprove my result?",
    "fallback": "One test block"
  },
  {
    "day": "Thursday",
    "primaryLearningMode": "Integrate",
    "studyBlocks": 3,
    "portfolioAction": "Connect two subsystems",
    "offScreenAction": "Interface diagram",
    "reviewQuestion": "Where can data, timing or units break?",
    "fallback": "One integration check"
  },
  {
    "day": "Friday",
    "primaryLearningMode": "Proof and communicate",
    "studyBlocks": 2,
    "portfolioAction": "Demo, plot or README update",
    "offScreenAction": "90-second spoken review",
    "reviewQuestion": "What evidence would convince an engineer?",
    "fallback": "One proof block"
  },
  {
    "day": "Saturday",
    "primaryLearningMode": "Optional hands-on",
    "studyBlocks": 1,
    "portfolioAction": "CAD, electronics or physical build",
    "offScreenAction": "Hands-on task",
    "reviewQuestion": "Is this enjoyable and useful?",
    "fallback": "Rest"
  },
  {
    "day": "Sunday",
    "primaryLearningMode": "Recovery and planning",
    "studyBlocks": 0,
    "portfolioAction": "No build required",
    "offScreenAction": "20-minute weekly review",
    "reviewQuestion": "What is next Monday's first block?",
    "fallback": "Rest"
  }
] as const;

export const rebootWeeklyReviewTemplate = [
  {
    "week": 1,
    "plannedBlocks": 11
  },
  {
    "week": 2,
    "plannedBlocks": 12
  },
  {
    "week": 3,
    "plannedBlocks": 12
  },
  {
    "week": 4,
    "plannedBlocks": 12
  },
  {
    "week": 5,
    "plannedBlocks": 12
  },
  {
    "week": 6,
    "plannedBlocks": 12
  },
  {
    "week": 7,
    "plannedBlocks": 12
  },
  {
    "week": 8,
    "plannedBlocks": 12
  },
  {
    "week": 9,
    "plannedBlocks": 12
  },
  {
    "week": 10,
    "plannedBlocks": 12
  },
  {
    "week": 11,
    "plannedBlocks": 12
  },
  {
    "week": 12,
    "plannedBlocks": 12
  }
] as const;

export const rebootOptionalOperatingModes = [
  {
    "trigger": "Searching",
    "studyMode": "Normal",
    "blocksPerWeek": 12,
    "jobSearchTemplate": "Two short blocks each weekday",
    "portfolioTemplate": "One proof each Friday",
    "reviewTiming": "Sunday",
    "reason": "Maintain progress without all-day screen time",
    "action": "Continue next unfinished session"
  },
  {
    "trigger": "Interview",
    "studyMode": "Protected",
    "blocksPerWeek": 8,
    "jobSearchTemplate": "Prioritise active roles and preparation",
    "portfolioTemplate": "Use existing proof",
    "reviewTiming": "After interview",
    "reason": "Avoid overload and unrelated study",
    "action": "Prepare three engineering stories"
  },
  {
    "trigger": "Offer",
    "studyMode": "Transition",
    "blocksPerWeek": 3,
    "jobSearchTemplate": "Complete agreed checks only",
    "portfolioTemplate": "Preserve current state",
    "reviewTiming": "End of first workweek",
    "reason": "Make space for onboarding",
    "action": "Pause new milestones for 72 hours"
  },
  {
    "trigger": "Started",
    "studyMode": "Maintenance",
    "blocksPerWeek": 3,
    "jobSearchTemplate": "Stop unemployed pipeline",
    "portfolioTemplate": "One monthly proof",
    "reviewTiming": "End of week 2",
    "reason": "Align learning to real role",
    "action": "Select one role-critical gap"
  }
] as const;

export const localCalendarPlanningModel = {
  connectionState: "unavailable",
  availabilityStates: ["unknown", "busy", "available"] as const,
  missingEventMeaning: "unknown",
  rules: [
    "Calendar planning is optional and local.",
    "No returned event never proves that time is free.",
    "A learner chooses or confirms every study block.",
    "Employment and job-search templates are optional modes, not default learner obligations.",
    "No calendar account, event label, subscription, appointment or inferred commitment is bundled."
  ]
} as const;

export const resourceRevalidations = [
  {
    resourceId: "ROS01",
    checkedAt: "2026-07-28",
    url: "https://docs.ros.org/en/jazzy/Installation/Alternatives/Ubuntu-Install-Binary.html",
    result: "Official ROS 2 documentation continues to identify Ubuntu 24.04 Noble as a supported Jazzy platform."
  },
  {
    resourceId: "SIM01",
    checkedAt: "2026-07-28",
    url: "https://gazebosim.org/docs/jetty/ros_installation/",
    result: "Official Gazebo documentation recommends Ubuntu 24.04, ROS 2 Jazzy and Gazebo Harmonic for the stable lane."
  },
  {
    resourceId: "MIG01",
    checkedAt: "2026-07-28",
    url: "https://gazebosim.org/docs/jetty/ros_installation/",
    result: "Official Gazebo documentation lists ROS 2 Lyrical and Gazebo Jetty as the recommended future pairing; migration still requires compatibility, rollback and regression review."
  }
] as const;
