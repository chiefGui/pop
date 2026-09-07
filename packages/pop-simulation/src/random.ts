import { Context, Effect, Layer } from "effect";
import { SessionConfig } from "./config";
import { createRandom } from "./kernel/random";
import type { Random } from "./kernel/random";

export interface RandomCheckpoint {
  readonly world: number;
  readonly names: number;
  readonly decisions: number;
  readonly rewards: number;
}

export class SimulationRandom extends Context.Service<
  SimulationRandom,
  {
    readonly world: Random;
    readonly names: Random;
    readonly decisions: Random;
    readonly rewards: Random;
    readonly capture: () => RandomCheckpoint;
    readonly restore: (checkpoint: RandomCheckpoint) => void;
  }
>()("@pop/simulation/SimulationRandom") {
  static readonly layer = Layer.effect(
    SimulationRandom,
    Effect.gen(function* () {
      const { seed } = yield* SessionConfig;
      const streams = {
        world: createRandom(seed, "world"),
        names: createRandom(seed, "names"),
        decisions: createRandom(seed, "decisions"),
        rewards: createRandom(seed, "reward-ties"),
      };
      return SimulationRandom.of({
        ...streams,
        capture: () => ({
          world: streams.world.getState(),
          names: streams.names.getState(),
          decisions: streams.decisions.getState(),
          rewards: streams.rewards.getState(),
        }),
        restore: (checkpoint) => {
          streams.world.restore(checkpoint.world);
          streams.names.restore(checkpoint.names);
          streams.decisions.restore(checkpoint.decisions);
          streams.rewards.restore(checkpoint.rewards);
        },
      });
    }),
  );
}
