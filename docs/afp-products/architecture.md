# Native AFP Products — Architecture

How AvyWeb fetches, caches and renders National Avalanche Center product data natively, and why it is built this way. This document covers **how**. What is being built, what isn't, and the row-by-row inventory of legacy widget behavior live in the _Native Product Pages — Scope & Feature Inventory_ doc, and the work itself is tracked from [#1135](https://github.com/NWACus/web/issues/1135).

> **This doc lives alongside the code it describes.** The data layer, source adapters and freshness path are on the `native-product-pages` feature branch and have not reached `main` yet, which is why this document is here rather than on `main` — a description of code that doesn't exist on the branch you're reading would be worse than none.

## The shape

A reader's request for a forecast passes through four layers, each replaceable without disturbing the others.

```
route (RSC)  →  source adapter  →  normalized model  →  presentation components
                      ↑
              AFP API (v2 today, v3 later)
```

The whole design follows from one constraint: **the AFP is rewriting its products API, and we cannot let that rewrite reach our components.** Everything below is a consequence of holding that line.

## Data layer

### Normalized model

`src/services/nac/model/forecast.ts` defines an API-agnostic representation of a forecast, summary, warning and weather product. Presentation components consume only this. **No component ever sees an AFP response.**

The model owns the top-level product types (`Forecast`, `Summary`, `ForecastResult`, `WarningProduct`, `Weather`) and re-exports the leaf enums it shares with the v2 wire schema. The dependency runs one way — model imports from the wire schema, never the reverse — so the wire schema stays a description of what the API sends while the model stays a description of what we need.

Where they differ, the model is opinionated. The clearest case: v2 represents "no active warning" as a null-object with empty fields, and the model represents it as plain `null`. The mapper performs that collapse once, which is why no component carries a "is this warning actually a warning?" check.

### Source adapters

`src/services/nac/sources/` holds one interface per product and one implementation per backend.

`types.ts` defines `ForecastSource`, `WarningSource` and `WeatherSource`. Each has a normal read plus, for the safety-critical products, a `…Fresh` read used by the freshness path:

```ts
export interface ForecastSource {
  getForecast(centerId: string, zoneId: number): Promise<ForecastResult | null>
  getForecastFresh(centerId: string, zoneId: number): Promise<ForecastResult | null>
}
```

`v2/` implements these against the legacy API — `forecastSourceV2`, `warningSourceV2`, `weatherSourceV2`, with the actual translation isolated in `v2/mappers.ts`. **The mappers are the unit-tested seam.** They are pure functions from wire shape to model, which is what makes v2-vs-v3 equivalence a testable claim rather than an aspiration.

`index.ts` resolves which implementation a center gets. Pages call `getForecastSource(centerSlug)` and never import an implementation directly.

The v3 branches exist and currently throw:

```ts
case 'v3':
  throw new Error('NAC v3 forecast source is not implemented yet')
```

That is deliberate — the seam is proven by having two branches, and a misconfiguration fails loudly at the boundary rather than silently serving wrong data. Writing the v3 implementations is real work, not a config flip; see [sharp edges](#sharp-edges).

## Control axes

Four independent controls decide whether a reader sees a native page, and where its bytes come from. **Two are ours and two belong to the AFP.** Confusing them is the most common way to be wrong about why a page is rendering the way it is.

| #   | Control                         | Owner | Where it lives     | Granularity                                    |
| --- | ------------------------------- | ----- | ------------------ | ---------------------------------------------- |
| 1   | **Rollout** — native or widget  | Ours  | Payload `Settings` | per tenant × per product                       |
| 2   | **Data source** — v2 or v3      | Ours  | Code / env         | per product, uniform across tenants (+ canary) |
| 3   | **`platforms.*`** — capability  | AFP   | Center metadata    | per center × per capability                    |
| 4   | **`widget_config.mwf.enabled`** | AFP   | Center metadata    | per center                                     |

They compose in that order. A product renders natively only when the AFP says the center has the capability **and** our rollout flag is on; the data source then decides which backend answers.

### 1. Rollout — a Payload setting

`nativeProducts` in `src/collections/Settings/index.ts` is a group of per-product checkboxes, defaulting to `false`:

> When enabled, these products render natively as Next.js pages on this site's design system instead of the embedded NAC widget. Toggle per product for incremental rollout with instant rollback.

Per-product rather than one switch, so a center can run a native forecast while its observations stay on the widget. This is center-admin-facing on purpose — the people who own the site decide when it changes, and reverting is a checkbox rather than a deploy.

### 2. Data source — code and env, never a setting

`sources/config.ts` reads `NAC_FORECAST_SOURCE` and `NAC_WARNING_SOURCE` (`v2` | `v3`, defaulting to `v2`), plus `NAC_FORECAST_V3_CANARY_CENTERS` / `NAC_WARNING_V3_CANARY_CENTERS` — comma-separated slugs that take v3 regardless of the default.

**This is deliberately not a center-admin setting.** Two reasons: it keeps the test matrix to one dimension instead of one-per-tenant, and it stops an administrator from pointing a live safety page at an unverified backend. Rollout is a content decision; data source is an engineering one.

### 3 and 4. AFP capability flags

`platforms.*` is the AFP's per-center capability feed (`forecasts`, `warnings`, `stations`, `obs`, `weather`), read via `getAvalancheCenterPlatforms`. It gates **above** both of ours — `HomeWarnings` returns `null` on `!platforms.warnings` before any of our logic runs, and tenant provisioning consults it to decide whether a center gets a Mountain Weather page at all.

The consequence that surprises people: **NWAC's `platforms.weather` is hard-coded `false`**, because NWAC forecasts weather in-house rather than through the AFP. Any native mountain-weather work has to account for that gate before it accounts for ours.

## Rendering and caching

| Route                                         | Strategy        | Revalidate | Notes                                                                           |
| --------------------------------------------- | --------------- | ---------- | ------------------------------------------------------------------------------- |
| `/[center]/forecasts/avalanche/[zone]`        | SSG + ISR       | 300s       | `generateStaticParams` over every zone of every center; `dynamicParams = false` |
| `/[center]/forecasts/avalanche/[zone]/[date]` | On-demand + ISR | 30 days    | `dynamicParams = true`, no static params, `robots: noindex`                     |

The current forecast is pre-rendered for every zone, so a request is normally served from a page that already exists — this is where the project's speed benefit comes from. See [ADR 011](../decisions/011-incremental-static-regeneration.md) for the platform's ISR conventions.

Five minutes is a **backstop, not the freshness mechanism**. Historical pages are effectively immutable, hence the 30-day window and no freshness check at all.

Server rendering is the default and the client bundle is deliberately small. The exceptions are genuinely interactive: the danger map (Mapbox), and the archive calendar, which lazily fetches per-month danger colors from a route handler rather than shipping the full product archive.

## Freshness

**The safety-critical part of the system.** These are life-safety products, and a five-minute ISR window is five minutes in which a correction or retraction is not being shown.

`src/app/api/[center]/forecast-freshness/route.ts` (and its warning twin) closes that window. The mechanism:

1. `forecastFingerprint.ts` hashes the **whole normalized product** — `sha1(JSON.stringify(model))`. Hashing everything rather than a timestamp means no category of change can be missed: corrections, retractions, a new bottom line, a danger change, a replacement after expiry.
2. On mount, the client sends the fingerprint of what its page currently shows as `If-None-Match`.
3. The handler fetches the current product fresh and makes **two independent decisions**.

That independence is the subtle part, and the reason this isn't a plain ETag endpoint:

- **Purge the shared cache?** Only when the fresh product genuinely differs from what the cache is serving — decided by server-side comparison, _never_ from the caller's header. The endpoint is unauthenticated, so trusting `If-None-Match` for this would let anyone force repeated purges and amplify load onto the AFP.
- **Refresh this viewer?** Compare the fresh fingerprint against the caller's header. Different → `200`, and their `router.refresh()` re-renders. Same → `304`.

Two failure-mode decisions worth knowing:

- **Failing safe means failing quiet.** An upstream error, a parse failure, or a genuinely absent product all return `304` and purge nothing, so a transient blip can never blank the last-known-good forecast. The ISR window remains the backstop, and a real withdrawal is caught there.
- **Validity never short-circuits the check.** It would be tempting to skip the fetch for a forecast still inside its validity window, but a correction can be published at any time. The fresh check runs on every view, unconditionally.

## Product and View

A **Product** is a unit of data: a source plus a normalized model. A **View** is a composition of products into a layout.

Today the mapping is 1:1 — one view per product — but the data layer is built view-agnostically, and products are fetched independently of the page that shows them. That is what makes a combined map (danger + observations + stations) a new _consumer_ of existing models rather than a data project, and it is the architecture's own test: if that work needs significant new data plumbing, this separation didn't hold.

Layout variants ride on the same separation. The decided approach is an in-code experiment config, deterministic cookie bucketing, and a middleware rewrite to a variant route, with PostHog recording the outcome. Rewriting to a pre-generated variant route is what keeps static generation intact — which is why it beats deciding layout at request time. Explicitly **not** Vercel Edge Config (removed in [ADR 013](../decisions/013-hardcoded-tenant-lookup.md)) and **not** PostHog feature flags (hard-disabled in this app). None of this is built yet, by choice: variants with nothing to compare are cost without benefit.

## Testing seams

- **Mappers, unit-tested.** Pure wire→model functions. Where v2/v3 equivalence gets proven.
- **Freshness and validity logic, unit-tested.** Pure functions over a model.
- **Pages, end-to-end.** The pages are server components, so browser-level request interception cannot see their fetches — Playwright's `route` is blind here. The seam is **MSW intercepting at the Node network layer**, with Playwright driving the browser. Built and documented in [e2e-mocks.md](e2e-mocks.md). One thing worth knowing before touching it: MSW cannot be started from `instrumentation.ts`, because Next skips that hook during a production build — so the mocks are loaded by a `NODE_OPTIONS --import` preload, which is what lets the suite assert against prerendered output rather than a dev render.
- **The contract, upstream.** AvyWeb's wire schema is vendored into the AFP's own parity harness so consumer-breaking drift fails _their_ build, not our readers' pages. Inventory row X11.

Assert what a page renders for a given fixture — danger, problems, bottom line, banner, freshness behavior, flag behavior. Not adapter internals.

### Where test data comes from

Two tiers, deliberately not one corpus.

**v2-sourced products** (forecasts, warnings, map, media) — the AFP's products-api already owns a golden corpus of real, PII-scrubbed v2 responses, with capture, drift-check and scrub tooling around it, because _the producer has a v2→v3 parity obligation_. Consumer-needed shape variants get added there as new cases. **Extend it; do not fork it.**

That corpus is vendored into this repo under `__tests__/e2e/mocks/afp-golden/` with a source commit and a sha256 per file, pending an npm package published from products-api CI. Responses the corpus does not cover yet are captured into a separate `provisional/` staging area, each one blocking a named test and carrying the upstream Case that retires it. What is still missing, and what it costs us, is tabulated in [e2e-mocks.md](e2e-mocks.md).

**Observations** — the observation API has no v2→v3 migration, so there is no parity concern and no corpus. What the tests need is ordinary MSW mocks recorded next to the tests that use them. Do not build a corpus here. Observation records carry observer names and emails, so scrub fixtures even though they are local.

One variant cannot be captured on demand: the map feature's populated warning field only exists while a warning is genuinely active, so it has to be captured opportunistically during the season's first warning. It is both the safety-critical variant and the one most likely to still be uncovered when centers start flipping to native in the fall.

## Sharp edges

Known and deliberate, but easy to be caught by.

- **v3 is a seam, not an implementation.** All three v3 branches throw. Control 2 is complete — env vars, canary allowlists, resolver — which can read as "v3 is a flip away." It isn't.
- **Weather follows forecast.** `getWeatherSource` resolves off the **forecast** selection, because a weather product is fetched by an id the forecast points at. So flipping forecast to v3 drags weather with it, including through the canary allowlist. Live footgun in the canary path.
- **NWAC's weather doesn't come from the AFP.** It is authored in-house and migrating into the AFP stack as the Mountain Weather Forecast variant, with no `weather_product_id` pointer — AM/PM issuances derive from center plus service date. The pointer-driven inline weather summary finds nothing for NWAC.
- **v2 will serve a shape it never used to.** The MWF migration stores an object-shaped variant envelope in `weather_data`. v3 excludes those rows from generic product reads; the legacy PHP v2 does not. That was accepted upstream because "NWAC has no live v2 weather consumers" — and our native pages default to v2, which makes us one. Shape detection must degrade rather than throw.
- **Two weather-table formats.** Chosen by shape detection (`periods` key present → V1, else columns/rows), inherited from the widget.
- **Warning expiry is the API's job, not ours.** The `type=warning` query returns a product only while it is inside its start/end window, approved and uncancelled; otherwise it returns a five-key all-null placeholder. The client check (`published_time` truthy, collapsed to `null` by the mapper) only distinguishes a product from that placeholder. **Do not add a client-side expiry check** — it would double-filter and could hide a warning the AFP considers active. Note the field naming invites exactly that mistake: `published_time` is the warning's effective **start** (`start_date`), not when it was written.
- **SNFAC forecasts before 2020-05-01 carry no weather pointer.** They predate `weather_data.weather_product_id`, so weather has to be located by center + zone + date instead. It belongs in the weather source rather than a page, so it stays one branch in one place. Only reachable through the archive; ~488 forecasts across a single season.
- **The two info-exchange centers have no `config` object at all.** `EWYAIX` and `SOAIX` return center metadata without one, so any code reading `widget_config.*` for map settings must tolerate its absence rather than assuming defaults exist.

## Where things live

| Path                                      | What                                            |
| ----------------------------------------- | ----------------------------------------------- |
| `src/services/nac/model/`                 | Normalized, API-agnostic product model          |
| `src/services/nac/sources/`               | Per-product source interfaces, config, resolver |
| `src/services/nac/sources/v2/`            | Legacy-API implementations and mappers          |
| `src/services/nac/types/`                 | v2 wire schemas (zod)                           |
| `src/services/nac/forecastFingerprint.ts` | Revalidate-on-view ETag                         |
| `src/app/api/[center]/*-freshness/`       | Freshness route handlers                        |
| `src/collections/Settings/`               | Control 1, the rollout flag                     |
| `src/components/forecast/`                | Presentation, model-consuming only              |
