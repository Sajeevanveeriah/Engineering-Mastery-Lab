const encoder = new TextEncoder();

export const LARGE_BINARY_STL_DEFAULT_TRIANGLES = 600_000;
export const LARGE_BINARY_STL_GRID_WIDTH = 1_000;
export const LARGE_BINARY_STL_MAX_TRIANGLES = Math.floor((64 * 1024 * 1024 - 84) / 50);

type Point = readonly [number, number, number];
type Triangle = readonly [Point, Point, Point];

const cubeTriangles: readonly Triangle[] = [
  [[0, 0, 0], [1, 1, 0], [1, 0, 0]], [[0, 0, 0], [0, 1, 0], [1, 1, 0]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1]], [[0, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1]], [[0, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 1, 0], [0, 1, 1], [1, 1, 1]], [[0, 1, 0], [1, 1, 1], [1, 1, 0]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 1], [0, 1, 0]],
  [[1, 0, 0], [1, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1], [1, 0, 1]]
];

function normal([a, b, c]: Triangle): Point {
  const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
  const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
  const x = uy * vz - uz * vy; const y = uz * vx - ux * vz; const z = ux * vy - uy * vx;
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

export function createAsciiCubeStl(): Uint8Array {
  const facets = cubeTriangles.map((triangle) => {
    const n = normal(triangle);
    return `  facet normal ${n.join(" ")}\n    outer loop\n${triangle.map((point) => `      vertex ${point.join(" ")}`).join("\n")}\n    endloop\n  endfacet`;
  }).join("\n");
  return encoder.encode(`solid deterministic-cube\n${facets}\nendsolid deterministic-cube\n`);
}

export function createBinaryColouredCubeStl(): Uint8Array {
  const bytes = new Uint8Array(84 + cubeTriangles.length * 50);
  const view = new DataView(bytes.buffer);
  bytes.set(encoder.encode("COLOR="), 0);
  bytes.set([51, 102, 204, 255], 6);
  view.setUint32(80, cubeTriangles.length, true);
  cubeTriangles.forEach((triangle, index) => {
    const offset = 84 + index * 50;
    const values = [...normal(triangle), ...triangle.flat()] as number[];
    values.forEach((value, valueIndex) => view.setFloat32(offset + valueIndex * 4, value, true));
    const red = index % 2 === 0 ? 31 : 0;
    const green = index % 3 === 0 ? 31 : 8;
    const blue = index % 2 === 0 ? 0 : 31;
    view.setUint16(offset + 48, red | (green << 5) | (blue << 10), true);
  });
  return bytes;
}

/**
 * Builds a deterministic planar binary STL for bounded worker and performance acceptance.
 * The 600,000-triangle default is 30,000,084 bytes and spans exactly 1,000 mm by 300 mm.
 */
export function createLargeBinaryStl(triangleCount = LARGE_BINARY_STL_DEFAULT_TRIANGLES): Uint8Array {
  if (!Number.isSafeInteger(triangleCount) || triangleCount < 1 || triangleCount > LARGE_BINARY_STL_MAX_TRIANGLES) {
    throw new RangeError(`Large STL triangle count must be an integer from 1 to ${LARGE_BINARY_STL_MAX_TRIANGLES}.`);
  }
  const bytes = new Uint8Array(84 + triangleCount * 50);
  const view = new DataView(bytes.buffer);
  bytes.set(encoder.encode("EML deterministic large binary STL acceptance fixture"), 0);
  view.setUint32(80, triangleCount, true);
  for (let index = 0; index < triangleCount; index += 1) {
    const cell = Math.floor(index / 2);
    const x = cell % LARGE_BINARY_STL_GRID_WIDTH;
    const y = Math.floor(cell / LARGE_BINARY_STL_GRID_WIDTH);
    const odd = index % 2 === 1;
    const vertices = odd
      ? [x + 1, y, 0, x + 1, y + 1, 0, x, y + 1, 0]
      : [x, y, 0, x + 1, y, 0, x, y + 1, 0];
    const offset = 84 + index * 50;
    view.setFloat32(offset, 0, true);
    view.setFloat32(offset + 4, 0, true);
    view.setFloat32(offset + 8, 1, true);
    for (let component = 0; component < vertices.length; component += 1) {
      view.setFloat32(offset + 12 + component * 4, vertices[component], true);
    }
    view.setUint16(offset + 48, 0, true);
  }
  return bytes;
}

/** Creates only a binary STL header so triangle-limit rejection is allocation-safe. */
export function createBinaryStlTriangleLimitProbe(triangleCount: number): Uint8Array {
  if (!Number.isSafeInteger(triangleCount) || triangleCount < 0 || triangleCount > 0xffffffff) {
    throw new RangeError("Binary STL declared triangle count must fit an unsigned 32-bit integer.");
  }
  const bytes = new Uint8Array(84);
  bytes.set(encoder.encode("EML binary STL triangle-limit probe"), 0);
  new DataView(bytes.buffer).setUint32(80, triangleCount, true);
  return bytes;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipSource {
  readonly name: string;
  readonly data: Uint8Array;
  readonly declaredExpandedBytes?: number;
  readonly declaredCompressedBytes?: number;
}

function join(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function storedZip(sources: readonly ZipSource[]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;
  for (const source of sources) {
    const name = encoder.encode(source.name);
    const checksum = crc32(source.data);
    const local = new Uint8Array(30 + name.length + source.data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true);
    localView.setUint32(14, checksum, true); localView.setUint32(18, source.data.length, true); localView.setUint32(22, source.data.length, true);
    localView.setUint16(26, name.length, true); local.set(name, 30); local.set(source.data, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x0800, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, source.declaredCompressedBytes ?? source.data.length, true);
    centralView.setUint32(24, source.declaredExpandedBytes ?? source.data.length, true);
    centralView.setUint16(28, name.length, true); centralView.setUint32(42, localOffset, true); central.set(name, 46);
    centrals.push(central);
    localOffset += local.length;
  }
  const directory = join(centrals);
  const eocd = new Uint8Array(22);
  const endView = new DataView(eocd.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, sources.length, true); endView.setUint16(10, sources.length, true);
  endView.setUint32(12, directory.length, true); endView.setUint32(16, localOffset, true);
  return join([...locals, directory, eocd]);
}

const contentTypes = encoder.encode(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`);

function relationships(external = false): Uint8Array {
  const target = external ? "https://example.invalid/model.model" : "/3D/3dmodel.model";
  const mode = external ? ` TargetMode="External"` : "";
  return encoder.encode(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="${target}" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"${mode}/></Relationships>`);
}

function cubeMeshXml(): string {
  const vertices = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
  ].map(([x, y, z]) => `<vertex x="${x}" y="${y}" z="${z}"/>`).join("");
  const indices = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5]];
  const triangles = indices.map(([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}" pid="10" p1="0"/>`).join("");
  return `<mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh>`;
}

function modelXml(unit: "millimeter" | "inch", twoComponents: boolean): Uint8Array {
  const objects = twoComponents
    ? `<object id="1" type="model">${cubeMeshXml()}</object><object id="3" type="model"><components><component objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0"/><component objectid="1" transform="1 0 0 0 1 0 0 0 1 2 0 0"/></components></object>`
    : `<object id="1" type="model">${cubeMeshXml()}</object>`;
  const buildId = twoComponents ? 3 : 1;
  return encoder.encode(`<?xml version="1.0" encoding="UTF-8"?>
<model unit="${unit}" xml:lang="en-GB" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><basematerials id="10"><base name="Blue polymer" displaycolor="#3366CCFF"/></basematerials>${objects}</resources><build><item objectid="${buildId}"/></build></model>`);
}

function threeMf(model: Uint8Array, external = false): Uint8Array {
  return storedZip([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: relationships(external) },
    { name: "3D/3dmodel.model", data: model }
  ]);
}

export function createTwoComponentMillimetre3mf(): Uint8Array {
  return threeMf(modelXml("millimeter", true));
}

export function createOneInch3mf(): Uint8Array {
  return threeMf(modelXml("inch", false));
}

export function createMalformedTruncatedStl(): Uint8Array {
  const valid = createBinaryColouredCubeStl();
  return valid.slice(0, valid.length - 17);
}

export function createMalformedTruncated3mf(): Uint8Array {
  const valid = createTwoComponentMillimetre3mf();
  return valid.slice(0, valid.length - 9);
}

export function createZipBombMetadata3mf(): Uint8Array {
  return storedZip([{ name: "3D/3dmodel.model", data: new Uint8Array([0]), declaredCompressedBytes: 1, declaredExpandedBytes: 50_000_000 }]);
}

export function createExternalResource3mf(): Uint8Array {
  return threeMf(modelXml("millimeter", false), true);
}
