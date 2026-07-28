import { describe, expect, it } from "vitest";
import {
  compareMotorSizingProjectScenarios,
  createMotorSizingVerticalSlice,
  deleteScenario,
  duplicateScenario,
  inspectEvidenceGraph,
  renameScenario,
  scenarioDeletionToken,
  validateEvidenceGraph,
  validateScenarioSet
} from "../lib/kernel";

describe("engineering kernel scenarios", () => {
  it("resolves a baseline and named scenario in deterministic SI comparisons", () => {
    const { project } = createMotorSizingVerticalSlice();
    const baseline = project.scenarioSet.scenarios.find((scenario) => scenario.id === "baseline");
    const candidate = project.scenarioSet.scenarios.find((scenario) => scenario.id === "reduced-speed");
    expect(baseline).toBeDefined();
    expect(candidate).toBeDefined();
    expect(Object.keys(candidate!.overrides)).toEqual([
      "continuous-output-speed",
      "peak-output-speed"
    ]);
    const comparison = compareMotorSizingProjectScenarios(
      project,
      baseline!.id,
      candidate!.id
    );
    const speed = comparison.find((row) => row.variableId === "continuous-output-speed");
    expect(comparison.map((row) => row.variableId)).toEqual(
      [...comparison.map((row) => row.variableId)].sort()
    );
    expect(speed?.baselineValue).toBeCloseTo(20 * Math.PI, 12);
    expect(speed?.candidateValue).toBeCloseTo(16 * Math.PI, 12);
    expect(speed?.relativePercent).toBeCloseTo(-20, 12);
    expect(speed).toMatchObject({ role: "input", changed: true });
    expect(comparison.find((row) => row.variableId === "continuous-motor-power"))
      .toMatchObject({
        role: "output",
        changed: true,
        baselineValue: 1183.9730782801705,
        candidateValue: 947.1784626241363
      });
  });

  it("duplicates, renames and confirmation-gates deletion without mutating the source set", () => {
    const { project } = createMotorSizingVerticalSlice();
    const source = project.scenarioSet;
    const duplicated = duplicateScenario(
      source,
      "reduced-speed",
      "review-copy",
      "Review copy",
      project.variables
    );
    expect(source.scenarios).toHaveLength(2);
    expect(duplicated.scenarios.find((scenario) => scenario.id === "review-copy")?.overrides)
      .toEqual(source.scenarios.find((scenario) => scenario.id === "reduced-speed")?.overrides);
    expect(() => duplicateScenario(
      duplicated,
      "reduced-speed",
      "review-copy",
      "Duplicate id",
      project.variables
    )).toThrow(/already exists/);

    const renamed = renameScenario(duplicated, "review-copy", "Independent review", project.variables);
    expect(renamed.scenarios.find((scenario) => scenario.id === "review-copy")?.name)
      .toBe("Independent review");
    expect(() => deleteScenario(renamed, "review-copy", "wrong", project.variables))
      .toThrow(/confirmation token/);
    const deleted = deleteScenario(
      renamed,
      "review-copy",
      scenarioDeletionToken("review-copy"),
      project.variables
    );
    expect(deleted.scenarios.some((scenario) => scenario.id === "review-copy")).toBe(false);
    expect(() => deleteScenario(
      deleted,
      "baseline",
      scenarioDeletionToken("baseline"),
      project.variables
    )).toThrow(/baseline scenario cannot be deleted/);
  });

  it("rejects missing baselines, unsafe keys and dimensionally invalid overrides", () => {
    const { project } = createMotorSizingVerticalSlice();
    expect(() => validateScenarioSet({
      version: 1,
      baselineId: "none",
      scenarios: [{ version: 1, id: "named", name: "Named", kind: "named", overrides: {} }]
    }, project.variables)).toThrow(/exactly one baseline/);
    expect(() => validateScenarioSet({
      version: 1,
      baselineId: "baseline",
      scenarios: [{
        version: 1,
        id: "baseline",
        name: "Baseline",
        kind: "baseline",
        overrides: { "continuous-load-torque": { value: 1, unitId: "kg" } }
      }]
    }, project.variables)).toThrow(/wrong dimension/);
    expect(() => validateScenarioSet(JSON.parse(
      '{"version":1,"baselineId":"baseline","scenarios":[{"version":1,"id":"baseline","name":"Baseline","kind":"baseline","overrides":{"__proto__":{"value":1,"unitId":"N.m"}}}]}'
    ), project.variables)).toThrow(/safe identifier|unsafe key/);
  });
});

describe("engineering evidence graph", () => {
  it("accepts the acyclic vertical slice graph", () => {
    const { project } = createMotorSizingVerticalSlice();
    expect(validateEvidenceGraph(project.evidenceGraph)).toEqual(project.evidenceGraph);
  });

  it("reports broken references and rejects directed cycles", () => {
    const broken = inspectEvidenceGraph({
      version: 1,
      nodes: [{ id: "a", kind: "variable", label: "A" }],
      edges: [{ from: "a", to: "missing", relation: "supports" }]
    });
    expect(broken.issues).toEqual([
      expect.objectContaining({ code: "broken-target", path: ["a", "missing"] })
    ]);

    expect(() => validateEvidenceGraph({
      version: 1,
      nodes: [
        { id: "a", kind: "variable", label: "A" },
        { id: "b", kind: "calculation", label: "B" },
        { id: "c", kind: "decision", label: "C" }
      ],
      edges: [
        { from: "a", to: "b", relation: "supports" },
        { from: "b", to: "c", relation: "derives" },
        { from: "c", to: "a", relation: "documents" }
      ]
    })).toThrow(/directed cycle/);
  });

  it("accepts the complete project-to-report evidence vocabulary", () => {
    const kinds = [
      "project",
      "milestone",
      "dataset",
      "variable",
      "assumption",
      "scenario",
      "calculation",
      "notebook",
      "result",
      "validation",
      "evidence-record",
      "report"
    ] as const;
    const graph = validateEvidenceGraph({
      version: 1,
      nodes: kinds.map((kind, index) => ({ id: `node-${index}`, kind, label: kind })),
      edges: kinds.slice(1).map((_, index) => ({
        from: `node-${index}`,
        to: `node-${index + 1}`,
        relation: "supports"
      }))
    });
    expect([...graph.nodes.map((node) => node.kind)].sort()).toEqual([...kinds].sort());
    expect(graph.edges).toHaveLength(kinds.length - 1);
  });
});
