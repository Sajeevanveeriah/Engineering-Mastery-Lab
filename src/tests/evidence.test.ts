import { describe, expect, it } from "vitest";
import { buildEvidenceReport, EvidenceReportInput } from "../lib/report/evidence";
import { createManifest } from "../lib/workspace/manifest";
import { AdapterResult } from "../lib/adapters/contract";

function okResult(capabilityId: string): AdapterResult {
  return {
    status: "ok",
    capabilityId,
    message: "completed",
    tables: [
      {
        title: "tran",
        columns: [
          { name: "time", unit: "s", values: [0, 1e-4, 2e-4] },
          { name: "v(out)", values: [0, 0.95, 1.81] }
        ]
      }
    ],
    scalars: { zPoints: 3, aValue: 1.23456789012 },
    diagnostics: [
      { severity: "warning", message: "b warning", source: "ngspice" },
      { severity: "error", message: "a error", source: "ngspice" }
    ],
    generatedFiles: [
      { relPath: "results/z.csv", kind: "csv", sha256: "b".repeat(64) },
      { relPath: "results/a.txt", kind: "raw", sha256: "a".repeat(64) }
    ],
    toolVersion: "44"
  };
}

function sampleInput(): EvidenceReportInput {
  const manifest = createManifest("RC Filter Study", "Demo", "2026-07-11T00:00:00.000Z");
  manifest.requirements.push({ id: "REQ-002", title: "Second requirement" });
  manifest.requirements.push({ id: "REQ-001", title: "First requirement", sourceRelPath: "requirements/spec.md" });
  manifest.simulations.push({
    id: "sim-b",
    title: "Sim B",
    capabilityId: "ngspice.tran",
    params: { netlistRelPath: "circuits/rc.cir", zLast: 1, aFirst: 2 },
    requirementIds: ["REQ-002", "REQ-001"]
  });
  manifest.simulations.push({
    id: "sim-a",
    title: "Sim A",
    capabilityId: "ngspice.op",
    params: { netlistRelPath: "circuits/div.cir" },
    requirementIds: ["REQ-001"]
  });
  return {
    manifest,
    appVersion: "0.1.0",
    generatedUtc: "2026-07-11T10:00:00.000Z",
    tools: [
      { name: "ngspice", ready: true, version: "44", executablePath: "C:/Spice64/bin/ngspice.exe" },
      { name: "kicad-cli", ready: false, error: "not found" }
    ],
    inputFiles: [
      { relPath: "circuits/rc.cir", sha256: "c".repeat(64) },
      { relPath: "circuits/div.cir", sha256: "d".repeat(64) }
    ],
    runs: [{ simulationId: "sim-b", result: okResult("ngspice.tran") }],
    limitations: ["Fixture-verified only on this host."]
  };
}

describe("evidence report", () => {
  it("is deterministic: identical input produces byte-identical output", () => {
    const a = buildEvidenceReport(sampleInput());
    const b = buildEvidenceReport(sampleInput());
    expect(a).toBe(b);
  });

  it("is order-independent: shuffled collections produce identical output", () => {
    const base = buildEvidenceReport(sampleInput());
    const shuffled = sampleInput();
    shuffled.manifest.requirements.reverse();
    shuffled.manifest.simulations.reverse();
    shuffled.inputFiles.reverse();
    shuffled.tools.reverse();
    const run = shuffled.runs[0].result;
    run.generatedFiles.reverse();
    run.diagnostics.reverse();
    expect(buildEvidenceReport(shuffled)).toBe(base);
  });

  it("contains every required section", () => {
    const report = buildEvidenceReport(sampleInput());
    for (const heading of [
      "# Engineering Evidence Report — RC Filter Study",
      "## 1. Project metadata",
      "## 2. Requirements",
      "## 3. Tools and adapter versions",
      "## 4. Input files and hashes",
      "## 5. Simulations and results",
      "## 6. Limitations",
      "## 7. Reproduction"
    ]) {
      expect(report).toContain(heading);
    }
  });

  it("records requirement traceability, hashes, configs, results and not-run states", () => {
    const report = buildEvidenceReport(sampleInput());
    expect(report).toMatch(/REQ-001 \| First requirement \| requirements\/spec.md \| sim-a, sim-b/);
    expect(report).toContain("`" + "c".repeat(64) + "`");
    expect(report).toContain('"aFirst": 2'); // config JSON present, keys sorted
    expect(report.indexOf('"aFirst"')).toBeLessThan(report.indexOf('"zLast"'));
    expect(report).toContain("Result: **COMPLETED** — completed");
    expect(report).toContain("Result: **NOT RUN** in this report."); // sim-a has no run
    expect(report).toMatch(/3 points × 2 columns/);
    expect(report).toContain("- **error** a error");
    expect(report).toContain("| results/a.txt | raw |");
  });

  it("labels tool-missing runs and adds the limitation automatically", () => {
    const input = sampleInput();
    input.runs = [
      {
        simulationId: "sim-b",
        result: {
          status: "tool-missing",
          capabilityId: "ngspice.tran",
          message: "ngspice was not found.",
          tables: [],
          scalars: {},
          diagnostics: [],
          generatedFiles: []
        }
      }
    ];
    const report = buildEvidenceReport(input);
    expect(report).toContain("**NOT RUN (tool missing)**");
    expect(report).toMatch(/could not run because an external tool is not installed/);
  });
});
