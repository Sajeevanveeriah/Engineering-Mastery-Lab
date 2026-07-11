import { describe, it, expect } from "vitest";
import { PROGRESS_IMPORT_LIMITS, exportProgress, importProgress, emptyProgress } from "../lib/storage";

const malformedSections: Array<[string, Record<string, unknown>, RegExp]> = [
  ["skill level", { skillRatings: { controls: { level: 6, evidence: "test" } } }, /level/],
  ["skill evidence", { skillRatings: { controls: { level: 3, evidence: 42 } } }, /evidence/],
  ["challenge pass state", { challenges: { pid: { passed: "yes", completedAt: "2026-01-01T00:00:00Z" } } }, /passed/],
  ["challenge timestamp", { challenges: { pid: { passed: true, completedAt: "2026-02-30T00:00:00Z" } } }, /completedAt/],
  ["challenge notes", { challenges: { pid: { passed: true, completedAt: "2026-01-01T00:00:00Z", notes: 3 } } }, /notes/],
  ["reflection", { reflections: { pid: false } }, /reflections/],
  ["artefact", { artefacts: { report: "complete" } }, /artefacts/],
  ["checklist item", { sprintChecklist: { review: 1 } }, /sprintChecklist/],
  ["theme", { theme: "blue" }, /theme/]
];

describe("progress export/import", () => {
  it("round-trips a progress state", () => {
    const state = structuredClone(emptyProgress);
    state.skillRatings["controls-l1"] = { level: 4, evidence: "PID challenge screenshots" };
    state.challenges["pid-c2"] = { passed: true, completedAt: "2026-01-01T00:00:00Z" };
    state.theme = "light";

    const json = exportProgress(state);
    const restored = importProgress(json);
    expect(restored).toEqual(state);
  });

  it("rejects non-object input", () => {
    expect(() => importProgress("42")).toThrow();
  });

  it("rejects unsupported versions", () => {
    expect(() => importProgress(JSON.stringify({ version: 99 }))).toThrow(/version/);
  });

  it("fills missing sections with defaults", () => {
    const restored = importProgress(JSON.stringify({ version: 1 }));
    expect(restored.skillRatings).toEqual({});
    expect(restored.theme).toBe("light");
  });

  it.each(malformedSections)("rejects a malformed nested %s", (_name, section, message) => {
    expect(() => importProgress(JSON.stringify({ version: 1, ...section }))).toThrow(message);
  });

  it("rejects overlong evidence before replacing progress", () => {
    const evidence = "x".repeat(PROGRESS_IMPORT_LIMITS.evidenceCharacters + 1);
    expect(() => importProgress(JSON.stringify({
      version: 1,
      skillRatings: { controls: { level: 3, evidence } }
    }))).toThrow(/evidence/);
  });

  it("rejects sections that exceed their bounded entry count", () => {
    const artefacts = Object.fromEntries(
      Array.from({ length: PROGRESS_IMPORT_LIMITS.entriesPerSection + 1 }, (_, index) => [`item-${index}`, true])
    );
    expect(() => importProgress(JSON.stringify({ version: 1, artefacts }))).toThrow(/entries/);
  });

  it("rejects unsafe record keys", () => {
    expect(() => importProgress('{"version":1,"artefacts":{"__proto__":true}}')).toThrow(/unsafe key/);
  });
});
