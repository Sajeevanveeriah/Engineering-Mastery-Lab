import { useEffect, useMemo, useState, type CSSProperties, type ChangeEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  EDA_EXTERNAL_VERIFICATION_STATE,
  OFFLINE_PALETTE,
  annotateSchematic,
  buildConnectivityGraph,
  buildCopperConnectivity,
  buildRatsnest,
  canonicalEdaJson,
  createControlledNgspiceResult,
  createEdaHistory,
  createEmptyEdaDocument,
  createLedBoardFixture,
  createPaletteFootprint,
  createPaletteSymbol,
  createVoltageDividerFixture,
  dispatchEdaCommandGroup,
  generateBom,
  generatePickAndPlace,
  generateSchematicNetlist,
  redoEdaCommand,
  reopenEdaDocument,
  runDrc,
  runErc,
  undoEdaCommand,
  type CopperLayer,
  type Diagnostic,
  type EdaCommand,
  type EdaDocument,
  type EdaHistory,
  type Footprint,
  type Junction,
  type NetLabel,
  type NoConnect,
  type PaletteKind,
  type Point,
  type SchematicSymbol,
  type Track,
  type Via,
  type Wire
} from "../lib/eda";
import { Icon } from "../components/Icon";
import { EdaAuthoringPanel } from "../components/eda/EdaAuthoringPanel";
import { allocateEdaReference, allocateEdaUiId } from "../components/eda/edaUiIds";
import { EdaKicadPanel } from "../components/eda/EdaKicadPanel";
import { DiagnosticTable, SimulationResults } from "../components/eda/EdaResults";
import { PcbCanvas, SchematicCanvas } from "../components/eda/EdaCanvas";
import "../styles/eda.css";

type EditorView = "schematic" | "pcb";
type ResultView = "erc" | "drc" | "simulation" | "fabrication" | "kicad";
const STORAGE_KEY = "engineering-mastery-lab/eda/studio-v1";
const DECLARED_NETS = ["VCC", "GND", "VOUT", "LED_A", "SIGNAL"];

function createAuthoringDocument(): EdaDocument {
  const document = createEmptyEdaDocument("eda-project-v1", "Untitled EDA project");
  document.nets = DECLARED_NETS.map((name) => ({ id: `net:${name}`, name }));
  document.provenance = [{ id: "provenance:user:1", source: "user", detail: "Created in the local EDA Studio" }];
  return document;
}

function outputResult<T>(producer: () => T): { data?: T; error?: string } {
  try { return { data: producer() }; } catch (error) { return { error: error instanceof Error ? error.message : "Output generation failed." }; }
}

export function EdaStudioPage() {
  const [history, setHistory] = useState(() => createEdaHistory(createVoltageDividerFixture()));
  const [view, setView] = useState<EditorView>("schematic");
  const [resultsView, setResultsView] = useState<ResultView>("erc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ xMm: 0, yMm: 0 });
  const [cursor, setCursor] = useState<Point>({ xMm: 10, yMm: 10 });
  const [gridMm, setGridMm] = useState(2.5);
  const [leftWidth, setLeftWidth] = useState(218);
  const [rightWidth, setRightWidth] = useState(292);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [highlightedNet, setHighlightedNet] = useState("");
  const [pcbVisibility, setPcbVisibility] = useState({ pads: true, vias: true, tracks: true, ratsnest: true });
  const [message, setMessage] = useState("Voltage divider example loaded.");
  const document = history.present.document;
  const session = history.present.session;
  const erc = useMemo(() => runErc(document), [document]);
  const drc = useMemo(() => runDrc(document), [document]);
  const connectivity = useMemo(() => buildConnectivityGraph(document), [document]);
  const copperConnectivity = useMemo(() => buildCopperConnectivity(document), [document]);
  const ratsnest = useMemo(() => buildRatsnest(document), [document]);
  const simulation = useMemo(() => createControlledNgspiceResult(), []);
  const outputs = useMemo(() => ({ bom: outputResult(() => generateBom(document)), pick: outputResult(() => generatePickAndPlace(document)), netlist: outputResult(() => generateSchematicNetlist(document)) }), [document]);
  const selectedSymbol = document.schematic.symbols.find((item) => selectedIds.includes(item.id));
  const selectedFootprint = document.pcb.footprints.find((item) => selectedIds.includes(item.id));
  const selectedWire = document.schematic.wires.find((item) => selectedIds.includes(item.id));
  const selectedJunction = document.schematic.junctions.find((item) => selectedIds.includes(item.id));
  const selectedLabel = document.schematic.netLabels.find((item) => selectedIds.includes(item.id));
  const selectedNoConnect = document.schematic.noConnects.find((item) => selectedIds.includes(item.id));
  const selectedTrack = document.pcb.tracks.find((item) => selectedIds.includes(item.id));
  const selectedVia = document.pcb.vias.find((item) => selectedIds.includes(item.id));

  const dispatchGroup = (commands: EdaCommand[], status: string): boolean => {
    try {
      setHistory(dispatchEdaCommandGroup(history, commands));
      setMessage(status);
      return true;
    } catch (error) {
      setMessage(`Change held: ${error instanceof Error ? error.message : "unknown validation error"}`);
      return false;
    }
  };
  const dispatch = (command: EdaCommand, status: string) => dispatchGroup([command], status);
  const loadDocument = (next: EdaDocument, status: string) => { try { setHistory(createEdaHistory(next)); setSelectedIds([]); setMessage(status); } catch (error) { setMessage(`Load held: ${error instanceof Error ? error.message : "invalid document"}`); } };
  const select = (id: string, extend: boolean) => setSelectedIds((current) => extend ? (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) : [id]);

  const placeSymbol = (kind: PaletteKind) => {
    const prefix = OFFLINE_PALETTE[kind].referencePrefix;
    const reference = allocateEdaReference(prefix, document.schematic.symbols.map((item) => item.reference));
    const id = allocateEdaUiId(`ui-${kind}`, document.schematic.symbols.map((item) => item.id));
    const symbol = createPaletteSymbol(kind, id, cursor, reference);
    const footprint = createPaletteFootprint(kind, symbol, { xMm: cursor.xMm, yMm: cursor.yMm });
    if (dispatchGroup([
      { type: "schematic.add", collection: "symbols", value: symbol } as EdaCommand,
      { type: "pcb.add", collection: "footprints", value: footprint } as EdaCommand
    ], `${kind} ${reference} and its linked footprint were placed atomically.`)) setSelectedIds([id]);
  };

  const updateSymbol = (changes: Partial<SchematicSymbol>, status: string) => {
    if (!selectedSymbol) return;
    if (changes.reference !== undefined && selectedSymbol.footprintId) {
      const footprint = document.pcb.footprints.find((item) => item.id === selectedSymbol.footprintId);
      const commands: EdaCommand[] = [{ type: "schematic.update", collection: "symbols", id: selectedSymbol.id, changes } as EdaCommand];
      if (footprint) commands.push({ type: "pcb.update", collection: "footprints", id: footprint.id, changes: { reference: changes.reference } } as EdaCommand);
      dispatchGroup(commands, status);
    } else dispatch({ type: "schematic.update", collection: "symbols", id: selectedSymbol.id, changes } as EdaCommand, status);
  };
  const updateFootprint = (changes: Partial<Footprint>, status: string) => { if (selectedFootprint) dispatch({ type: "pcb.update", collection: "footprints", id: selectedFootprint.id, changes } as EdaCommand, status); };

  const transformSelection = (dx: number, dy: number, rotate: boolean) => {
    const commands: EdaCommand[] = [];
    for (const id of selectedIds) {
      const symbol = document.schematic.symbols.find((item) => item.id === id);
      const footprint = document.pcb.footprints.find((item) => item.id === id);
      if (symbol) commands.push({ type: "schematic.transformSymbol", id, at: snapPoint({ xMm: symbol.at.xMm + dx, yMm: symbol.at.yMm + dy }, gridMm), rotationDeg: (rotate ? (symbol.rotationDeg + 90) % 360 : symbol.rotationDeg) as SchematicSymbol["rotationDeg"] });
      if (footprint) commands.push({ type: "pcb.transformFootprint", id, at: snapPoint({ xMm: footprint.at.xMm + dx, yMm: footprint.at.yMm + dy }, gridMm), rotationDeg: (rotate ? (footprint.rotationDeg + 45) % 360 : footprint.rotationDeg) as Footprint["rotationDeg"], side: footprint.side });
    }
    if (commands.length) dispatchGroup(commands, rotate ? "Selection rotated with child pin and pad geometry." : "Selection moved with child pin and pad geometry.");
  };

  const deleteSelection = () => {
    const ids = new Set(selectedIds); const commands: EdaCommand[] = [];
    for (const symbol of document.schematic.symbols) if (ids.has(symbol.id) || symbol.footprintId && ids.has(symbol.footprintId)) {
      commands.push(...document.schematic.noConnects.filter((item) => item.symbolId === symbol.id).map((item) => ({ type: "schematic.remove", collection: "noConnects", id: item.id } as EdaCommand)));
      commands.push({ type: "schematic.remove", collection: "symbols", id: symbol.id } as EdaCommand);
      if (symbol.footprintId && document.pcb.footprints.some((item) => item.id === symbol.footprintId)) commands.push({ type: "pcb.remove", collection: "footprints", id: symbol.footprintId } as EdaCommand);
      ids.delete(symbol.id); if (symbol.footprintId) ids.delete(symbol.footprintId);
    }
    const removals: Array<{ id: string; collection: "wires" | "junctions" | "netLabels" | "noConnects" }> = [
      ...document.schematic.wires.map((item) => ({ id: item.id, collection: "wires" as const })),
      ...document.schematic.junctions.map((item) => ({ id: item.id, collection: "junctions" as const })),
      ...document.schematic.netLabels.map((item) => ({ id: item.id, collection: "netLabels" as const })),
      ...document.schematic.noConnects.map((item) => ({ id: item.id, collection: "noConnects" as const }))
    ];
    for (const { id, collection } of removals) if (ids.has(id)) commands.push({ type: "schematic.remove", collection, id } as EdaCommand);
    for (const track of document.pcb.tracks) if (ids.has(track.id)) commands.push({ type: "pcb.remove", collection: "tracks", id: track.id } as EdaCommand);
    for (const via of document.pcb.vias) if (ids.has(via.id)) commands.push({ type: "pcb.remove", collection: "vias", id: via.id } as EdaCommand);
    if (commands.length && dispatchGroup(commands, "Selection and linked entities deleted atomically.")) setSelectedIds([]);
  };

  const annotate = () => {
    const next = annotateSchematic(document); const commands: EdaCommand[] = [];
    for (const symbol of next.schematic.symbols) { const prior = document.schematic.symbols.find((item) => item.id === symbol.id); if (prior?.reference !== symbol.reference) { commands.push({ type: "schematic.update", collection: "symbols", id: symbol.id, changes: { reference: symbol.reference } } as EdaCommand); if (symbol.footprintId) commands.push({ type: "pcb.update", collection: "footprints", id: symbol.footprintId, changes: { reference: symbol.reference } } as EdaCommand); } }
    if (commands.length) dispatchGroup(commands, "Schematic references annotated atomically."); else setMessage("All schematic references are already annotated.");
  };

  const introduceErcIssue = () => {
    for (const symbol of document.schematic.symbols) for (const pin of symbol.pins) {
      const key = `${symbol.id}:${pin.id}`; const net = connectivity.nets.find((item) => item.pinKeys.includes(key));
      if (net && net.pinKeys.length > 1 && !document.schematic.noConnects.some((item) => item.symbolId === symbol.id && item.pinId === pin.id)) {
        dispatch({ type: "schematic.add", collection: "noConnects", value: { id: allocateEdaUiId("erc-issue", document.schematic.noConnects.map((item) => item.id)), symbolId: symbol.id, pinId: pin.id } } as EdaCommand, `Deliberate connected no-connect ERC issue added to ${symbol.reference}.${pin.number}.`); setResultsView("erc"); setBottomOpen(true); return;
      }
    }
    setMessage("No connected pin is available for the deliberate ERC issue. Add a connected circuit first.");
  };
  const repairErc = () => {
    const commands: EdaCommand[] = [];
    for (const finding of erc) if (finding.code === "ERC_CONNECTED_NO_CONNECT") for (const item of document.schematic.noConnects.filter((nc) => finding.ids.includes(nc.symbolId) && finding.ids.includes(nc.pinId))) commands.push({ type: "schematic.remove", collection: "noConnects", id: item.id } as EdaCommand);
    if (commands.length) dispatchGroup(commands, "Current-document ERC finding repaired and check rerun."); else navigateToFinding(erc[0], "ERC");
  };
  const introduceDrcIssue = () => {
    const track = document.pcb.tracks[0];
    if (!track) { setMessage("Add a track before introducing the deliberate track-width DRC issue."); return; }
    dispatch({ type: "pcb.setRules", rules: { ...document.pcb.rules, minTrackWidthMm: track.widthMm + 0.5 } }, `Deliberate DRC issue introduced by raising minimum track width above ${track.widthMm} mm.`); setResultsView("drc"); setBottomOpen(true);
  };
  const repairDrc = () => {
    const commands: EdaCommand[] = [];
    if (drc.some((item) => item.code === "DRC_TRACK_WIDTH")) commands.push({ type: "pcb.setRules", rules: { ...document.pcb.rules, minTrackWidthMm: Math.min(...document.pcb.tracks.map((item) => item.widthMm)) } });
    if (drc.some((item) => item.code === "DRC_VIA_SIZE")) for (const via of document.pcb.vias) commands.push({ type: "pcb.update", collection: "vias", id: via.id, changes: { diameterMm: Math.max(via.diameterMm, document.pcb.rules.minViaDiameterMm), drillMm: Math.min(Math.max(via.drillMm, document.pcb.rules.minViaDrillMm), Math.max(via.diameterMm, document.pcb.rules.minViaDiameterMm) / 2) } } as EdaCommand);
    if (commands.length) dispatchGroup(commands, "Current-document DRC finding repaired and check rerun."); else navigateToFinding(drc[0], "DRC");
  };
  const navigateToFinding = (finding: Diagnostic | undefined, scope: string) => { if (!finding) { setMessage(`${scope} has no current findings.`); return; } setSelectedIds(finding.ids); setMessage(`${scope} finding ${finding.code} selected for manual repair; the current document was not replaced.`); };

  const save = () => { try { localStorage.setItem(STORAGE_KEY, canonicalEdaJson(document)); setMessage("EDA document saved in this browser profile."); } catch (error) { setMessage(`Save held: ${error instanceof Error ? error.message : "browser storage failed"}`); } };
  const reopen = () => { const stored = localStorage.getItem(STORAGE_KEY); if (!stored) { setMessage("No saved EDA document is available in this browser profile."); return; } try { loadDocument(reopenEdaDocument(stored), "Saved EDA document reopened."); } catch (error) { setMessage(`Reopen held: ${error instanceof Error ? error.message : "invalid saved document"}`); } };
  const downloadJson = () => { try { const blob = new Blob([canonicalEdaJson(document)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `${document.id}.eml.json`; anchor.click(); URL.revokeObjectURL(url); setMessage("EML JSON download prepared locally."); } catch (error) { setMessage(`Download held: ${error instanceof Error ? error.message : "JSON generation failed"}`); } };
  const importJson = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { if (file.size > 5_000_000) throw new Error("EML JSON exceeds the 5 MB import limit."); loadDocument(reopenEdaDocument(await file.text()), `Imported ${file.name} into the current browser session.`); } catch (error) { setMessage(`Import held: ${error instanceof Error ? error.message : "invalid EML JSON"}`); } };
  const undo = () => { setHistory((current) => undoEdaCommand(current)); setMessage("Undo applied."); };
  const redo = () => { setHistory((current) => redoEdaCommand(current)); setMessage("Redo applied."); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { const target = event.target as HTMLElement; const editing = target.matches("input, select, textarea"); if (event.altKey && event.key.toLowerCase() === "k") { event.preventDefault(); event.stopPropagation(); setCommandOpen(true); return; } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; } if (editing) return; if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); deleteSelection(); } else if (event.key.toLowerCase() === "r") transformSelection(0, 0, true); else if (event.key.toLowerCase() === "f") { setZoom(1); setPan({ xMm: 0, yMm: 0 }); setMessage("View fitted."); } else if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(2, value + 0.1)); else if (event.key === "-") setZoom((value) => Math.max(0.5, value - 0.1)); };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  });

  const commands = [{ label: "Start empty EDA project", run: () => loadDocument(createAuthoringDocument(), "Empty EDA project started.") }, { label: "Open schematic editor", run: () => setView("schematic") }, { label: "Open PCB editor", run: () => setView("pcb") }, { label: "Fit editor view", run: () => { setZoom(1); setPan({ xMm: 0, yMm: 0 }); } }, { label: "Save EDA document", run: save }, { label: "Reopen saved document", run: reopen }, { label: "Run ERC", run: () => { setResultsView("erc"); setBottomOpen(true); } }, { label: "Run DRC", run: () => { setResultsView("drc"); setBottomOpen(true); } }].filter((item) => item.label.toLowerCase().includes(commandQuery.toLowerCase()));
  const shellStyle = { "--eda-left": leftOpen ? `${leftWidth}px` : "46px", "--eda-right": rightOpen ? `${rightWidth}px` : "46px" } as CSSProperties;

  return <section className="page eda-page" aria-labelledby="eda-title"><header className="eda-header"><div><p className="eyebrow">Local electronics workflow</p><h1 id="eda-title">Engineering Design Studio</h1></div><div className="button-row"><button type="button" onClick={save}><Icon name="save" size={17} /> Save</button><button type="button" onClick={reopen}><Icon name="refresh" size={17} /> Reopen</button><button type="button" onClick={downloadJson}><Icon name="download" size={17} /> EML JSON</button><label className="btn eda-import">Import EML JSON<input className="sr-only" type="file" accept="application/json,.json" onChange={importJson} /></label><button type="button" onClick={() => setCommandOpen(true)} aria-keyshortcuts="Alt+K">Commands <kbd>Alt K</kbd></button></div></header>
    <div className="eda-status" role="status" aria-live="polite"><span>{message}</span><span>{zoom.toFixed(1)}x | grid {gridMm} mm | cursor {cursor.xMm},{cursor.yMm} mm | {selectedIds.length} selected</span></div>
    <div className="eda-toolbar" role="toolbar" aria-label="EDA editor toolbar"><div className="eda-view-tabs" role="tablist" aria-label="Editor"><button type="button" role="tab" aria-selected={view === "schematic"} onClick={() => setView("schematic")}>Schematic</button><button type="button" role="tab" aria-selected={view === "pcb"} onClick={() => setView("pcb")}>PCB</button></div><button type="button" onClick={undo} disabled={!history.past.length}>Undo</button><button type="button" onClick={redo} disabled={!history.future.length}>Redo</button><button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))} aria-label="Zoom out">-</button><button type="button" onClick={() => setZoom((value) => Math.min(2, value + 0.1))} aria-label="Zoom in">+</button><button type="button" onClick={() => { setZoom(1); setPan({ xMm: 0, yMm: 0 }); }}>Fit</button><button type="button" onClick={() => setPan((point) => ({ ...point, xMm: point.xMm - 5 }))}>Pan left</button><button type="button" onClick={() => setPan((point) => ({ ...point, xMm: point.xMm + 5 }))}>Pan right</button><label>Snap grid <select value={gridMm} onChange={(event) => setGridMm(Number(event.target.value))}><option value="1">1 mm</option><option value="2.5">2.5 mm</option><option value="5">5 mm</option></select></label><button type="button" onClick={() => transformSelection(gridMm, 0, false)} disabled={!selectedSymbol && !selectedFootprint}>Move +X</button><button type="button" onClick={() => transformSelection(0, 0, true)} disabled={!selectedSymbol && !selectedFootprint}>Rotate</button><button type="button" onClick={deleteSelection} disabled={!selectedIds.length}>Delete</button></div>
    <div className="eda-shell" style={shellStyle}><aside className={leftOpen ? "eda-panel eda-palette" : "eda-panel is-collapsed"} aria-labelledby="eda-palette-heading"><div className="eda-panel-heading"><h2 id="eda-palette-heading">Palette</h2><button type="button" className="icon-button" onClick={() => setLeftOpen((value) => !value)}>{leftOpen ? "<" : ">"}</button></div>{leftOpen && <><label className="eda-resizer">Palette width <input type="range" min="180" max="320" value={leftWidth} onChange={(event) => setLeftWidth(Number(event.target.value))} /></label><button type="button" onClick={() => loadDocument(createAuthoringDocument(), "Empty EDA project started.")}>Start empty</button><div className="eda-palette-list">{(Object.keys(OFFLINE_PALETTE) as PaletteKind[]).map((kind) => <button type="button" key={kind} onClick={() => placeSymbol(kind)}><span>{kind}</span><small>{OFFLINE_PALETTE[kind].defaultValue}</small></button>)}</div><hr /><h3>Examples</h3><button type="button" onClick={() => loadDocument(createVoltageDividerFixture(), "Voltage divider example loaded.")}>Voltage divider</button><button type="button" onClick={() => loadDocument(createLedBoardFixture(), "LED board example loaded.")}>LED board</button></>}</aside>
      <section className="eda-workspace" aria-label={`${view} workspace`}><div className="eda-workspace-actions">{view === "schematic" ? <><button type="button" onClick={annotate}>Annotate</button><button type="button" onClick={introduceErcIssue}>Introduce ERC issue</button></> : <><button type="button" onClick={introduceDrcIssue}>Introduce DRC issue</button>{Object.entries(pcbVisibility).map(([key, visible]) => <label key={key}><input type="checkbox" checked={visible} onChange={(event) => setPcbVisibility((current) => ({ ...current, [key]: event.target.checked }))} /> {key}</label>)}</>}</div><EdaAuthoringPanel view={view} document={document} activeLayer={session.activeCopperLayer} cursor={cursor} dispatchGroup={dispatchGroup} />{view === "schematic" ? <SchematicCanvas document={document} selectedIds={selectedIds} zoom={zoom} pan={pan} gridMm={gridMm} onSelect={select} onPoint={setCursor} /> : <PcbCanvas document={document} selectedIds={selectedIds} zoom={zoom} pan={pan} gridMm={gridMm} visibleLayers={session.visible} highlightedNet={highlightedNet} ratsnest={ratsnest} visibility={pcbVisibility} onSelect={select} onPoint={setCursor} />}</section>
      <aside className={rightOpen ? "eda-panel eda-properties" : "eda-panel is-collapsed"} aria-labelledby="eda-properties-heading"><div className="eda-panel-heading"><button type="button" className="icon-button" onClick={() => setRightOpen((value) => !value)}>{rightOpen ? ">" : "<"}</button><h2 id="eda-properties-heading">Properties</h2></div>{rightOpen && <><label className="eda-resizer">Properties width <input type="range" min="220" max="420" value={rightWidth} onChange={(event) => setRightWidth(Number(event.target.value))} /></label>{view === "schematic" ? <SchematicProperties symbol={selectedSymbol} wire={selectedWire} junction={selectedJunction} label={selectedLabel} noConnect={selectedNoConnect} document={document} updateSymbol={updateSymbol} dispatch={dispatch} /> : <PcbProperties footprint={selectedFootprint} track={selectedTrack} via={selectedVia} updateFootprint={updateFootprint} document={document} dispatch={dispatch} session={session} />}
        <section aria-labelledby="nets-heading"><h3 id="nets-heading">Nets</h3><label>Highlight net<select value={highlightedNet} onChange={(event) => setHighlightedNet(event.target.value)}><option value="">None</option>{document.nets.map((net) => <option key={net.id}>{net.name}</option>)}</select></label><ul className="eda-net-list">{connectivity.nets.map((net) => <li key={net.name}><button type="button" onClick={() => setHighlightedNet(net.name)}>{net.name}<span>{net.pinKeys.length} pins</span></button></li>)}</ul><p className="muted small">{ratsnest.length} unrouted ratsnest edge{ratsnest.length === 1 ? "" : "s"}; {copperConnectivity.length} copper component{copperConnectivity.length === 1 ? "" : "s"}.</p></section></>}</aside></div>
    <section className={bottomOpen ? "eda-results" : "eda-results is-collapsed"} aria-labelledby="eda-results-heading"><div className="eda-panel-heading"><h2 id="eda-results-heading">Checks and outputs</h2><button type="button" className="icon-button" onClick={() => setBottomOpen((value) => !value)}>{bottomOpen ? "Collapse" : "Expand"}</button></div>{bottomOpen && <><div className="eda-result-tabs" role="tablist" aria-label="Checks and outputs">{(["erc", "drc", "simulation", "fabrication", "kicad"] as ResultView[]).map((item) => <button type="button" role="tab" key={item} aria-selected={resultsView === item} onClick={() => setResultsView(item)}>{item === "erc" || item === "drc" ? item.toUpperCase() : item === "kicad" ? "KiCad" : item[0].toUpperCase() + item.slice(1)}</button>)}</div><div role="tabpanel" tabIndex={0}>{resultsView === "erc" && <DiagnosticTable title="ERC" diagnostics={erc} onRepair={repairErc} />}{resultsView === "drc" && <DiagnosticTable title="DRC" diagnostics={drc} onRepair={repairDrc} />}{resultsView === "simulation" && <SimulationResults result={simulation} verification={EDA_EXTERNAL_VERIFICATION_STATE} />}{resultsView === "fabrication" && <Fabrication outputs={outputs} />}{resultsView === "kicad" && <EdaKicadPanel document={document} onReplace={loadDocument} />}</div></>}</section>
    <div className="eda-boundary" role="note"><strong>Evidence boundary.</strong> {EDA_EXTERNAL_VERIFICATION_STATE.fixture}; {EDA_EXTERNAL_VERIFICATION_STATE.realTool}. Adapters invoked: {String(EDA_EXTERNAL_VERIFICATION_STATE.adaptersInvoked)}. Browser-profile storage is local to this browser profile, its quota varies by browser and device, and persistence is not guaranteed. EML JSON import is limited to 5 MB. No remote script, arbitrary code or network request is used.</div>
    {commandOpen && <div className="eda-command-backdrop" role="presentation" onMouseDown={() => setCommandOpen(false)}><section className="eda-command-dialog" role="dialog" aria-modal="true" aria-labelledby="eda-command-heading" onMouseDown={(event) => event.stopPropagation()} onKeyDown={(event: ReactKeyboardEvent) => { if (event.key === "Escape") setCommandOpen(false); }}><h2 id="eda-command-heading">Command palette</h2><label>Search commands<input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} /></label><div className="eda-command-list">{commands.map((command) => <button type="button" key={command.label} onClick={() => { command.run(); setCommandOpen(false); setCommandQuery(""); }}>{command.label}</button>)}</div><button type="button" onClick={() => setCommandOpen(false)}>Close</button></section></div>}
  </section>;
}

function SchematicProperties({ symbol, wire, junction, label, noConnect, document, updateSymbol, dispatch }: { symbol?: SchematicSymbol; wire?: Wire; junction?: Junction; label?: NetLabel; noConnect?: NoConnect; document: EdaDocument; updateSymbol: (changes: Partial<SchematicSymbol>, status: string) => void; dispatch: (command: EdaCommand, status: string) => boolean }) {
  const hasSelection = symbol || wire || junction || label || noConnect;
  return <div className="eda-property-grid">{symbol && <><label>Reference<input value={symbol.reference} onChange={(event) => updateSymbol({ reference: event.target.value }, "Reference and linked footprint updated.")} /></label><label>Value<input value={symbol.value} onChange={(event) => updateSymbol({ value: event.target.value }, "Value updated.")} /></label><p className="muted small">Footprint link: {symbol.footprintId ?? "none"}</p></>}{wire && <><h3>Selected wire</h3><NumberEdit label="Wire start X (mm)" value={wire.from.xMm} onChange={(value) => dispatch({ type: "schematic.update", collection: "wires", id: wire.id, changes: { from: { ...wire.from, xMm: value } } } as EdaCommand, "Wire start updated.")} /><NumberEdit label="Wire start Y (mm)" value={wire.from.yMm} onChange={(value) => dispatch({ type: "schematic.update", collection: "wires", id: wire.id, changes: { from: { ...wire.from, yMm: value } } } as EdaCommand, "Wire start updated.")} /><NumberEdit label="Wire end X (mm)" value={wire.to.xMm} onChange={(value) => dispatch({ type: "schematic.update", collection: "wires", id: wire.id, changes: { to: { ...wire.to, xMm: value } } } as EdaCommand, "Wire end updated.")} /><NumberEdit label="Wire end Y (mm)" value={wire.to.yMm} onChange={(value) => dispatch({ type: "schematic.update", collection: "wires", id: wire.id, changes: { to: { ...wire.to, yMm: value } } } as EdaCommand, "Wire end updated.")} /></>}{junction && <><h3>Selected junction</h3><NumberEdit label="Junction X (mm)" value={junction.at.xMm} onChange={(xMm) => dispatch({ type: "schematic.update", collection: "junctions", id: junction.id, changes: { at: { ...junction.at, xMm } } } as EdaCommand, "Junction position updated.")} /><NumberEdit label="Junction Y (mm)" value={junction.at.yMm} onChange={(yMm) => dispatch({ type: "schematic.update", collection: "junctions", id: junction.id, changes: { at: { ...junction.at, yMm } } } as EdaCommand, "Junction position updated.")} /></>}{label && <><h3>Selected net label</h3><label>Net label text<input value={label.text} onChange={(event) => dispatch({ type: "schematic.update", collection: "netLabels", id: label.id, changes: { text: event.target.value } } as EdaCommand, "Net label text updated.")} /></label><NumberEdit label="Net label X (mm)" value={label.at.xMm} onChange={(xMm) => dispatch({ type: "schematic.update", collection: "netLabels", id: label.id, changes: { at: { ...label.at, xMm } } } as EdaCommand, "Net label position updated.")} /><NumberEdit label="Net label Y (mm)" value={label.at.yMm} onChange={(yMm) => dispatch({ type: "schematic.update", collection: "netLabels", id: label.id, changes: { at: { ...label.at, yMm } } } as EdaCommand, "Net label position updated.")} /></>}{noConnect && <><h3>Selected no-connect</h3><label>No-connect pin<select value={`${noConnect.symbolId}|${noConnect.pinId}`} onChange={(event) => { const [symbolId, pinId] = event.target.value.split("|"); dispatch({ type: "schematic.update", collection: "noConnects", id: noConnect.id, changes: { symbolId, pinId } } as EdaCommand, "No-connect target updated."); }}>{document.schematic.symbols.flatMap((item) => item.pins.map((pin) => <option key={pin.id} value={`${item.id}|${pin.id}`}>{item.reference}.{pin.number} {pin.name}</option>))}</select></label></>}{!hasSelection && <p className="muted">Select schematic geometry to edit it.</p>}</div>;
}

function PcbProperties({ footprint, track, via, updateFootprint, document, dispatch, session }: { footprint?: Footprint; track?: Track; via?: Via; updateFootprint: (changes: Partial<Footprint>, status: string) => void; document: EdaDocument; dispatch: (command: EdaCommand, status: string) => boolean; session: EdaHistory["present"]["session"] }) {
  const layers: Array<CopperLayer | "Edge.Cuts" | "Silkscreen"> = ["F.Cu", "B.Cu", "Edge.Cuts", "Silkscreen"];
  return <><div className="eda-property-grid">{footprint && <><p><strong>{footprint.reference}</strong> at {footprint.at.xMm},{footprint.at.yMm} mm</p><label>Side<select value={footprint.side} onChange={(event) => dispatch({ type: "pcb.transformFootprint", id: footprint.id, at: footprint.at, rotationDeg: footprint.rotationDeg, side: event.target.value as Footprint["side"] }, "Footprint side and pad geometry transformed.")}><option value="front">Front</option><option value="back">Back</option></select></label>{footprint.pads.map((pad, index) => <label key={pad.id}>Pad {pad.number} net<select value={pad.net ?? ""} onChange={(event) => updateFootprint({ pads: footprint.pads.map((item, itemIndex) => itemIndex === index ? { ...item, net: event.target.value || undefined } : item) }, `Pad ${pad.number} net updated.`)}><option value="">Unassigned</option>{document.nets.map((net) => <option key={net.id}>{net.name}</option>)}</select></label>)}</>}{track && <><h3>Selected track</h3><label>Track points<textarea value={track.points.map((point) => `${point.xMm},${point.yMm}`).join("; ")} onChange={(event) => { try { const points = event.target.value.split(";").map((pair) => { const [xMm, yMm] = pair.split(",").map(Number); return { xMm, yMm }; }); dispatch({ type: "pcb.update", collection: "tracks", id: track.id, changes: { points } } as EdaCommand, "Track vertices updated."); } catch { return; } }} /></label><NumberEdit label="Track width (mm)" value={track.widthMm} onChange={(widthMm) => dispatch({ type: "pcb.update", collection: "tracks", id: track.id, changes: { widthMm } } as EdaCommand, "Track width updated.")} /></>}{via && <><h3>Selected via</h3><NumberEdit label="Via X (mm)" value={via.at.xMm} onChange={(xMm) => dispatch({ type: "pcb.update", collection: "vias", id: via.id, changes: { at: { ...via.at, xMm } } } as EdaCommand, "Via position updated.")} /><NumberEdit label="Via Y (mm)" value={via.at.yMm} onChange={(yMm) => dispatch({ type: "pcb.update", collection: "vias", id: via.id, changes: { at: { ...via.at, yMm } } } as EdaCommand, "Via position updated.")} /><NumberEdit label="Via diameter (mm)" value={via.diameterMm} onChange={(diameterMm) => dispatch({ type: "pcb.update", collection: "vias", id: via.id, changes: { diameterMm } } as EdaCommand, "Via diameter updated.")} /></>}{!footprint && !track && !via && <p className="muted">Select a footprint, track or via to edit it.</p>}</div><h3>Board outline</h3><form className="eda-property-grid" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); try { const value = new FormData(event.currentTarget).get("outline"); const outline = String(value ?? "").split(";").map((pair) => { const [xMm, yMm] = pair.split(",").map((part) => Number(part.trim())); return { xMm, yMm }; }); dispatch({ type: "pcb.setOutline", outline }, "Board outline vertices updated."); } catch { return; } }}><label>Current outline vertices (X,Y; X,Y)<textarea name="outline" key={document.pcb.outline.map((point) => `${point.xMm},${point.yMm}`).join(";")} defaultValue={document.pcb.outline.map((point) => `${point.xMm},${point.yMm}`).join("; ")} /></label><button type="submit">Apply outline vertices</button></form><h3>Board rules</h3><div className="eda-property-grid"><NumberEdit label="Clearance (mm)" value={document.pcb.rules.clearanceMm} onChange={(clearanceMm) => dispatch({ type: "pcb.setRules", rules: { ...document.pcb.rules, clearanceMm } }, "Clearance rule updated.")} /><NumberEdit label="Minimum track (mm)" value={document.pcb.rules.minTrackWidthMm} onChange={(minTrackWidthMm) => dispatch({ type: "pcb.setRules", rules: { ...document.pcb.rules, minTrackWidthMm } }, "Track rule updated.")} /></div><h3>Layers</h3><div className="eda-layer-list">{layers.map((layer) => <label key={layer}><input type="checkbox" checked={session.visible[layer]} onChange={(event) => dispatch({ type: "session.setLayerVisible", layer, visible: event.target.checked }, `${layer} visibility updated.`)} /> {layer}</label>)}</div><label>Active copper layer<select value={session.activeCopperLayer} onChange={(event) => dispatch({ type: "session.setActiveLayer", layer: event.target.value as CopperLayer }, "Active copper layer updated.")}><option>F.Cu</option><option>B.Cu</option></select></label></>;
}

function NumberEdit({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => unknown }) { return <label>{label}<input type="number" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }

function Fabrication({ outputs }: { outputs: { bom: { data?: ReturnType<typeof generateBom>; error?: string }; pick: { data?: ReturnType<typeof generatePickAndPlace>; error?: string }; netlist: { data?: string; error?: string } } }) {
  const errors = [outputs.bom.error, outputs.pick.error, outputs.netlist.error].filter(Boolean);
  return <section aria-labelledby="fabrication-heading"><div className="eda-result-heading"><div><h3 id="fabrication-heading">Fabrication outputs</h3><p className="muted">Local deterministic previews. {EDA_EXTERNAL_VERIFICATION_STATE.realTool}.</p></div><span className="badge warn">{EDA_EXTERNAL_VERIFICATION_STATE.fixture}</span></div>{errors.length > 0 && <div role="alert" className="inline-message inline-message--error"><strong>Derived outputs held</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="eda-fabrication-grid"><div><h4>Bill of materials</h4><div className="table-scroll"><table><thead><tr><th>Qty</th><th>References</th><th>Value</th></tr></thead><tbody>{outputs.bom.data?.map((item) => <tr key={`${item.libraryId}-${item.value}`}><td>{item.quantity}</td><td>{item.references.join(", ")}</td><td>{item.value}</td></tr>)}</tbody></table></div></div><div><h4>Pick-and-place</h4><div className="table-scroll"><table><thead><tr><th>Ref</th><th>X (mm)</th><th>Y (mm)</th><th>Side</th></tr></thead><tbody>{outputs.pick.data?.map((item) => <tr key={item.reference}><th scope="row">{item.reference}</th><td>{item.xMm.toFixed(2)}</td><td>{item.yMm.toFixed(2)}</td><td>{item.side}</td></tr>)}</tbody></table></div></div></div>{outputs.netlist.data && <details><summary>Schematic netlist preview</summary><pre>{outputs.netlist.data}</pre></details>}</section>;
}

function snapPoint(point: Point, gridMm: number): Point { return { xMm: Math.round(point.xMm / gridMm) * gridMm, yMm: Math.round(point.yMm / gridMm) * gridMm }; }
