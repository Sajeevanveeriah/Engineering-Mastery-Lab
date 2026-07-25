import type { ExperienceLevel, LearnerGoal } from "./storage";

export function recommendPathway(goal: LearnerGoal, selected: string[], experience: ExperienceLevel): string {
  const normalised = selected.map((item) => item.toLocaleLowerCase("en-AU"));
  const rules: Array<[string, string[]]> = [
    ["controls", ["controls", "automation"]],
    ["embedded", ["electrical", "embedded"]],
    ["robotics", ["robotics"]],
    ["ai-ml", ["ai and ml", "data"]],
    ["industrial", ["industrial", "automation"]],
    ["mechanical", ["mechanical"]],
    ["software", ["software"]],
    ["verification", ["verification"]]
  ];
  const disciplineMatch = rules.find(([, terms]) => terms.some((term) => normalised.includes(term)))?.[0];
  if (goal === "project" && experience === "advanced") return "mechatronics";
  if (goal === "foundations" && !disciplineMatch) return "analysis";
  if (goal === "role" && normalised.includes("verification")) return "verification";
  return disciplineMatch ?? (experience === "advanced" ? "software" : "analysis");
}
