import { useState } from "react";
import type { FormEvent } from "react";
import type { GameClient } from "@pop/game-client";

export function StartScreen({ client, error }: { client: GameClient; error: string | null }) {
  const [name, setName] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    client.start(name);
  }
  return (
    <div className="game arrival">
      <header className="arrival-brand">
        <span className="wordmark">pop.</span>
        <span>A small beginning</span>
      </header>
      <main className="arrival-main">
        <div className="eyebrow">01 / Foundry District</div>
        <h1>
          Every name
          <br />
          starts somewhere.
        </h1>
        <p className="arrival-copy">
          A district full of plans. A hundred people making their moves.
          <br />
          You have one influence, no reputation, and a place to begin.
        </p>
        <form className="arrival-form" onSubmit={submit}>
          <label htmlFor="character-name">What’s your name?</label>
          <div className="arrival-input-row">
            <input
              id="character-name"
              name="name"
              autoComplete="off"
              placeholder="Your character’s name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              required
            />
            <button className="button primary" type="submit" disabled={!name.trim()}>
              Enter the district <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="feedback" role="alert">
            {error}
          </div>
        </form>
        <ol className="arrival-steps">
          <li>
            <span>01</span>
            <strong>Take a side</strong>
            <p>Commit influence to support or oppose a project.</p>
          </li>
          <li>
            <span>02</span>
            <strong>Make your name</strong>
            <p>Earn a share of its rewards when it resolves.</p>
          </li>
          <li>
            <span>03</span>
            <strong>Lead something</strong>
            <p>Build enough standing to start a project of your own.</p>
          </li>
        </ol>
      </main>
      <footer className="arrival-footer">Foundry District · January 2026</footer>
    </div>
  );
}
