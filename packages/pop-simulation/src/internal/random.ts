import { Context, Effect, Layer } from "effect";
import { SessionConfig } from "./config";

// Independent streams keep cosmetic generation and reward ties out of NPC decisions.
export function createRandom(seed: number, stream: string) {
  let state = seed >>> 0;
  for (let index = 0; index < stream.length; index += 1) {
    state = Math.imul(state ^ stream.charCodeAt(index), 16777619) >>> 0;
  }
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return Object.assign(next, {
    getState: () => state,
    restore: (checkpoint: number) => {
      state = checkpoint;
    },
  });
}

export type Random = ReturnType<typeof createRandom>;
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

export function integer(random: Random, minimum: number, maximum: number) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function pick<T>(random: Random, values: readonly T[]): T {
  if (values.length === 0) throw new Error("Cannot choose from an empty collection.");
  return values[integer(random, 0, values.length - 1)]!;
}
