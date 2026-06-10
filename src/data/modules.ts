// Module content: every lab follows the Learn/Simulate/Challenge/Diagnose/
// Build/Evidence/Reflect/Next structure rendered by ModuleShell.

export interface ChallengeSpec {
  id: string;
  title: string;
  task: string;
  passCriteria: string;
}

export interface ModuleContent {
  id: string;
  title: string;
  domainId: string;
  route: string;
  learn: string[];
  challenges: ChallengeSpec[];
  diagnose: { fault: string; cause: string }[];
  build: string;
  evidence: string[];
  reflect: string;
  next: { label: string; route: string };
}

export const modules: ModuleContent[] = [
  {
    id: "pid",
    title: "PID Control Lab",
    domainId: "controls",
    route: "/labs/pid",
    learn: [
      "A PID controller computes its output from the error e = setpoint − process variable: u = Kp·e + Ki·∫e dt + Kd·de/dt.",
      "Proportional action gives immediate correction but leaves steady-state error on most plants. Integral action removes steady-state error but adds phase lag and can cause windup when the actuator saturates. Derivative action damps oscillation but amplifies measurement noise.",
      "A first-order plant (τ·dy/dt + y = u) cannot overshoot under P-only control; a second-order plant (defined by natural frequency and damping ratio ζ) can oscillate. Key step metrics: rise time (10–90%), overshoot, 2% settling time and steady-state error.",
      "This simulator includes actuator saturation with basic anti-windup, and a step disturbance input so you can study regulation as well as tracking."
    ],
    challenges: [
      { id: "pid-c1", title: "P-only steady-state error", task: "Set Ki = 0 and Kd = 0 on the first-order plant. Increase Kp and watch steady-state error.", passCriteria: "Demonstrate steady-state error below 0.1 with Kp alone, and state why it never reaches exactly zero." },
      { id: "pid-c2", title: "Tame the overshoot", task: "On the second-order plant (ζ = 0.4), tune Kp, Ki, Kd for the metrics shown.", passCriteria: "Overshoot < 10% AND settling time < 4 s AND |steady-state error| < 0.02." },
      { id: "pid-c3", title: "Disturbance rejection", task: "Apply a disturbance of 0.5 at t = 10 s. Tune so the PV recovers quickly.", passCriteria: "PV returns within ±2% of setpoint within 3 s of the disturbance, without sustained oscillation." }
    ],
    diagnose: [
      { fault: "Sustained oscillation that never settles", cause: "Loop gain too high (Kp or Ki excessive) for the plant's phase lag — the closed loop is near instability." },
      { fault: "PV creeps to setpoint very slowly after the step", cause: "Integral gain too low to remove the residual error in reasonable time, or actuator saturated (check control effort plot)." },
      { fault: "Control effort flat-lines at the limit while error persists", cause: "Actuator saturation; without anti-windup the integral keeps accumulating and causes large overshoot on recovery." },
      { fault: "Noisy, spiky control effort", cause: "Derivative gain amplifying high-frequency content; reduce Kd or filter the derivative." }
    ],
    build: "Build a hardware PID demo: a fan levitating a ball, or a Peltier/heater temperature loop on a microcontroller. Log setpoint, PV and effort to CSV and reproduce the metrics this lab computes.",
    evidence: ["Screenshot of each passed challenge with metrics visible", "Table of final gains with one-line justification each", "Short note on what saturation did to your tuning"],
    reflect: "Which gain did you over-rely on, and what did the metrics tell you when you backed it off?",
    next: { label: "PLC & SCADA Lab — apply control thinking to a process", route: "/labs/plc" }
  },
  {
    id: "electrical",
    title: "Electrical & Electronics Lab",
    domainId: "electrical",
    route: "/labs/electrical",
    learn: [
      "Ohm's law (V = IR) and power (P = VI) govern every resistive interface. A voltage divider Vout = Vin·R2/(R1+R2) is the simplest sensor interface, but its output impedance interacts with whatever you connect to it.",
      "An RC circuit charges as v(t) = Vs(1 − e^(−t/RC)); after one time constant τ = RC it reaches 63.2%. The same RC acts as a low-pass filter with cutoff fc = 1/(2πRC), passing slow signals and attenuating fast noise.",
      "A series RLC circuit is the electrical twin of the spring-mass-damper: damping ratio ζ = (R/2)·√(C/L) decides whether the step response rings (underdamped), is fastest without ringing (critically damped) or is sluggish (overdamped).",
      "ADCs quantise: an N-bit converter over Vref has a step (LSB) of Vref/2^N. Resolution, divider scaling and filtering together set how faithfully firmware sees the real world."
    ],
    challenges: [
      { id: "elec-c1", title: "3.3 V interface design", task: "Use the divider tool to bring a 5 V signal to ≤ 3.3 V.", passCriteria: "Output between 3.2 V and 3.3 V using standard-looking resistor values; state the divider's current draw." },
      { id: "elec-c2", title: "Kill the 1 kHz noise", task: "With the RC filter, attenuate a 1 kHz signal to below 10% while keeping a 10 Hz signal above 99%.", passCriteria: "Show both gains from the filter readout with a single R and C choice." },
      { id: "elec-c3", title: "Name that regime", task: "Adjust R in the RLC tool to produce all three damping regimes.", passCriteria: "Record the R value at which the response becomes critically damped (ζ = 1) within ±10%." }
    ],
    diagnose: [
      { fault: "Divider output sags when connected to a load", cause: "Load impedance comparable to R2 — the divider's output impedance is too high for the load." },
      { fault: "RC filter passes noise you expected it to remove", cause: "Cutoff set too high relative to the noise frequency; one pole only gives −20 dB/decade." },
      { fault: "ADC reading toggles between adjacent codes", cause: "Input noise near the LSB size, or signal sitting exactly on a code boundary — normal quantisation behaviour." },
      { fault: "RLC output rings violently", cause: "Very low resistance gives low ζ; energy sloshes between L and C with little dissipation." }
    ],
    build: "Wire a thermistor divider into a microcontroller ADC, add an RC anti-noise filter, and log temperature for 24 hours. Compare measured ripple with the filter gain this lab predicts.",
    evidence: ["Divider design with loading and current calculations", "Filter design table (fc, gains at signal and noise frequencies)", "RLC regime screenshots with ζ values"],
    reflect: "Where did an ideal-component assumption in the simulator differ from what you'd expect on a real bench?",
    next: { label: "Embedded Systems Lab — read those sensors in firmware", route: "/labs/embedded" }
  },
  {
    id: "embedded",
    title: "Embedded Systems Lab",
    domainId: "embedded",
    route: "/labs/embedded",
    learn: [
      "A finite state machine makes firmware behaviour explicit: states, events and transitions. Anything not in the transition table simply cannot happen, which is exactly what you want near hardware.",
      "Mechanical switch contacts bounce for 1–20 ms. Firmware must ignore changes until the input has been stable for a hold time, or one press becomes many. The debounce simulator lets you watch raw vs debounced edges.",
      "Polling checks an input every loop iteration: worst-case latency is one full poll period plus handler time. An interrupt responds in microseconds but adds concurrency hazards. The latency simulator quantifies the trade-off.",
      "UART frames each byte with start/stop bits (asynchronous, LSB first). SPI shifts bits on a clock with a chip-select (fast, full-duplex, more pins). I2C shares two wires with addresses and ACKs (slower, multi-device). The timing diagrams show each frame structure."
    ],
    challenges: [
      { id: "emb-c1", title: "Fault-tolerant FSM", task: "Drive the traffic-light FSM through a full cycle, inject a fault from each state, and recover.", passCriteria: "Event trace shows fault entry from RED, GREEN and YELLOW, each followed by reset to RED, with zero rejected events." },
      { id: "emb-c2", title: "Debug the ghost presses", task: "With bounce enabled, find the shortest debounce hold time that yields exactly one rising edge per press.", passCriteria: "Debounced edge count equals 1 while raw edge count is greater than 1; report the hold time used." },
      { id: "emb-c3", title: "Meet the deadline", task: "A safety input must be serviced within 1 ms. Handler takes 0.2 ms.", passCriteria: "Using the latency tool, show the maximum poll period that still meets 1 ms worst-case, and the interrupt alternative." }
    ],
    diagnose: [
      { fault: "One button press registers as several", cause: "Contact bounce faster than the debounce hold time (or no debouncing at all)." },
      { fault: "Debounced output misses short presses entirely", cause: "Hold time longer than the press duration — debounce is a low-pass filter on edges." },
      { fault: "Intermittently missed events under polling", cause: "Event shorter than the poll period; it comes and goes between samples." },
      { fault: "I2C bus hangs with SDA stuck low", cause: "A device half-finished a byte when the master reset; clock pulses are needed to free it — a classic real-world fault." }
    ],
    build: "On any dev board, implement the traffic-light FSM with a debounced mode button and a UART status output. Capture the UART frames with a logic analyser and compare against the timing diagram here.",
    evidence: ["FSM event trace screenshot covering fault recovery", "Debounce hold-time experiment table", "Latency calculation justifying interrupt vs polling for your build"],
    reflect: "What failure did the simulator make obvious that you would previously have found only by debugging on hardware?",
    next: { label: "Robotics Lab — coordinate motors and sensors in time", route: "/labs/robotics" }
  },
  {
    id: "plc",
    title: "PLC & SCADA Lab",
    domainId: "plc",
    route: "/labs/plc",
    learn: [
      "A PLC executes a scan cycle: read inputs, evaluate logic, write outputs, repeat. The conveyor logic here mirrors a classic seal-in rung: (Start OR Running) AND NOT Stop AND interlocks healthy → Motor.",
      "Interlocks prevent unsafe operation: a guard switch inhibits starting, an emergency stop and jam sensor latch a fault. Latched faults must be reset deliberately, and only after the cause is removed — this is fundamental to safe machine behaviour.",
      "The tank process shows level control with alarm limits: high and low alarms inform the operator; the high-high limit is a protective trip that forces the fill valve closed and stays latched.",
      "SCADA layers on top: the HMI panel shows live state, the alarm list shows active abnormal conditions, and the trend records process history for diagnosis. Good alarm design means every alarm is meaningful and actionable."
    ],
    challenges: [
      { id: "plc-c1", title: "Normal operation", task: "Start the conveyor, run it, and stop it cleanly. Then fill the tank to 70% and hold it between 60–80% using the valves.", passCriteria: "No alarms raised during the entire sequence." },
      { id: "plc-c2", title: "Interlock failure drill", task: "While running, trigger the jam sensor. Attempt a restart without clearing the jam, then recover correctly.", passCriteria: "Conveyor refuses to restart until jam cleared AND reset pressed; describe the latch behaviour." },
      { id: "plc-c3", title: "Stuck-valve trip test", task: "Open the fill valve and leave it open (simulating a stuck-open valve).", passCriteria: "High-high trip closes the valve before 100%, the trip stays latched, and level can be drained safely." }
    ],
    diagnose: [
      { fault: "Conveyor stops and won't restart after E-stop release", cause: "Fault is latched by design — releasing the E-stop is not a reset. This is correct behaviour, not a bug." },
      { fault: "Tank overflows in a real plant despite a high alarm", cause: "Alarms inform; they don't act. Protection requires an automatic trip (the high-high latch), not operator attention." },
      { fault: "Motor chatters on and off near the stop button", cause: "Stop contact wired as normally-open in logic expecting normally-closed — fail-safe convention violated." },
      { fault: "Alarm flood during an upset", cause: "Alarms without prioritisation or suppression; each consequence alarms separately instead of the root cause." }
    ],
    build: "Recreate the conveyor logic in OpenPLC or a vendor simulator using ladder logic, with the same interlocks. Write and execute a FAT script that covers every challenge in this module.",
    evidence: ["Interlock test record (challenge 2)", "Trip validation record (challenge 3)", "FAT checklist for the conveyor generated in the Practice Lab"],
    reflect: "Which unsafe state surprised you, and what design principle prevents it?",
    next: { label: "Systems & Practice Lab — document it like a professional", route: "/labs/practice" }
  },
  {
    id: "robotics",
    title: "Robotics Lab",
    domainId: "robotics",
    route: "/labs/robotics",
    learn: [
      "A differential-drive robot moves with linear velocity v = (vR + vL)/2 and turns at ω = (vR − vL)/L, where L is the wheel base. Equal speeds drive straight; opposite speeds spin in place.",
      "Odometry integrates wheel motion to estimate pose. Wheel slip and encoder noise make the estimate drift without bound — the simulator overlays true pose against noisy odometry so you can watch the divergence grow.",
      "Waypoint following uses a simple proportional steering law: compute the heading error to the target and command a wheel-speed difference proportional to it. Gain too low corners lazily; too high oscillates around the path.",
      "A* plans a shortest path over a grid by expanding nodes ordered by cost-so-far plus a heuristic (Manhattan distance here). The planner gives waypoints; the controller above follows them; obstacle proximity triggers avoidance."
    ],
    challenges: [
      { id: "rob-c1", title: "Drive a square", task: "Using manual wheel speeds only, drive an approximate 2 m square and return near the start.", passCriteria: "Final true position within 0.5 m of the start point." },
      { id: "rob-c2", title: "Waypoint course", task: "Run the waypoint follower around the default course with odometry noise enabled.", passCriteria: "All waypoints reached; report the final odometry-vs-true error distance." },
      { id: "rob-c3", title: "Plan and execute", task: "Use the A* planner on the obstacle map, then follow the planned path.", passCriteria: "Robot reaches the goal cell without its true position entering any obstacle." }
    ],
    diagnose: [
      { fault: "Robot curves when commanded straight", cause: "Wheel speed mismatch (calibration or noise) — exactly why odometry-only navigation drifts." },
      { fault: "Robot orbits a waypoint without reaching it", cause: "Steering gain too high relative to speed, or reached-radius too small for the turning capability." },
      { fault: "Odometry says 'arrived', robot is visibly elsewhere", cause: "Accumulated integration error; odometry needs periodic correction from an absolute reference." },
      { fault: "A* returns no path", cause: "Goal enclosed by obstacles or start/goal cell itself blocked — check the map, not the algorithm." }
    ],
    build: "Build a two-motor robot (any kit) with encoders. Implement odometry and a waypoint follower, then measure real drift over a 10 m course against a tape measure ground truth.",
    evidence: ["Square-drive trajectory screenshot", "Odometry drift measurement table", "Planned vs executed path comparison image"],
    reflect: "How did watching odometry drift change how much you would trust dead reckoning on a real platform?",
    next: { label: "AI/ML Lab — make sense of the data your robot produces", route: "/labs/ml" }
  },
  {
    id: "ml",
    title: "AI / ML Lab",
    domainId: "aiml",
    route: "/labs/ml",
    learn: [
      "Linear regression fits y = mx + b by minimising squared error. The closed-form least-squares solution needs no iteration; understanding it demystifies 'training'. Evaluate with MSE and R² on held-out test data, never on training data alone.",
      "Classification assigns labels. k-nearest-neighbours votes among the k closest training points — simple, but it exposes every core concept: decision boundaries, overfitting (k too small) and underfitting (k too large).",
      "A confusion matrix splits results into true/false positives/negatives. Precision (of flagged items, how many were real?) and recall (of real items, how many were flagged?) trade off — in maintenance, a missed failure usually costs more than a false alarm.",
      "Anomaly detection here uses z-scores: points more than N standard deviations from the mean are flagged. The predictive-maintenance demo fits a degradation trend and extrapolates remaining useful life. These demos are educational only — real safety decisions need engineered systems, validated data and professional judgement, not a toy model."
    ],
    challenges: [
      { id: "ml-c1", title: "Interpret the fit", task: "Fit the regression demo, then change the noise level and refit.", passCriteria: "Report slope, R² at two noise levels and explain why R² fell while the slope barely moved." },
      { id: "ml-c2", title: "Tune k honestly", task: "Vary k in the classifier and watch test accuracy and the confusion matrix.", passCriteria: "Identify a k where test accuracy ≥ 85% and explain the failure mode at k = 1." },
      { id: "ml-c3", title: "Catch the fault, predict the failure", task: "Set the anomaly threshold to flag all injected spikes with zero false positives, then read the RUL estimate.", passCriteria: "All injected anomalies detected, zero false positives, and a stated RUL with one limitation of the linear-degradation assumption." }
    ],
    diagnose: [
      { fault: "Great training accuracy, poor test accuracy", cause: "Overfitting — the model memorised noise. In kNN, k too small; in general, model too flexible for the data volume." },
      { fault: "Anomaly detector flags nothing", cause: "Threshold too high, or the anomalies inflate the standard deviation used to score them (masking)." },
      { fault: "High accuracy but the model is useless", cause: "Class imbalance — predicting 'no fault' always scores 95% if faults are 5% of data. Check recall, not accuracy." },
      { fault: "RUL estimate wildly optimistic", cause: "Linear extrapolation of a nonlinear degradation process; the model assumption, not the maths, is wrong." }
    ],
    build: "Log real data from any sensor (CPU temperature counts!) for a week. Fit a trend, define an anomaly rule, and write one page on where your model would mislead an operator.",
    evidence: ["Regression interpretation note (challenge 1)", "k-tuning table with confusion matrices", "Anomaly/RUL mini report including a limitations section"],
    reflect: "Where is the line between a useful engineering indicator and a model you should not trust for decisions?",
    next: { label: "Back to the dashboard — log your evidence", route: "/" }
  },
  {
    id: "mechanical",
    title: "Mechanical & Dynamics Lab",
    domainId: "mechanical",
    route: "/labs/mechanical",
    learn: [
      "A gear pair with ratio N = T_out/T_in divides speed and multiplies torque by N (ideally, with no losses): power in equals power out, P = Tω. Every drivetrain decision is a torque-speed trade at constant power.",
      "Mechanical power in SI: P (W) = T (Nm) × ω (rad/s); with rpm, P = T·rpm·2π/60. Motors have torque-speed curves; gearboxes move the operating point to where the load needs it.",
      "The spring-mass-damper m·ẍ + c·ẋ + k·x = 0 is the canonical second-order system. Natural frequency ωn = √(k/m); damping ratio ζ = c/(2√(km)). Underdamped systems ring at the damped frequency; engineers usually target ζ ≈ 0.4–0.7.",
      "Vibration problems are usually frequency problems: if excitation frequency approaches ωn, amplitude grows (resonance). Fixes change m, k, or add damping — the explorer shows how each parameter moves the frequency."
    ],
    challenges: [
      { id: "mech-c1", title: "Gearbox sizing", task: "A motor gives 0.5 Nm at 3000 rpm. The load needs ≥ 6 Nm.", passCriteria: "Select a tooth-count pair giving ≥ 6 Nm output, and state the resulting output speed and (ideal) power check." },
      { id: "mech-c2", title: "Hit critical damping", task: "With m = 2 kg and k = 200 N/m, adjust damping c to reach ζ = 1.", passCriteria: "c within ±5% of the analytic critical value (compute it first: c = 2√(km))." },
      { id: "mech-c3", title: "Detune the resonance", task: "A machine mount has fn near a 10 Hz excitation. Change k or m to move fn at least 30% away.", passCriteria: "New fn ≤ 7 Hz or ≥ 13 Hz, with the parameter change stated and justified." }
    ],
    diagnose: [
      { fault: "Geared-down axis is strong but uselessly slow", cause: "Ratio chosen for torque only; the speed requirement was never written down. Requirements first." },
      { fault: "Structure vibrates worst at one specific motor speed", cause: "Excitation passing through a structural natural frequency — classic resonance crossing." },
      { fault: "Simulated oscillation grows instead of decaying", cause: "Numerical instability: time step too large for the system's frequency (Euler integration limit), not physics." },
      { fault: "Added stiffness made vibration worse", cause: "Raising k raised fn into the excitation band instead of out of it — direction matters." }
    ],
    build: "Characterise a real spring (rubber band + mass works): measure oscillation frequency by phone slow-motion video, back-calculate k, and compare with a static deflection measurement.",
    evidence: ["Gearbox sizing sheet (challenge 1)", "Critical damping calculation vs simulation screenshot", "Resonance detuning note with before/after fn"],
    reflect: "Which mechanical intuition did the second-order maths confirm, and which did it correct?",
    next: { label: "PID Control Lab — same equations, now with feedback", route: "/labs/pid" }
  },
  {
    id: "practice",
    title: "Systems & Professional Practice Lab",
    domainId: "documentation",
    route: "/labs/practice",
    learn: [
      "Requirements traceability links every requirement to the test that proves it. If a requirement has no test, it isn't verified; if a test has no requirement, ask what it's for. The matrix builder here enforces that link.",
      "FMEA (Failure Modes and Effects Analysis) asks, for each component or function: how can it fail, what happens, how bad (Severity), how often (Occurrence), how detectable (Detection)? RPN = S×O×D ranks where to act first.",
      "A risk register tracks project risks (not just technical failures): description, likelihood, impact, owner and mitigation. A decision log records what was decided, when, by whom and why — future-you's best friend.",
      "FAT (Factory Acceptance Test) proves the system works before shipping; SAT (Site Acceptance Test) proves it works installed. Both are scripted checklists with expected results and sign-off. These tools produce real portfolio artefacts you can export."
    ],
    challenges: [
      { id: "prac-c1", title: "Trace the conveyor", task: "Write 5 requirements for the PLC Lab conveyor and trace each to a test you actually ran.", passCriteria: "Matrix has ≥ 5 rows, every requirement has a linked test and a pass/fail result." },
      { id: "prac-c2", title: "FMEA the tank", task: "Build an FMEA for the tank process with at least 5 failure modes.", passCriteria: "All rows scored for S, O, D; the highest-RPN item has a stated mitigation." },
      { id: "prac-c3", title: "Run a FAT", task: "Generate a FAT checklist for the conveyor and execute it against the PLC Lab.", passCriteria: "Every checklist item marked with a result; failures (if any) have notes." }
    ],
    diagnose: [
      { fault: "Project 'done' but client rejects it", cause: "No agreed acceptance criteria — requirements were never written as testable statements." },
      { fault: "FMEA full of RPN numbers, nothing changed", cause: "Analysis performed as paperwork; no mitigation actions assigned or tracked to closure." },
      { fault: "Same design argument re-litigated monthly", cause: "No decision log — the rationale evaporated and the debate restarts from zero." },
      { fault: "Site commissioning finds basic faults", cause: "FAT skipped or rubber-stamped; problems that were cheap in the factory became expensive on site." }
    ],
    build: "Take any past university or personal project and retrofit professional artefacts: 10 requirements, a traceability matrix, an FMEA and a one-page decision log. This is a portfolio piece in itself.",
    evidence: ["Exported traceability matrix (JSON)", "Exported FMEA with mitigations", "Completed FAT checklist with results"],
    reflect: "Which artefact would have most improved a past project of yours, and what did it cost you not to have it?",
    next: { label: "Dashboard — review your domain scores and plan the next sprint", route: "/" }
  }
];

export function moduleById(id: string): ModuleContent | undefined {
  return modules.find((m) => m.id === id);
}
