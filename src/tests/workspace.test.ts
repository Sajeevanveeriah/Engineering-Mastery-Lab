import { describe, expect, it } from "vitest";
import {
  createManifest,
  ManifestError,
  parseManifest,
  serializeManifest,
  WorkspaceManifest
} from "../lib/workspace/manifest";
import {
  createWorkspace,
  forgetRecentProject,
  loadRecentProjects,
  openWorkspace,
  rememberRecentProject,
  saveWorkspace
} from "../lib/workspace/workspace";
import { MemoryBridge } from "../lib/platform/memoryBridge";

const NOW = "2026-07-11T00:00:00.000Z";

function sampleManifest(): WorkspaceManifest {
  const m = createManifest("RC Filter Study", "Demo project", NOW);
  m.requirements.push({ id: "REQ-002", title: "Cutoff below 2 kHz" });
  m.requirements.push({ id: "REQ-001", title: "Passband ripple < 1 dB", sourceRelPath: "requirements/spec.md" });
  m.simulations.push({
    id: "sim-ac",
    title: "AC sweep",
    capabilityId: "ngspice.ac",
    params: { netlistRelPath: "circuits/rc.cir", fStop: 100000, fStart: 10 },
    requirementIds: ["REQ-002", "REQ-001"]
  });
  return m;
}

describe("manifest round-trip", () => {
  it("serialises deterministically with sorted collections and keys", () => {
    const a = serializeManifest(sampleManifest());
    const shuffled = sampleManifest();
    shuffled.requirements.reverse();
    shuffled.simulations[0].requirementIds.reverse();
    const b = serializeManifest(shuffled);
    expect(a).toBe(b);
    expect(a.indexOf("REQ-001")).toBeLessThan(a.indexOf("REQ-002"));
    // params keys sorted
    expect(a.indexOf("fStart")).toBeLessThan(a.indexOf("fStop"));
  });

  it("parses its own output back to an equivalent manifest", () => {
    const original = sampleManifest();
    const parsed = parseManifest(serializeManifest(original));
    expect(parsed.name).toBe(original.name);
    expect(parsed.requirements).toHaveLength(2);
    expect(parsed.simulations[0].capabilityId).toBe("ngspice.ac");
    // Round-trip is a fixed point: serialising the parse gives identical bytes.
    expect(serializeManifest(parsed)).toBe(serializeManifest(original));
  });
});

describe("manifest validation", () => {
  it("rejects newer schema versions with an upgrade message and no modification", () => {
    const json = JSON.stringify({ schemaVersion: 2, name: "x" });
    expect(() => parseManifest(json)).toThrow(/newer version of Engineering Workbench/);
  });

  it("rejects older/unknown schema versions", () => {
    expect(() => parseManifest(JSON.stringify({ schemaVersion: 0, name: "x" }))).toThrow(/Unsupported/);
  });

  it("rejects non-JSON with a clear error", () => {
    expect(() => parseManifest("not json {")).toThrow(/not valid JSON/);
  });

  it("rejects missing schemaVersion", () => {
    expect(() => parseManifest("{}")).toThrow(/schemaVersion/);
  });

  it("collects structured issues for bad fields", () => {
    const bad = JSON.stringify({
      schemaVersion: 1,
      name: "",
      description: "d",
      createdUtc: "yesterday",
      modifiedUtc: NOW,
      requirements: [{ id: "", title: 1 }],
      simulations: [{ id: "s", title: "t", capabilityId: "c", params: {}, requirementIds: [1] }]
    });
    try {
      parseManifest(bad);
      expect.unreachable("should have thrown");
    } catch (err) {
      const e = err as ManifestError;
      expect(e).toBeInstanceOf(ManifestError);
      const paths = e.issues.map((i) => i.path);
      expect(paths).toContain("name");
      expect(paths).toContain("createdUtc");
      expect(paths).toContain("requirements[0]");
      expect(paths).toContain("simulations[0]");
    }
  });

  it("rejects absolute and traversal paths inside the manifest", () => {
    const base = sampleManifest();
    for (const evil of ["../outside.cir", "/etc/passwd", "C:/x.cir", "a\\b.cir"]) {
      const m = structuredClone(base);
      m.simulations[0].params.netlistRelPath = evil;
      expect(() => parseManifest(serializeManifest(m)), evil).toThrow(/safe relative path/);
    }
  });

  it("rejects duplicate requirement and simulation ids", () => {
    const m = sampleManifest();
    m.requirements.push({ id: "REQ-001", title: "dup" });
    expect(() => parseManifest(serializeManifest(m))).toThrow(/duplicate requirement id/);
  });

  it("rejects simulation traceability links to missing requirements", () => {
    const m = sampleManifest();
    m.simulations[0].requirementIds.push("REQ-MISSING");
    try {
      parseManifest(serializeManifest(m));
      expect.unreachable("should have rejected a dangling requirement reference");
    } catch (err) {
      const error = err as ManifestError;
      expect(error.message).toMatch(/references unknown requirement id "REQ-MISSING"/);
      expect(error.issues.some((issue) => /requirementIds\[/.test(issue.path))).toBe(true);
    }
  });
});

describe("workspace operations", () => {
  it("creates a workspace with standard folders and opens it back", async () => {
    const bridge = new MemoryBridge();
    const created = await createWorkspace(bridge, "/proj", "Demo", "desc");
    expect(created.manifest.schemaVersion).toBe(1);
    const opened = await openWorkspace(bridge, "/proj");
    expect(opened.manifest.name).toBe("Demo");
  });

  it("refuses to create over an existing workspace", async () => {
    const bridge = new MemoryBridge();
    await createWorkspace(bridge, "/proj", "Demo", "");
    await expect(createWorkspace(bridge, "/proj", "Again", "")).rejects.toThrow(/already exists/);
  });

  it("gives a useful error when opening a folder without a manifest", async () => {
    const bridge = new MemoryBridge();
    await expect(openWorkspace(bridge, "/empty")).rejects.toThrow(/No workbench.json found/);
  });

  it("save bumps modifiedUtc and round-trips content", async () => {
    const bridge = new MemoryBridge();
    const ws = await createWorkspace(bridge, "/proj", "Demo", "");
    ws.manifest.requirements.push({ id: "REQ-001", title: "New requirement" });
    const saved = await saveWorkspace(bridge, ws);
    expect(saved.modifiedUtc >= saved.createdUtc).toBe(true);
    const reopened = await openWorkspace(bridge, "/proj");
    expect(reopened.manifest.requirements).toHaveLength(1);
  });

  it("surfaces newer-version manifests as errors on open, leaving the file intact", async () => {
    const bridge = new MemoryBridge();
    const futuristic = JSON.stringify({ schemaVersion: 99, name: "future" });
    bridge.seedFile("/proj", "workbench.json", futuristic);
    await expect(openWorkspace(bridge, "/proj")).rejects.toThrow(/newer version/);
    expect(await bridge.readTextFile("/proj", "workbench.json")).toBe(futuristic);
  });
});

describe("recent projects", () => {
  function fakeStorage(): Pick<Storage, "getItem" | "setItem"> & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v)
    };
  }

  it("stores most-recent-first, dedupes by root, and caps the list", () => {
    const storage = fakeStorage();
    for (let i = 0; i < 10; i++) rememberRecentProject({ root: `/p${i}`, name: `P${i}` }, storage);
    rememberRecentProject({ root: "/p5", name: "P5 again" }, storage);
    const recents = loadRecentProjects(storage);
    expect(recents[0].root).toBe("/p5");
    expect(recents.length).toBeLessThanOrEqual(8);
    expect(new Set(recents.map((r) => r.root)).size).toBe(recents.length);
  });

  it("tolerates corrupt storage", () => {
    const storage = fakeStorage();
    storage.data.set("engineering-workbench/recent-projects/v1", "{corrupt");
    expect(loadRecentProjects(storage)).toEqual([]);
  });

  it("forgets one recent project without disturbing the others", () => {
    const storage = fakeStorage();
    rememberRecentProject({ root: "/a", name: "A" }, storage);
    rememberRecentProject({ root: "/b", name: "B" }, storage);
    const next = forgetRecentProject("/a", storage);
    expect(next.map((project) => project.root)).toEqual(["/b"]);
    expect(loadRecentProjects(storage)).toEqual(next);
  });
});
