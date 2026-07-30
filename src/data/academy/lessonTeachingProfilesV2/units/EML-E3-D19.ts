import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyLessonTeachingProfileV2Registry
} from "../../lessonTeachingProfileV2";
import {
  academyLessonV2TextRef,
  materialiseAcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2CompactPlan
} from "../../lessonTeachingProfileV2Authoring";
import {
  expandAcademyLessonTeachingProfileV2Seed
} from "../../lessonTeachingProfileV2Validation";

const {
  term,
  relation,
  condition,
  reasonedCase,
  misconception
} = academyLessonV2TextRef;

const compactPlans = [
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L01",
    systemModel:
      "Engineering probability assigns coherent belief to events inside a declared sample space, reference population and information state so uncertain outcomes can support a bounded decision.",
    failurePattern:
      "A probability loses meaning when its event, mutually exclusive alternatives, conditioning information, population, time window or data provenance is omitted or mixed.",
    visualExplanation:
      "A sample-space partition contains robot sensor-packet outcomes, probability mass, observed evidence, a decision boundary and later outcome records for calibration.",
    applicationTask:
      "Define a robot sensor-health sample space, assign traceable event probabilities and challenge a maintenance decision for missing, overlapping or population-mismatched outcomes.",
    terms: [
      [
        "sample-space",
        "Probability sample space",
        "The complete set of mutually distinguishable outcomes considered by an uncertain engineering question.",
        "Changing the outcome set changes the meaning of every probability assigned within it.",
        "declare-outcome-space"
      ],
      [
        "event-probability",
        "Engineering event probability",
        "A dimensionless belief from zero to one assigned to a stated subset of the sample space under declared information.",
        "A bare percentage without event, population, time and information state is not an engineering probability claim.",
        "assign-coherent-mass"
      ],
      [
        "probability-calibration",
        "Probability calibration",
        "Agreement between grouped probability forecasts and observed outcome frequency under the same event definition and population.",
        "Calibration evidence applies only to the tested probability range, population and observation process.",
        "compare-outcome-records"
      ]
    ],
    entities: [
      [
        "outcome-space",
        "state",
        "Sensor-health outcome space",
        "The exhaustive packet-health outcomes considered for one declared robot sensor stream."
      ],
      [
        "event-set",
        "state",
        "Decision-relevant event set",
        "The subset of outcomes representing a stated event such as unusable sensor data."
      ],
      [
        "information-state",
        "input",
        "Declared information state",
        "The evidence, assumptions and knowledge available when probability is assigned."
      ],
      [
        "probability-mass",
        "state",
        "Assigned probability mass",
        "The dimensionless probability allocation across mutually exclusive outcomes."
      ],
      [
        "reference-population",
        "constraint",
        "Robot reference population",
        "The sensor type, operating conditions, fleet scope and time window represented by evidence."
      ],
      [
        "maintenance-decision",
        "decision",
        "Sensor maintenance decision",
        "The bounded inspect, continue or isolate action informed by event probability and consequence."
      ],
      [
        "outcome-record",
        "observation",
        "Observed sensor outcome record",
        "A later labelled outcome with the same event, population and observation definitions."
      ],
      [
        "calibration-check",
        "criterion",
        "Probability calibration check",
        "The comparison of forecast groups with observed event frequencies under matched definitions."
      ]
    ],
    relations: [
      [
        "space-contains-event",
        "supports",
        ["outcome-space"],
        ["event-set"],
        "the sensor-health outcome space contains the decision-relevant event set",
        "directed",
        "one-to-many"
      ],
      [
        "information-constrains-mass",
        "constrains",
        ["information-state", "reference-population"],
        ["probability-mass"],
        "declared information and robot population constrain assigned probability mass",
        "directed",
        "many-to-one"
      ],
      [
        "mass-maps-event",
        "maps",
        ["probability-mass", "event-set"],
        ["maintenance-decision"],
        "probability mass on the event informs the bounded sensor maintenance decision",
        "directed",
        "many-to-one"
      ],
      [
        "population-constrains-record",
        "constrains",
        ["reference-population"],
        ["outcome-record"],
        "the robot reference population constrains which observed outcomes are comparable",
        "directed",
        "one-to-many"
      ],
      [
        "record-compares-forecast",
        "compares",
        ["probability-mass", "outcome-record"],
        ["calibration-check"],
        "matched sensor outcomes and probability forecasts produce a calibration check",
        "directed",
        "many-to-one"
      ],
      [
        "calibration-supports-mass",
        "supports",
        ["calibration-check"],
        ["probability-mass"],
        "matched calibration evidence supports the tested probability assignment",
        "directed",
        "one-to-many"
      ]
    ],
    conditions: [
      [
        "outcomes-exclusive-exhaustive",
        "criterion",
        "The sensor-health outcomes are mutually exclusive and collectively exhaustive for the declared question.",
        ["outcome-space", "event-set", "probability-mass"],
        ["space-contains-event", "information-constrains-mass"]
      ],
      [
        "probability-mass-coherent",
        "boundary",
        "Every assigned probability lies from zero to one and mass across the complete outcome space sums to one.",
        ["outcome-space", "probability-mass"],
        ["information-constrains-mass", "mass-maps-event"]
      ],
      [
        "population-and-window-declared",
        "boundary",
        "The probability claim names the robot population, operating conditions, observation process and time window.",
        [
          "information-state",
          "reference-population",
          "probability-mass",
          "outcome-record"
        ],
        [
          "information-constrains-mass",
          "population-constrains-record",
          "record-compares-forecast"
        ]
      ],
      [
        "decision-loss-declared",
        "criterion",
        "The sensor maintenance decision includes the consequence of false continue, false isolate and delayed inspection.",
        ["event-set", "probability-mass", "maintenance-decision"],
        ["mass-maps-event"]
      ]
    ],
    failureBoundary: [
      "mixed-fleet-denominator",
      "population-and-window-declared",
      "A sensor-fault probability combines indoor packets from one sensor revision with outdoor packets from another revision but reports one fleet-wide value.",
      "The probability changes when records are regrouped by sensor revision and operating condition.",
      "Reject the pooled probability until event definitions, population strata, observation windows and missing outcomes are reconciled.",
      [
        "outcome-space",
        "event-set",
        "information-state",
        "probability-mass",
        "reference-population",
        "outcome-record",
        "calibration-check"
      ],
      [
        "space-contains-event",
        "information-constrains-mass",
        "population-constrains-record",
        "record-compares-forecast",
        "calibration-supports-mass"
      ]
    ],
    conceptualModel: [
      [
        "declare-outcome-space",
        "List mutually exclusive and exhaustive sensor-health outcomes for one robot question.",
        ["outcome-space", "event-set"],
        ["space-contains-event"],
        ["outcomes-exclusive-exhaustive"]
      ],
      [
        "state-information-boundary",
        "Record available evidence, assumptions and the time at which sensor probability is assigned.",
        ["information-state", "probability-mass"],
        ["information-constrains-mass"],
        ["population-and-window-declared"]
      ],
      [
        "bind-reference-population",
        "Define sensor revision, robot operating conditions, observation process and time window.",
        ["reference-population", "information-state", "outcome-record"],
        ["population-constrains-record", "information-constrains-mass"],
        ["population-and-window-declared"]
      ],
      [
        "assign-coherent-mass",
        "Allocate dimensionless probability mass across the complete sensor outcome space.",
        ["outcome-space", "event-set", "probability-mass"],
        ["information-constrains-mass", "mass-maps-event"],
        ["outcomes-exclusive-exhaustive", "probability-mass-coherent"]
      ],
      [
        "connect-decision-loss",
        "Relate event probability to false-continue, false-isolate and delayed-inspection consequences.",
        ["event-set", "probability-mass", "maintenance-decision"],
        ["mass-maps-event"],
        ["decision-loss-declared"]
      ],
      [
        "compare-outcome-records",
        "Group matched forecasts and observed sensor outcomes to check probability calibration.",
        [
          "probability-mass",
          "reference-population",
          "outcome-record",
          "calibration-check"
        ],
        [
          "population-constrains-record",
          "record-compares-forecast",
          "calibration-supports-mass"
        ],
        ["population-and-window-declared"]
      ]
    ],
    reasonedCases: [
      {
        id: "packet-health-example",
        kind: "example",
        scenario:
          "A robot sensor packet is classified as valid, stale, corrupt or missing within one declared sensor revision, operating condition and observation window.",
        changedConditionIds: ["decision-loss-declared"],
        givens: [
          [
            "packet-space",
            "Sensor outcome definition",
            "valid, stale, corrupt and missing outcomes are mutually exclusive and exhaustive",
            null,
            "outcome-space"
          ],
          [
            "fleet-scope",
            "Robot population definition",
            "one sensor revision under a declared operating condition and time window",
            null,
            "reference-population"
          ]
        ],
        reasoningSteps: [
          [
            "example-space",
            "The complete sensor outcome space contains the event of unusable data.",
            ["outcome-space", "event-set"],
            ["space-contains-event"],
            ["outcomes-exclusive-exhaustive"]
          ],
          [
            "example-mass",
            "Evidence from the declared robot population constrains coherent probability mass.",
            ["information-state", "reference-population", "probability-mass"],
            ["information-constrains-mass"],
            ["probability-mass-coherent", "population-and-window-declared"]
          ],
          [
            "example-decision",
            "Probability of unusable data informs inspection only with false-continue and false-isolate consequences.",
            ["event-set", "probability-mass", "maintenance-decision"],
            ["mass-maps-event"],
            ["decision-loss-declared"]
          ],
          [
            "example-calibration",
            "Later matched outcome records support a calibration check for the same event and population.",
            [
              "probability-mass",
              "outcome-record",
              "calibration-check",
              "reference-population"
            ],
            [
              "population-constrains-record",
              "record-compares-forecast",
              "calibration-supports-mass"
            ],
            ["population-and-window-declared"]
          ]
        ],
        outcome:
          "The sensor-health probability has a coherent event, population, information state and decision meaning.",
        criterionConditionId: "probability-mass-coherent",
        criterion:
          "Probability mass must be coherent over the complete outcome space and traceable to one declared population.",
        verification:
          "Reconcile outcome counts, missing records and forecast mass, then compare grouped forecasts with matched later outcomes."
      },
      {
        id: "pooled-population-counterexample",
        kind: "counterexample",
        scenario:
          "One sensor-fault probability pools two hardware revisions and different operating environments without preserving their denominators.",
        changedConditionIds: ["population-and-window-declared"],
        givens: [
          [
            "mixed-revisions",
            "Pooled robot population",
            "sensor revisions and operating conditions are combined",
            null,
            "reference-population"
          ],
          [
            "single-probability",
            "Reported belief",
            "one unusable-data probability is assigned to every robot",
            null,
            "probability-mass"
          ]
        ],
        reasoningSteps: [
          [
            "counter-population",
            "The pooled reference population hides different sensor revisions and conditions.",
            ["reference-population", "information-state"],
            ["information-constrains-mass"],
            ["population-and-window-declared"]
          ],
          [
            "counter-records",
            "Outcome records from the mixed population are not comparable to each robot stratum.",
            ["reference-population", "outcome-record"],
            ["population-constrains-record"],
            ["population-and-window-declared"]
          ],
          [
            "counter-calibration",
            "A pooled calibration check can mask opposite forecast errors across sensor strata.",
            ["probability-mass", "outcome-record", "calibration-check"],
            ["record-compares-forecast"],
            ["population-and-window-declared"]
          ],
          [
            "counter-decision",
            "The pooled probability can route maintenance decisions incorrectly for both sensor revisions.",
            ["probability-mass", "event-set", "maintenance-decision"],
            ["mass-maps-event"],
            ["decision-loss-declared"]
          ]
        ],
        outcome:
          "The reported probability is numerically bounded but lacks a stable robot population and decision interpretation.",
        criterionConditionId: "population-and-window-declared",
        criterion:
          "A probability claim must retain the denominator population, observation window and event definition used to estimate it.",
        verification:
          "Stratify records by sensor revision and operating condition, recompute event frequencies and test whether the pooled assignment remains calibrated."
      }
    ],
    misconception: {
      id: "number-alone-is-probability",
      claim:
        "A percentage is a meaningful engineering probability even when its event and reference population are not stated.",
      mechanism:
        "The same number can refer to different outcome sets, evidence states, populations, windows and decision losses.",
      correction:
        "State the sample space, event, information state, population, time window and decision consequence with every probability.",
      disconfirmingObservation:
        "The pooled sensor percentage changes materially when hardware revisions and operating conditions are separated.",
      entityIds: [
        "outcome-space",
        "event-set",
        "information-state",
        "probability-mass",
        "reference-population",
        "maintenance-decision",
        "outcome-record",
        "calibration-check"
      ],
      relationIds: [
        "space-contains-event",
        "information-constrains-mass",
        "mass-maps-event",
        "population-constrains-record",
        "record-compares-forecast",
        "calibration-supports-mass"
      ],
      conditionIds: [
        "outcomes-exclusive-exhaustive",
        "probability-mass-coherent",
        "population-and-window-declared",
        "decision-loss-declared"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the engineering-probability workflow from sensor outcomes to calibrated decision:",
            "The outcome, population, mass, decision and calibration sequence preserves probability meaning.",
            "The outcome, population, mass, decision and calibration sequence assigns a percentage before defining its event.",
            [
              "Declare the complete sensor outcome space before probability mass.",
              "Bind the robot population before comparing later outcomes."
            ],
            [
              "Assign coherent mass to the decision-relevant event.",
              "Check calibration with matched sensor outcome records."
            ]
          ],
          focusRef: reasonedCase("packet-health-example", "scenario"),
          contextConditionIds: [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "population-and-window-declared",
            "decision-loss-declared"
          ],
          steps: [
            [
              "define-space",
              ["space-contains-event"],
              ["outcomes-exclusive-exhaustive"]
            ],
            [
              "bind-population",
              ["information-constrains-mass"],
              ["population-and-window-declared"]
            ],
            [
              "make-decision",
              ["mass-maps-event"],
              ["decision-loss-declared"]
            ],
            [
              "check-calibration",
              ["record-compares-forecast", "calibration-supports-mass"],
              ["probability-mass-coherent"]
            ]
          ],
          correctOrder: [
            "define-space",
            "bind-population",
            "make-decision",
            "check-calibration"
          ]
        },
        retry: {
          instruction: [
            "Trace the pooled sensor percentage from mixed population to invalid decision:",
            "The population retry separates robot strata before rebuilding probability and calibration.",
            "The population retry renames the event while preserving mixed sensor denominators.",
            [
              "Begin with the pooled reference population.",
              "Separate outcome records by sensor revision and condition."
            ],
            [
              "Rebind information and probability mass to each robot stratum.",
              "Repeat calibration and maintenance-decision checks."
            ]
          ],
          focusRef: reasonedCase("pooled-population-counterexample", "scenario"),
          contextConditionIds: [
            "population-and-window-declared",
            "probability-mass-coherent"
          ],
          steps: [
            [
              "expose-pooling",
              ["information-constrains-mass"],
              ["population-and-window-declared"]
            ],
            [
              "stratify-records",
              ["population-constrains-record"],
              ["population-and-window-declared"]
            ],
            [
              "recheck-forecast",
              ["record-compares-forecast"],
              ["probability-mass-coherent"]
            ],
            [
              "recheck-decision",
              ["mass-maps-event"],
              ["decision-loss-declared"]
            ]
          ],
          correctOrder: [
            "expose-pooling",
            "stratify-records",
            "recheck-forecast",
            "recheck-decision"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a meaningful sensor-health probability:",
            "The selected probability evidence covers outcome space, robot population, coherent mass and decision loss.",
            "The selected probability evidence accepts a percentage without event or denominator.",
            [
              "Choose the complete outcome-space relation.",
              "Choose population and calibration relations."
            ],
            [
              "Select coherent probability mass.",
              "Select the declared robot reference population and decision consequences."
            ]
          ],
          focusRef: term("event-probability", "boundary"),
          contextConditionIds: [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "population-and-window-declared",
            "decision-loss-declared"
          ],
          options: [
            [
              "complete-space",
              true,
              relation("space-contains-event"),
              condition("outcomes-exclusive-exhaustive"),
              ["space-contains-event"],
              ["outcomes-exclusive-exhaustive"],
              null
            ],
            [
              "declared-population",
              true,
              relation("information-constrains-mass"),
              condition("population-and-window-declared"),
              ["information-constrains-mass"],
              ["population-and-window-declared"],
              null
            ],
            [
              "decision-loss",
              true,
              relation("mass-maps-event"),
              condition("decision-loss-declared"),
              ["mass-maps-event"],
              ["decision-loss-declared"],
              null
            ],
            [
              "bare-percentage",
              false,
              misconception("number-alone-is-probability", "claim"),
              misconception("number-alone-is-probability", "mechanism"),
              ["information-constrains-mass"],
              ["population-and-window-declared"],
              "number-alone-is-probability"
            ],
            [
              "pooled-calibration",
              false,
              reasonedCase("pooled-population-counterexample", "outcome"),
              condition("population-and-window-declared"),
              ["record-compares-forecast"],
              ["population-and-window-declared"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the probability records needed to repair the pooled sensor claim:",
            "The diagnostic records connect population strata, outcome records and calibration.",
            "The diagnostic records keep the fleet-wide percentage without preserving sensor revision.",
            [
              "Inspect the robot reference population and observation window.",
              "Retain event definitions when stratifying outcome records."
            ],
            [
              "Mark the population-to-record constraint.",
              "Mark the forecast-to-calibration comparison."
            ]
          ],
          focusRef: reasonedCase("pooled-population-counterexample", "verification"),
          contextConditionIds: [
            "population-and-window-declared",
            "probability-mass-coherent"
          ],
          options: [
            [
              "population-record",
              true,
              relation("population-constrains-record"),
              condition("population-and-window-declared"),
              ["population-constrains-record"],
              ["population-and-window-declared"],
              null
            ],
            [
              "forecast-record",
              true,
              relation("record-compares-forecast"),
              condition("probability-mass-coherent"),
              ["record-compares-forecast"],
              ["probability-mass-coherent"],
              null
            ],
            [
              "calibration-support",
              true,
              relation("calibration-supports-mass"),
              reasonedCase("packet-health-example", "verification"),
              ["calibration-supports-mass"],
              ["population-and-window-declared"],
              null
            ],
            [
              "number-only",
              false,
              misconception("number-alone-is-probability", "claim"),
              misconception("number-alone-is-probability", "mechanism"),
              ["information-constrains-mass"],
              ["population-and-window-declared"],
              "number-alone-is-probability"
            ],
            [
              "mixed-denominator",
              false,
              reasonedCase("pooled-population-counterexample", "outcome"),
              condition("decision-loss-declared"),
              ["mass-maps-event"],
              ["decision-loss-declared"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain what makes a sensor-fault probability an engineering claim:",
            "The explanation connects sample space, event, information, population, calibration and decision loss.",
            "The explanation reports a percentage and omits the robot denominator or event.",
            [
              "Define the complete probability sample space.",
              "State the robot population and observation window."
            ],
            [
              "Explain coherent probability mass for the event set.",
              "Connect calibrated outcomes to the maintenance decision."
            ]
          ],
          focusRef: misconception("number-alone-is-probability", "claim"),
          contextConditionIds: [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "population-and-window-declared",
            "decision-loss-declared"
          ],
          conceptGroups: [
            [
              "space-definition",
              term("sample-space", "label"),
              [
                term("sample-space", "definition"),
                relation("space-contains-event")
              ],
              ["space-contains-event"],
              ["outcomes-exclusive-exhaustive"]
            ],
            [
              "probability-definition",
              term("event-probability", "label"),
              [
                term("event-probability", "definition"),
                relation("information-constrains-mass")
              ],
              ["information-constrains-mass"],
              ["probability-mass-coherent"]
            ],
            [
              "calibration-definition",
              term("probability-calibration", "label"),
              [
                term("probability-calibration", "definition"),
                relation("record-compares-forecast")
              ],
              ["record-compares-forecast"],
              ["population-and-window-declared"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["mass-maps-event"],
          criterionConditionId: "decision-loss-declared"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each probability operation to its engineering boundary:",
            "The outcome, mass and record operations carry completeness, coherence and population boundaries.",
            "A probability operation is paired with a boundary that cannot expose its claim defect.",
            [
              "Pair event containment with exclusive exhaustive outcomes.",
              "Pair mass assignment with coherent probability bounds."
            ],
            [
              "Match outcome records to the declared robot population.",
              "Match maintenance decisions to declared loss."
            ]
          ],
          focusRef: reasonedCase("pooled-population-counterexample", "criterion"),
          contextConditionIds: [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "population-and-window-declared"
          ],
          pairs: [
            [
              "space-pair",
              relation("space-contains-event"),
              condition("outcomes-exclusive-exhaustive"),
              relation("space-contains-event"),
              ["space-contains-event"],
              ["outcomes-exclusive-exhaustive"]
            ],
            [
              "mass-pair",
              relation("information-constrains-mass"),
              condition("probability-mass-coherent"),
              relation("information-constrains-mass"),
              ["information-constrains-mass"],
              ["probability-mass-coherent"]
            ],
            [
              "population-pair",
              relation("population-constrains-record"),
              condition("population-and-window-declared"),
              relation("population-constrains-record"),
              ["population-constrains-record"],
              ["population-and-window-declared"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the probability diagram for the sensor-health decision:",
            "The diagram implication connects complete outcomes and probability mass to a bounded maintenance decision.",
            "The diagram implication routes a bare percentage directly into robot maintenance.",
            [
              "Trace the outcome space into the event set.",
              "Follow probability mass into the sensor maintenance decision."
            ],
            [
              "Identify the event-containment relation.",
              "Choose the implication that retains coherent probability mass."
            ]
          ],
          focusRef: reasonedCase("packet-health-example", "scenario"),
          contextConditionIds: [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "decision-loss-declared"
          ],
          positions: [
            ["outcome-space", 0, 0],
            ["event-set", 1, 0],
            ["information-state", 0, 1],
            ["probability-mass", 1, 1],
            ["maintenance-decision", 2, 0]
          ],
          relationIds: [
            "space-contains-event",
            "mass-maps-event"
          ],
          answerRelationIds: [
            "space-contains-event",
            "mass-maps-event"
          ],
          options: [
            [
              "retain-probability-context",
              true,
              reasonedCase("packet-health-example", "verification"),
              condition("probability-mass-coherent"),
              ["space-contains-event", "mass-maps-event"],
              [
                "outcomes-exclusive-exhaustive",
                "probability-mass-coherent",
                "decision-loss-declared"
              ],
              null
            ],
            [
              "trust-percentage",
              false,
              misconception("number-alone-is-probability", "claim"),
              misconception("number-alone-is-probability", "mechanism"),
              ["mass-maps-event"],
              ["population-and-window-declared"],
              "number-alone-is-probability"
            ],
            [
              "omit-space",
              false,
              reasonedCase("pooled-population-counterexample", "outcome"),
              condition("outcomes-exclusive-exhaustive"),
              ["information-constrains-mass"],
              ["outcomes-exclusive-exhaustive"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the calibration diagram after separating robot populations:",
            "The counterexample implication constrains outcome records before comparing probability forecasts.",
            "The counterexample implication pools sensor outcomes and calls the single probability calibrated.",
            [
              "Start with the declared robot reference population.",
              "Follow matched outcome records into the calibration check."
            ],
            [
              "Identify the population-to-record constraint.",
              "Choose the implication that compares like sensor outcomes."
            ]
          ],
          focusRef: reasonedCase("pooled-population-counterexample", "scenario"),
          contextConditionIds: [
            "population-and-window-declared",
            "probability-mass-coherent"
          ],
          positions: [
            ["reference-population", 0, 0],
            ["outcome-record", 1, 0],
            ["probability-mass", 1, 1],
            ["calibration-check", 2, 0],
            ["maintenance-decision", 2, 1]
          ],
          relationIds: [
            "population-constrains-record",
            "record-compares-forecast",
            "calibration-supports-mass"
          ],
          answerRelationIds: [
            "population-constrains-record",
            "record-compares-forecast"
          ],
          options: [
            [
              "stratify-calibration",
              true,
              reasonedCase("pooled-population-counterexample", "verification"),
              condition("population-and-window-declared"),
              [
                "population-constrains-record",
                "record-compares-forecast"
              ],
              ["population-and-window-declared", "probability-mass-coherent"],
              null
            ],
            [
              "keep-pooled-value",
              false,
              misconception("number-alone-is-probability", "claim"),
              misconception("number-alone-is-probability", "mechanism"),
              ["calibration-supports-mass"],
              ["population-and-window-declared"],
              "number-alone-is-probability"
            ],
            [
              "skip-population",
              false,
              reasonedCase("pooled-population-counterexample", "outcome"),
              condition("decision-loss-declared"),
              ["record-compares-forecast"],
              ["decision-loss-declared"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("event-probability", "label"),
      focusRef: reasonedCase("packet-health-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["outcome-space", 0, 0],
        ["event-set", 1, 0],
        ["information-state", 0, 1],
        ["reference-population", 1, 1],
        ["probability-mass", 2, 0],
        ["maintenance-decision", 3, 0],
        ["outcome-record", 2, 1],
        ["calibration-check", 3, 1]
      ],
      visibleEntityIds: [
        "outcome-space",
        "event-set",
        "information-state",
        "reference-population",
        "probability-mass",
        "maintenance-decision",
        "outcome-record",
        "calibration-check"
      ],
      visibleRelationIds: [
        "space-contains-event",
        "information-constrains-mass",
        "mass-maps-event",
        "population-constrains-record",
        "record-compares-forecast",
        "calibration-supports-mass"
      ],
      controls: [
        [
          "matched-population",
          condition("population-and-window-declared"),
          [
            "outcomes-exclusive-exhaustive",
            "probability-mass-coherent",
            "population-and-window-declared",
            "decision-loss-declared"
          ],
          [
            "outcome-space",
            "event-set",
            "information-state",
            "reference-population",
            "probability-mass",
            "maintenance-decision",
            "outcome-record",
            "calibration-check"
          ],
          [
            "space-contains-event",
            "information-constrains-mass",
            "mass-maps-event",
            "population-constrains-record",
            "record-compares-forecast",
            "calibration-supports-mass"
          ],
          [],
          [],
          [
            [
              "coherent-claim",
              "Matched robot outcomes support a calibrated sensor probability.",
              ["reference-population", "probability-mass", "calibration-check"],
              ["record-compares-forecast", "calibration-supports-mass"]
            ]
          ],
          reasonedCase("packet-health-example", "verification")
        ],
        [
          "pooled-population",
          condition("decision-loss-declared"),
          ["decision-loss-declared"],
          [
            "reference-population",
            "probability-mass",
            "maintenance-decision",
            "outcome-record",
            "calibration-check"
          ],
          [
            "information-constrains-mass",
            "mass-maps-event",
            "record-compares-forecast"
          ],
          ["population-constrains-record", "calibration-supports-mass"],
          [],
          [
            [
              "unstable-claim",
              "Pooled robot records invalidate the sensor probability interpretation.",
              ["reference-population", "probability-mass", "calibration-check"],
              ["record-compares-forecast"]
            ]
          ],
          reasonedCase("pooled-population-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L02",
    systemModel:
      "Bayes rule multiplies each hypothesis prior by the likelihood of observed evidence under that hypothesis, then normalises competing weights into a posterior distribution.",
    failurePattern:
      "Conditional reasoning fails when likelihood is reversed, base rates are ignored, hypotheses are incomplete, evidence is counted twice or posterior mass is not normalised.",
    visualExplanation:
      "A hypothesis table carries prior mass through evidence likelihood into unnormalised weights, a shared evidence normaliser and posterior maintenance choices.",
    applicationTask:
      "Update competing wheel-slip and encoder-fault hypotheses after a robot odometry discrepancy and explain how priors and likelihoods change the diagnostic decision.",
    terms: [
      [
        "bayesian-prior",
        "Bayesian prior",
        "The probability distribution over competing hypotheses before incorporating the current observation.",
        "A prior belongs to a declared operating context and must not be replaced silently by an equal-hypothesis assumption.",
        "declare-hypothesis-priors"
      ],
      [
        "evidence-likelihood",
        "Evidence likelihood",
        "The probability of observing the evidence under a specified hypothesis.",
        "The likelihood of evidence given a fault is not the posterior probability of that fault given the evidence.",
        "evaluate-evidence-model"
      ],
      [
        "bayesian-posterior",
        "Bayesian posterior",
        "The normalised probability distribution over hypotheses after conditioning on the declared evidence.",
        "A posterior is conditional on the model, hypotheses, prior and evidence used in the update.",
        "normalise-posterior-mass"
      ],
      [
        "marginal-evidence",
        "Marginal evidence probability",
        "The sum of prior-weighted likelihoods across the complete competing hypothesis set.",
        "The normaliser is valid only when every candidate uses the same evidence definition and complete hypothesis boundary.",
        "compute-evidence-normaliser"
      ]
    ],
    entities: [
      [
        "fault-hypotheses",
        "state",
        "Competing robot hypotheses",
        "The mutually exclusive and exhaustive candidate causes considered for the odometry discrepancy."
      ],
      [
        "prior-distribution",
        "state",
        "Contextual prior distribution",
        "Prior probability mass over hypotheses for the declared surface, sensor revision and operating mode."
      ],
      [
        "diagnostic-evidence",
        "observation",
        "Observed diagnostic evidence",
        "The time-aligned wheel, inertial and motion discrepancy used once in the Bayesian update."
      ],
      [
        "likelihood-model",
        "mechanism",
        "Hypothesis likelihood model",
        "The probability of the declared evidence under each competing hypothesis."
      ],
      [
        "weighted-hypotheses",
        "state",
        "Prior-weighted likelihoods",
        "The unnormalised product of each prior probability and evidence likelihood."
      ],
      [
        "evidence-normaliser",
        "state",
        "Shared evidence normaliser",
        "The summed prior-weighted likelihood across the complete hypothesis set."
      ],
      [
        "posterior-distribution",
        "state",
        "Diagnostic posterior distribution",
        "Normalised probability mass over robot fault hypotheses after the evidence."
      ],
      [
        "diagnostic-decision",
        "decision",
        "Robot diagnostic decision",
        "The bounded inspect, isolate or continue action informed by posterior and consequence."
      ]
    ],
    relations: [
      [
        "hypotheses-carry-prior",
        "supports",
        ["fault-hypotheses"],
        ["prior-distribution"],
        "the complete robot hypothesis set carries contextual prior probability mass",
        "directed",
        "one-to-one"
      ],
      [
        "evidence-feeds-likelihood",
        "maps",
        ["diagnostic-evidence", "fault-hypotheses"],
        ["likelihood-model"],
        "the declared diagnostic evidence maps to one likelihood under each hypothesis",
        "directed",
        "many-to-one"
      ],
      [
        "prior-times-likelihood",
        "transforms",
        ["prior-distribution", "likelihood-model"],
        ["weighted-hypotheses"],
        "prior probability multiplied by evidence likelihood forms each unnormalised hypothesis weight",
        "directed",
        "many-to-one"
      ],
      [
        "weights-sum-evidence",
        "maps",
        ["weighted-hypotheses"],
        ["evidence-normaliser"],
        "the complete prior-weighted likelihoods sum to the marginal evidence probability",
        "directed",
        "many-to-one"
      ],
      [
        "normaliser-forms-posterior",
        "transforms",
        ["weighted-hypotheses", "evidence-normaliser"],
        ["posterior-distribution"],
        "division by the shared evidence normaliser forms the posterior distribution",
        "directed",
        "many-to-one"
      ],
      [
        "posterior-supports-decision",
        "supports",
        ["posterior-distribution"],
        ["diagnostic-decision"],
        "the diagnostic posterior supports a bounded robot fault decision",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "complete-hypothesis-set",
        "criterion",
        "Competing robot hypotheses are mutually exclusive and exhaustive for the diagnostic question.",
        ["fault-hypotheses", "prior-distribution", "evidence-normaliser"],
        ["hypotheses-carry-prior", "weights-sum-evidence"]
      ],
      [
        "likelihood-direction-preserved",
        "boundary",
        "Each likelihood means probability of the observed evidence conditional on its hypothesis.",
        ["fault-hypotheses", "diagnostic-evidence", "likelihood-model"],
        ["evidence-feeds-likelihood", "prior-times-likelihood"]
      ],
      [
        "single-evidence-use",
        "boundary",
        "The same observation is incorporated once unless a dependence model justifies additional evidence terms.",
        ["diagnostic-evidence", "likelihood-model", "weighted-hypotheses"],
        ["evidence-feeds-likelihood", "prior-times-likelihood"]
      ],
      [
        "posterior-normalised",
        "criterion",
        "The evidence normaliser is positive and posterior probability mass across all hypotheses sums to one.",
        [
          "weighted-hypotheses",
          "evidence-normaliser",
          "posterior-distribution"
        ],
        ["weights-sum-evidence", "normaliser-forms-posterior"]
      ]
    ],
    failureBoundary: [
      "likelihood-inversion",
      "likelihood-direction-preserved",
      "A diagnostic declares encoder fault highly probable because odometry disagreement is common when an encoder is faulty, while ignoring the rarity of encoder faults and alternative wheel slip.",
      "The claimed fault probability changes when contextual priors and competing slip likelihood are included.",
      "Reject the inverted conditional claim and compute prior-weighted likelihoods across the complete hypothesis set.",
      [
        "fault-hypotheses",
        "prior-distribution",
        "diagnostic-evidence",
        "likelihood-model",
        "weighted-hypotheses",
        "evidence-normaliser",
        "posterior-distribution",
        "diagnostic-decision"
      ],
      [
        "hypotheses-carry-prior",
        "evidence-feeds-likelihood",
        "prior-times-likelihood",
        "weights-sum-evidence",
        "normaliser-forms-posterior",
        "posterior-supports-decision"
      ]
    ],
    conceptualModel: [
      [
        "define-competing-hypotheses",
        "Declare mutually exclusive and exhaustive wheel-slip, encoder-fault and nominal hypotheses.",
        ["fault-hypotheses"],
        ["hypotheses-carry-prior"],
        ["complete-hypothesis-set"]
      ],
      [
        "declare-hypothesis-priors",
        "Assign contextual prior mass from the robot surface, sensor revision and operating mode.",
        ["fault-hypotheses", "prior-distribution"],
        ["hypotheses-carry-prior"],
        ["complete-hypothesis-set"]
      ],
      [
        "evaluate-evidence-model",
        "Evaluate the probability of the time-aligned discrepancy under each hypothesis.",
        ["diagnostic-evidence", "fault-hypotheses", "likelihood-model"],
        ["evidence-feeds-likelihood"],
        ["likelihood-direction-preserved", "single-evidence-use"]
      ],
      [
        "form-weighted-hypotheses",
        "Multiply each hypothesis prior by its evidence likelihood without reversing the conditional.",
        ["prior-distribution", "likelihood-model", "weighted-hypotheses"],
        ["prior-times-likelihood"],
        ["likelihood-direction-preserved"]
      ],
      [
        "compute-evidence-normaliser",
        "Sum every prior-weighted likelihood into one positive marginal evidence value.",
        ["weighted-hypotheses", "evidence-normaliser"],
        ["weights-sum-evidence"],
        ["complete-hypothesis-set", "posterior-normalised"]
      ],
      [
        "normalise-posterior-mass",
        "Divide every weighted hypothesis by the shared evidence normaliser and verify total mass.",
        [
          "weighted-hypotheses",
          "evidence-normaliser",
          "posterior-distribution"
        ],
        ["normaliser-forms-posterior"],
        ["posterior-normalised"]
      ],
      [
        "bound-diagnostic-action",
        "Combine posterior probability with fault consequences before selecting a robot diagnostic action.",
        ["posterior-distribution", "diagnostic-decision"],
        ["posterior-supports-decision"],
        ["posterior-normalised"]
      ]
    ],
    reasonedCases: [
      {
        id: "wheel-discrepancy-example",
        kind: "example",
        scenario:
          "Wheel odometry disagrees with inertial motion on a low-traction surface, so wheel slip, encoder fault and nominal operation are updated as competing hypotheses.",
        changedConditionIds: ["single-evidence-use"],
        givens: [
          [
            "surface-context",
            "Robot operating context",
            "low-traction surface and declared encoder revision",
            null,
            "prior-distribution"
          ],
          [
            "motion-disagreement",
            "Diagnostic observation",
            "time-aligned wheel and inertial motion discrepancy",
            "m/s and rad/s",
            "diagnostic-evidence"
          ]
        ],
        reasoningSteps: [
          [
            "example-prior",
            "Surface and sensor context determine prior mass across the complete robot hypotheses.",
            ["fault-hypotheses", "prior-distribution"],
            ["hypotheses-carry-prior"],
            ["complete-hypothesis-set"]
          ],
          [
            "example-likelihood",
            "The same discrepancy is evaluated under slip, encoder-fault and nominal likelihood models.",
            ["fault-hypotheses", "diagnostic-evidence", "likelihood-model"],
            ["evidence-feeds-likelihood"],
            ["likelihood-direction-preserved", "single-evidence-use"]
          ],
          [
            "example-weight",
            "Prior and likelihood produce unnormalised weights whose sum forms marginal evidence.",
            [
              "prior-distribution",
              "likelihood-model",
              "weighted-hypotheses",
              "evidence-normaliser"
            ],
            ["prior-times-likelihood", "weights-sum-evidence"],
            ["posterior-normalised"]
          ],
          [
            "example-posterior",
            "Shared normalisation produces a posterior used for the bounded robot inspection decision.",
            [
              "weighted-hypotheses",
              "evidence-normaliser",
              "posterior-distribution",
              "diagnostic-decision"
            ],
            ["normaliser-forms-posterior", "posterior-supports-decision"],
            ["posterior-normalised"]
          ]
        ],
        outcome:
          "The diagnostic posterior balances contextual fault priors with how each hypothesis predicts the observed discrepancy.",
        criterionConditionId: "posterior-normalised",
        criterion:
          "Every posterior hypothesis uses the same evidence and normaliser, and the complete posterior mass sums to one.",
        verification:
          "Tabulate hypotheses, priors, evidence likelihoods, weighted terms, common normaliser and posterior mass before making the decision."
      },
      {
        id: "base-rate-neglect-counterexample",
        kind: "counterexample",
        scenario:
          "A robot is isolated for presumed encoder fault because disagreement is likely under encoder failure, without including encoder-fault prior or wheel-slip alternatives.",
        changedConditionIds: ["likelihood-direction-preserved"],
        givens: [
          [
            "fault-likelihood",
            "Conditional model",
            "odometry disagreement is plausible when an encoder is faulty",
            null,
            "likelihood-model"
          ],
          [
            "ignored-context",
            "Missing probability state",
            "fault prior and surface-dependent slip hypothesis are omitted",
            null,
            "prior-distribution"
          ]
        ],
        reasoningSteps: [
          [
            "counter-reverse",
            "The evidence likelihood under encoder fault is mistaken for posterior fault probability.",
            ["diagnostic-evidence", "likelihood-model", "posterior-distribution"],
            ["evidence-feeds-likelihood", "normaliser-forms-posterior"],
            ["likelihood-direction-preserved"]
          ],
          [
            "counter-prior",
            "Omitting contextual prior mass removes the base-rate contribution from encoder fault and slip.",
            ["fault-hypotheses", "prior-distribution", "weighted-hypotheses"],
            ["hypotheses-carry-prior", "prior-times-likelihood"],
            ["complete-hypothesis-set"]
          ],
          [
            "counter-normaliser",
            "Omitting alternative hypotheses prevents a valid shared evidence normaliser.",
            [
              "weighted-hypotheses",
              "evidence-normaliser",
              "posterior-distribution"
            ],
            ["weights-sum-evidence", "normaliser-forms-posterior"],
            ["posterior-normalised"]
          ],
          [
            "counter-decision",
            "The unnormalised claim supports an unjustified robot isolation decision.",
            ["posterior-distribution", "diagnostic-decision"],
            ["posterior-supports-decision"],
            ["posterior-normalised"]
          ]
        ],
        outcome:
          "Likelihood inversion and base-rate neglect turn valid conditional evidence into an invalid posterior decision.",
        criterionConditionId: "likelihood-direction-preserved",
        criterion:
          "Probability of evidence under a fault must be combined with fault prior and competing hypotheses before interpreting fault probability.",
        verification:
          "Restore contextual priors and all competing hypotheses, recompute the shared normaliser and compare the corrected posterior decision."
      }
    ],
    misconception: {
      id: "likelihood-equals-posterior",
      claim:
        "If diagnostic evidence is likely when an encoder is faulty, the encoder is probably faulty when that evidence appears.",
      mechanism:
        "This reverses the conditional and ignores prior fault prevalence plus likelihood under competing hypotheses.",
      correction:
        "Multiply every contextual prior by its evidence likelihood, sum the weights and normalise the complete hypothesis set.",
      disconfirmingObservation:
        "The encoder-fault posterior falls when low fault prior and a plausible wheel-slip alternative are included.",
      entityIds: [
        "fault-hypotheses",
        "prior-distribution",
        "diagnostic-evidence",
        "likelihood-model",
        "weighted-hypotheses",
        "evidence-normaliser",
        "posterior-distribution",
        "diagnostic-decision"
      ],
      relationIds: [
        "hypotheses-carry-prior",
        "evidence-feeds-likelihood",
        "prior-times-likelihood",
        "weights-sum-evidence",
        "normaliser-forms-posterior",
        "posterior-supports-decision"
      ],
      conditionIds: [
        "complete-hypothesis-set",
        "likelihood-direction-preserved",
        "single-evidence-use",
        "posterior-normalised"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the Bayesian robot diagnosis from competing hypotheses to posterior decision:",
            "The prior, likelihood, weight, normaliser and posterior sequence preserves conditional direction.",
            "The prior, likelihood, weight, normaliser and posterior sequence reads likelihood directly as fault probability.",
            [
              "Declare contextual priors before evaluating diagnostic evidence.",
              "Sum every weighted robot hypothesis before normalising."
            ],
            [
              "Multiply each prior by its evidence likelihood.",
              "Use the shared normaliser to form the diagnostic posterior."
            ]
          ],
          focusRef: reasonedCase("wheel-discrepancy-example", "scenario"),
          contextConditionIds: [
            "complete-hypothesis-set",
            "likelihood-direction-preserved",
            "single-evidence-use",
            "posterior-normalised"
          ],
          steps: [
            [
              "set-priors",
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"]
            ],
            [
              "evaluate-likelihood",
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"]
            ],
            [
              "form-weights",
              ["prior-times-likelihood"],
              ["single-evidence-use"]
            ],
            [
              "normalise",
              ["weights-sum-evidence", "normaliser-forms-posterior"],
              ["posterior-normalised"]
            ]
          ],
          correctOrder: [
            "set-priors",
            "evaluate-likelihood",
            "form-weights",
            "normalise"
          ]
        },
        retry: {
          instruction: [
            "Trace the base-rate error from reversed likelihood to repaired posterior:",
            "The conditional retry restores priors, alternatives and the shared evidence normaliser.",
            "The conditional retry changes the robot decision threshold without correcting probability direction.",
            [
              "Begin with the evidence likelihood under encoder fault.",
              "Restore wheel-slip and nominal competing hypotheses."
            ],
            [
              "Multiply contextual priors by each likelihood.",
              "Normalise the complete diagnostic posterior before acting."
            ]
          ],
          focusRef: reasonedCase("base-rate-neglect-counterexample", "scenario"),
          contextConditionIds: [
            "likelihood-direction-preserved",
            "complete-hypothesis-set",
            "posterior-normalised"
          ],
          steps: [
            [
              "identify-reversal",
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"]
            ],
            [
              "restore-priors",
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"]
            ],
            [
              "restore-weights",
              ["prior-times-likelihood"],
              ["single-evidence-use"]
            ],
            [
              "restore-posterior",
              ["normaliser-forms-posterior"],
              ["posterior-normalised"]
            ]
          ],
          correctOrder: [
            "identify-reversal",
            "restore-priors",
            "restore-weights",
            "restore-posterior"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a valid Bayesian fault update:",
            "The selected Bayesian evidence covers complete hypotheses, contextual priors, directed likelihood and normalisation.",
            "The selected Bayesian evidence treats a high fault likelihood as the posterior.",
            [
              "Choose the prior-weight relation.",
              "Choose the evidence sum and posterior-normalisation relations."
            ],
            [
              "Select the likelihood in evidence-given-hypothesis direction.",
              "Select complete posterior mass across robot hypotheses."
            ]
          ],
          focusRef: term("bayesian-posterior", "definition"),
          contextConditionIds: [
            "complete-hypothesis-set",
            "likelihood-direction-preserved",
            "posterior-normalised"
          ],
          options: [
            [
              "contextual-prior",
              true,
              relation("hypotheses-carry-prior"),
              condition("complete-hypothesis-set"),
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"],
              null
            ],
            [
              "directed-likelihood",
              true,
              relation("evidence-feeds-likelihood"),
              condition("likelihood-direction-preserved"),
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"],
              null
            ],
            [
              "shared-normaliser",
              true,
              relation("normaliser-forms-posterior"),
              condition("posterior-normalised"),
              ["normaliser-forms-posterior"],
              ["posterior-normalised"],
              null
            ],
            [
              "reverse-conditional",
              false,
              misconception("likelihood-equals-posterior", "claim"),
              misconception("likelihood-equals-posterior", "mechanism"),
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"],
              "likelihood-equals-posterior"
            ],
            [
              "omit-alternatives",
              false,
              reasonedCase("base-rate-neglect-counterexample", "outcome"),
              condition("complete-hypothesis-set"),
              ["weights-sum-evidence"],
              ["complete-hypothesis-set"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the probability records that expose likelihood inversion:",
            "The diagnostic records connect prior mass, evidence likelihood, competing weights and posterior.",
            "The diagnostic records retain only the encoder-fault likelihood and isolation decision.",
            [
              "Inspect the probability direction of each likelihood.",
              "Retain the contextual prior distribution for slip, encoder fault and nominal operation."
            ],
            [
              "Mark the prior-times-likelihood relation.",
              "Mark the common normaliser and posterior mass."
            ]
          ],
          focusRef: reasonedCase("base-rate-neglect-counterexample", "verification"),
          contextConditionIds: [
            "likelihood-direction-preserved",
            "complete-hypothesis-set",
            "posterior-normalised"
          ],
          options: [
            [
              "prior-record",
              true,
              relation("hypotheses-carry-prior"),
              condition("complete-hypothesis-set"),
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"],
              null
            ],
            [
              "weight-record",
              true,
              relation("prior-times-likelihood"),
              condition("likelihood-direction-preserved"),
              ["prior-times-likelihood"],
              ["likelihood-direction-preserved"],
              null
            ],
            [
              "posterior-record",
              true,
              relation("weights-sum-evidence"),
              condition("posterior-normalised"),
              ["weights-sum-evidence"],
              ["posterior-normalised"],
              null
            ],
            [
              "likelihood-only",
              false,
              misconception("likelihood-equals-posterior", "claim"),
              misconception("likelihood-equals-posterior", "mechanism"),
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"],
              "likelihood-equals-posterior"
            ],
            [
              "decision-only",
              false,
              reasonedCase("base-rate-neglect-counterexample", "outcome"),
              condition("posterior-normalised"),
              ["posterior-supports-decision"],
              ["posterior-normalised"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each Bayesian operation to its conditional boundary:",
            "The hypothesis, likelihood and posterior operations carry completeness, direction and normalisation boundaries.",
            "A Bayesian operation is paired with a boundary that cannot expose its probability error.",
            [
              "Pair prior assignment with the complete robot hypothesis set.",
              "Pair evidence modelling with likelihood direction."
            ],
            [
              "Match posterior formation to shared normalisation.",
              "Match the observed diagnostic evidence to its single-use boundary."
            ]
          ],
          focusRef: reasonedCase("wheel-discrepancy-example", "criterion"),
          contextConditionIds: [
            "complete-hypothesis-set",
            "likelihood-direction-preserved",
            "posterior-normalised"
          ],
          pairs: [
            [
              "prior-pair",
              relation("hypotheses-carry-prior"),
              condition("complete-hypothesis-set"),
              relation("hypotheses-carry-prior"),
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"]
            ],
            [
              "likelihood-pair",
              relation("evidence-feeds-likelihood"),
              condition("likelihood-direction-preserved"),
              relation("evidence-feeds-likelihood"),
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"]
            ],
            [
              "posterior-pair",
              relation("normaliser-forms-posterior"),
              condition("posterior-normalised"),
              relation("normaliser-forms-posterior"),
              ["normaliser-forms-posterior"],
              ["posterior-normalised"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why evidence likelihood is not encoder-fault posterior probability:",
            "The explanation connects prior, competing likelihoods, marginal evidence and posterior mass.",
            "The explanation repeats a high fault likelihood and omits robot base rates.",
            [
              "Define evidence likelihood in the correct conditional direction.",
              "Define the contextual Bayesian prior."
            ],
            [
              "Explain how weighted hypotheses form marginal evidence.",
              "Normalise the complete posterior before the diagnostic decision."
            ]
          ],
          focusRef: misconception("likelihood-equals-posterior", "claim"),
          contextConditionIds: [
            "likelihood-direction-preserved",
            "complete-hypothesis-set",
            "posterior-normalised"
          ],
          conceptGroups: [
            [
              "prior-definition",
              term("bayesian-prior", "label"),
              [
                term("bayesian-prior", "definition"),
                relation("hypotheses-carry-prior")
              ],
              ["hypotheses-carry-prior"],
              ["complete-hypothesis-set"]
            ],
            [
              "likelihood-definition",
              term("evidence-likelihood", "label"),
              [
                term("evidence-likelihood", "definition"),
                relation("evidence-feeds-likelihood")
              ],
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"]
            ],
            [
              "posterior-definition",
              term("bayesian-posterior", "label"),
              [
                term("bayesian-posterior", "definition"),
                relation("normaliser-forms-posterior")
              ],
              ["normaliser-forms-posterior"],
              ["posterior-normalised"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["prior-times-likelihood"],
          criterionConditionId: "posterior-normalised"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the Bayes diagram from contextual prior to posterior diagnosis:",
            "The diagram implication combines prior and likelihood before shared normalisation.",
            "The diagram implication routes evidence likelihood directly into robot fault posterior.",
            [
              "Trace prior and likelihood into weighted hypotheses.",
              "Follow the shared evidence normaliser into posterior mass."
            ],
            [
              "Identify the prior-times-likelihood relation.",
              "Choose the implication that normalises every hypothesis."
            ]
          ],
          focusRef: reasonedCase("wheel-discrepancy-example", "scenario"),
          contextConditionIds: [
            "likelihood-direction-preserved",
            "posterior-normalised"
          ],
          positions: [
            ["prior-distribution", 0, 0],
            ["likelihood-model", 0, 1],
            ["weighted-hypotheses", 1, 0],
            ["evidence-normaliser", 1, 1],
            ["posterior-distribution", 2, 0]
          ],
          relationIds: [
            "prior-times-likelihood",
            "weights-sum-evidence",
            "normaliser-forms-posterior"
          ],
          answerRelationIds: [
            "prior-times-likelihood",
            "normaliser-forms-posterior"
          ],
          options: [
            [
              "normalise-weighted-hypotheses",
              true,
              reasonedCase("wheel-discrepancy-example", "verification"),
              condition("posterior-normalised"),
              ["prior-times-likelihood", "normaliser-forms-posterior"],
              ["likelihood-direction-preserved", "posterior-normalised"],
              null
            ],
            [
              "invert-likelihood",
              false,
              misconception("likelihood-equals-posterior", "claim"),
              misconception("likelihood-equals-posterior", "mechanism"),
              ["normaliser-forms-posterior"],
              ["likelihood-direction-preserved"],
              "likelihood-equals-posterior"
            ],
            [
              "skip-prior",
              false,
              reasonedCase("base-rate-neglect-counterexample", "outcome"),
              condition("complete-hypothesis-set"),
              ["weights-sum-evidence"],
              ["complete-hypothesis-set"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the conditional diagram after restoring competing hypotheses:",
            "The counterexample implication links complete hypothesis priors and evidence to one diagnostic posterior.",
            "The counterexample implication preserves the encoder likelihood as the final robot decision.",
            [
              "Start with complete robot fault hypotheses and contextual prior.",
              "Route diagnostic evidence into each likelihood model."
            ],
            [
              "Identify the hypothesis-prior relation.",
              "Choose the implication that forms a bounded posterior decision."
            ]
          ],
          focusRef: reasonedCase("base-rate-neglect-counterexample", "scenario"),
          contextConditionIds: [
            "complete-hypothesis-set",
            "likelihood-direction-preserved"
          ],
          positions: [
            ["fault-hypotheses", 0, 0],
            ["prior-distribution", 1, 0],
            ["diagnostic-evidence", 0, 1],
            ["likelihood-model", 1, 1],
            ["weighted-hypotheses", 2, 0]
          ],
          relationIds: [
            "hypotheses-carry-prior",
            "evidence-feeds-likelihood",
            "prior-times-likelihood"
          ],
          answerRelationIds: [
            "hypotheses-carry-prior",
            "prior-times-likelihood"
          ],
          options: [
            [
              "restore-base-rates",
              true,
              reasonedCase("base-rate-neglect-counterexample", "verification"),
              condition("complete-hypothesis-set"),
              ["hypotheses-carry-prior", "prior-times-likelihood"],
              ["complete-hypothesis-set", "likelihood-direction-preserved"],
              null
            ],
            [
              "retain-inversion",
              false,
              misconception("likelihood-equals-posterior", "claim"),
              misconception("likelihood-equals-posterior", "mechanism"),
              ["evidence-feeds-likelihood"],
              ["likelihood-direction-preserved"],
              "likelihood-equals-posterior"
            ],
            [
              "omit-prior",
              false,
              reasonedCase("base-rate-neglect-counterexample", "outcome"),
              condition("posterior-normalised"),
              ["prior-times-likelihood"],
              ["posterior-normalised"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("bayesian-posterior", "label"),
      focusRef: reasonedCase("wheel-discrepancy-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["fault-hypotheses", 0, 0],
        ["prior-distribution", 1, 0],
        ["diagnostic-evidence", 0, 1],
        ["likelihood-model", 1, 1],
        ["weighted-hypotheses", 2, 0],
        ["evidence-normaliser", 2, 1],
        ["posterior-distribution", 3, 0],
        ["diagnostic-decision", 4, 0]
      ],
      visibleEntityIds: [
        "fault-hypotheses",
        "prior-distribution",
        "diagnostic-evidence",
        "likelihood-model",
        "weighted-hypotheses",
        "evidence-normaliser",
        "posterior-distribution",
        "diagnostic-decision"
      ],
      visibleRelationIds: [
        "hypotheses-carry-prior",
        "evidence-feeds-likelihood",
        "prior-times-likelihood",
        "weights-sum-evidence",
        "normaliser-forms-posterior",
        "posterior-supports-decision"
      ],
      controls: [
        [
          "complete-update",
          condition("posterior-normalised"),
          [
            "complete-hypothesis-set",
            "likelihood-direction-preserved",
            "single-evidence-use",
            "posterior-normalised"
          ],
          [
            "fault-hypotheses",
            "prior-distribution",
            "diagnostic-evidence",
            "likelihood-model",
            "weighted-hypotheses",
            "evidence-normaliser",
            "posterior-distribution",
            "diagnostic-decision"
          ],
          [
            "hypotheses-carry-prior",
            "evidence-feeds-likelihood",
            "prior-times-likelihood",
            "weights-sum-evidence",
            "normaliser-forms-posterior",
            "posterior-supports-decision"
          ],
          [],
          [],
          [
            [
              "normalised-diagnosis",
              "Complete priors and likelihoods form a normalised robot diagnosis.",
              [
                "prior-distribution",
                "likelihood-model",
                "posterior-distribution"
              ],
              ["prior-times-likelihood", "normaliser-forms-posterior"]
            ]
          ],
          reasonedCase("wheel-discrepancy-example", "verification")
        ],
        [
          "reversed-conditional",
          condition("likelihood-direction-preserved"),
          ["likelihood-direction-preserved"],
          [
            "diagnostic-evidence",
            "likelihood-model",
            "posterior-distribution",
            "diagnostic-decision"
          ],
          [
            "evidence-feeds-likelihood",
            "normaliser-forms-posterior",
            "posterior-supports-decision"
          ],
          ["hypotheses-carry-prior", "weights-sum-evidence"],
          [],
          [
            [
              "invalid-posterior",
              "Likelihood inversion produces an unsupported encoder-fault decision.",
              ["likelihood-model", "posterior-distribution", "diagnostic-decision"],
              ["posterior-supports-decision"]
            ]
          ],
          reasonedCase("base-rate-neglect-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L03",
    systemModel:
      "Uncertainty propagation transforms a state mean and covariance through a declared model, using Jacobians or sampling to preserve units, coupling and added process noise.",
    failurePattern:
      "An estimate can look precise but be wrong when bias is treated as zero-mean noise, covariance order or frame changes, correlations are discarded or a nonlinear transform is linearised too far away.",
    visualExplanation:
      "A two-dimensional sensor-frame uncertainty ellipse is transformed through a rotation Jacobian into the robot base frame, with process noise and an empirical sample check.",
    applicationTask:
      "Propagate a correlated planar sensor position and covariance into the robot base frame, add model uncertainty and challenge the result for units, ordering and positive-semidefinite structure.",
    terms: [
      [
        "random-noise",
        "Random measurement noise",
        "Unpredictable measurement variation described by a declared distribution, time behaviour and operating condition.",
        "A persistent bias or scale error is a systematic state or parameter, not zero-mean random noise.",
        "separate-noise-and-bias"
      ],
      [
        "state-covariance",
        "State covariance",
        "The matrix of state-variable variances and pairwise covariances in declared units, order and frame.",
        "Covariance diagonal terms alone do not preserve correlated uncertainty orientation.",
        "declare-covariance-contract"
      ],
      [
        "uncertainty-propagation",
        "Uncertainty propagation",
        "The transformation of input uncertainty through a model into output uncertainty under stated linearity and dependence assumptions.",
        "A first-order Jacobian approximation may fail for strong nonlinearity or broad uncertainty.",
        "propagate-state-uncertainty"
      ]
    ],
    entities: [
      [
        "sensor-state",
        "state",
        "Sensor-frame state mean",
        "The estimated planar position ordered and expressed in the named sensor frame."
      ],
      [
        "input-covariance",
        "state",
        "Sensor-frame covariance",
        "The correlated position covariance with explicit state order and squared SI units."
      ],
      [
        "systematic-bias",
        "state",
        "Sensor bias state",
        "A persistent offset or scale term modelled separately from random measurement noise."
      ],
      [
        "transform-jacobian",
        "mechanism",
        "State transform Jacobian",
        "The local derivative of the sensor-to-base mapping in the declared state order."
      ],
      [
        "process-covariance",
        "input",
        "Added model covariance",
        "Uncertainty from transform, timing or process effects expressed in compatible output units."
      ],
      [
        "base-state",
        "state",
        "Base-frame state mean",
        "The transformed position estimate in the robot base frame."
      ],
      [
        "output-covariance",
        "state",
        "Base-frame covariance",
        "The propagated correlated uncertainty in the base-state order and frame."
      ],
      [
        "sample-check",
        "criterion",
        "Empirical propagation check",
        "A deterministic sample or Monte Carlo comparison against the predicted mean and covariance."
      ]
    ],
    relations: [
      [
        "bias-constrains-state",
        "constrains",
        ["systematic-bias"],
        ["sensor-state"],
        "the separately modelled sensor bias constrains the corrected input state",
        "directed",
        "one-to-one"
      ],
      [
        "transform-maps-mean",
        "transforms",
        ["sensor-state", "transform-jacobian"],
        ["base-state"],
        "the declared sensor-to-base model transforms the state mean",
        "directed",
        "many-to-one"
      ],
      [
        "jacobian-maps-covariance",
        "transforms",
        ["input-covariance", "transform-jacobian"],
        ["output-covariance"],
        "the Jacobian maps correlated sensor covariance into the base frame",
        "directed",
        "many-to-one"
      ],
      [
        "process-adds-uncertainty",
        "causes",
        ["process-covariance"],
        ["output-covariance"],
        "compatible model covariance adds uncertainty to the propagated output",
        "directed",
        "one-to-one"
      ],
      [
        "samples-compare-mean",
        "compares",
        ["sensor-state", "base-state"],
        ["sample-check"],
        "transformed state samples compare empirical and predicted output mean",
        "directed",
        "many-to-one"
      ],
      [
        "samples-compare-covariance",
        "compares",
        ["input-covariance", "output-covariance"],
        ["sample-check"],
        "transformed uncertainty samples compare empirical and predicted covariance",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "state-order-frame-units",
        "boundary",
        "Every mean, Jacobian and covariance declares matching state order, coordinate frame and SI units.",
        [
          "sensor-state",
          "input-covariance",
          "transform-jacobian",
          "base-state",
          "output-covariance"
        ],
        [
          "transform-maps-mean",
          "jacobian-maps-covariance",
          "samples-compare-mean",
          "samples-compare-covariance"
        ]
      ],
      [
        "valid-covariance-structure",
        "criterion",
        "Input, process and output covariance matrices are symmetric and positive semidefinite within numerical tolerance.",
        ["input-covariance", "process-covariance", "output-covariance"],
        ["jacobian-maps-covariance", "process-adds-uncertainty"]
      ],
      [
        "dependence-explicit",
        "boundary",
        "Independence assumptions and any cross-covariance between state, transform and process terms are explicit.",
        [
          "input-covariance",
          "transform-jacobian",
          "process-covariance",
          "output-covariance"
        ],
        ["jacobian-maps-covariance", "process-adds-uncertainty"]
      ],
      [
        "local-linearity-checked",
        "criterion",
        "The first-order Jacobian approximation is checked across the uncertainty region or replaced by sampling.",
        [
          "sensor-state",
          "input-covariance",
          "transform-jacobian",
          "base-state",
          "output-covariance",
          "sample-check"
        ],
        [
          "transform-maps-mean",
          "jacobian-maps-covariance",
          "samples-compare-mean",
          "samples-compare-covariance"
        ]
      ]
    ],
    failureBoundary: [
      "diagonal-only-rotation",
      "dependence-explicit",
      "A correlated sensor-position covariance is rotated into the base frame by transforming only its diagonal standard deviations.",
      "The resulting axis-aligned output uncertainty disagrees with transformed samples and loses the physical ellipse orientation.",
      "Reject the propagation and apply the full covariance transformation with state order, frame and correlations intact.",
      [
        "sensor-state",
        "input-covariance",
        "transform-jacobian",
        "base-state",
        "output-covariance",
        "sample-check"
      ],
      [
        "transform-maps-mean",
        "jacobian-maps-covariance",
        "samples-compare-mean",
        "samples-compare-covariance"
      ]
    ],
    conceptualModel: [
      [
        "separate-noise-and-bias",
        "Model persistent sensor bias separately from zero-mean random measurement noise.",
        ["systematic-bias", "sensor-state", "input-covariance"],
        ["bias-constrains-state"],
        ["state-order-frame-units"]
      ],
      [
        "declare-covariance-contract",
        "Declare covariance state order, coordinate frame, squared SI units and correlation terms.",
        ["sensor-state", "input-covariance"],
        ["jacobian-maps-covariance"],
        [
          "state-order-frame-units",
          "valid-covariance-structure",
          "dependence-explicit"
        ]
      ],
      [
        "derive-transform-jacobian",
        "Derive the sensor-to-base Jacobian in the exact input and output state order.",
        ["sensor-state", "transform-jacobian", "base-state"],
        ["transform-maps-mean", "jacobian-maps-covariance"],
        ["state-order-frame-units"]
      ],
      [
        "propagate-state-uncertainty",
        "Transform the full correlated covariance and add compatible model covariance.",
        [
          "input-covariance",
          "transform-jacobian",
          "process-covariance",
          "output-covariance"
        ],
        ["jacobian-maps-covariance", "process-adds-uncertainty"],
        ["valid-covariance-structure", "dependence-explicit"]
      ],
      [
        "validate-covariance-output",
        "Check output covariance symmetry, positive-semidefinite structure, units and frame.",
        ["output-covariance", "base-state"],
        ["samples-compare-covariance"],
        ["state-order-frame-units", "valid-covariance-structure"]
      ],
      [
        "check-sampled-propagation",
        "Transform bounded samples and compare empirical mean and covariance with the first-order prediction.",
        [
          "sensor-state",
          "input-covariance",
          "base-state",
          "output-covariance",
          "sample-check"
        ],
        ["samples-compare-mean", "samples-compare-covariance"],
        ["local-linearity-checked"]
      ]
    ],
    reasonedCases: [
      {
        id: "rotated-position-example",
        kind: "example",
        scenario:
          "A correlated planar landmark estimate in a sensor frame is rotated into the robot base frame with full covariance and added transform uncertainty.",
        changedConditionIds: ["local-linearity-checked"],
        givens: [
          [
            "sensor-estimate",
            "Planar state",
            "position mean and correlated covariance in sensor-frame x-y order",
            "m and m squared",
            "input-covariance"
          ],
          [
            "frame-map",
            "Rigid transform model",
            "declared sensor-to-base rotation and translation",
            "m and rad",
            "transform-jacobian"
          ]
        ],
        reasoningSteps: [
          [
            "example-contract",
            "The mean, covariance and Jacobian use declared x-y order, frames and SI units.",
            ["sensor-state", "input-covariance", "transform-jacobian"],
            ["transform-maps-mean", "jacobian-maps-covariance"],
            ["state-order-frame-units"]
          ],
          [
            "example-transform",
            "The rigid mapping transforms the mean and the full correlated covariance.",
            [
              "sensor-state",
              "input-covariance",
              "transform-jacobian",
              "base-state",
              "output-covariance"
            ],
            ["transform-maps-mean", "jacobian-maps-covariance"],
            ["dependence-explicit"]
          ],
          [
            "example-process",
            "Compatible transform covariance adds to the base-frame uncertainty.",
            ["process-covariance", "output-covariance"],
            ["process-adds-uncertainty"],
            ["valid-covariance-structure"]
          ],
          [
            "example-check",
            "Transformed samples agree with predicted base mean and covariance within the checked local region.",
            [
              "sensor-state",
              "input-covariance",
              "base-state",
              "output-covariance",
              "sample-check"
            ],
            ["samples-compare-mean", "samples-compare-covariance"],
            ["local-linearity-checked"]
          ]
        ],
        outcome:
          "The base-frame estimate preserves correlation orientation, units and added transform uncertainty.",
        criterionConditionId: "valid-covariance-structure",
        criterion:
          "Propagated covariance must retain full coupling, use compatible units and remain symmetric positive semidefinite.",
        verification:
          "Compute the full matrix propagation independently, inspect eigenvalues and compare with transformed sample statistics."
      },
      {
        id: "diagonal-propagation-counterexample",
        kind: "counterexample",
        scenario:
          "A correlated sensor covariance is reduced to two standard deviations, rotated as scalars and rebuilt as a diagonal base-frame covariance.",
        changedConditionIds: ["dependence-explicit"],
        givens: [
          [
            "discarded-correlation",
            "Uncertainty simplification",
            "off-diagonal sensor covariance is removed before rotation",
            "m squared",
            "input-covariance"
          ],
          [
            "axis-aligned-output",
            "Reported base uncertainty",
            "diagonal covariance aligned with base axes",
            "m squared",
            "output-covariance"
          ]
        ],
        reasoningSteps: [
          [
            "counter-discard",
            "Removing off-diagonal covariance destroys the sensor uncertainty orientation.",
            ["input-covariance", "transform-jacobian"],
            ["jacobian-maps-covariance"],
            ["dependence-explicit"]
          ],
          [
            "counter-transform",
            "Scalar standard deviations cannot reproduce the full Jacobian covariance transformation.",
            ["input-covariance", "transform-jacobian", "output-covariance"],
            ["jacobian-maps-covariance"],
            ["state-order-frame-units"]
          ],
          [
            "counter-samples",
            "Transformed samples retain a tilted ellipse that the diagonal output cannot represent.",
            ["input-covariance", "output-covariance", "sample-check"],
            ["samples-compare-covariance"],
            ["local-linearity-checked"]
          ],
          [
            "counter-reject",
            "The empirical covariance disagreement invalidates the diagonal-only propagation.",
            [
              "sensor-state",
              "base-state",
              "output-covariance",
              "sample-check"
            ],
            ["samples-compare-mean", "samples-compare-covariance"],
            ["dependence-explicit"]
          ]
        ],
        outcome:
          "The diagonal output understates or misorients base-frame uncertainty despite plausible marginal standard deviations.",
        criterionConditionId: "dependence-explicit",
        criterion:
          "Correlation may be removed only with a justified dependence model and evidence that the decision is unaffected.",
        verification:
          "Restore the full input covariance, propagate it with the Jacobian and compare both outputs against transformed samples."
      }
    ],
    misconception: {
      id: "covariance-is-standard-deviations",
      claim:
        "A covariance matrix is only a list of independent standard deviations, so off-diagonal terms can be ignored.",
      mechanism:
        "Off-diagonal covariance encodes coupling and rotates the uncertainty ellipse under coordinate transformations.",
      correction:
        "Preserve the full covariance with declared state order, frame, units and cross-dependence through propagation.",
      disconfirmingObservation:
        "Transformed samples form a tilted ellipse while the diagonal-only prediction remains axis aligned.",
      entityIds: [
        "sensor-state",
        "input-covariance",
        "systematic-bias",
        "transform-jacobian",
        "process-covariance",
        "base-state",
        "output-covariance",
        "sample-check"
      ],
      relationIds: [
        "bias-constrains-state",
        "transform-maps-mean",
        "jacobian-maps-covariance",
        "process-adds-uncertainty",
        "samples-compare-mean",
        "samples-compare-covariance"
      ],
      conditionIds: [
        "state-order-frame-units",
        "valid-covariance-structure",
        "dependence-explicit",
        "local-linearity-checked"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the covariance propagation from sensor contract to empirical check:",
            "The order, Jacobian, full covariance, process-noise and sample sequence preserves uncertainty structure.",
            "The order, Jacobian, full covariance, process-noise and sample sequence rotates standard deviations independently.",
            [
              "Declare sensor-state order and frame before deriving the Jacobian.",
              "Add compatible model covariance after transforming input covariance."
            ],
            [
              "Transform the mean and full correlated covariance.",
              "Compare predicted base uncertainty with transformed samples."
            ]
          ],
          focusRef: reasonedCase("rotated-position-example", "scenario"),
          contextConditionIds: [
            "state-order-frame-units",
            "valid-covariance-structure",
            "dependence-explicit",
            "local-linearity-checked"
          ],
          steps: [
            [
              "declare-contract",
              ["bias-constrains-state"],
              ["state-order-frame-units"]
            ],
            [
              "transform-mean",
              ["transform-maps-mean"],
              ["state-order-frame-units"]
            ],
            [
              "transform-covariance",
              ["jacobian-maps-covariance", "process-adds-uncertainty"],
              ["dependence-explicit"]
            ],
            [
              "compare-samples",
              ["samples-compare-mean", "samples-compare-covariance"],
              ["local-linearity-checked"]
            ]
          ],
          correctOrder: [
            "declare-contract",
            "transform-mean",
            "transform-covariance",
            "compare-samples"
          ]
        },
        retry: {
          instruction: [
            "Trace the diagonal-only state covariance error from discarded correlation to failed sample check:",
            "The covariance retry restores coupling before reapplying the sensor-to-base Jacobian.",
            "The covariance retry inflates diagonal variances while preserving the wrong uncertainty orientation.",
            [
              "Begin with the discarded off-diagonal covariance.",
              "Compare the tilted empirical ellipse with the axis-aligned prediction."
            ],
            [
              "Restore the full sensor covariance matrix.",
              "Recompute base covariance and repeat the sample comparison."
            ]
          ],
          focusRef: reasonedCase("diagonal-propagation-counterexample", "scenario"),
          contextConditionIds: [
            "dependence-explicit",
            "valid-covariance-structure"
          ],
          steps: [
            [
              "expose-correlation",
              ["jacobian-maps-covariance"],
              ["dependence-explicit"]
            ],
            [
              "inspect-output",
              ["samples-compare-covariance"],
              ["local-linearity-checked"]
            ],
            [
              "restore-full-matrix",
              ["process-adds-uncertainty"],
              ["valid-covariance-structure"]
            ],
            [
              "repeat-check",
              ["samples-compare-mean", "samples-compare-covariance"],
              ["state-order-frame-units"]
            ]
          ],
          correctOrder: [
            "expose-correlation",
            "inspect-output",
            "restore-full-matrix",
            "repeat-check"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for valid covariance propagation:",
            "The selected uncertainty evidence covers state contract, full matrix transform, process covariance and sample check.",
            "The selected uncertainty evidence keeps only marginal standard deviations.",
            [
              "Choose the Jacobian covariance relation.",
              "Choose the covariance-structure and sample-comparison evidence."
            ],
            [
              "Select declared state order, frame and units.",
              "Select full sensor-frame covariance dependence and the empirical propagation check."
            ]
          ],
          focusRef: term("uncertainty-propagation", "definition"),
          contextConditionIds: [
            "state-order-frame-units",
            "valid-covariance-structure",
            "dependence-explicit",
            "local-linearity-checked"
          ],
          options: [
            [
              "full-jacobian-map",
              true,
              relation("jacobian-maps-covariance"),
              condition("dependence-explicit"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"],
              null
            ],
            [
              "valid-structure",
              true,
              relation("process-adds-uncertainty"),
              condition("valid-covariance-structure"),
              ["process-adds-uncertainty"],
              ["valid-covariance-structure"],
              null
            ],
            [
              "empirical-check",
              true,
              relation("samples-compare-covariance"),
              condition("local-linearity-checked"),
              ["samples-compare-covariance"],
              ["local-linearity-checked"],
              null
            ],
            [
              "diagonal-only",
              false,
              misconception("covariance-is-standard-deviations", "claim"),
              misconception("covariance-is-standard-deviations", "mechanism"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"],
              "covariance-is-standard-deviations"
            ],
            [
              "ignore-units",
              false,
              reasonedCase("diagonal-propagation-counterexample", "outcome"),
              condition("state-order-frame-units"),
              ["samples-compare-covariance"],
              ["state-order-frame-units"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the uncertainty records that expose lost correlation:",
            "The diagnostic records connect input covariance, Jacobian, output covariance and transformed samples.",
            "The diagnostic records compare only sensor and base standard deviations.",
            [
              "Inspect off-diagonal sensor covariance.",
              "Retain state order and frame in the sample check."
            ],
            [
              "Mark the full covariance transformation.",
              "Mark the empirical covariance comparison."
            ]
          ],
          focusRef: reasonedCase("diagonal-propagation-counterexample", "verification"),
          contextConditionIds: [
            "dependence-explicit",
            "state-order-frame-units",
            "local-linearity-checked"
          ],
          options: [
            [
              "input-coupling",
              true,
              relation("jacobian-maps-covariance"),
              condition("dependence-explicit"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"],
              null
            ],
            [
              "output-structure",
              true,
              condition("valid-covariance-structure"),
              relation("process-adds-uncertainty"),
              ["process-adds-uncertainty"],
              ["valid-covariance-structure"],
              null
            ],
            [
              "sample-statistics",
              true,
              relation("samples-compare-covariance"),
              reasonedCase("diagonal-propagation-counterexample", "verification"),
              ["samples-compare-covariance"],
              ["local-linearity-checked"],
              null
            ],
            [
              "standard-deviation-list",
              false,
              misconception("covariance-is-standard-deviations", "claim"),
              misconception("covariance-is-standard-deviations", "mechanism"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"],
              "covariance-is-standard-deviations"
            ],
            [
              "bias-as-noise",
              false,
              term("random-noise", "boundary"),
              reasonedCase("diagonal-propagation-counterexample", "outcome"),
              ["bias-constrains-state"],
              ["state-order-frame-units"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain why covariance is more than independent standard deviations:",
            "The explanation connects matrix coupling, coordinate frame, Jacobian propagation and empirical ellipse.",
            "The explanation reports diagonal uncertainty and omits covariance orientation.",
            [
              "Define state covariance with units and order.",
              "Distinguish random measurement noise from systematic bias."
            ],
            [
              "Explain the full Jacobian covariance map.",
              "Use the empirical propagation check to test the transformed base-frame covariance."
            ]
          ],
          focusRef: misconception("covariance-is-standard-deviations", "claim"),
          contextConditionIds: [
            "state-order-frame-units",
            "dependence-explicit",
            "local-linearity-checked"
          ],
          conceptGroups: [
            [
              "noise-definition",
              term("random-noise", "label"),
              [
                term("random-noise", "definition"),
                relation("bias-constrains-state")
              ],
              ["bias-constrains-state"],
              ["state-order-frame-units"]
            ],
            [
              "covariance-definition",
              term("state-covariance", "label"),
              [
                term("state-covariance", "definition"),
                relation("jacobian-maps-covariance")
              ],
              ["jacobian-maps-covariance"],
              ["dependence-explicit"]
            ],
            [
              "propagation-definition",
              term("uncertainty-propagation", "label"),
              [
                term("uncertainty-propagation", "definition"),
                relation("samples-compare-covariance")
              ],
              ["samples-compare-covariance"],
              ["local-linearity-checked"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["process-adds-uncertainty"],
          criterionConditionId: "valid-covariance-structure"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each uncertainty operation to its covariance boundary:",
            "The mean, matrix and sampling operations carry state-contract, dependence and linearity boundaries.",
            "An uncertainty operation is paired with a boundary that cannot expose its propagation error.",
            [
              "Pair mean transformation with declared state order and frame.",
              "Pair covariance mapping with explicit dependence."
            ],
            [
              "Match process addition to valid covariance structure.",
              "Match the empirical propagation check to the base-frame covariance."
            ]
          ],
          focusRef: reasonedCase("diagonal-propagation-counterexample", "criterion"),
          contextConditionIds: [
            "state-order-frame-units",
            "dependence-explicit",
            "local-linearity-checked"
          ],
          pairs: [
            [
              "mean-pair",
              relation("transform-maps-mean"),
              condition("state-order-frame-units"),
              relation("transform-maps-mean"),
              ["transform-maps-mean"],
              ["state-order-frame-units"]
            ],
            [
              "covariance-pair",
              relation("jacobian-maps-covariance"),
              condition("dependence-explicit"),
              relation("jacobian-maps-covariance"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"]
            ],
            [
              "sample-pair",
              relation("samples-compare-covariance"),
              condition("local-linearity-checked"),
              relation("samples-compare-covariance"),
              ["samples-compare-covariance"],
              ["local-linearity-checked"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the covariance propagation diagram for the sensor-to-base transform:",
            "The diagram implication uses the full Jacobian map and compatible model covariance.",
            "The diagram implication rotates only diagonal sensor standard deviations.",
            [
              "Trace sensor covariance through the transform Jacobian.",
              "Follow added model covariance into base-frame covariance."
            ],
            [
              "Identify the full covariance mapping.",
              "Choose the implication that retains the sensor-frame and base-frame covariance structure."
            ]
          ],
          focusRef: reasonedCase("rotated-position-example", "scenario"),
          contextConditionIds: [
            "state-order-frame-units",
            "valid-covariance-structure",
            "dependence-explicit"
          ],
          positions: [
            ["input-covariance", 0, 0],
            ["transform-jacobian", 1, 0],
            ["process-covariance", 1, 1],
            ["output-covariance", 2, 0],
            ["sample-check", 3, 0]
          ],
          relationIds: [
            "jacobian-maps-covariance",
            "process-adds-uncertainty",
            "samples-compare-covariance"
          ],
          answerRelationIds: [
            "jacobian-maps-covariance",
            "process-adds-uncertainty"
          ],
          options: [
            [
              "retain-full-covariance",
              true,
              reasonedCase("rotated-position-example", "verification"),
              condition("valid-covariance-structure"),
              ["jacobian-maps-covariance", "process-adds-uncertainty"],
              [
                "state-order-frame-units",
                "valid-covariance-structure",
                "dependence-explicit"
              ],
              null
            ],
            [
              "keep-diagonal",
              false,
              misconception("covariance-is-standard-deviations", "claim"),
              misconception("covariance-is-standard-deviations", "mechanism"),
              ["jacobian-maps-covariance"],
              ["dependence-explicit"],
              "covariance-is-standard-deviations"
            ],
            [
              "omit-model-noise",
              false,
              reasonedCase("diagonal-propagation-counterexample", "outcome"),
              condition("valid-covariance-structure"),
              ["process-adds-uncertainty"],
              ["valid-covariance-structure"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the empirical propagation check diagram after restoring correlation:",
            "The counterexample implication compares predicted base mean and covariance with transformed samples.",
            "The counterexample implication accepts axis-aligned covariance despite the tilted sample ellipse.",
            [
              "Start with sensor and base state means.",
              "Compare both covariance matrices through one empirical check."
            ],
            [
              "Identify the transformed-mean comparison.",
              "Choose the implication that tests output covariance."
            ]
          ],
          focusRef: reasonedCase("diagonal-propagation-counterexample", "scenario"),
          contextConditionIds: [
            "dependence-explicit",
            "local-linearity-checked"
          ],
          positions: [
            ["sensor-state", 0, 0],
            ["base-state", 1, 0],
            ["input-covariance", 0, 1],
            ["output-covariance", 1, 1],
            ["sample-check", 2, 0]
          ],
          relationIds: [
            "samples-compare-mean",
            "samples-compare-covariance"
          ],
          answerRelationIds: [
            "samples-compare-mean",
            "samples-compare-covariance"
          ],
          options: [
            [
              "compare-full-samples",
              true,
              reasonedCase("diagonal-propagation-counterexample", "verification"),
              condition("local-linearity-checked"),
              ["samples-compare-mean", "samples-compare-covariance"],
              ["dependence-explicit", "local-linearity-checked"],
              null
            ],
            [
              "trust-marginals",
              false,
              misconception("covariance-is-standard-deviations", "claim"),
              misconception("covariance-is-standard-deviations", "mechanism"),
              ["samples-compare-covariance"],
              ["dependence-explicit"],
              "covariance-is-standard-deviations"
            ],
            [
              "skip-samples",
              false,
              reasonedCase("diagonal-propagation-counterexample", "outcome"),
              condition("local-linearity-checked"),
              ["samples-compare-mean"],
              ["local-linearity-checked"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("state-covariance", "label"),
      focusRef: reasonedCase("rotated-position-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["systematic-bias", 0, 1],
        ["sensor-state", 0, 0],
        ["input-covariance", 1, 1],
        ["transform-jacobian", 1, 0],
        ["process-covariance", 2, 1],
        ["base-state", 2, 0],
        ["output-covariance", 3, 1],
        ["sample-check", 3, 0]
      ],
      visibleEntityIds: [
        "systematic-bias",
        "sensor-state",
        "input-covariance",
        "transform-jacobian",
        "process-covariance",
        "base-state",
        "output-covariance",
        "sample-check"
      ],
      visibleRelationIds: [
        "bias-constrains-state",
        "transform-maps-mean",
        "jacobian-maps-covariance",
        "process-adds-uncertainty",
        "samples-compare-mean",
        "samples-compare-covariance"
      ],
      controls: [
        [
          "full-covariance",
          condition("dependence-explicit"),
          [
            "state-order-frame-units",
            "valid-covariance-structure",
            "dependence-explicit",
            "local-linearity-checked"
          ],
          [
            "sensor-state",
            "input-covariance",
            "transform-jacobian",
            "process-covariance",
            "base-state",
            "output-covariance",
            "sample-check"
          ],
          [
            "transform-maps-mean",
            "jacobian-maps-covariance",
            "process-adds-uncertainty",
            "samples-compare-mean",
            "samples-compare-covariance"
          ],
          [],
          [],
          [
            [
              "correlated-output",
              "Full covariance preserves the rotated robot uncertainty ellipse.",
              ["input-covariance", "output-covariance", "sample-check"],
              ["jacobian-maps-covariance", "samples-compare-covariance"]
            ]
          ],
          reasonedCase("rotated-position-example", "verification")
        ],
        [
          "diagonal-only",
          condition("local-linearity-checked"),
          ["local-linearity-checked"],
          [
            "input-covariance",
            "transform-jacobian",
            "output-covariance",
            "sample-check"
          ],
          [
            "jacobian-maps-covariance",
            "samples-compare-covariance"
          ],
          ["process-adds-uncertainty"],
          [],
          [
            [
              "misoriented-output",
              "Diagonal-only propagation disagrees with the sampled covariance ellipse.",
              ["output-covariance", "sample-check"],
              ["samples-compare-covariance"]
            ]
          ],
          reasonedCase("diagonal-propagation-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L04",
    systemModel:
      "Complementary fusion combines sensors according to their trusted frequency regions, while weighted fusion combines aligned estimates using explicit uncertainty and dependence assumptions.",
    failurePattern:
      "Fusion can become overconfident or biased when sensors are averaged without frame and time alignment, shared errors are counted twice or a reference sensor is trusted outside its valid dynamics.",
    visualExplanation:
      "A robot tilt estimator routes gyroscope integration through a high-frequency path and accelerometer gravity through a low-frequency path, then compares fused orientation with reference motion.",
    applicationTask:
      "Design and challenge a complementary tilt filter, justify its sensor trust across frequency and acceleration conditions and compare it with uncertainty-weighted fusion.",
    terms: [
      [
        "complementary-filter",
        "Complementary sensor filter",
        "A fusion structure whose sensor paths cover complementary frequency content and combine into one estimate.",
        "Complementary transfer paths require a declared sample period, crossover and valid sensor assumptions.",
        "partition-frequency-trust"
      ],
      [
        "fusion-weight",
        "Sensor fusion weight",
        "A dimensionless contribution assigned to an aligned estimate from uncertainty, validity and dependence evidence.",
        "Weights that sum to one do not by themselves prove independence or correct uncertainty.",
        "derive-fusion-weights"
      ],
      [
        "common-mode-error",
        "Common-mode sensor error",
        "A correlated error source that affects several sensor estimates in a related direction.",
        "Treating correlated estimates as independent double-counts evidence and understates fused uncertainty.",
        "model-shared-error"
      ]
    ],
    entities: [
      [
        "gyro-orientation",
        "state",
        "Integrated gyroscope orientation",
        "The orientation estimate obtained by integrating angular rate on a declared seconds-based clock."
      ],
      [
        "gravity-orientation",
        "state",
        "Accelerometer gravity orientation",
        "The tilt estimate inferred when measured specific force is dominated by gravity."
      ],
      [
        "frequency-split",
        "mechanism",
        "Complementary frequency split",
        "The high-pass and low-pass trust paths with a declared crossover and discrete implementation."
      ],
      [
        "validity-state",
        "observation",
        "Sensor validity state",
        "Evidence about acceleration, vibration, saturation, bias and timing that changes sensor trust."
      ],
      [
        "weight-model",
        "mechanism",
        "Fusion weight model",
        "The uncertainty and correlation logic that assigns sensor contributions."
      ],
      [
        "fused-orientation",
        "state",
        "Fused robot orientation",
        "The time-aligned orientation estimate in the declared robot frame."
      ],
      [
        "reference-orientation",
        "observation",
        "Independent orientation reference",
        "A held-out or higher-trust reference used only to evaluate the fused result."
      ],
      [
        "fusion-residual",
        "criterion",
        "Orientation fusion residual",
        "The time-aligned angular difference between fused and reference orientation."
      ]
    ],
    relations: [
      [
        "gyro-feeds-high-frequency",
        "routes",
        ["gyro-orientation", "frequency-split"],
        ["fused-orientation"],
        "the complementary high-frequency path routes rapid gyroscope orientation changes into the fused estimate",
        "directed",
        "many-to-one"
      ],
      [
        "gravity-feeds-low-frequency",
        "routes",
        ["gravity-orientation", "frequency-split"],
        ["fused-orientation"],
        "the complementary low-frequency path routes long-term gravity orientation into the fused estimate",
        "directed",
        "many-to-one"
      ],
      [
        "validity-constrains-gravity",
        "constrains",
        ["validity-state"],
        ["gravity-orientation"],
        "specific-force validity constrains trust in accelerometer-derived gravity orientation",
        "directed",
        "one-to-one"
      ],
      [
        "validity-constrains-weights",
        "constrains",
        ["validity-state"],
        ["weight-model"],
        "sensor validity and shared-error evidence constrain fusion weights",
        "directed",
        "one-to-one"
      ],
      [
        "weights-map-estimates",
        "maps",
        ["gyro-orientation", "gravity-orientation", "weight-model"],
        ["fused-orientation"],
        "the weight model maps aligned sensor estimates into fused orientation",
        "directed",
        "many-to-one"
      ],
      [
        "fusion-compares-reference",
        "compares",
        ["fused-orientation", "reference-orientation"],
        ["fusion-residual"],
        "fused and reference orientation produce a time-aligned angular residual",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "aligned-fusion-state",
        "boundary",
        "All sensor estimates use the same orientation convention, robot frame and latency-corrected sample time.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "fused-orientation",
          "reference-orientation"
        ],
        [
          "gyro-feeds-high-frequency",
          "gravity-feeds-low-frequency",
          "weights-map-estimates",
          "fusion-compares-reference"
        ]
      ],
      [
        "complementary-paths-sum",
        "criterion",
        "High-frequency and low-frequency paths form a declared complementary pair over the implemented sample rate.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "frequency-split",
          "fused-orientation"
        ],
        ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"]
      ],
      [
        "specific-force-validity",
        "boundary",
        "Accelerometer tilt is trusted only when non-gravitational specific force and vibration remain inside declared bounds.",
        ["gravity-orientation", "validity-state", "weight-model"],
        ["validity-constrains-gravity", "validity-constrains-weights"]
      ],
      [
        "dependence-aware-weights",
        "criterion",
        "Fusion weights follow declared uncertainty and cross-correlation rather than sensor count alone.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "validity-state",
          "weight-model",
          "fused-orientation"
        ],
        ["validity-constrains-weights", "weights-map-estimates"]
      ]
    ],
    failureBoundary: [
      "accelerating-gravity-reference",
      "specific-force-validity",
      "A mobile robot accelerates while the complementary filter interprets total accelerometer specific force as gravity and gives the low-frequency path unchanged trust.",
      "The fused tilt follows longitudinal acceleration and the orientation residual grows despite stable gyroscope dynamics.",
      "Reject the gravity update or reduce its trust until specific-force validity returns inside the declared boundary.",
      [
        "gyro-orientation",
        "gravity-orientation",
        "frequency-split",
        "validity-state",
        "weight-model",
        "fused-orientation",
        "reference-orientation",
        "fusion-residual"
      ],
      [
        "gyro-feeds-high-frequency",
        "gravity-feeds-low-frequency",
        "validity-constrains-gravity",
        "validity-constrains-weights",
        "weights-map-estimates",
        "fusion-compares-reference"
      ]
    ],
    conceptualModel: [
      [
        "align-sensor-estimates",
        "Express gyroscope, gravity and reference orientation in one convention, frame and sample time.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "reference-orientation"
        ],
        ["fusion-compares-reference"],
        ["aligned-fusion-state"]
      ],
      [
        "partition-frequency-trust",
        "Assign rapid orientation changes to the gyroscope path and long-term drift correction to the gravity path.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "frequency-split",
          "fused-orientation"
        ],
        ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
        ["complementary-paths-sum"]
      ],
      [
        "test-specific-force",
        "Detect acceleration, vibration and saturation before trusting accelerometer gravity orientation.",
        ["gravity-orientation", "validity-state"],
        ["validity-constrains-gravity"],
        ["specific-force-validity"]
      ],
      [
        "model-shared-error",
        "Identify clock, mounting, calibration and environmental errors shared by sensor estimates.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "validity-state",
          "weight-model"
        ],
        ["validity-constrains-weights"],
        ["dependence-aware-weights"]
      ],
      [
        "derive-fusion-weights",
        "Derive sensor weights from uncertainty, validity and dependence while preserving one fused orientation.",
        [
          "gyro-orientation",
          "gravity-orientation",
          "validity-state",
          "weight-model",
          "fused-orientation"
        ],
        ["validity-constrains-weights", "weights-map-estimates"],
        ["dependence-aware-weights"]
      ],
      [
        "evaluate-fusion-residual",
        "Compare time-aligned fused and reference orientation across static, turning and accelerating motion.",
        ["fused-orientation", "reference-orientation", "fusion-residual"],
        ["fusion-compares-reference"],
        ["aligned-fusion-state", "specific-force-validity"]
      ]
    ],
    reasonedCases: [
      {
        id: "bounded-tilt-fusion-example",
        kind: "example",
        scenario:
          "A robot tilt estimator uses integrated gyroscope orientation for rapid changes and valid accelerometer gravity orientation for long-term correction.",
        changedConditionIds: ["complementary-paths-sum"],
        givens: [
          [
            "gyro-state",
            "Angular-rate integration",
            "orientation integrated on a declared sample period",
            "rad and s",
            "gyro-orientation"
          ],
          [
            "gravity-state",
            "Specific-force tilt",
            "accelerometer orientation used only inside validity bounds",
            "rad",
            "gravity-orientation"
          ]
        ],
        reasoningSteps: [
          [
            "example-align",
            "Gyroscope and gravity orientation share robot frame, convention and sample time.",
            ["gyro-orientation", "gravity-orientation", "fused-orientation"],
            ["weights-map-estimates"],
            ["aligned-fusion-state"]
          ],
          [
            "example-split",
            "Complementary paths route rapid gyro motion and slow gravity correction without a frequency gap.",
            [
              "gyro-orientation",
              "gravity-orientation",
              "frequency-split",
              "fused-orientation"
            ],
            ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
            ["complementary-paths-sum"]
          ],
          [
            "example-validity",
            "Specific-force evidence constrains gravity orientation during robot acceleration.",
            ["validity-state", "gravity-orientation", "weight-model"],
            ["validity-constrains-gravity", "validity-constrains-weights"],
            ["specific-force-validity"]
          ],
          [
            "example-residual",
            "The fused orientation retains bounded residual across static and dynamic segments.",
            ["fused-orientation", "reference-orientation", "fusion-residual"],
            ["fusion-compares-reference"],
            ["aligned-fusion-state"]
          ]
        ],
        outcome:
          "The complementary filter uses each sensor only in its justified frequency and validity region.",
        criterionConditionId: "complementary-paths-sum",
        criterion:
          "Complementary paths must cover the implemented bandwidth while sensor validity can reduce unsafe trust.",
        verification:
          "Plot each path, validity state, fused orientation and independent residual against one sample clock."
      },
      {
        id: "acceleration-corruption-counterexample",
        kind: "counterexample",
        scenario:
          "During sustained mobile acceleration, the filter treats longitudinal specific force as a gravity tilt and retains the normal accelerometer weight.",
        changedConditionIds: ["specific-force-validity"],
        givens: [
          [
            "accelerating-segment",
            "Robot dynamics",
            "specific force includes gravity plus sustained translation",
            "m/s squared",
            "validity-state"
          ],
          [
            "unchanged-weight",
            "Fusion state",
            "gravity orientation keeps its nominal low-frequency contribution",
            null,
            "weight-model"
          ]
        ],
        reasoningSteps: [
          [
            "counter-gravity",
            "Accelerometer-derived orientation no longer represents gravity alone.",
            ["validity-state", "gravity-orientation"],
            ["validity-constrains-gravity"],
            ["specific-force-validity"]
          ],
          [
            "counter-weight",
            "The unchanged weight model routes corrupted gravity orientation into the fused state.",
            ["validity-state", "weight-model", "gravity-orientation", "fused-orientation"],
            ["validity-constrains-weights", "weights-map-estimates"],
            ["dependence-aware-weights"]
          ],
          [
            "counter-split",
            "Complementary frequency separation cannot correct an invalid low-frequency reference.",
            ["gravity-orientation", "frequency-split", "fused-orientation"],
            ["gravity-feeds-low-frequency"],
            ["complementary-paths-sum", "specific-force-validity"]
          ],
          [
            "counter-residual",
            "The fused tilt residual grows during acceleration and recovers when specific force becomes valid.",
            ["fused-orientation", "reference-orientation", "fusion-residual"],
            ["fusion-compares-reference"],
            ["aligned-fusion-state", "specific-force-validity"]
          ]
        ],
        outcome:
          "A nominal complementary filter produces biased tilt when its gravity-reference validity boundary is violated.",
        criterionConditionId: "specific-force-validity",
        criterion:
          "Accelerometer tilt contribution must respond to non-gravitational specific force and vibration evidence.",
        verification:
          "Segment the residual by acceleration validity state, suppress or reduce gravity trust and confirm the tilt corruption changes predictably."
      }
    ],
    misconception: {
      id: "simple-average-improves-estimate",
      claim:
        "Adding another sensor and averaging the estimates always improves the fused result.",
      mechanism:
        "A sensor may be invalid, biased or correlated with existing estimates, so equal averaging can add error and create false confidence.",
      correction:
        "Align states, model validity and cross-correlation, then derive frequency or uncertainty-based contributions.",
      disconfirmingObservation:
        "Equal accelerometer trust during robot acceleration increases tilt residual compared with the valid gyroscope path.",
      entityIds: [
        "gyro-orientation",
        "gravity-orientation",
        "frequency-split",
        "validity-state",
        "weight-model",
        "fused-orientation",
        "reference-orientation",
        "fusion-residual"
      ],
      relationIds: [
        "gyro-feeds-high-frequency",
        "gravity-feeds-low-frequency",
        "validity-constrains-gravity",
        "validity-constrains-weights",
        "weights-map-estimates",
        "fusion-compares-reference"
      ],
      conditionIds: [
        "aligned-fusion-state",
        "complementary-paths-sum",
        "specific-force-validity",
        "dependence-aware-weights"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the complementary tilt workflow from aligned sensors to residual evaluation:",
            "The alignment, frequency split, validity, weighting and residual sequence preserves sensor trust.",
            "The alignment, frequency split, validity, weighting and residual sequence averages sensors before checking acceleration.",
            [
              "Align gyroscope and gravity orientation before the frequency split.",
              "Check specific-force validity before applying the gravity contribution."
            ],
            [
              "Route rapid and slow orientation content through complementary paths.",
              "Compare fused robot orientation with the independent reference."
            ]
          ],
          focusRef: reasonedCase("bounded-tilt-fusion-example", "scenario"),
          contextConditionIds: [
            "aligned-fusion-state",
            "complementary-paths-sum",
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          steps: [
            [
              "align-estimates",
              ["weights-map-estimates"],
              ["aligned-fusion-state"]
            ],
            [
              "split-frequency",
              ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
              ["complementary-paths-sum"]
            ],
            [
              "gate-validity",
              ["validity-constrains-gravity", "validity-constrains-weights"],
              ["specific-force-validity"]
            ],
            [
              "check-residual",
              ["fusion-compares-reference"],
              ["dependence-aware-weights"]
            ]
          ],
          correctOrder: [
            "align-estimates",
            "split-frequency",
            "gate-validity",
            "check-residual"
          ]
        },
        retry: {
          instruction: [
            "Trace the acceleration-corrupted tilt from invalid gravity to repaired fusion weight:",
            "The validity retry identifies specific force, reduces gravity trust and rechecks orientation residual.",
            "The validity retry changes complementary crossover while treating acceleration as gravity.",
            [
              "Begin with the sensor validity state during acceleration.",
              "Follow the unchanged gravity weight into fused orientation."
            ],
            [
              "Constrain accelerometer gravity orientation with specific-force evidence.",
              "Recompute weight model and compare the fusion residual."
            ]
          ],
          focusRef: reasonedCase("acceleration-corruption-counterexample", "scenario"),
          contextConditionIds: [
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          steps: [
            [
              "detect-specific-force",
              ["validity-constrains-gravity"],
              ["specific-force-validity"]
            ],
            [
              "adjust-weight",
              ["validity-constrains-weights"],
              ["dependence-aware-weights"]
            ],
            [
              "reform-fusion",
              ["weights-map-estimates"],
              ["aligned-fusion-state"]
            ],
            [
              "recheck-residual",
              ["fusion-compares-reference"],
              ["specific-force-validity"]
            ]
          ],
          correctOrder: [
            "detect-specific-force",
            "adjust-weight",
            "reform-fusion",
            "recheck-residual"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for defensible complementary sensor fusion:",
            "The selected fusion evidence covers alignment, complementary paths, sensor validity and dependence-aware weights.",
            "The selected fusion evidence accepts equal averaging because two sensors are present.",
            [
              "Choose the high-frequency and low-frequency path relations.",
              "Choose validity and residual relations."
            ],
            [
              "Select one frame and sample time for orientation estimates.",
              "Select uncertainty and common-mode evidence for sensor weights."
            ]
          ],
          focusRef: term("complementary-filter", "definition"),
          contextConditionIds: [
            "aligned-fusion-state",
            "complementary-paths-sum",
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          options: [
            [
              "complementary-paths",
              true,
              relation("gyro-feeds-high-frequency"),
              condition("complementary-paths-sum"),
              ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
              ["complementary-paths-sum"],
              null
            ],
            [
              "validity-gate",
              true,
              relation("validity-constrains-gravity"),
              condition("specific-force-validity"),
              ["validity-constrains-gravity"],
              ["specific-force-validity"],
              null
            ],
            [
              "dependence-weight",
              true,
              relation("validity-constrains-weights"),
              condition("dependence-aware-weights"),
              ["validity-constrains-weights"],
              ["dependence-aware-weights"],
              null
            ],
            [
              "simple-average",
              false,
              misconception("simple-average-improves-estimate", "claim"),
              misconception("simple-average-improves-estimate", "mechanism"),
              ["weights-map-estimates"],
              ["dependence-aware-weights"],
              "simple-average-improves-estimate"
            ],
            [
              "invalid-gravity",
              false,
              reasonedCase("acceleration-corruption-counterexample", "outcome"),
              condition("specific-force-validity"),
              ["gravity-feeds-low-frequency"],
              ["specific-force-validity"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the fusion records that expose acceleration-corrupted tilt:",
            "The diagnostic records connect specific-force validity, gravity weight and orientation residual.",
            "The diagnostic records blame gyroscope integration without inspecting accelerometer validity.",
            [
              "Inspect the sensor validity state during acceleration.",
              "Retain each orientation path and weight contribution."
            ],
            [
              "Mark the validity-to-weight constraint.",
              "Mark the fused-to-reference residual comparison."
            ]
          ],
          focusRef: reasonedCase("acceleration-corruption-counterexample", "verification"),
          contextConditionIds: [
            "specific-force-validity",
            "dependence-aware-weights",
            "aligned-fusion-state"
          ],
          options: [
            [
              "specific-force-record",
              true,
              relation("validity-constrains-gravity"),
              condition("specific-force-validity"),
              ["validity-constrains-gravity"],
              ["specific-force-validity"],
              null
            ],
            [
              "weight-record",
              true,
              relation("validity-constrains-weights"),
              condition("dependence-aware-weights"),
              ["validity-constrains-weights"],
              ["dependence-aware-weights"],
              null
            ],
            [
              "residual-record",
              true,
              relation("fusion-compares-reference"),
              reasonedCase("acceleration-corruption-counterexample", "verification"),
              ["fusion-compares-reference"],
              ["aligned-fusion-state"],
              null
            ],
            [
              "more-sensors-proof",
              false,
              misconception("simple-average-improves-estimate", "claim"),
              misconception("simple-average-improves-estimate", "mechanism"),
              ["weights-map-estimates"],
              ["dependence-aware-weights"],
              "simple-average-improves-estimate"
            ],
            [
              "crossover-only",
              false,
              reasonedCase("acceleration-corruption-counterexample", "outcome"),
              condition("complementary-paths-sum"),
              ["gravity-feeds-low-frequency"],
              ["complementary-paths-sum"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each fusion operation to its sensor boundary:",
            "The alignment, path and weight operations carry frame, complement and dependence boundaries.",
            "A fusion operation is paired with a boundary that cannot expose its sensor failure.",
            [
              "Pair orientation combination with aligned state.",
              "Pair high and low paths with complementary coverage."
            ],
            [
              "Match gravity trust to specific-force validity.",
              "Match weight mapping to dependence-aware evidence."
            ]
          ],
          focusRef: reasonedCase("bounded-tilt-fusion-example", "criterion"),
          contextConditionIds: [
            "aligned-fusion-state",
            "complementary-paths-sum",
            "specific-force-validity"
          ],
          pairs: [
            [
              "alignment-pair",
              relation("weights-map-estimates"),
              condition("aligned-fusion-state"),
              relation("weights-map-estimates"),
              ["weights-map-estimates"],
              ["aligned-fusion-state"]
            ],
            [
              "complement-pair",
              relation("gyro-feeds-high-frequency"),
              condition("complementary-paths-sum"),
              relation("gyro-feeds-high-frequency"),
              ["gyro-feeds-high-frequency"],
              ["complementary-paths-sum"]
            ],
            [
              "validity-pair",
              relation("validity-constrains-gravity"),
              condition("specific-force-validity"),
              relation("validity-constrains-gravity"),
              ["validity-constrains-gravity"],
              ["specific-force-validity"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why equal sensor averaging can worsen robot tilt:",
            "The explanation connects frequency trust, specific-force validity, correlation and fusion residual.",
            "The explanation counts sensors and omits validity or common-mode error.",
            [
              "Define complementary sensor filtering.",
              "Define a fusion weight from uncertainty and validity."
            ],
            [
              "Explain accelerometer corruption during translation.",
              "Use reference orientation residual to test the weight change."
            ]
          ],
          focusRef: misconception("simple-average-improves-estimate", "claim"),
          contextConditionIds: [
            "complementary-paths-sum",
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          conceptGroups: [
            [
              "complement-definition",
              term("complementary-filter", "label"),
              [
                term("complementary-filter", "definition"),
                relation("gyro-feeds-high-frequency")
              ],
              ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
              ["complementary-paths-sum"]
            ],
            [
              "weight-definition",
              term("fusion-weight", "label"),
              [
                term("fusion-weight", "definition"),
                relation("weights-map-estimates")
              ],
              ["weights-map-estimates"],
              ["dependence-aware-weights"]
            ],
            [
              "correlation-definition",
              term("common-mode-error", "label"),
              [
                term("common-mode-error", "definition"),
                relation("validity-constrains-weights")
              ],
              ["validity-constrains-weights"],
              ["dependence-aware-weights"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["fusion-compares-reference"],
          criterionConditionId: "specific-force-validity"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the complementary-filter diagram for bounded robot tilt:",
            "The diagram implication combines rapid gyroscope and valid slow gravity orientation.",
            "The diagram implication averages the two orientation states without frequency separation.",
            [
              "Trace gyroscope orientation through the high-frequency path.",
              "Trace gravity orientation through the low-frequency path."
            ],
            [
              "Identify both complementary routing relations.",
              "Choose the implication that retains the declared frequency split."
            ]
          ],
          focusRef: reasonedCase("bounded-tilt-fusion-example", "scenario"),
          contextConditionIds: [
            "aligned-fusion-state",
            "complementary-paths-sum"
          ],
          positions: [
            ["gyro-orientation", 0, 0],
            ["gravity-orientation", 0, 1],
            ["frequency-split", 1, 0],
            ["fused-orientation", 2, 0]
          ],
          relationIds: [
            "gyro-feeds-high-frequency",
            "gravity-feeds-low-frequency"
          ],
          answerRelationIds: [
            "gyro-feeds-high-frequency",
            "gravity-feeds-low-frequency"
          ],
          options: [
            [
              "retain-complementary-paths",
              true,
              reasonedCase("bounded-tilt-fusion-example", "verification"),
              condition("complementary-paths-sum"),
              ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"],
              ["aligned-fusion-state", "complementary-paths-sum"],
              null
            ],
            [
              "average-estimates",
              false,
              misconception("simple-average-improves-estimate", "claim"),
              misconception("simple-average-improves-estimate", "mechanism"),
              ["gravity-feeds-low-frequency"],
              ["dependence-aware-weights"],
              "simple-average-improves-estimate"
            ],
            [
              "ignore-frame",
              false,
              reasonedCase("acceleration-corruption-counterexample", "outcome"),
              condition("aligned-fusion-state"),
              ["gyro-feeds-high-frequency"],
              ["aligned-fusion-state"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the fusion diagram during invalid specific force:",
            "The counterexample implication uses validity to reduce corrupted gravity contribution and residual.",
            "The counterexample implication preserves the nominal accelerometer weight during robot acceleration.",
            [
              "Start with the sensor validity state.",
              "Follow validity into gravity orientation and fusion weights."
            ],
            [
              "Identify both validity constraints.",
              "Choose the implication that rechecks fused orientation."
            ]
          ],
          focusRef: reasonedCase("acceleration-corruption-counterexample", "scenario"),
          contextConditionIds: [
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          positions: [
            ["validity-state", 0, 0],
            ["gravity-orientation", 1, 0],
            ["weight-model", 1, 1]
          ],
          relationIds: [
            "validity-constrains-gravity",
            "validity-constrains-weights"
          ],
          answerRelationIds: [
            "validity-constrains-gravity",
            "validity-constrains-weights"
          ],
          options: [
            [
              "gate-gravity-trust",
              true,
              reasonedCase("acceleration-corruption-counterexample", "verification"),
              condition("specific-force-validity"),
              [
                "validity-constrains-gravity",
                "validity-constrains-weights"
              ],
              ["specific-force-validity", "dependence-aware-weights"],
              null
            ],
            [
              "keep-equal-weight",
              false,
              misconception("simple-average-improves-estimate", "claim"),
              misconception("simple-average-improves-estimate", "mechanism"),
              ["weights-map-estimates"],
              ["dependence-aware-weights"],
              "simple-average-improves-estimate"
            ],
            [
              "ignore-validity",
              false,
              reasonedCase("acceleration-corruption-counterexample", "outcome"),
              condition("specific-force-validity"),
              ["fusion-compares-reference"],
              ["specific-force-validity"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("complementary-filter", "label"),
      focusRef: reasonedCase("bounded-tilt-fusion-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["gyro-orientation", 0, 0],
        ["gravity-orientation", 0, 1],
        ["frequency-split", 1, 0],
        ["validity-state", 1, 1],
        ["weight-model", 2, 1],
        ["fused-orientation", 2, 0],
        ["reference-orientation", 3, 1],
        ["fusion-residual", 3, 0]
      ],
      visibleEntityIds: [
        "gyro-orientation",
        "gravity-orientation",
        "frequency-split",
        "validity-state",
        "weight-model",
        "fused-orientation",
        "reference-orientation",
        "fusion-residual"
      ],
      visibleRelationIds: [
        "gyro-feeds-high-frequency",
        "gravity-feeds-low-frequency",
        "validity-constrains-gravity",
        "validity-constrains-weights",
        "weights-map-estimates",
        "fusion-compares-reference"
      ],
      controls: [
        [
          "valid-gravity",
          condition("complementary-paths-sum"),
          [
            "aligned-fusion-state",
            "complementary-paths-sum",
            "specific-force-validity",
            "dependence-aware-weights"
          ],
          [
            "gyro-orientation",
            "gravity-orientation",
            "frequency-split",
            "validity-state",
            "weight-model",
            "fused-orientation",
            "reference-orientation",
            "fusion-residual"
          ],
          [
            "gyro-feeds-high-frequency",
            "gravity-feeds-low-frequency",
            "validity-constrains-gravity",
            "validity-constrains-weights",
            "weights-map-estimates",
            "fusion-compares-reference"
          ],
          [],
          [],
          [
            [
              "bounded-tilt",
              "Complementary frequency trust retains bounded robot tilt residual.",
              ["frequency-split", "fused-orientation", "fusion-residual"],
              ["gyro-feeds-high-frequency", "gravity-feeds-low-frequency"]
            ]
          ],
          reasonedCase("bounded-tilt-fusion-example", "verification")
        ],
        [
          "invalid-gravity",
          condition("specific-force-validity"),
          ["specific-force-validity"],
          [
            "gravity-orientation",
            "validity-state",
            "weight-model",
            "fused-orientation",
            "reference-orientation",
            "fusion-residual"
          ],
          [
            "validity-constrains-gravity",
            "validity-constrains-weights",
            "weights-map-estimates",
            "fusion-compares-reference"
          ],
          ["gravity-feeds-low-frequency"],
          [],
          [
            [
              "corrupted-tilt",
              "Invalid specific force exposes the unsafe gravity contribution.",
              ["validity-state", "gravity-orientation", "fusion-residual"],
              ["validity-constrains-gravity", "fusion-compares-reference"]
            ]
          ],
          reasonedCase("acceleration-corruption-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L05",
    systemModel:
      "A discrete Kalman filter predicts state and covariance through a linear process model, then corrects them with a time-aligned measurement innovation weighted by uncertainty.",
    failurePattern:
      "The filter becomes inconsistent when time indices, frames or units mismatch, process or measurement covariance is unrealistic, the same evidence is reused or covariance shrinks without truthful error.",
    visualExplanation:
      "A predict-correct cycle carries prior robot state through motion and process covariance into prediction, innovation, Kalman gain and posterior state with uncertainty.",
    applicationTask:
      "Build and audit a planar robot position-velocity Kalman update, retaining matrix order, seconds-based timing, innovation evidence and posterior covariance checks.",
    terms: [
      [
        "kalman-prediction",
        "Kalman state prediction",
        "The propagation of prior state and covariance through a declared linear process model and process noise.",
        "Prediction uncertainty must grow or transform according to the model rather than remaining fixed by convenience.",
        "predict-state-and-covariance"
      ],
      [
        "measurement-innovation",
        "Kalman measurement innovation",
        "The time-aligned difference between an observed measurement and its prediction from the prior state.",
        "Innovation is defined in measurement space with its own covariance and sign convention.",
        "form-measurement-innovation"
      ],
      [
        "kalman-gain",
        "Kalman gain",
        "The matrix that maps innovation into state correction according to predicted and measurement uncertainty.",
        "The gain is model-derived for the current covariance and is not a fixed confidence percentage.",
        "compute-kalman-gain"
      ],
      [
        "kalman-posterior",
        "Kalman posterior estimate",
        "The corrected state and covariance after incorporating the current measurement once.",
        "A small posterior covariance is credible only when innovation behaviour and error statistics remain consistent.",
        "update-posterior-estimate"
      ]
    ],
    entities: [
      [
        "prior-state",
        "state",
        "Prior robot state",
        "The previous position-velocity estimate with an explicit time index, state order and frame."
      ],
      [
        "prior-covariance",
        "state",
        "Prior state covariance",
        "The prior uncertainty and coupling in the same robot state order."
      ],
      [
        "process-model",
        "mechanism",
        "Discrete process model",
        "The time-step-dependent state transition, control input and process covariance."
      ],
      [
        "predicted-state",
        "state",
        "Predicted robot state",
        "The position-velocity estimate propagated to the measurement time."
      ],
      [
        "predicted-covariance",
        "state",
        "Predicted state covariance",
        "The propagated prior covariance plus declared process uncertainty."
      ],
      [
        "sensor-measurement",
        "observation",
        "Time-aligned position measurement",
        "The observed robot position with measurement model, frame, timestamp and covariance."
      ],
      [
        "innovation-state",
        "observation",
        "Innovation and covariance",
        "The measurement residual and its predicted covariance in measurement space."
      ],
      [
        "gain-matrix",
        "mechanism",
        "Kalman gain matrix",
        "The uncertainty-derived mapping from innovation to state correction."
      ],
      [
        "posterior-state",
        "state",
        "Posterior state and covariance",
        "The corrected robot estimate and uncertainty after one measurement update."
      ]
    ],
    relations: [
      [
        "model-predicts-state",
        "transforms",
        ["prior-state", "process-model"],
        ["predicted-state"],
        "the discrete process model propagates prior robot state to measurement time",
        "directed",
        "many-to-one"
      ],
      [
        "model-predicts-covariance",
        "transforms",
        ["prior-covariance", "process-model"],
        ["predicted-covariance"],
        "the transition and process covariance propagate prior state uncertainty",
        "directed",
        "many-to-one"
      ],
      [
        "measurement-forms-innovation",
        "compares",
        ["predicted-state", "sensor-measurement"],
        ["innovation-state"],
        "predicted and observed measurement values form the innovation",
        "directed",
        "many-to-one"
      ],
      [
        "covariance-forms-gain",
        "maps",
        ["predicted-covariance", "innovation-state"],
        ["gain-matrix"],
        "predicted and innovation covariance determine the Kalman gain",
        "directed",
        "many-to-one"
      ],
      [
        "gain-corrects-state",
        "transforms",
        ["predicted-state", "innovation-state", "gain-matrix"],
        ["posterior-state"],
        "the Kalman gain maps innovation into posterior state correction",
        "directed",
        "many-to-one"
      ],
      [
        "gain-corrects-covariance",
        "transforms",
        ["predicted-covariance", "gain-matrix"],
        ["posterior-state"],
        "the Kalman gain updates posterior state covariance",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "consistent-kalman-time",
        "boundary",
        "Prior, prediction and measurement use explicit discrete time indices and the process interval in seconds.",
        [
          "prior-state",
          "process-model",
          "predicted-state",
          "sensor-measurement",
          "innovation-state"
        ],
        ["model-predicts-state", "measurement-forms-innovation"]
      ],
      [
        "consistent-state-contract",
        "boundary",
        "State, covariance, process and measurement models share declared order, frames and compatible SI units.",
        [
          "prior-state",
          "prior-covariance",
          "process-model",
          "predicted-state",
          "predicted-covariance",
          "sensor-measurement"
        ],
        [
          "model-predicts-state",
          "model-predicts-covariance",
          "measurement-forms-innovation"
        ]
      ],
      [
        "valid-noise-covariances",
        "criterion",
        "Process and measurement covariance are symmetric positive semidefinite and justified by independent evidence.",
        [
          "process-model",
          "predicted-covariance",
          "sensor-measurement",
          "innovation-state",
          "gain-matrix"
        ],
        [
          "model-predicts-covariance",
          "covariance-forms-gain",
          "gain-corrects-covariance"
        ]
      ],
      [
        "single-kalman-update",
        "boundary",
        "Each time-stamped measurement contributes to one posterior update unless dependence is modelled explicitly.",
        ["sensor-measurement", "innovation-state", "gain-matrix", "posterior-state"],
        [
          "measurement-forms-innovation",
          "gain-corrects-state",
          "gain-corrects-covariance"
        ]
      ]
    ],
    failureBoundary: [
      "understated-measurement-noise",
      "valid-noise-covariances",
      "The position measurement covariance is set far below observed sensor error, so the filter applies excessive gain to every noisy sample.",
      "Posterior covariance collapses while innovation and independent position error remain larger than predicted.",
      "Reject the covariance claim and retune measurement uncertainty from held-out residual evidence before trusting the posterior.",
      [
        "predicted-state",
        "predicted-covariance",
        "sensor-measurement",
        "innovation-state",
        "gain-matrix",
        "posterior-state"
      ],
      [
        "measurement-forms-innovation",
        "covariance-forms-gain",
        "gain-corrects-state",
        "gain-corrects-covariance"
      ]
    ],
    conceptualModel: [
      [
        "declare-kalman-state",
        "Declare robot position-velocity order, frame, SI units and discrete time index.",
        ["prior-state", "prior-covariance", "process-model"],
        ["model-predicts-state", "model-predicts-covariance"],
        ["consistent-kalman-time", "consistent-state-contract"]
      ],
      [
        "predict-state-and-covariance",
        "Propagate prior state and covariance through the seconds-based process model and process noise.",
        [
          "prior-state",
          "prior-covariance",
          "process-model",
          "predicted-state",
          "predicted-covariance"
        ],
        ["model-predicts-state", "model-predicts-covariance"],
        [
          "consistent-kalman-time",
          "consistent-state-contract",
          "valid-noise-covariances"
        ]
      ],
      [
        "form-measurement-innovation",
        "Map predicted state into measurement space and subtract it from the time-aligned observation.",
        ["predicted-state", "sensor-measurement", "innovation-state"],
        ["measurement-forms-innovation"],
        ["consistent-kalman-time", "consistent-state-contract"]
      ],
      [
        "compute-kalman-gain",
        "Combine predicted covariance with innovation covariance to compute the current gain matrix.",
        ["predicted-covariance", "innovation-state", "gain-matrix"],
        ["covariance-forms-gain"],
        ["valid-noise-covariances"]
      ],
      [
        "update-posterior-estimate",
        "Apply the gain once to update robot state and covariance.",
        [
          "predicted-state",
          "predicted-covariance",
          "innovation-state",
          "gain-matrix",
          "posterior-state"
        ],
        ["gain-corrects-state", "gain-corrects-covariance"],
        ["single-kalman-update"]
      ],
      [
        "audit-filter-consistency",
        "Compare innovation and independent state error with their predicted covariance over repeated updates.",
        [
          "innovation-state",
          "predicted-covariance",
          "posterior-state"
        ],
        ["covariance-forms-gain", "gain-corrects-covariance"],
        ["valid-noise-covariances", "single-kalman-update"]
      ]
    ],
    reasonedCases: [
      {
        id: "position-velocity-example",
        kind: "example",
        scenario:
          "A planar robot predicts position and velocity over a declared time step, then corrects position with a time-aligned sensor measurement.",
        changedConditionIds: ["consistent-kalman-time"],
        givens: [
          [
            "prior-estimate",
            "Robot prior",
            "position-velocity state and covariance at the previous discrete time",
            "m, m/s and squared units",
            "prior-state"
          ],
          [
            "position-observation",
            "Sensor update",
            "position and measurement covariance at the current time",
            "m and m squared",
            "sensor-measurement"
          ]
        ],
        reasoningSteps: [
          [
            "example-predict",
            "The process model advances prior state and covariance to the measurement time.",
            [
              "prior-state",
              "prior-covariance",
              "process-model",
              "predicted-state",
              "predicted-covariance"
            ],
            ["model-predicts-state", "model-predicts-covariance"],
            ["consistent-kalman-time", "consistent-state-contract"]
          ],
          [
            "example-innovation",
            "Time-aligned measured and predicted position form the innovation and covariance.",
            ["predicted-state", "sensor-measurement", "innovation-state"],
            ["measurement-forms-innovation"],
            ["valid-noise-covariances"]
          ],
          [
            "example-gain",
            "Predicted and innovation covariance determine the current Kalman gain.",
            ["predicted-covariance", "innovation-state", "gain-matrix"],
            ["covariance-forms-gain"],
            ["valid-noise-covariances"]
          ],
          [
            "example-update",
            "The gain corrects position, coupled velocity and posterior covariance once.",
            [
              "predicted-state",
              "predicted-covariance",
              "innovation-state",
              "gain-matrix",
              "posterior-state"
            ],
            ["gain-corrects-state", "gain-corrects-covariance"],
            ["single-kalman-update"]
          ]
        ],
        outcome:
          "The posterior balances process prediction and position measurement according to declared uncertainty.",
        criterionConditionId: "valid-noise-covariances",
        criterion:
          "The filter uses justified process and measurement covariance and retains innovation evidence for consistency.",
        verification:
          "Recompute one predict-correct cycle independently and verify time indices, matrix dimensions, innovation, gain and posterior covariance."
      },
      {
        id: "overconfident-sensor-counterexample",
        kind: "counterexample",
        scenario:
          "A noisy position sensor is assigned unrealistically small measurement covariance, causing the Kalman filter to chase each sample.",
        changedConditionIds: ["valid-noise-covariances"],
        givens: [
          [
            "optimistic-covariance",
            "Measurement model",
            "declared measurement variance is below held-out sensor residual variance",
            "m squared",
            "sensor-measurement"
          ],
          [
            "noisy-series",
            "Position observations",
            "time-aligned samples fluctuate around the physical trajectory",
            "m",
            "innovation-state"
          ]
        ],
        reasoningSteps: [
          [
            "counter-innovation",
            "Noisy position measurements produce persistent innovations larger than their predicted covariance.",
            ["predicted-state", "sensor-measurement", "innovation-state"],
            ["measurement-forms-innovation"],
            ["valid-noise-covariances"]
          ],
          [
            "counter-gain",
            "Understated measurement uncertainty drives excessive gain towards each sample.",
            ["predicted-covariance", "innovation-state", "gain-matrix"],
            ["covariance-forms-gain"],
            ["valid-noise-covariances"]
          ],
          [
            "counter-state",
            "Excessive gain moves posterior position and coupled velocity with sensor noise.",
            ["predicted-state", "innovation-state", "gain-matrix", "posterior-state"],
            ["gain-corrects-state"],
            ["single-kalman-update"]
          ],
          [
            "counter-covariance",
            "Posterior covariance shrinks despite residual error, exposing filter inconsistency.",
            ["predicted-covariance", "gain-matrix", "posterior-state"],
            ["gain-corrects-covariance"],
            ["valid-noise-covariances"]
          ]
        ],
        outcome:
          "The filter reports high confidence while tracking measurement noise rather than the physical robot state.",
        criterionConditionId: "valid-noise-covariances",
        criterion:
          "Posterior covariance must agree with innovation and held-out error statistics, not merely shrink.",
        verification:
          "Estimate measurement covariance from held-out residuals, rerun the filter and compare innovation consistency plus posterior error."
      }
    ],
    misconception: {
      id: "small-covariance-means-accurate",
      claim:
        "A Kalman filter is accurate when its posterior covariance becomes small.",
      mechanism:
        "Covariance can collapse under understated noise or repeated evidence while the state error remains large.",
      correction:
        "Validate process and measurement covariances using innovation and independent state-error consistency.",
      disconfirmingObservation:
        "Posterior covariance shrinks while noisy innovations and held-out position error remain larger than predicted.",
      entityIds: [
        "prior-state",
        "prior-covariance",
        "process-model",
        "predicted-state",
        "predicted-covariance",
        "sensor-measurement",
        "innovation-state",
        "gain-matrix",
        "posterior-state"
      ],
      relationIds: [
        "model-predicts-state",
        "model-predicts-covariance",
        "measurement-forms-innovation",
        "covariance-forms-gain",
        "gain-corrects-state",
        "gain-corrects-covariance"
      ],
      conditionIds: [
        "consistent-kalman-time",
        "consistent-state-contract",
        "valid-noise-covariances",
        "single-kalman-update"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order one Kalman cycle from robot prior to corrected posterior:",
            "The prediction, innovation, gain and correction sequence preserves time and uncertainty.",
            "The prediction, innovation, gain and correction sequence applies the measurement before process prediction.",
            [
              "Advance prior state and covariance to measurement time.",
              "Form innovation before computing the Kalman gain."
            ],
            [
              "Predict robot state with process uncertainty.",
              "Apply one gain-weighted measurement correction."
            ]
          ],
          focusRef: reasonedCase("position-velocity-example", "scenario"),
          contextConditionIds: [
            "consistent-kalman-time",
            "consistent-state-contract",
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          steps: [
            [
              "predict",
              ["model-predicts-state", "model-predicts-covariance"],
              ["consistent-kalman-time"]
            ],
            [
              "innovate",
              ["measurement-forms-innovation"],
              ["consistent-state-contract"]
            ],
            [
              "gain",
              ["covariance-forms-gain"],
              ["valid-noise-covariances"]
            ],
            [
              "correct",
              ["gain-corrects-state", "gain-corrects-covariance"],
              ["single-kalman-update"]
            ]
          ],
          correctOrder: ["predict", "innovate", "gain", "correct"]
        },
        retry: {
          instruction: [
            "Trace the overconfident filter from understated sensor covariance to inconsistent posterior:",
            "The covariance retry links large innovation, excessive gain and false posterior confidence.",
            "The covariance retry smooths the displayed robot path without repairing the measurement model.",
            [
              "Begin with held-out measurement residual variance.",
              "Compare predicted innovation covariance with observed innovations."
            ],
            [
              "Repair the position measurement covariance.",
              "Rerun gain, posterior state and covariance consistency."
            ]
          ],
          focusRef: reasonedCase("overconfident-sensor-counterexample", "scenario"),
          contextConditionIds: [
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          steps: [
            [
              "inspect-innovation",
              ["measurement-forms-innovation"],
              ["valid-noise-covariances"]
            ],
            [
              "inspect-gain",
              ["covariance-forms-gain"],
              ["valid-noise-covariances"]
            ],
            [
              "repair-update",
              ["gain-corrects-state"],
              ["single-kalman-update"]
            ],
            [
              "recheck-covariance",
              ["gain-corrects-covariance"],
              ["valid-noise-covariances"]
            ]
          ],
          correctOrder: [
            "inspect-innovation",
            "inspect-gain",
            "repair-update",
            "recheck-covariance"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a valid Kalman update:",
            "The selected filter evidence covers timed prediction, measurement innovation, uncertainty-derived gain and one correction.",
            "The selected filter evidence accepts small posterior covariance without consistency checks.",
            [
              "Choose state and covariance prediction relations.",
              "Choose innovation, gain and posterior relations."
            ],
            [
              "Select consistent robot state order and time.",
              "Select justified process and measurement covariance."
            ]
          ],
          focusRef: term("kalman-posterior", "boundary"),
          contextConditionIds: [
            "consistent-kalman-time",
            "consistent-state-contract",
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          options: [
            [
              "timed-prediction",
              true,
              relation("model-predicts-state"),
              condition("consistent-kalman-time"),
              ["model-predicts-state", "model-predicts-covariance"],
              ["consistent-kalman-time"],
              null
            ],
            [
              "innovation-evidence",
              true,
              relation("measurement-forms-innovation"),
              condition("consistent-state-contract"),
              ["measurement-forms-innovation"],
              ["consistent-state-contract"],
              null
            ],
            [
              "uncertainty-gain",
              true,
              relation("covariance-forms-gain"),
              condition("valid-noise-covariances"),
              ["covariance-forms-gain"],
              ["valid-noise-covariances"],
              null
            ],
            [
              "small-covariance-proof",
              false,
              misconception("small-covariance-means-accurate", "claim"),
              misconception("small-covariance-means-accurate", "mechanism"),
              ["gain-corrects-covariance"],
              ["valid-noise-covariances"],
              "small-covariance-means-accurate"
            ],
            [
              "double-update",
              false,
              reasonedCase("overconfident-sensor-counterexample", "outcome"),
              condition("single-kalman-update"),
              ["gain-corrects-state"],
              ["single-kalman-update"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the Kalman records that expose false posterior confidence:",
            "The diagnostic records connect innovation magnitude, predicted covariance, gain and held-out error.",
            "The diagnostic records report only the shrinking posterior covariance.",
            [
              "Inspect observed innovation against its covariance.",
              "Retain measurement innovation evidence independent of Kalman gain tuning."
            ],
            [
              "Mark the covariance-to-gain relation.",
              "Mark posterior state and covariance correction separately."
            ]
          ],
          focusRef: reasonedCase("overconfident-sensor-counterexample", "verification"),
          contextConditionIds: [
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          options: [
            [
              "innovation-record",
              true,
              relation("measurement-forms-innovation"),
              condition("valid-noise-covariances"),
              ["measurement-forms-innovation"],
              ["valid-noise-covariances"],
              null
            ],
            [
              "gain-record",
              true,
              relation("covariance-forms-gain"),
              condition("valid-noise-covariances"),
              ["covariance-forms-gain"],
              ["valid-noise-covariances"],
              null
            ],
            [
              "posterior-record",
              true,
              relation("gain-corrects-state"),
              reasonedCase("overconfident-sensor-counterexample", "verification"),
              ["gain-corrects-state", "gain-corrects-covariance"],
              ["single-kalman-update"],
              null
            ],
            [
              "confidence-only",
              false,
              misconception("small-covariance-means-accurate", "claim"),
              misconception("small-covariance-means-accurate", "mechanism"),
              ["gain-corrects-covariance"],
              ["valid-noise-covariances"],
              "small-covariance-means-accurate"
            ],
            [
              "path-smoothness",
              false,
              reasonedCase("overconfident-sensor-counterexample", "outcome"),
              condition("consistent-kalman-time"),
              ["model-predicts-state"],
              ["consistent-kalman-time"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each Kalman operation to its estimator boundary:",
            "The prediction, innovation and correction operations carry time, model and evidence-use boundaries.",
            "A Kalman operation is paired with a boundary that cannot expose its estimation error.",
            [
              "Pair state prediction with discrete time consistency.",
              "Pair innovation formation with the state contract."
            ],
            [
              "Match gain calculation to valid noise covariance.",
              "Match posterior correction to one measurement use."
            ]
          ],
          focusRef: reasonedCase("position-velocity-example", "criterion"),
          contextConditionIds: [
            "consistent-kalman-time",
            "consistent-state-contract",
            "valid-noise-covariances"
          ],
          pairs: [
            [
              "prediction-pair",
              relation("model-predicts-state"),
              condition("consistent-kalman-time"),
              relation("model-predicts-state"),
              ["model-predicts-state"],
              ["consistent-kalman-time"]
            ],
            [
              "innovation-pair",
              relation("measurement-forms-innovation"),
              condition("consistent-state-contract"),
              relation("measurement-forms-innovation"),
              ["measurement-forms-innovation"],
              ["consistent-state-contract"]
            ],
            [
              "gain-pair",
              relation("covariance-forms-gain"),
              condition("valid-noise-covariances"),
              relation("covariance-forms-gain"),
              ["covariance-forms-gain"],
              ["valid-noise-covariances"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why small Kalman covariance does not prove robot-state accuracy:",
            "The explanation connects noise models, innovation consistency, gain and held-out state error.",
            "The explanation cites posterior confidence and omits sensor residual evidence.",
            [
              "Define the Kalman measurement innovation.",
              "Define gain as an uncertainty-derived matrix."
            ],
            [
              "Explain how understated measurement covariance changes gain.",
              "Compare posterior covariance with innovation and independent error."
            ]
          ],
          focusRef: misconception("small-covariance-means-accurate", "claim"),
          contextConditionIds: [
            "valid-noise-covariances",
            "consistent-state-contract",
            "single-kalman-update"
          ],
          conceptGroups: [
            [
              "prediction-definition",
              term("kalman-prediction", "label"),
              [
                term("kalman-prediction", "definition"),
                relation("model-predicts-covariance")
              ],
              ["model-predicts-covariance"],
              ["consistent-kalman-time"]
            ],
            [
              "innovation-definition",
              term("measurement-innovation", "label"),
              [
                term("measurement-innovation", "definition"),
                relation("measurement-forms-innovation")
              ],
              ["measurement-forms-innovation"],
              ["consistent-state-contract"]
            ],
            [
              "gain-definition",
              term("kalman-gain", "label"),
              [
                term("kalman-gain", "definition"),
                relation("covariance-forms-gain")
              ],
              ["covariance-forms-gain"],
              ["valid-noise-covariances"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["gain-corrects-covariance"],
          criterionConditionId: "valid-noise-covariances"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the Kalman predict-correct diagram for robot position and velocity:",
            "The diagram implication forms innovation and gain before correcting posterior state.",
            "The diagram implication copies the sensor measurement directly into robot state.",
            [
              "Trace predicted state and measurement into innovation.",
              "Follow innovation and predicted covariance into the gain."
            ],
            [
              "Identify the innovation relation.",
              "Choose the implication that applies one gain-weighted correction."
            ]
          ],
          focusRef: reasonedCase("position-velocity-example", "scenario"),
          contextConditionIds: [
            "consistent-kalman-time",
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          positions: [
            ["predicted-state", 0, 0],
            ["sensor-measurement", 0, 1],
            ["innovation-state", 1, 0],
            ["gain-matrix", 2, 0],
            ["posterior-state", 3, 0]
          ],
          relationIds: [
            "measurement-forms-innovation",
            "gain-corrects-state"
          ],
          answerRelationIds: [
            "measurement-forms-innovation",
            "gain-corrects-state"
          ],
          options: [
            [
              "apply-one-correction",
              true,
              reasonedCase("position-velocity-example", "verification"),
              condition("single-kalman-update"),
              ["measurement-forms-innovation", "gain-corrects-state"],
              ["valid-noise-covariances", "single-kalman-update"],
              null
            ],
            [
              "trust-small-covariance",
              false,
              misconception("small-covariance-means-accurate", "claim"),
              misconception("small-covariance-means-accurate", "mechanism"),
              ["gain-corrects-state"],
              ["valid-noise-covariances"],
              "small-covariance-means-accurate"
            ],
            [
              "copy-measurement",
              false,
              reasonedCase("overconfident-sensor-counterexample", "outcome"),
              condition("consistent-state-contract"),
              ["measurement-forms-innovation"],
              ["consistent-state-contract"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the uncertainty diagram for the overconfident position sensor:",
            "The counterexample implication connects predicted covariance and innovation to excessive gain.",
            "The counterexample implication accepts collapsed posterior uncertainty as robot accuracy.",
            [
              "Start with predicted covariance and innovation state.",
              "Follow their gain into posterior covariance."
            ],
            [
              "Identify the covariance-to-gain relation.",
              "Choose the implication that repairs measurement uncertainty."
            ]
          ],
          focusRef: reasonedCase("overconfident-sensor-counterexample", "scenario"),
          contextConditionIds: [
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          positions: [
            ["predicted-covariance", 0, 0],
            ["innovation-state", 0, 1],
            ["gain-matrix", 1, 0],
            ["posterior-state", 2, 0],
            ["sensor-measurement", 1, 1]
          ],
          relationIds: [
            "covariance-forms-gain",
            "gain-corrects-covariance"
          ],
          answerRelationIds: [
            "covariance-forms-gain",
            "gain-corrects-covariance"
          ],
          options: [
            [
              "repair-noise-model",
              true,
              reasonedCase("overconfident-sensor-counterexample", "verification"),
              condition("valid-noise-covariances"),
              ["covariance-forms-gain", "gain-corrects-covariance"],
              ["valid-noise-covariances", "single-kalman-update"],
              null
            ],
            [
              "trust-confidence",
              false,
              misconception("small-covariance-means-accurate", "claim"),
              misconception("small-covariance-means-accurate", "mechanism"),
              ["gain-corrects-covariance"],
              ["valid-noise-covariances"],
              "small-covariance-means-accurate"
            ],
            [
              "ignore-innovation",
              false,
              reasonedCase("overconfident-sensor-counterexample", "outcome"),
              condition("valid-noise-covariances"),
              ["covariance-forms-gain"],
              ["valid-noise-covariances"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("kalman-posterior", "label"),
      focusRef: reasonedCase("position-velocity-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["prior-state", 0, 0],
        ["prior-covariance", 0, 1],
        ["process-model", 1, 1],
        ["predicted-state", 1, 0],
        ["predicted-covariance", 2, 1],
        ["sensor-measurement", 2, 0],
        ["innovation-state", 3, 0],
        ["gain-matrix", 3, 1],
        ["posterior-state", 4, 0]
      ],
      visibleEntityIds: [
        "prior-state",
        "prior-covariance",
        "process-model",
        "predicted-state",
        "predicted-covariance",
        "sensor-measurement",
        "innovation-state",
        "gain-matrix",
        "posterior-state"
      ],
      visibleRelationIds: [
        "model-predicts-state",
        "model-predicts-covariance",
        "measurement-forms-innovation",
        "covariance-forms-gain",
        "gain-corrects-state",
        "gain-corrects-covariance"
      ],
      controls: [
        [
          "consistent-update",
          condition("valid-noise-covariances"),
          [
            "consistent-kalman-time",
            "consistent-state-contract",
            "valid-noise-covariances",
            "single-kalman-update"
          ],
          [
            "prior-state",
            "prior-covariance",
            "process-model",
            "predicted-state",
            "predicted-covariance",
            "sensor-measurement",
            "innovation-state",
            "gain-matrix",
            "posterior-state"
          ],
          [
            "model-predicts-state",
            "model-predicts-covariance",
            "measurement-forms-innovation",
            "covariance-forms-gain",
            "gain-corrects-state",
            "gain-corrects-covariance"
          ],
          [],
          [],
          [
            [
              "balanced-posterior",
              "Justified covariance balances Kalman prediction and measurement correction.",
              ["predicted-state", "gain-matrix", "posterior-state"],
              ["covariance-forms-gain", "gain-corrects-state"]
            ]
          ],
          reasonedCase("position-velocity-example", "verification")
        ],
        [
          "understated-sensor-noise",
          condition("single-kalman-update"),
          ["single-kalman-update"],
          [
            "predicted-state",
            "predicted-covariance",
            "sensor-measurement",
            "innovation-state",
            "gain-matrix",
            "posterior-state"
          ],
          [
            "measurement-forms-innovation",
            "covariance-forms-gain",
            "gain-corrects-state",
            "gain-corrects-covariance"
          ],
          ["model-predicts-covariance"],
          [],
          [
            [
              "false-confidence",
              "Understated sensor noise drives excessive gain and false confidence.",
              ["innovation-state", "gain-matrix", "posterior-state"],
              ["covariance-forms-gain", "gain-corrects-covariance"]
            ]
          ],
          reasonedCase("overconfident-sensor-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L06",
    systemModel:
      "An extended Kalman filter predicts through nonlinear process and observation functions, then uses Jacobians evaluated at the current prediction to propagate covariance and form a local correction.",
    failurePattern:
      "The update can diverge when a Jacobian is wrong or evaluated at a stale state, angular innovation is not wrapped, frames or units disagree or uncertainty spans a region where one tangent is not credible.",
    visualExplanation:
      "A curved range-bearing observation is touched by a local tangent at the predicted robot state, with the checked Jacobian mapping covariance into a wrapped innovation and posterior correction.",
    applicationTask:
      "Derive and finite-difference check a landmark range-bearing Jacobian, wrap the bearing innovation in radians and compare EKF behaviour from near and distant initial predictions.",
    terms: [
      [
        "extended-kalman-linearisation",
        "Extended Kalman linearisation",
        "The local first-order approximation of a nonlinear process or observation function around the current predicted robot state.",
        "Linearisation is credible only near its declared operating point and must be recomputed as that point changes.",
        "linearise-current-models"
      ],
      [
        "nonlinear-observation-model",
        "Nonlinear observation function",
        "A function that maps robot state and landmark geometry into predicted sensor measurements such as range and bearing.",
        "The function, measurement order, frame and SI units must match the actual sensor observation.",
        "predict-nonlinear-observation"
      ],
      [
        "observation-jacobian",
        "Observation Jacobian",
        "The matrix of local partial derivatives that maps small state perturbations into observation perturbations.",
        "A symbolic or automatic derivative remains untrusted until dimensions, operating point and a finite-difference check agree.",
        "linearise-current-models"
      ],
      [
        "wrapped-angle-innovation",
        "Wrapped angular innovation",
        "The shortest signed angular difference between observed and predicted bearing after normalisation to the declared interval.",
        "Angle wrapping applies to angular residual components, not to range or arbitrary linear state components.",
        "wrap-angular-innovation"
      ]
    ],
    entities: [
      [
        "nonlinear-prior-state",
        "state",
        "Nonlinear robot prior",
        "The robot pose estimate and covariance before the current nonlinear prediction."
      ],
      [
        "nonlinear-process-model",
        "mechanism",
        "Nonlinear process function",
        "The motion function that propagates the robot prior through the declared time step and controls."
      ],
      [
        "process-jacobian",
        "mechanism",
        "Process Jacobian matrix",
        "The derivative of the nonlinear process function at the current prior and control."
      ],
      [
        "ekf-predicted-state",
        "state",
        "Extended Kalman predicted state",
        "The robot prediction and propagated covariance at the sensor observation time."
      ],
      [
        "nonlinear-observation-model",
        "mechanism",
        "Nonlinear range-bearing function",
        "The landmark observation function that maps predicted robot state into range and bearing."
      ],
      [
        "predicted-observation",
        "observation",
        "Predicted range-bearing observation",
        "The range and bearing expected from the predicted robot state and known landmark."
      ],
      [
        "sensor-observation",
        "observation",
        "Measured range-bearing observation",
        "The time-aligned sensor range in metres and bearing in radians with declared covariance."
      ],
      [
        "observation-jacobian-entity",
        "mechanism",
        "Observation Jacobian matrix",
        "The range-bearing derivative evaluated at the same predicted state used for the predicted observation."
      ],
      [
        "wrapped-innovation",
        "observation",
        "Wrapped range-bearing innovation",
        "The measured minus predicted range-bearing residual after the angular component is wrapped."
      ],
      [
        "ekf-posterior-state",
        "state",
        "Extended Kalman posterior",
        "The corrected robot state and covariance after the local range-bearing update."
      ],
      [
        "finite-difference-check",
        "criterion",
        "Finite-difference Jacobian check",
        "A numerical derivative comparison at the same state, perturbation scale, frame and measurement order."
      ]
    ],
    relations: [
      [
        "process-function-predicts-state",
        "transforms",
        ["nonlinear-prior-state", "nonlinear-process-model"],
        ["ekf-predicted-state"],
        "the nonlinear process function propagates the robot prior to observation time",
        "directed",
        "many-to-one"
      ],
      [
        "process-jacobian-propagates-covariance",
        "maps",
        ["nonlinear-prior-state", "process-jacobian"],
        ["ekf-predicted-state"],
        "the current process Jacobian maps prior covariance into predicted covariance",
        "directed",
        "many-to-one"
      ],
      [
        "observation-function-predicts-measurement",
        "transforms",
        ["ekf-predicted-state", "nonlinear-observation-model"],
        ["predicted-observation"],
        "the nonlinear range-bearing function predicts the landmark observation",
        "directed",
        "many-to-one"
      ],
      [
        "observation-function-forms-jacobian",
        "maps",
        ["ekf-predicted-state", "nonlinear-observation-model"],
        ["observation-jacobian-entity"],
        "the observation function is differentiated at the current prediction",
        "directed",
        "many-to-one"
      ],
      [
        "measurement-forms-wrapped-innovation",
        "compares",
        ["predicted-observation", "sensor-observation"],
        ["wrapped-innovation"],
        "predicted and measured range-bearing values form an innovation with wrapped bearing",
        "directed",
        "many-to-one"
      ],
      [
        "jacobian-corrects-posterior",
        "transforms",
        ["observation-jacobian-entity", "wrapped-innovation"],
        ["ekf-posterior-state"],
        "the local observation Jacobian and wrapped innovation correct the posterior",
        "directed",
        "many-to-one"
      ],
      [
        "finite-difference-checks-jacobian",
        "compares",
        [
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity"
        ],
        ["finite-difference-check"],
        "finite differences compare numerical slopes with the authored observation Jacobian",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "consistent-ekf-contract",
        "boundary",
        "Robot state, landmark, process and range-bearing observation share declared frames, order, timestamps, radians and compatible SI units.",
        [
          "nonlinear-prior-state",
          "nonlinear-process-model",
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "predicted-observation",
          "sensor-observation"
        ],
        [
          "process-function-predicts-state",
          "observation-function-predicts-measurement",
          "measurement-forms-wrapped-innovation"
        ]
      ],
      [
        "current-linearisation-point",
        "boundary",
        "Process and observation Jacobians are evaluated at the same current states used by their nonlinear predictions.",
        [
          "nonlinear-prior-state",
          "process-jacobian",
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity"
        ],
        [
          "process-jacobian-propagates-covariance",
          "observation-function-forms-jacobian",
          "jacobian-corrects-posterior"
        ]
      ],
      [
        "wrapped-angular-residual",
        "criterion",
        "Bearing innovation is normalised to the declared principal interval before gain-weighted correction.",
        [
          "predicted-observation",
          "sensor-observation",
          "wrapped-innovation",
          "ekf-posterior-state"
        ],
        [
          "measurement-forms-wrapped-innovation",
          "jacobian-corrects-posterior"
        ]
      ],
      [
        "credible-local-region",
        "assumption",
        "Prediction uncertainty and residual size remain within a region where the current first-order tangent represents the nonlinear functions adequately.",
        [
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity",
          "wrapped-innovation",
          "ekf-posterior-state"
        ],
        [
          "observation-function-predicts-measurement",
          "observation-function-forms-jacobian",
          "jacobian-corrects-posterior"
        ]
      ],
      [
        "finite-difference-agreement",
        "criterion",
        "Analytic observation Jacobian entries agree with scale-appropriate central finite differences within a declared tolerance.",
        [
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity",
          "finite-difference-check"
        ],
        [
          "observation-function-forms-jacobian",
          "finite-difference-checks-jacobian"
        ]
      ]
    ],
    failureBoundary: [
      "unwrapped-bearing-jump",
      "wrapped-angular-residual",
      "A predicted bearing just below positive pi is subtracted raw from an observed bearing just above negative pi, creating an innovation near one full revolution.",
      "The EKF applies a large angular correction even though the physical line of sight changed only slightly across the wrap boundary.",
      "Reject the update until the bearing innovation is wrapped in radians and the corrected residual is independently recomputed.",
      [
        "predicted-observation",
        "sensor-observation",
        "wrapped-innovation",
        "observation-jacobian-entity",
        "ekf-posterior-state"
      ],
      ["measurement-forms-wrapped-innovation", "jacobian-corrects-posterior"]
    ],
    conceptualModel: [
      [
        "declare-nonlinear-contract",
        "Declare robot state order, landmark frame, sensor order, timestamps, radians and SI units.",
        [
          "nonlinear-prior-state",
          "nonlinear-process-model",
          "nonlinear-observation-model",
          "sensor-observation"
        ],
        ["process-function-predicts-state", "observation-function-predicts-measurement"],
        ["consistent-ekf-contract"]
      ],
      [
        "predict-nonlinear-state",
        "Propagate the robot prior through the nonlinear process function to observation time.",
        [
          "nonlinear-prior-state",
          "nonlinear-process-model",
          "ekf-predicted-state"
        ],
        ["process-function-predicts-state"],
        ["consistent-ekf-contract"]
      ],
      [
        "predict-nonlinear-observation",
        "Evaluate the nonlinear range-bearing function at the current predicted robot state.",
        [
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "predicted-observation"
        ],
        ["observation-function-predicts-measurement"],
        ["consistent-ekf-contract", "credible-local-region"]
      ],
      [
        "linearise-current-models",
        "Evaluate process and observation Jacobians at their current nonlinear operating points.",
        [
          "nonlinear-prior-state",
          "process-jacobian",
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity"
        ],
        [
          "process-jacobian-propagates-covariance",
          "observation-function-forms-jacobian"
        ],
        ["current-linearisation-point", "credible-local-region"]
      ],
      [
        "verify-observation-jacobian",
        "Compare the observation Jacobian with central finite differences at the identical predicted state.",
        [
          "ekf-predicted-state",
          "nonlinear-observation-model",
          "observation-jacobian-entity",
          "finite-difference-check"
        ],
        ["finite-difference-checks-jacobian"],
        ["finite-difference-agreement"]
      ],
      [
        "wrap-angular-innovation",
        "Subtract predicted from measured range-bearing and wrap only the angular innovation in radians.",
        ["predicted-observation", "sensor-observation", "wrapped-innovation"],
        ["measurement-forms-wrapped-innovation"],
        ["consistent-ekf-contract", "wrapped-angular-residual"]
      ],
      [
        "apply-local-ekf-correction",
        "Use the current observation Jacobian and wrapped innovation to update robot state and covariance once.",
        [
          "ekf-predicted-state",
          "observation-jacobian-entity",
          "wrapped-innovation",
          "ekf-posterior-state"
        ],
        ["jacobian-corrects-posterior"],
        [
          "current-linearisation-point",
          "wrapped-angular-residual",
          "credible-local-region"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "range-bearing-landmark-example",
        kind: "example",
        scenario:
          "A mobile robot uses a known landmark range-bearing observation to correct a nearby pose prediction with an extended Kalman update.",
        changedConditionIds: ["current-linearisation-point"],
        givens: [
          [
            "nearby-prediction",
            "Robot prediction",
            "pose and covariance near the landmark observation operating point",
            "m, rad and squared units",
            "ekf-predicted-state"
          ],
          [
            "landmark-measurement",
            "Sensor observation",
            "time-aligned landmark range and bearing with covariance",
            "m, rad and squared units",
            "sensor-observation"
          ]
        ],
        reasoningSteps: [
          [
            "example-predict-observation",
            "The nonlinear observation function maps the predicted pose and landmark into expected range and bearing.",
            [
              "ekf-predicted-state",
              "nonlinear-observation-model",
              "predicted-observation"
            ],
            ["observation-function-predicts-measurement"],
            ["consistent-ekf-contract"]
          ],
          [
            "example-linearise",
            "The observation Jacobian is evaluated at that same predicted pose and checked numerically.",
            [
              "ekf-predicted-state",
              "nonlinear-observation-model",
              "observation-jacobian-entity",
              "finite-difference-check"
            ],
            [
              "observation-function-forms-jacobian",
              "finite-difference-checks-jacobian"
            ],
            ["current-linearisation-point", "finite-difference-agreement"]
          ],
          [
            "example-innovation",
            "Measured minus predicted range-bearing forms an innovation whose bearing component is wrapped.",
            ["predicted-observation", "sensor-observation", "wrapped-innovation"],
            ["measurement-forms-wrapped-innovation"],
            ["wrapped-angular-residual"]
          ],
          [
            "example-correct",
            "The checked Jacobian maps the local wrapped innovation into one posterior correction.",
            [
              "ekf-predicted-state",
              "observation-jacobian-entity",
              "wrapped-innovation",
              "ekf-posterior-state"
            ],
            ["jacobian-corrects-posterior"],
            ["credible-local-region"]
          ]
        ],
        outcome:
          "The posterior moves consistently towards the landmark evidence while retaining a covariance justified by the local derivative.",
        criterionConditionId: "finite-difference-agreement",
        criterion:
          "The observation Jacobian matches a finite-difference check and the update uses the same operating point, frames and units.",
        verification:
          "Recompute the predicted observation, central finite-difference Jacobian, wrapped innovation and posterior from the logged prediction."
      },
      {
        id: "bearing-wrap-counterexample",
        kind: "counterexample",
        scenario:
          "A predicted landmark bearing is 3.13 rad and the measured bearing is -3.13 rad, but raw subtraction is used without angular wrapping.",
        changedConditionIds: ["wrapped-angular-residual"],
        givens: [
          [
            "predicted-bearing",
            "Predicted observation",
            "bearing near positive pi",
            "rad",
            "predicted-observation"
          ],
          [
            "measured-bearing",
            "Measured observation",
            "bearing near negative pi",
            "rad",
            "sensor-observation"
          ]
        ],
        reasoningSteps: [
          [
            "counter-raw-residual",
            "Raw measured minus predicted bearing is about -6.26 rad although the physical difference is about 0.02 rad.",
            ["predicted-observation", "sensor-observation", "wrapped-innovation"],
            ["measurement-forms-wrapped-innovation"],
            ["wrapped-angular-residual"]
          ],
          [
            "counter-local-gain",
            "The observation Jacobian is local, but the unwrapped innovation requests a nonlocal angular correction.",
            [
              "observation-jacobian-entity",
              "wrapped-innovation",
              "ekf-posterior-state"
            ],
            ["jacobian-corrects-posterior"],
            ["credible-local-region"]
          ],
          [
            "counter-correction",
            "Wrapping the bearing residual returns the small signed change consistent with the landmark geometry.",
            ["predicted-observation", "sensor-observation", "wrapped-innovation"],
            ["measurement-forms-wrapped-innovation"],
            ["wrapped-angular-residual"]
          ],
          [
            "counter-verification",
            "The repaired wrapped innovation and checked Jacobian produce a nearby posterior instead of a spurious turn.",
            [
              "wrapped-innovation",
              "observation-jacobian-entity",
              "ekf-posterior-state",
              "finite-difference-check"
            ],
            ["jacobian-corrects-posterior", "finite-difference-checks-jacobian"],
            ["finite-difference-agreement"]
          ]
        ],
        outcome:
          "The unwrapped EKF commands an implausibly large correction across the branch cut despite nearly aligned bearings.",
        criterionConditionId: "wrapped-angular-residual",
        criterion:
          "Angular innovation must use the declared radian interval and represent the shortest signed bearing difference.",
        verification:
          "Compute raw and wrapped residuals independently, then compare posterior corrections with the same Jacobian and covariance."
      }
    ],
    misconception: {
      id: "nonlinear-equations-are-enough",
      claim:
        "An extended Kalman filter is correct once nonlinear equations are inserted into a standard Kalman cycle.",
      mechanism:
        "A stale or wrong Jacobian, an unwrapped bearing innovation or a wide uncertainty region can make the local correction inconsistent with the nonlinear geometry.",
      correction:
        "Evaluate Jacobians at the current prediction, check them by finite differences, wrap angular residuals and test the local approximation across the uncertainty region.",
      disconfirmingObservation:
        "The nonlinear prediction looks plausible while numerical derivatives disagree, bearing residuals jump near pi or the posterior diverges from a nearby initial state.",
      entityIds: [
        "nonlinear-prior-state",
        "nonlinear-process-model",
        "process-jacobian",
        "ekf-predicted-state",
        "nonlinear-observation-model",
        "predicted-observation",
        "sensor-observation",
        "observation-jacobian-entity",
        "wrapped-innovation",
        "ekf-posterior-state",
        "finite-difference-check"
      ],
      relationIds: [
        "process-function-predicts-state",
        "process-jacobian-propagates-covariance",
        "observation-function-predicts-measurement",
        "observation-function-forms-jacobian",
        "measurement-forms-wrapped-innovation",
        "jacobian-corrects-posterior",
        "finite-difference-checks-jacobian"
      ],
      conditionIds: [
        "consistent-ekf-contract",
        "current-linearisation-point",
        "wrapped-angular-residual",
        "credible-local-region",
        "finite-difference-agreement"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the nonlinear Extended Kalman range-bearing update:",
            "The nonlinear sequence predicts the robot, evaluates the observation Jacobian, wraps the bearing innovation and corrects the posterior.",
            "The nonlinear sequence evaluates one observation Jacobian before the current robot prediction.",
            [
              "Begin with the nonlinear robot prediction.",
              "Evaluate the range-bearing observation before its Jacobian correction."
            ],
            [
              "Form and wrap the bearing innovation.",
              "Finish with the Extended Kalman posterior."
            ]
          ],
          focusRef: reasonedCase("range-bearing-landmark-example", "scenario"),
          contextConditionIds: [
            "consistent-ekf-contract",
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region"
          ],
          steps: [
            [
              "predict-state",
              ["process-function-predicts-state", "process-jacobian-propagates-covariance"],
              ["consistent-ekf-contract"]
            ],
            [
              "predict-observation",
              ["observation-function-predicts-measurement"],
              ["credible-local-region"]
            ],
            [
              "linearise-observation",
              ["observation-function-forms-jacobian", "finite-difference-checks-jacobian"],
              ["current-linearisation-point", "finite-difference-agreement"]
            ],
            [
              "wrap-innovation",
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"]
            ],
            [
              "correct-posterior",
              ["jacobian-corrects-posterior"],
              ["credible-local-region"]
            ]
          ],
          correctOrder: [
            "predict-state",
            "predict-observation",
            "linearise-observation",
            "wrap-innovation",
            "correct-posterior"
          ]
        },
        retry: {
          instruction: [
            "Trace the bearing-wrap failure from predicted observation to repaired Extended Kalman posterior:",
            "The bearing retry exposes raw angular subtraction, wrapped innovation and the local Jacobian correction.",
            "The bearing retry accepts a near-full-revolution innovation as a credible local observation.",
            [
              "Compare predicted and measured bearing in radians.",
              "Normalise the angular innovation before applying the Jacobian."
            ],
            [
              "Check the observation Jacobian at the current prediction.",
              "Recompute the Extended Kalman posterior with wrapped bearing."
            ]
          ],
          focusRef: reasonedCase("bearing-wrap-counterexample", "scenario"),
          contextConditionIds: [
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region"
          ],
          steps: [
            [
              "compare-bearings",
              ["observation-function-predicts-measurement"],
              ["consistent-ekf-contract"]
            ],
            [
              "expose-raw-jump",
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"]
            ],
            [
              "check-local-jacobian",
              ["finite-difference-checks-jacobian"],
              ["finite-difference-agreement"]
            ],
            [
              "repair-posterior",
              ["jacobian-corrects-posterior"],
              ["credible-local-region"]
            ]
          ],
          correctOrder: [
            "compare-bearings",
            "expose-raw-jump",
            "check-local-jacobian",
            "repair-posterior"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a credible Extended Kalman landmark update:",
            "The selected evidence binds nonlinear observation, current Jacobian, wrapped innovation and local posterior.",
            "The selected evidence treats one plausible nonlinear trajectory as proof of Jacobian correctness.",
            [
              "Choose the nonlinear range-bearing prediction.",
              "Choose the finite-difference Jacobian check."
            ],
            [
              "Retain the wrapped bearing innovation.",
              "Reject an Extended Kalman update outside its credible local region."
            ]
          ],
          focusRef: term("extended-kalman-linearisation", "boundary"),
          contextConditionIds: [
            "consistent-ekf-contract",
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region",
            "finite-difference-agreement"
          ],
          options: [
            [
              "nonlinear-observation-evidence",
              true,
              relation("observation-function-predicts-measurement"),
              condition("consistent-ekf-contract"),
              ["observation-function-predicts-measurement"],
              ["consistent-ekf-contract"],
              null
            ],
            [
              "current-jacobian-evidence",
              true,
              relation("observation-function-forms-jacobian"),
              condition("current-linearisation-point"),
              ["observation-function-forms-jacobian"],
              ["current-linearisation-point"],
              null
            ],
            [
              "wrapped-innovation-evidence",
              true,
              relation("measurement-forms-wrapped-innovation"),
              condition("wrapped-angular-residual"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"],
              null
            ],
            [
              "equations-only-proof",
              false,
              misconception("nonlinear-equations-are-enough", "claim"),
              misconception("nonlinear-equations-are-enough", "mechanism"),
              ["jacobian-corrects-posterior"],
              ["credible-local-region"],
              "nonlinear-equations-are-enough"
            ],
            [
              "unwrapped-bearing",
              false,
              reasonedCase("bearing-wrap-counterexample", "outcome"),
              condition("wrapped-angular-residual"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the Extended Kalman records that diagnose a bad local correction:",
            "The diagnostic records compare nonlinear prediction, numerical Jacobian, wrapped innovation and posterior behaviour.",
            "The diagnostic records retain only a smooth Extended Kalman posterior trace.",
            [
              "Inspect the predicted range-bearing observation.",
              "Compare the observation Jacobian with finite differences."
            ],
            [
              "Record raw and wrapped angular innovation.",
              "Test the nonlinear posterior from nearby predictions."
            ]
          ],
          focusRef: misconception("nonlinear-equations-are-enough", "disconfirmingObservation"),
          contextConditionIds: [
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region",
            "finite-difference-agreement"
          ],
          options: [
            [
              "predicted-observation-record",
              true,
              relation("observation-function-predicts-measurement"),
              condition("consistent-ekf-contract"),
              ["observation-function-predicts-measurement"],
              ["consistent-ekf-contract"],
              null
            ],
            [
              "finite-difference-record",
              true,
              relation("finite-difference-checks-jacobian"),
              condition("finite-difference-agreement"),
              ["finite-difference-checks-jacobian"],
              ["finite-difference-agreement"],
              null
            ],
            [
              "posterior-sensitivity-record",
              true,
              relation("jacobian-corrects-posterior"),
              condition("credible-local-region"),
              ["jacobian-corrects-posterior"],
              ["credible-local-region"],
              null
            ],
            [
              "smooth-path-proof",
              false,
              misconception("nonlinear-equations-are-enough", "claim"),
              misconception("nonlinear-equations-are-enough", "mechanism"),
              ["jacobian-corrects-posterior"],
              ["credible-local-region"],
              "nonlinear-equations-are-enough"
            ],
            [
              "raw-bearing-record",
              false,
              reasonedCase("bearing-wrap-counterexample", "outcome"),
              condition("wrapped-angular-residual"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each Extended Kalman operation to its validity boundary:",
            "The nonlinear observation, current Jacobian and wrapped innovation each retain a distinct boundary.",
            "An Extended Kalman operation is paired with a boundary unrelated to its local approximation.",
            [
              "Pair range-bearing prediction with the observation contract.",
              "Pair the Jacobian evaluation with its current prediction."
            ],
            [
              "Match angular innovation to bearing wrapping.",
              "Match finite differences to Jacobian agreement."
            ]
          ],
          focusRef: reasonedCase("range-bearing-landmark-example", "criterion"),
          contextConditionIds: [
            "consistent-ekf-contract",
            "current-linearisation-point",
            "wrapped-angular-residual",
            "finite-difference-agreement"
          ],
          pairs: [
            [
              "observation-contract-pair",
              relation("observation-function-predicts-measurement"),
              condition("consistent-ekf-contract"),
              relation("observation-function-predicts-measurement"),
              ["observation-function-predicts-measurement"],
              ["consistent-ekf-contract"]
            ],
            [
              "jacobian-point-pair",
              relation("observation-function-forms-jacobian"),
              condition("current-linearisation-point"),
              relation("observation-function-forms-jacobian"),
              ["observation-function-forms-jacobian"],
              ["current-linearisation-point"]
            ],
            [
              "bearing-wrap-pair",
              relation("measurement-forms-wrapped-innovation"),
              condition("wrapped-angular-residual"),
              relation("measurement-forms-wrapped-innovation"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"]
            ],
            [
              "derivative-check-pair",
              relation("finite-difference-checks-jacobian"),
              condition("finite-difference-agreement"),
              relation("finite-difference-checks-jacobian"),
              ["finite-difference-checks-jacobian"],
              ["finite-difference-agreement"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why nonlinear equations alone do not validate an Extended Kalman update:",
            "The explanation connects current Jacobian evaluation, finite differences, wrapped innovation and local validity.",
            "The explanation cites a smooth posterior without checking nonlinear observation derivatives.",
            [
              "Define Extended Kalman linearisation at the current prediction.",
              "Describe a finite-difference observation Jacobian check."
            ],
            [
              "Explain why bearing innovation requires angular wrapping.",
              "Bound the nonlinear correction to a credible local region."
            ]
          ],
          focusRef: misconception("nonlinear-equations-are-enough", "claim"),
          contextConditionIds: [
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region",
            "finite-difference-agreement"
          ],
          conceptGroups: [
            [
              "linearisation-concept",
              term("extended-kalman-linearisation", "label"),
              [
                term("extended-kalman-linearisation", "definition"),
                condition("current-linearisation-point")
              ],
              ["observation-function-forms-jacobian"],
              ["current-linearisation-point"]
            ],
            [
              "jacobian-concept",
              term("observation-jacobian", "label"),
              [
                term("observation-jacobian", "definition"),
                relation("finite-difference-checks-jacobian")
              ],
              ["finite-difference-checks-jacobian"],
              ["finite-difference-agreement"]
            ],
            [
              "innovation-concept",
              term("wrapped-angle-innovation", "label"),
              [
                term("wrapped-angle-innovation", "definition"),
                relation("measurement-forms-wrapped-innovation")
              ],
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["jacobian-corrects-posterior"],
          criterionConditionId: "credible-local-region"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the nonlinear range-bearing diagram for one Extended Kalman update:",
            "The diagram implication predicts the nonlinear observation and forms wrapped innovation from the measured bearing.",
            "The diagram implication bypasses the nonlinear observation and copies sensor bearing into robot pose.",
            [
              "Trace predicted robot state through the range-bearing function.",
              "Compare the predicted observation with measured range-bearing."
            ],
            [
              "Follow measured and predicted bearing into wrapped innovation.",
              "Choose the Extended Kalman observation implication."
            ]
          ],
          focusRef: reasonedCase("range-bearing-landmark-example", "scenario"),
          contextConditionIds: [
            "consistent-ekf-contract",
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region"
          ],
          positions: [
            ["ekf-predicted-state", 0, 0],
            ["nonlinear-observation-model", 1, 0],
            ["predicted-observation", 2, 0],
            ["sensor-observation", 2, 1],
            ["wrapped-innovation", 3, 0]
          ],
          relationIds: [
            "observation-function-predicts-measurement",
            "measurement-forms-wrapped-innovation"
          ],
          answerRelationIds: [
            "observation-function-predicts-measurement",
            "measurement-forms-wrapped-innovation"
          ],
          options: [
            [
              "checked-local-update",
              true,
              reasonedCase("range-bearing-landmark-example", "verification"),
              condition("current-linearisation-point"),
              [
                "observation-function-predicts-measurement",
                "measurement-forms-wrapped-innovation"
              ],
              [
                "consistent-ekf-contract",
                "current-linearisation-point",
                "wrapped-angular-residual"
              ],
              null
            ],
            [
              "nonlinear-equations-proof",
              false,
              misconception("nonlinear-equations-are-enough", "claim"),
              misconception("nonlinear-equations-are-enough", "mechanism"),
              ["observation-function-predicts-measurement"],
              ["credible-local-region"],
              "nonlinear-equations-are-enough"
            ],
            [
              "copy-sensor-bearing",
              false,
              reasonedCase("bearing-wrap-counterexample", "outcome"),
              condition("wrapped-angular-residual"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the branch-cut diagram for the Extended Kalman bearing counterexample:",
            "The counterexample implication replaces raw bearing subtraction with wrapped innovation before local correction.",
            "The counterexample implication treats a -6.26 rad innovation as a nearby nonlinear observation.",
            [
              "Compare predicted positive-pi and measured negative-pi bearing.",
              "Trace the wrapped angular innovation into the Jacobian."
            ],
            [
              "Identify the range-bearing innovation relation.",
              "Choose the posterior implication using the shortest angular residual."
            ]
          ],
          focusRef: reasonedCase("bearing-wrap-counterexample", "scenario"),
          contextConditionIds: [
            "wrapped-angular-residual",
            "current-linearisation-point",
            "credible-local-region"
          ],
          positions: [
            ["predicted-observation", 0, 0],
            ["sensor-observation", 0, 1],
            ["wrapped-innovation", 1, 0],
            ["observation-jacobian-entity", 1, 1],
            ["ekf-posterior-state", 2, 0]
          ],
          relationIds: [
            "measurement-forms-wrapped-innovation",
            "jacobian-corrects-posterior"
          ],
          answerRelationIds: [
            "measurement-forms-wrapped-innovation",
            "jacobian-corrects-posterior"
          ],
          options: [
            [
              "wrap-before-correction",
              true,
              reasonedCase("bearing-wrap-counterexample", "verification"),
              condition("wrapped-angular-residual"),
              [
                "measurement-forms-wrapped-innovation",
                "jacobian-corrects-posterior"
              ],
              ["wrapped-angular-residual", "credible-local-region"],
              null
            ],
            [
              "raw-residual-update",
              false,
              reasonedCase("bearing-wrap-counterexample", "outcome"),
              condition("wrapped-angular-residual"),
              ["measurement-forms-wrapped-innovation"],
              ["wrapped-angular-residual"],
              null
            ],
            [
              "trust-local-equations",
              false,
              misconception("nonlinear-equations-are-enough", "claim"),
              misconception("nonlinear-equations-are-enough", "mechanism"),
              ["jacobian-corrects-posterior"],
              ["current-linearisation-point"],
              "nonlinear-equations-are-enough"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("extended-kalman-linearisation", "label"),
      focusRef: reasonedCase("range-bearing-landmark-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["nonlinear-prior-state", 0, 0],
        ["nonlinear-process-model", 0, 1],
        ["process-jacobian", 1, 1],
        ["ekf-predicted-state", 1, 0],
        ["nonlinear-observation-model", 2, 1],
        ["predicted-observation", 2, 0],
        ["sensor-observation", 3, 0],
        ["observation-jacobian-entity", 3, 1],
        ["wrapped-innovation", 4, 0],
        ["ekf-posterior-state", 5, 0],
        ["finite-difference-check", 4, 1]
      ],
      visibleEntityIds: [
        "nonlinear-prior-state",
        "nonlinear-process-model",
        "process-jacobian",
        "ekf-predicted-state",
        "nonlinear-observation-model",
        "predicted-observation",
        "sensor-observation",
        "observation-jacobian-entity",
        "wrapped-innovation",
        "ekf-posterior-state",
        "finite-difference-check"
      ],
      visibleRelationIds: [
        "process-function-predicts-state",
        "process-jacobian-propagates-covariance",
        "observation-function-predicts-measurement",
        "observation-function-forms-jacobian",
        "measurement-forms-wrapped-innovation",
        "jacobian-corrects-posterior",
        "finite-difference-checks-jacobian"
      ],
      controls: [
        [
          "checked-local-update",
          condition("finite-difference-agreement"),
          [
            "consistent-ekf-contract",
            "current-linearisation-point",
            "wrapped-angular-residual",
            "credible-local-region",
            "finite-difference-agreement"
          ],
          [
            "nonlinear-prior-state",
            "nonlinear-process-model",
            "process-jacobian",
            "ekf-predicted-state",
            "nonlinear-observation-model",
            "predicted-observation",
            "sensor-observation",
            "observation-jacobian-entity",
            "wrapped-innovation",
            "ekf-posterior-state",
            "finite-difference-check"
          ],
          [
            "process-function-predicts-state",
            "process-jacobian-propagates-covariance",
            "observation-function-predicts-measurement",
            "observation-function-forms-jacobian",
            "measurement-forms-wrapped-innovation",
            "jacobian-corrects-posterior",
            "finite-difference-checks-jacobian"
          ],
          [],
          [],
          [
            [
              "checked-tangent",
              "A finite-difference check supports the current observation Jacobian and wrapped local correction.",
              [
                "observation-jacobian-entity",
                "wrapped-innovation",
                "finite-difference-check"
              ],
              [
                "finite-difference-checks-jacobian",
                "jacobian-corrects-posterior"
              ]
            ]
          ],
          reasonedCase("range-bearing-landmark-example", "verification")
        ],
        [
          "unwrapped-bearing-failure",
          condition("wrapped-angular-residual"),
          ["wrapped-angular-residual"],
          [
            "ekf-predicted-state",
            "predicted-observation",
            "sensor-observation",
            "observation-jacobian-entity",
            "wrapped-innovation",
            "ekf-posterior-state"
          ],
          [
            "observation-function-predicts-measurement",
            "measurement-forms-wrapped-innovation",
            "jacobian-corrects-posterior"
          ],
          ["finite-difference-checks-jacobian"],
          [],
          [
            [
              "branch-cut-jump",
              "Raw bearing subtraction produces a near-full-revolution innovation across the angular branch cut.",
              ["predicted-observation", "sensor-observation", "wrapped-innovation"],
              ["measurement-forms-wrapped-innovation"]
            ]
          ],
          reasonedCase("bearing-wrap-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D19-L07",
    systemModel:
      "Fusion validation compares estimated state and declared covariance with held-out truth, innovation statistics, timing records and labelled fault responses across repeated representative runs.",
    failurePattern:
      "Low average error can conceal false confidence, correlated innovations, timestamp bias, rare divergence or a fault mode that the estimator silently absorbs.",
    visualExplanation:
      "Aligned truth and fused trajectories feed error, consistency, timing and fault-response evidence into separate acceptance criteria rather than one reassuring average.",
    applicationTask:
      "Validate a fused mobile-robot trajectory over repeated runs, reconcile state error with declared uncertainty and diagnose one timing offset plus one injected sensor fault.",
    terms: [
      [
        "fusion-validation-evidence",
        "Fusion validation evidence",
        "The retained truth, estimate, covariance, innovation, timing and fault-response records needed to test an estimator claim.",
        "Evidence is valid only for its declared operating conditions, sampling, reference quality and acceptance criteria.",
        "declare-validation-contract"
      ],
      [
        "innovation-consistency",
        "Innovation consistency",
        "Agreement between measurement residual behaviour and the innovation covariance predicted by the fusion model.",
        "A plausible mean innovation is insufficient when scale, serial correlation, tails or operating-condition dependence disagree.",
        "test-innovation-consistency"
      ],
      [
        "normalised-innovation-squared",
        "Normalised innovation squared",
        "A dimensionless quadratic innovation statistic formed using the inverse predicted innovation covariance.",
        "Its interpretation requires declared measurement dimension, distribution assumptions, confidence rule and sampling window.",
        "test-innovation-consistency"
      ],
      [
        "fault-injection-coverage",
        "Fault-injection coverage",
        "The explicit set of sensor dropouts, delays, biases and other faults exercised with labelled onset, duration and expected estimator response.",
        "Injected faults demonstrate only the tested magnitudes, timings and operating conditions.",
        "exercise-fault-injection"
      ]
    ],
    entities: [
      [
        "fused-estimate",
        "state",
        "Fused trajectory estimate",
        "The time-stamped robot state estimate and covariance produced on every validation run."
      ],
      [
        "held-out-truth",
        "observation",
        "Held-out trajectory truth",
        "An independent time-stamped reference trajectory with declared accuracy and frame."
      ],
      [
        "trajectory-error",
        "observation",
        "Aligned trajectory error",
        "The signed state difference after estimate and truth are aligned in time, frame and units."
      ],
      [
        "innovation-log",
        "observation",
        "Innovation sequence log",
        "The ordered measurement residuals retained before each fusion correction."
      ],
      [
        "predicted-innovation-covariance",
        "observation",
        "Predicted innovation covariance",
        "The modelled residual covariance paired with every logged innovation."
      ],
      [
        "consistency-metric",
        "criterion",
        "Innovation consistency metric",
        "The normalised innovation squared and serial-correlation evidence evaluated against declared rules."
      ],
      [
        "timing-record",
        "observation",
        "Timing alignment record",
        "The source timestamps, clock offsets, arrival latency and interpolation decisions used for comparison."
      ],
      [
        "fault-schedule",
        "input",
        "Labelled fault schedule",
        "The injected sensor fault type, onset, duration, magnitude and affected data stream."
      ],
      [
        "faulted-estimator-output",
        "observation",
        "Faulted fusion output",
        "The estimator state, covariance, health response and recovery behaviour during each injected fault."
      ],
      [
        "acceptance-decision",
        "decision",
        "Fusion acceptance decision",
        "The evidence-linked decision for the declared operating envelope, including failures and exclusions."
      ],
      [
        "run-population",
        "input",
        "Repeated validation population",
        "The controlled set of routes, speeds, initial states, environments and random seeds used across runs."
      ]
    ],
    relations: [
      [
        "truth-forms-state-error",
        "compares",
        ["fused-estimate", "held-out-truth"],
        ["trajectory-error"],
        "time-aligned held-out truth and fused estimate form signed trajectory error",
        "directed",
        "many-to-one"
      ],
      [
        "innovation-forms-consistency",
        "compares",
        ["innovation-log", "predicted-innovation-covariance"],
        ["consistency-metric"],
        "innovation and predicted covariance form dimensionless consistency evidence",
        "directed",
        "many-to-one"
      ],
      [
        "timing-explains-state-error",
        "supports",
        ["timing-record", "fused-estimate"],
        ["trajectory-error"],
        "timing alignment evidence explains whether apparent trajectory error includes clock bias",
        "directed",
        "many-to-one"
      ],
      [
        "fault-schedule-perturbs-estimator",
        "causes",
        ["fault-schedule", "fused-estimate"],
        ["faulted-estimator-output"],
        "the labelled fault schedule perturbs the fusion input and exposes estimator response",
        "directed",
        "many-to-one"
      ],
      [
        "faulted-output-tests-acceptance",
        "supports",
        ["faulted-estimator-output", "held-out-truth"],
        ["acceptance-decision"],
        "fault response and held-out truth support or reject robustness acceptance",
        "directed",
        "many-to-one"
      ],
      [
        "error-supports-acceptance",
        "supports",
        ["trajectory-error"],
        ["acceptance-decision"],
        "trajectory error supports the declared accuracy portion of the acceptance decision",
        "directed",
        "one-to-one"
      ],
      [
        "consistency-supports-acceptance",
        "supports",
        ["consistency-metric"],
        ["acceptance-decision"],
        "innovation consistency supports the declared covariance-calibration portion of acceptance",
        "directed",
        "one-to-one"
      ],
      [
        "population-constrains-decision",
        "constrains",
        ["run-population"],
        ["acceptance-decision"],
        "the repeated validation population bounds the operating envelope supported by the decision",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "independent-held-out-reference",
        "boundary",
        "Trajectory truth is independent of fusion inputs and has quantified accuracy, timestamps, frame and compatible SI units.",
        ["fused-estimate", "held-out-truth", "trajectory-error"],
        ["truth-forms-state-error", "error-supports-acceptance"]
      ],
      [
        "declared-consistency-contract",
        "criterion",
        "Innovation metric definition, measurement dimension, covariance convention, confidence rule, sampling window and serial-correlation check are declared before evaluation.",
        [
          "innovation-log",
          "predicted-innovation-covariance",
          "consistency-metric",
          "acceptance-decision"
        ],
        ["innovation-forms-consistency", "consistency-supports-acceptance"]
      ],
      [
        "time-aligned-validation",
        "boundary",
        "Estimate, truth, innovation and fault labels use reconciled clocks, explicit latency treatment and one interpolation policy.",
        [
          "fused-estimate",
          "held-out-truth",
          "trajectory-error",
          "innovation-log",
          "timing-record",
          "fault-schedule"
        ],
        [
          "truth-forms-state-error",
          "timing-explains-state-error",
          "fault-schedule-perturbs-estimator"
        ]
      ],
      [
        "representative-run-coverage",
        "criterion",
        "Repeated runs cover the declared routes, speeds, initial uncertainty, environments and random variation without reporting only favourable trials.",
        [
          "fused-estimate",
          "held-out-truth",
          "trajectory-error",
          "consistency-metric",
          "run-population",
          "acceptance-decision"
        ],
        [
          "truth-forms-state-error",
          "innovation-forms-consistency",
          "population-constrains-decision"
        ]
      ],
      [
        "labelled-fault-injection",
        "criterion",
        "Every injected fault has a recorded type, stream, onset, duration, magnitude, expected response and recovery criterion.",
        [
          "fault-schedule",
          "faulted-estimator-output",
          "held-out-truth",
          "acceptance-decision"
        ],
        [
          "fault-schedule-perturbs-estimator",
          "faulted-output-tests-acceptance"
        ]
      ]
    ],
    failureBoundary: [
      "low-average-error-masks-inconsistency",
      "declared-consistency-contract",
      "A few favourable runs produce low average trajectory error while covariance is too narrow, innovations are correlated and a rare divergence is averaged away.",
      "The fusion result appears accurate yet reports unjustified confidence and fails without a reliable diagnostic boundary.",
      "Reject acceptance until repeated-run error, innovation consistency, timing and labelled fault response each satisfy their predeclared criteria.",
      [
        "fused-estimate",
        "held-out-truth",
        "trajectory-error",
        "innovation-log",
        "predicted-innovation-covariance",
        "consistency-metric",
        "faulted-estimator-output",
        "acceptance-decision",
        "run-population"
      ],
      [
        "truth-forms-state-error",
        "innovation-forms-consistency",
        "faulted-output-tests-acceptance",
        "error-supports-acceptance",
        "consistency-supports-acceptance",
        "population-constrains-decision"
      ]
    ],
    conceptualModel: [
      [
        "declare-validation-contract",
        "Declare the fusion claim, held-out truth quality, operating population, metrics, thresholds and exclusions before analysing results.",
        [
          "fused-estimate",
          "held-out-truth",
          "acceptance-decision",
          "run-population"
        ],
        ["population-constrains-decision"],
        [
          "independent-held-out-reference",
          "declared-consistency-contract",
          "representative-run-coverage"
        ]
      ],
      [
        "align-held-out-truth",
        "Align fused estimate and independent truth using reconciled frames, units and timing records.",
        ["fused-estimate", "held-out-truth", "trajectory-error", "timing-record"],
        ["truth-forms-state-error", "timing-explains-state-error"],
        ["independent-held-out-reference", "time-aligned-validation"]
      ],
      [
        "compute-trajectory-error",
        "Compute signed trajectory error per state component, run and operating condition before aggregation.",
        ["fused-estimate", "held-out-truth", "trajectory-error", "run-population"],
        ["truth-forms-state-error"],
        ["representative-run-coverage"]
      ],
      [
        "test-innovation-consistency",
        "Pair each innovation with predicted covariance, compute the normalised statistic and inspect serial correlation.",
        [
          "innovation-log",
          "predicted-innovation-covariance",
          "consistency-metric"
        ],
        ["innovation-forms-consistency"],
        ["declared-consistency-contract"]
      ],
      [
        "audit-timing-record",
        "Test whether timestamp offset, latency or interpolation explains structured state error or innovation.",
        ["timing-record", "fused-estimate", "trajectory-error", "innovation-log"],
        ["timing-explains-state-error"],
        ["time-aligned-validation"]
      ],
      [
        "exercise-fault-injection",
        "Run the labelled dropout, delay and bias schedule while retaining fusion output, health response and recovery.",
        ["fault-schedule", "fused-estimate", "faulted-estimator-output"],
        ["fault-schedule-perturbs-estimator"],
        ["labelled-fault-injection", "representative-run-coverage"]
      ],
      [
        "issue-acceptance-decision",
        "Accept only the operating envelope supported jointly by error, consistency, timing, fault-response and population evidence.",
        [
          "trajectory-error",
          "consistency-metric",
          "timing-record",
          "faulted-estimator-output",
          "held-out-truth",
          "acceptance-decision",
          "run-population"
        ],
        [
          "faulted-output-tests-acceptance",
          "error-supports-acceptance",
          "consistency-supports-acceptance",
          "population-constrains-decision"
        ],
        [
          "declared-consistency-contract",
          "representative-run-coverage",
          "labelled-fault-injection"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "repeated-run-validation-example",
        kind: "example",
        scenario:
          "A mobile-robot fusion stack is evaluated over repeated held-out routes with truth, innovations, timing records and labelled sensor faults.",
        changedConditionIds: ["representative-run-coverage"],
        givens: [
          [
            "truth-dataset",
            "Held-out trajectory",
            "independent pose reference across declared routes and speeds",
            "m and rad",
            "held-out-truth"
          ],
          [
            "fusion-dataset",
            "Estimator records",
            "state, covariance, innovations and timestamps for every run",
            "mixed SI units and squared units",
            "fused-estimate"
          ],
          [
            "fault-dataset",
            "Fault campaign",
            "labelled dropout, delay and bias intervals",
            null,
            "fault-schedule"
          ]
        ],
        reasoningSteps: [
          [
            "example-align",
            "Independent truth and fused trajectories are aligned using the retained timing record before state error is computed.",
            ["fused-estimate", "held-out-truth", "trajectory-error", "timing-record"],
            ["truth-forms-state-error", "timing-explains-state-error"],
            ["independent-held-out-reference", "time-aligned-validation"]
          ],
          [
            "example-consistency",
            "Each innovation is paired with predicted covariance to form normalised and serial-correlation evidence.",
            [
              "innovation-log",
              "predicted-innovation-covariance",
              "consistency-metric"
            ],
            ["innovation-forms-consistency"],
            ["declared-consistency-contract"]
          ],
          [
            "example-faults",
            "The labelled schedule perturbs sensor evidence while estimator output, health flags and recovery are retained.",
            ["fault-schedule", "fused-estimate", "faulted-estimator-output"],
            ["fault-schedule-perturbs-estimator"],
            ["labelled-fault-injection"]
          ],
          [
            "example-decide",
            "Accuracy, consistency and fault-response results are reconciled against the repeated validation population.",
            [
              "trajectory-error",
              "consistency-metric",
              "faulted-estimator-output",
              "held-out-truth",
              "acceptance-decision",
              "run-population"
            ],
            [
              "faulted-output-tests-acceptance",
              "error-supports-acceptance",
              "consistency-supports-acceptance",
              "population-constrains-decision"
            ],
            ["representative-run-coverage", "labelled-fault-injection"]
          ]
        ],
        outcome:
          "The acceptance decision states the supported operating envelope and retains failed runs instead of replacing them with one average.",
        criterionConditionId: "representative-run-coverage",
        criterion:
          "All declared operating conditions, random variation and labelled faults contribute to the evidence and reported exclusions.",
        verification:
          "Recompute sampled trajectory errors and innovation metrics independently, audit timestamp alignment and reproduce each fault interval from the schedule."
      },
      {
        id: "smooth-inconsistent-counterexample",
        kind: "counterexample",
        scenario:
          "A fused trajectory looks smooth and has low average position error, but its covariance is narrow, innovations are correlated and one delayed-sensor run diverges.",
        changedConditionIds: ["declared-consistency-contract"],
        givens: [
          [
            "low-average-error",
            "Aggregate trajectory result",
            "small reported mean error across selected runs",
            "m",
            "trajectory-error"
          ],
          [
            "optimistic-innovation-covariance",
            "Fusion uncertainty",
            "predicted innovation covariance narrower than observed residual variation",
            "measurement unit squared",
            "predicted-innovation-covariance"
          ],
          [
            "delayed-run",
            "Timing fault",
            "one labelled sensor-delay interval precedes divergence",
            "s",
            "timing-record"
          ]
        ],
        reasoningSteps: [
          [
            "counter-average",
            "The aggregate trajectory error hides the distribution across runs and the delayed failure interval.",
            ["trajectory-error", "run-population", "acceptance-decision"],
            ["error-supports-acceptance", "population-constrains-decision"],
            ["representative-run-coverage"]
          ],
          [
            "counter-consistency",
            "Innovation scale and serial correlation disagree with the predicted covariance and declared consistency rule.",
            [
              "innovation-log",
              "predicted-innovation-covariance",
              "consistency-metric"
            ],
            ["innovation-forms-consistency"],
            ["declared-consistency-contract"]
          ],
          [
            "counter-timing",
            "The timing record links a sensor delay to structured state error before the divergence.",
            ["timing-record", "fused-estimate", "trajectory-error"],
            ["timing-explains-state-error"],
            ["time-aligned-validation"]
          ],
          [
            "counter-reject",
            "The low-error claim is rejected because consistency and delayed-fault evidence fail the predeclared acceptance contract.",
            [
              "trajectory-error",
              "consistency-metric",
              "faulted-estimator-output",
              "acceptance-decision"
            ],
            [
              "error-supports-acceptance",
              "consistency-supports-acceptance",
              "faulted-output-tests-acceptance"
            ],
            ["declared-consistency-contract", "labelled-fault-injection"]
          ]
        ],
        outcome:
          "A visually smooth estimate is rejected because its uncertainty is inconsistent and a labelled timing fault exposes rare divergence.",
        criterionConditionId: "declared-consistency-contract",
        criterion:
          "Fusion acceptance requires declared innovation scale and correlation checks in addition to aggregate trajectory error.",
        verification:
          "Restore every run, align the delayed interval, recompute innovation statistics and compare failures with the unchanged acceptance rules."
      }
    ],
    misconception: {
      id: "low-error-proves-fusion",
      claim:
        "Low average trajectory error proves that a sensor-fusion estimator is valid.",
      mechanism:
        "Averages can hide narrow covariance, correlated innovations, timestamp bias, rare divergence and untested fault behaviour.",
      correction:
        "Validate held-out state error, innovation consistency, timing and labelled faults across a representative repeated-run population.",
      disconfirmingObservation:
        "Average error remains low while normalised innovations violate the declared rule or one labelled delay produces a high-confidence divergence.",
      entityIds: [
        "fused-estimate",
        "held-out-truth",
        "trajectory-error",
        "innovation-log",
        "predicted-innovation-covariance",
        "consistency-metric",
        "timing-record",
        "fault-schedule",
        "faulted-estimator-output",
        "acceptance-decision",
        "run-population"
      ],
      relationIds: [
        "truth-forms-state-error",
        "innovation-forms-consistency",
        "timing-explains-state-error",
        "fault-schedule-perturbs-estimator",
        "faulted-output-tests-acceptance",
        "error-supports-acceptance",
        "consistency-supports-acceptance",
        "population-constrains-decision"
      ],
      conditionIds: [
        "independent-held-out-reference",
        "declared-consistency-contract",
        "time-aligned-validation",
        "representative-run-coverage",
        "labelled-fault-injection"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the fusion validation workflow from held-out truth to acceptance decision:",
            "The validation sequence aligns trajectory truth, tests innovation consistency, audits timing and exercises fault injection.",
            "The validation sequence accepts average trajectory error before inspecting covariance or repeated runs.",
            [
              "Begin by declaring the repeated validation population.",
              "Align the fused estimate with independent held-out truth."
            ],
            [
              "Compute trajectory error and innovation consistency separately.",
              "Finish with timing, fault and acceptance evidence."
            ]
          ],
          focusRef: reasonedCase("repeated-run-validation-example", "scenario"),
          contextConditionIds: [
            "independent-held-out-reference",
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          steps: [
            [
              "bound-population",
              ["population-constrains-decision"],
              ["representative-run-coverage"]
            ],
            [
              "align-truth",
              ["truth-forms-state-error", "timing-explains-state-error"],
              ["independent-held-out-reference", "time-aligned-validation"]
            ],
            [
              "test-consistency",
              ["innovation-forms-consistency", "consistency-supports-acceptance"],
              ["declared-consistency-contract"]
            ],
            [
              "inject-faults",
              ["fault-schedule-perturbs-estimator"],
              ["labelled-fault-injection"]
            ],
            [
              "decide-envelope",
              ["faulted-output-tests-acceptance", "error-supports-acceptance"],
              ["representative-run-coverage"]
            ]
          ],
          correctOrder: [
            "bound-population",
            "align-truth",
            "test-consistency",
            "inject-faults",
            "decide-envelope"
          ]
        },
        retry: {
          instruction: [
            "Trace the smooth-but-inconsistent fusion result from low average error to rejection:",
            "The retry separates trajectory average, innovation covariance, timing evidence and delayed-fault divergence.",
            "The retry treats the smooth fused estimate as sufficient acceptance evidence.",
            [
              "Start with the reported trajectory error distribution.",
              "Compare innovation scale and correlation with predicted covariance."
            ],
            [
              "Use the timing record to isolate the delayed run.",
              "Reject fusion acceptance when consistency and fault criteria fail."
            ]
          ],
          focusRef: reasonedCase("smooth-inconsistent-counterexample", "scenario"),
          contextConditionIds: [
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          steps: [
            [
              "inspect-average",
              ["error-supports-acceptance"],
              ["representative-run-coverage"]
            ],
            [
              "inspect-innovation",
              ["innovation-forms-consistency"],
              ["declared-consistency-contract"]
            ],
            [
              "inspect-delay",
              ["timing-explains-state-error"],
              ["time-aligned-validation"]
            ],
            [
              "reject-claim",
              [
                "consistency-supports-acceptance",
                "faulted-output-tests-acceptance",
                "population-constrains-decision"
              ],
              ["declared-consistency-contract", "labelled-fault-injection"]
            ]
          ],
          correctOrder: [
            "inspect-average",
            "inspect-innovation",
            "inspect-delay",
            "reject-claim"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a defensible fusion acceptance decision:",
            "The selected validation evidence covers independent truth, innovation consistency, timing and labelled faults.",
            "The selected validation evidence keeps only low average trajectory error from favourable runs.",
            [
              "Choose held-out truth and aligned trajectory error.",
              "Choose innovation plus predicted covariance."
            ],
            [
              "Retain timing records for every fusion run.",
              "Retain labelled fault output and recovery evidence."
            ]
          ],
          focusRef: term("fusion-validation-evidence", "boundary"),
          contextConditionIds: [
            "independent-held-out-reference",
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          options: [
            [
              "held-out-error-evidence",
              true,
              relation("truth-forms-state-error"),
              condition("independent-held-out-reference"),
              ["truth-forms-state-error"],
              ["independent-held-out-reference"],
              null
            ],
            [
              "innovation-consistency-evidence",
              true,
              relation("innovation-forms-consistency"),
              condition("declared-consistency-contract"),
              ["innovation-forms-consistency"],
              ["declared-consistency-contract"],
              null
            ],
            [
              "fault-response-evidence",
              true,
              relation("faulted-output-tests-acceptance"),
              condition("labelled-fault-injection"),
              ["fault-schedule-perturbs-estimator", "faulted-output-tests-acceptance"],
              ["labelled-fault-injection"],
              null
            ],
            [
              "low-average-proof",
              false,
              misconception("low-error-proves-fusion", "claim"),
              misconception("low-error-proves-fusion", "mechanism"),
              ["error-supports-acceptance"],
              ["representative-run-coverage"],
              "low-error-proves-fusion"
            ],
            [
              "selected-run-output",
              false,
              reasonedCase("smooth-inconsistent-counterexample", "outcome"),
              condition("representative-run-coverage"),
              ["population-constrains-decision"],
              ["representative-run-coverage"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the fusion records that expose false confidence and rare divergence:",
            "The diagnostic records bind innovation covariance, timing alignment, run population and fault response.",
            "The diagnostic records preserve only the smooth fused trajectory image.",
            [
              "Inspect normalised innovation and serial correlation.",
              "Inspect timing around the delayed sensor interval."
            ],
            [
              "Restore every repeated validation run.",
              "Link the labelled fault output to acceptance criteria."
            ]
          ],
          focusRef: reasonedCase("smooth-inconsistent-counterexample", "verification"),
          contextConditionIds: [
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          options: [
            [
              "consistency-record",
              true,
              relation("innovation-forms-consistency"),
              condition("declared-consistency-contract"),
              ["innovation-forms-consistency", "consistency-supports-acceptance"],
              ["declared-consistency-contract"],
              null
            ],
            [
              "timing-record-evidence",
              true,
              relation("timing-explains-state-error"),
              condition("time-aligned-validation"),
              ["timing-explains-state-error"],
              ["time-aligned-validation"],
              null
            ],
            [
              "population-record",
              true,
              relation("population-constrains-decision"),
              condition("representative-run-coverage"),
              ["population-constrains-decision"],
              ["representative-run-coverage"],
              null
            ],
            [
              "smooth-output-proof",
              false,
              misconception("low-error-proves-fusion", "claim"),
              misconception("low-error-proves-fusion", "mechanism"),
              ["error-supports-acceptance"],
              ["representative-run-coverage"],
              "low-error-proves-fusion"
            ],
            [
              "unlabelled-failure",
              false,
              reasonedCase("smooth-inconsistent-counterexample", "outcome"),
              condition("labelled-fault-injection"),
              ["faulted-output-tests-acceptance"],
              ["labelled-fault-injection"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each fusion validation evidence stream to its acceptance boundary:",
            "Held-out truth, innovation consistency, timing and fault injection each test a different fusion claim.",
            "A validation record is matched to a boundary that cannot reveal its estimator failure.",
            [
              "Pair trajectory truth with reference independence.",
              "Pair innovation metrics with the consistency contract."
            ],
            [
              "Match timing records to clock alignment.",
              "Match fault schedules to labelled injection."
            ]
          ],
          focusRef: reasonedCase("repeated-run-validation-example", "criterion"),
          contextConditionIds: [
            "independent-held-out-reference",
            "declared-consistency-contract",
            "time-aligned-validation",
            "labelled-fault-injection"
          ],
          pairs: [
            [
              "truth-boundary-pair",
              relation("truth-forms-state-error"),
              condition("independent-held-out-reference"),
              relation("truth-forms-state-error"),
              ["truth-forms-state-error"],
              ["independent-held-out-reference"]
            ],
            [
              "consistency-boundary-pair",
              relation("innovation-forms-consistency"),
              condition("declared-consistency-contract"),
              relation("innovation-forms-consistency"),
              ["innovation-forms-consistency"],
              ["declared-consistency-contract"]
            ],
            [
              "timing-boundary-pair",
              relation("timing-explains-state-error"),
              condition("time-aligned-validation"),
              relation("timing-explains-state-error"),
              ["timing-explains-state-error"],
              ["time-aligned-validation"]
            ],
            [
              "fault-boundary-pair",
              relation("fault-schedule-perturbs-estimator"),
              condition("labelled-fault-injection"),
              relation("fault-schedule-perturbs-estimator"),
              ["fault-schedule-perturbs-estimator"],
              ["labelled-fault-injection"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why low average trajectory error does not prove fusion validity:",
            "The explanation connects held-out error, innovation consistency, timing evidence and fault coverage.",
            "The explanation treats smooth fusion output as calibrated covariance.",
            [
              "Define innovation consistency against predicted covariance.",
              "Explain how timing bias can create trajectory error."
            ],
            [
              "Describe representative repeated validation coverage.",
              "Connect labelled fault output to the acceptance decision."
            ]
          ],
          focusRef: misconception("low-error-proves-fusion", "claim"),
          contextConditionIds: [
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          conceptGroups: [
            [
              "consistency-concept",
              term("innovation-consistency", "label"),
              [
                term("innovation-consistency", "definition"),
                relation("innovation-forms-consistency")
              ],
              ["innovation-forms-consistency"],
              ["declared-consistency-contract"]
            ],
            [
              "normalised-metric-concept",
              term("normalised-innovation-squared", "label"),
              [
                term("normalised-innovation-squared", "definition"),
                condition("declared-consistency-contract")
              ],
              ["consistency-supports-acceptance"],
              ["declared-consistency-contract"]
            ],
            [
              "fault-coverage-concept",
              term("fault-injection-coverage", "label"),
              [
                term("fault-injection-coverage", "definition"),
                relation("faulted-output-tests-acceptance")
              ],
              ["fault-schedule-perturbs-estimator", "faulted-output-tests-acceptance"],
              ["labelled-fault-injection"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["population-constrains-decision"],
          criterionConditionId: "representative-run-coverage"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the held-out trajectory diagram for the fusion accuracy claim:",
            "The diagram implication aligns fused estimate and truth before error supports a bounded acceptance decision.",
            "The diagram implication accepts the fused trajectory without independent truth.",
            [
              "Trace fused estimate and held-out truth into trajectory error.",
              "Keep the trajectory error signed before aggregation."
            ],
            [
              "Identify the truth-to-error comparison.",
              "Choose the acceptance implication bounded by the validation population."
            ]
          ],
          focusRef: reasonedCase("repeated-run-validation-example", "scenario"),
          contextConditionIds: [
            "independent-held-out-reference",
            "time-aligned-validation",
            "representative-run-coverage"
          ],
          positions: [
            ["fused-estimate", 0, 0],
            ["held-out-truth", 0, 1],
            ["trajectory-error", 1, 0],
            ["acceptance-decision", 2, 0]
          ],
          relationIds: [
            "truth-forms-state-error",
            "error-supports-acceptance"
          ],
          answerRelationIds: [
            "truth-forms-state-error",
            "error-supports-acceptance"
          ],
          options: [
            [
              "bounded-accuracy-claim",
              true,
              reasonedCase("repeated-run-validation-example", "verification"),
              condition("independent-held-out-reference"),
              ["truth-forms-state-error", "error-supports-acceptance"],
              ["independent-held-out-reference", "representative-run-coverage"],
              null
            ],
            [
              "low-error-proves-validity",
              false,
              misconception("low-error-proves-fusion", "claim"),
              misconception("low-error-proves-fusion", "mechanism"),
              ["error-supports-acceptance"],
              ["representative-run-coverage"],
              "low-error-proves-fusion"
            ],
            [
              "omit-held-out-truth",
              false,
              reasonedCase("smooth-inconsistent-counterexample", "outcome"),
              condition("independent-held-out-reference"),
              ["truth-forms-state-error"],
              ["independent-held-out-reference"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the innovation diagram for the smooth but inconsistent fusion result:",
            "The counterexample implication combines innovation and predicted covariance before consistency constrains acceptance.",
            "The counterexample implication substitutes smooth trajectory appearance for innovation covariance evidence.",
            [
              "Pair every innovation with its predicted covariance.",
              "Inspect normalised innovation and serial correlation together."
            ],
            [
              "Identify the innovation-to-consistency relation.",
              "Choose the acceptance implication that rejects false confidence."
            ]
          ],
          focusRef: reasonedCase("smooth-inconsistent-counterexample", "scenario"),
          contextConditionIds: [
            "declared-consistency-contract",
            "representative-run-coverage"
          ],
          positions: [
            ["innovation-log", 0, 0],
            ["predicted-innovation-covariance", 0, 1],
            ["consistency-metric", 1, 0],
            ["acceptance-decision", 2, 0]
          ],
          relationIds: [
            "innovation-forms-consistency",
            "consistency-supports-acceptance"
          ],
          answerRelationIds: [
            "innovation-forms-consistency",
            "consistency-supports-acceptance"
          ],
          options: [
            [
              "reject-false-confidence",
              true,
              reasonedCase("smooth-inconsistent-counterexample", "verification"),
              condition("declared-consistency-contract"),
              [
                "innovation-forms-consistency",
                "consistency-supports-acceptance"
              ],
              ["declared-consistency-contract", "representative-run-coverage"],
              null
            ],
            [
              "smooth-path-acceptance",
              false,
              misconception("low-error-proves-fusion", "claim"),
              misconception("low-error-proves-fusion", "mechanism"),
              ["consistency-supports-acceptance"],
              ["declared-consistency-contract"],
              "low-error-proves-fusion"
            ],
            [
              "ignore-predicted-covariance",
              false,
              reasonedCase("smooth-inconsistent-counterexample", "outcome"),
              condition("declared-consistency-contract"),
              ["innovation-forms-consistency"],
              ["declared-consistency-contract"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("fusion-validation-evidence", "label"),
      focusRef: reasonedCase("repeated-run-validation-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["fused-estimate", 0, 0],
        ["held-out-truth", 0, 1],
        ["trajectory-error", 1, 0],
        ["innovation-log", 1, 1],
        ["predicted-innovation-covariance", 2, 1],
        ["consistency-metric", 3, 1],
        ["timing-record", 2, 0],
        ["fault-schedule", 3, 0],
        ["faulted-estimator-output", 4, 0],
        ["run-population", 4, 1],
        ["acceptance-decision", 5, 0]
      ],
      visibleEntityIds: [
        "fused-estimate",
        "held-out-truth",
        "trajectory-error",
        "innovation-log",
        "predicted-innovation-covariance",
        "consistency-metric",
        "timing-record",
        "fault-schedule",
        "faulted-estimator-output",
        "acceptance-decision",
        "run-population"
      ],
      visibleRelationIds: [
        "truth-forms-state-error",
        "innovation-forms-consistency",
        "timing-explains-state-error",
        "fault-schedule-perturbs-estimator",
        "faulted-output-tests-acceptance",
        "error-supports-acceptance",
        "consistency-supports-acceptance",
        "population-constrains-decision"
      ],
      controls: [
        [
          "complete-validation-evidence",
          condition("representative-run-coverage"),
          [
            "independent-held-out-reference",
            "declared-consistency-contract",
            "time-aligned-validation",
            "representative-run-coverage",
            "labelled-fault-injection"
          ],
          [
            "fused-estimate",
            "held-out-truth",
            "trajectory-error",
            "innovation-log",
            "predicted-innovation-covariance",
            "consistency-metric",
            "timing-record",
            "fault-schedule",
            "faulted-estimator-output",
            "acceptance-decision",
            "run-population"
          ],
          [
            "truth-forms-state-error",
            "innovation-forms-consistency",
            "timing-explains-state-error",
            "fault-schedule-perturbs-estimator",
            "faulted-output-tests-acceptance",
            "error-supports-acceptance",
            "consistency-supports-acceptance",
            "population-constrains-decision"
          ],
          [],
          [],
          [
            [
              "evidence-envelope",
              "Accuracy, consistency, timing and fault evidence jointly bound the supported fusion envelope.",
              [
                "trajectory-error",
                "consistency-metric",
                "faulted-estimator-output",
                "acceptance-decision"
              ],
              [
                "error-supports-acceptance",
                "consistency-supports-acceptance",
                "faulted-output-tests-acceptance"
              ]
            ]
          ],
          reasonedCase("repeated-run-validation-example", "verification")
        ],
        [
          "average-error-only",
          condition("declared-consistency-contract"),
          ["declared-consistency-contract"],
          [
            "fused-estimate",
            "held-out-truth",
            "trajectory-error",
            "acceptance-decision",
            "run-population"
          ],
          [
            "truth-forms-state-error",
            "error-supports-acceptance",
            "population-constrains-decision"
          ],
          [
            "innovation-forms-consistency",
            "timing-explains-state-error",
            "fault-schedule-perturbs-estimator",
            "faulted-output-tests-acceptance",
            "consistency-supports-acceptance"
          ],
          [],
          [
            [
              "hidden-inconsistency",
              "Low average trajectory error hides innovation inconsistency, timing bias and delayed-fault divergence.",
              ["trajectory-error", "acceptance-decision", "run-population"],
              ["error-supports-acceptance", "population-constrains-decision"]
            ]
          ],
          reasonedCase("smooth-inconsistent-counterexample", "verification")
        ]
      ]
    }
  }
] satisfies readonly AcademyLessonTeachingProfileV2CompactPlan[];

const lessonIds = [
  "EML-E3-D19-L01",
  "EML-E3-D19-L02",
  "EML-E3-D19-L03",
  "EML-E3-D19-L04",
  "EML-E3-D19-L05",
  "EML-E3-D19-L06",
  "EML-E3-D19-L07"
] as const;

const seedRegistry =
  materialiseAcademyLessonTeachingProfileV2Registry(
    lessonIds,
    compactPlans
  );

export const academyLessonTeachingProfilesV2E3D19 =
  Object.freeze(Object.fromEntries(lessonIds.map((lessonId) => {
    const seed = seedRegistry[lessonId];
    if (!seed) throw new Error(`Missing V2 profile seed ${lessonId}.`);
    return [
      lessonId,
      expandAcademyLessonTeachingProfileV2Seed(seed)
    ];
  }))) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D19;
