// Keeps the committed example workspace valid: the manifest must parse, its
// referenced files must exist, and every netlist must pass validation.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseManifest } from "../lib/workspace/manifest";
import { validateNetlist } from "../lib/adapters/ngspice/netlist";
import { NgspiceAdapter } from "../lib/adapters/ngspice/adapter";

// vitest runs with the repository root as the working directory.
const ROOT = join(process.cwd(), "examples", "rc-filter-workspace");

describe("example workspace", () => {
  it("has a valid schemaVersion 1 manifest", () => {
    const manifest = parseManifest(readFileSync(join(ROOT, "workbench.json"), "utf8"));
    expect(manifest.name).toBe("RC Filter Study");
    expect(manifest.requirements).toHaveLength(3);
    expect(manifest.simulations).toHaveLength(3);
    // Every simulation traces to at least one requirement that exists.
    const reqIds = new Set(manifest.requirements.map((r) => r.id));
    for (const sim of manifest.simulations) {
      expect(sim.requirementIds.length).toBeGreaterThan(0);
      for (const id of sim.requirementIds) expect(reqIds.has(id), id).toBe(true);
    }
  });

  it("references files that exist and netlists that validate cleanly", () => {
    const manifest = parseManifest(readFileSync(join(ROOT, "workbench.json"), "utf8"));
    for (const sim of manifest.simulations) {
      const rel = sim.params.netlistRelPath as string;
      const abs = join(ROOT, rel);
      expect(existsSync(abs), rel).toBe(true);
      const errors = validateNetlist(readFileSync(abs, "utf8")).filter((i) => i.severity === "error");
      expect(errors, rel).toEqual([]);
    }
    for (const req of manifest.requirements) {
      if (req.sourceRelPath) expect(existsSync(join(ROOT, req.sourceRelPath)), req.sourceRelPath).toBe(true);
    }
  });

  it("configures analyses the ngspice adapter accepts", () => {
    const manifest = parseManifest(readFileSync(join(ROOT, "workbench.json"), "utf8"));
    const adapter = new NgspiceAdapter();
    for (const sim of manifest.simulations) {
      const issues = adapter.validate({ capabilityId: sim.capabilityId, params: sim.params });
      expect(issues.filter((i) => i.severity === "error"), sim.id).toEqual([]);
    }
  });
});
