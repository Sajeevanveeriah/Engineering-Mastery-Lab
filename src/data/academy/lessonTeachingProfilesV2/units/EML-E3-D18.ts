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
    lessonId: "EML-E3-D18-L01",
    systemModel:
      "A ROS 2 workspace builds source packages into sourced install artefacts whose processes join a namespaced, domain-scoped runtime computation graph.",
    failurePattern:
      "Packages can build and executables can run while stale overlays, different discovery domains, namespaces or endpoint policies leave the intended ROS 2 graph disconnected.",
    visualExplanation:
      "A workspace pipeline connects source package, build artefact and sourced install environment to runtime nodes, discovery domain, namespaced endpoints and graph evidence.",
    applicationTask:
      "Build and inspect a ROS 2 package, prove which install overlay supplies its executable and diagnose a deliberately hidden graph endpoint without changing application logic.",
    terms: [
      [
        "ros-workspace",
        "ROS 2 workspace",
        "A directory arrangement whose source packages are built into isolated or merged build, install and log artefacts.",
        "A successful build does not prove that the intended install overlay is sourced in the current process.",
        "identify-workspace-layers"
      ],
      [
        "computation-graph",
        "ROS 2 computation graph",
        "The discovered runtime set of nodes and typed communication endpoints qualified by names and policies.",
        "The graph is an observed distributed state, not a static copy of package source.",
        "inspect-runtime-graph"
      ],
      [
        "discovery-domain",
        "ROS discovery domain",
        "The bounded DDS discovery scope within which compatible ROS 2 participants can find one another.",
        "Processes in different domains can run correctly and remain intentionally invisible to each other.",
        "verify-discovery-scope"
      ]
    ],
    entities: [
      [
        "source-package",
        "component",
        "ROS source package",
        "The package manifest, build metadata, source and interfaces under the workspace source tree."
      ],
      [
        "install-overlay",
        "state",
        "Sourced install overlay",
        "The built package artefacts and environment hooks selected by the current shell or process."
      ],
      [
        "runtime-process",
        "component",
        "ROS runtime process",
        "An operating-system process that loads an installed executable and creates one or more nodes."
      ],
      [
        "runtime-node",
        "component",
        "Discovered ROS node",
        "A named participant with a bounded responsibility in the observed runtime graph."
      ],
      [
        "graph-endpoint",
        "component",
        "Namespaced graph endpoint",
        "A discovered publisher, subscriber, service or action endpoint with a fully resolved ROS name."
      ],
      [
        "domain-scope",
        "constraint",
        "Discovery domain scope",
        "The selected domain identifier and reachable transport scope for ROS participant discovery."
      ],
      [
        "graph-observation",
        "observation",
        "Captured graph observation",
        "A time-stamped node, endpoint and environment inspection from the same runtime context."
      ]
    ],
    relations: [
      [
        "package-builds-overlay",
        "maps",
        ["source-package"],
        ["install-overlay"],
        "the ROS source package builds into the selected install overlay",
        "directed",
        "one-to-one"
      ],
      [
        "overlay-launches-process",
        "supports",
        ["install-overlay"],
        ["runtime-process"],
        "the sourced install overlay supplies the executable launched by the runtime process",
        "directed",
        "one-to-many"
      ],
      [
        "process-creates-node",
        "causes",
        ["runtime-process"],
        ["runtime-node"],
        "the runtime process creates a named ROS node",
        "directed",
        "one-to-many"
      ],
      [
        "node-advertises-endpoint",
        "supports",
        ["runtime-node"],
        ["graph-endpoint"],
        "the discovered ROS node advertises its fully resolved graph endpoints",
        "directed",
        "one-to-many"
      ],
      [
        "domain-constrains-discovery",
        "constrains",
        ["domain-scope"],
        ["runtime-node", "graph-endpoint"],
        "the ROS discovery domain constrains which nodes and endpoints become mutually visible",
        "directed",
        "one-to-many"
      ],
      [
        "graph-records-runtime",
        "measures",
        ["runtime-node", "graph-endpoint", "domain-scope"],
        ["graph-observation"],
        "the captured graph observation records nodes, resolved endpoints and discovery scope",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "intended-overlay-sourced",
        "criterion",
        "The runtime process sources the install overlay produced from the intended ROS package revision.",
        ["source-package", "install-overlay", "runtime-process"],
        ["package-builds-overlay", "overlay-launches-process"]
      ],
      [
        "shared-discovery-scope",
        "boundary",
        "Participants expected to communicate use the same declared ROS discovery domain and reachable transport scope.",
        ["runtime-node", "graph-endpoint", "domain-scope"],
        ["domain-constrains-discovery"]
      ],
      [
        "resolved-name-recorded",
        "criterion",
        "Graph evidence records fully resolved node and endpoint names after namespace and remapping rules.",
        ["runtime-node", "graph-endpoint", "graph-observation"],
        ["node-advertises-endpoint", "graph-records-runtime"]
      ],
      [
        "same-runtime-context",
        "boundary",
        "Process environment and graph inspection are captured from the same host, shell context and observation time.",
        ["install-overlay", "runtime-process", "graph-observation"],
        ["overlay-launches-process", "graph-records-runtime"]
      ]
    ],
    failureBoundary: [
      "hidden-domain-endpoint",
      "shared-discovery-scope",
      "A publisher runs from the intended overlay in one discovery domain while the inspecting subscriber and graph tool use another domain.",
      "Both runtime processes remain healthy, but the subscriber graph observation contains no compatible publisher endpoint.",
      "Reject an application-code diagnosis until overlay, resolved name, discovery domain and graph evidence are compared in one runtime context.",
      [
        "install-overlay",
        "runtime-process",
        "runtime-node",
        "graph-endpoint",
        "domain-scope",
        "graph-observation"
      ],
      [
        "overlay-launches-process",
        "process-creates-node",
        "node-advertises-endpoint",
        "domain-constrains-discovery",
        "graph-records-runtime"
      ]
    ],
    conceptualModel: [
      [
        "identify-workspace-layers",
        "Separate ROS package source from build, install and log artefacts in the workspace.",
        ["source-package", "install-overlay"],
        ["package-builds-overlay"],
        ["intended-overlay-sourced"]
      ],
      [
        "verify-installed-executable",
        "Resolve the launched executable back to the intended sourced install overlay.",
        ["install-overlay", "runtime-process"],
        ["overlay-launches-process"],
        ["intended-overlay-sourced", "same-runtime-context"]
      ],
      [
        "inspect-runtime-graph",
        "Capture discovered ROS nodes and fully resolved graph endpoint names while processes are running.",
        ["runtime-process", "runtime-node", "graph-endpoint", "graph-observation"],
        [
          "process-creates-node",
          "node-advertises-endpoint",
          "graph-records-runtime"
        ],
        ["resolved-name-recorded", "same-runtime-context"]
      ],
      [
        "verify-discovery-scope",
        "Compare the declared discovery domain and transport reachability of expected ROS participants.",
        ["runtime-node", "graph-endpoint", "domain-scope"],
        ["domain-constrains-discovery"],
        ["shared-discovery-scope"]
      ],
      [
        "reconcile-graph-evidence",
        "Relate package revision, sourced overlay, runtime process and graph observation before changing ROS application code.",
        [
          "source-package",
          "install-overlay",
          "runtime-process",
          "runtime-node",
          "graph-endpoint",
          "graph-observation"
        ],
        [
          "package-builds-overlay",
          "overlay-launches-process",
          "process-creates-node",
          "node-advertises-endpoint",
          "graph-records-runtime"
        ],
        [
          "intended-overlay-sourced",
          "resolved-name-recorded",
          "same-runtime-context"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "visible-graph-example",
        kind: "example",
        scenario:
          "A workspace package is built, its install overlay is sourced and two ROS processes join the same discovery domain with fully resolved endpoint names.",
        changedConditionIds: ["same-runtime-context"],
        givens: [
          [
            "workspace-state",
            "ROS workspace state",
            "source revision and matching sourced install overlay",
            null,
            "install-overlay"
          ],
          [
            "domain-state",
            "ROS discovery state",
            "publisher, subscriber and graph tool use the declared domain",
            null,
            "domain-scope"
          ]
        ],
        reasoningSteps: [
          [
            "example-overlay",
            "The runtime processes resolve executables from the intended ROS install overlay.",
            ["source-package", "install-overlay", "runtime-process"],
            ["package-builds-overlay", "overlay-launches-process"],
            ["intended-overlay-sourced"]
          ],
          [
            "example-nodes",
            "Each running process creates the expected named ROS node and graph endpoint.",
            ["runtime-process", "runtime-node", "graph-endpoint"],
            ["process-creates-node", "node-advertises-endpoint"],
            ["resolved-name-recorded"]
          ],
          [
            "example-domain",
            "The shared discovery domain makes compatible ROS participants mutually visible.",
            ["domain-scope", "runtime-node", "graph-endpoint"],
            ["domain-constrains-discovery"],
            ["shared-discovery-scope"]
          ],
          [
            "example-record",
            "The captured graph observation preserves overlay, node, endpoint and domain evidence from one runtime context.",
            [
              "install-overlay",
              "runtime-node",
              "graph-endpoint",
              "domain-scope",
              "graph-observation"
            ],
            ["graph-records-runtime"],
            ["same-runtime-context"]
          ]
        ],
        outcome:
          "The observed ROS computation graph connects the intended installed executables and names inside the declared discovery scope.",
        criterionConditionId: "resolved-name-recorded",
        criterion:
          "Graph connectivity must resolve to the intended overlay, fully qualified endpoint names and shared discovery scope.",
        verification:
          "Record executable resolution, package prefix, node list, endpoint information and discovery-domain environment from the same running context."
      },
      {
        id: "split-domain-counterexample",
        kind: "counterexample",
        scenario:
          "A ROS publisher and subscriber both run successfully, but the publisher uses a different discovery domain from the subscriber and graph inspection process.",
        changedConditionIds: ["shared-discovery-scope"],
        givens: [
          [
            "publisher-domain",
            "Publisher discovery state",
            "publisher process uses a different declared domain identifier",
            null,
            "domain-scope"
          ],
          [
            "healthy-processes",
            "ROS process state",
            "both executables remain running without application errors",
            null,
            "runtime-process"
          ]
        ],
        reasoningSteps: [
          [
            "counter-process",
            "Both runtime processes still create their local ROS nodes.",
            ["runtime-process", "runtime-node"],
            ["process-creates-node"],
            ["intended-overlay-sourced"]
          ],
          [
            "counter-domain",
            "Different discovery domains constrain the nodes into separate visible graphs.",
            ["domain-scope", "runtime-node", "graph-endpoint"],
            ["domain-constrains-discovery"],
            ["shared-discovery-scope"]
          ],
          [
            "counter-observation",
            "The subscriber graph observation omits the publisher endpoint despite both processes running.",
            ["runtime-node", "graph-endpoint", "graph-observation"],
            ["graph-records-runtime"],
            ["same-runtime-context", "resolved-name-recorded"]
          ],
          [
            "counter-diagnosis",
            "Discovery-scope evidence explains the missing ROS endpoint without changing package source.",
            ["source-package", "domain-scope", "graph-observation"],
            ["domain-constrains-discovery", "graph-records-runtime"],
            ["shared-discovery-scope"]
          ]
        ],
        outcome:
          "Healthy processes form disconnected ROS graphs because their discovery scopes do not match.",
        criterionConditionId: "shared-discovery-scope",
        criterion:
          "Expected ROS participants must share the declared discovery domain before endpoint compatibility can be assessed.",
        verification:
          "Capture the discovery-domain environment for every process, align the domains and confirm that the publisher endpoint appears without rebuilding."
      }
    ],
    misconception: {
      id: "build-and-run-proves-graph",
      claim:
        "If a ROS package builds and its processes are running, the intended computation graph must be connected.",
      mechanism:
        "Build state does not establish which overlay was sourced, which names resolved or which discovery domain contains each process.",
      correction:
        "Trace the installed executable and inspect fully resolved endpoints and discovery scope in one runtime context.",
      disconfirmingObservation:
        "Both processes run from valid packages while the subscriber graph cannot discover the publisher in another domain.",
      entityIds: [
        "source-package",
        "install-overlay",
        "runtime-process",
        "runtime-node",
        "graph-endpoint",
        "domain-scope",
        "graph-observation"
      ],
      relationIds: [
        "package-builds-overlay",
        "overlay-launches-process",
        "process-creates-node",
        "node-advertises-endpoint",
        "domain-constrains-discovery",
        "graph-records-runtime"
      ],
      conditionIds: [
        "intended-overlay-sourced",
        "shared-discovery-scope",
        "resolved-name-recorded"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the ROS workspace investigation from package source to captured graph:",
            "The package, overlay, process and graph sequence proves the runtime origin and discovery scope.",
            "The package, overlay, process and graph sequence changes ROS source before checking the active install.",
            [
              "Resolve the ROS source package into its sourced install overlay.",
              "Inspect the discovered node and endpoint after the runtime process starts."
            ],
            [
              "Trace the installed ROS executable into its runtime process.",
              "Capture resolved graph names and discovery domain in one context."
            ]
          ],
          focusRef: reasonedCase("visible-graph-example", "scenario"),
          contextConditionIds: [
            "intended-overlay-sourced",
            "resolved-name-recorded",
            "shared-discovery-scope"
          ],
          steps: [
            [
              "build-overlay",
              ["package-builds-overlay"],
              ["intended-overlay-sourced"]
            ],
            [
              "launch-process",
              ["overlay-launches-process"],
              ["same-runtime-context"]
            ],
            [
              "create-graph",
              ["process-creates-node", "node-advertises-endpoint"],
              ["resolved-name-recorded"]
            ],
            [
              "record-domain",
              ["domain-constrains-discovery", "graph-records-runtime"],
              ["shared-discovery-scope"]
            ]
          ],
          correctOrder: [
            "build-overlay",
            "launch-process",
            "create-graph",
            "record-domain"
          ]
        },
        retry: {
          instruction: [
            "Trace the hidden ROS endpoint from healthy processes to split discovery:",
            "The discovery retry keeps process evidence and exposes the mismatched domain scope.",
            "The discovery retry rebuilds the ROS package even though both installed executables run.",
            [
              "Begin with the running ROS nodes and absent publisher endpoint.",
              "Compare discovery domains before changing source or endpoint names."
            ],
            [
              "Record each runtime process and its domain scope.",
              "Align ROS discovery and confirm the graph endpoint appears."
            ]
          ],
          focusRef: reasonedCase("split-domain-counterexample", "scenario"),
          contextConditionIds: [
            "shared-discovery-scope",
            "same-runtime-context"
          ],
          steps: [
            [
              "confirm-processes",
              ["process-creates-node"],
              ["same-runtime-context"]
            ],
            [
              "observe-absence",
              ["graph-records-runtime"],
              ["resolved-name-recorded"]
            ],
            [
              "compare-domains",
              ["domain-constrains-discovery"],
              ["shared-discovery-scope"]
            ],
            [
              "confirm-endpoint",
              ["node-advertises-endpoint"],
              ["shared-discovery-scope"]
            ]
          ],
          correctOrder: [
            "confirm-processes",
            "observe-absence",
            "compare-domains",
            "confirm-endpoint"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence that establishes the intended ROS computation graph:",
            "The selected ROS evidence covers installed origin, resolved names and discovery scope.",
            "The selected ROS evidence treats a successful build as proof of runtime connectivity.",
            [
              "Choose the relation from sourced overlay to runtime process.",
              "Choose the graph records that include endpoint and domain scope."
            ],
            [
              "Select the intended install overlay evidence.",
              "Select fully resolved ROS names and shared discovery evidence."
            ]
          ],
          focusRef: term("computation-graph", "definition"),
          contextConditionIds: [
            "intended-overlay-sourced",
            "resolved-name-recorded",
            "shared-discovery-scope"
          ],
          options: [
            [
              "overlay-origin",
              true,
              relation("overlay-launches-process"),
              condition("intended-overlay-sourced"),
              ["overlay-launches-process"],
              ["intended-overlay-sourced"],
              null
            ],
            [
              "resolved-endpoints",
              true,
              relation("node-advertises-endpoint"),
              condition("resolved-name-recorded"),
              ["node-advertises-endpoint"],
              ["resolved-name-recorded"],
              null
            ],
            [
              "domain-record",
              true,
              relation("domain-constrains-discovery"),
              condition("shared-discovery-scope"),
              ["domain-constrains-discovery"],
              ["shared-discovery-scope"],
              null
            ],
            [
              "build-only",
              false,
              misconception("build-and-run-proves-graph", "claim"),
              misconception("build-and-run-proves-graph", "mechanism"),
              ["package-builds-overlay"],
              ["shared-discovery-scope"],
              "build-and-run-proves-graph"
            ],
            [
              "process-only",
              false,
              reasonedCase("split-domain-counterexample", "outcome"),
              condition("same-runtime-context"),
              ["process-creates-node"],
              ["same-runtime-context"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the ROS records that isolate the split-domain fault:",
            "The diagnostic records preserve running-node evidence and compare discovery scope.",
            "The diagnostic records blame the ROS source package without checking domain visibility.",
            [
              "Inspect nodes and endpoints from the subscriber runtime context.",
              "Record the domain scope of every expected ROS participant."
            ],
            [
              "Mark the graph observation relation.",
              "Mark the discovery constraint that separates the endpoints."
            ]
          ],
          focusRef: reasonedCase("split-domain-counterexample", "verification"),
          contextConditionIds: [
            "shared-discovery-scope",
            "same-runtime-context"
          ],
          options: [
            [
              "running-nodes",
              true,
              relation("process-creates-node"),
              condition("same-runtime-context"),
              ["process-creates-node"],
              ["same-runtime-context"],
              null
            ],
            [
              "captured-graph",
              true,
              relation("graph-records-runtime"),
              condition("resolved-name-recorded"),
              ["graph-records-runtime"],
              ["resolved-name-recorded"],
              null
            ],
            [
              "scope-comparison",
              true,
              relation("domain-constrains-discovery"),
              condition("shared-discovery-scope"),
              ["domain-constrains-discovery"],
              ["shared-discovery-scope"],
              null
            ],
            [
              "rebuild-first",
              false,
              misconception("build-and-run-proves-graph", "claim"),
              misconception("build-and-run-proves-graph", "mechanism"),
              ["package-builds-overlay"],
              ["intended-overlay-sourced"],
              "build-and-run-proves-graph"
            ],
            [
              "rename-first",
              false,
              reasonedCase("split-domain-counterexample", "outcome"),
              condition("resolved-name-recorded"),
              ["node-advertises-endpoint"],
              ["resolved-name-recorded"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each ROS graph operation to its runtime boundary:",
            "The workspace, name and discovery operations carry overlay, resolution and domain boundaries.",
            "A ROS graph operation is paired with a boundary that cannot expose its runtime fault.",
            [
              "Pair executable launch with the intended install overlay.",
              "Pair endpoint advertisement with fully resolved ROS names."
            ],
            [
              "Match participant visibility to the discovery domain.",
              "Match graph capture to the same runtime context."
            ]
          ],
          focusRef: reasonedCase("visible-graph-example", "criterion"),
          contextConditionIds: [
            "intended-overlay-sourced",
            "resolved-name-recorded",
            "shared-discovery-scope"
          ],
          pairs: [
            [
              "overlay-pair",
              relation("overlay-launches-process"),
              condition("intended-overlay-sourced"),
              relation("overlay-launches-process"),
              ["overlay-launches-process"],
              ["intended-overlay-sourced"]
            ],
            [
              "name-pair",
              relation("node-advertises-endpoint"),
              condition("resolved-name-recorded"),
              relation("node-advertises-endpoint"),
              ["node-advertises-endpoint"],
              ["resolved-name-recorded"]
            ],
            [
              "domain-pair",
              relation("domain-constrains-discovery"),
              condition("shared-discovery-scope"),
              relation("domain-constrains-discovery"),
              ["domain-constrains-discovery"],
              ["shared-discovery-scope"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why healthy ROS processes can form a disconnected computation graph:",
            "The explanation connects install overlay, resolved endpoint names and discovery domain.",
            "The explanation repeats process health and omits distributed ROS graph scope.",
            [
              "Define the observed ROS computation graph.",
              "Distinguish package build state from sourced runtime state."
            ],
            [
              "Explain how discovery scope constrains endpoint visibility.",
              "Use captured graph evidence from one runtime context."
            ]
          ],
          focusRef: misconception("build-and-run-proves-graph", "claim"),
          contextConditionIds: [
            "intended-overlay-sourced",
            "shared-discovery-scope",
            "same-runtime-context"
          ],
          conceptGroups: [
            [
              "workspace-definition",
              term("ros-workspace", "label"),
              [
                term("ros-workspace", "definition"),
                relation("package-builds-overlay")
              ],
              ["package-builds-overlay"],
              ["intended-overlay-sourced"]
            ],
            [
              "graph-definition",
              term("computation-graph", "label"),
              [
                term("computation-graph", "definition"),
                relation("graph-records-runtime")
              ],
              ["graph-records-runtime"],
              ["resolved-name-recorded"]
            ],
            [
              "domain-definition",
              term("discovery-domain", "label"),
              [
                term("discovery-domain", "definition"),
                relation("domain-constrains-discovery")
              ],
              ["domain-constrains-discovery"],
              ["shared-discovery-scope"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["node-advertises-endpoint"],
          criterionConditionId: "shared-discovery-scope"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the ROS workspace-to-graph diagram for the visible endpoint:",
            "The diagram implication traces the installed executable into a discovered node and endpoint.",
            "The diagram implication equates source-package build success with the runtime ROS graph.",
            [
              "Trace the ROS package through its sourced install overlay.",
              "Follow the runtime process into the discovered graph endpoint."
            ],
            [
              "Identify the install-overlay launch relation.",
              "Choose the implication that retains resolved ROS graph evidence."
            ]
          ],
          focusRef: reasonedCase("visible-graph-example", "scenario"),
          contextConditionIds: [
            "intended-overlay-sourced",
            "resolved-name-recorded"
          ],
          positions: [
            ["source-package", 0, 0],
            ["install-overlay", 1, 0],
            ["runtime-process", 2, 0],
            ["runtime-node", 3, 0],
            ["graph-endpoint", 4, 0]
          ],
          relationIds: [
            "package-builds-overlay",
            "overlay-launches-process",
            "process-creates-node",
            "node-advertises-endpoint"
          ],
          answerRelationIds: [
            "overlay-launches-process",
            "node-advertises-endpoint"
          ],
          options: [
            [
              "trace-runtime-origin",
              true,
              reasonedCase("visible-graph-example", "verification"),
              condition("resolved-name-recorded"),
              ["overlay-launches-process", "node-advertises-endpoint"],
              ["intended-overlay-sourced", "resolved-name-recorded"],
              null
            ],
            [
              "trust-build",
              false,
              misconception("build-and-run-proves-graph", "claim"),
              misconception("build-and-run-proves-graph", "mechanism"),
              ["package-builds-overlay"],
              ["shared-discovery-scope"],
              "build-and-run-proves-graph"
            ],
            [
              "ignore-overlay",
              false,
              reasonedCase("split-domain-counterexample", "outcome"),
              condition("intended-overlay-sourced"),
              ["process-creates-node"],
              ["intended-overlay-sourced"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the ROS graph diagram when discovery domains are split:",
            "The counterexample implication uses domain scope to explain the absent publisher endpoint.",
            "The counterexample implication rebuilds the ROS package while leaving discovery separated.",
            [
              "Start with running nodes and the captured subscriber graph.",
              "Apply the discovery-domain constraint to endpoint visibility."
            ],
            [
              "Identify the graph observation in the subscriber context.",
              "Choose the implication that aligns ROS discovery scope."
            ]
          ],
          focusRef: reasonedCase("split-domain-counterexample", "scenario"),
          contextConditionIds: [
            "shared-discovery-scope",
            "same-runtime-context"
          ],
          positions: [
            ["runtime-process", 0, 0],
            ["runtime-node", 1, 0],
            ["domain-scope", 1, 1],
            ["graph-endpoint", 2, 0],
            ["graph-observation", 3, 0]
          ],
          relationIds: [
            "process-creates-node",
            "domain-constrains-discovery",
            "node-advertises-endpoint",
            "graph-records-runtime"
          ],
          answerRelationIds: [
            "domain-constrains-discovery",
            "graph-records-runtime"
          ],
          options: [
            [
              "align-domain",
              true,
              reasonedCase("split-domain-counterexample", "verification"),
              condition("shared-discovery-scope"),
              ["domain-constrains-discovery", "graph-records-runtime"],
              ["shared-discovery-scope", "same-runtime-context"],
              null
            ],
            [
              "rebuild-package",
              false,
              misconception("build-and-run-proves-graph", "claim"),
              misconception("build-and-run-proves-graph", "mechanism"),
              ["process-creates-node"],
              ["intended-overlay-sourced"],
              "build-and-run-proves-graph"
            ],
            [
              "ignore-domain",
              false,
              reasonedCase("split-domain-counterexample", "outcome"),
              condition("shared-discovery-scope"),
              ["node-advertises-endpoint"],
              ["shared-discovery-scope"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("computation-graph", "label"),
      focusRef: reasonedCase("visible-graph-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["source-package", 0, 0],
        ["install-overlay", 1, 0],
        ["runtime-process", 2, 0],
        ["runtime-node", 3, 0],
        ["domain-scope", 3, 1],
        ["graph-endpoint", 4, 0],
        ["graph-observation", 5, 0]
      ],
      visibleEntityIds: [
        "source-package",
        "install-overlay",
        "runtime-process",
        "runtime-node",
        "domain-scope",
        "graph-endpoint",
        "graph-observation"
      ],
      visibleRelationIds: [
        "package-builds-overlay",
        "overlay-launches-process",
        "process-creates-node",
        "node-advertises-endpoint",
        "domain-constrains-discovery",
        "graph-records-runtime"
      ],
      controls: [
        [
          "shared-domain",
          condition("shared-discovery-scope"),
          ["shared-discovery-scope", "intended-overlay-sourced"],
          [
            "install-overlay",
            "runtime-process",
            "runtime-node",
            "domain-scope",
            "graph-endpoint",
            "graph-observation"
          ],
          [
            "overlay-launches-process",
            "process-creates-node",
            "node-advertises-endpoint",
            "domain-constrains-discovery",
            "graph-records-runtime"
          ],
          [],
          [],
          [
            [
              "visible-endpoint",
              "The shared ROS domain exposes the intended graph endpoint.",
              ["domain-scope", "graph-endpoint", "graph-observation"],
              ["domain-constrains-discovery", "graph-records-runtime"]
            ]
          ],
          reasonedCase("visible-graph-example", "verification")
        ],
        [
          "split-domain",
          condition("same-runtime-context"),
          ["same-runtime-context"],
          [
            "runtime-process",
            "runtime-node",
            "domain-scope",
            "graph-observation"
          ],
          [
            "process-creates-node",
            "domain-constrains-discovery",
            "graph-records-runtime"
          ],
          ["node-advertises-endpoint"],
          [],
          [
            [
              "hidden-endpoint",
              "The split discovery domain hides the ROS publisher endpoint.",
              ["domain-scope", "graph-observation"],
              ["domain-constrains-discovery"]
            ]
          ],
          reasonedCase("split-domain-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L02",
    systemModel:
      "A ROS 2 node publishes typed message samples on a resolved topic, while subscribers receive only through compatible interface, quality-of-service and semantic contracts.",
    failurePattern:
      "Matching topic names can still yield no delivery or unsafe interpretation when message type, offered and requested policy, units, frame, timestamp or field meaning differs.",
    visualExplanation:
      "A publisher-to-subscriber path expands the resolved topic, exact message interface, offered and requested quality-of-service policies and field-level semantic contract.",
    applicationTask:
      "Specify and inspect a ROS 2 command-to-state topic pair, inject a reliability mismatch and distinguish transport compatibility from correct unit and frame interpretation.",
    terms: [
      [
        "ros-node",
        "ROS 2 node responsibility",
        "A named runtime participant that owns a bounded computation or device responsibility and its communication endpoints.",
        "A process may contain several nodes, and a node should not hide unrelated interface ownership.",
        "bound-node-responsibility"
      ],
      [
        "ros-topic",
        "ROS 2 topic",
        "A resolved name used for asynchronous many-to-many streams of typed message samples.",
        "A topic name alone does not define type, delivery policy or field semantics.",
        "resolve-topic-contract"
      ],
      [
        "message-interface",
        "ROS message interface",
        "The exact package, message type and field structure serialised between ROS endpoints.",
        "Matching structure without matching units, frames and timestamp meaning is only syntactic compatibility.",
        "bind-message-semantics"
      ],
      [
        "quality-of-service",
        "ROS quality of service",
        "The endpoint policies that request or offer delivery behaviour such as reliability, durability, history and depth.",
        "A subscriber request must be compatible with the publisher offer; stronger requested behaviour is not created by the topic name.",
        "compare-endpoint-policies"
      ]
    ],
    entities: [
      [
        "publisher-node",
        "component",
        "Publisher ROS node",
        "The bounded producer that writes typed samples to a resolved topic endpoint."
      ],
      [
        "subscriber-node",
        "component",
        "Subscriber ROS node",
        "The bounded consumer that receives and interprets samples from a resolved topic endpoint."
      ],
      [
        "resolved-topic",
        "component",
        "Resolved topic name",
        "The fully qualified ROS topic after namespace and remapping resolution."
      ],
      [
        "message-schema",
        "constraint",
        "Exact message schema",
        "The package-qualified message type and ordered field structure shared by both endpoints."
      ],
      [
        "message-sample",
        "state",
        "Typed message sample",
        "One serialised value containing declared fields, units, frame reference and timestamp meaning."
      ],
      [
        "qos-contract",
        "constraint",
        "Endpoint QoS contract",
        "The publisher-offered and subscriber-requested policies evaluated for compatibility."
      ],
      [
        "semantic-contract",
        "constraint",
        "Field semantic contract",
        "The declared units, coordinate frame, valid range, timestamp source and field meaning."
      ],
      [
        "delivery-observation",
        "observation",
        "Topic delivery observation",
        "A time-stamped record of discovered endpoint compatibility and received sample behaviour."
      ]
    ],
    relations: [
      [
        "publisher-advertises-topic",
        "supports",
        ["publisher-node"],
        ["resolved-topic"],
        "the publisher ROS node advertises a resolved topic endpoint",
        "directed",
        "one-to-many"
      ],
      [
        "schema-constrains-sample",
        "constrains",
        ["message-schema"],
        ["message-sample"],
        "the exact ROS message schema constrains serialised sample fields",
        "directed",
        "one-to-many"
      ],
      [
        "topic-routes-sample",
        "routes",
        ["resolved-topic", "message-sample"],
        ["subscriber-node"],
        "the resolved ROS topic routes typed samples towards compatible subscribers",
        "directed",
        "many-to-one"
      ],
      [
        "qos-constrains-delivery",
        "constrains",
        ["qos-contract"],
        ["message-sample", "subscriber-node"],
        "compatible offered and requested QoS policies constrain sample delivery",
        "directed",
        "one-to-many"
      ],
      [
        "semantics-constrain-interpretation",
        "constrains",
        ["semantic-contract"],
        ["message-sample", "subscriber-node"],
        "declared field units, frame and time constrain subscriber interpretation",
        "directed",
        "one-to-many"
      ],
      [
        "delivery-records-contract",
        "measures",
        [
          "publisher-node",
          "subscriber-node",
          "resolved-topic",
          "message-schema",
          "qos-contract",
          "message-sample"
        ],
        ["delivery-observation"],
        "the delivery observation records discovered endpoints, interface, QoS and received sample evidence",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "exact-interface-match",
        "criterion",
        "Publisher and subscriber use the same package-qualified ROS message type and field structure.",
        [
          "publisher-node",
          "subscriber-node",
          "message-schema",
          "message-sample"
        ],
        ["schema-constrains-sample", "topic-routes-sample"]
      ],
      [
        "compatible-qos-policies",
        "criterion",
        "Subscriber-requested ROS QoS policies are compatible with the publisher-offered policies.",
        ["publisher-node", "subscriber-node", "qos-contract", "message-sample"],
        ["qos-constrains-delivery", "delivery-records-contract"]
      ],
      [
        "declared-message-semantics",
        "boundary",
        "Every operational message field has declared SI units, coordinate frame, timestamp source and valid range.",
        ["message-sample", "semantic-contract", "subscriber-node"],
        ["semantics-constrain-interpretation"]
      ],
      [
        "resolved-topic-identity",
        "boundary",
        "Publisher and subscriber evidence uses the same fully resolved ROS topic after namespaces and remaps.",
        [
          "publisher-node",
          "subscriber-node",
          "resolved-topic",
          "delivery-observation"
        ],
        [
          "publisher-advertises-topic",
          "topic-routes-sample",
          "delivery-records-contract"
        ]
      ]
    ],
    failureBoundary: [
      "reliability-request-mismatch",
      "compatible-qos-policies",
      "A best-effort publisher offers wheel-state samples while a subscriber requests reliable delivery on the same resolved topic and message type.",
      "Graph inspection finds both endpoints but reports incompatible policy and the subscriber receives no samples.",
      "Reject a message-code diagnosis until offered and requested QoS policies are compared at both ROS endpoints.",
      [
        "publisher-node",
        "subscriber-node",
        "resolved-topic",
        "message-schema",
        "message-sample",
        "qos-contract",
        "delivery-observation"
      ],
      [
        "publisher-advertises-topic",
        "schema-constrains-sample",
        "topic-routes-sample",
        "qos-constrains-delivery",
        "delivery-records-contract"
      ]
    ],
    conceptualModel: [
      [
        "bound-node-responsibility",
        "Assign one bounded producer or consumer responsibility to each ROS node.",
        ["publisher-node", "subscriber-node"],
        ["publisher-advertises-topic", "topic-routes-sample"],
        ["resolved-topic-identity"]
      ],
      [
        "resolve-topic-contract",
        "Record the fully resolved ROS topic name after namespace and remapping rules.",
        ["publisher-node", "subscriber-node", "resolved-topic"],
        ["publisher-advertises-topic", "topic-routes-sample"],
        ["resolved-topic-identity"]
      ],
      [
        "bind-interface-type",
        "Bind both endpoints to the exact package-qualified ROS message schema.",
        ["publisher-node", "subscriber-node", "message-schema", "message-sample"],
        ["schema-constrains-sample"],
        ["exact-interface-match"]
      ],
      [
        "bind-message-semantics",
        "Declare sample units, coordinate frame, valid range and timestamp source independently of serialised type.",
        ["message-sample", "semantic-contract", "subscriber-node"],
        ["semantics-constrain-interpretation"],
        ["declared-message-semantics"]
      ],
      [
        "compare-endpoint-policies",
        "Compare publisher-offered and subscriber-requested QoS policies before expecting delivery.",
        ["publisher-node", "subscriber-node", "qos-contract"],
        ["qos-constrains-delivery"],
        ["compatible-qos-policies"]
      ],
      [
        "capture-delivery-evidence",
        "Record endpoint discovery, interface, QoS and received ROS samples in one delivery observation.",
        [
          "publisher-node",
          "subscriber-node",
          "resolved-topic",
          "message-schema",
          "qos-contract",
          "message-sample",
          "delivery-observation"
        ],
        ["delivery-records-contract"],
        [
          "exact-interface-match",
          "compatible-qos-policies",
          "resolved-topic-identity"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "wheel-state-topic-example",
        kind: "example",
        scenario:
          "A wheel-state publisher and estimator subscriber share one resolved ROS topic, exact message schema, compatible QoS and a radians-per-second semantic contract.",
        changedConditionIds: ["declared-message-semantics"],
        givens: [
          [
            "wheel-sample",
            "Wheel-state message",
            "ordered wheel velocities with sensor timestamp and base-linked frame meaning",
            "rad/s and s",
            "message-sample"
          ],
          [
            "endpoint-policy",
            "ROS endpoint policies",
            "publisher offer and subscriber request are explicitly recorded",
            null,
            "qos-contract"
          ]
        ],
        reasoningSteps: [
          [
            "example-topic",
            "Both ROS nodes resolve the same fully qualified wheel-state topic.",
            ["publisher-node", "subscriber-node", "resolved-topic"],
            ["publisher-advertises-topic", "topic-routes-sample"],
            ["resolved-topic-identity"]
          ],
          [
            "example-schema",
            "The exact message schema constrains identical serialised wheel-state fields.",
            ["message-schema", "message-sample"],
            ["schema-constrains-sample"],
            ["exact-interface-match"]
          ],
          [
            "example-qos",
            "The offered and requested ROS QoS policies permit sample delivery.",
            ["qos-contract", "message-sample", "subscriber-node"],
            ["qos-constrains-delivery"],
            ["compatible-qos-policies"]
          ],
          [
            "example-semantics",
            "The subscriber interprets wheel velocity, frame and sensor time through the declared semantic contract.",
            ["semantic-contract", "message-sample", "subscriber-node"],
            ["semantics-constrain-interpretation"],
            ["declared-message-semantics"]
          ]
        ],
        outcome:
          "The subscriber receives and interprets wheel-state samples under explicit ROS transport and semantic contracts.",
        criterionConditionId: "declared-message-semantics",
        criterion:
          "Topic delivery is usable only when resolved name, exact type, QoS and field semantics all agree.",
        verification:
          "Capture endpoint information and one received sample, then verify package-qualified type, QoS, rad/s units, frame meaning and sensor timestamp."
      },
      {
        id: "qos-mismatch-counterexample",
        kind: "counterexample",
        scenario:
          "A wheel-state publisher offers best-effort reliability while the estimator subscriber requests reliable delivery on the same typed ROS topic.",
        changedConditionIds: ["compatible-qos-policies"],
        givens: [
          [
            "publisher-offer",
            "Publisher QoS",
            "best-effort reliability is offered",
            null,
            "qos-contract"
          ],
          [
            "subscriber-request",
            "Subscriber QoS",
            "reliable delivery is requested",
            null,
            "subscriber-node"
          ]
        ],
        reasoningSteps: [
          [
            "counter-name",
            "The publisher and subscriber still expose the same resolved ROS topic name.",
            ["publisher-node", "subscriber-node", "resolved-topic"],
            ["publisher-advertises-topic", "topic-routes-sample"],
            ["resolved-topic-identity"]
          ],
          [
            "counter-type",
            "Both endpoints still declare the exact same wheel-state message schema.",
            ["message-schema", "message-sample"],
            ["schema-constrains-sample"],
            ["exact-interface-match"]
          ],
          [
            "counter-policy",
            "The reliable subscriber request is incompatible with the best-effort publisher offer.",
            ["publisher-node", "subscriber-node", "qos-contract"],
            ["qos-constrains-delivery"],
            ["compatible-qos-policies"]
          ],
          [
            "counter-observation",
            "The delivery observation records discovered endpoints but no received wheel-state sample.",
            [
              "publisher-node",
              "subscriber-node",
              "message-sample",
              "delivery-observation"
            ],
            ["delivery-records-contract"],
            ["compatible-qos-policies"]
          ]
        ],
        outcome:
          "Matching ROS topic and type do not deliver samples because offered and requested reliability are incompatible.",
        criterionConditionId: "compatible-qos-policies",
        criterion:
          "The publisher offer must satisfy the subscriber request for each policy relevant to delivery.",
        verification:
          "Inspect both endpoint policy sets, change one policy deliberately and confirm delivery changes without renaming the topic or message type."
      }
    ],
    misconception: {
      id: "same-topic-means-compatible",
      claim:
        "ROS 2 endpoints with the same topic name will communicate and interpret data correctly.",
      mechanism:
        "Resolved names can match while message schema, QoS compatibility, units, frame or timestamp meaning differs.",
      correction:
        "Verify resolved topic, package-qualified interface, offered-requested QoS and field semantics independently.",
      disconfirmingObservation:
        "The graph shows matching wheel-state names and types while the reliable subscriber receives nothing from a best-effort publisher.",
      entityIds: [
        "publisher-node",
        "subscriber-node",
        "resolved-topic",
        "message-schema",
        "message-sample",
        "qos-contract",
        "semantic-contract",
        "delivery-observation"
      ],
      relationIds: [
        "publisher-advertises-topic",
        "schema-constrains-sample",
        "topic-routes-sample",
        "qos-constrains-delivery",
        "semantics-constrain-interpretation",
        "delivery-records-contract"
      ],
      conditionIds: [
        "exact-interface-match",
        "compatible-qos-policies",
        "declared-message-semantics",
        "resolved-topic-identity"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the ROS topic contract from node ownership to received sample evidence:",
            "The node, name, schema, policy and semantic sequence establishes usable topic delivery.",
            "The node, name, schema, policy and semantic sequence infers compatibility from the ROS topic name.",
            [
              "Resolve the ROS topic before comparing endpoint policies.",
              "Bind the message schema before interpreting sample units."
            ],
            [
              "Trace the publisher node into the typed message sample.",
              "Capture subscriber delivery after QoS and semantic checks."
            ]
          ],
          focusRef: reasonedCase("wheel-state-topic-example", "scenario"),
          contextConditionIds: [
            "resolved-topic-identity",
            "exact-interface-match",
            "compatible-qos-policies",
            "declared-message-semantics"
          ],
          steps: [
            [
              "resolve-name",
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"]
            ],
            [
              "bind-schema",
              ["schema-constrains-sample"],
              ["exact-interface-match"]
            ],
            [
              "compare-qos",
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"]
            ],
            [
              "interpret-sample",
              ["semantics-constrain-interpretation"],
              ["declared-message-semantics"]
            ]
          ],
          correctOrder: [
            "resolve-name",
            "bind-schema",
            "compare-qos",
            "interpret-sample"
          ]
        },
        retry: {
          instruction: [
            "Trace the missing wheel sample from matched ROS name to incompatible reliability:",
            "The QoS retry preserves topic and schema evidence while exposing the offered-requested mismatch.",
            "The QoS retry renames the ROS topic even though both endpoint names already match.",
            [
              "Confirm the exact message schema before examining delivery policy.",
              "Compare the publisher offer with the subscriber request."
            ],
            [
              "Record publisher and subscriber ROS nodes plus the absent typed message sample.",
              "Align reliability policy and repeat the delivery observation."
            ]
          ],
          focusRef: reasonedCase("qos-mismatch-counterexample", "scenario"),
          contextConditionIds: [
            "exact-interface-match",
            "compatible-qos-policies"
          ],
          steps: [
            [
              "confirm-topic",
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"]
            ],
            [
              "confirm-type",
              ["schema-constrains-sample"],
              ["exact-interface-match"]
            ],
            [
              "compare-policies",
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"]
            ],
            [
              "repeat-observation",
              ["delivery-records-contract"],
              ["compatible-qos-policies"]
            ]
          ],
          correctOrder: [
            "confirm-topic",
            "confirm-type",
            "compare-policies",
            "repeat-observation"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a usable ROS topic interface:",
            "The selected topic evidence covers resolved name, exact message schema, QoS and field semantics.",
            "The selected topic evidence accepts a matching ROS name without endpoint contracts.",
            [
              "Choose the exact interface relation.",
              "Choose both delivery-policy and semantic-interpretation relations."
            ],
            [
              "Select the resolved ROS topic identity.",
              "Select compatible QoS and declared message semantics."
            ]
          ],
          focusRef: term("ros-topic", "boundary"),
          contextConditionIds: [
            "resolved-topic-identity",
            "exact-interface-match",
            "compatible-qos-policies",
            "declared-message-semantics"
          ],
          options: [
            [
              "topic-identity",
              true,
              relation("publisher-advertises-topic"),
              condition("resolved-topic-identity"),
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"],
              null
            ],
            [
              "schema-match",
              true,
              relation("schema-constrains-sample"),
              condition("exact-interface-match"),
              ["schema-constrains-sample"],
              ["exact-interface-match"],
              null
            ],
            [
              "policy-match",
              true,
              relation("qos-constrains-delivery"),
              condition("compatible-qos-policies"),
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"],
              null
            ],
            [
              "name-only",
              false,
              misconception("same-topic-means-compatible", "claim"),
              misconception("same-topic-means-compatible", "mechanism"),
              ["publisher-advertises-topic"],
              ["compatible-qos-policies"],
              "same-topic-means-compatible"
            ],
            [
              "type-only",
              false,
              reasonedCase("qos-mismatch-counterexample", "outcome"),
              condition("exact-interface-match"),
              ["schema-constrains-sample"],
              ["exact-interface-match"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the ROS endpoint records that isolate the reliability mismatch:",
            "The diagnostic records keep name and type fixed while comparing publisher offer and subscriber request.",
            "The diagnostic records blame message fields without inspecting ROS delivery policies.",
            [
              "Inspect publisher and subscriber endpoint information.",
              "Retain the absent-sample delivery observation."
            ],
            [
              "Mark how the endpoint QoS contract constrains the typed message sample.",
              "Mark the repeated topic delivery observation after policy alignment."
            ]
          ],
          focusRef: reasonedCase("qos-mismatch-counterexample", "verification"),
          contextConditionIds: [
            "compatible-qos-policies",
            "resolved-topic-identity"
          ],
          options: [
            [
              "endpoint-policies",
              true,
              relation("qos-constrains-delivery"),
              condition("compatible-qos-policies"),
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"],
              null
            ],
            [
              "delivery-record",
              true,
              relation("delivery-records-contract"),
              reasonedCase("qos-mismatch-counterexample", "verification"),
              ["delivery-records-contract"],
              ["compatible-qos-policies"],
              null
            ],
            [
              "fixed-name",
              true,
              condition("resolved-topic-identity"),
              relation("publisher-advertises-topic"),
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"],
              null
            ],
            [
              "name-proof",
              false,
              misconception("same-topic-means-compatible", "claim"),
              misconception("same-topic-means-compatible", "mechanism"),
              ["publisher-advertises-topic"],
              ["compatible-qos-policies"],
              "same-topic-means-compatible"
            ],
            [
              "semantic-only",
              false,
              condition("declared-message-semantics"),
              reasonedCase("qos-mismatch-counterexample", "outcome"),
              ["semantics-constrain-interpretation"],
              ["declared-message-semantics"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain why a matching ROS topic name is not a complete interface contract:",
            "The explanation connects resolved name, exact message schema, QoS compatibility and field semantics.",
            "The explanation repeats the ROS name and omits delivery or interpretation boundaries.",
            [
              "Define a ROS message interface separately from its field meaning.",
              "Distinguish offered publisher policy from requested subscriber policy."
            ],
            [
              "Explain how QoS constrains message-sample delivery.",
              "Apply units, frame and timestamp semantics at the subscriber node."
            ]
          ],
          focusRef: misconception("same-topic-means-compatible", "claim"),
          contextConditionIds: [
            "exact-interface-match",
            "compatible-qos-policies",
            "declared-message-semantics"
          ],
          conceptGroups: [
            [
              "topic-definition",
              term("ros-topic", "label"),
              [
                term("ros-topic", "definition"),
                relation("topic-routes-sample")
              ],
              ["topic-routes-sample"],
              ["resolved-topic-identity"]
            ],
            [
              "interface-definition",
              term("message-interface", "label"),
              [
                term("message-interface", "definition"),
                relation("schema-constrains-sample")
              ],
              ["schema-constrains-sample"],
              ["exact-interface-match"]
            ],
            [
              "qos-definition",
              term("quality-of-service", "label"),
              [
                term("quality-of-service", "definition"),
                relation("qos-constrains-delivery")
              ],
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["semantics-constrain-interpretation"],
          criterionConditionId: "declared-message-semantics"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each ROS topic operation to its interface boundary:",
            "The name, schema and delivery operations carry resolution, type and policy boundaries.",
            "A ROS topic operation is paired with a boundary that cannot expose its endpoint mismatch.",
            [
              "Pair endpoint naming with resolved topic identity.",
              "Pair sample serialisation with exact message schema."
            ],
            [
              "Match sample delivery to compatible QoS.",
              "Match subscriber interpretation to declared field semantics."
            ]
          ],
          focusRef: reasonedCase("qos-mismatch-counterexample", "criterion"),
          contextConditionIds: [
            "resolved-topic-identity",
            "exact-interface-match",
            "compatible-qos-policies"
          ],
          pairs: [
            [
              "name-pair",
              relation("publisher-advertises-topic"),
              condition("resolved-topic-identity"),
              relation("publisher-advertises-topic"),
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"]
            ],
            [
              "schema-pair",
              relation("schema-constrains-sample"),
              condition("exact-interface-match"),
              relation("schema-constrains-sample"),
              ["schema-constrains-sample"],
              ["exact-interface-match"]
            ],
            [
              "qos-pair",
              relation("qos-constrains-delivery"),
              condition("compatible-qos-policies"),
              relation("qos-constrains-delivery"),
              ["qos-constrains-delivery"],
              ["compatible-qos-policies"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the ROS publisher-to-subscriber diagram for the delivered wheel sample:",
            "The diagram implication requires both typed sample routing and compatible endpoint policy.",
            "The diagram implication treats the resolved topic as sufficient for ROS delivery.",
            [
              "Trace the publisher node through the topic and message sample.",
              "Apply QoS before the subscriber node receives data."
            ],
            [
              "Identify the typed ROS routing relation.",
              "Choose the implication that retains endpoint policy compatibility."
            ]
          ],
          focusRef: reasonedCase("wheel-state-topic-example", "scenario"),
          contextConditionIds: [
            "exact-interface-match",
            "compatible-qos-policies"
          ],
          positions: [
            ["publisher-node", 0, 0],
            ["resolved-topic", 1, 0],
            ["message-sample", 2, 0],
            ["qos-contract", 2, 1],
            ["subscriber-node", 3, 0]
          ],
          relationIds: [
            "publisher-advertises-topic",
            "topic-routes-sample",
            "qos-constrains-delivery"
          ],
          answerRelationIds: [
            "topic-routes-sample",
            "qos-constrains-delivery"
          ],
          options: [
            [
              "deliver-compatible-sample",
              true,
              reasonedCase("wheel-state-topic-example", "verification"),
              condition("compatible-qos-policies"),
              ["topic-routes-sample", "qos-constrains-delivery"],
              ["exact-interface-match", "compatible-qos-policies"],
              null
            ],
            [
              "trust-topic-name",
              false,
              misconception("same-topic-means-compatible", "claim"),
              misconception("same-topic-means-compatible", "mechanism"),
              ["publisher-advertises-topic"],
              ["compatible-qos-policies"],
              "same-topic-means-compatible"
            ],
            [
              "ignore-schema",
              false,
              reasonedCase("qos-mismatch-counterexample", "outcome"),
              condition("exact-interface-match"),
              ["topic-routes-sample"],
              ["exact-interface-match"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the ROS endpoint diagram under the reliability mismatch:",
            "The counterexample implication uses QoS compatibility to explain the absent delivery observation.",
            "The counterexample implication renames the resolved topic while policy remains incompatible.",
            [
              "Compare the QoS contract before changing ROS names.",
              "Follow compatible samples into the delivery observation."
            ],
            [
              "Identify the endpoint policy constraint.",
              "Choose the implication that repeats delivery after QoS alignment."
            ]
          ],
          focusRef: reasonedCase("qos-mismatch-counterexample", "scenario"),
          contextConditionIds: [
            "compatible-qos-policies",
            "resolved-topic-identity"
          ],
          positions: [
            ["publisher-node", 0, 0],
            ["resolved-topic", 1, 0],
            ["qos-contract", 1, 1],
            ["message-sample", 2, 0],
            ["subscriber-node", 3, 0]
          ],
          relationIds: [
            "publisher-advertises-topic",
            "qos-constrains-delivery",
            "topic-routes-sample"
          ],
          answerRelationIds: [
            "qos-constrains-delivery",
            "topic-routes-sample"
          ],
          options: [
            [
              "align-qos",
              true,
              reasonedCase("qos-mismatch-counterexample", "verification"),
              condition("compatible-qos-policies"),
              ["qos-constrains-delivery", "topic-routes-sample"],
              ["compatible-qos-policies", "resolved-topic-identity"],
              null
            ],
            [
              "trust-name",
              false,
              misconception("same-topic-means-compatible", "claim"),
              misconception("same-topic-means-compatible", "mechanism"),
              ["publisher-advertises-topic"],
              ["resolved-topic-identity"],
              "same-topic-means-compatible"
            ],
            [
              "change-schema",
              false,
              reasonedCase("qos-mismatch-counterexample", "outcome"),
              condition("exact-interface-match"),
              ["qos-constrains-delivery"],
              ["exact-interface-match"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("quality-of-service", "label"),
      focusRef: reasonedCase("wheel-state-topic-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["publisher-node", 0, 0],
        ["resolved-topic", 1, 0],
        ["message-schema", 1, 1],
        ["message-sample", 2, 0],
        ["qos-contract", 2, 1],
        ["semantic-contract", 3, 1],
        ["subscriber-node", 3, 0],
        ["delivery-observation", 4, 0]
      ],
      visibleEntityIds: [
        "publisher-node",
        "resolved-topic",
        "message-schema",
        "message-sample",
        "qos-contract",
        "semantic-contract",
        "subscriber-node",
        "delivery-observation"
      ],
      visibleRelationIds: [
        "publisher-advertises-topic",
        "schema-constrains-sample",
        "topic-routes-sample",
        "qos-constrains-delivery",
        "semantics-constrain-interpretation",
        "delivery-records-contract"
      ],
      controls: [
        [
          "compatible-endpoints",
          condition("compatible-qos-policies"),
          [
            "compatible-qos-policies",
            "exact-interface-match",
            "declared-message-semantics"
          ],
          [
            "publisher-node",
            "resolved-topic",
            "message-schema",
            "message-sample",
            "qos-contract",
            "semantic-contract",
            "subscriber-node",
            "delivery-observation"
          ],
          [
            "publisher-advertises-topic",
            "schema-constrains-sample",
            "topic-routes-sample",
            "qos-constrains-delivery",
            "semantics-constrain-interpretation",
            "delivery-records-contract"
          ],
          [],
          [],
          [
            [
              "delivered-sample",
              "Compatible ROS endpoint contracts deliver an interpretable wheel sample.",
              ["message-sample", "subscriber-node", "delivery-observation"],
              ["qos-constrains-delivery", "delivery-records-contract"]
            ]
          ],
          reasonedCase("wheel-state-topic-example", "verification")
        ],
        [
          "incompatible-reliability",
          condition("resolved-topic-identity"),
          ["resolved-topic-identity"],
          [
            "publisher-node",
            "resolved-topic",
            "message-sample",
            "qos-contract",
            "subscriber-node",
            "delivery-observation"
          ],
          [
            "publisher-advertises-topic",
            "qos-constrains-delivery",
            "delivery-records-contract"
          ],
          ["topic-routes-sample"],
          [],
          [
            [
              "missing-sample",
              "The incompatible QoS contract suppresses ROS sample delivery.",
              ["qos-contract", "subscriber-node", "delivery-observation"],
              ["qos-constrains-delivery"]
            ]
          ],
          reasonedCase("qos-mismatch-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L03",
    systemModel:
      "ROS 2 services carry bounded request-response exchanges, actions manage long-running goals with feedback and cancellation, and lifecycle states gate when a component may perform work.",
    failurePattern:
      "A long robot behaviour can block a service timeout or ignore cancellation, while an active lifecycle component can publish invalid output when configuration and transition guards are missing.",
    visualExplanation:
      "Three linked sequences contrast a bounded service call, an action goal-feedback-cancel-result flow and lifecycle transitions from unconfigured through inactive to active.",
    applicationTask:
      "Choose service or action semantics for robot behaviours, define seconds-based timeout and cancellation outcomes and test activation only after valid lifecycle configuration.",
    terms: [
      [
        "ros-service",
        "ROS 2 service",
        "A typed request-response exchange intended for work with a bounded completion and explicit failure result.",
        "A service does not provide standard goal feedback or cancellation semantics for long-running work.",
        "classify-interaction-duration"
      ],
      [
        "ros-action",
        "ROS 2 action",
        "A typed long-running goal protocol with acceptance, feedback, cancellation and terminal result states.",
        "An accepted goal still requires defined cancellation, timeout and terminal-state handling.",
        "define-action-protocol"
      ],
      [
        "managed-lifecycle",
        "Managed ROS lifecycle",
        "An explicit component-state protocol that separates configuration, inactivity, activation and cleanup.",
        "A running process is not equivalent to a configured and active lifecycle component.",
        "gate-lifecycle-activation"
      ]
    ],
    entities: [
      [
        "service-client",
        "component",
        "ROS service client",
        "The requester that sends a typed bounded request and awaits a response or timeout."
      ],
      [
        "service-server",
        "component",
        "ROS service server",
        "The component that validates and completes a bounded request-response operation."
      ],
      [
        "action-client",
        "component",
        "ROS action client",
        "The requester that submits, monitors and may cancel a long-running robot goal."
      ],
      [
        "goal-handle",
        "state",
        "Action goal handle",
        "The accepted or rejected goal identity and its current non-terminal or terminal state."
      ],
      [
        "action-feedback",
        "observation",
        "Action feedback and result",
        "Time-stamped progress observations and the final succeeded, cancelled or failed result."
      ],
      [
        "lifecycle-state",
        "state",
        "Lifecycle component state",
        "The unconfigured, inactive, active or finalised state of the managed component."
      ],
      [
        "configuration-record",
        "criterion",
        "Validated configuration record",
        "Evidence that parameters, interfaces and resources are valid before activation."
      ],
      [
        "behaviour-observation",
        "observation",
        "Behaviour protocol observation",
        "A time-stamped trace of request, goal, feedback, cancellation and lifecycle transitions."
      ]
    ],
    relations: [
      [
        "client-requests-service",
        "routes",
        ["service-client"],
        ["service-server"],
        "the ROS service client routes a bounded typed request to the service server",
        "directed",
        "one-to-one"
      ],
      [
        "client-submits-goal",
        "routes",
        ["action-client"],
        ["goal-handle"],
        "the ROS action client submits a goal and receives its goal handle",
        "directed",
        "one-to-one"
      ],
      [
        "goal-emits-feedback",
        "supports",
        ["goal-handle"],
        ["action-feedback"],
        "the active action goal emits progress feedback and a terminal result",
        "directed",
        "one-to-many"
      ],
      [
        "client-cancels-goal",
        "invalidates",
        ["action-client"],
        ["goal-handle"],
        "an accepted cancellation request invalidates continued execution of the action goal",
        "directed",
        "one-to-one"
      ],
      [
        "configuration-constrains-state",
        "constrains",
        ["configuration-record"],
        ["lifecycle-state"],
        "validated configuration constrains transition into the active lifecycle state",
        "directed",
        "one-to-one"
      ],
      [
        "lifecycle-constrains-goal",
        "constrains",
        ["lifecycle-state"],
        ["goal-handle"],
        "the managed lifecycle state constrains whether robot action goals may execute",
        "directed",
        "one-to-many"
      ],
      [
        "protocol-records-behaviour",
        "measures",
        [
          "service-client",
          "service-server",
          "action-client",
          "goal-handle",
          "action-feedback",
          "lifecycle-state"
        ],
        ["behaviour-observation"],
        "the behaviour observation records service, action and lifecycle protocol states over time",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "bounded-service-completion",
        "boundary",
        "A ROS service operation has a declared completion bound, timeout and typed failure response.",
        ["service-client", "service-server", "behaviour-observation"],
        ["client-requests-service", "protocol-records-behaviour"]
      ],
      [
        "defined-action-terminal-states",
        "criterion",
        "Every accepted action goal reaches succeeded, cancelled or failed with bounded feedback timing.",
        ["action-client", "goal-handle", "action-feedback"],
        ["client-submits-goal", "goal-emits-feedback", "client-cancels-goal"]
      ],
      [
        "effective-goal-cancellation",
        "criterion",
        "An accepted cancellation request stops action side effects and produces a cancelled terminal result.",
        ["action-client", "goal-handle", "action-feedback"],
        ["client-cancels-goal", "goal-emits-feedback"]
      ],
      [
        "validated-before-active",
        "boundary",
        "The managed ROS component enters active only after parameters, interfaces and resources validate in inactive.",
        ["configuration-record", "lifecycle-state", "goal-handle"],
        ["configuration-constrains-state", "lifecycle-constrains-goal"]
      ]
    ],
    failureBoundary: [
      "long-work-as-service",
      "effective-goal-cancellation",
      "A multi-stage robot docking behaviour is exposed as a blocking service with no progress feedback or cancellation path.",
      "The client timeout expires while the service-side robot motion continues without a terminal cancellation result.",
      "Reject the service design and use an action with bounded feedback, cancellation and lifecycle gating for the long-running behaviour.",
      [
        "service-client",
        "service-server",
        "action-client",
        "goal-handle",
        "action-feedback",
        "lifecycle-state",
        "behaviour-observation"
      ],
      [
        "client-requests-service",
        "client-submits-goal",
        "goal-emits-feedback",
        "client-cancels-goal",
        "lifecycle-constrains-goal",
        "protocol-records-behaviour"
      ]
    ],
    conceptualModel: [
      [
        "classify-interaction-duration",
        "Classify the robot operation as bounded request-response or long-running goal work.",
        ["service-client", "service-server", "action-client", "goal-handle"],
        ["client-requests-service", "client-submits-goal"],
        ["bounded-service-completion", "defined-action-terminal-states"]
      ],
      [
        "define-service-boundary",
        "Define typed ROS service response, timeout and failure for each bounded operation.",
        ["service-client", "service-server", "behaviour-observation"],
        ["client-requests-service", "protocol-records-behaviour"],
        ["bounded-service-completion"]
      ],
      [
        "define-action-protocol",
        "Define action goal acceptance, feedback interval, cancellation and every terminal result.",
        ["action-client", "goal-handle", "action-feedback"],
        ["client-submits-goal", "goal-emits-feedback", "client-cancels-goal"],
        ["defined-action-terminal-states", "effective-goal-cancellation"]
      ],
      [
        "validate-component-resources",
        "Validate managed-component parameters, interfaces and resources before activation.",
        ["configuration-record", "lifecycle-state"],
        ["configuration-constrains-state"],
        ["validated-before-active"]
      ],
      [
        "gate-lifecycle-activation",
        "Allow robot goals only while the managed component is validly active.",
        ["lifecycle-state", "goal-handle"],
        ["lifecycle-constrains-goal"],
        ["validated-before-active"]
      ],
      [
        "capture-protocol-trace",
        "Record request, goal, feedback, cancellation, result and lifecycle transitions against one clock.",
        [
          "service-client",
          "service-server",
          "action-client",
          "goal-handle",
          "action-feedback",
          "lifecycle-state",
          "behaviour-observation"
        ],
        ["protocol-records-behaviour"],
        [
          "bounded-service-completion",
          "defined-action-terminal-states",
          "validated-before-active"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "managed-docking-action-example",
        kind: "example",
        scenario:
          "A docking component validates its sensors while inactive, transitions active and accepts a long-running ROS action goal with feedback and cancellation.",
        changedConditionIds: ["validated-before-active"],
        givens: [
          [
            "docking-goal",
            "Robot action request",
            "multi-stage approach, alignment and contact behaviour",
            "s",
            "goal-handle"
          ],
          [
            "component-config",
            "Managed component evidence",
            "sensor topics, controller interface and parameters validated while inactive",
            null,
            "configuration-record"
          ]
        ],
        reasoningSteps: [
          [
            "example-configure",
            "Validated configuration permits the docking component to enter active lifecycle state.",
            ["configuration-record", "lifecycle-state"],
            ["configuration-constrains-state"],
            ["validated-before-active"]
          ],
          [
            "example-goal",
            "The active component accepts the long-running docking action goal.",
            ["action-client", "goal-handle", "lifecycle-state"],
            ["client-submits-goal", "lifecycle-constrains-goal"],
            ["defined-action-terminal-states", "validated-before-active"]
          ],
          [
            "example-feedback",
            "Time-stamped action feedback reports docking progress until a terminal result.",
            ["goal-handle", "action-feedback"],
            ["goal-emits-feedback"],
            ["defined-action-terminal-states"]
          ],
          [
            "example-cancel",
            "An accepted cancel request stops docking side effects and returns a cancelled result.",
            ["action-client", "goal-handle", "action-feedback"],
            ["client-cancels-goal", "goal-emits-feedback"],
            ["effective-goal-cancellation"]
          ]
        ],
        outcome:
          "The managed docking behaviour exposes progress, cancellation and terminal evidence only while validly active.",
        criterionConditionId: "effective-goal-cancellation",
        criterion:
          "Long-running robot work must be lifecycle-gated and terminate observably after success, cancellation or failure.",
        verification:
          "Record lifecycle transitions, action goal identity, feedback timestamps, cancellation acceptance, stopped side effects and terminal result."
      },
      {
        id: "blocking-service-counterexample",
        kind: "counterexample",
        scenario:
          "A robot docking sequence runs behind a synchronous ROS service whose client times out before physical motion completes.",
        changedConditionIds: ["bounded-service-completion"],
        givens: [
          [
            "service-timeout",
            "Client timing",
            "request timeout is shorter than variable docking completion",
            "s",
            "service-client"
          ],
          [
            "continued-motion",
            "Server side effect",
            "robot motion continues after the client stops waiting",
            null,
            "service-server"
          ]
        ],
        reasoningSteps: [
          [
            "counter-request",
            "The service client routes one request to start a variable-duration docking sequence.",
            ["service-client", "service-server"],
            ["client-requests-service"],
            ["bounded-service-completion"]
          ],
          [
            "counter-timeout",
            "The client timeout ends the wait but does not cancel server-side robot motion.",
            ["service-client", "service-server", "behaviour-observation"],
            ["protocol-records-behaviour"],
            ["bounded-service-completion"]
          ],
          [
            "counter-no-feedback",
            "The service protocol exposes no goal handle or standard progress feedback.",
            ["service-client", "goal-handle", "action-feedback"],
            ["client-submits-goal", "goal-emits-feedback"],
            ["defined-action-terminal-states"]
          ],
          [
            "counter-no-cancel",
            "The missing action cancellation path leaves robot side effects running without a cancelled result.",
            ["action-client", "goal-handle", "action-feedback"],
            ["client-cancels-goal", "goal-emits-feedback"],
            ["effective-goal-cancellation"]
          ]
        ],
        outcome:
          "A service timeout disconnects the client decision from continuing physical robot behaviour.",
        criterionConditionId: "bounded-service-completion",
        criterion:
          "A service is unsuitable when completion, progress and cancellation cannot fit its declared bounded exchange.",
        verification:
          "Inject a client timeout, observe continued server motion, then repeat with an action and verify feedback plus cancellation terminal state."
      }
    ],
    misconception: {
      id: "service-and-action-interchangeable",
      claim:
        "ROS 2 services and actions are interchangeable ways to start any robot behaviour.",
      mechanism:
        "A service has bounded request-response semantics, whereas an action provides goal identity, progress, cancellation and terminal states.",
      correction:
        "Use services for bounded exchanges, actions for long cancellable work and lifecycle guards before physical side effects.",
      disconfirmingObservation:
        "The docking service client times out while robot motion continues with no goal feedback or cancellation result.",
      entityIds: [
        "service-client",
        "service-server",
        "action-client",
        "goal-handle",
        "action-feedback",
        "lifecycle-state",
        "configuration-record",
        "behaviour-observation"
      ],
      relationIds: [
        "client-requests-service",
        "client-submits-goal",
        "goal-emits-feedback",
        "client-cancels-goal",
        "configuration-constrains-state",
        "lifecycle-constrains-goal",
        "protocol-records-behaviour"
      ],
      conditionIds: [
        "bounded-service-completion",
        "defined-action-terminal-states",
        "effective-goal-cancellation",
        "validated-before-active"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the managed docking protocol from configuration to terminal action result:",
            "The lifecycle, goal, feedback and cancellation sequence bounds the robot behaviour.",
            "The lifecycle, goal, feedback and cancellation sequence starts physical motion before configuration.",
            [
              "Validate the managed component before accepting a docking goal.",
              "Emit action feedback before any terminal result."
            ],
            [
              "Transition the lifecycle component into active.",
              "Accept, monitor and terminate the ROS action goal explicitly."
            ]
          ],
          focusRef: reasonedCase("managed-docking-action-example", "scenario"),
          contextConditionIds: [
            "validated-before-active",
            "defined-action-terminal-states",
            "effective-goal-cancellation"
          ],
          steps: [
            [
              "validate-config",
              ["configuration-constrains-state"],
              ["validated-before-active"]
            ],
            [
              "accept-goal",
              ["client-submits-goal", "lifecycle-constrains-goal"],
              ["defined-action-terminal-states"]
            ],
            [
              "report-progress",
              ["goal-emits-feedback"],
              ["defined-action-terminal-states"]
            ],
            [
              "terminate-goal",
              ["client-cancels-goal"],
              ["effective-goal-cancellation"]
            ]
          ],
          correctOrder: [
            "validate-config",
            "accept-goal",
            "report-progress",
            "terminate-goal"
          ]
        },
        retry: {
          instruction: [
            "Trace the blocking docking service from request to uncontrolled side effect:",
            "The service retry exposes timeout, absent goal state and missing cancellation result.",
            "The service retry extends the ROS client timeout without changing the behaviour protocol.",
            [
              "Begin with the variable-duration service request.",
              "Separate client timeout from continuing server robot motion."
            ],
            [
              "Record the bounded service contract failure.",
              "Replace long work with a cancellable action goal protocol."
            ]
          ],
          focusRef: reasonedCase("blocking-service-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-service-completion",
            "effective-goal-cancellation"
          ],
          steps: [
            [
              "send-service",
              ["client-requests-service"],
              ["bounded-service-completion"]
            ],
            [
              "observe-timeout",
              ["protocol-records-behaviour"],
              ["bounded-service-completion"]
            ],
            [
              "expose-missing-goal",
              ["client-submits-goal", "goal-emits-feedback"],
              ["defined-action-terminal-states"]
            ],
            [
              "restore-cancellation",
              ["client-cancels-goal"],
              ["effective-goal-cancellation"]
            ]
          ],
          correctOrder: [
            "send-service",
            "observe-timeout",
            "expose-missing-goal",
            "restore-cancellation"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a managed long-running ROS behaviour:",
            "The selected protocol evidence covers valid activation, goal feedback, cancellation and terminal state.",
            "The selected protocol evidence treats a running ROS process as an active managed behaviour.",
            [
              "Choose the configuration-to-lifecycle relation.",
              "Choose both action feedback and cancellation relations."
            ],
            [
              "Select the valid active lifecycle state.",
              "Select terminal action feedback and cancellation evidence."
            ]
          ],
          focusRef: term("ros-action", "definition"),
          contextConditionIds: [
            "validated-before-active",
            "defined-action-terminal-states",
            "effective-goal-cancellation"
          ],
          options: [
            [
              "valid-activation",
              true,
              relation("configuration-constrains-state"),
              condition("validated-before-active"),
              ["configuration-constrains-state"],
              ["validated-before-active"],
              null
            ],
            [
              "goal-feedback",
              true,
              relation("goal-emits-feedback"),
              condition("defined-action-terminal-states"),
              ["goal-emits-feedback"],
              ["defined-action-terminal-states"],
              null
            ],
            [
              "goal-cancellation",
              true,
              relation("client-cancels-goal"),
              condition("effective-goal-cancellation"),
              ["client-cancels-goal"],
              ["effective-goal-cancellation"],
              null
            ],
            [
              "interchangeable-protocol",
              false,
              misconception("service-and-action-interchangeable", "claim"),
              misconception("service-and-action-interchangeable", "mechanism"),
              ["client-requests-service"],
              ["effective-goal-cancellation"],
              "service-and-action-interchangeable"
            ],
            [
              "running-process",
              false,
              reasonedCase("blocking-service-counterexample", "outcome"),
              condition("validated-before-active"),
              ["lifecycle-constrains-goal"],
              ["validated-before-active"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the ROS protocol records that disqualify the blocking service:",
            "The diagnostic records connect client timeout, continued server work and absent cancellation.",
            "The diagnostic records accept the service because the robot eventually finishes.",
            [
              "Inspect the bounded service completion contract.",
              "Retain the missing goal handle and action feedback evidence."
            ],
            [
              "Mark the service request trace.",
              "Mark the action cancellation relation absent from the service."
            ]
          ],
          focusRef: reasonedCase("blocking-service-counterexample", "verification"),
          contextConditionIds: [
            "bounded-service-completion",
            "effective-goal-cancellation"
          ],
          options: [
            [
              "service-timeout-record",
              true,
              relation("protocol-records-behaviour"),
              condition("bounded-service-completion"),
              ["protocol-records-behaviour"],
              ["bounded-service-completion"],
              null
            ],
            [
              "goal-state-record",
              true,
              relation("client-submits-goal"),
              condition("defined-action-terminal-states"),
              ["client-submits-goal"],
              ["defined-action-terminal-states"],
              null
            ],
            [
              "cancel-state-record",
              true,
              relation("client-cancels-goal"),
              condition("effective-goal-cancellation"),
              ["client-cancels-goal"],
              ["effective-goal-cancellation"],
              null
            ],
            [
              "eventual-completion",
              false,
              misconception("service-and-action-interchangeable", "claim"),
              misconception("service-and-action-interchangeable", "mechanism"),
              ["client-requests-service"],
              ["bounded-service-completion"],
              "service-and-action-interchangeable"
            ],
            [
              "timeout-extension",
              false,
              reasonedCase("blocking-service-counterexample", "outcome"),
              condition("bounded-service-completion"),
              ["protocol-records-behaviour"],
              ["bounded-service-completion"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each ROS behaviour mechanism to its execution boundary:",
            "The service, action and lifecycle mechanisms carry completion, cancellation and activation boundaries.",
            "A ROS behaviour mechanism is paired with a boundary that cannot control its side effects.",
            [
              "Pair service requests with bounded completion.",
              "Pair action cancellation with a cancelled terminal result."
            ],
            [
              "Match goal feedback to defined terminal states.",
              "Match lifecycle activation to validated configuration."
            ]
          ],
          focusRef: reasonedCase("managed-docking-action-example", "criterion"),
          contextConditionIds: [
            "bounded-service-completion",
            "effective-goal-cancellation",
            "validated-before-active"
          ],
          pairs: [
            [
              "service-pair",
              relation("client-requests-service"),
              condition("bounded-service-completion"),
              relation("client-requests-service"),
              ["client-requests-service"],
              ["bounded-service-completion"]
            ],
            [
              "cancel-pair",
              relation("client-cancels-goal"),
              condition("effective-goal-cancellation"),
              relation("client-cancels-goal"),
              ["client-cancels-goal"],
              ["effective-goal-cancellation"]
            ],
            [
              "lifecycle-pair",
              relation("configuration-constrains-state"),
              condition("validated-before-active"),
              relation("configuration-constrains-state"),
              ["configuration-constrains-state"],
              ["validated-before-active"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why the docking sequence requires an action and managed lifecycle:",
            "The explanation connects long-running goal state, feedback, cancellation and validated activation.",
            "The explanation extends the service timeout and omits robot side-effect cancellation.",
            [
              "Define bounded ROS service completion.",
              "Define action goal feedback and terminal states."
            ],
            [
              "Explain how lifecycle state gates physical robot work.",
              "Apply cancellation to stop side effects and return a result."
            ]
          ],
          focusRef: misconception("service-and-action-interchangeable", "claim"),
          contextConditionIds: [
            "bounded-service-completion",
            "defined-action-terminal-states",
            "validated-before-active"
          ],
          conceptGroups: [
            [
              "service-definition",
              term("ros-service", "label"),
              [
                term("ros-service", "definition"),
                relation("client-requests-service")
              ],
              ["client-requests-service"],
              ["bounded-service-completion"]
            ],
            [
              "action-definition",
              term("ros-action", "label"),
              [
                term("ros-action", "definition"),
                relation("goal-emits-feedback")
              ],
              ["goal-emits-feedback"],
              ["defined-action-terminal-states"]
            ],
            [
              "lifecycle-definition",
              term("managed-lifecycle", "label"),
              [
                term("managed-lifecycle", "definition"),
                relation("configuration-constrains-state")
              ],
              ["configuration-constrains-state"],
              ["validated-before-active"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["client-cancels-goal"],
          criterionConditionId: "effective-goal-cancellation"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the managed action diagram for robot docking:",
            "The diagram implication gates the action goal through lifecycle state and returns progress evidence.",
            "The diagram implication accepts docking work before managed configuration is valid.",
            [
              "Trace validated configuration into lifecycle state.",
              "Follow the active goal into action feedback and result."
            ],
            [
              "Identify the lifecycle goal constraint.",
              "Choose the implication that retains valid activation and action feedback."
            ]
          ],
          focusRef: reasonedCase("managed-docking-action-example", "scenario"),
          contextConditionIds: [
            "validated-before-active",
            "defined-action-terminal-states"
          ],
          positions: [
            ["configuration-record", 0, 0],
            ["lifecycle-state", 1, 0],
            ["action-client", 1, 1],
            ["goal-handle", 2, 0],
            ["action-feedback", 3, 0]
          ],
          relationIds: [
            "configuration-constrains-state",
            "client-submits-goal",
            "lifecycle-constrains-goal",
            "goal-emits-feedback"
          ],
          answerRelationIds: [
            "lifecycle-constrains-goal",
            "goal-emits-feedback"
          ],
          options: [
            [
              "gate-managed-goal",
              true,
              reasonedCase("managed-docking-action-example", "verification"),
              condition("validated-before-active"),
              ["lifecycle-constrains-goal", "goal-emits-feedback"],
              ["validated-before-active", "defined-action-terminal-states"],
              null
            ],
            [
              "trust-running-process",
              false,
              misconception("service-and-action-interchangeable", "claim"),
              misconception("service-and-action-interchangeable", "mechanism"),
              ["client-submits-goal"],
              ["validated-before-active"],
              "service-and-action-interchangeable"
            ],
            [
              "omit-feedback",
              false,
              reasonedCase("blocking-service-counterexample", "outcome"),
              condition("defined-action-terminal-states"),
              ["lifecycle-constrains-goal"],
              ["defined-action-terminal-states"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the blocking-service diagram after the client timeout:",
            "The counterexample implication contrasts continued service work with a cancellable action goal.",
            "The counterexample implication treats service timeout as cancellation of robot motion.",
            [
              "Trace the service client to continuing server work.",
              "Compare that path with action goal cancellation."
            ],
            [
              "Identify the missing action goal handle.",
              "Choose the implication that restores cancellation and terminal feedback."
            ]
          ],
          focusRef: reasonedCase("blocking-service-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-service-completion",
            "effective-goal-cancellation"
          ],
          positions: [
            ["service-client", 0, 0],
            ["service-server", 1, 0],
            ["action-client", 1, 1],
            ["goal-handle", 2, 1],
            ["action-feedback", 3, 1]
          ],
          relationIds: [
            "client-requests-service",
            "client-submits-goal",
            "client-cancels-goal",
            "goal-emits-feedback"
          ],
          answerRelationIds: [
            "client-cancels-goal",
            "goal-emits-feedback"
          ],
          options: [
            [
              "restore-action-protocol",
              true,
              reasonedCase("blocking-service-counterexample", "verification"),
              condition("effective-goal-cancellation"),
              ["client-cancels-goal", "goal-emits-feedback"],
              [
                "bounded-service-completion",
                "effective-goal-cancellation"
              ],
              null
            ],
            [
              "extend-service",
              false,
              misconception("service-and-action-interchangeable", "claim"),
              misconception("service-and-action-interchangeable", "mechanism"),
              ["client-requests-service"],
              ["bounded-service-completion"],
              "service-and-action-interchangeable"
            ],
            [
              "assume-timeout-stop",
              false,
              reasonedCase("blocking-service-counterexample", "outcome"),
              condition("effective-goal-cancellation"),
              ["client-requests-service"],
              ["effective-goal-cancellation"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("ros-action", "label"),
      focusRef: reasonedCase("managed-docking-action-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["configuration-record", 0, 0],
        ["lifecycle-state", 1, 0],
        ["service-client", 0, 1],
        ["service-server", 1, 1],
        ["action-client", 2, 1],
        ["goal-handle", 2, 0],
        ["action-feedback", 3, 0],
        ["behaviour-observation", 4, 0]
      ],
      visibleEntityIds: [
        "configuration-record",
        "lifecycle-state",
        "service-client",
        "service-server",
        "action-client",
        "goal-handle",
        "action-feedback",
        "behaviour-observation"
      ],
      visibleRelationIds: [
        "client-requests-service",
        "client-submits-goal",
        "goal-emits-feedback",
        "client-cancels-goal",
        "configuration-constrains-state",
        "lifecycle-constrains-goal",
        "protocol-records-behaviour"
      ],
      controls: [
        [
          "managed-action",
          condition("validated-before-active"),
          [
            "validated-before-active",
            "defined-action-terminal-states",
            "effective-goal-cancellation"
          ],
          [
            "configuration-record",
            "lifecycle-state",
            "action-client",
            "goal-handle",
            "action-feedback",
            "behaviour-observation"
          ],
          [
            "configuration-constrains-state",
            "lifecycle-constrains-goal",
            "client-submits-goal",
            "goal-emits-feedback",
            "client-cancels-goal",
            "protocol-records-behaviour"
          ],
          ["client-requests-service"],
          [],
          [
            [
              "bounded-action",
              "The managed ROS action exposes progress and cancellation.",
              ["lifecycle-state", "goal-handle", "action-feedback"],
              ["lifecycle-constrains-goal", "goal-emits-feedback"]
            ]
          ],
          reasonedCase("managed-docking-action-example", "verification")
        ],
        [
          "blocking-service",
          condition("bounded-service-completion"),
          ["bounded-service-completion"],
          [
            "service-client",
            "service-server",
            "action-client",
            "goal-handle",
            "behaviour-observation"
          ],
          [
            "client-requests-service",
            "protocol-records-behaviour",
            "client-cancels-goal"
          ],
          ["goal-emits-feedback"],
          [],
          [
            [
              "uncontrolled-side-effect",
              "The service timeout leaves robot motion without action cancellation.",
              ["service-client", "service-server", "goal-handle"],
              ["client-requests-service", "client-cancels-goal"]
            ]
          ],
          reasonedCase("blocking-service-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L04",
    systemModel:
      "URDF defines a directed robot link-joint tree with visual, collision and inertial properties, while Xacro expands parameterised source into the concrete model consumed by ROS tools.",
    failurePattern:
      "A robot can render plausibly while joint origin, axis, collision shape, mass, centre of mass or inertia is wrong in the expanded model and frame tree.",
    visualExplanation:
      "A two-link tree overlays joint frames, visual meshes, collision geometry and inertial frames, with Xacro source traced into expanded URDF and observed transforms.",
    applicationTask:
      "Author or inspect a two-link Xacro model, expand it and verify metre-kilogram geometry, joint motion, collision extent, inertial plausibility and frame transforms.",
    terms: [
      [
        "urdf-link",
        "URDF link",
        "A named rigid body containing optional visual, collision and inertial elements in link-relative frames.",
        "A visual mesh alone does not define contact or rigid-body dynamics.",
        "declare-link-elements"
      ],
      [
        "urdf-joint",
        "URDF joint",
        "A directed parent-child connection with type, origin, axis and applicable limits.",
        "The joint axis is interpreted in its declared joint frame, not automatically in world coordinates.",
        "connect-link-tree"
      ],
      [
        "xacro-expansion",
        "Xacro expansion",
        "The deterministic generation of concrete URDF XML from macros, properties, arguments and includes.",
        "Source intent must be checked against the expanded model that downstream ROS tools actually parse.",
        "expand-robot-description"
      ],
      [
        "link-inertia",
        "Link inertia tensor",
        "The symmetric rotational inertia about a declared link-relative inertial frame with mass in kg and dimensions in kg m squared.",
        "An inertia tensor must be physically plausible and consistent with mass, geometry and reference point.",
        "check-inertial-properties"
      ]
    ],
    entities: [
      [
        "xacro-source",
        "input",
        "Parameterised Xacro source",
        "The macro, property, argument and include definitions used to generate the robot description."
      ],
      [
        "expanded-urdf",
        "state",
        "Expanded URDF model",
        "The concrete XML robot description parsed after all Xacro substitutions."
      ],
      [
        "parent-link",
        "component",
        "Parent robot link",
        "The upstream rigid body in a directed URDF joint connection."
      ],
      [
        "child-link",
        "component",
        "Child robot link",
        "The downstream rigid body whose pose depends on the joint."
      ],
      [
        "joint-definition",
        "mechanism",
        "Joint frame and axis",
        "The joint type, parent-child origin, axis and limit data."
      ],
      [
        "visual-collision",
        "component",
        "Visual and collision geometry",
        "Separate rendered and contact shapes with declared origin, scale and metre-based dimensions."
      ],
      [
        "inertial-properties",
        "mechanism",
        "Mass and inertial properties",
        "Link mass, centre-of-mass origin and symmetric inertia tensor in declared SI units."
      ],
      [
        "model-observation",
        "observation",
        "Robot model observation",
        "Evidence from expanded XML, frame transforms, joint motion, collision view and inertia checks."
      ]
    ],
    relations: [
      [
        "xacro-generates-urdf",
        "transforms",
        ["xacro-source"],
        ["expanded-urdf"],
        "Xacro properties and macros generate the concrete URDF model",
        "directed",
        "one-to-one"
      ],
      [
        "joint-connects-links",
        "routes",
        ["parent-link", "joint-definition"],
        ["child-link"],
        "the directed joint connects parent and child robot links",
        "directed",
        "many-to-one"
      ],
      [
        "urdf-defines-joint",
        "supports",
        ["expanded-urdf"],
        ["parent-link", "joint-definition", "child-link"],
        "the expanded URDF defines the link-joint tree consumed by ROS tools",
        "directed",
        "one-to-many"
      ],
      [
        "geometry-attaches-link",
        "supports",
        ["visual-collision"],
        ["parent-link", "child-link"],
        "visual and collision geometry attach to robot links in declared local frames",
        "directed",
        "one-to-many"
      ],
      [
        "inertia-attaches-link",
        "supports",
        ["inertial-properties"],
        ["parent-link", "child-link"],
        "mass and inertia attach to each dynamic robot link in a declared inertial frame",
        "directed",
        "one-to-many"
      ],
      [
        "model-records-structure",
        "measures",
        [
          "expanded-urdf",
          "joint-definition",
          "visual-collision",
          "inertial-properties"
        ],
        ["model-observation"],
        "the robot model observation records expanded structure, motion, contact geometry and inertia evidence",
        "directed",
        "many-to-one"
      ],
      [
        "child-motion-records-observation",
        "measures",
        ["joint-definition", "child-link"],
        ["model-observation"],
        "the exercised joint and child-link motion produce a transform observation",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "expanded-model-inspected",
        "criterion",
        "Validation reads the concrete expanded URDF rather than relying only on Xacro source intent.",
        ["xacro-source", "expanded-urdf", "model-observation"],
        ["xacro-generates-urdf", "model-records-structure"]
      ],
      [
        "directed-tree-consistent",
        "boundary",
        "Every movable child link has one intended parent joint with declared origin, axis and limits.",
        ["parent-link", "joint-definition", "child-link", "expanded-urdf"],
        ["joint-connects-links", "urdf-defines-joint"]
      ],
      [
        "geometry-uses-si-scale",
        "boundary",
        "Visual and collision origins and dimensions use the intended metre-based scale and link frames.",
        ["visual-collision", "parent-link", "child-link"],
        ["geometry-attaches-link"]
      ],
      [
        "physically-plausible-inertia",
        "criterion",
        "Mass is positive and the symmetric inertia is plausible for the declared geometry, units and inertial frame.",
        ["inertial-properties", "parent-link", "child-link"],
        ["inertia-attaches-link", "model-records-structure"]
      ]
    ],
    failureBoundary: [
      "rendered-axis-mismatch",
      "directed-tree-consistent",
      "A two-link arm renders with the expected meshes, but the revolute joint axis is declared in a rotated frame and physical motion occurs about the wrong direction.",
      "The expanded URDF and observed child-link transform disagree with the intended planar joint motion despite a plausible static image.",
      "Reject the model until joint origin, axis frame and transformed child motion agree in the expanded description.",
      [
        "xacro-source",
        "expanded-urdf",
        "parent-link",
        "joint-definition",
        "child-link",
        "visual-collision",
        "model-observation"
      ],
      [
        "xacro-generates-urdf",
        "urdf-defines-joint",
        "joint-connects-links",
        "geometry-attaches-link",
        "model-records-structure"
      ]
    ],
    conceptualModel: [
      [
        "declare-link-elements",
        "Declare separate visual, collision and inertial elements for each dynamic URDF link.",
        [
          "parent-link",
          "child-link",
          "visual-collision",
          "inertial-properties"
        ],
        ["geometry-attaches-link", "inertia-attaches-link"],
        ["geometry-uses-si-scale", "physically-plausible-inertia"]
      ],
      [
        "connect-link-tree",
        "Connect each child link to its parent through a typed joint with origin, axis and limits.",
        ["parent-link", "joint-definition", "child-link"],
        ["joint-connects-links"],
        ["directed-tree-consistent"]
      ],
      [
        "parameterise-xacro-source",
        "Use named Xacro properties and macro parameters for repeated robot dimensions without hiding units.",
        ["xacro-source", "visual-collision", "inertial-properties"],
        ["xacro-generates-urdf"],
        ["geometry-uses-si-scale"]
      ],
      [
        "expand-robot-description",
        "Generate and retain the concrete URDF consumed by robot-state and simulation tools.",
        ["xacro-source", "expanded-urdf"],
        ["xacro-generates-urdf"],
        ["expanded-model-inspected"]
      ],
      [
        "check-inertial-properties",
        "Compare link mass, centre of mass and inertia with independent geometric bounds in SI units.",
        ["inertial-properties", "parent-link", "child-link"],
        ["inertia-attaches-link"],
        ["physically-plausible-inertia"]
      ],
      [
        "exercise-model-transforms",
        "Move each joint through bounded configurations and inspect child transforms, collision shapes and expanded parameters.",
        [
          "expanded-urdf",
          "joint-definition",
          "child-link",
          "visual-collision",
          "model-observation"
        ],
        [
          "urdf-defines-joint",
          "joint-connects-links",
          "child-motion-records-observation",
          "model-records-structure"
        ],
        [
          "expanded-model-inspected",
          "directed-tree-consistent",
          "geometry-uses-si-scale"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "two-link-model-example",
        kind: "example",
        scenario:
          "A parameterised two-link arm expands into URDF with metre-scale geometry, a revolute joint axis, bounded limits and plausible kg-based inertial properties.",
        changedConditionIds: ["expanded-model-inspected"],
        givens: [
          [
            "link-parameters",
            "Xacro dimensions",
            "link lengths, collision dimensions and mass use declared SI units",
            "m and kg",
            "xacro-source"
          ],
          [
            "joint-parameters",
            "Joint declaration",
            "parent, child, origin, axis and angular limits are explicit",
            "rad",
            "joint-definition"
          ]
        ],
        reasoningSteps: [
          [
            "example-expand",
            "Xacro expansion produces one concrete URDF with resolved link and joint values.",
            ["xacro-source", "expanded-urdf"],
            ["xacro-generates-urdf"],
            ["expanded-model-inspected"]
          ],
          [
            "example-tree",
            "The directed joint connects parent and child links through the intended local axis.",
            ["parent-link", "joint-definition", "child-link"],
            ["joint-connects-links", "urdf-defines-joint"],
            ["directed-tree-consistent"]
          ],
          [
            "example-geometry",
            "Visual and collision geometry share intended metre scale while remaining separately inspectable.",
            ["visual-collision", "parent-link", "child-link"],
            ["geometry-attaches-link"],
            ["geometry-uses-si-scale"]
          ],
          [
            "example-inertia",
            "Positive mass and plausible inertia attach to each dynamic robot link.",
            ["inertial-properties", "parent-link", "child-link"],
            ["inertia-attaches-link"],
            ["physically-plausible-inertia"]
          ]
        ],
        outcome:
          "The expanded two-link robot model has an inspectable frame tree, motion, contact shape and inertial boundary.",
        criterionConditionId: "directed-tree-consistent",
        criterion:
          "Expanded link, joint, geometry and inertia data must agree with the intended physical robot in named frames and SI units.",
        verification:
          "Inspect expanded XML, move the revolute joint, compare child transforms and collision extents, and check mass and inertia against geometry."
      },
      {
        id: "wrong-axis-counterexample",
        kind: "counterexample",
        scenario:
          "The two-link arm meshes render correctly, but a rotated joint origin makes the declared axis produce out-of-plane child-link motion.",
        changedConditionIds: ["directed-tree-consistent"],
        givens: [
          [
            "static-render",
            "Visual observation",
            "meshes appear connected in the zero configuration",
            null,
            "visual-collision"
          ],
          [
            "axis-state",
            "Joint frame",
            "joint origin rotates the local axis away from the intended planar normal",
            "rad",
            "joint-definition"
          ]
        ],
        reasoningSteps: [
          [
            "counter-render",
            "Static visual geometry does not exercise the directed joint transformation.",
            ["visual-collision", "joint-definition"],
            ["geometry-attaches-link"],
            ["geometry-uses-si-scale"]
          ],
          [
            "counter-expand",
            "The expanded URDF preserves the rotated joint origin and local axis.",
            ["xacro-source", "expanded-urdf", "joint-definition"],
            ["xacro-generates-urdf", "urdf-defines-joint"],
            ["expanded-model-inspected"]
          ],
          [
            "counter-motion",
            "Joint motion routes the child link out of the intended plane.",
            ["parent-link", "joint-definition", "child-link"],
            ["joint-connects-links"],
            ["directed-tree-consistent"]
          ],
          [
            "counter-observation",
            "The model observation records a child transform inconsistent with the physical joint axis.",
            ["joint-definition", "child-link", "model-observation"],
            ["child-motion-records-observation"],
            ["directed-tree-consistent"]
          ]
        ],
        outcome:
          "A plausible static render hides a frame-dependent joint-axis error in the robot model.",
        criterionConditionId: "directed-tree-consistent",
        criterion:
          "Joint motion and observed child transforms must agree with the intended parent-child axis over bounded configurations.",
        verification:
          "Expand the Xacro, command several joint angles and compare child-link transform direction with the intended physical axis."
      }
    ],
    misconception: {
      id: "render-proves-robot-model",
      claim:
        "A URDF model is correct when its robot meshes render in the expected shape.",
      mechanism:
        "Rendering can ignore wrong joint axes, collision shapes, mass, inertial frames and Xacro-expanded parameter values.",
      correction:
        "Inspect expanded URDF and exercise joint transforms, collision geometry and inertial plausibility independently.",
      disconfirmingObservation:
        "The meshes look connected at zero angle while the child link moves out of plane when the joint is exercised.",
      entityIds: [
        "xacro-source",
        "expanded-urdf",
        "parent-link",
        "child-link",
        "joint-definition",
        "visual-collision",
        "inertial-properties",
        "model-observation"
      ],
      relationIds: [
        "xacro-generates-urdf",
        "joint-connects-links",
        "urdf-defines-joint",
        "geometry-attaches-link",
        "inertia-attaches-link",
        "child-motion-records-observation",
        "model-records-structure"
      ],
      conditionIds: [
        "expanded-model-inspected",
        "directed-tree-consistent",
        "geometry-uses-si-scale",
        "physically-plausible-inertia"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the robot-description verification from Xacro source to exercised child transform:",
            "The Xacro, expanded URDF, link-joint and observation sequence checks the concrete robot model.",
            "The Xacro, expanded URDF, link-joint and observation sequence accepts the static mesh render.",
            [
              "Expand the Xacro before inspecting joint values.",
              "Exercise child-link motion after checking the directed tree."
            ],
            [
              "Generate the concrete URDF model.",
              "Inspect joint, collision and inertia evidence in bounded poses."
            ]
          ],
          focusRef: reasonedCase("two-link-model-example", "scenario"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent",
            "geometry-uses-si-scale",
            "physically-plausible-inertia"
          ],
          steps: [
            [
              "expand-source",
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"]
            ],
            [
              "read-tree",
              ["urdf-defines-joint"],
              ["directed-tree-consistent"]
            ],
            [
              "exercise-joint",
              ["joint-connects-links"],
              ["directed-tree-consistent"]
            ],
            [
              "record-model",
              ["model-records-structure"],
              ["physically-plausible-inertia"]
            ]
          ],
          correctOrder: [
            "expand-source",
            "read-tree",
            "exercise-joint",
            "record-model"
          ]
        },
        retry: {
          instruction: [
            "Trace the wrong-axis model from plausible render to invalid child motion:",
            "The joint-axis retry exposes the expanded origin, local axis and child transform.",
            "The joint-axis retry edits the visual mesh while leaving the URDF joint frame unchanged.",
            [
              "Begin with the concrete expanded joint definition.",
              "Move the child link before judging the robot model."
            ],
            [
              "Inspect joint origin and axis in the expanded URDF.",
              "Compare observed child motion with the intended planar frame."
            ]
          ],
          focusRef: reasonedCase("wrong-axis-counterexample", "scenario"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent"
          ],
          steps: [
            [
              "inspect-expanded-axis",
              ["xacro-generates-urdf", "urdf-defines-joint"],
              ["expanded-model-inspected"]
            ],
            [
              "move-child",
              ["joint-connects-links"],
              ["directed-tree-consistent"]
            ],
            [
              "capture-transform",
              ["model-records-structure"],
              ["directed-tree-consistent"]
            ],
            [
              "repair-axis",
              ["urdf-defines-joint"],
              ["directed-tree-consistent"]
            ]
          ],
          correctOrder: [
            "inspect-expanded-axis",
            "move-child",
            "capture-transform",
            "repair-axis"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required to approve a two-link URDF model:",
            "The selected robot-model evidence covers expanded values, directed joints, collision scale and plausible inertia.",
            "The selected robot-model evidence uses a static visual mesh as the complete validation.",
            [
              "Choose the Xacro-to-URDF expansion relation.",
              "Choose both joint motion and inertial attachment evidence."
            ],
            [
              "Select the directed parent-child robot tree.",
              "Select metre-scale collision and kg-based inertia checks."
            ]
          ],
          focusRef: term("xacro-expansion", "boundary"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent",
            "geometry-uses-si-scale",
            "physically-plausible-inertia"
          ],
          options: [
            [
              "expanded-values",
              true,
              relation("xacro-generates-urdf"),
              condition("expanded-model-inspected"),
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"],
              null
            ],
            [
              "joint-tree",
              true,
              relation("joint-connects-links"),
              condition("directed-tree-consistent"),
              ["joint-connects-links"],
              ["directed-tree-consistent"],
              null
            ],
            [
              "inertia-check",
              true,
              relation("inertia-attaches-link"),
              condition("physically-plausible-inertia"),
              ["inertia-attaches-link"],
              ["physically-plausible-inertia"],
              null
            ],
            [
              "render-only",
              false,
              misconception("render-proves-robot-model", "claim"),
              misconception("render-proves-robot-model", "mechanism"),
              ["geometry-attaches-link"],
              ["directed-tree-consistent"],
              "render-proves-robot-model"
            ],
            [
              "source-only",
              false,
              reasonedCase("wrong-axis-counterexample", "outcome"),
              condition("expanded-model-inspected"),
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the robot-model records that isolate the joint-axis fault:",
            "The diagnostic records connect expanded joint data to observed child-link motion.",
            "The diagnostic records alter robot meshes without exercising the URDF transform.",
            [
              "Inspect the expanded joint origin and local axis.",
              "Retain the child-link transform observation."
            ],
            [
              "Mark the directed joint relation.",
              "Mark the expanded model observation across bounded angles."
            ]
          ],
          focusRef: reasonedCase("wrong-axis-counterexample", "verification"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent"
          ],
          options: [
            [
              "expanded-joint",
              true,
              relation("urdf-defines-joint"),
              condition("expanded-model-inspected"),
              ["urdf-defines-joint"],
              ["expanded-model-inspected"],
              null
            ],
            [
              "child-transform",
              true,
              relation("joint-connects-links"),
              condition("directed-tree-consistent"),
              ["joint-connects-links"],
              ["directed-tree-consistent"],
              null
            ],
            [
              "model-record",
              true,
              relation("model-records-structure"),
              reasonedCase("wrong-axis-counterexample", "verification"),
              ["model-records-structure"],
              ["directed-tree-consistent"],
              null
            ],
            [
              "mesh-proof",
              false,
              misconception("render-proves-robot-model", "claim"),
              misconception("render-proves-robot-model", "mechanism"),
              ["geometry-attaches-link"],
              ["directed-tree-consistent"],
              "render-proves-robot-model"
            ],
            [
              "inertia-only",
              false,
              condition("physically-plausible-inertia"),
              reasonedCase("wrong-axis-counterexample", "outcome"),
              ["inertia-attaches-link"],
              ["physically-plausible-inertia"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain why a rendered robot mesh cannot validate its URDF model:",
            "The explanation connects expanded Xacro, joint frames, collision geometry and inertial properties.",
            "The explanation cites visual shape and omits concrete URDF motion or dynamics.",
            [
              "Define URDF link and joint responsibilities.",
              "Distinguish visual geometry from collision and inertia."
            ],
            [
              "Explain why expanded Xacro values are authoritative.",
              "Use exercised child transforms and physical inertia checks."
            ]
          ],
          focusRef: misconception("render-proves-robot-model", "claim"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent",
            "physically-plausible-inertia"
          ],
          conceptGroups: [
            [
              "link-definition",
              term("urdf-link", "label"),
              [
                term("urdf-link", "definition"),
                relation("geometry-attaches-link")
              ],
              ["geometry-attaches-link"],
              ["geometry-uses-si-scale"]
            ],
            [
              "joint-definition",
              term("urdf-joint", "label"),
              [
                term("urdf-joint", "definition"),
                relation("joint-connects-links")
              ],
              ["joint-connects-links"],
              ["directed-tree-consistent"]
            ],
            [
              "expansion-definition",
              term("xacro-expansion", "label"),
              [
                term("xacro-expansion", "definition"),
                relation("xacro-generates-urdf")
              ],
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["inertia-attaches-link"],
          criterionConditionId: "physically-plausible-inertia"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each robot-description operation to its validation boundary:",
            "The expansion, joint and inertia operations carry concrete-model, tree and physical boundaries.",
            "A robot-description operation is paired with a boundary that cannot expose its model defect.",
            [
              "Pair Xacro generation with expanded-model inspection.",
              "Pair joint connection with the directed robot tree."
            ],
            [
              "Match collision geometry with metre scale.",
              "Match link inertia with physical plausibility."
            ]
          ],
          focusRef: reasonedCase("wrong-axis-counterexample", "criterion"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent",
            "physically-plausible-inertia"
          ],
          pairs: [
            [
              "expansion-pair",
              relation("xacro-generates-urdf"),
              condition("expanded-model-inspected"),
              relation("xacro-generates-urdf"),
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"]
            ],
            [
              "joint-pair",
              relation("joint-connects-links"),
              condition("directed-tree-consistent"),
              relation("joint-connects-links"),
              ["joint-connects-links"],
              ["directed-tree-consistent"]
            ],
            [
              "inertia-pair",
              relation("inertia-attaches-link"),
              condition("physically-plausible-inertia"),
              relation("inertia-attaches-link"),
              ["inertia-attaches-link"],
              ["physically-plausible-inertia"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the expanded robot-tree diagram for the two-link arm:",
            "The diagram implication traces concrete URDF into a directed parent-joint-child structure.",
            "The diagram implication approves the robot tree from Xacro source without expansion.",
            [
              "Trace parameterised Xacro source into expanded URDF.",
              "Follow the joint frame from parent to child link."
            ],
            [
              "Identify the concrete URDF tree relation.",
              "Choose the implication that retains directed joint consistency."
            ]
          ],
          focusRef: reasonedCase("two-link-model-example", "scenario"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent"
          ],
          positions: [
            ["xacro-source", 0, 0],
            ["expanded-urdf", 1, 0],
            ["parent-link", 2, 0],
            ["joint-definition", 2, 1],
            ["child-link", 3, 0]
          ],
          relationIds: [
            "xacro-generates-urdf",
            "urdf-defines-joint",
            "joint-connects-links"
          ],
          answerRelationIds: [
            "urdf-defines-joint",
            "joint-connects-links"
          ],
          options: [
            [
              "retain-directed-tree",
              true,
              reasonedCase("two-link-model-example", "verification"),
              condition("directed-tree-consistent"),
              ["urdf-defines-joint", "joint-connects-links"],
              ["expanded-model-inspected", "directed-tree-consistent"],
              null
            ],
            [
              "trust-source",
              false,
              misconception("render-proves-robot-model", "claim"),
              misconception("render-proves-robot-model", "mechanism"),
              ["xacro-generates-urdf"],
              ["expanded-model-inspected"],
              "render-proves-robot-model"
            ],
            [
              "ignore-axis",
              false,
              reasonedCase("wrong-axis-counterexample", "outcome"),
              condition("directed-tree-consistent"),
              ["urdf-defines-joint"],
              ["directed-tree-consistent"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the wrong-axis robot diagram after exercising the joint:",
            "The counterexample implication compares directed child motion with the expanded joint frame.",
            "The counterexample implication edits visual geometry while preserving the faulty URDF axis.",
            [
              "Start with the expanded joint definition.",
              "Follow parent-joint-child motion into the model observation."
            ],
            [
              "Identify the directed link connection.",
              "Choose the implication that repairs the joint frame."
            ]
          ],
          focusRef: reasonedCase("wrong-axis-counterexample", "scenario"),
          contextConditionIds: [
            "expanded-model-inspected",
            "directed-tree-consistent"
          ],
          positions: [
            ["expanded-urdf", 0, 0],
            ["parent-link", 1, 0],
            ["joint-definition", 1, 1],
            ["child-link", 2, 0],
            ["model-observation", 3, 0]
          ],
          relationIds: [
            "urdf-defines-joint",
            "joint-connects-links",
            "child-motion-records-observation"
          ],
          answerRelationIds: [
            "joint-connects-links",
            "child-motion-records-observation"
          ],
          options: [
            [
              "repair-joint-axis",
              true,
              reasonedCase("wrong-axis-counterexample", "verification"),
              condition("directed-tree-consistent"),
              [
                "joint-connects-links",
                "child-motion-records-observation"
              ],
              ["expanded-model-inspected", "directed-tree-consistent"],
              null
            ],
            [
              "trust-render",
              false,
              misconception("render-proves-robot-model", "claim"),
              misconception("render-proves-robot-model", "mechanism"),
              ["child-motion-records-observation"],
              ["geometry-uses-si-scale"],
              "render-proves-robot-model"
            ],
            [
              "change-mesh",
              false,
              reasonedCase("wrong-axis-counterexample", "outcome"),
              condition("geometry-uses-si-scale"),
              ["urdf-defines-joint"],
              ["geometry-uses-si-scale"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("xacro-expansion", "label"),
      focusRef: reasonedCase("two-link-model-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["xacro-source", 0, 0],
        ["expanded-urdf", 1, 0],
        ["parent-link", 2, 0],
        ["joint-definition", 2, 1],
        ["child-link", 3, 0],
        ["visual-collision", 3, 1],
        ["inertial-properties", 4, 1],
        ["model-observation", 4, 0]
      ],
      visibleEntityIds: [
        "xacro-source",
        "expanded-urdf",
        "parent-link",
        "joint-definition",
        "child-link",
        "visual-collision",
        "inertial-properties",
        "model-observation"
      ],
      visibleRelationIds: [
        "xacro-generates-urdf",
        "joint-connects-links",
        "urdf-defines-joint",
        "geometry-attaches-link",
        "inertia-attaches-link",
        "child-motion-records-observation",
        "model-records-structure"
      ],
      controls: [
        [
          "validated-model",
          condition("expanded-model-inspected"),
          [
            "expanded-model-inspected",
            "directed-tree-consistent",
            "geometry-uses-si-scale",
            "physically-plausible-inertia"
          ],
          [
            "xacro-source",
            "expanded-urdf",
            "parent-link",
            "joint-definition",
            "child-link",
            "visual-collision",
            "inertial-properties",
            "model-observation"
          ],
          [
            "xacro-generates-urdf",
            "urdf-defines-joint",
            "joint-connects-links",
            "child-motion-records-observation",
            "geometry-attaches-link",
            "inertia-attaches-link",
            "model-records-structure"
          ],
          [],
          [],
          [
            [
              "consistent-tree",
              "The expanded robot tree aligns geometry, motion and inertia.",
              ["expanded-urdf", "joint-definition", "model-observation"],
              ["joint-connects-links", "model-records-structure"]
            ]
          ],
          reasonedCase("two-link-model-example", "verification")
        ],
        [
          "rotated-axis",
          condition("directed-tree-consistent"),
          ["directed-tree-consistent"],
          [
            "expanded-urdf",
            "parent-link",
            "joint-definition",
            "child-link",
            "model-observation"
          ],
          [
            "urdf-defines-joint",
            "joint-connects-links",
            "model-records-structure"
          ],
          ["geometry-attaches-link"],
          [],
          [
            [
              "invalid-motion",
              "The expanded joint axis produces an invalid child transform.",
              ["joint-definition", "child-link", "model-observation"],
              ["joint-connects-links", "model-records-structure"]
            ]
          ],
          reasonedCase("wrong-axis-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L05",
    systemModel:
      "Gazebo advances a robot and world model through discrete physics time, contact and sensor plugins whose parameters and clock determine the ROS observations produced.",
    failurePattern:
      "A simulated behaviour can succeed through unrealistic friction, collision geometry, solver step, perfect sensing, zero latency or a clock mismatch that physical hardware will not share.",
    visualExplanation:
      "A simulation pipeline connects robot description and world contact to physics steps, simulation clock, sensor sampling, ROS observations and a physical-plausibility residual.",
    applicationTask:
      "Run or specify a Gazebo traction and sensor experiment, vary friction, time step, noise and latency and state which conclusions remain inside the simulation evidence boundary.",
    terms: [
      [
        "simulation-time",
        "Gazebo simulation time",
        "The virtual seconds advanced by the physics engine and published for simulation-aware ROS components.",
        "Simulation time may run slower, faster or pause relative to wall time and must not be mixed silently with wall-clock timestamps.",
        "bind-simulation-clock"
      ],
      [
        "physics-step",
        "Physics integration step",
        "The simulated time interval over which rigid-body state, forces and contact are numerically advanced.",
        "A smaller step can reduce some numerical errors but does not repair incorrect geometry or physical parameters.",
        "configure-physics-solver"
      ],
      [
        "sensor-model",
        "Simulated sensor model",
        "The mapping from simulated physical state to sampled observation including rate, field of view, quantisation, noise and latency.",
        "An ideal observation is not evidence that a physical sensor will preserve the same accuracy or timing.",
        "configure-sensor-boundary"
      ]
    ],
    entities: [
      [
        "simulation-model",
        "component",
        "Gazebo robot model",
        "The robot links, joints, collision geometry, mass and actuator behaviour loaded into simulation."
      ],
      [
        "world-contact",
        "mechanism",
        "World and contact model",
        "The environment geometry, gravity, friction, restitution and contact parameters."
      ],
      [
        "physics-solver",
        "mechanism",
        "Discrete physics solver",
        "The integration and constraint process advanced at the configured simulation step."
      ],
      [
        "simulation-clock",
        "state",
        "Simulation clock",
        "The virtual time base used by physics, sensors and simulation-aware ROS nodes."
      ],
      [
        "sensor-plugin",
        "mechanism",
        "Gazebo sensor plugin",
        "The configured sampling, noise, latency and interface model for a simulated sensor."
      ],
      [
        "simulated-observation",
        "observation",
        "Simulated ROS observation",
        "The time-stamped sensor or robot-state message emitted from simulation."
      ],
      [
        "plausibility-residual",
        "criterion",
        "Physical plausibility residual",
        "The difference between simulated behaviour and an independent physical bound or reference trace."
      ]
    ],
    relations: [
      [
        "model-feeds-physics",
        "supports",
        ["simulation-model", "world-contact"],
        ["physics-solver"],
        "robot and world physical models provide geometry and parameters to the physics solver",
        "directed",
        "many-to-one"
      ],
      [
        "clock-steps-physics",
        "constrains",
        ["simulation-clock"],
        ["physics-solver"],
        "the simulation clock and configured step constrain physics advancement",
        "directed",
        "one-to-many"
      ],
      [
        "physics-drives-sensor",
        "causes",
        ["physics-solver", "simulation-clock"],
        ["sensor-plugin"],
        "time-stepped simulated state drives the configured sensor plugin",
        "directed",
        "many-to-one"
      ],
      [
        "sensor-emits-observation",
        "maps",
        ["sensor-plugin", "simulation-clock"],
        ["simulated-observation"],
        "the sensor model samples state and emits a time-stamped ROS observation",
        "directed",
        "many-to-one"
      ],
      [
        "observation-compares-bound",
        "compares",
        ["simulated-observation", "world-contact"],
        ["plausibility-residual"],
        "simulated observation and independent physical bounds produce a plausibility residual",
        "directed",
        "many-to-one"
      ],
      [
        "residual-invalidates-parameters",
        "invalidates",
        ["plausibility-residual"],
        ["world-contact", "sensor-plugin"],
        "a structured plausibility residual invalidates tested contact or sensor assumptions",
        "directed",
        "one-to-many"
      ]
    ],
    conditions: [
      [
        "shared-simulation-clock",
        "boundary",
        "Physics, sensor plugins and simulation-aware ROS consumers use the same declared simulation time base.",
        [
          "physics-solver",
          "simulation-clock",
          "sensor-plugin",
          "simulated-observation"
        ],
        ["clock-steps-physics", "physics-drives-sensor", "sensor-emits-observation"]
      ],
      [
        "bounded-physics-parameters",
        "assumption",
        "Mass, collision geometry, gravity, friction and contact parameters remain inside independently plausible bounds.",
        ["simulation-model", "world-contact", "physics-solver"],
        [
          "model-feeds-physics",
          "observation-compares-bound",
          "residual-invalidates-parameters"
        ]
      ],
      [
        "resolved-step-and-rate",
        "criterion",
        "Physics step and sensor update periods resolve the fastest motion and observation used by the decision.",
        [
          "physics-solver",
          "simulation-clock",
          "sensor-plugin",
          "simulated-observation"
        ],
        ["clock-steps-physics", "physics-drives-sensor", "sensor-emits-observation"]
      ],
      [
        "declared-sensor-imperfections",
        "boundary",
        "Sensor rate, noise, quantisation, field of view and latency are explicit and varied over justified ranges.",
        ["sensor-plugin", "simulated-observation", "plausibility-residual"],
        [
          "sensor-emits-observation",
          "observation-compares-bound",
          "residual-invalidates-parameters"
        ]
      ]
    ],
    failureBoundary: [
      "optimistic-traction-and-sensing",
      "bounded-physics-parameters",
      "A mobile robot completes a turn using excessive tyre-ground friction and a perfect zero-latency pose sensor.",
      "The controller succeeds in simulation but the plausibility residual grows when friction is reduced or realistic sensor delay is introduced.",
      "Reject the success claim unless it persists across justified contact, clock and sensor-impairment bounds.",
      [
        "simulation-model",
        "world-contact",
        "physics-solver",
        "simulation-clock",
        "sensor-plugin",
        "simulated-observation",
        "plausibility-residual"
      ],
      [
        "model-feeds-physics",
        "clock-steps-physics",
        "physics-drives-sensor",
        "sensor-emits-observation",
        "observation-compares-bound",
        "residual-invalidates-parameters"
      ]
    ],
    conceptualModel: [
      [
        "load-physical-model",
        "Load robot collision, mass and joint properties plus world gravity, friction and contact parameters.",
        ["simulation-model", "world-contact", "physics-solver"],
        ["model-feeds-physics"],
        ["bounded-physics-parameters"]
      ],
      [
        "bind-simulation-clock",
        "Declare simulation-time use for physics, sensor plugins and ROS consumers.",
        ["physics-solver", "simulation-clock", "sensor-plugin"],
        ["clock-steps-physics", "physics-drives-sensor"],
        ["shared-simulation-clock"]
      ],
      [
        "configure-physics-solver",
        "Choose a physics step that resolves the fastest simulated contact and robot motion.",
        ["physics-solver", "simulation-clock"],
        ["clock-steps-physics"],
        ["resolved-step-and-rate"]
      ],
      [
        "configure-sensor-boundary",
        "Declare sensor sampling, field of view, quantisation, noise and latency before emitting ROS observations.",
        ["sensor-plugin", "simulation-clock", "simulated-observation"],
        ["physics-drives-sensor", "sensor-emits-observation"],
        ["declared-sensor-imperfections", "resolved-step-and-rate"]
      ],
      [
        "challenge-simulation-parameters",
        "Vary contact, physics-step and sensor-imperfection parameters across justified bounds.",
        [
          "world-contact",
          "physics-solver",
          "sensor-plugin",
          "simulated-observation"
        ],
        ["model-feeds-physics", "sensor-emits-observation"],
        [
          "bounded-physics-parameters",
          "resolved-step-and-rate",
          "declared-sensor-imperfections"
        ]
      ],
      [
        "compare-physical-plausibility",
        "Compare simulated trajectories and observations with independent physical bounds and inspect residual structure.",
        [
          "world-contact",
          "simulated-observation",
          "plausibility-residual",
          "sensor-plugin"
        ],
        ["observation-compares-bound", "residual-invalidates-parameters"],
        ["bounded-physics-parameters", "declared-sensor-imperfections"]
      ]
    ],
    reasonedCases: [
      {
        id: "bounded-turn-example",
        kind: "example",
        scenario:
          "A simulated mobile robot turns on a declared surface while Gazebo friction, physics step, sensor noise and latency are varied across plausible bounds.",
        changedConditionIds: ["resolved-step-and-rate"],
        givens: [
          [
            "turn-state",
            "Robot manoeuvre",
            "time-stamped wheel command and body trajectory under simulation time",
            "m/s, rad/s and s",
            "simulation-model"
          ],
          [
            "sensor-state",
            "Simulated pose sensing",
            "bounded update period, noise and latency",
            "s and m",
            "sensor-plugin"
          ]
        ],
        reasoningSteps: [
          [
            "example-physics",
            "Robot collision and plausible surface friction feed the discrete physics solver.",
            ["simulation-model", "world-contact", "physics-solver"],
            ["model-feeds-physics"],
            ["bounded-physics-parameters"]
          ],
          [
            "example-clock",
            "Simulation time advances physics and sensor sampling at resolved periods.",
            ["physics-solver", "simulation-clock", "sensor-plugin"],
            ["clock-steps-physics", "physics-drives-sensor"],
            ["shared-simulation-clock", "resolved-step-and-rate"]
          ],
          [
            "example-sensor",
            "The sensor plugin emits noisy delayed ROS observations under the declared model.",
            ["sensor-plugin", "simulation-clock", "simulated-observation"],
            ["sensor-emits-observation"],
            ["declared-sensor-imperfections"]
          ],
          [
            "example-bound",
            "Trajectory and observation remain inside independent acceleration, slip and timing bounds across the parameter sweep.",
            ["world-contact", "simulated-observation", "plausibility-residual"],
            ["observation-compares-bound"],
            ["bounded-physics-parameters", "declared-sensor-imperfections"]
          ]
        ],
        outcome:
          "The simulated turning result remains plausible across the declared physics, clock and sensor boundaries.",
        criterionConditionId: "bounded-physics-parameters",
        criterion:
          "A simulation claim survives justified variation of physical parameters, numerical timing and sensor imperfections.",
        verification:
          "Record simulation-time trajectory and sensor samples for each parameter case, then compare slip, acceleration, latency and residual bounds."
      },
      {
        id: "perfect-simulation-counterexample",
        kind: "counterexample",
        scenario:
          "A Gazebo mobile robot uses excessive surface friction and a perfect zero-latency pose plugin, then completes a turn that the physical robot cannot track.",
        changedConditionIds: ["declared-sensor-imperfections"],
        givens: [
          [
            "optimistic-contact",
            "World parameters",
            "surface friction is not justified by physical measurements",
            null,
            "world-contact"
          ],
          [
            "ideal-pose",
            "Sensor parameters",
            "no noise, quantisation or delivery latency",
            "s",
            "sensor-plugin"
          ]
        ],
        reasoningSteps: [
          [
            "counter-contact",
            "Optimistic world contact gives the physics solver more traction than the bounded surface.",
            ["world-contact", "physics-solver"],
            ["model-feeds-physics"],
            ["bounded-physics-parameters"]
          ],
          [
            "counter-sensor",
            "The perfect sensor plugin emits observations unavailable from the physical pose sensor.",
            ["sensor-plugin", "simulated-observation"],
            ["sensor-emits-observation"],
            ["declared-sensor-imperfections"]
          ],
          [
            "counter-controller",
            "The controller appears successful because simulated traction and observation timing are optimistic.",
            [
              "physics-solver",
              "simulation-clock",
              "simulated-observation"
            ],
            ["physics-drives-sensor", "sensor-emits-observation"],
            ["shared-simulation-clock"]
          ],
          [
            "counter-residual",
            "Plausibility residual grows when friction and sensor delay move into justified ranges.",
            [
              "world-contact",
              "sensor-plugin",
              "simulated-observation",
              "plausibility-residual"
            ],
            ["observation-compares-bound", "residual-invalidates-parameters"],
            ["bounded-physics-parameters", "declared-sensor-imperfections"]
          ]
        ],
        outcome:
          "Successful simulated tracking depends on optimistic contact and sensing outside the physical evidence boundary.",
        criterionConditionId: "declared-sensor-imperfections",
        criterion:
          "Simulation success is invalid when it disappears under plausible contact, noise and latency conditions.",
        verification:
          "Repeat the turn with bounded friction, sensor noise and latency, then compare simulated observations with physical acceleration and tracking bounds."
      }
    ],
    misconception: {
      id: "simulation-success-proves-hardware",
      claim:
        "A robot behaviour that succeeds in Gazebo is proven to work on physical hardware.",
      mechanism:
        "Simulation success depends on model geometry, contact parameters, numerical time and sensor imperfections that may not match hardware.",
      correction:
        "State the simulation evidence boundary, vary plausible parameters and compare outputs with independent physical bounds.",
      disconfirmingObservation:
        "The turn fails when realistic friction and pose-sensor latency replace optimistic simulation settings.",
      entityIds: [
        "simulation-model",
        "world-contact",
        "physics-solver",
        "simulation-clock",
        "sensor-plugin",
        "simulated-observation",
        "plausibility-residual"
      ],
      relationIds: [
        "model-feeds-physics",
        "clock-steps-physics",
        "physics-drives-sensor",
        "sensor-emits-observation",
        "observation-compares-bound",
        "residual-invalidates-parameters"
      ],
      conditionIds: [
        "shared-simulation-clock",
        "bounded-physics-parameters",
        "resolved-step-and-rate",
        "declared-sensor-imperfections"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the Gazebo evidence path from physical model to plausibility residual:",
            "The model, physics, clock, sensor and residual sequence preserves simulation assumptions.",
            "The model, physics, clock, sensor and residual sequence treats rendered robot motion as physical proof.",
            [
              "Load bounded robot and world parameters before stepping physics.",
              "Emit sensor observations before comparing physical plausibility."
            ],
            [
              "Advance the physics solver on declared simulation time.",
              "Challenge contact and sensor parameters before retaining the result."
            ]
          ],
          focusRef: reasonedCase("bounded-turn-example", "scenario"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "shared-simulation-clock",
            "resolved-step-and-rate",
            "declared-sensor-imperfections"
          ],
          steps: [
            [
              "load-model",
              ["model-feeds-physics"],
              ["bounded-physics-parameters"]
            ],
            [
              "step-simulation",
              ["clock-steps-physics"],
              ["resolved-step-and-rate"]
            ],
            [
              "sample-sensor",
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"]
            ],
            [
              "test-plausibility",
              ["observation-compares-bound"],
              ["bounded-physics-parameters"]
            ]
          ],
          correctOrder: [
            "load-model",
            "step-simulation",
            "sample-sensor",
            "test-plausibility"
          ]
        },
        retry: {
          instruction: [
            "Trace the optimistic Gazebo result from perfect parameters to invalidated claim:",
            "The simulation retry introduces bounded friction and sensor latency before recomputing plausibility.",
            "The simulation retry changes the robot controller while retaining optimistic world and sensor models.",
            [
              "Begin with unjustified contact and ideal sensing.",
              "Vary world contact before interpreting the simulation residual."
            ],
            [
              "Apply bounded friction, noise and sensor latency.",
              "Reject simulation parameters when the plausibility residual persists."
            ]
          ],
          focusRef: reasonedCase("perfect-simulation-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "declared-sensor-imperfections"
          ],
          steps: [
            [
              "expose-contact",
              ["model-feeds-physics"],
              ["bounded-physics-parameters"]
            ],
            [
              "expose-sensor",
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"]
            ],
            [
              "form-residual",
              ["observation-compares-bound"],
              ["resolved-step-and-rate"]
            ],
            [
              "reject-parameters",
              ["residual-invalidates-parameters"],
              ["bounded-physics-parameters"]
            ]
          ],
          correctOrder: [
            "expose-contact",
            "expose-sensor",
            "form-residual",
            "reject-parameters"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a physically bounded Gazebo result:",
            "The selected simulation evidence covers contact parameters, time resolution and sensor imperfections.",
            "The selected simulation evidence accepts one successful robot run without parameter challenge.",
            [
              "Choose the robot-and-world physics relation.",
              "Choose sensor sampling and physical-plausibility relations."
            ],
            [
              "Select the shared simulation clock.",
              "Select bounded contact and declared sensor imperfections."
            ]
          ],
          focusRef: term("sensor-model", "boundary"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "shared-simulation-clock",
            "resolved-step-and-rate",
            "declared-sensor-imperfections"
          ],
          options: [
            [
              "bounded-contact",
              true,
              relation("model-feeds-physics"),
              condition("bounded-physics-parameters"),
              ["model-feeds-physics"],
              ["bounded-physics-parameters"],
              null
            ],
            [
              "resolved-time",
              true,
              relation("clock-steps-physics"),
              condition("resolved-step-and-rate"),
              ["clock-steps-physics"],
              ["resolved-step-and-rate"],
              null
            ],
            [
              "sensor-boundary",
              true,
              relation("sensor-emits-observation"),
              condition("declared-sensor-imperfections"),
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"],
              null
            ],
            [
              "success-only",
              false,
              misconception("simulation-success-proves-hardware", "claim"),
              misconception("simulation-success-proves-hardware", "mechanism"),
              ["model-feeds-physics"],
              ["bounded-physics-parameters"],
              "simulation-success-proves-hardware"
            ],
            [
              "perfect-sensor",
              false,
              reasonedCase("perfect-simulation-counterexample", "outcome"),
              condition("declared-sensor-imperfections"),
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the Gazebo records that expose optimistic traction and sensing:",
            "The diagnostic records connect contact, sensor settings and the changed plausibility residual.",
            "The diagnostic records blame robot control without varying simulation assumptions.",
            [
              "Inspect world friction and sensor latency settings.",
              "Retain simulation-time observations across the parameter cases."
            ],
            [
              "Mark the physical plausibility comparison.",
              "Mark the relation that invalidates contact or sensor parameters."
            ]
          ],
          focusRef: reasonedCase("perfect-simulation-counterexample", "verification"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "declared-sensor-imperfections"
          ],
          options: [
            [
              "contact-setting",
              true,
              relation("model-feeds-physics"),
              condition("bounded-physics-parameters"),
              ["model-feeds-physics"],
              ["bounded-physics-parameters"],
              null
            ],
            [
              "sensor-setting",
              true,
              relation("sensor-emits-observation"),
              condition("declared-sensor-imperfections"),
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"],
              null
            ],
            [
              "residual-change",
              true,
              relation("residual-invalidates-parameters"),
              reasonedCase("perfect-simulation-counterexample", "verification"),
              ["residual-invalidates-parameters"],
              ["bounded-physics-parameters"],
              null
            ],
            [
              "gazebo-proof",
              false,
              misconception("simulation-success-proves-hardware", "claim"),
              misconception("simulation-success-proves-hardware", "mechanism"),
              ["physics-drives-sensor"],
              ["declared-sensor-imperfections"],
              "simulation-success-proves-hardware"
            ],
            [
              "controller-only",
              false,
              reasonedCase("perfect-simulation-counterexample", "outcome"),
              condition("shared-simulation-clock"),
              ["clock-steps-physics"],
              ["shared-simulation-clock"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: [
            "Match each simulation operation to its Gazebo evidence boundary:",
            "The physics, clock and sensor operations carry parameter, resolution and imperfection boundaries.",
            "A simulation operation is paired with a boundary that cannot expose its optimistic assumption.",
            [
              "Pair robot-world physics with bounded physical parameters.",
              "Pair clock stepping with resolved update periods."
            ],
            [
              "Match sensor emission to declared imperfections.",
              "Match residual rejection to physical plausibility."
            ]
          ],
          focusRef: reasonedCase("bounded-turn-example", "criterion"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "resolved-step-and-rate",
            "declared-sensor-imperfections"
          ],
          pairs: [
            [
              "physics-pair",
              relation("model-feeds-physics"),
              condition("bounded-physics-parameters"),
              relation("model-feeds-physics"),
              ["model-feeds-physics"],
              ["bounded-physics-parameters"]
            ],
            [
              "clock-pair",
              relation("clock-steps-physics"),
              condition("resolved-step-and-rate"),
              relation("clock-steps-physics"),
              ["clock-steps-physics"],
              ["resolved-step-and-rate"]
            ],
            [
              "sensor-pair",
              relation("sensor-emits-observation"),
              condition("declared-sensor-imperfections"),
              relation("sensor-emits-observation"),
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: [
            "Explain why Gazebo success does not prove physical robot behaviour:",
            "The explanation connects contact parameters, physics step, simulation clock and sensor imperfections.",
            "The explanation repeats the successful simulation and omits its physical plausibility residual.",
            [
              "Define simulation time separately from wall time.",
              "Define the sensor model beyond ideal values."
            ],
            [
              "Explain how bounded contact changes robot motion.",
              "Use parameter variation and plausibility residual as evidence."
            ]
          ],
          focusRef: misconception("simulation-success-proves-hardware", "claim"),
          contextConditionIds: [
            "shared-simulation-clock",
            "bounded-physics-parameters",
            "declared-sensor-imperfections"
          ],
          conceptGroups: [
            [
              "time-definition",
              term("simulation-time", "label"),
              [
                term("simulation-time", "definition"),
                relation("clock-steps-physics")
              ],
              ["clock-steps-physics"],
              ["shared-simulation-clock"]
            ],
            [
              "step-definition",
              term("physics-step", "label"),
              [
                term("physics-step", "definition"),
                relation("model-feeds-physics")
              ],
              ["model-feeds-physics"],
              ["resolved-step-and-rate"]
            ],
            [
              "sensor-definition",
              term("sensor-model", "label"),
              [
                term("sensor-model", "definition"),
                relation("sensor-emits-observation")
              ],
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["observation-compares-bound"],
          criterionConditionId: "bounded-physics-parameters"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the Gazebo pipeline for the bounded turning experiment:",
            "The diagram implication advances physical models through simulation time into a sensor observation.",
            "The diagram implication treats a sensor observation as independent of physics and clock settings.",
            [
              "Trace robot and world contact into the physics solver.",
              "Follow simulation time into the sensor plugin."
            ],
            [
              "Identify the physics-to-sensor relation.",
              "Choose the implication that retains the world and contact model plus simulation clock."
            ]
          ],
          focusRef: reasonedCase("bounded-turn-example", "scenario"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "shared-simulation-clock",
            "resolved-step-and-rate"
          ],
          positions: [
            ["simulation-model", 0, 0],
            ["world-contact", 0, 1],
            ["physics-solver", 1, 0],
            ["simulation-clock", 1, 1],
            ["sensor-plugin", 2, 0]
          ],
          relationIds: [
            "model-feeds-physics",
            "clock-steps-physics",
            "physics-drives-sensor"
          ],
          answerRelationIds: [
            "model-feeds-physics",
            "physics-drives-sensor"
          ],
          options: [
            [
              "retain-bounded-pipeline",
              true,
              reasonedCase("bounded-turn-example", "verification"),
              condition("bounded-physics-parameters"),
              ["model-feeds-physics", "physics-drives-sensor"],
              [
                "bounded-physics-parameters",
                "shared-simulation-clock",
                "resolved-step-and-rate"
              ],
              null
            ],
            [
              "trust-simulation",
              false,
              misconception("simulation-success-proves-hardware", "claim"),
              misconception("simulation-success-proves-hardware", "mechanism"),
              ["physics-drives-sensor"],
              ["bounded-physics-parameters"],
              "simulation-success-proves-hardware"
            ],
            [
              "ignore-clock",
              false,
              reasonedCase("perfect-simulation-counterexample", "outcome"),
              condition("shared-simulation-clock"),
              ["model-feeds-physics"],
              ["shared-simulation-clock"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the Gazebo evidence diagram under optimistic sensing:",
            "The counterexample implication compares simulated observation with a physical bound and rejects parameters.",
            "The counterexample implication changes robot control while retaining perfect sensor assumptions.",
            [
              "Start with the sensor plugin and simulated ROS observation.",
              "Follow the plausibility residual back to invalid assumptions."
            ],
            [
              "Identify the physical-bound comparison.",
              "Choose the implication that rejects optimistic sensor parameters."
            ]
          ],
          focusRef: reasonedCase("perfect-simulation-counterexample", "scenario"),
          contextConditionIds: [
            "bounded-physics-parameters",
            "declared-sensor-imperfections"
          ],
          positions: [
            ["sensor-plugin", 0, 0],
            ["simulation-clock", 0, 1],
            ["simulated-observation", 1, 0],
            ["world-contact", 1, 1],
            ["plausibility-residual", 2, 0]
          ],
          relationIds: [
            "sensor-emits-observation",
            "observation-compares-bound",
            "residual-invalidates-parameters"
          ],
          answerRelationIds: [
            "observation-compares-bound",
            "residual-invalidates-parameters"
          ],
          options: [
            [
              "reject-optimism",
              true,
              reasonedCase("perfect-simulation-counterexample", "verification"),
              condition("declared-sensor-imperfections"),
              [
                "observation-compares-bound",
                "residual-invalidates-parameters"
              ],
              [
                "bounded-physics-parameters",
                "declared-sensor-imperfections"
              ],
              null
            ],
            [
              "accept-gazebo",
              false,
              misconception("simulation-success-proves-hardware", "claim"),
              misconception("simulation-success-proves-hardware", "mechanism"),
              ["sensor-emits-observation"],
              ["declared-sensor-imperfections"],
              "simulation-success-proves-hardware"
            ],
            [
              "ignore-contact",
              false,
              reasonedCase("perfect-simulation-counterexample", "outcome"),
              condition("bounded-physics-parameters"),
              ["observation-compares-bound"],
              ["bounded-physics-parameters"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("simulation-time", "label"),
      focusRef: reasonedCase("bounded-turn-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["simulation-model", 0, 0],
        ["world-contact", 0, 1],
        ["physics-solver", 1, 0],
        ["simulation-clock", 1, 1],
        ["sensor-plugin", 2, 0],
        ["simulated-observation", 3, 0],
        ["plausibility-residual", 4, 0]
      ],
      visibleEntityIds: [
        "simulation-model",
        "world-contact",
        "physics-solver",
        "simulation-clock",
        "sensor-plugin",
        "simulated-observation",
        "plausibility-residual"
      ],
      visibleRelationIds: [
        "model-feeds-physics",
        "clock-steps-physics",
        "physics-drives-sensor",
        "sensor-emits-observation",
        "observation-compares-bound",
        "residual-invalidates-parameters"
      ],
      controls: [
        [
          "bounded-parameters",
          condition("bounded-physics-parameters"),
          [
            "bounded-physics-parameters",
            "resolved-step-and-rate",
            "declared-sensor-imperfections"
          ],
          [
            "simulation-model",
            "world-contact",
            "physics-solver",
            "simulation-clock",
            "sensor-plugin",
            "simulated-observation",
            "plausibility-residual"
          ],
          [
            "model-feeds-physics",
            "clock-steps-physics",
            "physics-drives-sensor",
            "sensor-emits-observation",
            "observation-compares-bound"
          ],
          ["residual-invalidates-parameters"],
          [],
          [
            [
              "plausible-turn",
              "Bounded Gazebo parameters retain a plausible robot turn.",
              ["world-contact", "simulated-observation", "plausibility-residual"],
              ["observation-compares-bound"]
            ]
          ],
          reasonedCase("bounded-turn-example", "verification")
        ],
        [
          "optimistic-model",
          condition("declared-sensor-imperfections"),
          ["declared-sensor-imperfections"],
          [
            "world-contact",
            "physics-solver",
            "sensor-plugin",
            "simulated-observation",
            "plausibility-residual"
          ],
          [
            "model-feeds-physics",
            "sensor-emits-observation",
            "observation-compares-bound",
            "residual-invalidates-parameters"
          ],
          ["clock-steps-physics"],
          [],
          [
            [
              "invalidated-success",
              "The plausibility residual rejects optimistic Gazebo parameters.",
              ["world-contact", "sensor-plugin", "plausibility-residual"],
              ["residual-invalidates-parameters"]
            ]
          ],
          reasonedCase("perfect-simulation-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L06",
    systemModel:
      "Nav2 converts a navigation goal into bounded velocity commands, ros2_control routes commands through named controller and hardware interfaces, and simulated state returns through sensors, odometry, TF and localisation.",
    failurePattern:
      "An integrated launch can look healthy while interface names, command and state types, frame identities, update rates or simulation-time settings leave the robot control loop open.",
    visualExplanation:
      "A closed-loop chain runs from navigation goal through planning, velocity command, controller manager and simulated hardware, then returns joint state, odometry, TF and localisation evidence.",
    applicationTask:
      "Trace one mobile-base velocity command through Nav2 and ros2_control simulation, verify every interface, frame and timestamp and diagnose an injected state-interface mismatch.",
    terms: [
      [
        "ros2-control-interface",
        "ros2_control hardware interface",
        "A named command or state channel exported by robot hardware or simulation and claimed by a controller.",
        "A loaded controller cannot command a joint whose required interface name or type is absent.",
        "bind-controller-interfaces"
      ],
      [
        "controller-manager",
        "ROS controller manager",
        "The component that configures, activates and updates controllers against available hardware interfaces.",
        "An active controller still requires correctly timed command and state exchange with the plant.",
        "activate-controller-chain"
      ],
      [
        "navigation-stack",
        "Nav2 navigation stack",
        "The integrated localisation, costmap, planning, control and recovery components that convert a goal into mobile motion.",
        "A navigation goal is not evidence of physical or simulated motion unless the command-state loop closes.",
        "trace-navigation-command"
      ]
    ],
    entities: [
      [
        "navigation-goal",
        "input",
        "Framed navigation goal",
        "The target mobile-base pose expressed in a declared map frame and time context."
      ],
      [
        "nav-controller",
        "component",
        "Nav2 planner and controller",
        "The navigation components that use localisation and costmaps to produce a bounded velocity command."
      ],
      [
        "velocity-command",
        "state",
        "Mobile velocity command",
        "The linear and angular command with m/s, rad/s, frame meaning and ROS timestamp."
      ],
      [
        "control-manager",
        "component",
        "ros2_control manager",
        "The configured controller manager and active mobile-base controller."
      ],
      [
        "hardware-interface",
        "mechanism",
        "Simulated hardware interface",
        "The named command and state interfaces exported for robot joints or mobile-base actuators."
      ],
      [
        "simulated-plant",
        "mechanism",
        "Simulated mobile plant",
        "The robot dynamics and sensor response advanced on simulation time."
      ],
      [
        "feedback-state",
        "observation",
        "Joint and odometry feedback",
        "Time-stamped simulated joint state, wheel state and base odometry returned to ROS."
      ],
      [
        "localisation-state",
        "state",
        "TF and localisation state",
        "The estimated base pose and required map, odom and base transforms."
      ],
      [
        "loop-observation",
        "criterion",
        "Integrated loop observation",
        "A correlated trace of goal, command, interface claim, plant motion, feedback and localisation."
      ]
    ],
    relations: [
      [
        "goal-feeds-navigation",
        "routes",
        ["navigation-goal", "localisation-state"],
        ["nav-controller"],
        "the framed goal and localisation state feed Nav2 planning and control",
        "directed",
        "many-to-one"
      ],
      [
        "navigation-emits-command",
        "maps",
        ["nav-controller"],
        ["velocity-command"],
        "the Nav2 controller emits bounded mobile velocity commands",
        "directed",
        "one-to-many"
      ],
      [
        "manager-claims-interface",
        "routes",
        ["control-manager", "velocity-command"],
        ["hardware-interface"],
        "the active controller manager routes velocity commands through claimed hardware interfaces",
        "directed",
        "many-to-one"
      ],
      [
        "interface-drives-plant",
        "causes",
        ["hardware-interface"],
        ["simulated-plant"],
        "the simulated hardware command interface drives mobile plant motion",
        "directed",
        "one-to-one"
      ],
      [
        "plant-emits-feedback",
        "maps",
        ["simulated-plant", "hardware-interface"],
        ["feedback-state"],
        "the simulated plant and state interfaces emit joint and odometry feedback",
        "directed",
        "many-to-one"
      ],
      [
        "feedback-updates-localisation",
        "supports",
        ["feedback-state"],
        ["localisation-state"],
        "time-stamped feedback supports TF and localisation state updates",
        "directed",
        "one-to-one"
      ],
      [
        "loop-records-chain",
        "measures",
        [
          "navigation-goal",
          "velocity-command",
          "control-manager",
          "hardware-interface",
          "simulated-plant",
          "feedback-state",
          "localisation-state"
        ],
        ["loop-observation"],
        "the integrated loop observation records command and feedback propagation end to end",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "matching-interface-contracts",
        "criterion",
        "Controller-required command and state interface names and types exactly match those exported by simulated hardware.",
        ["control-manager", "hardware-interface", "velocity-command", "feedback-state"],
        [
          "manager-claims-interface",
          "interface-drives-plant",
          "plant-emits-feedback"
        ]
      ],
      [
        "shared-integrated-time",
        "boundary",
        "Nav2, controllers, simulated hardware, sensors and localisation use the same declared simulation clock.",
        [
          "nav-controller",
          "velocity-command",
          "simulated-plant",
          "feedback-state",
          "localisation-state"
        ],
        [
          "navigation-emits-command",
          "plant-emits-feedback",
          "feedback-updates-localisation"
        ]
      ],
      [
        "complete-navigation-frames",
        "criterion",
        "Navigation goal, costmaps, odometry and robot state resolve through a connected map-odom-base frame chain.",
        ["navigation-goal", "nav-controller", "feedback-state", "localisation-state"],
        ["goal-feeds-navigation", "feedback-updates-localisation"]
      ],
      [
        "resolved-update-timing",
        "boundary",
        "Controller, physics, feedback and localisation update periods are declared and resolve the commanded robot dynamics.",
        [
          "control-manager",
          "hardware-interface",
          "simulated-plant",
          "feedback-state",
          "localisation-state"
        ],
        [
          "interface-drives-plant",
          "plant-emits-feedback",
          "feedback-updates-localisation",
          "loop-records-chain"
        ]
      ]
    ],
    failureBoundary: [
      "state-interface-name-mismatch",
      "matching-interface-contracts",
      "The mobile controller claims expected wheel command interfaces, but one exported simulated wheel-state interface uses a different joint name.",
      "Velocity commands appear and the controller remains active, but complete wheel feedback and odometry do not update.",
      "Reject a Nav2 diagnosis until required and exported ros2_control interface names and types match exactly.",
      [
        "velocity-command",
        "control-manager",
        "hardware-interface",
        "simulated-plant",
        "feedback-state",
        "localisation-state",
        "loop-observation"
      ],
      [
        "navigation-emits-command",
        "manager-claims-interface",
        "interface-drives-plant",
        "plant-emits-feedback",
        "feedback-updates-localisation",
        "loop-records-chain"
      ]
    ],
    conceptualModel: [
      [
        "trace-navigation-command",
        "Trace the framed navigation goal through Nav2 planning and velocity-command output.",
        ["navigation-goal", "localisation-state", "nav-controller", "velocity-command"],
        ["goal-feeds-navigation", "navigation-emits-command"],
        ["complete-navigation-frames", "shared-integrated-time"]
      ],
      [
        "bind-controller-interfaces",
        "Compare every controller-required command and state interface with the simulated hardware export.",
        ["velocity-command", "control-manager", "hardware-interface"],
        ["manager-claims-interface"],
        ["matching-interface-contracts"]
      ],
      [
        "activate-controller-chain",
        "Activate the configured mobile controller only after its required hardware interfaces are claimed.",
        ["control-manager", "hardware-interface"],
        ["manager-claims-interface", "interface-drives-plant"],
        ["matching-interface-contracts", "resolved-update-timing"]
      ],
      [
        "observe-plant-feedback",
        "Record simulated plant motion and time-stamped wheel, joint and odometry feedback.",
        ["hardware-interface", "simulated-plant", "feedback-state"],
        ["interface-drives-plant", "plant-emits-feedback"],
        ["shared-integrated-time", "resolved-update-timing"]
      ],
      [
        "close-navigation-state",
        "Resolve feedback through map, odom and base transforms into the localisation state consumed by Nav2.",
        ["feedback-state", "localisation-state", "nav-controller"],
        ["feedback-updates-localisation", "goal-feeds-navigation"],
        ["complete-navigation-frames", "shared-integrated-time"]
      ],
      [
        "correlate-loop-trace",
        "Correlate goal, command, interface, plant, feedback and localisation timestamps in one loop observation.",
        [
          "navigation-goal",
          "velocity-command",
          "control-manager",
          "hardware-interface",
          "simulated-plant",
          "feedback-state",
          "localisation-state",
          "loop-observation"
        ],
        ["loop-records-chain"],
        [
          "matching-interface-contracts",
          "shared-integrated-time",
          "resolved-update-timing"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "closed-loop-navigation-example",
        kind: "example",
        scenario:
          "A framed Nav2 goal produces a mobile velocity command that traverses matching ros2_control interfaces and returns simulated wheel, odometry and TF feedback.",
        changedConditionIds: ["resolved-update-timing"],
        givens: [
          [
            "goal-state",
            "Navigation request",
            "target base pose in the map frame",
            "m and rad",
            "navigation-goal"
          ],
          [
            "timing-state",
            "Integrated timing",
            "controller, physics, feedback and localisation periods on simulation time",
            "s",
            "loop-observation"
          ]
        ],
        reasoningSteps: [
          [
            "example-nav",
            "The connected frame chain allows Nav2 to map the goal and localisation into a velocity command.",
            ["navigation-goal", "localisation-state", "nav-controller", "velocity-command"],
            ["goal-feeds-navigation", "navigation-emits-command"],
            ["complete-navigation-frames", "shared-integrated-time"]
          ],
          [
            "example-interface",
            "The active controller claims matching simulated command and state interfaces.",
            ["velocity-command", "control-manager", "hardware-interface"],
            ["manager-claims-interface"],
            ["matching-interface-contracts"]
          ],
          [
            "example-plant",
            "The command drives simulated motion and produces time-stamped wheel and odometry feedback.",
            ["hardware-interface", "simulated-plant", "feedback-state"],
            ["interface-drives-plant", "plant-emits-feedback"],
            ["resolved-update-timing", "shared-integrated-time"]
          ],
          [
            "example-loop",
            "Feedback updates localisation and closes the state used by subsequent navigation control.",
            ["feedback-state", "localisation-state", "nav-controller"],
            ["feedback-updates-localisation", "goal-feeds-navigation"],
            ["complete-navigation-frames"]
          ]
        ],
        outcome:
          "The integrated simulation closes the Nav2 command-state loop through exact interfaces, frames and simulation timing.",
        criterionConditionId: "matching-interface-contracts",
        criterion:
          "Every navigation command must produce correlated plant motion, feedback and localisation through exact named interfaces.",
        verification:
          "Capture goal, velocity command, controller state, claimed interfaces, simulated motion, joint feedback, odometry and TF timestamps."
      },
      {
        id: "mismatched-wheel-state-counterexample",
        kind: "counterexample",
        scenario:
          "The mobile controller is active and receives velocity commands, but a simulated wheel-state interface exports a joint name different from the controller configuration.",
        changedConditionIds: ["matching-interface-contracts"],
        givens: [
          [
            "required-name",
            "Controller interface",
            "configured wheel-state joint identifier",
            null,
            "control-manager"
          ],
          [
            "exported-name",
            "Simulated interface",
            "different wheel-state joint identifier",
            null,
            "hardware-interface"
          ]
        ],
        reasoningSteps: [
          [
            "counter-command",
            "Nav2 still emits a valid mobile velocity command.",
            ["nav-controller", "velocity-command"],
            ["navigation-emits-command"],
            ["shared-integrated-time"]
          ],
          [
            "counter-claim",
            "The controller cannot form the complete required state-interface claim because one joint name differs.",
            ["control-manager", "hardware-interface", "feedback-state"],
            ["manager-claims-interface", "plant-emits-feedback"],
            ["matching-interface-contracts"]
          ],
          [
            "counter-state",
            "Incomplete wheel feedback prevents a coherent odometry and localisation update.",
            ["feedback-state", "localisation-state"],
            ["feedback-updates-localisation"],
            ["complete-navigation-frames"]
          ],
          [
            "counter-trace",
            "The loop observation localises the break between velocity command and complete feedback state.",
            [
              "velocity-command",
              "hardware-interface",
              "feedback-state",
              "loop-observation"
            ],
            ["loop-records-chain"],
            ["resolved-update-timing"]
          ]
        ],
        outcome:
          "A healthy launch and active controller hide an open command-state loop caused by one interface-name mismatch.",
        criterionConditionId: "matching-interface-contracts",
        criterion:
          "Controller requirements and hardware exports must match exactly before navigation integration is considered closed loop.",
        verification:
          "List required and exported interfaces side by side, repair the joint name and confirm correlated feedback, odometry and TF resume."
      }
    ],
    misconception: {
      id: "healthy-launch-proves-integration",
      claim:
        "If Nav2 and ros2_control launch without errors and controllers are active, the robot simulation is integrated.",
      mechanism:
        "Processes can be healthy while interface names, frames, clocks or update periods prevent commands and state from closing the loop.",
      correction:
        "Trace one command and its correlated plant, feedback and localisation response through every named interface.",
      disconfirmingObservation:
        "Velocity commands and an active controller coexist with missing wheel feedback, frozen odometry and no localisation update.",
      entityIds: [
        "navigation-goal",
        "nav-controller",
        "velocity-command",
        "control-manager",
        "hardware-interface",
        "simulated-plant",
        "feedback-state",
        "localisation-state",
        "loop-observation"
      ],
      relationIds: [
        "goal-feeds-navigation",
        "navigation-emits-command",
        "manager-claims-interface",
        "interface-drives-plant",
        "plant-emits-feedback",
        "feedback-updates-localisation",
        "loop-records-chain"
      ],
      conditionIds: [
        "matching-interface-contracts",
        "shared-integrated-time",
        "complete-navigation-frames",
        "resolved-update-timing"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the integrated navigation loop from framed goal to returned localisation:",
            "The Nav2, controller, interface, plant and feedback sequence closes robot state.",
            "The Nav2, controller, interface, plant and feedback sequence stops after the velocity command.",
            [
              "Resolve the navigation frame chain before emitting mobile commands.",
              "Claim hardware interfaces before driving the simulated plant."
            ],
            [
              "Trace the Nav2 command through ros2_control.",
              "Return wheel feedback through odometry and localisation."
            ]
          ],
          focusRef: reasonedCase("closed-loop-navigation-example", "scenario"),
          contextConditionIds: [
            "complete-navigation-frames",
            "matching-interface-contracts",
            "shared-integrated-time",
            "resolved-update-timing"
          ],
          steps: [
            [
              "plan-command",
              ["goal-feeds-navigation", "navigation-emits-command"],
              ["complete-navigation-frames"]
            ],
            [
              "claim-interface",
              ["manager-claims-interface"],
              ["matching-interface-contracts"]
            ],
            [
              "drive-plant",
              ["interface-drives-plant"],
              ["resolved-update-timing"]
            ],
            [
              "return-state",
              ["plant-emits-feedback", "feedback-updates-localisation"],
              ["shared-integrated-time"]
            ]
          ],
          correctOrder: [
            "plan-command",
            "claim-interface",
            "drive-plant",
            "return-state"
          ]
        },
        retry: {
          instruction: [
            "Trace the wheel-interface fault from active controller to frozen localisation:",
            "The interface retry preserves command evidence and isolates the missing state contract.",
            "The interface retry changes the Nav2 goal while the ros2_control joint name remains wrong.",
            [
              "Begin with the emitted mobile velocity command.",
              "Compare controller-required and hardware-exported state interfaces."
            ],
            [
              "Locate the command-state break at the hardware interface.",
              "Repair the joint name and confirm feedback updates localisation."
            ]
          ],
          focusRef: reasonedCase("mismatched-wheel-state-counterexample", "scenario"),
          contextConditionIds: [
            "matching-interface-contracts",
            "complete-navigation-frames"
          ],
          steps: [
            [
              "confirm-command",
              ["navigation-emits-command"],
              ["shared-integrated-time"]
            ],
            [
              "compare-interface",
              ["manager-claims-interface"],
              ["matching-interface-contracts"]
            ],
            [
              "observe-feedback-gap",
              ["plant-emits-feedback"],
              ["matching-interface-contracts"]
            ],
            [
              "confirm-localisation",
              ["feedback-updates-localisation"],
              ["complete-navigation-frames"]
            ]
          ],
          correctOrder: [
            "confirm-command",
            "compare-interface",
            "observe-feedback-gap",
            "confirm-localisation"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required to prove integrated Nav2 and ros2_control simulation:",
            "The selected integration evidence covers frames, exact interfaces, plant feedback and shared time.",
            "The selected integration evidence accepts healthy ROS processes without a closed command-state loop.",
            [
              "Choose the controller-to-hardware interface relation.",
              "Choose plant feedback and localisation-update relations."
            ],
            [
              "Select the connected navigation frame chain.",
              "Select correlated command and feedback timing."
            ]
          ],
          focusRef: term("navigation-stack", "boundary"),
          contextConditionIds: [
            "complete-navigation-frames",
            "matching-interface-contracts",
            "shared-integrated-time",
            "resolved-update-timing"
          ],
          options: [
            [
              "frame-chain",
              true,
              relation("goal-feeds-navigation"),
              condition("complete-navigation-frames"),
              ["goal-feeds-navigation"],
              ["complete-navigation-frames"],
              null
            ],
            [
              "interface-chain",
              true,
              relation("manager-claims-interface"),
              condition("matching-interface-contracts"),
              ["manager-claims-interface"],
              ["matching-interface-contracts"],
              null
            ],
            [
              "feedback-chain",
              true,
              relation("feedback-updates-localisation"),
              condition("shared-integrated-time"),
              ["feedback-updates-localisation"],
              ["shared-integrated-time"],
              null
            ],
            [
              "launch-health",
              false,
              misconception("healthy-launch-proves-integration", "claim"),
              misconception("healthy-launch-proves-integration", "mechanism"),
              ["navigation-emits-command"],
              ["matching-interface-contracts"],
              "healthy-launch-proves-integration"
            ],
            [
              "command-only",
              false,
              reasonedCase("mismatched-wheel-state-counterexample", "outcome"),
              condition("resolved-update-timing"),
              ["navigation-emits-command"],
              ["resolved-update-timing"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the integrated-loop records that isolate the wheel-name mismatch:",
            "The diagnostic records connect valid velocity command, failed interface claim and missing feedback.",
            "The diagnostic records blame Nav2 planning without inspecting ros2_control exports.",
            [
              "Inspect required and exported hardware interface names.",
              "Retain odometry and localisation timestamps after the command."
            ],
            [
              "Mark the interface-claim relation.",
              "Mark the loop observation across command and feedback."
            ]
          ],
          focusRef: reasonedCase("mismatched-wheel-state-counterexample", "verification"),
          contextConditionIds: [
            "matching-interface-contracts",
            "resolved-update-timing"
          ],
          options: [
            [
              "required-exported-names",
              true,
              relation("manager-claims-interface"),
              condition("matching-interface-contracts"),
              ["manager-claims-interface"],
              ["matching-interface-contracts"],
              null
            ],
            [
              "feedback-gap",
              true,
              relation("plant-emits-feedback"),
              condition("resolved-update-timing"),
              ["plant-emits-feedback"],
              ["resolved-update-timing"],
              null
            ],
            [
              "loop-trace",
              true,
              relation("loop-records-chain"),
              reasonedCase("mismatched-wheel-state-counterexample", "verification"),
              ["loop-records-chain"],
              ["resolved-update-timing"],
              null
            ],
            [
              "process-health",
              false,
              misconception("healthy-launch-proves-integration", "claim"),
              misconception("healthy-launch-proves-integration", "mechanism"),
              ["navigation-emits-command"],
              ["matching-interface-contracts"],
              "healthy-launch-proves-integration"
            ],
            [
              "goal-change",
              false,
              reasonedCase("mismatched-wheel-state-counterexample", "outcome"),
              condition("complete-navigation-frames"),
              ["goal-feeds-navigation"],
              ["complete-navigation-frames"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain how to prove a closed Nav2 and ros2_control simulation loop:",
            "The explanation connects framed goal, velocity command, interface claim, plant feedback and localisation.",
            "The explanation cites the ros2_control manager and omits joint and odometry feedback plus localisation state.",
            [
              "Define the ros2_control hardware interface contract.",
              "Trace the Nav2 velocity command into simulated motion."
            ],
            [
              "Explain how feedback updates TF and localisation state.",
              "Use one clocked loop observation across command and state."
            ]
          ],
          focusRef: misconception("healthy-launch-proves-integration", "claim"),
          contextConditionIds: [
            "matching-interface-contracts",
            "complete-navigation-frames",
            "shared-integrated-time"
          ],
          conceptGroups: [
            [
              "interface-definition",
              term("ros2-control-interface", "label"),
              [
                term("ros2-control-interface", "definition"),
                relation("manager-claims-interface")
              ],
              ["manager-claims-interface"],
              ["matching-interface-contracts"]
            ],
            [
              "manager-definition",
              term("controller-manager", "label"),
              [
                term("controller-manager", "definition"),
                relation("interface-drives-plant")
              ],
              ["interface-drives-plant"],
              ["resolved-update-timing"]
            ],
            [
              "navigation-definition",
              term("navigation-stack", "label"),
              [
                term("navigation-stack", "definition"),
                relation("goal-feeds-navigation")
              ],
              ["goal-feeds-navigation"],
              ["complete-navigation-frames"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["feedback-updates-localisation"],
          criterionConditionId: "shared-integrated-time"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each integrated-loop operation to its ROS boundary:",
            "The navigation, interface and feedback operations carry frame, contract and timing boundaries.",
            "An integrated-loop operation is paired with a boundary that cannot expose its open state path.",
            [
              "Pair goal consumption with the complete navigation frame chain.",
              "Pair controller claims with matching hardware interfaces."
            ],
            [
              "Match plant feedback with resolved update timing.",
              "Match localisation update with shared simulation time."
            ]
          ],
          focusRef: reasonedCase("mismatched-wheel-state-counterexample", "criterion"),
          contextConditionIds: [
            "complete-navigation-frames",
            "matching-interface-contracts",
            "shared-integrated-time"
          ],
          pairs: [
            [
              "frame-pair",
              relation("goal-feeds-navigation"),
              condition("complete-navigation-frames"),
              relation("goal-feeds-navigation"),
              ["goal-feeds-navigation"],
              ["complete-navigation-frames"]
            ],
            [
              "interface-pair",
              relation("manager-claims-interface"),
              condition("matching-interface-contracts"),
              relation("manager-claims-interface"),
              ["manager-claims-interface"],
              ["matching-interface-contracts"]
            ],
            [
              "time-pair",
              relation("feedback-updates-localisation"),
              condition("shared-integrated-time"),
              relation("feedback-updates-localisation"),
              ["feedback-updates-localisation"],
              ["shared-integrated-time"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the Nav2-to-plant diagram for the mobile velocity command:",
            "The diagram implication routes navigation output through claimed interfaces into simulated motion.",
            "The diagram implication treats the velocity command as proof of robot motion.",
            [
              "Trace the Nav2 controller into the mobile velocity command.",
              "Follow ros2_control through the simulated hardware interface."
            ],
            [
              "Identify the controller-manager interface claim.",
              "Choose the implication that reaches the simulated mobile plant."
            ]
          ],
          focusRef: reasonedCase("closed-loop-navigation-example", "scenario"),
          contextConditionIds: [
            "matching-interface-contracts",
            "resolved-update-timing"
          ],
          positions: [
            ["nav-controller", 0, 0],
            ["velocity-command", 1, 0],
            ["control-manager", 1, 1],
            ["hardware-interface", 2, 0],
            ["simulated-plant", 3, 0]
          ],
          relationIds: [
            "navigation-emits-command",
            "manager-claims-interface",
            "interface-drives-plant"
          ],
          answerRelationIds: [
            "manager-claims-interface",
            "interface-drives-plant"
          ],
          options: [
            [
              "drive-through-interface",
              true,
              reasonedCase("closed-loop-navigation-example", "verification"),
              condition("matching-interface-contracts"),
              ["manager-claims-interface", "interface-drives-plant"],
              ["matching-interface-contracts", "resolved-update-timing"],
              null
            ],
            [
              "trust-launch",
              false,
              misconception("healthy-launch-proves-integration", "claim"),
              misconception("healthy-launch-proves-integration", "mechanism"),
              ["navigation-emits-command"],
              ["matching-interface-contracts"],
              "healthy-launch-proves-integration"
            ],
            [
              "ignore-interface",
              false,
              reasonedCase("mismatched-wheel-state-counterexample", "outcome"),
              condition("matching-interface-contracts"),
              ["interface-drives-plant"],
              ["matching-interface-contracts"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the command-state diagram under the wheel-name mismatch:",
            "The counterexample implication follows incomplete feedback into frozen localisation and loop evidence.",
            "The counterexample implication changes the Nav2 goal while hardware interfaces remain mismatched.",
            [
              "Start from the simulated hardware and plant.",
              "Trace wheel feedback into TF and localisation state."
            ],
            [
              "Identify the missing feedback path.",
              "Choose the implication that restores exact interface names."
            ]
          ],
          focusRef: reasonedCase("mismatched-wheel-state-counterexample", "scenario"),
          contextConditionIds: [
            "matching-interface-contracts",
            "complete-navigation-frames"
          ],
          positions: [
            ["hardware-interface", 0, 0],
            ["simulated-plant", 1, 0],
            ["feedback-state", 2, 0],
            ["localisation-state", 3, 0]
          ],
          relationIds: [
            "interface-drives-plant",
            "plant-emits-feedback",
            "feedback-updates-localisation"
          ],
          answerRelationIds: [
            "plant-emits-feedback",
            "feedback-updates-localisation"
          ],
          options: [
            [
              "restore-state-loop",
              true,
              reasonedCase("mismatched-wheel-state-counterexample", "verification"),
              condition("matching-interface-contracts"),
              ["plant-emits-feedback", "feedback-updates-localisation"],
              ["matching-interface-contracts", "complete-navigation-frames"],
              null
            ],
            [
              "trust-active-controller",
              false,
              misconception("healthy-launch-proves-integration", "claim"),
              misconception("healthy-launch-proves-integration", "mechanism"),
              ["interface-drives-plant"],
              ["matching-interface-contracts"],
              "healthy-launch-proves-integration"
            ],
            [
              "change-goal",
              false,
              reasonedCase("mismatched-wheel-state-counterexample", "outcome"),
              condition("complete-navigation-frames"),
              ["loop-records-chain"],
              ["complete-navigation-frames"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("ros2-control-interface", "label"),
      focusRef: reasonedCase("closed-loop-navigation-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["navigation-goal", 0, 0],
        ["localisation-state", 0, 1],
        ["nav-controller", 1, 0],
        ["velocity-command", 2, 0],
        ["control-manager", 2, 1],
        ["hardware-interface", 3, 0],
        ["simulated-plant", 4, 0],
        ["feedback-state", 4, 1],
        ["loop-observation", 5, 0]
      ],
      visibleEntityIds: [
        "navigation-goal",
        "localisation-state",
        "nav-controller",
        "velocity-command",
        "control-manager",
        "hardware-interface",
        "simulated-plant",
        "feedback-state",
        "loop-observation"
      ],
      visibleRelationIds: [
        "goal-feeds-navigation",
        "navigation-emits-command",
        "manager-claims-interface",
        "interface-drives-plant",
        "plant-emits-feedback",
        "feedback-updates-localisation",
        "loop-records-chain"
      ],
      controls: [
        [
          "closed-loop",
          condition("matching-interface-contracts"),
          [
            "matching-interface-contracts",
            "complete-navigation-frames",
            "shared-integrated-time",
            "resolved-update-timing"
          ],
          [
            "navigation-goal",
            "localisation-state",
            "nav-controller",
            "velocity-command",
            "control-manager",
            "hardware-interface",
            "simulated-plant",
            "feedback-state",
            "loop-observation"
          ],
          [
            "goal-feeds-navigation",
            "navigation-emits-command",
            "manager-claims-interface",
            "interface-drives-plant",
            "plant-emits-feedback",
            "feedback-updates-localisation",
            "loop-records-chain"
          ],
          [],
          [],
          [
            [
              "integrated-motion",
              "Exact interfaces close the simulated navigation command-state loop.",
              ["velocity-command", "hardware-interface", "feedback-state"],
              ["manager-claims-interface", "plant-emits-feedback"]
            ]
          ],
          reasonedCase("closed-loop-navigation-example", "verification")
        ],
        [
          "mismatched-state",
          condition("resolved-update-timing"),
          ["resolved-update-timing"],
          [
            "velocity-command",
            "control-manager",
            "hardware-interface",
            "simulated-plant",
            "feedback-state",
            "localisation-state",
            "loop-observation"
          ],
          [
            "navigation-emits-command",
            "manager-claims-interface",
            "interface-drives-plant",
            "plant-emits-feedback",
            "loop-records-chain"
          ],
          ["feedback-updates-localisation"],
          [],
          [
            [
              "open-state-loop",
              "The mismatched wheel interface freezes feedback and localisation.",
              ["hardware-interface", "feedback-state", "localisation-state"],
              ["plant-emits-feedback"]
            ]
          ],
          reasonedCase("mismatched-wheel-state-counterexample", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E3-D18-L07",
    systemModel:
      "DDS transports typed ROS 2 samples under endpoint policy contracts, while structured logs, recorded data, automated tests and deployment provenance make distributed faults reproducible.",
    failurePattern:
      "A communication fault can disappear during live inspection when policy profiles, clocks, network state, input data, restart order or deployed artefact identity are not retained.",
    visualExplanation:
      "A deployment topology links DDS participants and network path to policy evidence, structured logs, recorded samples, replay tests, artefact provenance and restart observations.",
    applicationTask:
      "Diagnose a late-joining ROS subscriber that misses state after restart, preserve the DDS and runtime evidence and add a deterministic replay-and-restart test.",
    terms: [
      [
        "dds-policy-contract",
        "DDS endpoint policy contract",
        "The offered and requested reliability, durability, history and resource behaviour governing typed data exchange.",
        "A live connection does not prove that late join, restart or historical-data expectations are satisfied.",
        "capture-dds-topology"
      ],
      [
        "deterministic-reproduction",
        "Deterministic fault reproduction",
        "A bounded procedure that replays retained inputs, configuration and event order to produce the same observable outcome.",
        "A reproduction is only as strong as its recorded clocks, policies, artefacts and external conditions.",
        "construct-replay-test"
      ],
      [
        "deployment-provenance",
        "Deployment provenance",
        "The traceable identity of source revision, build artefact, configuration and runtime environment used by a deployment.",
        "A filename or running process alone does not prove which executable bytes and settings were deployed.",
        "bind-deployment-identity"
      ]
    ],
    entities: [
      [
        "dds-publisher",
        "component",
        "DDS publisher endpoint",
        "The ROS 2 writer with typed data, offered policies and participant identity."
      ],
      [
        "dds-subscriber",
        "component",
        "DDS subscriber endpoint",
        "The ROS 2 reader with requested policies, join time and participant identity."
      ],
      [
        "network-path",
        "mechanism",
        "Distributed network path",
        "The host, interface and transport route carrying discovery and sample traffic."
      ],
      [
        "policy-profile",
        "constraint",
        "Captured DDS policy profile",
        "The exact endpoint policy values and history expectations used by each participant."
      ],
      [
        "runtime-evidence",
        "observation",
        "Structured runtime evidence",
        "Clocked graph, endpoint, log and network observations with stable correlation fields."
      ],
      [
        "recorded-input",
        "input",
        "Recorded ROS input data",
        "Retained typed messages and timestamps needed to reproduce the distributed behaviour."
      ],
      [
        "replay-test",
        "criterion",
        "Automated replay and restart test",
        "A deterministic test that controls inputs, policies, startup order, restart event and expected observations."
      ],
      [
        "deployment-artifact",
        "component",
        "Identified deployment artefact",
        "The hashed executable or package plus configuration and source revision."
      ],
      [
        "restart-observation",
        "observation",
        "Subscriber restart observation",
        "The measured discovery, historical-state and new-sample behaviour after a controlled restart."
      ]
    ],
    relations: [
      [
        "dds-routes-samples",
        "routes",
        ["dds-publisher", "network-path"],
        ["dds-subscriber"],
        "DDS discovery and transport route typed samples from publisher to subscriber",
        "directed",
        "many-to-one"
      ],
      [
        "policy-constrains-exchange",
        "constrains",
        ["policy-profile"],
        ["dds-publisher", "dds-subscriber"],
        "captured offered and requested DDS policies constrain live and historical exchange",
        "directed",
        "one-to-many"
      ],
      [
        "topology-produces-evidence",
        "measures",
        [
          "dds-publisher",
          "dds-subscriber",
          "network-path",
          "policy-profile"
        ],
        ["runtime-evidence"],
        "the distributed topology produces clocked graph, policy, log and network evidence",
        "directed",
        "many-to-one"
      ],
      [
        "recording-feeds-test",
        "routes",
        ["recorded-input", "policy-profile"],
        ["replay-test"],
        "recorded ROS inputs and captured policies feed the automated replay test",
        "directed",
        "many-to-one"
      ],
      [
        "artifact-constrains-test",
        "constrains",
        ["deployment-artifact"],
        ["replay-test"],
        "identified deployment artefact and configuration constrain the tested executable state",
        "directed",
        "one-to-one"
      ],
      [
        "test-causes-restart",
        "causes",
        ["replay-test", "dds-subscriber"],
        ["restart-observation"],
        "the automated test controls subscriber restart and records post-restart behaviour",
        "directed",
        "many-to-one"
      ],
      [
        "restart-compares-evidence",
        "compares",
        ["restart-observation", "runtime-evidence"],
        ["replay-test"],
        "restart observation is compared with retained runtime evidence and expected outcomes",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "captured-policy-values",
        "criterion",
        "Evidence retains exact offered and requested DDS policies for every relevant endpoint.",
        ["dds-publisher", "dds-subscriber", "policy-profile", "runtime-evidence"],
        ["policy-constrains-exchange", "topology-produces-evidence"]
      ],
      [
        "correlated-runtime-clocks",
        "boundary",
        "Graph, log, recorded-message and restart observations carry correlated clock and event-order information.",
        [
          "runtime-evidence",
          "recorded-input",
          "replay-test",
          "restart-observation"
        ],
        [
          "topology-produces-evidence",
          "recording-feeds-test",
          "test-causes-restart",
          "restart-compares-evidence"
        ]
      ],
      [
        "identified-deployment-state",
        "criterion",
        "The replay test records the deployment artefact hash, source revision, configuration and runtime environment.",
        ["deployment-artifact", "replay-test", "runtime-evidence"],
        ["artifact-constrains-test", "restart-compares-evidence"]
      ],
      [
        "controlled-restart-order",
        "boundary",
        "The automated test controls publisher state, subscriber join or restart order and the expected historical-data boundary.",
        [
          "dds-publisher",
          "dds-subscriber",
          "recorded-input",
          "replay-test",
          "restart-observation"
        ],
        [
          "dds-routes-samples",
          "recording-feeds-test",
          "test-causes-restart",
          "restart-compares-evidence"
        ]
      ]
    ],
    failureBoundary: [
      "volatile-state-after-restart",
      "controlled-restart-order",
      "A subscriber restarts after the publisher emitted a robot mode state, but the deployment expects historical replay while the publisher uses volatile durability.",
      "The late-joining subscriber discovers the live publisher yet receives no earlier mode state until a new sample is written.",
      "Reject the deployment expectation or change the policy and state-publication design, then lock the restart behaviour in an automated test.",
      [
        "dds-publisher",
        "dds-subscriber",
        "policy-profile",
        "runtime-evidence",
        "recorded-input",
        "replay-test",
        "deployment-artifact",
        "restart-observation"
      ],
      [
        "dds-routes-samples",
        "policy-constrains-exchange",
        "topology-produces-evidence",
        "recording-feeds-test",
        "artifact-constrains-test",
        "test-causes-restart",
        "restart-compares-evidence"
      ]
    ],
    conceptualModel: [
      [
        "capture-dds-topology",
        "Record publisher, subscriber, participant, network path and exact DDS endpoint policies.",
        [
          "dds-publisher",
          "dds-subscriber",
          "network-path",
          "policy-profile",
          "runtime-evidence"
        ],
        [
          "dds-routes-samples",
          "policy-constrains-exchange",
          "topology-produces-evidence"
        ],
        ["captured-policy-values", "correlated-runtime-clocks"]
      ],
      [
        "retain-runtime-inputs",
        "Record typed ROS inputs, timestamps, structured logs and event order required by the fault.",
        ["recorded-input", "runtime-evidence"],
        ["topology-produces-evidence", "recording-feeds-test"],
        ["correlated-runtime-clocks"]
      ],
      [
        "bind-deployment-identity",
        "Bind source revision, artefact hash, configuration and runtime environment to the reproduction.",
        ["deployment-artifact", "replay-test", "runtime-evidence"],
        ["artifact-constrains-test"],
        ["identified-deployment-state"]
      ],
      [
        "construct-replay-test",
        "Automate recorded inputs, policy profile, startup order and expected distributed observations.",
        [
          "recorded-input",
          "policy-profile",
          "deployment-artifact",
          "replay-test"
        ],
        ["recording-feeds-test", "artifact-constrains-test"],
        [
          "captured-policy-values",
          "identified-deployment-state",
          "controlled-restart-order"
        ]
      ],
      [
        "inject-subscriber-restart",
        "Restart the subscriber at a controlled event and record discovery plus historical and new-sample behaviour.",
        ["dds-subscriber", "replay-test", "restart-observation"],
        ["test-causes-restart"],
        ["controlled-restart-order", "correlated-runtime-clocks"]
      ],
      [
        "promote-regression-evidence",
        "Compare restart observation with expected policy behaviour and retain the deterministic test as a deployment gate.",
        ["restart-observation", "runtime-evidence", "replay-test"],
        ["restart-compares-evidence"],
        [
          "captured-policy-values",
          "identified-deployment-state",
          "controlled-restart-order"
        ]
      ]
    ],
    reasonedCases: [
      {
        id: "restart-regression-example",
        kind: "example",
        scenario:
          "A deployment test records a robot-mode sample, restarts the subscriber in a controlled order and verifies behaviour against captured DDS durability and history policies.",
        changedConditionIds: ["identified-deployment-state"],
        givens: [
          [
            "mode-input",
            "Recorded ROS state",
            "typed robot mode sample with publisher timestamp",
            "s",
            "recorded-input"
          ],
          [
            "restart-event",
            "Controlled event",
            "subscriber process restarts after the state sample",
            "s",
            "restart-observation"
          ]
        ],
        reasoningSteps: [
          [
            "example-capture",
            "Runtime evidence retains both DDS endpoint policy profiles and correlated event times.",
            ["policy-profile", "runtime-evidence", "recorded-input"],
            ["policy-constrains-exchange", "topology-produces-evidence"],
            ["captured-policy-values", "correlated-runtime-clocks"]
          ],
          [
            "example-artifact",
            "The replay test uses the identified deployment artefact and configuration.",
            ["deployment-artifact", "replay-test"],
            ["artifact-constrains-test"],
            ["identified-deployment-state"]
          ],
          [
            "example-restart",
            "The test controls subscriber restart relative to the recorded mode sample.",
            ["recorded-input", "replay-test", "dds-subscriber", "restart-observation"],
            ["recording-feeds-test", "test-causes-restart"],
            ["controlled-restart-order"]
          ],
          [
            "example-assert",
            "Observed historical and new-sample behaviour is compared with the declared DDS durability boundary.",
            ["restart-observation", "runtime-evidence", "replay-test"],
            ["restart-compares-evidence"],
            ["captured-policy-values", "controlled-restart-order"]
          ]
        ],
        outcome:
          "The deployment has a deterministic test for the declared subscriber restart and historical-state contract.",
        criterionConditionId: "controlled-restart-order",
        criterion:
          "A distributed deployment claim must reproduce restart order, policy state and expected post-restart observations.",
        verification:
          "Run the pinned artefact and configuration, replay the recorded input, restart the subscriber and compare observations with the policy-specific oracle."
      },
      {
        id: "ad-hoc-live-counterexample",
        kind: "counterexample",
        scenario:
          "An operator observes live robot-mode delivery, restarts the subscriber later and cannot reproduce the missing historical state because policy and artefact evidence were not captured.",
        changedConditionIds: ["captured-policy-values"],
        givens: [
          [
            "live-success",
            "Initial observation",
            "subscriber receives a mode sample while already running",
            null,
            "runtime-evidence"
          ],
          [
            "uncaptured-state",
            "Missing provenance",
            "durability profile, exact artefact and event order are absent",
            null,
            "policy-profile"
          ]
        ],
        reasoningSteps: [
          [
            "counter-live",
            "Live DDS routing proves only delivery of a new sample to an already joined subscriber.",
            ["dds-publisher", "network-path", "dds-subscriber"],
            ["dds-routes-samples"],
            ["controlled-restart-order"]
          ],
          [
            "counter-policy",
            "Missing durability and history values leave historical-state expectations unresolved.",
            ["policy-profile", "dds-publisher", "dds-subscriber"],
            ["policy-constrains-exchange"],
            ["captured-policy-values"]
          ],
          [
            "counter-provenance",
            "Missing deployment identity prevents confirmation that the same executable and configuration were tested.",
            ["deployment-artifact", "replay-test", "runtime-evidence"],
            ["artifact-constrains-test"],
            ["identified-deployment-state"]
          ],
          [
            "counter-reproduction",
            "Without clocked input and restart order, the missing historical state cannot become a deterministic regression.",
            [
              "recorded-input",
              "restart-observation",
              "runtime-evidence",
              "replay-test"
            ],
            [
              "recording-feeds-test",
              "test-causes-restart",
              "restart-compares-evidence"
            ],
            ["correlated-runtime-clocks", "controlled-restart-order"]
          ]
        ],
        outcome:
          "A one-time live success provides no reproducible evidence for late-join or restart behaviour.",
        criterionConditionId: "captured-policy-values",
        criterion:
          "Distributed debugging requires exact policies, artefact identity, clocked inputs and controlled event order.",
        verification:
          "Capture the missing policy and provenance data, then create a replay test that distinguishes live new-sample delivery from historical replay."
      }
    ],
    misconception: {
      id: "live-graph-proves-deployment",
      claim:
        "A ROS 2 deployment is reliable when graph inspection shows connected endpoints and live samples.",
      mechanism:
        "Live inspection may miss durability, history, restart order, network transitions and which artefact or configuration produced the state.",
      correction:
        "Capture DDS policies, structured runtime evidence, recorded inputs and deployment provenance, then automate restart reproduction.",
      disconfirmingObservation:
        "The live subscriber receives new mode samples but a restarted late joiner receives no earlier state under volatile durability.",
      entityIds: [
        "dds-publisher",
        "dds-subscriber",
        "network-path",
        "policy-profile",
        "runtime-evidence",
        "recorded-input",
        "replay-test",
        "deployment-artifact",
        "restart-observation"
      ],
      relationIds: [
        "dds-routes-samples",
        "policy-constrains-exchange",
        "topology-produces-evidence",
        "recording-feeds-test",
        "artifact-constrains-test",
        "test-causes-restart",
        "restart-compares-evidence"
      ],
      conditionIds: [
        "captured-policy-values",
        "correlated-runtime-clocks",
        "identified-deployment-state",
        "controlled-restart-order"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: [
            "Order the distributed-debugging path from live topology to deployment regression:",
            "The DDS, evidence, recording, provenance and restart sequence creates reproducible fault evidence.",
            "The DDS, evidence, recording, provenance and restart sequence stops after live graph inspection.",
            [
              "Capture DDS policy profiles before replaying recorded ROS inputs.",
              "Bind the deployment artefact before asserting restart behaviour."
            ],
            [
              "Record the distributed topology and correlated clocks.",
              "Automate the subscriber restart and compare its observation."
            ]
          ],
          focusRef: reasonedCase("restart-regression-example", "scenario"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          steps: [
            [
              "capture-topology",
              ["topology-produces-evidence", "policy-constrains-exchange"],
              ["captured-policy-values"]
            ],
            [
              "bind-artifact",
              ["artifact-constrains-test"],
              ["identified-deployment-state"]
            ],
            [
              "feed-recording",
              ["recording-feeds-test"],
              ["correlated-runtime-clocks"]
            ],
            [
              "assert-restart",
              ["test-causes-restart", "restart-compares-evidence"],
              ["controlled-restart-order"]
            ]
          ],
          correctOrder: [
            "capture-topology",
            "bind-artifact",
            "feed-recording",
            "assert-restart"
          ]
        },
        retry: {
          instruction: [
            "Trace the lost restart evidence from live success to a deterministic DDS test:",
            "The debugging retry restores policies, artefact identity, clocked input and event order.",
            "The debugging retry watches the live ROS graph again without controlling subscriber restart.",
            [
              "Begin with missing DDS durability and deployment identity.",
              "Separate live new-sample delivery from historical replay."
            ],
            [
              "Capture policy, artefact and recorded ROS input.",
              "Control subscriber restart and assert the expected observation."
            ]
          ],
          focusRef: reasonedCase("ad-hoc-live-counterexample", "scenario"),
          contextConditionIds: [
            "captured-policy-values",
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          steps: [
            [
              "restore-policy",
              ["policy-constrains-exchange"],
              ["captured-policy-values"]
            ],
            [
              "restore-provenance",
              ["artifact-constrains-test"],
              ["identified-deployment-state"]
            ],
            [
              "restore-order",
              ["test-causes-restart"],
              ["controlled-restart-order"]
            ],
            [
              "compare-result",
              ["restart-compares-evidence"],
              ["correlated-runtime-clocks"]
            ]
          ],
          correctOrder: [
            "restore-policy",
            "restore-provenance",
            "restore-order",
            "compare-result"
          ]
        }
      },
      q3: {
        base: {
          instruction: [
            "Select the evidence required for a reproducible ROS 2 deployment fault:",
            "The selected deployment evidence covers DDS policies, clocked input, artefact identity and restart outcome.",
            "The selected deployment evidence accepts connected live endpoints as the complete distributed test.",
            [
              "Choose the policy-to-endpoint constraint.",
              "Choose recorded input, artefact and controlled restart evidence."
            ],
            [
              "Select exact DDS endpoint policy values.",
              "Select a replay test with correlated restart observations."
            ]
          ],
          focusRef: term("deterministic-reproduction", "definition"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          options: [
            [
              "policy-evidence",
              true,
              relation("policy-constrains-exchange"),
              condition("captured-policy-values"),
              ["policy-constrains-exchange"],
              ["captured-policy-values"],
              null
            ],
            [
              "provenance-evidence",
              true,
              relation("artifact-constrains-test"),
              condition("identified-deployment-state"),
              ["artifact-constrains-test"],
              ["identified-deployment-state"],
              null
            ],
            [
              "restart-evidence",
              true,
              relation("test-causes-restart"),
              condition("controlled-restart-order"),
              ["test-causes-restart"],
              ["controlled-restart-order"],
              null
            ],
            [
              "live-only",
              false,
              misconception("live-graph-proves-deployment", "claim"),
              misconception("live-graph-proves-deployment", "mechanism"),
              ["dds-routes-samples"],
              ["controlled-restart-order"],
              "live-graph-proves-deployment"
            ],
            [
              "log-only",
              false,
              reasonedCase("ad-hoc-live-counterexample", "outcome"),
              condition("correlated-runtime-clocks"),
              ["topology-produces-evidence"],
              ["correlated-runtime-clocks"],
              null
            ]
          ]
        },
        retry: {
          instruction: [
            "Identify the distributed records missing from the ad-hoc restart diagnosis:",
            "The diagnostic records connect DDS durability, deployed artefact, event order and post-restart state.",
            "The diagnostic records repeat live graph inspection without retaining deterministic inputs.",
            [
              "Inspect exact publisher and subscriber policy profiles.",
              "Retain the deployment artefact hash and correlated clocks."
            ],
            [
              "Mark the recorded-input replay relation.",
              "Mark the controlled restart and comparison relations."
            ]
          ],
          focusRef: reasonedCase("ad-hoc-live-counterexample", "verification"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state"
          ],
          options: [
            [
              "captured-policy",
              true,
              relation("policy-constrains-exchange"),
              condition("captured-policy-values"),
              ["policy-constrains-exchange"],
              ["captured-policy-values"],
              null
            ],
            [
              "clocked-recording",
              true,
              relation("recording-feeds-test"),
              condition("correlated-runtime-clocks"),
              ["recording-feeds-test"],
              ["correlated-runtime-clocks"],
              null
            ],
            [
              "identified-artifact",
              true,
              relation("artifact-constrains-test"),
              condition("identified-deployment-state"),
              ["artifact-constrains-test"],
              ["identified-deployment-state"],
              null
            ],
            [
              "connected-graph",
              false,
              misconception("live-graph-proves-deployment", "claim"),
              misconception("live-graph-proves-deployment", "mechanism"),
              ["dds-routes-samples"],
              ["controlled-restart-order"],
              "live-graph-proves-deployment"
            ],
            [
              "uncontrolled-restart",
              false,
              reasonedCase("ad-hoc-live-counterexample", "outcome"),
              condition("controlled-restart-order"),
              ["test-causes-restart"],
              ["controlled-restart-order"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: [
            "Explain how to turn an intermittent DDS restart fault into deployment evidence:",
            "The explanation connects policy profile, recorded input, artefact provenance and controlled restart.",
            "The explanation cites a connected live ROS graph and omits replay or deployment identity.",
            [
              "Define the DDS endpoint policy contract.",
              "Define deterministic reproduction with clocked event order."
            ],
            [
              "Explain how deployment provenance constrains the replay test.",
              "Compare restart observation with retained runtime evidence."
            ]
          ],
          focusRef: misconception("live-graph-proves-deployment", "claim"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          conceptGroups: [
            [
              "policy-definition",
              term("dds-policy-contract", "label"),
              [
                term("dds-policy-contract", "definition"),
                relation("policy-constrains-exchange")
              ],
              ["policy-constrains-exchange"],
              ["captured-policy-values"]
            ],
            [
              "reproduction-definition",
              term("deterministic-reproduction", "label"),
              [
                term("deterministic-reproduction", "definition"),
                relation("recording-feeds-test")
              ],
              ["recording-feeds-test"],
              ["correlated-runtime-clocks"]
            ],
            [
              "provenance-definition",
              term("deployment-provenance", "label"),
              [
                term("deployment-provenance", "definition"),
                relation("artifact-constrains-test")
              ],
              ["artifact-constrains-test"],
              ["identified-deployment-state"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["test-causes-restart"],
          criterionConditionId: "controlled-restart-order"
        },
        retry: {
          kind: "matching",
          instruction: [
            "Match each distributed-debug operation to its evidence boundary:",
            "The policy, recording and artefact operations carry capture, clock and provenance boundaries.",
            "A distributed-debug operation is paired with a boundary that cannot reproduce its deployment state.",
            [
              "Pair endpoint policy comparison with captured values.",
              "Pair recorded-input replay with correlated clocks."
            ],
            [
              "Match artefact pinning to identified deployment state.",
              "Match subscriber restart to controlled event order."
            ]
          ],
          focusRef: reasonedCase("ad-hoc-live-counterexample", "criterion"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state"
          ],
          pairs: [
            [
              "policy-pair",
              relation("policy-constrains-exchange"),
              condition("captured-policy-values"),
              relation("policy-constrains-exchange"),
              ["policy-constrains-exchange"],
              ["captured-policy-values"]
            ],
            [
              "recording-pair",
              relation("recording-feeds-test"),
              condition("correlated-runtime-clocks"),
              relation("recording-feeds-test"),
              ["recording-feeds-test"],
              ["correlated-runtime-clocks"]
            ],
            [
              "artifact-pair",
              relation("artifact-constrains-test"),
              condition("identified-deployment-state"),
              relation("artifact-constrains-test"),
              ["artifact-constrains-test"],
              ["identified-deployment-state"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: [
            "Read the DDS evidence diagram for the controlled subscriber restart:",
            "The diagram implication binds policy and recorded input into an automated replay test.",
            "The diagram implication uses live DDS routing without a retained restart oracle.",
            [
              "Trace the policy profile and ROS recording into the replay test.",
              "Follow the replay test into the restart observation."
            ],
            [
              "Identify the recorded-input relation.",
              "Choose the implication that controls subscriber restart."
            ]
          ],
          focusRef: reasonedCase("restart-regression-example", "scenario"),
          contextConditionIds: [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "controlled-restart-order"
          ],
          positions: [
            ["policy-profile", 0, 0],
            ["recorded-input", 0, 1],
            ["replay-test", 1, 0],
            ["dds-subscriber", 1, 1],
            ["restart-observation", 2, 0]
          ],
          relationIds: [
            "recording-feeds-test",
            "test-causes-restart"
          ],
          answerRelationIds: [
            "recording-feeds-test",
            "test-causes-restart"
          ],
          options: [
            [
              "control-restart",
              true,
              reasonedCase("restart-regression-example", "verification"),
              condition("controlled-restart-order"),
              ["recording-feeds-test", "test-causes-restart"],
              [
                "captured-policy-values",
                "correlated-runtime-clocks",
                "controlled-restart-order"
              ],
              null
            ],
            [
              "trust-live-graph",
              false,
              misconception("live-graph-proves-deployment", "claim"),
              misconception("live-graph-proves-deployment", "mechanism"),
              ["test-causes-restart"],
              ["controlled-restart-order"],
              "live-graph-proves-deployment"
            ],
            [
              "omit-recording",
              false,
              reasonedCase("ad-hoc-live-counterexample", "outcome"),
              condition("correlated-runtime-clocks"),
              ["recording-feeds-test"],
              ["correlated-runtime-clocks"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: [
            "Interpret the deployment diagram when live inspection cannot reproduce the fault:",
            "The counterexample implication binds artefact provenance and runtime evidence to restart comparison.",
            "The counterexample implication repeats live ROS inspection without identified deployment state.",
            [
              "Start with the identified deployment artefact.",
              "Compare the restart observation with structured runtime evidence."
            ],
            [
              "Identify the artefact-to-test constraint.",
              "Choose the implication that retains deployment provenance."
            ]
          ],
          focusRef: reasonedCase("ad-hoc-live-counterexample", "scenario"),
          contextConditionIds: [
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          positions: [
            ["deployment-artifact", 0, 0],
            ["replay-test", 1, 0],
            ["restart-observation", 2, 0],
            ["runtime-evidence", 2, 1],
            ["recorded-input", 1, 1]
          ],
          relationIds: [
            "artifact-constrains-test",
            "restart-compares-evidence"
          ],
          answerRelationIds: [
            "artifact-constrains-test",
            "restart-compares-evidence"
          ],
          options: [
            [
              "bind-deployment",
              true,
              reasonedCase("ad-hoc-live-counterexample", "verification"),
              condition("identified-deployment-state"),
              ["artifact-constrains-test", "restart-compares-evidence"],
              ["identified-deployment-state", "controlled-restart-order"],
              null
            ],
            [
              "trust-connected-graph",
              false,
              misconception("live-graph-proves-deployment", "claim"),
              misconception("live-graph-proves-deployment", "mechanism"),
              ["restart-compares-evidence"],
              ["captured-policy-values"],
              "live-graph-proves-deployment"
            ],
            [
              "ignore-artifact",
              false,
              reasonedCase("ad-hoc-live-counterexample", "outcome"),
              condition("identified-deployment-state"),
              ["recording-feeds-test"],
              ["identified-deployment-state"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("deterministic-reproduction", "label"),
      focusRef: reasonedCase("restart-regression-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["dds-publisher", 0, 0],
        ["network-path", 1, 1],
        ["dds-subscriber", 1, 0],
        ["policy-profile", 0, 1],
        ["runtime-evidence", 2, 1],
        ["recorded-input", 2, 0],
        ["deployment-artifact", 3, 1],
        ["replay-test", 3, 0],
        ["restart-observation", 4, 0]
      ],
      visibleEntityIds: [
        "dds-publisher",
        "network-path",
        "dds-subscriber",
        "policy-profile",
        "runtime-evidence",
        "recorded-input",
        "deployment-artifact",
        "replay-test",
        "restart-observation"
      ],
      visibleRelationIds: [
        "dds-routes-samples",
        "policy-constrains-exchange",
        "topology-produces-evidence",
        "recording-feeds-test",
        "artifact-constrains-test",
        "test-causes-restart",
        "restart-compares-evidence"
      ],
      controls: [
        [
          "controlled-regression",
          condition("controlled-restart-order"),
          [
            "captured-policy-values",
            "correlated-runtime-clocks",
            "identified-deployment-state",
            "controlled-restart-order"
          ],
          [
            "dds-publisher",
            "dds-subscriber",
            "policy-profile",
            "runtime-evidence",
            "recorded-input",
            "deployment-artifact",
            "replay-test",
            "restart-observation"
          ],
          [
            "policy-constrains-exchange",
            "topology-produces-evidence",
            "recording-feeds-test",
            "artifact-constrains-test",
            "test-causes-restart",
            "restart-compares-evidence"
          ],
          [],
          [],
          [
            [
              "reproducible-restart",
              "Captured policy and provenance make DDS restart behaviour reproducible.",
              ["policy-profile", "replay-test", "restart-observation"],
              ["test-causes-restart", "restart-compares-evidence"]
            ]
          ],
          reasonedCase("restart-regression-example", "verification")
        ],
        [
          "ad-hoc-inspection",
          condition("captured-policy-values"),
          ["captured-policy-values"],
          [
            "dds-publisher",
            "network-path",
            "dds-subscriber",
            "runtime-evidence",
            "restart-observation"
          ],
          [
            "dds-routes-samples",
            "topology-produces-evidence",
            "restart-compares-evidence"
          ],
          ["artifact-constrains-test", "recording-feeds-test"],
          [],
          [
            [
              "unreproducible-fault",
              "Live DDS evidence lacks the policy and artefact state needed for replay.",
              ["runtime-evidence", "restart-observation"],
              ["restart-compares-evidence"]
            ]
          ],
          reasonedCase("ad-hoc-live-counterexample", "verification")
        ]
      ]
    }
  }
] satisfies readonly AcademyLessonTeachingProfileV2CompactPlan[];

const lessonIds = [
  "EML-E3-D18-L01",
  "EML-E3-D18-L02",
  "EML-E3-D18-L03",
  "EML-E3-D18-L04",
  "EML-E3-D18-L05",
  "EML-E3-D18-L06",
  "EML-E3-D18-L07"
] as const;

const seedRegistry =
  materialiseAcademyLessonTeachingProfileV2Registry(
    lessonIds,
    compactPlans
  );

export const academyLessonTeachingProfilesV2E3D18 =
  Object.freeze(Object.fromEntries(lessonIds.map((lessonId) => {
    const seed = seedRegistry[lessonId];
    if (!seed) throw new Error(`Missing V2 profile seed ${lessonId}.`);
    return [
      lessonId,
      expandAcademyLessonTeachingProfileV2Seed(seed)
    ];
  }))) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D18;
