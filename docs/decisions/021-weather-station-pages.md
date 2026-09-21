# Weather Station pages

Date: 2026-09-18

Status: proposed

## Context

[#1145](https://github.com/NWACus/web/pull/1145) ported nwac.us's weather station pages (`/weather/stations`, `/weather/stations/[station]`, the accumulated precipitation table and the graph-data route) as a 1:1 copy. The port was deliberately NWAC-only: a `STATIONS_TENANT_SLUG` gate on every route, `NWAC_SOURCE = 'nwac'` in the SnowObs service, and a 629-line `src/constants/weatherStations.ts` registry holding 32 station groups, 14 regions, and a hardcoded column list per group (`[stid, variable]` pairs, ported from the legacy Django plugin's `station_group_tables_config`). [#1169](https://github.com/NWACus/web/issues/1169) tracked making these station pages center-dynamic, since the data comes from Snowbound's SnowObs and other centers have asked for the pages.

The need for Station Pages came out of:

- **SnowObs already knows what a station is.** Every timeseries response carries each logger's name, elevation, coordinates and the set of variables it reports. The registry duplicated the first three and hand-maintained the fourth. When a logger gains a sensor, the legacy column list silently hides it.
- **NWAC forecasters make station decisions that SnowObs cannot.** Which loggers share a page (17 of the 32 pages cover more than one logger, so Alpental reads Summit / Mid / Base side by side), what the page is called, which gauge to drop from the precip table while it has a long-term fault, and which page stays up for downloads after its hardware is gone. Today those decisions need a developer and a deploy.
- **The `/weather/stations` index was a built-in page** ([ADR 009](009-built-in-pages.md)) rendered by a native route: a hardcoded list of links grouped by region, with an intro paragraph nobody could edit. Every other center's Weather dropdown is already Payload pages plus the native NAC-widget routes.
- **Other centers want station pages.** SAC and SNFAC hold SnowObs tokens; their stations are all Mesowest and SNOTEL. Whatever we build for NWAC should work for every center without a code change.
- **SnowObs already maintains the per-center station list.** Read against the OpenAPI spec and the live API on 2026-09-18 with the centers' public tokens: `station/tracking/` is scoped by the token's client, not by source, and returns the set the center's own forecasters curate in SnowObs across every source (NWAC 213: 52 `nwac`, 68 `snotel`, 93 `mesowest`; SAC 139, all Mesowest and SNOTEL). The timeseries endpoint takes `source` as a comma list and tags each returned station with its source, so one request can span a center's sources. `variable/tracking/` serves per-center units and rounding too, which we still hardcode; that is a follow-up, not part of this decision.

A first cut of this branch mirrored SnowObs into a `stations` collection: one row per logger with read-only identity fields, seeded from a 60-station snapshot, with a sync to keep it current and rules for what to do when a row left tracking. Review against the API findings above showed the mirror was doing SnowObs's job again. Every question it raised (delete or keep an orphan, cron or button, seed-from-snapshot or sync-first) existed only to keep a local copy honest, and SnowObs already holds the honest copy.

The other obvious alternative, per-tenant constants keyed by center slug, would have removed the gate without giving admins anything, and would have kept every station decision a code change.

## Decision

**AvyWeb stores only what SnowObs cannot know: the pages, and which SnowObs stations each page shows and in what order. A station is a `(source, stid)` reference and nothing more. Columns are derived from the SnowObs data unless a page chooses its own. There is no local copy of SnowObs's station list and nothing to sync.**

### Pages reference stations; one field type does the picking

`stationPages` is tenant-scoped and holds `displayName`, `slug` (unique per tenant, since it is the URL), `archived`, and `stations`: an ordered list of `{ stid, source }`. The field rejects a station listed twice on one page; nothing stops a station from appearing on more than one page.

The list is a `stationsField()`, a JSON field whose admin component is a table of the chosen stations (live name, SnowObs id, source, elevation, partner) with a drag handle per row and a remove button, and under it a searchable select over the center's SnowObs tracking list ("Name · source") with an Add button that takes one or several picks. JSON rather than an array field because Payload's array UI is collapsible rows of sub-fields, and once a station carries no per-row data those rows only hide the list; the value is only ever pairs, validated on save. The options come from a collection endpoint that proxies `station/tracking/` for the page's center, joined with `station/data/current/` so each station carries the variables and time of its latest observation, cached an hour server-side so the token never reaches the browser. The table and the picker show SnowObs's own station status as a colored dot, keyed on that time the way the SnowObs site keys it: current (within `STALE_AFTER_HOURS`), stale, or unknown when there is no observation; a station off the tracking list shows as not tracked. The picker also offers the untracked loggers from the center's own catalogue (`station/metadata/` for each source in its AFP config other than SNOTEL and Mesowest, which are nationwide), greyed and listed last, so a retired logger can still be put on an archive page. A stored station that has dropped out of the tracking list is marked in its row, which is the diff-against-SnowObs view the mirror would have needed a sync to produce. If SnowObs is unreachable the table shows the stored ids and nothing can be added until it is back.

No name, elevation or coordinates are stored anywhere. The public pages read them from the timeseries response, as the legacy site did.

### The precipitation table follows the pages, for now

The Accumulated Precipitation page shows every station on a live page, in page order, as the legacy table did. Which of those actually report precipitation is decided by the response. A per-center setting for the table's stations and columns is the next step, on top of this.

### Columns are derived unless a page chooses them

`deriveColumns()` builds a page's table from the variables its loggers actually report in the timeseries response: every reported variable in a fixed variable-major order (`TABLE_VARIABLE_ORDER`), loggers in page order within each, `battery_voltage` and the timestamp series excluded. A variable SnowObs starts sending that we have no order for lands after the known ones, alphabetically.

This reproduces the legacy layout for 30 of the 32 pages. The two that hand-interleaved a pair of snow readings now read variable-major like the rest. Derivation is the default because a new sensor appearing on its own is the behavior the forecasters actually want, and because a stored list is the one thing on a page an admin has to maintain by hand.

A page can still choose. `columns` is a second `columnsField()` next to the stations: an ordered list of `{ stid, variable }` pairs, each a reading from one of the page's stations, picked in the admin from what that station's latest observation reports. When the list is empty the table is derived; when it has entries the table is exactly those columns in that order, and a reading the station stops sending is dropped by the table builder as it always was. The field validates that every station in the list is on the page.

### Sources ride with the stations

`fetchStationTimeseries(centerSlug, stations, options)` takes `StationRef[]`, sends `source` as the distinct sources joined and `stid` as the ids joined, and reads the center's token from its AFP config (`widget_config.stations.token`, the same public token the legacy widgets use). A page's fetch is one request whatever mix of sources it shows. The graph-data route and the CSV route map a bare stid from the query string back to its source through the pages, so nothing outside the collection needs to know where a station lives.

The center's slug is not assumed to be a source anywhere. For SAC and SNFAC it isn't one.

### The public pages read one cached object

The assembled `StationPage` (page row plus its ordered station refs plus a flat `stids` list) is built once per center in `unstable_cache` under a single tag, `station-pages:<center>`; the settings document is cached under the same tag, and both collections' `afterChange` / `afterDelete` hooks bust it. The graph-data route's allowlist and request caps derive from the same object, so moving a station between pages in the admin changes the table, the graphs, the CSV form, the precip table and the allowlist together on the next request.

### A center has station pages when it has rows

`STATIONS_TENANT_SLUG` is gone. Every route and the graph-data endpoint call `getStationPages(center)` and 404 when it returns nothing. `generateStaticParams` enumerates `(tenant.slug, page.slug)` over the whole collection. Enabling a second center is content: an admin creates pages and picks stations from that center's tracking list.

### The index lists the collection; the routes stay native

The `/weather/stations` index still renders natively, but from the collection: a flat alphabetical list of the center's pages plus the precipitation and map links. Region grouping (`NWAC_STATION_REGIONS`) is dropped with the registry; with a dropdown to jump between 32 pages the headings cost more than they bought. Moving the index into a Payload page so an editor owns its text is the next step. Detail pages, the precip table, the map and the graph-data route remain native routes: they render live SnowObs data and have no editable content. `legacySlug` survives only in the seed data, for the redirect work in [#1106](https://github.com/NWACus/web/issues/1106).

### Seeding is the page list, nothing else

The migration `20260918_223529_station_pages` creates the table, then for the `nwac` tenant creates the 32 pages with their station references from the page list in the migration file, every reference on the `nwac` source. No station identity is snapshotted, so there is nothing to go stale. `seedStationPages()` creates only pages that do not exist and never touches one that does, so re-running it cannot undo an admin's arrangement. The same function runs from `pnpm seed`, because locally the migration runs before any tenant exists. The migration also appends `stationPages` to every tenant's `Admin` role rule, since tenant roles list collections explicitly and a new collection is otherwise invisible to every existing admin.

## Consequences

- **Editors own station decisions.** Renaming a page, moving a logger between pages, ordering loggers, dropping a gauge from the precip table and archiving a page are admin edits that show on the next request. None of them is a deploy.
- **There is no station list in AvyWeb to maintain, and there must not be one.** Do not add a `stations` collection, a sync, or a cron. A center curates its stations in SnowObs; AvyWeb picks from that list. A station SnowObs stops tracking is flagged on the page that shows it, and an admin decides whether to remove it.
- **A station can be on more than one page.** The registry never did this, but nothing enforces it; the graph-data and CSV routes key a bare stid back to its source through the pages, and the first page listing it wins.
- **The admin depends on SnowObs at edit time.** The public site already hard-depends on SnowObs at render, so this adds no new runtime dependency, but an outage means the picker shows stored ids, not names. The endpoint's hour-long cache covers short blips.
- **Any station edit busts the whole center.** One tag covers the index, every station page, the precip table and the graph-data allowlist. That is cheap because they re-read on the next request only, and it means there is no per-page revalidation to reason about. Lengthening ISR windows ([#1281](https://github.com/NWACus/web/issues/1281)) does not change this.
- **The static build enumerates every page across every tenant.** `allStationPageParams()` is a full scan of `stationPages` at build time. Fine at 32 pages; revisit if a center lands hundreds.
- **Two archived-page behaviors are encoded in code, not data.** An archived page defaults to the CSV tab and is excluded from the precip table (a decommissioned gauge would read "missing" forever, which is why the legacy page omitted them too). These follow the flag automatically; they are not separate switches.
- **The public token's read surface is not guaranteed.** `station/metadata/client/` is already OAuth-only; `station/tracking/` could go the same way. The spec also declares the public token as accepted on the tracking write endpoints, which was not probed. Both are questions for Snowbound.
- **Per-center variable config is a follow-up.** `variable/tracking/` would replace `SENSOR_LABELS`, `UNIT_LABELS` and `metricUnits.ts`; note SnowObs declares wind's metric unit as m/s where we hardcode km/h. Not derived yet.

Follow-ups: [#1303](https://github.com/NWACus/web/issues/1303) (display timezone from `AVALANCHE_CENTERS`, per ADR 020), [#1304](https://github.com/NWACus/web/issues/1304) (authoring a second center's pages).
