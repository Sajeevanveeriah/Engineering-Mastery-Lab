import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { buildCadObject, disposeCadObject } from "../lib/cad/geometry";
import {
  cadFileStem,
  calculateCadMetrics,
  defaultCadDesign,
  exportCadJson,
  flangeHoleCentres,
  generateCadSvg,
  generateOpenScad,
  importCadJson,
  plateHoleCentres,
  validateCadDesign,
  type CadDesign,
  type CadPartType
} from "../lib/cad/model";

function designFor(partType: CadPartType): CadDesign {
  return { ...structuredClone(defaultCadDesign), partType };
}

describe("CAD model validation and metrics", () => {
  it("accepts the default design and locates its four plate holes", () => {
    const design = designFor("plate");

    expect(validateCadDesign(design)).toEqual([]);
    expect(plateHoleCentres(design)).toEqual([
      { x: -62, y: -32 },
      { x: 62, y: -32 },
      { x: 62, y: 32 },
      { x: -62, y: 32 }
    ]);
  });

  it("calculates rounded plate area, volume, mass and envelope", () => {
    const design = designFor("plate");
    const metrics = calculateCadMetrics(design);
    const expectedArea = 160 * 100
      - (4 - Math.PI) * 8 ** 2
      - 4 * Math.PI * 8.5 ** 2 / 4;

    expect(metrics.profileAreaMm2).toBeCloseTo(expectedArea, 8);
    expect(metrics.volumeMm3).toBeCloseTo(expectedArea * 8, 8);
    expect(metrics.massKg).toBeCloseTo(expectedArea * 8 * 1e-9 * 2700, 10);
    expect(metrics.boundingBox).toEqual({ x: 160, y: 100, z: 8 });
  });

  it("calculates the bolt circle and net area of a flange", () => {
    const design = designFor("flange");
    const centres = flangeHoleCentres(design);
    const metrics = calculateCadMetrics(design);
    const expectedArea = Math.PI * (140 ** 2 - 60 ** 2) / 4
      - 6 * Math.PI * 9 ** 2 / 4;

    expect(centres).toHaveLength(6);
    expect(centres[0]).toEqual({ x: 52.5, y: 0 });
    expect(centres[3].x).toBeCloseTo(-52.5, 10);
    expect(centres[3].y).toBeCloseTo(0, 10);
    expect(metrics.profileAreaMm2).toBeCloseTo(expectedArea, 8);
    expect(metrics.boundingBox).toEqual({ x: 140, y: 140, z: 12 });
  });

  it("rejects unsafe or impossible CAD parameters", () => {
    const unsafeName = designFor("plate");
    unsafeName.name = "part/../../escape";
    expect(validateCadDesign(unsafeName)).toContainEqual(expect.stringMatching(/filename-safe/));

    const overlappingPlate = designFor("plate");
    overlappingPlate.plate.edgeX = 77;
    expect(validateCadDesign(overlappingPlate)).toContainEqual(expect.stringMatching(/overlap/));

    const invalidFlange = designFor("flange");
    invalidFlange.flange.holeCount = 2;
    invalidFlange.flange.innerDiameter = invalidFlange.flange.outerDiameter;
    expect(validateCadDesign(invalidFlange)).toEqual(expect.arrayContaining([
      expect.stringMatching(/integer from 3 to 24/),
      expect.stringMatching(/smaller than its outer diameter/)
    ]));

    expect(() => calculateCadMetrics(invalidFlange)).toThrow();
  });
});

describe("CAD file exports", () => {
  it("generates deterministic OpenSCAD plate geometry", () => {
    const design = designFor("plate");
    const first = generateOpenScad(design);
    const second = generateOpenScad(structuredClone(design));

    expect(first).toBe(second);
    expect(first).toContain("difference() {");
    expect(first).toContain("linear_extrude(height=8, center=true)");
    expect(first.match(/translate\(\[/g)).toHaveLength(4);
    expect(first).toContain("d=8.5");
  });

  it("generates SVG output with the expected plate geometry", () => {
    const svg = generateCadSvg(designFor("plate"));

    expect(svg).toMatch(/^<\?xml version="1\.0"/);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("Motor mounting plate");
    expect(svg.match(/<circle /g)).toHaveLength(4);
    expect(svg).toContain("Verify before manufacture.");
  });

  it("round-trips versioned CAD JSON as a defensive clone", () => {
    const design = designFor("spacer");
    const source = exportCadJson(design);
    const imported = importCadJson(source);

    expect(imported).toEqual(design);
    expect(imported).not.toBe(design);
    imported.spacer.length = 99;
    expect(design.spacer.length).toBe(25);
  });

  it("rejects malformed, invalid and oversized CAD JSON", () => {
    expect(() => importCadJson("[]")).toThrow(/must contain an object/);
    expect(() => importCadJson(JSON.stringify({ version: 1 }))).toThrow(/Part name/);
    expect(() => importCadJson(JSON.stringify({
      ...designFor("plate"),
      partType: "unsupported"
    }))).toThrow(/Part type/);
    expect(() => importCadJson(JSON.stringify({ ...designFor("spacer"), version: 2 }))).toThrow(/Unsupported CAD design version/);
    expect(() => importCadJson("x".repeat(100_001))).toThrow(/too large/);
  });

  it("creates a safe export filename stem", () => {
    const design = designFor("plate");
    design.name = "Drive Plate (Rev 2)";
    expect(cadFileStem(design)).toBe("drive-plate-rev-2");
  });
});

describe("CAD mesh generation", () => {
  it.each([
    ["plate", [160, 100, 8]],
    ["flange", [140, 140, 12]],
    ["spacer", [32, 32, 25]],
    ["angle", [50, 40, 80]]
  ] as const)("builds finite %s geometry with the design envelope", (partType, expectedSize) => {
    const design = designFor(partType);
    const object = buildCadObject(design);
    const mesh = object.children.find((child): child is THREE.Mesh => child instanceof THREE.Mesh);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());

    expect(object.name).toBe(design.name);
    expect(mesh).toBeDefined();
    expect(mesh?.geometry.getAttribute("position").count).toBeGreaterThan(0);
    expect([size.x, size.y, size.z]).toEqual(expect.arrayContaining(expectedSize.map((value) => expect.closeTo(value, 5))));

    const stl = new STLExporter().parse(object);
    expect(typeof stl).toBe("string");
    expect(stl).toContain("solid exported");
    expect(stl).toContain("facet normal");

    expect(() => disposeCadObject(object)).not.toThrow();
  });
});
