# First playable slice

Run `bun run dev:web` or `bun run dev`. Create a named character, commit to a project, and advance days. Supporting “Light the walk home” from the opening day provides a tested route to the requirements for leading a street cleanup. Both sides and both outcomes use rewards defined by content.

Game state is in memory. Reloading starts again with the same seed. Existing desktop preferences and scaffold storage are unrelated to the game and remain untouched.

## Ownership

- `@pop/simulation` exposes an Effect `Simulation` service. It owns the scoped ECS world, schema-validated commands, daily orchestration, progress, and rewards. Public IDs are independent of recycled ECS handles. Observations are detached copies.
- `@pop/content` supplies immutable-by-session definitions and starting-world configuration. It imports simulation contracts; the simulation never imports the catalog.
- `@pop/game-client` owns a `ManagedRuntime` per session and publishes completed observations. It binds commands to the player's character and translates typed failures into interface feedback. React subscribes to it; it has no React dependency. Disposal releases the runtime; hot module replacement disposes the old session.
- `pop-web` renders the game in both browser and Electron. It does not mutate simulation state or call persistence for gameplay.

Package directories use `pop-`; imports use the `@pop/` scope. `packages/pop-contracts` (`@pop/contracts`) owns the existing desktop bridge contracts. Game commands and observations belong to `@pop/simulation/contracts`, alongside the simulation that defines them; the desktop bridge is not a shared bucket for game types.

### Module layout

- `pop-simulation/src/simulation.ts` is the session service and composition boundary. `contracts.ts` and `errors.ts` describe its public inputs, observations, and failures. `internal/` contains ECS storage, reward allocation, validated configuration, seeded randomness, and the NPC policy implementation. Package exports expose the service and NPC policy extension point, not storage or random checkpoint machinery.
- `pop-content/src/projects.ts` holds authored project definitions; `world.ts` holds the starting district and character generation settings. `content.ts` assembles the catalog. Its package entry point exports only that catalog.
- `pop-game-client/src/client.ts` owns runtime lifecycle, player-bound actions, validation feedback, and snapshot subscriptions together. Its `index.ts` declares the public API. A client action such as `createProject` translates player intent; eligibility, commitments, and mutations remain simulation responsibilities.
- `pop-web/src/features/game/` owns the game screen, arrival form, project panels, people view, formatting, and styles. The screen wires the client and content; panels receive those dependencies as inputs. The home route only selects the screen.

Keep a rule and its invariants together. Do not split commands into forwarding files or expose ECS components merely to make files shorter. Extract a module when it can own a coherent decision behind a small interface. Behavior tests stay beside the module they verify; shared simulation fixtures live under `test/`.

bitECS uses per-world component stores. Commitments are entities, uniquely indexed by character and project. Indexes contain handles, not duplicate balances. Total influence is stored; available influence and project support/opposition are derived from active commitments. Progress and accumulated influence-days are stored historical quantities.

The simulation currently runs synchronously in the renderer. Its bounded daily work is measured independently of rendering; a worker is not needed for the first 100-character slice. No storage, worker transport, save format, map, or speculative generic activity framework is introduced.

## Effect execution and lifecycle

`simulationLayer(content, options)` composes `ContentCatalog`, `SessionConfig`, `SimulationRandom`, `NpcPolicy`, and `Simulation`. Config and command types are inferred from their Effect Schemas. Structural decoding and content cross-reference checks happen before use. Invalid content, session options, command payloads, and rule violations remain distinct typed errors.

Each session has its own Layer memoization scope and random streams. The simulation acquires and releases its ECS store through `Effect.acquireRelease`. A semaphore serializes commands, read snapshots, and disposal. Captured services reject use after disposal. Closing a session releases its state; starting another session builds a fresh world.

NPC decision-making is an injected Effect service. It receives a detached, purpose-specific observation of local projects and available characters. Its entire action batch is validated before mutation, including a maximum of one commitment per NPC and no actions for the player. Rejected or interrupted preparation restores the random checkpoint. Applying commitments, advancing projects, allocating rewards, and releasing influence form one synchronous commit phase. An interruption after that commit does not undo the day. Unexpected defects close the session rather than permitting further writes to potentially inconsistent state.

Runtime runners live at application/test/benchmark boundaries, not inside the simulation. The current UI adapter uses `ManagedRuntime.runSync` because the supplied policy and all game operations are synchronous. An asynchronous policy is supported by the simulation service and tested using Effect fibers; using it in the UI would require an asynchronous client bridge. Pure arithmetic and tight ECS loops remain ordinary functions executed inside Effect operations.

## Rules

The player begins with zero reputation, zero popularity, and one influence. A character can commit positive whole amounts across projects in their current zone. One side per project; additional commitments are allowed, withdrawal and switching are not.

Creation requires the authored reputation/popularity thresholds and at least one available influence. Thresholds are not spent. The creator's deposit becomes an ordinary supporting commitment. A zone can have only one active instance of each project type; a character may lead several types. Resolution immediately makes the type available again.

On next day:

1. NPCs independently choose zero or one deposit from the same pre-decision state, after the player's actions. Policies use bounded random choices among local active projects.
2. Apply those deposits through the same validation used for player commands.
3. Advance one day and add each commitment's current influence to its influence-day weight.
4. Add support minus opposition to progress, clamped between zero and the target.
5. Resolve success upon reaching the target, including on the deadline day. Otherwise, fail at the deadline.
6. Distribute rewards, remove active commitments, and publish the completed world. Returned influence cannot be reused inside that day.

Each project defines a reward vector for each side and the creator, separately for success and failure. Each side's pool is divided by its participants' accumulated influence-days. Whole allocations use largest remainders, with seeded tie-breaking and exact integer arithmetic. Empty sides receive nothing. Creator bonuses are separate. Influence always returns.

The UI retains the latest 40 resolved projects with participants, weights, and payouts. Old outcomes leave this deliberately bounded, in-memory recent-history buffer. Active simulation queries never process resolved projects.

## Randomness

The UI's fixed unsigned 32-bit seed is `20260906`. The `SimulationRandom` service supplies separate named streams for world resource generation, cosmetic names, NPC decisions, and reward ties. No simulation decisions use wall-clock time or `Math.random()`. Identical content, seed, and player actions reproduce the same results. Random outcomes can intentionally change when gameplay code or content changes; there is no persisted compatibility contract.

## Scope and checks

One zone, 99 NPCs, five initial projects, and six authored project types. NPCs join projects but do not create further projects yet. The player can create and repeat eligible projects. Influence capacity does not grow yet. These are balance experiments, not a full career economy. Waiting out all initial opportunities without earning eligibility can exhaust the opening; reload to try another approach.

- `bun run test:game` checks domain behavior, schemas and typed errors, seeded replay, concurrent commands, interruption recovery, scope disposal, client publication, and the authored progression path. No UI tests.
- `bun run typecheck:game` checks the affected game packages and web frontend.
- `bun run build:web` builds the shared browser/desktop interface.
- `bun run benchmark:game` measures daily advancement plus UI observation at 100 and 1,000 characters, with five warm-up worlds and 400 measured days per population. It excludes rendering and is not a browser benchmark.

Browser and computer-control verification require explicit approval under the repository instructions.
