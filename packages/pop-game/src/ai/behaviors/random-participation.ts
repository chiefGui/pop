import { pick } from "@pop/engine";
import type { Behavior, Random } from "@pop/engine";
import type { NpcContext } from "#game/ai/context";
import type { NpcSettings } from "#game/ai/settings";
import type { CommitAction } from "#game/projects";
import type { Side } from "#game/projects";

export function randomParticipation(
  config: NpcSettings,
  random: Random,
): Behavior<NpcContext, CommitAction> {
  return {
    id: "random-participation",
    propose({ character, projects }) {
      if (character.availableInfluence < 1) return [];
      if (projects.length === 0 || random() >= config.participationChance) return [];
      const project = pick(random, projects);
      let side: Side = "oppose";
      if (random() < config.supportChance) side = "support";
      const existing = project.sides.get(character.id);
      if (existing !== undefined) side = existing;
      return [{ type: "commit", actorId: character.id, projectId: project.id, side, influence: 1 }];
    },
  };
}
