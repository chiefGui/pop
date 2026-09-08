import { Context, Effect, Layer } from "effect";
import { createRandom } from "@pop/engine";
import type { Random } from "@pop/engine";

export interface RandomCheckpoint {
  readonly world: number;
  readonly names: number;
  readonly birthdays: number;
  readonly decisions: number;
  readonly rewards: number;
}

export class SimulationRandom extends Context.Service<
  SimulationRandom,
  {
    readonly world: Random;
    readonly names: Random;
    readonly birthdays: Random;
    readonly decisions: Random;
    readonly rewards: Random;
    readonly capture: () => RandomCheckpoint;
    readonly restore: (checkpoint: RandomCheckpoint) => void;
  }
>()("@pop/game/SimulationRandom") {
  static layer(seed: number) {
    return Layer.effect(
      SimulationRandom,
      Effect.sync(() => {
        const streams = {
          world: createRandom(seed, "world"),
          names: createRandom(seed, "names"),
          birthdays: createRandom(seed, "birthdays"),
          decisions: createRandom(seed, "decisions"),
          rewards: createRandom(seed, "reward-ties"),
        };
        return SimulationRandom.of({
          ...streams,
          capture: () => ({
            world: streams.world.getState(),
            names: streams.names.getState(),
            birthdays: streams.birthdays.getState(),
            decisions: streams.decisions.getState(),
            rewards: streams.rewards.getState(),
          }),
          restore: (checkpoint) => {
            streams.world.restore(checkpoint.world);
            streams.names.restore(checkpoint.names);
            streams.birthdays.restore(checkpoint.birthdays);
            streams.decisions.restore(checkpoint.decisions);
            streams.rewards.restore(checkpoint.rewards);
          },
        });
      }),
    );
  }
}
