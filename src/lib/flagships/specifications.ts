import {
  FLAGSHIP_SCHEMA_VERSION,
  type FlagshipWorkflowSpecification,
  type WorkflowOutputDescriptor
} from "./types";

const standardOutputs: WorkflowOutputDescriptor[] = [
  {
    kind: "notebook",
    title: "Engineering notebook record",
    requiredFields: ["objective", "dated assumptions", "method", "observations", "decision", "limitations"]
  },
  {
    kind: "calculation",
    title: "Reproducible calculation record",
    requiredFields: ["equation", "SI variables", "raw inputs", "result", "validity checks", "independent check"]
  },
  {
    kind: "evidence",
    title: "Traceable evidence record",
    requiredFields: ["requirement", "test case", "result", "pass status", "source reference", "residual risk"]
  }
];

export const controlsFlagship: FlagshipWorkflowSpecification = {
  schemaVersion: FLAGSHIP_SCHEMA_VERSION,
  id: "flagship-controls-response-and-robustness",
  title: "Controls: response, saturation, and robustness",
  domain: "controls",
  linkedSkillIds: ["controls"],
  summary:
    "Specify a bounded response, reconcile analytical fixtures with simulation, tune a controller, and diagnose disturbance and saturation behaviour.",
  prerequisites: [
    "Algebra and exponential functions",
    "SI units for time and plant input or output",
    "First-order and second-order model concepts",
    "Closed-loop feedback and PID terms"
  ],
  outcomes: [
    {
      statement: "Reconcile analytical and numerical first-order responses.",
      measure: "Absolute output difference at selected times",
      passCriterion: "Difference is at most the declared numerical tolerance."
    },
    {
      statement: "Tune a controller against measurable response criteria.",
      measure: "Overshoot, rise time, settling time, and steady-state error",
      passCriterion: "Every metric satisfies its recorded limit for the nominal case."
    },
    {
      statement: "Classify the canonical continuous-time model stability.",
      measure: "Pole real and imaginary parts with the resulting stability class",
      passCriterion: "The independently calculated poles and classification agree with the declared damping case."
    },
    {
      statement: "Diagnose saturation and anti-windup behaviour.",
      measure: "Saturated sample fraction and post-saturation recovery",
      passCriterion: "Saturation is reported, its cause is explained, and recovery is bounded by a stated criterion."
    }
  ],
  sequence: [
    {
      id: "controls-requirements",
      title: "State the response requirements",
      action: "Record setpoint, time base, disturbance, actuator limits, and pass criteria with SI units.",
      verification: "Every requirement has a numerical limit, scope, and unit.",
      outputs: ["Notebook objective", "Requirement evidence rows"]
    },
    {
      id: "controls-analytical-fixture",
      title: "Calculate analytical fixtures",
      action: "Evaluate first-order and second-order step-response values and second-order poles at declared times.",
      verification: "Initial, steady-state, one-time-constant, pole, and stability cases agree with independent equations.",
      outputs: ["Calculation record", "Response table", "Pole and stability table"]
    },
    {
      id: "controls-simulation",
      title: "Run the deterministic loop",
      action: "Simulate nominal, disturbance, and constrained-actuator cases with fixed inputs and time step.",
      verification: "A repeated run produces the same rows and derived metrics.",
      outputs: ["Sample table", "Metric table"]
    },
    {
      id: "controls-diagnosis",
      title: "Diagnose and challenge",
      action: "Compare requirements with metrics and explain saturation, steady-state error, and non-settling states.",
      verification: "Each failed criterion has a cause, bounded repair, and rerun result.",
      outputs: ["Diagnosis record", "Evidence rubric"]
    }
  ],
  equations: [
    {
      id: "controls-first-order-step",
      expression: "y(t) = K*u0*(1 - exp(-t/tau))",
      variables: [
        { symbol: "y", quantity: "output", siUnit: "application-dependent SI unit" },
        { symbol: "K", quantity: "steady-state gain", siUnit: "output unit per input unit" },
        { symbol: "u0", quantity: "step input", siUnit: "application-dependent SI unit" },
        { symbol: "t", quantity: "time", siUnit: "s" },
        { symbol: "tau", quantity: "time constant", siUnit: "s" }
      ],
      assumptions: ["Linear time-invariant first-order model", "Zero initial output", "Constant step from time zero"],
      validWhen: ["tau is greater than zero", "Input and output units are consistent"]
    },
    {
      id: "controls-second-order-model",
      expression: "y'' + 2*zeta*wn*y' + wn^2*y = K*wn^2*u",
      variables: [
        { symbol: "y", quantity: "plant output", siUnit: "application-dependent SI unit" },
        { symbol: "y'", quantity: "first time derivative of output", siUnit: "output unit/s" },
        { symbol: "y''", quantity: "second time derivative of output", siUnit: "output unit/s^2" },
        { symbol: "u", quantity: "plant input", siUnit: "application-dependent SI unit" },
        { symbol: "K", quantity: "steady-state gain", siUnit: "output unit per input unit" },
        { symbol: "zeta", quantity: "damping ratio", siUnit: "1" },
        { symbol: "wn", quantity: "natural angular frequency", siUnit: "rad/s" },
        { symbol: "t", quantity: "time", siUnit: "s" }
      ],
      assumptions: ["Canonical linear second-order model", "Constant coefficients", "Zero initial state"],
      validWhen: ["wn is greater than zero", "zeta is greater than or equal to zero"]
    },
    {
      id: "controls-pid",
      expression: "u = Kp*e + Ki*integral(e dt) + Kd*de/dt",
      variables: [
        { symbol: "u", quantity: "controller output", siUnit: "actuator input unit" },
        { symbol: "e", quantity: "setpoint error", siUnit: "process-variable unit" },
        { symbol: "Kp", quantity: "proportional gain", siUnit: "actuator unit per process unit" },
        { symbol: "Ki", quantity: "integral gain", siUnit: "actuator unit per process unit per s" },
        { symbol: "Kd", quantity: "derivative gain", siUnit: "actuator unit s per process unit" },
        { symbol: "t", quantity: "time", siUnit: "s" }
      ],
      assumptions: ["Discrete implementation declares time step", "Derivative and integral conventions are recorded"],
      validWhen: ["Actuator limits are explicit", "Sensor and actuator signs are verified"]
    },
    {
      id: "controls-second-order-poles",
      expression: "s = -zeta*wn +/- wn*sqrt(zeta^2 - 1)",
      variables: [
        { symbol: "s", quantity: "continuous-time pole", siUnit: "1/s" },
        { symbol: "zeta", quantity: "damping ratio", siUnit: "1" },
        { symbol: "wn", quantity: "natural angular frequency", siUnit: "rad/s" }
      ],
      assumptions: ["Canonical continuous-time second-order denominator", "Constant finite coefficients"],
      validWhen: ["wn is greater than zero", "Stability is classified from pole real parts"]
    }
  ],
  deterministicWorkflow: {
    inputs: ["Plant type", "Gain or time constants", "PID gains", "Setpoint", "Disturbance", "Time step", "Actuator limits"],
    steps: [
      "Validate finite values and positive time quantities.",
      "Calculate analytical fixture values, poles, and the canonical stability classification.",
      "Run the fixed-step PID simulation.",
      "Calculate metrics and saturated sample fraction.",
      "Compare each result with its recorded pass criterion."
    ],
    expectedOutputs: ["Analytical fixture table", "Pole and stability table", "Time-series table", "Metric table", "Saturation diagnosis", "Evidence records"]
  },
  challenge: {
    prompt: "Meet the response limits after a bounded disturbance while preserving a declared actuator range.",
    constraints: [
      "Use one fixed time step for all compared runs.",
      "Do not hide clipped actuator samples.",
      "Record any gain change and its effect on every metric."
    ],
    knownPassCriteria: [
      "Nominal and disturbance metrics meet the recorded limits.",
      "The pole table and canonical stability classification are correct for the declared damping ratio.",
      "All controller outputs remain inside the declared actuator bounds.",
      "Saturation fraction and anti-windup strategy are reported.",
      "A repeated run produces identical calculation rows."
    ]
  },
  failureStates: [
    {
      id: "controls-invalid-time-base",
      condition: "Time constant, duration, or time step is zero, negative, or non-finite.",
      diagnosis: "The differential model cannot be evaluated on a valid forward time base.",
      repair: "Correct the source quantity and preserve the rejected input in the notebook."
    },
    {
      id: "controls-saturation-dominant",
      condition: "The actuator remains clipped for more than the stated acceptable fraction.",
      diagnosis: "Requested effort exceeds the available actuator range or gains are too aggressive.",
      repair: "Reconcile setpoint, actuator authority, plant scaling, and gains, then rerun every affected case."
    },
    {
      id: "controls-non-settling",
      condition: "The response never remains inside the stated settling band.",
      diagnosis: "The run is too short, the controller is poorly tuned, or the model cannot meet the criterion.",
      repair: "Change one justified parameter or criterion at a time and preserve comparison evidence."
    }
  ],
  linkedApplication: {
    projectId: "temperature-controller",
    labId: "pid",
    application: "Use the closed-loop temperature controller project to verify nominal, disturbance, and saturation cases."
  },
  evidenceRubric: [
    {
      criterion: "Traceable requirements",
      requiredEvidence: "Unit-bearing setpoint, response limits, actuator bounds, and disturbance case",
      passCondition: "Every result maps to one declared requirement."
    },
    {
      criterion: "Equation and simulation reconciliation",
      requiredEvidence: "Analytical fixture and corresponding numerical samples",
      passCondition: "Differences are inside the declared tolerance or are explained and rerun."
    },
    {
      criterion: "Failure diagnosis",
      requiredEvidence: "Saturation and non-settling diagnostic rows",
      passCondition: "No failed criterion is omitted or relabelled as a pass."
    }
  ],
  outputs: standardOutputs,
  accessibleAlternatives: [
    {
      forOutput: "Response plot",
      tableColumns: ["time (s)", "setpoint", "process variable", "controller output", "saturated status"],
      textSummary: "State peak response, rise time, settling time, steady-state error, and saturation fraction."
    },
    {
      forOutput: "Requirement status colours",
      tableColumns: ["requirement", "measured value", "limit", "unit", "pass status"],
      textSummary: "Use explicit Pass or Fail text and do not rely on colour."
    }
  ],
  safetyBoundary:
    "This local educational model is not a procedure or certification for safety-related, hazardous-energy, or production control."
};

export const roboticsFlagship: FlagshipWorkflowSpecification = {
  schemaVersion: FLAGSHIP_SCHEMA_VERSION,
  id: "flagship-robotics-localisation-and-tracking",
  title: "Robotics and autonomy: localisation and trajectory tracking",
  domain: "robotics-autonomy",
  linkedSkillIds: ["robotics"],
  summary:
    "Model differential-drive motion, expose wheel slip and sensor bias, run a deterministic scalar covariance fixture, and quantify tracking error.",
  prerequisites: [
    "Planar coordinates and radians",
    "Differential-drive kinematics",
    "Mean and variance",
    "Basic feedback and trajectory concepts"
  ],
  outcomes: [
    {
      statement: "Reconcile wheel commands with planar pose change.",
      measure: "Position and heading error against straight, rotation, and arc fixtures",
      passCriterion: "Each error is inside its stated SI tolerance."
    },
    {
      statement: "Explain covariance-weighted sensor fusion.",
      measure: "Predicted covariance, gain, innovation, and posterior covariance",
      passCriterion: "The hand calculation and deterministic fixture agree."
    },
    {
      statement: "Quantify trajectory tracking under bias, delay, and slip.",
      measure: "RMS, maximum, terminal, and path-length error in metres",
      passCriterion: "All metrics are reported and satisfy the challenge limits."
    }
  ],
  sequence: [
    {
      id: "robotics-frames",
      title: "Declare frames and signs",
      action: "Record the world frame, robot frame, heading sign, wheel ordering, metre scale, and time base.",
      verification: "Straight and positive-rotation fixtures match the declared convention.",
      outputs: ["Frame notebook record", "Kinematic fixture table"]
    },
    {
      id: "robotics-prediction",
      title: "Predict motion",
      action: "Integrate fixed wheel velocities with a fixed time step and declared wheelbase.",
      verification: "Repeated runs produce identical pose rows.",
      outputs: ["Pose trajectory table", "Calculation record"]
    },
    {
      id: "robotics-fusion",
      title: "Fuse one measured position",
      action: "Apply process and measurement covariance after correcting declared bias and slip.",
      verification: "Gain remains from zero to one and posterior covariance does not exceed predicted covariance.",
      outputs: ["Covariance table", "Fusion diagnosis"]
    },
    {
      id: "robotics-tracking",
      title: "Assess the route",
      action: "Compare time-aligned reference and actual trajectories.",
      verification: "Sample counts and timestamps match and every distance metric uses metres.",
      outputs: ["Tracking metric table", "Evidence rubric"]
    }
  ],
  equations: [
    {
      id: "robotics-differential-drive",
      expression: "v = (vr + vl)/2; omega = (vr - vl)/b",
      variables: [
        { symbol: "v", quantity: "linear velocity", siUnit: "m/s" },
        { symbol: "omega", quantity: "angular velocity", siUnit: "rad/s" },
        { symbol: "vl", quantity: "left wheel linear velocity", siUnit: "m/s" },
        { symbol: "vr", quantity: "right wheel linear velocity", siUnit: "m/s" },
        { symbol: "b", quantity: "wheelbase", siUnit: "m" }
      ],
      assumptions: ["Planar rigid body", "No lateral slip in the ideal fixture", "Wheel velocities are constant within a step"],
      validWhen: ["Wheelbase and time step are greater than zero", "Frame signs are declared"]
    },
    {
      id: "robotics-scalar-covariance-update",
      expression: "Pp = P + Q; K = Pp/(Pp + R); x = xp + K*(z - xp); P = (1 - K)*Pp",
      variables: [
        { symbol: "P", quantity: "posterior or prior state variance by step", siUnit: "m^2" },
        { symbol: "Pp", quantity: "predicted state variance", siUnit: "m^2" },
        { symbol: "Q", quantity: "process variance", siUnit: "m^2" },
        { symbol: "R", quantity: "measurement variance", siUnit: "m^2" },
        { symbol: "x", quantity: "position estimate", siUnit: "m" },
        { symbol: "xp", quantity: "predicted position estimate", siUnit: "m" },
        { symbol: "z", quantity: "position measurement", siUnit: "m" },
        { symbol: "K", quantity: "scalar Kalman gain", siUnit: "1" }
      ],
      assumptions: ["One-dimensional linear educational fixture", "Independent zero-mean residual uncertainty after bias correction"],
      validWhen: ["Covariances are non-negative", "Pp and R are not both zero", "Measurement age is inside the stated limit"]
    }
  ],
  deterministicWorkflow: {
    inputs: ["Initial pose", "Wheel velocities", "Wheelbase", "Time step", "Slip fraction", "Bias", "Measurement age", "Covariances"],
    steps: [
      "Validate SI units, signs, covariance bounds, and timestamps.",
      "Generate the ideal differential-drive trajectory.",
      "Apply the declared slip fraction in the scalar prediction.",
      "Reject delayed measurements or correct bias and apply the covariance update.",
      "Calculate time-aligned trajectory tracking metrics."
    ],
    expectedOutputs: ["Pose table", "Fusion update table", "Delay or bias diagnosis", "Tracking metric table", "Evidence records"]
  },
  challenge: {
    prompt: "Track a local route while explaining the effect of wheel slip, sensor bias, measurement delay, and covariance choice.",
    constraints: [
      "Keep the random seed and all model inputs fixed.",
      "Reject invalid covariance instead of silently replacing it.",
      "Do not fuse a measurement older than the stated age limit."
    ],
    knownPassCriteria: [
      "Straight, rotation, and arc fixtures match the declared frame convention.",
      "Accepted covariance updates keep gain from zero to one.",
      "Delayed measurements are explicitly rejected.",
      "RMS, maximum, terminal, and path-length errors meet declared limits."
    ]
  },
  failureStates: [
    {
      id: "robotics-invalid-covariance",
      condition: "A covariance is negative, non-finite, or the innovation covariance is zero.",
      diagnosis: "The uncertainty model is not physically meaningful for the scalar fixture.",
      repair: "Correct the source variance and rerun from the last valid prior state."
    },
    {
      id: "robotics-delayed-measurement",
      condition: "Measurement age exceeds the configured maximum.",
      diagnosis: "The observation does not represent the current state within the declared timing assumption.",
      repair: "Reject it, preserve the prediction, and record the delay status."
    },
    {
      id: "robotics-route-error",
      condition: "RMS, maximum, or terminal error exceeds its route limit.",
      diagnosis: "Frame, wheel scale, slip, bias, timing, or controller performance may be inconsistent.",
      repair: "Test each source independently with fixed fixtures before rerunning the full route."
    }
  ],
  linkedApplication: {
    projectId: "mobile-robot",
    labId: "robotics",
    application: "Use the two-motor mobile robot project for kinematics, odometry, sensor fusion, and route evidence."
  },
  evidenceRubric: [
    {
      criterion: "Frame and unit integrity",
      requiredEvidence: "Frame drawing or text declaration plus SI pose table",
      passCondition: "Signs, axes, radians, metres, and timestamps are unambiguous."
    },
    {
      criterion: "Estimator traceability",
      requiredEvidence: "Prior, prediction, innovation, gain, and posterior rows",
      passCondition: "The covariance update reconciles independently and rejected measurements remain visible."
    },
    {
      criterion: "Route performance",
      requiredEvidence: "Reference and actual rows with derived tracking metrics",
      passCondition: "All samples reconcile and each limit has explicit Pass or Fail text."
    }
  ],
  outputs: standardOutputs,
  accessibleAlternatives: [
    {
      forOutput: "Planar trajectory plot",
      tableColumns: ["time (s)", "reference x (m)", "reference y (m)", "actual x (m)", "actual y (m)", "error (m)"],
      textSummary: "State sample count, RMS error, maximum error, terminal error, and path-length error."
    },
    {
      forOutput: "Covariance plot",
      tableColumns: ["step", "prior variance (square metres)", "predicted variance (square metres)", "measurement variance (square metres)", "gain", "posterior variance (square metres)"],
      textSummary: "State whether the measurement was accepted and how the posterior shifted."
    }
  ],
  safetyBoundary:
    "This deterministic local fixture does not establish autonomous-system safety, localisation assurance, or readiness for operation near people or hazards."
};

export const embeddedFlagship: FlagshipWorkflowSpecification = {
  schemaVersion: FLAGSHIP_SCHEMA_VERSION,
  id: "flagship-embedded-sensor-timing-faults",
  title: "Embedded electronics and sensing: sampling, timing, and faults",
  domain: "embedded-electronics-sensing",
  linkedSkillIds: ["embedded", "electronics"],
  summary:
    "Trace a bounded sensor signal through sampling, filtering, ADC conversion, task timing, state transitions, and explicit fault handling.",
  prerequisites: [
    "Voltage and frequency",
    "Binary numbers and ADC resolution",
    "Sampling and aliasing concepts",
    "Finite-state machines and periodic tasks",
    "Low-voltage supply, current, resistance, and logic-level concepts"
  ],
  outcomes: [
    {
      statement: "Choose and justify a sampling rate.",
      measure: "Nyquist frequency, samples per cycle, and folded alias frequency",
      passCriterion: "All relevant signal components are inside the declared sampling and filter bounds."
    },
    {
      statement: "Quantify ADC conversion behaviour.",
      measure: "Code, LSB voltage, quantised voltage, clipping status, and quantisation error",
      passCriterion: "Valid inputs are represented and out-of-range values are explicitly clipped and diagnosed."
    },
    {
      statement: "Verify timing and fault-state behaviour.",
      measure: "Periodic utilisation, deadline violations, state trace, and rejected events",
      passCriterion: "Timing stays inside the stated bound and every fault event reaches a defined state."
    },
    {
      statement: "Check declared low-voltage power and interface assumptions.",
      measure: "Active power, resistive loading, loaded high-level voltage, and threshold margin",
      passCriterion: "The computed loaded level meets the declared receiver threshold and every excluded interface behaviour remains explicit."
    }
  ],
  sequence: [
    {
      id: "embedded-signal-bound",
      title: "Bound the signal",
      action: "Record supply, active current, sensor voltage, source and input resistance, receiver threshold, bandwidth, units, sample requirement, and invalid ranges.",
      verification: "Power, loading, logic margin, minimum, maximum, and fault states are explicit.",
      outputs: ["Sensor requirement record", "Power and interface table", "Fault-bound table"]
    },
    {
      id: "embedded-sampling-filter",
      title: "Assess sampling and filtering",
      action: "Calculate Nyquist status and a deterministic moving-average response.",
      verification: "Known in-band and aliased fixtures produce the expected table values.",
      outputs: ["Sampling calculation", "Raw and filtered table"]
    },
    {
      id: "embedded-adc",
      title: "Quantise the input",
      action: "Convert bounded voltages into ADC codes with declared reference and bit depth.",
      verification: "Zero, full-scale boundary, mid-scale, and clipped cases are tested.",
      outputs: ["ADC conversion table", "Error calculation"]
    },
    {
      id: "embedded-timing-fsm",
      title: "Verify execution and state logic",
      action: "Calculate periodic utilisation and drive nominal and fault events through the FSM.",
      verification: "Duplicate states, invalid transitions, missed deadlines, and rejected events remain visible.",
      outputs: ["Timing table", "FSM trace", "Fault evidence"]
    }
  ],
  equations: [
    {
      id: "embedded-nyquist",
      expression: "fs > 2*fmax",
      variables: [
        { symbol: "fs", quantity: "sample frequency", siUnit: "Hz" },
        { symbol: "fmax", quantity: "highest represented signal frequency", siUnit: "Hz" }
      ],
      assumptions: ["Signal bandwidth is known", "Anti-alias filtering is considered separately"],
      validWhen: ["Frequencies are finite and non-negative", "Sample frequency is greater than zero"]
    },
    {
      id: "embedded-adc-lsb",
      expression: "LSB = Vref/(2^N)",
      variables: [
        { symbol: "LSB", quantity: "code width", siUnit: "V" },
        { symbol: "Vref", quantity: "ADC reference", siUnit: "V" },
        { symbol: "N", quantity: "ADC resolution", siUnit: "bit" }
      ],
      assumptions: ["Ideal uniform unipolar quantiser", "Input is compared with the range from zero to Vref"],
      validWhen: ["Vref is greater than zero", "N is a positive supported integer"]
    },
    {
      id: "embedded-utilisation",
      expression: "U = sum(WCETi/Ti)",
      variables: [
        { symbol: "U", quantity: "periodic processor utilisation", siUnit: "1" },
        { symbol: "WCET", quantity: "worst-case execution time", siUnit: "s" },
        { symbol: "T", quantity: "task period", siUnit: "s" }
      ],
      assumptions: ["Declared independent periodic workload fixture", "Scheduling overhead and blocking are excluded unless stated"],
      validWhen: ["Every period and execution time is greater than zero", "A utilisation limit is declared"]
    },
    {
      id: "embedded-interface-power",
      expression: "P = V*I; Vloaded = Vhigh*Rin/(Rsource + Rin)",
      variables: [
        { symbol: "P", quantity: "active electrical power", siUnit: "W" },
        { symbol: "V", quantity: "declared supply voltage", siUnit: "V" },
        { symbol: "I", quantity: "declared active current", siUnit: "A" },
        { symbol: "Vhigh", quantity: "unloaded high-level output", siUnit: "V" },
        { symbol: "Vloaded", quantity: "resistively loaded high level", siUnit: "V" },
        { symbol: "Rsource", quantity: "source resistance", siUnit: "ohm" },
        { symbol: "Rin", quantity: "receiver input resistance", siUnit: "ohm" }
      ],
      assumptions: ["Low-voltage resistive steady-state educational model", "No transient, EMC, leakage, input-current, or protection-network model"],
      validWhen: ["Supply is positive", "Logic voltages remain inside the declared supply", "Receiver input resistance is positive"]
    }
  ],
  deterministicWorkflow: {
    inputs: ["Supply voltage", "Active current", "Logic levels", "Source and receiver resistance", "Signal frequency", "Sample frequency", "Filter window", "ADC reference", "ADC bits", "Task timing", "FSM events", "Sensor bounds"],
    steps: [
      "Validate supply, current, interface, frequency, voltage reference, bit depth, and timing inputs.",
      "Calculate active power, loaded logic level, and threshold margin.",
      "Calculate Nyquist and alias status.",
      "Filter a fixed sample sequence.",
      "Quantise bounded and out-of-range voltage fixtures.",
      "Assess timing and execute nominal and fault FSM traces."
    ],
    expectedOutputs: ["Power and interface table", "Sampling table", "Filter table", "ADC table", "Timing diagnosis", "FSM trace", "Fault evidence"]
  },
  challenge: {
    prompt: "Design a deterministic local sensor path that detects range faults without aliasing or exceeding the stated timing budget.",
    constraints: [
      "Use a fixed input sequence and no hidden smoothing.",
      "Report clipping rather than treating it as a valid measurement.",
      "Retain rejected FSM events and deadline violations.",
      "Limit the interface assessment to declared low-voltage steady-state assumptions."
    ],
    knownPassCriteria: [
      "Sampling and filter bounds are justified.",
      "Power, loading, and logic-level margin match an independent calculation.",
      "ADC codes and errors match an independent calculation.",
      "Periodic utilisation is inside the declared limit with no WCET deadline violation.",
      "Nominal, below-range, above-range, and invalid sensor states are explicit."
    ]
  },
  failureStates: [
    {
      id: "embedded-aliasing",
      condition: "A required signal component exceeds the Nyquist frequency.",
      diagnosis: "The sampled sequence can represent a lower false frequency.",
      repair: "Raise the justified sample rate or constrain bandwidth with a documented filter before sampling."
    },
    {
      id: "embedded-adc-clipping",
      condition: "Input voltage is below zero or above the stated reference.",
      diagnosis: "The ideal ADC code cannot preserve the original input magnitude.",
      repair: "Record clipping, review signal conditioning, and rerun the bounded input cases."
    },
    {
      id: "embedded-timing-fault",
      condition: "Utilisation exceeds its limit or WCET exceeds a task deadline.",
      diagnosis: "The simplified periodic workload cannot meet the declared timing case.",
      repair: "Reduce justified work, adjust the declared schedule, or change architecture and rerun all timing cases."
    },
    {
      id: "embedded-interface-margin",
      condition: "The resistively loaded high level is below the declared receiver threshold.",
      diagnosis: "The stated source and receiver assumptions do not produce a positive high-level margin.",
      repair: "Correct the interface data or redesign the bounded low-voltage interface, then independently verify the real component specifications."
    }
  ],
  linkedApplication: {
    projectId: "sensor-data-logger",
    labId: "embedded",
    application: "Use the sensor signal-chain and data logger project to connect sampling, ADC, firmware timing, and calibration evidence."
  },
  evidenceRubric: [
    {
      criterion: "Signal-chain bounds",
      requiredEvidence: "Supply, active current, power, logic levels, source and input resistance, voltage range, bandwidth, sampling rate, filter assumption, and ADC reference",
      passCondition: "Every boundary quantity has an SI unit and invalid states are retained."
    },
    {
      criterion: "Deterministic conversion",
      requiredEvidence: "Input voltage, code, LSB, quantised voltage, error, and clipping rows",
      passCondition: "Independent calculations match and repeated runs are identical."
    },
    {
      criterion: "Fault and timing coverage",
      requiredEvidence: "Nominal and fault FSM traces plus timing assessment",
      passCondition: "Every declared fault and deadline condition has an explicit result."
    }
  ],
  outputs: standardOutputs,
  accessibleAlternatives: [
    {
      forOutput: "Sample and filter plot",
      tableColumns: ["sample index", "time (s)", "raw value", "filtered value", "range status"],
      textSummary: "State sample rate, highest signal frequency, Nyquist status, filter window, and fault count."
    },
    {
      forOutput: "FSM diagram",
      tableColumns: ["step", "event", "state before", "state after", "accepted status"],
      textSummary: "State the initial state, final state, rejected events, and whether a fault state was reached."
    }
  ],
  safetyBoundary:
    "The timing, ADC, and FSM fixtures are educational and do not establish electrical safety, real-time certification, or fitness for a production embedded system."
};

export const mechanicalFlagship: FlagshipWorkflowSpecification = {
  schemaVersion: FLAGSHIP_SCHEMA_VERSION,
  id: "flagship-mechanical-load-stress-tolerance",
  title: "Mechanical design and dynamics: load, stress, deflection, and tolerance",
  domain: "mechanical-design-dynamics",
  linkedSkillIds: ["mechanical"],
  summary:
    "Reconcile rotational torque and power with simple axial stress, cantilever deflection, factor of safety, limits, and worst-case tolerance.",
  prerequisites: [
    "SI force, length, torque, speed, stress, and inertia units",
    "Free-body diagrams",
    "Linear elastic material model",
    "Rotational dynamics and dimensional analysis"
  ],
  outcomes: [
    {
      statement: "Calculate steady and acceleration torque separately.",
      measure: "Load torque, inertia torque, total torque, angular speed, and power",
      passCriterion: "The torque sum and power independently reconcile in SI units."
    },
    {
      statement: "Evaluate simple stress and deflection fixtures.",
      measure: "Axial stress in pascals, tip deflection in metres, and factor of safety",
      passCriterion: "Every result is inside its declared limit and valid-model range."
    },
    {
      statement: "Bound worst-case assembled dimensions.",
      measure: "Nominal, minimum, maximum, and total tolerance in metres",
      passCriterion: "Worst-case stack fits inside the interface limits."
    }
  ],
  sequence: [
    {
      id: "mechanical-loads",
      title: "Declare loads and interfaces",
      action: "Record force, torque, speed, inertia, acceleration, geometry, material values, and boundary conditions.",
      verification: "A free-body description and SI conversion exist for every input.",
      outputs: ["Load notebook record", "Input calculation table"]
    },
    {
      id: "mechanical-rotation",
      title: "Reconcile torque and power",
      action: "Separate steady load torque from inertia torque and calculate power at the operating speed.",
      verification: "Torque times angular speed agrees with the power calculation.",
      outputs: ["Rotational calculation", "Operating-point table"]
    },
    {
      id: "mechanical-strength-stiffness",
      title: "Calculate stress and deflection",
      action: "Evaluate the stated simple axial and cantilever fixtures with limits.",
      verification: "Units, area, second moment, modulus, and boundary assumptions pass validation.",
      outputs: ["Stress calculation", "Deflection calculation", "Limit table"]
    },
    {
      id: "mechanical-tolerance",
      title: "Stack tolerances and challenge",
      action: "Calculate the signed worst-case interface range and compare it with the design envelope.",
      verification: "Minimum and maximum sums reconcile term by term.",
      outputs: ["Tolerance table", "Design evidence rubric"]
    }
  ],
  equations: [
    {
      id: "mechanical-rotational-load",
      expression: "Trequired = Tload + J*alpha; omega = 2*pi*rpm/60; P = Trequired*omega",
      variables: [
        { symbol: "Trequired", quantity: "required torque", siUnit: "N m" },
        { symbol: "Tload", quantity: "declared load torque", siUnit: "N m" },
        { symbol: "J", quantity: "rotational inertia", siUnit: "kg m^2" },
        { symbol: "alpha", quantity: "angular acceleration", siUnit: "rad/s^2" },
        { symbol: "rpm", quantity: "display rotational speed converted to SI", siUnit: "r/min" },
        { symbol: "omega", quantity: "angular speed", siUnit: "rad/s" },
        { symbol: "P", quantity: "mechanical power", siUnit: "W" }
      ],
      assumptions: ["Torque sign convention is declared", "Losses and transmission effects are separate unless stated"],
      validWhen: ["Inertia is non-negative", "Speed and all inputs are finite"]
    },
    {
      id: "mechanical-axial-stress",
      expression: "sigma = F/A",
      variables: [
        { symbol: "sigma", quantity: "normal stress", siUnit: "Pa" },
        { symbol: "F", quantity: "axial force", siUnit: "N" },
        { symbol: "A", quantity: "cross-sectional area", siUnit: "m^2" }
      ],
      assumptions: ["Centric axial loading", "Uniform stress away from local features"],
      validWhen: ["Area is greater than zero", "Geometry and load path match the simple model"]
    },
    {
      id: "mechanical-cantilever",
      expression: "delta = F*L^3/(3*E*I)",
      variables: [
        { symbol: "delta", quantity: "tip deflection", siUnit: "m" },
        { symbol: "F", quantity: "end force", siUnit: "N" },
        { symbol: "L", quantity: "beam length", siUnit: "m" },
        { symbol: "E", quantity: "elastic modulus", siUnit: "Pa" },
        { symbol: "I", quantity: "second moment of area", siUnit: "m^4" }
      ],
      assumptions: ["Slender prismatic beam", "Small deflection", "Linear elastic material", "Ideal fixed support"],
      validWhen: ["Length, modulus, and second moment are greater than zero", "Model assumptions are documented"]
    }
  ],
  deterministicWorkflow: {
    inputs: ["Load torque", "Inertia", "Angular acceleration", "Speed", "Axial force", "Area", "Beam properties", "Allowable stress", "Tolerance terms"],
    steps: [
      "Validate finite SI inputs and reject negative inertia or non-positive geometry.",
      "Calculate steady, acceleration, and total torque.",
      "Reconcile power using angular speed.",
      "Calculate stress, deflection, factor of safety, and explicit limit status.",
      "Calculate the worst-case tolerance stack and compare it with interface limits."
    ],
    expectedOutputs: ["Load table", "Rotational calculation", "Stress and deflection table", "Tolerance table", "Evidence records"]
  },
  challenge: {
    prompt: "Demonstrate that a bounded mechanical concept meets declared torque, stress, deflection, and interface limits within the simple models used.",
    constraints: [
      "Keep continuous and transient loads distinct.",
      "Do not treat nominal dimensions as worst-case dimensions.",
      "Do not promote educational factors of safety into certification claims."
    ],
    knownPassCriteria: [
      "Torque, angular speed, and power reconcile independently.",
      "Stress and deflection are inside explicit SI limits.",
      "Factor of safety is calculated from a stated allowable value and actual stress magnitude.",
      "Worst-case tolerance minimum and maximum remain inside the interface envelope."
    ]
  },
  failureStates: [
    {
      id: "mechanical-invalid-geometry",
      condition: "Area, length, elastic modulus, or second moment is zero, negative, or non-finite.",
      diagnosis: "The simple stress or deflection equation is outside its numerical domain.",
      repair: "Correct the source geometry or material value and preserve the rejected record."
    },
    {
      id: "mechanical-limit-exceeded",
      condition: "Stress, deflection, torque, or power exceeds its declared bound.",
      diagnosis: "The current load, geometry, material, or operating point does not satisfy the requirement.",
      repair: "Revise a justified input or design parameter, then rerun all coupled calculations."
    },
    {
      id: "mechanical-tolerance-interference",
      condition: "The worst-case interface range crosses an assembly limit.",
      diagnosis: "Nominal fit hides a possible tolerance interference or excessive clearance.",
      repair: "Reallocate tolerances or revise nominal dimensions and repeat the full stack."
    }
  ],
  linkedApplication: {
    projectId: "motor-gearbox",
    labId: "mechanical",
    application: "Use the motor and gearbox sizing study to reconcile load torque, acceleration, power, margins, and missing evidence."
  },
  evidenceRubric: [
    {
      criterion: "Load and unit traceability",
      requiredEvidence: "Free-body description plus raw SI load, geometry, speed, and inertia inputs",
      passCondition: "Signs, reference axes, units, and sources are explicit."
    },
    {
      criterion: "Independent equation reconciliation",
      requiredEvidence: "Torque sum, angular-speed conversion, power, stress, and deflection calculations",
      passCondition: "Independent recomputation agrees without hidden rounding."
    },
    {
      criterion: "Limits and tolerances",
      requiredEvidence: "Limit status and term-by-term tolerance stack",
      passCondition: "Worst-case results, not only nominal values, satisfy each declared criterion."
    }
  ],
  outputs: standardOutputs,
  accessibleAlternatives: [
    {
      forOutput: "Load and deflection diagrams",
      tableColumns: ["quantity", "symbol", "raw value", "SI value", "unit", "sign or direction", "source"],
      textSummary: "State the load case, boundary condition, maximum stress, maximum deflection, and nearest limit margin."
    },
    {
      forOutput: "Tolerance range graphic",
      tableColumns: ["term", "nominal (m)", "minus tolerance (m)", "plus tolerance (m)", "minimum (m)", "maximum (m)"],
      textSummary: "State the assembled nominal, minimum, maximum, total tolerance, and interface status."
    }
  ],
  safetyBoundary:
    "These simple local equations do not establish structural safety, fatigue life, manufacturability, material certification, or fitness for physical use."
};

export const mlFlagship: FlagshipWorkflowSpecification = {
  schemaVersion: FLAGSHIP_SCHEMA_VERSION,
  id: "flagship-applied-ml-baselines-and-limits",
  title: "Applied AI and ML: split integrity, baselines, and limitations",
  domain: "applied-ai-ml",
  linkedSkillIds: ["aiml"],
  summary:
    "Build a deterministic train, validation, and test study with transparent baselines, leakage and imbalance warnings, residuals, confusion counts, and a bounded model card.",
  prerequisites: [
    "Tables, means, variance, and residuals",
    "Train and test separation",
    "Regression and binary classification concepts",
    "Accuracy, precision, recall, and class imbalance"
  ],
  outcomes: [
    {
      statement: "Create deterministic non-overlapping data partitions.",
      measure: "Train, validation, and test counts plus unique sample IDs",
      passCriterion: "Counts reconcile to the source and no sample ID crosses partitions."
    },
    {
      statement: "Compare a candidate with transparent baselines.",
      measure: "Validation and test MSE or held-out confusion metrics",
      passCriterion: "The candidate and baseline use the same held-out scope and declared metric."
    },
    {
      statement: "Bound claims with data and model limitations.",
      measure: "Leakage warnings, class distribution, residual summary, and model-card exclusions",
      passCriterion: "Every warning is resolved or retained as a visible limitation."
    }
  ],
  sequence: [
    {
      id: "ml-question-data",
      title: "Define the question and data scope",
      action: "Record target, features, sample unit, ordering, exclusions, and decision consequence.",
      verification: "Feature provenance and target timing are explicit.",
      outputs: ["Data notebook record", "Schema table"]
    },
    {
      id: "ml-split",
      title: "Split deterministically",
      action: "Create ordered train, validation, and test partitions before fitting or threshold selection.",
      verification: "Counts reconcile and unique IDs do not overlap.",
      outputs: ["Split manifest", "Leakage diagnostic"]
    },
    {
      id: "ml-baseline-model",
      title: "Evaluate baseline and candidate",
      action: "Fit on train, select using validation, and report the unchanged final candidate on test.",
      verification: "Baseline and candidate metrics use identical held-out rows.",
      outputs: ["Metric table", "Residual or confusion table"]
    },
    {
      id: "ml-card",
      title: "Report limitations",
      action: "Record imbalance, residual behaviour, leakage checks, intended use, and out-of-scope decisions.",
      verification: "Claims remain bounded to the declared local dataset and split.",
      outputs: ["Model card", "Evidence rubric"]
    }
  ],
  equations: [
    {
      id: "ml-mse",
      expression: "MSE = sum((yi - yhat_i)^2)/n",
      variables: [
        { symbol: "y", quantity: "observed target", siUnit: "target SI unit" },
        { symbol: "yhat", quantity: "predicted target", siUnit: "target SI unit" },
        { symbol: "n", quantity: "held-out sample count", siUnit: "1" }
      ],
      assumptions: ["Predictions and observations are paired at the same grain", "All included rows share target units"],
      validWhen: ["n is greater than zero", "Missing or invalid rows are handled explicitly"]
    },
    {
      id: "ml-precision-recall",
      expression: "precision = TP/(TP + FP); recall = TP/(TP + FN)",
      variables: [
        { symbol: "TP", quantity: "true-positive count", siUnit: "1" },
        { symbol: "FP", quantity: "false-positive count", siUnit: "1" },
        { symbol: "FN", quantity: "false-negative count", siUnit: "1" }
      ],
      assumptions: ["Positive class is declared", "Each held-out sample contributes to exactly one confusion cell"],
      validWhen: ["Counts reconcile to the held-out sample count", "Zero denominators are reported with the declared convention"]
    }
  ],
  deterministicWorkflow: {
    inputs: ["Ordered rows with unique IDs", "Feature names", "Target", "Split ratios", "Candidate predictions", "Class threshold"],
    steps: [
      "Validate finite values, unique IDs, feature presence, and partition ratios.",
      "Create ordered train, validation, and test partitions.",
      "Run leakage-name and partition-overlap checks.",
      "Calculate a training-only baseline and candidate held-out metrics.",
      "Report residuals or confusion counts, imbalance warnings, and model-card limitations."
    ],
    expectedOutputs: ["Split manifest", "Warning list", "Baseline metrics", "Candidate metrics", "Residual or confusion table", "Model card"]
  },
  challenge: {
    prompt: "Show whether a transparent candidate improves on a fixed baseline without leakage and without overstating the held-out evidence.",
    constraints: [
      "Do not fit or select using test rows.",
      "Do not remove a leakage or imbalance warning merely to obtain a pass.",
      "Report counts as well as rates for classification."
    ],
    knownPassCriteria: [
      "Source count equals train plus validation plus test counts.",
      "No sample ID appears in more than one partition.",
      "Baseline and candidate use the same validation and test rows.",
      "Confusion counts reconcile or regression residuals map one-to-one to held-out rows.",
      "The model card states intended use, data scope, limitations, and out-of-scope decisions."
    ]
  },
  failureStates: [
    {
      id: "ml-leakage",
      condition: "A feature carries target, label, outcome, future, or cross-partition information.",
      diagnosis: "Held-out performance may reflect information unavailable at prediction time.",
      repair: "Remove or rederive the feature from valid prior information, rebuild the split, and rerun all metrics."
    },
    {
      id: "ml-imbalance",
      condition: "Minority class share is below the stated threshold.",
      diagnosis: "Aggregate accuracy can hide poor minority-class behaviour.",
      repair: "Retain class counts, report class-sensitive metrics, and bound conclusions to the observed support."
    },
    {
      id: "ml-baseline-not-beaten",
      condition: "The candidate does not improve the declared held-out metric over the training-only baseline.",
      diagnosis: "Added model complexity is not supported by the current evidence.",
      repair: "Keep the baseline, inspect residuals and data quality, and change the model only with a testable rationale."
    }
  ],
  linkedApplication: {
    projectId: "predictive-maintenance",
    labId: "ml",
    application: "Use the predictive-maintenance data study to test leakage, degradation baselines, anomaly metrics, and bounded remaining-life claims."
  },
  evidenceRubric: [
    {
      criterion: "Partition integrity",
      requiredEvidence: "Ordered source IDs and train, validation, and test manifests",
      passCondition: "Counts reconcile and IDs do not overlap."
    },
    {
      criterion: "Fair baseline comparison",
      requiredEvidence: "Training-only baseline plus candidate validation and test metrics",
      passCondition: "Identical held-out rows and metric definitions are used."
    },
    {
      criterion: "Bounded claims",
      requiredEvidence: "Warnings, residuals or confusion counts, and complete model card",
      passCondition: "Known limitations and out-of-scope uses remain explicit."
    }
  ],
  outputs: standardOutputs,
  accessibleAlternatives: [
    {
      forOutput: "Residual plot",
      tableColumns: ["sample ID", "observed target", "predicted target", "residual", "partition"],
      textSummary: "State held-out sample count, mean squared error, residual range, and any visible pattern."
    },
    {
      forOutput: "Confusion matrix heatmap",
      tableColumns: ["actual class", "predicted class", "count"],
      textSummary: "State TP, FP, TN, FN, accuracy, precision, recall, and positive-class definition."
    },
    {
      forOutput: "Class distribution chart",
      tableColumns: ["partition", "class", "count", "share"],
      textSummary: "State each partition count and whether the minority-share warning triggered."
    }
  ],
  safetyBoundary:
    "This local educational workflow does not establish production readiness, causal validity, safety assurance, or authority for autonomous decisions."
};

export const flagshipWorkflowSpecifications: readonly FlagshipWorkflowSpecification[] = [
  controlsFlagship,
  roboticsFlagship,
  embeddedFlagship,
  mechanicalFlagship,
  mlFlagship
];

export const flagshipSpecifications = flagshipWorkflowSpecifications;

export function getFlagshipWorkflow(id: string): FlagshipWorkflowSpecification | undefined {
  return flagshipWorkflowSpecifications.find((workflow) => workflow.id === id);
}
