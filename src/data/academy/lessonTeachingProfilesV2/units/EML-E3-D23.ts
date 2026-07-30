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
    lessonId: "EML-E3-D23-L01",
    cue: "activation ledger",
    systemModel:
      "A neural-network neuron combines input features with learned weights and a bias, then applies a nonlinear activation before its output can contribute to a bounded prediction.",
    failurePattern:
      "A raw weighted sum is treated as a calibrated probability while bias, activation, feature scaling and evaluation evidence remain unstated.",
    visualExplanation:
      "An activation ledger traces feature values through weighted contributions, bias, pre-activation, nonlinear output and a prediction boundary.",
    applicationTask:
      "Compute and explain a small robot-sensor neuron while separating arithmetic output from probability or deployment claims.",
    terms: [
      [
        "Artificial neuron",
        "A computational unit that combines weighted inputs and a bias before applying an activation function.",
        "A neuron is a mathematical component, not a biological explanation or a complete intelligent system."
      ],
      [
        "Affine combination",
        "A weighted sum of input features plus a bias term.",
        "Its value depends on feature representation, units and learned parameters and is not inherently bounded."
      ],
      [
        "Activation function",
        "A transformation applied to the affine combination to introduce nonlinearity or a chosen output range.",
        "An activation value is not automatically a calibrated probability or safe control command."
      ]
    ],
    entities: [
      ["input", "Scaled feature vector", "Declared robot-sensor features represented on the scale used during training."],
      ["mechanism", "Learned weights and bias", "Parameters multiplying features and shifting their weighted sum."],
      ["mechanism", "Pre-activation value", "The affine combination computed before nonlinearity."],
      ["observation", "Activated neuron output", "The value produced after applying the declared activation function."],
      ["decision", "Bounded neuron interpretation", "A claim limited to the trained representation and evaluation evidence."]
    ],
    relations: [
      ["transforms", "learned weights and bias transform the scaled feature vector into a pre-activation value", "directed", "many-to-one"],
      ["depends-on", "the pre-activation value depends on every weighted contribution and the bias", "directed", "many-to-one"],
      ["maps", "the activation function maps the pre-activation value into an activated neuron output", "directed", "one-to-one"],
      ["supports", "the activated neuron output supports a bounded interpretation only with evaluation evidence", "directed", "many-to-one"],
      ["invalidates", "unstated scaling or probability semantics invalidate the bounded neuron interpretation", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Feature order, scaling, units, weights, bias and activation function are declared."],
      ["operating-state", "Inference applies the same feature transformation used for training and evaluation."],
      ["criterion", "Arithmetic is reproducible and the output meaning is supported by held-out calibration and task evidence."],
      ["boundary", "Changed scaling, omitted bias or unverified probability meaning blocks the neuron interpretation."]
    ],
    failure: [
      "The raw weighted sum is labelled a fault probability without applying or validating the intended output mapping.",
      "Downstream logic assigns confidence semantics that the neuron arithmetic did not establish.",
      "Reject the probability claim while retaining only the reproducible numeric neuron output."
    ],
    conceptualSteps: [
      "Declare feature order, scaling, units and the learned weight and bias values.",
      "Multiply each feature by its corresponding weight and sum the contributions with bias.",
      "Name the result as the pre-activation value rather than the final prediction meaning.",
      "Apply the declared activation function and record the activated output.",
      "Bound any interpretation by held-out evaluation, calibration and intended robot use."
    ],
    example: {
      scenario:
        "A neuron receives x1=2 and x2=1 with weights 0.5 and -0.25, bias 0.1 and a rectified linear activation.",
      givenLabel: "Neuron inputs and parameters",
      givenValue: "x=(2,1), w=(0.5,-0.25), b=0.1",
      givenUnit: null,
      reasoning: [
        "The weighted contributions are 2 times 0.5 equals 1.0 and 1 times -0.25 equals -0.25.",
        "Adding the bias gives the pre-activation z = 1.0 - 0.25 + 0.1 = 0.85.",
        "The rectified linear activation returns max(0, 0.85), so the activated output is 0.85."
      ],
      outcome:
        "The neuron produces pre-activation 0.85 and activated output 0.85.",
      criterion:
        "Accept the arithmetic when feature order, scale, parameters and activation reproduce the same result.",
      verification:
        "Recompute the two weighted contributions, include the 0.1 bias and independently apply max(0, z)."
    },
    counterexample: {
      scenario:
        "The same 0.85 output is announced as an 85% probability of collision without calibration evidence.",
      givenLabel: "Unsupported probability label",
      givenValue: "0.85 interpreted as 85%",
      givenUnit: null,
      reasoning: [
        "A rectified linear output is not restricted to the interval from zero to one.",
        "The arithmetic provides an activation value, not a calibrated event frequency.",
        "No held-out reliability comparison links outputs near 0.85 to collision probability."
      ],
      outcome:
        "The numeric activation is valid while the 85% probability interpretation is unsupported.",
      criterion:
        "Use probability language only for an appropriate output model with verified held-out calibration.",
      verification:
        "Inspect the final activation and reliability evaluation rather than inferring semantics from decimal appearance."
    },
    misconception: {
      claim: "Any neural-network output between zero and one is automatically a probability.",
      mechanism:
        "Numeric range is confused with calibrated probability semantics and evaluation evidence.",
      correction:
        "State the activation, output meaning and held-out calibration evidence separately.",
      disconfirmingObservation:
        "A rectified linear neuron returns 0.85 in one case but can return 2.4 in another."
    },
    assessmentMoves: [
      "assembling the activation ledger from features to bounded meaning",
      "reversing the ledger after probability semantics are added",
      "testing neuron claims against activation evidence",
      "isolating the unsupported interpretation after the arithmetic",
      "explaining affine combination and activation as separate operations",
      "matching neuron conditions to observable outputs",
      "tracing weights and bias through the activation graph",
      "recomputing the output with scale and semantics restored"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E3-D23-L02",
    cue: "gradient descent trace",
    systemModel:
      "Deep learning composes many parameterised representation layers and uses gradient-based optimisation to reduce a declared loss over data while scale, initialisation, regularisation and compute shape the result.",
    failurePattern:
      "One falling training loss is treated as proof of learning even though the update rule, held-out behaviour and reproducibility record are incomplete.",
    visualExplanation:
      "A gradient descent trace connects a training batch to forward prediction, loss, parameter gradient, learning-rate update and held-out review.",
    applicationTask:
      "Work through one transparent gradient update and state what additional evidence is required before accepting a deep model.",
    terms: [
      [
        "Deep network",
        "A neural model with multiple parameterised representation layers.",
        "Depth increases representational capacity but does not remove data, evaluation or safety limits."
      ],
      [
        "Loss function",
        "A declared numeric objective comparing model outputs with training targets or constraints.",
        "Lower training loss does not necessarily mean better held-out performance or safer robot behaviour."
      ],
      [
        "Gradient descent",
        "An optimisation rule that updates parameters opposite the local gradient of the loss.",
        "A local gradient and learning rate do not guarantee convergence to a useful or unique solution."
      ]
    ],
    entities: [
      ["input", "Training batch", "A versioned set of input-target examples used for one optimisation step."],
      ["mechanism", "Parameterised deep layers", "Composed transformations governed by trainable parameter values."],
      ["observation", "Loss and parameter gradient", "The objective value and local derivative computed for the batch."],
      ["constraint", "Optimisation trace", "Recorded learning rate, update, validation result, seed and compute settings."],
      ["decision", "Reproducible deep-learning claim", "A claim bounded by held-out performance and repeatable training evidence."]
    ],
    relations: [
      ["maps", "parameterised deep layers map the training batch into predictions", "directed", "many-to-many"],
      ["measures", "the loss function measures disagreement between predictions and training targets", "directed", "many-to-one"],
      ["feeds-back", "the loss gradient feeds back through the layers to propose parameter updates", "directed", "many-to-many"],
      ["constrains", "the optimisation trace constrains interpretation of convergence and reproducibility", "directed", "one-to-many"],
      ["invalidates", "training-only loss or an unrecorded update invalidates the deep-learning claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Data version, loss, parameter value, gradient sign and learning rate are declared."],
      ["operating-state", "Training and validation metrics are tracked under fixed preprocessing and split boundaries."],
      ["criterion", "Repeated training converges sufficiently and improves held-out performance under recorded settings."],
      ["boundary", "Divergence, training-only evidence or missing versions blocks the deep-learning claim."]
    ],
    failure: [
      "A large learning rate is retained because one batch loss falls, with no validation or repeat run.",
      "Updates become unstable or the apparent result cannot be reproduced on the protected evaluation.",
      "Reject the training claim until update settings, convergence trace and held-out results are recorded."
    ],
    conceptualSteps: [
      "Version the training batch, target, preprocessing, model parameters and loss definition.",
      "Run the layered forward calculation and compute the declared batch loss.",
      "Back-propagate the loss gradient to the parameter being updated.",
      "Apply the learning-rate-scaled update and record the resulting optimisation trace.",
      "Accept learning evidence only after repeated convergence and held-out comparison."
    ],
    example: {
      scenario:
        "A scalar parameter is 2.0, its loss gradient is +0.4 and the learning rate is 0.1.",
      givenLabel: "Parameter, gradient and learning rate",
      givenValue: "theta=2.0, gradient=+0.4, alpha=0.1",
      givenUnit: null,
      reasoning: [
        "Gradient descent uses theta_next = theta - alpha times gradient.",
        "The scaled gradient is 0.1 times 0.4, which equals 0.04.",
        "The next parameter is 2.0 - 0.04, which equals 1.96."
      ],
      outcome:
        "One declared gradient-descent step changes the parameter from 2.0 to 1.96.",
      criterion:
        "Accept the update arithmetic when sign, learning rate and gradient reproduce 1.96; assess learning with the wider trace.",
      verification:
        "Independently multiply 0.1 by 0.4, subtract it from 2.0 and then inspect the resulting loss."
    },
    counterexample: {
      scenario:
        "The gradient sign is ignored and 0.04 is added, moving the parameter from 2.0 to 2.04.",
      givenLabel: "Wrong-sign update",
      givenValue: "theta_next=2.04",
      givenUnit: null,
      reasoning: [
        "The local gradient is positive, so increasing the parameter follows the direction of rising loss.",
        "Gradient descent requires subtraction of the scaled positive gradient.",
        "The wrong-sign update contradicts the declared optimisation rule before any convergence claim is considered."
      ],
      outcome:
        "The 2.04 update performs gradient ascent for this local derivative.",
      criterion:
        "The update direction must match the declared optimiser and be checked against the subsequent loss.",
      verification:
        "Substitute the values into both subtraction and addition forms, then compare the next loss."
    },
    misconception: {
      claim: "A decreasing training loss proves that a deep network is learning the right engineering behaviour.",
      mechanism:
        "Optimisation of one declared training objective is confused with held-out generalisation and system-level suitability.",
      correction:
        "Separate update arithmetic, convergence, held-out evaluation, repeatability and robot acceptance evidence.",
      disconfirmingObservation:
        "Training loss falls while validation loss rises or the model exploits an irrelevant shortcut."
    },
    assessmentMoves: [
      "sequencing the gradient descent trace through one update",
      "repairing the trace after the sign is reversed",
      "screening deep-learning claims beyond training loss",
      "finding the update step responsible for rising loss",
      "explaining optimisation separately from generalisation",
      "matching trace records to reproducible training",
      "following loss feedback through parameters and validation",
      "rerunning the update with direction and evidence corrected"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E3-D23-L03",
    cue: "receptive-field walk",
    systemModel:
      "A convolutional network applies shared local filters across image tensors, producing spatial feature maps whose stride, padding, receptive field and augmentation shape what perception can represent.",
    failurePattern:
      "High validation accuracy on a narrow image set is treated as robust robot perception despite changed lighting, viewpoint, resolution or unsafe augmentation.",
    visualExplanation:
      "A receptive-field walk connects an image patch to shared filter responses, feature maps, pooled representation and held-out perception evidence.",
    applicationTask:
      "Compute a simple local filter response and design a robot-vision evaluation across relevant environment changes.",
    terms: [
      [
        "Convolutional filter",
        "A small shared weight pattern applied across local positions to produce feature responses.",
        "Many software libraries implement cross-correlation while calling the operation convolution, so orientation must be declared."
      ],
      [
        "Receptive field",
        "The region of an input image that can influence a selected feature activation.",
        "A larger theoretical receptive field does not guarantee effective use of every pixel."
      ],
      [
        "Data augmentation",
        "A label-preserving transformation used to expand training variation.",
        "An augmentation is valid only when it preserves task meaning and plausible sensor geometry."
      ]
    ],
    entities: [
      ["input", "Robot camera tensor", "Pixel values with declared channel order, resolution and normalisation."],
      ["mechanism", "Shared local filter bank", "Learned kernels applied at spatial positions under stride and padding rules."],
      ["mechanism", "Spatial feature maps", "Filter responses retaining an arrangement related to image location."],
      ["observation", "Held-out perception evidence", "Performance slices across lighting, viewpoint, background and object conditions."],
      ["decision", "Bounded CNN perception claim", "A perception claim limited to verified image and deployment conditions."]
    ],
    relations: [
      ["transforms", "the shared local filter bank transforms camera patches into spatial feature responses", "directed", "many-to-many"],
      ["maps", "stride and padding map local responses into spatial feature-map positions", "directed", "many-to-many"],
      ["depends-on", "the effective receptive field depends on stacked filters and spatial operations", "directed", "many-to-one"],
      ["compares", "held-out perception evidence compares the CNN across relevant environment slices", "directed", "many-to-one"],
      ["invalidates", "domain shift or label-breaking augmentation invalidates the bounded CNN claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Tensor shape, channel order, normalisation, filter orientation, stride and padding are declared."],
      ["operating-state", "Training augmentations preserve label meaning and represent plausible camera variation."],
      ["criterion", "Held-out performance meets the task criterion across specified lighting, viewpoint and background slices."],
      ["boundary", "Unseen domain shift, preprocessing mismatch or unsafe augmentation blocks the perception claim."]
    ],
    failure: [
      "A CNN evaluated on near-duplicate images is deployed under materially different camera conditions.",
      "Shared local features respond to new backgrounds or lighting in ways the validation set did not expose.",
      "Reject the broad perception claim and evaluate the defined environment slices and preprocessing path."
    ],
    conceptualSteps: [
      "Declare camera tensor layout, normalisation and the local filter operation.",
      "Apply shared filter weights to one image patch and record the local response.",
      "Map responses across positions using explicit stride and padding.",
      "Evaluate feature behaviour and end-task metrics across relevant held-out environment slices.",
      "Retain a CNN claim only for the preprocessing and conditions that pass."
    ],
    example: {
      scenario:
        "A one-dimensional image row [1, 1, 4] is evaluated with the cross-correlation filter [-1, 0, 1].",
      givenLabel: "Image row and local filter",
      givenValue: "[1,1,4] and [-1,0,1]",
      givenUnit: null,
      reasoning: [
        "Multiply aligned entries: 1 times -1, 1 times 0 and 4 times 1.",
        "The products are -1, 0 and 4.",
        "Their sum is 3, a positive local response for this declared filter orientation."
      ],
      outcome:
        "The local cross-correlation response is 3.",
      criterion:
        "Accept the response when alignment, orientation and arithmetic reproduce 3 under the declared operation.",
      verification:
        "Recompute each product and sum, then reverse the filter to show why orientation matters."
    },
    counterexample: {
      scenario:
        "A horizontal image flip is used as augmentation even though left and right signal lamps have different control meanings.",
      givenLabel: "Label-breaking augmentation",
      givenValue: "horizontal flip",
      givenUnit: null,
      reasoning: [
        "The transformation swaps the spatial side of the signal.",
        "The original label is retained even though the robot action meaning changes.",
        "Training examples now teach an inconsistent mapping between image and control decision."
      ],
      outcome:
        "A common image augmentation corrupts labels for this asymmetric robot task.",
      criterion:
        "Use an augmentation only when task semantics remain valid after the transformation.",
      verification:
        "Apply the transformation to representative labelled scenes and have the required action independently re-labelled."
    },
    misconception: {
      claim: "Convolution automatically makes robot vision invariant to any viewpoint or lighting change.",
      mechanism:
        "Weight sharing and local feature extraction are overstated as universal invariance.",
      correction:
        "Measure performance across defined changes and keep preprocessing, augmentation and receptive-field limits explicit.",
      disconfirmingObservation:
        "A CNN that passes fixed-camera images fails when glare or camera height changes."
    },
    assessmentMoves: [
      "walking the receptive field from camera patch to evidence",
      "rewalking the field after an augmentation breaks labels",
      "screening convolutional claims across environment slices",
      "locating the preprocessing mismatch behind a perception failure",
      "explaining local filtering without claiming universal invariance",
      "matching spatial operations to their feature effects",
      "tracing filter responses across the CNN graph",
      "retesting perception with task-valid augmentation"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E3-D23-L04",
    cue: "context routing map",
    systemModel:
      "A transformer represents sequence elements as tokens, adds positional information and uses attention weights to combine context, with tokenisation, data scope and compute limiting engineering use.",
    failurePattern:
      "A transformer output is trusted as sequence understanding even though token meaning, order representation and deployment context differ from training.",
    visualExplanation:
      "A context routing map links engineering samples to tokens, positions, attention weights, contextual representations and a held-out sequence decision.",
    applicationTask:
      "Compute a small weighted attention context and identify the sequence and deployment assumptions needed for robot telemetry.",
    terms: [
      [
        "Token",
        "A discrete or vectorised sequence element presented to a transformer.",
        "Token boundaries are a modelling choice and may discard timing or engineering meaning."
      ],
      [
        "Attention",
        "A content-dependent weighted combination of value representations across sequence positions.",
        "Attention weights describe model computation and do not by themselves provide a causal explanation."
      ],
      [
        "Positional encoding",
        "Information added or applied so the model can distinguish sequence position or order.",
        "Position handling must match the length, sampling and ordering assumptions of intended use."
      ]
    ],
    entities: [
      ["input", "Engineering token sequence", "Ordered telemetry or command elements with declared sampling and tokenisation."],
      ["mechanism", "Token and position representations", "Content embeddings combined with information about sequence order."],
      ["mechanism", "Attention-weighted context", "A weighted combination of value vectors for a selected query position."],
      ["observation", "Held-out sequence evidence", "Task performance across lengths, timing, missing tokens and operating contexts."],
      ["decision", "Bounded transformer claim", "A sequence claim restricted to verified token, order, context and compute limits."]
    ],
    relations: [
      ["maps", "tokenisation and position rules map the engineering sequence into ordered representations", "directed", "many-to-many"],
      ["compares", "attention compares a query representation with candidate sequence context", "directed", "one-to-many"],
      ["transforms", "attention weights transform value vectors into an attention-weighted context", "directed", "many-to-one"],
      ["supports", "held-out sequence evidence supports a bounded transformer claim across declared contexts", "directed", "many-to-one"],
      ["invalidates", "lost order, token shift or unsupported context invalidates the bounded transformer claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Tokenisation, sampling, sequence order, position method and attention normalisation are declared."],
      ["operating-state", "Inference sequence length and missing-data handling remain within evaluated bounds."],
      ["criterion", "Held-out performance meets the use criterion across relevant lengths, timings and operating contexts."],
      ["boundary", "Changed token meaning, absent order information or excessive compute blocks the transformer claim."]
    ],
    failure: [
      "Sequence elements are reordered or retokenised without updating position semantics or evaluation.",
      "The model receives a context structure that its learned attention path did not validate.",
      "Reject the sequence claim until token, order and held-out context evidence are restored."
    ],
    conceptualSteps: [
      "Declare sequence sampling, token boundaries and engineering meaning.",
      "Construct token representations and attach the intended position information.",
      "Compute or inspect attention weights for a selected query under their normalisation rule.",
      "Combine value vectors and evaluate the resulting task output across sequence conditions.",
      "Retain a transformer claim only within verified token, order, length and compute bounds."
    ],
    example: {
      scenario:
        "A query uses attention weights 0.25 and 0.75 over value vectors [2,0] and [0,4].",
      givenLabel: "Attention weights and values",
      givenValue: "0.25*[2,0] + 0.75*[0,4]",
      givenUnit: null,
      reasoning: [
        "Scale the first value vector to [0.5, 0].",
        "Scale the second value vector to [0, 3].",
        "Add the vectors component-wise to obtain the context [0.5, 3]."
      ],
      outcome:
        "The declared attention-weighted context is [0.5, 3].",
      criterion:
        "Accept the context arithmetic when weights, values and component-wise sum reproduce [0.5, 3].",
      verification:
        "Independently check that the weights sum to 1 and recompute both scaled vectors and their sum."
    },
    counterexample: {
      scenario:
        "Two telemetry sequences contain the same tokens in different orders, but no positional information is supplied.",
      givenLabel: "Order without position",
      givenValue: "same tokens, different order",
      givenUnit: null,
      reasoning: [
        "Content tokens alone identify values but not their temporal positions.",
        "The attention computation receives no explicit basis for distinguishing the order.",
        "A task that depends on before-versus-after timing can therefore become ambiguous."
      ],
      outcome:
        "The representation can collapse distinct ordered events into an indistinguishable context.",
      criterion:
        "Order-dependent use requires a declared position mechanism verified at intended sequence lengths.",
      verification:
        "Evaluate paired sequences that differ only in order and inspect both representations and task outputs."
    },
    misconception: {
      claim: "Attention weights show which sequence elements truly caused the robot decision.",
      mechanism:
        "Internal weighting in one computation is mistaken for a causal intervention or complete explanation.",
      correction:
        "Treat attention as model structure and test causal or safety claims with separate interventions and system evidence.",
      disconfirmingObservation:
        "Different attention patterns produce the same output, or high-weight tokens change without changing the decision."
    },
    assessmentMoves: [
      "routing the context map from tokens to sequence evidence",
      "rerouting the map after positional information is removed",
      "screening transformer claims for token and order limits",
      "locating the representation loss behind an ambiguous sequence",
      "explaining attention without assigning causal certainty",
      "matching sequence conditions with evaluation evidence",
      "tracing values through attention into bounded context",
      "re-evaluating the model with order restored"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E3-D23-L05",
    cue: "rollout safety envelope",
    systemModel:
      "Reinforcement learning uses an agent policy to select actions from observed states, receives rewards through environment transitions and optimises accumulated return under exploration and safety constraints.",
    failurePattern:
      "A reward-maximising policy is treated as goal-correct and deployable even when reward shortcuts or unsafe exploration violate the real robot objective.",
    visualExplanation:
      "A rollout safety envelope links state observation, policy action, environment transition, reward, discounted return and a supervisor that blocks unsafe trials.",
    applicationTask:
      "Calculate a short discounted return and separate simulation reward performance from evidence needed for safe robot deployment.",
    terms: [
      [
        "Policy",
        "A rule or model mapping observed states to action choices or action distributions.",
        "A policy acts on its observation representation and may not know the true physical state."
      ],
      [
        "Reward",
        "A scalar feedback signal supplied after an action or transition to shape optimisation.",
        "Reward is a designed proxy and can omit safety, long-term or unobserved consequences."
      ],
      [
        "Discounted return",
        "A sum of future rewards weighted by increasing powers of a discount factor.",
        "Return ranks behaviour under the reward design; it does not independently certify safe or intended behaviour."
      ]
    ],
    entities: [
      ["input", "Observed robot state", "The policy's bounded representation of robot and environment conditions."],
      ["mechanism", "Policy action", "The action selected from the observed state under training or evaluation."],
      ["mechanism", "Transition and reward", "The next state and scalar feedback produced by the environment."],
      ["observation", "Supervised rollout evidence", "Returns, constraint violations, coverage and failure cases across episodes."],
      ["decision", "Simulation-bounded policy claim", "A policy claim retained inside verified simulation and safety limits."]
    ],
    relations: [
      ["maps", "the policy maps an observed robot state into an action", "directed", "many-to-one"],
      ["causes", "the policy action causes an environment transition under the simulator or plant dynamics", "directed", "one-to-many"],
      ["feeds-back", "transition reward feeds back into policy optimisation and future action selection", "directed", "many-to-one"],
      ["measures", "supervised rollout evidence measures return, violations and scenario coverage", "directed", "many-to-one"],
      ["invalidates", "reward hacking or unsafe trial behaviour invalidates the simulation-bounded policy claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Observation, action, reward, discount factor, episode boundary and simulator scope are declared."],
      ["operating-state", "Exploration occurs only inside an authorised environment with enforced safety constraints."],
      ["criterion", "Policy performance is repeatable across held-out scenarios with zero forbidden violations under the stated envelope."],
      ["boundary", "Reward shortcuts, unbounded exploration or simulation-to-reality gaps block robot deployment."]
    ],
    failure: [
      "The agent discovers a high-return shortcut that violates the physical task or safety constraint.",
      "Reward improves while real objective quality or safe clearance deteriorates.",
      "Reject deployment and repair the reward, constraints, simulator and held-out scenario evaluation."
    ],
    conceptualSteps: [
      "Declare observed state, action space, transition model, reward and episode boundary.",
      "Apply the policy to select an action inside an enforced exploration envelope.",
      "Record the transition and reward without replacing safety constraints with reward penalties.",
      "Compute return and inspect constraint violations across held-out rollout scenarios.",
      "Retain only a simulation-bounded claim until staged real-system evidence is authorised and verified."
    ],
    example: {
      scenario:
        "An episode yields rewards 1, 1 and 5 with discount factor 0.9.",
      givenLabel: "Reward sequence and discount",
      givenValue: "r=(1,1,5), gamma=0.9",
      givenUnit: null,
      reasoning: [
        "The discounted return is 1 + 0.9 times 1 + 0.9 squared times 5.",
        "The three contributions are 1, 0.9 and 4.05.",
        "Their sum is 5.95."
      ],
      outcome:
        "The episode's discounted return is 5.95 under the declared reward and discount.",
      criterion:
        "Accept the arithmetic when reward order and discount powers reproduce 5.95; assess policy quality separately.",
      verification:
        "Independently compute 0.9 squared, multiply by 5 and sum all three contributions."
    },
    counterexample: {
      scenario:
        "A navigation agent earns reward for forward progress and learns to scrape along a wall because collision contact is not constrained.",
      givenLabel: "Reward shortcut",
      givenValue: "progress rewarded, contact omitted",
      givenUnit: null,
      reasoning: [
        "Wall contact does not reduce the designed reward.",
        "The shortest high-progress behaviour can therefore include unsafe scraping.",
        "High return reflects the incomplete proxy rather than the full navigation objective."
      ],
      outcome:
        "The policy optimises the reward while violating an omitted physical constraint.",
      criterion:
        "Forbidden safety states require enforced constraints and explicit violation tests, not reward hope alone.",
      verification:
        "Replay held-out wall geometries while logging contact constraints independently of episode return."
    },
    misconception: {
      claim: "A reinforcement-learning policy with the highest reward has learned the intended robot behaviour.",
      mechanism:
        "The designed reward proxy is treated as a complete specification of task, safety and environment reality.",
      correction:
        "Audit reward incentives, enforce safety constraints and retain simulation-only claims until staged evidence supports more.",
      disconfirmingObservation:
        "The agent raises return by scraping a wall that the reward never penalised."
    },
    assessmentMoves: [
      "expanding the rollout safety envelope from state to return",
      "repairing the envelope after reward hacking appears",
      "screening policy claims with violation evidence",
      "finding the omitted constraint behind high return",
      "explaining reward optimisation separately from intended behaviour",
      "matching rollout conditions with supervisor actions",
      "tracing policy feedback across transition and reward",
      "replaying the episode with enforced constraints"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E3-D23-L06",
    cue: "device budget ledger",
    systemModel:
      "Edge AI places inference near robot sensors, while quantisation, pruning and other compression methods trade model size, latency, memory, energy and accuracy against a measured device target.",
    failurePattern:
      "A compressed model is called deployable because its file is smaller even though device latency, memory peaks, energy and task accuracy were not measured.",
    visualExplanation:
      "A device budget ledger connects the source model to an optimisation transform, target runtime, resource measurements and a release criterion.",
    applicationTask:
      "Evaluate a simple compression ratio and design an on-device verification across latency, memory, energy and accuracy.",
    terms: [
      [
        "Edge inference",
        "Model execution on or near the robot sensor and control hardware rather than a distant service.",
        "Local execution can reduce network dependence but remains subject to device timing, thermal and memory limits."
      ],
      [
        "Quantisation",
        "Representation of model parameters or activations with reduced numeric precision or range.",
        "Lower precision can change task outputs and must be evaluated on the exact runtime and hardware."
      ],
      [
        "Compression ratio",
        "The original model size divided by the compressed model size under one declared unit.",
        "Size reduction alone does not imply equal accuracy, lower latency or lower energy."
      ]
    ],
    entities: [
      ["input", "Versioned source model", "The evaluated model artefact, preprocessing and reference task metrics."],
      ["constraint", "Target device budgets", "Latency deadline, memory limit, energy allowance and supported operations."],
      ["mechanism", "Optimised edge runtime", "The quantised or compressed model compiled for the target device."],
      ["observation", "On-device benchmark evidence", "Measured latency distribution, memory, energy and task accuracy."],
      ["decision", "Bounded edge release", "A device-specific release decision tied to all declared budgets."]
    ],
    relations: [
      ["transforms", "compression and quantisation transform the versioned source model into an optimised runtime", "directed", "one-to-one"],
      ["constrains", "target device budgets constrain supported optimisation and execution choices", "directed", "one-to-many"],
      ["measures", "on-device benchmarks measure the optimised runtime under representative workloads", "directed", "many-to-one"],
      ["compares", "benchmark evidence compares compressed accuracy and resources with source-model baselines", "directed", "many-to-one"],
      ["invalidates", "budget overrun or material accuracy loss invalidates the bounded edge release", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Model versions, byte units, target hardware, runtime, workload and accuracy metric are declared."],
      ["operating-state", "Benchmarks include warm-up, representative load, thermal state and latency distribution."],
      ["criterion", "Accuracy, tail latency, memory and energy all meet their target-device acceptance limits."],
      ["boundary", "Desktop-only timing, file-size-only evidence or unsupported device operations block release."]
    ],
    failure: [
      "A four-times smaller file is assumed to be four-times faster and ready for the robot.",
      "Runtime conversion, memory transfer or accuracy loss breaks the actual device requirement.",
      "Reject the release until the exact artefact passes on-device resource and task benchmarks."
    ],
    conceptualSteps: [
      "Version the source model, preprocessing, target device, runtime and resource budgets.",
      "Apply one declared compression or quantisation transformation.",
      "Build and execute the exact optimised artefact on the target device.",
      "Measure accuracy, latency distribution, peak memory and energy against the source baseline.",
      "Release only the artefact and conditions that satisfy every declared device budget."
    ],
    example: {
      scenario:
        "A source model is 40 MB and the optimised model is 10 MB using the same decimal megabyte convention.",
      givenLabel: "Source and compressed model sizes",
      givenValue: "40 MB and 10 MB",
      givenUnit: "MB",
      reasoning: [
        "Compression ratio is original size divided by compressed size.",
        "Forty divided by ten equals four.",
        "The artefact is four-times smaller by this size measure, while latency and accuracy remain separate measurements."
      ],
      outcome:
        "The declared model-size compression ratio is exactly 4:1.",
      criterion:
        "Accept only the size claim from these inputs; require on-device evidence for speed, energy and accuracy claims.",
      verification:
        "Confirm both files use the same byte convention and independently divide 40 by 10."
    },
    counterexample: {
      scenario:
        "The 10 MB model is approved using average desktop inference time without running it on the robot processor.",
      givenLabel: "Mismatched benchmark",
      givenValue: "desktop average latency",
      givenUnit: null,
      reasoning: [
        "Desktop compute, memory and supported operators differ from the target device.",
        "Average latency conceals tail delays relevant to control timing.",
        "No measurement establishes the optimised runtime's behaviour on the robot."
      ],
      outcome:
        "The file-size result does not establish target-device deployability.",
      criterion:
        "Benchmark the exact artefact and workload on the exact target hardware against all budgets.",
      verification:
        "Run repeated on-device trials and record percentile latency, peak memory, energy and task accuracy."
    },
    misconception: {
      claim: "A model compressed by four times will run four times faster.",
      mechanism:
        "Storage size is treated as proportional to execution time despite operator, memory and hardware effects.",
      correction:
        "Report compression ratio as a size result and measure latency, memory, energy and accuracy separately.",
      disconfirmingObservation:
        "A smaller model invokes unsupported operators and runs slower after fallback on the target runtime."
    },
    assessmentMoves: [
      "balancing the device budget ledger from artefact to release",
      "reopening the ledger after desktop evidence is substituted",
      "screening edge-deployment claims across all budgets",
      "locating the hardware mismatch behind a timing failure",
      "explaining compression without assuming proportional speed",
      "matching device budgets to measured quantities",
      "tracing optimisation through runtime and benchmark evidence",
      "rerunning the release check on target hardware"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E3-D23-L07",
    cue: "release traceability chain",
    systemModel:
      "MLOps versions data, code, models and evaluation; robot integration adds a timed inference contract, uncertainty and bias monitoring, safe fallback and end-to-end verification under changing environments.",
    failurePattern:
      "A model is deployed from an untraceable artefact and treated as safe because offline accuracy is high while latency, uncertainty, population slices and fallback behaviour are unverified.",
    visualExplanation:
      "A release traceability chain links versioned evidence to the robot inference interface, runtime monitor, fallback transition and end-to-end safety decision.",
    applicationTask:
      "Define a traceable robot-ML release with a latency budget, uncertainty limit, bias slices, fallback state and rollback evidence.",
    terms: [
      [
        "Model lineage",
        "The traceable relationship among data, code, configuration, training run, model artefact and evaluation.",
        "A model filename or latest tag is not sufficient lineage for reproduction or rollback."
      ],
      [
        "Uncertainty envelope",
        "The declared input and output conditions within which model confidence and error evidence support use.",
        "A confidence score is not a safety guarantee and can be unreliable under distribution shift."
      ],
      [
        "Safe fallback",
        "A defined robot state or behaviour entered when inference timing, validity or monitored conditions leave their bounds.",
        "Fallback safety depends on verified detection, transition latency and physical outcome, not a software label alone."
      ]
    ],
    entities: [
      ["input", "Versioned ML release", "Immutable data, code, configuration, model, metrics and approval identifiers."],
      ["mechanism", "Robot inference contract", "Declared input schema, output meaning, timing budget and failure signalling."],
      ["constraint", "Runtime assurance monitor", "Checks for latency, input shift, uncertainty, slice performance and interface health."],
      ["observation", "End-to-end integration evidence", "Measured sensing-to-action timing, fallback transition and scenario results."],
      ["decision", "Safe robot-ML integration", "A reversible release decision bounded by lineage, monitoring and physical verification."]
    ],
    relations: [
      ["maps", "the robot inference contract maps versioned model inputs and outputs into the robot software interface", "directed", "one-to-many"],
      ["constrains", "the runtime assurance monitor constrains when learned outputs may influence robot action", "directed", "one-to-many"],
      ["routes", "out-of-envelope timing or uncertainty routes the robot into a safe fallback", "directed", "many-to-one"],
      ["supports", "end-to-end integration evidence supports a reversible safe robot-ML decision", "directed", "many-to-one"],
      ["invalidates", "broken lineage, biased failure slices or unverified fallback invalidate safe integration", "directed", "many-to-one"]
    ],
    conditions: [
      ["assumption", "Release lineage, interface schema, latency path, uncertainty rule, bias slices and fallback state are declared."],
      ["operating-state", "Runtime monitoring can withdraw learned-function authority and preserve a deterministic safe response."],
      ["criterion", "The exact release meets slice, timing, uncertainty and fallback criteria in end-to-end robot scenarios."],
      ["boundary", "Untraceable artefacts, distribution shift, missed timing or failed fallback block the integration release."]
    ],
    failure: [
      "Offline aggregate accuracy is used to authorise an unversioned model without end-to-end timing or fallback tests.",
      "The robot acts on late or out-of-distribution output and no reliable rollback evidence exists.",
      "Reject the release and restore the last verified configuration until lineage and full-path evidence pass."
    ],
    conceptualSteps: [
      "Bind the release to immutable data, code, configuration, model and evaluation lineage.",
      "Declare the robot inference contract, timing path, output meaning and failure signalling.",
      "Define uncertainty, shift and bias-slice monitors plus a deterministic fallback transition.",
      "Exercise the exact release in end-to-end scenarios and measure timing, slice outcomes and physical fallback.",
      "Authorise only a reversible, monitored release with a tested rollback target."
    ],
    example: {
      scenario:
        "A sequential robot path budgets 20 ms for sensing, 30 ms for inference, 10 ms for decision logic and 40 ms for actuation response.",
      givenLabel: "Sequential latency components",
      givenValue: "20, 30, 10, 40",
      givenUnit: "ms",
      reasoning: [
        "Under the stated sequential assumption, total latency is the sum of all four components.",
        "Twenty plus thirty plus ten plus forty equals 100 ms.",
        "Against a 120 ms deadline, the nominal arithmetic margin is 20 ms before jitter and measurement uncertainty."
      ],
      outcome:
        "The nominal sequential path totals 100 ms and leaves a 20 ms arithmetic margin to the 120 ms deadline.",
      criterion:
        "Accept timing only when measured tail latency and fallback transition remain within the full deadline, not from nominal sums alone.",
      verification:
        "Independently sum the components, subtract from 120 ms and compare with timestamped end-to-end trials."
    },
    counterexample: {
      scenario:
        "A release passes average offline accuracy but performs poorly for low-light images and has no tested fallback when inference exceeds its deadline.",
      givenLabel: "Hidden slice and timing failures",
      givenValue: "low-light errors, deadline overrun",
      givenUnit: null,
      reasoning: [
        "Aggregate accuracy hides a material environment slice.",
        "A late output can be stale even when its predicted class is correct.",
        "Without a verified fallback, monitor detection does not bound the robot's physical response."
      ],
      outcome:
        "The model metric passes while the integrated robot release remains unsafe and biased across conditions.",
      criterion:
        "Require defined slice, timing, uncertainty and fallback acceptance for the exact versioned release.",
      verification:
        "Replay low-light and deadline-fault scenarios while tracing version IDs, monitor transitions and physical outcomes."
    },
    misconception: {
      claim: "A model with high offline accuracy is ready for safe robot integration.",
      mechanism:
        "Aggregate model evaluation is substituted for lineage, timing, uncertainty, bias-slice, interface and fallback evidence.",
      correction:
        "Treat the learned model as one versioned component inside a monitored and reversibly verified robot system.",
      disconfirmingObservation:
        "Offline accuracy remains high while low-light failures and late inference drive unsafe robot actions."
    },
    assessmentMoves: [
      "building the release traceability chain from artefact to robot action",
      "restoring the chain after lineage and fallback fail",
      "screening integration claims across timing and bias slices",
      "localising the monitor gap behind an unsafe action",
      "explaining why model evidence is only one system layer",
      "matching release conditions to rollback and fallback",
      "tracing versions through inference, monitoring and physical evidence",
      "revalidating the exact release under fault injection"
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
      ["b-declare", ["r1"], ["c1"]],
      ["b-affine", ["r2"], ["c2"]],
      ["b-activate", ["r3"], ["c2"]],
      ["b-interpret", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-overclaim", ["r5"], ["c4"]],
      ["r-rescale", ["r1"], ["c1"]],
      ["r-recompute", ["r2", "r3"], ["c2"]],
      ["r-calibrate", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-forward", ["r1"], ["c1"]],
      ["b-loss", ["r2"], ["c2"]],
      ["b-gradient", ["r3"], ["c2"]],
      ["b-record", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-diverge", ["r5"], ["c4"]],
      ["r-restore", ["r1"], ["c1"]],
      ["r-update", ["r2", "r3"], ["c2"]],
      ["r-validate", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-patch", ["r1"], ["c1"]],
      ["b-position", ["r2"], ["c2"]],
      ["b-field", ["r3"], ["c2"]],
      ["b-slice", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-shift", ["r5"], ["c4"]],
      ["r-normalise", ["r1"], ["c1"]],
      ["r-refilter", ["r2", "r3"], ["c2"]],
      ["r-retest", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-tokenise", ["r1"], ["c1"]],
      ["b-attend", ["r2"], ["c2"]],
      ["b-context", ["r3"], ["c2"]],
      ["b-evaluate", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-reorder", ["r5"], ["c4"]],
      ["r-position", ["r1"], ["c1"]],
      ["r-reattend", ["r2", "r3"], ["c2"]],
      ["r-bound", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-observe", ["r1"], ["c1"]],
      ["b-transition", ["r2"], ["c2"]],
      ["b-return", ["r3"], ["c2"]],
      ["b-supervise", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-hack", ["r5"], ["c4"]],
      ["r-constrain", ["r1"], ["c1"]],
      ["r-reward", ["r2", "r3"], ["c2"]],
      ["r-replay", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-version", ["r1"], ["c1"]],
      ["b-budget", ["r2"], ["c2"]],
      ["b-benchmark", ["r3"], ["c2"]],
      ["b-compare", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-overrun", ["r5"], ["c4"]],
      ["r-retarget", ["r2"], ["c1"]],
      ["r-rebuild", ["r1", "r3"], ["c2"]],
      ["r-release", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-lineage", ["r1"], ["c1"]],
      ["b-monitor", ["r2"], ["c2"]],
      ["b-fallback", ["r3"], ["c2"]],
      ["b-verify", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-block", ["r5"], ["c4"]],
      ["r-rollback", ["r1"], ["c1"]],
      ["r-inject", ["r2", "r3"], ["c2"]],
      ["r-authorise", ["r4"], ["c3"]]
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
    throw new Error(`Missing D23 instruction move ${slot}.`);
  }
  const copy = [
    [
      `Assemble the ${source.cue} by carrying ${first} across ${second} into ${observed} while ${move}:`,
      `${accepted} follows only when the assembled ${source.cue} keeps ${first}, ${second} and ${observed} connected.`,
      `${accepted} does not follow when ${move} jumps over the ${second} limit visible in ${observed}.`,
      `Fix the active ${first} condition at the entrance to the ${source.cue}.`,
      `Insert ${second} before judging the meaning of ${observed}.`,
      `Carry ${first} across ${second} and collect ${observed} while ${move}.`,
      `Close the ${source.cue} only when ${observed} meets the criterion for ${accepted}.`
    ],
    [
      `Recover the disrupted ${source.cue} by working from ${observed} towards ${first} during ${move}:`,
      `The recovery is sound when ${observed} exposes the changed ${second} limit and permits ${accepted} to be retested.`,
      `The recovery is unsound when old ${first} handling is retained despite new ${observed}.`,
      `Hold the failed ${observed} fixed while opening the ${source.cue}.`,
      `Move from ${observed} through ${second} to the condition on ${first}.`,
      `Reconstruct the ${first} and ${second} path during ${move}.`,
      `Demand replacement ${observed} before reconsidering ${accepted}.`
    ],
    [
      `Challenge statements in the ${source.cue} about ${first}, ${second} and ${observed} while ${move}:`,
      `A supported ${accepted} explains how bounded ${second} carries ${first} into ${observed}.`,
      `An unsupported ${accepted} treats ${observed} as decisive after ${second} is out of bounds.`,
      `Tag each ${first} statement with its active ${source.cue} condition.`,
      `Ask whether ${second} can account for ${observed} while ${move}.`,
      `Discard any ${first} statement that reaches ${accepted} without ${observed}.`,
      `Retain the statements whose ${observed} actually bounds ${accepted}.`
    ],
    [
      `Diagnose the ${source.cue} discrepancy by moving from ${observed} through ${second} to ${first} while ${move}:`,
      `Diagnosis succeeds when ${observed} reveals which ${first} to ${second} relation failed.`,
      `Diagnosis fails when ${accepted} is withdrawn without a mechanism represented in ${observed}.`,
      `Circle the earliest discrepancy in ${observed} on the ${source.cue}.`,
      `Walk backwards from ${observed} across ${second} to ${first}.`,
      `Contrast the live ${second} route with the route disabled during ${move}.`,
      `Select the ${first} explanation that recreates ${observed}.`
    ],
    [
      `Teach the ${source.cue} by linking ${first}, ${second}, ${observed} and ${accepted} while ${move}:`,
      `Strong teaching names the ${first} limit, the ${second} mechanism and the measured ${observed}.`,
      `Weak teaching names ${first} and ${second} but never accounts for the change in ${observed}.`,
      `Anchor ${first} in the current ${source.cue} condition.`,
      `Show how ${second} modifies the evidence in ${observed}.`,
      `Demonstrate the ${first} to ${observed} connection through ${second} while ${move}.`,
      `Finish with the ${observed} test that limits ${accepted}.`
    ],
    [
      `Pair ${first} and ${second} conditions with ${observed} across the ${source.cue} while ${move}:`,
      `A valid pair states how ${second} transfers ${first} into measurable ${observed}.`,
      `An invalid pair assigns ${observed} to a condition outside the ${second} route.`,
      `Attach ${first} to the assumption governing the ${source.cue}.`,
      `Attach ${second} to the corresponding evidence in ${observed}.`,
      `Read each ${first} pair across ${second} towards ${accepted}.`,
      `Remove every pair whose expected ${observed} conflicts during ${move}.`
    ],
    [
      `Traverse the ${source.cue} graph from ${first} across ${second} into ${observed} while ${move}:`,
      `The chosen edge is valid when it transfers ${first} across ${second} into the needed ${observed}.`,
      `The chosen edge is invalid when it omits ${second} or conflicts with ${observed}.`,
      `Find ${first} at the graph entrance for the ${source.cue}.`,
      `Find the ${second} edge that governs ${observed}.`,
      `Traverse the active edge into ${observed} while ${move}.`,
      `Let ${observed} determine whether ${accepted} stays inside bounds.`
    ],
    [
      `Test the modified ${source.cue} state from ${first} to ${accepted} while ${move}:`,
      `The modified state is valid when ${second} produces the new ${observed} and limits ${accepted}.`,
      `The modified state is invalid when old ${observed} survives a changed ${first} condition.`,
      `Name the changed ${first} condition in the ${source.cue}.`,
      `Re-evaluate the influence of ${second} on ${observed}.`,
      `Carry the modified ${second} route into fresh ${observed}.`,
      `Reinstate ${accepted} only after ${observed} passes the closing test.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D23 instruction plan ${slot}.`);
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
        throw new Error(`Missing D23 relation endpoints ${index}.`);
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
        throw new Error(`Missing D23 condition binding ${index}.`);
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
    throw new Error(`Missing D23 ordering pattern ${source.variant}.`);
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
      modelKind: "state-graph",
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
          "bounded-robot-ai",
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
          "failed-robot-ai",
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

export const academyLessonTeachingProfileV2PlansE3D23 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE3D23 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE3D23,
    academyLessonTeachingProfileV2PlansE3D23
  );

export const academyLessonTeachingProfilesV2E3D23 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE3D23.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D23 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D23;
