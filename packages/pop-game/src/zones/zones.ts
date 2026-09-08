import { addComponent, addEntity } from "bitecs";
import type { World } from "bitecs";
import type { Zone, ZoneId } from "#game/zones/zone";

export function createZones(world: World) {
  const ZoneData: Zone[] = [];
  const entities = new Map<ZoneId, number>();
  return {
    add(zone: Zone) {
      if (entities.has(zone.id)) throw new Error("Duplicate zone identity: " + zone.id);
      const entity = addEntity(world);
      addComponent(world, entity, ZoneData);
      ZoneData[entity] = Object.freeze({ ...zone });
      entities.set(zone.id, entity);
    },
    get(id: ZoneId) {
      const entity = entities.get(id);
      if (entity !== undefined) return ZoneData[entity]!;
    },
    clear() {
      ZoneData.length = 0;
      entities.clear();
    },
  };
}
