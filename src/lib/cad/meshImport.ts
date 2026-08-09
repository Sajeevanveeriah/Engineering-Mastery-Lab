import * as THREE from "three";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { unzipSync } from "three/examples/jsm/libs/fflate.module.js";

export type MeshFormat = "stl" | "3mf";
export type StlUnit = "mm" | "cm" | "m" | "in";

export interface MeshImportLimits {
  readonly maxInputBytes: number;
  readonly maxTriangles: number;
  readonly maxZipEntries: number;
  readonly maxExpandedBytes: number;
  readonly maxEntryExpandedBytes: number;
  readonly maxCompressionRatio: number;
}

export const DEFAULT_MESH_IMPORT_LIMITS: MeshImportLimits = Object.freeze({
  maxInputBytes: 64 * 1024 * 1024,
  maxTriangles: 2_000_000,
  maxZipEntries: 256,
  maxExpandedBytes: 128 * 1024 * 1024,
  maxEntryExpandedBytes: 128 * 1024 * 1024,
  maxCompressionRatio: 100
});

export type MeshImportErrorCode =
  | "ABORTED"
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "FORMAT_MISMATCH"
  | "TRUNCATED"
  | "TOO_MANY_TRIANGLES"
  | "ZIP_INVALID"
  | "ZIP_ENTRY_LIMIT"
  | "ZIP_EXPANDED_LIMIT"
  | "ZIP_RATIO_LIMIT"
  | "ZIP_TRAVERSAL"
  | "ZIP_ENCRYPTED"
  | "EXTERNAL_RESOURCE"
  | "UNSUPPORTED_SCHEME"
  | "UNSUPPORTED_UNIT"
  | "LOADER_UNAVAILABLE"
  | "PARSE_FAILED";

export class MeshImportError extends Error {
  readonly name = "MeshImportError";
  constructor(readonly code: MeshImportErrorCode, message: string, readonly details: Readonly<Record<string, unknown>> = {}) {
    super(message);
  }
}

export interface MeshBoundsMm {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly size: readonly [number, number, number];
}

export interface MeshMaterialSummary {
  readonly name: string;
  readonly colour?: string;
  readonly triangleCount?: number;
}

export interface MeshComponentSummary {
  readonly objectId: string;
  readonly transform: readonly number[];
}

export interface MeshPreflight {
  readonly format: MeshFormat;
  readonly byteLength: number;
  readonly sha256: string;
  readonly sourceUnit: string;
  readonly millimetresPerUnit: number;
  readonly triangleCount?: number;
  readonly encoding?: "ascii" | "binary";
  readonly zip?: {
    readonly entryCount: number;
    readonly expandedBytes: number;
    readonly maximumCompressionRatio: number;
    readonly entries: readonly string[];
  };
  readonly components: readonly MeshComponentSummary[];
  readonly materials: readonly MeshMaterialSummary[];
  readonly referenceOnly: true;
}

export interface ImportedMesh extends MeshPreflight {
  readonly object: THREE.Object3D;
  readonly boundsMm: MeshBoundsMm;
}

export interface MeshRenderComponent {
  readonly componentId: string;
  readonly objectId: string;
  readonly vertexStart: number;
  readonly vertexCount: number;
  readonly materialIds: readonly string[];
  readonly transform: readonly number[];
}

export interface MeshRenderGroup {
  readonly vertexStart: number;
  readonly vertexCount: number;
  readonly materialId?: string;
}

export interface MeshRenderPayload {
  readonly primitive: "triangles";
  readonly indexed: true;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
  readonly colours?: Float32Array;
  readonly components: readonly MeshRenderComponent[];
  readonly groups: readonly MeshRenderGroup[];
}

export interface PreparedMeshRender extends MeshPreflight {
  readonly payload: MeshRenderPayload;
  readonly boundsMm: MeshBoundsMm;
}

export interface MeshImportOptions {
  readonly format?: MeshFormat;
  readonly stlUnit?: StlUnit;
  readonly limits?: Partial<MeshImportLimits>;
  readonly signal?: AbortSignal;
}

interface ZipEntry {
  readonly name: string;
  readonly compressedBytes: number;
  readonly expandedBytes: number;
  readonly method: number;
  readonly flags: number;
}

const textDecoder = new TextDecoder("utf-8", { fatal: false });
const UNIT_TO_MM: Readonly<Record<string, number>> = Object.freeze({
  micron: 0.001,
  millimeter: 1,
  centimetre: 10,
  centimeter: 10,
  inch: 25.4,
  foot: 304.8,
  meter: 1000,
  metre: 1000
});
const STL_UNIT_TO_MM: Readonly<Record<StlUnit, number>> = Object.freeze({ mm: 1, cm: 10, m: 1000, in: 25.4 });

function mergeLimits(overrides?: Partial<MeshImportLimits>): MeshImportLimits {
  const limits = { ...DEFAULT_MESH_IMPORT_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new MeshImportError("PARSE_FAILED", `Mesh import limit ${key} must be a positive safe integer.`);
  }
  return limits;
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new MeshImportError("ABORTED", "Mesh import was cancelled.");
}

function bytesOf(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
}

function arrayBufferOf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", arrayBufferOf(bytes));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function detectFormat(bytes: Uint8Array): MeshFormat {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "3mf";
  return "stl";
}

function boundsFor(object: THREE.Object3D): MeshBoundsMm {
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) throw new MeshImportError("PARSE_FAILED", "Imported mesh contains no finite geometry.");
  const size = bounds.getSize(new THREE.Vector3());
  const values = [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z, size.x, size.y, size.z];
  if (!values.every(Number.isFinite)) throw new MeshImportError("PARSE_FAILED", "Imported mesh bounds are not finite.");
  return {
    min: [bounds.min.x, bounds.min.y, bounds.min.z],
    max: [bounds.max.x, bounds.max.y, bounds.max.z],
    size: [size.x, size.y, size.z]
  };
}

function boundsForPositions(positions: Float32Array): MeshBoundsMm {
  if (positions.length === 0 || positions.length % 3 !== 0) throw new MeshImportError("PARSE_FAILED", "Mesh render payload contains no complete vertices.");
  let minX = Infinity; let minY = Infinity; let minZ = Infinity;
  let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
  for (let offset = 0; offset < positions.length; offset += 3) {
    const x = positions[offset]; const y = positions[offset + 1]; const z = positions[offset + 2];
    if (![x, y, z].every(Number.isFinite)) throw new MeshImportError("PARSE_FAILED", "Mesh render payload contains non-finite coordinates.");
    minX = Math.min(minX, x); minY = Math.min(minY, y); minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); maxZ = Math.max(maxZ, z);
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], size: [maxX - minX, maxY - minY, maxZ - minZ] };
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new MeshImportError("ZIP_INVALID", "3MF archive has no valid end-of-central-directory record.");
}

function unsafeZipName(name: string): boolean {
  return name.length === 0 || name.includes("\\") || name.startsWith("/") || /^[a-zA-Z]:/.test(name)
    || name.split("/").some((part) => part === ".." || part === "." || part.length === 0);
}

function readZipCentralDirectory(bytes: Uint8Array, limits: MeshImportLimits): { entries: ZipEntry[]; expandedBytes: number; maximumRatio: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22) throw new MeshImportError("TRUNCATED", "3MF archive is truncated.");
  const eocd = findEndOfCentralDirectory(view);
  const disk = view.getUint16(eocd + 4, true);
  const directoryDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const directoryBytes = view.getUint32(eocd + 12, true);
  const directoryOffset = view.getUint32(eocd + 16, true);
  if (disk !== 0 || directoryDisk !== 0 || diskEntries !== entryCount || entryCount === 0xffff || directoryOffset === 0xffffffff) {
    throw new MeshImportError("ZIP_INVALID", "Multi-disk and ZIP64 3MF archives are not supported.");
  }
  if (entryCount > limits.maxZipEntries) throw new MeshImportError("ZIP_ENTRY_LIMIT", "3MF archive contains too many entries.", { entryCount });
  if (directoryOffset + directoryBytes > eocd) throw new MeshImportError("ZIP_INVALID", "3MF central directory exceeds the archive bounds.");
  const entries: ZipEntry[] = [];
  const names = new Set<string>();
  let offset = directoryOffset;
  let expandedBytes = 0;
  let maximumRatio = 1;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new MeshImportError("ZIP_INVALID", "3MF central-directory entry is malformed.");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedBytes = view.getUint32(offset + 20, true);
    const entryExpandedBytes = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > bytes.length) throw new MeshImportError("TRUNCATED", "3MF central-directory entry is truncated.");
    const name = textDecoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if ((flags & 1) !== 0) throw new MeshImportError("ZIP_ENCRYPTED", `Encrypted 3MF entry is not supported: ${name}`);
    if (method !== 0 && method !== 8) throw new MeshImportError("ZIP_INVALID", `Unsupported ZIP compression method ${method}: ${name}`);
    if (unsafeZipName(name)) throw new MeshImportError("ZIP_TRAVERSAL", `Unsafe 3MF entry path: ${name}`);
    const normalised = name.toLowerCase();
    if (names.has(normalised)) throw new MeshImportError("ZIP_INVALID", `Duplicate 3MF entry path: ${name}`);
    names.add(normalised);
    if (entryExpandedBytes > limits.maxEntryExpandedBytes) throw new MeshImportError("ZIP_EXPANDED_LIMIT", `3MF entry expands beyond its limit: ${name}`);
    expandedBytes += entryExpandedBytes;
    if (!Number.isSafeInteger(expandedBytes) || expandedBytes > limits.maxExpandedBytes) throw new MeshImportError("ZIP_EXPANDED_LIMIT", "3MF archive expands beyond its total limit.");
    const ratio = entryExpandedBytes === 0 ? 1 : entryExpandedBytes / Math.max(1, compressedBytes);
    maximumRatio = Math.max(maximumRatio, ratio);
    if (ratio > limits.maxCompressionRatio) throw new MeshImportError("ZIP_RATIO_LIMIT", `3MF entry compression ratio is unsafe: ${name}`, { ratio });
    entries.push({ name, compressedBytes, expandedBytes: entryExpandedBytes, method, flags });
    offset = end;
  }
  if (offset !== directoryOffset + directoryBytes) throw new MeshImportError("ZIP_INVALID", "3MF central-directory size does not match its entries.");
  return { entries, expandedBytes, maximumRatio };
}

function inspectRelationships(files: Record<string, Uint8Array>): void {
  const xmlFiles = Object.entries(files).filter(([name]) => name.toLowerCase().endsWith(".rels") || name.toLowerCase().endsWith(".model"));
  for (const [name, data] of xmlFiles) {
    const xml = textDecoder.decode(data);
    for (const match of xml.matchAll(/<Relationship\b[^>]*\bTargetMode\s*=\s*["']External["'][^>]*>/gi)) {
      throw new MeshImportError("EXTERNAL_RESOURCE", `External relationship is not allowed in ${name}.`, { relationship: match[0].slice(0, 200) });
    }
    for (const match of xml.matchAll(/\b(?:Target|path|source)\s*=\s*["']([^"']+)["']/gi)) {
      const target = match[1].trim();
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(target)?.[1]?.toLowerCase();
      if (scheme) throw new MeshImportError("UNSUPPORTED_SCHEME", `URI scheme ${scheme} is not allowed in ${name}.`, { target });
      const path = target.replace(/^\//, "");
      if (unsafeZipName(path)) throw new MeshImportError("ZIP_TRAVERSAL", `Unsafe relationship target in ${name}: ${target}`);
    }
  }
}

function parseThreeMfMetadata(files: Record<string, Uint8Array>): {
  unit: string;
  scale: number;
  components: MeshComponentSummary[];
  materials: MeshMaterialSummary[];
  triangleCount: number;
} {
  const modelEntry = Object.entries(files).find(([name]) => name.toLowerCase().endsWith(".model"));
  if (!modelEntry) throw new MeshImportError("PARSE_FAILED", "3MF archive does not contain a model part.");
  const xml = textDecoder.decode(modelEntry[1]);
  const unit = /<model\b[^>]*\bunit\s*=\s*["']([^"']+)["']/i.exec(xml)?.[1].toLowerCase() ?? "millimeter";
  const scale = UNIT_TO_MM[unit];
  if (!scale) throw new MeshImportError("UNSUPPORTED_UNIT", `Unsupported 3MF model unit: ${unit}`);
  const components = [...xml.matchAll(/<component\b([^>]*)\/?\s*>/gi)].map((match) => {
    const attributes = match[1];
    const objectId = /\bobjectid\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1] ?? "";
    const transformSource = /\btransform\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1] ?? "1 0 0 0 1 0 0 0 1 0 0 0";
    const transform = transformSource.trim().split(/\s+/).map(Number);
    if (!objectId || transform.length !== 12 || !transform.every(Number.isFinite)) throw new MeshImportError("PARSE_FAILED", "3MF component transform is invalid.");
    return { objectId, transform };
  });
  const materials = [...xml.matchAll(/<base\b([^>]*)\/?\s*>/gi)].map((match, index) => {
    const attributes = match[1];
    return {
      name: /\bname\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1] || `Material ${index + 1}`,
      colour: /\bdisplaycolor\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1]
    };
  });
  return { unit, scale, components, materials, triangleCount: [...xml.matchAll(/<triangle\b/gi)].length };
}

function stlMetadata(bytes: Uint8Array, limits: MeshImportLimits): { encoding: "ascii" | "binary"; triangleCount: number } {
  if (bytes.length < 15) throw new MeshImportError("TRUNCATED", "STL file is truncated.");
  const startsSolid = textDecoder.decode(bytes.subarray(0, Math.min(bytes.length, 256))).replace(/^\uFEFF/, "").trimStart().startsWith("solid");
  if (bytes.length >= 84) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(80, true);
    if (!startsSolid && count > limits.maxTriangles) {
      throw new MeshImportError("TOO_MANY_TRIANGLES", "Binary STL declared triangle count exceeds its limit.", { count });
    }
    const expected = 84 + count * 50;
    if (expected === bytes.length) {
      if (count > limits.maxTriangles) throw new MeshImportError("TOO_MANY_TRIANGLES", "STL triangle count exceeds its limit.", { count });
      return { encoding: "binary", triangleCount: count };
    }
    if (!startsSolid && expected > bytes.length) throw new MeshImportError("TRUNCATED", "Binary STL is truncated.", { expected, actual: bytes.length });
  }
  if (!startsSolid) throw new MeshImportError("FORMAT_MISMATCH", "File is neither a valid binary STL nor an ASCII STL beginning with solid.");
  const text = textDecoder.decode(bytes);
  if (!/endsolid(?:\s|$)/i.test(text)) throw new MeshImportError("TRUNCATED", "ASCII STL has no endsolid record.");
  const facets = [...text.matchAll(/\bfacet\s+normal\b/gi)].length;
  const ends = [...text.matchAll(/\bendfacet\b/gi)].length;
  const vertices = [...text.matchAll(/\bvertex\s+[+\-.0-9eE]+\s+[+\-.0-9eE]+\s+[+\-.0-9eE]+/g)].length;
  if (facets === 0 || facets !== ends || vertices !== facets * 3) throw new MeshImportError("PARSE_FAILED", "ASCII STL facet structure is invalid.");
  if (facets > limits.maxTriangles) throw new MeshImportError("TOO_MANY_TRIANGLES", "STL triangle count exceeds its limit.", { count: facets });
  return { encoding: "ascii", triangleCount: facets };
}

function unzipBounded(bytes: Uint8Array, entries: readonly ZipEntry[]): Record<string, Uint8Array> {
  try {
    const files = unzipSync(bytes) as Record<string, Uint8Array>;
    for (const entry of entries) {
      const file = files[entry.name];
      if (!file || file.byteLength !== entry.expandedBytes) throw new MeshImportError("ZIP_INVALID", `3MF entry size does not match the central directory: ${entry.name}`);
    }
    return files;
  } catch (error) {
    if (error instanceof MeshImportError) throw error;
    throw new MeshImportError("ZIP_INVALID", "3MF archive could not be expanded safely.", { cause: error instanceof Error ? error.message : String(error) });
  }
}

function xmlAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) attributes[match[1].toLowerCase()] = match[2];
  return attributes;
}

function matrixFrom3mf(source?: string): THREE.Matrix4 {
  const values = source ? source.trim().split(/\s+/).map(Number) : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  if (values.length !== 12 || !values.every(Number.isFinite)) throw new MeshImportError("PARSE_FAILED", "3MF render transform is invalid.");
  return new THREE.Matrix4().set(
    values[0], values[3], values[6], values[9],
    values[1], values[4], values[7], values[10],
    values[2], values[5], values[8], values[11],
    0, 0, 0, 1
  );
}

function transformAs3mf(matrix: THREE.Matrix4): readonly number[] {
  const elements = matrix.elements;
  return [elements[0], elements[1], elements[2], elements[4], elements[5], elements[6], elements[8], elements[9], elements[10], elements[12], elements[13], elements[14]];
}

interface ThreeMfTriangle {
  readonly indices: readonly [number, number, number];
  readonly materialId?: string;
}

interface ThreeMfObjectData {
  readonly id: string;
  readonly vertices: readonly THREE.Vector3[];
  readonly triangles: readonly ThreeMfTriangle[];
  readonly components: readonly { readonly objectId: string; readonly matrix: THREE.Matrix4 }[];
}

function colourFrom3mf(source?: string): readonly [number, number, number] | undefined {
  if (!source || !/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(source)) return undefined;
  return [Number.parseInt(source.slice(1, 3), 16) / 255, Number.parseInt(source.slice(3, 5), 16) / 255, Number.parseInt(source.slice(5, 7), 16) / 255];
}

function threeMfRenderPayload(files: Record<string, Uint8Array>, scale: number, maxTriangles: number): MeshRenderPayload {
  const modelEntry = Object.entries(files).find(([name]) => name.toLowerCase().endsWith(".model"));
  if (!modelEntry) throw new MeshImportError("PARSE_FAILED", "3MF archive does not contain a renderable model part.");
  const xml = textDecoder.decode(modelEntry[1]);
  const materialColours = new Map<string, readonly [number, number, number]>();
  for (const materialsMatch of xml.matchAll(/<basematerials\b([^>]*)>([\s\S]*?)<\/basematerials>/gi)) {
    const resourceId = xmlAttributes(materialsMatch[1]).id;
    let index = 0;
    for (const baseMatch of materialsMatch[2].matchAll(/<base\b([^>]*)\/?\s*>/gi)) {
      const colour = colourFrom3mf(xmlAttributes(baseMatch[1]).displaycolor);
      if (resourceId && colour) materialColours.set(`${resourceId}:${index}`, colour);
      index += 1;
    }
  }

  const objects = new Map<string, ThreeMfObjectData>();
  for (const objectMatch of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/gi)) {
    const objectAttributes = xmlAttributes(objectMatch[1]);
    if (!objectAttributes.id) throw new MeshImportError("PARSE_FAILED", "3MF object has no identifier.");
    const body = objectMatch[2];
    const vertices = [...body.matchAll(/<vertex\b([^>]*)\/?\s*>/gi)].map((match) => {
      const attributes = xmlAttributes(match[1]);
      const point = new THREE.Vector3(Number(attributes.x), Number(attributes.y), Number(attributes.z));
      if (![point.x, point.y, point.z].every(Number.isFinite)) throw new MeshImportError("PARSE_FAILED", `3MF object ${objectAttributes.id} has an invalid vertex.`);
      return point;
    });
    const triangles = [...body.matchAll(/<triangle\b([^>]*)\/?\s*>/gi)].map((match): ThreeMfTriangle => {
      const attributes = xmlAttributes(match[1]);
      const indices = [Number(attributes.v1), Number(attributes.v2), Number(attributes.v3)] as const;
      if (!indices.every((index) => Number.isSafeInteger(index) && index >= 0 && index < vertices.length)) throw new MeshImportError("PARSE_FAILED", `3MF object ${objectAttributes.id} has an invalid triangle index.`);
      const pid = attributes.pid ?? objectAttributes.pid;
      const materialIndex = attributes.p1 ?? objectAttributes.pindex;
      return { indices, materialId: pid !== undefined && materialIndex !== undefined ? `${pid}:${materialIndex}` : undefined };
    });
    const components = [...body.matchAll(/<component\b([^>]*)\/?\s*>/gi)].map((match) => {
      const attributes = xmlAttributes(match[1]);
      if (!attributes.objectid) throw new MeshImportError("PARSE_FAILED", `3MF object ${objectAttributes.id} has a component without an object identifier.`);
      return { objectId: attributes.objectid, matrix: matrixFrom3mf(attributes.transform) };
    });
    objects.set(objectAttributes.id, { id: objectAttributes.id, vertices, triangles, components });
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const components: MeshRenderComponent[] = [];
  const groups: MeshRenderGroup[] = [];
  let hasColours = false;
  let componentSequence = 0;

  const emitObject = (objectId: string, matrix: THREE.Matrix4, ancestry: ReadonlySet<string>): void => {
    if (ancestry.has(objectId)) throw new MeshImportError("PARSE_FAILED", `3MF component cycle includes object ${objectId}.`);
    const object = objects.get(objectId);
    if (!object) throw new MeshImportError("PARSE_FAILED", `3MF component references missing object ${objectId}.`);
    const nextAncestry = new Set(ancestry).add(objectId);
    if (object.components.length > 0) {
      for (const child of object.components) emitObject(child.objectId, matrix.clone().multiply(child.matrix), nextAncestry);
      return;
    }
    const vertexStart = positions.length / 3;
    const materialIds = new Set<string>();
    for (const triangle of object.triangles) {
      if (positions.length / 9 >= maxTriangles) throw new MeshImportError("TOO_MANY_TRIANGLES", "Expanded 3MF component instances exceed the triangle limit.");
      const transformed = triangle.indices.map((index) => object.vertices[index].clone().applyMatrix4(matrix).multiplyScalar(scale));
      const normal = transformed[1].clone().sub(transformed[0]).cross(transformed[2].clone().sub(transformed[0])).normalize();
      for (const point of transformed) positions.push(point.x, point.y, point.z);
      for (let index = 0; index < 3; index += 1) normals.push(normal.x, normal.y, normal.z);
      const colour = triangle.materialId ? materialColours.get(triangle.materialId) : undefined;
      if (triangle.materialId) materialIds.add(triangle.materialId);
      if (colour) hasColours = true;
      for (let index = 0; index < 3; index += 1) colours.push(...(colour ?? [0.8, 0.8, 0.8]));
      const previousGroup = groups.at(-1);
      const triangleStart = positions.length / 3 - 3;
      if (previousGroup && previousGroup.materialId === triangle.materialId && previousGroup.vertexStart + previousGroup.vertexCount === triangleStart) {
        groups[groups.length - 1] = { ...previousGroup, vertexCount: previousGroup.vertexCount + 3 };
      } else {
        groups.push({ vertexStart: triangleStart, vertexCount: 3, materialId: triangle.materialId });
      }
    }
    const vertexCount = positions.length / 3 - vertexStart;
    components.push({
      componentId: `component-${componentSequence.toString().padStart(4, "0")}`,
      objectId,
      vertexStart,
      vertexCount,
      materialIds: [...materialIds].sort(),
      transform: transformAs3mf(matrix)
    });
    componentSequence += 1;
  };

  const buildItems = [...xml.matchAll(/<item\b([^>]*)\/?\s*>/gi)];
  if (buildItems.length === 0) throw new MeshImportError("PARSE_FAILED", "3MF model has no build items.");
  for (const item of buildItems) {
    const attributes = xmlAttributes(item[1]);
    if (!attributes.objectid) throw new MeshImportError("PARSE_FAILED", "3MF build item has no object identifier.");
    emitObject(attributes.objectid, matrixFrom3mf(attributes.transform), new Set());
  }
  if (positions.length === 0) throw new MeshImportError("PARSE_FAILED", "3MF build contains no triangle geometry.");
  return {
    primitive: "triangles",
    indexed: true,
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: Uint32Array.from({ length: positions.length / 3 }, (_, index) => index),
    colours: hasColours ? new Float32Array(colours) : undefined,
    components,
    groups
  };
}

function stlRenderPayload(bytes: Uint8Array, preflight: MeshPreflight): MeshRenderPayload {
  const geometry = new STLLoader().parse(preflight.encoding === "ascii" ? textDecoder.decode(bytes) : arrayBufferOf(bytes));
  if (!geometry.hasAttribute("normal")) geometry.computeVertexNormals();
  const sourcePositions = geometry.getAttribute("position");
  const sourceNormals = geometry.getAttribute("normal");
  const sourceColours = geometry.getAttribute("color");
  const positions = new Float32Array(sourcePositions.count * 3);
  const normals = new Float32Array(sourceNormals.count * 3);
  const colours = sourceColours ? new Float32Array(sourceColours.count * 3) : undefined;
  for (let index = 0; index < sourcePositions.count; index += 1) {
    positions[index * 3] = sourcePositions.getX(index) * preflight.millimetresPerUnit;
    positions[index * 3 + 1] = sourcePositions.getY(index) * preflight.millimetresPerUnit;
    positions[index * 3 + 2] = sourcePositions.getZ(index) * preflight.millimetresPerUnit;
    normals[index * 3] = sourceNormals.getX(index);
    normals[index * 3 + 1] = sourceNormals.getY(index);
    normals[index * 3 + 2] = sourceNormals.getZ(index);
    if (colours && sourceColours) {
      colours[index * 3] = sourceColours.getX(index);
      colours[index * 3 + 1] = sourceColours.getY(index);
      colours[index * 3 + 2] = sourceColours.getZ(index);
    }
  }
  return {
    primitive: "triangles",
    indexed: true,
    positions,
    normals,
    indices: Uint32Array.from({ length: positions.length / 3 }, (_, index) => index),
    colours,
    components: [{ componentId: "component-0000", objectId: "stl", vertexStart: 0, vertexCount: sourcePositions.count, materialIds: sourceColours ? ["stl:vertex-colour"] : [], transform: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] }],
    groups: [{ vertexStart: 0, vertexCount: sourcePositions.count, materialId: sourceColours ? "stl:vertex-colour" : undefined }]
  };
}

export async function preflightMesh(data: ArrayBuffer | Uint8Array, options: MeshImportOptions = {}): Promise<MeshPreflight> {
  checkAbort(options.signal);
  const bytes = bytesOf(data);
  const limits = mergeLimits(options.limits);
  if (bytes.length === 0) throw new MeshImportError("EMPTY_FILE", "Mesh file is empty.");
  if (bytes.length > limits.maxInputBytes) throw new MeshImportError("FILE_TOO_LARGE", "Mesh file exceeds its input byte limit.", { byteLength: bytes.length });
  const detected = detectFormat(bytes);
  if (options.format && options.format !== detected) throw new MeshImportError("FORMAT_MISMATCH", `Expected ${options.format.toUpperCase()} but file appears to be ${detected.toUpperCase()}.`);
  checkAbort(options.signal);
  const digest = await sha256(bytes);
  checkAbort(options.signal);
  if (detected === "stl") {
    const metadata = stlMetadata(bytes, limits);
    const unit = options.stlUnit ?? "mm";
    return {
      format: "stl", byteLength: bytes.length, sha256: digest, sourceUnit: unit,
      millimetresPerUnit: STL_UNIT_TO_MM[unit], triangleCount: metadata.triangleCount,
      encoding: metadata.encoding, components: [], materials: [], referenceOnly: true
    };
  }
  const central = readZipCentralDirectory(bytes, limits);
  checkAbort(options.signal);
  const files = unzipBounded(bytes, central.entries);
  inspectRelationships(files);
  const metadata = parseThreeMfMetadata(files);
  if (metadata.triangleCount > limits.maxTriangles) throw new MeshImportError("TOO_MANY_TRIANGLES", "3MF triangle count exceeds its limit.", { count: metadata.triangleCount });
  return {
    format: "3mf", byteLength: bytes.length, sha256: digest, sourceUnit: metadata.unit,
    millimetresPerUnit: metadata.scale, triangleCount: metadata.triangleCount,
    zip: { entryCount: central.entries.length, expandedBytes: central.expandedBytes, maximumCompressionRatio: central.maximumRatio, entries: central.entries.map((entry) => entry.name) },
    components: metadata.components, materials: metadata.materials, referenceOnly: true
  };
}

export async function prepareMeshRender(data: ArrayBuffer | Uint8Array, options: MeshImportOptions = {}): Promise<PreparedMeshRender> {
  const preflight = await preflightMesh(data, options);
  checkAbort(options.signal);
  const bytes = bytesOf(data);
  let payload: MeshRenderPayload;
  if (preflight.format === "stl") {
    payload = stlRenderPayload(bytes, preflight);
  } else {
    const limits = mergeLimits(options.limits);
    const central = readZipCentralDirectory(bytes, limits);
    const files = unzipBounded(bytes, central.entries);
    inspectRelationships(files);
    payload = threeMfRenderPayload(files, preflight.millimetresPerUnit, limits.maxTriangles);
  }
  checkAbort(options.signal);
  return { ...preflight, triangleCount: payload.positions.length / 9, payload, boundsMm: boundsForPositions(payload.positions) };
}

export function meshRenderTransferList(payload: MeshRenderPayload): ArrayBuffer[] {
  const buffers = [payload.positions.buffer, payload.normals.buffer, payload.indices.buffer, payload.colours?.buffer]
    .filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer);
  return [...new Set(buffers)];
}

export async function importMesh(data: ArrayBuffer | Uint8Array, options: MeshImportOptions = {}): Promise<ImportedMesh> {
  const preflight = await preflightMesh(data, options);
  checkAbort(options.signal);
  const bytes = bytesOf(data);
  try {
    let object: THREE.Object3D;
    if (preflight.format === "stl") {
      const geometry = new STLLoader().parse(preflight.encoding === "ascii" ? textDecoder.decode(bytes) : arrayBufferOf(bytes));
      geometry.scale(preflight.millimetresPerUnit, preflight.millimetresPerUnit, preflight.millimetresPerUnit);
      object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: geometry.hasAttribute("color") }));
    } else {
      if (typeof DOMParser === "undefined") throw new MeshImportError("LOADER_UNAVAILABLE", "ThreeMFLoader requires DOMParser in this runtime.");
      object = new ThreeMFLoader().parse(arrayBufferOf(bytes));
      object.scale.setScalar(preflight.millimetresPerUnit);
    }
    object.userData.cadImport = { referenceOnly: true, format: preflight.format, sha256: preflight.sha256 };
    checkAbort(options.signal);
    return { ...preflight, object, boundsMm: boundsFor(object) };
  } catch (error) {
    if (error instanceof MeshImportError) throw error;
    throw new MeshImportError("PARSE_FAILED", `${preflight.format.toUpperCase()} loader rejected the mesh.`, { cause: error instanceof Error ? error.message : String(error) });
  }
}
