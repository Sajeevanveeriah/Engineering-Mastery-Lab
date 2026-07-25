import { describe, expect, it } from "vitest";
import { entitlementIds, plans } from "../data/commercial";
import { searchCatalogue, searchableCatalogue } from "../data/catalogue";
import { modules } from "../data/modules";
import { pathways } from "../data/pathways";
import { projects } from "../data/projects";
import { openSourceEntitlementProvider, localBillingProvider, noOpProductEventProvider } from "../lib/providers";
import { recommendPathway } from "../lib/recommendation";

describe("product catalogues", () => {
  it("defines ten coherent pathways with complete metadata and unique steps", () => {
    expect(pathways).toHaveLength(10);
    expect(new Set(pathways.map((pathway) => pathway.id)).size).toBe(pathways.length);
    for (const pathway of pathways) {
      expect(pathway.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(pathway.prerequisites.length).toBeGreaterThan(0);
      expect(pathway.effortHours).toBeGreaterThan(0);
      expect(Number.isInteger(pathway.effortHours)).toBe(true);
      expect(pathway.steps.length).toBeGreaterThanOrEqual(4);
      expect(new Set(pathway.steps.map((step) => step.id)).size).toBe(pathway.steps.length);
      expect(pathway.completionRule).not.toBe("");
      expect(pathway.evidenceExpected.length).toBeGreaterThan(0);
      expect(pathway.next.route.startsWith("/")).toBe(true);
    }
  });

  it("defines twelve substantial project briefs with valid AUD estimate bounds", () => {
    expect(projects).toHaveLength(12);
    expect(new Set(projects.map((project) => project.id)).size).toBe(projects.length);
    for (const project of projects) {
      expect(project.slug).toBe(project.id);
      expect(project.disciplines.length).toBeGreaterThan(0);
      expect(project.effortHours).toBeGreaterThan(0);
      expect(Number.isInteger(project.effortHours)).toBe(true);
      expect(project.budgetAud.minimum).toBeGreaterThanOrEqual(0);
      expect(project.budgetAud.maximum).toBeGreaterThanOrEqual(project.budgetAud.minimum);
      expect(project.budgetAud.basis).toMatch(/estimate/i);
      expect(project.milestones.length).toBeGreaterThanOrEqual(4);
      expect(project.validationCriteria.length).toBeGreaterThanOrEqual(4);
      expect(project.portfolioEvidence.length).toBeGreaterThanOrEqual(4);
      expect(project.safetyBoundary.length).toBeGreaterThan(30);
      expect(project.linkedLabs.every((id) => modules.some((module) => module.id === id))).toBe(true);
    }
  });

  it("searches learning, projects, skills, calculators, references, and tools", () => {
    const types = new Set(searchableCatalogue.map((item) => item.type));
    expect(types).toEqual(new Set(["Laboratory", "Pathway", "Project", "Skill", "Calculator", "Reference", "Tool"]));
    expect(searchCatalogue("odometry")[0]?.route).toMatch(/robot|mobile/);
    expect(searchCatalogue("unit converter").some((item) => item.id === "converter")).toBe(true);
    expect(searchCatalogue("zzzz-no-match")).toEqual([]);
  });

  it("uses deterministic onboarding recommendations", () => {
    expect(recommendPathway("foundations", [], "foundation")).toBe("analysis");
    expect(recommendPathway("refresh", ["Robotics"], "intermediate")).toBe("robotics");
    expect(recommendPathway("project", ["Controls"], "advanced")).toBe("mechatronics");
    expect(recommendPathway("role", ["Verification"], "advanced")).toBe("verification");
  });
});

describe("commercial provider boundary", () => {
  it("keeps every current capability available in open-source preview mode", () => {
    expect(openSourceEntitlementProvider.mode).toBe("open-source-preview");
    for (const entitlement of entitlementIds) expect(openSourceEntitlementProvider.has(entitlement)).toBe(true);
  });

  it("defines three future plans without billing availability", () => {
    expect(plans.map((plan) => plan.id)).toEqual(["free", "pro", "teams-educators"]);
    expect(localBillingProvider.available).toBe(false);
    expect(localBillingProvider.explanation).toMatch(/not connected/i);
    expect(() => noOpProductEventProvider.record("test", { local: true })).not.toThrow();
  });
});
