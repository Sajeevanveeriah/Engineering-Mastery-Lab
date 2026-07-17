import * as THREE from "three";
import { flangeHoleCentres, plateHoleCentres, type CadDesign } from "./model";

function roundedRectangleShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;
  if (radius <= 0) {
    shape.moveTo(left, bottom);
    shape.lineTo(right, bottom);
    shape.lineTo(right, top);
    shape.lineTo(left, top);
    shape.closePath();
    return shape;
  }
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.absarc(right - radius, bottom + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(right, top - radius);
  shape.absarc(right - radius, top - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(left + radius, top);
  shape.absarc(left + radius, top - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(left, bottom + radius);
  shape.absarc(left + radius, bottom + radius, radius, Math.PI, Math.PI * 1.5, false);
  shape.closePath();
  return shape;
}

function circularPath(x: number, y: number, diameter: number): THREE.Path {
  const path = new THREE.Path();
  path.absarc(x, y, diameter / 2, 0, Math.PI * 2, true);
  return path;
}

function extrudedMesh(shape: THREE.Shape, depth: number, design: CadDesign): THREE.Mesh {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 48
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: design.colour,
    metalness: design.materialId.includes("steel") || design.materialId.includes("al-") ? 0.45 : 0.08,
    roughness: 0.47,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geometry, material);
}

function addOutlinedMesh(group: THREE.Group, mesh: THREE.Mesh): void {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
  const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x122338, transparent: true, opacity: 0.68 }));
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.scale.copy(mesh.scale);
  group.add(outline);
}

export function buildCadObject(design: CadDesign): THREE.Group {
  const group = new THREE.Group();
  group.name = design.name;

  if (design.partType === "plate") {
    const part = design.plate;
    const shape = roundedRectangleShape(part.width, part.height, part.cornerRadius);
    plateHoleCentres(design).forEach(({ x, y }) => shape.holes.push(circularPath(x, y, part.holeDiameter)));
    addOutlinedMesh(group, extrudedMesh(shape, part.thickness, design));
  } else if (design.partType === "flange") {
    const part = design.flange;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, part.outerDiameter / 2, 0, Math.PI * 2, false);
    shape.holes.push(circularPath(0, 0, part.innerDiameter));
    flangeHoleCentres(design).forEach(({ x, y }) => shape.holes.push(circularPath(x, y, part.holeDiameter)));
    addOutlinedMesh(group, extrudedMesh(shape, part.thickness, design));
  } else if (design.partType === "spacer") {
    const part = design.spacer;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, part.outerDiameter / 2, 0, Math.PI * 2, false);
    shape.holes.push(circularPath(0, 0, part.innerDiameter));
    addOutlinedMesh(group, extrudedMesh(shape, part.length, design));
  } else {
    const part = design.angle;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(part.legA, 0);
    shape.lineTo(part.legA, part.thickness);
    shape.lineTo(part.thickness, part.thickness);
    shape.lineTo(part.thickness, part.legB);
    shape.lineTo(0, part.legB);
    shape.closePath();
    const mesh = extrudedMesh(shape, part.width, design);
    mesh.geometry.center();
    addOutlinedMesh(group, mesh);
  }

  return group;
}

export function disposeCadObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}
