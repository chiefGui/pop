import type { WorldView } from "@pop/simulation";

export function People({ world }: { world: WorldView }) {
  return (
    <section className="people-panel">
      <div className="eyebrow">The neighborhood</div>
      <h2>People of Foundry</h2>
      <p className="muted">Everyone has their own resources. Everyone plays by the same rules.</p>
      <div className="people-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reputation</th>
              <th>Popularity</th>
              <th>Influence available</th>
            </tr>
          </thead>
          <tbody>
            {world.characters.map((character) => (
              <tr key={character.id}>
                <th scope="row">
                  {character.name}
                  {character.isPlayer && <span className="you-label">You</span>}
                </th>
                <td>{character.reputation}</td>
                <td>{character.popularity}</td>
                <td>
                  {character.availableInfluence} / {character.influence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
