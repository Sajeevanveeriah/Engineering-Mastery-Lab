import type { CopperLayer, EdaDocument, Point, RatsnestEdge } from "../../lib/eda";

interface EditorCanvasProps {
  document: EdaDocument;
  selectedIds: string[];
  zoom: number;
  pan: Point;
  gridMm: number;
  onSelect: (id: string, extend: boolean) => void;
  onPoint: (point: Point) => void;
}

const toX = (point: Point, zoom: number, pan: Point) => 36 + (point.xMm + pan.xMm) * 8 * zoom;
const toY = (point: Point, zoom: number, pan: Point) => 28 + (point.yMm + pan.yMm) * 8 * zoom;
const fromSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number, zoom: number, pan: Point, gridMm: number): Point => {
  const bounds = svg.getBoundingClientRect();
  const xSvg = (clientX - bounds.left) / bounds.width * 620;
  const ySvg = (clientY - bounds.top) / bounds.height * 400;
  return { xMm: Math.round((((xSvg - 36) / (8 * zoom)) - pan.xMm) / gridMm) * gridMm, yMm: Math.round((((ySvg - 28) / (8 * zoom)) - pan.yMm) / gridMm) * gridMm };
};

function SelectButton({ id, selectedIds, onSelect }: { id: string; selectedIds: string[]; onSelect: EditorCanvasProps["onSelect"] }) {
  const selected = selectedIds.includes(id);
  return <button type="button" className="btn--quiet" aria-pressed={selected} onClick={(event) => onSelect(id, event.shiftKey)}>{selected ? "Selected" : "Select"}</button>;
}

export function SchematicCanvas({ document, selectedIds, zoom, pan, gridMm, onSelect, onPoint }: EditorCanvasProps) {
  return <div className="eda-canvas-stack"><svg className="eda-canvas" viewBox="0 0 620 400" role="img" aria-labelledby="schematic-canvas-title schematic-canvas-desc" onPointerDown={(event) => onPoint(fromSvgPoint(event.currentTarget, event.clientX, event.clientY, zoom, pan, gridMm))}>
    <title id="schematic-canvas-title">Schematic editor</title><desc id="schematic-canvas-desc">{document.schematic.symbols.length} symbols, {document.schematic.wires.length} wires, {document.schematic.junctions.length} junctions and {document.schematic.netLabels.length} labels. Tables after the drawing provide complete text equivalents and keyboard selection.</desc>
    <defs><pattern id="eda-grid" width={Math.max(4, gridMm * 8 * zoom)} height={Math.max(4, gridMm * 8 * zoom)} patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" className="eda-grid-dot" /></pattern></defs><rect data-surface="true" width="620" height="400" fill="url(#eda-grid)" />
    {document.schematic.wires.map((wire) => <line key={wire.id} x1={toX(wire.from, zoom, pan)} y1={toY(wire.from, zoom, pan)} x2={toX(wire.to, zoom, pan)} y2={toY(wire.to, zoom, pan)} className={`eda-wire${selectedIds.includes(wire.id) ? " is-selected" : ""}`} onClick={(event) => onSelect(wire.id, event.shiftKey)} />)}
    {document.schematic.junctions.map((junction) => <circle key={junction.id} cx={toX(junction.at, zoom, pan)} cy={toY(junction.at, zoom, pan)} r={selectedIds.includes(junction.id) ? 7 : 4} className="eda-junction" onClick={(event) => onSelect(junction.id, event.shiftKey)} />)}
    {document.schematic.netLabels.map((label) => <text key={label.id} x={toX(label.at, zoom, pan) + 5} y={toY(label.at, zoom, pan) - 5} className={`eda-net-label${selectedIds.includes(label.id) ? " is-selected" : ""}`} onClick={(event) => onSelect(label.id, event.shiftKey)}>{label.text}</text>)}
    {document.schematic.symbols.map((symbol) => <g key={symbol.id} className={selectedIds.includes(symbol.id) ? "eda-symbol is-selected" : "eda-symbol"} transform={`translate(${toX(symbol.at, zoom, pan)} ${toY(symbol.at, zoom, pan)}) rotate(${symbol.rotationDeg})`} onClick={(event) => onSelect(symbol.id, event.shiftKey)}><rect x="-24" y="-14" width="48" height="28" rx="3" /><text x="0" y="-20" textAnchor="middle">{symbol.reference}</text><text x="0" y="4" textAnchor="middle">{symbol.value}</text>{symbol.pins.map((pin) => <circle key={pin.id} cx={toX(pin.at, zoom, pan) - toX(symbol.at, zoom, pan)} cy={toY(pin.at, zoom, pan) - toY(symbol.at, zoom, pan)} r="3" className="eda-pin" />)}</g>)}
  </svg><div className="table-scroll" aria-label="Schematic drawing text equivalent"><table className="eda-entity-table"><caption>Schematic symbols and pin geometry</caption><thead><tr><th>Select</th><th>Reference</th><th>Value</th><th>Origin (mm)</th><th>Rotation</th><th>Pin positions (mm)</th></tr></thead><tbody>{document.schematic.symbols.map((symbol) => <tr key={symbol.id} className={selectedIds.includes(symbol.id) ? "is-selected" : undefined}><td><SelectButton id={symbol.id} selectedIds={selectedIds} onSelect={onSelect} /></td><th scope="row">{symbol.reference}</th><td>{symbol.value}</td><td>{symbol.at.xMm.toFixed(1)}, {symbol.at.yMm.toFixed(1)}</td><td>{symbol.rotationDeg} deg</td><td>{symbol.pins.map((pin) => `${pin.number}: ${pin.at.xMm.toFixed(1)},${pin.at.yMm.toFixed(1)}`).join("; ")}</td></tr>)}</tbody></table></div>
  <div className="table-scroll"><table className="eda-entity-table"><caption>Wires, junctions, labels and no-connects</caption><thead><tr><th>Select</th><th>Type</th><th>ID</th><th>Geometry or target</th></tr></thead><tbody>{document.schematic.wires.map((wire) => <tr key={wire.id}><td><SelectButton id={wire.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>Wire</td><th scope="row">{wire.id}</th><td>{wire.from.xMm},{wire.from.yMm} to {wire.to.xMm},{wire.to.yMm} mm</td></tr>)}{document.schematic.junctions.map((item) => <tr key={item.id}><td><SelectButton id={item.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>Junction</td><th scope="row">{item.id}</th><td>{item.at.xMm},{item.at.yMm} mm</td></tr>)}{document.schematic.netLabels.map((item) => <tr key={item.id}><td><SelectButton id={item.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>Label</td><th scope="row">{item.text}</th><td>{item.at.xMm},{item.at.yMm} mm</td></tr>)}{document.schematic.noConnects.map((item) => <tr key={item.id}><td><SelectButton id={item.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>No-connect</td><th scope="row">{item.id}</th><td>{item.symbolId}, {item.pinId}</td></tr>)}</tbody></table></div></div>;
}

interface PcbCanvasProps extends EditorCanvasProps {
  visibleLayers: Record<CopperLayer | "Edge.Cuts" | "Silkscreen", boolean>;
  highlightedNet: string;
  ratsnest: RatsnestEdge[];
  visibility: { pads: boolean; vias: boolean; tracks: boolean; ratsnest: boolean };
}

export function PcbCanvas({ document, selectedIds, zoom, pan, gridMm, visibleLayers, highlightedNet, ratsnest, visibility, onSelect, onPoint }: PcbCanvasProps) {
  const visibleTracks = visibility.tracks ? document.pcb.tracks.filter((track) => visibleLayers[track.layer]) : [];
  return <div className="eda-canvas-stack"><svg className="eda-canvas eda-canvas--pcb" viewBox="0 0 620 400" role="img" aria-labelledby="pcb-canvas-title pcb-canvas-desc" onPointerDown={(event) => onPoint(fromSvgPoint(event.currentTarget, event.clientX, event.clientY, zoom, pan, gridMm))}>
    <title id="pcb-canvas-title">PCB editor</title><desc id="pcb-canvas-desc">Board with {document.pcb.footprints.length} footprints, {document.pcb.footprints.flatMap((item) => item.pads).length} pads, {visibleTracks.length} visible tracks, {visibility.vias ? document.pcb.vias.length : 0} visible vias and {visibility.ratsnest ? ratsnest.length : 0} ratsnest edges. Tables after the drawing are complete text equivalents.</desc><defs><pattern id="pcb-grid" width={Math.max(4, gridMm * 8 * zoom)} height={Math.max(4, gridMm * 8 * zoom)} patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" className="eda-grid-dot" /></pattern></defs><rect data-surface="true" width="620" height="400" fill="url(#pcb-grid)" />
    {visibleLayers["Edge.Cuts"] && document.pcb.outline.length > 1 && <polyline points={document.pcb.outline.map((point) => `${toX(point, zoom, pan)},${toY(point, zoom, pan)}`).join(" ")} className="eda-outline" />}
    {visibility.ratsnest && ratsnest.map((edge, index) => <line key={`${edge.net}-${index}`} x1={toX(edge.from, zoom, pan)} y1={toY(edge.from, zoom, pan)} x2={toX(edge.to, zoom, pan)} y2={toY(edge.to, zoom, pan)} className={`eda-ratsnest${highlightedNet === edge.net ? " is-highlighted" : ""}`} />)}
    {visibleTracks.map((track) => <polyline key={track.id} points={track.points.map((point) => `${toX(point, zoom, pan)},${toY(point, zoom, pan)}`).join(" ")} className={`eda-track eda-track--${track.layer === "F.Cu" ? "front" : "back"}${highlightedNet === track.net ? " is-highlighted" : ""}${selectedIds.includes(track.id) ? " is-selected" : ""}`} style={{ strokeWidth: Math.max(2, track.widthMm * 8 * zoom) }} onClick={(event) => onSelect(track.id, event.shiftKey)} />)}
    {visibility.vias && document.pcb.vias.map((via) => <circle key={via.id} cx={toX(via.at, zoom, pan)} cy={toY(via.at, zoom, pan)} r={Math.max(4, via.diameterMm * 4 * zoom)} className={`eda-via${selectedIds.includes(via.id) ? " is-selected" : ""}`} onClick={(event) => onSelect(via.id, event.shiftKey)} />)}
    {document.pcb.footprints.map((footprint) => <g key={footprint.id} className={selectedIds.includes(footprint.id) ? "eda-footprint is-selected" : "eda-footprint"} transform={`translate(${toX(footprint.at, zoom, pan)} ${toY(footprint.at, zoom, pan)}) rotate(${footprint.rotationDeg})`} onClick={(event) => onSelect(footprint.id, event.shiftKey)}><rect x="-18" y="-12" width="36" height="24" rx="2" /><text y="-17" textAnchor="middle">{footprint.reference}</text></g>)}
    {visibility.pads && document.pcb.footprints.flatMap((footprint) => footprint.pads).map((pad) => <rect key={pad.id} x={toX(pad.at, zoom, pan) - 4} y={toY(pad.at, zoom, pan) - 4} width="8" height="8" className={`eda-pad${highlightedNet && pad.net === highlightedNet ? " is-highlighted" : ""}`} />)}
  </svg><div className="table-scroll"><table className="eda-entity-table"><caption>Footprints and pad geometry</caption><thead><tr><th>Select</th><th>Reference</th><th>Side</th><th>Origin (mm)</th><th>Rotation</th><th>Pads and nets</th></tr></thead><tbody>{document.pcb.footprints.map((footprint) => <tr key={footprint.id}><td><SelectButton id={footprint.id} selectedIds={selectedIds} onSelect={onSelect} /></td><th scope="row">{footprint.reference}</th><td>{footprint.side}</td><td>{footprint.at.xMm},{footprint.at.yMm}</td><td>{footprint.rotationDeg} deg</td><td>{footprint.pads.map((pad) => `${pad.number}: ${pad.at.xMm},${pad.at.yMm} mm ${pad.net ?? "unassigned"}`).join("; ")}</td></tr>)}</tbody></table></div>
  <div className="table-scroll"><table className="eda-entity-table"><caption>Tracks, vias and ratsnest</caption><thead><tr><th>Select</th><th>Type</th><th>ID</th><th>Net</th><th>Layer</th><th>Geometry</th></tr></thead><tbody>{document.pcb.tracks.map((track) => <tr key={track.id}><td><SelectButton id={track.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>Track</td><th scope="row">{track.id}</th><td>{track.net}</td><td>{track.layer}</td><td>{track.widthMm} mm; {track.points.map((point) => `${point.xMm},${point.yMm}`).join("; ")}</td></tr>)}{document.pcb.vias.map((via) => <tr key={via.id}><td><SelectButton id={via.id} selectedIds={selectedIds} onSelect={onSelect} /></td><td>Via</td><th scope="row">{via.id}</th><td>{via.net}</td><td>F.Cu/B.Cu</td><td>{via.at.xMm},{via.at.yMm} mm; diameter {via.diameterMm} mm; drill {via.drillMm} mm</td></tr>)}{ratsnest.map((edge, index) => <tr key={`${edge.net}-${index}`}><td>Derived</td><td>Ratsnest</td><th scope="row">{edge.fromId} to {edge.toId}</th><td>{edge.net}</td><td>Derived</td><td>{edge.lengthMm.toFixed(2)} mm</td></tr>)}</tbody></table></div></div>;
}
