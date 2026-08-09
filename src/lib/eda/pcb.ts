import { validateEdaDocument } from "./document";
import type { CopperLayer, Diagnostic, EdaDocument, Pad, Point, Track } from "./types";

export interface RatsnestEdge { net: string; fromId: string; toId: string; from: Point; to: Point; lengthMm: number }
export interface CopperComponent { net: string; padIds: string[]; itemIds: string[] }
type CopperItem = { id: string; net: string; layers: CopperLayer[]; kind: "pad" | "via" | "track"; at?: Point; radiusMm: number; segments: Segment[] };
type Segment = { a: Point; b: Point };
type ContactShape = { kind: "circle"; centre: Point; radiusMm: number } | { kind: "capsule"; segment: Segment; radiusMm: number } | { kind: "rect"; centre: Point; halfWidthMm: number; halfHeightMm: number; rotationDeg: number };
type ContactCopperItem = CopperItem & { contactShapes: ContactShape[] };

export function validateClosedOutline(outline: Point[]): boolean {
  if (outline.length < 4 || !samePoint(outline[0], outline.at(-1) as Point) || Math.abs(polygonArea(outline)) <= 1e-9) return false;
  const segments = outlineSegments(outline);
  for (let a = 0; a < segments.length; a += 1) for (let b = a + 1; b < segments.length; b += 1) {
    if (Math.abs(a - b) <= 1 || (a === 0 && b === segments.length - 1)) continue;
    if (segmentsIntersect(segments[a], segments[b], true)) return false;
  }
  return true;
}

export function isFortyFiveDegreeTrack(track: Track): boolean {
  return track.points.length >= 2 && track.points.every(finitePoint) && track.points.slice(1).every((point, index) => {
    const dx = Math.abs(point.xMm - track.points[index].xMm); const dy = Math.abs(point.yMm - track.points[index].yMm);
    return (dx > 1e-9 || dy > 1e-9) && (dx < 1e-9 || dy < 1e-9 || Math.abs(dx - dy) < 1e-9);
  });
}

export function buildCopperConnectivity(document: EdaDocument): CopperComponent[] {
  const items = copperItems(document); const parent = items.map((_, index) => index);
  const find = (index: number): number => { while (parent[index] !== index) { parent[index] = parent[parent[index]]; index = parent[index]; } return index; };
  const union = (a: number, b: number): void => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb); };
  for (let a = 0; a < items.length; a += 1) for (let b = a + 1; b < items.length; b += 1) if (items[a].net === items[b].net && layersOverlap(items[a].layers, items[b].layers) && electricalContact(items[a], items[b])) union(a, b);
  const groups = new Map<string, CopperItem[]>();
  items.forEach((item, index) => { const key = `${item.net}\u0000${find(index)}`; groups.set(key, [...(groups.get(key) ?? []), item]); });
  return [...groups.values()].map((group) => ({ net: group[0].net, padIds: group.filter((item) => item.kind === "pad").map((item) => item.id).sort(), itemIds: group.map((item) => item.id).sort() })).sort((a, b) => a.net.localeCompare(b.net) || a.itemIds.join().localeCompare(b.itemIds.join()));
}

export function buildRatsnest(document: EdaDocument): RatsnestEdge[] {
  const pads = copperItems(document).filter((item): item is ContactCopperItem & { at: Point } => item.kind === "pad" && Boolean(item.at));
  const components = buildCopperConnectivity(document).filter((component) => component.padIds.length);
  const edges: RatsnestEdge[] = [];
  for (const net of [...new Set(pads.map((pad) => pad.net))].sort()) {
    const netComponents = components.filter((component) => component.net === net);
    if (netComponents.length < 2) continue;
    const joined = new Set([0]);
    while (joined.size < netComponents.length) {
      const candidates = [...joined].flatMap((fromIndex) => netComponents.map((_, toIndex) => toIndex).filter((toIndex) => !joined.has(toIndex)).flatMap((toIndex) => closestPadPair(netComponents[fromIndex].padIds, netComponents[toIndex].padIds, pads).map((pair) => ({ ...pair, toIndex }))));
      candidates.sort((a, b) => a.lengthMm - b.lengthMm || a.from.id.localeCompare(b.from.id) || a.to.id.localeCompare(b.to.id));
      const selected = candidates[0]; joined.add(selected.toIndex);
      edges.push({ net, fromId: selected.from.id, toId: selected.to.id, from: selected.from.at, to: selected.to.at, lengthMm: selected.lengthMm });
    }
  }
  return edges;
}

export function runDrc(document: EdaDocument): Diagnostic[] {
  const schema = validateEdaDocument(document).filter((item) => ["DUPLICATE_ID", "NON_FINITE_GEOMETRY", "INVALID_DIMENSION", "UNDECLARED_NET"].includes(item.code));
  const out: Diagnostic[] = schema.map((item) => ({ ...item, code: item.code === "DUPLICATE_ID" ? "DRC_DUPLICATE_ID" : item.code })); const { pcb } = document;
  if (!validateClosedOutline(pcb.outline)) out.push(diag("DRC_INVALID_OUTLINE", "PCB outline must be closed, non-zero and free of self-intersections", []));
  for (const track of pcb.tracks) { if (track.widthMm < pcb.rules.minTrackWidthMm) out.push(diag("DRC_TRACK_WIDTH", `Track ${track.id} width is below ${pcb.rules.minTrackWidthMm} mm`, [track.id])); if (!isFortyFiveDegreeTrack(track)) out.push(diag("DRC_TRACK_ANGLE", `Track ${track.id} contains a zero-length or non-45-degree segment`, [track.id])); }
  for (const via of pcb.vias) if (via.diameterMm < pcb.rules.minViaDiameterMm || via.drillMm < pcb.rules.minViaDrillMm || via.drillMm >= via.diameterMm) out.push(diag("DRC_VIA_SIZE", `Via ${via.id} violates diameter or drill rules`, [via.id]));
  const copper = copperItems(document);
  for (let a = 0; a < copper.length; a += 1) for (let b = a + 1; b < copper.length; b += 1) if (copper[a].net !== copper[b].net && layersOverlap(copper[a].layers, copper[b].layers) && copperDistance(copper[a], copper[b]) < copper[a].radiusMm + copper[b].radiusMm + pcb.rules.clearanceMm - 1e-9) out.push(diag("DRC_CLEARANCE", `${copper[a].id} and ${copper[b].id} violate copper clearance`, [copper[a].id, copper[b].id]));
  if (validateClosedOutline(pcb.outline)) for (const item of copper) if (edgeViolation(item, pcb.outline, pcb.rules.minEdgeClearanceMm)) out.push(diag("DRC_EDGE_CLEARANCE", `${item.id} violates the board edge clearance`, [item.id]));
  const padCounts = new Map<string, number>(); for (const item of copper.filter((candidate) => candidate.kind === "pad")) padCounts.set(item.net, (padCounts.get(item.net) ?? 0) + 1);
  const components = buildCopperConnectivity(document);
  for (const [net, count] of [...padCounts].sort()) { const padComponents = components.filter((component) => component.net === net && component.padIds.length); if (count > 1 && padComponents.length > 1) out.push(diag("DRC_UNCONNECTED_NET", `Net ${net} has ${padComponents.length} disconnected copper components`, padComponents.flatMap((component) => component.padIds))); }
  return uniqueDiagnostics(out).sort((a, b) => a.code.localeCompare(b.code) || a.ids.join().localeCompare(b.ids.join()));
}

function copperItems(document: EdaDocument): ContactCopperItem[] {
  const pads = document.pcb.footprints.flatMap((footprint) => footprint.pads.filter((pad): pad is Pad & { net: string } => Boolean(pad.net)).map((pad) => ({ id: pad.id, net: pad.net, kind: "pad" as const, at: pad.at, radiusMm: padClearanceRadius(pad), segments: [] as Segment[], contactShapes: [padContactShape(pad, footprint.rotationDeg, footprint.side)], layers: pad.throughHole ? ["F.Cu" as const, "B.Cu" as const] : [footprint.side === "front" ? "F.Cu" as const : "B.Cu" as const] })));
  const tracks = document.pcb.tracks.map((track) => { const segments = track.points.slice(1).map((point, index) => ({ a: track.points[index], b: point })); return { id: track.id, net: track.net, kind: "track" as const, radiusMm: track.widthMm / 2, layers: [track.layer], segments, contactShapes: segments.map((segment) => ({ kind: "capsule" as const, segment, radiusMm: track.widthMm / 2 })) }; });
  const vias = document.pcb.vias.map((via) => ({ id: via.id, net: via.net, kind: "via" as const, at: via.at, radiusMm: via.diameterMm / 2, segments: [] as Segment[], contactShapes: [{ kind: "circle" as const, centre: via.at, radiusMm: via.diameterMm / 2 }], layers: ["F.Cu" as const, "B.Cu" as const] }));
  return [...pads, ...tracks, ...vias].sort((a, b) => a.id.localeCompare(b.id));
}
function padContactShape(pad: Pad, footprintRotationDeg: number, side: "front" | "back"): ContactShape { const localRotation = pad.rotationDeg ?? 0; const rotationDeg = footprintRotationDeg + (side === "back" ? -localRotation : localRotation); if (pad.shape === "circle") return { kind: "circle", centre: pad.at, radiusMm: Math.min(pad.sizeMm.width, pad.sizeMm.height) / 2 }; if (pad.shape === "rect") return { kind: "rect", centre: pad.at, halfWidthMm: pad.sizeMm.width / 2, halfHeightMm: pad.sizeMm.height / 2, rotationDeg }; const majorAlongWidth = pad.sizeMm.width >= pad.sizeMm.height; const radiusMm = Math.min(pad.sizeMm.width, pad.sizeMm.height) / 2; const halfSpineMm = (Math.max(pad.sizeMm.width, pad.sizeMm.height) - 2 * radiusMm) / 2; const axisDeg = rotationDeg + (majorAlongWidth ? 0 : 90); const offset = vectorAt(axisDeg, halfSpineMm); return { kind: "capsule", segment: { a: { xMm: pad.at.xMm - offset.xMm, yMm: pad.at.yMm - offset.yMm }, b: { xMm: pad.at.xMm + offset.xMm, yMm: pad.at.yMm + offset.yMm } }, radiusMm }; }
function padClearanceRadius(pad: Pad): number { return pad.shape === "rect" ? Math.hypot(pad.sizeMm.width, pad.sizeMm.height) / 2 : Math.max(pad.sizeMm.width, pad.sizeMm.height) / 2; }
function electricalContact(a: ContactCopperItem, b: ContactCopperItem): boolean { return a.contactShapes.some((left) => b.contactShapes.some((right) => contactShapeDistance(left, right) <= 1e-9)); }
function contactShapeDistance(a: ContactShape, b: ContactShape): number {
  if (a.kind === "circle" && b.kind === "circle") return Math.max(0, distance(a.centre, b.centre) - a.radiusMm - b.radiusMm);
  if (a.kind === "circle" && b.kind === "capsule") return Math.max(0, pointSegmentDistance(a.centre, b.segment) - a.radiusMm - b.radiusMm);
  if (a.kind === "capsule" && b.kind === "circle") return contactShapeDistance(b, a);
  if (a.kind === "capsule" && b.kind === "capsule") return Math.max(0, segmentDistance(a.segment, b.segment) - a.radiusMm - b.radiusMm);
  if (a.kind === "rect" && b.kind === "circle") return Math.max(0, pointRectDistance(b.centre, a) - b.radiusMm);
  if (a.kind === "circle" && b.kind === "rect") return contactShapeDistance(b, a);
  if (a.kind === "rect" && b.kind === "capsule") return Math.max(0, segmentRectDistance(b.segment, a) - b.radiusMm);
  if (a.kind === "capsule" && b.kind === "rect") return contactShapeDistance(b, a);
  return rectRectDistance(a as Extract<ContactShape, { kind: "rect" }>, b as Extract<ContactShape, { kind: "rect" }>);
}
function pointRectDistance(point: Point, rect: Extract<ContactShape, { kind: "rect" }>): number { const local = toRectLocal(point, rect); const dx = Math.max(Math.abs(local.xMm) - rect.halfWidthMm, 0); const dy = Math.max(Math.abs(local.yMm) - rect.halfHeightMm, 0); return Math.hypot(dx, dy); }
function segmentRectDistance(segment: Segment, rect: Extract<ContactShape, { kind: "rect" }>): number { const localSegment = { a: toRectLocal(segment.a, rect), b: toRectLocal(segment.b, rect) }; const localRect = axisRect(rect.halfWidthMm, rect.halfHeightMm); if (pointInsideAxisRect(localSegment.a, rect.halfWidthMm, rect.halfHeightMm) || pointInsideAxisRect(localSegment.b, rect.halfWidthMm, rect.halfHeightMm) || localRect.some((edge) => segmentsIntersect(localSegment, edge, true))) return 0; return Math.min(...localRect.map((edge) => segmentDistance(localSegment, edge))); }
function rectRectDistance(a: Extract<ContactShape, { kind: "rect" }>, b: Extract<ContactShape, { kind: "rect" }>): number { const aCorners = rectCorners(a); const bCorners = rectCorners(b); const aEdges = closedSegments(aCorners); const bEdges = closedSegments(bCorners); if (aEdges.some((left) => bEdges.some((right) => segmentsIntersect(left, right, true))) || pointInOrientedRect(aCorners[0], b) || pointInOrientedRect(bCorners[0], a)) return 0; return Math.min(...aEdges.flatMap((left) => bEdges.map((right) => segmentDistance(left, right)))); }
function rectCorners(rect: Extract<ContactShape, { kind: "rect" }>): Point[] { return [{ xMm: -rect.halfWidthMm, yMm: -rect.halfHeightMm }, { xMm: rect.halfWidthMm, yMm: -rect.halfHeightMm }, { xMm: rect.halfWidthMm, yMm: rect.halfHeightMm }, { xMm: -rect.halfWidthMm, yMm: rect.halfHeightMm }].map((point) => { const rotated = rotate(point, rect.rotationDeg); return { xMm: rect.centre.xMm + rotated.xMm, yMm: rect.centre.yMm + rotated.yMm }; }); }
function pointInOrientedRect(point: Point, rect: Extract<ContactShape, { kind: "rect" }>): boolean { const local = toRectLocal(point, rect); return pointInsideAxisRect(local, rect.halfWidthMm, rect.halfHeightMm); }
function pointInsideAxisRect(point: Point, halfWidthMm: number, halfHeightMm: number): boolean { return Math.abs(point.xMm) <= halfWidthMm + 1e-9 && Math.abs(point.yMm) <= halfHeightMm + 1e-9; }
function toRectLocal(point: Point, rect: Extract<ContactShape, { kind: "rect" }>): Point { return rotate({ xMm: point.xMm - rect.centre.xMm, yMm: point.yMm - rect.centre.yMm }, -rect.rotationDeg); }
function axisRect(halfWidthMm: number, halfHeightMm: number): Segment[] { return closedSegments([{ xMm: -halfWidthMm, yMm: -halfHeightMm }, { xMm: halfWidthMm, yMm: -halfHeightMm }, { xMm: halfWidthMm, yMm: halfHeightMm }, { xMm: -halfWidthMm, yMm: halfHeightMm }]); }
function closedSegments(points: Point[]): Segment[] { return points.map((point, index) => ({ a: point, b: points[(index + 1) % points.length] })); }
function vectorAt(degrees: number, lengthMm: number): Point { const radians = degrees * Math.PI / 180; return { xMm: Math.cos(radians) * lengthMm, yMm: Math.sin(radians) * lengthMm }; }
function rotate(point: Point, degrees: number): Point { const radians = degrees * Math.PI / 180; return { xMm: point.xMm * Math.cos(radians) - point.yMm * Math.sin(radians), yMm: point.xMm * Math.sin(radians) + point.yMm * Math.cos(radians) }; }
function copperDistance(a: CopperItem, b: CopperItem): number { if (a.at && b.at) return distance(a.at, b.at); if (a.at) return Math.min(...b.segments.map((segment) => pointSegmentDistance(a.at as Point, segment))); if (b.at) return Math.min(...a.segments.map((segment) => pointSegmentDistance(b.at as Point, segment))); return Math.min(...a.segments.flatMap((left) => b.segments.map((right) => segmentDistance(left, right)))); }
function edgeViolation(item: CopperItem, outline: Point[], clearanceMm: number): boolean { const edges = outlineSegments(outline); const required = item.radiusMm + clearanceMm; if (item.at) return !pointInPolygon(item.at, outline) || Math.min(...edges.map((edge) => pointSegmentDistance(item.at as Point, edge))) < required - 1e-9; return item.segments.some((segment) => !pointInPolygon(segment.a, outline) || !pointInPolygon(segment.b, outline) || edges.some((edge) => segmentsIntersect(segment, edge, false)) || Math.min(...edges.map((edge) => segmentDistance(segment, edge))) < required - 1e-9); }
function closestPadPair(leftIds: string[], rightIds: string[], pads: Array<ContactCopperItem & { at: Point }>) { return leftIds.flatMap((leftId) => rightIds.map((rightId) => { const from = pads.find((pad) => pad.id === leftId) as ContactCopperItem & { at: Point }; const to = pads.find((pad) => pad.id === rightId) as ContactCopperItem & { at: Point }; return { from, to, lengthMm: distance(from.at, to.at) }; })); }
function outlineSegments(outline: Point[]): Segment[] { return outline.slice(1).map((point, index) => ({ a: outline[index], b: point })); }
function segmentDistance(a: Segment, b: Segment): number { if (segmentsIntersect(a, b, true)) return 0; return Math.min(pointSegmentDistance(a.a, b), pointSegmentDistance(a.b, b), pointSegmentDistance(b.a, a), pointSegmentDistance(b.b, a)); }
function segmentsIntersect(a: Segment, b: Segment, includeTouch: boolean): boolean { const o1 = orientation(a.a, a.b, b.a); const o2 = orientation(a.a, a.b, b.b); const o3 = orientation(b.a, b.b, a.a); const o4 = orientation(b.a, b.b, a.b); if (o1 * o2 < 0 && o3 * o4 < 0) return true; if (!includeTouch) return false; return (Math.abs(o1) < 1e-9 && pointOnSegment(b.a, a)) || (Math.abs(o2) < 1e-9 && pointOnSegment(b.b, a)) || (Math.abs(o3) < 1e-9 && pointOnSegment(a.a, b)) || (Math.abs(o4) < 1e-9 && pointOnSegment(a.b, b)); }
function orientation(a: Point, b: Point, c: Point): number { return (b.xMm - a.xMm) * (c.yMm - a.yMm) - (b.yMm - a.yMm) * (c.xMm - a.xMm); }
function pointOnSegment(point: Point, segment: Segment): boolean { return point.xMm >= Math.min(segment.a.xMm, segment.b.xMm) - 1e-9 && point.xMm <= Math.max(segment.a.xMm, segment.b.xMm) + 1e-9 && point.yMm >= Math.min(segment.a.yMm, segment.b.yMm) - 1e-9 && point.yMm <= Math.max(segment.a.yMm, segment.b.yMm) + 1e-9; }
function pointSegmentDistance(point: Point, segment: Segment): number { const dx = segment.b.xMm - segment.a.xMm; const dy = segment.b.yMm - segment.a.yMm; const squared = dx * dx + dy * dy; if (!squared) return distance(point, segment.a); const t = Math.max(0, Math.min(1, ((point.xMm - segment.a.xMm) * dx + (point.yMm - segment.a.yMm) * dy) / squared)); return distance(point, { xMm: segment.a.xMm + t * dx, yMm: segment.a.yMm + t * dy }); }
function layersOverlap(a: CopperLayer[], b: CopperLayer[]): boolean { return a.some((layer) => b.includes(layer)); }
function samePoint(a: Point, b: Point): boolean { return distance(a, b) < 1e-9; }
function distance(a: Point, b: Point): number { return Math.hypot(a.xMm - b.xMm, a.yMm - b.yMm); }
function finitePoint(point: Point): boolean { return Number.isFinite(point.xMm) && Number.isFinite(point.yMm); }
function polygonArea(points: Point[]): number { return points.slice(1).reduce((sum, point, index) => sum + points[index].xMm * point.yMm - point.xMm * points[index].yMm, 0) / 2; }
function pointInPolygon(point: Point, polygon: Point[]): boolean { let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const a = polygon[i]; const b = polygon[j]; if (((a.yMm > point.yMm) !== (b.yMm > point.yMm)) && point.xMm < (b.xMm - a.xMm) * (point.yMm - a.yMm) / (b.yMm - a.yMm) + a.xMm) inside = !inside; } return inside; }
function diag(code: string, message: string, ids: string[]): Diagnostic { return { code, severity: "error", message, ids: [...ids].sort() }; }
function uniqueDiagnostics(items: Diagnostic[]): Diagnostic[] { const seen = new Set<string>(); return items.filter((item) => { const key = `${item.code}:${item.ids.join()}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
