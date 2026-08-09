import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  BREP_CAPABILITIES,
  BREP_WASM_BASENAME,
  brepTransferables,
  createBrepRuntime,
  createBrepWorkerClient,
  parseBrepWorkerRequest,
  reconcileBrepOutputBody,
  validateBrepDocument,
  type BrepDocument,
  type BrepRuntime,
  type BrepWorkerEventMap,
  type BrepWorkerLike,
  type BrepWorkerRequest,
  type BrepWorkerResponse
} from "../lib/cad/brep";
import {
  createBooleanFixture,
  createInvalidFilletFixture,
  createRevolveFixture,
  createSketchPadPocketFixture
} from "../lib/cad/brepFixtures";

let runtime: BrepRuntime;

beforeAll(async () => {
  runtime = await createBrepRuntime();
}, 60_000);

describe("OCCT B-rep runtime", () => {
  it("ships exactly the single non-exception OCCT WASM worker path", () => {
    const workerSource = readFileSync(new URL("../lib/cad/brep.worker.ts", import.meta.url), "utf8");
    expect(BREP_WASM_BASENAME).toBe("replicad_single.wasm");
    expect(workerSource).toContain("replicad-opencascadejs/src/replicad_single.wasm?url");
    expect(workerSource).not.toContain("replicad_with_exceptions");
  });

  it("builds a real sketch, pad and pocket while excluding construction geometry", async () => {
    const result = await runtime.evaluate(createSketchPadPocketFixture());
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("through-pocket");
    expect(result.constructionEntityCount).toBe(1);
    expect(result.mesh?.positions.length).toBeGreaterThan(0);
    expect(result.mesh?.indices.length).toBeGreaterThan(0);
    expect(result.mesh?.edgePositions.length).toBeGreaterThan(0);
    expect(result.mesh?.bounds.min[2]).toBeGreaterThan(-0.05);
    expect(result.mesh?.bounds.max[2]).toBeCloseTo(10, 1);
  });

  it("builds a real revolved closed polyline", async () => {
    const result = await runtime.evaluate(createRevolveFixture());
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("revolved-body");
    expect(result.mesh?.indices.length).toBeGreaterThan(30);
  });

  it.each(["XZ", "YZ"] as const)("pads a rectangle sketched on the %s plane", async (plane) => {
    const result = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [
        {
          id: "plane-sketch",
          name: "Plane sketch",
          kind: "sketch",
          plane,
          offset: 2,
          entities: [{ id: "rectangle", kind: "rectangle", origin: [1, 1], width: 8, height: 6 }]
        },
        { id: "plane-pad", name: "Plane pad", kind: "pad", sketchId: "plane-sketch", length: 4 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "plane-pad", visible: true }]
    });
    expect(result.ok).toBe(true);
    expect(result.mesh?.indices.length).toBeGreaterThan(0);
  });

  it.each(["XY", "XZ", "YZ"] as const)("uses identical %s plane offsets for primitive and connected-line profiles", async (plane) => {
    const rectangle = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [
        {
          id: "sketch",
          name: "Rectangle sketch",
          kind: "sketch",
          plane,
          offset: 3,
          entities: [{ id: "rectangle", kind: "rectangle", origin: [1, 2], width: 8, height: 6 }]
        },
        { id: "pad", name: "Pad", kind: "pad", sketchId: "sketch", length: 4 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "pad", visible: true }]
    });
    const lineLoop = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [
        {
          id: "sketch",
          name: "Line-loop sketch",
          kind: "sketch",
          plane,
          offset: 3,
          entities: [
            { id: "line-1", kind: "line", start: [1, 2], end: [9, 2] },
            { id: "line-2", kind: "line", start: [9, 2], end: [9, 8] },
            { id: "line-3", kind: "line", start: [9, 8], end: [1, 8] },
            { id: "line-4", kind: "line", start: [1, 8], end: [1, 2] },
            { id: "construction", kind: "line", start: [1, 5], end: [9, 5], construction: true }
          ]
        },
        { id: "pad", name: "Pad", kind: "pad", sketchId: "sketch", length: 4 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "pad", visible: true }]
    });
    expect(rectangle.ok).toBe(true);
    expect(lineLoop.ok).toBe(true);
    expect(lineLoop.constructionEntityCount).toBe(1);
    rectangle.mesh?.bounds.min.forEach((value, index) => expect(lineLoop.mesh?.bounds.min[index]).toBeCloseTo(value, 3));
    rectangle.mesh?.bounds.max.forEach((value, index) => expect(lineLoop.mesh?.bounds.max[index]).toBeCloseTo(value, 3));
    const normalAxis = plane === "YZ" ? 0 : plane === "XZ" ? 1 : 2;
    const expected = plane === "XZ" ? [-7, -3] : [3, 7];
    expect(rectangle.mesh?.bounds.min[normalAxis]).toBeCloseTo(expected[0], 1);
    expect(rectangle.mesh?.bounds.max[normalAxis]).toBeCloseTo(expected[1], 1);
  });

  it("fails closed for disconnected and open multi-entity solid profiles", async () => {
    for (const entities of [
      [
        { id: "line-1", kind: "line", start: [0, 0], end: [5, 0] },
        { id: "line-2", kind: "line", start: [8, 0], end: [8, 5] }
      ],
      [
        { id: "line-1", kind: "line", start: [0, 0], end: [5, 0] },
        { id: "line-2", kind: "line", start: [5, 0], end: [5, 5] }
      ]
    ] as const) {
      const result = await runtime.evaluate({
        schemaVersion: 1,
        units: "mm",
        features: [
          { id: "sketch", name: "Invalid profile", kind: "sketch", plane: "XY", offset: 0, entities },
          { id: "pad", name: "Pad", kind: "pad", sketchId: "sketch", length: 2 }
        ],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "pad", visible: true }]
      });
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: "FEATURE_FAILED", featureId: "pad", recoverable: false });
    }
  });

  it("supports the explicit extrude feature name", async () => {
    const result = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [
        {
          id: "circle-sketch",
          name: "Circle sketch",
          kind: "sketch",
          plane: "XY",
          offset: 0,
          entities: [{ id: "circle", kind: "circle", centre: [0, 0], radius: 4 }]
        },
        { id: "extrusion", name: "Extrusion", kind: "extrude", sketchId: "circle-sketch", length: 7 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "extrusion", visible: true }]
    });
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("extrusion");
  });

  it("builds a closed arc profile and applies valid all-edge fillet and chamfer features", async () => {
    const arcPad = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [
        {
          id: "arc-sketch",
          name: "Arc sketch",
          kind: "sketch",
          plane: "XY",
          offset: 0,
          entities: [{ id: "arc", kind: "arc", start: [-5, 0], via: [0, 5], end: [5, 0], closed: true }]
        },
        { id: "arc-pad", name: "Arc pad", kind: "pad", sketchId: "arc-sketch", length: 4 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "arc-pad", visible: true }]
    });
    expect(arcPad.ok).toBe(true);
    for (const modifier of [
      { id: "fillet", name: "Fillet", kind: "fillet", targetId: "box", radius: 1 },
      { id: "chamfer", name: "Chamfer", kind: "chamfer", targetId: "box", radius: 0.5 }
    ] as const) {
      const finished = await runtime.evaluate({
        schemaVersion: 1,
        units: "mm",
        features: [
          { id: "box", name: "Box", kind: "box", width: 20, depth: 20, height: 20 },
          modifier
        ],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: modifier.id, visible: true }]
      });
      expect(finished.ok).toBe(true);
      expect(finished.features.at(-1)?.status, modifier.kind).toBe("built");
      expect(finished.features.at(-1)?.operationScope, modifier.kind).toBe("all-edges");
    }
  });

  it.each(["union", "subtract", "intersect"] as const)("runs the %s OCCT boolean", async (operation) => {
    const result = await runtime.evaluate(createBooleanFixture(operation));
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("boolean-result");
    expect(result.mesh?.positions.length).toBeGreaterThan(0);
  });

  it("builds exact box, cylinder and sphere primitives", async () => {
    for (const feature of [
      { id: "box", name: "Box", kind: "box", width: 10, depth: 12, height: 14 },
      { id: "cylinder", name: "Cylinder", kind: "cylinder", radius: 5, height: 20 },
      { id: "sphere", name: "Sphere", kind: "sphere", radius: 6 }
    ] as const) {
      const result = await runtime.evaluate({
        schemaVersion: 1,
        units: "mm",
        features: [feature],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: feature.id, visible: true }]
      });
      expect(result.ok, feature.kind).toBe(true);
      expect(result.mesh?.indices.length, feature.kind).toBeGreaterThan(0);
    }
  });

  it("rolls an invalid fillet back to the last valid body", async () => {
    const baseline = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [{ id: "box", name: "Box", kind: "box", width: 20, depth: 20, height: 20 }],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
    });
    const result = await runtime.evaluate(createInvalidFilletFixture());
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("box");
    expect(result.outputBodyId).toBe("body");
    expect(result.failedFeatureIds).toEqual(["invalid-fillet"]);
    expect(result.rolledBackFeatureIds).toEqual(["invalid-fillet"]);
    expect(result.bodies).toMatchObject([
      { id: "body", sourceFeatureId: "invalid-fillet", status: "resolved", resolvedFeatureId: "box" }
    ]);
    expect(result.features.at(-1)?.status).toBe("rolled-back");
    expect(result.features.at(-1)?.operationScope).toBe("all-edges");
    expect(result.errors).toMatchObject([{ code: "FEATURE_FAILED", featureId: "invalid-fillet", recoverable: true }]);
    expect(result.mesh?.bounds).toEqual(baseline.mesh?.bounds);
  });

  it("refuses ordinary export when the rebuild contains a rolled-back error", async () => {
    const result = await runtime.export(createInvalidFilletFixture(), "step");
    expect(result).toMatchObject({
      ok: false,
      error: { code: "EXPORT_FAILED", recoverable: true }
    });
    if (result.ok || !result.error) throw new Error("Defective export unexpectedly succeeded");
    expect(result.error.message).toContain("Export refused because the rebuild contains errors");
  });

  it("reconciles one explicit output body without pointing it at failed or suppressed features", async () => {
    const failedDocument = createInvalidFilletFixture();
    const evaluation = await runtime.evaluate(failedDocument);
    const reconciled = reconcileBrepOutputBody(failedDocument, evaluation);
    expect(reconciled).toMatchObject({
      ok: true,
      changed: true,
      reason: "last-built",
      document: { bodies: [{ id: "body", name: "Last-valid body", sourceFeatureId: "box", visible: true }] }
    });
    const suppressed: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "box", name: "Box", kind: "box", width: 10, depth: 10, height: 10 },
        { id: "sphere", name: "Sphere", kind: "sphere", radius: 5, suppressed: true }
      ],
      bodies: [{ id: "preserved-id", name: "Preserved name", sourceFeatureId: "sphere", visible: true }]
    };
    expect(reconcileBrepOutputBody(suppressed)).toMatchObject({
      ok: true,
      document: { bodies: [{ id: "preserved-id", name: "Preserved name", sourceFeatureId: "box", visible: true }] }
    });
    expect(reconcileBrepOutputBody({
      ...suppressed,
      bodies: [
        { id: "a", name: "A", sourceFeatureId: "box", visible: true },
        { id: "b", name: "B", sourceFeatureId: "box", visible: false }
      ]
    })).toMatchObject({ ok: false, error: { code: "DOCUMENT_INVALID", recoverable: false } });
  });

  it("advances the output body to a later eligible feature before evaluating editor mutations", async () => {
    const initialDocument: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [{ id: "box", name: "Box", kind: "box", width: 10, depth: 10, height: 10 }],
      bodies: [{ id: "preserved-id", name: "Preserved name", sourceFeatureId: "box", visible: true }]
    };
    const staleEvaluation = await runtime.evaluate(initialDocument);
    const editedDocument: BrepDocument = {
      ...initialDocument,
      features: [
        ...initialDocument.features,
        { id: "sphere", name: "Later sphere", kind: "sphere", radius: 8 }
      ]
    };
    const editTime = reconcileBrepOutputBody(editedDocument);
    expect(editTime).toMatchObject({
      ok: true,
      changed: true,
      reason: "last-declared",
      document: { bodies: [{ id: "preserved-id", name: "Preserved name", sourceFeatureId: "sphere", visible: true }] }
    });
    expect(reconcileBrepOutputBody(editedDocument, staleEvaluation)).toMatchObject({
      ok: true,
      changed: true,
      reason: "last-declared",
      document: { bodies: [{ sourceFeatureId: "sphere" }] }
    });
    if (!editTime.ok) throw new Error(editTime.error.message);
    const evaluation = await runtime.evaluate(editTime.document);
    expect(evaluation.outputFeatureId).toBe("sphere");
    expect(reconcileBrepOutputBody(editTime.document, evaluation)).toMatchObject({
      ok: true,
      changed: false,
      reason: "last-built",
      document: { bodies: [{ sourceFeatureId: "sphere" }] }
    });
  });

  it("rebuilds pocket cutters repeatedly without invalidating OCCT objects", async () => {
    for (let iteration = 0; iteration < 20; iteration += 1) {
      const result = await runtime.evaluate(createSketchPadPocketFixture());
      expect(result.ok, `rebuild ${iteration}`).toBe(true);
      expect(result.mesh?.indices.length, `rebuild ${iteration}`).toBeGreaterThan(0);
    }
  });

  it("suppresses a feature without evaluating its invalid dimensions", async () => {
    const document: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "box", name: "Box", kind: "box", width: 10, depth: 10, height: 10 },
        { id: "suppressed", name: "Suppressed", kind: "sphere", radius: -1, suppressed: true }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
    };
    const result = await runtime.evaluate(document);
    expect(result.ok).toBe(true);
    expect(result.features.at(-1)?.status).toBe("suppressed");
  });

  it("rejects non-finite dimensions before OCCT execution", async () => {
    const result = await runtime.evaluate({
      schemaVersion: 1,
      units: "mm",
      features: [{ id: "box", name: "Box", kind: "box", width: Number.NaN, depth: 10, height: 10 }],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatchObject({ code: "DOCUMENT_INVALID", recoverable: false });
  });

  it("fails closed for unknown feature/entity kinds and malformed runtime fields", async () => {
    const defective = [
      {
        schemaVersion: 1,
        units: "mm",
        features: [{ id: "unknown", name: "Unknown", kind: "torus", radius: 4 }],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "unknown", visible: true }]
      },
      {
        schemaVersion: 1,
        units: "mm",
        features: [
          { id: "box", name: "Box", kind: "box", width: 1, depth: 1, height: 1 },
          { id: "sketch", name: "Sketch", kind: "sketch", plane: "XY", offset: 0, entities: [{ id: "entity", kind: "spline", points: [] }] }
        ],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
      },
      {
        schemaVersion: 1,
        units: "mm",
        features: [
          { id: "box", name: "Box", kind: "box", width: 1, depth: 1, height: 1 },
          { id: "sketch", name: "Sketch", kind: "sketch", plane: "XY", offset: 0, entities: [{ id: "line", kind: "line", start: [0], end: [1, 1] }] }
        ],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
      },
      {
        schemaVersion: 1,
        units: "mm",
        features: [{ id: "box", name: "Box", kind: "box", width: 1, depth: 2, height: 3, unexpected: true }],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
      },
      {
        schemaVersion: 1,
        units: "mm",
        features: [null],
        bodies: [{ id: "body", name: "Body", sourceFeatureId: "box", visible: true }]
      }
    ];
    for (const document of defective) {
      const result = await runtime.evaluate(document as unknown as BrepDocument);
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: "DOCUMENT_INVALID", recoverable: false });
    }
  });

  it("rejects missing, forward and cyclic dependencies before modelling", async () => {
    const missing: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [{ id: "fillet", name: "All-edge fillet", kind: "fillet", targetId: "missing", radius: 1 }],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "fillet", visible: true }]
    };
    const forward: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "fillet", name: "All-edge fillet", kind: "fillet", targetId: "box", radius: 1 },
        { id: "box", name: "Box", kind: "box", width: 10, depth: 10, height: 10 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "fillet", visible: true }]
    };
    const cycle = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "a", name: "A", kind: "fillet", targetId: "b", radius: 1 },
        { id: "b", name: "B", kind: "chamfer", targetId: "a", radius: 1 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "b", visible: true }]
    } as unknown as BrepDocument;
    for (const document of [missing, forward, cycle]) {
      const result = await runtime.evaluate(document);
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: "DOCUMENT_INVALID", recoverable: false });
    }
  });

  it("builds a bounded top-planar-Z face sketch without claiming persistent topological naming", async () => {
    expect(BREP_CAPABILITIES).toMatchObject({ planarFaceSketches: "top-planar-z-only", stableEdgeSelection: false });
    const planarFaceDocument: BrepDocument = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "box", name: "Box", kind: "box", width: 20, depth: 20, height: 10 },
        {
          id: "face-sketch",
          name: "Face sketch",
          kind: "sketch",
          plane: "XY",
          offset: 0,
          support: { kind: "planar-face", targetId: "box", selector: "top-planar-z" },
          entities: [{ id: "circle", kind: "circle", centre: [10, 10], radius: 3 }]
        },
        { id: "pocket", name: "Face-attached pocket", kind: "pocket", targetId: "box", sketchId: "face-sketch", depth: 10 }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "pocket", visible: true }]
    };
    expect(validateBrepDocument(planarFaceDocument)).toBeNull();
    const result = await runtime.evaluate(planarFaceDocument);
    expect(result.ok).toBe(true);
    expect(result.outputFeatureId).toBe("pocket");
    expect(result.mesh?.indices.length).toBeGreaterThan(0);

    const unsupportedSelector = structuredClone(planarFaceDocument) as unknown as {
      features: Array<{ support?: { kind: string; targetId: string; selector: string } }>;
    };
    if (!unsupportedSelector.features[1].support) throw new Error("Fixture shape changed");
    unsupportedSelector.features[1].support.selector = "face-id-42";
    expect(validateBrepDocument(unsupportedSelector)).toMatchObject({ code: "UNSUPPORTED_FEATURE", recoverable: false });

    const dangling = structuredClone(planarFaceDocument);
    const sketch = dangling.features[1];
    if (sketch.kind !== "sketch" || sketch.support?.kind !== "planar-face") throw new Error("Fixture shape changed");
    sketch.support.targetId = "missing";
    expect(validateBrepDocument(dangling)).toMatchObject({ code: "DOCUMENT_INVALID", recoverable: false });

    const unsupportedOffset = structuredClone(planarFaceDocument);
    const offsetSketch = unsupportedOffset.features[1];
    if (offsetSketch.kind !== "sketch") throw new Error("Fixture shape changed");
    offsetSketch.offset = 1;
    expect(validateBrepDocument(unsupportedOffset)).toMatchObject({
      code: "UNSUPPORTED_FEATURE",
      recoverable: false,
      message: expect.stringContaining("offset")
    });

    for (const plane of ["XZ", "YZ"] as const) {
      const unsupportedPlane = structuredClone(planarFaceDocument);
      const planeSketch = unsupportedPlane.features[1];
      if (planeSketch.kind !== "sketch") throw new Error("Fixture shape changed");
      planeSketch.plane = plane;
      expect(validateBrepDocument(unsupportedPlane), plane).toMatchObject({
        code: "UNSUPPORTED_FEATURE",
        recoverable: false,
        message: expect.stringContaining("plane XY")
      });
    }

    const selectedEdges = {
      schemaVersion: 1,
      units: "mm",
      features: [
        { id: "box", name: "Box", kind: "box", width: 10, depth: 10, height: 10 },
        { id: "fillet", name: "Fillet", kind: "fillet", targetId: "box", radius: 1, edgeIds: [1] }
      ],
      bodies: [{ id: "body", name: "Body", sourceFeatureId: "fillet", visible: true }]
    };
    expect(validateBrepDocument(selectedEdges)).toMatchObject({ code: "DOCUMENT_INVALID", recoverable: false });
  });

  it("rejects malformed worker messages before kernel execution", () => {
    expect(parseBrepWorkerRequest({ kind: "evaluate", jobId: "bad", document: { schemaVersion: 1, units: "mm", features: [] } })).toMatchObject({
      ok: false,
      jobId: "bad",
      error: { code: "DOCUMENT_INVALID", recoverable: false, recovery: "none" }
    });
    expect(parseBrepWorkerRequest({ kind: "execute-shell", jobId: "bad" })).toMatchObject({
      ok: false,
      error: { code: "DOCUMENT_INVALID", recoverable: false }
    });
    expect(parseBrepWorkerRequest({ kind: "cancel", jobId: "bad id with spaces" })).toMatchObject({ ok: false });
  });

  it("exports binary STL, ASCII STL and STEP using the proven shape APIs", async () => {
    const document = createSketchPadPocketFixture();
    const binaryStl = await runtime.export(document, "stl-binary");
    const asciiStl = await runtime.export(document, "stl-ascii");
    const step = await runtime.export(document, "step");
    expect(binaryStl.ok).toBe(true);
    expect(binaryStl.bytes?.byteLength).toBeGreaterThan(84);
    expect(new TextDecoder().decode(asciiStl.bytes?.slice(0, 5))).toBe("solid");
    expect(new TextDecoder().decode(step.bytes?.slice(0, 9))).toContain("ISO-10303");
  });

  it("imports STEP only as a tessellated preview with explicit fidelity losses", async () => {
    const exported = await runtime.export(createBooleanFixture("union"), "step");
    expect(exported.bytes).toBeDefined();
    const imported = await runtime.import("step", exported.bytes as ArrayBuffer);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    expect(imported.mesh.indices.length).toBeGreaterThan(0);
    expect(imported.metadata).toMatchObject({
      representation: "tessellated-preview",
      assumedUnits: "mm",
      unitsStatus: "assumed-not-verified",
      hierarchyPreserved: false,
      editableFeaturesPreserved: false,
      exactBrepExposed: false
    });
  });

  it("truthfully rejects unsupported IGES and BREP imports", async () => {
    for (const format of ["iges", "brep"] as const) {
      const unsupported = await runtime.import(format, new ArrayBuffer(8));
      expect(unsupported).toMatchObject({ ok: false, error: { code: "UNSUPPORTED_FORMAT", recoverable: true } });
    }
  });

  it("returns every mesh buffer as a transferable payload", async () => {
    const result = await runtime.evaluate(createBooleanFixture("subtract"));
    const transferables = brepTransferables(result);
    expect(transferables).toHaveLength(6);
    expect(new Set(transferables).size).toBe(6);
  });

  it("honours a pre-cancelled signal", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(runtime.evaluate(createBooleanFixture(), controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});

class SilentWorker implements BrepWorkerLike {
  readonly posted: BrepWorkerRequest[] = [];
  terminated = false;
  private readonly messageListeners = new Set<(event: MessageEvent<BrepWorkerResponse>) => void>();
  private readonly errorListeners = new Set<(event: ErrorEvent) => void>();
  private readonly messageErrorListeners = new Set<(event: MessageEvent<unknown>) => void>();

  postMessage(message: BrepWorkerRequest): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  addEventListener<K extends keyof BrepWorkerEventMap>(
    type: K,
    listener: (event: BrepWorkerEventMap[K]) => void
  ): void {
    if (type === "message") this.messageListeners.add(listener as (event: MessageEvent<BrepWorkerResponse>) => void);
    if (type === "error") this.errorListeners.add(listener as (event: ErrorEvent) => void);
    if (type === "messageerror") this.messageErrorListeners.add(listener as (event: MessageEvent<unknown>) => void);
  }

  removeEventListener<K extends keyof BrepWorkerEventMap>(
    type: K,
    listener: (event: BrepWorkerEventMap[K]) => void
  ): void {
    if (type === "message") this.messageListeners.delete(listener as (event: MessageEvent<BrepWorkerResponse>) => void);
    if (type === "error") this.errorListeners.delete(listener as (event: ErrorEvent) => void);
    if (type === "messageerror") this.messageErrorListeners.delete(listener as (event: MessageEvent<unknown>) => void);
  }

  emit(response: BrepWorkerResponse): void {
    const event = { data: response } as MessageEvent<BrepWorkerResponse>;
    this.messageListeners.forEach((listener) => listener(event));
  }

  emitError(message: string): void {
    const event = { message } as ErrorEvent;
    this.errorListeners.forEach((listener) => listener(event));
  }

  emitMessageError(): void {
    const event = {} as MessageEvent<unknown>;
    this.messageErrorListeners.forEach((listener) => listener(event));
  }
}

describe("B-rep worker lifecycle", () => {
  it("terminates and replaces a worker at the timeout boundary", async () => {
    const workers: SilentWorker[] = [];
    const client = createBrepWorkerClient(() => {
      const worker = new SilentWorker();
      workers.push(worker);
      return worker;
    }, 5);
    await expect(client.run({ kind: "evaluate", jobId: "timeout-job", document: createBooleanFixture() })).rejects.toMatchObject({
      detail: { code: "TIMEOUT", recoverable: true }
    });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
    client.dispose();
  });

  it("terminates the active worker when a job is cancelled", async () => {
    const workers: SilentWorker[] = [];
    const client = createBrepWorkerClient(() => {
      const worker = new SilentWorker();
      workers.push(worker);
      return worker;
    });
    const pending = client.run({ kind: "evaluate", jobId: "cancel-job", document: createBooleanFixture() });
    client.cancel("cancel-job");
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(workers[0].posted.at(-1)).toEqual({ kind: "cancel", jobId: "cancel-job" });
    expect(workers[0].terminated).toBe(true);
    client.dispose();
  });

  it("marks initialisation failure as requiring replacement and restarts the client worker", async () => {
    const workers: SilentWorker[] = [];
    const client = createBrepWorkerClient(() => {
      const worker = new SilentWorker();
      workers.push(worker);
      return worker;
    });
    const pending = client.run({ kind: "evaluate", jobId: "initialisation-job", document: createBooleanFixture() });
    workers[0].emit({
      kind: "error",
      jobId: "initialisation-job",
      error: {
        code: "INITIALISATION_FAILED",
        message: "Synthetic initialisation failure. The failed OCCT worker must be replaced before retrying.",
        recoverable: false,
        recovery: "replace-worker"
      }
    });
    await expect(pending).resolves.toMatchObject({
      kind: "error",
      error: { code: "INITIALISATION_FAILED", recoverable: false, recovery: "replace-worker" }
    });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
    client.dispose();
  });

  it.each([
    ["error", (worker: SilentWorker) => worker.emitError("Synthetic fatal worker error")],
    ["messageerror", (worker: SilentWorker) => worker.emitMessageError()]
  ] as const)("rejects the active job and replaces the worker after a fatal %s event", async (_eventType, emitFailure) => {
    const workers: SilentWorker[] = [];
    const client = createBrepWorkerClient(() => {
      const worker = new SilentWorker();
      workers.push(worker);
      return worker;
    });
    const pending = client.run({ kind: "evaluate", jobId: "fatal-worker-job", document: createBooleanFixture() });
    emitFailure(workers[0]);
    await expect(pending).rejects.toMatchObject({
      detail: { code: "WORKER_FAILED", recoverable: true, recovery: "retry-job" }
    });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
    client.dispose();
  });
});
