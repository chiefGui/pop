# City map asset

`city-map.glb` is the prepared 15-district model. Districts are visual assets, not simulation zones. It contains geometry, stable district identifiers and neutral material roles, with no labels or external resources. District colors, paper grain and lighting are applied by the renderer at runtime.

Vite packages the asset as a separate, lazily imported base64 module. This lets the same loader work on the web and in the packaged desktop app's `file://` origin without network access or additional protocol handling.

Regenerate from the repository root with `bun run --cwd apps/pop-web generate:city-map`.

The source of truth is `apps/pop-web/scripts/city-map/geography.ts`: an original fictional city plan, with no imported geographic coordinates. Shared boundaries connect surveyed blocks, occasional administrative steps, a winding central watercourse and a southern estuary. These are drawing conventions rather than a simulation of terrain or hydrology. Each shared boundary is authored once and traversed in opposite directions by its neighboring districts.

`geometry.ts` prepares the beveled geometry; `generate.ts` exports GLB. The generated asset is kept in the repository so normal development and production builds do not require regeneration. To change the layout, edit junctions and boundaries in the source, run its geometry tests, then regenerate the asset.

## Runtime district data

`../districts.ts` owns the initial frontend names and access states. `<CityMap districts={districts} />` accepts replacement data; names are not currently displayed. Keep IDs stable when renaming districts. Updates require one entry per geometry ID and a boolean `locked` state.

Changing names or access states does not require running the generator. The renderer retains the loaded geometry and applies colors to independent district materials, including the paper edge tint. Invalid updates report an error and leave the previous palette intact; corrected data can be applied without reloading. Regenerate only for changes to boundaries, bevel geometry or the set of geometry IDs.

The shared access palette lives in `../map-appearance.ts`: locked districts use charcoal and unlocked districts use muted oxblood. Foundry starts unlocked; the other districts start locked. Face, bevel and side colors update together when access changes.
