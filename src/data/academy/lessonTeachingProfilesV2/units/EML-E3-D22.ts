import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDomainCardinality,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
  type AcademyDomainRelationKind,
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

type TermSource = readonly [
  label: string,
  definition: string,
  boundary: string
];

type EntitySource = readonly [
  type: AcademyDomainEntityTuple[1],
  label: string,
  definition: string
];

type RelationSource = readonly [
  kind: AcademyDomainRelationKind,
  predicate: string,
  direction: AcademyDomainRelationTuple[5],
  cardinality: AcademyDomainCardinality
];

type ConditionSource = readonly [
  type: AcademyDomainConditionTuple[1],
  statement: string
];

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
  cue: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly [TermSource, TermSource, TermSource];
  entities: readonly [
    EntitySource,
    EntitySource,
    EntitySource,
    EntitySource,
    EntitySource
  ];
  relations: readonly [
    RelationSource,
    RelationSource,
    RelationSource,
    RelationSource,
    RelationSource
  ];
  conditions: readonly [
    ConditionSource,
    ConditionSource,
    ConditionSource,
    ConditionSource
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
  variant: number;
}>;

const lessonSources = [
  {
    lessonId: "EML-E3-D22-L01",
    cue: "provenance audit",
    systemModel:
      "Data preparation turns recorded observations into an analysis table by preserving provenance, units, labels, missingness and exclusions before exploratory summaries expose distributions and defects.",
    failurePattern:
      "Rows are cleaned or removed without a recorded rule, so the prepared table no longer represents a traceable sample of the measured process.",
    visualExplanation:
      "A provenance flow links raw sensor records to typed fields, declared cleaning decisions, exploratory summaries and an analysis-ready dataset.",
    applicationTask:
      "Prepare a small motor-temperature dataset, quantify missingness and justify every exclusion before proposing a model.",
    terms: [
      [
        "Data provenance",
        "The traceable origin, collection context and transformation history of each observation.",
        "A filename alone is not provenance when sensor, time, units or transformation history are unknown."
      ],
      [
        "Missing value",
        "A field whose required observation is absent rather than measured as zero.",
        "Missingness can be informative and must not be silently converted to a plausible numeric value."
      ],
      [
        "Exploratory analysis",
        "Pre-model inspection of counts, distributions, relationships and suspect records.",
        "Exploration can reveal problems but does not by itself establish a generalisable predictive result."
      ]
    ],
    entities: [
      ["input", "Raw sensor records", "Timestamped motor temperatures with source, unit and operating-mode fields."],
      ["constraint", "Preparation rules", "Declared type, missing-value, duplicate and exclusion rules applied consistently."],
      ["mechanism", "Exploratory summaries", "Counts, missingness proportions, ranges and plots used to inspect the prepared values."],
      ["observation", "Data-quality findings", "Observed missing fields, impossible values, imbalance and distribution changes."],
      ["decision", "Analysis-ready dataset", "The retained records plus a reproducible preparation and exclusion account."]
    ],
    relations: [
      ["maps", "raw sensor records map into fields with declared provenance and units", "directed", "one-to-many"],
      ["constrains", "preparation rules constrain which transformations and exclusions are permitted", "directed", "one-to-many"],
      ["measures", "exploratory summaries measure the prepared records for visible defects", "directed", "many-to-many"],
      ["supports", "data-quality findings support a bounded analysis-ready dataset decision", "directed", "many-to-one"],
      ["invalidates", "unrecorded cleaning invalidates the analysis-ready dataset claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The source, timestamp meaning, units and label definitions are known for every field used."],
      ["operating-state", "Preparation rules are fixed before outcome comparisons and are applied to every relevant split."],
      ["criterion", "Every retained or excluded row can be reproduced from raw records using the declared rules."],
      ["boundary", "Unknown provenance, silent imputation or outcome-guided cleaning blocks analysis-ready acceptance."]
    ],
    failure: [
      "Outcome-guided cleaning or undocumented imputation changes the sample after results are inspected.",
      "The reported distribution and later model score cannot be reproduced from the raw records.",
      "Reject the prepared dataset until provenance, missingness and exclusions are explicit and repeatable."
    ],
    conceptualSteps: [
      "Identify each raw field, its source, unit, timestamp and intended engineering meaning.",
      "Declare type, missing-value, duplicate and exclusion rules before looking at target performance.",
      "Apply the preparation rules and preserve a row-level transformation record.",
      "Explore counts, missingness, ranges and distributions to locate defects or imbalance.",
      "Accept the dataset only when the retained sample and every exclusion are reproducible."
    ],
    example: {
      scenario:
        "A table contains 100 motor-temperature records, of which 8 lack a temperature value and are marked missing.",
      givenLabel: "Record and missing counts",
      givenValue: "100 total, 8 missing",
      givenUnit: "records",
      reasoning: [
        "Missing temperature is distinct from a measured temperature of 0 degrees Celsius.",
        "The missing proportion is 8 divided by 100, which is exactly 0.08 or 8%.",
        "The cause and operating modes of the 8 missing records must be inspected before choosing exclusion or imputation."
      ],
      outcome:
        "The table has 92 observed temperatures and 8% missing temperature values; no remedy is justified by that count alone.",
      criterion:
        "Retain a preparation decision only when it states the missingness rule, engineering rationale and affected records.",
      verification:
        "Recompute the total, missing count and 8% proportion from the raw missing-value markers."
    },
    counterexample: {
      scenario:
        "Eight missing temperatures are replaced with zero because zero is accepted by the numeric column type.",
      givenLabel: "Silent replacement",
      givenValue: "8 missing values changed to 0",
      givenUnit: "records",
      reasoning: [
        "A missing observation contains no measured temperature.",
        "Zero degrees Celsius is a physical temperature and changes the distribution.",
        "The replacement hides missingness and creates measurements that the sensor never reported."
      ],
      outcome:
        "Type-valid zeroes create a false low-temperature cluster and destroy the missingness evidence.",
      criterion:
        "A replacement must preserve a missingness indicator and have a justified, split-safe estimation rule.",
      verification:
        "Compare raw missing markers, transformed values and the temperature histogram before and after replacement."
    },
    misconception: {
      claim: "Data preparation is complete once every column is numeric and every cell is filled.",
      mechanism:
        "Syntactic completeness is mistaken for valid provenance, units, sampling and transformation semantics.",
      correction:
        "Treat preparation as a documented measurement transformation whose exclusions and missingness decisions remain inspectable.",
      disconfirmingObservation:
        "A fully numeric table contains invented zero temperatures and cannot reproduce its rows from the source log."
    },
    assessmentMoves: [
      "sequencing the provenance audit from raw fields to acceptance",
      "reconstructing the preparation after a silent replacement",
      "screening data-readiness claims against missingness evidence",
      "tracing the false zero cluster back to its transformation",
      "explaining why numeric completeness does not establish data validity",
      "matching preparation rules to their observable findings",
      "reading the data-provenance graph across the cleaning boundary",
      "replaying the preparation with missingness preserved"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E3-D22-L02",
    cue: "residual trace",
    systemModel:
      "Regression learns a relation for a continuous target, while signed residuals, absolute error and residual structure reveal what a single fitted line or average score conceals.",
    failurePattern:
      "A low average residual is reported as low error even though positive and negative residuals cancel and systematic structure remains.",
    visualExplanation:
      "A residual plot links input values to predictions, observed targets, signed vertical differences and an acceptance review across the operating range.",
    applicationTask:
      "Fit or inspect a transparent temperature regression and decide whether residual magnitude and pattern support its intended use.",
    terms: [
      [
        "Regression",
        "A supervised model that predicts a continuous numeric target from declared input features.",
        "A fitted relation is bounded by its data range, assumptions and validation evidence."
      ],
      [
        "Residual",
        "The signed difference between an observed target and its prediction under a declared sign convention.",
        "Residuals of opposite sign can cancel, so a near-zero mean residual is not a near-zero error magnitude."
      ],
      [
        "Baseline model",
        "A simple reference prediction used to test whether a more complex model adds useful performance.",
        "Beating a weak or mismatched baseline does not establish deployment fitness."
      ]
    ],
    entities: [
      ["input", "Regression records", "Feature values and continuous observed targets with a declared split."],
      ["mechanism", "Fitted regression relation", "The learned mapping from features to predicted continuous targets."],
      ["observation", "Signed residuals", "Observed target minus prediction for each held-out record."],
      ["constraint", "Residual diagnostics", "Magnitude, pattern, variance and outlier checks across the operating range."],
      ["decision", "Bounded regression claim", "A prediction claim retained only where held-out residual evidence meets its criterion."]
    ],
    relations: [
      ["transforms", "the fitted regression relation transforms feature values into continuous predictions", "directed", "many-to-one"],
      ["depends-on", "signed residuals depend on observed targets, predictions and the stated sign convention", "directed", "many-to-many"],
      ["measures", "residual diagnostics measure magnitude and structure in the signed residuals", "directed", "many-to-one"],
      ["compares", "held-out residual diagnostics compare the fitted relation with the baseline model", "directed", "many-to-one"],
      ["invalidates", "cancellation or structured residuals invalidate an average-residual accuracy claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Target meaning, feature units, residual sign and train-test boundary are declared."],
      ["operating-state", "Residual diagnostics use records not fitted by the evaluated model."],
      ["criterion", "Held-out residual magnitude and structure meet the use-specific tolerance and improve on the baseline."],
      ["boundary", "Cancellation, extrapolation or systematic residual pattern blocks the bounded regression claim."]
    ],
    failure: [
      "The mean signed residual is used as the only error measure.",
      "Equal positive and negative errors cancel even while individual predictions remain materially wrong.",
      "Reject the accuracy claim until held-out magnitude and residual-pattern checks satisfy the stated use."
    ],
    conceptualSteps: [
      "Declare the continuous target, feature meanings, units and evaluation split.",
      "Fit or apply the regression relation only within its stated modelling path.",
      "Compute every residual as observed target minus prediction using one sign convention.",
      "Inspect residual magnitude and structure, then compare them with a transparent baseline.",
      "Retain a regression claim only for the validated range and criterion."
    ],
    example: {
      scenario:
        "Two held-out observations are 2.0 and 3.0, while their predictions are 1.5 and 3.5.",
      givenLabel: "Observed and predicted targets",
      givenValue: "(2.0, 1.5) and (3.0, 3.5)",
      givenUnit: null,
      reasoning: [
        "Using observed minus predicted, the residuals are +0.5 and -0.5.",
        "Their mean signed residual is 0.0 because the signs cancel.",
        "Their mean absolute error is (0.5 + 0.5) divided by 2, which is 0.5."
      ],
      outcome:
        "Zero mean signed residual coexists with a mean absolute error of 0.5.",
      criterion:
        "Judge regression error with magnitude and pattern evidence, not cancellation-prone signed mean alone.",
      verification:
        "Recompute both signed residuals, their sum and the mean of their absolute values."
    },
    counterexample: {
      scenario:
        "A report declares perfect prediction because the two signed residuals average to zero.",
      givenLabel: "Misused summary",
      givenValue: "mean signed residual = 0.0",
      givenUnit: null,
      reasoning: [
        "The summary retains sign and therefore permits cancellation.",
        "Each prediction is still 0.5 away from its observation.",
        "The perfect-prediction claim conflicts with the non-zero absolute errors."
      ],
      outcome:
        "A cancellation-prone statistic hides the observed prediction error.",
      criterion:
        "An accuracy claim must report a suitable magnitude metric and inspect residual structure.",
      verification:
        "Plot or list the individual residuals and compare signed mean with mean absolute error."
    },
    misconception: {
      claim: "A regression is accurate when its mean residual is close to zero.",
      mechanism:
        "Residual sign cancellation is confused with small residual magnitude and random residual structure.",
      correction:
        "Inspect held-out residual magnitudes, patterns and baseline comparison under a declared sign convention.",
      disconfirmingObservation:
        "Residuals of +0.5 and -0.5 have zero mean while both predictions miss their targets."
    },
    assessmentMoves: [
      "ordering the residual trace from observation to bounded claim",
      "repairing the trace after cancellation hides error",
      "selecting regression claims supported by held-out diagnostics",
      "locating the statistic that conceals residual magnitude",
      "explaining residual sign, magnitude and structure together",
      "pairing diagnostic checks with regression evidence",
      "mapping predictions through residuals to the baseline comparison",
      "re-evaluating the fit with absolute error exposed"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E3-D22-L03",
    cue: "threshold sweep",
    systemModel:
      "Classification produces labels or scores, and an explicit decision threshold turns scores into actions whose false-positive and false-negative costs must be evaluated.",
    failurePattern:
      "A classifier is described by accuracy alone while threshold, class balance and the unequal consequences of error types remain hidden.",
    visualExplanation:
      "A threshold sweep connects class scores to predicted actions, confusion-matrix counts, precision, recall and an engineering decision boundary.",
    applicationTask:
      "Evaluate a fault classifier at a declared threshold and choose metrics that reflect the consequences of missed and false alarms.",
    terms: [
      [
        "Classification score",
        "A model output used to rank or estimate membership in a category.",
        "A score is not an action until calibration assumptions and a threshold are stated."
      ],
      [
        "Decision threshold",
        "The score boundary that converts a classification score into a predicted category or action.",
        "Changing the threshold changes the balance of false positives and false negatives."
      ],
      [
        "Confusion matrix",
        "Counts of true positives, false positives, true negatives and false negatives for a declared positive class.",
        "The counts are interpretable only with the class definition, threshold and evaluation population."
      ]
    ],
    entities: [
      ["input", "Held-out class records", "Records with ground-truth fault labels and classifier scores."],
      ["constraint", "Declared decision threshold", "The fixed score boundary used to predict the positive class."],
      ["mechanism", "Predicted fault actions", "Positive or negative decisions produced from scores and threshold."],
      ["observation", "Confusion-matrix evidence", "True and false positive and negative counts plus derived metrics."],
      ["decision", "Cost-aware classifier claim", "A retained threshold and performance claim tied to operational error costs."]
    ],
    relations: [
      ["routes", "the declared decision threshold routes classification scores into predicted fault actions", "directed", "many-to-one"],
      ["compares", "predicted fault actions compare with ground-truth labels in held-out records", "directed", "many-to-many"],
      ["measures", "confusion-matrix evidence measures both correct and incorrect classification outcomes", "directed", "many-to-one"],
      ["supports", "error counts and operational costs support a cost-aware classifier claim", "directed", "many-to-one"],
      ["invalidates", "an unstated threshold or class imbalance invalidates an accuracy-only deployment claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "The positive class, score direction, threshold and ground-truth process are declared."],
      ["operating-state", "The threshold is fixed before evaluating the held-out records."],
      ["criterion", "Selected precision, recall and error-cost bounds meet the operational decision need."],
      ["boundary", "Threshold tuning on the test set or an accuracy-only summary blocks deployment acceptance."]
    ],
    failure: [
      "The threshold is tuned on test outcomes and only overall accuracy is reported.",
      "Reported performance is optimistic and conceals the fault types that matter operationally.",
      "Reject the classifier claim until threshold, held-out boundary and error-specific metrics are fixed."
    ],
    conceptualSteps: [
      "Declare the positive class, classifier score meaning and operational error costs.",
      "Fix a decision threshold without using the final test outcomes.",
      "Convert held-out scores into predicted categories at that threshold.",
      "Count the confusion matrix and compute metrics that reflect the stated costs.",
      "Retain the threshold only when its held-out error profile meets the operational criterion."
    ],
    example: {
      scenario:
        "At threshold 0.60, four held-out records yield two true positives, one false positive and one true negative.",
      givenLabel: "Confusion counts",
      givenValue: "TP=2, FP=1, TN=1, FN=0",
      givenUnit: "records",
      reasoning: [
        "Precision is true positives divided by all predicted positives: 2 divided by 3.",
        "Recall is true positives divided by all actual positives: 2 divided by 2.",
        "The resulting precision is about 0.667 and recall is exactly 1.0 for this four-record sample."
      ],
      outcome:
        "The threshold catches both positives but one of its three alarms is false.",
      criterion:
        "Accept the threshold only if both the missed-fault and false-alarm consequences are tolerable for the intended action.",
      verification:
        "Reconstruct the four confusion counts, then independently recompute precision and recall from their denominators."
    },
    counterexample: {
      scenario:
        "The same four records are summarised only as 75% accurate, with no positive-class or threshold statement.",
      givenLabel: "Accuracy-only result",
      givenValue: "3 correct of 4",
      givenUnit: "records",
      reasoning: [
        "Accuracy combines positive and negative outcomes into one count.",
        "It does not identify whether the single error was a missed fault or a false alarm.",
        "Without threshold and class meaning, the operational consequence cannot be evaluated."
      ],
      outcome:
        "The 75% figure is numerically correct but insufficient for the fault decision.",
      criterion:
        "Report threshold, class definition and error-specific counts or metrics alongside any accuracy value.",
      verification:
        "Enumerate the possible confusion matrices with three correct records and compare their different consequences."
    },
    misconception: {
      claim: "The classifier with the highest accuracy is automatically the safest threshold choice.",
      mechanism:
        "Class balance and unequal false-positive and false-negative costs are collapsed into one proportion.",
      correction:
        "Choose a threshold using held-out confusion evidence and explicit operational costs.",
      disconfirmingObservation:
        "Two thresholds share the same accuracy while one misses a hazardous fault and the other only raises an extra alarm."
    },
    assessmentMoves: [
      "sequencing the threshold sweep from scores to error costs",
      "rebuilding the sweep after test-set tuning",
      "screening classifier statements with confusion evidence",
      "isolating the hidden threshold in an accuracy-only claim",
      "explaining how threshold movement changes error types",
      "matching confusion counts to decision consequences",
      "following held-out scores through the threshold graph",
      "rechecking the threshold with class costs declared"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E3-D22-L04",
    cue: "cluster stability review",
    systemModel:
      "Clustering groups unlabelled observations according to a representation and similarity rule, so scaling, distance, cluster count and stability determine whether a group has engineering meaning.",
    failurePattern:
      "A visually tidy cluster assignment is treated as a discovered physical class without testing scale sensitivity, stability or external engineering evidence.",
    visualExplanation:
      "A cluster review maps scaled feature vectors through a distance rule into candidate groups, then compares assignments across perturbations before interpretation.",
    applicationTask:
      "Cluster unlabelled sensor operating points and test whether the groups remain stable enough to justify an engineering interpretation.",
    terms: [
      [
        "Clustering",
        "An unsupervised process that groups observations using similarity in a declared feature representation.",
        "A cluster is a mathematical grouping, not automatically a causal or physical category."
      ],
      [
        "Feature scaling",
        "A transformation that places feature magnitudes on a chosen comparable basis before distance is computed.",
        "Scaling changes geometric influence and must preserve the intended engineering meaning."
      ],
      [
        "Cluster stability",
        "The extent to which group assignments persist under reasonable resampling, initialisation or parameter changes.",
        "Stable assignments still require external evidence before receiving a physical label."
      ]
    ],
    entities: [
      ["input", "Unlabelled sensor vectors", "Operating observations represented by declared numeric features."],
      ["constraint", "Scaling and distance rule", "The feature transformation and similarity measure governing geometry."],
      ["mechanism", "Candidate cluster assignment", "Group membership produced for a chosen algorithm and cluster count."],
      ["observation", "Stability evidence", "Assignment changes across resampling, initialisation and parameter variations."],
      ["decision", "Bounded cluster interpretation", "An engineering interpretation limited by stability and external evidence."]
    ],
    relations: [
      ["transforms", "feature scaling transforms unlabelled sensor vectors before distance is evaluated", "directed", "many-to-many"],
      ["constrains", "the scaling and distance rule constrains candidate cluster geometry", "directed", "many-to-many"],
      ["causes", "the selected geometry and cluster count cause a candidate assignment", "directed", "many-to-one"],
      ["compares", "stability evidence compares assignments across reasonable perturbations", "directed", "many-to-many"],
      ["invalidates", "unstable grouping or unsupported labels invalidate a bounded cluster interpretation", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Feature meanings, units, scaling, distance and intended use are declared."],
      ["operating-state", "Cluster count and algorithm settings are evaluated across more than one initialisation or sample."],
      ["criterion", "Assignments are sufficiently stable and align with independent engineering evidence for the stated use."],
      ["boundary", "Scale-dominated, unstable or post-hoc labelled groups block a physical-category claim."]
    ],
    failure: [
      "One visually pleasing run is labelled as a set of real operating modes.",
      "Assignments change under scaling or initialisation and have no independent physical support.",
      "Reject the physical interpretation while retaining the grouping only as an exploratory candidate."
    ],
    conceptualSteps: [
      "Declare the unlabelled observations, feature meanings, units and engineering question.",
      "Choose and justify scaling and a distance or similarity rule.",
      "Generate candidate assignments for explicit algorithm settings and cluster count.",
      "Compare assignments across resampling, initialisation and reasonable parameter changes.",
      "Attach an engineering interpretation only when stability and independent evidence support it."
    ],
    example: {
      scenario:
        "Four temperature observations, 20, 21, 80 and 81 degrees Celsius, are grouped into two clusters using one-dimensional Euclidean distance.",
      givenLabel: "Temperature observations",
      givenValue: "20, 21, 80, 81",
      givenUnit: "degrees Celsius",
      reasoning: [
        "The within-pair gaps are 1 degree Celsius, while the middle gap is 59 degrees Celsius.",
        "A two-group assignment of {20, 21} and {80, 81} has centres 20.5 and 80.5 degrees Celsius.",
        "The numerical separation supports a candidate grouping but not yet a causal operating-mode label."
      ],
      outcome:
        "Two compact temperature groups are evident under this one-feature distance rule.",
      criterion:
        "Interpret the groups physically only after checking stability and independent operating-mode evidence.",
      verification:
        "Recompute both means and compare the assignment after small perturbations or resampling."
    },
    counterexample: {
      scenario:
        "The two temperature groups are immediately named healthy and failing without maintenance or operating-mode evidence.",
      givenLabel: "Unsupported labels",
      givenValue: "healthy, failing",
      givenUnit: null,
      reasoning: [
        "The clustering used only temperature distance.",
        "High temperature may reflect load, environment or a fault.",
        "The physical labels add causal meaning that the unlabelled grouping did not estimate."
      ],
      outcome:
        "A mathematically separated group is over-interpreted as a fault class.",
      criterion:
        "Require independent labels, tests or domain evidence before assigning a physical category.",
      verification:
        "Compare group membership with separately collected load, environment and maintenance records."
    },
    misconception: {
      claim: "Well-separated clusters prove that the dataset contains real physical classes.",
      mechanism:
        "Distance-defined geometry is mistaken for causal or operational meaning.",
      correction:
        "Treat clusters as representation-dependent candidates and test scaling, stability and external evidence.",
      disconfirmingObservation:
        "The same points receive different groups after unit scaling, or high-temperature points span healthy and faulty modes."
    },
    assessmentMoves: [
      "ordering the cluster stability review from representation to interpretation",
      "repeating the review after the grouping changes scale",
      "selecting unsupervised claims with external support",
      "finding the unsupported physical label in the grouping",
      "explaining representation, stability and interpretation boundaries",
      "matching perturbations to cluster evidence",
      "reading the grouping graph across scaling and assignment",
      "retesting the candidate groups under resampling"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E3-D22-L05",
    cue: "split firewall",
    systemModel:
      "Feature engineering represents available information, dataset splits preserve an honest evaluation boundary, metrics encode decision priorities and leakage lets target or future information cross that boundary.",
    failurePattern:
      "A feature, transformation or repeated subject exposes information unavailable at prediction time, making validation performance optimistically biased.",
    visualExplanation:
      "A split firewall separates training, validation and test records while every feature transformation is fitted only on information available inside the permitted side.",
    applicationTask:
      "Design a predictive-maintenance evaluation whose features, splits and metrics cannot see future failure information.",
    terms: [
      [
        "Feature engineering",
        "The construction or transformation of model inputs from information available at prediction time.",
        "A useful-looking feature is invalid when it depends on the target, future events or test-set statistics."
      ],
      [
        "Evaluation split",
        "A partition that assigns distinct records or groups to model fitting, selection and final assessment.",
        "Random rows are not independent when time, subjects or repeated measurements connect them."
      ],
      [
        "Data leakage",
        "Information crossing into model development from the target, future or evaluation set in a way unavailable during intended use.",
        "Leakage can occur through features, preprocessing, grouping, labels or manual iteration."
      ]
    ],
    entities: [
      ["input", "Timestamped maintenance records", "Sensor histories, machine identifiers and later maintenance outcomes."],
      ["constraint", "Train-validation-test firewall", "Time-aware or group-aware partitions with a protected final test set."],
      ["mechanism", "Prediction-time features", "Inputs and transformations computable using only information available at the decision time."],
      ["observation", "Held-out metric results", "Use-specific scores computed on data isolated from fitting and selection."],
      ["decision", "Leakage-bounded evaluation", "A performance claim retained only when information flow respects the split firewall."]
    ],
    relations: [
      ["constrains", "the train-validation-test firewall constrains every fitting and selection operation", "directed", "one-to-many"],
      ["maps", "prediction-time features map permitted maintenance history into model inputs", "directed", "many-to-many"],
      ["supports", "held-out metric results support a leakage-bounded evaluation only across the protected split", "directed", "many-to-one"],
      ["compares", "use-specific metrics compare candidate models without opening the final test set", "directed", "many-to-many"],
      ["invalidates", "future, target or test information invalidates the leakage-bounded evaluation", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Prediction time, grouping unit, target meaning and metric decision cost are declared."],
      ["operating-state", "All learned preprocessing is fitted inside training data and selection uses validation data only."],
      ["criterion", "The final metric is computed once on a protected test set representing the intended use."],
      ["boundary", "Future outcome features, repeated-entity crossover or test-guided iteration blocks the performance claim."]
    ],
    failure: [
      "Future maintenance status or test statistics enter the feature pipeline.",
      "The model appears predictive because its inputs reveal information unavailable at the real decision time.",
      "Reject the evaluation and rebuild features, transformations and splits from the prediction-time boundary."
    ],
    conceptualSteps: [
      "Define the prediction time, target, grouping unit and operational decision.",
      "Partition records by the required time or entity boundary before fitting transformations.",
      "Construct features solely from information available at prediction time.",
      "Select models and metrics inside training and validation while protecting the final test set.",
      "Retain the result only after one leakage audit and protected test evaluation."
    ],
    example: {
      scenario:
        "One hundred chronological records are assigned as the earliest 60 to training, the next 20 to validation and the latest 20 to test.",
      givenLabel: "Chronological split counts",
      givenValue: "60 train, 20 validation, 20 test",
      givenUnit: "records",
      reasoning: [
        "The counts sum to 100 and preserve temporal order.",
        "Preprocessing parameters must be fitted on the 60 training records, then applied unchanged to validation and test.",
        "The latest 20 records remain protected until the pipeline and metric are fixed."
      ],
      outcome:
        "The 60:20:20 chronological split creates a clear evaluation boundary for this ordered sample.",
      criterion:
        "Accept the final metric only if no feature, transformation or iteration crosses from later partitions into earlier development.",
      verification:
        "Audit record timestamps, transformation fit calls and model-selection logs against the three partitions."
    },
    counterexample: {
      scenario:
        "A feature called days-until-failure is computed from the future maintenance date and included in every split.",
      givenLabel: "Leaking feature",
      givenValue: "days-until-failure",
      givenUnit: "days",
      reasoning: [
        "The feature requires knowledge of a later failure event.",
        "That information is not available when the maintenance decision must be made.",
        "A high test score can therefore reflect target disclosure rather than predictive structure."
      ],
      outcome:
        "The evaluation estimates access to future information, not deployable predictive performance.",
      criterion:
        "Every feature must be computable at the declared prediction time without target or future information.",
      verification:
        "Reconstruct each feature using only records timestamped at or before prediction time and compare availability."
    },
    misconception: {
      claim: "There is no leakage when the final test rows were not used to fit the model weights.",
      mechanism:
        "Leakage through feature construction, preprocessing, repeated entities or test-guided choices is ignored.",
      correction:
        "Protect the complete data-to-decision path, including transformations, grouping, selection and feature availability.",
      disconfirmingObservation:
        "Model weights use only training rows, yet a future-derived feature reveals each test target."
    },
    assessmentMoves: [
      "sequencing the split firewall from prediction time to final metric",
      "rebuilding the firewall after a future feature crosses it",
      "screening evaluation claims for hidden information flow",
      "tracking leakage from the test result back to feature construction",
      "explaining why the full pipeline must respect the split",
      "matching partition duties to permitted operations",
      "following records and transformations through the firewall graph",
      "rerunning evaluation with prediction-time features only"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E3-D22-L06",
    cue: "reproduction replay",
    systemModel:
      "Bias captures systematic model limitation, variance captures sensitivity to sampled data, overfitting learns accidental training detail and reproducibility fixes the complete data-to-result path.",
    failurePattern:
      "A complex model is retained because training error falls even though validation error rises and the result cannot be recreated from recorded inputs and settings.",
    visualExplanation:
      "A learning comparison traces model capacity to training and validation error, repeat-to-repeat variation and a versioned reproduction record.",
    applicationTask:
      "Diagnose an overfit sensor model and specify the data, code, split, seed and settings needed to reproduce its evaluation.",
    terms: [
      [
        "Bias",
        "Systematic error caused by assumptions or capacity that cannot represent relevant structure.",
        "High error alone does not identify bias without comparison across model capacity and data."
      ],
      [
        "Variance",
        "Sensitivity of a fitted model or result to changes in the sampled training data.",
        "Run-to-run randomness is only one source of variance; sampling and pipeline choices also matter."
      ],
      [
        "Overfitting",
        "Learning training-specific detail that reduces training error without improving unseen-data performance.",
        "A training-validation gap suggests overfitting only under a valid, leakage-free comparison."
      ]
    ],
    entities: [
      ["input", "Versioned learning inputs", "Dataset version, split, features, code, seed and model settings."],
      ["mechanism", "Candidate model capacity", "The flexibility used to fit signal and accidental training detail."],
      ["observation", "Training-validation error pattern", "Errors and variation measured across held-out data and repeated fits."],
      ["constraint", "Reproduction record", "A complete specification sufficient to rerun the data-to-result path."],
      ["decision", "Generalisation claim", "A bounded claim selected using held-out performance, stability and reproducibility."]
    ],
    relations: [
      ["depends-on", "candidate model capacity depends on the versioned learning inputs and settings", "directed", "many-to-one"],
      ["causes", "excess capacity can cause a widening training-validation error pattern", "directed", "many-to-one"],
      ["measures", "repeated held-out evaluations measure variance and generalisation evidence", "directed", "many-to-one"],
      ["supports", "the reproduction record supports independent recreation of the error pattern", "directed", "one-to-many"],
      ["invalidates", "validation degradation or an incomplete reproduction record invalidates the generalisation claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Training and validation data are independent under the declared sampling and leakage boundary."],
      ["operating-state", "Candidate capacities are compared with the same split, metric and evaluation protocol."],
      ["criterion", "The selected model improves held-out performance over baseline with acceptable variation and a reproducible record."],
      ["boundary", "Training-only improvement, unstable evaluation or missing versions blocks the generalisation claim."]
    ],
    failure: [
      "Capacity is increased until training error is smallest, while validation error and reproduction evidence are ignored.",
      "The selected model memorises sample detail and its reported benefit disappears on unseen data or rerun.",
      "Reject the selection and compare capacity using held-out, repeated and reproducible evaluation."
    ],
    conceptualSteps: [
      "Version the dataset, split, feature pipeline, code, seed and candidate settings.",
      "Fit candidate capacities under one fixed leakage-free evaluation protocol.",
      "Compare training and validation errors rather than training error alone.",
      "Repeat the comparison to estimate sensitivity to sampling and initialisation.",
      "Retain a generalisation claim only with stable held-out improvement and a complete reproduction record."
    ],
    example: {
      scenario:
        "A complex model has training mean absolute error 0.2 and validation mean absolute error 1.8, while a simple baseline has validation error 1.0.",
      givenLabel: "Training and validation errors",
      givenValue: "complex train 0.2, complex validation 1.8, baseline validation 1.0",
      givenUnit: null,
      reasoning: [
        "The complex model's validation error exceeds its training error by 1.6.",
        "Its validation error is also 0.8 worse than the baseline's 1.0.",
        "Under a valid common split, greater capacity has reduced training error without improving unseen-data error."
      ],
      outcome:
        "The complex model shows an overfitting warning and does not beat the validation baseline.",
      criterion:
        "Prefer a model only when repeated held-out performance improves and the complete evaluation can be reproduced.",
      verification:
        "Recompute both error differences, then rerun from the recorded dataset, split, seed and settings."
    },
    counterexample: {
      scenario:
        "Only the complex model's training error of 0.2 is reported and the unrecorded run is called best.",
      givenLabel: "Training-only selection",
      givenValue: "training MAE = 0.2",
      givenUnit: null,
      reasoning: [
        "Training error measures fit on records already used for learning.",
        "No held-out comparison tests generalisation against the baseline.",
        "Missing versions and settings prevent checking whether the result can be recreated."
      ],
      outcome:
        "The best-model claim lacks both generalisation and reproducibility evidence.",
      criterion:
        "Selection requires a fixed held-out protocol, baseline comparison and complete reproduction record.",
      verification:
        "Request the validation result and independently rerun the versioned pipeline before accepting the claim."
    },
    misconception: {
      claim: "The model with the lowest training error is the best learned model.",
      mechanism:
        "Fit to observed training detail is confused with stable performance on unseen records.",
      correction:
        "Compare capacity through leakage-free held-out error, repeated variation and a reproducible pipeline.",
      disconfirmingObservation:
        "Training error falls to 0.2 while validation error rises to 1.8 and exceeds the baseline."
    },
    assessmentMoves: [
      "ordering the reproduction replay from inputs to generalisation",
      "replaying the selection after validation degradation",
      "screening fit claims with bias and variance evidence",
      "locating the overfit step in the capacity comparison",
      "explaining why reproducibility belongs to model evaluation",
      "matching recorded settings to repeatable outcomes",
      "reading capacity and errors through the learning graph",
      "rerunning the comparison with the baseline restored"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E3-D22-L07",
    cue: "temporal walk-forward",
    systemModel:
      "Time-series learning preserves order, anomaly detection compares observations with a declared baseline and sensor-data evaluation accounts for drift, calibration, operating mode and correlated samples.",
    failurePattern:
      "Chronologically related sensor windows are randomly mixed, so nearby information leaks across splits and a fixed anomaly threshold is trusted after baseline drift.",
    visualExplanation:
      "A temporal walk-forward view links ordered history to a baseline, anomaly score, threshold decision and monitoring loop for drift and calibration.",
    applicationTask:
      "Design an anomaly detector for ordered sensor data with a walk-forward split and an explicit response to baseline drift.",
    terms: [
      [
        "Time-series split",
        "An evaluation partition that respects temporal order and the intended forecasting or detection horizon.",
        "Temporal order alone is insufficient when overlapping windows or repeated assets still cross the boundary."
      ],
      [
        "Anomaly score",
        "A numeric measure of deviation from a declared reference pattern or predictive expectation.",
        "A high score signals deviation, not automatically a fault or hazard."
      ],
      [
        "Concept drift",
        "A change over time in the data distribution or relation relevant to the model.",
        "Drift must be distinguished from sensor miscalibration, operating-mode change and isolated noise."
      ]
    ],
    entities: [
      ["input", "Ordered sensor history", "Timestamped measurements, asset identity and operating-mode context."],
      ["constraint", "Walk-forward evaluation boundary", "Earlier data fit the method and later data evaluate it without overlap leakage."],
      ["mechanism", "Baseline and anomaly score", "A reference estimate and deviation calculation applied to later observations."],
      ["observation", "Temporal deviation evidence", "Scores, threshold crossings, drift indicators and calibration checks over time."],
      ["decision", "Monitored anomaly claim", "A bounded alert rule with drift review and an engineering verification action."]
    ],
    relations: [
      ["routes", "the walk-forward evaluation boundary routes earlier history to fitting and later history to evaluation", "directed", "one-to-many"],
      ["transforms", "the baseline and anomaly score transform ordered observations into deviations", "directed", "many-to-many"],
      ["compares", "temporal deviation evidence compares scores with the declared alert threshold", "directed", "many-to-one"],
      ["feeds-back", "drift and calibration checks feed back into baseline review and model maintenance", "directed", "many-to-one"],
      ["invalidates", "overlap leakage or unreviewed drift invalidates the monitored anomaly claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Timestamp order, sampling interval, asset identity, operating mode and alert horizon are declared."],
      ["operating-state", "Training windows precede evaluation windows and overlapping samples do not cross the split."],
      ["criterion", "Alerts meet the time-ordered evaluation criterion and trigger a defined engineering verification action."],
      ["boundary", "Random temporal mixing, calibration loss or unreviewed drift blocks the anomaly-performance claim."]
    ],
    failure: [
      "Overlapping windows are randomly split and the original threshold remains active through a distribution shift.",
      "Evaluation is optimistic and normal changed operation is repeatedly labelled anomalous.",
      "Reject the detector claim until order, overlap, calibration and drift have been audited."
    ],
    conceptualSteps: [
      "Declare timestamp, sampling, asset, operating-mode and detection-horizon semantics.",
      "Construct non-leaking walk-forward training and evaluation windows.",
      "Fit the baseline on earlier permitted history and compute later anomaly scores.",
      "Evaluate threshold crossings together with drift, calibration and operating-mode evidence.",
      "Retain an alert rule only with monitored limits and a defined physical verification action."
    ],
    example: {
      scenario:
        "A baseline window contains sensor readings 10, 11 and 9, followed later by a reading of 15.",
      givenLabel: "Baseline and later reading",
      givenValue: "10, 11, 9 then 15",
      givenUnit: null,
      reasoning: [
        "The arithmetic mean of the three baseline readings is (10 + 11 + 9) divided by 3, which is 10.",
        "The later reading differs from that mean by +5.",
        "The deviation can form an anomaly score, but threshold, operating mode and calibration determine its meaning."
      ],
      outcome:
        "The later reading has a +5 deviation from this simple baseline; it is a candidate anomaly, not a proven fault.",
      criterion:
        "Raise or retain an alert only under the declared threshold and follow it with the defined engineering check.",
      verification:
        "Recompute the baseline mean and deviation, then inspect timestamp order, operating mode and sensor calibration."
    },
    counterexample: {
      scenario:
        "Overlapping windows from the same event are randomly divided between training and test, producing a very high anomaly score metric.",
      givenLabel: "Leaking temporal split",
      givenValue: "overlapping windows in train and test",
      givenUnit: null,
      reasoning: [
        "Neighbouring windows share much of the same sensor content.",
        "Random allocation exposes event-specific information on both sides of the evaluation.",
        "The measured score no longer represents detection on a genuinely later unseen interval."
      ],
      outcome:
        "Temporal overlap makes the reported anomaly performance optimistically biased.",
      criterion:
        "Separate evaluation windows by time, event and asset boundaries appropriate to the intended use.",
      verification:
        "List source sample ranges for every window and confirm that no raw sample crosses the split."
    },
    misconception: {
      claim: "Any large anomaly score proves that the sensor has detected a fault.",
      mechanism:
        "Deviation from a baseline is confused with a diagnosed cause, despite drift, mode and calibration alternatives.",
      correction:
        "Treat the score as bounded deviation evidence and require time-safe evaluation plus physical verification.",
      disconfirmingObservation:
        "A mode change shifts normal readings, causing large scores while the machine remains healthy."
    },
    assessmentMoves: [
      "sequencing the temporal walk-forward from history to monitored alert",
      "reconstructing evaluation after overlapping windows leak",
      "screening anomaly claims against drift and calibration",
      "tracing an alert back to its time and baseline assumptions",
      "explaining why deviation does not diagnose a fault",
      "matching temporal conditions with verification actions",
      "following the ordered sensor graph through scoring and review",
      "rerunning the detector after the split and baseline are repaired"
    ],
    variant: 6
  }
] satisfies readonly LessonSource[];

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
      ["b-source", ["r1"], ["c1"]],
      ["b-rule", ["r2"], ["c2"]],
      ["b-summary", ["r3"], ["c2"]],
      ["b-accept", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-silent", ["r5"], ["c4"]],
      ["r-restore", ["r1"], ["c1"]],
      ["r-reprepare", ["r2", "r3"], ["c2"]],
      ["r-audit", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-fit", ["r1"], ["c1"]],
      ["b-residual", ["r2"], ["c2"]],
      ["b-diagnose", ["r3"], ["c2"]],
      ["b-baseline", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-cancel", ["r5"], ["c4"]],
      ["r-recompute", ["r2"], ["c1"]],
      ["r-magnitude", ["r3"], ["c2"]],
      ["r-compare", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-threshold", ["r1"], ["c1"]],
      ["b-predict", ["r2"], ["c2"]],
      ["b-count", ["r3"], ["c2"]],
      ["b-cost", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-hide", ["r5"], ["c4"]],
      ["r-fix", ["r1"], ["c1"]],
      ["r-recount", ["r2", "r3"], ["c2"]],
      ["r-decide", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-represent", ["r1"], ["c1"]],
      ["b-distance", ["r2"], ["c2"]],
      ["b-group", ["r3"], ["c2"]],
      ["b-stability", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-overlabel", ["r5"], ["c4"]],
      ["r-rescale", ["r1", "r2"], ["c1"]],
      ["r-regroup", ["r3"], ["c2"]],
      ["r-interpret", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-partition", ["r1"], ["c1"]],
      ["b-feature", ["r2"], ["c2"]],
      ["b-select", ["r4"], ["c2"]],
      ["b-test", ["r3"], ["c3"]]
    ],
    retry: [
      ["r-leak", ["r5"], ["c4"]],
      ["r-repartition", ["r1"], ["c1"]],
      ["r-rebuild", ["r2"], ["c2"]],
      ["r-retest", ["r3"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-version", ["r1"], ["c1"]],
      ["b-capacity", ["r2"], ["c2"]],
      ["b-repeat", ["r3"], ["c2"]],
      ["b-reproduce", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-overfit", ["r5"], ["c4"]],
      ["r-restore", ["r1"], ["c1"]],
      ["r-refit", ["r2"], ["c2"]],
      ["r-validate", ["r3", "r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-window", ["r1"], ["c1"]],
      ["b-score", ["r2"], ["c2"]],
      ["b-threshold", ["r3"], ["c2"]],
      ["b-monitor", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-overlap", ["r5"], ["c4"]],
      ["r-walk", ["r1"], ["c1"]],
      ["r-rescore", ["r2", "r3"], ["c2"]],
      ["r-review", ["r4"], ["c3"]]
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
    throw new Error(`Missing D22 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Build the ${source.cue} from ${first} through ${second} to ${observed} while ${move}:`,
      `${accepted} is supported when the ordered ${source.cue} preserves ${first}, ${second} and ${observed}.`,
      `${accepted} is premature when ${move} skips the ${second} boundary exposed by ${observed}.`,
      `Mark the ${first} assumption before beginning this ${source.cue}.`,
      `Place ${second} before interpreting ${observed} in the ${source.cue}.`,
      `Follow ${first} through ${second} and record ${observed} while ${move}.`,
      `Retain ${accepted} only after ${observed} satisfies its declared criterion.`
    ],
    [
      `Reconstruct the failed ${source.cue} from ${observed} back to ${first} during ${move}:`,
      `Recovery succeeds when ${observed} identifies the changed ${second} boundary and restores ${accepted}.`,
      `Recovery fails when ${first} is reused without explaining the changed ${observed}.`,
      `Freeze the failed ${observed} before revising the ${source.cue}.`,
      `Trace ${observed} backwards through ${second} to the relevant ${first} condition.`,
      `Rebuild the ${first} to ${second} path while ${move}.`,
      `Require new ${observed} before restoring ${accepted}.`
    ],
    [
      `Screen claims in the ${source.cue} about ${first}, ${second} and ${observed} while ${move}:`,
      `A defensible ${accepted} links ${first} to ${observed} through a bounded ${second}.`,
      `An indefensible ${accepted} treats ${observed} as proof after ${second} leaves its boundary.`,
      `Annotate each ${first} claim with the active ${source.cue} condition.`,
      `Check whether ${second} can produce the stated ${observed} while ${move}.`,
      `Remove the ${first} shortcut that bypasses ${observed}.`,
      `Keep only claims whose ${observed} supports ${accepted}.`
    ],
    [
      `Localise the defect in ${observed} by challenging ${first} and ${second} through the ${source.cue} while ${move}:`,
      `The diagnosis is complete when ${observed} identifies the failed relation between ${first} and ${second}.`,
      `The diagnosis is incomplete when ${accepted} is rejected without a mechanism visible in ${observed}.`,
      `Start at the first mismatch visible in ${observed} during the ${source.cue}.`,
      `Walk from ${observed} through ${second} towards ${first}.`,
      `Separate the active ${second} path from the path suppressed while ${move}.`,
      `Choose the ${first} explanation that reproduces ${observed}.`
    ],
    [
      `Explain the ${source.cue} mechanism connecting ${first}, ${second}, ${observed} and ${accepted} while ${move}:`,
      `A complete explanation states the ${first} boundary, the ${second} mechanism and the observed ${observed}.`,
      `A weak explanation lists ${first} and ${second} without showing why ${observed} changes.`,
      `Define ${first} inside the active ${source.cue} condition.`,
      `Describe how ${second} changes the evidence in ${observed}.`,
      `Connect ${first} to ${observed} through ${second} while ${move}.`,
      `Close with the ${observed} criterion that bounds ${accepted}.`
    ],
    [
      `Match conditions for ${first} and ${second} with ${observed} in the ${source.cue} while ${move}:`,
      `Each correct pair shows how ${second} carries ${first} into measurable ${observed}.`,
      `A wrong pair attaches ${observed} to a condition outside the ${second} path.`,
      `Pair ${first} with the ${source.cue} assumption that defines it.`,
      `Pair ${second} with the evidence visible in ${observed}.`,
      `Read every ${first} pair through ${second} towards ${accepted}.`,
      `Reject any pair whose predicted ${observed} conflicts while ${move}.`
    ],
    [
      `Read the ${source.cue} graph from ${first} through ${second} to ${observed} while ${move}:`,
      `The selected link is correct when it carries ${first} through ${second} into the required ${observed}.`,
      `The selected link is wrong when it bypasses ${second} or contradicts ${observed}.`,
      `Locate ${first} at the start of the ${source.cue} graph.`,
      `Identify the ${second} link governing ${observed}.`,
      `Trace the active relation into ${observed} while ${move}.`,
      `Use ${observed} to decide whether ${accepted} remains bounded.`
    ],
    [
      `Re-evaluate the altered ${source.cue} state from ${first} to ${accepted} while ${move}:`,
      `The revised state is correct when ${second} predicts the new ${observed} and bounds ${accepted}.`,
      `The revised state is wrong when it retains old ${observed} after the ${first} condition changes.`,
      `State the changed ${first} condition in the ${source.cue}.`,
      `Recompute the effect of ${second} on ${observed}.`,
      `Propagate the altered ${second} path into new ${observed}.`,
      `Restore ${accepted} only when ${observed} passes the final check.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D22 instruction plan ${slot}.`);
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
        throw new Error(`Missing D22 relation endpoints ${index}.`);
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
        throw new Error(`Missing D22 condition binding ${index}.`);
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
  if (pattern === undefined) {
    throw new Error(`Missing D22 ordering pattern ${source.variant}.`);
  }
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
          "bounded-ml-case",
          term("t2", "label"),
          ["c1"],
          ["e1", "e2", "e3", "e4"],
          ["r1", "r2", "r3"],
          ["r5"],
          [],
          [
            [
              "bounded-note",
              source.visualExplanation,
              ["e1", "e2", "e3"],
              ["r1", "r2"]
            ]
          ],
          reasonedCase("worked", "verification")
        ],
        [
          "failed-ml-case",
          term("t3", "label"),
          ["c4"],
          ["e1", "e4", "e5"],
          ["r4", "r5"],
          ["r2"],
          [],
          [
            [
              "failed-note",
              source.failure[1],
              ["e1", "e4", "e5"],
              ["r5"]
            ]
          ],
          reasonedCase("counter", "verification")
        ]
      ]
    }
  };
};

export const academyLessonTeachingProfileV2PlansE3D22 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE3D22 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE3D22,
    academyLessonTeachingProfileV2PlansE3D22
  );

export const academyLessonTeachingProfilesV2E3D22 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE3D22.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D22 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D22;
