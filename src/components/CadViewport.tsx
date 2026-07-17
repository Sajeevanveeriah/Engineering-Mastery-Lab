import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildCadObject, disposeCadObject } from "../lib/cad/geometry";
import { calculateCadMetrics, validateCadDesign, type CadDesign } from "../lib/cad/model";

export type CadViewName = "isometric" | "front" | "top" | "right";

interface CadViewportProps {
  design: CadDesign;
  showGrid: boolean;
  wireframe: boolean;
  view: CadViewName;
  viewNonce: number;
}

export function CadViewport({ design, showGrid, wireframe, view, viewNonce }: CadViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
    camera.up.set(0, 1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.screenSpacePanning = true;
    controls.minDistance = 20;
    controls.maxDistance = 5000;

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
      const style = getComputedStyle(document.documentElement).getPropertyValue("--bg-inset").trim() || "#edf2f7";
      scene.background = new THREE.Color(style);
    };
    setBackground();
    const themeObserver = new MutationObserver(setBackground);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    camera.position.set(220, 180, 260);
    controls.target.set(0, 0, 0);
    controls.update();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      controls.dispose();
      if (modelRef.current) disposeCadObject(modelRef.current);
      if (gridRef.current) {
        gridRef.current.geometry.dispose();
        const materials = Array.isArray(gridRef.current.material) ? gridRef.current.material : [gridRef.current.material];
        materials.forEach((material) => material.dispose());
      }
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      gridRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeCadObject(modelRef.current);
      modelRef.current = null;
    }
    if (validateCadDesign(design).length > 0) return;
    const model = buildCadObject(design);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) material.wireframe = wireframe;
        });
      }
    });
    scene.add(model);
    modelRef.current = model;
  }, [design, wireframe]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (gridRef.current) {
      scene.remove(gridRef.current);
      gridRef.current.geometry.dispose();
      const materials = Array.isArray(gridRef.current.material) ? gridRef.current.material : [gridRef.current.material];
      materials.forEach((material) => material.dispose());
      gridRef.current = null;
    }
    if (!showGrid || validateCadDesign(design).length > 0) return;
    const metrics = calculateCadMetrics(design);
    const size = Math.max(100, Math.ceil(Math.max(metrics.boundingBox.x, metrics.boundingBox.y, metrics.boundingBox.z) * 2.5 / 10) * 10);
    const divisions = Math.min(50, Math.max(10, Math.round(size / 10)));
    const grid = new THREE.GridHelper(size, divisions, 0x52749a, 0x8ca1b8);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -metrics.boundingBox.z / 2 - 0.6;
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.48;
    });
    scene.add(grid);
    gridRef.current = grid;
  }, [design, showGrid]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || validateCadDesign(design).length > 0) return;
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
  }, [design, view, viewNonce]);

  return (
    <div className="cad-viewport" ref={hostRef} role="img" aria-label={`Interactive 3D preview of ${design.name}`}>
      <span className="cad-viewport__hint">Drag to orbit, scroll to zoom, right-drag to pan</span>
    </div>
  );
}
