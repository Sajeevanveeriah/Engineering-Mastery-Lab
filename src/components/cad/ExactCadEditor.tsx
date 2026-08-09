import { useMemo, useState, type ChangeEvent } from "react";
import type { BrepDocument, BrepFeature, BrepPlane, BrepSketchEntity, Point2, Point3 } from "../../lib/cad/brep";

type AddableFeatureKind = "box" | "cylinder" | "sphere" | "sketch" | "pad" | "pocket" | "revolve" | "boolean";
type SketchEntityKind = BrepSketchEntity["kind"];

interface ExactCadEditorProps {
  document: BrepDocument;
  selectedFeatureId: string;
  busy: boolean;
  onSelectFeature: (id: string) => void;
  onChange: (document: BrepDocument, action: string) => void;
  onRebuild: () => void;
  onSave: () => void;
  onReopen: () => void;
}

function dependencies(feature: BrepFeature): string[] {
  if (feature.kind === "sketch" && feature.support?.kind === "planar-face") return [feature.support.targetId];
  if (feature.kind === "pad" || feature.kind === "extrude" || feature.kind === "revolve") return [feature.sketchId];
  if (feature.kind === "pocket") return [feature.targetId, feature.sketchId];
  if (feature.kind === "boolean") return [feature.targetId, feature.toolId];
  if (feature.kind === "fillet" || feature.kind === "chamfer") return [feature.targetId];
  return [];
}

function isBodyFeature(feature: BrepFeature): boolean {
  return feature.kind !== "sketch" && !feature.suppressed;
}

function reorderReason(document: BrepDocument, featureId: string, direction: -1 | 1): string | null {
  const from = document.features.findIndex((feature) => feature.id === featureId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= document.features.length) return "Feature is already at the document boundary.";
  const features = [...document.features];
  [features[from], features[to]] = [features[to], features[from]];
  const index = new Map(features.map((feature, featureIndex) => [feature.id, featureIndex]));
  for (const feature of features) {
    for (const dependency of dependencies(feature)) {
      if ((index.get(dependency) ?? Number.POSITIVE_INFINITY) >= (index.get(feature.id) ?? -1)) {
        return `Move blocked: ${feature.name} must remain after ${dependency}.`;
      }
    }
  }
  return null;
}

function pointValue(event: ChangeEvent<HTMLInputElement>): number {
  return event.currentTarget.value === "" ? Number.NaN : event.currentTarget.valueAsNumber;
}

function ExactNumber({ label, value, onChange, positive = false, disabled = false }: { label: string; value: number; onChange: (value: number) => void; positive?: boolean; disabled?: boolean }) {
  const invalid = !Number.isFinite(value) || Math.abs(value) > 100_000 || (positive && value <= 0);
  return <label className="form-field"><span>{label}</span><span className="quantity-input"><input type="number" value={Number.isNaN(value) ? "" : value} min={positive ? 0.001 : -100000} max={100000} step="any" aria-invalid={invalid} disabled={disabled} onChange={(event) => onChange(pointValue(event))} /><span>mm</span></span></label>;
}

function updatePoint(point: Point2, index: 0 | 1, value: number): Point2 {
  return index === 0 ? [value, point[1]] : [point[0], value];
}

function updatePoint3(point: Point3, index: 0 | 1 | 2, value: number): Point3 {
  const next: [number, number, number] = [...point];
  next[index] = value;
  return next;
}

function defaultEntity(kind: SketchEntityKind, id: string): BrepSketchEntity {
  if (kind === "line") return { id, kind, start: [0, 0], end: [20, 0] };
  if (kind === "polyline") return { id, kind, points: [[0, 0], [20, 0], [20, 12]], closed: true };
  if (kind === "rectangle") return { id, kind, origin: [0, 0], width: 30, height: 20 };
  if (kind === "circle") return { id, kind, centre: [12, 10], radius: 5 };
  return { id, kind, start: [0, 0], via: [10, 8], end: [20, 0], closed: false };
}

function featureId(document: BrepDocument, kind: string): string {
  let suffix = document.features.length + 1;
  let id = `${kind}-${suffix}`;
  while (document.features.some((feature) => feature.id === id)) id = `${kind}-${++suffix}`;
  return id;
}

function sketchEntityId(sketch: Extract<BrepFeature, { kind: "sketch" }>, kind: SketchEntityKind): string {
  let id = `${sketch.id}-${kind}-${crypto.randomUUID()}`;
  while (sketch.entities.some((entity) => entity.id === id)) id = `${sketch.id}-${kind}-${crypto.randomUUID()}`;
  return id;
}

function createFeature(document: BrepDocument, kind: AddableFeatureKind): BrepFeature | null {
  const id = featureId(document, kind);
  const sketches = document.features.filter((feature): feature is Extract<BrepFeature, { kind: "sketch" }> => feature.kind === "sketch");
  const bodies = document.features.filter(isBodyFeature);
  if (kind === "box") return { id, name: "Box", kind, width: 30, depth: 24, height: 12 };
  if (kind === "cylinder") return { id, name: "Cylinder", kind, radius: 8, height: 20 };
  if (kind === "sphere") return { id, name: "Sphere", kind, radius: 10 };
  if (kind === "sketch") return { id, name: "Sketch", kind, plane: "XY", offset: 0, entities: [defaultEntity("rectangle", `${id}-rectangle`)] };
  const sketchId = sketches.at(-1)?.id;
  if ((kind === "pad" || kind === "pocket" || kind === "revolve") && !sketchId) return null;
  if (kind === "pad") return { id, name: "Pad", kind, sketchId: sketchId as string, length: 10 };
  if (kind === "revolve") return { id, name: "Revolve", kind, sketchId: sketchId as string, axis: [0, 1, 0], origin: [0, 0, 0], angleDegrees: 360 };
  const targetId = bodies.at(-1)?.id;
  if (kind === "pocket") return targetId ? { id, name: "Pocket", kind, targetId, sketchId: sketchId as string, depth: 5 } : null;
  const toolId = bodies.at(-1)?.id;
  const booleanTarget = bodies.at(-2)?.id;
  return toolId && booleanTarget ? { id, name: "Boolean", kind, operation: "union", targetId: booleanTarget, toolId } : null;
}

export function ExactCadEditor({ document, selectedFeatureId, busy, onSelectFeature, onChange, onRebuild, onSave, onReopen }: ExactCadEditorProps) {
  const [addKind, setAddKind] = useState<AddableFeatureKind>("sketch");
  const [entityKind, setEntityKind] = useState<SketchEntityKind>("rectangle");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const selected = document.features.find((feature) => feature.id === selectedFeatureId) ?? document.features[0];
  const sketch = selected?.kind === "sketch" ? selected : null;
  const selectedEntity = sketch?.entities.find((entity) => entity.id === selectedEntityId) ?? sketch?.entities[0];
  const moveUpReason = selected ? reorderReason(document, selected.id, -1) : "No feature selected.";
  const moveDownReason = selected ? reorderReason(document, selected.id, 1) : "No feature selected.";
  const selectedIndex = document.features.findIndex((feature) => feature.id === selected?.id);
  const priorFeatures = useMemo(() => document.features.slice(0, Math.max(0, selectedIndex)), [document.features, selectedIndex]);
  const priorSketches = useMemo(() => priorFeatures.filter((feature): feature is Extract<BrepFeature, { kind: "sketch" }> => feature.kind === "sketch"), [priorFeatures]);
  const priorBodies = useMemo(() => priorFeatures.filter(isBodyFeature), [priorFeatures]);

  const replaceFeature = (next: BrepFeature, action: string) => onChange({ ...document, features: document.features.map((feature) => feature.id === next.id ? next : feature) }, action);
  const replaceEntity = (next: BrepSketchEntity, action: string) => {
    if (!sketch) return;
    replaceFeature({ ...sketch, entities: sketch.entities.map((entity) => entity.id === next.id ? next : entity) }, action);
  };

  const move = (direction: -1 | 1) => {
    if (!selected || reorderReason(document, selected.id, direction)) return;
    const features = [...document.features];
    const from = features.findIndex((feature) => feature.id === selected.id);
    [features[from], features[from + direction]] = [features[from + direction], features[from]];
    onChange({ ...document, features }, `Moved ${selected.name} ${direction < 0 ? "up" : "down"}`);
  };

  return <div className="cad-exact-editor" aria-label="Exact CAD parametric editor">
    <div className="cad-ds-property-group"><h3>Native feature history</h3><div className="cad-ds-import__actions"><select aria-label="Feature type to add" value={addKind} onChange={(event) => setAddKind(event.target.value as AddableFeatureKind)}><option value="box">Box</option><option value="cylinder">Cylinder</option><option value="sphere">Sphere</option><option value="sketch">Sketch</option><option value="pad">Pad</option><option value="pocket">Pocket</option><option value="revolve">Revolve</option><option value="boolean">Boolean</option></select><button className="btn" type="button" onClick={() => { const feature = createFeature(document, addKind); if (!feature) return; onChange({ ...document, features: [...document.features, feature] }, `Added ${feature.kind}`); onSelectFeature(feature.id); }}>Add feature</button><button className="btn" type="button" disabled={Boolean(moveUpReason)} title={moveUpReason ?? "Move feature earlier"} onClick={() => move(-1)}>Move up</button><button className="btn" type="button" disabled={Boolean(moveDownReason)} title={moveDownReason ?? "Move feature later"} onClick={() => move(1)}>Move down</button></div>{moveUpReason && moveDownReason && <p className="muted">Reorder unavailable: {moveUpReason === moveDownReason ? moveUpReason : `${moveUpReason} ${moveDownReason}`}</p>}</div>

    {selected && <div className="cad-ds-property-group"><h3>Selected feature: {selected.name}</h3><label className="form-field"><span>Name</span><input value={selected.name} maxLength={160} onChange={(event) => replaceFeature({ ...selected, name: event.target.value }, "Renamed exact feature")} /></label><label className="cad-toggle"><input type="checkbox" checked={Boolean(selected.suppressed)} onChange={(event) => replaceFeature({ ...selected, suppressed: event.target.checked }, `${event.target.checked ? "Suppressed" : "Unsuppressed"} ${selected.name}`)} /> Suppressed</label>
      {selected.kind === "box" && <div className="form-grid form-grid--2"><ExactNumber label="Width" value={selected.width} positive onChange={(width) => replaceFeature({ ...selected, width }, "Changed box width")} /><ExactNumber label="Depth" value={selected.depth} positive onChange={(depth) => replaceFeature({ ...selected, depth }, "Changed box depth")} /><ExactNumber label="Height" value={selected.height} positive onChange={(height) => replaceFeature({ ...selected, height }, "Changed box height")} /></div>}
      {selected.kind === "cylinder" && <div className="form-grid form-grid--2"><ExactNumber label="Radius" value={selected.radius} positive onChange={(radius) => replaceFeature({ ...selected, radius }, "Changed cylinder radius")} /><ExactNumber label="Height" value={selected.height} positive onChange={(height) => replaceFeature({ ...selected, height }, "Changed cylinder height")} /></div>}
      {selected.kind === "sphere" && <ExactNumber label="Radius" value={selected.radius} positive onChange={(radius) => replaceFeature({ ...selected, radius }, "Changed sphere radius")} />}
      {selected.kind === "sketch" && <><label className="form-field"><span>Plane</span><select value={selected.plane} disabled={selected.support?.kind === "planar-face"} onChange={(event) => replaceFeature({ ...selected, plane: event.target.value as BrepPlane }, "Changed sketch plane")}><option value="XY">XY</option><option value="XZ">XZ</option><option value="YZ">YZ</option></select></label><ExactNumber label="Plane offset" value={selected.offset} disabled={selected.support?.kind === "planar-face"} onChange={(offset) => replaceFeature({ ...selected, offset }, "Changed sketch offset")} /><label className="form-field"><span>Sketch support</span><select value={selected.support?.kind ?? "datum-plane"} onChange={(event) => {
        if (event.target.value === "datum-plane") replaceFeature({ ...selected, support: { kind: "datum-plane" } }, "Changed sketch support to datum plane");
        else if (priorBodies[0]) replaceFeature({ ...selected, plane: "XY", offset: 0, support: { kind: "planar-face", targetId: priorBodies.at(-1)?.id ?? priorBodies[0].id, selector: "top-planar-z" } }, "Changed sketch support to bounded top planar Z face");
      }}><option value="datum-plane">Datum plane</option><option value="planar-face" disabled={priorBodies.length === 0}>Top planar Z face (bounded, no stable face ID)</option></select></label>{selected.support?.kind === "planar-face" && <label className="form-field"><span>Support body feature</span><select value={selected.support.targetId} onChange={(event) => replaceFeature({ ...selected, support: { kind: "planar-face", targetId: event.target.value, selector: "top-planar-z" } }, "Changed bounded planar-face support")}>{priorBodies.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label>}</>}
      {(selected.kind === "pad" || selected.kind === "extrude") && <><label className="form-field"><span>Sketch</span><select value={selected.sketchId} onChange={(event) => replaceFeature({ ...selected, sketchId: event.target.value }, "Changed pad sketch")} >{priorSketches.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label><ExactNumber label="Length" value={selected.length} positive onChange={(length) => replaceFeature({ ...selected, length }, "Changed pad length")} /></>}
      {selected.kind === "pocket" && <><label className="form-field"><span>Target</span><select value={selected.targetId} onChange={(event) => replaceFeature({ ...selected, targetId: event.target.value }, "Changed pocket target")}>{priorBodies.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label><label className="form-field"><span>Sketch</span><select value={selected.sketchId} onChange={(event) => replaceFeature({ ...selected, sketchId: event.target.value }, "Changed pocket sketch")}>{priorSketches.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label><ExactNumber label="Depth" value={selected.depth} positive onChange={(depth) => replaceFeature({ ...selected, depth }, "Changed pocket depth")} /></>}
      {selected.kind === "revolve" && <><label className="form-field"><span>Sketch</span><select value={selected.sketchId} onChange={(event) => replaceFeature({ ...selected, sketchId: event.target.value }, "Changed revolve sketch")}>{priorSketches.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label><div className="form-grid form-grid--2"><ExactNumber label="Axis X" value={selected.axis[0]} onChange={(value) => replaceFeature({ ...selected, axis: updatePoint3(selected.axis, 0, value) }, "Changed revolve axis")} /><ExactNumber label="Axis Y" value={selected.axis[1]} onChange={(value) => replaceFeature({ ...selected, axis: updatePoint3(selected.axis, 1, value) }, "Changed revolve axis")} /><ExactNumber label="Axis Z" value={selected.axis[2]} onChange={(value) => replaceFeature({ ...selected, axis: updatePoint3(selected.axis, 2, value) }, "Changed revolve axis")} /><label className="form-field"><span>Angle</span><span className="quantity-input"><input type="number" min={0.001} max={360} value={selected.angleDegrees} onChange={(event) => replaceFeature({ ...selected, angleDegrees: pointValue(event) }, "Changed revolve angle")} /><span>deg</span></span></label></div></>}
      {selected.kind === "boolean" && <><label className="form-field"><span>Operation</span><select value={selected.operation} onChange={(event) => replaceFeature({ ...selected, operation: event.target.value as "union" | "subtract" | "intersect" }, "Changed boolean operation")}><option value="union">Union</option><option value="subtract">Subtract</option><option value="intersect">Intersect</option></select></label><label className="form-field"><span>Target</span><select value={selected.targetId} onChange={(event) => replaceFeature({ ...selected, targetId: event.target.value }, "Changed boolean target")}>{priorBodies.filter((feature) => feature.id !== selected.toolId).map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label><label className="form-field"><span>Tool</span><select value={selected.toolId} onChange={(event) => replaceFeature({ ...selected, toolId: event.target.value }, "Changed boolean tool")}>{priorBodies.filter((feature) => feature.id !== selected.targetId).map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select></label></>}
      {(selected.kind === "fillet" || selected.kind === "chamfer") && <><ExactNumber label="Radius" value={selected.radius} positive onChange={(radius) => replaceFeature({ ...selected, radius }, `Changed ${selected.kind} radius`)} /><p className="muted">Fillet and chamfer are bounded all-edge fixture operations only. Stable selected-edge identity is not claimed.</p></>}
    </div>}

    {sketch && <div className="cad-ds-property-group"><h3>Sketch entities</h3><div className="cad-ds-import__actions"><select aria-label="Sketch entity type to add" value={entityKind} onChange={(event) => setEntityKind(event.target.value as SketchEntityKind)}><option value="line">Line</option><option value="polyline">Polyline</option><option value="rectangle">Rectangle</option><option value="circle">Circle</option><option value="arc">Arc</option></select><button className="btn" type="button" onClick={() => { const entity = defaultEntity(entityKind, sketchEntityId(sketch, entityKind)); replaceFeature({ ...sketch, entities: [...sketch.entities, entity] }, `Added ${entityKind} entity`); setSelectedEntityId(entity.id); }}>Add entity</button>{selectedEntity && <button className="btn" type="button" onClick={() => { replaceFeature({ ...sketch, entities: sketch.entities.filter((entity) => entity.id !== selectedEntity.id) }, `Deleted ${selectedEntity.kind} entity`); setSelectedEntityId(""); }}>Delete entity</button>}</div><label className="form-field"><span>Entity</span><select aria-label="Selected sketch entity" value={selectedEntity?.id ?? ""} onChange={(event) => setSelectedEntityId(event.target.value)}>{sketch.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.kind}: {entity.id}</option>)}</select></label>
      {selectedEntity && <><label className="cad-toggle"><input type="checkbox" checked={Boolean(selectedEntity.construction)} onChange={(event) => replaceEntity({ ...selectedEntity, construction: event.target.checked }, "Changed construction entity state")} /> Construction geometry</label>
        {selectedEntity.kind === "line" && <div className="form-grid form-grid--2"><ExactNumber label="Start X" value={selectedEntity.start[0]} onChange={(value) => replaceEntity({ ...selectedEntity, start: updatePoint(selectedEntity.start, 0, value) }, "Changed line start")} /><ExactNumber label="Start Y" value={selectedEntity.start[1]} onChange={(value) => replaceEntity({ ...selectedEntity, start: updatePoint(selectedEntity.start, 1, value) }, "Changed line start")} /><ExactNumber label="End X" value={selectedEntity.end[0]} onChange={(value) => replaceEntity({ ...selectedEntity, end: updatePoint(selectedEntity.end, 0, value) }, "Changed line end")} /><ExactNumber label="End Y" value={selectedEntity.end[1]} onChange={(value) => replaceEntity({ ...selectedEntity, end: updatePoint(selectedEntity.end, 1, value) }, "Changed line end")} /></div>}
        {selectedEntity.kind === "rectangle" && <div className="form-grid form-grid--2"><ExactNumber label="Origin X" value={selectedEntity.origin[0]} onChange={(value) => replaceEntity({ ...selectedEntity, origin: updatePoint(selectedEntity.origin, 0, value) }, "Changed rectangle origin")} /><ExactNumber label="Origin Y" value={selectedEntity.origin[1]} onChange={(value) => replaceEntity({ ...selectedEntity, origin: updatePoint(selectedEntity.origin, 1, value) }, "Changed rectangle origin")} /><ExactNumber label="Rectangle width" value={selectedEntity.width} positive onChange={(width) => replaceEntity({ ...selectedEntity, width }, "Changed rectangle width")} /><ExactNumber label="Rectangle height" value={selectedEntity.height} positive onChange={(height) => replaceEntity({ ...selectedEntity, height }, "Changed rectangle height")} /></div>}
        {selectedEntity.kind === "circle" && <div className="form-grid form-grid--2"><ExactNumber label="Centre X" value={selectedEntity.centre[0]} onChange={(value) => replaceEntity({ ...selectedEntity, centre: updatePoint(selectedEntity.centre, 0, value) }, "Changed circle centre")} /><ExactNumber label="Centre Y" value={selectedEntity.centre[1]} onChange={(value) => replaceEntity({ ...selectedEntity, centre: updatePoint(selectedEntity.centre, 1, value) }, "Changed circle centre")} /><ExactNumber label="Circle radius" value={selectedEntity.radius} positive onChange={(radius) => replaceEntity({ ...selectedEntity, radius }, "Changed circle radius")} /></div>}
        {selectedEntity.kind === "polyline" && <><label className="form-field"><span>Points (x,y; x,y)</span><input value={selectedEntity.points.map((point) => point.join(",")).join("; ")} onChange={(event) => { const points = event.target.value.split(";").map((entry) => entry.split(",").map(Number)).filter((point) => point.length === 2 && point.every(Number.isFinite)) as [number, number][]; replaceEntity({ ...selectedEntity, points }, "Changed polyline points"); }} /></label><label className="cad-toggle"><input type="checkbox" checked={selectedEntity.closed} onChange={(event) => replaceEntity({ ...selectedEntity, closed: event.target.checked }, "Changed polyline closure")} /> Closed profile</label></>}
        {selectedEntity.kind === "arc" && <><div className="form-grid form-grid--2"><ExactNumber label="Start X" value={selectedEntity.start[0]} onChange={(value) => replaceEntity({ ...selectedEntity, start: updatePoint(selectedEntity.start, 0, value) }, "Changed arc start")} /><ExactNumber label="Start Y" value={selectedEntity.start[1]} onChange={(value) => replaceEntity({ ...selectedEntity, start: updatePoint(selectedEntity.start, 1, value) }, "Changed arc start")} /><ExactNumber label="Via X" value={selectedEntity.via[0]} onChange={(value) => replaceEntity({ ...selectedEntity, via: updatePoint(selectedEntity.via, 0, value) }, "Changed arc via")} /><ExactNumber label="Via Y" value={selectedEntity.via[1]} onChange={(value) => replaceEntity({ ...selectedEntity, via: updatePoint(selectedEntity.via, 1, value) }, "Changed arc via")} /><ExactNumber label="End X" value={selectedEntity.end[0]} onChange={(value) => replaceEntity({ ...selectedEntity, end: updatePoint(selectedEntity.end, 0, value) }, "Changed arc end")} /><ExactNumber label="End Y" value={selectedEntity.end[1]} onChange={(value) => replaceEntity({ ...selectedEntity, end: updatePoint(selectedEntity.end, 1, value) }, "Changed arc end")} /></div><label className="cad-toggle"><input type="checkbox" checked={selectedEntity.closed} onChange={(event) => replaceEntity({ ...selectedEntity, closed: event.target.checked }, "Changed arc closure")} /> Closed arc profile</label>{!selectedEntity.closed && <p className="muted">Open arc is construction or path geometry, not a bounded solid profile.</p>}</>}
      </>}
    </div>}

    <div className="cad-ds-property-group"><div className="cad-ds-import__actions"><button className="btn primary" type="button" disabled={busy} onClick={onRebuild}>Rebuild exact model</button><button className="btn" type="button" onClick={onSave}>Save exact history</button><button className="btn" type="button" onClick={onReopen}>Reopen exact history</button></div></div>
  </div>;
}
