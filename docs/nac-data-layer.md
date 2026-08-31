# NAC data layer

Code: `src/services/nac/`. For rendering conventions once the data is in hand (danger colors, known display discrepancies), see [`nac-data-display.md`](./nac-data-display.md).

Native product pages (forecast, warning, …) read NAC/AFP product data through this layer. Pages never touch a raw API response — they consume a **normalized model** produced by a **per-product source adapter**. That seam is what lets us:

- swap a product's backend (legacy **v2** → NAC **v3**) with no change to presentation,
- recombine products into new layouts (a _view_ composes several products), and
- roll a product out to native per center, with instant rollback.

## The pieces

All paths are under `src/services/nac/`.

| Path                       | Role                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `model/forecast.ts`        | The **normalized model** — API-shape-agnostic types the components depend on.                                                 |
| `sources/`                 | The **adapter**: `ForecastSource`/`WarningSource` interfaces, a `v2/` implementation, and `config.ts` (which backend to use). |
| `types/forecastSchemas.ts` | The **v2 wire schema** (zod) + shared leaf domain types. Validation/parsing only.                                             |

```
page / component ──▶ getForecastSource(center).getForecast(...)   // sources/index.ts
                            │
                            ▼
                     forecastSourceV2  ──▶ fetchForecast (nac.ts, hits v2, zod-parses)
                            │                    │
                            ▼                    ▼
                     mapV2ForecastResult(wire) ─▶ NormalizedForecast        // model
```

**Model vs wire.** The model **owns the top-level product types** (`Forecast`, `Warning`, …) and **reuses the leaf types** (a danger level, an avalanche problem) from the wire schema. The mapper is where backend quirks get absorbed — e.g. v2 returns a null-object when there's no active warning, and the model collapses that to plain `null`, so no consumer special-cases it. For v2 the shapes already line up, so the mappers are mostly structural; a future v3 mapper targets the same model and is the _only_ place v3's deviations live.

**Dependency direction is one-way:** components → model → (leaf re-exports) wire. The model never imports a source; sources import the model. Don't make the model depend on a backend.

## Two controls (don't conflate them)

- **Rollout — native vs widget.** Per-tenant × per-product, in the Payload `Settings` collection (`nativeProducts: { forecast, warning }`), read via `getNativeProductFlag`. Center-admin-facing; this is _which renderer_ a center sees.
- **Data source — v2 vs v3.** Code/env config in `sources/config.ts`, uniform across tenants (with a per-center v3 canary allowlist). **Not** a Setting — an admin can't point a live page at an unverified backend, and the test matrix stays small. This is _where the data comes from_.

## Extending it

- **Flip a center to the native forecast:** toggle `nativeProducts.forecast` in its Settings.
- **Move a product to v3:** implement `sources/v3/`, wire it into `getForecastSource` / `getWarningSource`, then set `NAC_FORECAST_SOURCE=v3` (or add the center to the canary allowlist). No component changes.
- **Add a new product (observation, map-layer, …):** define its model type, add a `<Product>Source` interface + a source impl with a mapper, and (if it has a native page) a `nativeProducts.<product>` rollout flag.
