import type { AcademyLessonTeachingProfileRegistry } from "../lessonTeachingProfileValidation";

export const academyLessonTeachingProfilesE4 = {
  "EML-E4-D24-L01": {
    systemModel: "A stakeholder need states a valued outcome in context, and a requirement translates that need into a uniquely identified, measurable and verifiable obligation.",
    failurePattern: "A requirement that embeds a preferred solution, vague quality or missing operating condition can be impossible to verify or can exclude better architectures.",
    visualExplanation: "A traceability chain connects stakeholder, contextual need, measurable requirement, acceptance measure and planned verification evidence.",
    applicationTask: "Rewrite a vague mobile-robot need as bounded requirements, define each acceptance measure and check that no statement prescribes an unnecessary implementation."
  },
  "EML-E4-D24-L02": {
    systemModel: "Functional decomposition defines what the system must do, while architecture allocates those functions to interacting physical, software and human elements.",
    failurePattern: "Allocating components before clarifying functions can leave duplicated responsibility, unowned behaviour or interfaces that cannot satisfy the original need.",
    visualExplanation: "A function tree maps into an architecture of elements, with allocation links and exchanged flows revealing gaps and overlaps.",
    applicationTask: "Decompose a robot mission into functions, allocate them to architecture elements and resolve one missing or duplicated responsibility."
  },
  "EML-E4-D24-L03": {
    systemModel: "An interface controls exchanged matter, energy or information, and a trade study compares feasible alternatives against weighted criteria, uncertainty and disqualifying constraints.",
    failurePattern: "A weighted score can conceal an infeasible interface or reverse under small assumption changes when hard constraints and uncertainty are treated as ordinary preferences.",
    visualExplanation: "Alternative architectures pass through interface constraints before entering a weighted decision matrix with sensitivity ranges around the ranking.",
    applicationTask: "Compare two sensing or actuation architectures, eliminate any interface violation and test whether the remaining ranking survives plausible weight changes."
  },
  "EML-E4-D24-L04": {
    systemModel: "Risk management links uncertain events to likelihood, consequence and action, while FMEA starts from component failure modes and hazard analysis starts from potential harm.",
    failurePattern: "A numerical risk score can hide catastrophic low-frequency harm, common causes or a failure sequence outside the selected component boundary.",
    visualExplanation: "A bow-tie view connects hazard causes, failure modes, preventive controls, top event, consequences and recovery controls with accountable actions.",
    applicationTask: "Analyse one robot energy or motion hazard using both FMEA and scenario reasoning, then assign controls and evidence without relying on score alone."
  },
  "EML-E4-D24-L05": {
    systemModel: "Safety engineering layers elimination, prevention, detection and mitigation around explicit safe states, while reliability models required function over stated time and conditions.",
    failurePattern: "A reliable component arrangement can still be unsafe, and a safety control can be unreliable when common power, diagnostic or environmental dependencies are hidden.",
    visualExplanation: "A fault tree and reliability block diagram share components but lead to distinct safety consequences and required-function outcomes.",
    applicationTask: "Define a safe state and reliability boundary for a robot subsystem, identify a common-cause dependency and propose a test of the layered controls."
  },
  "EML-E4-D24-L06": {
    systemModel: "Verification compares implementation with requirements, validation compares the resulting system with intended use and experimental design makes both evidence sets discriminating.",
    failurePattern: "Passing a scripted verification can coexist with failed user need when coverage, environment, sample size or acceptance criteria do not represent intended operation.",
    visualExplanation: "A V-model links needs and requirements to corresponding validation and verification activities, with experimental variables and acceptance gates attached.",
    applicationTask: "Create separate verification and validation tests for one autonomy requirement, define controlled variables and state the evidence needed for each decision."
  },
  "EML-E4-D24-L07": {
    systemModel: "Configuration management identifies the controlled baseline, change control evaluates proposed differences and readiness review reconciles requirements, risks, tests and unresolved limitations.",
    failurePattern: "A tested artefact is not release-ready when the reviewed configuration differs from the built system or an approved change invalidates prior evidence.",
    visualExplanation: "A baseline graph connects identified hardware, software and documents to change requests, affected evidence, review decisions and readiness status.",
    applicationTask: "Assemble a small release baseline, trace one proposed change through impacted requirements and tests and decide readiness with explicit open limitations."
  },
  "EML-E4-D25-L01": {
    systemModel: "An executable project plan orders work packages through dependencies, assigns resources and risk responses, and uses acceptance gates plus decision records to control authorised technical choices.",
    failurePattern: "A detailed schedule can remain unactionable when dependencies, decision owners or acceptance conditions are absent and assumptions change without a record.",
    visualExplanation: "A dependency network links work packages and gates, with decision records attached where alternatives, evidence and authority change the plan.",
    applicationTask: "Plan a bounded capstone increment, identify its critical dependencies and create one decision record for a material technical choice."
  },
  "EML-E4-D25-L02": {
    systemModel: "A technical report carries the reader from question and method through results, uncertainty and bounded conclusion, with data and computation retained for reproduction.",
    failurePattern: "A polished report becomes advocacy when it omits failed trials, transformation steps, uncertainty or evidence that limits the preferred conclusion.",
    visualExplanation: "A report evidence map links every result figure to raw data, method, calculation, uncertainty statement and the conclusion it supports.",
    applicationTask: "Draft or audit a short engineering result section, trace each claim to reproducible evidence and state one limitation that changes interpretation."
  },
  "EML-E4-D25-L03": {
    systemModel: "A design review challenges requirements, architecture, calculations, interfaces, risks and evidence through structured questions and recorded dispositions.",
    failurePattern: "A presentation can be mistaken for review completion when concerns lack owners, evidence responses, closure criteria or authority to accept residual risk.",
    visualExplanation: "A review flow connects submitted evidence to reviewer challenge, finding, owner, corrective action, verification and formal disposition.",
    applicationTask: "Prepare one design-review slice for a robot subsystem, invite a disconfirming challenge and close or retain the resulting finding with evidence."
  },
  "EML-E4-D25-L04": {
    systemModel: "Professional engineering decisions combine duty to people, truthful evidence, competence and authority with lifecycle impacts on resources, communities and environment.",
    failurePattern: "Schedule or commercial pressure can turn uncertainty into an unsupported assurance, shift harm outside the project boundary or conceal work beyond personal competence.",
    visualExplanation: "A decision map places affected people, evidence, authority, lifecycle consequences, conflicts and escalation paths around the proposed action.",
    applicationTask: "Analyse an engineering decision with safety and sustainability consequences, identify duty and authority boundaries and document the ethical escalation."
  },
  "EML-E4-D25-L05": {
    systemModel: "Portfolio evidence links a precise capability claim to context, personal contribution, reviewable artefact, verified result and acknowledged limitation.",
    failurePattern: "Team participation, intent or a polished screenshot can be overstated as mastery when authorship, decision responsibility and reproducible outcome are unclear.",
    visualExplanation: "An evidence chain connects claim, project context, personal decision, authored artefact, verification result, reviewer and bounded limitation.",
    applicationTask: "Select one engineering capability claim, attach its strongest artefact and result and rewrite the claim until contribution and limitation are unambiguous."
  },
  "EML-E4-D25-L06": {
    systemModel: "Capstone integration closes mechanical, electrical, firmware, software and evidence interfaces into a reproducible baseline with release criteria and recovery information.",
    failurePattern: "Subsystem demonstrations can all pass separately while timing, power, geometry, configuration or ownership fails at the integrated boundary.",
    visualExplanation: "An integration map joins multidisciplinary interfaces to end-to-end tests, configuration identity, release gate, known limitations and rollback path.",
    applicationTask: "Integrate one capstone behaviour across at least three disciplines, run an end-to-end acceptance test and package the reproducible release evidence."
  },
  "EML-E4-D25-L07": {
    systemModel: "An interview demonstration combines a concise technical narrative, defensible artefact or calculation, live diagnostic reasoning and clear separation of fact, assumption and future work.",
    failurePattern: "Memorised fluency collapses when a result is challenged if the speaker cannot reproduce the reasoning, name limitations or diagnose a changed condition.",
    visualExplanation: "A demonstration arc moves from problem and personal decision to evidence, result, limitation, challenge response and next verification step.",
    applicationTask: "Rehearse a bounded project demonstration, answer one adversarial technical change and retain a corrected explanation that distinguishes verified evidence from assumption."
  },
} as const satisfies AcademyLessonTeachingProfileRegistry;

export default academyLessonTeachingProfilesE4;
