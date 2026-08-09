import { useState, type FormEvent } from "react";
import type { CopperLayer, EdaCommand, EdaDocument, Point } from "../../lib/eda";
import { allocateEdaUiId } from "./edaUiIds";

interface AuthoringPanelProps {
  view: "schematic" | "pcb";
  document: EdaDocument;
  activeLayer: CopperLayer;
  cursor: Point;
  dispatchGroup: (commands: EdaCommand[], status: string) => boolean;
}

function number(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Coordinates and dimensions must be finite numbers.");
  return parsed;
}

function parsePoints(value: string): Point[] {
  const points = value.split(";").map((pair) => pair.trim()).filter(Boolean).map((pair) => {
    const [x, y, extra] = pair.split(",").map((item) => item.trim());
    if (!x || !y || extra) throw new Error("Use semicolon-separated X,Y coordinate pairs.");
    return { xMm: number(x), yMm: number(y) };
  });
  if (!points.length) throw new Error("At least one coordinate pair is required.");
  return points;
}

export function EdaAuthoringPanel({ view, document, activeLayer, cursor, dispatchGroup }: AuthoringPanelProps) {
  const [kind, setKind] = useState(view === "schematic" ? "wire" : "track");
  const [error, setError] = useState("");
  const [cursorField, setCursorField] = useState("position");
  const nets = document.nets.map((net) => net.name);
  const schematicKinds = ["wire", "junction", "label", "no-connect"];
  const pcbKinds = ["outline", "track", "via"];
  const available = view === "schematic" ? schematicKinds : pcbKinds;
  const activeKind = available.includes(kind) ? kind : available[0];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      if (activeKind === "wire") {
        const from = { xMm: number(data.get("fromX")), yMm: number(data.get("fromY")) };
        const to = { xMm: number(data.get("toX")), yMm: number(data.get("toY")) };
        const existingIds = document.schematic.wires.map((wire) => wire.id);
        const firstId = allocateEdaUiId("wire", existingIds);
        const secondId = allocateEdaUiId("wire", [...existingIds, firstId]);
        const commands: EdaCommand[] = from.xMm !== to.xMm && from.yMm !== to.yMm
          ? [
              { type: "schematic.add", collection: "wires", value: { id: firstId, from, to: { xMm: to.xMm, yMm: from.yMm } } } as EdaCommand,
              { type: "schematic.add", collection: "wires", value: { id: secondId, from: { xMm: to.xMm, yMm: from.yMm }, to } } as EdaCommand
            ]
          : [{ type: "schematic.add", collection: "wires", value: { id: firstId, from, to } } as EdaCommand];
        dispatchGroup(commands, `Orthogonal wire path added from ${from.xMm},${from.yMm} mm to ${to.xMm},${to.yMm} mm.`);
      } else if (activeKind === "junction") {
        const at = { xMm: number(data.get("x")), yMm: number(data.get("y")) };
        dispatchGroup([{ type: "schematic.add", collection: "junctions", value: { id: allocateEdaUiId("junction", document.schematic.junctions.map((item) => item.id)), at } } as EdaCommand], "Junction added at the entered position.");
      } else if (activeKind === "label") {
        const at = { xMm: number(data.get("x")), yMm: number(data.get("y")) };
        const text = String(data.get("label") ?? "").trim();
        if (!text) throw new Error("Net label text is required.");
        dispatchGroup([{ type: "schematic.add", collection: "netLabels", value: { id: allocateEdaUiId("label", document.schematic.netLabels.map((item) => item.id)), text, at } } as EdaCommand], `Net label ${text} added.`);
      } else if (activeKind === "no-connect") {
        const value = String(data.get("pin") ?? "");
        const [symbolId, pinId] = value.split("|");
        if (!symbolId || !pinId) throw new Error("Choose a schematic pin.");
        dispatchGroup([{ type: "schematic.add", collection: "noConnects", value: { id: allocateEdaUiId("no-connect", document.schematic.noConnects.map((item) => item.id)), symbolId, pinId } } as EdaCommand], "No-connect marker added to the chosen pin.");
      } else if (activeKind === "outline") {
        const outline = parsePoints(String(data.get("points") ?? ""));
        dispatchGroup([{ type: "pcb.setOutline", outline }], `Board outline updated with ${outline.length} vertices.`);
      } else if (activeKind === "track") {
        const points = parsePoints(String(data.get("points") ?? ""));
        const net = String(data.get("net") ?? "");
        if (!net) throw new Error("Choose a declared net before adding a track.");
        const layer = String(data.get("layer") ?? activeLayer) as CopperLayer;
        const widthMm = number(data.get("width"));
        dispatchGroup([{ type: "pcb.add", collection: "tracks", value: { id: allocateEdaUiId("track", document.pcb.tracks.map((item) => item.id)), net, layer, widthMm, points } } as EdaCommand], `Track added to ${net} on ${layer}.`);
      } else if (activeKind === "via") {
        const net = String(data.get("net") ?? "");
        if (!net) throw new Error("Choose a declared net before adding a via.");
        dispatchGroup([{ type: "pcb.add", collection: "vias", value: { id: allocateEdaUiId("via", document.pcb.vias.map((item) => item.id)), net, at: { xMm: number(data.get("x")), yMm: number(data.get("y")) }, diameterMm: number(data.get("diameter")), drillMm: number(data.get("drill")) } } as EdaCommand], `Via added to ${net}.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The geometry could not be added.");
    }
  };

  return <section className="eda-authoring" aria-labelledby="eda-authoring-heading"><div className="eda-panel-heading"><h3 id="eda-authoring-heading">Geometry authoring</h3><span className="badge info">Cursor {cursor.xMm.toFixed(1)}, {cursor.yMm.toFixed(1)} mm</span></div><div className="eda-authoring-tabs" role="tablist" aria-label={`${view} geometry tools`}>{available.map((item) => <button type="button" role="tab" aria-selected={activeKind === item} key={item} onClick={() => setKind(item)}>{item}</button>)}</div><form onSubmit={submit}>
    {activeKind === "wire" && <div className="eda-coordinate-grid"><NumberField name="fromX" label="Wire start X (mm)" defaultValue={cursor.xMm} /><NumberField name="fromY" label="Wire start Y (mm)" defaultValue={cursor.yMm} /><NumberField name="toX" label="Wire end X (mm)" defaultValue={cursor.xMm + 10} /><NumberField name="toY" label="Wire end Y (mm)" defaultValue={cursor.yMm} /></div>}
    {(activeKind === "junction" || activeKind === "label" || activeKind === "via") && <div className="eda-coordinate-grid"><NumberField name="x" label={`${activeKind} X (mm)`} defaultValue={cursor.xMm} /><NumberField name="y" label={`${activeKind} Y (mm)`} defaultValue={cursor.yMm} /></div>}
    {activeKind === "label" && <label>Net label text<input name="label" defaultValue="SIGNAL" /></label>}
    {activeKind === "no-connect" && <label>Schematic pin<select name="pin" defaultValue=""><option value="">Choose pin</option>{document.schematic.symbols.flatMap((symbol) => symbol.pins.map((pin) => <option key={pin.id} value={`${symbol.id}|${pin.id}`}>{symbol.reference}.{pin.number} {pin.name}</option>))}</select></label>}
    {activeKind === "outline" && <label>Outline vertices (X,Y; X,Y)<textarea name="points" rows={3} defaultValue="0,0; 60,0; 60,40; 0,40; 0,0" /></label>}
    {activeKind === "track" && <><label>Track vertices (X,Y; X,Y)<textarea name="points" rows={3} defaultValue="10,10; 20,10; 30,20" /></label><div className="eda-coordinate-grid"><label>Track net<select name="net" defaultValue={nets[0] ?? ""}><option value="">Choose net</option>{nets.map((net) => <option key={net}>{net}</option>)}</select></label><label>Track layer<select name="layer" defaultValue={activeLayer}><option>F.Cu</option><option>B.Cu</option></select></label><NumberField name="width" label="Track width (mm)" defaultValue={0.4} /></div></>}
    {activeKind === "via" && <div className="eda-coordinate-grid"><label>Via net<select name="net" defaultValue={nets[0] ?? ""}><option value="">Choose net</option>{nets.map((net) => <option key={net}>{net}</option>)}</select></label><NumberField name="diameter" label="Via diameter (mm)" defaultValue={0.8} /><NumberField name="drill" label="Via drill (mm)" defaultValue={0.4} /></div>}
    <div className="eda-authoring-actions"><label>Cursor target<select value={cursorField} onChange={(event) => setCursorField(event.target.value)}><option value="position">Position/start</option><option value="end">End</option><option value="vertex">Append vertex</option></select></label><button type="button" onClick={(event) => { const form = event.currentTarget.form; if (!form) return; const points = form.elements.namedItem("points"); if (cursorField === "vertex" && points instanceof HTMLTextAreaElement) { points.value = `${points.value.trim().replace(/;?$/, ";")} ${cursor.xMm},${cursor.yMm}`; return; } const x = form.elements.namedItem(cursorField === "end" ? "toX" : "x") ?? form.elements.namedItem("fromX"); const y = form.elements.namedItem(cursorField === "end" ? "toY" : "y") ?? form.elements.namedItem("fromY"); if (x instanceof HTMLInputElement) x.value = String(cursor.xMm); if (y instanceof HTMLInputElement) y.value = String(cursor.yMm); }}>Use cursor</button><button type="submit" className="primary">Add {activeKind}</button></div>
    {error && <p className="inline-message inline-message--error" role="alert">{error}</p>}
  </form></section>;
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return <label>{label}<input type="number" name={name} step="0.1" defaultValue={defaultValue} /></label>;
}
