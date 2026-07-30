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
    lessonId: "EML-E4-D25-L01",
    lessonTitle: "Project planning and decision records",
    systemModel:
      "An executable project plan connects bounded work packages through dependencies, resources, risks and acceptance gates, while decision records preserve material choices and their evidence.",
    failurePattern:
      "A detailed calendar can remain unactionable when dependencies, owners and acceptance conditions are absent or assumptions change without a reviewable decision record.",
    visualExplanation:
      "A dependency network links capstone work packages and acceptance gates, with decision records attached where alternatives and evidence change the authorised path.",
    applicationTask:
      "Plan a bounded capstone increment, identify its critical dependencies and write one decision record for a material technical choice.",
    terms: [
      [
        "Work package",
        "A bounded piece of project work with an owner, inputs, outputs, effort, completion evidence and acceptance condition.",
        "A topic or date range is not executable work until its deliverable and done condition are explicit."
      ],
      [
        "Dependency network",
        "The directed relationships showing which work or decisions must precede, enable or constrain other work.",
        "Calendar order alone does not expose technical prerequisites, shared resources or blocked acceptance gates."
      ],
      [
        "Decision record",
        "A dated record of context, alternatives, evidence, authority, choice, consequences and conditions for revisiting it.",
        "A decision record preserves reasoning; it does not make weak evidence correct or replace required approval."
      ]
    ],
    entities: [
      [
        "input",
        "Capstone increment scope",
        "The bounded outcome, constraints, available people, resources and completion date."
      ],
      [
        "mechanism",
        "Executable work network",
        "The work packages, owners, estimates, dependencies, risk responses and acceptance gates."
      ],
      [
        "state",
        "Recorded technical choices",
        "The decision records governing material architecture and implementation paths."
      ],
      [
        "observation",
        "Gate and progress evidence",
        "The completed outputs, blocked dependencies, accepted results and forecast changes."
      ],
      [
        "decision",
        "Authorised project direction",
        "The current plan and technical path retained after evidence and authority are reconciled."
      ]
    ],
    relations: [
      [
        "maps",
        "the capstone increment scope maps required outcomes into the executable work network",
        "directed",
        "one-to-many"
      ],
      [
        "routes",
        "the executable work network routes deliverables through technical dependencies and gates",
        "directed",
        "many-to-many"
      ],
      [
        "constrains",
        "recorded technical choices constrain downstream work and acceptance evidence",
        "directed",
        "one-to-many"
      ],
      [
        "supports",
        "gate and progress evidence supports the authorised project direction",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unowned dependency or undocumented material choice invalidates the authorised project direction",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The increment outcome, exclusions, deadline, resources and acceptance gate are fixed before work packages are committed."
      ],
      [
        "assumption",
        "Dependencies name real technical or resource prerequisites and each work package has one accountable owner."
      ],
      [
        "criterion",
        "The plan can be executed and reviewed because every package has a deliverable, dependency, owner and evidence-based done condition."
      ],
      [
        "operating-state",
        "The altered plan lists calendar dates but omits that localisation depends on sensor calibration and route testing depends on localisation."
      ]
    ],
    failure: [
      "Dates are assigned before technical dependencies, acceptance gates and decision ownership are exposed.",
      "Localisation and route testing appear on schedule but cannot start or close because calibration and evidence prerequisites are missing.",
      "Reject the plan until work packages, dependencies, owners, gates and material decisions form one executable record."
    ],
    conceptualSteps: [
      "Bound the capstone increment by outcome, exclusions, resources and acceptance gate.",
      "Break the outcome into owned work packages with explicit deliverables and done conditions.",
      "Draw technical and resource dependencies, then identify the path that controls the gate.",
      "Record material choices with alternatives, evidence, authority and revisit conditions.",
      "Update forecasts and direction from gate evidence without silently rewriting past decisions."
    ],
    example: {
      scenario:
        "A four-week capstone increment must demonstrate repeatable autonomous inventory travel on one mapped aisle.",
      givenLabel: "Autonomous inventory increment",
      givenValue:
        "sensor calibration, localisation, route execution, acceptance run and compute-module choice",
      givenUnit: null,
      reasoning: [
        "Define calibration, localisation, route integration and acceptance demonstration as separate owned work packages with evidence.",
        "Link localisation to completed calibration and route acceptance to localisation performance and a released robot configuration.",
        "Record the compute-module choice with alternatives, measured resource evidence, decision authority and a trigger for reconsideration."
      ],
      outcome:
        "The team can see what is ready, what is blocked and why the current technical path is authorised.",
      criterion:
        "Every gate-critical dependency and material choice has an owner, evidence and reviewable completion or revisit condition.",
      verification:
        "Remove the calibration output from the network and confirm that the plan visibly blocks localisation and downstream route acceptance."
    },
    counterexample: {
      scenario:
        "A Gantt chart places calibration, localisation and route testing on consecutive dates but contains no deliverables, dependencies or decision records.",
      givenLabel: "Date-only project chart",
      givenValue:
        "three dated bars, no owners, outputs, gates or technical-choice history",
      givenUnit: null,
      reasoning: [
        "The chart does not state what calibration produces or how localisation consumes it.",
        "Route testing can appear started even when no accepted localisation configuration exists.",
        "Without decision records, a compute-platform change can silently invalidate estimates and evidence."
      ],
      outcome:
        "The calendar is a visual intention, not an executable project plan.",
      criterion:
        "A plan must expose deliverables, dependencies, accountability and acceptance rather than dates alone.",
      verification:
        "Ask which exact artefact unblocks localisation and who accepts it; the chart provides no answer."
    },
    misconception: {
      claim:
        "A more detailed schedule is automatically a better project plan.",
      mechanism:
        "Calendar precision disguises missing technical dependencies, ownership, evidence and decision authority.",
      correction:
        "Make work executable first, then place the dependency-aware packages and gates on a schedule.",
      disconfirmingObservation:
        "A dated localisation task remains blocked when the calibration artefact it needs is neither defined nor accepted."
    },
    assessmentMoves: [
      "ordering calibration, localisation and route acceptance through real dependencies",
      "repairing the date-only chart after the missing calibration artefact appears",
      "selecting executable work-package and decision-record claims",
      "diagnosing the undocumented compute change on the gate-critical path",
      "explaining why dependency evidence matters more than calendar detail",
      "matching scope, owner, deliverable, gate and technical decision",
      "tracing the four-week increment from scope to authorised direction",
      "auditing the schedule that shows progress while downstream work is blocked"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E4-D25-L02",
    lessonTitle: "Technical reports and reproducible evidence",
    systemModel:
      "A technical report leads from question and method to results, uncertainty and a bounded conclusion, while retained data and computation let another person reproduce the evidence.",
    failurePattern:
      "A polished report becomes advocacy when failed trials, transformations, configuration, uncertainty or evidence that limits the preferred conclusion are omitted.",
    visualExplanation:
      "An evidence map links each report claim and figure to raw observations, configuration, method, calculation, uncertainty and an independently repeatable result.",
    applicationTask:
      "Audit a short engineering result, trace every claim to reproducible evidence and state one limitation that materially changes interpretation.",
    terms: [
      [
        "Technical report",
        "A structured engineering record that connects a question, method, results, uncertainty and bounded conclusion for a defined audience.",
        "Professional formatting cannot compensate for missing method, contradictory data or claims beyond the evidence."
      ],
      [
        "Reproducible evidence",
        "Data, configuration, method and computation retained with enough identity and detail for an independent person to repeat the result.",
        "A screenshot or final table without raw inputs and transformations is not reproducible evidence."
      ],
      [
        "Bounded conclusion",
        "A conclusion that states exactly what the evidence supports, under which conditions and with which limitations.",
        "A bounded conclusion does not generalise from one configuration or environment to every operating case."
      ]
    ],
    entities: [
      [
        "input",
        "Engineering question and observations",
        "The runtime question, raw trials, metadata, failed runs and configuration identity."
      ],
      [
        "mechanism",
        "Method and provenance chain",
        "The procedure, calibration, transformations, code version and inclusion rules."
      ],
      [
        "state",
        "Result and uncertainty statement",
        "The calculated result, variation, units and uncertainty or limitation appropriate to the method."
      ],
      [
        "observation",
        "Independent reproduction result",
        "The comparison produced when another person runs the retained method from the raw evidence."
      ],
      [
        "decision",
        "Accepted report conclusion",
        "The claim retained because evidence, method, uncertainty and scope agree."
      ]
    ],
    relations: [
      [
        "maps",
        "the engineering question and observations map into the method and provenance chain",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the method and provenance chain transforms retained observations into the result and uncertainty statement",
        "directed",
        "many-to-one"
      ],
      [
        "compares",
        "the result and uncertainty statement compares the observed system with the question and acceptance boundary",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "independent reproduction result supports the accepted report conclusion",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "omitted trials or unrecoverable transformations invalidate the accepted report conclusion",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Raw observations, units, configuration, calibration, code, transformations and inclusion rules are retained with stable identities."
      ],
      [
        "assumption",
        "The method and sample are suitable for the stated question and limitations reveal important coverage gaps."
      ],
      [
        "criterion",
        "An independent reviewer can reproduce the reported result and the conclusion does not exceed the tested configuration and conditions."
      ],
      [
        "operating-state",
        "The altered report removes low-runtime trials, keeps only a polished chart and claims all-day endurance for every payload."
      ]
    ],
    failure: [
      "Results are selected and transformed without retaining the excluded observations, rules or computation path.",
      "The chart appears consistent but an independent reviewer cannot reproduce it or evaluate the omitted low-runtime evidence.",
      "Reject the conclusion until the full evidence chain is recoverable and the claim is narrowed to the tested conditions."
    ],
    conceptualSteps: [
      "State the engineering question, system configuration, conditions and decision boundary.",
      "Retain raw observations, failed trials, calibration, method and computation identity.",
      "Calculate results with units and appropriate variation or uncertainty without deleting inconvenient evidence.",
      "Ask an independent person to reproduce a representative result from the retained inputs.",
      "Write the conclusion at the narrowest scope supported and state limitations that change interpretation."
    ],
    example: {
      scenario:
        "A battery-runtime report evaluates one robot configuration under a declared payload, route, speed profile and ambient range.",
      givenLabel: "Runtime evidence package",
      givenValue:
        "raw CSV trials, battery calibration ID, robot manifest, analysis commit and inclusion rule",
      givenUnit: null,
      reasoning: [
        "State the configuration and runtime question before processing all completed and failed trials.",
        "Retain the raw CSV files, calibration record and exact analysis commit that generates the figure and summary.",
        "Report the observed result and variation only for the tested payload, route, speed and ambient range, including limitations."
      ],
      outcome:
        "Another engineer can recreate the figure and assess the conclusion at the same evidence boundary.",
      criterion:
        "The report passes when raw-to-claim provenance is complete and the conclusion stays within tested conditions.",
      verification:
        "Start from a clean checkout and raw data copy, regenerate the figure and compare the numeric result and included trial set."
    },
    counterexample: {
      scenario:
        "The author removes three low-runtime trials, exports a chart image and reports that the robot lasts all day under any payload.",
      givenLabel: "Selective runtime report",
      givenValue:
        "chart image, omitted trials, no script or configuration manifest",
      givenUnit: null,
      reasoning: [
        "The exclusion rule and failed evidence are missing, so selection bias cannot be inspected.",
        "The chart cannot reveal calibration, transformations or the robot configuration that produced it.",
        "The any-payload conclusion generalises far beyond the surviving observations."
      ],
      outcome:
        "The report is polished but its result is unreproducible and its conclusion unsupported.",
      criterion:
        "Evidence selection, computation and configuration must be reviewable and conclusions must remain bounded.",
      verification:
        "Request the omitted trials and regenerate the chart; the absence of inputs and code prevents reproduction."
    },
    misconception: {
      claim:
        "A clear chart and professional report make the evidence reproducible.",
      mechanism:
        "Presentation quality is substituted for raw observations, provenance, computation and configuration identity.",
      correction:
        "Retain the complete raw-to-result chain and use presentation to explain rather than replace it.",
      disconfirmingObservation:
        "A reviewer cannot recreate a chart image when its trials, exclusions and calculation script are missing."
    },
    assessmentMoves: [
      "ordering raw runtime observations through provenance to bounded conclusion",
      "repairing the report after three low-runtime trials were removed",
      "selecting reproducibility claims tied to configuration and analysis commit",
      "diagnosing the all-payload conclusion from one hidden trial set",
      "explaining why polished charts cannot replace raw-to-claim provenance",
      "matching question, method, result, reproduction and limitation",
      "tracing a runtime figure back to CSV, calibration and code",
      "auditing the selective chart before accepting endurance claims"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E4-D25-L03",
    lessonTitle: "Design reviews and engineering argument",
    systemModel:
      "A design review challenges requirements, architecture, calculations, interfaces, risks and evidence, while an engineering argument connects claims to reasons, evidence and rebuttals.",
    failurePattern:
      "A presentation can be mistaken for review completion when concerns lack owners, evidence responses, closure criteria or authority to accept residual risk.",
    visualExplanation:
      "A review flow connects submitted evidence to a reviewer challenge, finding, owner, corrective action, closure evidence and formal disposition.",
    applicationTask:
      "Prepare one robot-subsystem review slice, invite a disconfirming challenge and close or retain the resulting finding with evidence.",
    terms: [
      [
        "Design review",
        "A structured, evidence-led examination of whether a design is ready to proceed at a declared decision gate.",
        "A design review is not automatically successful because slides were presented or stakeholders attended."
      ],
      [
        "Review finding",
        "A recorded concern, question or non-conformance with an owner, significance, required response and closure condition.",
        "A verbal promise is not a closed finding until the required evidence and authorised disposition exist."
      ],
      [
        "Engineering argument",
        "A traceable claim supported by reasoning and evidence while addressing assumptions, counterevidence and limitations.",
        "An argument must not treat authority, confidence or absence of questions as technical proof."
      ]
    ],
    entities: [
      [
        "input",
        "Review evidence package",
        "The requirements, architecture, calculations, interfaces, risks, tests and known limitations submitted for challenge."
      ],
      [
        "mechanism",
        "Reviewer challenge process",
        "The structured questions, disconfirming cases and evidence checks applied at the gate."
      ],
      [
        "state",
        "Finding disposition plan",
        "The owner, action, evidence, due condition and decision authority for each finding."
      ],
      [
        "observation",
        "Closure evidence",
        "The corrected analysis, test or accepted residual limitation used to resolve a finding."
      ],
      [
        "decision",
        "Review gate disposition",
        "The authorised proceed, conditional proceed or hold decision linked to closed and open findings."
      ]
    ],
    relations: [
      [
        "maps",
        "the review evidence package maps gate claims into the reviewer challenge process",
        "directed",
        "one-to-many"
      ],
      [
        "compares",
        "the reviewer challenge process compares claims with requirements, counterevidence and boundary cases",
        "directed",
        "many-to-many"
      ],
      [
        "routes",
        "the finding disposition plan routes each challenge to an owner, action and closure condition",
        "directed",
        "one-to-many"
      ],
      [
        "supports",
        "closure evidence supports the review gate disposition",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unowned or unevidenced material finding invalidates the review gate disposition",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The review purpose, decision authority, evidence baseline, entry criteria and possible dispositions are declared."
      ],
      [
        "assumption",
        "Reviewers can access the evidence, raise disconfirming cases and distinguish factual closure from accepted residual risk."
      ],
      [
        "criterion",
        "Every material finding has an accountable disposition and evidence meeting its closure condition before the gate proceeds."
      ],
      [
        "operating-state",
        "The altered review marks approved after the presentation even though a motor thermal finding has no owner or hot-ambient evidence."
      ]
    ],
    failure: [
      "Attendance and presentation completion are treated as approval while challenge results are not controlled.",
      "A motor thermal limit can be exceeded in hot ambient operation although the review record says approved.",
      "Reject the gate decision until material findings have owners, closure evidence and authorised dispositions."
    ],
    conceptualSteps: [
      "Define the gate decision, authority, entry evidence and possible dispositions.",
      "Present claims as engineering arguments with traced evidence, assumptions and known limitations.",
      "Invite disconfirming questions about requirements, interfaces, calculations, risks and boundary conditions.",
      "Record each material finding with owner, required response, closure evidence and authority.",
      "Proceed only when the finding state and gate disposition agree."
    ],
    example: {
      scenario:
        "A motor enclosure review predicts 78 C at 25 C ambient against an 85 C component limit, and a reviewer asks about the declared 40 C operating boundary.",
      givenLabel: "Motor thermal review slice",
      givenValue:
        "78 C prediction at 25 C ambient, 85 C limit, required ambient up to 40 C",
      givenUnit: null,
      reasoning: [
        "Present the thermal claim, model assumptions, component limit and evidence rather than only the favourable result.",
        "Record the 40 C challenge as a material finding with an owner and closure condition for representative analysis or test.",
        "If hot-ambient evidence exceeds the limit, revise cooling or operating scope and close the finding only after verified correction."
      ],
      outcome:
        "The review converts a disconfirming question into controlled design learning and an evidence-based gate decision.",
      criterion:
        "The gate proceeds only when the hot-ambient finding is closed or residual scope is explicitly accepted by authorised reviewers.",
      verification:
        "Inspect the finding record, repeat the hot-ambient evidence and confirm the final disposition names the applicable design baseline."
    },
    counterexample: {
      scenario:
        "The chair says approved at the end of the slides while the 40 C thermal concern has no finding ID, owner or closure evidence.",
      givenLabel: "Presentation-only approval",
      givenValue: "verbal approval, open thermal concern, no controlled finding",
      givenUnit: null,
      reasoning: [
        "The verbal approval does not capture the material boundary challenge or assign responsibility.",
        "The 78 C result at 25 C cannot establish compliance at the required 40 C ambient.",
        "Without controlled closure or authorised residual limitation, the proceed decision is unsupported."
      ],
      outcome:
        "The meeting finished, but the design review gate did not validly close.",
      criterion:
        "Material concerns require recorded findings and evidence-based dispositions tied to the reviewed baseline.",
      verification:
        "Search the review record for a finding ID and hot-ambient evidence; their absence disproves closure."
    },
    misconception: {
      claim:
        "A design review is passed when reviewers do not object during the presentation.",
      mechanism:
        "Silence and authority are treated as evidence while challenges, findings and closure conditions remain informal.",
      correction:
        "Define the gate, invite challenge, control findings and tie every disposition to evidence and authority.",
      disconfirmingObservation:
        "The motor can exceed its 85 C limit at the required ambient even though nobody objected before the slides ended."
    },
    assessmentMoves: [
      "ordering evidence, challenge, finding and gate disposition",
      "repairing the verbal approval after the hot-ambient concern",
      "selecting valid engineering-argument and finding-closure claims",
      "diagnosing the missing owner for the 40 C boundary test",
      "explaining why reviewer silence is not technical proof",
      "matching claims, challenges, owners, evidence and dispositions",
      "tracing the thermal review from 78 C evidence to a controlled gate",
      "auditing the approved label while a material finding remains open"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E4-D25-L04",
    lessonTitle: "Ethics, sustainability and professional responsibility",
    systemModel:
      "Professional engineering decisions combine duty to people, truthful evidence, competence and authority with lifecycle consequences for resources, communities and environment.",
    failurePattern:
      "Schedule or commercial pressure can turn uncertainty into unsupported assurance, shift harm outside the project boundary or conceal work beyond personal competence.",
    visualExplanation:
      "A responsibility map places affected people, evidence, competence, authority, lifecycle effects, conflicts and escalation paths around a proposed release action.",
    applicationTask:
      "Analyse a safety and sustainability decision, identify competence and authority boundaries and document a truthful escalation.",
    terms: [
      [
        "Duty to people",
        "The professional obligation to protect safety, wellbeing and truthful decision-making for people affected by engineering work.",
        "Duty is not limited to the paying client or immediate project team when others can bear the harm."
      ],
      [
        "Competence and authority",
        "The combination of relevant capability and legitimate decision permission needed to undertake or approve work.",
        "Confidence, job title or schedule pressure does not expand actual competence or delegated authority."
      ],
      [
        "Lifecycle sustainability",
        "The consideration of environmental, resource and social consequences across sourcing, manufacture, use, maintenance and end of life.",
        "A local efficiency improvement is not sustainable if material harm is merely shifted to another stage or community."
      ]
    ],
    entities: [
      [
        "input",
        "Proposed engineering action",
        "The deployment choice, evidence, uncertainty, affected people, lifecycle context and commercial pressure."
      ],
      [
        "mechanism",
        "Ethical and competence assessment",
        "The examination of duties, conflicts, capability, authority and foreseeable consequences."
      ],
      [
        "state",
        "Escalation and mitigation plan",
        "The disclosed limitation, restricted scope, responsible authority and actions needed before proceeding."
      ],
      [
        "observation",
        "Lifecycle and safety evidence",
        "The test, impact and stakeholder evidence used to evaluate the proposed action."
      ],
      [
        "decision",
        "Responsible professional decision",
        "The proceed, restrict, redesign or stop decision made within competence and authority with truthful evidence."
      ]
    ],
    relations: [
      [
        "maps",
        "the proposed engineering action maps affected people and lifecycle consequences into the ethical assessment",
        "directed",
        "one-to-many"
      ],
      [
        "constrains",
        "competence and authority constrain the actions and assurances an engineer may personally make",
        "directed",
        "many-to-many"
      ],
      [
        "routes",
        "the escalation and mitigation plan routes unresolved concerns to responsible authority and corrective action",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "lifecycle and safety evidence supports the responsible professional decision",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "concealed uncertainty or work beyond competence invalidates the responsible professional decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Affected people, safety evidence, lifecycle stages, conflicts, competence and decision authority are declared."
      ],
      [
        "assumption",
        "Material uncertainty and adverse evidence can be raised without being edited into unsupported assurance."
      ],
      [
        "criterion",
        "The decision protects people, reports evidence truthfully, stays within competence and authority and addresses material lifecycle harm."
      ],
      [
        "operating-state",
        "The altered release hides a reflective-clothing perception failure to meet schedule and claims safety approval beyond the engineer's authority."
      ]
    ],
    failure: [
      "Commercial urgency and role confidence are allowed to override adverse evidence, competence limits and affected-party duties.",
      "People wearing reflective clothing can enter a known perception blind spot while decision-makers receive a false safety assurance.",
      "Reject the release claim and escalate until evidence, scope, competent review and authorised risk decisions are truthful."
    ],
    conceptualSteps: [
      "Identify everyone who can experience safety, social, environmental or resource consequences.",
      "Separate verified evidence, uncertainty, conflicts, personal competence and delegated authority.",
      "Consider material impacts across sourcing, manufacture, use, maintenance and end of life.",
      "Disclose and escalate unresolved harm through the responsible technical and organisational path.",
      "Record a proceed, restrict, redesign or stop decision without overstating evidence or authority."
    ],
    example: {
      scenario:
        "A pedestrian-detection model performs poorly on reflective workwear, and a manager asks for release before additional representative testing.",
      givenLabel: "Known perception limitation",
      givenValue:
        "reduced detection on reflective workwear, occupied site, release pressure, engineer lacks risk-acceptance authority",
      givenUnit: null,
      reasoning: [
        "Identify the exposed workers and separate the verified failure evidence from assumptions about rarity.",
        "State the competence and authority boundary, restrict deployment and escalate to the accountable safety and operational decision-makers.",
        "Plan representative testing and lifecycle mitigations, including training, maintenance and eventual model or sensor update."
      ],
      outcome:
        "The limitation is disclosed, unsafe assurance is withheld and the decision reaches people with the required competence and authority.",
      criterion:
        "The action is responsible only when people are protected and evidence, authority and lifecycle effects are represented truthfully.",
      verification:
        "Inspect the escalation record, deployment restriction and test plan, then confirm no document claims an approval that was not granted."
    },
    counterexample: {
      scenario:
        "The engineer removes the reflective-workwear result, writes safe for deployment and signs on behalf of a safety authority to meet schedule.",
      givenLabel: "Concealed adverse evidence",
      givenValue:
        "failed case removed, unsupported assurance, no delegated risk authority",
      givenUnit: null,
      reasoning: [
        "Removing adverse evidence prevents affected people and decision-makers from understanding a foreseeable hazard.",
        "The engineer exceeds authority by asserting risk acceptance that was never delegated.",
        "The schedule benefit cannot justify deceptive evidence or exposure of workers to the known blind spot."
      ],
      outcome:
        "The release action is professionally and ethically invalid.",
      criterion:
        "Truthful evidence, protection of people and authorised competent decision-making are mandatory boundaries.",
      verification:
        "Compare the raw evaluation set with the release report and authority matrix; the omitted case and unauthorised signature are observable."
    },
    misconception: {
      claim:
        "Professional responsibility means following the manager's decision once concerns have been mentioned.",
      mechanism:
        "Duty, truthful evidence and authority boundaries are treated as optional after informal disclosure.",
      correction:
        "Use the formal escalation path, preserve adverse evidence and do not make or enable unsupported assurances.",
      disconfirmingObservation:
        "A worker remains exposed to the known blind spot even if the release schedule and manager instruction are followed."
    },
    assessmentMoves: [
      "ordering affected people, evidence, competence and escalation",
      "repairing the release after reflective-workwear failure was hidden",
      "selecting truthful professional and lifecycle responsibility claims",
      "diagnosing the unauthorised safety assurance under schedule pressure",
      "explaining why manager instruction does not remove personal duty",
      "matching harms, competence, authority, evidence and escalation",
      "tracing the perception limitation to a responsible release decision",
      "auditing the concealed case and false approval before deployment"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E4-D25-L05",
    lessonTitle: "Portfolio evidence and claim boundaries",
    systemModel:
      "Portfolio evidence connects a precise capability claim to context, personal contribution, a reviewable artefact, verified result and acknowledged limitation.",
    failurePattern:
      "Team participation, intent or a polished screenshot can be overstated as mastery when authorship, decision responsibility and reproducible outcome are unclear.",
    visualExplanation:
      "An evidence chain links a capability claim to project context, personal decisions, authored artefacts, verification results, reviewer access and bounded limitations.",
    applicationTask:
      "Choose one engineering capability claim, attach its strongest artefact and result and narrow it until contribution and limitation are unambiguous.",
    terms: [
      [
        "Capability claim",
        "A precise statement of what engineering work a person can demonstrably perform at a stated scope.",
        "A broad role label or project outcome is not a personal capability claim without evidence of the person's work and judgement."
      ],
      [
        "Personal contribution",
        "The decisions, implementation, analysis or verification performed by the claimant within a team context.",
        "Participation in meetings or use of a team artefact must not be represented as sole authorship or decision authority."
      ],
      [
        "Reviewable artefact",
        "A concrete item such as code, calculation, model, test record or design file that a reviewer can inspect and connect to the claim.",
        "A screenshot without source, provenance, configuration or verification rarely proves the underlying capability."
      ]
    ],
    entities: [
      [
        "input",
        "Project context and role",
        "The problem, team structure, constraints and claimant's actual responsibility."
      ],
      [
        "mechanism",
        "Contribution trace",
        "The link from personal decisions and authored work to versioned artefacts."
      ],
      [
        "state",
        "Verification result",
        "The test or review outcome demonstrating what the artefact achieved."
      ],
      [
        "observation",
        "Limitation and reviewer evidence",
        "The scope boundary, missing evidence and access that let a reviewer challenge the claim."
      ],
      [
        "decision",
        "Bounded portfolio claim",
        "The capability statement retained because contribution, artefact, result and limitation agree."
      ]
    ],
    relations: [
      [
        "maps",
        "project context and role map the claimed capability into the contribution trace",
        "directed",
        "one-to-many"
      ],
      [
        "maps",
        "the contribution trace maps personal decisions into reviewable artefacts",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "the verification result supports the capability demonstrated by the artefact",
        "directed",
        "many-to-many"
      ],
      [
        "constrains",
        "limitation and reviewer evidence constrain the bounded portfolio claim",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "unclear authorship or unreproducible outcome invalidates the bounded portfolio claim",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The claim names the capability, project context, personal action, artefact, result and material limitation."
      ],
      [
        "assumption",
        "Version history, records and reviewers can distinguish personal contribution from team output."
      ],
      [
        "criterion",
        "A reviewer can inspect the artefact, reproduce or challenge the result and see that the wording does not exceed personal evidence."
      ],
      [
        "operating-state",
        "The altered portfolio says built an autonomous robot using a team screenshot with no authorship, test or limitation evidence."
      ]
    ],
    failure: [
      "A broad project result is copied into a personal claim without tracing individual work or evidence.",
      "The screenshot shows a robot running but cannot establish who designed, implemented or verified the claimed capability.",
      "Reject the claim until contribution, artefact, result and limitation are reviewable and proportionate."
    ],
    conceptualSteps: [
      "Choose one precise capability rather than claiming the entire multidisciplinary project.",
      "State project context, team roles and the exact decision or work personally performed.",
      "Link the contribution to a versioned code, design, calculation or test artefact.",
      "Attach a verified result and name material limits such as simulation-only or restricted operating conditions.",
      "Rewrite the claim until an independent reviewer can inspect and challenge every part."
    ],
    example: {
      scenario:
        "A portfolio claim concerns implementing and verifying wheel-odometry and IMU fusion in a ROS 2 localisation stack.",
      givenLabel: "Localisation contribution evidence",
      givenValue:
        "authored node commits, parameter file, bag dataset, evaluation script, review note and indoor-test limitation",
      givenUnit: null,
      reasoning: [
        "State the team context and identify the claimant's estimator design, implementation and evaluation decisions.",
        "Link commits, configuration, dataset and script to a reproducible comparison against the chosen reference.",
        "Report the verified indoor result and explicitly state that outdoor terrain and long-duration drift were not established."
      ],
      outcome:
        "The claim demonstrates a specific localisation capability without inflating it into ownership of the whole robot.",
      criterion:
        "A reviewer can trace personal work to an artefact and bounded result while seeing what remains unverified.",
      verification:
        "Check version history and rerun the evaluation from the named bag and parameters, then compare the result with the portfolio wording."
    },
    counterexample: {
      scenario:
        "A portfolio says built an autonomous robot and shows a team demonstration screenshot but provides no personal artefact, test or limitation.",
      givenLabel: "Screenshot-only mastery claim",
      givenValue: "team image, broad claim, no contribution trace",
      givenUnit: null,
      reasoning: [
        "The screenshot proves only that a visible demonstration occurred, not who created its subsystems.",
        "No reviewable artefact or test connects the claimant to the autonomy decisions or result.",
        "The broad wording therefore exceeds the available personal evidence."
      ],
      outcome:
        "The screenshot is context evidence but cannot support the stated individual mastery claim.",
      criterion:
        "Personal capability claims require attributable work, reviewable artefacts, verified outcomes and honest limits.",
      verification:
        "Ask the claimant to identify one authored artefact and reproduce its result; the submitted evidence cannot do so."
    },
    misconception: {
      claim:
        "If I worked on the team, I can claim the whole project outcome as my capability.",
      mechanism:
        "Team participation is merged with personal authorship, decision responsibility and verified skill.",
      correction:
        "Credit the team, isolate personal contribution and attach the artefact and result that support the narrower claim.",
      disconfirmingObservation:
        "Several team members can appear in the same screenshot while having entirely different technical contributions."
    },
    assessmentMoves: [
      "ordering project context through contribution, artefact and bounded result",
      "repairing the built-an-autonomous-robot claim after authorship challenge",
      "selecting portfolio claims that match the ROS 2 estimator evidence",
      "diagnosing the screenshot that cannot prove implementation mastery",
      "explaining why team participation does not establish sole capability",
      "matching contribution, artefact, verification and limitation",
      "tracing the localisation claim from commits to reproducible evaluation",
      "auditing the broad autonomy claim against missing personal evidence"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E4-D25-L06",
    lessonTitle: "Capstone integration and release",
    systemModel:
      "Capstone integration closes mechanical, electrical, firmware, software and evidence interfaces into a reproducible baseline with end-to-end release criteria and recovery information.",
    failurePattern:
      "Subsystem demonstrations can pass separately while timing, power, geometry, configuration or ownership fails at the integrated boundary.",
    visualExplanation:
      "An integration map joins multidisciplinary interfaces to configuration identity, end-to-end tests, release gate, known limitations and rollback path.",
    applicationTask:
      "Integrate one capstone behaviour across at least three disciplines, run an end-to-end acceptance test and package the reproducible release evidence.",
    terms: [
      [
        "Integration interface",
        "A controlled boundary where mechanical fit, power, signals, timing, data, behaviour or responsibility crosses between subsystems.",
        "Subsystem compliance does not establish interface compliance unless the joined conditions and ownership are tested."
      ],
      [
        "Reproducible baseline",
        "The identified hardware, firmware, software, parameters, data and instructions needed to rebuild and run the integrated system.",
        "Latest files on one developer machine are not a reproducible baseline without stable identities and setup evidence."
      ],
      [
        "Release gate",
        "A declared decision boundary requiring specified end-to-end evidence, residual risks, limitations and recovery information.",
        "A successful demonstration outside the release configuration or acceptance conditions does not pass the gate."
      ]
    ],
    entities: [
      [
        "input",
        "Multidisciplinary subsystem outputs",
        "The mechanical assembly, power system, firmware, ROS 2 software, parameters and evidence entering integration."
      ],
      [
        "mechanism",
        "Controlled integration baseline",
        "The interface definitions and exact configuration used to join and operate the subsystems."
      ],
      [
        "state",
        "End-to-end behaviour",
        "The complete sensing, decision, actuation and evidence path exercised in one representative mission."
      ],
      [
        "observation",
        "Acceptance and recovery evidence",
        "The end-to-end result, logs, known limitations, rollback and restart instructions."
      ],
      [
        "decision",
        "Capstone release decision",
        "The authorised release or hold disposition for the exact integrated baseline."
      ]
    ],
    relations: [
      [
        "maps",
        "multidisciplinary subsystem outputs map their controlled boundaries into the integration baseline",
        "directed",
        "many-to-one"
      ],
      [
        "routes",
        "the controlled integration baseline routes power, timing, data and behaviour across subsystem interfaces",
        "directed",
        "many-to-many"
      ],
      [
        "causes",
        "joined interface behaviour causes the observed end-to-end capstone result",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "acceptance and recovery evidence supports the capstone release decision",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unresolved interface or unreproducible configuration invalidates the capstone release decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "Every mechanical, electrical, firmware, software, data and ownership interface is identified for one release baseline."
      ],
      [
        "assumption",
        "The end-to-end test uses the candidate release configuration and exercises representative interface timing, load and recovery."
      ],
      [
        "criterion",
        "The baseline can be rebuilt, the representative mission meets its acceptance rule and limitations plus rollback are reviewable."
      ],
      [
        "operating-state",
        "The altered release combines individually passing subsystems but suffers a shared power drop and timestamp mismatch during the full mission."
      ]
    ],
    failure: [
      "Subsystem pass results are treated as proof of integrated behaviour without testing the joined power, timing and data conditions.",
      "The full robot resets under simultaneous actuator load and rejects delayed sensor data although each subsystem passed alone.",
      "Reject release until interface defects are resolved in the controlled baseline and the end-to-end acceptance plus recovery test passes."
    ],
    conceptualSteps: [
      "Identify every cross-discipline interface, owner, range, timing expectation and failure response.",
      "Freeze a candidate baseline covering physical items, firmware, software, parameters, data and setup instructions.",
      "Exercise one representative mission from sensing through decision and actuation under realistic combined load.",
      "Retain logs, acceptance evidence, known limitations and tested rollback or recovery instructions.",
      "Release only the exact reproducible baseline whose integrated evidence meets the gate."
    ],
    example: {
      scenario:
        "A capstone robot must detect an inventory marker, localise, approach it and stop while logging evidence across mechanics, electronics, firmware and ROS 2.",
      givenLabel: "Integrated inventory behaviour",
      givenValue:
        "assembly ID, power design, firmware version, ROS 2 commit, parameters, bag log and acceptance procedure",
      givenUnit: null,
      reasoning: [
        "Define power, timestamp, coordinate, command and ownership interfaces before joining the subsystems.",
        "Run the complete marker-to-stop mission on one identified baseline under representative actuator and compute load.",
        "Retain configuration, logs, acceptance result, known limits and a tested rollback so another engineer can reproduce the release."
      ],
      outcome:
        "The capstone release is an inspectable integrated system rather than a collection of separate demonstrations.",
      criterion:
        "The exact baseline must rebuild and complete the end-to-end acceptance mission with reviewable recovery evidence.",
      verification:
        "Give the manifest and procedure to another engineer, rebuild the system and reproduce the marker-to-stop evidence from a clean state."
    },
    counterexample: {
      scenario:
        "Mechanics, power, firmware and ROS 2 each pass alone, but the combined robot resets under motor load and sensor timestamps fall outside the estimator window.",
      givenLabel: "Subsystem-only evidence",
      givenValue:
        "individual passes, integrated power drop, timestamp mismatch, no rollback package",
      givenUnit: null,
      reasoning: [
        "Individual tests do not reproduce simultaneous power demand or cross-process timing.",
        "The reset and stale timestamps break the end-to-end sensing-to-actuation path at interfaces.",
        "Without a controlled fix, integrated re-test and recovery package, the subsystem evidence cannot support release."
      ],
      outcome:
        "The capstone is not release-ready despite every subsystem having a separate pass result.",
      criterion:
        "Release requires end-to-end evidence at the joined interfaces and a reproducible recovery path.",
      verification:
        "Log supply voltage and timestamps during the full mission; the coincident reset and rejected data expose the interface failures."
    },
    misconception: {
      claim:
        "If every subsystem passes, integration is just connecting them together.",
      mechanism:
        "Power, timing, geometry, configuration and ownership interactions are assumed rather than tested.",
      correction:
        "Control every interface and test representative end-to-end behaviour on the exact release baseline.",
      disconfirmingObservation:
        "All subsystems can pass separately while the combined motor load resets compute and stale timestamps break localisation."
    },
    assessmentMoves: [
      "ordering interface definition, baseline identity and end-to-end evidence",
      "repairing the release after power reset and timestamp rejection",
      "selecting integrated claims supported by the marker-to-stop mission",
      "diagnosing why subsystem passes miss simultaneous load and timing",
      "explaining why connection alone is not multidisciplinary integration",
      "matching interfaces, configuration, mission evidence and rollback",
      "tracing the capstone from sensor marker to controlled stop",
      "auditing the release that lacks integrated recovery evidence"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E4-D25-L07",
    lessonTitle: "Interview demonstrations and professional proof",
    systemModel:
      "An interview demonstration combines a concise technical narrative, defensible artefact or calculation, live diagnostic reasoning and clear separation of fact, assumption and future work.",
    failurePattern:
      "Memorised fluency collapses under challenge when the speaker cannot reproduce reasoning, name evidence limits or diagnose a changed condition.",
    visualExplanation:
      "A demonstration arc moves from problem and personal decision to artefact, verified result, limitation, changed-condition diagnosis and next evidence step.",
    applicationTask:
      "Rehearse a bounded project demonstration, answer one adversarial technical change and retain a corrected explanation that distinguishes verified evidence from assumption.",
    terms: [
      [
        "Technical narrative",
        "A concise causal account of the problem, personal engineering decision, method, result and limitation.",
        "A narrative must not replace technical depth with chronology, slogans or a list of tools."
      ],
      [
        "Diagnostic reasoning",
        "The live process of forming, testing and revising explanations when evidence or operating conditions change.",
        "A plausible first guess is not a diagnosis until it is compared with observations and alternatives."
      ],
      [
        "Epistemic status",
        "The explicit label distinguishing verified fact, supported inference, assumption, unknown and planned future work.",
        "Confidence or familiarity must not turn an assumption or future intention into a verified project result."
      ]
    ],
    entities: [
      [
        "input",
        "Selected project evidence",
        "The bounded project problem, personal contribution, artefact, calculation, result and limitation."
      ],
      [
        "mechanism",
        "Demonstration arc",
        "The problem-to-decision-to-evidence explanation and live artefact or calculation."
      ],
      [
        "state",
        "Changed-condition diagnosis",
        "The hypotheses, checks and revised explanation produced under an adversarial technical change."
      ],
      [
        "observation",
        "Corrected evidence statement",
        "The final separation of fact, inference, assumption, unknown and next verification."
      ],
      [
        "decision",
        "Professional proof claim",
        "The bounded capability claim retained after technical challenge and evidence review."
      ]
    ],
    relations: [
      [
        "maps",
        "selected project evidence maps the personal engineering contribution into the demonstration arc",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the demonstration arc transforms project detail into a concise causal technical explanation",
        "directed",
        "many-to-one"
      ],
      [
        "depends-on",
        "changed-condition diagnosis depends on observations, competing hypotheses and reproducible checks",
        "directed",
        "many-to-many"
      ],
      [
        "supports",
        "the corrected evidence statement supports the professional proof claim",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "memorised assertions or invented certainty invalidates the professional proof claim",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "boundary",
        "The demonstration identifies personal contribution, exact artefact, verified result, configuration and material limitation."
      ],
      [
        "assumption",
        "The artefact or calculation can be inspected and the changed condition supplies observations capable of distinguishing hypotheses."
      ],
      [
        "criterion",
        "The candidate reproduces the reasoning, diagnoses the change and labels fact, inference, assumption, unknown and next evidence honestly."
      ],
      [
        "operating-state",
        "The altered demonstration repeats a memorised 0.12 m result after wheel slip changes but cannot identify dataset, metric or diagnostic check."
      ]
    ],
    failure: [
      "A rehearsed result is treated as universal knowledge instead of evidence from one named configuration and dataset.",
      "When wheel slip changes the observations, the speaker repeats 0.12 m and invents certainty rather than diagnosing assumptions.",
      "Reject the proof claim until reasoning, evidence boundary, changed-condition diagnosis and epistemic status are explicit."
    ],
    conceptualSteps: [
      "Choose one project problem and state the exact personal decision and artefact that matter.",
      "Explain the causal reasoning from method to verified result in a concise technical arc.",
      "Name configuration, metric, reference, uncertainty and a limitation before being challenged.",
      "When a condition changes, form competing hypotheses and identify the next observation that would distinguish them.",
      "Finish by labelling verified fact, inference, assumption, unknown and future verification."
    ],
    example: {
      scenario:
        "A candidate demonstrates a ROS 2 localisation evaluation with 0.12 m absolute trajectory error on one named indoor bag and is asked what changes under wheel slip.",
      givenLabel: "Bounded localisation demonstration",
      givenValue:
        "named bag, estimator configuration, reference trajectory, evaluation script, 0.12 m result and indoor-only limitation",
      givenUnit: null,
      reasoning: [
        "Explain the localisation problem, personal estimator decision, exact dataset, metric and reproducible evaluation artefact.",
        "Label 0.12 m as a verified result for that bag rather than a universal accuracy claim.",
        "Under wheel slip, propose wheel-odometry bias and IMU inconsistency hypotheses, then inspect innovations and reference error before revising the claim."
      ],
      outcome:
        "The candidate demonstrates technical depth, honest evidence boundaries and live diagnostic reasoning.",
      criterion:
        "Professional proof requires reproducible reasoning and correct epistemic labels before and after the changed condition.",
      verification:
        "Rerun the named evaluation, introduce controlled slip or a recorded slip segment and compare innovations, trajectory error and the spoken conclusion."
    },
    counterexample: {
      scenario:
        "The candidate says our SLAM is accurate to 0.12 m everywhere, cannot name the dataset or metric and repeats the number after wheel slip is introduced.",
      givenLabel: "Memorised universal accuracy claim",
      givenValue:
        "0.12 m repeated, no dataset, no metric, no changed-condition diagnosis",
      givenUnit: null,
      reasoning: [
        "The statement removes the configuration and dataset boundary that gave the number meaning.",
        "Repeating the result after wheel slip ignores a changed measurement assumption and competing error mechanisms.",
        "Without reproducible evidence or diagnostic checks, fluency cannot support the professional capability claim."
      ],
      outcome:
        "The answer sounds confident but does not demonstrate verified engineering reasoning.",
      criterion:
        "A defensible demonstration must reproduce evidence, bound the result and update reasoning when conditions change.",
      verification:
        "Ask for the evaluation command, metric definition and first slip diagnostic; the memorised response cannot provide them."
    },
    misconception: {
      claim:
        "A strong interview answer should sound certain and avoid admitting unknowns.",
      mechanism:
        "Performance style is substituted for evidence, so assumptions and guesses are presented as facts.",
      correction:
        "Be precise about what is verified, reason visibly from observations and state the next check for genuine unknowns.",
      disconfirmingObservation:
        "The confident 0.12 m claim becomes indefensible as soon as the interviewer asks which dataset, metric or slip condition produced it."
    },
    assessmentMoves: [
      "ordering project problem, personal decision, evidence and limitation",
      "repairing the universal 0.12 m claim after wheel slip",
      "selecting fact, inference, assumption and next-check statements",
      "diagnosing why repeated accuracy cannot explain changed innovations",
      "explaining why honest unknowns strengthen professional proof",
      "matching narrative, artefact, metric, limitation and diagnosis",
      "tracing the interview arc from named bag to corrected claim",
      "auditing memorised certainty against missing dataset and metric"
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
  [["e1"], ["r5"]]
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

const instructionActions = [
  "Order",
  "Repair",
  "Select",
  "Diagnose",
  "Explain",
  "Match",
  "Trace",
  "Audit"
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
  const action = instructionActions[slot];
  if (move === undefined || action === undefined) {
    throw new Error(`Missing D25 instruction copy ${slot}.`);
  }
  return [
    `${action} the ${first} and ${second} evidence through ${trace} while ${move}:`,
    `${first} supports ${judgement} because ${move} keeps ${second} tied to ${trace}.`,
    `${judgement} is premature when ${move} skips the ${second} boundary or ${trace}.`,
    [
      `Start from the ${first} condition represented in ${trace} before ${move}.`,
      `Use ${trace} to place ${second} correctly during ${move}.`
    ],
    [
      `Connect ${first} and ${second} through ${trace} while completing ${move}.`,
      `Test ${judgement} against ${trace} after ${move}.`
    ]
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
        throw new Error(`Missing D25 relation endpoints ${index}.`);
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
        throw new Error(`Missing D25 condition binding ${index}.`);
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
  const baseOrdering = [
    ["base-map", ["r1"], ["c1"]],
    ["base-build", ["r2"], ["c2"]],
    ["base-evidence", ["r3"], ["c2"]],
    ["base-decide", ["r4"], ["c3"]]
  ] as const;
  const retryOrdering = [
    ["retry-expose", ["r5"], ["c4"]],
    ["retry-remap", ["r1"], ["c1"]],
    ["retry-rebuild", ["r3"], ["c2"]],
    ["retry-decide", ["r4"], ["c3"]]
  ] as const;
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
        "r-boundary",
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
          contextConditionIds: rotate(
            ["c1", "c2", "c3"],
            source.variant % 3
          ),
          steps: baseOrdering,
          correctOrder: baseOrdering.map((step) => step[0])
        },
        retry: {
          instruction: instructionPlan(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: rotate(
            ["c4", "c1", "c2", "c3"],
            source.variant % 4
          ),
          steps: retryOrdering,
          correctOrder: retryOrdering.map((step) => step[0])
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
          [["bounded-note", source.visualExplanation, ["e1", "e2"], ["r1"]]],
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
          [["altered-note", source.failure[1], ["e1", "e5"], ["r5"]]],
          reasonedCase("counter", "verification")
        ]
      ]
    }
  };
};

export const academyLessonTeachingProfileV2PlansE4D25 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE4D25 =
  lessonSources.map((source) => source.lessonId);

export const academyLessonTeachingProfileV2TitlesE4D25 =
  lessonSources.map((source) => source.lessonTitle);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE4D25,
    academyLessonTeachingProfileV2PlansE4D25
  );

export const academyLessonTeachingProfilesV2E4D25 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE4D25.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D25 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E4D25;
