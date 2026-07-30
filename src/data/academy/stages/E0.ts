import {
  buildAcademyStageContent,
  type AcademyStageUnitSeed
} from "../authoring";
import { academyLessonTeachingProfilesE0 } from "../lessonTeachingProfiles/E0";

const e0Seeds = [
  {
    unitId: "EML-E0-D01",
    focuses: [
      "Technical learning is a cycle of retrieval, explanation, purposeful practice, feedback and later review; each pass should leave an observable change in what the learner can explain or do.",
      "Retrieval practice attempts to reconstruct knowledge before looking, while spaced review revisits it after delay so that later recall, not immediate familiarity, is tested.",
      "Problem decomposition separates a broad need into bounded functions, interfaces, unknowns and tests whose results can be combined without losing the original system purpose.",
      "A scientific engineering question identifies a variable, a comparison and an observation that could disprove the proposed explanation rather than merely confirm it.",
      "A fair experiment varies the intended factor, controls credible confounders, repeats observations and records enough context for another person to challenge the conclusion.",
      "A technical note is a dated evidence record that keeps the question, assumptions, method, raw observations, interpretation and next decision distinguishable.",
      "Technical documents communicate through conventions: a diagram shows relationships, a datasheet states bounded characteristics and a procedure states actions and acceptance conditions."
    ],
    formulaKeys: [null, null, null, null, "ratio", null, null]
  },
  {
    unitId: "EML-E0-D02",
    focuses: [
      "Numerical fluency combines exact arithmetic, estimation and an order-of-magnitude check so a calculator result is compared with a credible physical range.",
      "Fractions and ratios compare quantities, percentages scale a ratio by one hundred and scientific notation separates significant digits from a power-of-ten scale.",
      "The SI defines base quantities and coherent derived units so a value carries both magnitude and physical meaning across calculations and measurements.",
      "A dimension identifies the physical kind of a quantity; dimensional homogeneity requires both sides of a valid physical equation to have matching dimensions.",
      "Measurement resolution is the smallest displayed or distinguished change, while significant figures communicate justified precision rather than every calculator digit.",
      "Error is a difference from a reference under a stated convention, while measurement uncertainty expresses the bounded doubt that remains after known corrections.",
      "Calibration compares an instrument with a traceable reference across its range and records the model, residuals, uncertainty and conditions needed to use the correction."
    ],
    formulaKeys: ["sum", "ratio", null, "stress", "ratio", "uncertainty", "linear"]
  },
  {
    unitId: "EML-E0-D03",
    focuses: [
      "An algebraic expression uses symbols to represent quantities and operations; each symbol must retain a defined meaning, unit and permitted range.",
      "Rearranging an equation applies the same reversible operation to both sides so the target quantity is isolated without changing the relationship.",
      "A function maps each permitted input to an output, and its graph exposes trend, intercept, slope, range and regions where a model no longer applies.",
      "Geometry describes shape and distance, while trigonometry relates sides and angles in triangles used to resolve physical components.",
      "A coordinate system defines an origin and axes, a vector carries magnitude and direction, and a reference frame states the observer relative to which components are expressed.",
      "A matrix transformation maps vector components between representations; the order of transformations matters because matrix multiplication is generally not commutative.",
      "A complex number combines real and imaginary components, allowing magnitude and phase to represent oscillatory electrical, signal and control behaviour compactly."
    ],
    formulaKeys: ["linear", "linear", "derivative", "vector", "vector", "rigidTransform", "complexMagnitude"]
  }
] satisfies AcademyStageUnitSeed[];

export const academyStageE0 = buildAcademyStageContent(
  "E0",
  e0Seeds,
  academyLessonTeachingProfilesE0
);

export default academyStageE0;
