import { describe, expect, it } from "vitest";
import {
  FLAGSHIP_SCHEMA_VERSION,
  createFlagshipKernelPackage,
  flagshipSpecifications,
  getFlagshipWorkflow,
  recomputeFlagshipPrimaryResult,
  runFlagshipFixtureSummary
} from "../lib/flagships";
import { importProjectBundle } from "../lib/kernel";

describe("flagship workflow specifications", () => {
  it("defines exactly five unique versioned disciplines", () => {
    expect(flagshipSpecifications).toHaveLength(5);
    expect(new Set(flagshipSpecifications.map((workflow) => workflow.id)).size).toBe(5);
    expect(new Set(flagshipSpecifications.map((workflow) => workflow.domain)).size).toBe(5);
    expect(flagshipSpecifications.every((workflow) => workflow.schemaVersion === FLAGSHIP_SCHEMA_VERSION)).toBe(true);
  });

  it("uses canonical skill-domain identifiers for Prove linkage", () => {
    expect(Object.fromEntries(flagshipSpecifications.map((workflow) => [
      workflow.domain,
      workflow.linkedSkillIds
    ]))).toEqual({
      controls: ["controls"],
      "robotics-autonomy": ["robotics"],
      "embedded-electronics-sensing": ["embedded", "electronics"],
      "mechanical-design-dynamics": ["mechanical"],
      "applied-ai-ml": ["aiml"]
    });
  });

  it("contains complete measurable workflow and evidence content", () => {
    flagshipSpecifications.forEach((workflow) => {
      expect(workflow.prerequisites.length).toBeGreaterThanOrEqual(3);
      expect(workflow.outcomes.length).toBeGreaterThanOrEqual(3);
      workflow.outcomes.forEach((outcome) => {
        expect(outcome.statement).not.toBe("");
        expect(outcome.measure).not.toBe("");
        expect(outcome.passCriterion).not.toBe("");
      });
      expect(workflow.sequence.length).toBeGreaterThanOrEqual(4);
      expect(new Set(workflow.sequence.map((step) => step.id)).size).toBe(workflow.sequence.length);
      workflow.sequence.forEach((step) => {
        expect(step.action).not.toBe("");
        expect(step.verification).not.toBe("");
        expect(step.outputs.length).toBeGreaterThan(0);
      });
      expect(workflow.challenge.constraints.length).toBeGreaterThanOrEqual(3);
      expect(workflow.challenge.knownPassCriteria.length).toBeGreaterThanOrEqual(4);
      expect(workflow.failureStates.length).toBeGreaterThanOrEqual(3);
      expect(workflow.evidenceRubric.length).toBeGreaterThanOrEqual(3);
      expect(workflow.linkedApplication.projectId).not.toBe("");
      expect(workflow.linkedApplication.labId).not.toBe("");
      expect(workflow.safetyBoundary).toMatch(/not|does not/i);
    });
  });

  it("declares equations, SI units, assumptions, and validity bounds", () => {
    flagshipSpecifications.forEach((workflow) => {
      expect(workflow.equations.length).toBeGreaterThanOrEqual(2);
      workflow.equations.forEach((equation) => {
        expect(equation.expression).not.toBe("");
        expect(equation.variables.length).toBeGreaterThan(0);
        equation.variables.forEach((variable) => {
          expect(variable.symbol).not.toBe("");
          expect(variable.quantity).not.toBe("");
          expect(variable.siUnit).not.toBe("");
        });
        expect(equation.assumptions.length).toBeGreaterThan(0);
        expect(equation.validWhen.length).toBeGreaterThan(0);
      });
    });
  });

  it("maps every material symbol in the coupled control, fusion, and rotation equations", () => {
    const equations = new Map(flagshipSpecifications.flatMap((workflow) =>
      workflow.equations.map((equation) => [equation.id, equation] as const)
    ));
    const expectedSymbols: Record<string, string[]> = {
      "controls-second-order-model": ["y", "y'", "y''", "u", "K", "zeta", "wn", "t"],
      "controls-pid": ["u", "e", "Kp", "Ki", "Kd", "t"],
      "robotics-scalar-covariance-update": ["P", "Pp", "Q", "R", "x", "xp", "z", "K"],
      "mechanical-rotational-load": ["Trequired", "Tload", "J", "alpha", "rpm", "omega", "P"]
    };
    for (const [id, symbols] of Object.entries(expectedSymbols)) {
      expect(equations.get(id)?.variables.map((variable) => variable.symbol))
        .toEqual(expect.arrayContaining(symbols));
    }
  });

  it("requires notebook, calculation, and evidence outputs", () => {
    flagshipSpecifications.forEach((workflow) => {
      expect(new Set(workflow.outputs.map((output) => output.kind))).toEqual(
        new Set(["notebook", "calculation", "evidence"])
      );
      workflow.outputs.forEach((output) => {
        expect(output.title).not.toBe("");
        expect(output.requiredFields.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  it("provides text and table alternatives for visual results", () => {
    flagshipSpecifications.forEach((workflow) => {
      expect(workflow.accessibleAlternatives.length).toBeGreaterThanOrEqual(2);
      workflow.accessibleAlternatives.forEach((alternative) => {
        expect(alternative.forOutput).not.toBe("");
        expect(alternative.tableColumns.length).toBeGreaterThanOrEqual(3);
        expect(alternative.textSummary).not.toBe("");
      });
    });
  });

  it("looks up workflows and returns deterministic accessible fixture summaries", () => {
    flagshipSpecifications.forEach((workflow) => {
      expect(getFlagshipWorkflow(workflow.id)).toBe(workflow);
      const first = runFlagshipFixtureSummary(workflow.id);
      const second = runFlagshipFixtureSummary(workflow.id);
      expect(second).toEqual(first);
      expect(first.metrics.length).toBeGreaterThanOrEqual(2);
      expect(first.table.columns.length).toBeGreaterThanOrEqual(3);
      expect(first.table.rows.length).toBeGreaterThan(0);
      expect(first.table.rows.every((row) => row.length === first.table.columns.length)).toBe(true);
      expect(first.supportingTables.length).toBeGreaterThanOrEqual(2);
      first.supportingTables.forEach((supporting) => {
        expect(supporting.textAlternative).not.toBe("");
        expect(supporting.table.columns.length).toBeGreaterThanOrEqual(2);
        expect(supporting.table.rows.length).toBeGreaterThan(0);
        expect(supporting.table.rows.every((row) => row.length === supporting.table.columns.length))
          .toBe(true);
      });
      expect(first.provenance.sourceLabel).not.toBe("");
      expect(first.provenance.licenceId).toBe("MIT");
      expect(first.provenance.learnerGenerated).toBe(false);
      expect(first.textAlternative).not.toBe("");
    });
    expect(() => runFlagshipFixtureSummary("unknown")).toThrow(/Unknown flagship workflow/);
  });

  it("creates a deterministic validated kernel project and bundle for every flagship", () => {
    const inputCounts = {
      controls: 4,
      "robotics-autonomy": 10,
      "embedded-electronics-sensing": 2,
      "mechanical-design-dynamics": 4,
      "applied-ai-ml": 4
    } as const;
    flagshipSpecifications.forEach((workflow) => {
      const fixture = runFlagshipFixtureSummary(workflow.id);
      const first = createFlagshipKernelPackage(workflow, fixture);
      const second = createFlagshipKernelPackage(workflow, fixture);
      expect(second.bundle).toBe(first.bundle);
      expect(first.project.variables).toHaveLength(inputCounts[workflow.domain] + 1);
      expect(first.project.calculations).toHaveLength(1);
      expect(first.project.datasets).toHaveLength(1);
      expect(first.calculation.inputs).toHaveLength(inputCounts[workflow.domain]);
      expect(first.calculation.inputs.some((input) => input.variableId.endsWith("fixture-case"))).toBe(false);
      first.project.datasets[0].columns.forEach((column) => {
        if (column.type === "number") expect(column.unitId).toBeTruthy();
        else expect(column.unitId).toBeUndefined();
      });
      expect(first.project.datasets[0].provenance).toMatchObject({
        sourceLabel: fixture.provenance.sourceLabel,
        licenceId: "MIT",
        learnerGenerated: false
      });
      expect(first.project.notebook.blocks.map((block) => block.kind)).toEqual([
        "assumption",
        "calculation",
        "dataset",
        "reflection"
      ]);
      expect(first.project.evidenceGraph.nodes.map((node) => node.kind)).toEqual(
        expect.arrayContaining(["project", "calculation", "result", "validation", "notebook", "evidence-record"])
      );
      expect(recomputeFlagshipPrimaryResult(workflow.domain, first.calculation.inputs))
        .toBeCloseTo(first.calculation.outputs[0].baseValue, 12);

      const inputs = new Map(first.calculation.inputs.map((input) => [input.variableId, input]));
      const base = (id: string) => {
        const input = inputs.get(id);
        if (!input) throw new Error(`Test fixture is missing ${id}`);
        return input.baseValue;
      };
      const value = (id: string) => {
        const input = inputs.get(id);
        if (!input) throw new Error(`Test fixture is missing ${id}`);
        return input.value;
      };
      let independentlyRecomputed: number;
      switch (workflow.domain) {
        case "controls":
          independentlyRecomputed =
            base("controls-gain") *
            base("controls-step-input") *
            (1 - Math.exp(-base("controls-evaluation-time") / base("controls-time-constant")));
          break;
        case "robotics-autonomy": {
          const predictedCovariance =
            base("robotics-prior-covariance") + base("robotics-process-variance");
          independentlyRecomputed =
            predictedCovariance /
            (predictedCovariance + base("robotics-measurement-variance"));
          break;
        }
        case "embedded-electronics-sensing":
          independentlyRecomputed = base("embedded-sample-frequency") / 2;
          break;
        case "mechanical-design-dynamics":
          independentlyRecomputed =
            base("mechanical-load-torque") +
            base("mechanical-load-inertia") * base("mechanical-angular-acceleration");
          expect(value("mechanical-rotational-speed")).toBe(60);
          break;
        case "applied-ai-ml":
          expect(base("ml-training-fraction") + base("ml-validation-fraction") + base("ml-test-fraction"))
            .toBeCloseTo(1, 12);
          independentlyRecomputed = Math.floor(
            base("ml-total-samples") * base("ml-training-fraction")
          );
          break;
      }
      expect(independentlyRecomputed).toBeCloseTo(first.calculation.outputs[0].baseValue, 12);
      expect(importProjectBundle(first.bundle).project).toEqual(first.project);
    });
  });

  it("rejects a flagship metric that has drifted from its retained physical inputs", () => {
    const workflow = getFlagshipWorkflow("flagship-controls-response-and-robustness");
    if (!workflow) throw new Error("Controls workflow is missing");
    const fixture = runFlagshipFixtureSummary(workflow.id);
    fixture.metrics = fixture.metrics.map((metric) =>
      metric.label === "Output at one time constant" && typeof metric.value === "number"
        ? { ...metric, value: metric.value + 0.01 }
        : metric
    );
    expect(() => createFlagshipKernelPackage(workflow, fixture)).toThrow(
      /does not match its retained input snapshots/
    );
  });
});
