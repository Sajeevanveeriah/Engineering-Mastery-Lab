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
    lessonId: "EML-E2-D13-L01",
    systemModel: "A microcontroller integrates a processor, addressable memory, buses and peripherals whose control and status registers connect firmware instructions to hardware state.",
    failurePattern: "Writing a register with the wrong width, reserved-bit value or clock state can silently misconfigure a peripheral or disturb unrelated hardware.",
    visualExplanation: "A memory map connects processor load and store operations through a bus to peripheral registers, with individual control, status and reserved bits labelled.",
    applicationTask: "Trace a documented peripheral setup from clock enable through register fields to an observable pin or flag, checking every mask and reset value.",
    terms: [
      ["Microcontroller", "A single integrated device containing a processor, memory, buses and controllable peripherals.", "The package still depends on external power, clocks, interfaces and loads that remain inside their ratings."],
      ["Memory-mapped register", "A documented address whose bits configure hardware or report peripheral state.", "Only documented access widths, writable bits and sequencing rules may be used."],
      ["Bit mask", "A binary pattern used to select particular register bits without changing unrelated bits.", "A read-modify-write operation is unsafe when the register has write-one-to-clear or other special semantics."]
    ],
    entities: [
      ["input", "Peripheral requirement", "The needed timer, serial or pin behaviour stated before register selection."],
      ["component", "Reference manual", "The authoritative address, reset value and bit-field description for the chosen device."],
      ["mechanism", "Register transaction", "A bounded read or write through the processor bus."],
      ["observation", "Observed peripheral state", "A pin, flag or counter value checked after configuration."],
      ["decision", "Accepted configuration", "The register setup retained only after the observed state matches the requirement."]
    ],
    relations: [
      ["maps", "the peripheral requirement maps to a documented register and field", "directed", "many-to-one"],
      ["routes", "the reference manual routes the processor to the correct address and access rule", "directed", "one-to-many"],
      ["transforms", "the register transaction changes the selected peripheral configuration", "directed", "one-to-many"],
      ["supports", "the observed peripheral state supports accepting the configuration", "directed", "many-to-one"],
      ["invalidates", "an undocumented address, mask or sequence invalidates the configuration claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "The exact microcontroller variant and current reference-manual revision are declared."],
      ["assumption", "Power, reset and clock prerequisites are satisfied before the register transaction."],
      ["criterion", "Readback and external observation agree with the requested peripheral behaviour."],
      ["operating-state", "The altered case writes a copied address or reserved bit from another device variant."]
    ],
    failure: [
      "Firmware writes a plausible but unsupported register value without checking variant, reset or special bit semantics.",
      "The peripheral remains disabled or another function changes while the source code appears to execute normally.",
      "Reject the configuration until documented address, mask, sequencing and observable state all agree."
    ],
    conceptualSteps: [
      "Name the peripheral behaviour and the exact microcontroller before opening the memory map.",
      "Find the register address, reset value, access type and prerequisite clock or reset controls.",
      "Build a mask that changes only the intended documented fields.",
      "Perform the transaction and compare readback with an external peripheral observation.",
      "Treat copied constants, reserved bits or unexplained readback as evidence to stop and recheck the manual."
    ],
    example: {
      scenario: "A beginner enables one timer clock and selects a documented output mode on a named microcontroller.",
      givenLabel: "Documented setup",
      givenValue: "one clock-enable bit and one two-bit mode field",
      givenUnit: null,
      reasoning: [
        "Confirm the exact device and locate both fields in its current reference manual.",
        "Read the reset values, apply masks and preserve every unrelated bit.",
        "Read back the fields and observe the expected timer output on the assigned pin."
      ],
      outcome: "The timer configuration is traceable from requirement through documentation to an observed output.",
      criterion: "Every changed bit is documented and the measured peripheral behaviour matches the requested mode.",
      verification: "Reset the device, repeat the minimal sequence and compare register readback with the pin observation."
    },
    counterexample: {
      scenario: "Firmware copies a timer address from a related microcontroller and writes a full hexadecimal word.",
      givenLabel: "Copied constant",
      givenValue: "address and register value from another device",
      givenUnit: null,
      reasoning: [
        "The altered address is outside the declared device documentation boundary.",
        "The full-word write can change reserved or unrelated fields.",
        "A successful processor store does not prove the intended peripheral received a valid configuration."
      ],
      outcome: "The timer does not start and an unrelated pin mode changes.",
      criterion: "A register configuration is acceptable only when the exact variant, fields and observed effect are verified.",
      verification: "Compare the copied address and every set bit with the target device memory map and reset state."
    },
    misconception: {
      claim: "A register is just an ordinary variable, so any bit pattern can be written and read back normally.",
      mechanism: "Hardware side effects, reserved bits, access widths and write-only or clear-on-write semantics are ignored.",
      correction: "Treat each register as a documented hardware interface and use masks, sequencing and external observation.",
      disconfirmingObservation: "A status bit clears when written with one even though the attempted ordinary-variable assignment used the same value."
    },
    assessmentMoves: [
      "auditing a reset-to-first-output register sequence",
      "recovering from a copied-address configuration fault",
      "screening bit-field claims against documented access semantics",
      "locating the first unsupported bus transaction",
      "teaching why a successful store is not peripheral proof",
      "matching address evidence to reset and readback conditions",
      "following a timer request across the memory map",
      "tracing a reserved-bit write towards the wrong pin state"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D13-L02",
    systemModel: "GPIO couples software state to electrical pins through direction, output driver, input threshold, pull network and reset configuration.",
    failurePattern: "A pin configured by software can still damage hardware or enter an unsafe state when voltage level, current limit, contention, floating input or reset behaviour is ignored.",
    visualExplanation: "A GPIO cell shows input buffer, output driver, pull resistor, register bits, external load and the electrical state during reset and active operation.",
    applicationTask: "Design a safe digital interface for a switch and actuator command, calculate current where needed and test startup, bounce, disconnect and conflicting-drive cases.",
    terms: [
      ["GPIO", "A configurable digital pin interface that can sense or drive logic states.", "Its voltage, current, direction and alternate-function limits still apply in every software state."],
      ["Pull resistor", "A resistor that gives an otherwise undriven input a defined default logic level.", "It does not replace debounce, level translation or a low-impedance external driver."],
      ["Safe reset state", "The pin direction and level that avoid unintended actuator energy while firmware starts or fails.", "Safety must be established electrically when software cannot guarantee the state soon enough."]
    ],
    entities: [
      ["input", "External switch signal", "A physical contact presented to a controller input."],
      ["component", "GPIO input network", "The pin, pull resistor, protection and common reference."],
      ["mechanism", "Debounce and state logic", "The time and logic rule that converts contact transitions into one event."],
      ["observation", "Measured pin waveform", "Voltage over time at the microcontroller pin during operation."],
      ["decision", "Safe digital command", "The accepted input event or bounded output state."]
    ],
    relations: [
      ["maps", "the external switch signal maps through the input network to a logic level", "directed", "many-to-one"],
      ["constrains", "the GPIO electrical ratings constrain pull value and external drive", "directed", "one-to-many"],
      ["causes", "debounce and state logic causes one accepted transition from a bouncing contact", "directed", "many-to-one"],
      ["measures", "the measured pin waveform determines whether voltage and timing are valid", "directed", "many-to-one"],
      ["invalidates", "an unsafe reset level or overcurrent invalidates the digital command", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The input and controller share a valid reference or approved isolated interface."],
      ["boundary", "Pin voltage, clamp current and output current remain within the device data-sheet limits."],
      ["criterion", "One physical action produces one accepted event and reset leaves the actuator de-energised."],
      ["operating-state", "The altered case leaves the input floating or briefly drives the actuator during reset."]
    ],
    failure: [
      "The circuit and firmware assume a default pin state that is not guaranteed during reset, disconnection or contact bounce.",
      "A floating input creates repeated commands or an output energises before the safe configuration runs.",
      "Reject the interface until electrical limits, default state, debounce and reset behaviour are measured."
    ],
    conceptualSteps: [
      "Classify the pin as input, output or alternate function and identify the connected circuit.",
      "Check logic thresholds, voltage, current, pull resistance and common reference.",
      "Define debounce or edge acceptance without hiding legitimate short events.",
      "Measure the pin waveform during normal use, disconnection and reset.",
      "Provide a hardware-safe default whenever firmware timing alone cannot prevent hazardous output."
    ],
    example: {
      scenario: "A normally open pushbutton uses a pull-up input and a time-qualified falling edge to request a robot stop.",
      givenLabel: "Input interface",
      givenValue: "3.3 V logic, 10 kOhm pull-up and 20 ms qualification",
      givenUnit: null,
      reasoning: [
        "Confirm that closed-contact voltage and current remain inside the pin ratings.",
        "Observe contact bounce and require the low level to persist for the declared interval.",
        "Disconnect and reset the controller to confirm the default command remains safe."
      ],
      outcome: "Each button press produces one bounded stop request and loss of the switch connection does not create motion.",
      criterion: "Voltage, current, event count and reset state all satisfy the declared interface requirements.",
      verification: "Capture the pin waveform and event log for press, release, cable removal and controller reset."
    },
    counterexample: {
      scenario: "An actuator-enable pin relies on a firmware pull-down that is configured several milliseconds after reset.",
      givenLabel: "Reset interval",
      givenValue: "pin floats before software initialisation",
      givenUnit: "ms",
      reasoning: [
        "The altered reset state removes the declared safe default.",
        "External coupling can raise the floating enable input above its logic threshold.",
        "Later firmware correction cannot erase an earlier actuator pulse."
      ],
      outcome: "The actuator twitches at power-up even though steady-state software commands off.",
      criterion: "The physical output must remain safe from power application through reset and normal operation.",
      verification: "Monitor the enable pin and actuator current from power application until firmware reaches its main loop."
    },
    misconception: {
      claim: "A digital pin is only zero or one, so analogue electrical details do not matter.",
      mechanism: "Thresholds, current, capacitance, noise, floating states and reset timing are hidden behind the Boolean value.",
      correction: "Verify the physical interface first, then define how measured voltage and time become a software state.",
      disconfirmingObservation: "The software alternates between zero and one while the oscilloscope shows a slowly drifting floating voltage."
    },
    assessmentMoves: [
      "sequencing a switch event from contact to safe command",
      "repairing a floating-input reset pulse",
      "separating valid GPIO evidence from Boolean assumptions",
      "diagnosing whether bounce or overvoltage caused the command",
      "explaining the electrical boundary beneath a digital state",
      "pairing waveform observations with pin-limit checks",
      "reading a pull-up and debounce signal path",
      "revealing an unsafe enable edge during controller reset"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D13-L03",
    systemModel: "Interrupts respond to asynchronous events, timers count clock intervals and PWM encodes command through duty cycle, all under bounded latency and priority.",
    failurePattern: "Long interrupt work, uncleared flags or unsuitable timer resolution can miss events, jitter PWM edges or starve lower-priority processing.",
    visualExplanation: "A timing lane aligns hardware event, interrupt request, service latency, timer count, PWM edges and return to foreground execution.",
    applicationTask: "Configure or model a periodic PWM update, measure interrupt latency and verify duty, frequency and missed-event behaviour under a competing event.",
    terms: [
      ["Interrupt", "A hardware or software request that diverts execution to a bounded service routine.", "An interrupt does not guarantee immediate service and must not contain unbounded blocking work."],
      ["Timer", "A peripheral that counts clock events to measure intervals or schedule events.", "Its resolution, range, prescaler and wraparound determine which intervals are representable."],
      ["PWM duty cycle", "The fraction of each PWM period for which the output is active.", "Duty cycle controls average command only when switching frequency and load dynamics make that interpretation valid."]
    ],
    entities: [
      ["input", "Encoder edge", "An asynchronous transition from a wheel encoder."],
      ["component", "Hardware timer", "A counter and capture channel clocked at a known rate."],
      ["mechanism", "Interrupt service routine", "The short routine that records capture data and clears the request."],
      ["observation", "Latency and capture log", "Recorded timestamps and service delays for the edge stream."],
      ["decision", "Deadline-safe speed update", "A speed estimate and PWM update accepted only when timing bounds hold."]
    ],
    relations: [
      ["causes", "the encoder edge causes a timer capture and interrupt request", "directed", "one-to-many"],
      ["depends-on", "the capture timestamp depends on timer clock, prescaler and wrap handling", "directed", "many-to-one"],
      ["transforms", "the interrupt service routine transforms capture events into queued timing data", "directed", "many-to-one"],
      ["measures", "the latency and capture log measures whether the deadline was met", "directed", "many-to-one"],
      ["invalidates", "missed edges, excessive latency or uncleared flags invalidate the speed update", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Maximum edge rate, timer range and required control-update deadline are declared."],
      ["assumption", "The timer clock is known and higher-priority interrupt load remains within its budget."],
      ["criterion", "Every required edge is captured and the control update completes before its deadline."],
      ["operating-state", "The altered case performs blocking communication inside the encoder interrupt routine."]
    ],
    failure: [
      "An interrupt routine performs variable-duration work while event rate and priority interactions remain unbounded.",
      "Later edges are delayed or lost, corrupting measured speed and destabilising the PWM command.",
      "Reject the design unless capture, service latency, flag clearing and worst-case deadline evidence are recorded."
    ],
    conceptualSteps: [
      "State the event rate, required timestamp resolution and control deadline.",
      "Configure timer clock, prescaler, capture edge and wraparound handling.",
      "Keep the interrupt routine bounded by recording data and deferring slower work.",
      "Measure event capture and worst-case latency under competing interrupt load.",
      "Reject average timing evidence when any required event or deadline can be missed."
    ],
    example: {
      scenario: "A wheel encoder is captured by a one-megahertz timer and the interrupt routine only queues timestamps.",
      givenLabel: "Timing budget",
      givenValue: "10 us service budget and 1 ms control deadline",
      givenUnit: null,
      reasoning: [
        "Convert timer ticks to elapsed time with explicit wraparound handling.",
        "Measure the shortest and longest interrupt service times under other enabled interrupts.",
        "Compute speed outside the interrupt and update PWM before the one-millisecond deadline."
      ],
      outcome: "Encoder edges remain complete and the speed controller receives timely measurements.",
      criterion: "No required edge is lost and measured worst-case latency stays below each declared budget.",
      verification: "Drive the maximum edge rate while logging timer captures, interrupt entry and control-update completion."
    },
    counterexample: {
      scenario: "The encoder interrupt formats and transmits a diagnostic string through a blocking serial call.",
      givenLabel: "Blocking service time",
      givenValue: "variable serial transmission inside the interrupt",
      givenUnit: "us",
      reasoning: [
        "The altered routine violates the bounded-service assumption.",
        "Pending encoder edges accumulate while equal or lower-priority work cannot run.",
        "Average loop frequency cannot prove that individual captures and deadlines survive."
      ],
      outcome: "The speed estimate intermittently drops and the PWM command oscillates.",
      criterion: "The interrupt routine must have a measured worst-case time below the inter-arrival and deadline budgets.",
      verification: "Toggle trace pins at interrupt entry and exit while applying maximum encoder and communication load."
    },
    misconception: {
      claim: "An interrupt happens immediately, so code inside it has no timing cost.",
      mechanism: "Priority, masking, nesting, service duration and pending events are omitted from the execution model.",
      correction: "Budget worst-case latency and service time, keep the routine bounded and measure it under competing load.",
      disconfirmingObservation: "A trace shows an encoder edge waiting while a longer higher-priority routine completes."
    },
    assessmentMoves: [
      "ordering an encoder edge through capture and deferred control",
      "removing a blocking serial action from an interrupt",
      "filtering timing claims by worst-case service evidence",
      "diagnosing a missing edge in a priority trace",
      "explaining latency separately from PWM duty",
      "matching timer settings to wrap and deadline boundaries",
      "following timestamps across the interrupt handoff",
      "showing the backlog created by unbounded service work"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D13-L04",
    systemModel: "ADC and DAC peripherals exchange analogue levels with digital codes, while DMA moves sample blocks between peripherals and memory under explicit buffer ownership.",
    failurePattern: "A DMA transfer can expose partial or overwritten data when completion, alignment, cache visibility or buffer handoff is assumed rather than signalled.",
    visualExplanation: "A sample path connects analogue input, ADC, DMA controller, alternating memory buffers, processing task and DAC output with ownership states.",
    applicationTask: "Specify a double-buffered acquisition cycle, identify every ownership transition and test overrun, incomplete transfer and endpoint-code cases.",
    terms: [
      ["ADC", "A converter that maps a bounded analogue input range to discrete numeric codes.", "Resolution alone does not guarantee accuracy, bandwidth, reference quality or valid source settling."],
      ["DAC", "A converter that maps a numeric code to a bounded analogue output.", "Its output is limited by reference, settling, loading, monotonicity and update timing."],
      ["DMA ownership", "The explicit rule describing which processor or peripheral may read or write a buffer at each time.", "A completion flag does not make a buffer coherent if ownership changes before all data and metadata are stable."]
    ],
    entities: [
      ["input", "Conditioned sensor voltage", "The protected analogue signal presented to the converter."],
      ["component", "ADC trigger and reference", "The timing source and voltage reference that define conversion."],
      ["mechanism", "DMA buffer transfer", "Peripheral-to-memory movement performed without one processor action per sample."],
      ["observation", "Timestamped sample block", "Codes, timing and quality metadata inspected after transfer."],
      ["decision", "Accepted engineering values", "Scaled measurements retained only when range, timing and ownership checks pass."]
    ],
    relations: [
      ["maps", "the conditioned sensor voltage maps through the ADC range into a code", "directed", "many-to-one"],
      ["routes", "the trigger and reference route conversions into a declared sample cadence", "directed", "one-to-many"],
      ["depends-on", "the DMA transfer depends on buffer length, address, width and ownership", "directed", "many-to-one"],
      ["supports", "the timestamped sample block supports conversion into engineering values", "directed", "many-to-one"],
      ["invalidates", "clipping, overrun or premature buffer reuse invalidates the accepted values", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The analogue source settles inside the ADC acquisition interval and remains within the protected input range."],
      ["boundary", "Reference, trigger rate, DMA width, buffer length and cache or coherence rules are declared."],
      ["criterion", "Sample count, timestamps, range flags and calibration scaling agree for the complete buffer."],
      ["operating-state", "The altered case lets the processor read a half-updated DMA buffer without a handoff rule."]
    ],
    failure: [
      "Converter settings and DMA completion are treated as sufficient while analogue settling and buffer ownership are omitted.",
      "A sample block contains mixed acquisition cycles or codes shifted by width and alignment errors.",
      "Reject the block unless analogue range, trigger timing, transfer completion and exclusive ownership are proven."
    ],
    conceptualSteps: [
      "Bound the sensor voltage and select a reference and acquisition time compatible with its source impedance.",
      "Choose a trigger cadence below the complete converter and transfer throughput limit.",
      "Define DMA buffer width, length, ownership and completion or half-completion events.",
      "Attach timestamps, range checks and calibration before interpreting engineering values.",
      "Discard clipped, overrun, stale or concurrently modified buffers rather than smoothing the defect."
    ],
    example: {
      scenario: "A timer triggers a twelve-bit ADC and DMA fills alternating sensor buffers before a processing task reads them.",
      givenLabel: "Acquisition contract",
      givenValue: "1 ksample/s, 64 samples per buffer and explicit ready flags",
      givenUnit: null,
      reasoning: [
        "Check that input range, source settling and reference allow a valid conversion at the selected cadence.",
        "Assign one buffer to DMA while the task exclusively owns the other completed buffer.",
        "Validate count, timestamps and clipping flags before applying calibration."
      ],
      outcome: "Each engineering-value block comes from one complete, bounded and traceable acquisition interval.",
      criterion: "No processor read overlaps a DMA write and every code carries valid timing, range and calibration context.",
      verification: "Inject a ramp and verify monotonic codes, alternating ownership and exact samples per timer interval."
    },
    counterexample: {
      scenario: "A task polls the first element of a circular DMA buffer and processes the whole array whenever that value changes.",
      givenLabel: "Concurrent buffer",
      givenValue: "DMA continues writing during processor processing",
      givenUnit: null,
      reasoning: [
        "The altered buffer violates exclusive ownership.",
        "A changed first element does not prove the remaining samples belong to the same acquisition cycle.",
        "Calibration cannot repair mixed timestamps or partially overwritten codes."
      ],
      outcome: "The reported waveform contains discontinuities that were not present at the sensor input.",
      criterion: "A buffer is processable only after an explicit completion handoff and before DMA can reclaim it.",
      verification: "Stamp buffer generations at DMA completion and detect any generation change during processing."
    },
    misconception: {
      claim: "DMA makes sampling automatic, so the processor can read the buffer at any time.",
      mechanism: "Concurrent writers, completion boundaries, cache visibility and metadata ownership are ignored.",
      correction: "Treat DMA as another execution agent and define an atomic handoff between acquisition and processing.",
      disconfirmingObservation: "Two halves of one plotted block carry different generation counters while the input ramp is continuous."
    },
    assessmentMoves: [
      "sequencing an analogue sample through conversion and buffer handoff",
      "recovering a circular buffer with mixed generations",
      "screening ADC claims through range timing and ownership",
      "diagnosing whether clipping or concurrency caused a discontinuity",
      "explaining why converter resolution is not complete accuracy",
      "matching trigger evidence to DMA completion criteria",
      "reading a double-buffer acquisition graph",
      "exposing a processor read during peripheral ownership"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D13-L05",
    systemModel: "Embedded C and C++ express hardware behaviour through fixed-width values, volatile access, bounded storage, object lifetime and explicit error paths.",
    failurePattern: "Integer overflow, undefined shift, unchecked buffer access or dynamic lifetime error can change firmware behaviour only at boundary inputs or optimisation levels.",
    visualExplanation: "A firmware data path annotates types, widths, storage duration, volatile register boundaries and checks before values reach hardware.",
    applicationTask: "Review a small embedded calculation and register update, test numeric and buffer boundaries and replace any implementation-defined or unchecked operation.",
    terms: [
      ["Fixed-width integer", "An integer type with an explicit number of bits and signedness.", "Arithmetic still follows promotion and overflow rules that must be checked at boundaries."],
      ["Volatile access", "An access that the compiler must perform as an observable operation.", "Volatile does not provide atomicity, ordering between agents or thread synchronisation."],
      ["Object lifetime", "The interval during which storage contains a valid object that may be accessed through permitted references.", "A pointer cannot safely outlive the object or refer beyond its allocated bounds."]
    ],
    entities: [
      ["input", "Raw device data", "Bytes and flags received from a peripheral interface."],
      ["mechanism", "Typed decoding function", "Code that validates length, signedness and byte order before conversion."],
      ["state", "Validated measurement object", "A bounded in-memory representation with explicit units and status."],
      ["observation", "Compiler and runtime evidence", "Warnings, assertions and tests across normal and boundary inputs."],
      ["decision", "Deterministic firmware result", "The result accepted when behaviour is defined and resource use is bounded."]
    ],
    relations: [
      ["maps", "raw device data maps through declared widths and byte order", "directed", "many-to-one"],
      ["constrains", "the typed decoding function constrains length, bounds and conversion behaviour", "directed", "one-to-many"],
      ["transforms", "validated bytes transform into a measurement object with status", "directed", "many-to-one"],
      ["supports", "compiler and runtime evidence supports the deterministic result", "directed", "many-to-one"],
      ["invalidates", "overflow, out-of-bounds access or expired lifetime invalidates the result", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Byte count, byte order, numeric range, allocation policy and execution budget are declared."],
      ["assumption", "Peripheral registers use the documented volatile access while shared software state uses an appropriate synchronisation primitive."],
      ["criterion", "Boundary tests, warnings and runtime checks show defined behaviour with bounded memory and time."],
      ["operating-state", "The altered case casts an unchecked byte buffer and retains a pointer after its local storage ends."]
    ],
    failure: [
      "Convenient casts and implicit integer behaviour bypass size, alignment, lifetime and overflow checks.",
      "The firmware produces platform-dependent values or corrupts nearby state only under particular inputs or optimisation.",
      "Reject the code path until types, bounds, lifetime, arithmetic range and error handling are explicit and tested."
    ],
    conceptualSteps: [
      "Write the input byte contract, output units and complete error states before decoding.",
      "Choose fixed-width types and explicit byte operations compatible with alignment and byte order.",
      "Validate length and arithmetic range before constructing the measurement object.",
      "Compile with warnings and test minimum, maximum, malformed and truncated inputs.",
      "Treat undefined behaviour, unbounded allocation and dangling references as design failures rather than rare exceptions."
    ],
    example: {
      scenario: "A decoder reads a signed sixteen-bit sensor value from two network-order bytes into a bounded measurement object.",
      givenLabel: "Input frame",
      givenValue: "two payload bytes plus a valid-status flag",
      givenUnit: null,
      reasoning: [
        "Require the complete frame length before reading either byte.",
        "Combine unsigned bytes in declared order, then apply the intended signed conversion once.",
        "Test zero, positive limit, negative limit and truncated frames under enabled compiler warnings."
      ],
      outcome: "The same input bytes produce the same signed value and error state on every supported build.",
      criterion: "No read exceeds the frame, every conversion is defined and all boundary fixtures match expected values.",
      verification: "Run table-driven tests and compare decoded values with an independent byte-by-byte calculation."
    },
    counterexample: {
      scenario: "A function casts a received byte pointer to a larger signed integer pointer and stores that pointer for later use.",
      givenLabel: "Unchecked cast",
      givenValue: "unaligned buffer with temporary lifetime",
      givenUnit: null,
      reasoning: [
        "The altered access can violate alignment, byte-order and object-lifetime conditions.",
        "Keeping the pointer after the receive buffer is reused exposes unrelated future bytes.",
        "Volatile or a successful debug run cannot make the undefined access valid."
      ],
      outcome: "Optimised builds intermittently report impossible measurements.",
      criterion: "The decoder must use valid storage, declared alignment and bounded byte operations for every input.",
      verification: "Enable sanitising checks where available and repeat malformed, unaligned and buffer-reuse fixtures."
    },
    misconception: {
      claim: "Adding volatile to a pointer makes embedded code thread-safe and prevents all compiler-related faults.",
      mechanism: "Observable hardware access is confused with atomicity, memory ordering, bounds and lifetime correctness.",
      correction: "Use volatile only for its hardware-access purpose and apply separate types, ownership and synchronisation rules.",
      disconfirmingObservation: "Two tasks still lose updates to a volatile counter because the read-modify-write sequence is not atomic."
    },
    assessmentMoves: [
      "ordering frame validation before signed conversion",
      "repairing an unaligned cast with bounded byte decoding",
      "screening C and C++ claims through lifetime and overflow",
      "diagnosing an optimisation-only dangling reference",
      "explaining volatile without claiming synchronisation",
      "matching compiler evidence to runtime boundary fixtures",
      "following bytes into a typed measurement object",
      "revealing state corruption after receive-buffer reuse"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D13-L06",
    systemModel: "Real-time software is correct only when tasks meet deadlines, and an RTOS coordinates priorities, blocking, synchronisation and shared resources to make timing analysable.",
    failurePattern: "A low-priority task holding a shared resource can delay a critical task, while inconsistent lock order can deadlock an otherwise correct functional design.",
    visualExplanation: "A scheduling chart shows releases, execution, blocking, pre-emption, mutex ownership, deadline and a priority-inversion interval.",
    applicationTask: "Analyse a three-task schedule with one shared resource, identify worst blocking and test a synchronisation strategy against deadlines and deadlock.",
    terms: [
      ["Deadline", "The latest time by which a result or action must complete to remain useful or safe.", "Average completion time cannot establish a worst-case deadline guarantee."],
      ["RTOS task", "A schedulable execution context with declared priority, period or trigger and resource use.", "A high priority does not remove blocking, interference or execution-time variation."],
      ["Priority inversion", "A condition in which a high-priority task waits for a resource held by a lower-priority task while intermediate work delays release.", "A mutex protocol can bound some inversions but cannot repair an unbounded critical section."]
    ],
    entities: [
      ["input", "Periodic control release", "The event that makes the motor-control task ready."],
      ["mechanism", "Pre-emptive scheduler", "The RTOS rule choosing which ready task executes."],
      ["constraint", "Shared bus mutex", "The ownership mechanism protecting one non-reentrant communication resource."],
      ["observation", "Response-time trace", "Release, start, block, resume and completion timestamps for each task."],
      ["decision", "Schedulable task set", "The accepted design in which every required deadline holds under defined load."]
    ],
    relations: [
      ["depends-on", "the periodic control release depends on a bounded clock and release mechanism", "directed", "many-to-one"],
      ["routes", "the scheduler routes processor time according to ready state and priority", "directed", "one-to-many"],
      ["constrains", "the shared bus mutex constrains concurrent access and can introduce blocking", "directed", "many-to-one"],
      ["supports", "the response-time trace supports the schedulability decision", "directed", "many-to-one"],
      ["invalidates", "a missed deadline, deadlock or unbounded inversion invalidates the task set", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Task periods, priorities, worst-case execution estimates and blocking resources are declared."],
      ["boundary", "Critical sections are bounded and interrupt plus task interference is included in the timing model."],
      ["criterion", "Every observed and analysed worst-case response time remains below its deadline with margin."],
      ["operating-state", "The altered case lets a low-priority logging task hold the bus mutex during a long blocking transfer."]
    ],
    failure: [
      "Task priorities are selected from importance alone while execution time, blocking and resource ownership remain unmeasured.",
      "A high-priority control task waits behind lower-priority work and misses the actuator-update deadline.",
      "Reject the schedule until worst-case execution, interference, critical sections and response times are bounded."
    ],
    conceptualSteps: [
      "List each task trigger, period, deadline, priority and worst-case execution evidence.",
      "Identify every shared resource and define who may block while holding it.",
      "Trace pre-emption, mutex acquisition and release for the critical response path.",
      "Measure and analyse worst-case response under the declared maximum workload.",
      "Redesign long critical sections or ownership rather than raising every affected task priority."
    ],
    example: {
      scenario: "A one-kilohertz control task shares an SPI bus with a lower-priority diagnostic task through a bounded mutex section.",
      givenLabel: "Task budget",
      givenValue: "1 ms deadline, 120 us control work and 80 us maximum bus blocking",
      givenUnit: null,
      reasoning: [
        "Include control execution, maximum mutex blocking and higher-priority interrupt interference.",
        "Use a bounded transaction and an RTOS mutex protocol appropriate to the scheduler.",
        "Trace releases under maximum diagnostic and interrupt load and compare completion with the deadline."
      ],
      outcome: "The control task completes within one millisecond for every exercised worst-case release.",
      criterion: "The calculated and measured worst-case response time stays below the deadline without deadlock.",
      verification: "Record scheduler trace events for a sustained maximum-load run and inspect the longest response path."
    },
    counterexample: {
      scenario: "A low-priority logger takes the shared bus mutex and waits inside it for a slow storage write.",
      givenLabel: "Unbounded critical section",
      givenValue: "storage latency held inside the mutex",
      givenUnit: "ms",
      reasoning: [
        "The altered critical section violates the bounded-blocking condition.",
        "The high-priority control task cannot use the bus until storage completes.",
        "Priority inheritance cannot make an inherently variable storage operation meet the control deadline."
      ],
      outcome: "The control update misses several deadlines during log flushes.",
      criterion: "No low-priority operation may hold a required control resource for an unbounded duration.",
      verification: "Trace mutex ownership and task completion while forcing the slowest credible storage operation."
    },
    misconception: {
      claim: "The highest-priority task always runs immediately and therefore always meets its deadline.",
      mechanism: "Resource blocking, interrupt masking, higher-priority interference and execution-time variation are omitted.",
      correction: "Analyse the complete response time and bound every critical section and interference source.",
      disconfirmingObservation: "The trace shows the ready control task blocked on a mutex owned by the logger."
    },
    assessmentMoves: [
      "sequencing a task release through blocking and completion",
      "recovering from a storage call inside a control mutex",
      "screening real-time claims by worst-case response",
      "diagnosing priority inversion in a scheduler trace",
      "explaining deadline evidence beyond average loop rate",
      "matching task budgets to mutex ownership rules",
      "reading pre-emption and blocking on a response timeline",
      "exposing a missed control release during log flushing"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D13-L07",
    systemModel: "Field firmware moves through reset, boot selection, power modes, update validation and runtime diagnostics, while hardware-in-the-loop equipment supplies controlled interfaces.",
    failurePattern: "An interrupted update, unsafe boot output or uninstrumented low-power transition can leave a device unrecoverable or active in an unintended state.",
    visualExplanation: "A lifecycle state diagram connects reset, bootloader, verified image, application, sleep, wake, fault recovery, debug trace and hardware-in-the-loop stimulus.",
    applicationTask: "Define a safe firmware update and recovery sequence, then design a hardware-in-the-loop test for power loss, invalid image and reset-state outputs.",
    terms: [
      ["Bootloader", "A small trusted program that selects, verifies and starts an application image.", "It must preserve a recoverable path when an image is missing, corrupt or interrupted during update."],
      ["Power mode", "A hardware and software state that trades availability and wake latency for reduced energy use.", "Wake sources, retained state and outputs must be defined for every transition."],
      ["Hardware-in-the-loop", "A test arrangement in which real firmware exchanges timed signals with controlled simulated or emulated hardware.", "It complements rather than replaces electrical safety tests and representative physical validation."]
    ],
    entities: [
      ["input", "Signed firmware image", "The candidate application plus identity, version and integrity metadata."],
      ["mechanism", "Boot and update state machine", "The sequence for verification, programming, activation and rollback."],
      ["state", "Recoverable device state", "A bounded state that can accept a known-good image after failure."],
      ["observation", "Trace and HIL evidence", "Reset cause, update log, power trace and timed interface outcomes."],
      ["decision", "Field-ready firmware", "The image accepted only after update, recovery and interface tests pass."]
    ],
    relations: [
      ["causes", "the signed firmware image causes an update transition only after verification", "directed", "many-to-one"],
      ["maps", "the boot state machine maps reset cause and image status to a bounded next state", "directed", "many-to-one"],
      ["routes", "the recoverable state routes failed activation back to a known-good image or updater", "directed", "one-to-many"],
      ["supports", "trace and HIL evidence supports the field-ready decision", "directed", "many-to-one"],
      ["invalidates", "an unrecoverable interruption or unsafe reset output invalidates release", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Image identity, authenticity, version policy, power thresholds and safe output states are declared."],
      ["assumption", "The bootloader region and recovery trigger remain available after any permitted update failure."],
      ["criterion", "Valid updates boot, invalid images remain inactive and every interrupted update reaches recovery safely."],
      ["operating-state", "The altered case loses power after erasing the only application image and before writing a verified replacement."]
    ],
    failure: [
      "The update flow overwrites the only bootable image before the new image and recovery route are proven.",
      "A routine power interruption leaves the controller unable to boot while outputs assume an unsafe state.",
      "Reject release until authenticity, atomic activation, rollback, reset outputs and HIL fault cases all pass."
    ],
    conceptualSteps: [
      "Define the trusted boot boundary, image metadata and safe reset outputs.",
      "Verify the candidate before changing which image will boot.",
      "Program and validate into a recoverable slot before atomic activation.",
      "Instrument reset causes, power transitions and timed interfaces during HIL scenarios.",
      "Interrupt every update phase and prove the device returns to a bounded recovery state."
    ],
    example: {
      scenario: "A dual-image controller downloads into an inactive slot, verifies it and changes the boot selection only after validation.",
      givenLabel: "Update policy",
      givenValue: "active image, inactive candidate and rollback counter",
      givenUnit: null,
      reasoning: [
        "Check image target, version and authenticity before programming the inactive slot.",
        "Verify the complete stored image, then atomically mark it as a trial boot.",
        "Require an application health confirmation or automatically return to the prior image."
      ],
      outcome: "Valid firmware activates while power loss or failed health checks retain a recoverable known-good path.",
      criterion: "No single interrupted phase may remove both the bootloader and all verified application choices.",
      verification: "Cut power at each update transition and use HIL stimuli to confirm safe outputs, rollback and diagnostic records."
    },
    counterexample: {
      scenario: "An updater erases the only application before checking whether the downloaded replacement is complete and authentic.",
      givenLabel: "Interrupted update",
      givenValue: "power removed after erase and before verification",
      givenUnit: null,
      reasoning: [
        "The altered sequence removes the recoverable application state.",
        "The replacement has not yet met authenticity or completeness conditions.",
        "A later application-level retry cannot run because no valid application can start."
      ],
      outcome: "The device remains inactive until a physical programming interface is attached.",
      criterion: "The field update must preserve a trusted autonomous recovery route after every interruption point.",
      verification: "Enumerate update states and prove that each power-loss edge reaches bootloader recovery or a verified image."
    },
    misconception: {
      claim: "If a firmware file has the right checksum, it is safe to install and boot.",
      mechanism: "A corruption check is mistaken for authenticity, target compatibility, rollback safety and correct runtime behaviour.",
      correction: "Verify identity and authenticity, preserve atomic recovery and exercise power, reset and HIL fault scenarios.",
      disconfirmingObservation: "A correctly checksummed image for another hardware revision drives the actuator-enable pin incorrectly."
    },
    assessmentMoves: [
      "ordering image verification before atomic activation",
      "recovering from power loss after slot erasure",
      "screening firmware release evidence beyond a checksum",
      "diagnosing a boot loop from health-confirmation logs",
      "explaining how recovery differs from successful update",
      "matching HIL faults to safe boot states",
      "reading image slots and rollback paths on a lifecycle graph",
      "exposing an unrecoverable single-image overwrite"
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
    throw new Error(`Missing D13 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Order ${first}, ${second} and ${observed} while ${move}:`,
      `${first} reaches ${accepted} because ${move} keeps ${second} tied to ${observed}.`,
      `${accepted} is premature when ${move} skips the ${second} boundary or ${observed}.`,
      `Start with the declared ${first} condition for ${observed} before ${move}.`,
      `Use ${observed} to place ${second} correctly during ${move}.`,
      `Place ${first} before ${second} for ${observed}, then explain ${move}.`,
      `Test ${accepted} against ${observed} after ${move}.`
    ],
    [
      `Repair the altered ${observed} case with ${first} and ${second} while ${move}:`,
      `${observed} supports ${accepted} after ${move} restores the ${first} boundary.`,
      `${second} remains unsupported if ${move} leaves ${observed} unchecked.`,
      `Locate the changed ${observed} condition before ${move}.`,
      `Rebuild the ${first} link governing ${second} and ${observed} during ${move}.`,
      `Retest ${second} against ${observed} while completing ${move}.`,
      `Accept ${accepted} only when ${first} and ${observed} survive ${move}.`
    ],
    [
      `Select the ${first} claims valid for ${second} and ${observed} while ${move}:`,
      `${accepted} is supported because ${move} retains ${second} and ${observed}.`,
      `A ${first} claim fails when ${move} contradicts the ${observed} boundary.`,
      `Screen each ${second} statement against ${first} and ${observed} during ${move}.`,
      `Keep the ${observed} relation whose condition remains true after ${move}.`,
      `Mark the ${first} and ${second} claims supported by ${observed} during ${move}.`,
      `Reject the ${accepted} result that cannot match ${observed} during ${move}.`
    ],
    [
      `Diagnose why ${observed} changes ${accepted} through ${first} and ${second} while ${move}:`,
      `${first} and ${second} identify the changed ${observed} mechanism when ${move} is applied.`,
      `${accepted} is overclaimed if ${move} ignores the ${first} condition controlling ${observed}.`,
      `Find the first ${second} relation changing ${observed} during ${move}.`,
      `Compare ${observed} with the bounded ${first} case before ${move}.`,
      `Retain the ${second} relation explaining ${accepted} after ${move}.`,
      `Discard the ${first} claim that ${observed} disproves during ${move}.`
    ],
    [
      `Explain ${first} by connecting ${second}, ${observed} and ${accepted} while ${move}:`,
      `The explanation joins ${first} to ${accepted} through ${observed} during ${move}.`,
      `The explanation fails when ${move} omits ${second} or the ${observed} criterion.`,
      `Name the ${first} boundary for ${observed} before describing ${move}.`,
      `State how ${second} changes ${observed} during ${move}.`,
      `Connect ${first} to ${accepted} with the relation exposed by ${move}.`,
      `Close with the ${observed} criterion limiting ${accepted} after ${move}.`
    ],
    [
      `Match ${second} evidence to ${first} conditions and ${accepted} while ${move}:`,
      `Each ${observed} pair reaches the ${accepted} condition during ${move}.`,
      `A ${second} pair fails because ${move} assigns the wrong ${first} boundary.`,
      `Pair the earliest ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${observed} criterion for the relation concluded after ${move}.`,
      `Align ${first} and ${second} with ${observed} through ${move}.`,
      `Verify every ${accepted} pair by reading ${move} back through ${observed}.`
    ],
    [
      `Read the ${first} model from ${second} through ${observed} to ${accepted} while ${move}:`,
      `The selected path reaches ${accepted} because ${move} preserves the ${second} relation.`,
      `The model is misread if ${move} bypasses the ${observed} edge limiting ${first}.`,
      `Trace ${first} to ${second} and ${observed} during ${move}.`,
      `Inspect which ${observed} relation remains active after ${move}.`,
      `Follow ${second} arrows before judging ${accepted} during ${move}.`,
      `Select the ${accepted} path that keeps ${first} valid after ${move}.`
    ],
    [
      `Interpret alternate ${observed} by tracing ${accepted} back to ${first} and ${second} while ${move}:`,
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
    throw new Error(`Missing D13 instruction plan ${slot}.`);
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
        throw new Error(`Missing D13 relation endpoints ${index}.`);
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
        throw new Error(`Missing D13 condition binding ${index}.`);
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
        givens: [[
          "worked-given",
          source.example.givenLabel,
          source.example.givenValue,
          source.example.givenUnit,
          "e1"
        ]],
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
        givens: [[
          "counter-given",
          source.counterexample.givenLabel,
          source.counterexample.givenValue,
          source.counterexample.givenUnit,
          "e1"
        ]],
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

export const academyLessonTeachingProfileV2PlansE2D13 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE2D13 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE2D13,
    academyLessonTeachingProfileV2PlansE2D13
  );

export const academyLessonTeachingProfilesV2E2D13 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE2D13.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D13 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E2D13;
