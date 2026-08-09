import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  createAsciiCubeStl,
  createBinaryColouredCubeStl,
  createBinaryStlTriangleLimitProbe,
  createExternalResource3mf,
  createLargeBinaryStl,
  createMalformedTruncated3mf,
  createMalformedTruncatedStl,
  createOneInch3mf,
  createTwoComponentMillimetre3mf,
  createZipBombMetadata3mf,
  LARGE_BINARY_STL_DEFAULT_TRIANGLES
} from "../lib/cad/meshFixtures";
import { DEFAULT_MESH_IMPORT_LIMITS, importMesh, meshRenderTransferList, MeshImportError, preflightMesh, prepareMeshRender } from "../lib/cad/meshImport";
import { processMeshWorkerRequest, processMeshWorkerRequestWithTransferList } from "../lib/cad/meshImport.worker";

async function expectCode(promise: Promise<unknown>, code: MeshImportError["code"]): Promise<void> {
  await expect(promise).rejects.toMatchObject({ name: "MeshImportError", code });
}

describe("bounded mesh preflight known-defective fixtures", () => {
  it("rejects truncated binary STL before the loader is called", async () => {
    await expectCode(preflightMesh(createMalformedTruncatedStl(), { format: "stl" }), "TRUNCATED");
  });

  it("rejects a truncated 3MF central directory", async () => {
    await expectCode(preflightMesh(createMalformedTruncated3mf(), { format: "3mf" }), "ZIP_INVALID");
  });

  it("rejects ZIP bomb metadata before expansion", async () => {
    await expectCode(preflightMesh(createZipBombMetadata3mf(), { format: "3mf" }), "ZIP_RATIO_LIMIT");
  });

  it("rejects external 3MF relationships before ThreeMFLoader can fetch them", async () => {
    await expectCode(preflightMesh(createExternalResource3mf(), { format: "3mf" }), "EXTERNAL_RESOURCE");
  });

  it("rejects explicit format mismatch", async () => {
    await expectCode(preflightMesh(createAsciiCubeStl(), { format: "3mf" }), "FORMAT_MISMATCH");
  });
});

describe("deterministic STL foundations", () => {
  it("sniffs and imports the ASCII cube through STLLoader in millimetres", async () => {
    const bytes = createAsciiCubeStl();
    expect(createAsciiCubeStl()).toEqual(bytes);
    const imported = await importMesh(bytes, { format: "stl", stlUnit: "mm" });
    expect(imported).toMatchObject({ format: "stl", encoding: "ascii", triangleCount: 12, millimetresPerUnit: 1, referenceOnly: true });
    expect(imported.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(imported.boundsMm.size).toEqual([1, 1, 1]);
    expect(imported.object.userData.cadImport).toMatchObject({ referenceOnly: true, format: "stl" });
  });

  it("sniffs binary STL, preserves its colour attribute and applies declared inches", async () => {
    const imported = await importMesh(createBinaryColouredCubeStl(), { stlUnit: "in" });
    expect(imported).toMatchObject({ format: "stl", encoding: "binary", triangleCount: 12, millimetresPerUnit: 25.4 });
    expect(imported.boundsMm.size).toEqual(expect.arrayContaining([
      expect.closeTo(25.4, 5), expect.closeTo(25.4, 5), expect.closeTo(25.4, 5)
    ]));
    expect(imported.object).toBeInstanceOf(THREE.Mesh);
    expect((imported.object as THREE.Mesh).geometry.hasAttribute("color")).toBe(true);
  });

  it("creates complete indexed render payloads for ASCII and coloured binary STL", async () => {
    const ascii = await prepareMeshRender(createAsciiCubeStl(), { format: "stl" });
    expect(ascii.payload).toMatchObject({ primitive: "triangles", indexed: true });
    expect(ascii.payload.positions).toHaveLength(108);
    expect(ascii.payload.normals).toHaveLength(108);
    expect(ascii.payload.indices).toHaveLength(36);
    expect(ascii.payload.colours).toBeUndefined();
    expect(ascii.payload.components).toEqual([expect.objectContaining({ objectId: "stl", vertexStart: 0, vertexCount: 36 })]);
    expect(ascii.boundsMm).toEqual({ min: [0, 0, 0], max: [1, 1, 1], size: [1, 1, 1] });

    const binary = await prepareMeshRender(createBinaryColouredCubeStl(), { stlUnit: "mm" });
    expect(binary.payload.positions).toHaveLength(108);
    expect(binary.payload.normals).toHaveLength(108);
    expect(binary.payload.indices).toHaveLength(36);
    expect(binary.payload.colours).toHaveLength(108);
    expect(binary.boundsMm.size).toEqual([1, 1, 1]);
  });
});

describe("deterministic large binary STL acceptance", () => {
  let cachedFixture: Uint8Array | undefined;
  const fixture = (): Uint8Array => cachedFixture ??= createLargeBinaryStl();

  it("rejects an over-limit binary declaration from an 84-byte probe before payload allocation", async () => {
    const probe = createBinaryStlTriangleLimitProbe(DEFAULT_MESH_IMPORT_LIMITS.maxTriangles + 1);
    expect(probe).toHaveLength(84);
    await expectCode(preflightMesh(probe, { format: "stl" }), "TOO_MANY_TRIANGLES");
  });

  it("generates and preflights the bounded default fixture deterministically", { timeout: 30_000 }, async () => {
    const bytes = fixture();
    expect(bytes).toHaveLength(84 + LARGE_BINARY_STL_DEFAULT_TRIANGLES * 50);
    expect(bytes.byteLength).toBeLessThan(DEFAULT_MESH_IMPORT_LIMITS.maxInputBytes);
    expect(createLargeBinaryStl(2)).toEqual(createLargeBinaryStl(2));
    const result = await preflightMesh(bytes, { format: "stl" });
    expect(result).toMatchObject({
      format: "stl",
      encoding: "binary",
      triangleCount: LARGE_BINARY_STL_DEFAULT_TRIANGLES,
      byteLength: 30_000_084,
      referenceOnly: true
    });
  });

  it("imports the default large fixture with finite deterministic bounds", { timeout: 30_000 }, async () => {
    const imported = await importMesh(fixture(), { format: "stl", stlUnit: "mm" });
    expect(imported.triangleCount).toBe(LARGE_BINARY_STL_DEFAULT_TRIANGLES);
    expect(imported.boundsMm).toEqual({ min: [0, 0, 0], max: [1_000, 300, 0], size: [1_000, 300, 0] });
    expect(imported.object).toBeInstanceOf(THREE.Mesh);
    const mesh = imported.object as THREE.Mesh;
    expect(mesh.geometry.getAttribute("position").count).toBe(LARGE_BINARY_STL_DEFAULT_TRIANGLES * 3);
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) material.dispose();
  });

  it("builds a complete transferable payload within the expected byte budget", { timeout: 30_000 }, async () => {
    const prepared = await prepareMeshRender(fixture(), { format: "stl", stlUnit: "mm" });
    const vertexCount = LARGE_BINARY_STL_DEFAULT_TRIANGLES * 3;
    expect(prepared.payload.positions).toHaveLength(vertexCount * 3);
    expect(prepared.payload.normals).toHaveLength(vertexCount * 3);
    expect(prepared.payload.indices).toHaveLength(vertexCount);
    expect(prepared.payload.colours).toBeUndefined();
    expect(prepared.boundsMm).toEqual({ min: [0, 0, 0], max: [1_000, 300, 0], size: [1_000, 300, 0] });
    expect(meshRenderTransferList(prepared.payload)).toEqual([
      prepared.payload.positions.buffer,
      prepared.payload.normals.buffer,
      prepared.payload.indices.buffer
    ]);
    expect(meshRenderTransferList(prepared.payload).reduce((total, buffer) => total + buffer.byteLength, 0)).toBe(50_400_000);
  });

  it("cancels the large worker request at its asynchronous digest boundary", { timeout: 30_000 }, async () => {
    const requestId = "large-stl-cancel";
    const pending = processMeshWorkerRequest({ type: "import", requestId, data: fixture().buffer as ArrayBuffer, format: "stl" });
    await expect(processMeshWorkerRequest({ type: "cancel", requestId })).resolves.toEqual({ type: "cancelled", requestId });
    await expect(pending).resolves.toEqual({ type: "cancelled", requestId });
  });
});

describe("deterministic 3MF foundations", () => {
  it("preflights a two-component millimetre archive with materials and transforms", async () => {
    const bytes = createTwoComponentMillimetre3mf();
    expect(createTwoComponentMillimetre3mf()).toEqual(bytes);
    const result = await preflightMesh(bytes, { format: "3mf" });
    expect(result).toMatchObject({
      format: "3mf", sourceUnit: "millimeter", millimetresPerUnit: 1,
      triangleCount: 12, referenceOnly: true
    });
    expect(result.components).toEqual([
      { objectId: "1", transform: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
      { objectId: "1", transform: [1, 0, 0, 0, 1, 0, 0, 0, 1, 2, 0, 0] }
    ]);
    expect(result.materials).toEqual([{ name: "Blue polymer", colour: "#3366CCFF" }]);
    expect(result.zip).toMatchObject({ entryCount: 3 });
  });

  it("converts a one-inch 3MF source unit to exactly 25.4 millimetres", async () => {
    const result = await preflightMesh(createOneInch3mf());
    expect(result.sourceUnit).toBe("inch");
    expect(result.millimetresPerUnit).toBe(25.4);
  });

  it("creates a grouped two-component 3MF render payload with millimetre bounds", async () => {
    const result = await prepareMeshRender(createTwoComponentMillimetre3mf(), { format: "3mf" });
    expect(result.payload).toMatchObject({ primitive: "triangles", indexed: true });
    expect(result.payload.positions).toHaveLength(216);
    expect(result.payload.normals).toHaveLength(216);
    expect(result.payload.indices).toHaveLength(72);
    expect(result.payload.colours).toHaveLength(216);
    expect(result.payload.components).toEqual([
      expect.objectContaining({ objectId: "1", vertexStart: 0, vertexCount: 36, materialIds: ["10:0"] }),
      expect.objectContaining({ objectId: "1", vertexStart: 36, vertexCount: 36, materialIds: ["10:0"] })
    ]);
    expect(result.payload.groups).toEqual([{ vertexStart: 0, vertexCount: 72, materialId: "10:0" }]);
    expect(result.boundsMm).toEqual({ min: [0, 0, 0], max: [3, 1, 1], size: [3, 1, 1] });
  });

  it("returns typed cancellation-ready worker responses", async () => {
    await expect(processMeshWorkerRequest({ type: "cancel", requestId: "mesh-1" })).resolves.toEqual({ type: "cancelled", requestId: "mesh-1" });
    const response = await processMeshWorkerRequest({ type: "import", requestId: "mesh-2", data: createAsciiCubeStl().buffer as ArrayBuffer, format: "stl" });
    expect(response).toMatchObject({ type: "result", requestId: "mesh-2", summary: { triangleCount: 12, referenceOnly: true } });
  });

  it.each([
    ["ascii", createAsciiCubeStl, 3],
    ["binary-colour", createBinaryColouredCubeStl, 4],
    ["3mf", createTwoComponentMillimetre3mf, 4]
  ] as const)("returns exact transferable payload buffers for %s", async (_name, fixture, expectedTransfers) => {
    const dispatch = await processMeshWorkerRequestWithTransferList({ type: "import", requestId: `transfer-${_name}`, data: fixture().buffer as ArrayBuffer });
    expect(dispatch?.response.type).toBe("result");
    expect(dispatch?.transferables).toHaveLength(expectedTransfers);
    if (dispatch?.response.type !== "result") throw new Error("Expected worker render result.");
    const payload = dispatch.response.summary.payload;
    const expected = [payload.positions.buffer, payload.normals.buffer, payload.indices.buffer, payload.colours?.buffer].filter(Boolean);
    expect(dispatch.transferables).toEqual(expected);
    expect(payload.indices.length).toBe(payload.positions.length / 3);
    expect(dispatch.response.summary.boundsMm.size.every(Number.isFinite)).toBe(true);
  });
});
