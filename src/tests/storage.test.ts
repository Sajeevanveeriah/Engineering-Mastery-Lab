import { describe, it, expect } from "vitest";
import { exportProgress, importProgress, emptyProgress } from "../lib/storage";

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
    expect(restored.theme).toBe("dark");
  });
});
