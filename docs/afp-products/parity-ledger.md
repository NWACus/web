# Native Product Pages — Parity Ledger

Status: living document
Last updated: 2026-08-11

> The checkable inventory of legacy `afp-public-widgets` public behavior and whether AvyWeb's native replacement covers it. This is the "did we actually recreate everything" artifact.
>
> **Companion, not a duplicate:** the functional description of _how the widgets work_ lives in the upstream reference doc — `docs/functional-reference.md` in `NationalAvalancheCenter/afp-public-widgets`. That doc is shared with the NAC team and changes only when the legacy code changes. This ledger is ours, churns per-PR, and dies when everything is checked.
>
> Scope: [native-product-pages-scope.md](native-product-pages-scope.md) · Work items: tracked as GitHub issues under the native product pages parent issue.
>
> **The `Covered by` column still carries planning numbers, not GitHub issue numbers.** They are being replaced as the work moves onto GitHub; until then, read them as "the piece of work that owns this row" rather than as links.

## How to use this

- **Covered by** — the issue that owns the behavior. `—` means nothing owns it yet, which is the signal to look for.
- **Test** — the automated check. `unit` = normalization/pure-function test. `e2e` = Playwright against a mocked render. `—` = no automated coverage.
- **Verified** — checked by a human against the live legacy widget and the native page side by side, with a date. Automated coverage does not set this column; content parity is a judgment call, not an assertion.

The **map** section's Test column records coverage that has actually **landed** on the branch. Elsewhere in this ledger the column is still a mix of landed and intended — notably, no `e2e` spec exists for forecasts, warnings or the map yet (`__tests__/e2e/frontend/` holds only `announcements` and `pages`), so `e2e` entries in those sections read as planned coverage. Worth reconciling in a pass of its own.

Scope rule: **public views only.** Forecaster/admin views stay in dashboard-v2 and are deliberately absent from this ledger. Pixel parity is explicitly **not** the goal — the bar is that a reader gets the same information and the same affordances.

## Where test data comes from

Two tiers, deliberately not one corpus:

**v2-sourced products (forecasts, warnings, map, media)** — products-api already owns a golden corpus at `api/tests/migration_parity/golden/` (65 scrubbed real v2 responses), with capture, drift-check, and PII-scrub tooling around it, because _the producer has a v2→v3 parity obligation_. Consumer-needed shape variants get added there as cases in `scripts/parity_cases.py` — **extend it, don't fork it**. Rows tagged `unit` against these behaviors assert our normalization against those goldens.

**observations** — obs-api has **no v2→v3 migration**, so there is no parity concern and no corpus. What the tests need is ordinary **MSW mocks** recorded next to the tests that use them (issues 04 and 08). Do not build a corpus here. Note obs records carry observer names and emails — scrub fixtures even though they're local, following the discipline in products-api's `golden/SCRUB_POLICY.md`.

**O10** (the split filter encoding) needs no recorded data at all — it's a property test over generated filter sets.

Contract enforcement runs in the _other_ direction: web's v2 wire schema gets vendored into products-api's Zod harness alongside avy mobile's, so the producer's own test suite catches breakage before it reaches us. See X11. The shape variants themselves get captured upstream in the same producer-side contract work.

## Scope decisions (moved from the reference doc)

| Widget       | Native rebuild                 | Notes                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| forecasts    | **Yes — first**                | Composite; start single-zone. Defer obs/avy tabs, archive/print/media long tail.                                                                                                                                                                                  |
| warnings     | Yes                            | Small; pairs with forecast/home.                                                                                                                                                                                                                                  |
| map (danger) | Yes                            | Safety-critical, home page.                                                                                                                                                                                                                                       |
| observations | Public **viewer + submission** | Anonymous submit → draft → moderated in dashboard-v2; AvyWeb adds captcha/rate-limit. Different stack (obs-api).                                                                                                                                                  |
| stations     | **Largely shipped**            | Rachel's native stations landed on main (web #1145/#1156/#1157/#1158/#1172) via `src/services/snowobs`. NWAC-hardcoded — generalization is web #1169. `/weather/stations/map` is still a widget. Not affected by the NAC v3 migration (SnowObs is not a NAC API). |
| media        | Yes (low priority)             | Self-contained.                                                                                                                                                                                                                                                   |

---

## forecasts

### Views

| #   | Behavior                                                                                     | Covered by | Test | Verified |
| --- | -------------------------------------------------------------------------------------------- | ---------- | ---- | -------- |
| F1  | All-zones landing — per-zone bottom line + danger                                            | 03         | e2e  | —        |
| F2  | Zone forecast (`/:zone`) — full tabbed view                                                  | 03         | e2e  | —        |
| F3  | Archived forecast (`/forecast/:zone/:id`)                                                    | 11         | —    | —        |
| F4  | Standalone mountain-weather product                                                          | 14         | —    | —        |
| F5  | MWF mountain-weather page                                                                    | 15         | —    | —        |
| F6  | Synopsis/blog (`config.blog` gated)                                                          | —          | —    | —        |
| F7  | Media item detail                                                                            | 13         | —    | —        |
| F8  | Archive browser — forecast list, danger-over-time, weather, blog; season+zone+danger filters | 11, 12     | —    | —        |
| F9  | Print-to-PDF                                                                                 | —          | —    | —        |
| F10 | Forecast date picker                                                                         | 09         | —    | —        |

### Displays

| #   | Behavior                                                       | Covered by | Test | Verified |
| --- | -------------------------------------------------------------- | ---------- | ---- | -------- |
| F11 | Danger by elevation band, today + outlook, danger-triangle SVG | 03         | e2e  | —        |
| F12 | Per-band icon dropdowns                                        | 03         | —    | —        |
| F13 | Avalanche problems — rank, type icon, discussion               | 03         | e2e  | —        |
| F14 | LocatorRose aspect/elevation diagram                           | 03         | unit | —        |
| F15 | Likelihood/size ProblemSlider                                  | 03         | e2e  | —        |
| F16 | Bottom Line                                                    | 03         | e2e  | —        |
| F17 | Forecast discussion (sanitized TinyMCE HTML)                   | 03         | e2e  | —        |
| F18 | Warning banner                                                 | 05         | e2e  | —        |
| F19 | Mountain-weather table (both formats)                          | 14         | unit | —        |
| F20 | Media gallery + lightbox                                       | 03, 13     | e2e  | —        |
| F21 | Glossary tooltips                                              | 10         | —    | —        |

### Behavioral traps (these are the unit-test targets)

| #   | Trap                                                                                                 | Covered by | Test | Verified |
| --- | ---------------------------------------------------------------------------------------------------- | ---------- | ---- | -------- |
| F22 | Two weather-table formats — `periods` key present → V1, else columns/rows                            | 14         | unit | —        |
| F23 | Valid-date rule — published after 12:00 center-local counts as next-day                              | 02         | unit | —        |
| F24 | LocatorRose `data-id` encoding (e.g. `"north upper"`) from `problem.location[]`                      | 03         | unit | —        |
| F25 | Problem-type icon URL = strip whitespace from `problem.name` + `.png`                                | 03         | unit | —        |
| F26 | SNFAC legacy branch — weather by `published_time` before 2020-05-01                                  | —          | —    | —        |
| F27 | Error swallowing — legacy sets `notFound`; native must not silently blank a safety product           | 03         | e2e  | —        |
| F28 | All-zones marks whole page `notFound` if _any_ zone forecast missing (legacy bug — do not reproduce) | 03         | e2e  | —        |

## warnings

| #   | Behavior                                                                                             | Covered by | Test | Verified |
| --- | ---------------------------------------------------------------------------------------------------- | ---------- | ---- | -------- |
| W1  | Empty state (the normal state)                                                                       | 05         | e2e  | —        |
| W2  | Red "Avalanche Warning in Effect"                                                                    | 05         | e2e  | —        |
| W3  | Red "Avalanche Watch in Effect"                                                                      | 05         | e2e  | —        |
| W4  | Blue "Special Avalanche Bulletin in Effect"                                                          | 05         | e2e  | —        |
| W5  | Multiple stacked banners                                                                             | 05         | —    | —        |
| W6  | Banner contents — alert icon, heading, affected-zone list, "Learn More" → first zone URL             | 05         | e2e  | —        |
| W7  | Client-side classification from `product.product_type`                                               | 05         | unit | —        |
| W8  | Active-ness = truthy `published_time` only, no expiry check (legacy behavior — confirm we want this) | 05         | unit | —        |

## map (danger)

Behavior detail for every row below is in the upstream reference doc's `## map (danger map)` section — the styling-rules table, the flash cadence, the popup traps. That is `docs/functional-reference.md` in `NationalAvalancheCenter/afp-public-widgets`, still on branch `busbyk/functional-reference-doc` (not yet merged to `main`). Deliberate departures are recorded separately in [Deliberate divergences](#deliberate-divergences-map) rather than left looking like gaps.

| #   | Behavior                                                                                                               | Covered by | Test                  | Verified |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------- | -------- |
| M1  | Fit to the center's own zones when no viewport is configured                                                           | 05         | unit                  | —        |
| M2  | All-centers vs single-center, from `widget_config.danger_map.allCenters` (**default false** — see MD3)                 | 05         | unit                  | —        |
| M3  | AIX mode — hides danger scale, popup pivots to observations                                                            | 05         | —                     | —        |
| M4  | Off-season zones — `#333333` fill @ **0.2**, `#333333` stroke; outranks any rating still in the response               | 05         | unit                  | —        |
| M5  | Warning flashing on zones with `warning.product` set                                                                   | 05         | unit (detection)      | —        |
| M6  | Configured viewport — `center {lat,lng}` + `zoom` → `flyTo`                                                            | 05         | unit                  | —        |
| M7  | Hover popup, desktop only (>768px), follows the cursor +10px                                                           | 05         | —                     | —        |
| M8  | Click a zone → that zone's forecast (see MD1)                                                                          | 05         | unit                  | —        |
| M9  | Colors come from API `properties.color` / `stroke`, not computed locally                                               | 05         | unit                  | —        |
| M10 | `properties.warning` returns as a JSON **string** through `queryRenderedFeatures`                                      | 05         | — (avoided — see MD6) | —        |
| M11 | Fill opacity 0.6, **0.8 for extreme**; the API's own `fillOpacity` (0.5) is ignored                                    | 05         | unit                  | —        |
| M12 | No-rating zones — `#6ea4db` fill @ 0.6, `#484848` stroke (**not** the grey the server sends)                           | 05         | unit                  | —        |
| M13 | Hover thickens the zone outline 2→4px                                                                                  | 05         | —                     | —        |
| M14 | 300px popup card clamps against the map's right edge                                                                   | 05         | —                     | —        |
| M15 | Off-season popup copy — "Forecasts ended for the season"; travel advice **and** the published/expires block suppressed | 05         | unit                  | —        |
| M16 | Travel advice is the **danger scale's** text for the rating, not `properties.travel_advice`                            | 05         | unit                  | —        |
| M17 | Popup rating fallback — `danger_level` null, `< 0`, or no `end_date` → No Rating                                       | 05         | unit                  | —        |
| M18 | Popup shows the zone's center name only on an all-centers map                                                          | 05         | unit                  | —        |
| M19 | Published/expires rendered in the zone's timezone; map-layer timestamps are **naive UTC**                              | 05         | unit                  | —        |
| M20 | Controls — geolocate, re-center, avalanche.org link, search box; each a per-center toggle                              | 05         | unit (settings)       | —        |
| M21 | Danger-scale legend under the map, including the **General Information** swatch                                        | 05         | —                     | —        |
| M22 | Map height from `widget_config.danger_map.height`, clamped 300–1000                                                    | 05         | unit                  | —        |

### Deliberate divergences (map)

Recorded so a reviewer can tell a decision from an oversight. Each is a departure from the legacy widget that we chose.

| #   | Legacy widget                                                                                                                        | AvyWeb native                                                                                                                   | Why                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MD1 | Zone click opens `properties.link` — the center's **own website** — `_self` for the embedding center (or `AAIC`), `_blank` otherwise | This center's zones route to `/forecasts/avalanche/{slug}`; other centers' zones keep their external link and open in a new tab | The widget was embedded _on_ the center's site, so `_self` kept you there. On AvyWeb the same link walks the reader off the site and straight past the native forecast page.                                                                                                                                                                            |
| MD2 | One source + fill layer + outline layer **per zone**, with the flash and hover reaching for specific layer ids                       | One `geojson` source and two layers; per-zone appearance baked into each feature, hover and flash via `setFeatureState`         | Fewer objects and no id bookkeeping, and the styling precedence stays in one tested function instead of a render loop. Chosen with the divergence explicitly on the table (2026-08-07).                                                                                                                                                                 |
| MD3 | All-centers is the **default**, disabled by the `hideAllCenters` embed param                                                         | `widget_config.danger_map.allCenters ?? false`, i.e. single-center unless a forecaster opted in                                 | Honors the dashboard-v2 settings contract rather than an embed parameter AvyWeb never passed. Note this **changes what NWAC sees**: its config predates the setting, so it moves from all-centers to single-center.                                                                                                                                     |
| MD4 | `saturation` (0 / -50 / -100) is stored and editable in dashboard-v2                                                                 | Not applied                                                                                                                     | **No Mapbox consumer applies it** — not the danger-map widget, not dashboard-v2's own map preview. The only saturation code in the NAC stack styles the Google-Maps stations map. The shared "AFP Custom" style is already near-grayscale, which is why nobody noticed. Honoring it would make AvyWeb the only surface where the control does anything. |
| MD5 | Configured `zoom` used as-is                                                                                                         | Configured `zoom` **− 1**                                                                                                       | The deployed danger-map widget is still the **Google Maps** build, and the zoom values forecasters set were authored against it. Google serves 256px tiles, Mapbox GL 512px, so the same number renders one level tighter — the native map came up a full level closer than the widget beside it.                                                       |
| MD6 | `PopUp.vue` must `JSON.parse(feature.warning)` because the feature came back through `queryRenderedFeatures`                         | Popup content is built from our own typed model, looked up by feature id                                                        | Sidesteps M10 entirely rather than reproducing the parse.                                                                                                                                                                                                                                                                                               |

### Beyond parity (map)

Additions the widget has no equivalent for. Not parity obligations — listed so they are not mistaken for undocumented behavior.

| #   | Addition                                                                                                                                                                                                                                                                 | Covered by | Test       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------- |
| MA1 | Optional `?day=YYYY-MM-DD` on the map-layer fetch, with its own cache key and TTL. **Verified honored on the v2 path form** (2026-08-07) — the issue flagged this as unconfirmed because avy only ever exercised the query form. Prerequisite for issue 09 and issue 17. | 05         | — (manual) |
| MA2 | Visually-hidden zone list beneath the map — rating, warning state and forecast link per zone. The map is a `<canvas>`, so without it today's danger is unreachable by keyboard or screen reader.                                                                         | 05         | —          |
| MA3 | Map height reserved server-side so the client-only map causes no layout shift                                                                                                                                                                                            | 05         | —          |

## observations

| #   | Behavior                                                                                                                                                                               | Covered by | Test            | Verified |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | -------- |
| O1  | Observations list + map (`/view/observations`)                                                                                                                                         | 04         | —               | —        |
| O2  | Avalanches list + map (`/view/avalanches`)                                                                                                                                             | 04         | —               | —        |
| O3  | Visual/charts (`/view/visual`)                                                                                                                                                         | 04         | —               | —        |
| O4  | Single observation/avalanche — modal or full page                                                                                                                                      | 04         | —               | —        |
| O5  | Submission form (short/long)                                                                                                                                                           | 04         | e2e             | —        |
| O6  | Mobile split-pane                                                                                                                                                                      | 04         | —               | —        |
| O7  | Media upload with submission                                                                                                                                                           | 04         | —               | —        |
| O8  | Submission confirmation + moderation expectation set for the reporter                                                                                                                  | 04         | e2e             | —        |
| O9  | Abuse protection — captcha + rate-limit, server-side                                                                                                                                   | 04         | —               | —        |
| O10 | **Filter encodings stay in sync** — REST server-side filters vs Mapbox GL tile expression                                                                                              | 04         | unit (property) | —        |
| O11 | `bbox` is **optional** in the API, applied only when sent; the widget always sends it from the map viewport because its list and map are coupled. A list-without-map view can omit it. | 04         | unit            | —        |
| O12 | Zone filters by UUID via `combined_zones`                                                                                                                                              | 04         | unit            | —        |

## media

| #   | Behavior                                                                                 | Covered by | Test | Verified |
| --- | ---------------------------------------------------------------------------------------- | ---------- | ---- | -------- |
| D1  | Carousel mode — 8 most recent                                                            | —          | —    | —        |
| D2  | Grid mode — date + type + text filters, responsive 2–6 col                               | —          | —    | —        |
| D3  | Lightbox — images + YouTube embeds                                                       | 03, 13     | e2e  | —        |
| D4  | Empty / loading states                                                                   | —          | —    | —        |
| D5  | Polymorphic `url` — object for image/pdf/external; bare YouTube id _or_ object for video | 02         | unit | —        |
| D6  | Lightbox indexing decoupled from grid index (external/pdf skipped)                       | —          | —    | —        |

## Cross-cutting

| #   | Behavior                                                    | Covered by | Test                 | Verified |
| --- | ----------------------------------------------------------- | ---------- | -------------------- | -------- |
| X1  | Danger scale / colors / icons match legacy                  | 03         | unit                 | —        |
| X2  | Timezone handling in center-local time                      | 02         | unit                 | —        |
| X3  | Noon valid-date cutover shared across products              | 02         | unit                 | —        |
| X4  | Analytics events (PostHog replaces GA `uiClick`)            | —          | —                    | —        |
| X5  | Freshness — revalidate-on-view + ISR backstop               | 03         | e2e                  | —        |
| X6  | Expired/withdrawn banner from validity date                 | 03         | e2e                  | —        |
| X7  | OpenGraph reflects current forecast                         | 03         | —                    | —        |
| X8  | Responsive at 375px                                         | 03         | e2e                  | —        |
| X9  | Feature flag per tenant × product, instant rollback         | 02         | e2e                  | —        |
| X10 | URLs preserved at cutover                                   | 01         | —                    | —        |
| X11 | web's v2 wire schema enforced in products-api's Zod harness | 19         | unit (producer-side) | —        |

---

## Open gaps

Rows with `—` in **Covered by** are unowned. As of this draft:

- **F6** synopsis/blog, **F9** print-to-PDF, **F26** SNFAC pre-2020 weather branch
- ~~**M3** AIX mode~~ — **corrected 2026-08-11: this is in scope.** The previous note ("no AvyWeb tenant is an AIX center") is out of date. AvyWeb is onboarding information exchanges now — see [#269](https://github.com/NWACus/web/issues/269), [#1111](https://github.com/NWACus/web/issues/1111), [#1112](https://github.com/NWACus/web/issues/1112) — so the danger map needs the mode. The widget selects it by center id suffix (`centerId.slice(-3) === 'AIX'`), which is the detection to reproduce.
- **D1/D2/D4/D6** — the standalone media widget beyond the forecast-embedded lightbox
- **X4** analytics event parity

Each is either genuinely out of near-term scope or a real hole. Decide which, and either open an issue for it or record the drop in the scope doc's [out of scope](native-product-pages-scope.md#out-of-scope) list — an unowned row that is neither is the failure mode this ledger exists to catch.

Several of these have since been decided and are recorded in the scope doc: analytics parity, print-to-PDF and information-exchange mode are **in scope**; the synopsis/blog view is **out of scope**; the media gallery and the SNFAC pre-2020 weather branch remain **open questions**. This section will shrink as the `Covered by` column fills in.
