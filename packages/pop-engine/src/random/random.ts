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

export function integer(random: Random, minimum: number, maximum: number) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function pick<T>(random: Random, values: readonly T[]): T {
  if (values.length === 0) throw new Error("Cannot choose from an empty collection.");
  return values[integer(random, 0, values.length - 1)]!;
}
