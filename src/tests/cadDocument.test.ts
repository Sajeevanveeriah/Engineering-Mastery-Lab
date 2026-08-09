import { describe, expect, it } from "vitest";
import { defaultCadDesign } from "../lib/cad/model";
import {
  createCadHistory,
  executeCadCommand,
  executeCadTransaction,
  exportCadDocumentJson,
  importCadDocumentJson,
  migrateCadDesignV1,
  rebuildCadDocument,
  redoCadCommand,
  stableCadId,
  stableCadSourceHash,
  undoCadCommand,
  validateCadDocument,
  type CadBodyId,
  type CadDocument,
  type CadFeatureId
} from "../lib/cad/document";

function migrated(): CadDocument {
  return migrateCadDesignV1(structuredClone(defaultCadDesign));
}

describe("CadDocument v2 defective cases", () => {
  it("rejects unknown future versions before accepting supported documents", () => {
    expect(() => importCadDocumentJson(JSON.stringify({ version: 99 }))).toThrow(/newer unsupported version/);
    expect(() => importCadDocumentJson(JSON.stringify({ version: 2 }))).toThrow(/identifier|arrays/);
    expect(importCadDocumentJson(exportCadDocumentJson(migrated())).version).toBe(2);
  });

  it("rejects a dependency cycle and missing typed references", () => {
    const base = migrated();
    const first = base.features[0];
    const secondId = stableCadId("feature", "second") as CadFeatureId;
    const invalid: CadDocument = {
      ...base,
      features: [
        { ...first, dependsOn: [secondId] },
        { ...first, id: secondId, name: "Second", dependsOn: [first.id], bodyIds: ["missing-body" as CadBodyId] }
      ]
    };
    const result = validateCadDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/cycle/), expect.stringMatching(/missing body/)]));
  });

  it("reports malformed nested v2 records without incidental runtime errors", () => {
    const base = migrated();
    const malformed = {
      ...base,
      features: [{ id: base.features[0].id, name: null, kind: "primitive", dependsOn: null, parameters: null, bodyIds: null }],
      bodies: [null],
      assets: [null],
      selections: [null]
    } as unknown as CadDocument;
    expect(() => validateCadDocument(malformed)).not.toThrow();
    expect(validateCadDocument(malformed)).toMatchObject({ valid: false });
  });

  it("rejects duplicate sketch IDs, conflicting suppression and invalid source hashes", () => {
    const base = migrated();
    const sketchId = stableCadId("sketch", "profile") as import("../lib/cad/document").CadSketchId;
    const invalid: CadDocument = {
      ...base,
      sketches: [
        { id: sketchId, name: "Profile", plane: "xy", sourceHash: stableCadSourceHash("profile") },
        { id: sketchId, name: "Duplicate", plane: "xy", sourceHash: stableCadSourceHash("duplicate") }
      ],
      features: [{
        ...base.features[0],
        sketchIds: [sketchId],
        suppression: "active",
        suppressed: true,
        evaluation: { state: "valid", warnings: [], sourceHash: "not-a-source-hash" }
      }]
    };
    expect(validateCadDocument(invalid).errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/Sketch identifiers must be unique/),
      expect.stringMatching(/conflicting suppression/),
      expect.stringMatching(/source hash/)
    ]));
  });

  it("rejects imported mesh bodies or assets that are not reference-only", () => {
    const base = migrated();
    const invalid = {
      ...base,
      bodies: [{ ...base.bodies[0], kind: "mesh-reference", referenceOnly: false }]
    } as CadDocument;
    expect(validateCadDocument(invalid).errors).toContainEqual(expect.stringMatching(/reference-only/));
  });
});

describe("CadDocument v2 deterministic foundations", () => {
  it("migrates a v1 CadDesign deterministically with explicit SI engineering units", () => {
    const first = migrated();
    const second = migrated();
    expect(first).toEqual(second);
    expect(first.id).toMatch(/^document-/);
    expect(first.units).toEqual({ length: "mm", angle: "rad" });
    expect(first.features[0].parameters.width).toEqual({ value: 160, unit: "mm" });
    expect(first.features[0].parameters.holeCount).toEqual({ value: 4, unit: "count" });
    expect(first.features[0].parameters.materialDensity).toEqual({ value: 2700, unit: "kg/m3" });
    expect(validateCadDocument(first)).toMatchObject({ valid: true, featureOrder: [first.features[0].id] });
  });

  it("produces stable identifiers independent of object key order", () => {
    expect(stableCadId("feature", { b: 2, a: 1 })).toBe(stableCadId("feature", { a: 1, b: 2 }));
    expect(stableCadId("feature", { a: 2 })).not.toBe(stableCadId("feature", { a: 1 }));
  });

  it("orders dependencies before dependants", () => {
    const base = migrated();
    const first = base.features[0];
    const secondId = stableCadId("feature", "second") as CadFeatureId;
    const bodyId = stableCadId("body", "second") as CadBodyId;
    const document: CadDocument = {
      ...base,
      features: [
        { id: secondId, name: "Second", kind: "fillet", dependsOn: [first.id], parameters: { radius: { value: 2, unit: "mm" } }, bodyIds: [bodyId] },
        first
      ],
      bodies: [...base.bodies, { id: bodyId, name: "Second body", kind: "solid", sourceFeatureId: secondId, visible: true, referenceOnly: false }]
    };
    expect(validateCadDocument(document)).toMatchObject({ valid: true, featureOrder: [first.id, secondId] });
  });

  it("bounds immutable command undo and redo history", () => {
    let history = createCadHistory(migrated(), 2);
    for (const name of ["Revision A", "Revision B", "Revision C"]) {
      history = executeCadCommand(history, { label: `Rename to ${name}`, apply: (document) => ({ ...document, name }) });
    }
    expect(history.undo).toHaveLength(2);
    history = undoCadCommand(history);
    expect(history.present.name).toBe("Revision B");
    history = undoCadCommand(history);
    expect(history.present.name).toBe("Revision A");
    history = redoCadCommand(history);
    expect(history.present.name).toBe("Revision B");
  });

  it("applies a grouped command transaction atomically with one undo snapshot", () => {
    const history = createCadHistory(migrated(), 5);
    const next = executeCadTransaction(history, {
      label: "Rename and suppress",
      commands: [
        { label: "Rename", apply: (document) => ({ ...document, name: "Grouped revision" }) },
        { label: "Suppress", apply: (document) => ({ ...document, features: document.features.map((feature) => ({ ...feature, suppression: "suppressed" as const })) }) }
      ]
    });
    expect(next.present.name).toBe("Grouped revision");
    expect(next.present.features[0].suppression).toBe("suppressed");
    expect(next.undo).toHaveLength(1);
    expect(undoCadCommand(next).present).toEqual(history.present);
  });

  it("accepts pocket and chamfer features with stable sketch identity", () => {
    const base = migrated();
    const sketchId = stableCadId("sketch", { profile: 1 }) as import("../lib/cad/document").CadSketchId;
    const withSketch: CadDocument = {
      ...base,
      sketches: [{ id: sketchId, name: "Pocket profile", plane: "xy", sourceHash: stableCadSourceHash({ profile: 1 }) }],
      features: [{ ...base.features[0], kind: "pocket", sketchIds: [sketchId] }]
    };
    expect(validateCadDocument(withSketch).valid).toBe(true);
    expect(validateCadDocument({ ...withSketch, features: [{ ...withSketch.features[0], kind: "chamfer" }] }).valid).toBe(true);
  });

  it("exports canonical JSON independent of object key insertion order", () => {
    const base = migrated();
    const reordered = {
      ...base,
      features: [{ ...base.features[0], parameters: { width: base.features[0].parameters.width, materialDensity: base.features[0].parameters.materialDensity, thickness: base.features[0].parameters.thickness, height: base.features[0].parameters.height, holeCount: base.features[0].parameters.holeCount, holeDiameter: base.features[0].parameters.holeDiameter, edgeX: base.features[0].parameters.edgeX, edgeY: base.features[0].parameters.edgeY, cornerRadius: base.features[0].parameters.cornerRadius } }]
    };
    expect(exportCadDocumentJson(reordered)).toBe(exportCadDocumentJson(base));
  });

  it("records rebuild failure while retaining the prior last-valid result", () => {
    const document = migrated();
    const featureId = document.features[0].id;
    const previous = new Map([[featureId, { volumeMm3: 100 }]]);
    const report = rebuildCadDocument(document, () => {
      throw new Error("Kernel failed");
    }, previous);
    expect(report.records).toEqual([{
      status: "failed", featureId, error: "Kernel failed", lastValidResult: { volumeMm3: 100 }
    }]);
    expect(report.lastValidResults.get(featureId)).toEqual({ volumeMm3: 100 });
    expect(report.selectionWarnings).toEqual([]);
  });

  it("reports dangling rebuild-local sub-element selections without claiming topological naming", () => {
    const base = migrated();
    const selected: CadDocument = { ...base, selections: [{ kind: "body", id: base.bodies[0].id, subElement: { kind: "face", index: 3 } }] };
    const report = rebuildCadDocument(selected, () => { throw new Error("No kernel result"); });
    expect(report.selectionWarnings.map((warning) => warning.code)).toEqual([
      "SUBELEMENT_IDENTITY_UNSTABLE",
      "DANGLING_SUBELEMENT_SELECTION"
    ]);
    expect(report.selectionWarnings[0].message).toMatch(/rebuild-local.*not.*stable topological naming/i);
  });
});
