import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { CadDrawing } from "../components/CadDrawing";
import { CadViewport, type CadViewName } from "../components/CadViewport";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { engineeringMaterials } from "../data/materials";
import { buildCadObject, disposeCadObject } from "../lib/cad/geometry";
import {
  cadFileStem,
  calculateCadMetrics,
  defaultCadDesign,
  exportCadJson,
  generateCadSvg,
  generateOpenScad,
  importCadJson,
  validateCadDesign,
  type CadDesign,
  type CadPartType
} from "../lib/cad/model";

const CAD_DRAFT_KEY = "engineering-workbench/cad-draft/v1";

const partTypes: Array<{ id: CadPartType; label: string; description: string }> = [
  { id: "plate", label: "Mounting plate", description: "Rounded plate with 0, 2 or 4 mounting holes." },
  { id: "flange", label: "Circular flange", description: "Bore plus configurable bolt-circle pattern." },
  { id: "spacer", label: "Spacer or bushing", description: "Parametric cylindrical sleeve." },
  { id: "angle", label: "Angle bracket", description: "Extruded L-profile for basic brackets and rails." }
];

function loadDraft(): CadDesign {
  try {
    const source = localStorage.getItem(CAD_DRAFT_KEY);
    return source ? importCadJson(source) : structuredClone(defaultCadDesign);
  } catch {
    return structuredClone(defaultCadDesign);
  }
}

function numericValue(event: ChangeEvent<HTMLInputElement>): number {
  return event.currentTarget.value === "" ? Number.NaN : event.currentTarget.valueAsNumber;
}

function downloadBlob(content: BlobPart, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function NumberField({ label, unit, value, onChange, min = 0, step = "any" }: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number | "any";
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <span className="quantity-input">
        <input
          type="number"
          value={Number.isNaN(value) ? "" : value}
          min={min}
          step={step}
          onChange={(event) => onChange(numericValue(event))}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

export function CadStudioPage() {
  const [design, setDesign] = useState<CadDesign>(loadDraft);
  const [activePreview, setActivePreview] = useState<"3d" | "drawing">("3d");
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [view, setView] = useState<CadViewName>("isometric");
  const [viewNonce, setViewNonce] = useState(0);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "neutral"; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const errors = useMemo(() => validateCadDesign(design), [design]);
  const metrics = useMemo(() => errors.length === 0 ? calculateCadMetrics(design) : null, [design, errors.length]);
  const activeMaterial = engineeringMaterials.find((material) => material.id === design.materialId);

  const updatePlate = <K extends keyof CadDesign["plate"]>(key: K, value: CadDesign["plate"][K]) => {
    setDesign((current) => ({ ...current, plate: { ...current.plate, [key]: value } }));
  };
  const updateFlange = <K extends keyof CadDesign["flange"]>(key: K, value: CadDesign["flange"][K]) => {
    setDesign((current) => ({ ...current, flange: { ...current.flange, [key]: value } }));
  };
  const updateSpacer = <K extends keyof CadDesign["spacer"]>(key: K, value: CadDesign["spacer"][K]) => {
    setDesign((current) => ({ ...current, spacer: { ...current.spacer, [key]: value } }));
  };
  const updateAngle = <K extends keyof CadDesign["angle"]>(key: K, value: CadDesign["angle"][K]) => {
    setDesign((current) => ({ ...current, angle: { ...current.angle, [key]: value } }));
  };

  const selectPart = (partType: CadPartType) => {
    const names: Record<CadPartType, string> = {
      plate: "Motor mounting plate",
      flange: "Six-bolt flange",
      spacer: "Shaft spacer",
      angle: "Support angle"
    };
    setDesign((current) => ({ ...current, partType, name: names[partType] }));
    setView("isometric");
    setViewNonce((current) => current + 1);
    setMessage(null);
  };

  const selectMaterial = (materialId: string) => {
    const material = engineeringMaterials.find((item) => item.id === materialId);
    if (!material) return;
    setDesign((current) => ({ ...current, materialId, density: material.density }));
  };

  const chooseView = (nextView: CadViewName) => {
    setView(nextView);
    setViewNonce((current) => current + 1);
  };

  const assertExportable = (): boolean => {
    if (errors.length === 0) return true;
    setMessage({ tone: "error", text: `Resolve design validation first: ${errors[0]}` });
    return false;
  };

  const saveDraft = () => {
    if (!assertExportable()) return;
    try {
      localStorage.setItem(CAD_DRAFT_KEY, exportCadJson(design));
      setMessage({ tone: "success", text: "CAD draft saved in this browser profile." });
    } catch {
      setMessage({ tone: "error", text: "This browser could not save the CAD draft." });
    }
  };

  const exportStl = () => {
    if (!assertExportable()) return;
    const object = buildCadObject(design);
    try {
      const exporter = new STLExporter();
      const output = exporter.parse(object, { binary: true });
      downloadBlob(output, "model/stl", `${cadFileStem(design)}.stl`);
      setMessage({ tone: "success", text: "Binary STL exported. STL does not store units, so import it as millimetres." });
    } finally {
      disposeCadObject(object);
    }
  };

  const importDesign = async (file: File) => {
    try {
      const imported = importCadJson(await file.text());
      setDesign(imported);
      setMessage({ tone: "success", text: `Loaded ${file.name}. Review the preview and dimensions before export.` });
      setViewNonce((current) => current + 1);
    } catch (error) {
      setMessage({ tone: "error", text: `Import failed: ${error instanceof Error ? error.message : "invalid CAD design"}` });
    }
  };

  return (
    <section className="page cad-page">
      <PageHeader
        eyebrow="Parametric mechanical design"
        title="CAD Studio"
        description="Create dimension-driven parts, inspect them in 3D, check mass properties and export geometry for CAD, drawing and 3D-print workflows."
        actions={
          <div className="button-row">
            <button className="btn" type="button" onClick={() => importRef.current?.click()}><Icon name="upload" size={17} /> Import design</button>
            <button className="btn primary" type="button" onClick={saveDraft}><Icon name="save" size={17} /> Save draft</button>
          </div>
        }
      />
      <input
        ref={importRef}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        aria-label="Choose a CAD design JSON file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importDesign(file);
          event.target.value = "";
        }}
      />

      <div className="cad-commandbar" aria-label="CAD workspace controls">
        <div className="cad-commandbar__group" role="group" aria-label="Preview type">
          <button type="button" className={activePreview === "3d" ? "active" : ""} aria-pressed={activePreview === "3d"} onClick={() => setActivePreview("3d")}>3D model</button>
          <button type="button" className={activePreview === "drawing" ? "active" : ""} aria-pressed={activePreview === "drawing"} onClick={() => setActivePreview("drawing")}>Drawing</button>
        </div>
        <div className="cad-commandbar__group" role="group" aria-label="Standard views">
          {(["isometric", "front", "top", "right"] as CadViewName[]).map((name) => (
            <button key={name} type="button" className={view === name ? "active" : ""} aria-pressed={view === name} onClick={() => chooseView(name)}>{name}</button>
          ))}
        </div>
        <label className="cad-toggle"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /> Grid</label>
        <label className="cad-toggle"><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /> Wireframe</label>
      </div>

      <div className="cad-workspace">
        <aside className="cad-model-tree" aria-labelledby="cad-model-tree-heading">
          <div className="cad-pane-heading">
            <span>Model</span>
            <strong id="cad-model-tree-heading">Part templates</strong>
          </div>
          <div className="cad-template-list">
            {partTypes.map((part) => (
              <button key={part.id} type="button" className={design.partType === part.id ? "active" : ""} aria-pressed={design.partType === part.id} onClick={() => selectPart(part.id)}>
                <Icon name={part.id === "plate" || part.id === "angle" ? "cad" : "mechanical"} size={18} />
                <span><strong>{part.label}</strong><small>{part.description}</small></span>
              </button>
            ))}
          </div>
          <div className="cad-feature-tree">
            <p>Feature history</p>
            <ol>
              <li><Icon name="check" size={15} /> Base profile</li>
              <li><Icon name="check" size={15} /> Extrusion</li>
              {(design.partType === "plate" || design.partType === "flange") && <li><Icon name="check" size={15} /> Hole pattern</li>}
              <li><Icon name={errors.length === 0 ? "check" : "alert"} size={15} /> Design validation</li>
            </ol>
          </div>
        </aside>

        <section className="cad-canvas-panel" aria-label="CAD preview">
          <div className="cad-canvas-panel__title">
            <div><strong>{design.name || "Untitled part"}</strong><span>{activeMaterial?.name ?? "Custom material"}</span></div>
            <span className={`status-badge ${errors.length === 0 ? "status-badge--ok" : "status-badge--unavailable"}`}><span />{errors.length === 0 ? "Valid model" : `${errors.length} issue${errors.length === 1 ? "" : "s"}`}</span>
          </div>
          {errors.length > 0 ? (
            <div className="cad-invalid-preview" role="alert">
              <Icon name="alert" size={28} />
              <h2>Model needs attention</h2>
              <p>{errors[0]}</p>
            </div>
          ) : activePreview === "3d" ? (
            <CadViewport design={design} showGrid={showGrid} wireframe={wireframe} view={view} viewNonce={viewNonce} />
          ) : (
            <div className="cad-drawing-panel"><CadDrawing design={design} /></div>
          )}
        </section>

        <aside className="cad-properties" aria-labelledby="cad-properties-heading">
          <div className="cad-pane-heading">
            <span>Properties</span>
            <strong id="cad-properties-heading">Parameters</strong>
          </div>
          <label className="form-field">
            <span>Part name</span>
            <input value={design.name} maxLength={80} onChange={(event) => setDesign((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <div className="cad-property-section">
            <h3>Dimensions</h3>
            {design.partType === "plate" && (
              <div className="form-grid form-grid--2">
                <NumberField label="Width" unit="mm" value={design.plate.width} onChange={(value) => updatePlate("width", value)} />
                <NumberField label="Height" unit="mm" value={design.plate.height} onChange={(value) => updatePlate("height", value)} />
                <NumberField label="Thickness" unit="mm" value={design.plate.thickness} onChange={(value) => updatePlate("thickness", value)} />
                <NumberField label="Corner radius" unit="mm" value={design.plate.cornerRadius} onChange={(value) => updatePlate("cornerRadius", value)} min={0} />
                <label className="form-field">
                  <span>Hole pattern</span>
                  <select value={design.plate.holeCount} onChange={(event) => updatePlate("holeCount", Number(event.target.value) as 0 | 2 | 4)}>
                    <option value={0}>No holes</option><option value={2}>2 holes</option><option value={4}>4 holes</option>
                  </select>
                </label>
                {design.plate.holeCount > 0 && <NumberField label="Hole diameter" unit="mm" value={design.plate.holeDiameter} onChange={(value) => updatePlate("holeDiameter", value)} />}
                {design.plate.holeCount > 0 && <NumberField label="Horizontal edge" unit="mm" value={design.plate.edgeX} onChange={(value) => updatePlate("edgeX", value)} />}
                {design.plate.holeCount === 4 && <NumberField label="Vertical edge" unit="mm" value={design.plate.edgeY} onChange={(value) => updatePlate("edgeY", value)} />}
              </div>
            )}
            {design.partType === "flange" && (
              <div className="form-grid form-grid--2">
                <NumberField label="Outer diameter" unit="mm" value={design.flange.outerDiameter} onChange={(value) => updateFlange("outerDiameter", value)} />
                <NumberField label="Bore diameter" unit="mm" value={design.flange.innerDiameter} onChange={(value) => updateFlange("innerDiameter", value)} />
                <NumberField label="Thickness" unit="mm" value={design.flange.thickness} onChange={(value) => updateFlange("thickness", value)} />
                <NumberField label="Pitch circle" unit="mm" value={design.flange.pitchCircleDiameter} onChange={(value) => updateFlange("pitchCircleDiameter", value)} />
                <NumberField label="Hole count" unit="" value={design.flange.holeCount} onChange={(value) => updateFlange("holeCount", value)} step={1} />
                <NumberField label="Hole diameter" unit="mm" value={design.flange.holeDiameter} onChange={(value) => updateFlange("holeDiameter", value)} />
              </div>
            )}
            {design.partType === "spacer" && (
              <div className="form-grid form-grid--2">
                <NumberField label="Outer diameter" unit="mm" value={design.spacer.outerDiameter} onChange={(value) => updateSpacer("outerDiameter", value)} />
                <NumberField label="Bore diameter" unit="mm" value={design.spacer.innerDiameter} onChange={(value) => updateSpacer("innerDiameter", value)} />
                <NumberField label="Length" unit="mm" value={design.spacer.length} onChange={(value) => updateSpacer("length", value)} />
              </div>
            )}
            {design.partType === "angle" && (
              <div className="form-grid form-grid--2">
                <NumberField label="Extrusion width" unit="mm" value={design.angle.width} onChange={(value) => updateAngle("width", value)} />
                <NumberField label="Leg A" unit="mm" value={design.angle.legA} onChange={(value) => updateAngle("legA", value)} />
                <NumberField label="Leg B" unit="mm" value={design.angle.legB} onChange={(value) => updateAngle("legB", value)} />
                <NumberField label="Thickness" unit="mm" value={design.angle.thickness} onChange={(value) => updateAngle("thickness", value)} />
              </div>
            )}
          </div>
          <div className="cad-property-section">
            <h3>Material and appearance</h3>
            <label className="form-field">
              <span>Material</span>
              <select value={design.materialId} onChange={(event) => selectMaterial(event.target.value)}>
                {engineeringMaterials.map((material) => <option value={material.id} key={material.id}>{material.name}</option>)}
              </select>
            </label>
            <div className="form-grid form-grid--2">
              <NumberField label="Density" unit="kg/m3" value={design.density} onChange={(density) => setDesign((current) => ({ ...current, density }))} />
              <label className="form-field">
                <span>Model colour</span>
                <input type="color" value={design.colour} onChange={(event) => setDesign((current) => ({ ...current, colour: event.target.value }))} />
              </label>
            </div>
          </div>
        </aside>
      </div>

      {errors.length > 0 && (
        <div className="cad-validation-list" role="alert">
          <strong>Validation findings</strong>
          <ul>{errors.map((error) => <li key={error}><Icon name="alert" size={16} /> {error}</li>)}</ul>
        </div>
      )}

      <div className="cad-lower-grid">
        <section className="card cad-metrics" aria-labelledby="cad-metrics-heading">
          <div className="section-heading"><div><p className="eyebrow">Calculated properties</p><h2 id="cad-metrics-heading">Mass and envelope</h2></div></div>
          {metrics ? (
            <dl className="result-metric-grid">
              <div><dt>Profile area</dt><dd>{metrics.profileAreaMm2.toFixed(1)} <span>mm2</span></dd></div>
              <div><dt>Solid volume</dt><dd>{(metrics.volumeMm3 / 1000).toFixed(2)} <span>cm3</span></dd></div>
              <div><dt>Estimated mass</dt><dd>{metrics.massKg.toFixed(4)} <span>kg</span></dd></div>
              <div><dt>Envelope</dt><dd>{metrics.boundingBox.x} x {metrics.boundingBox.y} x {metrics.boundingBox.z} <span>mm</span></dd></div>
            </dl>
          ) : <p className="muted">Resolve validation findings to calculate mass properties.</p>}
        </section>

        <section className="card cad-export" aria-labelledby="cad-export-heading">
          <div className="section-heading"><div><p className="eyebrow">Manufacturing handoff</p><h2 id="cad-export-heading">Export design</h2></div></div>
          <p className="muted">STL carries tessellated geometry only and has no unit metadata. OpenSCAD and JSON preserve the parametric definition. SVG is a drawing preview.</p>
          <div className="cad-export-grid">
            <button className="btn" type="button" onClick={exportStl}><Icon name="download" size={17} /> STL mesh</button>
            <button className="btn" type="button" onClick={() => assertExportable() && downloadBlob(generateOpenScad(design), "text/plain", `${cadFileStem(design)}.scad`)}><Icon name="download" size={17} /> OpenSCAD</button>
            <button className="btn" type="button" onClick={() => assertExportable() && downloadBlob(generateCadSvg(design), "image/svg+xml", `${cadFileStem(design)}-drawing.svg`)}><Icon name="download" size={17} /> Drawing SVG</button>
            <button className="btn" type="button" onClick={() => assertExportable() && downloadBlob(exportCadJson(design), "application/json", `${cadFileStem(design)}.json`)}><Icon name="download" size={17} /> Design JSON</button>
          </div>
        </section>
      </div>

      {message && <div className={`inline-message inline-message--${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}

      <div className="safety-note" role="note">
        <Icon name="alert" size={20} />
        <p><strong>CAD boundary.</strong> This release provides bounded parametric parts, visual inspection and exports. It is not a general B-rep CAD kernel and does not verify tolerances, fits, stress, manufacturability or compliance. Inspect exported geometry in your production CAD/CAM system.</p>
      </div>
    </section>
  );
}
