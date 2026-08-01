import { skillDomains } from "./skills";

export const primaryDestinations = [
  {
    id: "learn",
    label: "Learn",
    route: "/learn",
    icon: "labs",
    description: "Continue the dependency-ordered Engineering Academy.",
    keywords: ["academy", "course", "unit", "lesson", "continue"]
  },
  {
    id: "practice",
    label: "Practice",
    route: "/practice",
    icon: "practice",
    description: "Complete due reviews, checks and targeted practice.",
    keywords: ["review", "questions", "checks", "bookmarks", "mastery"]
  },
  {
    id: "projects",
    label: "Projects",
    route: "/projects",
    icon: "pathways",
    description: "Apply unlocked capability through contextual projects.",
    keywords: ["projects", "build", "apply", "prototype", "evidence"]
  },
  {
    id: "progress",
    label: "Progress",
    route: "/progress",
    icon: "report",
    description: "Understand course, skill, review and project progress.",
    keywords: ["progress", "skills", "review", "evidence", "next"]
  },
  {
    id: "more",
    label: "More",
    route: "/more",
    icon: "menu",
    description: "Open settings, references, tools, diagnostics and product information.",
    keywords: ["settings", "tools", "diagnostics", "references", "about"]
  }
] as const;

export const mobilePrimaryDestinations = primaryDestinations.slice(0, 4);

export type PrimaryDestination = (typeof primaryDestinations)[number];

const disciplineNames = new Map(skillDomains.map((domain) => [domain.id, domain.name]));

export function displayDiscipline(value: string): string {
  return disciplineNames.get(value) ?? value;
}
