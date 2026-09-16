# Station pages are a per-center Payload overlay on SnowObs

Date: 2026-09-16

Status: proposed

## Context

[#1145](https://github.com/NWACus/web/pull/1145) ported nwac.us's weather station pages (`/weather/stations`, `/weather/stations/[station]`, the accumulated precipitation table and the graph-data route) as a 1:1 copy. The port was deliberately NWAC-only: a `STATIONS_TENANT_SLUG` gate on every route, `NWAC_SOURCE = 'nwac'` in the SnowObs service, and a 629-line `src/constants/weatherStations.ts` registry holding 32 station groups, 14 regions, and a hardcoded column list per group (`[stid, variable]` pairs, ported from the legacy Django plugin's `station_group_tables_config`). [#1169](https://github.com/NWACus/web/issues/1169) tracked making these station pages center-dynamic since the data is coming from Snowbound and there is a request for these pages form other centers.

The need for Station Pages came out of:

- **SnowObs already knows what a station is.** Every timeseries response carries each logger's name, elevation, coordinates and the set of variables it reports. The registry duplicated the first three and hand-maintained the fourth. When a logger gains a sensor, the legacy column list silently hides it.
- **NWAC forecasters make station decisions that SnowObs cannot.** Which loggers share a page (17 of the 32 pages cover more than one logger, so Alpental reads Summit / Mid / Base side by side), what the page is called, which gauge to drop from the precip table while it has a long-term fault, and which page stays up for downloads after its hardware is gone. Today those decisions need a developer and a deploy.
- **The `/weather/stations` index was a built-in page** ([ADR 009](009-built-in-pages.md)) rendered by a native route: a hardcoded list of links grouped by region, with an intro paragraph nobody could edit. Every other center's Weather dropdown is already Payload pages plus the native NAC-widget routes.
- **Other centers want to use station pages.** SAC and SNFAC hold SnowObs tokens; their stations are Mesowest and SNOTEL, and `source` is one value per SnowObs request ([#1304](https://github.com/NWACus/web/issues/1304)). Whatever we build for NWAC should dynamically work with all other centers.

## Decision

**Station pages are assembled at request time from two tenant-scoped Payload collections, where SnowObs owns station identity and AvyWeb owns everything editorial. Columns are derived from the Snowobs data, not stored. The index is an ordinary Payload page. The center's slug is its SnowObs source until a center that needs otherwise arrives.**

### Two collections, one direction of ownership

`stations` has one row per SnowObs logger per tenant, unique on `(tenant, source, stid)`. Its identity fields (`stid`, `source`, `name`, `elevation`, `latitude`, `longitude`, `weatherStationPartner`, `lastSyncedAt`) are read-only in the admin and refuse updates through the API (field-level `access.update`); SnowObs is their source and the sync in [#1308](https://github.com/NWACus/web/pull/1308) overwrites them on every run. Its editorial fields (`page`, `pageOrder`, `hiddenOnPrecipTable`) are NWAC's decisions and the sync never touches them.

`stationPages` is what SnowObs cannot say about a page and nothing SnowObs can: `displayName`, `slug`, `archived`, with `(tenant, slug)` unique because the slug is the URL. Belonging is recorded on the station (each points at its page) and read back on the page through a `join` field. The pointer lives on the station because a station is on at most one page, which was already true of every stid in the old registry, and because `filterOptions: getTenantFilter` on a relationship picker keeps a station from being assigned to another tenant's page. Order is `pageOrder` first, then elevation descending, so a Summit / Mid / Base page reads top-down without anyone typing numbers.

This is the kind of the reverse of [ADR 020](020-center-timezone-is-a-hardcoded-fact.md)'s "AvyWeb owns, upstream advises" rule, and deliberately so: ADR 020 covers values an admin might reasonably edit, where a silent upstream overwrite would surprise them. Station identity is not editorial. Nobody should be correcting a logger's elevation in AvyWeb, so the read-only fields and the overwriting sync are the honest model.

### Columns are derived, not stored

`deriveColumns()` builds a page's table from the variables its loggers actually report in the timeseries response: every reported variable in a fixed variable-major order (`TABLE_VARIABLE_ORDER`), loggers in page order within each, `battery_voltage` and the timestamp series excluded. A variable SnowObs starts sending that we have no order for lands after the known ones, alphabetically.

This reproduces the legacy layout for 30 of the 32 pages. The two that hand-interleaved a pair of snow readings now read variable-major like the rest. We took that over a stored per-page column list because the list would be the one thing on the page an admin would have to maintain by hand and could get wrong, and because a new sensor appearing on its own is the behavior the forecasters actually want.

### The public pages barely read the rows

Routes read `stations` rows only for `stid`, `pageOrder` and `hiddenOnPrecipTable`. Names, elevations and coordinates on the rendered page come from the SnowObs response, as before. The rows exist so admins have a table to make decisions in, and the table can be wiped and reseeded without any public page going stale.

The assembled `StationPage` (page row plus its ordered stations plus a flat `stids` list) is built once per center in `unstable_cache` under a single tag, `station-pages:<center>`, and both collections' `afterChange` / `afterDelete` hooks bust that one tag. The graph-data route's allowlist and request caps derive from the same object, so moving a station between pages in the admin changes the table, the graphs, the CSV form, the precip table and the allowlist together on the next request.

### A center has station pages when it has rows

`STATIONS_TENANT_SLUG` is gone. Every route and the graph-data endpoint call `getStationPages(center)` and 404 when it returns nothing. `generateStaticParams` enumerates `(tenant.slug, page.slug)` over the whole collection. Enabling a second center is content, not code, up to the limits in the consequences below.

### The center's slug is the SnowObs `source`

`fetchStationTimeseries(centerSlug, stids, options)` sends `source=<centerSlug>` and reads the token from the center's AFP config (`widget_config.stations.token`, the same public token the legacy widgets use). #1169 proposed a per-tenant `snowobsSource` field so we would not assume slug equals source. We did not add it: for the one center with its own source the two are equal, and the centers for which they differ need a source *per station* and one fetch per source per page, not a per-tenant override ([#1304](https://github.com/NWACus/web/issues/1304)). The `source` column on `stations` is already there for that; the fetch is not. A per-tenant field would have been the wrong shape and would have to be removed when the right one landed.

### The index is a Payload page; the rest stays native

The native `weather/stations/page.tsx` and its "Weather Data" built-in row are deleted. NWAC's seed creates a normal `pages` document with slug `stations` under the Weather navigation dropdown, so `getCanonicalUrlForSlug` resolves it to `/weather/stations` and the URL is unchanged. Detail pages, the precip table, the map and the graph-data route remain native routes: they render live SnowObs data and have no editable content. Region grouping (`NWAC_STATION_REGIONS`) is dropped with the index; the pickers are a flat alphabetical list, because with a dropdown to jump between 32 pages the headings cost more than they bought. `legacySlug` survives only in the seed data, for the redirect work in [#1106](https://github.com/NWACus/web/issues/1106).

### Seeding without a network

The migration `20260916_141435_station_collections` creates both tables, then for the `nwac` tenant creates the 32 pages and the 53 stations they list from `migrations/data/nwacStationPages.ts`, a snapshot of SnowObs identity taken 2026-09-14. The snapshot is the whole 60-station catalogue; the seed skips the rest (a logger retired in 2019 and six 5-minute duplicates of hourly stations), because the sync never deletes and a row nothing shows would otherwise sit in the list for good. A migration cannot depend on SnowObs being up, and the sync overwrites the snapshot on its first run anyway. `seedStationPages()` is idempotent and only fills gaps: an existing page, an existing station's identity, and an existing page assignment are all left alone, so re-running it never undoes an admin's work. The same function runs from `pnpm seed`, because locally the migration runs before any tenant exists. The migration also appends `stations` and `stationPages` to every tenant's `Admin` role rule, since tenant roles list collections explicitly and a new collection is otherwise invisible to every existing admin.

## Consequences

- **Editors own station decisions.** Renaming a page, moving a logger between pages, ordering loggers, dropping a gauge from the precip table and archiving a page are admin edits that show on the next request. None of them is a deploy.
- **Columns cannot be hand-tuned.** Do not add a per-page column config back. If a page needs a variable hidden or a different variable order for everyone, change `TABLE_VARIABLE_ORDER` or `HIDDEN_TABLE_VARIABLES`; that is a product decision for all pages, which is the intended granularity.
- **Identity fields cannot be edited, only synced.** The admin shows them read-only and the REST API refuses updates; the sync and the seed write through the local API, which bypasses field access. If a center ever needs to override a SnowObs name, it needs a new editorial field, not a relaxed one.
- **One page per station.** A logger that should appear on two pages cannot; the old registry never did this either. Changing it means moving membership to an array on the page and re-deciding how the tenant filter applies.
- **Rows are per tenant even when the logger is shared.** A second center that surfaces an NWAC logger syncs its own copy, so pages and stations stay inside one tenant boundary and `getTenantFilter` keeps working on every picker. Duplicate rows are the price; there is no cross-tenant station reference.
- **Slug equals source is a known limit.** SAC and SNFAC cannot get station pages until #1304 lands per-station sources and a per-source fetch. A center with its own SnowObs source (a hypothetical fifth center like NWAC) needs only rows.
- **The `/weather/stations` cutover is content, done by hand.** The migration does not create the `stations` page, repoint the nav or delete the "Weather Data" built-in row; NWAC's was built in the production admin ahead of the deploy. A center enabling station pages later does the same three steps.
- **Any station edit busts the whole center.** One tag covers the index, every station page, the precip table and the graph-data allowlist. That is cheap because they re-read on the next request only, and it means there is no per-page revalidation to reason about. Lengthening ISR windows ([#1281](https://github.com/NWACus/web/issues/1281)) does not change this.
- **The static build enumerates every page across every tenant.** `allStationPageParams()` is a full scan of `stationPages` at build time. Fine at 32 pages; revisit if a center lands hundreds.
- **Two archived-page behaviors are encoded in code, not data.** An archived page defaults to the CSV tab and is excluded from the precip table (a decommissioned gauge would read "missing" forever, which is why the legacy page omitted them too). These follow the flag automatically; they are not separate switches.
- **The registry's tests went with it.** `weatherStations.server.test.ts` (the hand-checked column lists) is replaced by `deriveColumns.server.test.ts` and `stationPages.server.test.ts`, which test the derivation and assembly as pure functions against fixtures, not against NWAC's 32 pages.

Follow-ups: [#1308](https://github.com/NWACus/web/pull/1308) (the SnowObs sync that fills `lastSyncedAt` and keeps identity current), [#1303](https://github.com/NWACus/web/issues/1303) (display timezone from `AVALANCHE_CENTERS`, per ADR 020), [#1304](https://github.com/NWACus/web/issues/1304) (per-station source for a second center).
