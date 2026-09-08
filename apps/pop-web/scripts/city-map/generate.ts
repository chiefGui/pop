import { writeFile } from "node:fs/promises";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { createRegionGeometry } from "./geometry.ts";
import districts from "./geography.ts";

// GLTFExporter's binary writer uses the browser FileReader interface for Blob conversion.
class BinaryFileReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob): void {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
}
Object.defineProperty(globalThis, "FileReader", { value: BinaryFileReader, configurable: true });

const city = new Group();
city.name = "city-map";
city.userData = {
  districtCount: districts.length,
  source: "Original fictional city geometry, authored as shared boundaries.",
};
for (const district of districts) {
  const geometry = createRegionGeometry(district.points);
  const group = new Group();
  group.name = district.id;
  const edge = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
  });
  edge.name = "paper-edge";
  const side = new MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  side.name = "paper-side";
  const face = new MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  face.name = "paper-face";
  group.add(new Mesh(geometry.body, [edge, side]), new Mesh(geometry.face, face));
  city.add(group);
}

const binary = await new GLTFExporter().parseAsync(city, { binary: true });
if (!(binary instanceof ArrayBuffer)) throw new Error("Expected a binary city map asset.");
const output = new URL("../../src/features/world/city-map/assets/city-map.glb", import.meta.url);
await writeFile(output, new Uint8Array(binary));
console.log(`Generated ${districts.length} districts (${binary.byteLength} bytes).`);
