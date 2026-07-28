import { modules } from "./modules";
import { pathways } from "./pathways";
import { projects } from "./projects";
import { skillDomains } from "./skills";
import { displayDiscipline, primaryDestinations } from "./displayLabels";
import { flagshipCatalogue } from "./engineeringExperiences";

export type SearchableType = "Destination" | "Laboratory" | "Pathway" | "Project" | "Skill" | "Calculator" | "Reference" | "Tool";

export interface SearchableCatalogueItem {
  id: string;
  title: string;
  description: string;
  type: SearchableType;
  discipline: string;
  route: string;
  keywords: string[];
  capability: "Web" | "Desktop" | "Web and Desktop";
  calculatorIds?: string[];
}

export const toolsCatalogue: SearchableCatalogueItem[] = [
  {
    id: "calculator-control",
    title: "Mechanical and robotics calculators",
    description: "Beam, shaft, drive, pneumatic, and planar robot-arm calculations.",
    type: "Calculator",
    discipline: "Mechanical and Robotics",
    route: "/tools/calculators",
    keywords: ["beam", "shaft", "drive", "pneumatic", "robot arm"],
    capability: "Web and Desktop",
    calculatorIds: ["beam-bending", "shaft-torsion", "drive-sizing", "pneumatic-cylinder", "robot-arm"]
  },
  {
    id: "calculator-electrical",
    title: "Electrical and instrumentation calculators",
    description: "Three-phase power, conductor voltage drop, and linear signal scaling.",
    type: "Calculator",
    discipline: "Electrical and Instrumentation",
    route: "/tools/calculators",
    keywords: ["power", "voltage drop", "conductor", "signal scaling"],
    capability: "Web and Desktop",
    calculatorIds: ["three-phase-power", "conductor-drop", "linear-scaling"]
  },
  {
    id: "calculator-mechanical",
    title: "Thermal and manufacturing calculators",
    description: "Pipe flow, thermal expansion, heat conduction, and machining calculations.",
    type: "Calculator",
    discipline: "Thermal and Manufacturing",
    route: "/tools/calculators",
    keywords: ["flow", "thermal", "heat", "machining"],
    capability: "Web and Desktop",
    calculatorIds: ["pipe-flow", "thermal-expansion", "heat-conduction", "machining"]
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
    id: "engineering-workspace",
    title: "Engineering project workspace",
    description: "Build versioned variables, datasets, scenarios, notebook records, evidence lineage, portable bundles, project packs, and reproducible reports locally.",
    type: "Tool",
    discipline: "Cross-discipline",
    route: "/tools/engineering",
    keywords: ["kernel", "variables", "dataset", "scenario", "notebook", "evidence", "motor sizing", "report", "project pack"],
    capability: "Web and Desktop"
  },
  {
    id: "cad-studio",
    title: "CAD Studio",
    description: "Create bounded parameter-driven plates, flanges, spacers, and angle brackets with local 3D preview, validation, mass properties, and STL, OpenSCAD, SVG, and JSON export. Concept modelling only, not general or certified CAD.",
    type: "Tool",
    discipline: "Mechanical Design",
    route: "/tools/cad",
    keywords: ["cad", "3d", "stl", "openscad", "svg", "json", "parametric"],
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

export interface ToolPurposeGroup {
  id: string;
  title: string;
  toolIds: string[];
}

export const toolPurposeGroups: ToolPurposeGroup[] = [
  {
    id: "calculate-model",
    title: "Calculate and model",
    toolIds: ["calculator-control", "calculator-electrical", "calculator-mechanical"]
  },
  {
    id: "convert-reference",
    title: "Convert and reference",
    toolIds: ["converter", "materials"]
  },
  {
    id: "design",
    title: "Design parts",
    toolIds: ["cad-studio"]
  },
  {
    id: "verify-document",
    title: "Verify and document",
    toolIds: ["engineering-workspace", "workbench"]
  },
  {
    id: "inspect-capability",
    title: "Inspect capability",
    toolIds: ["diagnostics"]
  }
];

export const searchableCatalogue: SearchableCatalogueItem[] = [
  ...flagshipCatalogue.map((workflow): SearchableCatalogueItem => ({
    id: `flagship-${workflow.id}`,
    title: workflow.title,
    description: workflow.summary,
    type: "Pathway",
    discipline: workflow.disciplines.join(", "),
    route: workflow.route,
    keywords: ["flagship", "workflow", ...workflow.disciplines],
    capability: "Web and Desktop"
  })),
  ...modules.map((module): SearchableCatalogueItem => ({
    id: `lab-${module.id}`,
    title: module.title,
    description: module.learn[0],
    type: "Laboratory",
    discipline: displayDiscipline(module.domainId),
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

export const commandCatalogue: SearchableCatalogueItem[] = [
  ...primaryDestinations.map((destination): SearchableCatalogueItem => ({
    id: `destination-${destination.id}`,
    title: destination.label,
    description: destination.description,
    type: "Destination",
    discipline: "Primary navigation",
    route: destination.route,
    keywords: [...destination.keywords],
    capability: "Web and Desktop"
  })),
  ...searchableCatalogue
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

export function searchCommandCatalogue(query: string): SearchableCatalogueItem[] {
  return searchCatalogue(query, commandCatalogue);
}

export function bookmarkKey(type: ProgressItemTypeForBookmark, id: string): string {
  return `${type}:${id}`;
}

export type ProgressItemTypeForBookmark = "lab" | "pathway" | "project" | "skill" | "tool";
