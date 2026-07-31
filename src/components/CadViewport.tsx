import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CadDrawing } from "./CadDrawing";
import { buildCadObject, disposeCadObject } from "../lib/cad/geometry";
import { calculateCadMetrics, validateCadDesign, type CadDesign } from "../lib/cad/model";
import { createIdempotentCleanup, supportsWebGl2 } from "../lib/webgl";

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
const MAX_DAMPING_FRAMES = 90;

export type CadViewName = "isometric" | "front" | "top" | "right";

interface CadViewportProps {
  design: CadDesign;
  showGrid: boolean;
  wireframe: boolean;
  view: CadViewName;
  viewNonce: number;
}

const noCleanup = () => undefined;

function disposeGrid(grid: THREE.GridHelper) {
  grid.geometry.dispose();
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  materials.forEach((material) => material.dispose());
}

function logPreviewFailure(message: string, error: unknown) {
  if (isDevelopment) console.error(message, error);
}

export function CadViewport({ design, showGrid, wireframe, view, viewNonce }: CadViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const lifecycleCleanupRef = useRef<() => void>(noCleanup);
  const failureHandlerRef = useRef<(error: unknown) => void>(() => undefined);
  const renderInvalidationRef = useRef<() => void>(noCleanup);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    lifecycleCleanupRef.current();

    let active = true;
    let frame: number | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let modelToDispose: THREE.Group | null = null;
    let gridToDispose: THREE.GridHelper | null = null;
    let needsRender = true;
    let dampingFramesRemaining = 0;
    let documentVisible = document.hidden !== true;
    let viewportVisible = typeof IntersectionObserver === "undefined";
    let updatingControls = false;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      failureHandlerRef.current(new Error("The WebGL2 context was lost."));
    };

    function canRender() {
      return active && documentVisible && viewportVisible;
    }

    function cancelScheduledRender() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function scheduleRender() {
      if (frame !== null || !needsRender || !canRender()) return;
      frame = requestAnimationFrame(renderFrame);
    }

    function invalidateRender() {
      needsRender = true;
      scheduleRender();
    }

    function pauseRender() {
      cancelScheduledRender();
      needsRender = true;
    }

    function renderFrame() {
      frame = null;
      if (!needsRender || !canRender() || !scene || !camera || !renderer || !controls) return;
      needsRender = false;

      try {
        updatingControls = true;
        const controlsChanged = controls.update();
        updatingControls = false;
        renderer.render(scene, camera);

        if (controlsChanged && dampingFramesRemaining > 0) {
          dampingFramesRemaining -= 1;
          needsRender = true;
        } else {
          dampingFramesRemaining = 0;
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
      invalidateRender();
    };

    const handleVisibilityChange = () => {
      documentVisible = document.hidden !== true;
      if (canRender()) invalidateRender();
      else pauseRender();
    };

    const cleanup = createIdempotentCleanup([
      () => {
        active = false;
      },
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
      () => {
        if (modelToDispose) disposeCadObject(modelToDispose);
      },
      () => {
        if (sceneRef.current !== scene) return;
        gridToDispose = gridRef.current;
        gridRef.current = null;
        if (gridToDispose) scene?.remove(gridToDispose);
      },
      () => {
        if (gridToDispose) disposeGrid(gridToDispose);
      },
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
        camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
        camera.up.set(0, 1, 0);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.dataset.cadPreview = "true";
        renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
        host.append(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.screenSpacePanning = true;
        controls.minDistance = 20;
        controls.maxDistance = 5000;
        controls.addEventListener("change", handleControlsChange);

        const hemisphere = new THREE.HemisphereLight(0xeef6ff, 0x26374a, 2.1);
        scene.add(hemisphere);
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
          try {
            setBackground();
            invalidateRender();
          } catch (error) {
            failPreview(error);
          }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        const resize = () => {
          if (!camera || !renderer) return;
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          invalidateRender();
        };
        resize();
        resizeObserver = new ResizeObserver(() => {
          try {
            resize();
          } catch (error) {
            failPreview(error);
          }
        });
        resizeObserver.observe(host);

        sceneRef.current = scene;
        cameraRef.current = camera;
        controlsRef.current = controls;
        camera.position.set(220, 180, 260);
        controls.target.set(0, 0, 0);
        controls.update();

        renderInvalidationRef.current = invalidateRender;
        documentVisible = document.hidden !== true;
        document.addEventListener("visibilitychange", handleVisibilityChange);

        if (typeof IntersectionObserver === "undefined") {
          viewportVisible = true;
        } else {
          const bounds = host.getBoundingClientRect();
          viewportVisible = bounds.width > 0
            && bounds.height > 0
            && bounds.right > 0
            && bounds.bottom > 0
            && bounds.left < window.innerWidth
            && bounds.top < window.innerHeight;
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
      if (failureHandlerRef.current === failPreview) {
        failureHandlerRef.current = () => undefined;
      }
      if (lifecycleCleanupRef.current === cleanup) {
        lifecycleCleanupRef.current = noCleanup;
      }
      cleanup();
    };
  }, [previewNonce]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let nextModel: THREE.Group | null = null;

    try {
      if (modelRef.current) {
        const previousModel = modelRef.current;
        modelRef.current = null;
        scene.remove(previousModel);
        disposeCadObject(previousModel);
      }
      if (validateCadDesign(design).length > 0) {
        renderInvalidationRef.current();
        return;
      }
      nextModel = buildCadObject(design);
      nextModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) material.wireframe = wireframe;
          });
        }
      });
      scene.add(nextModel);
      modelRef.current = nextModel;
      renderInvalidationRef.current();
    } catch (error) {
      if (nextModel && modelRef.current !== nextModel) {
        createIdempotentCleanup([
          () => scene.remove(nextModel as THREE.Group),
          () => disposeCadObject(nextModel as THREE.Group)
        ], (cleanupError) => logPreviewFailure("CAD model cleanup failure", cleanupError))();
      }
      failureHandlerRef.current(error);
    }
  }, [design, previewNonce, wireframe]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let nextGrid: THREE.GridHelper | null = null;

    try {
      if (gridRef.current) {
        const previousGrid = gridRef.current;
        gridRef.current = null;
        scene.remove(previousGrid);
        disposeGrid(previousGrid);
      }
      if (!showGrid || validateCadDesign(design).length > 0) {
        renderInvalidationRef.current();
        return;
      }
      const metrics = calculateCadMetrics(design);
      const size = Math.max(100, Math.ceil(Math.max(metrics.boundingBox.x, metrics.boundingBox.y, metrics.boundingBox.z) * 2.5 / 10) * 10);
      const divisions = Math.min(50, Math.max(10, Math.round(size / 10)));
      nextGrid = new THREE.GridHelper(size, divisions, 0x52749a, 0x8ca1b8);
      nextGrid.rotation.x = Math.PI / 2;
      nextGrid.position.z = -metrics.boundingBox.z / 2 - 0.6;
      const materials = Array.isArray(nextGrid.material) ? nextGrid.material : [nextGrid.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = 0.48;
      });
      scene.add(nextGrid);
      gridRef.current = nextGrid;
      renderInvalidationRef.current();
    } catch (error) {
      if (nextGrid && gridRef.current !== nextGrid) {
        createIdempotentCleanup([
          () => scene.remove(nextGrid as THREE.GridHelper),
          () => disposeGrid(nextGrid as THREE.GridHelper)
        ], (cleanupError) => logPreviewFailure("CAD grid cleanup failure", cleanupError))();
      }
      failureHandlerRef.current(error);
    }
  }, [design, previewNonce, showGrid]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || validateCadDesign(design).length > 0) return;

    try {
      const metrics = calculateCadMetrics(design);
      const extent = Math.max(metrics.boundingBox.x, metrics.boundingBox.y, metrics.boundingBox.z, 20);
      const distance = extent * 2.25;
      const positions: Record<CadViewName, [number, number, number]> = {
        isometric: [distance, distance * 0.78, distance],
        front: [0, 0, distance],
        top: [0, distance, 0],
        right: [distance, 0, 0]
      };
      camera.up.set(0, view === "top" ? 0 : 1, view === "top" ? -1 : 0);
      camera.position.set(...positions[view]);
      camera.near = Math.max(0.1, distance / 1000);
      camera.far = distance * 20;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
      renderInvalidationRef.current();
    } catch (error) {
      failureHandlerRef.current(error);
    }
  }, [design, previewNonce, view, viewNonce]);

  if (previewFailed) {
    return (
      <div className="cad-viewport cad-viewport--fallback" role="region" aria-labelledby="cad-preview-unavailable-heading">
        <div className="empty-state" role="alert">
          <p className="eyebrow">WebGL2 recovery</p>
          <h2 id="cad-preview-unavailable-heading">3D preview unavailable</h2>
          <p className="muted">
            The local WebGL2 renderer could not start or continue. Your CAD design was not changed. Use the
            dimensioned drawing below, then retry when the browser graphics context is available.
          </p>
          <div className="button-row button-row--centre">
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                setPreviewFailed(false);
                setPreviewNonce((current) => current + 1);
              }}
            >
              Retry 3D preview
            </button>
            <Link className="btn" to="/more">Back to More</Link>
          </div>
        </div>
        <div className="cad-drawing-panel" role="region" aria-label={`Dimensioned drawing fallback for ${design.name}`}>
          <CadDrawing design={design} />
        </div>
      </div>
    );
  }

  return (
    <div className="cad-viewport" ref={hostRef} role="img" aria-label={`Interactive 3D preview of ${design.name}`}>
      <span className="cad-viewport__hint">Drag to orbit, scroll to zoom, right-drag to pan</span>
    </div>
  );
}
