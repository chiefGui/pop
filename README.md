# Pop

Requires Bun 1.4.2 and Node.js 24.11+.

```sh
bun install
bun run dev
```

- `bun run dev:web` — browser preview
- `bun run test:game` — focused simulation, content, and game-client tests
- `bun run typecheck:game` — scoped game and frontend type checks
- `bun run benchmark:game` — simulation turn timing at 100 and 1,000 characters
- `bun run check` — lint, format, and type checks
- `bun run make` — package desktop app
- `bun reset` — delete Pop's local profile, including caches
- `bun db:reset` — delete SQLite data only
- `bun store:reset` — reset preferences only

Close Pop before resetting. Add `--dry-run` to inspect paths. `POP_USER_DATA_DIR` overrides the profile location.

The game is an in-memory playable slice: create a character, support or oppose local projects, earn standing, and lead your first project. Reloading starts the same seeded world again. See [the game slice notes](docs/game-slice.md) for rules, architecture, and current limits.
