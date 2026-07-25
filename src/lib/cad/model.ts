export type CadPartType = "plate" | "flange" | "spacer" | "angle";

export interface CadDesign {
  version: 1;
  name: string;
  partType: CadPartType;
  materialId: string;
  density: number;
  colour: string;
  plate: {
    width: number;
    height: number;
    thickness: number;
    cornerRadius: number;
    holeCount: 0 | 2 | 4;
    holeDiameter: number;
    edgeX: number;
    edgeY: number;
  };
  flange: {
    outerDiameter: number;
    innerDiameter: number;
    thickness: number;
    pitchCircleDiameter: number;
    holeCount: number;
    holeDiameter: number;
  };
  spacer: {
    outerDiameter: number;
    innerDiameter: number;
    length: number;
  };
  angle: {
    width: number;
    legA: number;
    legB: number;
    thickness: number;
  };
}

export interface CadMetrics {
  profileAreaMm2: number;
  volumeMm3: number;
  massKg: number;
  boundingBox: { x: number; y: number; z: number };
}

export const defaultCadDesign: CadDesign = {
  version: 1,
  name: "Motor mounting plate",
  partType: "plate",
  materialId: "al-6061-t6",
  density: 2700,
  colour: "#3f8fd2",
  plate: {
    width: 160,
    height: 100,
    thickness: 8,
    cornerRadius: 8,
    holeCount: 4,
    holeDiameter: 8.5,
    edgeX: 18,
    edgeY: 18
  },
  flange: {
    outerDiameter: 140,
    innerDiameter: 60,
    thickness: 12,
    pitchCircleDiameter: 105,
    holeCount: 6,
    holeDiameter: 9
  },
  spacer: {
    outerDiameter: 32,
    innerDiameter: 12,
    length: 25
  },
  angle: {
    width: 80,
    legA: 50,
    legB: 40,
    thickness: 6
  }
};

const CAD_IMPORT_LIMIT = 100_000;
const MAX_CAD_DIMENSION_MM = 1_000_000;
const MAX_DENSITY_KG_M3 = 100_000;
const namePattern = /^[\p{L}\p{N} _().,#+'-]{1,80}$/u;
const colourPattern = /^#[0-9a-f]{6}$/i;

function finitePositive(value: number, label: string, errors: string[]): void {
  if (!Number.isFinite(value) || value <= 0) errors.push(`${label} must be a finite value greater than zero.`);
}

function finiteDimension(value: number, label: string, errors: string[]): void {
  finitePositive(value, label, errors);
  if (Number.isFinite(value) && value > MAX_CAD_DIMENSION_MM) {
    errors.push(`${label} must not exceed ${MAX_CAD_DIMENSION_MM.toLocaleString("en-GB")} mm.`);
  }
}

function hasObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function plateHoleCentres(design: CadDesign): Array<{ x: number; y: number }> {
  const { width, height, holeCount, edgeX, edgeY } = design.plate;
  if (holeCount === 0) return [];
  if (holeCount === 2) {
    return [
      { x: -width / 2 + edgeX, y: 0 },
      { x: width / 2 - edgeX, y: 0 }
    ];
  }
  return [
    { x: -width / 2 + edgeX, y: -height / 2 + edgeY },
    { x: width / 2 - edgeX, y: -height / 2 + edgeY },
    { x: width / 2 - edgeX, y: height / 2 - edgeY },
    { x: -width / 2 + edgeX, y: height / 2 - edgeY }
  ];
}

export function flangeHoleCentres(design: CadDesign): Array<{ x: number; y: number }> {
  const { pitchCircleDiameter, holeCount } = design.flange;
  return Array.from({ length: Math.max(0, Math.floor(holeCount)) }, (_, index) => {
    const angle = 2 * Math.PI * index / holeCount;
    return {
      x: pitchCircleDiameter / 2 * Math.cos(angle),
      y: pitchCircleDiameter / 2 * Math.sin(angle)
    };
  });
}

export function validateCadDesign(design: CadDesign): string[] {
  const errors: string[] = [];
  if (design.version !== 1) errors.push("Unsupported CAD design version.");
  if (typeof design.name !== "string" || !namePattern.test(design.name.trim())) errors.push("Part name must be 1 to 80 characters and contain only ordinary filename-safe characters.");
  if (typeof design.materialId !== "string" || design.materialId.length < 1 || design.materialId.length > 80) errors.push("Material identifier must be 1 to 80 characters.");
  if (typeof design.colour !== "string" || !colourPattern.test(design.colour)) errors.push("Part colour must be a six-digit hexadecimal colour.");
  finitePositive(design.density, "Material density", errors);
  if (Number.isFinite(design.density) && design.density > MAX_DENSITY_KG_M3) errors.push(`Material density must not exceed ${MAX_DENSITY_KG_M3.toLocaleString("en-GB")} kg/m3.`);

  if (!["plate", "flange", "spacer", "angle"].includes(design.partType)) {
    errors.push("Part type must be plate, flange, spacer or angle.");
    return [...new Set(errors)];
  }

  if (design.partType === "plate") {
    const plate = design.plate;
    if (!hasObject(plate)) {
      errors.push("Plate parameters are missing or invalid.");
      return [...new Set(errors)];
    }
    finiteDimension(plate.width, "Plate width", errors);
    finiteDimension(plate.height, "Plate height", errors);
    finiteDimension(plate.thickness, "Plate thickness", errors);
    if (!Number.isFinite(plate.cornerRadius) || plate.cornerRadius < 0 || plate.cornerRadius > Math.min(plate.width, plate.height) / 2) {
      errors.push("Corner radius must be between zero and half the smaller plate dimension.");
    }
    if (![0, 2, 4].includes(plate.holeCount)) errors.push("Plate hole count must be 0, 2 or 4.");
    if (plate.holeCount > 0) {
      finiteDimension(plate.holeDiameter, "Plate hole diameter", errors);
      finiteDimension(plate.edgeX, "Horizontal hole edge distance", errors);
      if (plate.holeCount === 4) finiteDimension(plate.edgeY, "Vertical hole edge distance", errors);
      const holeRadius = plate.holeDiameter / 2;
      if (plate.edgeX <= holeRadius) errors.push("Plate holes must retain material to both vertical edges.");
      if (plate.edgeX >= plate.width / 2) errors.push("Horizontal hole edge distance must be less than half the plate width.");
      if (plate.holeCount === 4 && plate.edgeY <= holeRadius) {
        errors.push("Plate holes must retain material to both horizontal edges.");
      }
      if (plate.holeCount === 4 && plate.edgeY >= plate.height / 2) errors.push("Vertical hole edge distance must be less than half the plate height.");
      if (plate.holeCount === 4 && plate.cornerRadius > holeRadius) {
        const cornerDistance = Math.hypot(plate.edgeX - plate.cornerRadius, plate.edgeY - plate.cornerRadius);
        if (plate.edgeX < plate.cornerRadius && plate.edgeY < plate.cornerRadius && cornerDistance + holeRadius >= plate.cornerRadius) {
          errors.push("Plate holes intersect a rounded corner. Increase the edge distances or reduce the hole size.");
        }
      }
      const centres = plateHoleCentres(design);
      for (let a = 0; a < centres.length; a += 1) {
        for (let b = a + 1; b < centres.length; b += 1) {
          if (Math.hypot(centres[a].x - centres[b].x, centres[a].y - centres[b].y) <= plate.holeDiameter) {
            errors.push("Plate holes overlap. Increase their spacing or reduce their diameter.");
            a = centres.length;
            break;
          }
        }
      }
    }
  }

  if (design.partType === "flange") {
    const flange = design.flange;
    if (!hasObject(flange)) {
      errors.push("Flange parameters are missing or invalid.");
      return [...new Set(errors)];
    }
    finiteDimension(flange.outerDiameter, "Flange outer diameter", errors);
    finiteDimension(flange.innerDiameter, "Flange bore diameter", errors);
    finiteDimension(flange.thickness, "Flange thickness", errors);
    finiteDimension(flange.pitchCircleDiameter, "Pitch circle diameter", errors);
    finiteDimension(flange.holeDiameter, "Flange hole diameter", errors);
    if (!Number.isInteger(flange.holeCount) || flange.holeCount < 3 || flange.holeCount > 24) {
      errors.push("Flange hole count must be an integer from 3 to 24.");
    }
    if (flange.innerDiameter >= flange.outerDiameter) errors.push("Flange bore diameter must be smaller than its outer diameter.");
    const innerHoleEdge = (flange.pitchCircleDiameter - flange.holeDiameter) / 2;
    const outerHoleEdge = (flange.pitchCircleDiameter + flange.holeDiameter) / 2;
    if (innerHoleEdge <= flange.innerDiameter / 2) errors.push("Flange bolt holes intersect the centre bore.");
    if (outerHoleEdge >= flange.outerDiameter / 2) errors.push("Flange bolt holes break through the outer edge.");
    if (Number.isInteger(flange.holeCount) && flange.holeCount >= 3) {
      const spacing = flange.pitchCircleDiameter * Math.sin(Math.PI / flange.holeCount);
      if (spacing <= flange.holeDiameter) errors.push("Adjacent flange holes overlap.");
    }
  }

  if (design.partType === "spacer") {
    if (!hasObject(design.spacer)) {
      errors.push("Spacer parameters are missing or invalid.");
      return [...new Set(errors)];
    }
    finiteDimension(design.spacer.outerDiameter, "Spacer outer diameter", errors);
    finiteDimension(design.spacer.innerDiameter, "Spacer bore diameter", errors);
    finiteDimension(design.spacer.length, "Spacer length", errors);
    if (design.spacer.innerDiameter >= design.spacer.outerDiameter) errors.push("Spacer bore diameter must be smaller than its outer diameter.");
  }

  if (design.partType === "angle") {
    const angle = design.angle;
    if (!hasObject(angle)) {
      errors.push("Angle parameters are missing or invalid.");
      return [...new Set(errors)];
    }
    finiteDimension(angle.width, "Angle width", errors);
    finiteDimension(angle.legA, "Angle leg A", errors);
    finiteDimension(angle.legB, "Angle leg B", errors);
    finiteDimension(angle.thickness, "Angle thickness", errors);
    if (angle.thickness >= Math.min(angle.legA, angle.legB)) errors.push("Angle thickness must be smaller than both leg dimensions.");
  }

  return [...new Set(errors)];
}

export function calculateCadMetrics(design: CadDesign): CadMetrics {
  const errors = validateCadDesign(design);
  if (errors.length > 0) throw new Error(errors[0]);
  let area: number;
  let depth: number;
  let boundingBox: CadMetrics["boundingBox"];

  if (design.partType === "plate") {
    const plate = design.plate;
    area = plate.width * plate.height
      - (4 - Math.PI) * plate.cornerRadius ** 2
      - plate.holeCount * Math.PI * plate.holeDiameter ** 2 / 4;
    depth = plate.thickness;
    boundingBox = { x: plate.width, y: plate.height, z: plate.thickness };
  } else if (design.partType === "flange") {
    const flange = design.flange;
    area = Math.PI * (flange.outerDiameter ** 2 - flange.innerDiameter ** 2) / 4
      - flange.holeCount * Math.PI * flange.holeDiameter ** 2 / 4;
    depth = flange.thickness;
    boundingBox = { x: flange.outerDiameter, y: flange.outerDiameter, z: flange.thickness };
  } else if (design.partType === "spacer") {
    const spacer = design.spacer;
    area = Math.PI * (spacer.outerDiameter ** 2 - spacer.innerDiameter ** 2) / 4;
    depth = spacer.length;
    boundingBox = { x: spacer.outerDiameter, y: spacer.outerDiameter, z: spacer.length };
  } else {
    const angle = design.angle;
    area = angle.thickness * (angle.legA + angle.legB - angle.thickness);
    depth = angle.width;
    boundingBox = { x: angle.legA, y: angle.legB, z: angle.width };
  }

  const volume = area * depth;
  return {
    profileAreaMm2: area,
    volumeMm3: volume,
    massKg: volume * 1e-9 * design.density,
    boundingBox
  };
}

function safeFileStem(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "cad-part";
}

export function cadFileStem(design: CadDesign): string {
  return safeFileStem(design.name);
}

function formatNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

export function generateOpenScad(design: CadDesign): string {
  const errors = validateCadDesign(design);
  if (errors.length > 0) throw new Error(errors[0]);
  const header = [
    `// ${design.name}`,
    "// Generated by Engineering Workbench CAD Studio",
    "// Units: millimetres",
    "$fn = 96;",
    ""
  ];

  if (design.partType === "plate") {
    const part = design.plate;
    const centres = plateHoleCentres(design);
    const roundedProfile = part.cornerRadius > 0
      ? `offset(r=${formatNumber(part.cornerRadius)}) square([${formatNumber(part.width - 2 * part.cornerRadius)}, ${formatNumber(part.height - 2 * part.cornerRadius)}], center=true);`
      : `square([${formatNumber(part.width)}, ${formatNumber(part.height)}], center=true);`;
    return [...header,
      "difference() {",
      `  linear_extrude(height=${formatNumber(part.thickness)}, center=true) ${roundedProfile}`,
      ...centres.map(({ x, y }) => `  translate([${formatNumber(x)}, ${formatNumber(y)}, 0]) cylinder(h=${formatNumber(part.thickness + 2)}, d=${formatNumber(part.holeDiameter)}, center=true);`),
      "}",
      ""
    ].join("\n");
  }

  if (design.partType === "flange") {
    const part = design.flange;
    return [...header,
      "difference() {",
      `  cylinder(h=${formatNumber(part.thickness)}, d=${formatNumber(part.outerDiameter)}, center=true);`,
      `  cylinder(h=${formatNumber(part.thickness + 2)}, d=${formatNumber(part.innerDiameter)}, center=true);`,
      ...flangeHoleCentres(design).map(({ x, y }) => `  translate([${formatNumber(x)}, ${formatNumber(y)}, 0]) cylinder(h=${formatNumber(part.thickness + 2)}, d=${formatNumber(part.holeDiameter)}, center=true);`),
      "}",
      ""
    ].join("\n");
  }

  if (design.partType === "spacer") {
    const part = design.spacer;
    return [...header,
      "difference() {",
      `  cylinder(h=${formatNumber(part.length)}, d=${formatNumber(part.outerDiameter)}, center=true);`,
      `  cylinder(h=${formatNumber(part.length + 2)}, d=${formatNumber(part.innerDiameter)}, center=true);`,
      "}",
      ""
    ].join("\n");
  }

  const part = design.angle;
  return [...header,
    "union() {",
    `  translate([0, ${formatNumber(part.thickness / 2)}, 0]) cube([${formatNumber(part.legA)}, ${formatNumber(part.thickness)}, ${formatNumber(part.width)}], center=true);`,
    `  translate([${formatNumber(-part.legA / 2 + part.thickness / 2)}, ${formatNumber(part.legB / 2)}, 0]) cube([${formatNumber(part.thickness)}, ${formatNumber(part.legB)}, ${formatNumber(part.width)}], center=true);`,
    "}",
    ""
  ].join("\n");
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  })[character] ?? character);
}

export function generateCadSvg(design: CadDesign): string {
  const errors = validateCadDesign(design);
  if (errors.length > 0) throw new Error(errors[0]);
  const width = 900;
  const height = 620;
  const stroke = "#17314f";
  const fill = design.colour;
  const title = escapeXml(design.name);
  let geometry = "";

  if (design.partType === "plate") {
    const part = design.plate;
    const scale = Math.min(620 / part.width, 390 / part.height);
    const w = part.width * scale;
    const h = part.height * scale;
    const x = 450 - w / 2;
    const y = 300 - h / 2;
    const holes = plateHoleCentres(design).map((centre) =>
      `<circle cx="${450 + centre.x * scale}" cy="${300 + centre.y * scale}" r="${part.holeDiameter * scale / 2}" fill="#ffffff" stroke="${stroke}" stroke-width="2"/>`
    ).join("");
    geometry = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${part.cornerRadius * scale}" fill="${fill}" fill-opacity="0.72" stroke="${stroke}" stroke-width="3"/>${holes}`;
  } else if (design.partType === "flange") {
    const part = design.flange;
    const scale = 410 / part.outerDiameter;
    geometry = `<circle cx="450" cy="300" r="${part.outerDiameter * scale / 2}" fill="${fill}" fill-opacity="0.72" stroke="${stroke}" stroke-width="3"/>`
      + `<circle cx="450" cy="300" r="${part.innerDiameter * scale / 2}" fill="#ffffff" stroke="${stroke}" stroke-width="3"/>`
      + flangeHoleCentres(design).map((centre) => `<circle cx="${450 + centre.x * scale}" cy="${300 + centre.y * scale}" r="${part.holeDiameter * scale / 2}" fill="#ffffff" stroke="${stroke}" stroke-width="2"/>`).join("")
      + `<circle cx="450" cy="300" r="${part.pitchCircleDiameter * scale / 2}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="8 7"/>`;
  } else if (design.partType === "spacer") {
    const part = design.spacer;
    const scale = Math.min(250 / part.outerDiameter, 420 / part.length);
    const d = part.outerDiameter * scale;
    const bore = part.innerDiameter * scale;
    const sideLength = part.length * scale;
    geometry = `<circle cx="260" cy="300" r="${d / 2}" fill="${fill}" fill-opacity="0.72" stroke="${stroke}" stroke-width="3"/>`
      + `<circle cx="260" cy="300" r="${bore / 2}" fill="#ffffff" stroke="${stroke}" stroke-width="3"/>`
      + `<rect x="${560 - sideLength / 2}" y="${300 - d / 2}" width="${sideLength}" height="${d}" fill="${fill}" fill-opacity="0.72" stroke="${stroke}" stroke-width="3"/>`
      + `<line x1="${560 - sideLength / 2}" y1="${300 - bore / 2}" x2="${560 + sideLength / 2}" y2="${300 - bore / 2}" stroke="#64748b" stroke-width="2" stroke-dasharray="8 7"/>`
      + `<line x1="${560 - sideLength / 2}" y1="${300 + bore / 2}" x2="${560 + sideLength / 2}" y2="${300 + bore / 2}" stroke="#64748b" stroke-width="2" stroke-dasharray="8 7"/>`;
  } else {
    const part = design.angle;
    const scale = Math.min(360 / part.legA, 360 / part.legB);
    const x = 450 - part.legA * scale / 2;
    const y = 300 - part.legB * scale / 2;
    const points = [
      [x, y],
      [x + part.thickness * scale, y],
      [x + part.thickness * scale, y + (part.legB - part.thickness) * scale],
      [x + part.legA * scale, y + (part.legB - part.thickness) * scale],
      [x + part.legA * scale, y + part.legB * scale],
      [x, y + part.legB * scale]
    ].map((point) => point.join(",")).join(" ");
    geometry = `<polygon points="${points}" fill="${fill}" fill-opacity="0.72" stroke="${stroke}" stroke-width="3"/>`;
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#f8fafc"/>`,
    `<text x="42" y="48" font-family="Segoe UI, sans-serif" font-size="24" font-weight="700" fill="${stroke}">${title}</text>`,
    `<text x="42" y="78" font-family="Segoe UI, sans-serif" font-size="14" fill="#52657d">Parametric drawing preview. Dimensions in millimetres.</text>`,
    geometry,
    `<line x1="42" y1="565" x2="858" y2="565" stroke="#cbd5e1"/>`,
    `<text x="42" y="594" font-family="Segoe UI, sans-serif" font-size="13" fill="#52657d">Generated by Engineering Workbench CAD Studio. Verify before manufacture.</text>`,
    `</svg>`,
    ""
  ].join("\n");
}

export function exportCadJson(design: CadDesign): string {
  const errors = validateCadDesign(design);
  if (errors.length > 0) throw new Error(errors[0]);
  return JSON.stringify(design, null, 2);
}

export function importCadJson(source: string): CadDesign {
  if (source.length > CAD_IMPORT_LIMIT) throw new Error("CAD design file is too large.");
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("CAD design file must contain an object.");
  const design = parsed as CadDesign;
  const errors = validateCadDesign(design);
  if (errors.length > 0) throw new Error(errors[0]);
  return structuredClone(design);
}
