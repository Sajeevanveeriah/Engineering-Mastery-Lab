import { skillDomains } from "./skills";

export const primaryDestinations = [
  {
    id: "today",
    label: "Today",
    route: "/",
    icon: "dashboard",
    description: "Resume recent work and see the next useful step.",
    keywords: ["home", "dashboard", "continue", "recent", "progress"]
  },
  {
    id: "learn",
    label: "Learn",
    route: "/learn",
    icon: "labs",
    description: "Discover pathways, laboratories, skills, and bookmarks.",
    keywords: ["pathways", "laboratories", "skills", "bookmarks", "mastery"]
  },
  {
    id: "build",
    label: "Build",
    route: "/projects",
    icon: "practice",
    description: "Apply capability through practical engineering projects.",
    keywords: ["projects", "practice", "apply", "prototype", "evidence"]
  },
  {
    id: "analyse",
    label: "Analyse",
    route: "/tools",
    icon: "workbench",
    description: "Calculate, reference, design, verify, and inspect capability.",
    keywords: ["tools", "calculate", "design", "verify", "diagnostics"]
  },
  {
    id: "prove",
    label: "Prove",
    route: "/portfolio",
    icon: "report",
    description: "Review recorded evidence, artefacts, and demonstrated capability.",
    keywords: ["portfolio", "evidence", "artefacts", "skills", "results"]
  }
] as const;

export type PrimaryDestination = (typeof primaryDestinations)[number];

const disciplineNames = new Map(skillDomains.map((domain) => [domain.id, domain.name]));

export function displayDiscipline(value: string): string {
  return disciplineNames.get(value) ?? value;
}
