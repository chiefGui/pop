import { Color, Mesh, MeshStandardMaterial } from "three";
import type { Object3D } from "three";
import type { CityDistrict } from "./districts";

const palette = {
  locked: {
    face: new Color("#363538"),
    edge: new Color("#464448"),
    side: new Color("#252427"),
  },
  unlocked: {
    face: new Color("#723c43"),
    edge: new Color("#723c43").lerp(new Color(0xc7bca7), 0.18),
    side: new Color(0x73695d),
  },
};

export function bindDistrictAppearance(model: Object3D) {
  const city = model.getObjectByName("city-map");
  if (!city) throw new Error("The asset has no city map.");
  const districtMaterials = new Map<string, MeshStandardMaterial[]>();
  const originals = new Set<MeshStandardMaterial>();
  for (const district of city.children) {
    if (districtMaterials.has(district.name)) throw new Error("Duplicate district geometry ID.");
    const materials: MeshStandardMaterial[] = [];
    district.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      function clone(material: MeshStandardMaterial) {
        if (!(material instanceof MeshStandardMaterial))
          throw new Error("Unsupported district material.");
        if (!["paper-face", "paper-edge", "paper-side"].includes(material.name))
          throw new Error(`Unknown district material role: ${material.name}`);
        originals.add(material);
        const copy = material.clone();
        materials.push(copy);
        return copy;
      }
      if (Array.isArray(object.material)) object.material = object.material.map(clone);
      else object.material = clone(object.material);
    });
    districtMaterials.set(district.name, materials);
  }
  for (const material of originals) material.dispose();
  model.visible = false;

  return (districts: readonly CityDistrict[]) => {
    const appearances = new Map<string, typeof palette.locked>();
    for (const district of districts) {
      if (!districtMaterials.has(district.id)) throw new Error(`Unknown district: ${district.id}`);
      if (appearances.has(district.id)) throw new Error(`Duplicate district: ${district.id}`);
      if (typeof district.locked !== "boolean")
        throw new Error(`Invalid access state for district: ${district.id}`);
      let appearance = palette.unlocked;
      if (district.locked) appearance = palette.locked;
      appearances.set(district.id, appearance);
    }
    if (appearances.size !== districtMaterials.size)
      throw new Error("Missing district appearance data.");
    for (const [id, materials] of districtMaterials) {
      const appearance = appearances.get(id)!;
      for (const material of materials) {
        if (material.name === "paper-side") material.color.copy(appearance.side);
        else if (material.name === "paper-edge") material.color.copy(appearance.edge);
        else material.color.copy(appearance.face);
      }
    }
    model.visible = true;
  };
}
