import type { AcademyLessonTeachingProfileRegistry } from "../lessonTeachingProfileValidation";

export const academyLessonTeachingProfilesE3 = {
  "EML-E3-D17-L01": {
    systemModel: "A robot architecture allocates sensing, computation, actuation, power, structure and communication responsibilities across interfaces that must support mission and safe-state behaviour.",
    failurePattern: "Individually capable components can form an unusable robot when timing, power, mechanical mounting, data ownership or fault response is undefined at their interfaces.",
    visualExplanation: "A robot block architecture traces energy and information from battery and sensors through compute and actuators to physical motion, with safety paths overlaid.",
    applicationTask: "Partition a mobile-robot mission into components and interfaces, then challenge the architecture with loss of sensing, communication and actuator power."
  },
  "EML-E3-D17-L02": {
    systemModel: "Coordinate frames assign origins and bases to robot bodies and the environment, while rigid transformations preserve geometry as points and orientations change representation.",
    failurePattern: "A correct numeric pose becomes wrong when transform direction, frame order, handedness or active-versus-passive interpretation is reversed.",
    visualExplanation: "A frame tree places world, base, sensor and target axes around one physical point, with directed transforms and an inverse round trip.",
    applicationTask: "Transform a detected landmark from sensor coordinates into the robot and world frames, then recover the original sensor vector to verify convention and order."
  },
  "EML-E3-D17-L03": {
    systemModel: "Forward kinematics composes ordered joint transformations and link geometry to calculate an end-effector pose from known joint variables.",
    failurePattern: "A plausible end pose can be wrong when joint zero, axis direction, link parameter or multiplication order differs from the physical chain.",
    visualExplanation: "A serial robot shows joint axes, link frames and successive transforms culminating in a tool pose and reachable-path trace.",
    applicationTask: "Build forward kinematics for a planar two-joint arm, test zero and right-angle configurations and compare the pose with geometric construction."
  },
  "EML-E3-D17-L04": {
    systemModel: "Inverse kinematics finds joint states for a desired pose, while the Jacobian maps joint rates to task velocity and exposes singular or ill-conditioned directions.",
    failurePattern: "Selecting one inverse solution without joint or collision limits can be unsafe, and motion near singularity can demand unbounded joint speed.",
    visualExplanation: "A target pose connects to multiple joint solutions, with Jacobian velocity ellipses shrinking along a poorly controllable direction near singularity.",
    applicationTask: "Solve a planar inverse-kinematics target, compare feasible branches and evaluate Jacobian conditioning before commanding a nearby motion."
  },
  "EML-E3-D17-L05": {
    systemModel: "Robot dynamics relates joint acceleration to inertia, velocity coupling, gravity, friction and external loads under a declared coordinate and parameter model.",
    failurePattern: "A kinematically valid trajectory can exceed torque or lose tracking when payload inertia, gravity direction, friction or contact force is omitted.",
    visualExplanation: "A manipulator pose overlays mass properties, gravity, joint motion and external contact, feeding torque contributions into each actuator.",
    applicationTask: "Estimate joint torque for two robot poses and payloads, separate gravity and acceleration effects and compare the demand with a second static or energy check."
  },
  "EML-E3-D17-L06": {
    systemModel: "Actuators convert supplied energy into motion, while transmissions reshape torque, speed, reflected inertia, compliance and efficiency across the robot duty cycle.",
    failurePattern: "Meeting nominal torque at one operating point can still overheat the motor, saturate the drive or create backlash and compliance that defeat control.",
    visualExplanation: "A torque-speed envelope passes through a gearbox to the load, with duty points, efficiency, thermal limit and reflected inertia marked.",
    applicationTask: "Select a motor and transmission for a bounded joint duty, check continuous and peak operation and explain thermal, backlash and controllability margins."
  },
  "EML-E3-D17-L07": {
    systemModel: "Mobile robots obey wheel-contact constraints and manipulators obey joint geometry, while both must bound commanded motion around people, obstacles and stored energy.",
    failurePattern: "A collision-free geometric path can remain unsafe when slip, stopping distance, payload reach, pinch points or control loss is excluded.",
    visualExplanation: "A mobile base and arm share swept-volume, contact, braking and guarded-workspace overlays that distinguish commanded path from physical hazard envelope.",
    applicationTask: "Analyse one mobile or manipulation motion, calculate or measure its reachable hazard region and verify a stop or exclusion control under a fault."
  },
  "EML-E3-D18-L01": {
    systemModel: "A ROS 2 workspace builds packages into a distributed computation graph whose discovery, names, executables and quality-of-service policies govern data exchange.",
    failurePattern: "Packages can build and nodes can run while remapping, domain, namespace or discovery differences leave the expected graph disconnected.",
    visualExplanation: "A workspace tree expands into installed packages and a runtime graph, with discovery domain, namespaces and endpoint policies labelled.",
    applicationTask: "Inspect a small ROS 2 workspace and graph, trace how one executable is built and launched and diagnose a deliberately hidden or misnamed endpoint."
  },
  "EML-E3-D18-L02": {
    systemModel: "A ROS 2 node owns a bounded responsibility, publishes or subscribes on named topics and exchanges data through exact message-interface types.",
    failurePattern: "Matching topic names do not establish compatibility when message type, field semantics, units, timestamp or quality-of-service policy differs.",
    visualExplanation: "Publisher and subscriber nodes connect through a typed topic whose message fields, units, timestamp and endpoint policies are expanded.",
    applicationTask: "Define and inspect a command-to-state topic pair, verify type and semantics and inject one policy or unit mismatch to observe the failure."
  },
  "EML-E3-D18-L03": {
    systemModel: "Services provide bounded request-response work, actions manage long-running cancellable goals and lifecycle nodes separate configuration from active operation.",
    failurePattern: "Using a service for long work can block or time out, while an action or lifecycle component without cancellation and transition handling can retain unsafe activity.",
    visualExplanation: "Parallel sequence diagrams contrast service exchange, action goal-feedback-result-cancel flow and lifecycle transitions from unconfigured to active.",
    applicationTask: "Choose service or action semantics for a robot behaviour, define cancellation and failure responses and test activation before valid configuration."
  },
  "EML-E3-D18-L04": {
    systemModel: "URDF defines robot links, joints, geometry, inertial properties and frames, while Xacro generates repeated structures into a concrete robot description.",
    failurePattern: "A model can render correctly yet simulate or transform incorrectly when joint origin, axis, inertia, collision geometry or generated parameter differs from the physical robot.",
    visualExplanation: "A link-joint tree connects visual, collision and inertial elements to TF frames, with the expanded Xacro output compared against source parameters.",
    applicationTask: "Inspect or author a two-link robot model, expand its Xacro and verify joint motion, frame locations, collision shape and inertia against the intended geometry."
  },
  "EML-E3-D18-L05": {
    systemModel: "Gazebo integrates rigid-body physics, contact, environment and sensor plugins under a simulation clock whose parameters define the evidence boundary.",
    failurePattern: "A successful simulated behaviour can depend on unrealistic friction, perfect sensing, unstable time step or geometry that does not match the robot description.",
    visualExplanation: "A simulation stack connects robot model, world contact, physics step, sensor model, simulated clock and ROS observations with tunable uncertainty.",
    applicationTask: "Run or specify a Gazebo motion and sensor check, vary friction or noise and compare the simulated observation with a physical plausibility criterion."
  },
  "EML-E3-D18-L06": {
    systemModel: "ros2_control connects controller commands to hardware interfaces, while Nav2 composes localisation, costmaps, planning and control around simulated or real hardware.",
    failurePattern: "An integrated launch can appear healthy while interface names, update rates, frames or simulated-time settings prevent commands and observations from closing the loop.",
    visualExplanation: "A command path runs from Nav2 through controller manager and hardware interface to robot motion, then returns through sensors, TF and localisation.",
    applicationTask: "Trace one velocity command through an integrated simulation, verify every interface and timestamp and diagnose an injected frame or update-rate mismatch."
  },
  "EML-E3-D18-L07": {
    systemModel: "DDS transports typed ROS 2 data under policy contracts, while graph tools, logs, recorded data and tests preserve evidence from development through deployment.",
    failurePattern: "A distributed fault can disappear during ad hoc inspection when incompatible reliability, durability, history, clock or restart behaviour is not captured.",
    visualExplanation: "A deployment topology links DDS participants and policies to graph inspection, structured logs, recorded messages, automated tests and restart evidence.",
    applicationTask: "Diagnose a communication failure using graph and policy evidence, retain the reproducing data and add a deterministic test for restart or policy compatibility."
  },
  "EML-E3-D19-L01": {
    systemModel: "Probability assigns coherent belief to outcomes within a defined sample space and updates engineering decisions as observations narrow uncertainty.",
    failurePattern: "A probability statement loses meaning when its event, conditioning information or reference population is unspecified or mixed with measurement noise.",
    visualExplanation: "A sample-space diagram partitions possible outcomes, overlays observed evidence and shows probability mass moving among decision-relevant events.",
    applicationTask: "Define a fault-detection sample space, assign prior event probabilities and explain how one observation changes the probability of competing causes."
  },
  "EML-E3-D19-L02": {
    systemModel: "Bayes rule combines prior belief and likelihood of observed evidence, then normalises competing hypotheses into a posterior distribution.",
    failurePattern: "Ignoring base rates can make a rare fault seem likely after a positive test, even when false positives dominate the observed result.",
    visualExplanation: "A probability tree separates prior fault states and test outcomes, then recombines the matching branches into the posterior after evidence.",
    applicationTask: "Update the probability of a sensor fault from a diagnostic result, reconcile numerator and denominator branches and test sensitivity to the prior."
  },
  "EML-E3-D19-L03": {
    systemModel: "Noise models unpredictable variation, covariance records uncertainty scale and coupling and propagation maps that covariance through a transformation.",
    failurePattern: "Treating correlated errors as independent can understate output uncertainty, while a nonlinear transform can invalidate a wide-range linear approximation.",
    visualExplanation: "An uncertainty ellipse passes through a transformation and changes orientation and size according to the local Jacobian and input covariance.",
    applicationTask: "Propagate a two-variable covariance through a coordinate calculation, inspect cross-correlation and compare the linear estimate with sampled results."
  },
  "EML-E3-D19-L04": {
    systemModel: "A complementary filter combines sensors by frequency strength, while weighted fusion combines estimates according to stated uncertainty and independence assumptions.",
    failurePattern: "Simple averaging can double-count correlated information or give a drifting sensor excessive influence because equal weights do not represent trust.",
    visualExplanation: "Low-frequency and high-frequency sensor paths pass through complementary filters and rejoin beside an uncertainty-weighted estimate comparison.",
    applicationTask: "Fuse a noisy fast sensor with a stable slow sensor, vary the weighting or crossover and compare drift, noise and response delay."
  },
  "EML-E3-D19-L05": {
    systemModel: "A Kalman filter predicts state and covariance through a motion model, then corrects both using measurement innovation and its expected uncertainty.",
    failurePattern: "An estimate may look smooth while incorrect process or measurement covariance makes innovations inconsistent and confidence unjustifiably narrow.",
    visualExplanation: "A predict-update loop carries state and covariance to an innovation, gain, corrected estimate and residual-consistency check at every timestep.",
    applicationTask: "Run or calculate a one-dimensional Kalman update, change the noise assumptions and compare estimate, covariance and normalised innovation behaviour."
  },
  "EML-E3-D19-L06": {
    systemModel: "An extended Kalman filter linearises nonlinear motion and observation models around the current estimate using Jacobians before prediction and correction.",
    failurePattern: "A wrong Jacobian or estimate far from the valid linear region can create biased updates, non-positive covariance or divergence.",
    visualExplanation: "A curved nonlinear measurement relation is approximated by a local tangent whose Jacobian maps uncertainty into the EKF correction.",
    applicationTask: "Derive or verify one nonlinear sensor Jacobian, compare it with a finite-difference check and test filter behaviour from near and distant initial estimates."
  },
  "EML-E3-D19-L07": {
    systemModel: "Fusion validation compares estimates and declared covariance with held-out truth, innovations, timing and injected failures across representative operating conditions.",
    failurePattern: "Low average error can hide inconsistent confidence, timestamp bias, rare divergence or a failure mode that the estimator silently absorbs.",
    visualExplanation: "Truth and estimate traces are paired with covariance bounds, innovation statistics, timing offsets and labelled injected-fault intervals.",
    applicationTask: "Validate a fused trajectory over repeated runs, reconcile errors with uncertainty bounds and diagnose at least one timing or sensor-fault case."
  },
  "EML-E3-D20-L01": {
    systemModel: "Wheel encoders measure incremental rotation and odometry integrates wheel motion into pose, causing calibration, quantisation and slip errors to accumulate over distance.",
    failurePattern: "A locally smooth odometry path can drift far from truth when wheel radius, track width or contact assumptions are slightly wrong.",
    visualExplanation: "Encoder ticks feed wheel distances and differential-drive pose updates, while an error ribbon grows between odometry and ground-truth paths.",
    applicationTask: "Calibrate encoder distance and track width from bounded runs, integrate pose and compare drift for straight, turning and slip conditions."
  },
  "EML-E3-D20-L02": {
    systemModel: "Localisation estimates robot pose relative to landmarks or a map by combining motion prediction with observations and a prior over possible locations.",
    failurePattern: "Repeated geometry or weak landmark visibility can make several poses equally plausible even when the algorithm reports one confident location.",
    visualExplanation: "A map carries multiple pose hypotheses that narrow as landmark observations intersect predicted sensor geometry and motion constraints.",
    applicationTask: "Construct a landmark-localisation case, identify ambiguous poses and test how an additional observation or prior changes the result."
  },
  "EML-E3-D20-L03": {
    systemModel: "An occupancy map stores belief that spatial cells are occupied by combining sensor rays, poses and an inverse measurement model over repeated observations.",
    failurePattern: "Marking every range return as a wall ignores free space, beam width, pose error and dynamic objects, creating inflated or inconsistent obstacles.",
    visualExplanation: "Sensor rays traverse free cells to occupied endpoints while repeated uncertain poses update a grid of occupancy probabilities.",
    applicationTask: "Update a small occupancy grid from several range observations, distinguish free and occupied evidence and test sensitivity to pose uncertainty."
  },
  "EML-E3-D20-L04": {
    systemModel: "SLAM jointly estimates trajectory and map; a front end proposes observation constraints and a back end optimises the graph, including loop closures.",
    failurePattern: "A false loop closure can deform the entire map, while missing one allows drift to persist despite locally accurate scan alignment.",
    visualExplanation: "A pose graph grows through odometry and observation edges, then a loop-closure edge redistributes error across the optimised trajectory.",
    applicationTask: "Inspect a small SLAM graph, compare trajectories before and after loop closure and evaluate one candidate closure using independent evidence."
  },
  "EML-E3-D20-L05": {
    systemModel: "Graph and grid planners search connected collision-free states using accumulated cost and heuristic estimates shaped by map resolution and obstacle inflation.",
    failurePattern: "A mathematically shortest route can be physically unsafe or computationally wasteful when cell size, footprint, clearance cost or heuristic assumptions are wrong.",
    visualExplanation: "A cost grid shows obstacles, inflated regions, explored nodes, heuristic direction and the final path compared with a lower-clearance alternative.",
    applicationTask: "Run or trace a planner on two costmap resolutions, compare path cost and clearance and explain why the selected route changes."
  },
  "EML-E3-D20-L06": {
    systemModel: "Trajectory generation adds time, velocity and acceleration to a geometric path, while motion control tracks that reference within robot and actuator constraints.",
    failurePattern: "A collision-free path can demand impossible curvature, acceleration or stopping distance and cause tracking error or saturation.",
    visualExplanation: "A geometric path becomes a time-parameterised trajectory with velocity and acceleration profiles, then overlays commanded and actual robot motion.",
    applicationTask: "Time-parameterise a short mobile-robot path, enforce speed and acceleration limits and evaluate tracking error through its tightest turn."
  },
  "EML-E3-D20-L07": {
    systemModel: "A Nav2 mission integrates localisation, layered costmaps, planning, control and recovery into repeated goal attempts measured against explicit success criteria.",
    failurePattern: "One successful run can conceal brittle recovery, map sensitivity or intermittent localisation loss that emerges only across changed obstacles and repeated trials.",
    visualExplanation: "A mission timeline aligns behaviour-tree states, pose quality, costmap changes, planned path, controller output, recovery actions and outcome metrics.",
    applicationTask: "Execute or specify repeated Nav2 missions with one injected obstacle or localisation fault, then reconcile success, time, path error and recovery evidence."
  },
  "EML-E3-D21-L01": {
    systemModel: "A camera maps rays from three-dimensional scene points through a lens model onto sensor coordinates governed by focal length, principal point, exposure and perspective.",
    failurePattern: "Pixel position cannot be treated as physical position when depth, lens distortion, camera pose or image scale is unknown.",
    visualExplanation: "A pinhole projection carries a world point through camera coordinates and the image plane to a pixel, with intrinsic parameters and depth labelled.",
    applicationTask: "Project several known camera-frame points into an image, vary focal length or depth and verify the predicted pixel motion."
  },
  "EML-E3-D21-L02": {
    systemModel: "Pixels sample intensity in colour channels, colour spaces reorganise those channels and spatial filters combine neighbourhood values to alter noise and detail.",
    failurePattern: "A filter or colour threshold tuned on one image can erase edges, shift apparent brightness or fail under changed illumination.",
    visualExplanation: "An image patch is expanded into channel values and filter kernels, then compared across smoothing, edge-preserving and colour-space outputs.",
    applicationTask: "Apply or analyse two filters and colour representations on a noisy image, then quantify the retained edge and changed noise."
  },
  "EML-E3-D21-L03": {
    systemModel: "Camera calibration estimates intrinsic parameters and lens distortion from known geometry, then validates how accurately projected points return to observed pixels.",
    failurePattern: "A low training reprojection error can conceal poor coverage, wrong target scale or degraded performance near image edges and different focus settings.",
    visualExplanation: "Calibration views cover the image plane while distorted observations, corrected projections and residual vectors expose spatial error.",
    applicationTask: "Calibrate or inspect a camera dataset, plot residuals across the field and test the model on held-out target views."
  },
  "EML-E3-D21-L04": {
    systemModel: "Projective geometry represents points and lines with homogeneous coordinates so camera and world transformations retain perspective relationships up to scale.",
    failurePattern: "Normalising a homogeneous point incorrectly or mixing transform direction can create a finite-looking coordinate with the wrong frame or scale.",
    visualExplanation: "World and camera frames connect through a homogeneous transform before perspective division maps a spatial point onto the image plane.",
    applicationTask: "Transform and project a planar feature between world and image coordinates, then use an inverse or known correspondence to check frame order."
  },
  "EML-E3-D21-L05": {
    systemModel: "A feature detector locates repeatable image structure, a descriptor encodes its neighbourhood and matching tests appearance together with geometric consistency.",
    failurePattern: "Nearest descriptor distance alone accepts repetitive or viewpoint-inconsistent matches and can corrupt every downstream pose estimate.",
    visualExplanation: "Detected keypoints produce descriptor links between two images, followed by ratio rejection and a geometric model that removes outliers.",
    applicationTask: "Match features between two views, compare raw and filtered correspondences and inspect whether the retained set supports one coherent geometry."
  },
  "EML-E3-D21-L06": {
    systemModel: "Depth and pose arise from stereo, motion, active sensing or known geometry by combining multiple rays and transformations with explicit scale and degeneracy.",
    failurePattern: "Low-parallax, repeated or nearly planar observations can yield an unstable pose even when a solver returns a precise numeric result.",
    visualExplanation: "Two camera rays triangulate a point while baseline, parallax and pose uncertainty show why some viewing geometries constrain depth poorly.",
    applicationTask: "Estimate depth or pose from two views, vary baseline or feature layout and report residual error and any degenerate configuration."
  },
  "EML-E3-D21-L07": {
    systemModel: "Robot vision converts calibrated images into timed detections or poses that influence motion through confidence, latency and a defined safe fallback.",
    failurePattern: "A high offline score can still create unsafe actions when false detections, delayed frames, environmental shift or missing uncertainty reaches the controller.",
    visualExplanation: "A perception-action loop links exposure, inference, geometric conversion, confidence gate, robot command, observed outcome and fallback path.",
    applicationTask: "Test a vision-triggered robot decision across lighting and latency changes, record false outcomes and verify the fallback threshold."
  },
  "EML-E3-D22-L01": {
    systemModel: "Data preparation preserves provenance, units, labels, missingness and exclusions before exploratory summaries reveal distributions, relationships and defects.",
    failurePattern: "Cleaning based on knowledge of the desired result can remove inconvenient cases, leak target information or conceal a broken acquisition channel.",
    visualExplanation: "A provenance pipeline separates raw data, validation, missing-value decisions and derived tables before distributions and anomaly views are produced.",
    applicationTask: "Audit a sensor dataset, document every exclusion or transformation and compare key distributions before and after preparation."
  },
  "EML-E3-D22-L02": {
    systemModel: "Regression maps features to a continuous target, while residuals reveal bias, changing variance, nonlinear structure and influential observations beyond an average score.",
    failurePattern: "A low mean error can hide systematic underprediction in a critical range or dependence on a few high-leverage samples.",
    visualExplanation: "Predicted versus observed values sit beside residuals plotted against prediction, feature range and sample identity.",
    applicationTask: "Fit or inspect a baseline regression, reconcile its metric with residuals and test whether error changes across the operating range."
  },
  "EML-E3-D22-L03": {
    systemModel: "A classifier produces categories or scores, and a decision threshold converts scores into actions with distinct false-positive and false-negative consequences.",
    failurePattern: "Accuracy can remain high under class imbalance while the rare failure class is missed or an unsuitable threshold drives costly actions.",
    visualExplanation: "Score distributions for two classes feed a movable threshold, confusion counts and a cost-sensitive operating point.",
    applicationTask: "Evaluate a fault classifier at several thresholds, reconcile every metric to confusion counts and select a threshold from stated consequences."
  },
  "EML-E3-D22-L04": {
    systemModel: "Clustering groups unlabelled observations according to representation, scale, distance and algorithm assumptions rather than a known target.",
    failurePattern: "Visually separated clusters can disappear after rescaling or represent operating conditions rather than meaningful system states.",
    visualExplanation: "The same observations are plotted under alternative scaling and cluster counts, with assignment stability and distance geometry exposed.",
    applicationTask: "Cluster a small sensor dataset under two scalings, compare stability and explain whether each group has defensible engineering meaning."
  },
  "EML-E3-D22-L05": {
    systemModel: "Features encode model inputs, dataset splits create evaluation boundaries and metrics summarise decision performance only when target information remains outside training.",
    failurePattern: "Leakage occurs when future values, target-derived features or related samples cross the split and inflate held-out performance.",
    visualExplanation: "A data lineage diagram separates feature creation, grouped train and validation partitions, locked test data and metric calculation.",
    applicationTask: "Review a modelling pipeline for leakage, redesign its split around the deployment unit and reconcile the chosen metric with decision costs."
  },
  "EML-E3-D22-L06": {
    systemModel: "Bias captures systematic model limitation, variance captures sensitivity to sampled data and reproducibility fixes every data, code and training input affecting the result.",
    failurePattern: "A complex model can memorise accidental detail, while an unversioned training path makes apparent improvement impossible to reproduce or attribute.",
    visualExplanation: "Training and validation curves across model complexity sit beside repeated-fit variation and a versioned experiment record.",
    applicationTask: "Compare simple and flexible models across repeated splits, diagnose bias or variance and rebuild the selected result from recorded inputs."
  },
  "EML-E3-D22-L07": {
    systemModel: "Time-series models preserve temporal order, anomaly detectors compare observations with a declared baseline and sensor-data ML accounts for mode, drift and correlated samples.",
    failurePattern: "Randomly splitting adjacent samples leaks temporal context and can make routine operating transitions appear as anomalies or future prediction skill.",
    visualExplanation: "A chronological sensor record marks operating modes, train and test boundaries, baseline envelope, drift and detected deviations.",
    applicationTask: "Build or assess an anomaly baseline using an ordered split, then test it across a mode change and a simulated sensor drift."
  },
  "EML-E3-D23-L01": {
    systemModel: "A neural network composes affine transformations and nonlinear activations, with learned weights mapping input features to a bounded prediction.",
    failurePattern: "Increasing hidden capacity can memorise training examples, amplify poorly scaled inputs or produce confident outputs outside the training domain.",
    visualExplanation: "Input features pass through weighted neurons and activations to an output, with parameter count and activation ranges visible.",
    applicationTask: "Trace a small network forward pass, vary one input feature and inspect whether activation and output behaviour remain plausible."
  },
  "EML-E3-D23-L02": {
    systemModel: "Deep learning adjusts many parameters by propagating loss gradients through layers under an optimiser, learning rate, initialisation and regularisation scheme.",
    failurePattern: "Training can stall, diverge or become irreproducible when gradients vanish, scale explodes or stochastic settings and data order are unrecorded.",
    visualExplanation: "A training loop connects batches, forward loss, backward gradients, parameter update and validation curve across repeated epochs.",
    applicationTask: "Compare two learning-rate or regularisation settings, retain loss histories and explain convergence, overfitting and reproducibility evidence."
  },
  "EML-E3-D23-L03": {
    systemModel: "A convolutional network shares local filters across image positions, building spatial features through stride, padding, pooling and receptive-field growth.",
    failurePattern: "Large stride or inappropriate padding can discard small targets or create border behaviour that an aggregate image metric does not reveal.",
    visualExplanation: "A filter window moves across an image into feature maps while stride, padding and receptive field are traced through successive layers.",
    applicationTask: "Calculate feature-map dimensions for a compact vision model and inspect detection behaviour for small and edge-located objects."
  },
  "EML-E3-D23-L04": {
    systemModel: "A transformer combines token representations through attention, positional information and feed-forward layers so each sequence element can use selected context.",
    failurePattern: "Attention cost, tokenisation, context limit or spurious correlation can make a sequence model brittle despite coherent-looking output.",
    visualExplanation: "Token embeddings and positions feed attention weights that connect sequence elements before contextual representations reach the output head.",
    applicationTask: "Inspect attention for a short engineering sequence, change token order or context and identify which prediction dependencies remain stable."
  },
  "EML-E3-D23-L05": {
    systemModel: "Reinforcement learning selects actions from state observations to maximise accumulated reward through interaction with an environment.",
    failurePattern: "A poorly specified reward can encourage unsafe shortcuts, while exploratory actions acceptable in simulation may be unacceptable on hardware.",
    visualExplanation: "An agent-environment loop shows observation, action, transition, reward and return, with safety constraints outside the reward channel.",
    applicationTask: "Define a small navigation reward, identify an exploitable shortcut and add a simulation-only constraint and evaluation scenario that exposes it."
  },
  "EML-E3-D23-L06": {
    systemModel: "Edge AI places inference near the sensor, trading numerical precision and model size against measured latency, memory, energy and task accuracy.",
    failurePattern: "Compression can preserve average accuracy while damaging a rare safety class or exceeding hardware memory and timing at runtime.",
    visualExplanation: "A deployment frontier compares original, quantised and pruned models across accuracy, latency, memory and energy on the target device.",
    applicationTask: "Benchmark two compressed model variants on target-like hardware, reconcile resource measurements and check class-specific accuracy before selection."
  },
  "EML-E3-D23-L07": {
    systemModel: "Robotic MLOps versions data, code, model and evaluation, then monitors inference timing, shift, uncertainty and fallback behaviour inside the deployed loop.",
    failurePattern: "A versioned model artefact is not a safe capability when training provenance, operating limits, bias, runtime monitoring or deterministic fallback is missing.",
    visualExplanation: "A lifecycle runs from authorised data and training through registry, robot deployment, monitoring, fallback, incident evidence and controlled update.",
    applicationTask: "Prepare a deployment record for one learned robot component, verify latency and changed-condition behaviour and define a monitored fallback trigger."
  },
} as const satisfies AcademyLessonTeachingProfileRegistry;

export default academyLessonTeachingProfilesE3;
