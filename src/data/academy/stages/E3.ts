import {
  buildAcademyStageContent,
  type AcademyStageUnitSeed
} from "../authoring";
import { academyLessonTeachingProfilesE3 } from "../lessonTeachingProfiles/E3";

const e3Seeds = [
  {
    unitId: "EML-E3-D17",
    focuses: [
      "A robot combines structure, actuation, sensing, computation, power and communication within an architecture that allocates functions, interfaces and safe states.",
      "A coordinate frame defines an origin and basis, while a rigid transformation carries position and orientation between frames without changing the physical point represented.",
      "Forward kinematics computes end position and orientation from joint variables and known geometry through an ordered chain of transformations.",
      "Inverse kinematics finds joint variables for a desired pose, while a Jacobian maps joint rates to task-space velocity and reveals singular or poorly conditioned motion.",
      "Robot dynamics relates motion to inertia, Coriolis effects, gravity, friction and applied forces or torques, with assumptions chosen for the control and sizing decision.",
      "Actuators convert energy to motion and transmissions reshape torque, speed, inertia and compliance, so selection must include duty, thermal limits and controllability.",
      "Mobile robots constrain body motion through wheel contact, manipulators position tools through joints and both require physical safeguards around people and the environment."
    ],
    formulaKeys: [null, "rigidTransform", "rigidTransform", "jacobian", "force", "power", "robot"]
  },
  {
    unitId: "EML-E3-D18",
    focuses: [
      "A ROS 2 workspace contains packages that form an executable computation graph; discovery, quality of service and names determine how distributed components find and exchange data.",
      "A node owns a bounded responsibility, a topic carries asynchronous typed messages and an interface definition makes the data contract visible across languages and processes.",
      "A service handles a bounded request-response exchange, an action handles long-running cancellable work and lifecycle behaviour makes configuration and activation explicit.",
      "URDF describes robot links, joints, geometry and inertial properties, while Xacro generates repeated or parameterised structures without hiding the resulting model.",
      "Gazebo simulates physics, sensors and environments, but contact, noise, timing and model parameters must be checked against the decision being made.",
      "ros2_control connects commands and hardware interfaces, Nav2 composes localisation and planning, and integrated simulation exposes interface, frame and timing failures before hardware.",
      "DDS transports ROS 2 data, while graph inspection, logs, tests, recorded data and controlled deployment isolate distributed faults and preserve reproducibility."
    ],
    formulaKeys: [null, "timing", "timing", "inertia", "timing", "robot", "timing"]
  },
  {
    unitId: "EML-E3-D19",
    focuses: [
      "Probability represents uncertain outcomes inside a defined sample space, allowing engineering belief to be updated without pretending uncertainty is measurement noise alone.",
      "Bayes rule combines a prior model with likelihood of observed evidence to produce a posterior, while the normalising evidence term keeps probabilities coherent.",
      "Noise is unpredictable variation under a stated model, covariance expresses scale and coupling of uncertainty and propagation tracks how transformations reshape it.",
      "A complementary filter combines sensors by frequency strength, and weighted fusion combines estimates according to explicit trust rather than simply averaging every value.",
      "A Kalman filter alternates model prediction with measurement correction, weighting each through covariance while retaining an estimate and its uncertainty.",
      "An extended Kalman filter linearises nonlinear models around the current estimate, making Jacobian correctness and operating region part of the evidence boundary.",
      "Fusion validation checks innovations, consistency, drift, timing and failure injection so a smooth estimate is not mistaken for a truthful one."
    ],
    formulaKeys: [
      "probability",
      "bayes",
      "uncertainty",
      "estimate",
      "kalmanUpdate",
      "extendedKalmanUpdate",
      null
    ]
  },
  {
    unitId: "EML-E3-D20",
    focuses: [
      "Wheel encoders estimate travelled motion and odometry integrates it into pose, but slip, calibration error and integration make uncorrected position drift grow.",
      "Localisation estimates pose relative to a map or reference using motion and observations, with ambiguity, observability and prior uncertainty stated explicitly.",
      "An occupancy map represents the belief that spatial cells are occupied, using sensor geometry and inverse measurement assumptions rather than treating every return as a wall.",
      "SLAM estimates trajectory and map together; a front end proposes constraints, a back end optimises them and loop closure corrects accumulated drift when a place is recognised.",
      "Graph and grid planners search collision-free alternatives using cost and heuristic structure, but map resolution and cost design determine what shortest actually means.",
      "Trajectory generation adds time, velocity and acceleration to a path, while motion control tracks it within actuator, curvature and safety constraints.",
      "A Nav2 mission integrates localisation, costmaps, planning, control and recovery; repeatable benchmarks count success, time, path error and failure handling over multiple runs."
    ],
    formulaKeys: ["robot", "estimate", null, null, "pathCost", "derivative", "ratio"]
  },
  {
    unitId: "EML-E3-D21",
    focuses: [
      "A camera projects three-dimensional rays onto a two-dimensional sensor; focal length, principal point, exposure and perspective determine how geometry becomes pixels.",
      "Pixels sample intensity through colour channels, colour spaces separate useful properties and spatial filters trade noise reduction, edge preservation and localisation.",
      "Camera calibration estimates intrinsic parameters and distortion from known geometry, then validates residual reprojection error across the intended field and focus range.",
      "Projective geometry relates points, lines and planes across camera and world frames using homogeneous coordinates and transformations with explicit scale ambiguity.",
      "A feature detector finds repeatable image structures, a descriptor encodes their neighbourhood and matching requires ratio, geometry and outlier tests rather than nearest distance alone.",
      "Depth can come from stereo, motion, structure or active sensing, while pose estimation aligns measured image geometry with a known spatial model and reports degeneracy.",
      "Robot vision converts detections into actions, so latency, false results, uncertainty, environment shift and safe fallback behaviour must be verified in the whole loop."
    ],
    formulaKeys: ["pinhole", null, "pinhole", "rigidTransform", "featureMatchRatio", "pinhole", "metric"]
  },
  {
    unitId: "EML-E3-D22",
    focuses: [
      "Data preparation defines provenance, units, labels, missing values and exclusions, while exploratory analysis reveals distributions and defects before a model can conceal them.",
      "Regression predicts a continuous target and residuals expose systematic error, changing variance and outliers that a single average metric can hide.",
      "Classification predicts categories or scores, and a decision threshold converts scores into actions with different false-positive and false-negative consequences.",
      "Clustering groups observations without target labels, so scaling, distance, chosen cluster count and stability determine whether a group has useful engineering meaning.",
      "Feature engineering represents information for the model, splits preserve an honest evaluation boundary, metrics encode decision costs and leakage lets future or target information cross that boundary.",
      "Bias describes systematic model limitation, variance describes sensitivity to sampled data, overfitting learns accidental detail and reproducibility fixes the full data-to-result path.",
      "Time-series methods preserve order, anomaly detection identifies deviations from a stated baseline and sensor-data ML must account for drift, calibration, operating mode and correlated samples."
    ],
    formulaKeys: ["ratio", "linear", "metric", null, "metric", null, "mean"]
  },
  {
    unitId: "EML-E3-D23",
    focuses: [
      "A neural network composes weighted affine transformations with nonlinear activations, learning parameters from examples while retaining all ordinary data and evaluation risks.",
      "Deep learning trains many representation layers through gradient-based optimisation, so loss shape, scale, initialisation, regularisation and compute influence both convergence and reproducibility.",
      "A convolutional network shares local filters across an image, building spatial features while stride, padding, receptive field and augmentation affect resolution and invariance.",
      "A transformer uses attention to combine context across sequence positions, with tokenisation, positional information, compute cost and data scope limiting engineering use.",
      "Reinforcement learning selects actions to maximise accumulated reward from interaction, but reward design, exploration and unsafe trial behaviour separate simulation study from deployable control.",
      "Edge AI places inference near the sensor, while quantisation, pruning and compression trade accuracy for latency, memory and energy under a measured deployment target.",
      "MLOps versions data, code, models and evaluation; robotics integration adds timing and fallback, while safety, bias and uncertainty bound claims under changing environments."
    ],
    formulaKeys: ["neuron", "gradientDescent", "metric", null, null, "compression", null]
  }
] satisfies AcademyStageUnitSeed[];

export const academyStageE3 = buildAcademyStageContent(
  "E3",
  e3Seeds,
  academyLessonTeachingProfilesE3
);

export default academyStageE3;
