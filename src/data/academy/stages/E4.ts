import {
  buildAcademyStageContent,
  type AcademyStageUnitSeed
} from "../authoring";
import { academyLessonTeachingProfilesE4 } from "../lessonTeachingProfiles/E4";

const e4Seeds = [
  {
    unitId: "EML-E4-D24",
    focuses: [
      "A stakeholder need describes a valued outcome in context, while a requirement translates it into an unambiguous, measurable and verifiable statement with a unique identity.",
      "Functional decomposition separates what the system must do before choosing implementation, and an architecture allocates those functions to interacting elements and boundaries.",
      "An interface defines exchanged matter, energy or information, while a trade study compares feasible alternatives against weighted criteria, uncertainty and disqualifying constraints.",
      "Risk management links uncertain events to consequence and action, FMEA examines failure modes and effects, and hazard analysis begins from sources of potential harm and unsafe scenarios.",
      "Safety engineering applies layered risk controls and explicit safe states, while reliability models the probability of maintaining required function for stated conditions and time.",
      "Verification asks whether the design meets its requirements, validation asks whether it meets the intended need and experimental design makes the evidence discriminating and repeatable.",
      "Configuration identifies the controlled system baseline, change control evaluates authorised modifications and technical readiness reviews trace requirements, risks, tests and unresolved limitations."
    ],
    formulaKeys: [null, null, "tradeScore", "riskScore", "reliability", "ratio", null]
  },
  {
    unitId: "EML-E4-D25",
    focuses: [
      "Project planning connects scope, dependencies, resources, risks and acceptance gates, while a decision record preserves alternatives, evidence, authority and consequences.",
      "A technical report leads from question and method to results, uncertainty and bounded conclusions, with data and computation retained so the evidence can be reproduced.",
      "A design review is a structured challenge of requirements, architecture, calculations, risks and evidence, not a presentation whose purpose is to approve work automatically.",
      "Engineering ethics protects people and truthful decision-making, sustainability considers lifecycle consequences and professional responsibility requires working within competence and authority.",
      "Portfolio evidence connects a precise capability claim to a reviewable artefact, context, personal contribution, result and limitation without inflating participation into mastery.",
      "Capstone integration closes interfaces across mechanics, electronics, firmware, software and evidence, then releases a reproducible baseline that another person can inspect and run.",
      "An interview demonstration tells a concise technical story, performs or explains a defensible result, diagnoses a limitation and distinguishes verified fact from assumption and future work."
    ],
    formulaKeys: ["sum", null, null, null, null, null, null]
  }
] satisfies AcademyStageUnitSeed[];

export const academyStageE4 = buildAcademyStageContent(
  "E4",
  e4Seeds,
  academyLessonTeachingProfilesE4
);

export default academyStageE4;
