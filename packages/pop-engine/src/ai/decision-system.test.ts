import { expect, test } from "vite-plus/test";
import { Effect } from "effect";
import { firstProposal, makeDecisionSystem } from "#engine/ai/decision-system";
import type { Behavior, Selection } from "#engine/ai/decision-system";

type Actor = { readonly id: string; readonly enabled: boolean };
type Action = { readonly actorId: string; readonly value: number };
const primary: Behavior<Actor, Action> = {
  id: "primary",
  propose: (actor) => {
    if (!actor.enabled) return [];
    return [{ actorId: actor.id, value: 1 }];
  },
};
const alternate: Behavior<Actor, Action> = {
  id: "alternate",
  propose: (actor) => [{ actorId: actor.id, value: 2 }],
};
const actor: Actor = { id: "a", enabled: true };

test("composes behaviors, resolves competing proposals, and exposes attribution", () => {
  const system = Effect.runSync(
    makeDecisionSystem({ behaviors: [primary, alternate], select: firstProposal }),
  );
  const batch = Effect.runSync(system.decide([actor]));
  const decision = batch.decisions[0]!;
  expect(decision.context).toBe(actor);
  expect(decision.proposals.map((proposal) => proposal.behaviorId)).toEqual([
    "primary",
    "alternate",
  ]);
  expect(decision.selected).toBe(decision.proposals[0]);
  expect(batch.actions).toEqual([{ actorId: "a", value: 1 }]);
  expect(
    Effect.runSync(system.decide([{ ...actor, enabled: false }])).decisions[0]!.selected
      ?.behaviorId,
  ).toBe("alternate");
});

test("removing a behavior and replacing selection need no scheduler changes", () => {
  const last: Selection<Actor, Action> = (_actor, proposals) => proposals.at(-1);
  const system = Effect.runSync(
    makeDecisionSystem({ behaviors: [primary, alternate], select: last }),
  );
  expect(Effect.runSync(system.decide([actor])).actions[0]!.value).toBe(2);
  const reduced = Effect.runSync(
    makeDecisionSystem({ behaviors: [alternate], select: firstProposal }),
  );
  expect(
    Effect.runSync(reduced.decide([actor])).decisions[0]!.proposals.map(
      (proposal) => proposal.behaviorId,
    ),
  ).toEqual(["alternate"]);
});

test("empty registries and abstaining selectors produce no actions", () => {
  const empty = Effect.runSync(
    makeDecisionSystem<Actor, Action>({ behaviors: [], select: firstProposal }),
  );
  const abstaining = Effect.runSync(
    makeDecisionSystem({ behaviors: [primary], select: () => undefined }),
  );
  expect(Effect.runSync(empty.decide([actor])).actions).toEqual([]);
  expect(Effect.runSync(abstaining.decide([actor])).actions).toEqual([]);
});

test("rejects ambiguous registrations and fabricated selections", () => {
  for (const behaviors of [[primary, primary], [{ ...primary, id: "" }]]) {
    expect(
      Effect.runSync(Effect.result(makeDecisionSystem({ behaviors, select: firstProposal }))),
    ).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "InvalidBehaviors" },
    });
  }
  const system = Effect.runSync(
    makeDecisionSystem({
      behaviors: [primary],
      select: () => ({ behaviorId: "invented", action: { actorId: "a", value: 99 } }),
    }),
  );
  expect(() => Effect.runSync(system.decide([actor]))).toThrow(
    "Selection must return one of the evaluated proposals",
  );
});
