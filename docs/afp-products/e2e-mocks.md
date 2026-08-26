# E2E mocks for the native AFP product pages

How the native product pages are tested end to end against a fixed, offline copy of the AFP API. The pages themselves and the data layer behind them are described in [architecture.md](architecture.md); this document covers only the test seam.

```
pnpm test:e2e:native      # build with mocks, start, run the suite
```

## Why a preload and not `instrumentation.ts`

The pages are server components, so the fetches under test happen in the Next process. Playwright's `route` cannot see them; the interception has to be **MSW at the Node network layer**, inside Next.

The obvious place to start MSW is `src/instrumentation.ts`, and it is the wrong one. Next skips the instrumentation hook during a production build — `registerInstrumentation()` returns early when `NEXT_PHASE === 'phase-production-build'`, and `next build` sets that phase before it spawns its workers. Instrumentation therefore cannot shape `generateStaticParams` or any prerendered page, which is precisely the HTML a reader is served.

So MSW is installed by `scripts/e2e/msw-preload.mjs`, loaded through `NODE_OPTIONS --import`. Next forwards `NODE_OPTIONS` when it forks build workers, so one flag covers the build, the server, and every worker in between. `scripts/e2e/run-with-mocks.mjs` composes that flag, because the `build` and `start` package scripts set `NODE_OPTIONS` with `cross-env` and would otherwise discard anything the caller exported.

Two consequences worth knowing: `msw` is a devDependency and nothing under `src/` imports it, so it cannot reach a production build; and the mocks are equally active during `next build`, which is what makes it possible to assert against prerendered output.

## An unmocked run is impossible, not merely detected

The failure that would cost the most is a green suite that quietly tested the live AFP API. Four things rule it out:

- **`.invalid` upstream hosts.** The mocked build and server run with `NAC_HOST=http://nac.e2e-mock.invalid` and `AFP_HOST=http://afp.e2e-mock.invalid`. `src/services/nac/hosts.ts` and the mock handlers both read those vars, so they agree by construction — but a process where interception failed gets a DNS failure instead of a forecast.
- **A boot probe.** After `server.listen()`, the preload fetches a path only the mock answers and exits non-zero if it does not come back.
- **A separate `distDir`.** The mocked build writes to `.next-e2e`, so an ordinary `pnpm build` can never be served as if it were mocked. `globalSetup` also checks two build ids: the one on disk against the one the mocked build recorded, and — separately — the one the running server booted from, which the preload reads before Next starts and writes into `active.json`. Only the second catches a server left running across a rebuild, because a rebuild rewrites both on-disk records at once.
- **A loud 501 for anything unmapped.** See below.

## Determinism

Next caches a mocked response exactly as it caches a real one: in the build's fetch cache, in the prerendered route, in `unstable_cache`. Rather than fight four cache layers, the handler set is **immutable**, and a scenario is addressed **by URL** — center id × zone id. Two tests can never want different bytes from the same URL, so caching is a no-op for determinism and Playwright can stay `fullyParallel`.

The one exception is a `phase` product, and it is still stateless: it is a pure function of `NEXT_PHASE`, so one fixture is baked into the prerender and a different one is served at request time. That is what makes the freshness path (inventory row X5) observable at all — it is the same shape as a correction published after the page was rendered. Exactly one zone uses it, and no other spec asserts on that zone's content.

## Where the fixtures come from

`__tests__/e2e/mocks/scenarios.json` maps every upstream URL to a fixture. Nothing there is hand-authored: hand-written fixtures encode what we *assume* the API returns, and captured ones encode what it *does*.

**`afp-golden/`** is a vendored snapshot of the AFP products-api golden corpus — real, PII-scrubbed v2 responses that the producer already captures, re-fetches weekly and drift-checks, because it has a v2→v3 parity obligation.

```
AFP_PRODUCTS_API_PATH=/path/to/products-api pnpm afp-golden:sync
pnpm afp-golden:check      # runs in CI
```

`PROVENANCE.json` records the source commit and a sha256 per file, and `--check` fails if any of them stops matching — so a "golden" cannot be quietly edited into saying what a test wants. **The intended end state is an npm package published from products-api CI**; a committed snapshot with a hash manifest is the honest interim, because the corpus lives in a Python repo the CI container has no checkout of. When that package exists, `sync-afp-golden.mjs` becomes a dependency bump and `PROVENANCE.json` becomes a version.

**`provisional/`** holds responses captured here because the corpus does not cover them yet. It is a staging area, not a second corpus: each file is blocking a listed E2E path, each has an upstream Case filed, and each is deleted once that Case lands. `scripts/e2e/capture-provisional.mjs` re-captures them and scrubs to the corpus's own `SCRUB_POLICY.md`; `--verify` re-checks what is committed and runs in `pnpm afp-golden:check`. Adding a capture that is not blocking a test is how a staging area becomes a fork.

## Missing fixtures fail loudly

A NAC/AFP request with no fixture behind it answers **501**, is appended to `.e2e-mocks/missing-fixtures.jsonl`, and fails the Playwright run — `globalSetup` for anything the build hit, `globalTeardown` for anything a test hit.

It has to be that loud because of how these pages behave. `nacFetch` turns any failure into a `NACError`, `fetchForecast` catches it and returns `null`, and the page renders "Unable to load forecast data. Please try again later." That is correct behaviour for a life-safety page — visibly degraded beats blank — but it means a missing fixture would otherwise look like a passing test of a degraded page.

A gap we already know about is different: it goes in `scenarios.json` under `absent`, answers the way v2 answers (a warning nomatch is a five-key all-null object; a forecast nomatch is a 200 carrying the legacy PHP error page), and is not recorded as a harness bug.

## Rollout state lives in the seed

`src/endpoints/seed/index.ts` fixes Control 1 per tenant: **snfac** and **dvac** render natively, **nwac** and **sac** stay on the widget. Every spec reads that state and none writes it — a test that flipped a shared tenant's flag would race the other workers, and would not reach an already-prerendered page anyway. dvac exists in the set because it aliases to nwac upstream, so the same center renders natively for one tenant and as a widget for the other.

## Changing a native product page

CI runs this suite on every PR, so a change that *breaks* an existing spec fails loudly and needs nothing from you. What CI cannot tell you is that a surface you just added has no spec at all.

So: **a change that puts something new in front of a reader gets a spec here, in the same PR.** Not a second copy of the unit tests — those already pin the rendering. What this suite is for is the part only a real browser reaches: hydration, a click, a keypress, the shape of a URL a third party is asked for.

If the corpus cannot reach it, write the spec anyway and have it skip itself:

```ts
test.skip(!hasFixture(FIXTURE), 'Blocked on products-api Case <case> — <what the corpus is missing>')
```

A skipped spec with a named Case is worth more than no spec: it turns on by itself when the capture lands, and it is the only durable record of what we cannot yet see. Add the Case to the table below at the same time.

Two things that bite when a page changes shape:

- **A new third-party host is a hermeticity hole, not a test failure.** `stubExternalAssets` fulfils a fixed list; a host that is not on it loads for real and the suite still passes. Adding a video provider, an embed, a font or a tile server means adding it there.
- **An assertion inside a skipped test rots silently.** Nothing runs it, so it is still asserting whatever was true the day it was written. Check the skipped specs when you change what they will eventually assert on.

## What the corpus cannot cover yet

These specs are written and `test.skip` themselves with a reason until the fixture lands, so they turn on by themselves.

| Blocked on | Upstream Case | Costs us |
| --- | --- | --- |
| A forecast with populated `forecast_avalanche_problems`, non-null `danger`, and a `video` media item | `product_forecast_SNFAC_with_problems` | Problem cards, the locator rose, the sliders, every coloured danger rating, the lightbox's YouTube branch, a video attached to a problem |
| A forecast whose authored HTML carries an `afp-photoswipe` figure, an `afp-video-modal` figure and a pasted `iframe` | `product_forecast_SNFAC_embedded_media` | Everything #1228 added to the discussion: the expand chip, the play button, an inline provider frame, the blocked-embed note |
| A weather product at an id a forecast points at, with non-empty `weather_data` | `product_weather_SNFAC_populated` | Both mountain-weather table shapes |
| A by-id golden for archive product 184562 | `product_by_id_SNFAC_summary` | The archive's second date |
| `/v2/public/avalanche-center/{NWAC,SAC}` | `center_NWAC`, `center_SAC` | Nothing today — held in `provisional/` |
| Map layers with real danger levels, `off_season`, or an active warning | `map_layer_*` | Danger-map styling, outside this suite's scope |

The embedded-media row is a different kind of gap from the others. The rest are wire-level — a null field, an empty array, an id nothing is served at — so the capture is a matter of picking the right product. This one is about markup a forecaster typed into a text field, which no schema requires and no shape variant guarantees. #1228 sampled 6,745 v2 products and found 2,259 `afp-photoswipe` figures and 40 iframes across the corpus's own source data, so the products exist; what does not exist yet is a golden chosen for its markup. That makes it a case for the shape-variant work in #1209 rather than an ordinary capture.

Two things are not fixture gaps and no capture will fix them:

- **Withdrawal has no representation in the v2 model**, so half of inventory row X6 has nothing to assert. Expired and archived are covered.
- **Every product golden's `expires_time` is in the past**, so the not-expired layout is only exercised where a summary's expiry is still ahead of the clock.

## What the suite has already found

**A correction used to 404 the page it was correcting.** The freshness handler calls `revalidateTag`, which is a *hard* invalidation — the next read of any page carrying that tag misses entirely rather than going stale, which is how it differs from the `revalidate` window. The zone route was `dynamicParams = false`, so Next answered that miss by abandoning the route; `[center]/[...segments]` picked the request up, found no Payload page, and 404'd, and the 404 was then cached. Measured at ~70 seconds, on the corrected zone *and* every zone sharing its weather product — one weather product covers all ten NWAC zones. So the mechanism meant to deliver a correction removed the forecast instead. Fixed by generating that route on demand, matching what the dated route beside it already did; `freshness.e2e.spec.ts` asserts the correction now arrives.

**Sentry and the MSW preload do not co-exist in one server.** With both loaded, concurrent requests intermittently returned `ReferenceError: Cannot access 'h' before initialization` from the Payload API — a webpack async module read before its body finished initialising. Both libraries hook module loading (Sentry through `import-in-the-middle`, MSW through its interceptors), and together they invert that order.

It is an interaction, **not a production defect**: a normal production build carries Sentry and no MSW, and survived three cold starts × 36 concurrent requests with zero errors, while the mocked build with both produced 185 in a single run. Production never loads the preload. The mocked build skips `withSentryConfig` (`next.config.js`), which takes it to zero — and also keeps the suite's synthetic failures out of the real project.

**Zone slugs containing `&` never resolved.** Next hands a dynamic segment percent-encoded, so three of Sawtooth's four zones rendered "Zone not found" — including from their own links on the all-zones grid. Fixed in `zoneSlugFromParam`, with a regression test that follows the grid's link rather than a hand-written URL.

## Known rough edges

- The widget-path specs stub the widget CDN, but the older `frontend` suite still loads it for real. That suite is not hermetic; this one is.
- Playwright reuses a server already listening on the port. `globalSetup` refuses to run against one built from a different scenario table, or from a different build of the app, but it will not restart it for you — stop it and re-run.
