import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
  type AcademyDomainRelationTuple,
  type AcademyDomainTermTuple,
  type AcademyLessonTeachingProfileV2Registry
} from "../../lessonTeachingProfileV2";
import {
  academyLessonV2TextRef,
  materialiseAcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2CompactPlan,
  type AcademyLessonV2InstructionPlan
} from "../../lessonTeachingProfileV2Authoring";
import {
  expandAcademyLessonTeachingProfileV2Seed
} from "../../lessonTeachingProfileV2Validation";

type CaseSource = Readonly<{
  scenario: string;
  givenLabel: string;
  givenValue: string;
  givenUnit: string | null;
  reasoning: readonly [string, string, string];
  outcome: string;
  criterion: string;
  verification: string;
}>;

type LessonSource = Readonly<{
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly [
    readonly [string, string, string],
    readonly [string, string, string],
    readonly [string, string, string]
  ];
  entities: readonly [
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string]
  ];
  relations: readonly [
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ]
  ];
  conditions: readonly [
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string]
  ];
  failure: readonly [string, string, string];
  conceptualSteps: readonly [string, string, string, string, string];
  example: CaseSource;
  counterexample: CaseSource;
  misconception: Readonly<{
    claim: string;
    mechanism: string;
    correction: string;
    disconfirmingObservation: string;
  }>;
  assessmentMoves: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  variant: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}>;

const lessonSources = [
  {
    lessonId: "EML-E2-D16-L01",
    systemModel: "A physical dynamic model selects states, inputs, parameters, conservation laws and constitutive relations to describe how a plant evolves under stated simplifications.",
    failurePattern: "A model can fit one trajectory while its omitted storage, nonlinear loss or parameter dependence makes predictions fail under a changed input.",
    visualExplanation: "A physical boundary maps energy storage and flow to state variables and differential equations, with omitted effects listed outside the model boundary.",
    applicationTask: "Derive a low-order thermal or motor model, justify each state and simplification and test its prediction under a second operating condition.",
    terms: [
      ["State variable", "A minimum stored quantity which, together with future input, is sufficient to predict model evolution.", "The chosen state is relative to the model boundary and assumptions, not every possible physical detail."],
      ["Conservation law", "A balance stating that stored quantity changes through inflow, outflow, generation or consumption.", "Signs, reference directions and units must be consistent across the boundary."],
      ["Constitutive relation", "A model linking physical variables through material or component behaviour, such as heat loss proportional to temperature difference.", "Its parameter and linear form are valid only over a stated operating range."]
    ],
    entities: [
      ["input", "Applied heater power", "The controlled energy-flow input to a thermal body."],
      ["mechanism", "Energy-balance equation", "The conservation law connecting power, stored energy and heat loss."],
      ["state", "Body temperature state", "The stored thermal condition needed to predict future temperature."],
      ["observation", "Measured temperature response", "Time-aligned temperature data under known input."],
      ["decision", "Accepted first-order model", "The model retained after physical and independent prediction checks."]
    ],
    relations: [
      ["maps", "applied heater power maps into the energy-balance boundary", "directed", "many-to-one"],
      ["causes", "the energy balance causes the temperature-state rate of change", "directed", "many-to-one"],
      ["transforms", "the temperature state transforms stored energy and loss into future response", "directed", "many-to-one"],
      ["supports", "the measured temperature response supports model acceptance", "directed", "many-to-one"],
      ["invalidates", "omitted storage or changing loss invalidates the first-order model", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "The physical body, heat flows, reference temperature, units and operating range are declared."],
      ["assumption", "One lumped temperature and approximately linear heat loss are adequate over the tested range."],
      ["criterion", "Parameters are physically plausible and an independent input produces response within tolerance."],
      ["operating-state", "The altered case applies much higher power where radiation and internal gradients are no longer negligible."]
    ],
    failure: [
      "A curve is fitted without a physical boundary, allowing omitted storage or changing loss to hide inside nominal parameters.",
      "The model predicts the calibration case but fails under a different power or initial temperature.",
      "Reject the model until state choice, balance, parameter units and independent operating evidence agree."
    ],
    conceptualSteps: [
      "Draw the plant boundary and label every energy flow, stored quantity and reference direction.",
      "Choose the smallest state set that captures material storage for the intended prediction.",
      "Write the conservation law and each constitutive relation with consistent signs and units.",
      "Estimate or measure parameters and compare one response with the model.",
      "Challenge the simplifications using a second input or operating condition before accepting the model."
    ],
    example: {
      scenario: "A small heated aluminium block is modelled by one temperature state, heater power and linear ambient loss.",
      givenLabel: "Thermal experiment",
      givenValue: "bounded power step, ambient temperature and body temperature trace",
      givenUnit: null,
      reasoning: [
        "Define the block boundary and balance heater inflow against stored energy and ambient heat loss.",
        "Use thermal capacitance and loss coefficient with dimensions consistent with temperature rate.",
        "Fit one record and predict a different bounded power step without changing parameters."
      ],
      outcome: "The first-order model predicts both heating and settling within the declared temperature range.",
      criterion: "Balance, parameter units and independent response error must satisfy the model-purpose limits.",
      verification: "Check steady gain and time constant separately against measured second-step data."
    },
    counterexample: {
      scenario: "Parameters fitted at low power are used unchanged at a temperature where radiation and internal gradients dominate.",
      givenLabel: "Changed operating range",
      givenValue: "high power and large temperature difference",
      givenUnit: null,
      reasoning: [
        "The altered case violates the lumped linear-loss assumption.",
        "Changing loss and spatial temperature cannot be represented by the one retained state and constant coefficient.",
        "A good low-power fit therefore cannot satisfy the high-power prediction criterion."
      ],
      outcome: "The model under-predicts peak temperature and settling time.",
      criterion: "A model is accepted only inside the operating region where its state and constitutive assumptions remain supported.",
      verification: "Measure internal and surface temperatures across power levels and inspect parameter consistency."
    },
    misconception: {
      claim: "A model that matches one measured curve is physically correct.",
      mechanism: "Parameter fitting is mistaken for validation of the boundary, state choice and constitutive assumptions.",
      correction: "Derive the balance, check dimensions and challenge the model with independent conditions.",
      disconfirmingObservation: "The same fitted parameters fail on a second power level while another empirical curve fits the first record equally well."
    },
    assessmentMoves: [
      "sequencing a thermal boundary into a differential model",
      "recovering from a high-power model failure",
      "screening physical models through balance and prediction",
      "diagnosing an omitted storage mode",
      "explaining curve fit apart from physical validity",
      "matching parameters to units and operating assumptions",
      "reading energy flow state and response together",
      "revealing nonlinear loss beyond the calibration range"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D16-L02",
    systemModel: "Feedback compares measured output with reference, transforms error into actuator command and shapes rise, overshoot, settling and steady-state error through the closed loop.",
    failurePattern: "Improving one transient metric can increase actuator demand, overshoot or noise sensitivity, and an attractive nominal response may hide a persistent offset.",
    visualExplanation: "A closed-loop block diagram is aligned with a response plot marking reference, error, rise, overshoot, settling, steady-state offset and control effort.",
    applicationTask: "Compare two feedback gains on the same plant, measure transient and steady-state criteria and reject any case that violates actuator limits.",
    terms: [
      ["Feedback", "The use of measured output to influence the command applied to a system.", "Incorrect sign, scaling, delay or sensor failure can turn intended correction into harmful action."],
      ["Transient response", "The time-varying behaviour after a command or disturbance before a settled condition is reached.", "Rise, overshoot and settling must be defined using explicit thresholds and observation duration."],
      ["Steady-state error", "The remaining difference between reference and output after transient effects are acceptably settled.", "A short plateau or saturated actuator does not prove a true steady state."]
    ],
    entities: [
      ["input", "Reference command", "The desired bounded plant output over time."],
      ["mechanism", "Feedback controller and plant", "The path from error through command, actuator and physical response."],
      ["state", "Closed-loop error state", "Reference minus measured output with sign and unit."],
      ["observation", "Response and effort record", "Output, error and actuator command over the evaluation interval."],
      ["decision", "Accepted feedback gain", "The gain retained when response and actuator criteria both pass."]
    ],
    relations: [
      ["maps", "the reference command maps into a signed closed-loop error", "directed", "many-to-one"],
      ["feeds-back", "the measured output feeds back through the controller and plant", "directed", "many-to-one"],
      ["causes", "the error state causes bounded actuator and plant response", "directed", "one-to-many"],
      ["measures", "the response and effort record measures transient and steady criteria", "directed", "many-to-one"],
      ["invalidates", "wrong sign, saturation or hidden offset invalidates the gain decision", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Reference, measured output and error use compatible units, sign and timing."],
      ["boundary", "Actuator magnitude, rate, plant operating range and evaluation duration are declared."],
      ["criterion", "Rise, overshoot, settling, steady error and control effort all meet their limits."],
      ["operating-state", "The altered case increases gain until the actuator saturates during most of the transient."]
    ],
    failure: [
      "Gain is judged from output speed alone while effort, saturation, overshoot and final offset are omitted.",
      "A faster nominal curve consumes unavailable actuator authority and degrades recovery.",
      "Reject the gain until response and effort criteria pass for command and disturbance cases."
    ],
    conceptualSteps: [
      "Define reference, measured output, error sign and physical units.",
      "Trace the closed loop through controller, actuator, plant and sensor.",
      "Apply the same bounded command and disturbance to each candidate gain.",
      "Measure rise, overshoot, settling, steady error and actuator effort using declared rules.",
      "Retain a gain only inside the actuator and operating boundaries with adequate margin."
    ],
    example: {
      scenario: "Two proportional gains are compared on the same speed-control plant and actuator limit.",
      givenLabel: "Closed-loop trial",
      givenValue: "one speed step, one load disturbance and recorded effort",
      givenUnit: null,
      reasoning: [
        "Verify feedback sign and use the same initial state, reference and disturbance.",
        "Measure transient and steady criteria together with peak and sustained command.",
        "Reject the faster gain if its response depends on saturation or exceeds effort limits."
      ],
      outcome: "The selected gain improves tracking while retaining bounded effort and acceptable transient shape.",
      criterion: "Every response and actuator metric must pass on the common experiment.",
      verification: "Repeat with an independent reference amplitude and parameter variation inside the stated range."
    },
    counterexample: {
      scenario: "A high gain is selected because it initially rises fastest, although its actuator is saturated and the output overshoots.",
      givenLabel: "Fast saturated response",
      givenValue: "short rise with excessive command and overshoot",
      givenUnit: null,
      reasoning: [
        "The altered case violates the actuator boundary.",
        "Saturation changes the effective closed-loop dynamics behind the apparent initial speed.",
        "Overshoot and effort prevent the gain from meeting the complete acceptance criterion."
      ],
      outcome: "The system overshoots and settles more slowly after leaving saturation.",
      criterion: "A gain cannot be accepted from rise time alone when actuator or other response limits fail.",
      verification: "Overlay output, error and command and mark intervals where the actuator reaches its limit."
    },
    misconception: {
      claim: "More feedback gain always makes a system faster and more accurate.",
      mechanism: "Actuator limits, delay, noise sensitivity, overshoot and stability margins are omitted.",
      correction: "Compare complete response and effort evidence over the bounded operating range.",
      disconfirmingObservation: "The higher-gain trial saturates, overshoots and takes longer to settle."
    },
    assessmentMoves: [
      "sequencing reference error effort and response evidence",
      "recovering from a gain selected during saturation",
      "screening feedback choices by complete metrics",
      "diagnosing wrong sign or excessive gain",
      "explaining speed accuracy and effort trade-offs",
      "matching response measures to actuator boundaries",
      "reading a loop diagram beside its time record",
      "revealing slow recovery behind the fastest initial rise"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D16-L03",
    systemModel: "Closed-loop stability describes whether deviations remain bounded or decay for a stated model and operating region, rather than whether one simulation appears calm.",
    failurePattern: "A short response can conceal slow divergence, marginal oscillation or instability triggered by delay, saturation or parameter change.",
    visualExplanation: "Several trajectories from different initial conditions and parameters show convergent, sustained and divergent behaviour beside pole or energy interpretations.",
    applicationTask: "Challenge a feedback model with changed initial state, gain and delay, then classify stability evidence without generalising beyond the tested boundary.",
    terms: [
      ["Stability", "A property describing how system behaviour responds to bounded initial deviations or inputs under a stated model and equilibrium.", "The precise definition must match the claim, such as bounded-input bounded-output or asymptotic state stability."],
      ["Equilibrium", "A state that remains unchanged under constant input when the model dynamics are satisfied.", "Stability is assessed around a valid equilibrium rather than any arbitrary operating point."],
      ["Stability margin", "A measure of distance from a modelled instability boundary under a specified analysis.", "A positive nominal margin does not cover unmodelled delay, nonlinearity or parameter ranges not included."]
    ],
    entities: [
      ["input", "Initial deviation and disturbance", "The bounded perturbations used to challenge the loop."],
      ["state", "Closed-loop equilibrium model", "The dynamics and operating point under assessment."],
      ["mechanism", "Decay or growth dynamics", "The model process governing deviation over time."],
      ["observation", "Multi-case trajectory evidence", "Responses across initial states, parameters, delay and duration."],
      ["decision", "Bounded stability claim", "The retained stability statement and its supported region."]
    ],
    relations: [
      ["maps", "the deviation and disturbance map into the equilibrium model", "directed", "many-to-one"],
      ["constrains", "the equilibrium and parameter region constrain the valid stability analysis", "directed", "one-to-many"],
      ["transforms", "closed-loop dynamics transform deviations through decay, persistence or growth", "directed", "many-to-one"],
      ["supports", "multi-case trajectory evidence supports a bounded stability claim", "directed", "many-to-one"],
      ["invalidates", "divergence, unbounded oscillation or excluded delay invalidates an overbroad claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Stability definition, equilibrium, model, parameter range, delay and saturation assumptions are declared."],
      ["assumption", "The analysis or simulation duration is long enough to expose the slowest relevant mode."],
      ["criterion", "All required cases remain bounded or converge according to the stated definition and region."],
      ["operating-state", "The altered case shows one short nominal simulation and labels the system stable for every gain and delay."]
    ],
    failure: [
      "One visually calm trajectory is generalised beyond its initial state, duration, parameter and model assumptions.",
      "A slow unstable mode or delay-induced oscillation appears only after deployment.",
      "Reject the stability claim until the definition, region and disconfirming cases have been tested or analysed."
    ],
    conceptualSteps: [
      "Identify the equilibrium and state the exact stability property being claimed.",
      "Declare the model, parameter interval, delay, saturation and disturbance boundary.",
      "Use an appropriate analytical argument or a deliberately broad set of challenge cases.",
      "Observe long enough to distinguish decay, sustained motion and slow divergence.",
      "Report the supported region and preserve excluded nonlinear or unmodelled behaviour as a limit."
    ],
    example: {
      scenario: "A closed-loop model is challenged from several initial errors across its allowed gain and delay range.",
      givenLabel: "Stability challenge set",
      givenValue: "multiple initial states, gains, delays and bounded disturbances",
      givenUnit: null,
      reasoning: [
        "Confirm one equilibrium and a declared bounded or convergent stability definition.",
        "Analyse or simulate the slowest mode across the stated parameter corners.",
        "Record whether each deviation decays, persists or grows and limit the claim to passing cases."
      ],
      outcome: "The loop has a documented stability region rather than one nominal label.",
      criterion: "Every required case meets the chosen stability definition for the declared model and duration.",
      verification: "Add a disconfirming corner case near the boundary and compare with an independent pole or energy calculation."
    },
    counterexample: {
      scenario: "A five-second nominal response looks settled, but a lightly unstable mode doubles only over a much longer interval.",
      givenLabel: "Short observation",
      givenValue: "one nominal trajectory stopped before slow growth",
      givenUnit: "s",
      reasoning: [
        "The altered duration violates the slow-mode observation assumption.",
        "Early decay of faster modes hides later growth of the unstable mode.",
        "The short trace cannot satisfy the declared long-horizon stability criterion."
      ],
      outcome: "The deployed response develops growing oscillation after the test window.",
      criterion: "Observation or analysis must cover the slowest relevant dynamics and parameter boundary.",
      verification: "Extend simulation duration and compare the dominant mode with an independent stability calculation."
    },
    misconception: {
      claim: "If a simulation does not blow up immediately, the controlled system is stable.",
      mechanism: "One initial condition, short duration and nominal parameters replace a defined stability argument.",
      correction: "State the definition and region, then seek slow and boundary cases that could disconfirm it.",
      disconfirmingObservation: "The same model diverges slowly when simulation time or delay is increased."
    },
    assessmentMoves: [
      "sequencing equilibrium definition and challenge evidence",
      "recovering from a short nominal stability claim",
      "screening stability statements by region and duration",
      "diagnosing a slow divergent mode",
      "explaining calm appearance apart from stability proof",
      "matching parameter corners to supported margins",
      "reading convergent sustained and divergent trajectories",
      "revealing late growth outside the first test window"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D16-L04",
    systemModel: "A PID controller combines proportional response to present error, integral response to accumulated error and derivative response to error trend.",
    failurePattern: "Increasing gains without considering noise, saturation and interaction can create oscillation, derivative spikes or integral windup.",
    visualExplanation: "Separate proportional, integral and derivative contributions are plotted against error and summed into a bounded actuator command during a reference change.",
    applicationTask: "Tune a PID-controlled plant from a baseline, change one term at a time and compare tracking, disturbance rejection, noise and effort.",
    terms: [
      ["Proportional action", "A controller contribution proportional to current error.", "It cannot by itself remove every steady disturbance offset and excessive gain can reduce robustness."],
      ["Integral action", "A controller contribution based on accumulated error over time.", "Its state must be bounded or managed when the actuator cannot realise the requested command."],
      ["Derivative action", "A controller contribution related to the rate of change of error or measured output.", "It amplifies high-frequency noise and can spike on reference steps unless implemented carefully."]
    ],
    entities: [
      ["input", "Reference and measured output", "The signals forming signed control error."],
      ["mechanism", "PID term calculation", "Proportional, integral and filtered derivative contributions."],
      ["state", "Integral accumulator", "The retained sum of error modified by anti-windup logic."],
      ["observation", "Term and response traces", "Individual contributions, total command and plant output."],
      ["decision", "Accepted PID tuning", "The gains retained after tracking, disturbance, noise and effort tests."]
    ],
    relations: [
      ["maps", "reference and measurement map into signed error", "directed", "many-to-one"],
      ["causes", "the PID term calculation causes a requested actuator command", "directed", "one-to-many"],
      ["depends-on", "integral contribution depends on retained accumulator and saturation handling", "directed", "many-to-one"],
      ["measures", "term and response traces measure each tuning trade-off", "directed", "many-to-one"],
      ["invalidates", "oscillation, noise amplification or windup invalidates the tuning", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Error sign, sample interval, derivative filter and controller units are correct and fixed during comparison."],
      ["boundary", "Actuator magnitude, rate, sensor noise and permitted response metrics are declared."],
      ["criterion", "Tracking, disturbance rejection, noise response and effort all pass independent tests."],
      ["operating-state", "The altered case increases integral gain while the actuator is saturated and no anti-windup acts."]
    ],
    failure: [
      "Terms are tuned by increasing gains until one response looks fast while term units, limits and interactions remain hidden.",
      "The controller oscillates, amplifies noise or accumulates a command the actuator cannot deliver.",
      "Reject the tuning until term traces and bounded response tests expose every contribution."
    ],
    conceptualSteps: [
      "Verify error sign, controller form, sample interval, output limits and term units.",
      "Establish a bounded proportional baseline before adding stored or rate action.",
      "Add integral action for offset while monitoring saturation and accumulator state.",
      "Add filtered derivative action only when its noise and setpoint behaviour are acceptable.",
      "Validate tracking, disturbance, noise and effort separately before retaining the gains."
    ],
    example: {
      scenario: "A motor-speed loop is tuned from proportional control, then bounded integral and filtered derivative terms are introduced one at a time.",
      givenLabel: "Tuning record",
      givenValue: "common reference, load disturbance, noise record and actuator limit",
      givenUnit: null,
      reasoning: [
        "Select a proportional baseline that remains stable and inside the actuator limit.",
        "Increase integral action until offset passes without long saturation recovery.",
        "Evaluate filtered derivative contribution on both disturbance and sensor-noise cases."
      ],
      outcome: "The retained gains improve the required metrics without hidden windup or noise-driven effort.",
      criterion: "Every term has a visible purpose and all four acceptance experiments pass.",
      verification: "Replay identical tests with term-by-term traces and compare against the baseline tuning."
    },
    counterexample: {
      scenario: "Integral gain is increased while the actuator remains saturated during a large command step.",
      givenLabel: "Saturated tuning trial",
      givenValue: "persistent error and growing integral state",
      givenUnit: null,
      reasoning: [
        "The altered trial violates the bounded-actuator condition.",
        "The integral accumulator grows although its requested command cannot be realised.",
        "The later stored command prevents prompt recovery and fails the response criterion."
      ],
      outcome: "The output overshoots and remains displaced after the actuator leaves saturation.",
      criterion: "Integral tuning must include explicit saturation handling and bounded recovery evidence.",
      verification: "Plot unsaturated request, limited command and integral state before and after the reference becomes reachable."
    },
    misconception: {
      claim: "Each PID term can be tuned independently because their effects simply add.",
      mechanism: "Closed-loop interaction, saturation, noise and stored integral state are ignored.",
      correction: "Change one term deliberately but re-evaluate the complete closed loop and actuator after every change.",
      disconfirmingObservation: "Adding integral action changes the transient and causes saturation even though proportional gain is unchanged."
    },
    assessmentMoves: [
      "sequencing proportional integral and derivative tuning",
      "recovering from a saturated integral accumulator",
      "screening PID gains through separate experiments",
      "diagnosing oscillation from term traces",
      "explaining term interaction inside the closed loop",
      "matching controller contributions to response criteria",
      "reading error terms command and output together",
      "revealing delayed recovery from stored integral demand"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D16-L05",
    systemModel: "Frequency response describes closed-loop gain and phase versus sinusoidal frequency, supporting bandwidth, resonance and robustness reasoning under model uncertainty.",
    failurePattern: "High bandwidth can amplify noise or erode phase margin, while a nominally stable model may become fragile when unmodelled delay is introduced.",
    visualExplanation: "Magnitude and phase curves mark crossover, resonance, bandwidth and stability margins, with an uncertainty envelope approaching the critical boundary.",
    applicationTask: "Compare two controller frequency responses, identify bandwidth and margin changes and predict a disturbance or noise frequency that exposes the trade-off.",
    terms: [
      ["Frequency response", "The steady sinusoidal gain and phase of a linear time-invariant model as frequency varies.", "It does not include nonlinear saturation or arbitrary transient behaviour unless those effects are separately modelled."],
      ["Bandwidth", "A frequency range over which a response meets a declared magnitude or tracking criterion.", "Higher bandwidth is not universally better because effort, noise and robustness also change."],
      ["Phase margin", "The additional phase lag required at gain crossover to reach the nominal instability condition.", "It is model-based and can be consumed by unmodelled delay, resonances and parameter change."]
    ],
    entities: [
      ["input", "Sinusoidal command or disturbance", "A bounded input swept across frequency."],
      ["mechanism", "Loop frequency response", "Controller, plant and sensor dynamics represented in gain and phase."],
      ["constraint", "Delay and uncertainty envelope", "Bounded model variation and omitted high-frequency effects."],
      ["observation", "Magnitude and phase evidence", "Crossover, bandwidth, resonance and margin values."],
      ["decision", "Robust controller choice", "The controller retained when performance and margin requirements agree."]
    ],
    relations: [
      ["maps", "the sinusoidal input maps into loop gain and phase", "directed", "many-to-one"],
      ["depends-on", "loop response depends on controller plant and sensor dynamics", "directed", "many-to-one"],
      ["constrains", "delay and uncertainty constrain usable crossover and bandwidth", "directed", "one-to-many"],
      ["supports", "magnitude and phase evidence supports the robust-controller choice", "directed", "many-to-one"],
      ["invalidates", "resonance, inadequate margin or noise amplification invalidates the choice", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Linear model, operating point, frequency range, uncertainty and delay bounds are declared."],
      ["assumption", "Sinusoidal amplitudes remain within the approximately linear unsaturated region."],
      ["criterion", "Tracking and disturbance goals pass while noise, resonance and robustness margins retain required bounds."],
      ["operating-state", "The altered case raises crossover into an unmodelled flexible resonance and loses phase margin."]
    ],
    failure: [
      "Bandwidth is increased on a nominal low-order model without including sensor noise, delay or flexible dynamics.",
      "The implemented loop amplifies high-frequency noise or oscillates near an omitted resonance.",
      "Reject the design until performance and margin remain acceptable across the uncertainty envelope."
    ],
    conceptualSteps: [
      "Define the linear operating point and the performance, noise and robustness frequency ranges.",
      "Build or measure controller, plant and sensor gain and phase across those ranges.",
      "Mark crossover, bandwidth, resonance and nominal margins.",
      "Apply delay and parameter uncertainty to find the smallest credible margin.",
      "Choose crossover and roll-off that meet performance without entering unsupported dynamics."
    ],
    example: {
      scenario: "Two speed controllers have different crossover frequencies and are compared with a measured motor resonance and sensor-noise spectrum.",
      givenLabel: "Frequency comparison",
      givenValue: "two loop responses, delay bound and resonance measurement",
      givenUnit: null,
      reasoning: [
        "Read tracking bandwidth and crossover from each consistent loop response.",
        "Include the measured resonance, delay and parameter envelope when finding minimum margin.",
        "Predict disturbance rejection and noise amplification before choosing the controller."
      ],
      outcome: "The retained controller meets the needed bandwidth with bounded resonance, noise and margin.",
      criterion: "Worst-case performance and margin across the declared frequency and uncertainty range must pass.",
      verification: "Inject small sinusoids near bandwidth and resonance and compare measured gain and phase with prediction."
    },
    counterexample: {
      scenario: "Controller gain is raised to increase bandwidth beyond an unmodelled structural resonance.",
      givenLabel: "High crossover trial",
      givenValue: "gain crossover near flexible resonance and added delay",
      givenUnit: "Hz",
      reasoning: [
        "The altered crossover violates the supported model boundary.",
        "Resonance and delay add gain and phase behaviour omitted from the nominal margin.",
        "Nominal bandwidth therefore cannot satisfy the robust-controller criterion."
      ],
      outcome: "The physical system oscillates while the low-order nominal plot appears acceptable.",
      criterion: "Crossover must retain required margin against every credible resonance, delay and parameter variation.",
      verification: "Extend the measured response through the resonance and recompute margin with delay included."
    },
    misconception: {
      claim: "The controller with the highest bandwidth is always the most robust.",
      mechanism: "Fast response is confused with distance from resonance, delay and uncertainty boundaries.",
      correction: "Balance bandwidth with worst-case gain, phase, noise and model limits.",
      disconfirmingObservation: "The higher-bandwidth loop has less phase margin and excites a flexible resonance."
    },
    assessmentMoves: [
      "sequencing loop response into performance and margin",
      "recovering from crossover beyond a resonance",
      "screening bandwidth claims through uncertainty",
      "diagnosing oscillation from gain and phase evidence",
      "explaining speed apart from robustness",
      "matching disturbance and noise bands to loop shape",
      "reading nominal and uncertain response envelopes",
      "revealing lost margin from unmodelled delay"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D16-L06",
    systemModel: "Digital control samples state, estimates unmeasured variables and computes motor-drive commands through finite timing, quantisation and switched actuation.",
    failurePattern: "A continuous design can degrade when sample delay, estimator mismatch, quantisation or drive saturation changes the effective loop dynamics.",
    visualExplanation: "A sampled control loop aligns sensor conversion, estimator update, controller calculation, PWM drive and motor response on a discrete timeline.",
    applicationTask: "Choose a control sample interval, simulate or inspect one estimator-drive cycle and test delayed measurement, quantised feedback and actuator saturation.",
    terms: [
      ["Sampled-data controller", "A controller that reads measurements and updates commands at discrete instants.", "Its behaviour depends on sample period, jitter, computation delay and hold action."],
      ["State estimator", "An algorithm combining a dynamic model and measurements to infer variables not directly measured.", "Accuracy depends on model, noise assumptions, observability, timing and initial uncertainty."],
      ["Motor drive", "Power electronics that convert a bounded command into switched motor voltage and current.", "PWM duty cannot override bus voltage, current, thermal, commutation or protection limits."]
    ],
    entities: [
      ["input", "Sampled sensor measurement", "Timestamped quantised data entering the control cycle."],
      ["mechanism", "Estimator and control update", "The ordered prediction, correction and command calculation."],
      ["component", "PWM motor drive", "The bounded switched actuator implementing the command."],
      ["observation", "Cycle timing and state trace", "Measurement age, estimate, command, current and motor response."],
      ["decision", "Accepted digital loop", "The sample and drive design retained after timing and limit tests."]
    ],
    relations: [
      ["maps", "the sampled measurement maps into an estimator correction", "directed", "many-to-one"],
      ["depends-on", "the estimator and controller depend on model, sample interval and measurement age", "directed", "many-to-one"],
      ["routes", "the computed command routes through PWM and drive limits to the motor", "directed", "one-to-many"],
      ["measures", "the cycle timing and state trace measures effective loop behaviour", "directed", "many-to-one"],
      ["invalidates", "late data, estimator divergence or drive limiting invalidates the accepted loop", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Measurement timestamps, sample interval, estimator model and command units are consistent."],
      ["boundary", "Worst-case computation time, jitter, quantisation, bus voltage, current and thermal limits are declared."],
      ["criterion", "Estimation error, cycle deadline and motor response pass under timing, noise and drive-limit tests."],
      ["operating-state", "The altered case reuses a continuous controller while sample delay and current limiting are ignored."]
    ],
    failure: [
      "A continuous controller is discretised without accounting for timing, quantisation, estimator dynamics and switched actuator limits.",
      "The effective loop gains delay or loses authority and its estimated state no longer tracks the motor.",
      "Reject the digital loop until one complete sampled cycle and worst-case timing and drive limits are evidenced."
    ],
    conceptualSteps: [
      "Choose a sample interval from plant dynamics, sensing and worst-case computation rather than nominal loop speed.",
      "Timestamp measurements and order estimator prediction, correction and control calculation explicitly.",
      "Map the command into PWM and motor-drive voltage, current and protection limits.",
      "Trace timing, estimate error, quantisation and actuator response across representative cycles.",
      "Test stale data, jitter, sensor noise, current limit and estimator mismatch before accepting the loop."
    ],
    example: {
      scenario: "A sampled motor-speed loop estimates load disturbance and updates a current-limited PWM drive each cycle.",
      givenLabel: "Digital control cycle",
      givenValue: "timestamped speed, estimator state, command and current feedback",
      givenUnit: null,
      reasoning: [
        "Budget conversion, estimation and control computation inside the chosen sample interval.",
        "Update the estimator with measurement age and calculate a command in compatible units.",
        "Apply drive limits and compare estimate, current and motor response under delay and noise tests."
      ],
      outcome: "The digital loop meets its cycle deadline and retains bounded estimation and motor response.",
      criterion: "Every cycle has valid timing and the closed-loop metrics pass with declared quantisation and drive limits.",
      verification: "Inject worst-case computation delay, quantised feedback and current limiting while recording the full cycle trace."
    },
    counterexample: {
      scenario: "A continuous controller is copied into firmware with a slow variable sample period and no current-limit model.",
      givenLabel: "Naive discretisation",
      givenValue: "variable update delay and clipped motor current",
      givenUnit: null,
      reasoning: [
        "The altered implementation violates the fixed timing and actuator boundary.",
        "Variable delay changes phase while current clipping removes the requested control authority.",
        "The continuous nominal response cannot satisfy the digital-loop criterion."
      ],
      outcome: "The speed estimate and command oscillate during load changes.",
      criterion: "The implemented sample, estimator and drive dynamics must be included in acceptance evidence.",
      verification: "Log actual update intervals, current limiting and estimation error and compare with a sampled model."
    },
    misconception: {
      claim: "A stable continuous controller remains the same when its equations are placed in a microcontroller.",
      mechanism: "Sampling, computation delay, quantisation, estimator updates and drive switching are omitted.",
      correction: "Model and verify the implemented sampled loop including timing and actuator limits.",
      disconfirmingObservation: "The firmware loop oscillates when update delay grows even though the continuous simulation remains calm."
    },
    assessmentMoves: [
      "sequencing measurement estimate command and drive",
      "recovering from a delayed naive discretisation",
      "screening digital control through full-cycle evidence",
      "diagnosing estimator error during current limiting",
      "explaining implemented timing beyond continuous equations",
      "matching sample budgets to motor-drive constraints",
      "reading sensor estimator PWM and motor timelines",
      "revealing phase loss from variable computation delay"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D16-L07",
    systemModel: "Practical control uses identified plant behaviour while managing saturation, measurement noise and integral state so recovery remains bounded after constraints are hit.",
    failurePattern: "An integrator can continue accumulating during saturation, producing delayed recovery and overshoot even after the commanded reference becomes reachable.",
    visualExplanation: "A saturated actuator plot is paired with unconstrained and anti-windup integral states, showing their different recovery paths after the limit clears.",
    applicationTask: "Identify a simple plant response, drive the controller into saturation and compare recovery with and without an explicit anti-windup mechanism.",
    terms: [
      ["Actuator saturation", "A condition in which the implemented command cannot exceed a physical or configured limit.", "The limited output differs from the controller's unconstrained request and changes loop behaviour."],
      ["Integral windup", "Excess integral-state accumulation while saturation or another constraint prevents error correction.", "Windup can also occur with mode changes or disabled actuators unless integral state is managed."],
      ["Anti-windup", "A mechanism that prevents or reverses inappropriate integral accumulation when the implemented command differs from the request.", "Its tracking or clamping dynamics require tuning and verification rather than automatic trust."]
    ],
    entities: [
      ["input", "Large reference and disturbance", "The demand that drives the actuator to its limit."],
      ["mechanism", "Identified plant and controller", "The approximate plant response and controller producing an unconstrained request."],
      ["state", "Managed integral state", "The stored error contribution updated under anti-windup rules."],
      ["observation", "Requested and applied command trace", "Error, integral state, limited command, output and noise."],
      ["decision", "Accepted recovery strategy", "The anti-windup design retained after constrained tests."]
    ],
    relations: [
      ["causes", "the large reference and disturbance causes the requested command to reach saturation", "directed", "one-to-many"],
      ["depends-on", "the plant and controller response depends on identified dynamics and practical limits", "directed", "many-to-one"],
      ["transforms", "anti-windup transforms request mismatch into a managed integral update", "directed", "many-to-one"],
      ["supports", "the command and state trace supports the recovery-strategy decision", "directed", "many-to-one"],
      ["invalidates", "delayed recovery, excessive overshoot or noise-driven state invalidates the strategy", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Actuator magnitude and rate, controller sample time, noise band and allowed recovery metrics are declared."],
      ["assumption", "The identified model represents the plant sufficiently across the constrained recovery experiment."],
      ["criterion", "The applied command respects limits and output and integral state return within recovery and overshoot bounds."],
      ["operating-state", "The altered case integrates persistent error while the actuator is pinned at its maximum."]
    ],
    failure: [
      "Controller tuning and identification are evaluated only where the actuator follows the requested command.",
      "Stored integral demand prolongs saturation and creates overshoot after the reference becomes reachable.",
      "Reject the design until requested versus applied command and integral recovery are visible under constraint."
    ],
    conceptualSteps: [
      "Identify enough plant behaviour to predict the constrained recovery experiment.",
      "Record actuator magnitude and rate limits separately from the unconstrained controller request.",
      "Drive the loop into a bounded saturation case and observe error and integral-state growth.",
      "Apply clamping or tracking anti-windup and tune its recovery without amplifying noise.",
      "Compare constrained rise, time at limit, overshoot and return of integral state across independent cases."
    ],
    example: {
      scenario: "A temperature controller is stepped beyond immediate heater capacity, then returned to a reachable reference with back-calculation anti-windup.",
      givenLabel: "Constrained recovery trial",
      givenValue: "requested heat, applied heat, integral state and temperature",
      givenUnit: null,
      reasoning: [
        "Record the controller's unconstrained request and the heater's applied limited command.",
        "Feed their difference into the anti-windup update while retaining the identified plant response.",
        "Measure time at limit, integral recovery, overshoot and noise response after the reference is reduced."
      ],
      outcome: "The controller leaves saturation promptly and reaches the reachable reference without excessive overshoot.",
      criterion: "Command limits hold and both output and integral state recover within declared bounds.",
      verification: "Repeat with a load disturbance and a second reference amplitude while comparing a no-anti-windup baseline."
    },
    counterexample: {
      scenario: "The integrator continues accumulating positive error while the heater command is already at its maximum.",
      givenLabel: "Unmanaged saturation",
      givenValue: "limited output with growing integral request",
      givenUnit: null,
      reasoning: [
        "The altered update ignores the difference between requested and applied command.",
        "Integral state grows even though additional request cannot affect the plant.",
        "When the reference drops, stored demand keeps the actuator saturated and fails recovery criteria."
      ],
      outcome: "Temperature overshoots and remains above the reachable reference for an extended interval.",
      criterion: "Integral state must remain compatible with the command actually applied during and after saturation.",
      verification: "Overlay error, unconstrained request, applied command and integral state around the reference reduction."
    },
    misconception: {
      claim: "Saturation only clips the command and does not otherwise change controller behaviour.",
      mechanism: "The controller's internal state continues evolving as if the requested action reached the plant.",
      correction: "Model the request-application mismatch and manage integral state explicitly.",
      disconfirmingObservation: "The actuator remains pinned after error changes sign because stored integral demand is still large."
    },
    assessmentMoves: [
      "sequencing identification saturation and bounded recovery",
      "recovering from an unmanaged integral state",
      "screening anti-windup through requested and applied commands",
      "diagnosing delayed recovery from state traces",
      "explaining clipping as a changed loop dynamic",
      "matching saturation limits to recovery criteria",
      "reading error integral command and output together",
      "revealing continued saturation after the error reverses"
    ],
    variant: 6
  }
] as const satisfies readonly LessonSource[];

const term = academyLessonV2TextRef.term;
const relation = academyLessonV2TextRef.relation;
const condition = academyLessonV2TextRef.condition;
const reasonedCase = academyLessonV2TextRef.reasonedCase;
const misconception = academyLessonV2TextRef.misconception;

const relationEndpoints = [
  [["e1"], ["e2"]],
  [["e2"], ["e3"]],
  [["e3"], ["e4"]],
  [["e4"], ["e5"]],
  [["e1"], ["e5"]]
] as const;

const conditionBindings = [
  [["e1", "e2"], ["r1"]],
  [["e2", "e3"], ["r2", "r3"]],
  [["e4", "e5"], ["r4"]],
  [["e1", "e5"], ["r5"]]
] as const;

const orderingPatterns = [
  {
    base: [
      ["b-establish", ["r1"], ["c1"]],
      ["b-connect", ["r2"], ["c2"]],
      ["b-transform", ["r3"], ["c2"]],
      ["b-accept", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-expose", ["r5"], ["c4"]],
      ["r-rebuild", ["r2", "r3"], ["c2"]],
      ["r-prove", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-source", ["r1"], ["c1"]],
      ["b-propagate", ["r2", "r3"], ["c2"]],
      ["b-verify", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-isolate", ["r5"], ["c4"]],
      ["r-reconnect", ["r1", "r2"], ["c1"]],
      ["r-repeat", ["r3"], ["c2"]],
      ["r-confirm", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-declare", ["r1"], ["c1"]],
      ["b-observe", ["r2"], ["c2"]],
      ["b-predict", ["r3", "r4"], ["c2"]],
      ["b-judge", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-perturb", ["r5"], ["c4"]],
      ["r-hold", ["r1"], ["c1"]],
      ["r-recalculate", ["r3"], ["c2"]],
      ["r-decide", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-bound", ["r1"], ["c1"]],
      ["b-model", ["r2"], ["c2"]],
      ["b-evolve", ["r3"], ["c2"]],
      ["b-limit", ["r4"], ["c3"]],
      ["b-review", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-trigger", ["r5"], ["c4"]],
      ["r-restore", ["r1", "r2"], ["c1"]],
      ["r-retune", ["r3", "r4"], ["c2", "c3"]]
    ]
  },
  {
    base: [
      ["b-identify", ["r1"], ["c1"]],
      ["b-route", ["r2"], ["c2"]],
      ["b-compare", ["r3"], ["c2"]],
      ["b-classify", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-detect", ["r5"], ["c4"]],
      ["r-reroute", ["r2"], ["c2"]],
      ["r-reconcile", ["r3", "r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-frame", ["r1"], ["c1"]],
      ["b-derive", ["r2"], ["c2"]],
      ["b-map", ["r3"], ["c2"]],
      ["b-test", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-challenge", ["r5"], ["c4"]],
      ["r-restrict", ["r1"], ["c1"]],
      ["r-remap", ["r3"], ["c2"]],
      ["r-audit", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-measure", ["r1"], ["c1"]],
      ["b-estimate", ["r2"], ["c2"]],
      ["b-adjust", ["r3"], ["c2"]],
      ["b-constrain", ["r4"], ["c3"]],
      ["b-report", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-disconfirm", ["r5"], ["c4"]],
      ["r-remeasure", ["r1"], ["c1"]],
      ["r-correct", ["r3", "r4"], ["c2", "c3"]]
    ]
  }
] as const;

const instructionPlan = (
  source: LessonSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const trace = source.entities[3][1];
  const judgement = source.entities[4][1];
  const move = source.assessmentMoves[slot];
  if (move === undefined) {
    throw new Error(`Missing D16 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Build the reasoning order from ${first} and ${second} through ${trace} to ${judgement} while ${move}:`,
      `${first} supports ${judgement} because ${move} keeps ${second} tied to ${trace}.`,
      `${judgement} is premature when ${move} skips the ${second} boundary or ${trace}.`,
      `Start from the ${first} condition represented in ${trace} before ${move}.`,
      `Use ${trace} to place ${second} correctly during ${move}.`,
      `Put ${first} ahead of ${second} for ${trace}, then describe ${move}.`,
      `Test ${judgement} against ${trace} after ${move}.`
    ],
    [
      `Recover the altered ${trace} case from ${first} and ${second} while ${move}:`,
      `${trace} supports ${judgement} once ${move} restores the ${first} boundary.`,
      `${second} remains unsupported if ${move} leaves ${trace} unresolved.`,
      `Locate the changed ${trace} condition before ${move}.`,
      `Rebuild the ${first} link governing ${second} and ${trace} during ${move}.`,
      `Retest ${second} against ${trace} while completing ${move}.`,
      `Keep ${judgement} only when ${first} and ${trace} survive ${move}.`
    ],
    [
      `Select the ${first} statements valid for ${second} and ${trace} while ${move}:`,
      `${judgement} is supported because ${move} preserves ${second} and ${trace}.`,
      `A ${first} statement fails when ${move} contradicts the ${trace} boundary.`,
      `Test each ${second} statement against ${first} and ${trace} during ${move}.`,
      `Keep the ${trace} relation whose condition remains true after ${move}.`,
      `Mark ${first} and ${second} statements supported by ${trace} during ${move}.`,
      `Reject ${judgement} when it cannot match ${trace} during ${move}.`
    ],
    [
      `Diagnose why ${trace} changes ${judgement} through ${first} and ${second} while ${move}:`,
      `${first} and ${second} identify the changed ${trace} mechanism when ${move} is applied.`,
      `${judgement} is overclaimed if ${move} ignores the ${first} condition controlling ${trace}.`,
      `Find the first ${second} relation changing ${trace} during ${move}.`,
      `Compare ${trace} with the bounded ${first} case before ${move}.`,
      `Retain the ${second} relation explaining ${judgement} after ${move}.`,
      `Discard the ${first} claim that ${trace} disproves during ${move}.`
    ],
    [
      `Explain ${first} by joining ${second}, ${trace} and ${judgement} while ${move}:`,
      `The explanation joins ${first} to ${judgement} through ${trace} during ${move}.`,
      `The explanation fails when ${move} omits ${second} or the ${trace} criterion.`,
      `Name the ${first} boundary for ${trace} before describing ${move}.`,
      `State how ${second} changes ${trace} during ${move}.`,
      `Connect ${first} to ${judgement} with the relation exposed by ${move}.`,
      `Close with the ${trace} criterion limiting ${judgement} after ${move}.`
    ],
    [
      `Match ${second} evidence to ${first} conditions and ${judgement} while ${move}:`,
      `Each ${trace} pair reaches the ${judgement} condition during ${move}.`,
      `A ${second} pair fails because ${move} assigns the wrong ${first} boundary.`,
      `Pair the earliest ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${trace} criterion for the relation concluded after ${move}.`,
      `Align ${first} and ${second} with ${trace} through ${move}.`,
      `Verify every ${judgement} pair by reading ${move} back through ${trace}.`
    ],
    [
      `Trace the ${first} model from ${second} through ${trace} to ${judgement} while ${move}:`,
      `The selected path reaches ${judgement} because ${move} preserves the ${second} relation.`,
      `The model is misread if ${move} bypasses the ${trace} edge limiting ${first}.`,
      `Trace ${first} to ${second} and ${trace} during ${move}.`,
      `Inspect which ${trace} relation remains active after ${move}.`,
      `Follow ${second} arrows before judging ${judgement} during ${move}.`,
      `Select the ${judgement} path that keeps ${first} valid after ${move}.`
    ],
    [
      `Interpret changed ${trace} by tracing ${judgement} back to ${first} and ${second} while ${move}:`,
      `${trace} supports the implication because ${move} retains its ${second} path.`,
      `${judgement} is unsafe when ${move} treats a suppressed ${first} path as active.`,
      `Start at changed ${trace} and identify how ${move} affects ${second}.`,
      `Contrast the active ${first} route through ${trace} during ${move}.`,
      `Reconstruct the ${second} path that ${move} carries towards ${judgement}.`,
      `Accept ${judgement} only if the final ${trace} route agrees with ${move}.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D16 instruction plan ${slot}.`);
  }
  return [plan[0], plan[1], plan[2], [plan[3], plan[4]], [plan[5], plan[6]]];
};

const makePlan = (
  source: LessonSource
): AcademyLessonTeachingProfileV2CompactPlan => {
  const terms = source.terms.map(
    (value, index): AcademyDomainTermTuple => [
      `t${index + 1}`,
      value[0],
      value[1],
      value[2],
      index === 0 ? "s1" : index === 1 ? "s2" : "s4"
    ]
  );
  const entities = source.entities.map(
    (value, index): AcademyDomainEntityTuple => [
      `e${index + 1}`,
      value[0],
      value[1],
      value[2]
    ]
  );
  const relations = source.relations.map(
    (value, index): AcademyDomainRelationTuple => {
      const endpoints = relationEndpoints[index];
      if (endpoints === undefined) {
        throw new Error(`Missing D16 relation endpoints ${index}.`);
      }
      return [
        `r${index + 1}`,
        value[0],
        endpoints[0],
        endpoints[1],
        value[1],
        value[2],
        value[3]
      ];
    }
  );
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const binding = conditionBindings[index];
      if (binding === undefined) {
        throw new Error(`Missing D16 condition binding ${index}.`);
      }
      return [
        `c${index + 1}`,
        value[0],
        value[1],
        binding[0],
        binding[1]
      ];
    }
  );
  const pattern = orderingPatterns[source.variant];
  const mapOrdering = (
    values: readonly (
      readonly [string, readonly string[], readonly string[]]
    )[]
  ) => values.map((value) => [value[0], value[1], value[2]] as const);
  const baseOrdering = mapOrdering(pattern.base);
  const retryOrdering = mapOrdering(pattern.retry);

  return {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: source.lessonId,
    systemModel: source.systemModel,
    failurePattern: source.failurePattern,
    visualExplanation: source.visualExplanation,
    applicationTask: source.applicationTask,
    terms,
    entities,
    relations,
    conditions,
    failureBoundary: [
      "f1",
      "c4",
      source.failure[0],
      source.failure[1],
      source.failure[2],
      ["e1", "e5"],
      ["r5"]
    ],
    conceptualModel: [
      ["s1", source.conceptualSteps[0], ["e1", "e2"], ["r1"], ["c1"]],
      ["s2", source.conceptualSteps[1], ["e2", "e3"], ["r2"], ["c2"]],
      ["s3", source.conceptualSteps[2], ["e3", "e4"], ["r3"], ["c2"]],
      ["s4", source.conceptualSteps[3], ["e4", "e5"], ["r4"], ["c3"]],
      ["s5", source.conceptualSteps[4], ["e1", "e5"], ["r5"], ["c4"]]
    ],
    reasonedCases: [
      {
        id: "worked",
        kind: "example",
        scenario: source.example.scenario,
        changedConditionIds: ["c1"],
        givens: [["worked-given", source.example.givenLabel, source.example.givenValue, source.example.givenUnit, "e1"]],
        reasoningSteps: [
          ["worked-1", source.example.reasoning[0], ["e1", "e2"], ["r1"], ["c1"]],
          ["worked-2", source.example.reasoning[1], ["e2", "e4"], ["r2", "r3"], ["c2"]],
          ["worked-3", source.example.reasoning[2], ["e4", "e5"], ["r4"], ["c3"]]
        ],
        outcome: source.example.outcome,
        criterionConditionId: "c3",
        criterion: source.example.criterion,
        verification: source.example.verification
      },
      {
        id: "counter",
        kind: "counterexample",
        scenario: source.counterexample.scenario,
        changedConditionIds: ["c4"],
        givens: [["counter-given", source.counterexample.givenLabel, source.counterexample.givenValue, source.counterexample.givenUnit, "e1"]],
        reasoningSteps: [
          ["counter-1", source.counterexample.reasoning[0], ["e1", "e5"], ["r5"], ["c4"]],
          ["counter-2", source.counterexample.reasoning[1], ["e2", "e5"], ["r2", "r5"], ["c2", "c4"]],
          ["counter-3", source.counterexample.reasoning[2], ["e4", "e5"], ["r4", "r5"], ["c3", "c4"]]
        ],
        outcome: source.counterexample.outcome,
        criterionConditionId: "c3",
        criterion: source.counterexample.criterion,
        verification: source.counterexample.verification
      }
    ],
    misconception: {
      id: "misconception",
      claim: source.misconception.claim,
      mechanism: source.misconception.mechanism,
      correction: source.misconception.correction,
      disconfirmingObservation: source.misconception.disconfirmingObservation,
      entityIds: ["e1", "e3", "e5"],
      relationIds: ["r2", "r5"],
      conditionIds: ["c2", "c4"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instructionPlan(source, 0),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3"],
          steps: baseOrdering,
          correctOrder: baseOrdering.map((value) => value[0])
        },
        retry: {
          instruction: instructionPlan(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: retryOrdering,
          correctOrder: retryOrdering.map((value) => value[0])
        }
      },
      q3: {
        base: {
          instruction: instructionPlan(source, 2),
          focusRef: term("t1", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          options: [
            ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
            ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
            ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
          ]
        },
        retry: {
          instruction: instructionPlan(source, 3),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: ["c4", "c2", "c3"],
          options: [
            ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
            ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
            ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
            ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["r-criterion", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c2", "c3", "c4"],
          conceptGroups: [
            ["definition", term("t1", "label"), [term("t1", "definition")], ["r1"], ["c1"]],
            ["mechanism", relation("r3"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", condition("c3"), [condition("c3")], ["r4"], ["c3"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: ["c1", "c2", "c3"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r3"), term("t2", "boundary"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", relation("r4"), condition("c3"), relation("r4"), ["r4"], ["c3"]]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instructionPlan(source, 6),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c2", "c3", "c4"],
          positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
          relationIds: ["r1", "r2", "r3"],
          answerRelationIds: ["r3"],
          options: [
            ["diagram-correct", true, reasonedCase("worked", "verification"), condition("c3"), ["r3", "r4"], ["c2", "c3"], null],
            ["diagram-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["diagram-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instructionPlan(source, 7),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c1", "c3"],
          positions: [["e1", 0, 1], ["e2", 1, 1], ["e3", 2, 1], ["e4", 3, 1], ["e5", 4, 1]],
          relationIds: ["r3", "r4", "r5"],
          answerRelationIds: ["r4"],
          options: [
            ["retry-correct", true, reasonedCase("worked", "outcome"), reasonedCase("worked", "verification"), ["r4"], ["c3"], null],
            ["retry-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r5"], ["c4"], "misconception"],
            ["retry-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r3", "r5"], ["c2", "c4"], null]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("t1", "label"),
      focusRef: reasonedCase("worked", "verification"),
      modelKind: "causal-graph",
      positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
      visibleEntityIds: ["e1", "e2", "e3", "e4", "e5"],
      visibleRelationIds: ["r1", "r2", "r3", "r4", "r5"],
      controls: [
        ["bounded", term("t2", "label"), ["c1"], ["e1", "e2", "e3"], ["r1", "r2"], ["r5"], [], [["bounded-note", source.visualExplanation, ["e1", "e2"], ["r1"]]], reasonedCase("worked", "verification")],
        ["altered", term("t3", "label"), ["c4"], ["e1", "e4", "e5"], ["r4", "r5"], ["r1"], [], [["altered-note", source.failure[1], ["e1", "e5"], ["r5"]]], reasonedCase("counter", "verification")]
      ]
    }
  };
};

export const academyLessonTeachingProfileV2PlansE2D16 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE2D16 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE2D16,
    academyLessonTeachingProfileV2PlansE2D16
  );

export const academyLessonTeachingProfilesV2E2D16 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE2D16.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D16 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E2D16;
