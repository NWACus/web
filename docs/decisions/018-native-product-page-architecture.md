# Native product page architecture

Date: 2026-08-11

Status: accepted

## Context

The native product pages replace the embedded afp widgets with pages this codebase renders itself. Two forces shape the design:

- **The data source is going to change.** Products come from NAC's v2 API today. A v3 API is planned but its deployment is unverified, and different products may migrate at different times, per center. We need to be able to move one product for one center without touching presentation code.
- **Two backends describe the same domain differently.** v2 represents "no active warning" as a null-object; v3 will not. Leaking those quirks into components means every component learns both wire formats.

This ADR was referenced by `src/services/nac/model/forecast.ts` from the start but never written. It is recorded here after the fact, describing the architecture as built.

## Decision

**A normalized model sits between the API and the components.** `src/services/nac/model/` owns the shapes components consume — `Forecast`, `Summary`, `Warning`, `Weather`. Components depend on these types and never on a raw API response.

**Per-product source adapters map each backend into the model.** `src/services/nac/sources/` exposes `getForecastSource(center)`, `getWarningSource(center)`, `getWeatherSource(center)`, `getMapLayerSource(center)`, each resolving the configured backend for that product and center. Swapping a product from v2 to v3 is a config change behind the adapter.

**Top-level product types are owned by the model; leaf domain types are reused.** A danger level, an avalanche problem, and a media item mean the same thing across backends, so those live in `src/services/nac/types/forecastSchemas.ts` (with their zod schemas) and are re-exported from the model. Deviations between backends get absorbed by the mappers at the product level, where they actually differ.

**`model/forecast.ts` is the single import surface.** Consumers import model types from there, not from `types/forecastSchemas`. That is why it re-exports leaf types it does not define.

## Consequences

- Presentation is insulated from the v2→v3 migration; the blast radius of a backend change is one adapter.
- The model barrel's re-exports have no direct consumers of their own, so dead-code analysis reads them — and transitively their sources in `types/forecastSchemas.ts` — as unused. `.fallowrc.json` declares both as public surfaces under `ignoreExports`, the same treatment `src/components/ui/**` gets. The trade-off is that genuinely dead types in those two files will not be flagged; they are public API by intent, so that is accepted.
- Enums reached only through `z.nativeEnum` look unused to static analysis, because zod validates against member *values* rather than referencing members by name. Those members are load-bearing — removing one makes zod reject real forecast data — and carry per-member `fallow-ignore-next-line unused-enum-member` suppressions with a docblock explaining why.
- Selecting a v3 source before that backend is confirmed deployed throws rather than silently failing, so a misconfiguration surfaces immediately.
