import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { CadCommandPalette, type CadCommand as PaletteCommand } from "../components/cad/CadCommandPalette";
import { ExactCadEditor } from "../components/cad/ExactCadEditor";
import { CadPanel, CadResizeHandle } from "../components/cad/CadPanel";
import { cacheMeshAsset, clearMeshAssetCache, MeshAssetCacheError, readMeshAsset } from "../components/cad/meshAssetCache";
import { CadDrawing } from "../components/CadDrawing";
import {
  CadViewport,
  type CadProjection,
  type CadViewName,
  type CadViewportMesh
} from "../components/CadViewport";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { engineeringMaterials } from "../data/materials";
import {
  createBrepWorkerClient,
  reconcileBrepOutputBody,
  validateBrepDocument,
  type BrepDocument,
  type BrepEvaluation,
  type BrepImportFormat,
  type BrepMeshPayload,
  type BrepStepImportMetadata,
  type BrepWorkerClient,
  type BrepWorkerResponse
} from "../lib/cad/brep";
import {
  createBooleanFixture,
  createInvalidFilletFixture,
  createRevolveFixture,
  createSketchPadPocketFixture
} from "../lib/cad/brepFixtures";
import {
  createCadHistory,
  executeCadCommand,
  exportCadDocumentJson,
  importCadDocumentJson,
  migrateCadDesignV1,
  redoCadCommand,
  stableCadId,
  undoCadCommand,
  validateCadDocument,
  type CadAsset,
  type CadAssetId,
  type CadBody,
  type CadBodyId,
  type CadDocument,
  type CadFeature,
  type CadFeatureId,
  type CadHistory
} from "../lib/cad/document";
import { buildCadObject, disposeCadObject } from "../lib/cad/geometry";
import type { MeshWorkerRequest, MeshWorkerResponse, MeshWorkerResult } from "../lib/cad/meshImport.worker";
import { DEFAULT_MESH_IMPORT_LIMITS, type StlUnit } from "../lib/cad/meshImport";
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
import "../styles/cadDesignStudio.css";

const CAD_DOCUMENT_KEY = "engineering-workbench/cad-document/v2";
const CAD_TEMPLATE_KEY = "engineering-workbench/cad-template/v1";
const EXACT_DOCUMENT_KEY = "engineering-workbench/cad-exact-document/v1";
const EXACT_IMPORT_MAX_BYTES = 100 * 1024 * 1024;

const partTypes: Array<{ id: CadPartType; label: string }> = [
  { id: "plate", label: "Mounting plate" },
  { id: "flange", label: "Circular flange" },
  { id: "spacer", label: "Spacer or bushing" },
  { id: "angle", label: "Angle bracket" }
];

type ActiveSource = "template" | "mesh" | "exact";
type MessageTone = "success" | "error" | "neutral";
type ImportState =
  | { status: "idle" }
  | { status: "working"; requestId: string; fileName: string; progress: number; stage: string }
  | { status: "error"; code: string; message: string; fileName: string }
  | { status: "cancelled"; fileName: string }
  | { status: "complete"; fileName: string };

interface ImportedReference {
  readonly fileName: string;
  readonly summary: MeshWorkerResult["summary"];
  readonly viewport: CadViewportMesh;
}

interface ExactModel {
  readonly label: string;
  readonly viewport: CadViewportMesh;
  readonly evaluation?: BrepEvaluation;
  readonly importedExchangePreview: boolean;
  readonly stepMetadata?: BrepStepImportMetadata;
}

type ExactJobState =
  | { status: "idle" }
  | { status: "working"; jobId: string; phase: string; ratio: number }
  | { status: "complete"; phase: string }
  | { status: "error"; code: string; message: string };

interface HistoryRow {
  readonly id: number;
  readonly action: string;
  readonly status: "complete" | "undone";
}

function loadInitialState(): { design: CadDesign; document: CadDocument } {
  let design = structuredClone(defaultCadDesign);
  try {
    const template = localStorage.getItem(CAD_TEMPLATE_KEY);
    if (template) design = importCadJson(template);
  } catch {
    design = structuredClone(defaultCadDesign);
  }
  try {
    const source = localStorage.getItem(CAD_DOCUMENT_KEY);
    return { design, document: source ? importCadDocumentJson(source) : migrateCadDesignV1(design) };
  } catch {
    return { design, document: migrateCadDesignV1(design) };
  }
}

function isBrepDocument(value: unknown): value is BrepDocument {
  return validateBrepDocument(value) === null;
}

function parseExactDocument(source: string): BrepDocument {
  const parsed: unknown = JSON.parse(source);
  const validation = validateBrepDocument(parsed);
  if (validation) throw new Error(`${validation.code}: ${validation.message}`);
  return parsed as BrepDocument;
}

function loadExactDocument(): BrepDocument {
  try {
    const source = localStorage.getItem(EXACT_DOCUMENT_KEY);
    if (!source) return createSketchPadPocketFixture();
    return parseExactDocument(source);
  } catch {
    return createSketchPadPocketFixture();
  }
}

function stringifyExactDocument(document: BrepDocument): string {
  const validation = validateBrepDocument(document);
  if (validation) throw new Error(`${validation.code}: ${validation.message}`);
  return JSON.stringify(document, (key, value: unknown) => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(`Exact feature history contains a non-finite number at ${key || "root"}.`);
    }
    return value;
  }, 2);
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
        <input type="number" value={Number.isNaN(value) ? "" : value} min={min} step={step} onChange={(event) => onChange(numericValue(event))} />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function appendMeshReference(document: CadDocument, fileName: string, summary: MeshWorkerResult["summary"]): CadDocument {
  const assetId = stableCadId("asset", summary.sha256) as CadAssetId;
  const featureId = stableCadId("feature", { assetId, sha256: summary.sha256 }) as CadFeatureId;
  const bodyId = stableCadId("body", { featureId, sha256: summary.sha256 }) as CadBodyId;
  const asset: CadAsset = {
    id: assetId,
    name: fileName.slice(0, 80),
    kind: "mesh",
    format: summary.format,
    sha256: summary.sha256,
    byteLength: summary.byteLength,
    referenceOnly: true
  };
  const feature: CadFeature = {
    id: featureId,
    name: `${summary.format.toUpperCase()} mesh reference`.slice(0, 80),
    kind: "mesh-reference",
    dependsOn: [],
    parameters: { unitScale: { value: 1, unit: "ratio" }, triangleCount: { value: summary.triangleCount ?? 0, unit: "count" } },
    bodyIds: [bodyId],
    assetId
  };
  const body: CadBody = {
    id: bodyId,
    name: fileName.slice(0, 80),
    kind: "mesh-reference",
    sourceFeatureId: featureId,
    visible: true,
    referenceOnly: true
  };
  return {
    ...document,
    assets: [...document.assets.filter((item) => item.id !== assetId), asset],
    features: [...document.features.filter((item) => item.assetId !== assetId), feature],
    bodies: [...document.bodies.filter((item) => item.sourceFeatureId !== featureId), body],
    selections: [{ kind: "asset", id: assetId }]
  };
}

function removeMeshReferences(document: CadDocument): CadDocument {
  const meshFeatures = new Set(document.features.filter((feature) => feature.kind === "mesh-reference").map((feature) => feature.id));
  return {
    ...document,
    features: document.features.filter((feature) => feature.kind !== "mesh-reference"),
    bodies: document.bodies.filter((body) => !meshFeatures.has(body.sourceFeatureId)),
    assets: document.assets.filter((asset) => asset.kind !== "mesh"),
    selections: document.selections.filter((selection) => selection.kind !== "asset")
  };
}

function meshScaleFromDocument(document: CadDocument): number {
  const parameter = document.features.find((feature) => feature.kind === "mesh-reference")?.parameters.unitScale;
  return parameter?.unit === "ratio" && Number.isFinite(parameter.value) ? parameter.value : 1;
}

function viewportFromBrep(mesh: BrepMeshPayload, label: string): CadViewportMesh {
  const size = mesh.bounds.max.map((value, index) => value - mesh.bounds.min[index]) as [number, number, number];
  return {
    label,
    scale: 1,
    boundsMm: { min: mesh.bounds.min, max: mesh.bounds.max, size },
    payload: {
      primitive: "triangles",
      indexed: true,
      positions: mesh.positions,
      normals: mesh.normals,
      indices: mesh.indices,
      components: [],
      groups: []
    }
  };
}

function createPrimitiveFixture(): BrepDocument {
  return {
    schemaVersion: 1,
    units: "mm",
    bodies: [],
    features: [
      { id: "primitive-box", name: "Primitive box", kind: "box", width: 32, depth: 24, height: 12 },
      { id: "primitive-cylinder", name: "Primitive cylinder", kind: "cylinder", radius: 8, height: 24 },
      { id: "primitive-union", name: "Primitive union", kind: "boolean", operation: "union", targetId: "primitive-box", toolId: "primitive-cylinder" }
    ]
  };
}

function replaceParametricDocument(document: CadDocument, design: CadDesign): CadDocument {
  const migrated = migrateCadDesignV1(design);
  const meshFeatures = document.features.filter((feature) => feature.kind === "mesh-reference");
  const meshFeatureIds = new Set(meshFeatures.map((feature) => feature.id));
  return {
    ...migrated,
    features: [...migrated.features, ...meshFeatures],
    bodies: [...migrated.bodies, ...document.bodies.filter((body) => meshFeatureIds.has(body.sourceFeatureId))],
    assets: document.assets,
    selections: document.selections
  };
}

export function CadStudioPage() {
  const initial = useMemo(loadInitialState, []);
  const [design, setDesign] = useState<CadDesign>(initial.design);
  const [history, setHistory] = useState<CadHistory>(() => createCadHistory(initial.document));
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([{ id: 1, action: "Opened CAD document", status: "complete" }]);
  const historyIdRef = useRef(2);
  const [activeSource, setActiveSource] = useState<ActiveSource>(initial.document.assets.length > 0 ? "mesh" : "template");
  const [importedMesh, setImportedMesh] = useState<ImportedReference | null>(null);
  const [exactDocument, setExactDocument] = useState<BrepDocument>(loadExactDocument);
  const [selectedExactFeatureId, setSelectedExactFeatureId] = useState(() => loadExactDocument().features[0]?.id ?? "");
  const [exactModel, setExactModel] = useState<ExactModel | null>(null);
  const [exactJob, setExactJob] = useState<ExactJobState>({ status: "idle" });
  const [activePreview, setActivePreview] = useState<"3d" | "drawing">("3d");
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [projection, setProjection] = useState<CadProjection>("perspective");
  const [view, setView] = useState<CadViewName>("isometric");
  const [viewNonce, setViewNonce] = useState(0);
  const [fitNonce, setFitNonce] = useState(0);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurement, setMeasurement] = useState<number | null>(null);
  const [stlUnit, setStlUnit] = useState<StlUnit>("mm");
  const [message, setMessage] = useState<{ tone: MessageTone; text: string } | null>(null);
  const [importState, setImportState] = useState<ImportState>({ status: "idle" });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(248);
  const [rightWidth, setRightWidth] = useState(326);
  const [bottomHeight, setBottomHeight] = useState(214);
  const importRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const completedMeshRequestRef = useRef<string | null>(null);
  const brepClientRef = useRef<BrepWorkerClient | null>(null);
  const activeBrepJobRef = useRef<string | null>(null);

  const errors = useMemo(() => validateCadDesign(design), [design]);
  const metrics = useMemo(() => errors.length === 0 ? calculateCadMetrics(design) : null, [design, errors.length]);
  const activeMaterial = engineeringMaterials.find((material) => material.id === design.materialId);
  const documentValidation = useMemo(() => validateCadDocument(history.present), [history.present]);
  const persistedMeshAssets = history.present.assets;

  const addHistoryRow = useCallback((action: string) => {
    const row: HistoryRow = { id: historyIdRef.current++, action, status: "complete" };
    setHistoryRows((current) => [row, ...current].slice(0, 50));
  }, []);

  const commitDesign = useCallback((label: string, update: (current: CadDesign) => CadDesign) => {
    setDesign((current) => {
      const next = update(current);
      setHistory((currentHistory) => ({
        ...currentHistory,
        present: replaceParametricDocument(currentHistory.present, next),
        undo: [],
        redo: []
      }));
      return next;
    });
    addHistoryRow(label);
  }, [addHistoryRow]);

  const updatePlate = <K extends keyof CadDesign["plate"]>(key: K, value: CadDesign["plate"][K]) => {
    commitDesign(`Changed plate ${key}`, (current) => ({ ...current, plate: { ...current.plate, [key]: value } }));
  };
  const updateFlange = <K extends keyof CadDesign["flange"]>(key: K, value: CadDesign["flange"][K]) => {
    commitDesign(`Changed flange ${key}`, (current) => ({ ...current, flange: { ...current.flange, [key]: value } }));
  };
  const updateSpacer = <K extends keyof CadDesign["spacer"]>(key: K, value: CadDesign["spacer"][K]) => {
    commitDesign(`Changed spacer ${key}`, (current) => ({ ...current, spacer: { ...current.spacer, [key]: value } }));
  };
  const updateAngle = <K extends keyof CadDesign["angle"]>(key: K, value: CadDesign["angle"][K]) => {
    commitDesign(`Changed angle ${key}`, (current) => ({ ...current, angle: { ...current.angle, [key]: value } }));
  };

  const chooseView = useCallback((nextView: CadViewName) => {
    setView(nextView);
    setViewNonce((current) => current + 1);
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.undo.length === 0) return current;
      const next = undoCadCommand(current);
      const scale = meshScaleFromDocument(next.present);
      setImportedMesh((mesh) => mesh ? { ...mesh, viewport: { ...mesh.viewport, scale } } : mesh);
      setHistoryRows((rows) => [{ id: historyIdRef.current++, action: "Undid mesh unit scale", status: "complete" } satisfies HistoryRow, ...rows].slice(0, 50));
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.redo.length === 0) return current;
      const next = redoCadCommand(current);
      const scale = meshScaleFromDocument(next.present);
      setImportedMesh((mesh) => mesh ? { ...mesh, viewport: { ...mesh.viewport, scale } } : mesh);
      setHistoryRows((rows) => [{ id: historyIdRef.current++, action: "Redid mesh unit scale", status: "complete" } satisfies HistoryRow, ...rows].slice(0, 50));
      return next;
    });
  }, []);

  const cancelImport = useCallback(() => {
    const worker = workerRef.current;
    const requestId = activeRequestRef.current;
    if (!requestId) return;
    const fileName = importState.status === "working" ? importState.fileName : "mesh";
    if (worker) {
      const request: MeshWorkerRequest = { type: "cancel", requestId };
      worker.postMessage(request);
      worker.terminate();
    }
    workerRef.current = null;
    activeRequestRef.current = null;
    completedMeshRequestRef.current = null;
    setImportState({ status: "cancelled", fileName });
    setMessage({ tone: "neutral", text: "Mesh import cancelled. The previous model remains active." });
  }, [importState]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    activeRequestRef.current = null;
    completedMeshRequestRef.current = null;
    brepClientRef.current?.dispose();
    brepClientRef.current = null;
    activeBrepJobRef.current = null;
  }, []);

  const importMeshFile = useCallback(async (file: File, options: { rehydrating?: boolean; expectedHash?: string; stlUnit?: StlUnit; scale?: number } = {}) => {
    if (file.size === 0 || file.size > DEFAULT_MESH_IMPORT_LIMITS.maxInputBytes) {
      const code = file.size === 0 ? "EMPTY_FILE" : "FILE_TOO_LARGE";
      const detail = file.size === 0 ? "The mesh file is empty." : "The mesh exceeds the 64 MiB input ceiling.";
      setImportState({ status: "error", code, message: detail, fileName: file.name });
      setMessage({ tone: "error", text: `${detail} It was refused before reading bytes; the previous model remains active.` });
      return;
    }
    workerRef.current?.terminate();
    const requestId = `mesh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeRequestRef.current = requestId;
    completedMeshRequestRef.current = null;
    setImportState({ status: "working", requestId, fileName: file.name, progress: 15, stage: "Reading file" });
    setMessage(null);
    try {
      const data = await file.arrayBuffer();
      if (activeRequestRef.current !== requestId) return;
      setImportState({ status: "working", requestId, fileName: file.name, progress: 35, stage: "Validating mesh" });
      const worker = new Worker(new URL("../lib/cad/meshImport.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = async (event: MessageEvent<MeshWorkerResponse>) => {
        const response = event.data;
        if (response.requestId !== activeRequestRef.current) return;
        worker.terminate();
        workerRef.current = null;
        if (response.type === "cancelled") {
          activeRequestRef.current = null;
          setImportState({ status: "cancelled", fileName: file.name });
          return;
        }
        if (response.type === "error") {
          activeRequestRef.current = null;
          setImportState({ status: "error", code: response.error.code, message: response.error.message, fileName: file.name });
          setMessage({ tone: "error", text: `Import failed (${response.error.code}). The previous model remains active.` });
          return;
        }
        if (options.expectedHash && response.summary.sha256 !== options.expectedHash) {
          activeRequestRef.current = null;
          setImportState({ status: "error", code: "FORMAT_MISMATCH", message: "Cached mesh hash did not match its document reference.", fileName: file.name });
          setMessage({ tone: "error", text: "The browser-profile mesh cache entry failed hash verification. The previous model remains active." });
          return;
        }
        activeRequestRef.current = null;
        completedMeshRequestRef.current = requestId;
        const nextReference: ImportedReference = {
          fileName: file.name,
          summary: response.summary,
          viewport: { payload: response.summary.payload, boundsMm: response.summary.boundsMm, label: file.name, scale: options.scale ?? 1 }
        };
        setImportedMesh(nextReference);
        setActiveSource("mesh");
        setActivePreview("3d");
        if (!options.rehydrating) setHistory((current) => ({
          ...current,
          present: appendMeshReference(removeMeshReferences(current.present), file.name, response.summary),
          undo: [],
          redo: []
        }));
        addHistoryRow(`Imported ${file.name}`);
        setImportState({ status: "complete", fileName: file.name });
        setFitNonce((current) => current + 1);
        setMessage({ tone: "success", text: options.rehydrating
          ? `${file.name} restored from the verified browser-profile asset cache without file reselection.`
          : `${file.name} imported as a reference mesh. The document stores metadata only.` });

        let cacheNotice = "";
        if (!options.rehydrating) {
          try {
            const cacheResult = await cacheMeshAsset({ sha256: response.summary.sha256, name: file.name, format: response.summary.format, sourceUnit: response.summary.sourceUnit, byteLength: file.size, blob: file });
            cacheNotice = cacheResult === "deduplicated" ? " The existing hash-keyed cache entry was reused." : " A bounded browser-profile copy was cached by SHA-256.";
          } catch (error) {
            const detail = error instanceof MeshAssetCacheError ? `${error.code}: ${error.message}` : String(error);
            cacheNotice = ` Browser-profile persistence is unavailable (${detail}).`;
          }
        }
        if (options.rehydrating || completedMeshRequestRef.current !== requestId) return;
        setMessage({ tone: cacheNotice.includes("unavailable") ? "neutral" : "success", text: `${file.name} imported as a reference mesh. The document stores metadata only.${cacheNotice}` });
      };
      worker.onerror = () => {
        if (activeRequestRef.current !== requestId) return;
        worker.terminate();
        workerRef.current = null;
        activeRequestRef.current = null;
        setImportState({ status: "error", code: "WORKER_FAILED", message: "The mesh worker stopped unexpectedly.", fileName: file.name });
        setMessage({ tone: "error", text: "Mesh import worker failed. The previous model remains active." });
      };
      const format = file.name.toLowerCase().endsWith(".3mf") ? "3mf" : "stl";
      const request: MeshWorkerRequest = { type: "import", requestId, data, format, stlUnit: options.stlUnit ?? stlUnit };
      setImportState({ status: "working", requestId, fileName: file.name, progress: 62, stage: "Building transferable render mesh" });
      worker.postMessage(request, [data]);
    } catch (error) {
      activeRequestRef.current = null;
      completedMeshRequestRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
      setImportState({ status: "error", code: "FILE_READ_FAILED", message: error instanceof Error ? error.message : "The file could not be read.", fileName: file.name });
      setMessage({ tone: "error", text: "The selected file could not be read. The previous model remains active." });
    }
  }, [addHistoryRow, stlUnit]);

  useEffect(() => {
    const asset = initial.document.assets[0];
    if (!asset) return;
    let active = true;
    void readMeshAsset(asset.sha256).then((cached) => {
      if (!active || !cached) return;
      const file = new File([cached.blob], cached.name || asset.name, { type: cached.blob.type });
      const cachedUnit = ["mm", "cm", "m", "in"].includes(cached.sourceUnit) ? cached.sourceUnit as StlUnit : "mm";
      void importMeshFile(file, { rehydrating: true, expectedHash: asset.sha256, stlUnit: cachedUnit, scale: meshScaleFromDocument(initial.document) });
    }).catch((error) => {
      if (!active) return;
      setMessage({ tone: "neutral", text: `The browser-profile mesh cache could not be read: ${error instanceof Error ? error.message : String(error)}. Reselect the source file.` });
    });
    return () => { active = false; };
  }, [importMeshFile, initial.document]);

  const importDesignFile = useCallback(async (file: File) => {
    try {
      const source = await file.text();
      const document = importCadDocumentJson(source);
      setHistory(createCadHistory(document));
      setImportedMesh(null);
      setActiveSource(document.assets.length > 0 ? "mesh" : "template");
      addHistoryRow(`Opened ${file.name}`);
      const asset = document.assets[0];
      if (asset) {
        let cached = null;
        try {
          cached = await readMeshAsset(asset.sha256);
        } catch (error) {
          setMessage({ tone: "neutral", text: `CAD v2 metadata reopened, but the browser-profile mesh cache could not be read: ${error instanceof Error ? error.message : String(error)}. Reselect the source file.` });
          return;
        }
        if (cached) {
          const cachedUnit = ["mm", "cm", "m", "in"].includes(cached.sourceUnit) ? cached.sourceUnit as StlUnit : "mm";
          const cachedFile = new File([cached.blob], cached.name || asset.name, { type: cached.blob.type });
          await importMeshFile(cachedFile, { rehydrating: true, expectedHash: asset.sha256, stlUnit: cachedUnit, scale: meshScaleFromDocument(document) });
          return;
        }
      }
      setMessage({
        tone: "success",
        text: document.assets.length > 0
          ? "CAD v2 metadata reopened. Mesh references do not embed source geometry, so reselect the original mesh file to render it."
          : "CAD v2 document reopened."
      });
    } catch (error) {
      setMessage({ tone: "error", text: `Document open failed: ${error instanceof Error ? error.message : "invalid CAD document"}` });
    }
  }, [addHistoryRow, importMeshFile]);

  const getBrepClient = useCallback((): BrepWorkerClient => {
    if (!brepClientRef.current) brepClientRef.current = createBrepWorkerClient();
    return brepClientRef.current;
  }, []);

  const updateExactProgress = useCallback((progress: Extract<BrepWorkerResponse, { kind: "progress" }>) => {
    if (progress.jobId !== activeBrepJobRef.current) return;
    setExactJob({ status: "working", jobId: progress.jobId, phase: progress.phase, ratio: progress.ratio });
  }, []);

  const runExactDocument = useCallback(async (document: BrepDocument, label: string) => {
    const reconciledBeforeRun = reconcileBrepOutputBody(document);
    if (!reconciledBeforeRun.ok) {
      setExactJob({ status: "error", code: reconciledBeforeRun.error.code, message: reconciledBeforeRun.error.message });
      setMessage({ tone: "error", text: `Exact model was not rebuilt: ${reconciledBeforeRun.error.message}` });
      return;
    }
    const runnableDocument = reconciledBeforeRun.document;
    const jobId = `brep-evaluate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeBrepJobRef.current = jobId;
    setExactDocument(runnableDocument);
    setSelectedExactFeatureId((current) => runnableDocument.features.some((feature) => feature.id === current) ? current : runnableDocument.features[0]?.id ?? "");
    setExactJob({ status: "working", jobId, phase: "queued", ratio: 0 });
    setMessage(null);
    try {
      const response = await getBrepClient().run({ kind: "evaluate", jobId, document: runnableDocument }, updateExactProgress);
      if (activeBrepJobRef.current !== jobId) return;
      activeBrepJobRef.current = null;
      if (response.kind === "error") {
        setExactJob({ status: "error", code: response.error.code, message: response.error.message });
        setMessage({ tone: "error", text: `Exact model failed (${response.error.code}): ${response.error.message}` });
        if (!response.error.recoverable) {
          brepClientRef.current?.dispose();
          brepClientRef.current = null;
        }
        return;
      }
      if (response.kind !== "evaluation") throw new Error(`Unexpected B-rep response: ${response.kind}`);
      const result = response.result;
      if (!result.mesh) {
        const error = result.errors[0];
        setExactJob({ status: "error", code: error?.code ?? "FEATURE_FAILED", message: error?.message ?? "Exact model produced no render mesh." });
        return;
      }
      const reconciledAfterRun = reconcileBrepOutputBody(runnableDocument, result);
      if (reconciledAfterRun.ok) setExactDocument(reconciledAfterRun.document);
      setExactModel({ label, viewport: viewportFromBrep(result.mesh, label), evaluation: result, importedExchangePreview: false });
      setActiveSource("exact");
      setActivePreview("3d");
      setExactJob({ status: "complete", phase: result.errors.length > 0 ? "rolled back to last valid body" : "model rebuilt" });
      setFitNonce((current) => current + 1);
      addHistoryRow(`Rebuilt exact model: ${label}`);
      setMessage(result.errors.length > 0
        ? { tone: "error", text: `${label} retained the last valid body. ${result.errors[0].code}: ${result.errors[0].message}` }
        : { tone: "success", text: `${label} rebuilt in the dedicated exact-CAD worker.` });
    } catch (error) {
      if (activeBrepJobRef.current !== jobId) return;
      activeBrepJobRef.current = null;
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      const timeout = error instanceof Error && /timeout|exceeded/i.test(error.message);
      setExactJob({ status: "error", code: cancelled ? "CANCELLED" : timeout ? "TIMEOUT" : "INITIALISATION_FAILED", message: error instanceof Error ? error.message : String(error) });
      setMessage({ tone: cancelled ? "neutral" : "error", text: cancelled ? "Exact-CAD job cancelled. The previous model remains active." : `Exact-CAD worker failed: ${error instanceof Error ? error.message : String(error)}` });
      if (!cancelled) {
        brepClientRef.current?.dispose();
        brepClientRef.current = null;
      }
    }
  }, [addHistoryRow, getBrepClient, updateExactProgress]);

  const cancelExactJob = useCallback(() => {
    const jobId = activeBrepJobRef.current;
    if (!jobId) return;
    getBrepClient().cancel(jobId);
    activeBrepJobRef.current = null;
    setExactJob({ status: "error", code: "CANCELLED", message: "Exact-CAD job cancelled by the user." });
  }, [getBrepClient]);

  const exportExact = useCallback(async (format: "stl-binary" | "step") => {
    const jobId = `brep-export-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeBrepJobRef.current = jobId;
    setExactJob({ status: "working", jobId, phase: "queued", ratio: 0 });
    try {
      const response = await getBrepClient().run({ kind: "export", jobId, document: exactDocument, format }, updateExactProgress);
      if (activeBrepJobRef.current !== jobId) return;
      activeBrepJobRef.current = null;
      if (response.kind !== "export" || !response.result.ok || !response.result.bytes) {
        const error = response.kind === "error" ? response.error : response.kind === "export" ? response.result.error : undefined;
        setExactJob({ status: "error", code: error?.code ?? "EXPORT_FAILED", message: error?.message ?? "Exact export failed." });
        if (error && !error.recoverable) {
          brepClientRef.current?.dispose();
          brepClientRef.current = null;
        }
        return;
      }
      const extension = format === "step" ? "step" : "stl";
      downloadBlob(response.result.bytes, response.result.mediaType ?? "application/octet-stream", `exact-cad-model.${extension}`);
      setExactJob({ status: "complete", phase: `${extension.toUpperCase()} export ready` });
      setMessage({ tone: "success", text: `Exact ${extension.toUpperCase()} export created by the dedicated worker.` });
    } catch (error) {
      if (activeBrepJobRef.current === jobId) activeBrepJobRef.current = null;
      setExactJob({ status: "error", code: error instanceof DOMException && error.name === "AbortError" ? "CANCELLED" : "TIMEOUT", message: error instanceof Error ? error.message : String(error) });
    }
  }, [exactDocument, getBrepClient, updateExactProgress]);

  const importExactFile = useCallback(async (file: File, format: BrepImportFormat) => {
    if (file.size === 0 || file.size > EXACT_IMPORT_MAX_BYTES) {
      const detail = file.size === 0 ? "The exact-CAD exchange file is empty." : "The exact-CAD exchange file exceeds the 100 MiB input ceiling.";
      setExactJob({ status: "error", code: "IMPORT_FAILED", message: detail });
      setMessage({ tone: "error", text: `${detail} It was refused before reading bytes; the previous model remains active.` });
      return;
    }
    const jobId = `brep-import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeBrepJobRef.current = jobId;
    setExactJob({ status: "working", jobId, phase: "reading", ratio: 0.05 });
    try {
      const bytes = await file.arrayBuffer();
      if (activeBrepJobRef.current !== jobId) return;
      const response = await getBrepClient().run({ kind: "import", jobId, format, bytes }, updateExactProgress);
      if (activeBrepJobRef.current !== jobId) return;
      activeBrepJobRef.current = null;
      if (response.kind !== "import") {
        const error = response.kind === "error" ? response.error : undefined;
        setExactJob({ status: "error", code: error?.code ?? "IMPORT_FAILED", message: error?.message ?? "Exact import failed." });
        setMessage({ tone: "error", text: `${format.toUpperCase()} import unavailable (${error?.code ?? "IMPORT_FAILED"}). ${error?.message ?? "No exact model was created."}` });
        if (error && !error.recoverable) {
          brepClientRef.current?.dispose();
          brepClientRef.current = null;
        }
        return;
      }
      if (!response.result.ok) {
        const error = response.result.error;
        setExactJob({ status: "error", code: error.code, message: error.message });
        setMessage({ tone: "error", text: `${format.toUpperCase()} import unavailable (${error.code}). ${error.message}` });
        if (!error.recoverable) {
          brepClientRef.current?.dispose();
          brepClientRef.current = null;
        }
        return;
      }
      const label = `${file.name} STEP tessellated preview`;
      setExactModel({ label, viewport: viewportFromBrep(response.result.mesh, label), importedExchangePreview: true, stepMetadata: response.result.metadata });
      setActiveSource("exact");
      setActivePreview("3d");
      setExactJob({ status: "complete", phase: "STEP tessellated preview imported" });
      setFitNonce((current) => current + 1);
      setMessage({ tone: "neutral", text: response.result.metadata.notice });
    } catch (error) {
      if (activeBrepJobRef.current === jobId) activeBrepJobRef.current = null;
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      setExactJob({ status: "error", code: cancelled ? "CANCELLED" : "TIMEOUT", message: error instanceof Error ? error.message : String(error) });
    }
  }, [getBrepClient, updateExactProgress]);

  const importJsonFile = useCallback(async (file: File) => {
    if (file.size === 0 || file.size > 1_000_000) {
      const code = file.size === 0 ? "EMPTY_FILE" : "FILE_TOO_LARGE";
      const detail = file.size === 0 ? "The CAD JSON file is empty." : "The CAD JSON file exceeds the 1,000,000-byte input ceiling.";
      setMessage({ tone: "error", text: `JSON import failed (${code}): ${detail} It was refused before reading text; the previous model remains active.` });
      return;
    }
    try {
      const source = await file.text();
      const parsed: unknown = JSON.parse(source);
      if (!isBrepDocument(parsed)) {
        await importDesignFile(file);
        return;
      }
      setExactDocument(parsed);
      setSelectedExactFeatureId(parsed.features[0]?.id ?? "");
      await runExactDocument(parsed, file.name.replace(/\.json$/i, "") || "Imported exact feature history");
    } catch (error) {
      setMessage({ tone: "error", text: `JSON import failed: ${error instanceof Error ? error.message : "invalid document"}` });
    }
  }, [importDesignFile, runExactDocument]);

  const importFile = useCallback((file: File) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".json")) void importJsonFile(file);
    else if (lowerName.endsWith(".step") || lowerName.endsWith(".stp")) void importExactFile(file, "step");
    else if (lowerName.endsWith(".iges") || lowerName.endsWith(".igs")) void importExactFile(file, "iges");
    else if (lowerName.endsWith(".brep")) void importExactFile(file, "brep");
    else void importMeshFile(file);
  }, [importExactFile, importJsonFile, importMeshFile]);

  const changeMeshUnit = (nextUnit: StlUnit) => {
    setStlUnit(nextUnit);
    if (!importedMesh || importedMesh.summary.format !== "stl") return;
    const millimetresPerUnit: Record<StlUnit, number> = { mm: 1, cm: 10, m: 1000, in: 25.4 };
    const scale = millimetresPerUnit[nextUnit] / importedMesh.summary.millimetresPerUnit;
    if (Math.abs(scale - importedMesh.viewport.scale) < Number.EPSILON) return;
    setHistory((current) => executeCadCommand(current, {
      label: `Changed STL unit to ${nextUnit}`,
      apply: (document) => ({
        ...document,
        features: document.features.map((feature) => feature.kind === "mesh-reference"
          ? { ...feature, parameters: { ...feature.parameters, unitScale: { value: scale, unit: "ratio" } } }
          : feature)
      })
    }));
    setImportedMesh((current) => current ? { ...current, viewport: { ...current.viewport, scale } } : current);
    addHistoryRow(`Changed STL unit to ${nextUnit}`);
    setFitNonce((current) => current + 1);
  };

  const clearMeshReference = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    activeRequestRef.current = null;
    completedMeshRequestRef.current = null;
    setHistory((current) => ({ ...current, present: removeMeshReferences(current.present), undo: [], redo: [] }));
    setImportedMesh(null);
    setActiveSource("template");
    addHistoryRow("Cleared mesh reference");
    setMessage({ tone: "neutral", text: "Mesh reference cleared from the working document." });
  };

  const clearCachedMeshFiles = async () => {
    try {
      const removedCount = await clearMeshAssetCache();
      setMessage({ tone: "neutral", text: `Cleared ${removedCount} cached mesh file${removedCount === 1 ? "" : "s"} from this browser profile. The current in-memory mesh remains visible; future reopen requires source-file reselection.` });
      addHistoryRow(`Cleared ${removedCount} cached mesh file${removedCount === 1 ? "" : "s"}`);
    } catch (error) {
      setMessage({ tone: "error", text: `Cached mesh files were not cleared: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const assertExportable = (): boolean => {
    if (errors.length === 0) return true;
    setMessage({ tone: "error", text: `Resolve design validation first: ${errors[0]}` });
    return false;
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(CAD_DOCUMENT_KEY, exportCadDocumentJson(history.present));
      localStorage.setItem(CAD_TEMPLATE_KEY, exportCadJson(design));
      setMessage({ tone: "success", text: "Saved CAD v2 metadata locally. Mesh bytes are not embedded in JSON; a verified bounded copy may be restored from this browser profile's hash-keyed asset cache." });
      addHistoryRow("Saved local CAD document");
    } catch {
      setMessage({ tone: "error", text: "This browser could not save the CAD document." });
    }
  };

  const exportStl = () => {
    if (!assertExportable()) return;
    const object = buildCadObject(design);
    try {
      const output = new STLExporter().parse(object, { binary: true });
      downloadBlob(output, "model/stl", `${cadFileStem(design)}.stl`);
      setMessage({ tone: "success", text: "Binary STL exported. STL contains no unit metadata; the template uses millimetres." });
    } finally {
      disposeCadObject(object);
    }
  };

  const selectPart = (partType: CadPartType) => {
    const names: Record<CadPartType, string> = {
      plate: "Motor mounting plate",
      flange: "Six-bolt flange",
      spacer: "Shaft spacer",
      angle: "Support angle"
    };
    commitDesign(`Selected ${partType} template`, (current) => ({ ...current, partType, name: names[partType] }));
    setActiveSource("template");
    setView("isometric");
    setViewNonce((current) => current + 1);
    setMessage(null);
  };

  const commands = useMemo<PaletteCommand[]>(() => [
    { id: "fit", label: "Fit active model", shortcut: "F", run: () => setFitNonce((current) => current + 1) },
    { id: "isometric", label: "Isometric view", shortcut: "1", run: () => chooseView("isometric") },
    { id: "front", label: "Front view", shortcut: "2", run: () => chooseView("front") },
    { id: "top", label: "Top view", shortcut: "3", run: () => chooseView("top") },
    { id: "right", label: "Right view", shortcut: "4", run: () => chooseView("right") },
    { id: "projection", label: "Toggle orthographic projection", shortcut: "O", run: () => setProjection((current) => current === "orthographic" ? "perspective" : "orthographic") },
    { id: "measure", label: "Toggle distance measurement", shortcut: "M", run: () => setMeasureMode((current) => !current) },
    { id: "grid", label: "Toggle grid", shortcut: "G", run: () => setShowGrid((current) => !current) },
    { id: "axes", label: "Toggle axes", shortcut: "A", run: () => setShowAxes((current) => !current) },
    { id: "undo", label: "Undo", shortcut: "Ctrl+Z", run: undo },
    { id: "redo", label: "Redo", shortcut: "Ctrl+Y", run: redo }
  ], [chooseView, redo, undo]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']") === true;
      if (event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
      const command = commands.find((candidate) => candidate.shortcut?.toLowerCase() === event.key.toLowerCase());
      if (command && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        command.run();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [commands, redo, undo]);

  const selectMaterial = (materialId: string) => {
    const material = engineeringMaterials.find((item) => item.id === materialId);
    if (!material) return;
    commitDesign("Changed template material", (current) => ({ ...current, materialId, density: material.density }));
  };

  const activeLabel = activeSource === "mesh"
    ? importedMesh?.fileName ?? persistedMeshAssets[0]?.name ?? "Mesh reference metadata"
    : activeSource === "exact"
      ? exactModel?.label ?? "Exact model"
    : design.name || "Untitled part";
  const activeMesh = activeSource === "mesh"
    ? importedMesh?.viewport ?? null
    : activeSource === "exact"
      ? exactModel?.viewport ?? null
      : null;
  const style = {
    "--cad-left-width": `${leftCollapsed ? 48 : leftWidth}px`,
    "--cad-right-width": `${rightCollapsed ? 48 : rightWidth}px`,
    "--cad-bottom-height": `${bottomCollapsed ? 48 : bottomHeight}px`
  } as CSSProperties;

  return (
    <section className="page cad-page cad-design-studio" style={style}>
      <PageHeader
        title="CAD Studio"
        eyebrow="Engineering Design Studio v1"
        meta={<><span className="cad-ds-chip">Units: mm and rad</span><span className="cad-ds-chip">Local document v2</span><span className="cad-ds-chip">Reference meshes only</span></>}
        actions={<div className="button-row">
          <button className="btn" type="button" onClick={() => importRef.current?.click()}><Icon name="upload" size={17} /> Import</button>
          <button className="btn primary" type="button" onClick={saveDraft}><Icon name="save" size={17} /> Save</button>
        </div>}
      />
      <input ref={importRef} className="sr-only" type="file" accept="application/json,.json,.stl,.3mf,.step,.stp,.iges,.igs,.brep,model/stl,model/3mf" aria-label="Choose a CAD document, STL, 3MF, STEP, IGES or BREP file" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) importFile(file);
        event.target.value = "";
      }} />

      <div className="cad-ds-toolbar" aria-label="CAD workspace controls">
        <div className="cad-ds-toolbar__group" role="group" aria-label="Preview type">
          <button type="button" aria-pressed={activePreview === "3d"} onClick={() => setActivePreview("3d")}>3D</button>
          <button type="button" aria-pressed={activePreview === "drawing"} onClick={() => { setActivePreview("drawing"); setActiveSource("template"); }}>Drawing</button>
        </div>
        <div className="cad-ds-toolbar__group" role="group" aria-label="Standard views">
          {(["isometric", "front", "top", "right"] as CadViewName[]).map((name) => <button key={name} type="button" aria-pressed={view === name} onClick={() => chooseView(name)}>{name}</button>)}
        </div>
        <div className="cad-ds-toolbar__group" role="group" aria-label="View controls">
          <button type="button" onClick={() => setFitNonce((current) => current + 1)}>Fit selection</button>
          <button type="button" onClick={() => setFitNonce((current) => current + 1)}>Fit all</button>
          <button type="button" aria-pressed={projection === "orthographic"} onClick={() => setProjection((current) => current === "orthographic" ? "perspective" : "orthographic")}>{projection}</button>
        </div>
        <div className="cad-ds-toolbar__group">
          <label><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /> Grid</label>
          <label><input type="checkbox" checked={showAxes} onChange={(event) => setShowAxes(event.target.checked)} /> Axes</label>
          <label><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /> Wireframe</label>
          <button type="button" aria-pressed={measureMode} onClick={() => setMeasureMode((current) => !current)}>Measure</button>
        </div>
        <span className="cad-ds-toolbar__spacer" />
        <div className="cad-ds-toolbar__group">
          <button type="button" disabled={history.undo.length === 0} onClick={undo}>Undo</button>
          <button type="button" disabled={history.redo.length === 0} onClick={redo}>Redo</button>
          <button type="button" onClick={() => setPaletteOpen(true)}>Commands <kbd>Alt+K</kbd></button>
        </div>
      </div>

      <div className="cad-ds-shell">
        <CadPanel id="cad-model" title="Model tree" eyebrow="Structure" collapsed={leftCollapsed} onToggle={() => setLeftCollapsed((current) => !current)} className="cad-ds-left">
          <ul className="cad-ds-tree" role="tree" aria-label="CAD document model tree">
            <li role="treeitem" aria-expanded="true" aria-selected={false}>
              <button type="button" onClick={() => setActiveSource("template")}><Icon name="cad" size={16} /><span>{design.name}</span><span className="cad-ds-tree__kind">part</span></button>
              <ul role="group">
                {partTypes.map((part) => <li role="treeitem" aria-selected={activeSource === "template" && design.partType === part.id} key={part.id}><button type="button" onClick={() => selectPart(part.id)}><Icon name="mechanical" size={15} /><span>{part.label}</span></button></li>)}
              </ul>
            </li>
            {(importedMesh || persistedMeshAssets.length > 0) && <li role="treeitem" aria-selected={activeSource === "mesh"}><button type="button" onClick={() => { setActiveSource("mesh"); setActivePreview("3d"); }}><Icon name="file" size={16} /><span>{importedMesh?.fileName ?? persistedMeshAssets[0]?.name}</span><span className="cad-ds-tree__kind">mesh ref</span></button></li>}
            {exactModel && <li role="treeitem" aria-expanded="true" aria-selected={activeSource === "exact" && selectedExactFeatureId === ""}><button type="button" onClick={() => { setActiveSource("exact"); setActivePreview("3d"); }}><Icon name="cad" size={16} /><span>{exactModel.label}</span><span className="cad-ds-tree__kind">exact</span></button><ul role="group">{exactDocument.bodies.map((body) => {
              const result = exactModel.evaluation?.bodies.find((item) => item.id === body.id);
              return <li role="treeitem" aria-selected={false} key={body.id}><button type="button" onClick={() => setActiveSource("exact")}><Icon name={result?.status === "dangling" ? "alert" : "cad"} size={14} /><span>{body.name}</span><span className="cad-ds-tree__kind">body {result?.status ?? (body.visible ? "visible" : "hidden")}</span></button></li>;
            })}{exactDocument.features.map((feature) => {
              const result = exactModel.evaluation?.features.find((item) => item.featureId === feature.id);
              return <li role="treeitem" aria-selected={activeSource === "exact" && selectedExactFeatureId === feature.id} key={feature.id}><button type="button" onClick={() => { setActiveSource("exact"); setSelectedExactFeatureId(feature.id); }}><Icon name={result?.status === "rolled-back" ? "alert" : result?.status === "suppressed" ? "close" : "check"} size={14} /><span>{feature.name}</span><span className="cad-ds-tree__kind">{result?.status ?? feature.kind}</span></button></li>;
            })}</ul></li>}
          </ul>
          <div className="cad-ds-import">
            <strong>Mesh import</strong>
            <label className="form-field"><span>STL source unit</span><select value={stlUnit} onChange={(event) => changeMeshUnit(event.target.value as StlUnit)}><option value="mm">millimetres</option><option value="cm">centimetres</option><option value="m">metres</option><option value="in">inches</option></select></label>
            <div className="cad-ds-import__actions">
              <button className="btn" type="button" onClick={() => importRef.current?.click()}>Choose file</button>
              {importState.status === "working" && activeRequestRef.current && <button className="btn" type="button" onClick={cancelImport}>Cancel</button>}
            </div>
            {importState.status === "working" && <><progress max={100} value={importState.progress} aria-label="Mesh import progress" /><span role="status">{importState.stage}: {importState.progress}%</span></>}
            {importState.status === "error" && <div role="alert"><strong>{importState.code}</strong><br />{importState.message}</div>}
            {importedMesh?.summary.format === "stl" && <div role="note">STL stores no units. Millimetres were assumed unless you selected another source unit. Unit changes are undoable.</div>}
            {importedMesh?.summary.format === "3mf" && <div role="note">3MF source unit: {importedMesh.summary.sourceUnit}. Components: {importedMesh.summary.components.length}. Materials: {importedMesh.summary.materials.length || "none declared"}.</div>}
            {(importedMesh || persistedMeshAssets.length > 0) && <button className="btn" type="button" onClick={clearMeshReference}>Clear mesh reference</button>}
            <button className="btn" type="button" onClick={() => void clearCachedMeshFiles()}>Clear cached mesh files</button>
          </div>
        </CadPanel>

        <CadResizeHandle label="Resize model tree" axis="horizontal" value={leftWidth} min={190} max={420} onChange={setLeftWidth} />

        <section className="cad-ds-viewport-panel" aria-label="CAD viewport">
          <header className="cad-ds-viewport-title">
            <div><strong>{activeLabel}</strong><span>{activeSource === "mesh" ? "Reference mesh, non-editable" : activeSource === "exact" ? exactModel?.importedExchangePreview ? "STEP tessellated preview, units assumed" : "Exact OCCT model" : activeMaterial?.name ?? "Custom material"}</span></div>
            <span className="cad-ds-selection-label"><Icon name="target" size={14} /> Selected: {activeLabel}</span>
          </header>
          {activePreview === "drawing" ? <div className="cad-drawing-panel"><CadDrawing design={design} /></div>
            : activeSource === "mesh" && !activeMesh ? <div className="empty-state"><Icon name="file" size={28} /><h2>Mesh source required</h2><p className="muted">The CAD v2 JSON retains metadata only. This browser profile has no verified cached blob for the referenced SHA-256, so reselect the original STL or 3MF file.</p><button className="btn primary" type="button" onClick={() => importRef.current?.click()}>Reselect mesh file</button></div>
            : errors.length > 0 && activeSource === "template" ? <div className="cad-invalid-preview" role="alert"><Icon name="alert" size={28} /><h2>Model needs attention</h2><p>{errors[0]}</p></div>
              : <CadViewport design={design} mesh={activeMesh} showGrid={showGrid} showAxes={showAxes} wireframe={wireframe} view={view} projection={projection} viewNonce={viewNonce} fitNonce={fitNonce} selected measureMode={measureMode} onMeasure={setMeasurement} />}
          <footer className="cad-ds-statusbar"><span>{projection} | {view} | mm</span><span>{activeSource === "mesh" ? `${importedMesh?.summary.triangleCount ?? 0} triangles` : activeSource === "exact" ? `${(exactModel?.viewport.payload.indices.length ?? 0) / 3} exact-mesh triangles` : metrics ? `${metrics.boundingBox.x} x ${metrics.boundingBox.y} x ${metrics.boundingBox.z} mm` : "Invalid template"}</span></footer>
        </section>

        <CadResizeHandle label="Resize properties panel" axis="horizontal" value={rightWidth} min={260} max={520} reverse onChange={(value) => setRightWidth(value)} />

        <CadPanel id="cad-properties" title="Parameters" eyebrow="Properties and measurement" collapsed={rightCollapsed} onToggle={() => setRightCollapsed((current) => !current)} className="cad-ds-right">
          <div className="cad-ds-property-group">
            <h3>Selected object</h3>
            <div className="cad-ds-selection-label">{activeLabel}</div>
          </div>
          {activeSource === "template" ? <>
            <div className="cad-ds-property-group">
              <h3>Identity</h3>
              <label className="form-field"><span>Part name</span><input value={design.name} maxLength={80} onChange={(event) => commitDesign("Renamed template", (current) => ({ ...current, name: event.target.value }))} /></label>
            </div>
            <div className="cad-ds-property-group"><h3>Dimensions</h3>
              {design.partType === "plate" && <div className="form-grid form-grid--2"><NumberField label="Width" unit="mm" value={design.plate.width} onChange={(value) => updatePlate("width", value)} /><NumberField label="Height" unit="mm" value={design.plate.height} onChange={(value) => updatePlate("height", value)} /><NumberField label="Thickness" unit="mm" value={design.plate.thickness} onChange={(value) => updatePlate("thickness", value)} /><NumberField label="Corner radius" unit="mm" value={design.plate.cornerRadius} onChange={(value) => updatePlate("cornerRadius", value)} /><label className="form-field"><span>Hole count</span><select value={design.plate.holeCount} onChange={(event) => updatePlate("holeCount", Number(event.target.value) as 0 | 2 | 4)}><option value={0}>0</option><option value={2}>2</option><option value={4}>4</option></select></label>{design.plate.holeCount > 0 && <NumberField label="Hole diameter" unit="mm" value={design.plate.holeDiameter} onChange={(value) => updatePlate("holeDiameter", value)} />}</div>}
              {design.partType === "flange" && <div className="form-grid form-grid--2"><NumberField label="Outer diameter" unit="mm" value={design.flange.outerDiameter} onChange={(value) => updateFlange("outerDiameter", value)} /><NumberField label="Bore diameter" unit="mm" value={design.flange.innerDiameter} onChange={(value) => updateFlange("innerDiameter", value)} /><NumberField label="Thickness" unit="mm" value={design.flange.thickness} onChange={(value) => updateFlange("thickness", value)} /><NumberField label="Pitch circle" unit="mm" value={design.flange.pitchCircleDiameter} onChange={(value) => updateFlange("pitchCircleDiameter", value)} /><NumberField label="Hole count" unit="" value={design.flange.holeCount} onChange={(value) => updateFlange("holeCount", value)} step={1} /><NumberField label="Hole diameter" unit="mm" value={design.flange.holeDiameter} onChange={(value) => updateFlange("holeDiameter", value)} /></div>}
              {design.partType === "spacer" && <div className="form-grid form-grid--2"><NumberField label="Outer diameter" unit="mm" value={design.spacer.outerDiameter} onChange={(value) => updateSpacer("outerDiameter", value)} /><NumberField label="Bore diameter" unit="mm" value={design.spacer.innerDiameter} onChange={(value) => updateSpacer("innerDiameter", value)} /><NumberField label="Length" unit="mm" value={design.spacer.length} onChange={(value) => updateSpacer("length", value)} /></div>}
              {design.partType === "angle" && <div className="form-grid form-grid--2"><NumberField label="Extrusion width" unit="mm" value={design.angle.width} onChange={(value) => updateAngle("width", value)} /><NumberField label="Leg A" unit="mm" value={design.angle.legA} onChange={(value) => updateAngle("legA", value)} /><NumberField label="Leg B" unit="mm" value={design.angle.legB} onChange={(value) => updateAngle("legB", value)} /><NumberField label="Thickness" unit="mm" value={design.angle.thickness} onChange={(value) => updateAngle("thickness", value)} /></div>}
            </div>
            <div className="cad-ds-property-group"><h3>Material</h3><label className="form-field"><span>Material</span><select value={design.materialId} onChange={(event) => selectMaterial(event.target.value)}>{engineeringMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label><NumberField label="Density" unit="kg/m3" value={design.density} onChange={(density) => commitDesign("Changed density", (current) => ({ ...current, density }))} /></div>
          </> : activeSource === "mesh" ? <div className="cad-ds-property-group"><h3>Mesh metadata</h3>{importedMesh ? <dl className="cad-ds-metrics"><div><dt>Format</dt><dd>{importedMesh.summary.format.toUpperCase()}</dd></div><div><dt>Triangles</dt><dd>{importedMesh.summary.triangleCount ?? 0}</dd></div><div><dt>Bounds</dt><dd>{importedMesh.summary.boundsMm.size.map((value) => (value * importedMesh.viewport.scale).toFixed(2)).join(" x ")} mm</dd></div><div><dt>Scale</dt><dd>{importedMesh.viewport.scale.toFixed(4)}x</dd></div><div><dt>Components</dt><dd>{importedMesh.summary.components.length}</dd></div><div><dt>Materials</dt><dd>{importedMesh.summary.materials.length}</dd></div></dl> : <p className="muted">JSON stores metadata only. A verified mesh blob can be rehydrated from this browser profile's bounded cache or reselected manually.</p>}</div>
            : <div className="cad-ds-property-group"><h3>Exact model</h3>{exactModel ? <dl className="cad-ds-metrics"><div><dt>Source</dt><dd>{exactModel.importedExchangePreview ? "STEP tessellated preview" : "Native feature history"}</dd></div><div><dt>Triangles</dt><dd>{exactModel.viewport.payload.indices.length / 3}</dd></div><div><dt>Bounds</dt><dd>{exactModel.viewport.boundsMm.size.map((value) => value.toFixed(2)).join(" x ")} mm</dd></div><div><dt>Features</dt><dd>{exactModel.evaluation?.features.length ?? "Not reconstructed"}</dd></div><div><dt>Output body</dt><dd>{exactModel.evaluation?.outputBodyId ?? "Not reconstructed"}</dd></div><div><dt>Output feature</dt><dd>{exactModel.evaluation?.outputFeatureId ?? "Not reconstructed"}</dd></div><div><dt>Failed IDs</dt><dd>{exactModel.evaluation?.failedFeatureIds.join(", ") || "none"}</dd></div><div><dt>Rollback IDs</dt><dd>{exactModel.evaluation?.rolledBackFeatureIds.join(", ") || "none"}</dd></div><div><dt>Findings</dt><dd>{exactModel.evaluation?.errors.length ?? 0}</dd></div></dl> : <p className="muted">Run an exact-CAD fixture or rebuild the editable feature history.</p>}{exactModel?.stepMetadata && <div className="cad-ds-exact-seam" role="note"><strong>STEP fidelity: {exactModel.stepMetadata.unitsStatus}</strong><p>{exactModel.stepMetadata.notice}</p><ul>{exactModel.stepMetadata.losses.map((loss) => <li key={loss}>{loss}</li>)}</ul></div>}{exactModel?.evaluation?.errors.map((error) => <div className="inline-message inline-message--error" role="alert" key={`${error.code}-${error.featureId}`}>{error.code}: {error.message}. Last-valid geometry retained: {error.recoverable ? "yes" : "no"}.</div>)}</div>}
          {activeSource === "exact" && !exactModel?.importedExchangePreview && <ExactCadEditor document={exactDocument} selectedFeatureId={selectedExactFeatureId} busy={exactJob.status === "working"} onSelectFeature={setSelectedExactFeatureId} onChange={(document, action) => {
            const reconciled = reconcileBrepOutputBody(document);
            if (!reconciled.ok) { setMessage({ tone: "error", text: `Exact edit refused: ${reconciled.error.message}` }); return; }
            setExactDocument(reconciled.document);
            addHistoryRow(action);
          }} onRebuild={() => void runExactDocument(exactDocument, exactModel?.label ?? "Edited exact model")} onSave={() => {
            try {
              const reconciled = reconcileBrepOutputBody(exactDocument, exactModel?.evaluation);
              if (!reconciled.ok) throw new Error(`${reconciled.error.code}: ${reconciled.error.message}`);
              const source = stringifyExactDocument(reconciled.document);
              localStorage.setItem(EXACT_DOCUMENT_KEY, source);
              setExactDocument(reconciled.document);
              downloadBlob(source, "application/json", "exact-cad-feature-history.json");
              addHistoryRow("Saved exact feature history");
              setMessage({ tone: "success", text: "Native exact feature history saved locally and exported as JSON." });
            } catch (error) {
              setMessage({ tone: "error", text: `Exact history was not saved: ${error instanceof Error ? error.message : String(error)}` });
            }
          }} onReopen={() => {
            try {
              const source = localStorage.getItem(EXACT_DOCUMENT_KEY);
              if (!source) throw new Error("No saved exact feature history is available.");
              const document = parseExactDocument(source);
              setExactDocument(document);
              setSelectedExactFeatureId(document.features[0]?.id ?? "");
              void runExactDocument(document, "Reopened exact feature history");
            } catch (error) {
              setMessage({ tone: "error", text: `Exact history was not reopened: ${error instanceof Error ? error.message : String(error)}` });
            }
          }} />}
          <div className="cad-ds-property-group"><h3>Distance</h3><p>{measurement === null ? "No completed measurement" : `${measurement.toFixed(3)} mm`}</p><button className="btn" type="button" aria-pressed={measureMode} onClick={() => setMeasureMode((current) => !current)}>{measureMode ? "Stop measuring" : "Measure distance"}</button></div>
          {metrics && activeSource === "template" && <div className="cad-ds-property-group"><h3>Calculated</h3><dl className="cad-ds-metrics"><div><dt>Area</dt><dd>{metrics.profileAreaMm2.toFixed(1)} mm2</dd></div><div><dt>Volume</dt><dd>{metrics.volumeMm3.toFixed(1)} mm3</dd></div><div><dt>Mass</dt><dd>{metrics.massKg.toFixed(4)} kg</dd></div><div><dt>Bounds</dt><dd>{metrics.boundingBox.x} x {metrics.boundingBox.y} x {metrics.boundingBox.z} mm</dd></div></dl></div>}
          {activeSource === "exact" && <div className="cad-ds-property-group"><h3>Exact exports</h3>{exactModel?.importedExchangePreview ? <p className="muted">The imported STEP result is tessellated display data with assumed millimetres, not an exposed exact B-rep or editable feature history. Re-export is unavailable.</p> : <div className="cad-ds-import__actions"><button className="btn" type="button" onClick={() => void exportExact("stl-binary")}>Exact STL</button><button className="btn" type="button" onClick={() => void exportExact("step")}>STEP</button></div>}</div>}
          <div className="cad-ds-property-group"><h2 className="sr-only">Export design</h2><h3>Template exports</h3><div className="cad-ds-import__actions"><button className="btn" type="button" onClick={exportStl}>STL</button><button className="btn" type="button" onClick={() => assertExportable() && downloadBlob(generateOpenScad(design), "text/plain", `${cadFileStem(design)}.scad`)}>OpenSCAD</button><button className="btn" type="button" onClick={() => assertExportable() && downloadBlob(generateCadSvg(design), "image/svg+xml", `${cadFileStem(design)}-drawing.svg`)}>SVG</button><button className="btn" type="button" onClick={() => downloadBlob(exportCadDocumentJson(history.present), "application/json", `${cadFileStem(design)}.json`)}>CAD v2 JSON</button></div></div>
        </CadPanel>

        <CadResizeHandle label="Resize history and diagnostics" axis="vertical" value={bottomHeight} min={150} max={420} reverse onChange={(value) => setBottomHeight(value)} />

        <CadPanel id="cad-history" title="History and diagnostics" eyebrow="Document" collapsed={bottomCollapsed} onToggle={() => setBottomCollapsed((current) => !current)} className="cad-ds-bottom">
          <div className="cad-ds-bottom-grid">
            <section aria-label="CAD history"><table className="cad-ds-table"><caption>Command history</caption><thead><tr><th scope="col">Action</th><th scope="col">State</th></tr></thead><tbody>{historyRows.map((row) => <tr key={row.id}><td>{row.action}</td><td>{row.status}</td></tr>)}</tbody></table></section>
            <section aria-label="CAD diagnostics"><table className="cad-ds-table"><caption>Diagnostics</caption><thead><tr><th scope="col">Check</th><th scope="col">Result</th></tr></thead><tbody><tr><td>CadDocument v2</td><td>{documentValidation.valid ? "PASS" : "FAIL"}</td></tr><tr><td>Template validation</td><td>{errors.length === 0 ? "PASS" : `${errors.length} finding(s)`}</td></tr><tr><td>Mesh lifecycle</td><td>{importState.status}</td></tr><tr><td>Exact worker</td><td>{exactJob.status}{exactJob.status === "error" ? `: ${exactJob.code}` : exactJob.status === "complete" ? `: ${exactJob.phase}` : ""}</td></tr><tr><td>Renderer</td><td>WebGL2 guarded, demand rendered</td></tr></tbody></table>
              <div className="cad-ds-exact-seam"><strong>Exact-CAD worker</strong><div className="cad-ds-import__actions"><button className="btn" type="button" onClick={() => void runExactDocument(createSketchPadPocketFixture(), "Sketch, pad and pocket")}>Pad and pocket</button><button className="btn" type="button" onClick={() => void runExactDocument(createRevolveFixture(), "Revolved profile")}>Revolve</button><button className="btn" type="button" onClick={() => void runExactDocument(createBooleanFixture("subtract"), "Boolean subtraction")}>Boolean</button><button className="btn" type="button" onClick={() => void runExactDocument(createPrimitiveFixture(), "Primitive union")}>Primitives</button><button className="btn" type="button" onClick={() => void runExactDocument(createInvalidFilletFixture(), "Invalid fillet rollback")}>Invalid fillet fixture</button><button className="btn" type="button" onClick={() => {
                const last = exactDocument.features.at(-1);
                if (!last) return;
                const next = { ...exactDocument, features: exactDocument.features.map((feature) => feature.id === last.id ? { ...feature, suppressed: !feature.suppressed } : feature) };
                void runExactDocument(next, `${last.suppressed ? "Rebuilt" : "Suppressed"} ${last.name}`);
              }}>Suppress or rebuild last feature</button><button className="btn" type="button" onClick={() => importRef.current?.click()}>Import STEP, IGES or BREP</button>{exactJob.status === "working" && <button className="btn" type="button" onClick={cancelExactJob}>Cancel exact job</button>}</div>{exactJob.status === "working" && <><progress max={1} value={exactJob.ratio} aria-label="Exact-CAD worker progress" /><span role="status">{exactJob.phase}: {Math.round(exactJob.ratio * 100)}%</span></>}{exactJob.status === "error" && <div role="alert"><strong>{exactJob.code}</strong>: {exactJob.message}</div>}<p>STEP is a tessellated preview with assumed millimetres and explicit hierarchy/feature losses. IGES and BREP return typed unsupported-format results. Reference meshes remain non-editable and separate.</p></div>
            </section>
          </div>
        </CadPanel>
      </div>

      {errors.length > 0 && <div className="cad-validation-list" role="alert"><strong>Validation findings</strong><ul>{errors.map((error) => <li key={error}><Icon name="alert" size={16} /> {error}</li>)}</ul></div>}
      {message && <div className={`inline-message inline-message--${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}
      <div className="safety-note" role="note"><Icon name="alert" size={20} /><p><strong>CAD boundary.</strong> This studio includes a local worker-isolated OCCT exact-modelling path, bounded templates and reference-mesh inspection. It does not verify tolerances, fits, stress, manufacturability or compliance.</p></div>
      <CadCommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </section>
  );
}
