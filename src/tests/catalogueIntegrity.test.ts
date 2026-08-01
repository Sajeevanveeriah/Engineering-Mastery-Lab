import { describe, expect, it } from "vitest";
import {
  bookmarkKey,
  commandCatalogue,
  searchCommandCatalogue,
  searchableCatalogue,
  toolPurposeGroups,
  toolsCatalogue
} from "../data/catalogue";
import {
  displayDiscipline,
  mobilePrimaryDestinations,
  primaryDestinations
} from "../data/displayLabels";
import { modules } from "../data/modules";
import { pathways } from "../data/pathways";
import { projects } from "../data/projects";
import { skillDomains } from "../data/skills";
import { calculatorDefinitions } from "../lib/engineering/calculators";

const sorted = (values: string[]) => [...values].sort((left, right) => left.localeCompare(right, "en-AU"));

describe("catalogue integrity", () => {
  it("defines the five canonical primary destinations once and exposes them to command search", () => {
    expect(primaryDestinations.map((destination) => destination.label)).toEqual([
      "Learn",
      "Practice",
      "Projects",
      "Progress",
      "More"
    ]);
    expect(primaryDestinations.map((destination) => destination.route)).toEqual([
      "/learn",
      "/practice",
      "/projects",
      "/progress",
      "/more"
    ]);
    expect(mobilePrimaryDestinations.map((destination) => destination.label)).toEqual([
      "Learn",
      "Practice",
      "Projects",
      "Progress"
    ]);
    expect(new Set(primaryDestinations.map((destination) => destination.id)).size).toBe(primaryDestinations.length);
    expect(new Set(primaryDestinations.map((destination) => destination.route)).size).toBe(primaryDestinations.length);

    for (const destination of primaryDestinations) {
      expect(searchCommandCatalogue(destination.label).some((item) =>
        item.type === "Destination"
        && item.title === destination.label
        && item.route === destination.route
      )).toBe(true);
    }
  });

  it("makes the self-contained Academy and review queue directly searchable", () => {
    expect(searchCommandCatalogue("engineering academy").some((item) =>
      item.id === "academy-catalogue"
      && item.route === "/learn/courses"
    )).toBe(true);
    expect(searchCommandCatalogue("retrieval review").some((item) =>
      item.id === "academy-review"
      && item.route === "/learn/review"
    )).toBe(true);
    expect(searchCommandCatalogue("EML-E3-D20").some((item) =>
      item.id === "academy-unit-EML-E3-D20"
      && item.route === "/learn/courses/ACADEMY-E3/units/EML-E3-D20"
    )).toBe(true);
  });

  it("uses a distinct canonical bookmark namespace for skills", () => {
    expect(bookmarkKey("skill", "robotics")).toBe("skill:robotics");
    expect(bookmarkKey("skill", "robotics")).not.toBe(bookmarkKey("tool", "robotics"));
  });

  it("keeps searchable identities unique and every source object on its canonical route", () => {
    expect(new Set(searchableCatalogue.map((item) => item.id)).size).toBe(searchableCatalogue.length);
    expect(new Set(commandCatalogue.map((item) => item.id)).size).toBe(commandCatalogue.length);

    for (const module of modules) {
      const item = searchableCatalogue.find((candidate) => candidate.id === `lab-${module.id}`);
      expect(item?.route).toBe(`/learn/labs/${module.id}`);
      expect(item?.discipline).toBe(displayDiscipline(module.domainId));
    }
    for (const pathway of pathways) {
      expect(searchableCatalogue.find((item) => item.id === `pathway-${pathway.id}`)?.route)
        .toBe(`/learn/pathways/${pathway.id}`);
    }
    for (const project of projects) {
      expect(searchableCatalogue.find((item) => item.id === `project-${project.id}`)?.route)
        .toBe(`/projects/${project.slug}`);
    }
    for (const domain of skillDomains) {
      expect(searchableCatalogue.find((item) => item.id === `skill-${domain.id}`)?.route)
        .toBe(`/learn/skills?domain=${domain.id}`);
    }

    expect(new Set(toolsCatalogue.map((tool) => tool.route))).toEqual(new Set([
      "/tools/calculators",
      "/tools/converter",
      "/tools/materials",
      "/tools/engineering",
      "/tools/cad",
      "/tools/workbench",
      "/tools/diagnostics"
    ]));
  });

  it("assigns every tool to one unique purpose group", () => {
    expect(new Set(toolPurposeGroups.map((group) => group.id)).size).toBe(toolPurposeGroups.length);
    expect(new Set(toolPurposeGroups.map((group) => group.title)).size).toBe(toolPurposeGroups.length);
    const groupedToolIds = toolPurposeGroups.flatMap((group) => group.toolIds);
    expect(new Set(groupedToolIds).size).toBe(groupedToolIds.length);
    expect(sorted(groupedToolIds)).toEqual(sorted(toolsCatalogue.map((tool) => tool.id)));

    for (const group of toolPurposeGroups) {
      expect(group.id.trim()).not.toBe("");
      expect(group.title.trim()).not.toBe("");
      expect(group.toolIds.length).toBeGreaterThan(0);
      expect(group.toolIds.every((id) => toolsCatalogue.some((tool) => tool.id === id))).toBe(true);
    }
  });

  it("maps every implemented calculator to one honest catalogue category", () => {
    const calculatorItems = toolsCatalogue.filter((item) => item.type === "Calculator");
    const catalogueCalculatorIds = calculatorItems.flatMap((item) => item.calculatorIds ?? []);
    const implementedCalculatorIds = calculatorDefinitions.map((definition) => definition.id);

    expect(calculatorItems.length).toBeGreaterThan(0);
    expect(calculatorDefinitions.length).toBeGreaterThan(0);
    expect(new Set(implementedCalculatorIds).size).toBe(implementedCalculatorIds.length);
    expect(new Set(catalogueCalculatorIds).size).toBe(catalogueCalculatorIds.length);
    expect(sorted(catalogueCalculatorIds)).toEqual(sorted(implementedCalculatorIds));
    expect(calculatorItems.every((item) => item.route === "/tools/calculators")).toBe(true);
  });

  it("requires useful labels, supported capability values, and bounded CAD copy", () => {
    const supportedCapabilities = new Set(["Web", "Desktop", "Web and Desktop"]);
    for (const item of commandCatalogue) {
      expect(item.id.trim()).not.toBe("");
      expect(item.title.trim()).not.toBe("");
      expect(item.description.trim()).not.toBe("");
      expect(item.discipline.trim()).not.toBe("");
      expect(item.route.startsWith("/")).toBe(true);
      expect(supportedCapabilities.has(item.capability)).toBe(true);
    }

    const cad = toolsCatalogue.find((item) => item.id === "cad-studio");
    expect(cad?.description).toMatch(/3D preview/i);
    expect(cad?.description).toMatch(/STL.*OpenSCAD.*SVG.*JSON/i);
    expect(cad?.description).toMatch(/not general or certified CAD/i);
  });
});
