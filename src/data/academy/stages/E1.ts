import {
  buildAcademyStageContent,
  type AcademyStageUnitSeed
} from "../authoring";
import { academyLessonTeachingProfilesE1 } from "../lessonTeachingProfiles/E1";

const e1Seeds = [
  {
    unitId: "EML-E1-D04",
    focuses: [
      "Differential calculus describes local change: a derivative is the limiting ratio of output change to input change and its unit is the output unit divided by the input unit.",
      "Integral calculus accumulates a rate or density across an interval; the definite integral is both a signed area and the limit of increasingly fine weighted sums.",
      "Multivariable calculus separates how an output changes with each input through partial derivatives, then combines sensitivities with a stated direction or uncertainty model.",
      "An ordinary differential equation relates a quantity to one or more time derivatives and requires both a governing relationship and sufficient initial or boundary conditions.",
      "Linear algebra organises coupled equations and transformations using vectors and matrices; eigenvectors retain direction under a transformation and eigenvalues reveal scale, natural modes and stability trends.",
      "An inverse function reverses a one-to-one mapping on a stated domain, and inverse differentiation relates its local slope to the reciprocal slope of the original function at the corresponding point.",
      "Probability models uncertain outcomes, statistics interprets sampled evidence, numerical methods approximate unsolved relations and optimisation searches a defined objective under constraints."
    ],
    formulaKeys: ["derivative", "integral", "partialSensitivity", "firstOrderStep", "eigen", "inverseDerivative", "mean"]
  },
  {
    unitId: "EML-E1-D05",
    focuses: [
      "Kinematics describes position, velocity and acceleration, while Newtonian mechanics connects acceleration to the vector sum of forces acting on a bounded body.",
      "Statics enforces force and moment balance, dynamics admits acceleration and momentum tracks mass in motion so impacts and changing motion can be reconciled.",
      "Work transfers energy through force over displacement, power is the rate of energy transfer and rotation adds angular speed, torque and rotational inertia.",
      "Oscillation exchanges stored kinetic and potential energy, vibration adds forcing and damping, and waves carry disturbances through space with frequency, wavelength and speed.",
      "Electric charge creates electric fields, moving charge produces current and magnetic effects, and electromagnetic interactions underpin motors, sensors and communications.",
      "Thermodynamics tracks energy and entropy across a boundary, heat transfer describes conduction, convection and radiation, and fluid mechanics relates pressure, flow and momentum.",
      "Material behaviour connects atomic and microstructural mechanisms to stiffness and failure, while sensors and actuators convert between physical domains with finite range and loss."
    ],
    formulaKeys: ["force", "force", "power", "oscillation", "coulomb", "heatConduction", "stress"]
  },
  {
    unitId: "EML-E1-D06",
    focuses: [
      "Digital computers represent information as bits, combine them with Boolean logic and execute instructions through processors, memory and input-output interfaces.",
      "A command-line shell invokes programs with explicit arguments while paths, permissions and streams define where files are found and how data moves between processes.",
      "Git stores a content-addressed history of snapshots; commits, branches and merges are graph operations that preserve provenance when their boundaries are understood.",
      "A data format defines syntax and meaning for stored values, while an application interface defines how one component requests and receives bounded behaviour from another.",
      "Reproducible computation pins code, inputs, configuration and execution steps so a result can be rebuilt and compared rather than merely trusted.",
      "A network moves framed data between addressed endpoints, while secure computing minimises authority, validates boundaries and keeps untrusted input separate from executable instructions.",
      "Maintainable documentation explains purpose, constraints, setup, interfaces, tests and decisions so later changes can be reviewed without reconstructing intent from code alone."
    ],
    formulaKeys: [null, null, null, null, null, "timing", null]
  },
  {
    unitId: "EML-E1-D07",
    focuses: [
      "Programming turns an algorithm into explicit data, control flow and functions; Python provides a readable first environment for variables, conditions, loops and decomposition.",
      "C exposes memory and hardware-oriented control, while modern C++ adds stronger abstraction and ownership tools that must still respect object lifetime and resource boundaries.",
      "A data structure organises values for particular operations, an algorithm transforms them and complexity describes how time or storage grows with input size.",
      "Object-oriented design groups state with behaviour, while functional design favours explicit inputs, returned outputs and limited mutation; both are tools rather than identities.",
      "Debugging narrows a discrepancy to a cause using observation and controlled experiments, while deterministic tests preserve the failing input and expected behaviour.",
      "Software architecture allocates responsibilities and interfaces; a state machine makes permitted states, events, transitions and rejected behaviour explicit.",
      "Concurrency permits overlapping work, networking crosses process boundaries and secure coding treats timing, shared state, input validation and least authority as first-class design concerns."
    ],
    formulaKeys: [null, null, null, null, null, null, "timing"]
  },
  {
    unitId: "EML-E1-D08",
    focuses: [
      "A design sketch encodes geometry, constraints and intent so later parameter changes preserve the required relationships rather than only the original shape.",
      "A parametric CAD model uses named dimensions, features and references to express design intent, while avoiding fragile dependencies and impossible parameter combinations.",
      "An engineering drawing uses agreed views, line conventions, dimensions, notes and revision information to communicate a part without requiring access to its modelling software.",
      "Limits bound permissible size, fits describe the resulting clearance or interference and a tolerance stack predicts the range of an assembled functional gap.",
      "Geometric dimensioning and tolerancing controls form, orientation and location relative to datums that represent how a part is functionally established.",
      "Metrology selects an instrument and method whose resolution, range and uncertainty can support the tolerance decision without false precision.",
      "A manufacturable parametric mount connects functional interfaces, load paths, clearances, process limits and inspectable dimensions in one controlled model."
    ],
    formulaKeys: [null, null, null, "toleranceStack", null, null, "stress"]
  }
] satisfies AcademyStageUnitSeed[];

export const academyStageE1 = buildAcademyStageContent(
  "E1",
  e1Seeds,
  academyLessonTeachingProfilesE1
);

export default academyStageE1;
