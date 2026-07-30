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
    lessonId: "EML-E2-D15-L01",
    systemModel: "A signal carries variation of a physical quantity, and a system transforms that information according to causality, memory, linearity, time dependence and finite limits.",
    failurePattern: "Calling a transformation linear or memoryless from one trace can overlook saturation, hysteresis, delay or dependence on prior input.",
    visualExplanation: "An input waveform passes through contrasting static, dynamic, linear and saturating systems, with each output revealing the defining property.",
    applicationTask: "Classify a measured or simulated sensor-processing block for causality, memory and linearity using discriminating input pairs and retained outputs.",
    terms: [
      ["Signal", "A physical or computed quantity represented as a function of an independent variable such as time or position.", "The representation must retain unit, reference, domain and sampling context."],
      ["System", "A transformation that maps one or more input signals to output signals under declared conditions.", "A block name alone does not establish causality, linearity, memory or physical feasibility."],
      ["Linearity", "The property that scaled and added inputs produce outputs scaled and added in the same way.", "Passing one proportional test does not prove superposition across the operating range."]
    ],
    entities: [
      ["input", "Test input pair", "Two bounded sensor waveforms and their scaled combination."],
      ["mechanism", "Candidate signal transformation", "The processing block being classified."],
      ["state", "Retained internal history", "Past input or state information available to the transformation."],
      ["observation", "Output comparison set", "Outputs for individual, combined and time-shifted inputs."],
      ["decision", "System-property classification", "A bounded claim about causality, memory, linearity and time dependence."]
    ],
    relations: [
      ["maps", "the test input pair maps through the candidate transformation", "directed", "many-to-one"],
      ["depends-on", "the transformation output may depend on retained internal history", "directed", "many-to-one"],
      ["transforms", "the candidate system transforms each input into an observed output", "directed", "many-to-one"],
      ["compares", "the output comparison set supports superposition and shift tests", "undirected", "many-to-many"],
      ["invalidates", "saturation, anticipation or hidden history invalidates an overbroad classification", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Input domain, signal units, initial state and operating range are declared."],
      ["assumption", "Repeated tests use the same initial history unless history dependence is the property under test."],
      ["criterion", "The classification follows discriminating tests and is limited to the exercised operating domain."],
      ["operating-state", "The altered case tests only one small positive input and declares the saturating system linear everywhere."]
    ],
    failure: [
      "A familiar-looking trace or one nominal test is generalised into system properties without controlling input combinations and history.",
      "Later operation exposes saturation, delay or hysteresis that the classification did not predict.",
      "Reject the property claim until a discriminating test and a bounded operating domain are stated."
    ],
    conceptualSteps: [
      "Name each signal, independent variable, unit, reference and valid domain.",
      "Describe the candidate transformation and which prior values or internal states it may use.",
      "Apply scaled, summed and shifted inputs while controlling initial history.",
      "Compare outputs with the predictions for causality, memory, linearity and time invariance.",
      "Limit every retained property claim to the tested amplitude, frequency and operating region."
    ],
    example: {
      scenario: "A software gain block is tested with two input sequences, their sum and two scale factors below saturation.",
      givenLabel: "Input family",
      givenValue: "two sequences and their bounded linear combinations",
      givenUnit: "V",
      reasoning: [
        "Reset internal state and record outputs for each individual input.",
        "Apply the combined input and compare its output with the same combination of individual outputs.",
        "Repeat after a time shift and across the declared unsaturated amplitude range."
      ],
      outcome: "The block is classified as causal, memoryless, linear and time-invariant within the tested range.",
      criterion: "Superposition and shift comparisons must agree within tolerance without using future or retained values.",
      verification: "Use a second input family and deliberately approach the amplitude limit to locate the claim boundary."
    },
    counterexample: {
      scenario: "A clipped amplifier is called linear because one small input produces an output twice as large as the half-sized input.",
      givenLabel: "Single proportional test",
      givenValue: "two amplitudes below clipping",
      givenUnit: "V",
      reasoning: [
        "The altered test does not exercise the declared finite operating limit.",
        "It omits addition and scaling combinations that reach saturation.",
        "One local proportional result cannot satisfy the bounded linearity criterion."
      ],
      outcome: "The model predicts an impossible larger output when the actual amplifier clips.",
      criterion: "A linearity claim requires superposition across the stated input domain, including relevant boundaries.",
      verification: "Apply a summed input that crosses the clipping level and compare measured output with the linear prediction."
    },
    misconception: {
      claim: "A smooth input-output graph proves that a system is linear.",
      mechanism: "Visual smoothness is confused with the algebraic superposition property.",
      correction: "Test scaling and addition with controlled state and declare the amplitude domain.",
      disconfirmingObservation: "A smooth saturating curve fails the sum-of-outputs comparison near its limit."
    },
    assessmentMoves: [
      "sequencing a property test from inputs to bounded classification",
      "recovering from a one-trace linearity claim",
      "screening signal-system claims through superposition evidence",
      "diagnosing whether history or saturation caused mismatch",
      "explaining smoothness apart from mathematical linearity",
      "matching test inputs to causality and memory conditions",
      "reading input transformation and output comparisons",
      "revealing clipping beyond the small-signal region"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D15-L02",
    systemModel: "Continuous-time signals exist at every instant, discrete-time sequences exist at sample indices and digital signals additionally quantise amplitude into finite representations.",
    failurePattern: "Treating a sampled sequence as the original continuous waveform hides timing between samples, while treating digital codes as exact values hides quantisation.",
    visualExplanation: "One physical waveform is shown as a continuous curve, sampled stems and quantised digital codes aligned on a common time axis.",
    applicationTask: "Convert a bounded analogue waveform into sampled and quantised representations, then identify which timing and amplitude information each step removes.",
    terms: [
      ["Continuous-time signal", "A signal model defined for every time in its declared interval.", "A plotted curve is still a model and does not imply infinite measurement bandwidth or precision."],
      ["Discrete-time sequence", "Values indexed at separate sample instants.", "The sequence does not specify values between samples without an added reconstruction model."],
      ["Digital representation", "A discrete-time sequence whose amplitudes are encoded using a finite set of numeric codes.", "Finite code width, scaling, saturation and missing-value conventions bound the represented value."]
    ],
    entities: [
      ["input", "Analogue sensor waveform", "The physical voltage varying over time."],
      ["mechanism", "Sampling clock", "The rule selecting the instants at which values are observed."],
      ["mechanism", "Quantiser and encoder", "The mapping from sampled amplitude to a finite code."],
      ["observation", "Indexed code record", "Sample index, timestamp, code and range status."],
      ["decision", "Representable signal claim", "What timing and amplitude information the record can support."]
    ],
    relations: [
      ["maps", "the analogue waveform maps to values at sampling instants", "directed", "many-to-one"],
      ["constrains", "the sampling clock constrains available timing information", "directed", "one-to-many"],
      ["transforms", "the quantiser and encoder transforms each sample into a finite code", "directed", "many-to-one"],
      ["supports", "the indexed code record supports a bounded signal claim", "directed", "many-to-one"],
      ["invalidates", "missing timestamps, clipping or unknown scaling invalidates exact reconstruction claims", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The sampling instants, input range and code mapping are stable and known."],
      ["boundary", "Sample period, code width, reference and saturation behaviour are declared."],
      ["criterion", "Every code can be traced to an interval of input amplitude and one identified sample time."],
      ["operating-state", "The altered case plots digital codes as an exact continuous waveform without stating interpolation."]
    ],
    failure: [
      "A finite set of codes is treated as if it retained every value and time point of the physical waveform.",
      "The display implies exact events or amplitudes that were never observed or representable.",
      "Reject the claim until sample timing, code interval, scaling and reconstruction assumption are explicit."
    ],
    conceptualSteps: [
      "Describe the physical waveform with unit, time interval and bounded range.",
      "Apply the sampling clock and retain each sample time or index.",
      "Map each sampled amplitude into its quantisation interval and code.",
      "Record code, scaling, timestamp and clipping or missing-value status.",
      "State separately what was measured, what was quantised and what is only reconstructed between samples."
    ],
    example: {
      scenario: "A zero-to-five-volt ramp is sampled at fixed intervals and encoded into eight-bit unsigned codes.",
      givenLabel: "Representation settings",
      givenValue: "5 V range, 8 bit codes and fixed sample period",
      givenUnit: null,
      reasoning: [
        "List the exact sample instants selected from the continuous ramp.",
        "Map each sampled voltage into one of the finite code intervals.",
        "Report timestamp, code and the voltage interval represented rather than one exact analogue value."
      ],
      outcome: "The digital record preserves indexed quantised evidence with explicit timing and amplitude limits.",
      criterion: "Each record identifies one sample instant and one representable amplitude interval inside the declared range.",
      verification: "Decode several endpoint and midscale codes and compare their intervals with the original sampled voltages."
    },
    counterexample: {
      scenario: "A plotting tool joins sparse digital samples and labels the smooth line as the measured analogue waveform.",
      givenLabel: "Joined sample plot",
      givenValue: "codes connected by default interpolation",
      givenUnit: null,
      reasoning: [
        "The altered plot adds unmeasured values between sample instants.",
        "It also hides the finite amplitude interval represented by each code.",
        "The smooth curve therefore exceeds the evidence in the indexed code record."
      ],
      outcome: "A fast transient appears to occur at a time and amplitude not captured by any sample.",
      criterion: "Reconstruction must be labelled as a model and distinguished from sampled and quantised observations.",
      verification: "Overlay only the original sample stems and quantisation intervals, then compare the interpolated points."
    },
    misconception: {
      claim: "A digital recording is an exact copy of the original analogue signal.",
      mechanism: "Sampling gaps, quantisation intervals, clipping and scaling are hidden by a continuous-looking display.",
      correction: "Keep continuous, sampled and digital representations distinct and state the information lost at each step.",
      disconfirmingObservation: "Many different analogue values map to the same digital code at one sample instant."
    },
    assessmentMoves: [
      "sequencing a waveform through sampling and coding",
      "recovering from an unlabelled interpolated plot",
      "screening digital claims by timing and code intervals",
      "diagnosing whether clipping or sparse timing lost information",
      "explaining reconstruction separately from observation",
      "matching timestamps and codes to representation limits",
      "reading curve stems and codes on one time axis",
      "revealing invented values between sampled instants"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D15-L03",
    systemModel: "Sampling records a continuous signal at intervals, reconstruction estimates values between samples and aliasing makes distinct frequencies share the same discrete sequence.",
    failurePattern: "A smooth reconstructed plot can represent the wrong frequency when sample rate, input bandwidth or anti-alias filtering is not controlled.",
    visualExplanation: "Two different sinusoids pass through identical sample points, beside spectra that fold above the sampling boundary into a lower apparent frequency.",
    applicationTask: "Sample a known sinusoid at several rates, predict and observe alias frequencies and choose an anti-alias condition for the intended bandwidth.",
    terms: [
      ["Sample rate", "The number of samples acquired per unit time under a declared timing source.", "The nominal setting is insufficient when clock error, jitter or dropped samples are material."],
      ["Nyquist frequency", "Half the sample rate, marking the folding boundary for uniformly sampled real-valued signals.", "It is not automatically a safe maximum signal frequency because real filters require transition bandwidth."],
      ["Aliasing", "The loss of unique frequency identity when different continuous signals produce the same sampled sequence.", "No downstream digital algorithm can recover which unbounded input frequency produced an already aliased sequence."]
    ],
    entities: [
      ["input", "Band-limited sensor signal", "The intended physical frequency content plus possible out-of-band energy."],
      ["component", "Anti-alias filter and sampler", "The analogue bandwidth limit and uniform sample clock."],
      ["mechanism", "Spectral folding", "The mapping of content around sample-rate multiples into the observed band."],
      ["observation", "Sampled waveform and spectrum", "Timestamps, sample values and estimated spectral peaks."],
      ["decision", "Alias-safe acquisition setting", "The sample rate and analogue filter accepted for the intended bandwidth."]
    ],
    relations: [
      ["maps", "the sensor signal maps through filtering into the sampler input", "directed", "many-to-one"],
      ["constrains", "the filter and sample rate constrain unambiguous input bandwidth", "directed", "one-to-many"],
      ["causes", "spectral folding causes out-of-band content to appear at a lower sampled frequency", "directed", "many-to-one"],
      ["measures", "the waveform and spectrum measure observed discrete frequency content", "directed", "many-to-one"],
      ["invalidates", "uncontrolled input bandwidth or missing sample timing invalidates the alias-safe setting", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Required signal bandwidth, possible interference bandwidth, sample rate and filter attenuation are declared."],
      ["assumption", "Sampling is uniform enough for the stated folding analysis and no unreported samples are dropped."],
      ["criterion", "The analogue filter attenuates all frequencies that could fold into the decision band below the allowed error."],
      ["operating-state", "The altered case samples a tone above half the sample rate without an anti-alias filter."]
    ],
    failure: [
      "The sample rate is chosen from the desired signal alone while out-of-band input and real filter transition are omitted.",
      "A high-frequency disturbance appears as a credible low-frequency signal.",
      "Reject the setting until input bandwidth, filter attenuation, timing and folded-frequency tests are evidenced."
    ],
    conceptualSteps: [
      "Declare the highest required signal frequency and credible out-of-band content.",
      "Choose a sample rate with room for a physically achievable anti-alias transition band.",
      "Predict where candidate out-of-band frequencies fold into the sampled band.",
      "Measure sample timing and compare observed spectra with the folding prediction.",
      "Increase sample rate or analogue attenuation until folded error meets the acceptance limit."
    ],
    example: {
      scenario: "A vibration channel needs content to 200 Hz and uses an analogue low-pass filter before uniform sampling.",
      givenLabel: "Acquisition target",
      givenValue: "200 Hz decision band with higher-frequency interference",
      givenUnit: null,
      reasoning: [
        "Select a sample rate that leaves transition bandwidth above the 200 Hz signal band.",
        "Specify filter attenuation for interference that would fold into zero to 200 Hz.",
        "Inject tones around the folding boundary and compare observed peaks with predicted aliases."
      ],
      outcome: "The retained acquisition setting keeps folded interference below the declared decision error.",
      criterion: "Every credible out-of-band component is sufficiently attenuated before sampling.",
      verification: "Sweep an independent signal generator through the stopband and record the largest in-band folded response."
    },
    counterexample: {
      scenario: "A 700 Hz tone is sampled at 1 ksample/s without analogue filtering and appears as a 300 Hz sequence.",
      givenLabel: "Unfiltered tone",
      givenValue: "700 Hz input at 1000 samples per second",
      givenUnit: null,
      reasoning: [
        "The altered tone lies above the 500 Hz folding boundary.",
        "Its sampled values coincide with a lower-frequency discrete sequence.",
        "The spectrum cannot identify the original 700 Hz source after aliasing has occurred."
      ],
      outcome: "The acquisition reports a false 300 Hz component.",
      criterion: "Potential content above the folding boundary must be removed or bounded before sampling.",
      verification: "Change sample rate and observe the apparent peak move according to the alias-frequency prediction."
    },
    misconception: {
      claim: "Sampling at exactly twice the wanted bandwidth guarantees a correct digital signal.",
      mechanism: "Real anti-alias filter transition, out-of-band energy and timing imperfections are excluded.",
      correction: "Provide transition margin, bound all input content and verify folded response experimentally.",
      disconfirmingObservation: "A disturbance just above half the sample rate folds directly into the wanted band."
    },
    assessmentMoves: [
      "sequencing bandwidth filter and sampler selection",
      "recovering from an observed folded tone",
      "screening sample-rate claims through stopband evidence",
      "diagnosing an unexpected peak by changing sample rate",
      "explaining the folding boundary with filter margin",
      "matching interference frequencies to predicted aliases",
      "reading analogue and sampled spectra together",
      "revealing a 700 hertz source as a 300 hertz sequence"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D15-L04",
    systemModel: "A filter shapes signal magnitude and phase across frequency while also creating transient behaviour determined by order, coefficients and implementation.",
    failurePattern: "A filter that suppresses visible noise can delay or distort the event of interest, become unstable numerically or attenuate required bandwidth.",
    visualExplanation: "Time-domain pulse responses sit beside magnitude and phase curves for low-pass, high-pass and finite digital implementations.",
    applicationTask: "Compare two filters on a noisy event signal, quantify attenuation and delay and select the option that preserves the decision-relevant feature.",
    terms: [
      ["Passband", "The frequency region a filter is intended to retain within stated gain and phase limits.", "Passband does not mean perfectly unchanged amplitude or zero delay."],
      ["Stopband", "The frequency region a filter is intended to attenuate by at least a stated amount.", "A finite-order filter needs a transition region between passband and stopband."],
      ["Group delay", "A measure of how a filter delays modulation or waveform features across frequency.", "One scalar delay is not sufficient when delay varies materially across the signal bandwidth."]
    ],
    entities: [
      ["input", "Noisy event waveform", "A decision-relevant transient plus broadband and periodic disturbance."],
      ["mechanism", "Candidate filter", "An analogue or digital filter with specified order and parameters."],
      ["state", "Filter memory and coefficients", "Stored values and numeric parameters governing transient response."],
      ["observation", "Time and frequency evidence", "Attenuation, delay, overshoot, settling and numeric behaviour."],
      ["decision", "Accepted filtered event", "The retained output when noise reduction and event fidelity both pass."]
    ],
    relations: [
      ["maps", "the noisy event waveform maps into the candidate filter", "directed", "many-to-one"],
      ["depends-on", "filter response depends on memory, coefficients and implementation precision", "directed", "many-to-one"],
      ["transforms", "the filter transforms signal magnitude, phase and transient shape", "directed", "many-to-one"],
      ["compares", "time and frequency evidence compares noise suppression with event fidelity", "undirected", "many-to-many"],
      ["invalidates", "excess delay, distortion or instability invalidates the filtered event", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The event bandwidth, disturbance spectrum and decision timing are representative of use."],
      ["boundary", "Passband, stopband, transition, delay and implementation precision requirements are declared."],
      ["criterion", "Noise falls below its limit while event amplitude, timing and shape remain within tolerance."],
      ["operating-state", "The altered case increases smoothing until the event crosses the decision threshold too late."]
    ],
    failure: [
      "Filter selection optimises visible smoothness or one attenuation number while transient timing and implementation limits remain untested.",
      "The system misses or mis-times the event even though the output appears cleaner.",
      "Reject the filter until both frequency response and representative time-domain decisions pass."
    ],
    conceptualSteps: [
      "Separate required event bandwidth from disturbance content and define the decision timing tolerance.",
      "Choose candidate passband, stopband, transition and order without assuming an ideal edge.",
      "Evaluate coefficient precision, state range and startup or reset behaviour.",
      "Measure attenuation, phase or delay and representative event distortion.",
      "Select the least complex filter that meets both noise and event criteria with margin."
    ],
    example: {
      scenario: "Two low-pass filters are applied to a noisy force threshold event used for contact detection.",
      givenLabel: "Detection requirements",
      givenValue: "noise limit, amplitude tolerance and maximum detection delay",
      givenUnit: null,
      reasoning: [
        "Measure the event and disturbance spectra before setting the passband and stopband.",
        "Apply each filter with controlled initial state and record noise attenuation and event delay.",
        "Retain only the filter whose threshold crossing and peak shape stay within tolerance."
      ],
      outcome: "The selected filter reduces noise without hiding or materially delaying contact.",
      criterion: "Both spectral attenuation and time-domain detection error must satisfy their declared limits.",
      verification: "Replay independent contact records, including the fastest and smallest valid events, through both filters."
    },
    counterexample: {
      scenario: "A long moving average produces the smoothest trace but delays the contact threshold beyond the stop deadline.",
      givenLabel: "Over-smoothed output",
      givenValue: "lowest visible noise with excessive delay",
      givenUnit: "ms",
      reasoning: [
        "The altered filter meets only the appearance and noise objective.",
        "Its window memory spreads the event over a longer interval.",
        "The late threshold crossing violates the event-fidelity criterion."
      ],
      outcome: "The actuator continues moving after physical contact should have stopped it.",
      criterion: "Noise suppression is acceptable only when decision-relevant timing and shape are preserved.",
      verification: "Compare raw event time, filtered threshold time and stop deadline for the longest candidate window."
    },
    misconception: {
      claim: "The smoothest filtered signal is always the best measurement.",
      mechanism: "Visible noise reduction is prioritised while delay, attenuation and transient distortion are hidden.",
      correction: "Evaluate the filter against the actual signal and decision requirements in both domains.",
      disconfirmingObservation: "The smooth trace crosses the contact threshold after the required stop time."
    },
    assessmentMoves: [
      "sequencing filter choice from event needs to validation",
      "recovering from an over-smoothed late threshold",
      "screening filter claims through delay and attenuation",
      "diagnosing whether state or bandwidth distorted the event",
      "explaining smooth appearance apart from fidelity",
      "matching response evidence to pass and stop limits",
      "reading transient and frequency plots together",
      "revealing the decision delay behind low visible noise"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D15-L05",
    systemModel: "Fourier analysis represents a finite signal as weighted frequency components, exposing periodic structure, bandwidth, harmonics and the effects of observation windows.",
    failurePattern: "A spectral peak can be misread when leakage, record length, amplitude scaling or nonstationary behaviour is ignored.",
    visualExplanation: "A finite time record and its windowed alternatives map to spectra with labelled resolution, main lobes, leakage and harmonic components.",
    applicationTask: "Compute or inspect spectra for a vibration record under two windows, identify a stable component and explain which features are artefacts of the record.",
    terms: [
      ["Spectrum", "A representation of how a signal's amplitude or energy is distributed over frequency.", "Its scale, sidedness, units, window and record length must be stated before magnitudes are compared."],
      ["Frequency resolution", "The spacing between discrete frequency bins for a finite uniformly sampled record.", "Smaller bin spacing does not by itself separate components hidden by window main-lobe width or nonstationarity."],
      ["Spectral leakage", "Energy spread into neighbouring bins because the finite observation does not contain a compatible periodic continuation.", "A window changes leakage and amplitude response rather than revealing a perfectly exact original spectrum."]
    ],
    entities: [
      ["input", "Finite vibration record", "Uniform time samples with acceleration units and timestamp."],
      ["mechanism", "Window and Fourier transform", "The selected weighting and discrete frequency calculation."],
      ["state", "Bin scale and normalisation", "Record length, sample rate, sidedness and amplitude correction."],
      ["observation", "Windowed spectral comparison", "Peak frequency, magnitude, width and leakage across windows."],
      ["decision", "Supported vibration component", "A frequency claim retained when it persists under appropriate checks."]
    ],
    relations: [
      ["maps", "the finite vibration record maps through a declared window", "directed", "many-to-one"],
      ["constrains", "record length and sample rate constrain bins and observable frequency range", "directed", "one-to-many"],
      ["transforms", "the Fourier calculation transforms weighted samples into complex frequency bins", "directed", "many-to-one"],
      ["supports", "the windowed spectral comparison supports a vibration-component claim", "directed", "many-to-one"],
      ["invalidates", "wrong scaling, leakage or changing behaviour invalidates an exact peak interpretation", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Sample rate, record length, window, amplitude convention, units and operating interval are declared."],
      ["assumption", "Sample timing is uniform and the record is sufficiently stationary for the intended spectral claim."],
      ["criterion", "The claimed component remains interpretable across a justified window, scaling check and independent record."],
      ["operating-state", "The altered case names the largest leaked bin as a new physical harmonic without comparing windows."]
    ],
    failure: [
      "A plotted peak is interpreted as a physical component without accounting for finite record, window and amplitude conventions.",
      "Leakage or changing speed is misreported as a harmonic or precise fault frequency.",
      "Reject the frequency claim until scaling, window sensitivity and independent time evidence are reconciled."
    ],
    conceptualSteps: [
      "Verify uniform timing, units, sample rate, record length and operating state.",
      "Select a window based on amplitude and nearby-component needs.",
      "Apply the Fourier transform with a declared one-sided or two-sided scale.",
      "Compare peak location, magnitude and width across windows and records.",
      "Retain only components supported by stable evidence rather than isolated leaked bins."
    ],
    example: {
      scenario: "A steady-speed motor vibration record is analysed with rectangular and Hann windows using corrected one-sided amplitude.",
      givenLabel: "Spectral record",
      givenValue: "uniform acceleration samples at constant motor speed",
      givenUnit: "m/s^2",
      reasoning: [
        "Check timestamps, sample rate, record duration and acceleration units.",
        "Apply each window with its amplitude correction and label frequency-bin spacing.",
        "Compare the dominant component and neighbouring leakage, then repeat on a second record."
      ],
      outcome: "A stable motor-order component is separated from window-dependent leakage.",
      criterion: "The component frequency and corrected magnitude remain consistent within tolerance across justified views.",
      verification: "Change record length and window, then confirm the physical component persists while leakage pattern changes."
    },
    counterexample: {
      scenario: "One rectangular-window spectrum shows several adjacent bins and each is labelled as a separate vibration harmonic.",
      givenLabel: "Leaked peak cluster",
      givenValue: "one finite record with no window comparison",
      givenUnit: "m/s^2",
      reasoning: [
        "The altered interpretation ignores finite-record discontinuity.",
        "Adjacent bins can arise from one component leaking through the window response.",
        "Without scaling and repeat evidence, the cluster fails the supported-component criterion."
      ],
      outcome: "The report invents multiple mechanical harmonics from one off-bin tone.",
      criterion: "A physical component must be distinguished from the known response of the selected window.",
      verification: "Apply a Hann window and a longer record; check whether the cluster follows window leakage or stable frequencies."
    },
    misconception: {
      claim: "Every visible FFT bin represents a separate frequency present in the machine.",
      mechanism: "Discrete analysis bins and window response are mistaken for independent physical sources.",
      correction: "Interpret bins through record length, window main lobe, leakage, scaling and repeat evidence.",
      disconfirmingObservation: "The apparent extra peaks move and shrink when only the window changes."
    },
    assessmentMoves: [
      "sequencing a vibration record into a scaled spectrum",
      "recovering from a leaked-bin harmonic claim",
      "screening Fourier evidence through window sensitivity",
      "diagnosing whether speed change or leakage broadened a peak",
      "explaining analysis bins apart from physical sources",
      "matching magnitude conventions to acceleration units",
      "reading time record windows and spectra together",
      "revealing one off-bin tone behind several visible bins"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D15-L06",
    systemModel: "A transfer function relates input to output under linear dynamic assumptions, a block diagram exposes interconnection and state space represents internal evolution.",
    failurePattern: "Algebraically equivalent input-output models can hide uncontrollable or unobservable internal behaviour, and block reduction can lose signal meaning when connections are misread.",
    visualExplanation: "A dynamic plant is represented in parallel by differential equation, transfer block and state variables, with common input and output highlighted.",
    applicationTask: "Convert a simple first-order model among differential, transfer and state-space forms and verify the same step response and physical units.",
    terms: [
      ["Transfer function", "The ratio of output transform to input transform for a linear time-invariant model under stated initial conditions.", "It does not directly expose every internal state and is invalid outside the model assumptions."],
      ["Block diagram", "A directed representation of signals and functional transformations connected by summing and branch points.", "Blocks may be combined only when signal direction and junction meaning are preserved."],
      ["State-space model", "A first-order vector model describing internal-state evolution and output formation from state and input.", "State coordinates are not unique, and model usefulness depends on controllability, observability and physical interpretation."]
    ],
    entities: [
      ["input", "Plant command", "The bounded input applied to a first-order physical plant."],
      ["mechanism", "Differential-equation model", "The balance law and constitutive relation defining plant evolution."],
      ["state", "Internal plant state", "The stored physical quantity needed to predict future output."],
      ["observation", "Output response comparison", "Time response from differential, transfer and state representations."],
      ["decision", "Equivalent model set", "Representations accepted as equivalent for the declared input-output experiment."]
    ],
    relations: [
      ["maps", "the plant command maps into the differential equation", "directed", "many-to-one"],
      ["constrains", "the current internal plant state constrains future evolution", "directed", "one-to-many"],
      ["transforms", "the model transforms input and state into output response", "directed", "many-to-one"],
      ["supports", "the output response comparison supports representation equivalence", "directed", "many-to-one"],
      ["invalidates", "wrong initial conditions, units or signal direction invalidates equivalence", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The plant is treated as linear and time-invariant over the stated operating range."],
      ["boundary", "Input, output, state, parameters, units and initial conditions are declared consistently."],
      ["criterion", "All representations produce the same bounded output for independent inputs and matching initial conditions."],
      ["operating-state", "The altered case derives a zero-state transfer function but compares it with a nonzero-state simulation."]
    ],
    failure: [
      "Algebraic conversion proceeds without preserving initial-state assumptions, physical units and signal junctions.",
      "Models that look symbolically related predict different measured responses.",
      "Reject equivalence until common inputs, outputs, initial conditions, dimensions and response evidence agree."
    ],
    conceptualSteps: [
      "Define physical input, output, stored state, parameters and units.",
      "Write the differential equation from the plant balance and declared simplifications.",
      "Derive transfer and state-space forms while recording initial-condition assumptions.",
      "Draw signal directions and junctions before reducing any block diagram.",
      "Simulate or calculate independent responses and compare units, steady value and time constant."
    ],
    example: {
      scenario: "A first-order thermal plant is represented by one energy-balance equation, a transfer function and one state.",
      givenLabel: "Thermal model",
      givenValue: "heater input, temperature state and measured temperature output",
      givenUnit: null,
      reasoning: [
        "Derive the differential equation from stored thermal energy and heat loss.",
        "Set matching initial conditions and obtain transfer and state representations.",
        "Apply the same power step and compare steady temperature, time constant and units."
      ],
      outcome: "The three representations predict the same temperature response within numeric tolerance.",
      criterion: "Common input, output and initial conditions must yield equal response and dimensionally consistent parameters.",
      verification: "Use a second bounded input and compare time samples from all three model forms."
    },
    counterexample: {
      scenario: "A zero-initial-condition transfer response is compared with a state-space simulation starting above ambient temperature.",
      givenLabel: "Initial-state mismatch",
      givenValue: "zero-state transfer case versus warm state model",
      givenUnit: "deg C",
      reasoning: [
        "The altered comparison violates the common initial-condition boundary.",
        "The state-space output contains free response absent from the zero-state transfer calculation.",
        "Different curves therefore do not disprove the underlying model equivalence."
      ],
      outcome: "The modeller incorrectly changes parameters to force mismatched traces together.",
      criterion: "Representation comparison requires identical input and initial-state conditions.",
      verification: "Reset both models to the same temperature or add the transfer model's initial-condition response explicitly."
    },
    misconception: {
      claim: "A transfer function contains all information about every internal state of a system.",
      mechanism: "Input-output equivalence is confused with a unique internal realisation and complete state visibility.",
      correction: "Use state-space structure to reason about internal modes, controllability and observability.",
      disconfirmingObservation: "Two different internal realisations produce the same transfer response while their state trajectories differ."
    },
    assessmentMoves: [
      "sequencing a physical balance into three model forms",
      "recovering from mismatched initial conditions",
      "screening model equivalence through response and units",
      "diagnosing whether a block junction changed signal meaning",
      "explaining input-output equivalence without unique states",
      "matching representations to common boundary conditions",
      "reading differential block and state views together",
      "revealing free response omitted by a zero-state transfer model"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D15-L07",
    systemModel: "System identification estimates model parameters from designed excitation and measured response, with noise and acquisition choices determining what dynamics are observable.",
    failurePattern: "A fitted model can reproduce training data yet be nonphysical or unidentifiable when excitation lacks bandwidth, sensors saturate or noise is correlated with input.",
    visualExplanation: "An excitation passes through unknown plant and acquisition chain to a parameter fit, residual analysis and independent validation record.",
    applicationTask: "Design an excitation for a first-order plant, fit a parameter from noisy data and validate residuals on a separate input without reusing the fit record.",
    terms: [
      ["System identification", "The estimation of a model structure or parameters from measured input-output data.", "A good fit is evidence only for the data, excitation, operating range and assumptions used."],
      ["Persistent excitation", "Input variation rich enough to reveal the model dynamics or parameters of interest.", "Large amplitude alone does not provide missing frequency or directional information."],
      ["Residual", "The difference between measured output and model-predicted output under the same input.", "Small training residuals can coexist with bias, overfitting or poor independent prediction."]
    ],
    entities: [
      ["input", "Designed excitation", "A bounded command covering the dynamic content needed for estimation."],
      ["component", "Plant and acquisition chain", "Physical dynamics, sensor, timing, scaling and noise."],
      ["mechanism", "Parameter estimation", "The objective and algorithm fitting the declared model structure."],
      ["observation", "Residual and validation evidence", "Training residuals plus predictions on independent data."],
      ["decision", "Accepted identified model", "A model retained for a stated operating and prediction purpose."]
    ],
    relations: [
      ["causes", "the designed excitation causes observable plant responses across needed dynamics", "directed", "one-to-many"],
      ["constrains", "the plant and acquisition chain constrains what parameters are observable", "directed", "many-to-one"],
      ["transforms", "parameter estimation transforms input-output records into candidate model values", "directed", "many-to-one"],
      ["supports", "residual and validation evidence supports the identified-model decision", "directed", "many-to-one"],
      ["invalidates", "poor excitation, saturation or validation failure invalidates model acceptance", "directed", "many-to-one"]
    ],
    conditions: [
      ["boundary", "Model purpose, structure, operating range, input limits, sample timing and validation split are declared."],
      ["assumption", "Measured input and output are aligned, calibrated and free of hidden clipping during accepted records."],
      ["criterion", "Parameters are physically plausible and independent predictions meet residual and task-error limits."],
      ["operating-state", "The altered case fits and reports a model using only the same slow training record for evaluation."]
    ],
    failure: [
      "Optimisation error on one record is treated as model truth while excitation, identifiability and independent validation are omitted.",
      "The fitted model fails when input speed, amplitude or operating condition changes.",
      "Reject the model until experiment design, residual structure and independent prediction meet the intended-use criterion."
    ],
    conceptualSteps: [
      "State the prediction purpose, candidate structure, operating range and parameters to identify.",
      "Design bounded excitation that covers the relevant dynamic content without saturation.",
      "Verify acquisition timing, scaling, alignment and data-quality flags before fitting.",
      "Estimate parameters and inspect residual bias, correlation and physical plausibility.",
      "Validate on an independent input and retain the model only for the supported envelope."
    ],
    example: {
      scenario: "A first-order motor-speed model is fitted from a multilevel command record and validated on a separate ramp sequence.",
      givenLabel: "Identification experiment",
      givenValue: "bounded multilevel training input and independent validation input",
      givenUnit: null,
      reasoning: [
        "Choose levels and dwell times that reveal gain and time constant without saturating the drive.",
        "Align command and speed records, fit parameters and inspect structured residuals.",
        "Predict the withheld ramp response and compare task-relevant speed error with its limit."
      ],
      outcome: "The retained model has plausible parameters and independent predictive evidence inside the tested range.",
      criterion: "Independent residual and task error pass their limits without hidden saturation or reused fit data.",
      verification: "Repeat validation at a second allowed operating point and compare parameter sensitivity."
    },
    counterexample: {
      scenario: "A constant input record is used to fit both gain and time constant, then the same record is reported as validation.",
      givenLabel: "Uninformative record",
      givenValue: "one steady input and reused output",
      givenUnit: null,
      reasoning: [
        "The altered excitation does not expose enough transient information for both parameters.",
        "Reusing training data provides no independent prediction test.",
        "A low residual on that record cannot satisfy the acceptance criterion."
      ],
      outcome: "Many parameter pairs appear acceptable but predict different ramp responses.",
      criterion: "The experiment must excite each claimed dynamic parameter and reserve independent validation data.",
      verification: "Apply a bounded transient input and compare candidate predictions before refitting."
    },
    misconception: {
      claim: "The parameter set with the lowest training error is the true physical model.",
      mechanism: "Identifiability, model structure, noise, overfitting and independent prediction are hidden behind one objective value.",
      correction: "Design informative excitation, inspect residuals and validate physically plausible parameters on withheld data.",
      disconfirmingObservation: "Different parameter sets have similar training error but disagree strongly on the withheld ramp."
    },
    assessmentMoves: [
      "sequencing an identification experiment through validation",
      "recovering from a constant-input parameter fit",
      "screening fitted models by independent prediction",
      "diagnosing bias from residual correlation",
      "explaining low training error without claiming truth",
      "matching excitation content to observable parameters",
      "reading plant acquisition fit and validation paths",
      "revealing non-identifiability through divergent ramp predictions"
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
  const measured = source.entities[3][1];
  const conclusion = source.entities[4][1];
  const move = source.assessmentMoves[slot];
  if (move === undefined) {
    throw new Error(`Missing D15 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Sequence ${first}, ${second} and ${measured} before reaching ${conclusion} while ${move}:`,
      `${first} supports ${conclusion} because ${move} connects ${second} with ${measured}.`,
      `${conclusion} is premature when ${move} skips the ${second} boundary or ${measured}.`,
      `Begin with the ${first} condition represented in ${measured} before ${move}.`,
      `Use ${measured} to locate ${second} correctly during ${move}.`,
      `Place ${first} ahead of ${second} for ${measured}, then describe ${move}.`,
      `Check ${conclusion} against ${measured} after ${move}.`
    ],
    [
      `Reconstruct the altered ${measured} case from ${first} and ${second} while ${move}:`,
      `${measured} supports ${conclusion} once ${move} restores the ${first} boundary.`,
      `${second} remains unsupported if ${move} leaves ${measured} unresolved.`,
      `Locate the changed ${measured} condition before ${move}.`,
      `Rebuild the ${first} link governing ${second} and ${measured} during ${move}.`,
      `Retest ${second} against ${measured} while completing ${move}.`,
      `Keep ${conclusion} only when ${first} and ${measured} survive ${move}.`
    ],
    [
      `Choose the ${first} statements valid for ${second} and ${measured} while ${move}:`,
      `${conclusion} is supported because ${move} preserves ${second} and ${measured}.`,
      `A ${first} statement fails when ${move} contradicts the ${measured} boundary.`,
      `Test each ${second} statement against ${first} and ${measured} during ${move}.`,
      `Keep the ${measured} relation whose condition remains true after ${move}.`,
      `Mark ${first} and ${second} statements supported by ${measured} during ${move}.`,
      `Reject ${conclusion} when it cannot match ${measured} during ${move}.`
    ],
    [
      `Analyse why ${measured} changes ${conclusion} through ${first} and ${second} while ${move}:`,
      `${first} and ${second} identify the changed ${measured} mechanism when ${move} is applied.`,
      `${conclusion} is overclaimed if ${move} ignores the ${first} condition controlling ${measured}.`,
      `Find the first ${second} relation changing ${measured} during ${move}.`,
      `Compare ${measured} with the bounded ${first} case before ${move}.`,
      `Retain the ${second} relation explaining ${conclusion} after ${move}.`,
      `Discard the ${first} claim that ${measured} disproves during ${move}.`
    ],
    [
      `Explain ${first} by relating ${second}, ${measured} and ${conclusion} while ${move}:`,
      `The explanation joins ${first} to ${conclusion} through ${measured} during ${move}.`,
      `The explanation fails when ${move} omits ${second} or the ${measured} criterion.`,
      `Name the ${first} boundary for ${measured} before describing ${move}.`,
      `State how ${second} changes ${measured} during ${move}.`,
      `Connect ${first} to ${conclusion} with the relation exposed by ${move}.`,
      `Close with the ${measured} criterion limiting ${conclusion} after ${move}.`
    ],
    [
      `Match ${second} evidence to ${first} conditions and ${conclusion} while ${move}:`,
      `Each ${measured} pair reaches the ${conclusion} condition during ${move}.`,
      `A ${second} pair fails because ${move} assigns the wrong ${first} boundary.`,
      `Pair the earliest ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${measured} criterion for the relation concluded after ${move}.`,
      `Align ${first} and ${second} with ${measured} through ${move}.`,
      `Verify every ${conclusion} pair by reading ${move} back through ${measured}.`
    ],
    [
      `Read the ${first} representation from ${second} through ${measured} to ${conclusion} while ${move}:`,
      `The selected path reaches ${conclusion} because ${move} preserves the ${second} relation.`,
      `The representation is misread if ${move} bypasses the ${measured} edge limiting ${first}.`,
      `Trace ${first} to ${second} and ${measured} during ${move}.`,
      `Inspect which ${measured} relation remains active after ${move}.`,
      `Follow ${second} arrows before judging ${conclusion} during ${move}.`,
      `Select the ${conclusion} path that keeps ${first} valid after ${move}.`
    ],
    [
      `Interpret changed ${measured} by tracing ${conclusion} back to ${first} and ${second} while ${move}:`,
      `${measured} supports the implication because ${move} retains its ${second} path.`,
      `${conclusion} is unsafe when ${move} treats a suppressed ${first} path as active.`,
      `Start at changed ${measured} and identify how ${move} affects ${second}.`,
      `Contrast the active ${first} route through ${measured} during ${move}.`,
      `Reconstruct the ${second} path that ${move} carries towards ${conclusion}.`,
      `Accept ${conclusion} only if the final ${measured} route agrees with ${move}.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D15 instruction plan ${slot}.`);
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
        throw new Error(`Missing D15 relation endpoints ${index}.`);
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
        throw new Error(`Missing D15 condition binding ${index}.`);
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

export const academyLessonTeachingProfileV2PlansE2D15 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE2D15 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE2D15,
    academyLessonTeachingProfileV2PlansE2D15
  );

export const academyLessonTeachingProfilesV2E2D15 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE2D15.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D15 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E2D15;
