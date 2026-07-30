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
  lessonTitle: string;
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
    lessonId: "EML-E4-D24-L01",
    lessonTitle: "Stakeholder needs and measurable requirements",
    systemModel:
      "A stakeholder need describes a valued outcome in context, while a requirement translates that need into a uniquely identified, necessary, measurable and verifiable obligation.",
    failurePattern:
      "A statement can sound precise while hiding an undefined quality, an omitted operating condition or an unnecessary design choice that prevents fair verification.",
    visualExplanation:
      "A traceability chain connects a named stakeholder and contextual need to one requirement, its acceptance measure, planned verification and retained result.",
    applicationTask:
      "Rewrite a vague mobile-robot request as bounded requirements, define each acceptance measure and remove unnecessary implementation prescriptions.",
    terms: [
      [
        "Stakeholder need",
        "A valued outcome stated by an affected person or group in the context where the system will be used.",
        "A need explains the outcome and context without pretending that a preferred implementation is already the only answer."
      ],
      [
        "Measurable requirement",
        "A uniquely identified obligation whose subject, action, conditions and acceptance measure can be checked.",
        "Words such as fast, safe or easy are not measurable until their observable meaning and boundary are declared."
      ],
      [
        "Requirement traceability",
        "The maintained link from a requirement back to its need and forward to design, verification and evidence.",
        "A trace link does not prove correctness; it makes missing justification and evidence visible."
      ]
    ],
    entities: [
      [
        "input",
        "Stakeholder context record",
        "The named stakeholder, operating situation, valued outcome and relevant constraints."
      ],
      [
        "mechanism",
        "Requirement translation",
        "The reasoning that turns one contextual need into atomic, solution-neutral obligations."
      ],
      [
        "state",
        "Acceptance measure set",
        "Observable quantities, conditions, tolerance and pass boundary attached to each requirement."
      ],
      [
        "observation",
        "Traceable verification result",
        "The retained test or analysis result linked to the exact requirement and configuration."
      ],
      [
        "decision",
        "Accepted requirement baseline",
        "The reviewed requirement set retained because need, wording and verification path agree."
      ]
    ],
    relations: [
      [
        "maps",
        "the stakeholder context record maps each valued outcome to a requirement translation",
        "directed",
        "one-to-many"
      ],
      [
        "transforms",
        "requirement translation transforms contextual language into measurable obligations",
        "directed",
        "many-to-many"
      ],
      [
        "constrains",
        "the acceptance measure set constrains what evidence can pass each requirement",
        "directed",
        "one-to-many"
      ],
      [
        "supports",
        "a traceable verification result supports the accepted requirement baseline",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "vague or solution-prescriptive wording invalidates the accepted requirement baseline",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Every requirement has one identifier, one obligation, named operating conditions, units and an observable acceptance boundary."
      ],
      [
        "assumption",
        "Stakeholder terms have been clarified with the people affected and genuinely binding external constraints are known."
      ],
      [
        "criterion",
        "The requirement is necessary, feasible, unambiguous, solution-neutral where possible and linked to a repeatable verification method."
      ],
      [
        "operating-state",
        "The altered statement says the robot should navigate well and use lidar without defining well or justifying lidar."
      ]
    ],
    failure: [
      "A preferred design and an undefined quality are written into the requirement before the need and measure are separated.",
      "Teams can build different systems, claim compliance by different interpretations and still fail the original stakeholder outcome.",
      "Reject the baseline until each statement has a measurable boundary, justified scope and traceable verification path."
    ],
    conceptualSteps: [
      "Name the stakeholder, operating context and valued outcome before drafting any requirement.",
      "Split combined wishes into atomic obligations and remove implementation choices that are not true constraints.",
      "Add measurable conditions, units, tolerance and a unique identifier to each obligation.",
      "Trace every requirement back to the need and forward to a planned verification activity.",
      "Review necessity, feasibility, ambiguity and evidence before accepting the requirement baseline."
    ],
    example: {
      scenario:
        "A warehouse operator needs a mobile robot to avoid contacting a person who enters its protective field during normal aisle travel.",
      givenLabel: "Operator need and travel context",
      givenValue:
        "person enters a 0.80 m protective field while robot travels at up to 1.0 m/s on the declared floor range",
      givenUnit: null,
      reasoning: [
        "Separate the valued no-contact outcome from any proposed sensor brand or braking implementation.",
        "Write REQ-SAF-017 so the robot shall reach zero commanded motion within 0.50 s after field occupancy under the declared speed and floor conditions.",
        "Plan a timestamped field-entry test that measures detection-to-command latency and links its result to REQ-SAF-017."
      ],
      outcome:
        "The need is represented by one measurable, solution-neutral requirement with a repeatable verification path.",
      criterion:
        "The requirement passes review only if its timing, field, speed, conditions and evidence link are unambiguous.",
      verification:
        "Give the statement to an independent tester and confirm that they select the same inputs, measurement and pass boundary."
    },
    counterexample: {
      scenario:
        "The team writes that the robot should be safe, navigate well and use a premium lidar.",
      givenLabel: "Vague prescriptive statement",
      givenValue: "safe, navigate well, premium lidar",
      givenUnit: null,
      reasoning: [
        "Safe and well have no observable acceptance boundary in the stated context.",
        "Premium lidar prescribes a solution without showing that the stakeholder need requires that technology.",
        "No independent test can produce one defensible pass decision, so the statement cannot enter the requirement baseline."
      ],
      outcome:
        "The statement is neither a measurable requirement nor a justified architecture constraint.",
      criterion:
        "A baseline statement must express one bounded obligation and permit a repeatable compliance decision.",
      verification:
        "Ask two testers to define a pass test independently; their incompatible interpretations expose the ambiguity."
    },
    misconception: {
      claim:
        "Putting shall in a sentence automatically makes it a good requirement.",
      mechanism:
        "Grammar is mistaken for measurable meaning, so vague qualities and hidden design choices survive review.",
      correction:
        "Use shall only after the subject, action, conditions, measure and trace links are explicit.",
      disconfirmingObservation:
        "The sentence the robot shall be safe contains shall but still gives an independent tester no pass boundary."
    },
    assessmentMoves: [
      "sequencing a contextual need into REQ-SAF-017 and its timed acceptance chain",
      "repairing the safe-and-lidar statement after two testers disagree",
      "screening atomic obligations against the 0.50 s evidence boundary",
      "diagnosing the missing measure inside the premium-lidar prescription",
      "explaining why traceability exposes but does not prove requirement quality",
      "matching stakeholder context to obligation, measure and retained result",
      "reading the requirement chain from operator outcome to test evidence",
      "revealing how vague wording can create a false compliance decision"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E4-D24-L02",
    lessonTitle: "Functional decomposition and system architectures",
    systemModel:
      "Functional decomposition states what the system must do before architecture allocates those functions to interacting physical, software and human elements.",
    failurePattern:
      "Choosing components first can duplicate responsibility, leave essential behaviour unowned or create interfaces that no element is designed to satisfy.",
    visualExplanation:
      "A mission outcome branches into a function tree, then allocation links connect each function to architecture elements and expose exchanged flows and ownership gaps.",
    applicationTask:
      "Decompose a robot inspection mission into functions, allocate them to architecture elements and repair one missing or duplicated responsibility.",
    terms: [
      [
        "System function",
        "A transformation or service the system must perform to achieve an outcome, stated without choosing the implementing component.",
        "A function describes what must happen, not the hardware or software name selected to make it happen."
      ],
      [
        "Functional decomposition",
        "The controlled breakdown of a broad mission into smaller functions whose inputs, outputs and boundaries remain connected.",
        "Decomposition is incomplete when child functions do not collectively cover the parent outcome or overlap without ownership."
      ],
      [
        "Architecture allocation",
        "The assignment of functions and responsibilities to interacting system elements and interfaces.",
        "Allocation is a design decision that must preserve every required function and define responsibility at shared boundaries."
      ]
    ],
    entities: [
      [
        "input",
        "Inspection mission outcome",
        "The declared warehouse inspection result, constraints and external actors."
      ],
      [
        "mechanism",
        "Function tree",
        "The hierarchy of sense, localise, plan, move, inspect, report and protect functions."
      ],
      [
        "state",
        "Allocated architecture",
        "The physical, software and human elements assigned to functions."
      ],
      [
        "observation",
        "Responsibility coverage review",
        "The check for unowned, duplicated or incompatible function allocations."
      ],
      [
        "decision",
        "Accepted system architecture",
        "The element and interface structure retained after function coverage and ownership are reconciled."
      ]
    ],
    relations: [
      [
        "maps",
        "the inspection mission outcome maps to the top-level function tree",
        "directed",
        "one-to-many"
      ],
      [
        "transforms",
        "functional decomposition transforms the mission into bounded child functions",
        "directed",
        "one-to-many"
      ],
      [
        "maps",
        "the function tree maps responsibilities into the allocated architecture",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "responsibility coverage review supports the accepted system architecture",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unowned or multiply owned essential function invalidates the accepted system architecture",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The mission boundary, external actors, inputs, outputs and success conditions are declared before decomposition."
      ],
      [
        "assumption",
        "Child functions collectively cover the parent function and each allocation names an accountable element."
      ],
      [
        "criterion",
        "Every essential function has one clear responsibility path and every cross-element flow has an owned interface."
      ],
      [
        "operating-state",
        "The altered architecture begins with a parts list and assigns both navigation nodes responsibility for the final velocity command."
      ]
    ],
    failure: [
      "Components are selected before functions, flows and responsibility boundaries are understood.",
      "A watchdog function remains unowned while two navigation components issue competing commands.",
      "Reject the architecture until the function tree covers the mission and each allocation and interface has accountable ownership."
    ],
    conceptualSteps: [
      "State the mission outcome and system boundary without naming implementation components.",
      "Decompose the mission into verb-object functions with explicit inputs and outputs.",
      "Check that child functions cover the parent outcome without hidden gaps or duplicate authority.",
      "Allocate each function to an element and draw every exchanged matter, energy or information flow.",
      "Accept the architecture only after responsibility and interface ownership are complete."
    ],
    example: {
      scenario:
        "A mobile robot must inspect warehouse aisles, record shelf anomalies and return a reviewable report without contacting people.",
      givenLabel: "Warehouse inspection mission",
      givenValue:
        "sense aisle, localise, plan, move, protect people, capture anomaly and report",
      givenUnit: null,
      reasoning: [
        "Decompose the mission into sensing, localisation, route planning, motion execution, protective stop, anomaly capture and reporting functions.",
        "Allocate sensing to cameras and safety scanner, localisation and planning to compute, motion to controller and drivetrain, and review to the operator station.",
        "Review command, timestamp, health and report flows so one component owns each final output and the protective-stop path remains independent."
      ],
      outcome:
        "Every mission function has an accountable architecture element and a visible interface path.",
      criterion:
        "The allocation passes when no essential function is missing, duplicated without authority or disconnected from its required flow.",
      verification:
        "Walk one nominal mission and one protective-stop scenario through the function tree and architecture in both directions."
    },
    counterexample: {
      scenario:
        "A parts-first diagram lists lidar, cameras, two navigation nodes and motors but contains no protective-stop function or final command owner.",
      givenLabel: "Parts-first architecture",
      givenValue:
        "two command publishers, no protective-stop allocation",
      givenUnit: null,
      reasoning: [
        "The component list does not show whether all mission functions exist or who owns each result.",
        "Both navigation nodes can publish velocity while no element owns the independent protective stop.",
        "The coverage review exposes duplicated command authority and an unowned safety function."
      ],
      outcome:
        "The parts list is not an acceptable system architecture for the declared mission.",
      criterion:
        "Architecture acceptance requires function coverage, single accountable authority and owned cross-element interfaces.",
      verification:
        "Inject a person-detection event and ask which element guarantees the final zero command; the diagram cannot answer."
    },
    misconception: {
      claim:
        "A system architecture is a labelled list of components.",
      mechanism:
        "Functions, flows and authority are omitted, so the drawing cannot prove that elements collectively deliver the mission.",
      correction:
        "Begin with functions, allocate them deliberately and show owned interfaces and decisions between elements.",
      disconfirmingObservation:
        "The same component list can implement safe single-owner motion or unsafe competing command paths."
    },
    assessmentMoves: [
      "ordering the warehouse mission through decomposition and accountable allocation",
      "recovering the missing protective-stop and final-command ownership",
      "selecting function coverage claims from the inspection architecture",
      "diagnosing two navigation nodes that share unbounded command authority",
      "explaining why functions precede cameras, compute and drivetrain choices",
      "matching mission functions to elements and owned information flows",
      "tracing the function tree into one accepted architecture path",
      "interpreting the unowned watchdog state before architecture approval"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E4-D24-L03",
    lessonTitle: "Interfaces and evidence-led trade studies",
    systemModel:
      "An interface controls exchanged matter, energy or information, while a trade study filters infeasible alternatives before comparing feasible choices against weighted criteria and uncertainty.",
    failurePattern:
      "A high weighted score can conceal a hard interface violation or reverse under small changes when constraints and sensitivity are treated as ordinary preferences.",
    visualExplanation:
      "Candidate sensing architectures pass through power, data, geometry and environment gates before a weighted matrix and sensitivity plot show the supported ranking.",
    applicationTask:
      "Compare two sensing architectures, reject any hard interface violation and test whether the remaining ranking survives plausible changes in weights and scores.",
    terms: [
      [
        "Interface contract",
        "The controlled definition of what crosses a boundary, in what form, direction, range, timing and ownership.",
        "Compatible connector shape alone does not establish electrical, data, mechanical or behavioural compatibility."
      ],
      [
        "Feasibility constraint",
        "A mandatory condition that an alternative must satisfy before preference scoring is meaningful.",
        "A violated safety, power, geometry or protocol constraint cannot be compensated by a high score elsewhere."
      ],
      [
        "Trade study",
        "A documented comparison of feasible alternatives using declared criteria, weights, evidence and sensitivity.",
        "A weighted total supports a decision only within the stated evidence and must not hide uncertainty or disqualifying constraints."
      ]
    ],
    entities: [
      [
        "input",
        "Candidate sensing architectures",
        "The alternatives, interface data, assumptions and evidence prepared for comparison."
      ],
      [
        "mechanism",
        "Interface feasibility screen",
        "The mandatory power, data, mass, geometry and environment checks."
      ],
      [
        "state",
        "Weighted evidence matrix",
        "Normalised criterion scores, weights, evidence strength and uncertainty for feasible alternatives."
      ],
      [
        "observation",
        "Ranking sensitivity result",
        "The ranking observed across plausible changes in weights and uncertain scores."
      ],
      [
        "decision",
        "Selected sensing architecture",
        "The feasible alternative retained with explicit reasons, assumptions and reversal conditions."
      ]
    ],
    relations: [
      [
        "maps",
        "candidate sensing architectures map their boundary data into the interface feasibility screen",
        "directed",
        "many-to-one"
      ],
      [
        "constrains",
        "the interface feasibility screen constrains which alternatives enter the weighted evidence matrix",
        "directed",
        "one-to-many"
      ],
      [
        "compares",
        "the weighted evidence matrix compares feasible alternatives under declared criteria",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "ranking sensitivity result supports the selected sensing architecture",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "a hard interface violation or unstable unsupported ranking invalidates the selected sensing architecture",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Each alternative declares voltage, current, data protocol, update timing, mounting envelope, mass and operating environment."
      ],
      [
        "assumption",
        "Criterion scores share a declared scale and weights sum to 1.00 after hard feasibility screening."
      ],
      [
        "criterion",
        "The selected alternative satisfies every hard interface constraint and remains preferred or explicitly conditional under sensitivity analysis."
      ],
      [
        "operating-state",
        "The altered candidate receives the highest preference score despite requiring 24 V from a protected 5 V rail."
      ]
    ],
    failure: [
      "Mandatory interface feasibility is folded into an average score that permits compensation by unrelated preferences.",
      "The winning candidate cannot be powered by the available rail even though its weighted total is highest.",
      "Reject the ranking until infeasible alternatives are removed and weight and evidence sensitivity are visible."
    ],
    conceptualSteps: [
      "Declare each physical, electrical, data and behavioural interface before comparing alternatives.",
      "Apply hard feasibility constraints and remove any alternative that cannot satisfy them.",
      "Score only feasible alternatives against evidence-backed criteria on one declared scale.",
      "Vary important weights and uncertain scores to observe whether the ranking is robust.",
      "Record the selected alternative, assumptions and exact conditions that would reverse the decision."
    ],
    example: {
      scenario:
        "Two feasible perception modules are compared for a mobile robot after both pass the 12 V, mass, Ethernet and mounting checks.",
      givenLabel: "Feasible module score matrix",
      givenValue:
        "weights 0.50, 0.30, 0.20; A scores 4, 3, 5; B scores 3, 5, 4",
      givenUnit: null,
      reasoning: [
        "Confirm both alternatives satisfy every mandatory interface before calculating preferences.",
        "Calculate A = 0.50 times 4 + 0.30 times 3 + 0.20 times 5 = 3.90 and B = 3.80.",
        "Vary the uncertain performance weight and document that the 0.10 margin is small enough to require sensitivity and evidence review."
      ],
      outcome:
        "Module A is conditionally preferred by 0.10, not declared universally superior.",
      criterion:
        "Selection requires interface feasibility and a ranking whose sensitivity and evidence uncertainty are recorded.",
      verification:
        "Recalculate both totals independently and sweep the two largest weights while renormalising them to sum to 1.00."
    },
    counterexample: {
      scenario:
        "A third module scores 4.80 but requires 24 V while the protected robot interface supplies only 5 V.",
      givenLabel: "Infeasible high-score module",
      givenValue: "weighted score 4.80, required 24 V, available 5 V",
      givenUnit: null,
      reasoning: [
        "The power mismatch is a hard interface violation rather than a preference.",
        "A weighted total cannot create the missing electrical compatibility or authorise an undeclared converter.",
        "Keeping the module as the winner invalidates the trade decision before sensitivity is considered."
      ],
      outcome:
        "The 4.80 alternative is infeasible and must be removed or redesigned before preference comparison.",
      criterion:
        "No preference score can compensate for an unsatisfied mandatory interface condition.",
      verification:
        "Draw the power path and show that no approved element converts the protected 5 V rail to the required 24 V."
    },
    misconception: {
      claim:
        "The highest weighted score is always the best engineering choice.",
      mechanism:
        "Hard constraints, uncertainty and sensitivity are collapsed into one apparently objective number.",
      correction:
        "Screen feasibility first, expose evidence and uncertainty, then test whether the weighted ranking is robust.",
      disconfirmingObservation:
        "A score of 4.80 cannot power a 24 V module from a protected 5 V interface."
    },
    assessmentMoves: [
      "sequencing interface feasibility before the 3.90 versus 3.80 comparison",
      "repairing the 24 V candidate that was allowed to win on preferences",
      "selecting robust trade claims under a 0.10 ranking margin",
      "diagnosing compensation of a hard power constraint by camera scores",
      "explaining why an interface contract precedes a weighted matrix",
      "matching feasibility evidence to criteria, sensitivity and selection",
      "reading the candidate flow through constraint gates and ranking evidence",
      "revealing the invalid 4.80 winner on a protected 5 V rail"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E4-D24-L04",
    lessonTitle: "Risk management, FMEA and hazard analysis",
    systemModel:
      "Risk management links uncertain events to consequence and action, FMEA reasons from failure modes to effects, and hazard analysis reasons from potential harm through hazardous scenarios.",
    failurePattern:
      "A single numerical score can hide catastrophic low-frequency harm, common causes or scenarios that sit outside the chosen component boundary.",
    visualExplanation:
      "A bow-tie model connects initiating causes and FMEA failure modes to a top event, consequences, preventive controls, recovery controls and accountable evidence.",
    applicationTask:
      "Analyse one mobile-robot motion hazard with FMEA and scenario reasoning, then assign layered controls and evidence without relying on score alone.",
    terms: [
      [
        "Risk event",
        "An uncertain event or condition linked to stated consequences, exposure and affected objectives.",
        "A risk number has meaning only with the defined scenario, scales, evidence and decision rule."
      ],
      [
        "Failure mode and effects analysis",
        "A bottom-up method that asks how an item can fail, what causes it and what effects propagate locally and upward.",
        "FMEA does not by itself discover every multi-item interaction, misuse case or external hazard."
      ],
      [
        "Hazard analysis",
        "A scenario-led examination of sources of potential harm, hazardous states, initiating events, controls and consequences.",
        "Hazard analysis must consider people, environment, common causes and system interactions beyond one component."
      ]
    ],
    entities: [
      [
        "input",
        "Robot motion hazard scenario",
        "The energy source, exposed people, operating context and unwanted top event."
      ],
      [
        "mechanism",
        "Failure and cause model",
        "The FMEA modes, initiating events, common causes and propagation paths."
      ],
      [
        "state",
        "Layered risk-control plan",
        "Preventive, detective and mitigative controls assigned to hazards and failure paths."
      ],
      [
        "observation",
        "Residual-risk evidence",
        "Test, analysis and operational evidence remaining after controls are applied."
      ],
      [
        "decision",
        "Risk disposition",
        "The accountable decision to reduce, accept, transfer or avoid a bounded residual risk."
      ]
    ],
    relations: [
      [
        "maps",
        "the robot motion hazard scenario maps potential harm into the failure and cause model",
        "directed",
        "one-to-many"
      ],
      [
        "causes",
        "failure modes and initiating events cause paths represented in the layered risk-control plan",
        "directed",
        "many-to-many"
      ],
      [
        "constrains",
        "the layered risk-control plan constrains exposure and consequence pathways",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "residual-risk evidence supports the risk disposition",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an omitted catastrophic scenario or common cause invalidates the risk disposition",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The hazard scenario names the energy source, exposed person, operating mode, consequence and system boundary."
      ],
      [
        "assumption",
        "Likelihood and severity scales, exposure assumptions and evidence quality are declared rather than implied."
      ],
      [
        "criterion",
        "Every intolerable scenario has accountable controls and evidence, and residual risk is reviewed beyond the numerical score."
      ],
      [
        "operating-state",
        "The altered analysis dismisses a catastrophic runaway scenario because its likelihood score is low and ignores a shared power cause."
      ]
    ],
    failure: [
      "Risk ranking is treated as arithmetic that replaces scenario completeness and accountable control decisions.",
      "A low-frequency common power fault can defeat braking and detection while the low score hides catastrophic contact harm.",
      "Reject the disposition until catastrophic scenarios, common causes, controls and residual evidence are explicitly reviewed."
    ],
    conceptualSteps: [
      "Define the energy, exposed people, operating state, top event and credible consequences.",
      "Use FMEA to trace item failure modes and effects, then use hazard analysis to inspect broader scenarios and interactions.",
      "Select controls that eliminate, prevent, detect or mitigate each important path and assign ownership.",
      "Gather evidence for control performance and reconsider severity, exposure and uncertainty.",
      "Record residual risk and authority without allowing one score to replace engineering judgement."
    ],
    example: {
      scenario:
        "A mobile robot can continue driving after an encoder sticks at a constant value while a person is in its aisle.",
      givenLabel: "Runaway motion scenario",
      givenValue:
        "encoder stuck, commanded speed persists, person exposed, shared 24 V control supply",
      givenUnit: null,
      reasoning: [
        "FMEA identifies the stuck encoder, local loss of speed feedback and propagated overspeed effect.",
        "Hazard analysis connects kinetic energy, person exposure, delayed detection and the possibility that a shared supply defeats several controls.",
        "Specify independent speed plausibility, a protective scanner, torque removal and stopping-distance tests with accountable residual-risk review."
      ],
      outcome:
        "The analysis combines component failure reasoning with the hazardous motion scenario and layered evidence.",
      criterion:
        "The disposition is acceptable only when catastrophic paths and common causes have controlled, verified responses.",
      verification:
        "Inject the stuck signal and shared-supply fault separately and together, then measure detection, torque removal and stopping behaviour."
    },
    counterexample: {
      scenario:
        "The team multiplies likelihood 1 by severity 5, labels score 5 low and closes the runaway hazard without a control test.",
      givenLabel: "Score-only closure",
      givenValue: "likelihood 1, severity 5, score 5, no common-cause analysis",
      givenUnit: null,
      reasoning: [
        "The score compresses a catastrophic consequence and uncertain likelihood into one ordinal product.",
        "The chosen boundary omits a shared power failure that can defeat detection and torque removal together.",
        "Without scenario coverage or control evidence, the low label cannot support risk acceptance."
      ],
      outcome:
        "The score-only closure leaves a catastrophic motion hazard unresolved.",
      criterion:
        "Risk closure requires scenario completeness, control evidence and authorised residual-risk judgement, not a threshold alone.",
      verification:
        "Reopen the bow-tie and trace whether every path from energy source to person has an evidenced preventive or mitigative control."
    },
    misconception: {
      claim:
        "Multiplying likelihood by severity objectively tells us whether a hazard is safe.",
      mechanism:
        "Ordinal scales, uncertainty, common causes and catastrophic consequence are hidden inside one product.",
      correction:
        "Use scores for prioritisation only, retain scenarios and evidence, and review catastrophic residual risk explicitly.",
      disconfirmingObservation:
        "A low occurrence score does not stop a shared supply fault from defeating several safety controls at once."
    },
    assessmentMoves: [
      "ordering runaway energy, failure modes, controls and residual evidence",
      "recovering the catastrophic scenario hidden by the score of 5",
      "selecting FMEA and hazard-analysis claims at their proper boundaries",
      "diagnosing the shared 24 V common cause outside one component row",
      "explaining why score arithmetic cannot authorise residual risk",
      "matching failure modes, hazardous states, controls and dispositions",
      "tracing the bow-tie from stuck encoder to accountable closure",
      "interpreting the low-likelihood path that still needs control evidence"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E4-D24-L05",
    lessonTitle: "Safety engineering and reliability",
    systemModel:
      "Safety engineering defines hazards, safe states and layered risk controls, while reliability models the probability of maintaining a required function for stated conditions and time.",
    failurePattern:
      "A highly reliable function can remain unsafe, and apparently independent safety channels can share power, sensing or environmental causes that invalidate the reliability claim.",
    visualExplanation:
      "A safety-control hierarchy and safe-state transition sit beside a reliability block model whose dependency links expose common-cause failures.",
    applicationTask:
      "Define a safe state and reliability boundary for a robot stop subsystem, identify a common cause and design a test of the layered controls.",
    terms: [
      [
        "Safe state",
        "A defined system condition that controls hazardous energy and limits harm after a fault or demand.",
        "A safe state depends on the hazard and context; simply turning software off may not remove stored or moving energy."
      ],
      [
        "Layered risk control",
        "A combination of elimination, prevention, detection and mitigation barriers whose roles and dependencies are explicit.",
        "Several labels do not create independence when the controls share one vulnerable cause."
      ],
      [
        "Reliability",
        "The probability that an item performs a required function under stated conditions for a stated time.",
        "Reliability is not safety: it concerns required function, while safety concerns freedom from unacceptable harm."
      ]
    ],
    entities: [
      [
        "input",
        "Robot stop safety demand",
        "The hazardous motion, demand condition, exposure and required safe state."
      ],
      [
        "mechanism",
        "Layered stop architecture",
        "Protective detection, independent logic, torque removal, braking and energy isolation paths."
      ],
      [
        "state",
        "Reliability dependency model",
        "The required stop function, mission time, component success probabilities and common causes."
      ],
      [
        "observation",
        "Demand-test evidence",
        "Observed detection, stopping and safe-state performance under normal and faulted dependencies."
      ],
      [
        "decision",
        "Accepted safety and reliability claim",
        "The bounded claim retained when hazard control and reliability evidence are both adequate."
      ]
    ],
    relations: [
      [
        "maps",
        "the robot stop safety demand maps the hazard into the layered stop architecture",
        "directed",
        "one-to-many"
      ],
      [
        "depends-on",
        "layered stop architecture depends on components and dependencies represented in the reliability model",
        "directed",
        "many-to-many"
      ],
      [
        "compares",
        "the reliability dependency model compares required-function success under declared conditions and time",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "demand-test evidence supports the accepted safety and reliability claim",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unsafe state or hidden common cause invalidates the accepted safety and reliability claim",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The hazard, safe state, required stop function, mission time, environment and exposed population are declared."
      ],
      [
        "assumption",
        "Independence is used in reliability calculations only where power, sensing, logic and environmental causes are demonstrably separate."
      ],
      [
        "criterion",
        "Demand tests reach the defined safe state and reliability evidence remains valid after explicit dependency and common-cause review."
      ],
      [
        "operating-state",
        "The altered calculation treats two stop channels as independent even though both require the same unmonitored 24 V supply."
      ]
    ],
    failure: [
      "Reliability multiplication assumes independence while the safety case fails to model shared energy and diagnostic dependencies.",
      "Both nominal stop channels disappear together when their common supply fails, so the claimed probability and safe response are wrong.",
      "Reject the claim until the safe state, dependency structure, common causes and faulted demand tests agree."
    ],
    conceptualSteps: [
      "Define the hazardous energy, demand condition and safe state before assigning controls.",
      "Layer prevention, detection, torque removal, braking and recovery with explicit ownership.",
      "Define the required function, conditions and time before calculating or quoting reliability.",
      "Identify common power, sensor, software and environmental dependencies and test faulted demands.",
      "Accept separate safety and reliability claims only within their stated evidence boundaries."
    ],
    example: {
      scenario:
        "A mobile base must stop on protective-field demand using two genuinely independent detection and torque-removal channels.",
      givenLabel: "Independent stop-channel assumption",
      givenValue:
        "each channel demand-failure probability 0.01, independent evidence available",
      givenUnit: null,
      reasoning: [
        "Define the safe state as torque removed with controlled braking and no uncontrolled roll on the declared floor slope.",
        "If independence is evidenced, simultaneous channel failure is 0.01 times 0.01 = 0.0001 per comparable demand model.",
        "Fault-inject each channel and common services while measuring detection, torque removal, braking and final safe state."
      ],
      outcome:
        "The numerical reliability statement is conditional on evidenced independence and does not replace the safety demonstration.",
      criterion:
        "Both the safe-state demand test and the stated independence boundary must pass before the combined claim is retained.",
      verification:
        "Review power, clock, sensor, logic and actuator dependencies, then repeat demand tests with each single fault present."
    },
    counterexample: {
      scenario:
        "Two software stop channels are multiplied as independent even though both lose function when one 24 V supply fails.",
      givenLabel: "Shared-supply stop channels",
      givenValue: "two logical channels, one unmonitored 24 V supply",
      givenUnit: null,
      reasoning: [
        "The shared supply is one common cause that can remove both nominal channels simultaneously.",
        "Multiplying separate software failure probabilities understates demand failure because the independence assumption is false.",
        "The untested common fault invalidates both the reliability number and confidence in reaching the safe state."
      ],
      outcome:
        "The apparent redundant stop architecture has an unbounded common-cause failure.",
      criterion:
        "Independence claims require separated or monitored dependencies and faulted evidence at the actual safety boundary.",
      verification:
        "Remove the shared supply during a protective demand and observe whether any independent path still reaches the declared safe state."
    },
    misconception: {
      claim:
        "If a system is reliable enough, it is automatically safe.",
      mechanism:
        "Required-function success is confused with control of harm, and unsafe successful behaviour is omitted.",
      correction:
        "Define safety hazards and safe states separately, then use reliability only for a clearly bounded required function.",
      disconfirmingObservation:
        "A robot can navigate very reliably while reliably driving too fast near people."
    },
    assessmentMoves: [
      "ordering safe-state definition before stop-channel reliability evidence",
      "recovering from the shared 24 V dependency in the redundancy claim",
      "selecting safety and reliability statements within their separate scopes",
      "diagnosing false independence across two software stop channels",
      "explaining why reliable navigation does not establish acceptable safety",
      "matching layered controls to demand tests and dependency evidence",
      "tracing a protective demand through torque removal and safe state",
      "interpreting the common-cause path hidden by probability multiplication"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E4-D24-L06",
    lessonTitle: "Verification, validation and experimental design",
    systemModel:
      "Verification compares implementation with requirements, validation compares the resulting system with intended use, and experimental design makes both evidence sets discriminating and repeatable.",
    failurePattern:
      "A scripted requirement test can pass while the stakeholder need fails when environment, coverage, repetition or acceptance criteria do not represent intended operation.",
    visualExplanation:
      "A V-model links needs and requirements to separate validation and verification activities, with controlled variables, repeats and decision gates attached.",
    applicationTask:
      "Create separate verification and validation tests for an autonomy requirement, declare controlled variables and state the evidence needed for each decision.",
    terms: [
      [
        "Verification",
        "The evidence-based question of whether the implemented design meets its specified requirements.",
        "Verification can pass a requirement that is wrong or incomplete for the stakeholder need."
      ],
      [
        "Validation",
        "The evidence-based question of whether the resulting system satisfies the intended need in representative use.",
        "Validation is not informal user approval; it needs a defined use context, participants, observations and decision rule."
      ],
      [
        "Experimental design",
        "The planned variation, control, replication, randomisation or blocking that lets evidence distinguish competing explanations.",
        "More measurements do not repair a biased setup, confounded variable or acceptance rule written after results are seen."
      ]
    ],
    entities: [
      [
        "input",
        "Autonomy need and requirement",
        "The user outcome, measurable stopping requirement, operating conditions and trace identifiers."
      ],
      [
        "mechanism",
        "Verification experiment",
        "The controlled test of stopping distance against the specified requirement."
      ],
      [
        "state",
        "Validation trial design",
        "The representative aisle-use scenario, participants, tasks and user-outcome observations."
      ],
      [
        "observation",
        "Separated V and V evidence",
        "The requirement-compliance and intended-use results retained without merging their decisions."
      ],
      [
        "decision",
        "Accepted evidence claim",
        "The bounded verification and validation conclusions supported by the planned experiments."
      ]
    ],
    relations: [
      [
        "maps",
        "the autonomy need and requirement map to distinct verification and validation questions",
        "directed",
        "one-to-many"
      ],
      [
        "measures",
        "the verification experiment measures implementation against the stopping requirement",
        "directed",
        "one-to-many"
      ],
      [
        "compares",
        "the validation trial design compares system use with the intended aisle outcome",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "separated V and V evidence supports the accepted evidence claim",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "confounded variables or non-representative use invalidates the accepted evidence claim",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The requirement, stakeholder need, configuration, environment, variables, repeats and acceptance rules are fixed before testing."
      ],
      [
        "assumption",
        "Measurement accuracy and selected trials can distinguish a real compliance or use failure from ordinary variation."
      ],
      [
        "criterion",
        "Verification and validation each answer their own traced question with repeatable evidence and declared uncertainty."
      ],
      [
        "operating-state",
        "The altered test verifies stopping only once on dry flooring and calls that result validation for all occupied aisles."
      ]
    ],
    failure: [
      "One convenient scripted test is used to answer both requirement compliance and intended-use suitability.",
      "Dry-floor success hides wet-floor variation and operator interaction, so the broad autonomy claim exceeds the evidence.",
      "Reject the claim until verification and validation questions, representative conditions and experimental controls are separated."
    ],
    conceptualSteps: [
      "Trace one verification question to a requirement and one validation question to the stakeholder need.",
      "Declare independent, dependent and controlled variables plus configuration and measurement uncertainty.",
      "Select representative levels, repeats and order so effects can be distinguished from noise and drift.",
      "Apply acceptance rules fixed before results and retain failed and unexpected observations.",
      "Report separate verification and validation decisions with their exact evidence limits."
    ],
    example: {
      scenario:
        "A robot shall stop within 0.50 m from 1.0 m/s, while operators need safe, predictable behaviour in occupied aisles.",
      givenLabel: "Stopping requirement and aisle need",
      givenValue:
        "0.50 m at 1.0 m/s; dry and low-friction surfaces; representative operator tasks",
      givenUnit: null,
      reasoning: [
        "Design verification trials that control initial speed, payload, trigger location and surface while repeating stopping-distance measurement.",
        "Design separate validation trials in representative aisles to observe whether people understand, trust and can work safely with the stopping behaviour.",
        "Retain distance distributions for requirement compliance and user-task evidence for intended-use suitability as separate results."
      ],
      outcome:
        "The evidence can show requirement compliance, intended-use suitability, both or neither without conflating them.",
      criterion:
        "Each decision uses traced acceptance rules, representative conditions, adequate repeats and declared uncertainty.",
      verification:
        "Have another engineer reproduce the stopping test and check that the validation trial would still detect a confusing but compliant stop."
    },
    counterexample: {
      scenario:
        "The robot stops once in 0.42 m on a dry empty floor, so the team declares the requirement verified and occupied-aisle need validated.",
      givenLabel: "Single convenient stop",
      givenValue: "0.42 m, one run, dry empty floor",
      givenUnit: null,
      reasoning: [
        "One run cannot characterise variation across payload, surface, speed tolerance or measurement error.",
        "An empty dry floor provides no observation of operator interaction or representative occupied-aisle use.",
        "The experiment therefore supports neither the broad verification coverage nor the validation conclusion claimed."
      ],
      outcome:
        "The 0.42 m observation is useful raw evidence but insufficient for both decisions.",
      criterion:
        "Verification needs bounded repeatable compliance evidence and validation needs representative intended-use evidence.",
      verification:
        "Repeat across controlled surface and payload levels, then run a separate representative operator trial with its own acceptance rule."
    },
    misconception: {
      claim:
        "Verification and validation are two names for testing the finished product.",
      mechanism:
        "Requirement compliance and stakeholder suitability are merged, so a passing script appears to prove the right system was built.",
      correction:
        "Trace verification to requirements, validation to needs and design discriminating evidence for each question.",
      disconfirmingObservation:
        "A robot can meet a 0.50 m stopping requirement yet behave unpredictably enough that operators reject it."
    },
    assessmentMoves: [
      "ordering requirement verification separately from aisle validation",
      "recovering the evidence claim after the single 0.42 m stop",
      "selecting experimental controls for distance and user-outcome questions",
      "diagnosing dry-floor coverage presented as occupied-aisle validation",
      "explaining why compliance and intended use require separate evidence",
      "matching variables, repeats, observations and traced decisions",
      "reading the V-model from need and requirement to two evidence sets",
      "interpreting the confounded one-run result before acceptance"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E4-D24-L07",
    lessonTitle: "Configuration, change control and technical readiness",
    systemModel:
      "Configuration management identifies the controlled system baseline, change control evaluates authorised differences, and readiness review reconciles requirements, risks, tests and unresolved limitations.",
    failurePattern:
      "A tested artefact is not release-ready when the reviewed configuration differs from the built system or a change invalidates evidence without triggering re-evaluation.",
    visualExplanation:
      "A baseline graph connects hardware, software, parameters and documents to change requests, impacted evidence, review dispositions and a readiness gate.",
    applicationTask:
      "Assemble a release baseline, trace a drivetrain change through requirements and tests and decide readiness with explicit open limitations.",
    terms: [
      [
        "Configuration baseline",
        "An authorised, uniquely identified set of hardware, software, data, parameters and documents used for a defined purpose.",
        "A version label is insufficient when dependencies, build inputs or physical item identities remain unknown."
      ],
      [
        "Change control",
        "The documented proposal, impact analysis, authority, implementation and verification of a difference from the baseline.",
        "Approval records authority to change; it does not make prior evidence applicable to the changed system."
      ],
      [
        "Technical readiness",
        "The evidence-based state in which traced requirements, risks, configuration, tests and limitations satisfy a declared gate.",
        "Readiness is conditional and reviewable, not a general claim that no defects or uncertainty remain."
      ]
    ],
    entities: [
      [
        "input",
        "Candidate release baseline",
        "The identified robot hardware, firmware, software, parameters, procedures and evidence versions."
      ],
      [
        "mechanism",
        "Change-impact analysis",
        "The trace from a proposed difference to affected interfaces, requirements, risks and tests."
      ],
      [
        "state",
        "Updated evidence set",
        "The retained test, analysis and review results applicable to the changed baseline."
      ],
      [
        "observation",
        "Readiness reconciliation",
        "The comparison of current configuration, closed findings, open limitations and gate criteria."
      ],
      [
        "decision",
        "Technical readiness decision",
        "The authorised ready, conditional or not-ready disposition for the exact baseline."
      ]
    ],
    relations: [
      [
        "maps",
        "the candidate release baseline maps every controlled item into the change-impact analysis",
        "directed",
        "one-to-many"
      ],
      [
        "depends-on",
        "change-impact analysis depends on trace links to requirements, risks, interfaces and prior tests",
        "directed",
        "many-to-many"
      ],
      [
        "transforms",
        "authorised implementation and re-test transform prior evidence into an updated evidence set",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "readiness reconciliation supports the technical readiness decision",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "configuration mismatch or unevaluated evidence impact invalidates the technical readiness decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Every released item, dependency, parameter and evidence result carries an immutable identity tied to the candidate baseline."
      ],
      [
        "assumption",
        "Trace links identify all material effects of the proposed change and test environments reproduce the release configuration."
      ],
      [
        "criterion",
        "Readiness criteria, impacted tests, residual risks, open limitations and approval authority reconcile for the exact candidate baseline."
      ],
      [
        "operating-state",
        "The altered release changes the motor gear ratio after testing but reuses old speed, stopping and controller evidence."
      ]
    ],
    failure: [
      "A material drivetrain change is approved administratively without tracing how it changes system behaviour and evidence.",
      "The release carries a new gear ratio while readiness cites stopping and control tests from the previous baseline.",
      "Reject readiness until the exact configuration is identified and every invalidated requirement, risk and test is re-evaluated."
    ],
    conceptualSteps: [
      "Identify the complete candidate baseline, including physical items, software, parameters, data and documents.",
      "Describe the proposed difference and trace its technical effects before authorising implementation.",
      "Update controlled items and rerun every test or analysis whose applicability changed.",
      "Reconcile evidence, risks, findings and limitations against the declared readiness gate.",
      "Record the decision, authority and exact baseline without overstating conditional readiness."
    ],
    example: {
      scenario:
        "Robot release R1 contains motor gear ratio 20:1, controller parameters C7, firmware 1.4 and their linked speed and stopping tests.",
      givenLabel: "Controlled release baseline",
      givenValue:
        "R1: gear 20:1, controller C7, firmware 1.4, speed test T18, stop test T22",
      givenUnit: null,
      reasoning: [
        "Assign immutable identities to the hardware, firmware, controller parameters, procedures and evidence.",
        "For a proposed 25:1 gear change, trace speed, torque, odometry, controller tuning, stopping distance and affected hazards before approval.",
        "Build the authorised configuration, rerun impacted tests and reconcile open limitations before issuing a new readiness disposition."
      ],
      outcome:
        "Readiness applies to one reproducible baseline whose change and evidence history can be independently inspected.",
      criterion:
        "The exact released configuration, applicable evidence, residual risk and authority must all meet the readiness gate.",
      verification:
        "Rebuild from the baseline manifest, inspect physical gear marking and reproduce one linked speed and stopping result."
    },
    counterexample: {
      scenario:
        "The gear ratio changes from 20:1 to 25:1 after T18 and T22, but the team keeps the R1 tag and declares release-ready.",
      givenLabel: "Uncontrolled drivetrain change",
      givenValue: "gear 25:1, evidence from 20:1 baseline",
      givenUnit: null,
      reasoning: [
        "The physical release no longer matches the configuration identified by R1.",
        "Speed, odometry, controller and stopping evidence may no longer apply because the drivetrain relationship changed.",
        "The mismatch invalidates readiness until the change is controlled and affected evidence is regenerated."
      ],
      outcome:
        "The robot is not ready under R1 even if it appears to drive during an informal demonstration.",
      criterion:
        "Readiness evidence must apply to the exact built configuration rather than a related prior version.",
      verification:
        "Compare the physical gear marking and build manifest with T18 and T22 setup records; the 20:1 versus 25:1 mismatch is decisive."
    },
    misconception: {
      claim:
        "An approved change and a passing latest build mean the release is ready.",
      mechanism:
        "Administrative authority and compilation success are substituted for technical impact, evidence applicability and baseline identity.",
      correction:
        "Trace, implement and verify the change against the exact controlled baseline before repeating the readiness review.",
      disconfirmingObservation:
        "A build can pass while old stopping evidence still describes the 20:1 drivetrain rather than the released 25:1 drivetrain."
    },
    assessmentMoves: [
      "ordering baseline identity through change impact and readiness reconciliation",
      "recovering R1 after the uncontrolled 20-to-25 ratio change",
      "selecting evidence applicable to firmware 1.4 and controller C7",
      "diagnosing old T18 and T22 results attached to new hardware",
      "explaining why approval cannot preserve invalidated evidence",
      "matching controlled items, changes, tests and readiness authority",
      "reading the baseline graph from gear marking to release decision",
      "interpreting the not-ready state despite a passing latest build"
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

const rotate = <Value>(
  values: readonly Value[],
  offset: number
): readonly Value[] => {
  const normalisedOffset = offset % values.length;
  return [
    ...values.slice(normalisedOffset),
    ...values.slice(0, normalisedOffset)
  ];
};

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
    throw new Error(`Missing D24 instruction move ${slot}.`);
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
    throw new Error(`Missing D24 instruction plan ${slot}.`);
  }
  return [
    plan[0],
    plan[1],
    plan[2],
    [plan[3], plan[4]],
    [plan[5], plan[6]]
  ];
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
        throw new Error(`Missing D24 relation endpoints ${index}.`);
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
        throw new Error(`Missing D24 condition binding ${index}.`);
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
  const baseQ3Options = rotate(
    [
      ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
      ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
      [
        "b-misconception",
        false,
        misconception("misconception", "claim"),
        misconception("misconception", "mechanism"),
        ["r2", "r5"],
        ["c4"],
        "misconception"
      ],
      [
        "b-counter",
        false,
        reasonedCase("counter", "outcome"),
        reasonedCase("counter", "criterion"),
        ["r5"],
        ["c3", "c4"],
        null
      ]
    ] as const,
    source.variant % 4
  );
  const retryQ3Options = rotate(
    [
      ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
      ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
      ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
      [
        "r-misconception",
        false,
        misconception("misconception", "claim"),
        misconception("misconception", "mechanism"),
        ["r2", "r5"],
        ["c4"],
        "misconception"
      ],
      [
        "r-criterion",
        false,
        term("t3", "boundary"),
        condition("c3"),
        ["r4"],
        ["c3"],
        null
      ]
    ] as const,
    source.variant % 5
  );
  const q4ConceptGroups = rotate(
    [
      [
        "definition",
        term("t1", "label"),
        [term("t1", "definition")],
        ["r1"],
        ["c1"]
      ],
      [
        "mechanism",
        relation("r3"),
        [relation("r3")],
        ["r3"],
        ["c2"]
      ],
      [
        "criterion",
        condition("c3"),
        [condition("c3")],
        ["r4"],
        ["c3"]
      ]
    ] as const,
    source.variant % 3
  );
  const q4Pairs = rotate(
    [
      [
        "pair-1",
        relation("r1"),
        condition("c1"),
        relation("r1"),
        ["r1"],
        ["c1"]
      ],
      [
        "pair-2",
        relation("r3"),
        term("t2", "boundary"),
        relation("r3"),
        ["r3"],
        ["c2"]
      ],
      [
        "pair-3",
        relation("r4"),
        condition("c3"),
        relation("r4"),
        ["r4"],
        ["c3"]
      ]
    ] as const,
    source.variant % 3
  );

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
        givens: [
          [
            "worked-given",
            source.example.givenLabel,
            source.example.givenValue,
            source.example.givenUnit,
            "e1"
          ]
        ],
        reasoningSteps: [
          [
            "worked-1",
            source.example.reasoning[0],
            ["e1", "e2"],
            ["r1"],
            ["c1"]
          ],
          [
            "worked-2",
            source.example.reasoning[1],
            ["e2", "e4"],
            ["r2", "r3"],
            ["c2"]
          ],
          [
            "worked-3",
            source.example.reasoning[2],
            ["e4", "e5"],
            ["r4"],
            ["c3"]
          ]
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
        givens: [
          [
            "counter-given",
            source.counterexample.givenLabel,
            source.counterexample.givenValue,
            source.counterexample.givenUnit,
            "e1"
          ]
        ],
        reasoningSteps: [
          [
            "counter-1",
            source.counterexample.reasoning[0],
            ["e1", "e5"],
            ["r5"],
            ["c4"]
          ],
          [
            "counter-2",
            source.counterexample.reasoning[1],
            ["e2", "e5"],
            ["r2", "r5"],
            ["c2", "c4"]
          ],
          [
            "counter-3",
            source.counterexample.reasoning[2],
            ["e4", "e5"],
            ["r4", "r5"],
            ["c3", "c4"]
          ]
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
      disconfirmingObservation:
        source.misconception.disconfirmingObservation,
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
          contextConditionIds: rotate(
            ["c1", "c2", "c3"],
            source.variant % 3
          ),
          options: baseQ3Options
        },
        retry: {
          instruction: instructionPlan(source, 3),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: rotate(
            ["c4", "c2", "c3"],
            Math.floor(source.variant / 3)
          ),
          options: retryQ3Options
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: rotate(
            ["c2", "c3", "c4"],
            source.variant % 3
          ),
          conceptGroups: q4ConceptGroups,
          minimumConceptGroups: 3,
          requiredRelationIds: ["r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: rotate(
            ["c1", "c2", "c3"],
            Math.floor(source.variant / 3)
          ),
          pairs: q4Pairs
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instructionPlan(source, 6),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c2", "c3", "c4"],
          positions: [
            ["e1", 0, 0],
            ["e2", 1, 0],
            ["e3", 2, 0],
            ["e4", 3, 0],
            ["e5", 4, 0]
          ],
          relationIds: ["r1", "r2", "r3"],
          answerRelationIds: ["r3"],
          options: [
            [
              "diagram-correct",
              true,
              reasonedCase("worked", "verification"),
              condition("c3"),
              ["r3", "r4"],
              ["c2", "c3"],
              null
            ],
            [
              "diagram-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r2", "r5"],
              ["c4"],
              "misconception"
            ],
            [
              "diagram-boundary",
              false,
              term("t2", "boundary"),
              condition("c1"),
              ["r1"],
              ["c1"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instructionPlan(source, 7),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c1", "c3"],
          positions: [
            ["e1", 0, 1],
            ["e2", 1, 1],
            ["e3", 2, 1],
            ["e4", 3, 1],
            ["e5", 4, 1]
          ],
          relationIds: ["r3", "r4", "r5"],
          answerRelationIds: ["r4"],
          options: [
            [
              "retry-correct",
              true,
              reasonedCase("worked", "outcome"),
              reasonedCase("worked", "verification"),
              ["r4"],
              ["c3"],
              null
            ],
            [
              "retry-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r5"],
              ["c4"],
              "misconception"
            ],
            [
              "retry-counter",
              false,
              reasonedCase("counter", "outcome"),
              reasonedCase("counter", "criterion"),
              ["r3", "r5"],
              ["c2", "c4"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("t1", "label"),
      focusRef: reasonedCase("worked", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["e1", 0, 0],
        ["e2", 1, 0],
        ["e3", 2, 0],
        ["e4", 3, 0],
        ["e5", 4, 0]
      ],
      visibleEntityIds: ["e1", "e2", "e3", "e4", "e5"],
      visibleRelationIds: ["r1", "r2", "r3", "r4", "r5"],
      controls: [
        [
          "bounded",
          term("t2", "label"),
          ["c1"],
          ["e1", "e2", "e3"],
          ["r1", "r2"],
          ["r5"],
          [],
          [
            [
              "bounded-note",
              source.visualExplanation,
              ["e1", "e2"],
              ["r1"]
            ]
          ],
          reasonedCase("worked", "verification")
        ],
        [
          "altered",
          term("t3", "label"),
          ["c4"],
          ["e1", "e4", "e5"],
          ["r4", "r5"],
          ["r1"],
          [],
          [
            [
              "altered-note",
              source.failure[1],
              ["e1", "e5"],
              ["r5"]
            ]
          ],
          reasonedCase("counter", "verification")
        ]
      ]
    }
  };
};

export const academyLessonTeachingProfileV2PlansE4D24 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE4D24 =
  lessonSources.map((source) => source.lessonId);

export const academyLessonTeachingProfileV2TitlesE4D24 =
  lessonSources.map((source) => source.lessonTitle);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE4D24,
    academyLessonTeachingProfileV2PlansE4D24
  );

export const academyLessonTeachingProfilesV2E4D24 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE4D24.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D24 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E4D24;
