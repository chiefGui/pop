import { Effect, ManagedRuntime } from "effect";
import { Simulation, simulationLayer } from "@pop/simulation";
import { gameContent } from "./index";

// Measures the Effect command + detached UI observation path, excluding rendering.
for (const population of [100, 1000]) {
  const durations: number[] = [];
  for (let run = 0; run < 30; run += 1) {
    const content = { ...gameContent, world: { ...gameContent.world, npcCount: population - 1 } };
    const runtime = ManagedRuntime.make(
      simulationLayer(content, { seed: 20260906 + run, playerName: "Benchmark" }),
    );
    try {
      const simulation = runtime.runSync(Simulation);
      for (let day = 0; day < 16; day += 1) {
        const before = performance.now();
        runtime.runSync(simulation.dispatch({ type: "advance-day" }));
        const duration = performance.now() - before;
        if (run >= 5) durations.push(duration);
      }
    } finally {
      Effect.runSync(runtime.disposeEffect);
    }
  }
  durations.sort((left, right) => left - right);
  const mean = durations.reduce((total, value) => total + value, 0) / durations.length;
  const p95 = durations[Math.floor(durations.length * 0.95)]!;
  console.log(
    `${population} characters · ${durations.length} measured days · mean ${mean.toFixed(3)} ms · p95 ${p95.toFixed(3)} ms`,
  );
}
