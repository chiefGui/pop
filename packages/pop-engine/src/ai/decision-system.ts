import { Effect, Schema } from "effect";

export interface Behavior<Context, Action> {
  readonly id: string;
  readonly propose: (context: Context) => readonly Action[];
}
export interface Proposal<Action> {
  readonly behaviorId: string;
  readonly action: Action;
}
export interface Decision<Context, Action> {
  readonly context: Context;
  readonly proposals: readonly Proposal<Action>[];
  readonly selected: Proposal<Action> | undefined;
}
export type Selection<Context, Action> = (
  context: Context,
  proposals: readonly Proposal<Action>[],
) => Proposal<Action> | undefined;

export class InvalidBehaviors extends Schema.TaggedError<InvalidBehaviors>()("InvalidBehaviors", {
  message: Schema.String,
}) {}

export function firstProposal<Context, Action>(
  _context: Context,
  proposals: readonly Proposal<Action>[],
): Proposal<Action> | undefined {
  return proposals[0];
}

// Behaviors are stateless. Persistent intentions must be returned as game-owned actions.
export const makeDecisionSystem = Effect.fn("makeDecisionSystem")(function* <
  Context,
  Action,
>(options: {
  readonly behaviors: readonly Behavior<Context, Action>[];
  readonly select: Selection<Context, Action>;
}) {
  const behaviors = options.behaviors.map((behavior) => ({ ...behavior }));
  const select = options.select;
  const ids = new Set<string>();
  for (const behavior of behaviors) {
    if (!behavior.id || ids.has(behavior.id)) {
      return yield* new InvalidBehaviors({
        message: `Behavior IDs must be nonempty and unique: ${behavior.id}`,
      });
    }
    ids.add(behavior.id);
  }
  const evaluate = (context: Context): Decision<Context, Action> => {
    const proposals: Proposal<Action>[] = [];
    for (const behavior of behaviors) {
      for (const action of behavior.propose(context))
        proposals.push({ behaviorId: behavior.id, action });
    }
    const selected = select(context, proposals);
    if (selected !== undefined && !proposals.includes(selected)) {
      throw new Error("Selection must return one of the evaluated proposals or abstain.");
    }
    return { context, proposals, selected };
  };
  // Synchronous per-actor evaluation avoids a fiber/effect allocation for every entity.
  const decide = Effect.fn("DecisionSystem.decide")((contexts: readonly Context[]) =>
    Effect.sync(() => {
      const actions: Action[] = [];
      const decisions: Decision<Context, Action>[] = [];
      for (const context of contexts) {
        const decision = evaluate(context);
        decisions.push(decision);
        if (decision.selected) actions.push(decision.selected.action);
      }
      return { actions, decisions };
    }),
  );
  return { decide };
});
