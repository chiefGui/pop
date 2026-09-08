import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { Box3, Color, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { bindDistrictAppearance } from "./map-appearance";
import { cityDistricts } from "./districts";

test("the city asset loads offline with 15 beveled districts and valid geometry", async () => {
  const binary = readFileSync(new URL("./assets/city-map.glb", import.meta.url));
  expect(binary.toString("utf8", 0, 4)).toBe("glTF");
  const jsonLength = binary.readUInt32LE(12);
  const manifest = JSON.parse(binary.toString("utf8", 20, 20 + jsonLength));
  for (const buffer of manifest.buffers) expect(buffer.uri).toBeUndefined();
  expect(manifest.images).toBeUndefined();
  const data = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
  const asset = await new GLTFLoader().parseAsync(data, "");
  const city = asset.scene.getObjectByName("city-map")!;
  expect(city).toBeDefined();
  expect(city.userData.districtCount).toBe(15);
  expect(city.children).toHaveLength(15);
  expect(new Set(city.children.map((district) => district.name)).size).toBe(15);
  for (const district of city.children) {
    const bounds = new Box3().setFromObject(district);
    expect(bounds.isEmpty()).toBe(false);
    expect(bounds.min.y).toBeCloseTo(-0.012);
    expect(bounds.max.y).toBeCloseTo(0.213);
  }
  const geometry = new Map<Mesh, unknown>();
  city.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometry.set(object, object.geometry);
    expect(object.material.color.getHex()).toBe(0xffffff);
  });
  const update = bindDistrictAppearance(asset.scene);
  update(cityDistricts);
  const faceColors = () => {
    const result = new Map<string, number>();
    for (const district of city.children) {
      district.traverse((object) => {
        if (object instanceof Mesh && object.material.name === "paper-face")
          result.set(district.name, object.material.color.getHex());
      });
    }
    return result;
  };
  const before = faceColors();
  expect(before.size).toBe(15);
  expect(before.get("foundry")).toBe(new Color("#723c43").getHex());
  for (const [id, color] of before) {
    if (id !== "foundry") expect(color).toBe(new Color("#363538").getHex());
  }
  const changed = cityDistricts.map((district) => {
    if (district.id === "northwood")
      return { ...district, name: "New display name", locked: false };
    return district;
  });
  update(changed);
  expect(faceColors().get("northwood")).toBe(before.get("foundry"));
  for (const [id, color] of before) {
    if (id !== "northwood") expect(faceColors().get(id)).toBe(color);
  }
  for (const [mesh, original] of geometry) expect(mesh.geometry).toBe(original);
  const after = faceColors();
  expect(() => update(changed.slice(1))).toThrow("Missing district");
  expect(() => update([...changed, changed[0]!])).toThrow("Duplicate district");
  expect(() => update([{ id: "unknown", name: "Unknown", locked: true }])).toThrow(
    "Unknown district",
  );

  expect(faceColors()).toEqual(after);
  update(cityDistricts);
  expect(faceColors()).toEqual(before);

  const materialRoles = new Set<string>();
  city.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    expect(Array.from(object.geometry.attributes.position!.array).every(Number.isFinite)).toBe(
      true,
    );
    expect(object.geometry.attributes.uv).toBeDefined();
    expect(object.material).toBeInstanceOf(MeshStandardMaterial);
    materialRoles.add(object.material.name);
    object.geometry.dispose();
    object.material.dispose();
  });
  expect(materialRoles).toEqual(new Set(["paper-edge", "paper-side", "paper-face"]));
});
