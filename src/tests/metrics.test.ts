import { describe, expect, it } from "vitest";
import { modules } from "../data/modules";
import { artefactCount, moduleProgress, overallProgress, sprintProgress } from "../lib/metrics";
import { emptyProgress } from "../lib/storage";

describe("learning progress metrics", () => {
  it("uses the curriculum as the denominator even before progress is recorded", () => {
    const progress = structuredClone(emptyProgress);
    const artefacts = artefactCount(progress);
    expect(artefacts.done).toBe(0);
    expect(artefacts.total).toBe(modules.reduce((sum, module) => sum + module.evidence.length, 0));
    expect(overallProgress(progress).percent).toBe(0);
  });

  it("counts challenge, evidence and reflection completion for a module", () => {
    const progress = structuredClone(emptyProgress);
    const module = modules[0];
    progress.challenges[module.challenges[0].id] = { passed: true, completedAt: "2026-07-11T00:00:00Z" };
    progress.artefacts[`${module.id}-ev0`] = true;
    progress.reflections[module.id] = "Observed wind-up during saturation.";

    const result = moduleProgress(progress, module);
    expect(result.done).toBe(3);
    expect(result.challengesDone).toBe(1);
    expect(result.evidenceDone).toBe(1);
    expect(result.reflectionDone).toBe(true);
  });

  it("combines curriculum and skills progress without counting unknown keys", () => {
    const progress = structuredClone(emptyProgress);
    progress.skillRatings["controls-l1"] = { level: 4, evidence: "test" };
    progress.skillRatings["unknown"] = { level: 5, evidence: "ignored" };
    const result = overallProgress(progress);
    expect(result.ratedSkills).toBe(1);
    expect(result.done).toBe(1);
    expect(result.total).toBeGreaterThan(result.done);
  });

  it("reports sprint completion from the supplied authoritative items", () => {
    const progress = structuredClone(emptyProgress);
    progress.sprintChecklist.a = true;
    expect(sprintProgress(progress, ["a", "b"])).toEqual({ done: 1, total: 2, percent: 50 });
  });
});
