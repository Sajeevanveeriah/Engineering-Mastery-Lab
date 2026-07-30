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
    lessonId: "EML-E2-D14-L01",
    systemModel: "Industrial I/O translates field voltage or current into isolated controller states, while relays and contactors switch actuator energy with defined de-energised behaviour.",
    failurePattern: "A logical off command may not create a safe physical state when contacts weld, leakage sustains a load or input common and isolation are wired incorrectly.",
    visualExplanation: "A field wiring diagram traces sensor current through isolation to controller input and follows output energy through relay, contactor, actuator and protective return.",
    applicationTask: "Specify one sensor and motor-starter channel, verify electrical conventions and test open circuit, welded contact and loss-of-control-power responses.",
    terms: [
      ["Industrial input", "A conditioned field signal presented to a controller through declared voltage, current, reference and isolation conventions.", "A logical value is not credible until open circuit, short circuit and reference faults are considered."],
      ["Contactor", "An electromechanical device that switches a power circuit when its coil circuit is energised.", "A control command cannot prove that main contacts changed state or remained within their switching rating."],
      ["De-energised state", "The physical state reached when control energy is removed from an interface or actuator.", "De-energised is safer only when the machine hazard analysis establishes that result."]
    ],
    entities: [
      ["input", "Field proximity sensor", "A powered sensor reporting mechanism position."],
      ["component", "Isolated input channel", "Protection, isolation and threshold circuitry between field wiring and controller."],
      ["mechanism", "Relay and contactor chain", "The controller output, interposing relay, contactor coil and main contacts."],
      ["observation", "Auxiliary feedback and current", "Independent contact state and load-current evidence."],
      ["decision", "Safe actuator state", "The accepted physical outcome after command and feedback are reconciled."]
    ],
    relations: [
      ["maps", "the field proximity sensor maps through the isolated channel to a controller state", "directed", "many-to-one"],
      ["constrains", "input ratings and isolation constrain field voltage, current and common wiring", "directed", "one-to-many"],
      ["causes", "the relay and contactor chain causes energy to reach or leave the actuator", "directed", "one-to-many"],
      ["measures", "auxiliary feedback and current measure the actual switched state", "directed", "many-to-one"],
      ["invalidates", "welded contacts, leakage or lost reference invalidates the safe-state claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Field supply, signal convention, isolation rating, coil suppression and load category are declared."],
      ["assumption", "Protective devices and conductor ratings suit both normal current and credible faults."],
      ["criterion", "Command, independent feedback and measured load energy agree with the required physical state."],
      ["operating-state", "The altered case commands off while welded main contacts continue feeding the actuator."]
    ],
    failure: [
      "Controller logic equates an output bit with the physical actuator state and omits contact, leakage and wiring faults.",
      "The screen shows off while hazardous energy remains at the actuator.",
      "Reject the state claim until electrical conventions, protective path and independent physical feedback agree."
    ],
    conceptualSteps: [
      "Identify the field signal or load and declare voltage, current, reference, isolation and fault conventions.",
      "Trace energy through input conditioning or output switching rather than stopping at a controller bit.",
      "Select relay or contactor ratings for the actual load category and suppress the coil safely.",
      "Measure independent contact or current feedback after each command.",
      "Define the fault response for open wire, short circuit, welded contact and loss of control power."
    ],
    example: {
      scenario: "A controller switches a motor contactor through an interposing relay and reads an auxiliary contact plus motor current.",
      givenLabel: "Starter channel",
      givenValue: "24 V DC control and three-phase motor load",
      givenUnit: null,
      reasoning: [
        "Check sensor, input, relay coil and contactor coil conventions against their documented ratings.",
        "Command the chain and wait only the bounded pickup interval before reading independent feedback.",
        "Accept running or stopped state only when auxiliary contact and measured current match the command."
      ],
      outcome: "The controller distinguishes command state from the verified physical motor state.",
      criterion: "Every command reaches a bounded feedback result or a fault without relying on the command bit itself.",
      verification: "Test normal switching, open feedback, welded contact simulation and loss of control supply."
    },
    counterexample: {
      scenario: "The controller displays motor stopped as soon as it clears the contactor output bit.",
      givenLabel: "Command-only state",
      givenValue: "output bit off with no auxiliary or current check",
      givenUnit: null,
      reasoning: [
        "The altered logic removes independent evidence from the state criterion.",
        "A welded contact can keep load current flowing after coil command is removed.",
        "A cleared output bit therefore cannot establish the de-energised physical state."
      ],
      outcome: "Maintenance is permitted while the motor remains energised.",
      criterion: "Safe stopped state requires verified removal of hazardous energy, not only a software command.",
      verification: "Measure the auxiliary contact and motor current while forcing the simulated welded-contact condition."
    },
    misconception: {
      claim: "Turning a PLC output off proves the connected actuator is de-energised.",
      mechanism: "Software command, switching device state and load energy are collapsed into one Boolean variable.",
      correction: "Trace the complete energy path and require independent physical feedback for safety-relevant state.",
      disconfirmingObservation: "The output bit is false while the auxiliary contact and current sensor show closed, energised main contacts."
    },
    assessmentMoves: [
      "sequencing a field command through isolation and power switching",
      "recovering a stopped-state claim after welded contacts",
      "screening industrial I O evidence beyond controller bits",
      "diagnosing whether reference loss or contact failure caused disagreement",
      "explaining de-energised behaviour at the physical load",
      "matching field ratings to feedback acceptance",
      "reading sensor and starter energy paths together",
      "revealing continued current after the off command"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D14-L02",
    systemModel: "A PLC repeatedly samples inputs, executes ordered logic and updates outputs, using ladder logic for relay-style conditions and structured text for explicit algorithms.",
    failurePattern: "Assuming statements act continuously can hide one-scan delays, latched states or output conflicts created by multiple writes during the scan.",
    visualExplanation: "A scan-cycle timeline aligns input image, rung or statement execution, internal state changes, output image and physical output update.",
    applicationTask: "Implement or trace a start-stop interlock in ladder and structured text, then test scan order, reset, contradictory inputs and retained state.",
    terms: [
      ["PLC scan", "The repeated cycle that acquires input state, executes ordered program logic and commits output state.", "Immediate input or output instructions and asynchronous tasks can alter this simplified model and must be declared."],
      ["Ladder rung", "A relay-style Boolean network evaluated according to the controller execution rules.", "A true visual path does not guarantee safe behaviour when retentive coils, multiple writes or scan timing are ignored."],
      ["Structured Text", "A textual IEC programming language for explicit logic, calculations, state and data handling.", "Statement order, data type, task scheduling and retained values remain part of its behaviour."]
    ],
    entities: [
      ["input", "Start and stop inputs", "Operator or field requests sampled into the PLC input image."],
      ["state", "Input and memory image", "The values available to the executing program during one scan."],
      ["mechanism", "Ordered control program", "Ladder rungs or Structured Text statements executed in a defined order."],
      ["observation", "Output image and scan trace", "Committed outputs and recorded intermediate state by scan number."],
      ["decision", "Motor-run command", "The bounded output result after permissive, stop and latch logic."]
    ],
    relations: [
      ["maps", "start and stop inputs map into the input image at acquisition", "directed", "many-to-one"],
      ["depends-on", "the input and memory image depends on prior retained state and the scan boundary", "directed", "many-to-one"],
      ["transforms", "the ordered program transforms image state into the next output image", "directed", "many-to-one"],
      ["supports", "the output image and scan trace support the motor-run decision", "directed", "many-to-one"],
      ["invalidates", "multiple writes or unexamined retention invalidates the traced result", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The task, scan order, I/O update model and retentive behaviour are declared for the chosen PLC."],
      ["boundary", "Stop and fault conditions dominate start and latch requests in every reachable scan."],
      ["criterion", "Ladder and Structured Text implementations produce the same safe output trace for the test sequence."],
      ["operating-state", "The altered case writes the motor output in two locations with the last write silently winning."]
    ],
    failure: [
      "Program review treats logic as continuously simultaneous and overlooks scan order, retained state and later writes.",
      "An output changes one scan later or is overwritten after apparently correct interlock logic.",
      "Reject the program until one complete scan trace and every output writer are explicit."
    ],
    conceptualSteps: [
      "Declare when physical inputs enter the image and when the output image reaches hardware.",
      "Trace each rung or statement in the controller execution order.",
      "Record all retained bits, edge detectors, timers and output writers.",
      "Compare ladder and Structured Text results scan by scan for the same input sequence.",
      "Remove ambiguous multiple writes and prove stop or fault dominance across reset and restart."
    ],
    example: {
      scenario: "A start-stop latch is implemented once in ladder and once in Structured Text with stop dominance.",
      givenLabel: "Input sequence",
      givenValue: "idle, start pulse, run, stop pulse and restart",
      givenUnit: "scan",
      reasoning: [
        "Write the initial input image and retained run state for the first scan.",
        "Evaluate the logic in order and carry the resulting run state into the next scan.",
        "Compare output images for every scan and confirm that stop overrides simultaneous start."
      ],
      outcome: "Both representations produce the same bounded run-state sequence.",
      criterion: "For each scan, inputs, prior state, ordered logic and final output are traceable and stop dominates.",
      verification: "Execute a scan table including simultaneous start-stop, reset and retained-state restart cases."
    },
    counterexample: {
      scenario: "One rung clears the motor output on fault and a later rung writes the same output from the start latch.",
      givenLabel: "Two output writers",
      givenValue: "fault rung before latch rung",
      givenUnit: "scan order",
      reasoning: [
        "The altered program violates the single-defensible-writer boundary.",
        "The later rung overwrites the safe value set earlier in the scan.",
        "Seeing the fault rung true does not establish the final output image."
      ],
      outcome: "The motor remains commanded on during a fault.",
      criterion: "The final scan result must preserve fault and stop dominance regardless of earlier intermediate writes.",
      verification: "Trace the output value after every writer in the faulted scan and inspect the committed image."
    },
    misconception: {
      claim: "All PLC rungs act at the same time like physical relay contacts.",
      mechanism: "The visual relay metaphor hides the sequential scan, state memory and final output commit.",
      correction: "Use the relay model for intent but trace the actual task and scan execution rules.",
      disconfirmingObservation: "Two writes to one coil leave only the value from the later rung in the output image."
    },
    assessmentMoves: [
      "ordering a start pulse across one complete scan",
      "repairing a fault rung overwritten by a later coil",
      "screening ladder claims with an image-state trace",
      "diagnosing retained state after a warm restart",
      "explaining relay notation within sequential execution",
      "matching rung order to committed output evidence",
      "reading input program and output phases on a scan timeline",
      "exposing the last-write result during a fault"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D14-L03",
    systemModel: "Sequential automation defines named states, guarded transitions, timeouts, entry actions and recovery, while events trigger only authorised changes.",
    failurePattern: "A normal-only sequence can hang or jump unpredictably when an event arrives twice, arrives late or occurs during reset or fault recovery.",
    visualExplanation: "A guarded state chart includes nominal production, timeout, fault, manual reset and recovery paths with event acceptance shown per state.",
    applicationTask: "Model a pick-and-place sequence, enumerate unexpected event timing and prove every reachable state has a safe timeout or recovery transition.",
    terms: [
      ["State machine", "A model of named states and permitted transitions driven by events and guards.", "A diagram is incomplete without initial, timeout, fault and recovery behaviour."],
      ["Transition guard", "A Boolean condition that must be true before an event may move the machine between states.", "A guard must use current qualified evidence and cannot substitute for the triggering event."],
      ["Timeout", "A bounded interval after which missing progress causes a defined alternate transition.", "A timeout needs a safe destination and diagnostic evidence, not merely a reset of the timer."]
    ],
    entities: [
      ["input", "Pick-and-place events", "Sensor edges, commands and timeouts relevant to the sequence."],
      ["state", "Current sequence state", "The one declared state governing accepted events and active commands."],
      ["mechanism", "Guarded transition logic", "The event, guard, action and destination rule."],
      ["observation", "State and event journal", "Timestamped transitions, rejected events and timeout evidence."],
      ["decision", "Safe next action", "The actuator action permitted by the current state and validated transition."]
    ],
    relations: [
      ["causes", "a qualified event causes consideration of a guarded transition", "directed", "many-to-one"],
      ["constrains", "the current state constrains which events and commands are authorised", "directed", "one-to-many"],
      ["transforms", "guarded transition logic transforms the current state into one next state", "directed", "many-to-one"],
      ["measures", "the state and event journal measures whether progress and timeouts match the model", "directed", "many-to-one"],
      ["invalidates", "an unguarded jump or state without recovery invalidates the safe next action", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Every state, event, guard, timeout and actuator command is enumerated before implementation."],
      ["assumption", "Input events are qualified and duplicate or stale events carry identities that can be rejected."],
      ["criterion", "Every reachable state has a safe response to expected, unexpected, timeout and reset events."],
      ["operating-state", "The altered case accepts a delayed completion event after the sequence has entered fault recovery."]
    ],
    failure: [
      "The normal sequence is implemented as scattered flags without a single authorised current state or stale-event rule.",
      "A delayed or duplicate event triggers an actuator action that belongs to an earlier sequence step.",
      "Reject the sequence until reachable states, guarded events, timeouts and recovery paths are deterministic."
    ],
    conceptualSteps: [
      "Name the initial, working, complete, timeout, fault and recovery states.",
      "For each state, list accepted events, required guards and forbidden commands.",
      "Define one transition destination and bounded action for each accepted event.",
      "Journal state, event identity, guard result and transition time.",
      "Inject duplicate, delayed, missing and out-of-order events and verify safe rejection or recovery."
    ],
    example: {
      scenario: "A gripper sequence moves from idle to approach, grasp, verify and place with explicit timeouts.",
      givenLabel: "Sequence events",
      givenValue: "start, at-target, grip-confirmed, timeout and reset",
      givenUnit: null,
      reasoning: [
        "Accept start only in idle with safety permissives true.",
        "Advance each state only on its qualified completion event and arm a state-specific timeout.",
        "Send missing progress to a fault state that removes motion and requires an authorised reset."
      ],
      outcome: "Nominal and missing-event paths reach deterministic bounded states.",
      criterion: "Every observed event is either accepted by one guarded transition or explicitly rejected and recorded.",
      verification: "Replay the event table in normal, duplicate, delayed, timeout and reset orders."
    },
    counterexample: {
      scenario: "A delayed grasp-complete event arrives after timeout moved the machine into the fault state.",
      givenLabel: "Stale event",
      givenValue: "completion identity from the prior grasp attempt",
      givenUnit: null,
      reasoning: [
        "The altered event is not authorised in the current fault state.",
        "Accepting it would bypass the recovery guard and re-enable sequence motion.",
        "Its old attempt identity provides evidence for rejection rather than transition."
      ],
      outcome: "The faulted machine unexpectedly enters the place state.",
      criterion: "Events from an earlier attempt must not change the current recovery state.",
      verification: "Inject the delayed event after timeout and confirm the journal records rejection with outputs safe."
    },
    misconception: {
      claim: "If every normal step works in order, the automation sequence is complete.",
      mechanism: "Unexpected timing, duplicate events, timeouts, reset and recovery are excluded from the reachable-state model.",
      correction: "Specify every reachable state and prove bounded behaviour for missing, late and unauthorised events.",
      disconfirmingObservation: "A late completion event advances the sequence from fault because no state-specific guard rejects it."
    },
    assessmentMoves: [
      "sequencing pick and place events through guarded states",
      "recovering from a stale completion after timeout",
      "screening transition claims by current-state authority",
      "diagnosing a duplicate event in the state journal",
      "explaining why nominal order omits recovery",
      "matching guards and timeouts to safe destinations",
      "reading authorised and rejected edges on a state chart",
      "revealing a fault bypass from an old attempt identity"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D14-L04",
    systemModel: "SCADA gathers distributed state, an HMI presents authorised interaction, interlocks constrain operation and alarms direct timely response to abnormal conditions.",
    failurePattern: "An alarm flood, stale display or bypassed interlock can make operators act on incomplete state even when each field signal is individually valid.",
    visualExplanation: "A supervisory path links field value and quality through controller, interlock and alarm logic to HMI indication, acknowledgement and operator action.",
    applicationTask: "Design an abnormal-condition scenario, verify interlock behaviour and create a prioritised alarm response that exposes stale data and bypass status.",
    terms: [
      ["Interlock", "A control rule that prevents or removes operation when a prohibited condition exists.", "A displayed warning is not an interlock unless it actually constrains the command path."],
      ["Alarm", "A prioritised notification of an abnormal condition requiring a defined operator response.", "A normal status change, raw event or nuisance repetition is not automatically an actionable alarm."],
      ["Data quality", "Metadata describing whether a displayed value is current, valid and trustworthy for its intended use.", "A plausible numeric value must not be treated as live when timestamp or communication quality is bad."]
    ],
    entities: [
      ["input", "Field temperature and status", "Measured value, timestamp, validity and controller mode."],
      ["mechanism", "Controller interlock logic", "The bounded rule that constrains heater operation."],
      ["state", "SCADA data record", "Value, engineering unit, quality, timestamp and alarm state."],
      ["observation", "HMI alarm presentation", "Priority, condition, consequence, response and acknowledgement state."],
      ["decision", "Authorised operator action", "The action permitted by interlocks and supported by current data."]
    ],
    relations: [
      ["maps", "field temperature and status map into a quality-tagged SCADA record", "directed", "many-to-one"],
      ["constrains", "controller interlock logic constrains heater commands independently of display state", "directed", "one-to-many"],
      ["transforms", "the SCADA record transforms abnormal evidence into a prioritised alarm state", "directed", "many-to-one"],
      ["supports", "the HMI alarm presentation supports an authorised operator action", "directed", "many-to-one"],
      ["invalidates", "stale data, alarm flood or bypassed interlock invalidates the operator-action claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Sensor validity, timestamp source, communication quality and controller mode are available to supervision."],
      ["boundary", "Safety-relevant interlocks execute in the authorised control layer and bypasses are controlled and visible."],
      ["criterion", "Each alarm has one abnormal condition, priority, consequence, response and clear-state rule."],
      ["operating-state", "The altered case freezes the last good temperature on the HMI after communication quality becomes bad."]
    ],
    failure: [
      "The HMI preserves plausible values and floods undifferentiated alarms while the independent interlock or quality state is hidden.",
      "The operator acts on stale information or misses the one alarm requiring immediate response.",
      "Reject the supervisory design until quality, interlock status, priority and response are explicit and tested."
    ],
    conceptualSteps: [
      "Carry engineering unit, timestamp and quality with each field value into supervision.",
      "Place each interlock in the control layer able to constrain the hazardous command.",
      "Define alarm condition, priority, consequence, response, acknowledgement and clear rules.",
      "Present abnormal state and bypass status without obscuring the primary operator task.",
      "Test stale data, alarm bursts, lost communication and interlock bypass with the operator response procedure."
    ],
    example: {
      scenario: "A heater high-temperature interlock acts in the controller while SCADA displays value, quality and one prioritised alarm.",
      givenLabel: "Supervisory record",
      givenValue: "temperature, timestamp, quality, interlock and alarm state",
      givenUnit: "deg C",
      reasoning: [
        "Evaluate the interlock using validated controller input and remove heater demand at the declared boundary.",
        "Transmit temperature with timestamp, quality and interlock status to SCADA.",
        "Present one actionable alarm with the required response and confirm it clears only after the defined condition."
      ],
      outcome: "Hazardous heating is constrained locally and the operator sees current evidence and a defined response.",
      criterion: "The interlock acts without HMI dependence and the alarm remains actionable under valid and invalid data states.",
      verification: "Inject high temperature, stale communication and bypass states while recording controller outputs and HMI presentation."
    },
    counterexample: {
      scenario: "Communication fails but the HMI continues showing the last good temperature without a stale indicator.",
      givenLabel: "Frozen display",
      givenValue: "normal-looking value with bad communication quality",
      givenUnit: "deg C",
      reasoning: [
        "The altered record violates the current-quality assumption.",
        "A plausible last value does not reveal the present process condition.",
        "Operator permission based on that value cannot satisfy the authorised-action criterion."
      ],
      outcome: "The operator attempts a restart using an obsolete normal temperature.",
      criterion: "A value with bad or stale quality must not support an operation decision that requires current state.",
      verification: "Break communication and confirm the display, alarm and command permissions change within the declared timeout."
    },
    misconception: {
      claim: "An HMI warning is equivalent to a safety interlock because the operator can react.",
      mechanism: "Human response and display availability are substituted for the automatic command constraint.",
      correction: "Implement the interlock in the authorised control path and use the HMI to communicate its state and response.",
      disconfirmingObservation: "The heater continues energising while the warning screen is disconnected."
    },
    assessmentMoves: [
      "sequencing field quality through interlock and alarm response",
      "recovering from a frozen last-good display",
      "screening supervisory claims by actionability and freshness",
      "diagnosing an alarm flood around one critical condition",
      "explaining interlock authority separately from HMI advice",
      "matching quality metadata to command permissions",
      "reading control and supervisory paths on one architecture",
      "exposing a restart decision based on stale temperature"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D14-L05",
    systemModel: "UART serialises point-to-point bytes, SPI clocks full-duplex peripheral transfers, I2C addresses shared-bus devices and CAN arbitrates robust multi-node frames.",
    failurePattern: "Matching connectors or nominal bit rates do not ensure communication when voltage levels, clock phase, addressing, termination or error recovery differ.",
    visualExplanation: "Four bus timing and topology panels compare wires, framing, clock ownership, addressing, arbitration, termination and fault detection.",
    applicationTask: "Select a bus for several sensors and one actuator controller, justify electrical and timing choices and diagnose an injected framing or termination fault.",
    terms: [
      ["UART", "An asynchronous serial interface that frames bits using an agreed rate, format and electrical level.", "Matching baud rate alone does not establish voltage compatibility, clock tolerance or frame meaning."],
      ["SPI", "A clocked controller-peripheral interface with separate data paths and device selection.", "Clock polarity, phase, bit order, selection timing and electrical loading must match each peripheral."],
      ["CAN arbitration", "A non-destructive priority process in which simultaneous transmitters compare identifier bits and lower-priority frames defer.", "Winning arbitration does not guarantee application freshness, correct termination or sufficient bus capacity."]
    ],
    entities: [
      ["input", "Sensor message requirement", "Payload, update rate, distance, node count and fault needs."],
      ["component", "Physical bus and transceivers", "Wiring, levels, termination, pull resistors and node interfaces."],
      ["mechanism", "Framing and arbitration", "Clocking, addressing, identifier or chip-select rules for one transfer."],
      ["observation", "Timing and error capture", "Waveform, decoded frames, acknowledgements and error counters."],
      ["decision", "Selected communication link", "The protocol and configuration retained for the system requirement."]
    ],
    relations: [
      ["depends-on", "the message requirement depends on payload rate, distance, node count and fault response", "directed", "many-to-one"],
      ["constrains", "the physical bus constrains levels, topology, length and termination", "directed", "one-to-many"],
      ["routes", "framing and arbitration route each payload to its intended endpoint", "directed", "many-to-many"],
      ["measures", "timing and error capture measures whether transfers meet the requirement", "directed", "many-to-one"],
      ["invalidates", "wrong levels, timing, addressing or termination invalidates link selection", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Payload, rate, latency, topology, electrical levels and fault-recovery needs are declared."],
      ["assumption", "Every endpoint implements the same frame format, timing parameters and physical convention."],
      ["criterion", "Maximum-load captures show correct frames, bounded latency and recovery from the required faults."],
      ["operating-state", "The altered case connects a five-volt UART output directly to a lower-voltage input and sees intermittent bytes."]
    ],
    failure: [
      "A protocol is selected by connector or nominal rate while its electrical layer, timing details and system load are omitted.",
      "Communication works on a short bench cable but corrupts data, damages an input or misses deadlines in the assembled system.",
      "Reject the link until electrical compatibility, framing, capacity and observed fault recovery all pass."
    ],
    conceptualSteps: [
      "Write payload, cadence, latency, topology, distance and fault requirements.",
      "Select a candidate protocol and verify voltage, wiring, pull or termination needs.",
      "Configure framing, clock, addressing, arbitration and error handling at every endpoint.",
      "Capture waveforms and decoded traffic at minimum and maximum intended load.",
      "Inject disconnect, wrong address, framing and termination faults and verify bounded recovery."
    ],
    example: {
      scenario: "Several motor controllers share a terminated CAN bus with prioritised control and diagnostic identifiers.",
      givenLabel: "Network need",
      givenValue: "four nodes, bounded control latency and lower-priority diagnostics",
      givenUnit: null,
      reasoning: [
        "Check transceiver voltage, linear topology, termination and common-mode range.",
        "Allocate identifiers so required control traffic wins arbitration without starving diagnostics.",
        "Measure bus utilisation, worst-case latency and error recovery under simultaneous transmission."
      ],
      outcome: "Control messages meet their latency budget and faults appear in observable error counters.",
      criterion: "Electrical waveform, decoded content, arbitration latency and recovery all satisfy the declared network boundary.",
      verification: "Capture maximum-load traffic and introduce one missing terminator and one disconnected node separately."
    },
    counterexample: {
      scenario: "A five-volt UART transmit pin is wired directly to a lower-voltage controller because both use the same baud rate.",
      givenLabel: "Electrical mismatch",
      givenValue: "matching frame format with incompatible logic level",
      givenUnit: "V",
      reasoning: [
        "The altered link violates the physical-level boundary before framing is considered.",
        "The receiving protection structure may clamp current or exceed its absolute rating.",
        "Occasional readable bytes do not establish a safe compatible interface."
      ],
      outcome: "The link is intermittent and the receiving input is overstressed.",
      criterion: "Both physical and frame-layer requirements must pass for communication to be accepted.",
      verification: "Compare data-sheet voltage limits and measure the receive-pin waveform and clamp current."
    },
    misconception: {
      claim: "Two devices can communicate whenever their protocol name and bit rate match.",
      mechanism: "Electrical levels, clock details, topology, addressing, capacity and error recovery are omitted.",
      correction: "Verify every layer from physical signalling through message semantics under system load.",
      disconfirmingObservation: "A logic analyser decodes bench frames while the receiving pin exceeds its rated voltage."
    },
    assessmentMoves: [
      "ordering a message requirement through physical and frame layers",
      "repairing an overvoltage UART connection",
      "screening bus choices by load and fault behaviour",
      "diagnosing CAN errors from termination evidence",
      "explaining arbitration without promising delivery",
      "matching SPI timing details to peripheral captures",
      "reading topology framing and latency on one link model",
      "revealing electrical damage beneath readable bytes"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D14-L06",
    systemModel: "Modbus exchanges addressed data items, MQTT publishes topic messages through a broker and OPC UA exposes typed information models with quality and security context.",
    failurePattern: "Successful transport can still carry the wrong engineering meaning when register scaling, topic semantics, timestamps, quality or authorisation are unspecified.",
    visualExplanation: "A protocol comparison maps physical value to Modbus register, MQTT payload and OPC UA node while retaining type, unit, quality, timestamp and access control.",
    applicationTask: "Represent one motor-temperature value in all three protocols, define its semantics and test stale, malformed and unauthorised update handling.",
    terms: [
      ["Modbus register map", "An agreement assigning addresses, data types, scaling and access meaning to exchanged values.", "The protocol does not define the engineering semantics of a vendor-specific register by itself."],
      ["MQTT topic", "A hierarchical name used to route published payloads through a broker to subscribers.", "A topic name does not guarantee payload schema, freshness, delivery semantics or authorisation."],
      ["OPC UA node", "A typed information-model element with identity, value and related metadata such as unit, quality and access rights.", "A rich model still requires consistent namespace governance and secured endpoint configuration."]
    ],
    entities: [
      ["input", "Motor temperature value", "A physical measurement with unit, timestamp and quality."],
      ["mechanism", "Protocol encoding", "Register, topic payload or typed node representation."],
      ["state", "Semantic contract", "The shared definition of identity, type, unit, scaling, freshness and access."],
      ["observation", "Consumer-decoded record", "The value and metadata reconstructed by an independent client."],
      ["decision", "Interoperable information flow", "The accepted exchange when producer and consumer preserve the same meaning."]
    ],
    relations: [
      ["maps", "the motor temperature maps into one protocol encoding", "directed", "one-to-many"],
      ["depends-on", "protocol encoding depends on a shared semantic contract", "directed", "many-to-one"],
      ["transforms", "the semantic contract transforms transport fields into engineering meaning", "directed", "many-to-one"],
      ["supports", "the consumer-decoded record supports an interoperable information flow", "directed", "many-to-one"],
      ["invalidates", "wrong scaling, stale data or unauthorised writes invalidates interoperability", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Producer and consumer share a versioned identity, type, byte order, unit and scaling definition."],
      ["boundary", "Freshness, quality, delivery, authentication and write-authorisation rules are declared for the use case."],
      ["criterion", "An independent client reconstructs the same value, unit, timestamp, quality and access result."],
      ["operating-state", "The altered case decodes a Modbus integer as degrees while the producer encoded tenths of a degree."]
    ],
    failure: [
      "Successful transport is mistaken for shared meaning while scaling, schema, timestamp, quality or authority differs.",
      "A consumer displays or writes a plausible but incorrect engineering value.",
      "Reject the exchange until an independent decode proves semantic and access equivalence."
    ],
    conceptualSteps: [
      "Define the physical value identity, type, unit, scaling, timestamp, quality and ownership.",
      "Map that contract explicitly into Modbus registers, an MQTT payload or OPC UA nodes.",
      "Declare transport delivery and security behaviour separately from engineering semantics.",
      "Decode with an independent client and compare every field with the producer source.",
      "Test stale, malformed, version-mismatched and unauthorised updates."
    ],
    example: {
      scenario: "One motor temperature is represented in a Modbus register, a versioned MQTT payload and a typed OPC UA node.",
      givenLabel: "Semantic value",
      givenValue: "42.3 deg C, current timestamp and good quality",
      givenUnit: null,
      reasoning: [
        "Define one canonical identity, unit, numeric type, scaling and freshness rule.",
        "Document each protocol mapping without losing timestamp, quality or access intent.",
        "Decode all three independently and compare reconstructed meaning with the canonical record."
      ],
      outcome: "Each protocol carries the same temperature meaning despite different transport representations.",
      criterion: "Independent consumers reconstruct identical value, unit, quality, freshness and permitted action.",
      verification: "Round-trip boundary values and inject stale, malformed and unauthorised records for each mapping."
    },
    counterexample: {
      scenario: "A client treats a raw Modbus value of 423 as 423 degrees because the scale factor is undocumented.",
      givenLabel: "Raw register",
      givenValue: "423 with missing scale metadata",
      givenUnit: null,
      reasoning: [
        "The altered decode lacks the shared semantic contract.",
        "A valid register response proves only transport and address, not engineering scale.",
        "The resulting temperature cannot meet the independent-equivalence criterion."
      ],
      outcome: "The consumer raises a false over-temperature condition.",
      criterion: "Every numeric transport value must be decoded through its versioned type, unit and scaling contract.",
      verification: "Compare producer engineering value, raw payload and independent consumer output for several known points."
    },
    misconception: {
      claim: "Using an industrial protocol automatically makes data interoperable.",
      mechanism: "Message delivery is confused with common identity, type, unit, quality, freshness and authorisation.",
      correction: "Version and test the semantic contract independently of the chosen transport.",
      disconfirmingObservation: "Two valid clients read the same register but display temperatures differing by a factor of ten."
    },
    assessmentMoves: [
      "sequencing a physical temperature into three protocol forms",
      "recovering from an undocumented Modbus scale",
      "screening interoperability claims through independent decoding",
      "diagnosing whether transport or semantics caused disagreement",
      "explaining protocol delivery apart from information meaning",
      "matching freshness and access rules to consumer evidence",
      "reading one semantic contract across register topic and node",
      "exposing a false alarm from raw integer interpretation"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D14-L07",
    systemModel: "Ethernet frames and TCP/IP endpoints move network traffic, DDS distributes typed real-time data and commissioning verifies the complete architecture under operational conditions.",
    failurePattern: "A bench connection can fail in service through addressing conflict, latency, packet loss, incompatible DDS policy or an untested network recovery path.",
    visualExplanation: "A commissioned network map overlays physical links, addresses, transport sessions, DDS participants, timing budgets, monitoring and fault-isolation points.",
    applicationTask: "Plan end-to-end commissioning for a controller and robot network, measure timing and exercise link loss, restart and incompatible-policy scenarios.",
    terms: [
      ["IP endpoint", "A network address and transport port identifying a communicating process interface.", "Reachability does not establish application compatibility, bounded latency or authorised identity."],
      ["DDS quality of service", "A set of policies controlling data distribution behaviour such as reliability, durability, history and deadline.", "Incompatible offered and requested policies can prevent matching even when the network is reachable."],
      ["Commissioning", "The controlled process of proving installed architecture, configuration and behaviour against requirements.", "A successful ping or one nominal cycle is not complete commissioning evidence."]
    ],
    entities: [
      ["input", "Distributed control data", "Typed commands, state and diagnostics with timing needs."],
      ["component", "Ethernet and IP path", "Links, switches, addresses, routes and transport endpoints."],
      ["mechanism", "DDS data exchange", "Participant discovery, topic matching and quality-of-service enforcement."],
      ["observation", "Commissioning evidence set", "Topology, configuration, captures, timing, fault and recovery records."],
      ["decision", "Accepted network architecture", "The installed system accepted for operation within a declared envelope."]
    ],
    relations: [
      ["depends-on", "distributed control data depends on declared type, rate, latency and ownership", "directed", "many-to-one"],
      ["routes", "the Ethernet and IP path routes packets between configured endpoints", "directed", "many-to-many"],
      ["constrains", "DDS policy compatibility constrains discovery and data delivery", "directed", "many-to-many"],
      ["supports", "the commissioning evidence set supports the network-architecture decision", "directed", "many-to-one"],
      ["invalidates", "address conflict, policy mismatch or unbounded recovery invalidates acceptance", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Topology, addresses, data types, traffic rates, policies, latency and recovery requirements are baselined."],
      ["assumption", "Switch, endpoint and time-source configurations are controlled and observable during commissioning."],
      ["criterion", "Nominal load, peak load and required fault cases meet delivery, timing and recovery acceptance limits."],
      ["operating-state", "The altered case uses reliable DDS on one endpoint and an incompatible best-effort request on another."]
    ],
    failure: [
      "Commissioning stops after basic reachability and omits application matching, traffic load, timing and recovery.",
      "The network passes a bench ping but distributed data silently fails or becomes late in operation.",
      "Reject acceptance until configuration, policy compatibility, load, faults and recovery are evidenced end to end."
    ],
    conceptualSteps: [
      "Baseline physical topology, address plan, endpoint roles, data types and timing budgets.",
      "Verify link, addressing, routing and transport before testing application discovery.",
      "Compare DDS offered and requested policies for every required data flow.",
      "Measure delivery and latency at nominal and peak traffic with synchronised evidence.",
      "Break links, restart nodes and introduce configuration mismatches, then verify bounded diagnosis and recovery."
    ],
    example: {
      scenario: "A robot controller and supervisory computer exchange typed state through DDS over a managed Ethernet network.",
      givenLabel: "Commissioning envelope",
      givenValue: "two endpoints, defined QoS, peak telemetry and link-loss recovery",
      givenUnit: null,
      reasoning: [
        "Verify the physical map, address plan, time source and endpoint configuration against the baseline.",
        "Confirm topic type and offered-requested policy compatibility before measuring data delivery.",
        "Load the network, remove one link and restart one participant while capturing latency and recovery."
      ],
      outcome: "The installed network delivers the required data and returns to a known state after declared faults.",
      criterion: "Every required flow meets type, policy, timing and recovery limits across the commissioned envelope.",
      verification: "Retain switch status, packet captures, DDS discovery records and synchronised endpoint timestamps."
    },
    counterexample: {
      scenario: "Both computers respond to ping, but a DDS reader never matches the writer because their policies are incompatible.",
      givenLabel: "Reachable endpoints",
      givenValue: "IP connectivity with no topic match",
      givenUnit: null,
      reasoning: [
        "The altered network satisfies basic routing but violates the application-policy condition.",
        "Ping carries no evidence about topic type or DDS quality-of-service compatibility.",
        "Without a match, the control data cannot satisfy the delivery criterion."
      ],
      outcome: "The HMI remains stale even though network diagnostics show both hosts online.",
      criterion: "Commissioning requires application data exchange with compatible policy, not only endpoint reachability.",
      verification: "Inspect DDS discovery and offered-requested policy diagnostics alongside packet and endpoint evidence."
    },
    misconception: {
      claim: "If every device can ping every other device, the industrial network is commissioned.",
      mechanism: "Basic IP reachability is substituted for typed application exchange, timing, load and fault recovery.",
      correction: "Commission each required data flow from physical path through application policy and operational recovery.",
      disconfirmingObservation: "Ping succeeds while incompatible DDS policies prevent any state update from matching."
    },
    assessmentMoves: [
      "sequencing commissioning from topology to application recovery",
      "recovering a DDS reader with incompatible policy",
      "screening network acceptance beyond reachability",
      "diagnosing stale data across discovery and packet evidence",
      "explaining Ethernet IP and DDS as distinct layers",
      "matching latency budgets to peak-load captures",
      "reading links endpoints topics and policies on one map",
      "revealing no data match despite successful ping"
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
  const observed = source.entities[3][1];
  const accepted = source.entities[4][1];
  const move = source.assessmentMoves[slot];
  if (move === undefined) {
    throw new Error(`Missing D14 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Arrange ${first}, ${second} and ${observed} into the operational order while ${move}:`,
      `${first} reaches ${accepted} because ${move} reconciles ${second} with ${observed}.`,
      `${accepted} is unsupported when ${move} bypasses the ${second} boundary or ${observed}.`,
      `Begin at the declared ${first} condition for ${observed} before ${move}.`,
      `Use ${observed} to position ${second} correctly during ${move}.`,
      `Place ${first} ahead of ${second} for ${observed}, then narrate ${move}.`,
      `Confirm ${accepted} against ${observed} after ${move}.`
    ],
    [
      `Restore the changed ${observed} case with ${first} and ${second} while ${move}:`,
      `${observed} supports ${accepted} once ${move} restores the ${first} boundary.`,
      `${second} remains unsupported if ${move} leaves the changed ${observed} unresolved.`,
      `Locate the altered ${observed} condition before ${move}.`,
      `Reconstruct the ${first} link governing ${second} and ${observed} during ${move}.`,
      `Retest ${second} against ${observed} while finishing ${move}.`,
      `Retain ${accepted} only when ${first} and ${observed} survive ${move}.`
    ],
    [
      `Choose the ${first} claims valid for ${second} and ${observed} while ${move}:`,
      `${accepted} is supported because ${move} preserves ${second} and ${observed}.`,
      `A ${first} claim fails when ${move} contradicts the ${observed} boundary.`,
      `Audit each ${second} statement against ${first} and ${observed} during ${move}.`,
      `Keep the ${observed} relation whose condition remains true after ${move}.`,
      `Mark the ${first} and ${second} claims supported by ${observed} during ${move}.`,
      `Reject the ${accepted} result that cannot match ${observed} during ${move}.`
    ],
    [
      `Determine why ${observed} changes ${accepted} through ${first} and ${second} while ${move}:`,
      `${first} and ${second} identify the changed ${observed} mechanism when ${move} is applied.`,
      `${accepted} is overclaimed if ${move} ignores the ${first} condition controlling ${observed}.`,
      `Find the earliest ${second} relation changing ${observed} during ${move}.`,
      `Contrast ${observed} with the bounded ${first} case before ${move}.`,
      `Keep the ${second} relation explaining ${accepted} after ${move}.`,
      `Remove the ${first} claim that ${observed} disproves during ${move}.`
    ],
    [
      `Describe ${first} by connecting ${second}, ${observed} and ${accepted} while ${move}:`,
      `The account joins ${first} to ${accepted} through ${observed} during ${move}.`,
      `The account fails when ${move} omits ${second} or the ${observed} criterion.`,
      `State the ${first} boundary for ${observed} before describing ${move}.`,
      `Explain how ${second} changes ${observed} during ${move}.`,
      `Connect ${first} to ${accepted} with the relation exposed by ${move}.`,
      `Finish with the ${observed} criterion limiting ${accepted} after ${move}.`
    ],
    [
      `Pair ${second} evidence with ${first} conditions and ${accepted} while ${move}:`,
      `Each ${observed} pair reaches the ${accepted} condition during ${move}.`,
      `A ${second} pair fails because ${move} assigns the wrong ${first} boundary.`,
      `Pair the earliest ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${observed} criterion for the relation concluded after ${move}.`,
      `Align ${first} and ${second} with ${observed} through ${move}.`,
      `Verify every ${accepted} pair by reading ${move} back through ${observed}.`
    ],
    [
      `Inspect the ${first} model from ${second} through ${observed} to ${accepted} while ${move}:`,
      `The selected path reaches ${accepted} because ${move} preserves the ${second} relation.`,
      `The model is misread if ${move} bypasses the ${observed} edge limiting ${first}.`,
      `Trace ${first} to ${second} and ${observed} during ${move}.`,
      `Inspect which ${observed} relation remains active after ${move}.`,
      `Follow ${second} arrows before judging ${accepted} during ${move}.`,
      `Select the ${accepted} path that keeps ${first} valid after ${move}.`
    ],
    [
      `Interpret changed ${observed} by tracing ${accepted} back to ${first} and ${second} while ${move}:`,
      `${observed} supports the implication because ${move} retains its ${second} path.`,
      `${accepted} is unsafe when ${move} treats a suppressed ${first} path as active.`,
      `Start at changed ${observed} and identify how ${move} affects ${second}.`,
      `Contrast the active ${first} route through ${observed} during ${move}.`,
      `Reconstruct the ${second} path that ${move} carries towards ${accepted}.`,
      `Accept ${accepted} only if the final ${observed} route agrees with ${move}.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D14 instruction plan ${slot}.`);
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
        throw new Error(`Missing D14 relation endpoints ${index}.`);
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
        throw new Error(`Missing D14 condition binding ${index}.`);
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

export const academyLessonTeachingProfileV2PlansE2D14 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE2D14 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE2D14,
    academyLessonTeachingProfileV2PlansE2D14
  );

export const academyLessonTeachingProfilesV2E2D14 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE2D14.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D14 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E2D14;
