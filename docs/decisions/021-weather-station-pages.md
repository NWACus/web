# Weather Station pages

Date: 2026-09-18

Status: accepted

## Context

[#1145](https://github.com/NWACus/web/pull/1145) ported nwac.us's weather station pages as a 1:1 copy: `/weather/stations`, `/weather/stations/[station]`, the accumulated precipitation table and the graph-data route. The port was deliberately NWAC-only, with a `STATIONS_TENANT_SLUG` gate on every route and a 629-line `src/constants/weatherStations.ts` registry holding 32 station groups, 14 regions and a hardcoded column list per group. [#1169](https://github.com/NWACus/web/issues/1169) tracked making the pages center-dynamic.

Four things shaped the design:

- **SnowObs already knows what a station is.** Every timeseries response carries each logger's name, elevation, coordinates and the variables it reports. The registry duplicated the first three and hand-maintained the fourth, so a logger that gained a sensor stayed hidden.
- **Forecasters make decisions SnowObs cannot.** Which loggers share a page (17 of 32 cover more than one, so Alpental reads Summit / Mid / Base side by side), what it is called, which gauge to drop while it has a fault, and which page stays up for downloads after the hardware is gone. Each of those needed a developer and a deploy.
- **The `/weather/stations` index was a built-in page** ([ADR 009](009-built-in-pages.md)) rendered by a native route, with an intro nobody could edit. Every other center's Weather dropdown is already Payload pages.
- **SnowObs maintains the per-center station list.** Checked against the OpenAPI spec and the live API on 2026-09-18: `station/tracking/` is scoped by the token's client rather than by source, and returns what the center's own forecasters curate across every source (NWAC 213, SAC 139). The timeseries endpoint takes `source` as a comma list and tags each returned station with its source, so one request spans a center's sources.

A first cut mirrored SnowObs into a `stations` collection with a sync. Every question it raised (delete or keep an orphan, cron or button, seed-from-snapshot or sync-first) existed only to keep a local copy honest, and SnowObs already holds the honest copy. Per-tenant constants, the other alternative, would have removed the gate without giving admins anything.

## Decision

**AvyWeb stores only what SnowObs cannot know: the pages, which stations each shows and in what order, and which gauges the precipitation table shows. A station is a `(source, stid)` reference and nothing more. Columns are derived from the SnowObs data unless a page narrows them. The index and the precipitation table are ordinary Payload pages. There is no local copy of SnowObs's station list and nothing to sync.**

### Pages reference stations; one field does the picking

`stationPages` is tenant-scoped: `displayName`, `slug` (unique per tenant, since it is the URL), `archived`, `stations` and `columns`. No name, elevation or coordinate is stored anywhere; the public pages read them from the timeseries response, as the legacy site did.

`stations` is a `stationsField()`, a JSON field of ordered `{ stid, source }` pairs. JSON rather than an array field because Payload's array UI is collapsible rows of sub-fields, and once a station carries no per-row data those rows only hide the list. Its admin component is a table of the chosen stations with a drag handle and a remove button, and a searchable select over the center's tracking list underneath. Options come from a collection endpoint that proxies `station/tracking/` joined with `station/data/current/`, cached an hour server-side so the token never reaches the browser. Each row shows SnowObs's own status as a colored dot, keyed on the latest observation the way the SnowObs site keys it: current (within `STALE_AFTER_HOURS`), stale, or unknown. A station that has left the tracking list is marked, which is the diff-against-SnowObs view the mirror would have needed a sync to produce. The picker also offers untracked loggers from the center's own catalogue, so a retired logger can still go on an archive page. If SnowObs is unreachable the table shows stored ids and nothing can be added until it is back.

This is the reverse of [ADR 020](020-center-timezone-is-a-hardcoded-fact.md)'s "AvyWeb owns, upstream advises" rule, deliberately: ADR 020 covers values an admin might reasonably edit. Station identity is not editorial, so the honest model is to not store it.

### A station is `(source, stid)`

A stid is unique only within a source, and SnowObs tags each station in a response with its source, so the pair is the identity everywhere: stored references, response lookups, table column and graph series keys, and the graph-data and CSV query strings (`stationKey`, `nwac:1`). `fetchStationTimeseries(center, StationRef[])` sends `source` as the distinct sources joined and `stid` as the ids joined, so a page's fetch is one request whatever mix it shows, and reads the center's token from its AFP config (`widget_config.stations.token`, the public token the legacy widgets use). The center's slug is never assumed to be a source; for SAC and SNFAC it isn't one.

### Columns are derived unless a page narrows them

`deriveColumns()` builds a page's table from the variables its loggers actually report: every reported variable in a fixed variable-major order (`TABLE_VARIABLE_ORDER`), loggers in page order within each, `battery_voltage` and the timestamp series excluded. An unknown variable lands after the known ones, alphabetically. This reproduces the legacy layout for 30 of the 32 pages; the two that hand-interleaved a pair of snow readings now read variable-major like the rest.

Derivation is the default because a new sensor appearing on its own is what forecasters want, and a stored list is the one thing on a page an admin must maintain by hand. `columns` narrows it: a multi-select of readings (`STATION_COLUMNS`), empty meaning all of them.

### The precipitation table is a block, not a side effect

The table used to be a native route showing every station on a live page minus a per-station "hidden" flag. That made it impossible to order or explain, and it could not include a gauge that is on no page. It is now a `precipTable` layout block an editor places on any page, holding its own column selection and `stationsField()` list. The field is told the list needs `precip_accum_one_hour`, so the picker offers only stations reporting it and marks one that has stopped. The table drops a station whose response carries no precipitation series and shows "missing" for a gauge that reported the series but no values.

A block rather than a per-center settings document ([ADR 016](016-per-tenant-globals-as-unique-tenant-collections.md)) because the table is content: its title, intro and placement are the editor's, and a center can put two tables with different gauges on two pages. It is fetched in the browser from `weather/precip-data`, the way the Graphs tab reads `weather/graph-data`, so the block sets its own cadence instead of the page's: a server fetch's `revalidate` becomes the revalidate of every page carrying the block, and ISR counts that window from the last render rather than the clock, so the table could sit an hour behind SnowObs's hourly ingest. The route validates requested stations against the center's tracking list so it is not an open proxy, and caches for 15 minutes. SnowObs being unreachable renders a notice in the table's place rather than failing the page.

### A center has station pages when it has rows

Every station page route calls `getStationPages(center)` and 404s when it returns nothing, so enabling a second center is content: an admin creates pages and picks from that center's tracking list. The assembled page (row plus ordered station refs) is built once per center in `unstable_cache` under one tag, `station-pages:<center>`, which the collection's `afterChange` / `afterDelete` hooks bust. The graph-data route's caps derive from the same object, and so does the allowlist a page's own stations pass without reading SnowObs, so moving a station between pages changes the table, the graphs, the CSV form and the allowlist together. The precipitation block holds its stations on its own page and revalidates with it.

### The index is a Payload page; the rest stays native

The native index and its "Weather Data" built-in row are deleted, along with the native `accumulated-precipitation` route. NWAC's seed creates a `pages` document with slug `stations` under the Weather dropdown, so `getCanonicalUrlForSlug` resolves it to `/weather/stations` and the URL is unchanged; the precipitation page is content an editor builds from the block, and nothing seeds it. Detail pages, the map and the graph-data route stay native: they render live SnowObs data and have no editable content. Region grouping goes with the registry, since a dropdown that jumps between 32 pages made the headings cost more than they bought. `legacySlug` survives only in the seed data, for the redirect work in [#1106](https://github.com/NWACus/web/issues/1106).

### Seeding is the page list, nothing else

`20260918_223529_station_pages` creates the tables. `20260921_124724_station_pages_backfill` holds the data: NWAC's 32 pages and their station references, every one on the `nwac` source, plus the collection appended to each tenant's `Admin` role rule, since tenant roles list collections explicitly. No station identity is snapshotted, so nothing goes stale. `seedStationPages()` never touches a page that exists, so re-running it cannot undo an admin's arrangement; it lives in `services/stations/` rather than the migration, which keeps the migration disposable when branch migrations are recreated on a merge. `pnpm seed` calls it with three pages, because locally the migrations run before any tenant exists.

### Any tracked station has a detail page

_Added 2026-09-23 ([#1341](https://github.com/NWACus/web/issues/1341))._ The native station map links every station to `/weather/stations/station/[source]/[stid]`, which shows the station page views for that one station, with columns derived and the name, elevation and partner from `station/tracking/`. It is the legacy map modal's replacement, not a page an editor manages, and it stores nothing. Where a station page lists the station, the map card and the detail page link to it as "Area Tables" and "Area Graphs", replacing the widget's hand-kept `external_modal_links` (which pointed at these same pages) with the `stationPages` collection. The route and its CSV route serve only a station on the center's tracking list (`src/services/snowobs/trackedStations.ts`), for a center with `platforms.stations`. graph-data accepts those as well as the stations on the center's pages, which pass without the tracking read, so it no longer 404s for a center without pages; the caps are unchanged. Detail pages are rendered per request, never prerendered, and `noindex`. A station SnowObs has just started tracking can 404 for up to an hour, the tracking read's cache, while the map (cached five minutes) already links it.

Where the page differs from the widget's modal: it reuses the station page views, so it has their table (no Min/Max/Avg rows), their preset ranges (no custom date picker) and their 7-day default graph window. The modal's table also showed SnowObs's `calc_diff` 24-hour change columns and read in the map's chosen units; the page does neither.

## Consequences

- **Editors own station decisions.** Renaming a page, moving a logger, reordering, dropping a gauge and archiving are admin edits that show on the next request. None is a deploy.
- **There is no station list in AvyWeb, and there must not be one.** Do not add a `stations` collection, a sync or a cron. A center curates in SnowObs; AvyWeb picks from that list, and flags a station SnowObs stops tracking.
- **A station can be on more than one page,** and on a precipitation block and no page at all. Nothing enforces otherwise, which is the point: the block's list is its own.
- **The admin depends on SnowObs at edit time.** The public site already depends on it at render, so this is no new dependency, but an outage leaves the picker showing ids. The hour-long cache covers short blips.
- **The cutover is content, done by hand.** No migration creates the `stations` page or the precipitation page, repoints the nav or deletes the built-in row. NWAC's were built in the production admin ahead of the deploy, and a center enabling pages later does the same. The precipitation page's URL follows its place in the navigation, so `/weather/stations/accumulated-precipitation` needs a redirect if the old address matters.
- **Any station edit busts the whole center.** One tag covers every station page, the CSV route and the graph-data allowlist. That is cheap because they re-read on the next request only, and it leaves no per-page revalidation to reason about. Lengthening ISR windows ([#1281](https://github.com/NWACus/web/issues/1281)) does not change it.
- **The static build enumerates every page across every tenant.** `allStationPageParams()` is a full scan at build time. Fine at 32 pages; revisit if a center lands hundreds.
- **Center-wide station settings that are not content** (default graph order, axis limits) belong in a unique-tenant collection per ADR 016, not a block.
- **The public token's read surface is not guaranteed.** `station/metadata/client/` is already OAuth-only and `station/tracking/` could follow. The spec also declares the public token accepted on the tracking write endpoints, which was not probed. Both are questions for Snowbound.
- **Some stations cannot be read unrounded.** SnowObs answers `raw_data=true` with a 500 for eleven of NWAC's Synoptic airport stations (KSEA, KBLI and others, checked 2026-09-23) and serves them fine without it. `fetchStationTimeseries` retries a 500 once without `raw_data`, and logs a warning, so those stations show SnowObs's rounded readings, as the legacy widget did for every station, rather than an error. The retry rounds the whole request: a page or comparison that includes one of these stations rounds every station in it, and so does a CSV download of one.
- **Per-center variable config is a follow-up.** `variable/tracking/` would replace `SENSOR_LABELS`, `UNIT_LABELS` and `metricUnits.ts`; SnowObs declares wind's metric unit as m/s where we hardcode km/h.

- **Times display in the center's own timezone.** `centerTimezone(center)` reads it from `AVALANCHE_CENTERS` per [ADR 020](020-center-timezone-is-a-hardcoded-fact.md), and the table, CSV, graph and season-anchor helpers take the center the way the SnowObs service does. NWAC is unchanged, since Pacific is its zone either way.
