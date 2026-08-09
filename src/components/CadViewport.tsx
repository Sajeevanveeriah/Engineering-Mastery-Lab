import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { MeshBoundsMm, MeshRenderPayload } from "../lib/cad/meshImport";
import { buildCadObject } from "../lib/cad/geometry";
import { calculateCadMetrics, validateCadDesign, type CadDesign } from "../lib/cad/model";
import { createIdempotentCleanup, supportsWebGl2 } from "../lib/webgl";
import { CadDrawing } from "./CadDrawing";

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
const MAX_DAMPING_FRAMES = 90;
const MAX_DAMPING_DURATION_MS = 4_000;

export type CadViewName = "isometric" | "front" | "top" | "right";
export type CadProjection = "perspective" | "orthographic";

export interface CadViewportMesh {
  readonly payload: MeshRenderPayload;
  readonly boundsMm: MeshBoundsMm;
  readonly label: string;
  readonly scale: number;
}

interface CadViewportProps {
  design: CadDesign;
  mesh?: CadViewportMesh | null;
  showGrid: boolean;
  showAxes?: boolean;
  wireframe: boolean;
  view: CadViewName;
  projection?: CadProjection;
  viewNonce: number;
  fitNonce?: number;
  selected?: boolean;
  measureMode?: boolean;
  onMeasure?: (distanceMm: number | null) => void;
}

type CadCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

const noCleanup = () => undefined;

function disposeMaterials(material: THREE.Material | THREE.Material[]): void {
  (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      disposeMaterials(child.material);
    }
  });
}

function disposeGrid(grid: THREE.GridHelper): void {
  grid.geometry.dispose();
  disposeMaterials(grid.material);
}

function logPreviewFailure(message: string, error: unknown): void {
  if (isDevelopment) console.error(message, error);
}

function buildTransferredMesh(mesh: CadViewportMesh, wireframe: boolean): THREE.Group {
  const { payload } = mesh;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(payload.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(payload.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(payload.indices, 1));
  if (payload.colours) geometry.setAttribute("color", new THREE.BufferAttribute(payload.colours, 3));
  geometry.computeBoundingSphere();

  const group = new THREE.Group();
  group.name = mesh.label;
  const material = new THREE.MeshStandardMaterial({
    color: payload.colours ? 0xffffff : 0x6f9fcb,
    metalness: 0.12,
    roughness: 0.58,
    side: THREE.DoubleSide,
    vertexColors: Boolean(payload.colours),
    wireframe
  });
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  object.scale.setScalar(mesh.scale);
  group.add(object);
  return group;
}

export function CadViewport({
  design,
  mesh = null,
  showGrid,
  showAxes = true,
  wireframe,
  view,
  projection = "perspective",
  viewNonce,
  fitNonce = 0,
  selected = false,
  measureMode = false,
  onMeasure
}: CadViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<CadCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const selectionRef = useRef<THREE.BoxHelper | null>(null);
  const measurementRef = useRef<THREE.Line | null>(null);
  const measureStartRef = useRef<THREE.Vector3 | null>(null);
  const lifecycleCleanupRef = useRef<() => void>(noCleanup);
  const failureHandlerRef = useRef<(error: unknown) => void>(() => undefined);
  const renderInvalidationRef = useRef<() => void>(noCleanup);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);

  const activeBounds = useMemo(() => {
    if (mesh) {
      return {
        size: mesh.boundsMm.size.map((value) => value * mesh.scale) as [number, number, number],
        centre: mesh.boundsMm.min.map((value, index) => (
          (value + mesh.boundsMm.max[index]) * mesh.scale / 2
        )) as [number, number, number]
      };
    }
    if (validateCadDesign(design).length > 0) return null;
    const bounds = calculateCadMetrics(design).boundingBox;
    return { size: [bounds.x, bounds.y, bounds.z] as [number, number, number], centre: [0, 0, 0] as [number, number, number] };
  }, [design, mesh]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    lifecycleCleanupRef.current();

    let active = true;
    let frame: number | null = null;
    let scene: THREE.Scene | null = null;
    let camera: CadCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let modelToDispose: THREE.Group | null = null;
    let gridToDispose: THREE.GridHelper | null = null;
    let axesToDispose: THREE.AxesHelper | null = null;
    let selectionToDispose: THREE.BoxHelper | null = null;
    let measurementToDispose: THREE.Line | null = null;
    let needsRender = true;
    let dampingFramesRemaining = 0;
    let dampingDeadline = 0;
    let documentVisible = document.hidden !== true;
    let viewportVisible = typeof IntersectionObserver === "undefined";
    let updatingControls = false;
    let renderWidth = 0;
    let renderHeight = 0;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      failureHandlerRef.current(new Error("The WebGL2 context was lost."));
    };

    function canRender(): boolean {
      return active && documentVisible && viewportVisible;
    }

    function cancelScheduledRender(): void {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function scheduleRender(): void {
      if (frame !== null || !needsRender || !canRender()) return;
      frame = requestAnimationFrame(renderFrame);
    }

    function invalidateRender(): void {
      needsRender = true;
      scheduleRender();
    }

    function pauseRender(): void {
      cancelScheduledRender();
      needsRender = true;
    }

    function renderFrame(): void {
      frame = null;
      if (!needsRender || !canRender() || !scene || !camera || !renderer || !controls) return;
      needsRender = false;
      try {
        updatingControls = true;
        const controlsChanged = controls.update();
        updatingControls = false;
        renderer.render(scene, camera);
        if (controlsChanged && dampingFramesRemaining > 0 && performance.now() < dampingDeadline) {
          dampingFramesRemaining -= 1;
          needsRender = true;
        } else {
          dampingFramesRemaining = 0;
          dampingDeadline = 0;
        }
        scheduleRender();
      } catch (error) {
        updatingControls = false;
        failureHandlerRef.current(error);
      }
    }

    const handleControlsChange = () => {
      if (updatingControls) return;
      dampingFramesRemaining = MAX_DAMPING_FRAMES;
      dampingDeadline = performance.now() + MAX_DAMPING_DURATION_MS;
      invalidateRender();
    };

    const handleVisibilityChange = () => {
      documentVisible = document.hidden !== true;
      if (canRender()) invalidateRender();
      else pauseRender();
    };

    const cleanup = createIdempotentCleanup([
      () => { active = false; },
      cancelScheduledRender,
      () => resizeObserver?.disconnect(),
      () => themeObserver?.disconnect(),
      () => intersectionObserver?.disconnect(),
      () => document.removeEventListener("visibilitychange", handleVisibilityChange),
      () => renderer?.domElement.removeEventListener("webglcontextlost", handleContextLost),
      () => controls?.removeEventListener("change", handleControlsChange),
      () => controls?.dispose(),
      () => {
        if (sceneRef.current !== scene) return;
        modelToDispose = modelRef.current;
        modelRef.current = null;
        if (modelToDispose) scene?.remove(modelToDispose);
      },
      () => { if (modelToDispose) disposeObject(modelToDispose); },
      () => {
        if (sceneRef.current !== scene) return;
        gridToDispose = gridRef.current;
        gridRef.current = null;
        if (gridToDispose) scene?.remove(gridToDispose);
      },
      () => { if (gridToDispose) disposeGrid(gridToDispose); },
      () => {
        axesToDispose = axesRef.current;
        axesRef.current = null;
        if (axesToDispose) scene?.remove(axesToDispose);
      },
      () => { if (axesToDispose) disposeObject(axesToDispose); },
      () => {
        selectionToDispose = selectionRef.current;
        selectionRef.current = null;
        if (selectionToDispose) scene?.remove(selectionToDispose);
      },
      () => { if (selectionToDispose) disposeObject(selectionToDispose); },
      () => {
        measurementToDispose = measurementRef.current;
        measurementRef.current = null;
        if (measurementToDispose) scene?.remove(measurementToDispose);
      },
      () => { if (measurementToDispose) disposeObject(measurementToDispose); },
      () => renderer?.dispose(),
      () => renderer?.forceContextLoss(),
      () => renderer?.domElement.remove(),
      () => host.querySelectorAll("canvas").forEach((canvas) => canvas.remove()),
      () => {
        if (sceneRef.current === scene) sceneRef.current = null;
        if (cameraRef.current === camera) cameraRef.current = null;
        if (controlsRef.current === controls) controlsRef.current = null;
        if (renderInvalidationRef.current === invalidateRender) renderInvalidationRef.current = noCleanup;
      }
    ], (error) => logPreviewFailure("CAD 3D preview cleanup failure", error));

    lifecycleCleanupRef.current = cleanup;
    const failPreview = (error: unknown) => {
      if (!active) return;
      logPreviewFailure("CAD 3D preview failure", error);
      cleanup();
      setPreviewFailed(true);
    };
    failureHandlerRef.current = failPreview;

    try {
      host.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
      if (!supportsWebGl2()) {
        failPreview(new Error("WebGL2 preflight did not create a context."));
      } else {
        scene = new THREE.Scene();
        camera = projection === "orthographic"
          ? new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 10000)
          : new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
        camera.up.set(0, 1, 0);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = false;
        renderer.domElement.dataset.cadPreview = "true";
        renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
        host.append(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.screenSpacePanning = true;
        controls.minDistance = 0.1;
        controls.maxDistance = 100000;
        controls.addEventListener("change", handleControlsChange);

        scene.add(new THREE.HemisphereLight(0xeef6ff, 0x26374a, 2.1));
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
        keyLight.position.set(220, 260, 380);
        keyLight.castShadow = true;
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x8bc2ff, 1.2);
        fillLight.position.set(-280, 140, -180);
        scene.add(fillLight);

        const setBackground = () => {
          if (!scene) return;
          const style = getComputedStyle(document.documentElement).getPropertyValue("--bg-inset").trim() || "#edf2f7";
          scene.background = new THREE.Color(style);
        };
        setBackground();
        themeObserver = new MutationObserver(() => {
          try { setBackground(); invalidateRender(); } catch (error) { failPreview(error); }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        const resize = () => {
          if (!camera || !renderer) return;
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          if (width === renderWidth && height === renderHeight) return;
          renderWidth = width;
          renderHeight = height;
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = width / height;
          } else {
            const halfHeight = Math.max(20, (camera.top - camera.bottom) / 2);
            const halfWidth = halfHeight * width / height;
            camera.left = -halfWidth;
            camera.right = halfWidth;
          }
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          invalidateRender();
        };
        resize();
        resizeObserver = new ResizeObserver(() => {
          try { resize(); } catch (error) { failPreview(error); }
        });
        resizeObserver.observe(host);

        sceneRef.current = scene;
        cameraRef.current = camera;
        controlsRef.current = controls;
        camera.position.set(220, 180, 260);
        controls.target.set(0, 0, 0);
        controls.update();
        renderInvalidationRef.current = invalidateRender;
        document.addEventListener("visibilitychange", handleVisibilityChange);

        if (typeof IntersectionObserver === "undefined") {
          viewportVisible = true;
        } else {
          const bounds = host.getBoundingClientRect();
          viewportVisible = bounds.width > 0 && bounds.height > 0 && bounds.right > 0 && bounds.bottom > 0
            && bounds.left < window.innerWidth && bounds.top < window.innerHeight;
          intersectionObserver = new IntersectionObserver((entries) => {
            const entry = entries.find((candidate) => candidate.target === host);
            if (!entry) return;
            viewportVisible = entry.isIntersecting && entry.intersectionRatio > 0;
            if (canRender()) invalidateRender();
            else pauseRender();
          });
          intersectionObserver.observe(host);
        }
        invalidateRender();
      }
    } catch (error) {
      failPreview(error);
    }

    return () => {
      if (failureHandlerRef.current === failPreview) failureHandlerRef.current = () => undefined;
      if (lifecycleCleanupRef.current === cleanup) lifecycleCleanupRef.current = noCleanup;
      cleanup();
    };
  }, [previewNonce, projection]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let nextModel: THREE.Group | null = null;
    try {
      if (modelRef.current) {
        const previous = modelRef.current;
        modelRef.current = null;
        scene.remove(previous);
        disposeObject(previous);
      }
      if (!mesh && validateCadDesign(design).length > 0) {
        renderInvalidationRef.current();
        return;
      }
      nextModel = mesh ? buildTransferredMesh(mesh, wireframe) : buildCadObject(design);
      if (!mesh) {
        nextModel.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) material.wireframe = wireframe;
          });
        });
      }
      scene.add(nextModel);
      modelRef.current = nextModel;
      renderInvalidationRef.current();
    } catch (error) {
      if (nextModel && modelRef.current !== nextModel) {
        createIdempotentCleanup([() => scene.remove(nextModel as THREE.Group), () => disposeObject(nextModel as THREE.Group)],
          (cleanupError) => logPreviewFailure("CAD model cleanup failure", cleanupError))();
      }
      failureHandlerRef.current(error);
    }
  }, [design, mesh, previewNonce, wireframe]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (selectionRef.current) {
      const previous = selectionRef.current;
      selectionRef.current = null;
      scene.remove(previous);
      disposeObject(previous);
    }
    if (selected && modelRef.current) {
      const helper = new THREE.BoxHelper(modelRef.current, 0x2f8cff);
      scene.add(helper);
      selectionRef.current = helper;
    }
    renderInvalidationRef.current();
  }, [design, mesh, previewNonce, selected, wireframe]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !activeBounds) return;
    if (gridRef.current) {
      const previous = gridRef.current;
      gridRef.current = null;
      scene.remove(previous);
      disposeGrid(previous);
    }
    if (axesRef.current) {
      const previous = axesRef.current;
      axesRef.current = null;
      scene.remove(previous);
      disposeObject(previous);
    }
    const extent = Math.max(...activeBounds.size, 1);
    if (showGrid) {
      const size = Math.max(100, Math.ceil(extent * 2.5 / 10) * 10);
      const divisions = Math.min(50, Math.max(10, Math.round(size / 10)));
      const grid = new THREE.GridHelper(size, divisions, 0x52749a, 0x8ca1b8);
      grid.rotation.x = Math.PI / 2;
      grid.position.set(activeBounds.centre[0], activeBounds.centre[1], activeBounds.centre[2] - activeBounds.size[2] / 2 - 0.6);
      (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach((material) => {
        material.transparent = true;
        material.opacity = 0.48;
      });
      scene.add(grid);
      gridRef.current = grid;
    }
    if (showAxes) {
      const axes = new THREE.AxesHelper(Math.max(20, extent * 0.7));
      axes.position.set(...activeBounds.centre);
      scene.add(axes);
      axesRef.current = axes;
    }
    renderInvalidationRef.current();
  }, [activeBounds, previewNonce, showAxes, showGrid]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || !activeBounds) return;
    try {
      const extent = Math.max(...activeBounds.size, 1);
      const distance = extent * 2.25;
      const positions: Record<CadViewName, [number, number, number]> = {
        isometric: [distance, distance * 0.78, distance],
        front: [0, 0, distance],
        top: [0, distance, 0],
        right: [distance, 0, 0]
      };
      const offset = positions[view];
      camera.up.set(0, view === "top" ? 0 : 1, view === "top" ? -1 : 0);
      camera.position.set(activeBounds.centre[0] + offset[0], activeBounds.centre[1] + offset[1], activeBounds.centre[2] + offset[2]);
      camera.near = Math.max(0.1, distance / 1000);
      camera.far = distance * 20;
      if (camera instanceof THREE.OrthographicCamera) {
        const aspect = Math.max(0.1, (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1));
        const halfHeight = extent * 0.8;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
      }
      camera.updateProjectionMatrix();
      controls.target.set(...activeBounds.centre);
      controls.update();
      renderInvalidationRef.current();
    } catch (error) {
      failureHandlerRef.current(error);
    }
  }, [activeBounds, fitNonce, previewNonce, view, viewNonce]);

  useEffect(() => {
    const canvas = hostRef.current?.querySelector<HTMLCanvasElement>("canvas[data-cad-preview]");
    if (!canvas || !measureMode) {
      measureStartRef.current = null;
      onMeasure?.(null);
      return undefined;
    }
    const measure = (event: MouseEvent) => {
      const camera = cameraRef.current;
      const model = modelRef.current;
      const scene = sceneRef.current;
      if (!camera || !model || !scene) return;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const point = raycaster.intersectObject(model, true)[0]?.point;
      if (!point) return;
      if (!measureStartRef.current) {
        measureStartRef.current = point.clone();
        onMeasure?.(null);
        return;
      }
      const start = measureStartRef.current;
      measureStartRef.current = null;
      if (measurementRef.current) {
        const previous = measurementRef.current;
        measurementRef.current = null;
        scene.remove(previous);
        disposeObject(previous);
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([start, point]),
        new THREE.LineBasicMaterial({ color: 0xff9f1c, depthTest: false })
      );
      line.renderOrder = 20;
      scene.add(line);
      measurementRef.current = line;
      onMeasure?.(start.distanceTo(point));
      renderInvalidationRef.current();
    };
    canvas.addEventListener("click", measure);
    return () => canvas.removeEventListener("click", measure);
  }, [measureMode, onMeasure, previewNonce]);

  if (previewFailed) {
    return (
      <div className="cad-viewport cad-viewport--fallback" role="region" aria-labelledby="cad-preview-unavailable-heading">
        <div className="empty-state" role="alert">
          <p className="eyebrow">WebGL2 recovery</p>
          <h2 id="cad-preview-unavailable-heading">3D preview unavailable</h2>
          <p className="muted">The local renderer stopped. The current design and imported mesh reference were not changed.</p>
          <div className="button-row button-row--centre">
            <button className="btn primary" type="button" onClick={() => {
              setPreviewFailed(false);
              setPreviewNonce((current) => current + 1);
            }}>Retry 3D preview</button>
            <Link className="btn" to="/more">Back to More</Link>
          </div>
        </div>
        <div className="cad-drawing-panel" role="region" aria-label={`Dimensioned drawing fallback for ${design.name}`}>
          <CadDrawing design={design} />
        </div>
      </div>
    );
  }

  const label = mesh ? `Interactive 3D mesh preview of ${mesh.label}` : `Interactive 3D preview of ${design.name}`;
  return (
    <div className={`cad-viewport ${measureMode ? "is-measuring" : ""}`} ref={hostRef} role="img" aria-label={label}>
      <span className="cad-viewport__hint">{measureMode ? "Select two surface points" : "Drag to orbit, scroll to zoom, right-drag to pan"}</span>
    </div>
  );
}
