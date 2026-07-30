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
  instructionMarker: string;
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
    "lessonId": "EML-E3-D20-L01",
    "instructionMarker": "calibration ledger",
    "systemModel": "Wheel encoders measure incremental rotation and odometry integrates wheel motion into a changing robot pose, so scale, geometry, quantisation and slip errors accumulate rather than disappear.",
    "failurePattern": "A locally smooth odometry trace can drift far from the physical path when wheel radius, track width, timestamp or rolling-contact assumptions are slightly wrong.",
    "visualExplanation": "Left and right encoder ticks become wheel distances and differential-drive pose increments, while a widening ribbon compares integrated odometry with surveyed ground truth.",
    "applicationTask": "Calibrate distance scale and track width from bounded runs, integrate a planar pose and compare straight, turning and slip cases against independent measurements.",
    "terms": [
      [
        "Encoder count",
        "A discrete observation of incremental shaft or wheel rotation.",
        "Counts require a known resolution, direction, gearing and sampling interval before they represent motion."
      ],
      [
        "Odometry",
        "A relative pose estimate obtained by integrating measured motion from a starting pose.",
        "Integration preserves accumulated bias, so odometry is not an absolute position measurement."
      ],
      [
        "Pose drift",
        "The growing disagreement between integrated pose and physical pose over distance or time.",
        "Translational and heading errors couple, and a small heading bias can create large lateral error."
      ]
    ],
    "entities": [
      [
        "input",
        "Timestamped wheel increments",
        "Signed left and right encoder changes with resolution and sample timing."
      ],
      [
        "mechanism",
        "Differential-drive integration",
        "The geometry converting wheel travel into incremental translation and heading."
      ],
      [
        "state",
        "Integrated odometry pose",
        "The running x, y and heading estimate relative to its declared start frame."
      ],
      [
        "observation",
        "Ground-truth path comparison",
        "Surveyed checkpoints or an independent tracker aligned with the odometry trace."
      ],
      [
        "decision",
        "Accepted odometry calibration",
        "Wheel scale and track width retained for the stated surface and operating range."
      ]
    ],
    "relations": [
      [
        "maps",
        "timestamped wheel increments map into differential-drive integration",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "differential-drive integration transforms wheel travel into integrated odometry pose",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "scale geometry and slip cause pose drift in the integrated state",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "ground-truth path comparison supports the accepted odometry calibration",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "surface slip or inconsistent timing invalidates the accepted odometry calibration",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Encoder resolution, gearing, wheel radii, track width, sign, timestamps, pose frame and units are declared."
      ],
      [
        "assumption",
        "Wheels roll without material lateral slip during the calibration manoeuvres."
      ],
      [
        "criterion",
        "Straight-distance, turn-angle and closed-path errors remain within declared tolerances on independent runs."
      ],
      [
        "operating-state",
        "The altered case drives one wheel over a low-friction patch that violates the rolling assumption."
      ]
    ],
    "failure": [
      "Calibration is accepted from one straight run without testing rotation, closure or a changed surface.",
      "Odometry remains smooth through wheel slip but its heading and lateral position diverge from truth.",
      "Reject the calibration until independent straight, turning and closure evidence agree within tolerance."
    ],
    "conceptualSteps": [
      "Convert signed encoder increments into wheel travel using declared resolution, gearing and scale.",
      "Use track geometry to separate incremental translation from heading change.",
      "Integrate each increment in a consistent odometry frame with its actual timestamp.",
      "Compare predicted checkpoints and loop closure with independent ground truth.",
      "Challenge the retained parameters on a turn and changed-traction case before accepting them."
    ],
    "example": {
      "scenario": "A differential-drive robot completes measured straight and rotation trials on a high-grip floor.",
      "givenLabel": "Encoder calibration trials",
      "givenValue": "wheel counts, timestamps, surveyed distance and surveyed heading change",
      "givenUnit": null,
      "reasoning": [
        "Estimate left and right distance scale from repeated straight travel in both directions.",
        "Estimate effective track width from bounded rotations using the calibrated wheel distances.",
        "Integrate a separate closed route and compare endpoint and heading closure with survey evidence."
      ],
      "outcome": "Independent straight, turn and closure residuals satisfy the declared calibration tolerances.",
      "criterion": "One shared parameter set must pass all retained manoeuvres without per-run adjustment.",
      "verification": "Reverse the route and compare signed residuals to separate constant bias from random quantisation."
    },
    "counterexample": {
      "scenario": "The calibrated robot crosses a dusty patch while turning and one wheel slips.",
      "givenLabel": "Changed traction run",
      "givenValue": "continuous encoder counts but reduced wheel-ground traction",
      "givenUnit": null,
      "reasoning": [
        "Encoder rotation continues even though part of the measured wheel travel is not chassis travel.",
        "Integration treats the slipped rotation as real translation and heading change.",
        "The smooth odometry trace therefore disagrees with surveyed checkpoints and closure."
      ],
      "outcome": "The pose estimate exits the physical path and does not return to the known endpoint.",
      "criterion": "Odometry may be used only inside its stated traction assumptions or with an independent correction source.",
      "verification": "Compare encoder-predicted motion with an independent inertial, visual or surveyed observation across the slip interval."
    },
    "misconception": {
      "claim": "High-resolution encoders make odometry accurate over any distance.",
      "mechanism": "Quantisation is reduced while systematic geometry error and slip are ignored.",
      "correction": "Calibrate geometry, state rolling assumptions and measure drift against independent truth.",
      "disconfirmingObservation": "A smooth high-count trace still misses the known endpoint after a slipping turn."
    },
    "assessmentMoves": [
      "sequencing encoder counts into a calibrated pose",
      "recovering from a wheel-slip interval",
      "screening calibration through straight turn and closure trials",
      "diagnosing lateral drift from heading error",
      "explaining relative odometry apart from absolute position",
      "matching geometric parameters to independent measurements",
      "reading wheel increments pose and ground truth together",
      "revealing smooth integration that violates physical traction"
    ],
    "variant": 0
  },
  {
    "lessonId": "EML-E3-D20-L02",
    "instructionMarker": "ambiguity register",
    "systemModel": "Localisation maintains a belief over robot pose by predicting motion from a prior state and comparing expected map or landmark observations with measured sensor evidence.",
    "failurePattern": "Repeated geometry or weak landmark visibility can make several poses equally plausible even when an algorithm reports one precise location.",
    "visualExplanation": "Several pose hypotheses spread under motion, then receive different weights as predicted landmark bearings are compared with one measured observation.",
    "applicationTask": "Construct a landmark-localisation case, expose an ambiguous pose pair and test which additional observation or prior resolves it.",
    "terms": [
      [
        "Localisation",
        "Estimation of robot pose relative to a declared map or reference frame.",
        "The result is a belief conditioned on models and observations, not direct access to true pose."
      ],
      [
        "Motion prediction",
        "The propagation of prior pose belief through a commanded or measured movement model.",
        "Prediction uncertainty normally grows with motion and model mismatch."
      ],
      [
        "Observation likelihood",
        "A measure of how compatible a sensor observation is with what a pose hypothesis predicts.",
        "Likelihood requires a measurement model, uncertainty and valid data association."
      ]
    ],
    "entities": [
      [
        "input",
        "Prior and timed sensor evidence",
        "The previous pose belief, motion increment and frame-labelled observations."
      ],
      [
        "mechanism",
        "Predict-and-correct localisation",
        "The model that propagates hypotheses and reweights them using expected observations."
      ],
      [
        "state",
        "Pose belief",
        "A single or multi-hypothesis distribution over robot location and heading."
      ],
      [
        "observation",
        "Landmark residual pattern",
        "Measured minus predicted range or bearing for associated map features."
      ],
      [
        "decision",
        "Accepted localisation estimate",
        "The pose claim retained with uncertainty and ambiguity evidence."
      ]
    ],
    "relations": [
      [
        "maps",
        "prior and timed sensor evidence maps into predict-and-correct localisation",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "predict-and-correct localisation transforms evidence into a pose belief",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "motion uncertainty and observation geometry cause the shape of the pose belief",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "landmark residual pattern supports the accepted localisation estimate",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "unresolved symmetry or wrong association invalidates the accepted localisation estimate",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Map frame, robot frame, observation frame, timestamps, association rule and uncertainty model are declared."
      ],
      [
        "assumption",
        "Retained landmarks are static, represented in the map and detected with modelled error."
      ],
      [
        "criterion",
        "Residuals, uncertainty and held-out checkpoints support one pose or explicitly retain multiple plausible poses."
      ],
      [
        "operating-state",
        "The altered case places the robot in a symmetric corridor where the observed geometry repeats."
      ]
    ],
    "failure": [
      "The highest-scoring hypothesis is presented as certain without inspecting alternate modes or residual structure.",
      "A symmetric scene supports two distant poses but the estimator collapses prematurely onto one.",
      "Reject a unique pose claim until additional evidence breaks the symmetry or ambiguity is retained."
    ],
    "conceptualSteps": [
      "Declare every reference frame and the prior pose belief before using new evidence.",
      "Propagate the belief through motion while increasing uncertainty according to the motion model.",
      "Predict observations for each plausible pose and compare them with timed measurements.",
      "Update and normalise hypothesis support without discarding plausible alternatives silently.",
      "Validate the pose at independent checkpoints and report residuals, uncertainty and ambiguity."
    ],
    "example": {
      "scenario": "A robot in an asymmetric room observes ranges and bearings to two uniquely identified landmarks.",
      "givenLabel": "Two-landmark update",
      "givenValue": "prior pose region, motion increment and two timed landmark observations",
      "givenUnit": null,
      "reasoning": [
        "Predict the pose region from the prior and uncertain motion increment.",
        "Compute expected landmark observations for candidate poses and compare residuals with sensor uncertainty.",
        "Retain the pose region supported by both landmarks and check it against an unused checkpoint."
      ],
      "outcome": "The posterior pose narrows around one location while preserving a quantified uncertainty region.",
      "criterion": "Both landmark residuals and the held-out checkpoint must agree with the reported uncertainty.",
      "verification": "Remove one landmark and confirm that uncertainty widens in the geometry direction it previously constrained."
    },
    "counterexample": {
      "scenario": "A robot observes one doorway in a corridor containing several identical doorways.",
      "givenLabel": "Repeated-corridor observation",
      "givenValue": "one ambiguous feature and a broad prior",
      "givenUnit": null,
      "reasoning": [
        "The same observation is predicted from several corridor locations.",
        "The measurement likelihood therefore contains multiple comparable modes.",
        "Reporting only the numerically highest mode hides genuine location ambiguity."
      ],
      "outcome": "The robot may plan from the wrong doorway while displaying unjustified confidence.",
      "criterion": "A unique pose is accepted only when available evidence separates it from plausible alternatives.",
      "verification": "Add a second non-repeating feature or travel history and inspect whether the competing hypotheses actually collapse."
    },
    "misconception": {
      "claim": "A map match always tells the robot exactly where it is.",
      "mechanism": "Environmental symmetry, data association and model uncertainty are omitted.",
      "correction": "Represent and test the full pose belief, including competing hypotheses.",
      "disconfirmingObservation": "Identical corridor segments produce nearly identical sensor residuals from different physical locations."
    },
    "assessmentMoves": [
      "sequencing prior motion and observation into a pose belief",
      "recovering from a symmetric-location ambiguity",
      "screening a pose through residuals and uncertainty",
      "diagnosing false confidence from repeated geometry",
      "explaining localisation as evidence-conditioned belief",
      "matching landmark geometry to constrained pose directions",
      "reading hypotheses residuals and checkpoints together",
      "revealing one reported pose where two remain plausible"
    ],
    "variant": 1
  },
  {
    "lessonId": "EML-E3-D20-L03",
    "instructionMarker": "raster witness log",
    "systemModel": "Occupancy mapping updates belief that spatial cells are occupied or free by combining timed range rays, estimated sensor poses and an inverse measurement model.",
    "failurePattern": "Marking every range endpoint as a wall ignores traversed free space, beam width, pose error and dynamic objects, producing inflated or contradictory obstacles.",
    "visualExplanation": "A range beam passes through free cells to an occupied endpoint, while repeated uncertain poses contribute bounded evidence to a probability grid.",
    "applicationTask": "Update a small occupancy grid from several range observations, distinguish free from occupied evidence and test the map's sensitivity to pose uncertainty.",
    "terms": [
      [
        "Occupancy grid",
        "A spatial array whose cells represent belief about whether locations are occupied.",
        "Cell size and probability semantics determine what detail and uncertainty the map can express."
      ],
      [
        "Inverse sensor model",
        "A rule converting a measurement and sensor pose into free and occupied evidence for map cells.",
        "The rule must account for range limits, no-return readings and invalid measurements."
      ],
      [
        "Ray tracing",
        "Following the measured beam through intersected cells from sensor origin toward its endpoint.",
        "Traversed cells and endpoint cells represent different evidence and must not be updated identically."
      ]
    ],
    "entities": [
      [
        "input",
        "Pose-aligned range scan",
        "Range samples paired with sensor pose, beam angle, validity and timestamp."
      ],
      [
        "mechanism",
        "Inverse-model grid update",
        "Ray tracing and bounded evidence accumulation for free and occupied cells."
      ],
      [
        "state",
        "Occupancy belief map",
        "Cell probabilities or log odds after repeated observations."
      ],
      [
        "observation",
        "Map-to-scan consistency",
        "Held-out scans projected through the map to inspect expected free and occupied structure."
      ],
      [
        "decision",
        "Accepted mapping parameters",
        "Resolution, update strengths and filtering retained for the operating environment."
      ]
    ],
    "relations": [
      [
        "maps",
        "the pose-aligned range scan maps into the inverse-model grid update",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the inverse-model grid update transforms beams into occupancy belief",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "pose error beam geometry and dynamics cause map uncertainty and artefacts",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "map-to-scan consistency supports the accepted mapping parameters",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "misaligned poses or dynamic returns invalidate the accepted mapping parameters",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Map frame, sensor frame, pose timestamps, range limits, cell size and probability update rule are declared."
      ],
      [
        "assumption",
        "Most retained obstacles are static during the observation window and pose error remains within the modelled bound."
      ],
      [
        "criterion",
        "Held-out scans align with occupied boundaries while known free corridors remain traversable and uncertainty is visible."
      ],
      [
        "operating-state",
        "The altered case uses delayed poses or repeated returns from a moving person."
      ]
    ],
    "failure": [
      "All finite range endpoints are accumulated as permanent occupied cells without free-space or dynamic-object reasoning.",
      "Moving or pose-shifted returns form thick ghost walls that block known free passages.",
      "Reject the map until timing, inverse-model semantics and held-out scan alignment meet the declared criteria."
    ],
    "conceptualSteps": [
      "Choose map frame, spatial resolution and an explicit representation for unknown, free and occupied belief.",
      "Transform each valid beam origin and direction using the pose at its measurement time.",
      "Apply different bounded evidence to traversed free cells and the supported endpoint region.",
      "Fuse repeated observations while retaining unknown cells and limiting overconfidence.",
      "Project held-out scans into the map and inspect walls, free corridors and dynamic artefacts."
    ],
    "example": {
      "scenario": "A stationary robot observes one wall from several nearby known poses with a planar laser scanner.",
      "givenLabel": "Static-wall scan set",
      "givenValue": "timed poses, beam angles, ranges and sensor limits",
      "givenUnit": null,
      "reasoning": [
        "Transform each beam into the map frame using the matching sensor pose.",
        "Mark traversed cells as free evidence and endpoint neighbourhoods as occupied evidence.",
        "Compare a held-out scan with the resulting wall location and known free approach corridor."
      ],
      "outcome": "Repeated evidence sharpens one wall while preserving the traversed corridor as free.",
      "criterion": "Wall position and free-space continuity agree with held-out data within resolution and pose uncertainty.",
      "verification": "Change cell size and confirm conclusions remain physically consistent rather than depending on one raster alignment."
    },
    "counterexample": {
      "scenario": "Several scans of a walking person are fused as though every endpoint were static.",
      "givenLabel": "Dynamic-return sequence",
      "givenValue": "moving obstacle returns mixed with static walls",
      "givenUnit": null,
      "reasoning": [
        "The altered case violates the assumption that retained endpoints describe stationary structure.",
        "Each person position deposits occupied evidence at a different map cell.",
        "Accumulation creates a false band of persistent obstacles across free floor."
      ],
      "outcome": "The map blocks a corridor that is physically clear after the person leaves.",
      "criterion": "Dynamic or inconsistent evidence must be filtered, decayed or represented separately before static-map acceptance.",
      "verification": "Compare scans across time and test whether disputed cells remain supported after the moving object departs."
    },
    "misconception": {
      "claim": "A range reading means the endpoint cell is a wall.",
      "mechanism": "Measurement validity, free-space traversal, pose uncertainty and object dynamics are discarded.",
      "correction": "Use a declared inverse sensor model and validate map predictions on held-out scans.",
      "disconfirmingObservation": "A moving person creates many endpoint cells even though none is a permanent wall."
    },
    "assessmentMoves": [
      "sequencing timed rays into occupancy belief",
      "recovering from dynamic ghost obstacles",
      "screening a map through held-out scans",
      "diagnosing thick walls from pose timing",
      "explaining free and occupied evidence separately",
      "matching inverse-model updates to beam geometry",
      "reading scan pose grid and residual together",
      "revealing a permanent map claim from transient returns"
    ],
    "variant": 2
  },
  {
    "lessonId": "EML-E3-D20-L04",
    "instructionMarker": "closure provenance audit",
    "systemModel": "Simultaneous localisation and mapping jointly estimates robot trajectory and map, with a front end proposing observation constraints and a back end reconciling the resulting graph.",
    "failurePattern": "A false loop closure can deform the entire map, while a missed closure leaves global drift even when local scan alignment looks excellent.",
    "visualExplanation": "A pose graph grows through odometry and scan edges, then a candidate loop edge changes the optimised trajectory and map only after independent validation.",
    "applicationTask": "Inspect a small pose graph, compare trajectories before and after loop closure and decide whether one candidate closure has sufficient geometric evidence.",
    "terms": [
      [
        "SLAM front end",
        "The processing that extracts motion and observation constraints from sensor data.",
        "Proposed constraints contain uncertainty and may include outliers."
      ],
      [
        "Pose graph",
        "A graph whose nodes represent poses and whose edges represent uncertain relative-pose constraints.",
        "Graph consistency depends on edge direction, covariance and data association."
      ],
      [
        "Loop closure",
        "Recognition that the robot has returned to a previously mapped place, adding a long-range constraint.",
        "A closure is high leverage and must be validated before it redistributes global error."
      ]
    ],
    "entities": [
      [
        "input",
        "Timed motion and scan stream",
        "Odometry and environmental observations with frames, timestamps and uncertainty."
      ],
      [
        "mechanism",
        "Front-end and graph optimisation",
        "Constraint proposal, association and back-end estimation of trajectory and map."
      ],
      [
        "state",
        "Joint trajectory-map estimate",
        "Robot poses and mapped structure after reconciling all retained constraints."
      ],
      [
        "observation",
        "Constraint and residual audit",
        "Loop evidence, graph residuals and map alignment before and after optimisation."
      ],
      [
        "decision",
        "Accepted SLAM result",
        "The trajectory and map retained with justified constraints and failure evidence."
      ]
    ],
    "relations": [
      [
        "maps",
        "the timed motion and scan stream maps into front-end and graph optimisation",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "front-end and graph optimisation transforms constraints into a joint trajectory-map estimate",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "constraint quality and loop closures cause global estimate changes",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "constraint and residual audit supports the accepted SLAM result",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "a false high-leverage closure invalidates the accepted SLAM result",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Sensor frames, timestamps, constraint direction, covariance, association thresholds and optimisation settings are declared."
      ],
      [
        "assumption",
        "The retained observations provide sufficient static geometric overlap for the proposed constraints."
      ],
      [
        "criterion",
        "Independent loop evidence, bounded residuals and map consistency improve without creating new geometric contradictions."
      ],
      [
        "operating-state",
        "The altered case proposes a loop between two visually or geometrically similar but different places."
      ]
    ],
    "failure": [
      "A loop candidate is accepted solely because its matcher score exceeds one threshold.",
      "The optimiser satisfies the false edge by bending many otherwise consistent poses and map features.",
      "Reject the closure until independent geometry, residual change and map topology all support it."
    ],
    "conceptualSteps": [
      "Form local motion and observation constraints with explicit frames, timestamps and uncertainty.",
      "Add pose nodes and directed constraint edges while preserving their provenance.",
      "Optimise the graph and inspect residuals rather than treating a finite solution as proof.",
      "Validate loop candidates with independent geometric evidence before high-leverage acceptance.",
      "Compare trajectory, residuals and map topology before and after each retained closure."
    ],
    "example": {
      "scenario": "A robot returns to a distinctive corner observed from a compatible viewpoint after completing a large loop.",
      "givenLabel": "Validated loop candidate",
      "givenValue": "scan overlap, relative-pose estimate, covariance and pre-closure graph",
      "givenUnit": null,
      "reasoning": [
        "Confirm that place identity and scan geometry support the proposed relative pose independently of appearance score.",
        "Add the loop edge with justified uncertainty and optimise the complete graph.",
        "Check that distributed residuals fall and the map aligns without new wall duplication or topology conflict."
      ],
      "outcome": "The global trajectory closes while local geometry and constraint residuals remain consistent.",
      "criterion": "The closure must improve global consistency without creating unsupported deformation elsewhere.",
      "verification": "Remove the candidate edge and compare graph residual, endpoint drift and map topology with the retained case."
    },
    "counterexample": {
      "scenario": "Two different warehouse aisles contain nearly identical shelving and generate a high matcher score.",
      "givenLabel": "Perceptual-alias closure",
      "givenValue": "similar local scans from physically separate aisles",
      "givenUnit": null,
      "reasoning": [
        "The altered association confuses repeated geometry with a previously visited place.",
        "Its proposed relative pose contradicts motion history and other map structure.",
        "Optimisation spreads the contradiction across the graph instead of proving the closure."
      ],
      "outcome": "Separate aisles collapse together and the map becomes topologically false.",
      "criterion": "High matcher score is insufficient when independent motion and geometric evidence disagree.",
      "verification": "Inspect edge residual leverage, neighbouring constraints and an independent place cue before accepting the loop."
    },
    "misconception": {
      "claim": "Graph optimisation corrects bad SLAM measurements.",
      "mechanism": "Optimisation is treated as a truth detector rather than a method that best satisfies supplied constraints.",
      "correction": "Validate constraint provenance and outliers before interpreting the optimised result.",
      "disconfirmingObservation": "One false loop edge yields a numerically converged but physically folded map."
    },
    "assessmentMoves": [
      "sequencing sensor constraints into a pose graph",
      "recovering from a false loop closure",
      "screening closure evidence before optimisation",
      "diagnosing map deformation from edge leverage",
      "explaining front end apart from back end",
      "matching graph residuals to constraint provenance",
      "reading trajectory edges and map topology together",
      "revealing convergence without geometric truth"
    ],
    "variant": 3
  },
  {
    "lessonId": "EML-E3-D20-L05",
    "instructionMarker": "frontier budget review",
    "systemModel": "Graph and grid planners search connected collision-free states using accumulated path cost and heuristic estimates shaped by map resolution, robot footprint and obstacle inflation.",
    "failurePattern": "A mathematically shortest route can be physically unsafe or computationally wasteful when the costmap, footprint, clearance cost or heuristic assumptions are wrong.",
    "visualExplanation": "A cost grid displays lethal obstacles, inflated clearance bands, explored nodes, heuristic direction and the selected path beside a shorter low-clearance alternative.",
    "applicationTask": "Trace a planner on two costmap resolutions, compare search effort, path cost and clearance and explain why the selected route changes.",
    "terms": [
      [
        "Configuration space",
        "The set of robot states represented for planning, with obstacles expanded according to robot geometry.",
        "A point path in workspace is unsafe if robot footprint and orientation are omitted."
      ],
      [
        "Costmap",
        "A spatial representation assigning traversal cost or invalid status to planning states.",
        "Resolution, inflation and unknown-space policy materially change the search problem."
      ],
      [
        "Heuristic",
        "An estimate of remaining cost used to direct informed search toward the goal.",
        "For optimal-search claims it must not overestimate true remaining cost under the planner model."
      ]
    ],
    "entities": [
      [
        "input",
        "Start goal and planning map",
        "Frame-labelled endpoints, robot footprint and current cost representation."
      ],
      [
        "mechanism",
        "Graph or grid search",
        "The algorithm expanding connected states using path and heuristic costs."
      ],
      [
        "state",
        "Search frontier and path cost",
        "Open, visited and predecessor state needed to reconstruct candidate routes."
      ],
      [
        "observation",
        "Clearance and search audit",
        "Path validity, accumulated cost, explored states and minimum physical clearance."
      ],
      [
        "decision",
        "Accepted global path",
        "The route retained when reachability, cost, clearance and computation criteria pass."
      ]
    ],
    "relations": [
      [
        "maps",
        "start goal and planning map map into graph or grid search",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "graph or grid search transforms connected states into a candidate path",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "resolution footprint inflation and heuristic cause search and clearance behaviour",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "clearance and search audit supports the accepted global path",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "footprint collision or stale cost invalidates the accepted global path",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Map frame, state connectivity, robot footprint, resolution, inflation, unknown policy and cost function are declared."
      ],
      [
        "assumption",
        "The global costmap represents static traversability well enough for the planning horizon."
      ],
      [
        "criterion",
        "The path is connected, collision-free for the complete footprint, sufficiently clear and computed within budget."
      ],
      [
        "operating-state",
        "The altered case plans for a point robot or uses a corridor narrower than the physical footprint."
      ]
    ],
    "failure": [
      "A path is accepted because grid cells are free along its centreline.",
      "The robot footprint intersects an obstacle or inflated hazard while the centre point remains in free cells.",
      "Reject the path until footprint collision, clearance, connectivity and current-map checks all pass."
    ],
    "conceptualSteps": [
      "Express start, goal, map and robot footprint in one planning frame.",
      "Construct connected planning states and costs, including forbidden and uncertain regions.",
      "Expand states using accumulated cost and a heuristic whose guarantees are understood.",
      "Reconstruct the path and check the full footprint and clearance along every segment.",
      "Compare resolution and inflation alternatives before accepting cost and computation trade-offs."
    ],
    "example": {
      "scenario": "A mobile robot chooses between a short narrow passage and a longer corridor with greater clearance.",
      "givenLabel": "Two-route costmap",
      "givenValue": "start, goal, footprint, obstacle cells and inflation costs",
      "givenUnit": null,
      "reasoning": [
        "Inflate obstacles using the physical footprint and declared clearance margin.",
        "Trace accumulated and heuristic costs as the search expands both route alternatives.",
        "Recheck the reconstructed route at footprint resolution and report cost, clearance and explored states."
      ],
      "outcome": "The planner selects the lowest accepted cost route that preserves the required clearance.",
      "criterion": "Path validity, minimum clearance and computation budget must pass under the same costmap configuration.",
      "verification": "Change inflation radius within a justified range and explain the route transition from the cost structure."
    },
    "counterexample": {
      "scenario": "A point-robot plan sends a wide rectangular base through a diagonally touching grid gap.",
      "givenLabel": "Centreline-only path",
      "givenValue": "free centre cells with insufficient footprint clearance",
      "givenUnit": null,
      "reasoning": [
        "The altered state model represents only robot centre and ignores body extent.",
        "Grid connectivity therefore permits a diagonal transition the physical footprint cannot occupy.",
        "Continuous footprint checking detects collision along the reconstructed segment."
      ],
      "outcome": "The planned centreline is free while the robot corner intersects the obstacle.",
      "criterion": "Planning validity belongs to the complete configured footprint, not only occupied centre cells.",
      "verification": "Sweep the oriented footprint along each segment and compare with the point-model result."
    },
    "misconception": {
      "claim": "The shortest collision-free grid path is the safest route.",
      "mechanism": "Discrete centreline distance is confused with physical clearance, dynamics and model validity.",
      "correction": "Include footprint and clearance cost, then verify the continuous reconstructed route.",
      "disconfirmingObservation": "A slightly longer path preserves margin while the shortest centreline clips an obstacle with the robot corner."
    },
    "assessmentMoves": [
      "sequencing costmap search into a verified path",
      "recovering from a point-robot collision",
      "screening paths through footprint clearance",
      "diagnosing unsafe routing from grid assumptions",
      "explaining path cost apart from physical safety",
      "matching heuristic and inflation to planner claims",
      "reading frontier cost path and clearance together",
      "revealing a free centreline with colliding geometry"
    ],
    "variant": 4
  },
  {
    "lessonId": "EML-E3-D20-L06",
    "instructionMarker": "curvature timing audit",
    "systemModel": "Trajectory generation adds time, velocity and acceleration to a geometric path, while motion control selects commands that track the timed reference within robot and actuator constraints.",
    "failurePattern": "A collision-free path can demand impossible curvature, acceleration or stopping distance and cause saturation, oscillation or deviation during tracking.",
    "visualExplanation": "A geometric path becomes a timed pose and velocity profile, then overlays commanded and measured motion through its tightest curve and stopping segment.",
    "applicationTask": "Time-parameterise a short mobile-robot path, enforce speed and acceleration limits and evaluate controller tracking error through the highest-curvature segment.",
    "terms": [
      [
        "Timed trajectory",
        "A sequence or function specifying desired robot state and derivatives over time.",
        "Timing creates velocity and acceleration demands absent from a geometric path."
      ],
      [
        "Curvature",
        "The rate at which path heading changes with distance travelled.",
        "Robot steering limits may make a geometrically clear path untrackable."
      ],
      [
        "Tracking controller",
        "A feedback rule converting reference and measured state into bounded motion commands.",
        "Its behaviour depends on delay, localisation quality, actuator limits and reference feasibility."
      ]
    ],
    "entities": [
      [
        "input",
        "Geometric path and limits",
        "The spatial route plus speed, acceleration, curvature and stopping constraints."
      ],
      [
        "mechanism",
        "Trajectory and tracking pipeline",
        "Time scaling and feedback control that convert path into executable commands."
      ],
      [
        "state",
        "Timed motion reference",
        "Desired pose, velocity and acceleration along the route."
      ],
      [
        "observation",
        "Commanded-measured tracking trace",
        "Aligned reference, estimated pose, velocity, actuator command and error."
      ],
      [
        "decision",
        "Accepted motion execution",
        "The trajectory-controller pair retained when tracking and limits pass."
      ]
    ],
    "relations": [
      [
        "maps",
        "the geometric path and limits map into the trajectory and tracking pipeline",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the trajectory and tracking pipeline transforms a path into a timed motion reference",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "curvature timing and delay cause tracking and command demand",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "the commanded-measured tracking trace supports the accepted motion execution",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "saturation or clearance loss invalidates the accepted motion execution",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Path frame, robot kinematics, speed, acceleration, curvature, command and stopping limits are declared."
      ],
      [
        "assumption",
        "Localisation latency and actuator response remain within the controller's tested operating range."
      ],
      [
        "criterion",
        "Tracking, command, acceleration, stopping and clearance measures all remain within bounds."
      ],
      [
        "operating-state",
        "The altered case shortens time through a tight turn until required curvature rate or deceleration exceeds capability."
      ]
    ],
    "failure": [
      "A route is passed to control at fixed high speed because its map geometry is collision-free.",
      "The controller saturates through the tight turn and the physical robot cuts outside the clearance corridor.",
      "Reject execution until timing, kinematics, command limits, tracking and clearance agree."
    ],
    "conceptualSteps": [
      "Annotate the geometric path with curvature, clearance and required stopping locations.",
      "Choose a timing law that respects speed and acceleration constraints along the entire path.",
      "Generate pose and velocity references using the robot's kinematic convention and frames.",
      "Track the reference in bounded simulation or low-speed trials with aligned command and pose evidence.",
      "Reshape timing or geometry and rerun the same criteria wherever saturation or error first appears."
    ],
    "example": {
      "scenario": "A differential-drive robot follows a corridor path containing one tight turn and a final stop.",
      "givenLabel": "Bounded corridor trajectory",
      "givenValue": "path curvature, clearance, speed limits and aligned tracking log",
      "givenUnit": null,
      "reasoning": [
        "Reduce reference speed where curvature and stopping-distance constraints are most restrictive.",
        "Generate timed pose and velocity references consistent with differential-drive kinematics.",
        "Compare commanded and measured motion through the turn and stop while checking clearance."
      ],
      "outcome": "The robot completes the path with bounded error, command and clearance margin.",
      "criterion": "Peak cross-track error, command saturation, stopping error and minimum clearance must all pass.",
      "verification": "Repeat with a permitted initial-pose offset and confirm recovery without weakening the same limits."
    },
    "counterexample": {
      "scenario": "The same path is executed at uniform speed chosen from its straight segments.",
      "givenLabel": "Untimed curvature case",
      "givenValue": "collision-free geometry with excessive turn speed",
      "givenUnit": null,
      "reasoning": [
        "The altered timing ignores higher angular-rate and lateral-error demand at the tight turn.",
        "Controller output reaches its bound before the reference curvature is achieved.",
        "Measured motion cuts the corner and violates the clearance criterion."
      ],
      "outcome": "The robot remains near the path centre on straights but leaves the safe corridor in the turn.",
      "criterion": "Trajectory feasibility must hold at the most restrictive curvature and stopping segment.",
      "verification": "Overlay reference curvature, speed, angular command, saturation and cross-track error around the first deviation."
    },
    "misconception": {
      "claim": "A collision-free path can be tracked if the controller gain is high enough.",
      "mechanism": "Reference feasibility and actuator limits are replaced by an unlimited-feedback assumption.",
      "correction": "Time-parameterise the path within kinematic and actuator capability before controller tuning.",
      "disconfirmingObservation": "Higher gain increases saturation while the robot still cannot produce the demanded turn rate."
    },
    "assessmentMoves": [
      "sequencing path timing and control into motion",
      "recovering from a saturated tight turn",
      "screening trajectory through tracking and clearance",
      "diagnosing corner cutting from command limits",
      "explaining geometric path apart from timed trajectory",
      "matching curvature segments to speed constraints",
      "reading reference command pose and error together",
      "revealing collision-free geometry with infeasible timing"
    ],
    "variant": 5
  },
  {
    "lessonId": "EML-E3-D20-L07",
    "instructionMarker": "mission trial census",
    "systemModel": "A Nav2 mission integrates localisation, layered costmaps, global planning, local control and recovery through a behaviour tree that repeatedly evaluates progress and safety.",
    "failurePattern": "One successful goal can conceal brittle recovery, stale maps or intermittent localisation loss that appears only across repeated and altered trials.",
    "visualExplanation": "A mission timeline aligns behaviour-tree states, localisation quality, costmap changes, planned path, controller commands, recovery actions and final outcome.",
    "applicationTask": "Run or specify repeated Nav2 goals with one injected obstacle or localisation fault and reconcile success rate, time, path error and recovery evidence.",
    "terms": [
      [
        "Behaviour tree",
        "A structured control flow that selects navigation actions, conditions and recovery branches.",
        "Tree success does not by itself prove safe or repeatable physical navigation."
      ],
      [
        "Recovery behaviour",
        "A bounded action intended to restore progress after planning, control or localisation failure.",
        "Recovery requires entry, exit, retry and safe-stop limits."
      ],
      [
        "Mission benchmark",
        "A repeated test protocol with declared environments, faults, metrics and retained outcomes.",
        "A benchmark must count failed, recovered and unsafe trials rather than only successful runs."
      ]
    ],
    "entities": [
      [
        "input",
        "Goal and live navigation state",
        "The goal pose, localisation belief, current costmaps and robot status."
      ],
      [
        "mechanism",
        "Nav2 behaviour pipeline",
        "Behaviour tree, planners, controllers, progress checks and recoveries."
      ],
      [
        "state",
        "Mission execution state",
        "The active node, path, controller status, retry count and safety condition."
      ],
      [
        "observation",
        "Aligned mission evidence",
        "Timed state transitions, pose quality, map changes, commands, recovery and outcome."
      ],
      [
        "decision",
        "Accepted navigation capability",
        "The bounded claim retained after repeated normal and fault trials."
      ]
    ],
    "relations": [
      [
        "maps",
        "the goal and live navigation state map into the Nav2 behaviour pipeline",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the Nav2 behaviour pipeline transforms navigation state into mission execution state",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "localisation costmap planning and recovery cause mission progress or failure",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "aligned mission evidence supports the accepted navigation capability",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "an unsafe recovery or hidden failed trial invalidates the accepted navigation capability",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Map, robot footprint, frames, goal tolerance, progress timeout, retry limit, recovery and stop behaviour are declared."
      ],
      [
        "assumption",
        "Sensors, localisation and costmap updates satisfy their tested timing and quality bounds."
      ],
      [
        "criterion",
        "All retained trials report outcome, time, path, recovery and safety metrics against fixed thresholds."
      ],
      [
        "operating-state",
        "The altered case introduces an unexpected obstacle or temporary localisation degradation."
      ]
    ],
    "failure": [
      "A navigation capability is claimed from the best unaltered demonstration run.",
      "Changed conditions trigger repeated planning and recovery without progress while unsuccessful trials are omitted.",
      "Reject the claim until repeated trials, failure accounting, bounded recovery and safe-stop evidence are complete."
    ],
    "conceptualSteps": [
      "Declare mission start, goals, environment variants, injected faults, metrics and safe-stop rules.",
      "Align localisation, costmaps, paths, controller outputs and behaviour-tree events on one timeline.",
      "Run repeated baseline goals and retain every success, failure, timeout and recovery outcome.",
      "Inject one bounded obstacle or localisation fault and inspect the first causal state change.",
      "Report capability only for conditions whose repeatability, recovery and safety criteria pass."
    ],
    "example": {
      "scenario": "A mobile robot repeats a delivery route while one trial introduces a temporary obstacle in the local path.",
      "givenLabel": "Repeated navigation benchmark",
      "givenValue": "baseline and altered trials with complete Nav2 event logs",
      "givenUnit": null,
      "reasoning": [
        "Verify common start, goal, map and fixed metric definitions across all trials.",
        "Trace replanning and controller state when the temporary obstacle enters the costmap.",
        "Reconcile successes, recoveries, timeouts, clearance and final-pose error without excluding failed runs."
      ],
      "outcome": "The robot reaches the goal repeatedly and handles the bounded obstacle within recovery and safety limits.",
      "criterion": "Success, time, final pose, clearance, retry and safe-stop criteria must all pass across the declared trial set.",
      "verification": "Repeat the altered trial with controlled obstacle timing and confirm the same recovery path and bounded outcome."
    },
    "counterexample": {
      "scenario": "Localisation jumps during a narrow passage and the behaviour tree repeatedly clears costmaps and retries.",
      "givenLabel": "Unbounded recovery loop",
      "givenValue": "pose jump, repeated recovery events and no forward progress",
      "givenUnit": null,
      "reasoning": [
        "The altered pose corrupts map alignment and makes otherwise clear space appear inconsistent.",
        "Repeated clearing does not restore pose quality but consumes retries without progress.",
        "Without a retry limit and localisation guard, the mission cannot meet recovery or safety criteria."
      ],
      "outcome": "The robot oscillates between planning and recovery until an external stop.",
      "criterion": "Recovery must diagnose or bound the failing condition and enter a safe stop when progress cannot be restored.",
      "verification": "Inspect pose quality before each recovery, progress distance, retry count and the transition to the declared stop state."
    },
    "misconception": {
      "claim": "Reaching the Nav2 goal once proves autonomous navigation works.",
      "mechanism": "Repeatability, altered conditions, hidden retries and unsafe near-misses are omitted from the claim.",
      "correction": "Benchmark repeated missions with complete outcome and recovery evidence.",
      "disconfirmingObservation": "One clean run succeeds while later trials loop in recovery or lose localisation under a small change."
    },
    "assessmentMoves": [
      "sequencing mission state through navigation evidence",
      "recovering from an unbounded recovery loop",
      "screening capability through complete trial accounting",
      "diagnosing failure from the first event change",
      "explaining goal success apart from repeatable autonomy",
      "matching behaviour states to recovery limits",
      "reading pose costmap path recovery and outcome together",
      "revealing one success that hides repeated failures"
    ],
    "variant": 6
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
  const moveSeed = source.assessmentMoves[slot];
  if (moveSeed === undefined) {
    throw new Error(`Missing D20 instruction move ${slot}.`);
  }
  const move = `${moveSeed} in the ${source.instructionMarker}`;
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
    throw new Error(`Missing D20 instruction plan ${slot}.`);
  }
  return [plan[0], plan[1], plan[2], [plan[3], plan[4]], [plan[5], plan[6]]];
};

type SelectionPlans =
  AcademyLessonTeachingProfileV2CompactPlan["assessmentPlans"]["q3"];
type SelectionOptions = SelectionPlans["base"]["options"];
type ExplanationPlans =
  AcademyLessonTeachingProfileV2CompactPlan["assessmentPlans"]["q4"];

const selectionPlans = (
  source: LessonSource
): SelectionPlans => {
  const plans = (
    baseConditions: readonly string[],
    baseOptions: SelectionOptions,
    retryConditions: readonly string[],
    retryOptions: SelectionOptions
  ): SelectionPlans => ({
    base: {
      instruction: instructionPlan(source, 2),
      focusRef: term("t1", "definition"),
      contextConditionIds: baseConditions,
      options: baseOptions
    },
    retry: {
      instruction: instructionPlan(source, 3),
      focusRef: reasonedCase("counter", "scenario"),
      contextConditionIds: retryConditions,
      options: retryOptions
    }
  });

  switch (source.variant) {
    case 0:
      return plans(
        ["c1", "c2", "c3"],
        [
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c2", "c3"],
        [
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-criterion", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
        ]
      );
    case 1:
      return plans(
        ["c1", "c2", "c4"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c1", "c3"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
    case 2:
      return plans(
        ["c1", "c3", "c2"],
        [
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r1", false, relation("r1"), condition("c4"), ["r1"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c2", "c4", "c3"],
        [
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-term", false, term("t3", "definition"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
    case 3:
      return plans(
        ["c2", "c3", "c4"],
        [
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-worked", false, reasonedCase("worked", "outcome"), condition("c1"), ["r1"], ["c1"], null]
        ],
        ["c4", "c3", "c2", "c1"],
        [
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r4", "r5"], ["c3", "c4"], null]
        ]
      );
    case 4:
      return plans(
        ["c1", "c4", "c3"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-term", false, term("t2", "boundary"), condition("c2"), ["r2"], ["c2"], null]
        ],
        ["c2", "c3", "c4"],
        [
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ]
      );
    case 5:
      return plans(
        ["c1", "c2", "c3", "c4"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c1"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-criterion", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
        ]
      );
    case 6:
      return plans(
        ["c3", "c2", "c1"],
        [
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c3", "c2"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
  }
};

const explanationPlans = (
  source: LessonSource
): ExplanationPlans => {
  switch (source.variant) {
    case 0:
      return {
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
      };
    case 1:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: ["c1", "c2", "c4"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r2"), condition("c2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", relation("r5"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c2", "c3", "c4"],
          conceptGroups: [
            ["definition", term("t2", "label"), [term("t2", "definition")], ["r2"], ["c2"]],
            ["evidence", reasonedCase("worked", "verification"), [reasonedCase("worked", "outcome")], ["r4"], ["c3"]],
            ["failure", reasonedCase("counter", "outcome"), [reasonedCase("counter", "criterion")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r2", "r4"],
          criterionConditionId: "c3"
        }
      };
    case 2:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: term("t1", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          conceptGroups: [
            ["boundary", condition("c1"), [term("t1", "boundary")], ["r1"], ["c1"]],
            ["transform", term("t2", "label"), [relation("r2")], ["r2"], ["c2"]],
            ["mechanism", term("t3", "label"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", condition("c3"), [reasonedCase("worked", "verification")], ["r4"], ["c3"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r2", "r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c1", "c3", "c4"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r3"), condition("c2"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", relation("r4"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-4", relation("r5"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
    case 3:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          pairs: [
            ["pair-1", term("t1", "label"), relation("r1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", term("t2", "label"), relation("r2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", term("t3", "label"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-4", condition("c3"), relation("r4"), relation("r4"), ["r4"], ["c3"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c4", "c2", "c3"],
          conceptGroups: [
            ["trigger", condition("c4"), [reasonedCase("counter", "scenario")], ["r5"], ["c4"]],
            ["mechanism", relation("r3"), [term("t2", "definition")], ["r2", "r3"], ["c2"]],
            ["evidence", reasonedCase("counter", "verification"), [condition("c3")], ["r4", "r5"], ["c3", "c4"]],
            ["correction", term("t1", "boundary"), [reasonedCase("counter", "verification")], ["r1"], ["c1"]]
          ],
          minimumConceptGroups: 4,
          requiredRelationIds: ["r3", "r5"],
          criterionConditionId: "c3"
        }
      };
    case 4:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c1", "c3", "c4"],
          conceptGroups: [
            ["input", relation("r1"), [condition("c1")], ["r1"], ["c1"]],
            ["decision", relation("r4"), [condition("c3")], ["r4"], ["c3"]],
            ["invalidator", relation("r5"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r1", "r4", "r5"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c2", "c3", "c4"],
          pairs: [
            ["pair-1", term("t2", "label"), relation("r2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-2", term("t3", "label"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", reasonedCase("worked", "verification"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-4", reasonedCase("counter", "outcome"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
    case 5:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: term("t2", "boundary"),
          contextConditionIds: ["c1", "c2", "c3"],
          pairs: [
            ["pair-1", condition("c1"), relation("r1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", condition("c2"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", condition("c3"), relation("r4"), relation("r4"), ["r4"], ["c3"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          conceptGroups: [
            ["boundary", term("t1", "boundary"), [condition("c1")], ["r1"], ["c1"]],
            ["model", term("t2", "definition"), [relation("r2")], ["r2"], ["c2"]],
            ["effect", term("t3", "definition"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", reasonedCase("worked", "verification"), [condition("c3")], ["r4"], ["c3"]],
            ["failure", reasonedCase("counter", "outcome"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 4,
          requiredRelationIds: ["r2", "r3", "r5"],
          criterionConditionId: "c3"
        }
      };
    case 6:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          conceptGroups: [
            ["source", term("t1", "definition"), [condition("c1")], ["r1"], ["c1"]],
            ["pipeline", term("t2", "definition"), [relation("r2")], ["r2"], ["c2"]],
            ["change", relation("r3"), [condition("c2")], ["r3"], ["c2"]],
            ["evidence", relation("r4"), [condition("c3")], ["r4"], ["c3"]],
            ["stop", relation("r5"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 5,
          requiredRelationIds: ["r1", "r3", "r4", "r5"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3", "c2", "c1"],
          pairs: [
            ["pair-1", term("t1", "label"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", term("t2", "label"), condition("c2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", term("t3", "label"), term("t3", "boundary"), relation("r3"), ["r3"], ["c2"]],
            ["pair-4", reasonedCase("worked", "verification"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-5", reasonedCase("counter", "outcome"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
  }
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
        throw new Error(`Missing D20 relation endpoints ${index}.`);
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
        throw new Error(`Missing D20 condition binding ${index}.`);
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
      q3: selectionPlans(source),
      q4: explanationPlans(source),
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

export const academyLessonTeachingProfileV2PlansE3D20 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE3D20 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE3D20,
    academyLessonTeachingProfileV2PlansE3D20
  );

export const academyLessonTeachingProfilesV2E3D20 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE3D20.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D20 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D20;
