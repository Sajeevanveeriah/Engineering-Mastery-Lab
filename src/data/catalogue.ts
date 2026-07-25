import { modules } from "./modules";
import { pathways } from "./pathways";
import { projects } from "./projects";
import { skillDomains } from "./skills";

export type SearchableType = "Laboratory" | "Pathway" | "Project" | "Skill" | "Calculator" | "Reference" | "Tool";

export interface SearchableCatalogueItem {
  id: string;
  title: string;
  description: string;
  type: SearchableType;
  discipline: string;
  route: string;
  keywords: string[];
  capability?: "Web" | "Desktop" | "Web and Desktop";
}

export const toolsCatalogue: SearchableCatalogueItem[] = [
  {
    id: "calculator-control",
    title: "Control response calculators",
    description: "PID response, step metrics, disturbance, and saturation models.",
    type: "Calculator",
    discipline: "Controls",
    route: "/tools/calculators",
    keywords: ["pid", "settling", "overshoot", "control"],
    capability: "Web and Desktop"
  },
  {
    id: "calculator-electrical",
    title: "Electrical calculators",
    description: "Divider, RC, RLC, filtering, and ADC models.",
    type: "Calculator",
    discipline: "Electrical",
    route: "/tools/calculators",
    keywords: ["voltage", "filter", "adc", "circuit"],
    capability: "Web and Desktop"
  },
  {
    id: "calculator-mechanical",
    title: "Mechanical calculators",
    description: "Gearing, power, damping, resonance, and vibration models.",
    type: "Calculator",
    discipline: "Mechanical",
    route: "/tools/calculators",
    keywords: ["gear", "torque", "power", "vibration"],
    capability: "Web and Desktop"
  },
  {
    id: "converter",
    title: "Engineering unit converter",
    description: "Convert common length, mass, pressure, energy, and temperature quantities locally.",
    type: "Reference",
    discipline: "Cross-discipline",
    route: "/tools/converter",
    keywords: ["units", "convert", "si", "temperature"],
    capability: "Web and Desktop"
  },
  {
    id: "materials",
    title: "Materials reference",
    description: "Indicative material properties with scope and verification boundaries.",
    type: "Reference",
    discipline: "Mechanical",
    route: "/tools/materials",
    keywords: ["density", "modulus", "strength", "material"],
    capability: "Web and Desktop"
  },
  {
    id: "cad-studio",
    title: "CAD Studio",
    description: "Create a local parameter-driven 2D mounting concept and export SVG.",
    type: "Tool",
    discipline: "Mechanical Design",
    route: "/tools/cad",
    keywords: ["cad", "svg", "mount", "parametric"],
    capability: "Web and Desktop"
  },
  {
    id: "workbench",
    title: "Project Workbench",
    description: "Run bounded local engineering workflows with evidence capture in the desktop app.",
    type: "Tool",
    discipline: "Verification",
    route: "/tools/workbench",
    keywords: ["workspace", "ngspice", "kicad", "evidence"],
    capability: "Desktop"
  },
  {
    id: "diagnostics",
    title: "Desktop diagnostics",
    description: "Inspect browser and desktop engineering-tool capability without weakening authority boundaries.",
    type: "Tool",
    discipline: "Software",
    route: "/tools/diagnostics",
    keywords: ["desktop", "tools", "diagnostics", "capability"],
    capability: "Web and Desktop"
  }
];

export const searchableCatalogue: SearchableCatalogueItem[] = [
  ...modules.map((module): SearchableCatalogueItem => ({
    id: `lab-${module.id}`,
    title: module.title,
    description: module.learn[0],
    type: "Laboratory",
    discipline: module.domainId,
    route: `/learn/labs/${module.id}`,
    keywords: [module.id, module.domainId, ...module.challenges.map((challenge) => challenge.title)],
    capability: "Web and Desktop"
  })),
  ...pathways.map((pathway): SearchableCatalogueItem => ({
    id: `pathway-${pathway.id}`,
    title: pathway.name,
    description: pathway.purpose,
    type: "Pathway",
    discipline: pathway.disciplines.join(", "),
    route: `/learn/pathways/${pathway.id}`,
    keywords: [...pathway.outcomes, pathway.difficulty],
    capability: "Web and Desktop"
  })),
  ...projects.map((project): SearchableCatalogueItem => ({
    id: `project-${project.id}`,
    title: project.title,
    description: project.summary,
    type: "Project",
    discipline: project.disciplines.join(", "),
    route: `/projects/${project.slug}`,
    keywords: [...project.outcomes, ...project.linkedSkills],
    capability: "Web and Desktop"
  })),
  ...skillDomains.map((domain): SearchableCatalogueItem => ({
    id: `skill-${domain.id}`,
    title: domain.name,
    description: `Evidence-led capability across ${domain.levels.map((level) => level.name).join(", ")}.`,
    type: "Skill",
    discipline: domain.name,
    route: `/learn/skills?domain=${domain.id}`,
    keywords: domain.levels.flatMap((level) => [level.name, ...level.outcomes]),
    capability: "Web and Desktop"
  })),
  ...toolsCatalogue
];

export function searchCatalogue(query: string, items = searchableCatalogue): SearchableCatalogueItem[] {
  const terms = query.toLocaleLowerCase("en-AU").trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items.slice(0, 12);
  return items
    .map((item) => {
      const title = item.title.toLocaleLowerCase("en-AU");
      const text = [item.title, item.description, item.type, item.discipline, ...item.keywords].join(" ").toLocaleLowerCase("en-AU");
      const matches = terms.filter((term) => text.includes(term));
      const score = matches.length * 2 + terms.filter((term) => title.includes(term)).length * 3;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "en-AU"))
    .map(({ item }) => item)
    .slice(0, 24);
}

export function bookmarkKey(type: ProgressItemTypeForBookmark, id: string): string {
  return `${type}:${id}`;
}

export type ProgressItemTypeForBookmark = "lab" | "pathway" | "project" | "tool";
