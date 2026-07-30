import type { AcademyLessonTeachingProfileRegistry } from "../lessonTeachingProfileValidation";

export const academyLessonTeachingProfilesE1 = {
  "EML-E1-D04-L01": {
    systemModel: "Differential calculus models instantaneous sensitivity by taking the limiting ratio of output change to input change at a specified operating point.",
    failurePattern: "A derivative can be evaluated mechanically while its sign, unit, domain or distinction from an average rate remains incompatible with the physical trend.",
    visualExplanation: "A curve carries a secant through two nearby points that converges to a tangent, with slope units retained beside the shrinking input interval.",
    applicationTask: "Differentiate a position or calibration function, predict the derivative's sign and scale, then compare it with a centred finite-difference estimate."
  },
  "EML-E1-D04-L02": {
    systemModel: "Integral calculus accumulates a rate or density over an interval by summing increasingly narrow contributions with sign and bounds preserved.",
    failurePattern: "Treating an integral as unsigned area can reverse net change, while omitting the integration interval leaves the accumulated quantity undefined.",
    visualExplanation: "Signed rectangles under a rate curve become narrower until their sum approaches the shaded definite integral between labelled limits.",
    applicationTask: "Integrate a time-varying power or flow trace over a bounded interval and confirm the accumulated energy or quantity using a numerical sum."
  },
  "EML-E1-D04-L03": {
    systemModel: "A multivariable model assigns separate partial sensitivities to coupled inputs and combines them only after holding conditions and perturbation direction are declared.",
    failurePattern: "Changing several inputs during a partial-derivative estimate confounds their effects and can hide interaction or an invalid local linear approximation.",
    visualExplanation: "A response surface shows independent input axes, two tangent directions, a gradient arrow and contour spacing that reveals unequal sensitivities.",
    applicationTask: "Estimate how a thermal output changes with ambient temperature and heater power separately, then compare the linear prediction with one combined perturbation."
  },
  "EML-E1-D04-L04": {
    systemModel: "An ordinary differential equation relates system state to its time derivatives, parameters, inputs and enough initial conditions to select one trajectory.",
    failurePattern: "A correct differential law can still yield an indeterminate or wrong response when an initial state, forcing term or parameter unit is missing.",
    visualExplanation: "A state trajectory begins at a labelled initial condition and follows a vector field whose direction changes with state, input and model parameter.",
    applicationTask: "Form a first-order dynamic model for cooling or motor speed, state its initial condition and compare an analytic or numerical trajectory with expected limits."
  },
  "EML-E1-D04-L05": {
    systemModel: "Linear algebra represents coupled equations and transformations with matrices, while eigenvectors identify directions whose orientation is retained and eigenvalues set their scale.",
    failurePattern: "A matrix result loses engineering meaning when rows, columns or coordinate bases are exchanged, or when an eigenvalue is interpreted without its associated mode.",
    visualExplanation: "A grid and several vectors pass through a matrix transformation; invariant directions remain aligned while their lengths change by labelled eigenvalues.",
    applicationTask: "Solve a small coupled system, test one candidate eigenpair by substitution and explain what its invariant direction means for the model."
  },
  "EML-E1-D04-L06": {
    systemModel: "An inverse function reverses a one-to-one mapping on a restricted domain, and its local slope is reciprocal to the original slope at corresponding points.",
    failurePattern: "Inverting a non-unique mapping without choosing a branch creates multiple outputs, while taking a reciprocal at zero slope produces an invalid derivative.",
    visualExplanation: "A function graph and its reflection across the line of equality connect corresponding points and show reciprocal tangent slopes on the permitted branch.",
    applicationTask: "Restrict a sensor mapping to a one-to-one range, derive its inverse and verify both value recovery and the reciprocal local slope."
  },
  "EML-E1-D04-L07": {
    systemModel: "Quantitative decision methods connect uncertain samples, numerical approximations and constrained objectives to a declared estimate, error measure and feasible region.",
    failurePattern: "An optimiser or statistic can appear authoritative while sampling bias, numerical convergence, objective choice or an omitted constraint controls the reported answer.",
    visualExplanation: "A workflow links sampled data to distribution summaries, a numerical model, an objective surface, constraint boundaries and a checked candidate solution.",
    applicationTask: "Estimate a parameter from noisy observations, compare two numerical resolutions and optimise a simple design variable while reporting uncertainty and active constraints."
  },
  "EML-E1-D05-L01": {
    systemModel: "Kinematics describes position, velocity and acceleration in a reference frame, while Newton's second law connects acceleration to the vector sum of external forces.",
    failurePattern: "Mixing scalar speed with signed velocity or omitting a force from the free-body boundary yields motion that conflicts with the chosen frame.",
    visualExplanation: "A moving body is shown beside position, velocity and acceleration plots and a free-body diagram whose resultant force aligns with acceleration.",
    applicationTask: "Model a rover accelerating on level ground, draw all external forces, predict motion direction and reconcile the force result with measured velocity change."
  },
  "EML-E1-D05-L02": {
    systemModel: "Statics balances forces and moments for zero acceleration, dynamics permits changing motion and momentum accounts for mass carried through an interaction.",
    failurePattern: "A body can satisfy force balance yet rotate when moments are omitted, and an impact estimate fails when momentum direction or external impulse is ignored.",
    visualExplanation: "One diagram compares static force and moment equilibrium with a dynamic impulse-momentum timeline for the same bounded body.",
    applicationTask: "Check a bracket for translational and rotational equilibrium, then analyse a separate cart impulse using a signed momentum balance and an independent unit check."
  },
  "EML-E1-D05-L03": {
    systemModel: "Work transfers energy through force along displacement, power measures transfer rate and rotational systems relate torque, angular motion and stored kinetic energy.",
    failurePattern: "Multiplying force by total path regardless of direction or using rotational speed without unit conversion can produce a plausible but incorrect power value.",
    visualExplanation: "An energy-flow diagram links linear work and rotational work to time histories of force, torque, speed, power and stored energy.",
    applicationTask: "Calculate shaft power for a motor duty point, include a transmission loss and verify the result by comparing energy delivered over a measured interval."
  },
  "EML-E1-D05-L04": {
    systemModel: "Oscillation exchanges kinetic and potential energy, damping dissipates it, forcing supplies it and waves transport disturbances through space with frequency and wavelength.",
    failurePattern: "A resonant response can be mistaken for harmless steady behaviour when damping, forcing frequency or measurement duration is not represented.",
    visualExplanation: "A mass-spring response, energy exchange plot and travelling wave share labelled amplitude, period, phase, damping envelope and resonance region.",
    applicationTask: "Measure or simulate a damped oscillation, estimate its period and decay, then vary forcing frequency to identify the evidence of resonance."
  },
  "EML-E1-D05-L05": {
    systemModel: "Electric charge creates fields and potential, moving charge forms current and magnetic interactions couple current, force and changing flux in devices.",
    failurePattern: "Applying an electrostatic or magnetic rule without its geometry, direction or sign convention can reverse the predicted force or violate energy behaviour.",
    visualExplanation: "Field lines, charge motion and a current-carrying conductor are connected to force directions and induced voltage through a common spatial coordinate frame.",
    applicationTask: "Predict the direction and relative scale of force in a simple coil or conductor case, then check the prediction with a simulation or measured polarity."
  },
  "EML-E1-D05-L06": {
    systemModel: "Thermodynamics balances energy across a system boundary, heat transfer provides transport mechanisms and fluid mechanics relates pressure, velocity and momentum through a control volume.",
    failurePattern: "Confusing temperature with heat or omitting mass flow and boundary work can make an energy balance appear closed while a major transfer remains uncounted.",
    visualExplanation: "A control volume carries arrows for mass, heat and work beside conduction, convection and fluid-pressure profiles with consistent sign directions.",
    applicationTask: "Draw an energy boundary around a cooled component or flowing duct, estimate the dominant transfer and identify an observation that would disconfirm the assumed mechanism."
  },
  "EML-E1-D05-L07": {
    systemModel: "Material microstructure governs stiffness, yielding and fracture, while sensors and actuators use material effects to convert energy between mechanical, electrical, thermal or optical domains.",
    failurePattern: "A nominal material property or transducer sensitivity can fail in use when temperature, loading direction, hysteresis, saturation or fatigue lies outside the evidence.",
    visualExplanation: "A cross-domain chain links microstructure and stress-strain behaviour to a transduction mechanism, finite operating range, losses and observable output.",
    applicationTask: "Compare two materials or transducers for a bounded duty, state the governing property limits and design one test for hysteresis, overload or environmental sensitivity."
  },
  "EML-E1-D06-L01": {
    systemModel: "A digital computer encodes state in bits, evaluates Boolean logic and moves instructions and data among processor, memory and input-output interfaces.",
    failurePattern: "A value interpreted with the wrong bit width, signedness or logic convention can change meaning even though the stored binary pattern is unchanged.",
    visualExplanation: "A datapath follows a binary input through a logic operation, processor register, memory location and output interface with bit widths shown at each boundary.",
    applicationTask: "Translate a small unsigned value between binary, hexadecimal and decimal, apply a Boolean mask and verify the resulting bit pattern by hand."
  },
  "EML-E1-D06-L02": {
    systemModel: "A command-line process resolves an executable and explicit arguments within a working directory, then reads and writes through permission-controlled paths and streams.",
    failurePattern: "A command that depends on an implicit directory, shell expansion or hidden permission may succeed locally but target the wrong file or fail elsewhere.",
    visualExplanation: "A process diagram links prompt, working directory, executable, argument vector, standard streams, file paths and permission checks before any output is produced.",
    applicationTask: "Run a read-only file inspection from two working directories, record the resolved paths and redirect output explicitly without relying on an unstated shell location."
  },
  "EML-E1-D06-L03": {
    systemModel: "Git stores content-addressed snapshots connected by parent links, while branches name movable commit tips and merges reconcile divergent histories.",
    failurePattern: "Treating a branch as a folder or a commit as a mutable save can obscure ancestry, overwrite unrelated work or produce a merge without understood provenance.",
    visualExplanation: "A commit graph shows two branches diverging from a common parent, adding independent snapshots and joining through a merge with both parents retained.",
    applicationTask: "Inspect a small repository graph, identify each branch tip and common ancestor, then describe the exact snapshots a proposed merge would combine."
  },
  "EML-E1-D06-L04": {
    systemModel: "A data format defines serialised syntax and field semantics, while an application interface defines the request, response, error and version contract between components.",
    failurePattern: "Syntactically valid data can still violate an interface when units, required fields, ordering assumptions or version meaning differ across the boundary.",
    visualExplanation: "A producer serialises a typed object, passes it through a versioned interface and reaches a consumer that validates schema, meaning and failure responses.",
    applicationTask: "Define a compact sensor record and an interface that consumes it, then test missing units, an unknown field and an incompatible version without silent coercion."
  },
  "EML-E1-D06-L05": {
    systemModel: "Reproducible computation binds source revision, input data, configuration, dependency versions, command and expected output into a rebuildable evidence chain.",
    failurePattern: "A result that depends on mutable input, an unrecorded environment variable or a manual step cannot be independently rebuilt even if its final file is preserved.",
    visualExplanation: "A provenance graph converges code, data, configuration and environment into one command, then branches to output, checksum and comparison with the accepted result.",
    applicationTask: "Rebuild one calculation from a clean stated starting point, record all inputs and versions and compare the new output with the retained reference."
  },
  "EML-E1-D06-L06": {
    systemModel: "Networked computing packages data for addressed endpoints across layered protocols, while security constrains identity, authority, input handling and exposure at each boundary.",
    failurePattern: "A reachable service can become unsafe when it trusts unauthenticated peers, parses unbounded input or runs with authority unrelated to its required function.",
    visualExplanation: "A layered exchange maps application message, transport endpoint and network address across a trust boundary with validation, authentication and least-privilege controls.",
    applicationTask: "Trace a telemetry message from sender to receiver, list every trust decision and propose bounded handling for malformed, oversized or unauthorised input."
  },
  "EML-E1-D06-L07": {
    systemModel: "A maintainable workflow keeps purpose, setup, environment, commands, interfaces, tests and design decisions aligned with the versioned system they describe.",
    failurePattern: "Documentation becomes harmful when copied setup steps, obsolete paths or unverified examples contradict the current executable behaviour.",
    visualExplanation: "A documentation map connects user goal to prerequisites, setup, command, expected result, troubleshooting evidence, tests and the source revision each statement describes.",
    applicationTask: "Audit one setup or run guide against the live project, repair a stale assumption in the proposed text and identify the test that verifies the instruction."
  },
  "EML-E1-D07-L01": {
    systemModel: "A Python program transforms explicit values through expressions, control flow and functions, with each name bound to a defined object and observable result.",
    failurePattern: "A beginner program can appear correct for one input while hidden type conversion, an unhandled branch or mutation of shared data changes other cases.",
    visualExplanation: "A source-order trace table records each statement, variable value, condition outcome, function call and printed result for a small Python program.",
    applicationTask: "Write a short Python function that classifies sensor readings, trace it manually and test normal, boundary and invalid inputs against declared outcomes."
  },
  "EML-E1-D07-L02": {
    systemModel: "C maps operations closely to typed memory and object lifetime, while modern C++ adds abstractions that manage ownership without removing hardware and resource constraints.",
    failurePattern: "An out-of-bounds access, dangling reference, signed conversion or double ownership can compile successfully yet corrupt state or fail unpredictably.",
    visualExplanation: "A memory-lifetime diagram links stack objects, dynamic resources, pointers, references and a C++ owner whose construction and destruction bound valid access.",
    applicationTask: "Review a small buffer-processing routine, annotate every object's type and lifetime and replace one unsafe ownership or bounds assumption with a checked design."
  },
  "EML-E1-D07-L03": {
    systemModel: "A data structure organises values for particular access and update operations, while an algorithm's time and storage growth depend on input size and structure choice.",
    failurePattern: "Selecting a familiar container without operation costs can turn a bounded lookup into repeated full scans or create memory growth that violates the target platform.",
    visualExplanation: "Array, linked, stack, queue, tree and hash layouts sit beside operation paths whose step counts expand as the number of stored items grows.",
    applicationTask: "Compare two structures for a waypoint lookup workload, count dominant operations for several input sizes and justify the choice using time and memory needs."
  },
  "EML-E1-D07-L04": {
    systemModel: "Object-oriented design assigns state and invariants to responsible objects, whereas functional design composes explicit inputs and returned outputs with controlled mutation.",
    failurePattern: "A class with hidden shared state or a nominally pure function that changes external data makes behaviour depend on call order and weakens test isolation.",
    visualExplanation: "Two equivalent designs contrast collaborating stateful objects with a pipeline of pure transformations, marking ownership and side effects at every boundary.",
    applicationTask: "Model a motor-command limiter in both object-oriented and functional forms, then identify which state, invariants and tests each representation makes visible."
  },
  "EML-E1-D07-L05": {
    systemModel: "Debugging narrows observed behaviour to a causal discrepancy through controlled probes, while a deterministic test fixes the input, expected output and repeatable setup.",
    failurePattern: "Changing several suspected causes at once or testing only the repaired happy path can hide the true defect and allow the original failure to return.",
    visualExplanation: "A fault-isolation tree moves from failing observation through competing hypotheses and discriminating checks to a minimal reproducer retained as a regression test.",
    applicationTask: "Take a deliberately failing calculation, reduce it to the smallest input, test one hypothesis at a time and preserve the corrected case as an automated assertion."
  },
  "EML-E1-D07-L06": {
    systemModel: "Software architecture partitions responsibilities behind explicit interfaces, and a state machine defines permitted states, events, guarded transitions and rejected actions.",
    failurePattern: "Scattered implicit state can accept the same event differently depending on call history, leaving timeout, reset and invalid transitions untestable.",
    visualExplanation: "A component boundary diagram feeds events into a labelled state graph with guards, actions, terminal states and explicit rejection paths.",
    applicationTask: "Specify a device controller with idle, running and fault states, enumerate every event-state pair and test both authorised transitions and rejected commands."
  },
  "EML-E1-D07-L07": {
    systemModel: "Concurrent software interleaves tasks over shared resources and networks, so synchronisation, message boundaries, validation and least authority shape observable behaviour.",
    failurePattern: "A race, deadlock, stale message or unchecked remote input can make outcomes depend on timing or grant a peer more control than the protocol requires.",
    visualExplanation: "Parallel execution lanes show shared-state access, lock ordering and message exchange across a trust boundary, including timeout and malformed-input branches.",
    applicationTask: "Analyse two tasks updating a shared sensor snapshot, construct a failing interleaving and redesign the exchange with bounded ownership and validated messages."
  },
  "EML-E1-D08-L01": {
    systemModel: "A design sketch captures functional geometry through constraints, datums, dimensions and relations so later changes preserve intent rather than only appearance.",
    failurePattern: "An under-constrained sketch can shift unexpectedly, while conflicting constraints may freeze geometry that cannot accommodate a required parameter change.",
    visualExplanation: "A profile overlays geometric entities, constraint symbols, driving dimensions, fixed datums and remaining degrees of freedom highlighted for inspection.",
    applicationTask: "Sketch a symmetric mounting plate from functional hole and edge requirements, fully constrain it and verify that one driving dimension changes the intended features only."
  },
  "EML-E1-D08-L02": {
    systemModel: "A parametric CAD model builds ordered features from stable references and named parameters whose permitted combinations define a family of valid geometry.",
    failurePattern: "Referencing transient edges or allowing impossible parameter combinations makes downstream features fail when an upstream dimension changes.",
    visualExplanation: "A feature dependency graph links origin planes, sketches, extrusions, holes and fillets while stable references are distinguished from generated edges.",
    applicationTask: "Build or inspect a simple bracket model, vary its width and thickness across valid bounds and repair any feature that depends on fragile geometry."
  },
  "EML-E1-D08-L03": {
    systemModel: "An engineering drawing projects three-dimensional geometry into agreed views and communicates dimensions, material, finish, scale and revision without requiring the source model.",
    failurePattern: "A part can be geometrically complete yet ambiguous to manufacture when a feature lacks a locating dimension, hidden detail or applicable note.",
    visualExplanation: "Orthographic views align front, top and side projections with section detail, dimensions, line conventions, title block and revision information.",
    applicationTask: "Create or review a drawing for a small mount, trace how every functional feature is sized and located and identify any dependence on unstated model access."
  },
  "EML-E1-D08-L04": {
    systemModel: "Limits define allowable feature sizes, fits combine mating limits into clearance or interference and a tolerance stack propagates variations to a functional gap.",
    failurePattern: "Adding nominal dimensions while ignoring tolerance direction can predict assembly at the centre value but permit binding or excessive play at an extreme.",
    visualExplanation: "A dimension chain places minimum and maximum feature limits along an assembly path and maps them to the resulting worst-case gap interval.",
    applicationTask: "Calculate the worst-case clearance for a shaft, spacer and housing chain, then revise one tolerance if the permitted interval crosses the functional boundary."
  },
  "EML-E1-D08-L05": {
    systemModel: "Geometric dimensioning and tolerancing controls feature form, orientation and location relative to functional datum features that establish the inspection frame.",
    failurePattern: "A feature-control frame can be syntactically present yet meaningless when datum precedence, controlled geometry or material condition does not match assembly function.",
    visualExplanation: "A part view highlights primary, secondary and tertiary datums, the derived datum reference frame and a tolerance zone around the controlled feature.",
    applicationTask: "Choose functional datums for a locating plate, interpret one position or orientation control and describe how an inspector would establish the reference frame."
  },
  "EML-E1-D08-L06": {
    systemModel: "Metrology matches instrument range, resolution, uncertainty and access to the geometric characteristic and tolerance decision stated on a drawing.",
    failurePattern: "A high-resolution display does not make a method capable when alignment, contact force, datum setup or uncertainty consumes the available tolerance.",
    visualExplanation: "An inspection chain connects drawing requirement, datum setup, instrument contact, reading, uncertainty contribution and conforming or nonconforming decision.",
    applicationTask: "Select a method to verify a hole spacing or thickness, justify measurement capability and record how setup and uncertainty affect the acceptance result."
  },
  "EML-E1-D08-L07": {
    systemModel: "A manufacturable parametric mount integrates load path, interfaces, clearances, process access, controlled dimensions and inspection features in one change-tolerant definition.",
    failurePattern: "A visually convincing mount can fail because a fastener is inaccessible, a fillet blocks assembly, a tolerance stack closes clearance or the load bypasses intended support.",
    visualExplanation: "An annotated mount combines interface datums, bolt load paths, tool envelopes, clearance zones, manufacturing direction and inspection dimensions.",
    applicationTask: "Develop or critique a parametric sensor mount, vary its controlling dimensions and retain evidence for load path, assembly access, clearance and inspectability."
  },
} as const satisfies AcademyLessonTeachingProfileRegistry;

export default academyLessonTeachingProfilesE1;
