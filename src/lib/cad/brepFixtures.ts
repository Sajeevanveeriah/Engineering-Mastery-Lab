import type { BrepDocument } from "./brep";

export function createSketchPadPocketFixture(): BrepDocument {
  return {
    schemaVersion: 1,
    units: "mm",
    features: [
      {
        id: "base-sketch",
        name: "Base sketch",
        kind: "sketch",
        plane: "XY",
        offset: 0,
        entities: [
          { id: "base-rectangle", kind: "rectangle", origin: [0, 0], width: 40, height: 30 },
          { id: "construction-axis", kind: "line", start: [0, 15], end: [40, 15], construction: true }
        ]
      },
      { id: "base-pad", name: "Base pad", kind: "pad", sketchId: "base-sketch", length: 10 },
      {
        id: "hole-sketch",
        name: "Hole sketch",
        kind: "sketch",
        plane: "XY",
        offset: 10,
        entities: [{ id: "hole-circle", kind: "circle", centre: [20, 15], radius: 5 }]
      },
      {
        id: "through-pocket",
        name: "Through pocket",
        kind: "pocket",
        targetId: "base-pad",
        sketchId: "hole-sketch",
        depth: 10
      }
    ],
    bodies: [{ id: "body", name: "Bracket body", sourceFeatureId: "through-pocket", visible: true }]
  };
}

export function createRevolveFixture(): BrepDocument {
  return {
    schemaVersion: 1,
    units: "mm",
    features: [
      {
        id: "revolve-sketch",
        name: "Revolve profile",
        kind: "sketch",
        plane: "XY",
        offset: 0,
        entities: [
          {
            id: "revolve-polyline",
            kind: "polyline",
            points: [
              [8, -5],
              [14, -5],
              [14, 5],
              [8, 5]
            ],
            closed: true
          }
        ]
      },
      {
        id: "revolved-body",
        name: "Revolved body",
        kind: "revolve",
        sketchId: "revolve-sketch",
        axis: [0, 1, 0],
        origin: [0, 0, 0],
        angleDegrees: 360
      }
    ],
    bodies: [{ id: "body", name: "Revolved body", sourceFeatureId: "revolved-body", visible: true }]
  };
}

export function createBooleanFixture(operation: "union" | "subtract" | "intersect" = "union"): BrepDocument {
  return {
    schemaVersion: 1,
    units: "mm",
    features: [
      { id: "box", name: "Box", kind: "box", width: 20, depth: 20, height: 20 },
      { id: "sphere", name: "Sphere", kind: "sphere", radius: 14 },
      {
        id: "boolean-result",
        name: "Boolean result",
        kind: "boolean",
        operation,
        targetId: "box",
        toolId: "sphere"
      }
    ],
    bodies: [{ id: "body", name: "Boolean body", sourceFeatureId: "boolean-result", visible: true }]
  };
}

export function createInvalidFilletFixture(): BrepDocument {
  return {
    schemaVersion: 1,
    units: "mm",
    features: [
      { id: "box", name: "Box", kind: "box", width: 20, depth: 20, height: 20 },
      { id: "invalid-fillet", name: "Invalid all-edge fillet", kind: "fillet", targetId: "box", radius: 1_000 }
    ],
    bodies: [{ id: "body", name: "Last-valid body", sourceFeatureId: "invalid-fillet", visible: true }]
  };
}
