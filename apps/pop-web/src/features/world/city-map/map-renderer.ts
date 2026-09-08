import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  Vector2,
} from "three";
import type { Material, Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createMapCamera, fitMapCamera } from "./map-camera";
import { applyMapMaterials } from "./map-materials";

import { bindDistrictAppearance } from "./map-appearance";
import type { CityDistrict } from "./districts";

export type CityMapRenderer = {
  updateDistricts: (districts: readonly CityDistrict[]) => void;
  dispose: () => void;
};

function disposeModel(model: Object3D) {
  const materials = new Set<Material>();
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      for (const material of object.material) materials.add(material);
    } else materials.add(object.material);
  });
  for (const material of materials) material.dispose();
}

export function mountCityMap(
  canvas: HTMLCanvasElement,
  report: (error: string | null) => void,
  initialDistricts: readonly CityDistrict[],
): CityMapRenderer | undefined {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  } catch (cause) {
    console.error("Could not create the city map renderer", cause);
    report("The map could not start. Check that hardware acceleration is enabled.");
    return undefined;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.add(new HemisphereLight(0xebe9e2, 0x343438, 2.1));
  const key = new DirectionalLight(0xfff2df, 2.1);
  key.position.set(-4, 9, 5);
  scene.add(key);
  const camera = createMapCamera();
  const bounds = new Box3();
  let disposed = false;
  let frame = 0;
  let model: Object3D | undefined;
  let releasePaper: (() => void) | undefined;
  const viewportSize = new Vector2();
  let districts = initialDistricts;
  let applyAppearance: ((districts: readonly CityDistrict[]) => void) | undefined;

  function updateDistricts(next: readonly CityDistrict[]) {
    if (disposed) return;
    districts = next;
    if (!applyAppearance) return;
    try {
      applyAppearance(next);
      if (!renderer.getContext().isContextLost()) report(null);
      scheduleDraw();
    } catch (cause) {
      console.error("Could not update district appearance", cause);
      report("District appearance could not be updated. Correct the district data and retry.");
    }
  }

  function draw() {
    frame = 0;
    if (disposed || renderer.getContext().isContextLost() || document.hidden) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    try {
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.getSize(viewportSize);
      if (
        viewportSize.x !== width ||
        viewportSize.y !== height ||
        renderer.getPixelRatio() !== pixelRatio
      )
        renderer.setDrawingBufferSize(width, height, pixelRatio);
      fitMapCamera(camera, bounds, width, height);
      renderer.render(scene, camera);
    } catch (cause) {
      console.error("Could not draw the city map", cause);
      report("The map could not be rendered. Try loading it again.");
    }
  }
  function scheduleDraw() {
    if (disposed || frame) return;
    frame = requestAnimationFrame(draw);
  }
  function lost(event: Event) {
    event.preventDefault();
    report("Map graphics were interrupted. Waiting for recovery, or retry the map.");
  }
  function restored() {
    updateDistricts(districts);
    scheduleDraw();
  }

  async function load() {
    try {
      const { default: dataUrl } = await import("./assets/city-map.glb?inline");
      if (disposed) return;
      const marker = ";base64,";
      const offset = dataUrl.indexOf(marker);
      if (offset < 0) throw new Error("The bundled city map is not a base64 asset.");
      const binary = Uint8Array.from(atob(dataUrl.slice(offset + marker.length)), (character) =>
        character.charCodeAt(0),
      );
      const asset = await new GLTFLoader().parseAsync(binary.buffer, "");
      if (disposed) {
        disposeModel(asset.scene);
        return;
      }
      model = asset.scene;
      applyAppearance = bindDistrictAppearance(model);
      releasePaper = applyMapMaterials(model, renderer.capabilities.getMaxAnisotropy());
      scene.add(model);
      bounds.setFromObject(model);
      updateDistricts(districts);
    } catch (cause) {
      if (disposed) return;
      if (model) {
        scene.remove(model);
        disposeModel(model);
        model = undefined;
        applyAppearance = undefined;
      }
      releasePaper?.();
      releasePaper = undefined;
      console.error("Could not load the city map", cause);
      report("The city map could not be loaded. Try again.");
    }
  }

  const observer = new ResizeObserver(scheduleDraw);
  observer.observe(canvas);
  window.addEventListener("resize", scheduleDraw);
  document.addEventListener("visibilitychange", scheduleDraw);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  void load();
  scheduleDraw();

  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("resize", scheduleDraw);
    document.removeEventListener("visibilitychange", scheduleDraw);
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
    if (model) disposeModel(model);
    releasePaper?.();
    renderer.dispose();
  }
  return { updateDistricts, dispose };
}
