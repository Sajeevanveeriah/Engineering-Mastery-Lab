import { describe, expect, it } from "vitest";
import { collectSimulationInputPaths, workspaceAbsolutePath } from "../lib/workspace/inputs";
import type { SimulationConfig } from "../lib/workspace/manifest";

const simulation: SimulationConfig = {
  id: "run-1",
  title: "Run",
  capabilityId: "ngspice.tran",
  params: {
    netlistRelPath: "circuits/design.cir",
    nested: { modelRelPath: "circuits/model.lib" },
    ignoredPath: "C:\\outside.txt",
    vectors: ["v(out)"]
  },
  requirementIds: ["REQ-001"]
};

describe("workspace run inputs", () => {
  it("collects safe configured and linked requirement paths deterministically", () => {
    expect(
      collectSimulationInputPaths(simulation, {
        requirements: [
          { id: "REQ-001", title: "Target", sourceRelPath: "requirements/spec.md" },
          { id: "REQ-002", title: "Other", sourceRelPath: "requirements/other.md" }
        ]
      })
    ).toEqual(["circuits/design.cir", "circuits/model.lib", "requirements/spec.md"]);
  });

  it("joins a validated relative path using the root platform separator", () => {
    expect(workspaceAbsolutePath("C:\\Projects\\Drive", "results/run.csv")).toBe(
      "C:\\Projects\\Drive\\results\\run.csv"
    );
    expect(workspaceAbsolutePath("/tmp/project", "results/run.csv")).toBe("/tmp/project/results/run.csv");
  });

  it("rejects traversal before constructing an absolute path", () => {
    expect(() => workspaceAbsolutePath("C:\\Projects", "../secret.txt")).toThrow(
      "workspace-relative"
    );
  });
});
