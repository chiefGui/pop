# Pop

Requires Bun 1.4.2 and Node.js 24.11+.

```sh
bun install
bun run dev
```

- `bun run dev:web` — browser preview
- `bun run check` — lint, format, and type checks
- `bun run make` — package desktop app
- `bun reset` — delete Pop's local profile, including caches
- `bun db:reset` — delete SQLite data only
- `bun store:reset` — reset preferences only

Close Pop before resetting. Add `--dry-run` to inspect paths. `POP_USER_DATA_DIR` overrides the profile location.
