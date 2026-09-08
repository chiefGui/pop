import { CanvasTexture, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import type { Object3D } from "three";

export function applyMapMaterials(model: Object3D, anisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the map paper texture.");
  let seed = 85131;
  function noise() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const pixels = context.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = Math.round(235 + noise() * 20);
    pixels.data[i] = grain;
    pixels.data[i + 1] = grain;
    pixels.data[i + 2] = grain;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  context.strokeStyle = "rgba(94,88,75,0.045)";
  context.lineWidth = 0.55;
  context.beginPath();
  for (let i = 0; i < 1800; i++) {
    const x = noise() * 1024;
    const y = noise() * 1024;
    context.moveTo(x, y);
    context.lineTo(x + noise() * 5 - 2.5, y + noise() * 3 + 1);
  }
  context.stroke();
  const paper = new CanvasTexture(canvas);
  paper.colorSpace = SRGBColorSpace;
  paper.anisotropy = Math.min(4, anisotropy);
  try {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      let materials = [object.material];
      if (Array.isArray(object.material)) materials = object.material;
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial))
          throw new Error("Unsupported city map material.");
        material.map = paper;
        if (material.name === "paper-face") {
          material.bumpMap = paper;
          material.bumpScale = 0.012;
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -1;
        }
        material.needsUpdate = true;
      }
    });
  } catch (cause) {
    paper.dispose();
    throw cause;
  }
  return () => paper.dispose();
}
