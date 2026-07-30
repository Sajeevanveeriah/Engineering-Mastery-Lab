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
    lessonId: "EML-E3-D17-L01",
    systemModel:
      "A robot architecture allocates mission functions across sensing, computation, actuation, power and a defined safe state through explicit interfaces.",
    failurePattern:
      "A complete parts list can still fail as a robot when interface ownership, data timing, energy flow or safe-state behaviour is undefined.",
    visualExplanation:
      "A directed architecture graph carries mission demand through the sensor path and compute coordinator to the actuator chain, with a separate route to the safe state.",
    applicationTask:
      "Allocate a mobile-robot inspection mission to components, name every energy and information interface and trace the response to stale sensing and lost actuation.",
    terms: [
      [
        "functional-architecture",
        "Functional robot architecture",
        "An allocation of robot functions, responsibilities and interfaces to physical and software elements.",
        "A component inventory without responsibility or interface definitions is outside this term.",
        "allocate-functions"
      ],
      [
        "safe-interface",
        "Safe robot interface",
        "A robot boundary that specifies exchanged energy or information and the behaviour required when that exchange becomes invalid.",
        "An undocumented connection or an assumed fault response is outside this boundary.",
        "bind-interfaces"
      ]
    ],
    entities: [
      [
        "mission-demand",
        "input",
        "Robot mission demand",
        "The bounded inspection outcome the robot must deliver."
      ],
      [
        "sensor-path",
        "component",
        "Robot sensor path",
        "The sensing components and acquisition path that observe the environment."
      ],
      [
        "compute-coordinator",
        "mechanism",
        "Robot compute coordinator",
        "The software and compute responsibility that turns observations into bounded commands."
      ],
      [
        "actuator-chain",
        "component",
        "Robot actuator chain",
        "The drive, transmission and mechanism that produce physical motion."
      ],
      [
        "safe-state",
        "decision",
        "Robot safe state",
        "The declared motion and energy state entered when an essential interface becomes invalid."
      ]
    ],
    relations: [
      [
        "mission-allocates-sensing",
        "routes",
        ["mission-demand"],
        ["sensor-path"],
        "the robot mission allocates observation duties to the sensor path",
        "directed",
        "one-to-one"
      ],
      [
        "sensing-feeds-compute",
        "routes",
        ["sensor-path"],
        ["compute-coordinator"],
        "timestamped robot observations feed the compute coordinator",
        "directed",
        "many-to-one"
      ],
      [
        "compute-commands-actuation",
        "causes",
        ["compute-coordinator"],
        ["actuator-chain"],
        "bounded robot commands cause the actuator chain to move",
        "directed",
        "one-to-many"
      ],
      [
        "actuation-serves-mission",
        "supports",
        ["actuator-chain"],
        ["mission-demand"],
        "verified robot motion supports the inspection mission",
        "directed",
        "many-to-one"
      ],
      [
        "interface-invokes-safe-state",
        "causes",
        ["sensor-path", "actuator-chain"],
        ["safe-state"],
        "an invalid essential robot interface invokes the safe state",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "nominal-power",
        "operating-state",
        "Robot supply and drive power remain inside their declared operating envelopes.",
        ["actuator-chain"],
        ["compute-commands-actuation", "actuation-serves-mission"]
      ],
      [
        "bounded-interface-latency",
        "boundary",
        "Every robot observation and command reaches its consumer within the declared interface age.",
        ["sensor-path", "compute-coordinator"],
        ["sensing-feeds-compute", "compute-commands-actuation"]
      ],
      [
        "safe-trigger-defined",
        "criterion",
        "Loss or invalidity of an essential robot interface produces the declared safe state.",
        ["sensor-path", "actuator-chain", "safe-state"],
        ["interface-invokes-safe-state"]
      ]
    ],
    failureBoundary: [
      "stale-command-architecture",
      "bounded-interface-latency",
      "A delayed sensor observation is treated as current and the compute coordinator issues an obsolete motion command.",
      "The actuator chain moves after the observed hazard has already changed.",
      "Reject the architecture unless interface age is checked before motion and invalid age invokes the safe state.",
      ["sensor-path", "compute-coordinator", "actuator-chain", "safe-state"],
      [
        "sensing-feeds-compute",
        "compute-commands-actuation",
        "interface-invokes-safe-state"
      ]
    ],
    conceptualModel: [
      [
        "allocate-functions",
        "Allocate each robot mission function to a named sensing, compute, actuation or safety responsibility.",
        ["mission-demand", "sensor-path"],
        ["mission-allocates-sensing"],
        []
      ],
      [
        "bind-interfaces",
        "Bind the robot sensor path to the compute coordinator with an explicit data and timing interface.",
        ["sensor-path", "compute-coordinator"],
        ["sensing-feeds-compute"],
        ["bounded-interface-latency"]
      ],
      [
        "trace-command",
        "Trace the robot command from computation into the powered actuator chain.",
        ["compute-coordinator", "actuator-chain"],
        ["compute-commands-actuation"],
        ["nominal-power"]
      ],
      [
        "close-mission",
        "Confirm that measured robot motion supports the bounded mission rather than merely producing activity.",
        ["actuator-chain", "mission-demand"],
        ["actuation-serves-mission"],
        ["nominal-power"]
      ],
      [
        "trace-safe-state",
        "Route every invalid essential robot interface to the declared safe state.",
        ["sensor-path", "actuator-chain", "safe-state"],
        ["interface-invokes-safe-state"],
        ["safe-trigger-defined"]
      ]
    ],
    reasonedCases: [
      {
        id: "inspection-architecture",
        kind: "example",
        scenario:
          "An inspection robot receives timestamped range observations, computes a bounded speed command and stops when observation age exceeds its interface boundary.",
        changedConditionIds: ["nominal-power"],
        givens: [
          [
            "inspection-mode",
            "Robot operating mode",
            "Powered inspection with interface-age supervision",
            null,
            "mission-demand"
          ]
        ],
        reasoningSteps: [
          [
            "inspection-observe",
            "The robot mission assigns hazard observation to the sensor path.",
            ["mission-demand", "sensor-path"],
            ["mission-allocates-sensing"],
            ["nominal-power"]
          ],
          [
            "inspection-compute",
            "The compute coordinator accepts only observations inside the interface-age boundary.",
            ["sensor-path", "compute-coordinator"],
            ["sensing-feeds-compute"],
            ["bounded-interface-latency"]
          ],
          [
            "inspection-stop",
            "An invalid observation age invokes the robot safe state before further actuation.",
            ["compute-coordinator", "actuator-chain", "safe-state"],
            ["compute-commands-actuation", "interface-invokes-safe-state"],
            ["safe-trigger-defined"]
          ]
        ],
        outcome:
          "The inspection architecture preserves mission flow while making stale-data behaviour explicit.",
        criterionConditionId: "safe-trigger-defined",
        criterion:
          "The safe-state route must remain effective whenever an essential robot interface becomes invalid.",
        verification:
          "Trace a nominal observation and a stale observation through every robot interface and compare the resulting actuator states."
      },
      {
        id: "parts-list-counterexample",
        kind: "counterexample",
        scenario:
          "A robot parts list connects a range sensor, processor and drive but assigns no timestamp owner or stale-command response.",
        changedConditionIds: ["bounded-interface-latency"],
        givens: [
          [
            "unowned-age",
            "Robot interface record",
            "Observation age is neither carried nor checked",
            null,
            "sensor-path"
          ]
        ],
        reasoningSteps: [
          [
            "counter-route",
            "The robot sensor path still routes values to computation, so connectivity alone appears successful.",
            ["sensor-path", "compute-coordinator"],
            ["sensing-feeds-compute"],
            ["bounded-interface-latency"]
          ],
          [
            "counter-command",
            "The compute coordinator cannot distinguish a current observation from a stale one.",
            ["compute-coordinator", "actuator-chain"],
            ["compute-commands-actuation"],
            ["bounded-interface-latency"]
          ],
          [
            "counter-safe",
            "The undefined age fault cannot reliably invoke the robot safe state.",
            ["sensor-path", "safe-state"],
            ["interface-invokes-safe-state"],
            ["safe-trigger-defined"]
          ]
        ],
        outcome:
          "The connected components do not form a defensible functional robot architecture.",
        criterionConditionId: "safe-trigger-defined",
        criterion:
          "An essential interface fault must have an owner, an observable boundary and a verified safe response.",
        verification:
          "Delay one robot observation beyond its declared age and observe whether computation blocks motion and enters the safe state."
      }
    ],
    misconception: {
      id: "parts-list-is-architecture",
      claim:
        "A complete robot component list is already a functional architecture.",
      mechanism:
        "The list names hardware but omits interface ownership, timing, energy flow and safe-state causality.",
      correction:
        "Allocate robot responsibilities, define each interface boundary and trace nominal and fault paths to mission and safety outcomes.",
      disconfirmingObservation:
        "The listed robot continues an obsolete command because no component owns observation age.",
      entityIds: [
        "mission-demand",
        "sensor-path",
        "compute-coordinator",
        "actuator-chain",
        "safe-state"
      ],
      relationIds: [
        "sensing-feeds-compute",
        "compute-commands-actuation",
        "interface-invokes-safe-state"
      ],
      conditionIds: ["bounded-interface-latency", "safe-trigger-defined"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the functional robot architecture path from mission demand to safe motion:",
            "The robot architecture now connects mission, sensor, compute, actuation and safety responsibilities.",
            "The robot architecture order skips an interface owner or places the safe response after uncontrolled motion.",
            [
              "Begin the robot architecture with mission allocation to the sensor path.",
              "Place the compute interface before the powered actuator chain."
            ],
            [
              "Trace the functional robot architecture through observation and command interfaces.",
              "Finish by checking that an invalid robot interface invokes the safe state."
            ]
          ],
          focusRef: reasonedCase("inspection-architecture", "scenario"),
          contextConditionIds: [
            "nominal-power",
            "bounded-interface-latency"
          ],
          steps: [
            [
              "allocate",
              ["mission-allocates-sensing"],
              ["nominal-power"]
            ],
            [
              "observe",
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"]
            ],
            [
              "command",
              ["compute-commands-actuation"],
              ["nominal-power"]
            ],
            [
              "protect",
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"]
            ]
          ],
          correctOrder: ["allocate", "observe", "command", "protect"]
        },
        retry: {
          instruction: [
            "Rebuild the safe robot interface response after stale sensing is introduced:",
            "The safe robot interface now detects stale sensing before actuator motion persists.",
            "The safe robot interface still treats stale sensor data as a valid compute command.",
            [
              "Start the safe robot interface retry at the bounded sensor age.",
              "Use the architecture fault route before restoring mission actuation."
            ],
            [
              "Invalidate the stale robot observation at the compute boundary.",
              "Route the rejected robot command to the safe state and then verify the mission."
            ]
          ],
          focusRef: reasonedCase("parts-list-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-interface-latency",
            "safe-trigger-defined"
          ],
          steps: [
            [
              "age-check",
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"]
            ],
            [
              "safe-route",
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"]
            ],
            [
              "mission-check",
              ["actuation-serves-mission"],
              ["nominal-power"]
            ]
          ],
          correctOrder: ["age-check", "safe-route", "mission-check"]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select every robot architecture record that demonstrates an owned interface:",
            "The selected robot records bind sensor timing, compute command and safe-state responsibility.",
            "At least one selected robot record is only a component name or an unbounded interface claim.",
            [
              "Look for a robot relation with a named producer and consumer.",
              "Keep the safe interface criterion attached to an observable fault route."
            ],
            [
              "Select the timestamped robot observation route into computation.",
              "Select the robot fault route that invokes the safe state."
            ]
          ],
          focusRef: term("safe-interface", "definition"),
          contextConditionIds: [
            "bounded-interface-latency",
            "safe-trigger-defined"
          ],
          options: [
            [
              "timed-sensing",
              true,
              relation("sensing-feeds-compute"),
              condition("bounded-interface-latency"),
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"],
              null
            ],
            [
              "fault-route",
              true,
              relation("interface-invokes-safe-state"),
              condition("safe-trigger-defined"),
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"],
              null
            ],
            [
              "parts-only",
              false,
              misconception("parts-list-is-architecture", "claim"),
              misconception("parts-list-is-architecture", "mechanism"),
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"],
              "parts-list-is-architecture"
            ],
            [
              "motion-only",
              false,
              reasonedCase("parts-list-counterexample", "outcome"),
              condition("safe-trigger-defined"),
              ["compute-commands-actuation"],
              ["nominal-power", "safe-trigger-defined"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the robot architecture evidence needed before mission motion may resume:",
            "The robot evidence set proves current sensing, bounded computation and powered actuation.",
            "The robot evidence set resumes the architecture without clearing the failed interface.",
            [
              "Require a current robot observation before accepting computation.",
              "Require the safe-state criterion before enabling the actuator chain."
            ],
            [
              "Mark the bounded robot sensor-to-compute route as necessary.",
              "Add verified robot motion support for the mission only after safety clears."
            ]
          ],
          focusRef: reasonedCase("inspection-architecture", "verification"),
          contextConditionIds: [
            "safe-trigger-defined",
            "nominal-power"
          ],
          options: [
            [
              "current-observation",
              true,
              condition("bounded-interface-latency"),
              relation("sensing-feeds-compute"),
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"],
              null
            ],
            [
              "powered-command",
              true,
              relation("compute-commands-actuation"),
              condition("nominal-power"),
              ["compute-commands-actuation"],
              ["nominal-power"],
              null
            ],
            [
              "mission-evidence",
              true,
              relation("actuation-serves-mission"),
              condition("nominal-power"),
              ["actuation-serves-mission"],
              ["nominal-power"],
              null
            ],
            [
              "inventory-claim",
              false,
              misconception("parts-list-is-architecture", "claim"),
              misconception("parts-list-is-architecture", "mechanism"),
              ["mission-allocates-sensing"],
              ["safe-trigger-defined"],
              "parts-list-is-architecture"
            ],
            [
              "uncleared-fault",
              false,
              reasonedCase("parts-list-counterexample", "verification"),
              condition("safe-trigger-defined"),
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain why the robot parts list fails the functional architecture boundary:",
            "The robot explanation links interface ownership, bounded latency and the safe-state criterion.",
            "The robot explanation repeats components but omits the architecture mechanism or fault boundary.",
            [
              "Name the functional robot architecture allocation before discussing hardware.",
              "Connect the safe robot interface to stale-data detection."
            ],
            [
              "Explain how the robot sensor path feeds the compute coordinator.",
              "Apply the robot safe-state criterion when interface age becomes invalid."
            ]
          ],
          focusRef: reasonedCase("parts-list-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-interface-latency",
            "safe-trigger-defined"
          ],
          conceptGroups: [
            [
              "architecture-allocation",
              term("functional-architecture", "label"),
              [
                term("functional-architecture", "definition"),
                relation("mission-allocates-sensing")
              ],
              ["mission-allocates-sensing"],
              ["nominal-power"]
            ],
            [
              "timed-interface",
              term("safe-interface", "label"),
              [
                term("safe-interface", "definition"),
                condition("bounded-interface-latency")
              ],
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"]
            ],
            [
              "safe-response",
              condition("safe-trigger-defined"),
              [
                relation("interface-invokes-safe-state"),
                condition("safe-trigger-defined")
              ],
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["sensing-feeds-compute"],
          criterionConditionId: "safe-trigger-defined"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each robot architecture responsibility to its controlling interface boundary:",
            "Every robot responsibility is paired with the interface condition that makes it defensible.",
            "A robot responsibility is matched to a condition that cannot constrain its architecture path.",
            [
              "Pair robot sensing with its interface-age boundary.",
              "Pair robot actuation with its power and safe-state controls."
            ],
            [
              "Match the sensor-to-compute robot route with bounded latency.",
              "Match the interface fault route with the robot safe-state criterion."
            ]
          ],
          focusRef: reasonedCase("inspection-architecture", "verification"),
          contextConditionIds: [
            "nominal-power",
            "bounded-interface-latency",
            "safe-trigger-defined"
          ],
          pairs: [
            [
              "sensing-boundary",
              relation("sensing-feeds-compute"),
              condition("bounded-interface-latency"),
              relation("sensing-feeds-compute"),
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"]
            ],
            [
              "actuation-boundary",
              relation("compute-commands-actuation"),
              condition("nominal-power"),
              relation("compute-commands-actuation"),
              ["compute-commands-actuation"],
              ["nominal-power"]
            ],
            [
              "safety-boundary",
              relation("interface-invokes-safe-state"),
              condition("safe-trigger-defined"),
              relation("interface-invokes-safe-state"),
              ["interface-invokes-safe-state"],
              ["safe-trigger-defined"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Interpret the robot architecture graph when observation age exceeds the interface boundary:",
            "The robot graph correctly routes the invalid observation to the safe state before further motion.",
            "The robot graph implication keeps an obsolete compute command active or bypasses safety.",
            [
              "Follow the robot sensor path into the compute coordinator.",
              "Use the safe robot interface criterion at the invalid-age branch."
            ],
            [
              "Identify the robot relation invalidated by stale sensing.",
              "Choose the robot implication that invokes safety before actuation resumes."
            ]
          ],
          focusRef: reasonedCase("parts-list-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-interface-latency",
            "safe-trigger-defined"
          ],
          positions: [
            ["mission-demand", 0, 0],
            ["sensor-path", 1, 0],
            ["compute-coordinator", 2, 0],
            ["actuator-chain", 3, 0],
            ["safe-state", 2, 1]
          ],
          relationIds: [
            "mission-allocates-sensing",
            "sensing-feeds-compute",
            "compute-commands-actuation",
            "interface-invokes-safe-state"
          ],
          answerRelationIds: ["interface-invokes-safe-state"],
          options: [
            [
              "enter-safe-state",
              true,
              reasonedCase("parts-list-counterexample", "verification"),
              condition("safe-trigger-defined"),
              ["interface-invokes-safe-state"],
              ["bounded-interface-latency", "safe-trigger-defined"],
              null
            ],
            [
              "continue-motion",
              false,
              misconception("parts-list-is-architecture", "claim"),
              misconception("parts-list-is-architecture", "mechanism"),
              ["compute-commands-actuation"],
              ["bounded-interface-latency"],
              "parts-list-is-architecture"
            ],
            [
              "ignore-age",
              false,
              reasonedCase("parts-list-counterexample", "outcome"),
              condition("bounded-interface-latency"),
              ["sensing-feeds-compute"],
              ["bounded-interface-latency"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Read the recovered robot interface graph before restoring the inspection mission:",
            "The recovered robot graph proves current sensing, bounded command flow and mission-supporting motion.",
            "The recovered robot graph restores actuation without proving the interface or mission path.",
            [
              "Check the robot sensor timestamp before the compute command.",
              "Trace powered robot actuation back to the inspection mission."
            ],
            [
              "Confirm the bounded robot observation route first.",
              "Select the robot relation that closes verified motion to mission demand."
            ]
          ],
          focusRef: reasonedCase("inspection-architecture", "scenario"),
          contextConditionIds: [
            "bounded-interface-latency",
            "nominal-power"
          ],
          positions: [
            ["sensor-path", 0, 0],
            ["compute-coordinator", 1, 0],
            ["actuator-chain", 2, 0],
            ["mission-demand", 3, 0]
          ],
          relationIds: [
            "sensing-feeds-compute",
            "compute-commands-actuation",
            "actuation-serves-mission"
          ],
          answerRelationIds: ["actuation-serves-mission"],
          options: [
            [
              "verify-mission",
              true,
              reasonedCase("inspection-architecture", "verification"),
              condition("nominal-power"),
              ["actuation-serves-mission"],
              ["bounded-interface-latency", "nominal-power"],
              null
            ],
            [
              "assume-components",
              false,
              misconception("parts-list-is-architecture", "claim"),
              misconception("parts-list-is-architecture", "mechanism"),
              ["mission-allocates-sensing"],
              ["nominal-power"],
              "parts-list-is-architecture"
            ],
            [
              "skip-sensing",
              false,
              reasonedCase("inspection-architecture", "outcome"),
              condition("bounded-interface-latency"),
              ["compute-commands-actuation"],
              ["bounded-interface-latency"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("functional-architecture", "label"),
      focusRef: reasonedCase("inspection-architecture", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["mission-demand", 0, 0],
        ["sensor-path", 1, 0],
        ["compute-coordinator", 2, 0],
        ["actuator-chain", 3, 0],
        ["safe-state", 2, 1]
      ],
      visibleEntityIds: [
        "mission-demand",
        "sensor-path",
        "compute-coordinator",
        "actuator-chain",
        "safe-state"
      ],
      visibleRelationIds: [
        "mission-allocates-sensing",
        "sensing-feeds-compute",
        "compute-commands-actuation",
        "actuation-serves-mission",
        "interface-invokes-safe-state"
      ],
      controls: [
        [
          "nominal-mission",
          condition("nominal-power"),
          ["nominal-power"],
          [
            "mission-demand",
            "sensor-path",
            "compute-coordinator",
            "actuator-chain"
          ],
          [
            "mission-allocates-sensing",
            "sensing-feeds-compute",
            "compute-commands-actuation",
            "actuation-serves-mission"
          ],
          [],
          [],
          [
            [
              "mission-flow",
              "Robot mission flow is active.",
              ["mission-demand", "actuator-chain"],
              ["actuation-serves-mission"]
            ]
          ],
          reasonedCase("inspection-architecture", "verification")
        ],
        [
          "stale-interface",
          condition("bounded-interface-latency"),
          ["bounded-interface-latency"],
          ["sensor-path", "compute-coordinator", "safe-state"],
          ["sensing-feeds-compute", "interface-invokes-safe-state"],
          ["compute-commands-actuation"],
          [],
          [
            [
              "stale-route",
              "Stale robot sensing blocks motion.",
              ["sensor-path", "safe-state"],
              ["interface-invokes-safe-state"]
            ]
          ],
          reasonedCase("parts-list-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L02",
    systemModel:
      "A coordinate frame supplies an origin and ordered basis, while a directed rigid transformation changes the coordinates used for one physical point without moving that point.",
    failurePattern:
      "A plausible coordinate becomes wrong when frame direction, multiplication order, handedness or measurement time is reversed or left implicit.",
    visualExplanation:
      "One physical landmark is shown beside sensor, base and world axes, with a directed transform chain and an inverse round-trip path.",
    applicationTask:
      "Carry a landmark from sensor coordinates through the robot base into the world frame, state every convention and recover the original sensor coordinates as a round-trip check.",
    terms: [
      [
        "reference-frame",
        "Robot reference frame",
        "An origin and ordered basis used to express robot position or orientation coordinates.",
        "A frame name without axis orientation, units or parent relation is incomplete.",
        "express-sensor-point"
      ],
      [
        "rigid-transform",
        "Directed rigid transformation",
        "A rotation and translation that maps coordinates between two declared robot frames while preserving geometry.",
        "Using the same numeric transform in the reverse direction without inversion is outside this definition.",
        "map-sensor-base"
      ]
    ],
    entities: [
      [
        "physical-landmark",
        "input",
        "Physical landmark",
        "The single stationary point whose coordinates are represented."
      ],
      [
        "sensor-coordinate",
        "state",
        "Sensor-frame coordinate",
        "The landmark coordinate expressed in the sensor basis."
      ],
      [
        "base-coordinate",
        "state",
        "Base-frame coordinate",
        "The same landmark coordinate expressed in the robot base basis."
      ],
      [
        "world-coordinate",
        "state",
        "World-frame coordinate",
        "The same landmark coordinate expressed in the world basis."
      ],
      [
        "roundtrip-check",
        "criterion",
        "Transform round-trip check",
        "The comparison between recovered and original sensor coordinates."
      ]
    ],
    relations: [
      [
        "landmark-expressed-sensor",
        "maps",
        ["physical-landmark"],
        ["sensor-coordinate"],
        "the physical landmark is expressed in sensor-frame coordinates",
        "directed",
        "one-to-one"
      ],
      [
        "sensor-maps-base",
        "transforms",
        ["sensor-coordinate"],
        ["base-coordinate"],
        "the directed sensor-to-base transform maps the landmark coordinate",
        "directed",
        "one-to-one"
      ],
      [
        "base-maps-world",
        "transforms",
        ["base-coordinate"],
        ["world-coordinate"],
        "the directed base-to-world transform maps the base coordinate",
        "directed",
        "one-to-one"
      ],
      [
        "world-inverts-base",
        "transforms",
        ["world-coordinate"],
        ["base-coordinate"],
        "the inverse world-to-base transform recovers the base coordinate",
        "directed",
        "one-to-one"
      ],
      [
        "base-inverts-sensor",
        "transforms",
        ["base-coordinate"],
        ["sensor-coordinate"],
        "the inverse base-to-sensor transform recovers the sensor coordinate",
        "directed",
        "one-to-one"
      ],
      [
        "sensor-compares-roundtrip",
        "compares",
        ["sensor-coordinate"],
        ["roundtrip-check"],
        "the recovered sensor coordinate is compared with its original representation",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "right-handed-axes",
        "boundary",
        "Sensor, base and world coordinates use the declared right-handed robot axes.",
        ["sensor-coordinate", "base-coordinate", "world-coordinate"],
        ["sensor-maps-base", "base-maps-world"]
      ],
      [
        "declared-transform-direction",
        "criterion",
        "Every rigid transformation names its source frame, target frame and multiplication direction.",
        ["sensor-coordinate", "base-coordinate", "world-coordinate"],
        [
          "sensor-maps-base",
          "base-maps-world",
          "world-inverts-base",
          "base-inverts-sensor"
        ]
      ],
      [
        "common-observation-time",
        "assumption",
        "The landmark and all robot frame poses refer to one declared observation time.",
        ["physical-landmark", "sensor-coordinate"],
        ["landmark-expressed-sensor"]
      ]
    ],
    failureBoundary: [
      "reversed-transform-direction",
      "declared-transform-direction",
      "A sensor-to-base transform is applied as though it were a base-to-sensor transform.",
      "The world landmark shifts numerically even though the physical point and robot pose are unchanged.",
      "Reject the coordinate chain unless directed composition and inverse round trip both agree under the declared frames.",
      [
        "sensor-coordinate",
        "base-coordinate",
        "world-coordinate",
        "roundtrip-check"
      ],
      [
        "sensor-maps-base",
        "base-maps-world",
        "world-inverts-base",
        "base-inverts-sensor",
        "sensor-compares-roundtrip"
      ]
    ],
    conceptualModel: [
      [
        "express-sensor-point",
        "Express the physical landmark in the declared sensor-frame basis at the observation time.",
        ["physical-landmark", "sensor-coordinate"],
        ["landmark-expressed-sensor"],
        ["common-observation-time"]
      ],
      [
        "map-sensor-base",
        "Apply the directed rigid transformation from sensor coordinates into robot base coordinates.",
        ["sensor-coordinate", "base-coordinate"],
        ["sensor-maps-base"],
        ["right-handed-axes", "declared-transform-direction"]
      ],
      [
        "map-base-world",
        "Compose the base-to-world rigid transformation after the sensor-to-base map.",
        ["base-coordinate", "world-coordinate"],
        ["base-maps-world"],
        ["declared-transform-direction"]
      ],
      [
        "invert-world-base",
        "Invert the world transform to recover the robot base coordinate.",
        ["world-coordinate", "base-coordinate"],
        ["world-inverts-base"],
        ["declared-transform-direction"]
      ],
      [
        "verify-roundtrip",
        "Recover the sensor coordinate and compare it with the original representation.",
        ["base-coordinate", "sensor-coordinate", "roundtrip-check"],
        ["base-inverts-sensor", "sensor-compares-roundtrip"],
        ["right-handed-axes"]
      ]
    ],
    reasonedCases: [
      {
        id: "landmark-transform-example",
        kind: "example",
        scenario:
          "A stationary landmark is measured in a sensor frame and mapped through a fixed robot base pose into the world frame at one timestamp.",
        changedConditionIds: ["common-observation-time"],
        givens: [
          [
            "frame-chain",
            "Declared robot frame chain",
            "sensor to base to world at one observation time",
            null,
            "physical-landmark"
          ]
        ],
        reasoningSteps: [
          [
            "example-sensor",
            "The landmark first receives a sensor-frame coordinate under the common-time assumption.",
            ["physical-landmark", "sensor-coordinate"],
            ["landmark-expressed-sensor"],
            ["common-observation-time"]
          ],
          [
            "example-compose",
            "Directed sensor-to-base and base-to-world transforms preserve the represented point.",
            ["sensor-coordinate", "base-coordinate", "world-coordinate"],
            ["sensor-maps-base", "base-maps-world"],
            ["declared-transform-direction", "right-handed-axes"]
          ],
          [
            "example-inverse",
            "The inverse chain returns to the original sensor coordinate for comparison.",
            ["world-coordinate", "base-coordinate", "sensor-coordinate"],
            ["world-inverts-base", "base-inverts-sensor"],
            ["declared-transform-direction"]
          ]
        ],
        outcome:
          "The world coordinate and recovered sensor coordinate describe one consistent physical landmark.",
        criterionConditionId: "declared-transform-direction",
        criterion:
          "Every map in the forward and inverse chains must use the named source and target frame.",
        verification:
          "Compose the forward chain, apply both inverses and compare the recovered sensor coordinate with its starting value."
      },
      {
        id: "reverse-matrix-counterexample",
        kind: "counterexample",
        scenario:
          "A base-to-sensor matrix is applied directly to a sensor coordinate while being labelled sensor-to-base.",
        changedConditionIds: ["declared-transform-direction"],
        givens: [
          [
            "mislabelled-map",
            "Transform direction",
            "numeric base-to-sensor map used as sensor-to-base",
            null,
            "sensor-coordinate"
          ]
        ],
        reasoningSteps: [
          [
            "counter-direction",
            "The matrix source frame does not match the sensor coordinate it receives.",
            ["sensor-coordinate", "base-coordinate"],
            ["sensor-maps-base"],
            ["declared-transform-direction"]
          ],
          [
            "counter-world",
            "The resulting base coordinate propagates a false landmark into the world frame.",
            ["base-coordinate", "world-coordinate"],
            ["base-maps-world"],
            ["right-handed-axes"]
          ],
          [
            "counter-roundtrip",
            "The declared inverse chain does not recover the original sensor coordinate.",
            ["world-coordinate", "sensor-coordinate", "roundtrip-check"],
            ["world-inverts-base", "sensor-compares-roundtrip"],
            ["declared-transform-direction"]
          ]
        ],
        outcome:
          "A numerically finite world coordinate fails the frame-direction and round-trip evidence boundary.",
        criterionConditionId: "declared-transform-direction",
        criterion:
          "A transform is admissible only when its source and target frames match the coordinate flow.",
        verification:
          "Compare the stated transform direction with its inverse and test the complete coordinate round trip."
      }
    ],
    misconception: {
      id: "matrix-works-both-directions",
      claim:
        "One rigid-transform matrix can be used unchanged in both frame directions.",
      mechanism:
        "Reversing a frame map requires the inverse rotation and translated origin, not a relabelled forward matrix.",
      correction:
        "Name source and target frames, compose in order and invert the rigid transformation before reversing direction.",
      disconfirmingObservation:
        "The unchanged reverse matrix fails to recover the original sensor coordinate.",
      entityIds: [
        "sensor-coordinate",
        "base-coordinate",
        "world-coordinate",
        "roundtrip-check"
      ],
      relationIds: [
        "sensor-maps-base",
        "base-maps-world",
        "base-inverts-sensor",
        "sensor-compares-roundtrip"
      ],
      conditionIds: ["declared-transform-direction", "right-handed-axes"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Sequence the sensor, base and world coordinate maps for the physical landmark:",
            "The frame sequence composes sensor-to-base before base-to-world and preserves the landmark.",
            "The frame sequence reverses a directed transformation or changes the world coordinate order.",
            [
              "Begin with the physical landmark expressed in sensor coordinates.",
              "Apply the rigid sensor-to-base map before the world-frame map."
            ],
            [
              "Place the sensor representation first in the coordinate chain.",
              "Finish by composing the base coordinate into the world frame."
            ]
          ],
          focusRef: reasonedCase("landmark-transform-example", "scenario"),
          contextConditionIds: [
            "common-observation-time",
            "declared-transform-direction"
          ],
          steps: [
            [
              "express",
              ["landmark-expressed-sensor"],
              ["common-observation-time"]
            ],
            [
              "sensor-base",
              ["sensor-maps-base"],
              ["declared-transform-direction"]
            ],
            [
              "base-world",
              ["base-maps-world"],
              ["right-handed-axes"]
            ]
          ],
          correctOrder: ["express", "sensor-base", "base-world"]
        },
        retry: {
          instruction: [
            "Recover the original sensor coordinate through the inverse frame chain:",
            "The inverse frame path returns world coordinates through base coordinates to the sensor representation.",
            "The inverse frame path applies a forward rigid transform or omits the round-trip comparison.",
            [
              "Start the inverse frame path with world-to-base recovery.",
              "Compare the recovered sensor coordinate only after both inverse maps."
            ],
            [
              "Invert the world coordinate into the robot base frame.",
              "Invert the base coordinate into the sensor frame and perform the round-trip check."
            ]
          ],
          focusRef: reasonedCase("reverse-matrix-counterexample", "scenario"),
          contextConditionIds: [
            "declared-transform-direction",
            "right-handed-axes"
          ],
          steps: [
            [
              "world-base",
              ["world-inverts-base"],
              ["declared-transform-direction"]
            ],
            [
              "base-sensor",
              ["base-inverts-sensor"],
              ["right-handed-axes"]
            ],
            [
              "compare",
              ["sensor-compares-roundtrip"],
              ["declared-transform-direction"]
            ]
          ],
          correctOrder: ["world-base", "base-sensor", "compare"]
        }
      },
      q3: {
        base: {
          instruction: [
            "Choose every frame record that preserves one physical landmark across coordinates:",
            "The chosen frame records declare transform direction, common time and a valid inverse check.",
            "A chosen frame record relabels a matrix or mixes coordinates from different observation times.",
            [
              "Look for the sensor-to-base direction before the world transform.",
              "Keep the round-trip frame comparison tied to the original sensor coordinate."
            ],
            [
              "Select the directed sensor and world coordinate maps.",
              "Select the inverse relation that recovers the sensor representation."
            ]
          ],
          focusRef: term("rigid-transform", "definition"),
          contextConditionIds: [
            "declared-transform-direction",
            "common-observation-time"
          ],
          options: [
            [
              "direct-map",
              true,
              relation("sensor-maps-base"),
              condition("declared-transform-direction"),
              ["sensor-maps-base"],
              ["declared-transform-direction"],
              null
            ],
            [
              "world-map",
              true,
              relation("base-maps-world"),
              condition("right-handed-axes"),
              ["base-maps-world"],
              ["right-handed-axes"],
              null
            ],
            [
              "unchanged-reverse",
              false,
              misconception("matrix-works-both-directions", "claim"),
              misconception("matrix-works-both-directions", "mechanism"),
              ["base-inverts-sensor"],
              ["declared-transform-direction"],
              "matrix-works-both-directions"
            ],
            [
              "mixed-time",
              false,
              condition("common-observation-time"),
              reasonedCase("reverse-matrix-counterexample", "outcome"),
              ["landmark-expressed-sensor"],
              ["common-observation-time"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Select the coordinate evidence that diagnoses a failed transform round trip:",
            "The coordinate evidence isolates direction, handedness and recovery of the sensor frame.",
            "The coordinate evidence accepts a finite world number without testing the inverse frame path.",
            [
              "Check the base-to-sensor inverse against the declared frame direction.",
              "Use the sensor round-trip comparison as coordinate evidence."
            ],
            [
              "Mark the inverse world and sensor transformations as required.",
              "Mark disagreement at the round-trip criterion as a frame failure."
            ]
          ],
          focusRef: reasonedCase("reverse-matrix-counterexample", "verification"),
          contextConditionIds: [
            "right-handed-axes",
            "declared-transform-direction"
          ],
          options: [
            [
              "inverse-world",
              true,
              relation("world-inverts-base"),
              condition("declared-transform-direction"),
              ["world-inverts-base"],
              ["declared-transform-direction"],
              null
            ],
            [
              "inverse-sensor",
              true,
              relation("base-inverts-sensor"),
              condition("right-handed-axes"),
              ["base-inverts-sensor"],
              ["right-handed-axes"],
              null
            ],
            [
              "roundtrip",
              true,
              relation("sensor-compares-roundtrip"),
              reasonedCase("landmark-transform-example", "criterion"),
              ["sensor-compares-roundtrip"],
              ["declared-transform-direction"],
              null
            ],
            [
              "matrix-label",
              false,
              misconception("matrix-works-both-directions", "claim"),
              misconception("matrix-works-both-directions", "mechanism"),
              ["sensor-maps-base"],
              ["declared-transform-direction"],
              "matrix-works-both-directions"
            ],
            [
              "finite-only",
              false,
              reasonedCase("reverse-matrix-counterexample", "outcome"),
              condition("common-observation-time"),
              ["base-maps-world"],
              ["common-observation-time"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Pair each coordinate transformation with the frame rule that controls it:",
            "Each frame map is matched to its direction, handedness or observation-time boundary.",
            "A coordinate map is paired with a frame rule that does not constrain its representation.",
            [
              "Match the sensor expression to the common landmark time.",
              "Match inverse rigid transforms to the declared direction rule."
            ],
            [
              "Pair sensor-to-base mapping with directed transformation.",
              "Pair round-trip coordinate comparison with the right-handed frame boundary."
            ]
          ],
          focusRef: reasonedCase("landmark-transform-example", "verification"),
          contextConditionIds: [
            "common-observation-time",
            "right-handed-axes",
            "declared-transform-direction"
          ],
          pairs: [
            [
              "sensor-time",
              relation("landmark-expressed-sensor"),
              condition("common-observation-time"),
              relation("landmark-expressed-sensor"),
              ["landmark-expressed-sensor"],
              ["common-observation-time"]
            ],
            [
              "forward-direction",
              relation("sensor-maps-base"),
              condition("declared-transform-direction"),
              relation("sensor-maps-base"),
              ["sensor-maps-base"],
              ["declared-transform-direction"]
            ],
            [
              "roundtrip-axes",
              relation("sensor-compares-roundtrip"),
              condition("right-handed-axes"),
              relation("sensor-compares-roundtrip"),
              ["sensor-compares-roundtrip"],
              ["right-handed-axes"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why an unchanged reverse matrix fails the robot frame contract:",
            "The frame explanation covers directed transformation, inverse recovery and round-trip evidence.",
            "The frame explanation treats matrix values as independent of source and target coordinates.",
            [
              "State the robot reference frame direction before discussing inversion.",
              "Connect the rigid transform inverse to the recovered sensor coordinate."
            ],
            [
              "Explain how sensor coordinates become world coordinates in order.",
              "Apply the transform round-trip criterion to reject the unchanged reverse matrix."
            ]
          ],
          focusRef: reasonedCase("reverse-matrix-counterexample", "scenario"),
          contextConditionIds: [
            "declared-transform-direction",
            "right-handed-axes"
          ],
          conceptGroups: [
            [
              "frame-definition",
              term("reference-frame", "label"),
              [
                term("reference-frame", "definition"),
                term("reference-frame", "boundary")
              ],
              ["landmark-expressed-sensor"],
              ["right-handed-axes"]
            ],
            [
              "directed-map",
              term("rigid-transform", "label"),
              [
                term("rigid-transform", "definition"),
                relation("sensor-maps-base")
              ],
              ["sensor-maps-base"],
              ["declared-transform-direction"]
            ],
            [
              "inverse-evidence",
              relation("sensor-compares-roundtrip"),
              [
                relation("base-inverts-sensor"),
                relation("sensor-compares-roundtrip")
              ],
              ["base-inverts-sensor", "sensor-compares-roundtrip"],
              ["declared-transform-direction"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["base-inverts-sensor"],
          criterionConditionId: "declared-transform-direction"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Interpret the forward frame diagram for one physical landmark:",
            "The coordinate diagram preserves the landmark through sensor, base and world transforms.",
            "The coordinate diagram implication swaps transform direction or changes observation time.",
            [
              "Trace the physical point into sensor-frame coordinates.",
              "Follow the directed rigid transforms toward the world frame."
            ],
            [
              "Identify the sensor-to-base coordinate relation.",
              "Choose the implication that keeps one landmark across the composed frame chain."
            ]
          ],
          focusRef: reasonedCase("landmark-transform-example", "scenario"),
          contextConditionIds: [
            "common-observation-time",
            "declared-transform-direction"
          ],
          positions: [
            ["physical-landmark", 0, 0],
            ["sensor-coordinate", 1, 0],
            ["base-coordinate", 2, 0],
            ["world-coordinate", 3, 0],
            ["roundtrip-check", 2, 1]
          ],
          relationIds: [
            "landmark-expressed-sensor",
            "sensor-maps-base",
            "base-maps-world",
            "sensor-compares-roundtrip"
          ],
          answerRelationIds: ["base-maps-world"],
          options: [
            [
              "preserve-landmark",
              true,
              reasonedCase("landmark-transform-example", "verification"),
              condition("declared-transform-direction"),
              ["base-maps-world"],
              ["common-observation-time", "declared-transform-direction"],
              null
            ],
            [
              "reuse-reverse",
              false,
              misconception("matrix-works-both-directions", "claim"),
              misconception("matrix-works-both-directions", "mechanism"),
              ["sensor-maps-base"],
              ["declared-transform-direction"],
              "matrix-works-both-directions"
            ],
            [
              "ignore-time",
              false,
              reasonedCase("reverse-matrix-counterexample", "outcome"),
              condition("common-observation-time"),
              ["landmark-expressed-sensor"],
              ["common-observation-time"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Diagnose the inverse coordinate diagram after the world-frame check fails:",
            "The inverse diagram recovers base and sensor coordinates before judging the round trip.",
            "The inverse diagram accepts a world coordinate without reversing the directed frame maps.",
            [
              "Begin the coordinate diagnosis with world-to-base inversion.",
              "Use the sensor round-trip node after the base-to-sensor map."
            ],
            [
              "Follow the inverse rigid transform into the robot base coordinate.",
              "Select the sensor comparison relation that exposes the direction error."
            ]
          ],
          focusRef: reasonedCase("reverse-matrix-counterexample", "scenario"),
          contextConditionIds: [
            "declared-transform-direction",
            "right-handed-axes"
          ],
          positions: [
            ["world-coordinate", 0, 0],
            ["base-coordinate", 1, 0],
            ["sensor-coordinate", 2, 0],
            ["roundtrip-check", 3, 0]
          ],
          relationIds: [
            "world-inverts-base",
            "base-inverts-sensor",
            "sensor-compares-roundtrip"
          ],
          answerRelationIds: ["sensor-compares-roundtrip"],
          options: [
            [
              "reject-direction",
              true,
              reasonedCase("reverse-matrix-counterexample", "verification"),
              condition("declared-transform-direction"),
              ["base-inverts-sensor", "sensor-compares-roundtrip"],
              ["declared-transform-direction", "right-handed-axes"],
              null
            ],
            [
              "trust-number",
              false,
              misconception("matrix-works-both-directions", "claim"),
              misconception("matrix-works-both-directions", "mechanism"),
              ["world-inverts-base"],
              ["declared-transform-direction"],
              "matrix-works-both-directions"
            ],
            [
              "skip-roundtrip",
              false,
              reasonedCase("reverse-matrix-counterexample", "outcome"),
              condition("right-handed-axes"),
              ["base-inverts-sensor"],
              ["right-handed-axes"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "explicit-states",
      titleRef: term("reference-frame", "label"),
      focusRef: reasonedCase("landmark-transform-example", "verification"),
      modelKind: "geometry-transform",
      controls: [
        [
          "forward-frames",
          condition("common-observation-time"),
          ["common-observation-time"],
          {
            kind: "geometry-transform",
            frameEntityId: "world-coordinate",
            points: [
              ["physical", "Physical landmark", 0, 0, "physical-landmark"],
              ["sensor", "Sensor coordinate", 1, 0, "sensor-coordinate"],
              ["base", "Base coordinate", 2, 1, "base-coordinate"],
              ["world", "World coordinate", 3, 2, "world-coordinate"]
            ],
            segments: [
              [
                "sensor-base-segment",
                "sensor",
                "base",
                "sensor-maps-base"
              ],
              [
                "base-world-segment",
                "base",
                "world",
                "base-maps-world"
              ]
            ],
            verification:
              "The forward geometry carries one landmark through sensor, base and world frames."
          },
          reasonedCase("landmark-transform-example", "verification"),
          [
            relation("sensor-maps-base"),
            relation("base-maps-world")
          ]
        ],
        [
          "inverse-frames",
          condition("declared-transform-direction"),
          ["declared-transform-direction"],
          {
            kind: "geometry-transform",
            frameEntityId: "sensor-coordinate",
            points: [
              ["world-back", "World coordinate", 0, 2, "world-coordinate"],
              ["base-back", "Recovered base", 1, 1, "base-coordinate"],
              ["sensor-back", "Recovered sensor", 2, 0, "sensor-coordinate"],
              ["check-back", "Round-trip check", 3, 1, "roundtrip-check"]
            ],
            segments: [
              [
                "world-base-inverse",
                "world-back",
                "base-back",
                "world-inverts-base"
              ],
              [
                "base-sensor-inverse",
                "base-back",
                "sensor-back",
                "base-inverts-sensor"
              ],
              [
                "sensor-check-segment",
                "sensor-back",
                "check-back",
                "sensor-compares-roundtrip"
              ]
            ],
            verification:
              "The inverse geometry reaches the sensor coordinate and exposes any round-trip disagreement."
          },
          reasonedCase("reverse-matrix-counterexample", "verification"),
          [
            relation("world-inverts-base"),
            relation("sensor-compares-roundtrip")
          ]
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L03",
    systemModel:
      "Forward kinematics composes declared joint transformations and link geometry in chain order to map joint variables to a tool pose.",
    failurePattern:
      "A smooth tool path can be wrong when a joint zero, axis sign, link length or transformation order does not match the physical manipulator.",
    visualExplanation:
      "A planar arm shows joint inputs, the ordered link chain, the calculated tool pose and a geometric endpoint check.",
    applicationTask:
      "Construct forward kinematics for a planar arm, test reference and bent configurations and compare the calculated tool pose with independent geometry.",
    terms: [
      [
        "forward-kinematics",
        "Forward kinematics",
        "The directed calculation from declared robot joint variables and link geometry to an end-effector pose.",
        "Inferring joint variables from a desired pose is an inverse problem, not forward kinematics.",
        "bind-joint-input"
      ],
      [
        "joint-convention",
        "Robot joint convention",
        "The declared joint zero, positive direction, axis and unit used by the kinematic chain.",
        "A numeric joint value without its physical convention is incomplete.",
        "apply-joint-convention"
      ]
    ],
    entities: [
      [
        "joint-input",
        "input",
        "Robot joint input",
        "The ordered joint variables supplied to the forward model."
      ],
      [
        "link-chain",
        "mechanism",
        "Robot link chain",
        "The ordered rigid links and joint transforms from base to tool."
      ],
      [
        "tool-pose",
        "state",
        "Calculated tool pose",
        "The end-effector position and orientation in the declared base frame."
      ],
      [
        "geometry-check",
        "criterion",
        "Geometric endpoint check",
        "An independent construction used to test the calculated tool pose."
      ]
    ],
    relations: [
      [
        "joints-configure-chain",
        "maps",
        ["joint-input"],
        ["link-chain"],
        "the ordered robot joint input configures the physical link chain",
        "directed",
        "one-to-one"
      ],
      [
        "chain-composes-pose",
        "transforms",
        ["link-chain"],
        ["tool-pose"],
        "ordered link transformations compose the calculated tool pose",
        "directed",
        "many-to-one"
      ],
      [
        "pose-compares-geometry",
        "compares",
        ["tool-pose"],
        ["geometry-check"],
        "the calculated tool pose is compared with independent endpoint geometry",
        "directed",
        "one-to-one"
      ],
      [
        "convention-invalidates-pose",
        "invalidates",
        ["joint-input"],
        ["tool-pose"],
        "a mismatched robot joint convention invalidates the calculated tool pose",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "declared-joint-zero",
        "boundary",
        "Every robot joint input uses the declared physical zero and positive direction.",
        ["joint-input", "link-chain"],
        ["joints-configure-chain", "convention-invalidates-pose"]
      ],
      [
        "base-to-tool-order",
        "criterion",
        "Link transformations are multiplied in physical base-to-tool chain order.",
        ["link-chain", "tool-pose"],
        ["chain-composes-pose"]
      ],
      [
        "rigid-planar-links",
        "assumption",
        "The planar robot links are rigid and their declared lengths remain fixed.",
        ["link-chain", "geometry-check"],
        ["chain-composes-pose", "pose-compares-geometry"]
      ]
    ],
    failureBoundary: [
      "joint-zero-mismatch",
      "declared-joint-zero",
      "The model treats a physical offset pose as zero while the robot joint encoder uses another reference.",
      "Calculated and measured tool poses disagree consistently across configurations.",
      "Reject the forward model unless reference poses and geometric endpoint checks agree under the declared joint convention.",
      ["joint-input", "link-chain", "tool-pose", "geometry-check"],
      [
        "joints-configure-chain",
        "chain-composes-pose",
        "pose-compares-geometry",
        "convention-invalidates-pose"
      ]
    ],
    conceptualModel: [
      [
        "bind-joint-input",
        "List robot joint inputs in base-to-tool order with units.",
        ["joint-input"],
        ["joints-configure-chain"],
        ["declared-joint-zero"]
      ],
      [
        "apply-joint-convention",
        "Apply each joint zero, positive direction and axis before composing link transforms.",
        ["joint-input", "link-chain"],
        ["joints-configure-chain"],
        ["declared-joint-zero"]
      ],
      [
        "compose-link-chain",
        "Multiply the rigid link transformations in physical chain order.",
        ["link-chain", "tool-pose"],
        ["chain-composes-pose"],
        ["base-to-tool-order", "rigid-planar-links"]
      ],
      [
        "extract-tool-pose",
        "Read tool position and orientation in the declared robot base frame.",
        ["link-chain", "tool-pose"],
        ["chain-composes-pose"],
        ["base-to-tool-order"]
      ],
      [
        "check-tool-geometry",
        "Compare the calculated tool pose with independent endpoint geometry in reference configurations.",
        ["tool-pose", "geometry-check"],
        ["pose-compares-geometry"],
        ["rigid-planar-links"]
      ]
    ],
    reasonedCases: [
      {
        id: "planar-arm-example",
        kind: "example",
        scenario:
          "A planar arm uses declared joint zeros and link lengths to calculate its tool pose in two reference configurations.",
        changedConditionIds: ["rigid-planar-links"],
        givens: [
          [
            "arm-model",
            "Robot chain declaration",
            "ordered joint variables and fixed planar links",
            null,
            "link-chain"
          ]
        ],
        reasoningSteps: [
          [
            "example-joints",
            "Joint variables are interpreted through the declared robot convention.",
            ["joint-input", "link-chain"],
            ["joints-configure-chain"],
            ["declared-joint-zero"]
          ],
          [
            "example-compose",
            "Link transforms are composed from the robot base toward the tool.",
            ["link-chain", "tool-pose"],
            ["chain-composes-pose"],
            ["base-to-tool-order", "rigid-planar-links"]
          ],
          [
            "example-check",
            "The tool pose agrees with an independent endpoint construction.",
            ["tool-pose", "geometry-check"],
            ["pose-compares-geometry"],
            ["rigid-planar-links"]
          ]
        ],
        outcome:
          "The forward-kinematics model reproduces the declared planar-arm reference geometry.",
        criterionConditionId: "base-to-tool-order",
        criterion:
          "The composed transform must follow physical base-to-tool order and match the geometric endpoint.",
        verification:
          "Evaluate at least two reference configurations and compare every calculated tool coordinate with direct geometry."
      },
      {
        id: "joint-zero-counterexample",
        kind: "counterexample",
        scenario:
          "A forward model assigns zero to a straight link while the physical robot encoder zero is offset.",
        changedConditionIds: ["declared-joint-zero"],
        givens: [
          [
            "offset-zero",
            "Joint reference",
            "model and physical robot use different zero poses",
            null,
            "joint-input"
          ]
        ],
        reasoningSteps: [
          [
            "counter-input",
            "The same numeric joint input configures a different physical link angle.",
            ["joint-input", "link-chain"],
            ["joints-configure-chain"],
            ["declared-joint-zero"]
          ],
          [
            "counter-pose",
            "Ordered multiplication cannot repair the wrong robot joint convention.",
            ["link-chain", "tool-pose"],
            ["chain-composes-pose", "convention-invalidates-pose"],
            ["base-to-tool-order", "declared-joint-zero"]
          ],
          [
            "counter-check",
            "The calculated tool endpoint disagrees with the physical geometry check.",
            ["tool-pose", "geometry-check"],
            ["pose-compares-geometry"],
            ["rigid-planar-links"]
          ]
        ],
        outcome:
          "The forward calculation is internally smooth but physically offset and invalid.",
        criterionConditionId: "declared-joint-zero",
        criterion:
          "Joint values must share the physical robot zero, direction and axis used by the link model.",
        verification:
          "Command or measure a reference pose and compare the physical joint axes and tool endpoint with the forward model."
      }
    ],
    misconception: {
      id: "smooth-pose-proves-kinematics",
      claim:
        "A smooth calculated tool path proves that the forward kinematics are correct.",
      mechanism:
        "A consistent joint-zero or chain-order error can produce smooth but physically displaced poses.",
      correction:
        "Declare robot joint conventions and verify tool poses against independent geometry at multiple configurations.",
      disconfirmingObservation:
        "The smooth tool path misses every measured endpoint by a configuration-dependent offset.",
      entityIds: ["joint-input", "link-chain", "tool-pose", "geometry-check"],
      relationIds: [
        "joints-configure-chain",
        "chain-composes-pose",
        "pose-compares-geometry"
      ],
      conditionIds: ["declared-joint-zero", "base-to-tool-order"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Arrange the forward-kinematics chain from robot joints to the checked tool pose:",
            "The joint, link and tool sequence follows the physical chain and ends with geometric verification.",
            "The joint, link and tool sequence checks geometry before calculating the robot pose.",
            [
              "Interpret the robot joint input before composing link transforms.",
              "Place the geometric tool check after pose calculation."
            ],
            [
              "Configure the link chain from declared robot joints.",
              "Compose the tool pose and compare it with endpoint geometry."
            ]
          ],
          focusRef: reasonedCase("planar-arm-example", "scenario"),
          contextConditionIds: [
            "declared-joint-zero",
            "base-to-tool-order",
            "rigid-planar-links"
          ],
          steps: [
            [
              "configure",
              ["joints-configure-chain"],
              ["declared-joint-zero"]
            ],
            [
              "compose",
              ["chain-composes-pose"],
              ["base-to-tool-order"]
            ],
            [
              "check",
              ["pose-compares-geometry"],
              ["rigid-planar-links"]
            ]
          ],
          correctOrder: ["configure", "compose", "check"]
        },
        retry: {
          instruction: [
            "Trace the robot joint-zero fault before recalculating the tool endpoint:",
            "The joint-zero retry identifies the convention error, rebuilds the link chain and repeats the geometry check.",
            "The joint-zero retry changes multiplication order without correcting the physical robot reference.",
            [
              "Start with the robot convention that invalidates the tool pose.",
              "Recompose the link chain only after the joint zero is corrected."
            ],
            [
              "Use the joint convention relation to expose the pose error.",
              "Calculate the corrected robot tool pose and compare its geometry."
            ]
          ],
          focusRef: reasonedCase("joint-zero-counterexample", "scenario"),
          contextConditionIds: [
            "declared-joint-zero",
            "rigid-planar-links"
          ],
          steps: [
            [
              "expose-zero",
              ["convention-invalidates-pose"],
              ["declared-joint-zero"]
            ],
            [
              "recompose",
              ["chain-composes-pose"],
              ["rigid-planar-links"]
            ],
            [
              "recheck",
              ["pose-compares-geometry"],
              ["base-to-tool-order"]
            ]
          ],
          correctOrder: ["expose-zero", "recompose", "recheck"]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the forward-kinematics evidence that binds robot joints to a physical tool pose:",
            "The selected kinematic evidence covers joint convention, chain order and independent geometry.",
            "The selected kinematic evidence accepts a smooth pose without a physical robot check.",
            [
              "Choose the robot relation that configures the link chain.",
              "Choose the tool-pose comparison against geometric evidence."
            ],
            [
              "Select the declared joint-to-link mapping.",
              "Select the link-to-tool transform and endpoint comparison."
            ]
          ],
          focusRef: term("forward-kinematics", "definition"),
          contextConditionIds: [
            "declared-joint-zero",
            "base-to-tool-order"
          ],
          options: [
            [
              "joint-map",
              true,
              relation("joints-configure-chain"),
              condition("declared-joint-zero"),
              ["joints-configure-chain"],
              ["declared-joint-zero"],
              null
            ],
            [
              "pose-map",
              true,
              relation("chain-composes-pose"),
              condition("base-to-tool-order"),
              ["chain-composes-pose"],
              ["base-to-tool-order"],
              null
            ],
            [
              "smooth-proof",
              false,
              misconception("smooth-pose-proves-kinematics", "claim"),
              misconception("smooth-pose-proves-kinematics", "mechanism"),
              ["chain-composes-pose"],
              ["declared-joint-zero"],
              "smooth-pose-proves-kinematics"
            ],
            [
              "unchecked-geometry",
              false,
              reasonedCase("joint-zero-counterexample", "outcome"),
              condition("rigid-planar-links"),
              ["pose-compares-geometry"],
              ["rigid-planar-links"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify which robot records isolate a forward-model convention error:",
            "The diagnostic records separate joint reference, transform order and tool geometry.",
            "The diagnostic records treat a repeated tool offset as acceptable forward kinematics.",
            [
              "Inspect the robot joint convention before changing link geometry.",
              "Retain the endpoint comparison as the tool-pose criterion."
            ],
            [
              "Mark the joint convention invalidation relation.",
              "Mark the corrected chain composition and geometric tool check."
            ]
          ],
          focusRef: reasonedCase("joint-zero-counterexample", "verification"),
          contextConditionIds: [
            "declared-joint-zero",
            "rigid-planar-links"
          ],
          options: [
            [
              "zero-record",
              true,
              condition("declared-joint-zero"),
              relation("convention-invalidates-pose"),
              ["convention-invalidates-pose"],
              ["declared-joint-zero"],
              null
            ],
            [
              "order-record",
              true,
              condition("base-to-tool-order"),
              relation("chain-composes-pose"),
              ["chain-composes-pose"],
              ["base-to-tool-order"],
              null
            ],
            [
              "geometry-record",
              true,
              relation("pose-compares-geometry"),
              reasonedCase("planar-arm-example", "criterion"),
              ["pose-compares-geometry"],
              ["rigid-planar-links"],
              null
            ],
            [
              "smooth-record",
              false,
              misconception("smooth-pose-proves-kinematics", "claim"),
              misconception("smooth-pose-proves-kinematics", "mechanism"),
              ["chain-composes-pose"],
              ["declared-joint-zero"],
              "smooth-pose-proves-kinematics"
            ],
            [
              "pose-only",
              false,
              reasonedCase("joint-zero-counterexample", "outcome"),
              condition("base-to-tool-order"),
              ["chain-composes-pose"],
              ["base-to-tool-order"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain how forward kinematics earns confidence beyond a smooth robot path:",
            "The kinematic explanation links joint convention, ordered link transforms and tool geometry.",
            "The kinematic explanation describes a tool path but omits the physical robot reference.",
            [
              "Define the robot joint convention before the link chain.",
              "Connect the calculated tool pose to an independent geometry check."
            ],
            [
              "Explain how joint variables configure the robot link chain.",
              "Apply base-to-tool order and endpoint verification."
            ]
          ],
          focusRef: misconception("smooth-pose-proves-kinematics", "claim"),
          contextConditionIds: [
            "declared-joint-zero",
            "base-to-tool-order",
            "rigid-planar-links"
          ],
          conceptGroups: [
            [
              "forward-definition",
              term("forward-kinematics", "label"),
              [
                term("forward-kinematics", "definition"),
                relation("chain-composes-pose")
              ],
              ["chain-composes-pose"],
              ["base-to-tool-order"]
            ],
            [
              "joint-definition",
              term("joint-convention", "label"),
              [
                term("joint-convention", "definition"),
                condition("declared-joint-zero")
              ],
              ["joints-configure-chain"],
              ["declared-joint-zero"]
            ],
            [
              "geometry-evidence",
              relation("pose-compares-geometry"),
              [
                relation("pose-compares-geometry"),
                reasonedCase("planar-arm-example", "verification")
              ],
              ["pose-compares-geometry"],
              ["rigid-planar-links"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["chain-composes-pose"],
          criterionConditionId: "base-to-tool-order"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Link each forward-kinematics operation to the robot boundary it must satisfy:",
            "The joint, chain and tool operations now carry their controlling physical boundaries.",
            "A robot operation is linked to a boundary that cannot test its kinematic effect.",
            [
              "Match joint configuration with the declared robot zero.",
              "Match tool-pose composition with base-to-tool order."
            ],
            [
              "Pair link-chain configuration with the joint convention.",
              "Pair endpoint comparison with the rigid planar-link assumption."
            ]
          ],
          focusRef: reasonedCase("joint-zero-counterexample", "verification"),
          contextConditionIds: [
            "declared-joint-zero",
            "base-to-tool-order",
            "rigid-planar-links"
          ],
          pairs: [
            [
              "joint-zero-pair",
              relation("joints-configure-chain"),
              condition("declared-joint-zero"),
              relation("joints-configure-chain"),
              ["joints-configure-chain"],
              ["declared-joint-zero"]
            ],
            [
              "chain-order-pair",
              relation("chain-composes-pose"),
              condition("base-to-tool-order"),
              relation("chain-composes-pose"),
              ["chain-composes-pose"],
              ["base-to-tool-order"]
            ],
            [
              "geometry-pair",
              relation("pose-compares-geometry"),
              condition("rigid-planar-links"),
              relation("pose-compares-geometry"),
              ["pose-compares-geometry"],
              ["rigid-planar-links"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the forward-kinematics diagram for the planar robot reference pose:",
            "The diagram implication composes joint input through the link chain and checks the tool endpoint.",
            "The diagram implication treats a smooth pose as proof or omits the robot joint convention.",
            [
              "Trace the robot joint input into the physical link chain.",
              "Use the geometric tool check after the calculated pose."
            ],
            [
              "Identify the relation that composes the robot tool pose.",
              "Choose the implication that requires endpoint evidence."
            ]
          ],
          focusRef: reasonedCase("planar-arm-example", "scenario"),
          contextConditionIds: [
            "declared-joint-zero",
            "base-to-tool-order"
          ],
          positions: [
            ["joint-input", 0, 0],
            ["link-chain", 1, 0],
            ["tool-pose", 2, 0],
            ["geometry-check", 3, 0]
          ],
          relationIds: [
            "joints-configure-chain",
            "chain-composes-pose",
            "pose-compares-geometry"
          ],
          answerRelationIds: ["pose-compares-geometry"],
          options: [
            [
              "verify-endpoint",
              true,
              reasonedCase("planar-arm-example", "verification"),
              condition("base-to-tool-order"),
              ["pose-compares-geometry"],
              ["base-to-tool-order", "rigid-planar-links"],
              null
            ],
            [
              "trust-smoothness",
              false,
              misconception("smooth-pose-proves-kinematics", "claim"),
              misconception("smooth-pose-proves-kinematics", "mechanism"),
              ["chain-composes-pose"],
              ["declared-joint-zero"],
              "smooth-pose-proves-kinematics"
            ],
            [
              "ignore-zero",
              false,
              reasonedCase("joint-zero-counterexample", "outcome"),
              condition("declared-joint-zero"),
              ["convention-invalidates-pose"],
              ["declared-joint-zero"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the robot diagram after the joint reference is corrected:",
            "The corrected diagram removes the convention fault before recomposing and checking the tool pose.",
            "The corrected diagram changes the tool result without repairing the joint-to-link mapping.",
            [
              "Follow the robot convention invalidation back to the joint input.",
              "Re-enter the link chain before comparing endpoint geometry."
            ],
            [
              "Reject the mismatched robot joint convention.",
              "Select the implication that recomposes and verifies the corrected tool pose."
            ]
          ],
          focusRef: reasonedCase("joint-zero-counterexample", "scenario"),
          contextConditionIds: [
            "declared-joint-zero",
            "rigid-planar-links"
          ],
          positions: [
            ["joint-input", 0, 1],
            ["tool-pose", 1, 1],
            ["link-chain", 1, 0],
            ["geometry-check", 2, 0]
          ],
          relationIds: [
            "convention-invalidates-pose",
            "joints-configure-chain",
            "chain-composes-pose",
            "pose-compares-geometry"
          ],
          answerRelationIds: [
            "joints-configure-chain",
            "pose-compares-geometry"
          ],
          options: [
            [
              "repair-model",
              true,
              reasonedCase("joint-zero-counterexample", "verification"),
              condition("declared-joint-zero"),
              ["joints-configure-chain", "pose-compares-geometry"],
              ["declared-joint-zero", "rigid-planar-links"],
              null
            ],
            [
              "preserve-error",
              false,
              misconception("smooth-pose-proves-kinematics", "claim"),
              misconception("smooth-pose-proves-kinematics", "mechanism"),
              ["chain-composes-pose"],
              ["base-to-tool-order"],
              "smooth-pose-proves-kinematics"
            ],
            [
              "skip-chain",
              false,
              reasonedCase("joint-zero-counterexample", "outcome"),
              condition("rigid-planar-links"),
              ["convention-invalidates-pose"],
              ["rigid-planar-links"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("forward-kinematics", "label"),
      focusRef: reasonedCase("planar-arm-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["joint-input", 0, 0],
        ["link-chain", 1, 0],
        ["tool-pose", 2, 0],
        ["geometry-check", 3, 0]
      ],
      visibleEntityIds: [
        "joint-input",
        "link-chain",
        "tool-pose",
        "geometry-check"
      ],
      visibleRelationIds: [
        "joints-configure-chain",
        "chain-composes-pose",
        "pose-compares-geometry",
        "convention-invalidates-pose"
      ],
      controls: [
        [
          "declared-chain",
          condition("base-to-tool-order"),
          ["base-to-tool-order"],
          ["joint-input", "link-chain", "tool-pose", "geometry-check"],
          [
            "joints-configure-chain",
            "chain-composes-pose",
            "pose-compares-geometry"
          ],
          [],
          [],
          [
            [
              "valid-chain",
              "Forward robot chain is geometrically checked.",
              ["link-chain", "geometry-check"],
              ["pose-compares-geometry"]
            ]
          ],
          reasonedCase("planar-arm-example", "verification")
        ],
        [
          "offset-joint",
          condition("declared-joint-zero"),
          ["declared-joint-zero"],
          ["joint-input", "tool-pose", "geometry-check"],
          ["convention-invalidates-pose", "pose-compares-geometry"],
          ["joints-configure-chain"],
          [],
          [
            [
              "invalid-zero",
              "Robot joint zero invalidates the tool pose.",
              ["joint-input", "tool-pose"],
              ["convention-invalidates-pose"]
            ]
          ],
          reasonedCase("joint-zero-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L04",
    systemModel:
      "Inverse kinematics maps a target tool pose to feasible joint branches, while the robot Jacobian maps local joint rates to a task-space twist and exposes lost motion directions.",
    failurePattern:
      "A numerically converged inverse solution can violate joint bounds, jump to another branch or demand unbounded joint rate near a singular configuration.",
    visualExplanation:
      "A branch graph connects the framed target pose to candidate joints, limit filtering, a local Jacobian and the resulting task-space motion capability.",
    applicationTask:
      "Solve a planar target pose, compare inverse branches, reject bounded or singular candidates and justify the retained joint motion with a Jacobian check.",
    terms: [
      [
        "inverse-kinematics",
        "Inverse kinematics",
        "The calculation of one or more robot joint configurations that realise a declared end-effector target pose.",
        "A returned joint vector is not automatically unique, bounded, continuous or safe.",
        "frame-target-pose"
      ],
      [
        "robot-jacobian",
        "Robot Jacobian",
        "The local linear map between joint rate and task-space velocity at a declared robot configuration.",
        "The Jacobian is configuration-dependent and does not replace finite-motion collision or limit checks.",
        "linearise-selected-branch"
      ],
      [
        "singular-configuration",
        "Singular configuration",
        "A robot configuration where the Jacobian loses rank and at least one task-space motion direction cannot be produced locally.",
        "A small pose residual does not prove adequate directional motion capability.",
        "test-motion-directions"
      ]
    ],
    entities: [
      [
        "target-pose",
        "input",
        "Framed target pose",
        "The requested tool position and orientation expressed in a named reference frame."
      ],
      [
        "ik-branch",
        "state",
        "Inverse joint branch",
        "A candidate robot joint configuration that reaches the framed target pose."
      ],
      [
        "joint-bounds",
        "constraint",
        "Robot joint bounds",
        "The permitted position and rate interval for every robot joint."
      ],
      [
        "local-jacobian",
        "mechanism",
        "Local robot Jacobian",
        "The velocity map evaluated at the selected inverse joint branch."
      ],
      [
        "task-twist",
        "input",
        "Requested task twist",
        "The desired local tool linear and angular velocity in the declared task frame."
      ],
      [
        "joint-rate",
        "state",
        "Required joint rate",
        "The robot joint velocity required to realise the requested task twist locally."
      ],
      [
        "direction-margin",
        "criterion",
        "Directional motion margin",
        "Evidence that the selected Jacobian retains usable motion authority in required task directions."
      ]
    ],
    relations: [
      [
        "target-yields-branches",
        "maps",
        ["target-pose"],
        ["ik-branch"],
        "the framed target pose maps to one or more inverse joint branches",
        "directed",
        "one-to-many"
      ],
      [
        "bounds-filter-branch",
        "constrains",
        ["joint-bounds"],
        ["ik-branch"],
        "robot joint bounds filter infeasible inverse branches",
        "directed",
        "one-to-many"
      ],
      [
        "branch-defines-jacobian",
        "maps",
        ["ik-branch"],
        ["local-jacobian"],
        "the selected inverse branch determines the local robot Jacobian",
        "directed",
        "one-to-one"
      ],
      [
        "jacobian-maps-rate",
        "transforms",
        ["local-jacobian", "joint-rate"],
        ["task-twist"],
        "the local Jacobian maps robot joint rate to task-space twist",
        "directed",
        "many-to-one"
      ],
      [
        "twist-demands-rate",
        "depends-on",
        ["task-twist", "local-jacobian"],
        ["joint-rate"],
        "the requested task twist and local Jacobian determine required joint rate",
        "directed",
        "many-to-one"
      ],
      [
        "jacobian-reveals-margin",
        "measures",
        ["local-jacobian", "task-twist"],
        ["direction-margin"],
        "the Jacobian and required task direction reveal directional motion margin",
        "directed",
        "many-to-one"
      ],
      [
        "margin-rejects-branch",
        "invalidates",
        ["direction-margin"],
        ["ik-branch"],
        "insufficient directional motion margin rejects an otherwise reachable inverse branch",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "declared-target-frame",
        "boundary",
        "The target pose, task twist and robot model use explicitly named and compatible reference frames.",
        ["target-pose", "task-twist", "ik-branch"],
        ["target-yields-branches", "jacobian-maps-rate"]
      ],
      [
        "joint-bounds-enforced",
        "criterion",
        "Every retained inverse branch remains inside robot joint position and rate bounds.",
        ["ik-branch", "joint-bounds", "joint-rate"],
        ["bounds-filter-branch", "twist-demands-rate"]
      ],
      [
        "conditioned-required-direction",
        "criterion",
        "The local Jacobian preserves adequate motion authority in every required task direction.",
        ["local-jacobian", "task-twist", "direction-margin"],
        [
          "jacobian-reveals-margin",
          "margin-rejects-branch",
          "twist-demands-rate"
        ]
      ],
      [
        "local-step-only",
        "assumption",
        "The Jacobian velocity relation is applied over a sufficiently small configuration change before it is recomputed.",
        ["ik-branch", "local-jacobian", "joint-rate"],
        ["branch-defines-jacobian", "jacobian-maps-rate"]
      ]
    ],
    failureBoundary: [
      "near-singular-branch",
      "conditioned-required-direction",
      "A stretched planar-arm branch reaches the target position but loses motion authority normal to the arm.",
      "The requested lateral tool twist requires joint rates beyond the declared robot limits.",
      "Reject or leave the near-singular branch unless a bounded alternative preserves the required task direction.",
      [
        "target-pose",
        "ik-branch",
        "local-jacobian",
        "task-twist",
        "joint-rate",
        "direction-margin"
      ],
      [
        "target-yields-branches",
        "branch-defines-jacobian",
        "twist-demands-rate",
        "jacobian-reveals-margin",
        "margin-rejects-branch"
      ]
    ],
    conceptualModel: [
      [
        "frame-target-pose",
        "Express the target tool pose in the named robot base or task frame.",
        ["target-pose"],
        ["target-yields-branches"],
        ["declared-target-frame"]
      ],
      [
        "enumerate-ik-branches",
        "Find distinct inverse joint branches that realise the framed target pose.",
        ["target-pose", "ik-branch"],
        ["target-yields-branches"],
        ["declared-target-frame"]
      ],
      [
        "filter-joint-bounds",
        "Remove inverse branches outside declared robot joint position bounds.",
        ["ik-branch", "joint-bounds"],
        ["bounds-filter-branch"],
        ["joint-bounds-enforced"]
      ],
      [
        "linearise-selected-branch",
        "Evaluate the robot Jacobian at each retained inverse branch.",
        ["ik-branch", "local-jacobian"],
        ["branch-defines-jacobian"],
        ["local-step-only"]
      ],
      [
        "test-motion-directions",
        "Map required task twists to robot joint rates and inspect directional motion margin.",
        ["local-jacobian", "task-twist", "joint-rate", "direction-margin"],
        [
          "twist-demands-rate",
          "jacobian-reveals-margin",
          "jacobian-maps-rate"
        ],
        ["conditioned-required-direction", "joint-bounds-enforced"]
      ],
      [
        "retain-continuous-branch",
        "Retain a bounded inverse branch with usable task-direction margin and continuity from the current robot state.",
        ["ik-branch", "joint-bounds", "direction-margin"],
        ["bounds-filter-branch", "margin-rejects-branch"],
        ["joint-bounds-enforced", "conditioned-required-direction"]
      ]
    ],
    reasonedCases: [
      {
        id: "two-branch-example",
        kind: "example",
        scenario:
          "A two-link planar arm has elbow-up and elbow-down inverse branches for a framed target, and the controller must select a bounded branch with lateral motion authority.",
        changedConditionIds: ["local-step-only"],
        givens: [
          [
            "branch-set",
            "Planar inverse solutions",
            "two geometrically valid joint branches in the robot base frame",
            null,
            "ik-branch"
          ],
          [
            "lateral-request",
            "Task motion",
            "a local lateral tool twist after reaching the target",
            null,
            "task-twist"
          ]
        ],
        reasoningSteps: [
          [
            "example-enumerate",
            "The framed target pose yields both inverse joint branches.",
            ["target-pose", "ik-branch"],
            ["target-yields-branches"],
            ["declared-target-frame"]
          ],
          [
            "example-filter",
            "Robot joint bounds reject any branch outside the permitted joint interval.",
            ["joint-bounds", "ik-branch"],
            ["bounds-filter-branch"],
            ["joint-bounds-enforced"]
          ],
          [
            "example-linearise",
            "Each remaining inverse branch defines a local robot Jacobian.",
            ["ik-branch", "local-jacobian"],
            ["branch-defines-jacobian"],
            ["local-step-only"]
          ],
          [
            "example-margin",
            "The requested task twist is retained only where the Jacobian produces bounded joint rate and usable directional margin.",
            ["task-twist", "local-jacobian", "joint-rate", "direction-margin"],
            ["twist-demands-rate", "jacobian-reveals-margin"],
            ["conditioned-required-direction", "joint-bounds-enforced"]
          ]
        ],
        outcome:
          "The selected inverse branch reaches the target and preserves bounded local motion in the required task direction.",
        criterionConditionId: "conditioned-required-direction",
        criterion:
          "A retained inverse branch must satisfy robot joint bounds and preserve Jacobian authority in the required task direction.",
        verification:
          "Compare every inverse branch against joint bounds, recompute its Jacobian and test the required task twists against joint-rate limits."
      },
      {
        id: "stretched-arm-counterexample",
        kind: "counterexample",
        scenario:
          "A stretched planar arm reaches the target with negligible pose residual but its local Jacobian loses the lateral task direction.",
        changedConditionIds: ["conditioned-required-direction"],
        givens: [
          [
            "stretched-pose",
            "Robot configuration",
            "collinear links at the requested target",
            null,
            "ik-branch"
          ],
          [
            "normal-motion",
            "Required task direction",
            "a local tool twist normal to the stretched arm",
            null,
            "task-twist"
          ]
        ],
        reasoningSteps: [
          [
            "counter-reach",
            "The target pose still maps to a numerically converged inverse branch.",
            ["target-pose", "ik-branch"],
            ["target-yields-branches"],
            ["declared-target-frame"]
          ],
          [
            "counter-jacobian",
            "The stretched inverse branch defines a rank-deficient local Jacobian.",
            ["ik-branch", "local-jacobian"],
            ["branch-defines-jacobian"],
            ["conditioned-required-direction"]
          ],
          [
            "counter-rate",
            "The requested lateral task twist demands an excessive or undefined robot joint rate.",
            ["task-twist", "local-jacobian", "joint-rate"],
            ["twist-demands-rate", "jacobian-maps-rate"],
            ["joint-bounds-enforced", "conditioned-required-direction"]
          ],
          [
            "counter-reject",
            "The missing directional motion margin invalidates the reached inverse branch.",
            ["direction-margin", "ik-branch"],
            ["jacobian-reveals-margin", "margin-rejects-branch"],
            ["conditioned-required-direction"]
          ]
        ],
        outcome:
          "Pose convergence hides a singular inverse branch that cannot execute the required local tool motion.",
        criterionConditionId: "conditioned-required-direction",
        criterion:
          "Target reachability is insufficient when the local Jacobian loses a required task-space direction.",
        verification:
          "Evaluate Jacobian rank or directional conditioning at the reached configuration and compare required joint rates with declared limits."
      }
    ],
    misconception: {
      id: "one-reached-branch-is-safe",
      claim:
        "One inverse solution with a small pose residual is sufficient proof of a usable robot configuration.",
      mechanism:
        "Inverse kinematics may have several branches, while joint limits and Jacobian singularities can invalidate a numerically reached branch.",
      correction:
        "Enumerate relevant inverse branches, enforce robot joint bounds and test required task directions with the local Jacobian.",
      disconfirmingObservation:
        "The reached stretched-arm branch demands excessive joint rate for a required lateral tool twist.",
      entityIds: [
        "target-pose",
        "ik-branch",
        "joint-bounds",
        "local-jacobian",
        "task-twist",
        "joint-rate",
        "direction-margin"
      ],
      relationIds: [
        "target-yields-branches",
        "bounds-filter-branch",
        "twist-demands-rate",
        "jacobian-reveals-margin",
        "margin-rejects-branch"
      ],
      conditionIds: [
        "joint-bounds-enforced",
        "conditioned-required-direction"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the inverse-kinematics decision from framed target to usable robot branch:",
            "The target, branch, bound and Jacobian sequence retains a feasible robot configuration.",
            "The target, branch, bound and Jacobian sequence accepts pose convergence before checking directional motion.",
            [
              "Frame the robot target before enumerating inverse branches.",
              "Test the local Jacobian after filtering robot joint bounds."
            ],
            [
              "Map the target pose to candidate robot joints.",
              "Retain a bounded branch with task-direction margin."
            ]
          ],
          focusRef: reasonedCase("two-branch-example", "scenario"),
          contextConditionIds: [
            "declared-target-frame",
            "joint-bounds-enforced",
            "conditioned-required-direction"
          ],
          steps: [
            [
              "enumerate",
              ["target-yields-branches"],
              ["declared-target-frame"]
            ],
            [
              "filter",
              ["bounds-filter-branch"],
              ["joint-bounds-enforced"]
            ],
            [
              "linearise",
              ["branch-defines-jacobian"],
              ["local-step-only"]
            ],
            [
              "test-direction",
              ["jacobian-reveals-margin"],
              ["conditioned-required-direction"]
            ]
          ],
          correctOrder: ["enumerate", "filter", "linearise", "test-direction"]
        },
        retry: {
          instruction: [
            "Trace the singular robot branch from reached target to rejection:",
            "The singularity retry exposes the Jacobian direction loss before rejecting the inverse branch.",
            "The singularity retry changes the framed target even though the local robot defect is the Jacobian.",
            [
              "Begin with the reached stretched-arm inverse branch.",
              "Follow the task twist to excessive joint rate and missing motion margin."
            ],
            [
              "Evaluate the local robot Jacobian at the branch.",
              "Reject the branch when the required task direction is lost."
            ]
          ],
          focusRef: reasonedCase("stretched-arm-counterexample", "scenario"),
          contextConditionIds: [
            "conditioned-required-direction",
            "joint-bounds-enforced"
          ],
          steps: [
            [
              "evaluate-stretch",
              ["branch-defines-jacobian"],
              ["conditioned-required-direction"]
            ],
            [
              "demand-rate",
              ["twist-demands-rate"],
              ["joint-bounds-enforced"]
            ],
            [
              "measure-margin",
              ["jacobian-reveals-margin"],
              ["conditioned-required-direction"]
            ],
            [
              "reject-singular",
              ["margin-rejects-branch"],
              ["conditioned-required-direction"]
            ]
          ],
          correctOrder: [
            "evaluate-stretch",
            "demand-rate",
            "measure-margin",
            "reject-singular"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence needed to retain an inverse robot branch:",
            "The selected inverse evidence covers target frame, robot bounds and directional Jacobian margin.",
            "The selected inverse evidence treats pose residual alone as a complete robot criterion.",
            [
              "Choose the framed target-to-branch relation.",
              "Choose both the joint-bound filter and the Jacobian direction check."
            ],
            [
              "Select evidence that the inverse branch reaches the named frame.",
              "Select evidence that required task motion remains bounded."
            ]
          ],
          focusRef: term("inverse-kinematics", "boundary"),
          contextConditionIds: [
            "declared-target-frame",
            "joint-bounds-enforced",
            "conditioned-required-direction"
          ],
          options: [
            [
              "framed-target",
              true,
              relation("target-yields-branches"),
              condition("declared-target-frame"),
              ["target-yields-branches"],
              ["declared-target-frame"],
              null
            ],
            [
              "bounded-branch",
              true,
              relation("bounds-filter-branch"),
              condition("joint-bounds-enforced"),
              ["bounds-filter-branch"],
              ["joint-bounds-enforced"],
              null
            ],
            [
              "direction-check",
              true,
              relation("jacobian-reveals-margin"),
              condition("conditioned-required-direction"),
              ["jacobian-reveals-margin"],
              ["conditioned-required-direction"],
              null
            ],
            [
              "residual-only",
              false,
              misconception("one-reached-branch-is-safe", "claim"),
              misconception("one-reached-branch-is-safe", "mechanism"),
              ["target-yields-branches"],
              ["conditioned-required-direction"],
              "one-reached-branch-is-safe"
            ],
            [
              "unbounded-rate",
              false,
              reasonedCase("stretched-arm-counterexample", "outcome"),
              condition("joint-bounds-enforced"),
              ["twist-demands-rate"],
              ["joint-bounds-enforced"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the records that diagnose a singular inverse solution:",
            "The selected singularity records link robot configuration, task direction and required joint rate.",
            "The selected singularity records use target reachability as evidence of full robot motion authority.",
            [
              "Inspect the local Jacobian at the stretched robot branch.",
              "Compare the required task twist with joint-rate and direction limits."
            ],
            [
              "Mark the branch-to-Jacobian relation.",
              "Mark the motion-margin relation that rejects the singular branch."
            ]
          ],
          focusRef: reasonedCase("stretched-arm-counterexample", "verification"),
          contextConditionIds: [
            "conditioned-required-direction",
            "local-step-only"
          ],
          options: [
            [
              "configuration-map",
              true,
              relation("branch-defines-jacobian"),
              condition("local-step-only"),
              ["branch-defines-jacobian"],
              ["local-step-only"],
              null
            ],
            [
              "rate-demand",
              true,
              relation("twist-demands-rate"),
              condition("joint-bounds-enforced"),
              ["twist-demands-rate"],
              ["joint-bounds-enforced"],
              null
            ],
            [
              "lost-direction",
              true,
              relation("margin-rejects-branch"),
              condition("conditioned-required-direction"),
              ["margin-rejects-branch"],
              ["conditioned-required-direction"],
              null
            ],
            [
              "pose-convergence",
              false,
              misconception("one-reached-branch-is-safe", "claim"),
              misconception("one-reached-branch-is-safe", "mechanism"),
              ["target-yields-branches"],
              ["conditioned-required-direction"],
              "one-reached-branch-is-safe"
            ],
            [
              "frame-change",
              false,
              reasonedCase("stretched-arm-counterexample", "outcome"),
              condition("declared-target-frame"),
              ["target-yields-branches"],
              ["declared-target-frame"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each inverse-kinematics decision to its controlling robot boundary:",
            "The target, branch and Jacobian decisions carry the frame, bound and direction criteria.",
            "An inverse decision is matched to a robot boundary that cannot test its failure.",
            [
              "Pair the target map with the declared reference frame.",
              "Pair the Jacobian margin with the required task direction."
            ],
            [
              "Match inverse branch filtering to robot joint bounds.",
              "Match local motion evaluation to Jacobian conditioning."
            ]
          ],
          focusRef: reasonedCase("two-branch-example", "criterion"),
          contextConditionIds: [
            "declared-target-frame",
            "joint-bounds-enforced",
            "conditioned-required-direction"
          ],
          pairs: [
            [
              "frame-pair",
              relation("target-yields-branches"),
              condition("declared-target-frame"),
              relation("target-yields-branches"),
              ["target-yields-branches"],
              ["declared-target-frame"]
            ],
            [
              "bound-pair",
              relation("bounds-filter-branch"),
              condition("joint-bounds-enforced"),
              relation("bounds-filter-branch"),
              ["bounds-filter-branch"],
              ["joint-bounds-enforced"]
            ],
            [
              "margin-pair",
              relation("jacobian-reveals-margin"),
              condition("conditioned-required-direction"),
              relation("jacobian-reveals-margin"),
              ["jacobian-reveals-margin"],
              ["conditioned-required-direction"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why the reached stretched-arm branch is not a usable inverse solution:",
            "The explanation connects the local Jacobian, requested task twist, excessive joint rate and branch rejection.",
            "The explanation reports only the small robot pose residual and omits directional motion.",
            [
              "Name the required task-space direction lost by the Jacobian.",
              "Connect the lost direction to robot joint-rate bounds."
            ],
            [
              "Explain how the inverse branch defines the local Jacobian.",
              "Apply the directional-motion criterion before retaining the branch."
            ]
          ],
          focusRef: misconception("one-reached-branch-is-safe", "claim"),
          contextConditionIds: [
            "conditioned-required-direction",
            "joint-bounds-enforced",
            "local-step-only"
          ],
          conceptGroups: [
            [
              "inverse-reach",
              term("inverse-kinematics", "label"),
              [
                term("inverse-kinematics", "definition"),
                relation("target-yields-branches")
              ],
              ["target-yields-branches"],
              ["declared-target-frame"]
            ],
            [
              "jacobian-direction",
              term("robot-jacobian", "label"),
              [
                term("robot-jacobian", "definition"),
                relation("jacobian-reveals-margin")
              ],
              ["jacobian-reveals-margin"],
              ["conditioned-required-direction"]
            ],
            [
              "rate-bound",
              relation("twist-demands-rate"),
              [
                relation("twist-demands-rate"),
                condition("joint-bounds-enforced")
              ],
              ["twist-demands-rate"],
              ["joint-bounds-enforced"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["margin-rejects-branch"],
          criterionConditionId: "conditioned-required-direction"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the inverse-branch diagram for the framed planar target:",
            "The diagram implication filters inverse joints and tests local Jacobian motion before retention.",
            "The diagram implication retains any reached robot branch without joint-bound or direction evidence.",
            [
              "Trace the target pose to multiple inverse branches.",
              "Follow the retained branch through its local Jacobian and motion margin."
            ],
            [
              "Identify the robot branch filter.",
              "Choose the implication that combines bounds with directional motion."
            ]
          ],
          focusRef: reasonedCase("two-branch-example", "scenario"),
          contextConditionIds: [
            "declared-target-frame",
            "joint-bounds-enforced",
            "conditioned-required-direction"
          ],
          positions: [
            ["target-pose", 0, 0],
            ["joint-bounds", 1, 1],
            ["ik-branch", 1, 0],
            ["local-jacobian", 2, 0],
            ["direction-margin", 3, 0]
          ],
          relationIds: [
            "target-yields-branches",
            "bounds-filter-branch",
            "branch-defines-jacobian",
            "margin-rejects-branch"
          ],
          answerRelationIds: [
            "bounds-filter-branch",
            "margin-rejects-branch"
          ],
          options: [
            [
              "retain-bounded-margin",
              true,
              reasonedCase("two-branch-example", "verification"),
              condition("conditioned-required-direction"),
              ["bounds-filter-branch", "margin-rejects-branch"],
              [
                "joint-bounds-enforced",
                "conditioned-required-direction"
              ],
              null
            ],
            [
              "retain-residual",
              false,
              misconception("one-reached-branch-is-safe", "claim"),
              misconception("one-reached-branch-is-safe", "mechanism"),
              ["target-yields-branches"],
              ["conditioned-required-direction"],
              "one-reached-branch-is-safe"
            ],
            [
              "ignore-bounds",
              false,
              reasonedCase("two-branch-example", "criterion"),
              condition("joint-bounds-enforced"),
              ["bounds-filter-branch"],
              ["joint-bounds-enforced"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the inverse diagram at the stretched-arm singularity:",
            "The singularity implication follows the task twist to excessive robot joint rate and branch rejection.",
            "The singularity implication treats the reached target as proof that every task direction remains available.",
            [
              "Start from the stretched inverse branch and its local Jacobian.",
              "Trace missing motion margin back to the branch decision."
            ],
            [
              "Identify the requested task twist and demanded joint rate.",
              "Choose the implication that rejects the singular robot branch."
            ]
          ],
          focusRef: reasonedCase("stretched-arm-counterexample", "scenario"),
          contextConditionIds: [
            "conditioned-required-direction",
            "joint-bounds-enforced"
          ],
          positions: [
            ["ik-branch", 0, 0],
            ["local-jacobian", 1, 0],
            ["task-twist", 1, 1],
            ["joint-rate", 2, 1],
            ["direction-margin", 2, 0]
          ],
          relationIds: [
            "branch-defines-jacobian",
            "jacobian-maps-rate",
            "twist-demands-rate",
            "jacobian-reveals-margin",
            "margin-rejects-branch"
          ],
          answerRelationIds: [
            "twist-demands-rate",
            "margin-rejects-branch"
          ],
          options: [
            [
              "reject-lost-direction",
              true,
              reasonedCase("stretched-arm-counterexample", "verification"),
              condition("conditioned-required-direction"),
              ["twist-demands-rate", "margin-rejects-branch"],
              [
                "conditioned-required-direction",
                "joint-bounds-enforced"
              ],
              null
            ],
            [
              "accept-reach",
              false,
              misconception("one-reached-branch-is-safe", "claim"),
              misconception("one-reached-branch-is-safe", "mechanism"),
              ["branch-defines-jacobian"],
              ["conditioned-required-direction"],
              "one-reached-branch-is-safe"
            ],
            [
              "change-frame",
              false,
              reasonedCase("stretched-arm-counterexample", "outcome"),
              condition("declared-target-frame"),
              ["jacobian-maps-rate"],
              ["declared-target-frame"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("robot-jacobian", "label"),
      focusRef: reasonedCase("two-branch-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["target-pose", 0, 0],
        ["joint-bounds", 1, 1],
        ["ik-branch", 1, 0],
        ["local-jacobian", 2, 0],
        ["task-twist", 2, 1],
        ["joint-rate", 3, 1],
        ["direction-margin", 3, 0]
      ],
      visibleEntityIds: [
        "target-pose",
        "joint-bounds",
        "ik-branch",
        "local-jacobian",
        "task-twist",
        "joint-rate",
        "direction-margin"
      ],
      visibleRelationIds: [
        "target-yields-branches",
        "bounds-filter-branch",
        "branch-defines-jacobian",
        "jacobian-maps-rate",
        "twist-demands-rate",
        "jacobian-reveals-margin",
        "margin-rejects-branch"
      ],
      controls: [
        [
          "bounded-branch",
          condition("joint-bounds-enforced"),
          ["joint-bounds-enforced", "local-step-only"],
          [
            "target-pose",
            "joint-bounds",
            "ik-branch",
            "local-jacobian",
            "direction-margin"
          ],
          [
            "target-yields-branches",
            "bounds-filter-branch",
            "branch-defines-jacobian",
            "jacobian-reveals-margin"
          ],
          ["margin-rejects-branch"],
          [],
          [
            [
              "usable-branch",
              "The bounded inverse branch retains robot motion authority.",
              ["ik-branch", "direction-margin"],
              ["jacobian-reveals-margin"]
            ]
          ],
          reasonedCase("two-branch-example", "verification")
        ],
        [
          "singular-direction",
          condition("conditioned-required-direction"),
          ["conditioned-required-direction"],
          [
            "ik-branch",
            "local-jacobian",
            "task-twist",
            "joint-rate",
            "direction-margin"
          ],
          [
            "branch-defines-jacobian",
            "twist-demands-rate",
            "jacobian-reveals-margin",
            "margin-rejects-branch"
          ],
          ["bounds-filter-branch"],
          [],
          [
            [
              "lost-direction",
              "The singular Jacobian rejects the reached inverse branch.",
              ["local-jacobian", "direction-margin", "ik-branch"],
              ["jacobian-reveals-margin", "margin-rejects-branch"]
            ]
          ],
          reasonedCase("stretched-arm-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L05",
    systemModel:
      "Robot inverse dynamics combines a time-based joint motion profile with inertia, velocity effects, gravity and external load to estimate required joint torque in declared SI units.",
    failurePattern:
      "A robot can follow the right geometric path in simulation yet exceed physical torque or current limits when payload, acceleration, friction, gravity sign or duty timing is wrong.",
    visualExplanation:
      "A torque ledger separates inertial, velocity-dependent, gravity and external-load contributions before comparing their signed sum with an actuator envelope and measured current.",
    applicationTask:
      "Build and challenge an inverse-dynamics torque budget for a payload lift, retaining signs, frames, N m units, sample timing and actuator boundaries.",
    terms: [
      [
        "inverse-dynamics",
        "Robot inverse dynamics",
        "The calculation of joint forces or torques required by a declared robot motion, model and external load.",
        "Inverse dynamics predicts effort for a motion; it does not prove that a chosen actuator can deliver that effort over its duty cycle.",
        "bind-motion-timeline"
      ],
      [
        "generalised-torque",
        "Generalised joint torque",
        "A signed joint effort expressed about each declared robot coordinate, normally in N m for revolute joints.",
        "Torque sign, joint axis and reference frame must remain consistent across every dynamic contribution.",
        "assemble-torque-ledger"
      ],
      [
        "torque-residual",
        "Dynamic torque residual",
        "The time-aligned difference between modelled joint torque and an independently inferred or measured joint effort.",
        "A small residual supports only the tested motion, payload, temperature and sensing boundary.",
        "compare-effort-trace"
      ]
    ],
    entities: [
      [
        "motion-timeline",
        "input",
        "Timed joint motion",
        "Joint position, velocity and acceleration samples with explicit seconds, radians and robot joint order."
      ],
      [
        "inertia-model",
        "mechanism",
        "Robot inertia model",
        "Mass, centre-of-mass and inertia parameters expressed in declared link frames."
      ],
      [
        "gravity-load",
        "input",
        "Gravity and payload load",
        "The gravity vector and external payload wrench expressed in compatible robot frames."
      ],
      [
        "torque-ledger",
        "state",
        "Signed torque ledger",
        "Separated inertial, velocity, gravity and external-load torque contributions over time."
      ],
      [
        "required-torque",
        "state",
        "Required joint torque",
        "The signed total robot joint torque trace in N m."
      ],
      [
        "actuator-envelope",
        "constraint",
        "Available effort envelope",
        "The joint-side torque and timing boundary available from the actuator and transmission."
      ],
      [
        "effort-observation",
        "observation",
        "Observed joint effort",
        "A time-aligned current-derived or measured joint-effort trace with declared calibration."
      ],
      [
        "dynamic-residual",
        "criterion",
        "Torque residual trace",
        "The signed difference between required and observed joint effort over the tested motion."
      ]
    ],
    relations: [
      [
        "motion-excites-inertia",
        "causes",
        ["motion-timeline", "inertia-model"],
        ["torque-ledger"],
        "timed robot acceleration and inertia produce the inertial torque contribution",
        "directed",
        "many-to-one"
      ],
      [
        "load-adds-torque",
        "causes",
        ["gravity-load", "motion-timeline"],
        ["torque-ledger"],
        "gravity and payload wrenches add signed joint torque over the robot motion",
        "directed",
        "many-to-one"
      ],
      [
        "ledger-sums-torque",
        "maps",
        ["torque-ledger"],
        ["required-torque"],
        "the signed dynamic ledger sums to the required robot joint torque",
        "directed",
        "many-to-one"
      ],
      [
        "envelope-constrains-torque",
        "constrains",
        ["actuator-envelope"],
        ["required-torque"],
        "the available effort envelope constrains required joint torque over time",
        "directed",
        "one-to-many"
      ],
      [
        "observation-compares-torque",
        "compares",
        ["required-torque", "effort-observation"],
        ["dynamic-residual"],
        "time-aligned required and observed effort produce a dynamic torque residual",
        "directed",
        "many-to-one"
      ],
      [
        "residual-invalidates-model",
        "invalidates",
        ["dynamic-residual"],
        ["inertia-model", "gravity-load"],
        "a structured torque residual invalidates the tested inertia or load assumptions",
        "directed",
        "one-to-many"
      ]
    ],
    conditions: [
      [
        "consistent-dynamic-coordinates",
        "boundary",
        "Joint axes, link frames, torque signs and SI units are consistent throughout the robot dynamics calculation.",
        ["motion-timeline", "inertia-model", "gravity-load", "torque-ledger"],
        ["motion-excites-inertia", "load-adds-torque", "ledger-sums-torque"]
      ],
      [
        "time-aligned-effort",
        "criterion",
        "Modelled and observed robot effort share the same sample clock, delay correction and joint order.",
        [
          "motion-timeline",
          "required-torque",
          "effort-observation",
          "dynamic-residual"
        ],
        ["observation-compares-torque"]
      ],
      [
        "bounded-model-parameters",
        "assumption",
        "Robot mass, inertia, payload and friction parameters remain inside independently justified bounds.",
        ["inertia-model", "gravity-load", "torque-ledger"],
        [
          "motion-excites-inertia",
          "load-adds-torque",
          "residual-invalidates-model"
        ]
      ],
      [
        "declared-effort-duration",
        "boundary",
        "Available and required torque are compared over the same peak and continuous duration boundary.",
        ["required-torque", "actuator-envelope"],
        ["envelope-constrains-torque"]
      ]
    ],
    failureBoundary: [
      "payload-model-mismatch",
      "bounded-model-parameters",
      "The inverse-dynamics model uses the unloaded robot inertia while the physical lift carries an added payload.",
      "Observed current-derived effort rises with the payload segment and the torque residual keeps the gravity-dependent sign.",
      "Reject the unloaded torque model until payload mass, centre of mass, frames and effort calibration are reconciled.",
      [
        "motion-timeline",
        "inertia-model",
        "gravity-load",
        "torque-ledger",
        "required-torque",
        "effort-observation",
        "dynamic-residual"
      ],
      [
        "motion-excites-inertia",
        "load-adds-torque",
        "ledger-sums-torque",
        "observation-compares-torque",
        "residual-invalidates-model"
      ]
    ],
    conceptualModel: [
      [
        "bind-motion-timeline",
        "Record robot joint position, velocity and acceleration against a declared seconds-based sample clock.",
        ["motion-timeline"],
        ["motion-excites-inertia"],
        ["time-aligned-effort"]
      ],
      [
        "declare-dynamic-frames",
        "Express link inertia, gravity and payload wrench in compatible robot coordinate frames.",
        ["inertia-model", "gravity-load"],
        ["motion-excites-inertia", "load-adds-torque"],
        ["consistent-dynamic-coordinates"]
      ],
      [
        "assemble-torque-ledger",
        "Compute signed inertial, velocity, gravity and payload contributions in N m for every joint sample.",
        ["motion-timeline", "inertia-model", "gravity-load", "torque-ledger"],
        ["motion-excites-inertia", "load-adds-torque"],
        ["consistent-dynamic-coordinates", "bounded-model-parameters"]
      ],
      [
        "sum-required-effort",
        "Sum the robot torque ledger without discarding contribution signs or timing.",
        ["torque-ledger", "required-torque"],
        ["ledger-sums-torque"],
        ["consistent-dynamic-coordinates"]
      ],
      [
        "check-effort-envelope",
        "Compare required torque with the joint-side effort envelope over matched peak and continuous durations.",
        ["required-torque", "actuator-envelope"],
        ["envelope-constrains-torque"],
        ["declared-effort-duration"]
      ],
      [
        "compare-effort-trace",
        "Align observed robot effort with the required torque and inspect the residual shape against motion and load.",
        ["required-torque", "effort-observation", "dynamic-residual"],
        ["observation-compares-torque", "residual-invalidates-model"],
        ["time-aligned-effort", "bounded-model-parameters"]
      ]
    ],
    reasonedCases: [
      {
        id: "payload-lift-example",
        kind: "example",
        scenario:
          "A robot joint lifts a declared payload through a timed motion while inverse dynamics separates acceleration torque from gravity and payload torque.",
        changedConditionIds: ["declared-effort-duration"],
        givens: [
          [
            "lift-trace",
            "Timed robot motion",
            "position, velocity and acceleration in joint order with seconds",
            "s",
            "motion-timeline"
          ],
          [
            "payload-wrench",
            "External load",
            "payload mass and centre of mass expressed in the tool frame",
            "kg",
            "gravity-load"
          ]
        ],
        reasoningSteps: [
          [
            "example-frames",
            "The payload wrench and robot inertia use compatible declared frames and joint signs.",
            ["inertia-model", "gravity-load", "motion-timeline"],
            ["motion-excites-inertia", "load-adds-torque"],
            ["consistent-dynamic-coordinates"]
          ],
          [
            "example-ledger",
            "The torque ledger retains separate inertial and gravity-dependent contributions in N m.",
            ["torque-ledger", "required-torque"],
            ["ledger-sums-torque"],
            ["bounded-model-parameters"]
          ],
          [
            "example-envelope",
            "Required joint torque remains inside the matched-duration actuator envelope.",
            ["required-torque", "actuator-envelope"],
            ["envelope-constrains-torque"],
            ["declared-effort-duration"]
          ],
          [
            "example-residual",
            "The time-aligned observed effort leaves no structured payload-dependent torque residual.",
            ["required-torque", "effort-observation", "dynamic-residual"],
            ["observation-compares-torque"],
            ["time-aligned-effort"]
          ]
        ],
        outcome:
          "The inverse-dynamics model explains the tested payload lift and stays within the declared effort-duration envelope.",
        criterionConditionId: "time-aligned-effort",
        criterion:
          "Required torque must use consistent robot coordinates and agree with time-aligned effort within the tested model bounds.",
        verification:
          "Plot each signed torque contribution, total required N m, available N m and calibrated observed effort on the same sample clock."
      },
      {
        id: "unmodelled-payload-counterexample",
        kind: "counterexample",
        scenario:
          "The same robot lift carries an unmodelled payload, but the inverse-dynamics calculation still uses the unloaded inertia and gravity load.",
        changedConditionIds: ["bounded-model-parameters"],
        givens: [
          [
            "unloaded-parameters",
            "Robot model state",
            "link mass and centre of mass exclude the attached payload",
            "kg",
            "inertia-model"
          ],
          [
            "loaded-current",
            "Observed effort state",
            "calibrated joint current increases during payload support",
            null,
            "effort-observation"
          ]
        ],
        reasoningSteps: [
          [
            "counter-model",
            "The unloaded inertia model understates the physical gravity and payload load.",
            ["inertia-model", "gravity-load"],
            ["load-adds-torque"],
            ["bounded-model-parameters"]
          ],
          [
            "counter-total",
            "The signed torque ledger therefore understates required joint torque during the loaded segment.",
            ["torque-ledger", "required-torque"],
            ["ledger-sums-torque"],
            ["consistent-dynamic-coordinates"]
          ],
          [
            "counter-align",
            "Time alignment shows the observed effort rises while the predicted payload contribution is missing.",
            ["required-torque", "effort-observation", "dynamic-residual"],
            ["observation-compares-torque"],
            ["time-aligned-effort"]
          ],
          [
            "counter-reject",
            "The structured gravity-dependent torque residual invalidates the unloaded robot model.",
            ["dynamic-residual", "inertia-model", "gravity-load"],
            ["residual-invalidates-model"],
            ["bounded-model-parameters"]
          ]
        ],
        outcome:
          "Correct kinematic motion coexists with an invalid dynamic torque prediction and an unsafe effort margin.",
        criterionConditionId: "bounded-model-parameters",
        criterion:
          "Payload and inertia parameters must describe the physical robot configuration used by the effort trace.",
        verification:
          "Repeat the aligned torque comparison with the payload model included and confirm the load-dependent residual changes as predicted."
      }
    ],
    misconception: {
      id: "correct-path-proves-dynamics",
      claim:
        "A robot that follows the commanded joint path proves that its inverse-dynamics torque model is correct.",
      mechanism:
        "Feedback control can hide missing payload, friction or inertia terms by supplying unmodelled actuator effort.",
      correction:
        "Retain signed torque contributions, enforce the effort-duration envelope and compare predictions with time-aligned observed effort.",
      disconfirmingObservation:
        "The robot tracks position while calibrated current and the payload-dependent torque residual exceed the unloaded prediction.",
      entityIds: [
        "motion-timeline",
        "inertia-model",
        "gravity-load",
        "torque-ledger",
        "required-torque",
        "actuator-envelope",
        "effort-observation",
        "dynamic-residual"
      ],
      relationIds: [
        "motion-excites-inertia",
        "load-adds-torque",
        "ledger-sums-torque",
        "envelope-constrains-torque",
        "observation-compares-torque",
        "residual-invalidates-model"
      ],
      conditionIds: [
        "bounded-model-parameters",
        "time-aligned-effort",
        "declared-effort-duration"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the robot dynamics workflow from timed motion to validated joint effort:",
            "The motion, torque-ledger, envelope and residual sequence preserves robot timing and signed effort.",
            "The motion, torque-ledger, envelope and residual sequence checks current before calculating required torque.",
            [
              "Bind the robot motion clock before assembling dynamic torque.",
              "Compare the required effort envelope before interpreting the residual."
            ],
            [
              "Calculate signed torque contributions from motion and load.",
              "Align predicted and observed robot effort after the envelope check."
            ]
          ],
          focusRef: reasonedCase("payload-lift-example", "scenario"),
          contextConditionIds: [
            "consistent-dynamic-coordinates",
            "declared-effort-duration",
            "time-aligned-effort"
          ],
          steps: [
            [
              "excite-model",
              ["motion-excites-inertia", "load-adds-torque"],
              ["consistent-dynamic-coordinates"]
            ],
            [
              "sum-ledger",
              ["ledger-sums-torque"],
              ["bounded-model-parameters"]
            ],
            [
              "check-envelope",
              ["envelope-constrains-torque"],
              ["declared-effort-duration"]
            ],
            [
              "inspect-residual",
              ["observation-compares-torque"],
              ["time-aligned-effort"]
            ]
          ],
          correctOrder: [
            "excite-model",
            "sum-ledger",
            "check-envelope",
            "inspect-residual"
          ]
        },
        retry: {
          instruction: [
            "Trace the unmodelled payload through the robot torque residual:",
            "The payload retry follows missing load torque into the required-effort error and model rejection.",
            "The payload retry changes the robot path even though the fault is the physical load model.",
            [
              "Start with the omitted payload in the robot model.",
              "End with the structured time-aligned torque residual."
            ],
            [
              "Follow gravity and payload load into the signed torque ledger.",
              "Use the effort residual to reject the unloaded dynamics."
            ]
          ],
          focusRef: reasonedCase("unmodelled-payload-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-model-parameters",
            "time-aligned-effort"
          ],
          steps: [
            [
              "omit-load",
              ["load-adds-torque"],
              ["bounded-model-parameters"]
            ],
            [
              "understate-total",
              ["ledger-sums-torque"],
              ["consistent-dynamic-coordinates"]
            ],
            [
              "form-residual",
              ["observation-compares-torque"],
              ["time-aligned-effort"]
            ],
            [
              "reject-model",
              ["residual-invalidates-model"],
              ["bounded-model-parameters"]
            ]
          ],
          correctOrder: [
            "omit-load",
            "understate-total",
            "form-residual",
            "reject-model"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a defensible robot torque budget:",
            "The selected dynamics evidence covers signed coordinates, effort duration and time-aligned residual.",
            "The selected dynamics evidence accepts joint-path tracking without measured robot effort.",
            [
              "Choose the relation that forms required joint torque.",
              "Choose the envelope and observed-effort comparisons."
            ],
            [
              "Select evidence that every robot torque contribution shares coordinates.",
              "Select evidence that available and observed effort use matching time."
            ]
          ],
          focusRef: term("inverse-dynamics", "definition"),
          contextConditionIds: [
            "consistent-dynamic-coordinates",
            "declared-effort-duration",
            "time-aligned-effort"
          ],
          options: [
            [
              "signed-ledger",
              true,
              relation("ledger-sums-torque"),
              condition("consistent-dynamic-coordinates"),
              ["ledger-sums-torque"],
              ["consistent-dynamic-coordinates"],
              null
            ],
            [
              "duration-envelope",
              true,
              relation("envelope-constrains-torque"),
              condition("declared-effort-duration"),
              ["envelope-constrains-torque"],
              ["declared-effort-duration"],
              null
            ],
            [
              "aligned-residual",
              true,
              relation("observation-compares-torque"),
              condition("time-aligned-effort"),
              ["observation-compares-torque"],
              ["time-aligned-effort"],
              null
            ],
            [
              "path-only",
              false,
              misconception("correct-path-proves-dynamics", "claim"),
              misconception("correct-path-proves-dynamics", "mechanism"),
              ["motion-excites-inertia"],
              ["bounded-model-parameters"],
              "correct-path-proves-dynamics"
            ],
            [
              "unsigned-total",
              false,
              reasonedCase("unmodelled-payload-counterexample", "outcome"),
              condition("consistent-dynamic-coordinates"),
              ["ledger-sums-torque"],
              ["consistent-dynamic-coordinates"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the robot records that isolate a payload-model error:",
            "The diagnostic records connect load torque, observed effort and the structured dynamic residual.",
            "The diagnostic records blame robot tracking without testing payload-dependent effort.",
            [
              "Inspect the gravity and payload contribution in the torque ledger.",
              "Retain the clock alignment when comparing current-derived effort."
            ],
            [
              "Mark the relation that adds payload torque.",
              "Mark the residual relation that invalidates the unloaded model."
            ]
          ],
          focusRef: reasonedCase("unmodelled-payload-counterexample", "verification"),
          contextConditionIds: [
            "bounded-model-parameters",
            "time-aligned-effort"
          ],
          options: [
            [
              "payload-contribution",
              true,
              relation("load-adds-torque"),
              condition("bounded-model-parameters"),
              ["load-adds-torque"],
              ["bounded-model-parameters"],
              null
            ],
            [
              "effort-comparison",
              true,
              relation("observation-compares-torque"),
              condition("time-aligned-effort"),
              ["observation-compares-torque"],
              ["time-aligned-effort"],
              null
            ],
            [
              "model-rejection",
              true,
              relation("residual-invalidates-model"),
              reasonedCase("unmodelled-payload-counterexample", "criterion"),
              ["residual-invalidates-model"],
              ["bounded-model-parameters"],
              null
            ],
            [
              "tracking-proof",
              false,
              misconception("correct-path-proves-dynamics", "claim"),
              misconception("correct-path-proves-dynamics", "mechanism"),
              ["motion-excites-inertia"],
              ["time-aligned-effort"],
              "correct-path-proves-dynamics"
            ],
            [
              "duration-only",
              false,
              condition("declared-effort-duration"),
              reasonedCase("unmodelled-payload-counterexample", "outcome"),
              ["envelope-constrains-torque"],
              ["declared-effort-duration"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain how a robot inverse-dynamics model earns confidence for a payload lift:",
            "The explanation connects timed motion, signed torque terms, effort duration and aligned residual.",
            "The explanation cites the correct robot path but omits physical effort and model bounds.",
            [
              "Define generalised joint torque with its sign and N m unit.",
              "Connect required robot effort to both the actuator envelope and measured trace."
            ],
            [
              "Explain how the torque ledger is assembled.",
              "Use the dynamic residual to challenge inertia and payload assumptions."
            ]
          ],
          focusRef: misconception("correct-path-proves-dynamics", "claim"),
          contextConditionIds: [
            "consistent-dynamic-coordinates",
            "time-aligned-effort",
            "bounded-model-parameters"
          ],
          conceptGroups: [
            [
              "dynamics-definition",
              term("inverse-dynamics", "label"),
              [
                term("inverse-dynamics", "definition"),
                relation("motion-excites-inertia")
              ],
              ["motion-excites-inertia"],
              ["bounded-model-parameters"]
            ],
            [
              "torque-definition",
              term("generalised-torque", "label"),
              [
                term("generalised-torque", "definition"),
                relation("ledger-sums-torque")
              ],
              ["ledger-sums-torque"],
              ["consistent-dynamic-coordinates"]
            ],
            [
              "residual-evidence",
              term("torque-residual", "label"),
              [
                term("torque-residual", "definition"),
                relation("observation-compares-torque")
              ],
              ["observation-compares-torque"],
              ["time-aligned-effort"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["residual-invalidates-model"],
          criterionConditionId: "time-aligned-effort"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each robot dynamics operation to its controlling boundary:",
            "The torque, effort and residual operations carry coordinate, duration and clock boundaries.",
            "A dynamics operation is paired with a boundary that cannot test its robot effort error.",
            [
              "Pair signed torque assembly with consistent robot coordinates.",
              "Pair predicted-observed comparison with time alignment."
            ],
            [
              "Match effort-envelope comparison to declared duration.",
              "Match load-model rejection to bounded physical parameters."
            ]
          ],
          focusRef: reasonedCase("unmodelled-payload-counterexample", "criterion"),
          contextConditionIds: [
            "consistent-dynamic-coordinates",
            "declared-effort-duration",
            "time-aligned-effort"
          ],
          pairs: [
            [
              "coordinate-pair",
              relation("ledger-sums-torque"),
              condition("consistent-dynamic-coordinates"),
              relation("ledger-sums-torque"),
              ["ledger-sums-torque"],
              ["consistent-dynamic-coordinates"]
            ],
            [
              "duration-pair",
              relation("envelope-constrains-torque"),
              condition("declared-effort-duration"),
              relation("envelope-constrains-torque"),
              ["envelope-constrains-torque"],
              ["declared-effort-duration"]
            ],
            [
              "alignment-pair",
              relation("observation-compares-torque"),
              condition("time-aligned-effort"),
              relation("observation-compares-torque"),
              ["observation-compares-torque"],
              ["time-aligned-effort"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the robot torque-ledger diagram for the payload lift:",
            "The diagram implication sums signed dynamic terms and compares required torque with available effort.",
            "The diagram implication infers correct dynamics from robot motion without an effort boundary.",
            [
              "Trace timed robot motion and physical load into the torque ledger.",
              "Follow the required torque to its duration-matched envelope."
            ],
            [
              "Identify the signed torque summation.",
              "Choose the implication that retains the available effort envelope."
            ]
          ],
          focusRef: reasonedCase("payload-lift-example", "scenario"),
          contextConditionIds: [
            "consistent-dynamic-coordinates",
            "declared-effort-duration"
          ],
          positions: [
            ["motion-timeline", 0, 0],
            ["gravity-load", 0, 1],
            ["torque-ledger", 1, 0],
            ["required-torque", 2, 0],
            ["actuator-envelope", 2, 1]
          ],
          relationIds: [
            "load-adds-torque",
            "ledger-sums-torque",
            "envelope-constrains-torque"
          ],
          answerRelationIds: [
            "ledger-sums-torque",
            "envelope-constrains-torque"
          ],
          options: [
            [
              "retain-effort-boundary",
              true,
              reasonedCase("payload-lift-example", "verification"),
              condition("declared-effort-duration"),
              ["ledger-sums-torque", "envelope-constrains-torque"],
              [
                "consistent-dynamic-coordinates",
                "declared-effort-duration"
              ],
              null
            ],
            [
              "trust-path",
              false,
              misconception("correct-path-proves-dynamics", "claim"),
              misconception("correct-path-proves-dynamics", "mechanism"),
              ["load-adds-torque"],
              ["bounded-model-parameters"],
              "correct-path-proves-dynamics"
            ],
            [
              "ignore-duration",
              false,
              reasonedCase("payload-lift-example", "criterion"),
              condition("declared-effort-duration"),
              ["envelope-constrains-torque"],
              ["declared-effort-duration"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the robot effort diagram for the unmodelled payload:",
            "The counterexample implication uses the aligned residual to invalidate missing load parameters.",
            "The counterexample implication changes the joint path while retaining the unloaded dynamics model.",
            [
              "Compare required and observed robot effort on one clock.",
              "Follow the structured residual back to inertia and payload assumptions."
            ],
            [
              "Identify the torque residual relation.",
              "Choose the implication that rejects the unloaded robot model."
            ]
          ],
          focusRef: reasonedCase("unmodelled-payload-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-model-parameters",
            "time-aligned-effort"
          ],
          positions: [
            ["required-torque", 0, 0],
            ["effort-observation", 0, 1],
            ["dynamic-residual", 1, 0],
            ["inertia-model", 2, 0],
            ["gravity-load", 2, 1]
          ],
          relationIds: [
            "observation-compares-torque",
            "residual-invalidates-model"
          ],
          answerRelationIds: ["residual-invalidates-model"],
          options: [
            [
              "reject-unloaded-model",
              true,
              reasonedCase("unmodelled-payload-counterexample", "verification"),
              condition("bounded-model-parameters"),
              [
                "observation-compares-torque",
                "residual-invalidates-model"
              ],
              ["bounded-model-parameters", "time-aligned-effort"],
              null
            ],
            [
              "accept-tracking",
              false,
              misconception("correct-path-proves-dynamics", "claim"),
              misconception("correct-path-proves-dynamics", "mechanism"),
              ["observation-compares-torque"],
              ["time-aligned-effort"],
              "correct-path-proves-dynamics"
            ],
            [
              "discard-clock",
              false,
              reasonedCase("unmodelled-payload-counterexample", "outcome"),
              condition("time-aligned-effort"),
              ["residual-invalidates-model"],
              ["time-aligned-effort"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("torque-residual", "label"),
      focusRef: reasonedCase("payload-lift-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["motion-timeline", 0, 0],
        ["inertia-model", 0, 1],
        ["gravity-load", 1, 1],
        ["torque-ledger", 1, 0],
        ["required-torque", 2, 0],
        ["actuator-envelope", 2, 1],
        ["effort-observation", 3, 1],
        ["dynamic-residual", 3, 0]
      ],
      visibleEntityIds: [
        "motion-timeline",
        "inertia-model",
        "gravity-load",
        "torque-ledger",
        "required-torque",
        "actuator-envelope",
        "effort-observation",
        "dynamic-residual"
      ],
      visibleRelationIds: [
        "motion-excites-inertia",
        "load-adds-torque",
        "ledger-sums-torque",
        "envelope-constrains-torque",
        "observation-compares-torque",
        "residual-invalidates-model"
      ],
      controls: [
        [
          "declared-payload",
          condition("bounded-model-parameters"),
          ["bounded-model-parameters", "declared-effort-duration"],
          [
            "motion-timeline",
            "inertia-model",
            "gravity-load",
            "torque-ledger",
            "required-torque",
            "actuator-envelope"
          ],
          [
            "motion-excites-inertia",
            "load-adds-torque",
            "ledger-sums-torque",
            "envelope-constrains-torque"
          ],
          ["residual-invalidates-model"],
          [],
          [
            [
              "bounded-effort",
              "The declared payload produces a bounded robot torque budget.",
              ["gravity-load", "required-torque", "actuator-envelope"],
              ["load-adds-torque", "envelope-constrains-torque"]
            ]
          ],
          reasonedCase("payload-lift-example", "verification")
        ],
        [
          "omitted-payload",
          condition("time-aligned-effort"),
          ["time-aligned-effort"],
          [
            "required-torque",
            "effort-observation",
            "dynamic-residual",
            "inertia-model",
            "gravity-load"
          ],
          [
            "observation-compares-torque",
            "residual-invalidates-model"
          ],
          ["envelope-constrains-torque"],
          [],
          [
            [
              "load-residual",
              "The aligned torque residual rejects the unloaded robot model.",
              ["dynamic-residual", "inertia-model", "gravity-load"],
              ["residual-invalidates-model"]
            ]
          ],
          reasonedCase("unmodelled-payload-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L06",
    systemModel:
      "Actuator selection maps a timed joint-side torque-speed demand through transmission ratio and losses into motor current, speed and thermal operating points.",
    failurePattern:
      "A motor and gearbox can satisfy one static torque value yet fail the mission through overspeed, voltage saturation, heating, reflected inertia, backlash or regenerative operation.",
    visualExplanation:
      "A joint-side operating envelope is transformed through a transmission chain into motor-side torque-speed points, then checked against electrical and thermal boundaries over the mission cycle.",
    applicationTask:
      "Select and challenge a motor-transmission candidate for a robot joint using N m, rad/s, A, V and seconds-based operating envelopes rather than a single catalogue rating.",
    terms: [
      [
        "operating-envelope",
        "Joint operating envelope",
        "The set of required torque-speed-duration points for a robot joint across its declared mission cycle.",
        "A peak point alone does not describe continuous, braking, reversing or dwell operation.",
        "construct-joint-demand"
      ],
      [
        "transmission-ratio",
        "Transmission ratio",
        "The signed relationship between motor-side and joint-side angular speed and torque before losses.",
        "A larger reduction changes speed, torque and reflected inertia; it does not create loss-free power.",
        "transform-operating-points"
      ],
      [
        "reflected-inertia",
        "Reflected load inertia",
        "The load inertia expressed at the motor shaft through the squared transmission ratio convention.",
        "The ratio convention and reference side must be declared before comparing reflected inertia.",
        "check-transient-response"
      ]
    ],
    entities: [
      [
        "mission-cycle",
        "input",
        "Timed robot mission",
        "The ordered acceleration, motion, braking, dwell and reversal segments with duration in seconds."
      ],
      [
        "joint-demand",
        "state",
        "Joint torque-speed demand",
        "Required joint-side torque in N m and angular speed in rad/s over the mission."
      ],
      [
        "transmission-chain",
        "mechanism",
        "Robot transmission chain",
        "The gearbox, belt, leadscrew or direct-drive path with signed ratio, efficiency, backlash and limits."
      ],
      [
        "motor-operating-points",
        "state",
        "Motor operating points",
        "Motor-shaft torque, speed, current and voltage states derived for every mission segment."
      ],
      [
        "drive-envelope",
        "constraint",
        "Motor-drive envelope",
        "The speed, current, voltage and regenerative limits of the motor and electronic drive."
      ],
      [
        "thermal-state",
        "state",
        "Actuator thermal state",
        "The winding and case temperature response over repeated mission cycles and cooling conditions."
      ],
      [
        "selection-margin",
        "criterion",
        "Actuator selection margin",
        "The smallest retained electrical, mechanical and thermal margin across all declared operating points."
      ]
    ],
    relations: [
      [
        "cycle-generates-demand",
        "maps",
        ["mission-cycle"],
        ["joint-demand"],
        "the timed robot mission generates the joint torque-speed demand",
        "directed",
        "one-to-many"
      ],
      [
        "transmission-maps-points",
        "transforms",
        ["joint-demand", "transmission-chain"],
        ["motor-operating-points"],
        "the signed transmission ratio and losses transform joint demand into motor operating points",
        "directed",
        "many-to-one"
      ],
      [
        "drive-constrains-points",
        "constrains",
        ["drive-envelope"],
        ["motor-operating-points"],
        "motor-drive speed, current, voltage and regeneration boundaries constrain operating points",
        "directed",
        "one-to-many"
      ],
      [
        "cycle-causes-heating",
        "causes",
        ["mission-cycle", "motor-operating-points"],
        ["thermal-state"],
        "mission timing and motor current cause the actuator thermal trajectory",
        "directed",
        "many-to-one"
      ],
      [
        "points-support-margin",
        "supports",
        ["motor-operating-points", "drive-envelope"],
        ["selection-margin"],
        "bounded motor operating points support the electrical and mechanical selection margin",
        "directed",
        "many-to-one"
      ],
      [
        "thermal-constrains-margin",
        "constrains",
        ["thermal-state"],
        ["selection-margin"],
        "the repeated-cycle thermal state constrains actuator selection margin",
        "directed",
        "one-to-one"
      ],
      [
        "margin-invalidates-chain",
        "invalidates",
        ["selection-margin"],
        ["transmission-chain"],
        "a negative speed, effort or thermal margin invalidates the motor-transmission candidate",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "declared-ratio-convention",
        "boundary",
        "Motor-side and joint-side speed, torque, direction and ratio conventions are declared before transformation.",
        ["joint-demand", "transmission-chain", "motor-operating-points"],
        ["transmission-maps-points"]
      ],
      [
        "bounded-transmission-loss",
        "assumption",
        "Transmission efficiency, backlash and reflected inertia remain within justified bounds for each motion direction.",
        ["joint-demand", "transmission-chain", "motor-operating-points"],
        ["transmission-maps-points", "margin-invalidates-chain"]
      ],
      [
        "complete-duty-cycle",
        "criterion",
        "Electrical and thermal checks include every acceleration, braking, dwell and repeated-cycle duration.",
        [
          "mission-cycle",
          "motor-operating-points",
          "drive-envelope",
          "thermal-state"
        ],
        ["drive-constrains-points", "cycle-causes-heating"]
      ],
      [
        "matched-operating-environment",
        "boundary",
        "Motor-drive limits and thermal models use the declared supply voltage, cooling path and ambient condition.",
        ["drive-envelope", "thermal-state", "selection-margin"],
        [
          "drive-constrains-points",
          "thermal-constrains-margin",
          "points-support-margin"
        ]
      ]
    ],
    failureBoundary: [
      "high-ratio-thermal-failure",
      "complete-duty-cycle",
      "A high reduction ratio meets static joint torque but maps fast joint motion to motor overspeed and repeated acceleration to excessive current heating.",
      "The transformed motor points leave the drive envelope and the predicted thermal state accumulates across mission cycles.",
      "Reject the ratio unless every motor-side speed, current, voltage and thermal state remains inside its matched boundary.",
      [
        "mission-cycle",
        "joint-demand",
        "transmission-chain",
        "motor-operating-points",
        "drive-envelope",
        "thermal-state",
        "selection-margin"
      ],
      [
        "cycle-generates-demand",
        "transmission-maps-points",
        "drive-constrains-points",
        "cycle-causes-heating",
        "points-support-margin",
        "thermal-constrains-margin",
        "margin-invalidates-chain"
      ]
    ],
    conceptualModel: [
      [
        "construct-joint-demand",
        "Convert the robot motion and load into joint-side N m and rad/s points over a seconds-based mission timeline.",
        ["mission-cycle", "joint-demand"],
        ["cycle-generates-demand"],
        ["complete-duty-cycle"]
      ],
      [
        "declare-transmission-chain",
        "Declare the signed ratio, efficiency direction, backlash, stiffness and mechanical limits of the transmission.",
        ["transmission-chain"],
        ["transmission-maps-points"],
        ["declared-ratio-convention", "bounded-transmission-loss"]
      ],
      [
        "transform-operating-points",
        "Transform every joint torque-speed point to motor torque, speed, current and voltage without discarding braking states.",
        ["joint-demand", "transmission-chain", "motor-operating-points"],
        ["transmission-maps-points"],
        ["declared-ratio-convention", "complete-duty-cycle"]
      ],
      [
        "check-transient-response",
        "Use reflected load inertia and drive limits to test acceleration and reversal response.",
        ["transmission-chain", "motor-operating-points", "drive-envelope"],
        ["drive-constrains-points"],
        ["bounded-transmission-loss", "matched-operating-environment"]
      ],
      [
        "integrate-thermal-cycle",
        "Propagate current-dependent heating and cooling across repeated robot mission segments.",
        ["mission-cycle", "motor-operating-points", "thermal-state"],
        ["cycle-causes-heating"],
        ["complete-duty-cycle", "matched-operating-environment"]
      ],
      [
        "retain-selection-margin",
        "Retain the motor-transmission candidate only when electrical, mechanical and thermal margins remain non-negative.",
        [
          "motor-operating-points",
          "drive-envelope",
          "thermal-state",
          "selection-margin"
        ],
        [
          "points-support-margin",
          "thermal-constrains-margin",
          "margin-invalidates-chain"
        ],
        ["matched-operating-environment", "complete-duty-cycle"]
      ]
    ],
    reasonedCases: [
      {
        id: "mission-envelope-example",
        kind: "example",
        scenario:
          "A robot joint accelerates, cruises, brakes, dwells and reverses while a motor-transmission candidate is evaluated over the complete repeated mission.",
        changedConditionIds: ["matched-operating-environment"],
        givens: [
          [
            "joint-trace",
            "Joint operating trace",
            "signed torque and angular speed across all mission segments",
            "N m and rad/s",
            "joint-demand"
          ],
          [
            "drive-context",
            "Electrical and thermal context",
            "declared supply voltage, current limits, cooling path and ambient condition",
            "V and A",
            "drive-envelope"
          ]
        ],
        reasoningSteps: [
          [
            "example-transform",
            "The signed transmission convention maps every joint demand point to a motor operating point.",
            ["joint-demand", "transmission-chain", "motor-operating-points"],
            ["transmission-maps-points"],
            ["declared-ratio-convention", "bounded-transmission-loss"]
          ],
          [
            "example-electrical",
            "Motor speed, current, voltage and braking states remain inside the matched drive envelope.",
            ["motor-operating-points", "drive-envelope"],
            ["drive-constrains-points", "points-support-margin"],
            ["matched-operating-environment"]
          ],
          [
            "example-thermal",
            "Repeated mission current and dwell cooling produce a bounded actuator thermal state.",
            ["mission-cycle", "motor-operating-points", "thermal-state"],
            ["cycle-causes-heating", "thermal-constrains-margin"],
            ["complete-duty-cycle", "matched-operating-environment"]
          ],
          [
            "example-margin",
            "The smallest electrical, mechanical and thermal selection margin remains non-negative.",
            ["selection-margin", "transmission-chain"],
            ["margin-invalidates-chain"],
            ["complete-duty-cycle"]
          ]
        ],
        outcome:
          "The motor-transmission candidate covers the complete joint operating envelope in the declared electrical and thermal environment.",
        criterionConditionId: "complete-duty-cycle",
        criterion:
          "Every mission segment and repeated-cycle thermal state must remain inside the transformed motor-drive boundary.",
        verification:
          "Overlay every motor torque-speed point on the drive envelope and plot current, voltage and thermal state against mission time."
      },
      {
        id: "static-torque-counterexample",
        kind: "counterexample",
        scenario:
          "A high-ratio gearbox is selected from static holding torque alone, while robot acceleration, speed, reversal and repeated heating are omitted.",
        changedConditionIds: ["complete-duty-cycle"],
        givens: [
          [
            "holding-point",
            "Catalogue comparison",
            "one static joint torque point transformed through a high reduction ratio",
            "N m",
            "joint-demand"
          ],
          [
            "omitted-segments",
            "Mission omission",
            "acceleration, braking, dwell and reversal durations are absent",
            "s",
            "mission-cycle"
          ]
        ],
        reasoningSteps: [
          [
            "counter-demand",
            "The single holding point does not represent the complete robot joint operating envelope.",
            ["mission-cycle", "joint-demand"],
            ["cycle-generates-demand"],
            ["complete-duty-cycle"]
          ],
          [
            "counter-map",
            "The high transmission ratio maps fast joint motion and reflected inertia to demanding motor states.",
            ["joint-demand", "transmission-chain", "motor-operating-points"],
            ["transmission-maps-points"],
            ["declared-ratio-convention", "bounded-transmission-loss"]
          ],
          [
            "counter-heat",
            "Repeated acceleration current causes thermal accumulation not visible at the holding point.",
            ["mission-cycle", "motor-operating-points", "thermal-state"],
            ["cycle-causes-heating"],
            ["complete-duty-cycle", "matched-operating-environment"]
          ],
          [
            "counter-reject",
            "Motor overspeed or thermal loss makes the selection margin negative and invalidates the transmission chain.",
            [
              "drive-envelope",
              "thermal-state",
              "selection-margin",
              "transmission-chain"
            ],
            [
              "drive-constrains-points",
              "thermal-constrains-margin",
              "margin-invalidates-chain"
            ],
            ["complete-duty-cycle"]
          ]
        ],
        outcome:
          "The static torque match hides motor-side speed, transient-current and thermal failures over the real mission.",
        criterionConditionId: "complete-duty-cycle",
        criterion:
          "A motor-transmission selection must cover the full torque-speed-duration mission, not one static joint point.",
        verification:
          "Transform the omitted mission segments to motor-side states and repeat electrical, mechanical and thermal boundary checks."
      }
    ],
    misconception: {
      id: "ratio-creates-free-capability",
      claim:
        "A larger gearbox reduction always makes a motor more capable because it multiplies joint torque.",
      mechanism:
        "Reduction also raises motor speed for a given joint speed, changes reflected inertia and retains losses, current, voltage and thermal limits.",
      correction:
        "Transform the complete signed torque-speed-duration mission to motor-side states and check all drive, transmission and thermal boundaries.",
      disconfirmingObservation:
        "The high-ratio candidate meets holding torque but exceeds motor speed or temperature during the repeated robot mission.",
      entityIds: [
        "mission-cycle",
        "joint-demand",
        "transmission-chain",
        "motor-operating-points",
        "drive-envelope",
        "thermal-state",
        "selection-margin"
      ],
      relationIds: [
        "cycle-generates-demand",
        "transmission-maps-points",
        "drive-constrains-points",
        "cycle-causes-heating",
        "points-support-margin",
        "thermal-constrains-margin",
        "margin-invalidates-chain"
      ],
      conditionIds: [
        "declared-ratio-convention",
        "bounded-transmission-loss",
        "complete-duty-cycle"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the motor-selection workflow from robot mission to retained actuator margin:",
            "The mission, transmission, drive and thermal sequence tests the complete joint operating envelope.",
            "The mission, transmission, drive and thermal sequence selects a ratio before forming joint demand.",
            [
              "Construct the timed joint operating envelope before choosing a transmission.",
              "Transform motor points before integrating actuator temperature."
            ],
            [
              "Map robot joint demand through the signed transmission chain.",
              "Retain the candidate only after drive and thermal checks."
            ]
          ],
          focusRef: reasonedCase("mission-envelope-example", "scenario"),
          contextConditionIds: [
            "declared-ratio-convention",
            "complete-duty-cycle",
            "matched-operating-environment"
          ],
          steps: [
            [
              "form-demand",
              ["cycle-generates-demand"],
              ["complete-duty-cycle"]
            ],
            [
              "map-motor",
              ["transmission-maps-points"],
              ["declared-ratio-convention"]
            ],
            [
              "check-drive",
              ["drive-constrains-points"],
              ["matched-operating-environment"]
            ],
            [
              "check-thermal",
              ["cycle-causes-heating", "thermal-constrains-margin"],
              ["complete-duty-cycle"]
            ]
          ],
          correctOrder: [
            "form-demand",
            "map-motor",
            "check-drive",
            "check-thermal"
          ]
        },
        retry: {
          instruction: [
            "Trace the high-ratio failure from static joint point to rejected transmission:",
            "The ratio retry reveals omitted motor speed, transient current and accumulated thermal state.",
            "The ratio retry accepts multiplied joint torque without transforming the robot mission.",
            [
              "Begin with the incomplete static joint demand.",
              "Follow the transmission mapping into drive and thermal boundary failures."
            ],
            [
              "Restore acceleration, braking and reversal to the mission cycle.",
              "Reject the transmission when the selection margin becomes negative."
            ]
          ],
          focusRef: reasonedCase("static-torque-counterexample", "scenario"),
          contextConditionIds: [
            "complete-duty-cycle",
            "bounded-transmission-loss"
          ],
          steps: [
            [
              "restore-cycle",
              ["cycle-generates-demand"],
              ["complete-duty-cycle"]
            ],
            [
              "expose-motor-state",
              ["transmission-maps-points"],
              ["bounded-transmission-loss"]
            ],
            [
              "accumulate-heat",
              ["cycle-causes-heating"],
              ["complete-duty-cycle"]
            ],
            [
              "reject-ratio",
              ["margin-invalidates-chain"],
              ["matched-operating-environment"]
            ]
          ],
          correctOrder: [
            "restore-cycle",
            "expose-motor-state",
            "accumulate-heat",
            "reject-ratio"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence needed to approve a motor-transmission candidate:",
            "The selected actuator evidence covers signed transformation, drive envelope and repeated thermal state.",
            "The selected actuator evidence uses a single joint holding torque as the full robot mission.",
            [
              "Choose the relation that transforms joint demand to motor points.",
              "Choose both electrical and thermal margin evidence."
            ],
            [
              "Select the declared transmission-ratio convention.",
              "Select the complete timed robot mission and matched motor-drive envelope."
            ]
          ],
          focusRef: term("operating-envelope", "boundary"),
          contextConditionIds: [
            "declared-ratio-convention",
            "complete-duty-cycle",
            "matched-operating-environment"
          ],
          options: [
            [
              "ratio-map",
              true,
              relation("transmission-maps-points"),
              condition("declared-ratio-convention"),
              ["transmission-maps-points"],
              ["declared-ratio-convention"],
              null
            ],
            [
              "drive-check",
              true,
              relation("drive-constrains-points"),
              condition("matched-operating-environment"),
              ["drive-constrains-points"],
              ["matched-operating-environment"],
              null
            ],
            [
              "thermal-check",
              true,
              relation("thermal-constrains-margin"),
              condition("complete-duty-cycle"),
              ["thermal-constrains-margin"],
              ["complete-duty-cycle"],
              null
            ],
            [
              "ratio-only",
              false,
              misconception("ratio-creates-free-capability", "claim"),
              misconception("ratio-creates-free-capability", "mechanism"),
              ["transmission-maps-points"],
              ["bounded-transmission-loss"],
              "ratio-creates-free-capability"
            ],
            [
              "holding-only",
              false,
              reasonedCase("static-torque-counterexample", "outcome"),
              condition("complete-duty-cycle"),
              ["cycle-generates-demand"],
              ["complete-duty-cycle"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the records that disqualify the high-ratio robot drive:",
            "The diagnostic records connect omitted mission states to motor overspeed and accumulated temperature.",
            "The diagnostic records retain the transmission because its static torque point passes.",
            [
              "Inspect the transformed motor speed and current across the restored mission.",
              "Use the smallest drive or thermal margin as the selection boundary."
            ],
            [
              "Mark complete mission demand and transmission loss evidence.",
              "Mark the relation that invalidates the motor-transmission chain."
            ]
          ],
          focusRef: reasonedCase("static-torque-counterexample", "verification"),
          contextConditionIds: [
            "complete-duty-cycle",
            "bounded-transmission-loss"
          ],
          options: [
            [
              "restored-demand",
              true,
              relation("cycle-generates-demand"),
              condition("complete-duty-cycle"),
              ["cycle-generates-demand"],
              ["complete-duty-cycle"],
              null
            ],
            [
              "mapped-state",
              true,
              relation("transmission-maps-points"),
              condition("bounded-transmission-loss"),
              ["transmission-maps-points"],
              ["bounded-transmission-loss"],
              null
            ],
            [
              "negative-margin",
              true,
              relation("margin-invalidates-chain"),
              reasonedCase("static-torque-counterexample", "criterion"),
              ["margin-invalidates-chain"],
              ["matched-operating-environment"],
              null
            ],
            [
              "free-torque",
              false,
              misconception("ratio-creates-free-capability", "claim"),
              misconception("ratio-creates-free-capability", "mechanism"),
              ["transmission-maps-points"],
              ["declared-ratio-convention"],
              "ratio-creates-free-capability"
            ],
            [
              "static-pass",
              false,
              reasonedCase("static-torque-counterexample", "outcome"),
              condition("complete-duty-cycle"),
              ["points-support-margin"],
              ["complete-duty-cycle"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each actuator-selection operation to its robot boundary:",
            "The mission, transmission and thermal operations carry timing, ratio and environment boundaries.",
            "An actuator operation is paired with a boundary that cannot expose its motor failure.",
            [
              "Pair mission demand with the complete duty cycle.",
              "Pair transmission mapping with the declared ratio convention."
            ],
            [
              "Match thermal integration to the cooling environment.",
              "Match margin rejection to the complete robot mission."
            ]
          ],
          focusRef: reasonedCase("mission-envelope-example", "criterion"),
          contextConditionIds: [
            "complete-duty-cycle",
            "declared-ratio-convention",
            "matched-operating-environment"
          ],
          pairs: [
            [
              "mission-pair",
              relation("cycle-generates-demand"),
              condition("complete-duty-cycle"),
              relation("cycle-generates-demand"),
              ["cycle-generates-demand"],
              ["complete-duty-cycle"]
            ],
            [
              "ratio-pair",
              relation("transmission-maps-points"),
              condition("declared-ratio-convention"),
              relation("transmission-maps-points"),
              ["transmission-maps-points"],
              ["declared-ratio-convention"]
            ],
            [
              "thermal-pair",
              relation("thermal-constrains-margin"),
              condition("matched-operating-environment"),
              relation("thermal-constrains-margin"),
              ["thermal-constrains-margin"],
              ["matched-operating-environment"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why static joint torque cannot select the high-ratio robot drive:",
            "The explanation connects transmission ratio, motor speed, reflected inertia, current and thermal duty.",
            "The explanation repeats the multiplied joint torque and omits motor-side operating points.",
            [
              "Define the complete joint operating envelope.",
              "State how transmission ratio changes motor speed and reflected inertia."
            ],
            [
              "Connect repeated motor current to actuator thermal state.",
              "Apply the smallest electrical, mechanical or thermal selection margin."
            ]
          ],
          focusRef: misconception("ratio-creates-free-capability", "claim"),
          contextConditionIds: [
            "declared-ratio-convention",
            "bounded-transmission-loss",
            "complete-duty-cycle"
          ],
          conceptGroups: [
            [
              "envelope-definition",
              term("operating-envelope", "label"),
              [
                term("operating-envelope", "definition"),
                relation("cycle-generates-demand")
              ],
              ["cycle-generates-demand"],
              ["complete-duty-cycle"]
            ],
            [
              "ratio-definition",
              term("transmission-ratio", "label"),
              [
                term("transmission-ratio", "definition"),
                relation("transmission-maps-points")
              ],
              ["transmission-maps-points"],
              ["declared-ratio-convention"]
            ],
            [
              "thermal-evidence",
              relation("cycle-causes-heating"),
              [
                relation("cycle-causes-heating"),
                relation("thermal-constrains-margin")
              ],
              ["cycle-causes-heating", "thermal-constrains-margin"],
              ["matched-operating-environment"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["margin-invalidates-chain"],
          criterionConditionId: "complete-duty-cycle"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the motor-selection diagram for the complete robot mission:",
            "The diagram implication transforms joint demand and checks both drive and thermal selection margin.",
            "The diagram implication approves the transmission from joint torque without motor-side states.",
            [
              "Trace the mission into joint torque-speed demand.",
              "Follow the motor operating points into the selection margin."
            ],
            [
              "Identify the transmission mapping.",
              "Choose the implication that retains the complete timed robot mission."
            ]
          ],
          focusRef: reasonedCase("mission-envelope-example", "scenario"),
          contextConditionIds: [
            "declared-ratio-convention",
            "complete-duty-cycle"
          ],
          positions: [
            ["mission-cycle", 0, 0],
            ["joint-demand", 1, 0],
            ["transmission-chain", 1, 1],
            ["motor-operating-points", 2, 0],
            ["thermal-state", 3, 0]
          ],
          relationIds: [
            "cycle-generates-demand",
            "transmission-maps-points",
            "cycle-causes-heating"
          ],
          answerRelationIds: [
            "transmission-maps-points",
            "cycle-causes-heating"
          ],
          options: [
            [
              "retain-full-mission",
              true,
              reasonedCase("mission-envelope-example", "verification"),
              condition("complete-duty-cycle"),
              ["transmission-maps-points", "cycle-causes-heating"],
              ["declared-ratio-convention", "complete-duty-cycle"],
              null
            ],
            [
              "trust-ratio",
              false,
              misconception("ratio-creates-free-capability", "claim"),
              misconception("ratio-creates-free-capability", "mechanism"),
              ["transmission-maps-points"],
              ["bounded-transmission-loss"],
              "ratio-creates-free-capability"
            ],
            [
              "omit-thermal",
              false,
              reasonedCase("static-torque-counterexample", "outcome"),
              condition("complete-duty-cycle"),
              ["cycle-causes-heating"],
              ["complete-duty-cycle"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the high-ratio robot drive diagram after restoring omitted mission states:",
            "The counterexample implication follows motor operating points into negative electrical or thermal margin.",
            "The counterexample implication keeps the gearbox because the static joint point remains valid.",
            [
              "Start at the transformed motor operating points.",
              "Trace drive and thermal constraints into the transmission rejection."
            ],
            [
              "Identify the smallest actuator selection margin.",
              "Choose the implication that invalidates the transmission chain."
            ]
          ],
          focusRef: reasonedCase("static-torque-counterexample", "scenario"),
          contextConditionIds: [
            "complete-duty-cycle",
            "matched-operating-environment"
          ],
          positions: [
            ["motor-operating-points", 0, 0],
            ["drive-envelope", 1, 0],
            ["thermal-state", 1, 1],
            ["selection-margin", 2, 0],
            ["transmission-chain", 3, 0]
          ],
          relationIds: [
            "drive-constrains-points",
            "points-support-margin",
            "thermal-constrains-margin",
            "margin-invalidates-chain"
          ],
          answerRelationIds: [
            "thermal-constrains-margin",
            "margin-invalidates-chain"
          ],
          options: [
            [
              "reject-negative-margin",
              true,
              reasonedCase("static-torque-counterexample", "verification"),
              condition("complete-duty-cycle"),
              ["thermal-constrains-margin", "margin-invalidates-chain"],
              ["complete-duty-cycle", "matched-operating-environment"],
              null
            ],
            [
              "accept-static",
              false,
              misconception("ratio-creates-free-capability", "claim"),
              misconception("ratio-creates-free-capability", "mechanism"),
              ["points-support-margin"],
              ["complete-duty-cycle"],
              "ratio-creates-free-capability"
            ],
            [
              "ignore-environment",
              false,
              reasonedCase("static-torque-counterexample", "outcome"),
              condition("matched-operating-environment"),
              ["drive-constrains-points"],
              ["matched-operating-environment"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("operating-envelope", "label"),
      focusRef: reasonedCase("mission-envelope-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["mission-cycle", 0, 0],
        ["joint-demand", 1, 0],
        ["transmission-chain", 1, 1],
        ["motor-operating-points", 2, 0],
        ["drive-envelope", 2, 1],
        ["thermal-state", 3, 1],
        ["selection-margin", 3, 0]
      ],
      visibleEntityIds: [
        "mission-cycle",
        "joint-demand",
        "transmission-chain",
        "motor-operating-points",
        "drive-envelope",
        "thermal-state",
        "selection-margin"
      ],
      visibleRelationIds: [
        "cycle-generates-demand",
        "transmission-maps-points",
        "drive-constrains-points",
        "cycle-causes-heating",
        "points-support-margin",
        "thermal-constrains-margin",
        "margin-invalidates-chain"
      ],
      controls: [
        [
          "complete-envelope",
          condition("complete-duty-cycle"),
          ["complete-duty-cycle", "declared-ratio-convention"],
          [
            "mission-cycle",
            "joint-demand",
            "transmission-chain",
            "motor-operating-points",
            "drive-envelope",
            "thermal-state",
            "selection-margin"
          ],
          [
            "cycle-generates-demand",
            "transmission-maps-points",
            "drive-constrains-points",
            "cycle-causes-heating",
            "points-support-margin",
            "thermal-constrains-margin"
          ],
          ["margin-invalidates-chain"],
          [],
          [
            [
              "retained-candidate",
              "The complete robot mission retains actuator selection margin.",
              ["mission-cycle", "motor-operating-points", "selection-margin"],
              ["points-support-margin", "thermal-constrains-margin"]
            ]
          ],
          reasonedCase("mission-envelope-example", "verification")
        ],
        [
          "static-only",
          condition("bounded-transmission-loss"),
          ["bounded-transmission-loss"],
          [
            "joint-demand",
            "transmission-chain",
            "motor-operating-points",
            "thermal-state",
            "selection-margin"
          ],
          [
            "transmission-maps-points",
            "cycle-causes-heating",
            "thermal-constrains-margin",
            "margin-invalidates-chain"
          ],
          ["cycle-generates-demand"],
          [],
          [
            [
              "rejected-ratio",
              "The restored motor states reject the high-ratio transmission.",
              ["motor-operating-points", "selection-margin", "transmission-chain"],
              ["thermal-constrains-margin", "margin-invalidates-chain"]
            ]
          ],
          reasonedCase("static-torque-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D17-L07",
    systemModel:
      "Mobile manipulation safety combines constrained base and arm motion, payload-dependent swept volume, time-aligned obstacle state and bounded stopping response before allowing physical motion.",
    failurePattern:
      "A start pose, goal pose or planned centreline can be collision-free while the rotating chassis, moving arm, payload or delayed stopping envelope still intersects a person or obstacle.",
    visualExplanation:
      "A time-indexed swept-volume diagram expands the mobile base and manipulator geometry along the motion, overlays observed occupancy and adds the verified braking envelope.",
    applicationTask:
      "Audit a mobile manipulator motion in metres, radians and seconds by checking nonholonomic feasibility, swept geometry, payload, observation delay and physical stopping boundaries.",
    terms: [
      [
        "nonholonomic-motion",
        "Nonholonomic mobile motion",
        "Mobile-base motion constrained by directional kinematics, such as a wheeled chassis that cannot translate sideways instantaneously.",
        "A geometrically connected path is not necessarily trackable by the declared chassis.",
        "bind-mobile-constraints"
      ],
      [
        "swept-volume",
        "Robot swept volume",
        "The complete space occupied by the chassis, manipulator and payload throughout a time-indexed motion.",
        "Checking only robot endpoints or the base centreline omits intermediate physical occupancy.",
        "construct-swept-occupancy"
      ],
      [
        "protective-boundary",
        "Protective motion boundary",
        "A declared condition that prevents or interrupts physical robot motion when verified separation or stopping assumptions are not met.",
        "A software planning result is not by itself an independently verified physical safety function.",
        "authorise-bounded-motion"
      ]
    ],
    entities: [
      [
        "motion-command",
        "input",
        "Timed motion command",
        "Base velocity and arm-joint commands with metres, radians and seconds on a declared robot clock."
      ],
      [
        "mobility-constraints",
        "constraint",
        "Chassis motion constraints",
        "The base turning, traction, velocity and acceleration limits for the operating surface."
      ],
      [
        "robot-geometry",
        "mechanism",
        "Robot and payload geometry",
        "The chassis footprint, articulated arm links, carried payload and uncertainty padding in named frames."
      ],
      [
        "swept-occupancy",
        "state",
        "Time-indexed swept occupancy",
        "The robot and payload volume occupied at each motion time."
      ],
      [
        "observed-occupancy",
        "observation",
        "Observed human and obstacle occupancy",
        "Time-stamped occupied space with declared sensing latency, frame and uncertainty."
      ],
      [
        "stopping-envelope",
        "constraint",
        "Verified stopping envelope",
        "The distance and time required to reach a bounded safe state under the tested load and surface."
      ],
      [
        "separation-margin",
        "criterion",
        "Physical separation margin",
        "The remaining spatial and temporal margin between robot occupancy and protected occupancy."
      ],
      [
        "motion-authority",
        "decision",
        "Physical motion authority",
        "The bounded decision to allow, limit or stop robot motion under the current verified assumptions."
      ]
    ],
    relations: [
      [
        "constraints-shape-command",
        "constrains",
        ["mobility-constraints"],
        ["motion-command"],
        "chassis kinematic and traction constraints limit the timed mobile motion command",
        "directed",
        "one-to-many"
      ],
      [
        "command-sweeps-geometry",
        "transforms",
        ["motion-command", "robot-geometry"],
        ["swept-occupancy"],
        "the timed base and arm command transforms robot geometry into swept occupancy",
        "directed",
        "many-to-one"
      ],
      [
        "occupancies-form-margin",
        "compares",
        ["swept-occupancy", "observed-occupancy"],
        ["separation-margin"],
        "time-aligned robot and observed occupancies determine physical separation margin",
        "directed",
        "many-to-one"
      ],
      [
        "stopping-constrains-margin",
        "constrains",
        ["stopping-envelope"],
        ["separation-margin"],
        "the verified stopping envelope reduces usable separation margin",
        "directed",
        "one-to-one"
      ],
      [
        "margin-supports-authority",
        "supports",
        ["separation-margin"],
        ["motion-authority"],
        "adequate physical separation margin supports bounded motion authority",
        "directed",
        "one-to-one"
      ],
      [
        "margin-invalidates-authority",
        "invalidates",
        ["separation-margin"],
        ["motion-authority"],
        "insufficient or unknown separation margin invalidates physical motion authority",
        "directed",
        "one-to-one"
      ],
      [
        "authority-routes-command",
        "routes",
        ["motion-authority"],
        ["motion-command"],
        "physical motion authority routes the command to allow, limit or stop behaviour",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "shared-space-time-frame",
        "boundary",
        "Robot geometry, observed occupancy and commands share named spatial frames and a latency-corrected time base.",
        [
          "motion-command",
          "robot-geometry",
          "swept-occupancy",
          "observed-occupancy"
        ],
        ["command-sweeps-geometry", "occupancies-form-margin"]
      ],
      [
        "bounded-mobile-dynamics",
        "assumption",
        "Chassis traction, steering, braking and manipulator load remain inside independently tested operating bounds.",
        [
          "mobility-constraints",
          "motion-command",
          "robot-geometry",
          "stopping-envelope"
        ],
        ["constraints-shape-command", "stopping-constrains-margin"]
      ],
      [
        "complete-physical-geometry",
        "criterion",
        "Swept occupancy includes chassis rotation, every arm link, payload extent and declared uncertainty padding.",
        ["robot-geometry", "swept-occupancy", "separation-margin"],
        ["command-sweeps-geometry", "occupancies-form-margin"]
      ],
      [
        "verified-stop-path",
        "boundary",
        "The stop response is measured for the current load, speed, surface and control path rather than assumed from planning.",
        ["stopping-envelope", "separation-margin", "motion-authority"],
        [
          "stopping-constrains-margin",
          "margin-supports-authority",
          "margin-invalidates-authority"
        ]
      ]
    ],
    failureBoundary: [
      "centreline-clear-sweep-collision",
      "complete-physical-geometry",
      "A mobile manipulator centreline clears an aisle corner while the rotating chassis corner and carried payload sweep into observed occupancy.",
      "The time-indexed swept occupancy overlaps the obstacle before the verified stopping envelope can reach a bounded safe state.",
      "Invalidate physical motion authority and replan or stop unless full robot geometry and stopping margin remain separated.",
      [
        "motion-command",
        "mobility-constraints",
        "robot-geometry",
        "swept-occupancy",
        "observed-occupancy",
        "stopping-envelope",
        "separation-margin",
        "motion-authority"
      ],
      [
        "constraints-shape-command",
        "command-sweeps-geometry",
        "occupancies-form-margin",
        "stopping-constrains-margin",
        "margin-invalidates-authority",
        "authority-routes-command"
      ]
    ],
    conceptualModel: [
      [
        "bind-mobile-constraints",
        "Declare base turning, traction, velocity and acceleration constraints for the operating surface.",
        ["mobility-constraints", "motion-command"],
        ["constraints-shape-command"],
        ["bounded-mobile-dynamics"]
      ],
      [
        "synchronise-robot-state",
        "Transform time-stamped robot geometry and observed occupancy into named compatible frames.",
        ["robot-geometry", "observed-occupancy"],
        ["occupancies-form-margin"],
        ["shared-space-time-frame"]
      ],
      [
        "construct-swept-occupancy",
        "Propagate chassis, arm-link, payload and padding geometry along every timed motion segment.",
        ["motion-command", "robot-geometry", "swept-occupancy"],
        ["command-sweeps-geometry"],
        ["complete-physical-geometry"]
      ],
      [
        "apply-stopping-envelope",
        "Add the measured load-dependent stopping distance and control delay to the robot occupancy boundary.",
        ["stopping-envelope", "swept-occupancy", "separation-margin"],
        ["stopping-constrains-margin"],
        ["bounded-mobile-dynamics", "verified-stop-path"]
      ],
      [
        "evaluate-separation",
        "Compare time-indexed robot occupancy with human and obstacle occupancy to find the minimum separation margin.",
        ["swept-occupancy", "observed-occupancy", "separation-margin"],
        ["occupancies-form-margin"],
        ["shared-space-time-frame", "complete-physical-geometry"]
      ],
      [
        "authorise-bounded-motion",
        "Allow, limit or stop physical robot motion according to the verified separation and stopping boundary.",
        ["separation-margin", "motion-authority", "motion-command"],
        [
          "margin-supports-authority",
          "margin-invalidates-authority",
          "authority-routes-command"
        ],
        ["verified-stop-path"]
      ]
    ],
    reasonedCases: [
      {
        id: "stowed-arm-transit-example",
        kind: "example",
        scenario:
          "A mobile manipulator traverses an aisle with its arm stowed and payload bounded while base motion, sensed occupancy and stopping response share one clock.",
        changedConditionIds: ["bounded-mobile-dynamics"],
        givens: [
          [
            "transit-command",
            "Mobile transit",
            "base speed and turn commands plus stowed arm joints on a seconds-based clock",
            "m/s, rad/s and s",
            "motion-command"
          ],
          [
            "payload-footprint",
            "Physical geometry",
            "chassis, stowed arm, payload and uncertainty padding in the base frame",
            "m",
            "robot-geometry"
          ]
        ],
        reasoningSteps: [
          [
            "example-feasible",
            "The timed mobile command respects chassis turning and traction constraints.",
            ["mobility-constraints", "motion-command"],
            ["constraints-shape-command"],
            ["bounded-mobile-dynamics"]
          ],
          [
            "example-sweep",
            "Complete robot and payload geometry produces a time-indexed swept occupancy.",
            ["motion-command", "robot-geometry", "swept-occupancy"],
            ["command-sweeps-geometry"],
            ["complete-physical-geometry"]
          ],
          [
            "example-stop",
            "The verified stopping envelope is applied for the tested payload, speed and surface.",
            ["stopping-envelope", "separation-margin"],
            ["stopping-constrains-margin"],
            ["verified-stop-path"]
          ],
          [
            "example-authority",
            "Latency-corrected occupancy retains positive separation and supports bounded motion authority.",
            [
              "observed-occupancy",
              "separation-margin",
              "motion-authority"
            ],
            ["occupancies-form-margin", "margin-supports-authority"],
            ["shared-space-time-frame"]
          ]
        ],
        outcome:
          "The mobile transit remains physically bounded for the declared geometry, occupancy, load, surface and stop response.",
        criterionConditionId: "verified-stop-path",
        criterion:
          "Physical motion authority requires complete swept geometry and measured stopping separation under current operating bounds.",
        verification:
          "Replay the command, geometry, occupancy and stop traces on one clock and inspect minimum spatial and temporal separation."
      },
      {
        id: "corner-sweep-counterexample",
        kind: "counterexample",
        scenario:
          "A planner checks only the mobile-base centreline and endpoints while the chassis rotates at a corner with a payload extended from the arm.",
        changedConditionIds: ["complete-physical-geometry"],
        givens: [
          [
            "clear-centreline",
            "Planned geometry",
            "base centre point remains outside the mapped obstacle",
            "m",
            "swept-occupancy"
          ],
          [
            "extended-payload",
            "Omitted geometry",
            "arm and payload extend beyond the checked centreline",
            "m",
            "robot-geometry"
          ]
        ],
        reasoningSteps: [
          [
            "counter-geometry",
            "The centreline model omits rotating chassis corners, arm links and payload extent.",
            ["robot-geometry", "swept-occupancy"],
            ["command-sweeps-geometry"],
            ["complete-physical-geometry"]
          ],
          [
            "counter-overlap",
            "Full time-indexed robot occupancy overlaps the observed corner obstacle during rotation.",
            ["swept-occupancy", "observed-occupancy", "separation-margin"],
            ["occupancies-form-margin"],
            ["shared-space-time-frame"]
          ],
          [
            "counter-stop",
            "The verified stopping envelope consumes the remaining spatial separation before motion ceases.",
            ["stopping-envelope", "separation-margin"],
            ["stopping-constrains-margin"],
            ["verified-stop-path"]
          ],
          [
            "counter-authority",
            "Insufficient separation invalidates motion authority and routes the mobile command to stop or replan.",
            ["separation-margin", "motion-authority", "motion-command"],
            ["margin-invalidates-authority", "authority-routes-command"],
            ["complete-physical-geometry", "verified-stop-path"]
          ]
        ],
        outcome:
          "Collision-free endpoints and centreline hide a physical swept-volume collision at the aisle corner.",
        criterionConditionId: "complete-physical-geometry",
        criterion:
          "Every chassis, arm and payload volume must remain separated throughout the timed motion and verified stop.",
        verification:
          "Render the full padded robot geometry at each motion sample and compare its swept occupancy with time-aligned obstacles and stopping distance."
      }
    ],
    misconception: {
      id: "clear-centreline-proves-safety",
      claim:
        "A mobile robot path is physically safe when its centreline and endpoints are collision-free.",
      mechanism:
        "Chassis rotation, articulated links, payload extent, observation latency and braking distance occupy space beyond the centreline.",
      correction:
        "Evaluate complete time-indexed swept volume and a measured stopping envelope against time-aligned protected occupancy.",
      disconfirmingObservation:
        "The centre point clears the corner while the rotating payload volume overlaps the obstacle before the robot stops.",
      entityIds: [
        "motion-command",
        "mobility-constraints",
        "robot-geometry",
        "swept-occupancy",
        "observed-occupancy",
        "stopping-envelope",
        "separation-margin",
        "motion-authority"
      ],
      relationIds: [
        "constraints-shape-command",
        "command-sweeps-geometry",
        "occupancies-form-margin",
        "stopping-constrains-margin",
        "margin-supports-authority",
        "margin-invalidates-authority",
        "authority-routes-command"
      ],
      conditionIds: [
        "shared-space-time-frame",
        "complete-physical-geometry",
        "verified-stop-path"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the physical-motion audit from mobile command to bounded authority:",
            "The command, swept occupancy, stopping envelope and separation sequence checks the complete robot body.",
            "The command, swept occupancy, stopping envelope and separation sequence authorises motion from clear endpoints.",
            [
              "Apply chassis constraints before sweeping robot geometry.",
              "Evaluate stopping margin before granting physical motion authority."
            ],
            [
              "Propagate chassis, arm and payload geometry through the timed command.",
              "Compare complete robot occupancy with time-aligned protected occupancy."
            ]
          ],
          focusRef: reasonedCase("stowed-arm-transit-example", "scenario"),
          contextConditionIds: [
            "bounded-mobile-dynamics",
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          steps: [
            [
              "constrain-motion",
              ["constraints-shape-command"],
              ["bounded-mobile-dynamics"]
            ],
            [
              "sweep-body",
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"]
            ],
            [
              "apply-stop",
              ["stopping-constrains-margin"],
              ["verified-stop-path"]
            ],
            [
              "decide-authority",
              ["margin-supports-authority"],
              ["shared-space-time-frame"]
            ]
          ],
          correctOrder: [
            "constrain-motion",
            "sweep-body",
            "apply-stop",
            "decide-authority"
          ]
        },
        retry: {
          instruction: [
            "Trace the aisle-corner failure from omitted payload geometry to stopped motion:",
            "The corner retry exposes swept overlap, consumed stopping margin and invalid motion authority.",
            "The corner retry changes the mobile goal while keeping the incomplete centreline geometry.",
            [
              "Restore rotating chassis, arm and payload geometry.",
              "Follow the overlap through the verified stopping envelope."
            ],
            [
              "Form the complete time-indexed robot occupancy.",
              "Route the command to stop when physical separation is insufficient."
            ]
          ],
          focusRef: reasonedCase("corner-sweep-counterexample", "scenario"),
          contextConditionIds: [
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          steps: [
            [
              "restore-geometry",
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"]
            ],
            [
              "detect-overlap",
              ["occupancies-form-margin"],
              ["shared-space-time-frame"]
            ],
            [
              "consume-margin",
              ["stopping-constrains-margin"],
              ["verified-stop-path"]
            ],
            [
              "route-stop",
              ["margin-invalidates-authority", "authority-routes-command"],
              ["complete-physical-geometry"]
            ]
          ],
          correctOrder: [
            "restore-geometry",
            "detect-overlap",
            "consume-margin",
            "route-stop"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required before physical mobile-manipulator motion:",
            "The selected motion evidence covers trackability, full swept geometry, time alignment and stopping response.",
            "The selected motion evidence treats a clear centreline as the complete robot body.",
            [
              "Choose the chassis constraint on the timed command.",
              "Choose both occupancy separation and verified stopping evidence."
            ],
            [
              "Select the full robot-and-payload sweep.",
              "Select the relation that supports bounded motion authority."
            ]
          ],
          focusRef: term("protective-boundary", "boundary"),
          contextConditionIds: [
            "bounded-mobile-dynamics",
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          options: [
            [
              "trackable-command",
              true,
              relation("constraints-shape-command"),
              condition("bounded-mobile-dynamics"),
              ["constraints-shape-command"],
              ["bounded-mobile-dynamics"],
              null
            ],
            [
              "complete-sweep",
              true,
              relation("command-sweeps-geometry"),
              condition("complete-physical-geometry"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"],
              null
            ],
            [
              "verified-separation",
              true,
              relation("stopping-constrains-margin"),
              condition("verified-stop-path"),
              ["stopping-constrains-margin"],
              ["verified-stop-path"],
              null
            ],
            [
              "centreline-only",
              false,
              misconception("clear-centreline-proves-safety", "claim"),
              misconception("clear-centreline-proves-safety", "mechanism"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"],
              "clear-centreline-proves-safety"
            ],
            [
              "endpoint-only",
              false,
              reasonedCase("corner-sweep-counterexample", "outcome"),
              condition("shared-space-time-frame"),
              ["occupancies-form-margin"],
              ["shared-space-time-frame"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the records that invalidate the corner motion:",
            "The diagnostic records connect omitted payload sweep, obstacle overlap and stopping margin.",
            "The diagnostic records preserve physical motion because the mobile endpoint remains clear.",
            [
              "Inspect complete robot geometry during chassis rotation.",
              "Retain observed human and obstacle occupancy latency plus the verified stopping envelope."
            ],
            [
              "Mark the occupancy relation that forms separation margin.",
              "Mark the relation that invalidates physical motion authority."
            ]
          ],
          focusRef: reasonedCase("corner-sweep-counterexample", "verification"),
          contextConditionIds: [
            "shared-space-time-frame",
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          options: [
            [
              "full-geometry",
              true,
              condition("complete-physical-geometry"),
              relation("command-sweeps-geometry"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"],
              null
            ],
            [
              "time-aligned-overlap",
              true,
              relation("occupancies-form-margin"),
              condition("shared-space-time-frame"),
              ["occupancies-form-margin"],
              ["shared-space-time-frame"],
              null
            ],
            [
              "authority-loss",
              true,
              relation("margin-invalidates-authority"),
              condition("verified-stop-path"),
              ["margin-invalidates-authority"],
              ["verified-stop-path"],
              null
            ],
            [
              "clear-centre",
              false,
              misconception("clear-centreline-proves-safety", "claim"),
              misconception("clear-centreline-proves-safety", "mechanism"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"],
              "clear-centreline-proves-safety"
            ],
            [
              "goal-change",
              false,
              reasonedCase("corner-sweep-counterexample", "outcome"),
              condition("bounded-mobile-dynamics"),
              ["constraints-shape-command"],
              ["bounded-mobile-dynamics"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain why a clear mobile centreline cannot authorise physical robot motion:",
            "The explanation connects nonholonomic motion, swept robot geometry, observed occupancy and stopping distance.",
            "The explanation repeats clear endpoints and omits the arm, payload and stop response.",
            [
              "Define the complete robot swept volume.",
              "Include named frames, latency-corrected time and payload geometry."
            ],
            [
              "Explain how stopping distance reduces physical separation margin.",
              "Apply the protective motion boundary to allow, limit or stop."
            ]
          ],
          focusRef: misconception("clear-centreline-proves-safety", "claim"),
          contextConditionIds: [
            "shared-space-time-frame",
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          conceptGroups: [
            [
              "mobility-definition",
              term("nonholonomic-motion", "label"),
              [
                term("nonholonomic-motion", "definition"),
                relation("constraints-shape-command")
              ],
              ["constraints-shape-command"],
              ["bounded-mobile-dynamics"]
            ],
            [
              "sweep-definition",
              term("swept-volume", "label"),
              [
                term("swept-volume", "definition"),
                relation("command-sweeps-geometry")
              ],
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"]
            ],
            [
              "authority-boundary",
              term("protective-boundary", "label"),
              [
                term("protective-boundary", "definition"),
                relation("margin-invalidates-authority")
              ],
              ["margin-invalidates-authority"],
              ["verified-stop-path"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["stopping-constrains-margin"],
          criterionConditionId: "verified-stop-path"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each physical-motion operation to its robot boundary:",
            "The command, sweep and stopping operations carry mobility, geometry and measured-stop boundaries.",
            "A physical-motion operation is paired with a boundary that cannot expose its collision path.",
            [
              "Pair mobile command shaping with bounded chassis dynamics.",
              "Pair swept occupancy with complete robot geometry."
            ],
            [
              "Match occupancy comparison to shared space-time frames.",
              "Match stopping-margin reduction to the verified stop path."
            ]
          ],
          focusRef: reasonedCase("corner-sweep-counterexample", "criterion"),
          contextConditionIds: [
            "bounded-mobile-dynamics",
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          pairs: [
            [
              "mobility-pair",
              relation("constraints-shape-command"),
              condition("bounded-mobile-dynamics"),
              relation("constraints-shape-command"),
              ["constraints-shape-command"],
              ["bounded-mobile-dynamics"]
            ],
            [
              "geometry-pair",
              relation("command-sweeps-geometry"),
              condition("complete-physical-geometry"),
              relation("command-sweeps-geometry"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"]
            ],
            [
              "stop-pair",
              relation("stopping-constrains-margin"),
              condition("verified-stop-path"),
              relation("stopping-constrains-margin"),
              ["stopping-constrains-margin"],
              ["verified-stop-path"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the swept-occupancy diagram for bounded mobile transit:",
            "The diagram implication combines complete robot geometry with time-aligned occupancy and stopping margin.",
            "The diagram implication authorises physical motion from a clear mobile centre point.",
            [
              "Trace the timed command through robot and payload geometry.",
              "Follow occupied space into the physical separation margin."
            ],
            [
              "Identify the complete swept-occupancy relation.",
              "Choose the implication that retains the verified stopping envelope."
            ]
          ],
          focusRef: reasonedCase("stowed-arm-transit-example", "scenario"),
          contextConditionIds: [
            "complete-physical-geometry",
            "verified-stop-path"
          ],
          positions: [
            ["motion-command", 0, 0],
            ["robot-geometry", 0, 1],
            ["swept-occupancy", 1, 0],
            ["observed-occupancy", 1, 1],
            ["separation-margin", 2, 0]
          ],
          relationIds: [
            "command-sweeps-geometry",
            "occupancies-form-margin"
          ],
          answerRelationIds: ["occupancies-form-margin"],
          options: [
            [
              "retain-complete-separation",
              true,
              reasonedCase("stowed-arm-transit-example", "verification"),
              condition("verified-stop-path"),
              ["command-sweeps-geometry", "occupancies-form-margin"],
              ["complete-physical-geometry", "verified-stop-path"],
              null
            ],
            [
              "trust-centreline",
              false,
              misconception("clear-centreline-proves-safety", "claim"),
              misconception("clear-centreline-proves-safety", "mechanism"),
              ["command-sweeps-geometry"],
              ["complete-physical-geometry"],
              "clear-centreline-proves-safety"
            ],
            [
              "ignore-clock",
              false,
              reasonedCase("corner-sweep-counterexample", "outcome"),
              condition("shared-space-time-frame"),
              ["occupancies-form-margin"],
              ["shared-space-time-frame"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the corner-sweep diagram after full robot geometry is restored:",
            "The counterexample implication follows consumed separation margin into invalid physical motion authority.",
            "The counterexample implication retains mobile motion because the planned endpoint is clear.",
            [
              "Start with complete swept and observed occupancy.",
              "Apply the verified stopping envelope before the motion decision."
            ],
            [
              "Identify the relation that reduces separation margin.",
              "Choose the implication that invalidates physical motion authority."
            ]
          ],
          focusRef: reasonedCase("corner-sweep-counterexample", "scenario"),
          contextConditionIds: [
            "shared-space-time-frame",
            "verified-stop-path"
          ],
          positions: [
            ["swept-occupancy", 0, 0],
            ["observed-occupancy", 0, 1],
            ["stopping-envelope", 1, 1],
            ["separation-margin", 1, 0],
            ["motion-authority", 2, 0]
          ],
          relationIds: [
            "occupancies-form-margin",
            "stopping-constrains-margin",
            "margin-invalidates-authority"
          ],
          answerRelationIds: [
            "stopping-constrains-margin",
            "margin-invalidates-authority"
          ],
          options: [
            [
              "invalidate-motion",
              true,
              reasonedCase("corner-sweep-counterexample", "verification"),
              condition("verified-stop-path"),
              [
                "stopping-constrains-margin",
                "margin-invalidates-authority"
              ],
              ["shared-space-time-frame", "verified-stop-path"],
              null
            ],
            [
              "accept-centreline",
              false,
              misconception("clear-centreline-proves-safety", "claim"),
              misconception("clear-centreline-proves-safety", "mechanism"),
              ["occupancies-form-margin"],
              ["complete-physical-geometry"],
              "clear-centreline-proves-safety"
            ],
            [
              "omit-stop",
              false,
              reasonedCase("corner-sweep-counterexample", "outcome"),
              condition("verified-stop-path"),
              ["margin-invalidates-authority"],
              ["verified-stop-path"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("swept-volume", "label"),
      focusRef: reasonedCase("stowed-arm-transit-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["motion-command", 0, 0],
        ["mobility-constraints", 0, 1],
        ["robot-geometry", 1, 1],
        ["swept-occupancy", 1, 0],
        ["observed-occupancy", 2, 1],
        ["stopping-envelope", 3, 1],
        ["separation-margin", 2, 0],
        ["motion-authority", 3, 0]
      ],
      visibleEntityIds: [
        "motion-command",
        "mobility-constraints",
        "robot-geometry",
        "swept-occupancy",
        "observed-occupancy",
        "stopping-envelope",
        "separation-margin",
        "motion-authority"
      ],
      visibleRelationIds: [
        "constraints-shape-command",
        "command-sweeps-geometry",
        "occupancies-form-margin",
        "stopping-constrains-margin",
        "margin-supports-authority",
        "margin-invalidates-authority",
        "authority-routes-command"
      ],
      controls: [
        [
          "bounded-transit",
          condition("verified-stop-path"),
          ["verified-stop-path", "complete-physical-geometry"],
          [
            "motion-command",
            "robot-geometry",
            "swept-occupancy",
            "observed-occupancy",
            "stopping-envelope",
            "separation-margin",
            "motion-authority"
          ],
          [
            "command-sweeps-geometry",
            "occupancies-form-margin",
            "stopping-constrains-margin",
            "margin-supports-authority",
            "authority-routes-command"
          ],
          ["margin-invalidates-authority"],
          [],
          [
            [
              "retained-separation",
              "Complete robot occupancy retains bounded physical motion authority.",
              ["swept-occupancy", "separation-margin", "motion-authority"],
              ["margin-supports-authority"]
            ]
          ],
          reasonedCase("stowed-arm-transit-example", "verification")
        ],
        [
          "corner-overlap",
          condition("complete-physical-geometry"),
          ["complete-physical-geometry"],
          [
            "robot-geometry",
            "swept-occupancy",
            "observed-occupancy",
            "stopping-envelope",
            "separation-margin",
            "motion-authority"
          ],
          [
            "command-sweeps-geometry",
            "occupancies-form-margin",
            "stopping-constrains-margin",
            "margin-invalidates-authority"
          ],
          ["margin-supports-authority"],
          [],
          [
            [
              "stopped-corner",
              "The payload sweep consumes separation and invalidates mobile motion.",
              ["swept-occupancy", "separation-margin", "motion-authority"],
              ["stopping-constrains-margin", "margin-invalidates-authority"]
            ]
          ],
          reasonedCase("corner-sweep-counterexample", "verification")
        ]
      ]
    }
  }
] satisfies readonly AcademyLessonTeachingProfileV2CompactPlan[];

const lessonIds = [
  "EML-E3-D17-L01",
  "EML-E3-D17-L02",
  "EML-E3-D17-L03",
  "EML-E3-D17-L04",
  "EML-E3-D17-L05",
  "EML-E3-D17-L06",
  "EML-E3-D17-L07"
] as const;

const seedRegistry =
  materialiseAcademyLessonTeachingProfileV2Registry(
    lessonIds,
    compactPlans
  );

export const academyLessonTeachingProfilesV2E3D17 =
  Object.freeze(Object.fromEntries(lessonIds.map((lessonId) => {
    const seed = seedRegistry[lessonId];
    if (!seed) throw new Error(`Missing V2 profile seed ${lessonId}.`);
    return [
      lessonId,
      expandAcademyLessonTeachingProfileV2Seed(seed)
    ];
  }))) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D17;
