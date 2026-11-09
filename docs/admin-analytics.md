# Admin Site analytics page

**Site Analytics** in the admin sidebar (`/admin/analytics`) shows a center's web usage the way Plausible does: a stats row with period-over-period deltas, a trend chart, and paired breakdown panels, all read from PostHog server-side so staff never need a PostHog login. It is a Payload custom view registered in [`src/payload.config.ts`](../src/payload.config.ts); the sidebar entry is [`AnalyticsNavLink`](../src/components/AnalyticsNavLink.client.tsx).

## What it shows

| Panel | Source | Definition |
| --- | --- | --- |
| Stats row | `$pageview`, grouped by session | Unique visitors (`uniq(person_id)`), total visits (`uniq($session_id)`), pageviews, views per visit, bounce rate (`session.$is_bounce`), visit duration (`session.$session_duration`). Each compared with the previous period of the same length |
| Trend | `$pageview` | Visitors, visits or pageviews per day, or per week for ranges over 92 days, bucketed in the center's timezone |
| Pages | `$pageview` | Top pages by `$pathname`; entry and exit pages from the session's `$entry_pathname` and `$end_pathname` |
| Sources | `$pageview` | Referrers by `$referring_domain` with the center's own hosts left out (`$direct` shows as Direct); channels from `session.$channel_type` |
| Locations | `$pageview` | Countries, and regions as `subdivision, country code` |
| Devices | `$pageview` | Device type, browser, operating system |
| Sponsors | `sponsor_impression`, `sponsor_click` | Per `sponsor_id`: impressions, clicks, click-through rate. Impressions count the block rendering until #1486 ships viewport-based impressions |
| Top 404s | `page_not_found` | Missing paths with the most common referrer, which is where the broken link lives |
| Dead clicks | `$dead_click` | Page and element pairs by unique people, labelled from the element's `alt`, text or `aria-label`. Native `select` elements and map surfaces (`mapboxgl`, `maplibregl`, `leaflet` in the element chain) are excluded because they respond without changing the DOM |

Breakdown rows carry a fill bar (share of the largest row) and a percentage (share of the period's unique visitors), as in Plausible.

## Time range

The range lives in the URL: `?period=7d|30d|90d|12m` or `?from=YYYY-MM-DD&to=YYYY-MM-DD`, capped at 366 days. Dates are calendar days in the **center's timezone** (`AVALANCHE_CENTERS[slug].timezone`), which the page says under its heading. PostHog's project timezone is UTC, so a day total there can differ from the page at the day's edges; the sum over a whole range matches. The previous period is the same number of days ending the day before `from`. [`analyticsRange.ts`](../src/services/posthog/analyticsRange.ts) does the arithmetic with `@date-fns/tz`.

## The per-center filter

Every panel shares one filter, `centerFilter` in [`centerAnalyticsQueries.ts`](../src/services/posthog/centerAnalyticsQueries.ts). To reproduce a number in PostHog, apply the same conditions to the same event and window:

1. `center` equals the uppercased tenant slug, **or** `$host` is one of the center's production hostnames (the custom domain with and without `www.`, plus `<slug>.avy-fx.org`). The host match exists because production events before the `center` super property shipped (#1485) carry only `$host`.
2. `environment` is not `preview` or `development`. Those deployments register `center` too.
3. `$pathname` does not start with `/admin`. Admin pages are site management, not readership.
4. `$virt_is_bot` is not true. This is PostHog's own bot detection; tick "exclude bots" in PostHog to match.

## How it loads

- The view ([`src/views/Analytics`](../src/views/Analytics/index.tsx)) resolves the center like the sidebar selector does, via [`resolveSelectedTenant`](../src/utilities/tenancy/resolveSelectedTenant.ts): the `payload-tenant` cookie when it names a center the user can read, otherwise the user's only center. Multi-center users with nothing selected are told to pick one; users with no center see a one-line message.
- The dashboard is a client component. Each panel fetches itself from `GET /api/analytics?center&from&to&panel`, a Payload endpoint ([`analyticsEndpoint.ts`](../src/services/posthog/analyticsEndpoint.ts)) that uses Payload's auth and checks the center is one the user can read. Tabs within a panel fetch on first click.
- [`getCachedPanel`](../src/services/posthog/getCachedPanel.ts) wraps [`fetchPanel`](../src/services/posthog/panels.ts) in `unstable_cache` for ten minutes per center, range and panel. The range end is rounded up to the hour so the SQL text is stable and PostHog's own query cache answers repeats. **Refresh** on the page sends `refresh=1`, which asks PostHog for a fresh calculation (`force_blocking`) and drops the center's cached panels.
- [`queryHogQL`](../src/services/posthog/hogql.ts) submits a `HogQLQuery` to `POST /api/projects/:id/query` with `refresh: async` (or `force_async` for Refresh) and polls `GET /query/:id/` until it completes, then validates every row with zod. The asynchronous path matters: a synchronous request is cut off after 10 seconds of execution, and an events scan costs about 1.5 seconds per 10 days of calendar range whatever the filter matches, so anything past two months fails synchronously. Async queries ran a two-year scan in 20 seconds. A semaphore keeps three queries in flight, PostHog's per-project concurrency limit; the other limits are 2400 requests per hour and 240 per minute. A full page load is about nine queries, so a cold 12-month load takes a minute or so and panels fill in as they finish.
- Bounce rate and visit duration read PostHog's pre-aggregated `sessions` table (sub-second at any range) instead of joining sessions onto events. The sessions table has no user agent, so bots are included in those two numbers only.
- Ranges over 45 days go through [`LongRangeGate`](../src/views/Analytics/LongRangeGate.tsx) first: it asks `GET /api/analytics/estimate` whether the range is warm (this instance served it within the cache window, or PostHog answers the overview query from its own cache) and otherwise shows the cold-load estimate from [`loadEstimate.ts`](../src/services/posthog/loadEstimate.ts) with a choice to load or step back to 30 days. The probe submits the overview query asynchronously and cancels it if PostHog starts calculating, so checking costs nothing.
- A failed query logs a warning through Payload's logger and the panel shows a one-line message. The page never produces an error page. Without credentials every panel says analytics are not connected.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `POSTHOG_PERSONAL_API_KEY` | No | A PostHog **personal** API key with the `query:read` scope. HogQL cannot run with the project key the browser uses, which can only write events |
| `POSTHOG_PROJECT_ID` | No | The numeric PostHog project id (the Avy project is `40776`) |
| `POSTHOG_QUERY_HOST` | No | Defaults to `https://us.posthog.com`, the app host rather than the `us.i.posthog.com` ingest host |

Create the key under a service account or a maintainer's PostHog settings, scoped to the Avy project, and set it on Production in Vercel. Rotate it there if it leaks: it can read every event in the project.

## Known limits and follow-ups

- Cold loads of long ranges are slow (see above). If that becomes a complaint, the options are: per-month queries cached indefinitely for past months (exact for counts, approximate for unique visitors), moving visit-based panels to the `sessions` table, PostHog materialized Endpoints for fixed windows per center, or PostHog's pre-aggregated web analytics tables (a project setting, off as of November 2026).
- Sponsor impressions are mount counts until #1486 ships; the panel says so.
- Paths are plain text. Linking a path to the Payload document that renders it is a follow-up; the endpoint's row shapes in [`panelTypes.ts`](../src/services/posthog/panelTypes.ts) are where a document reference would go.
- Small dashboard widgets (a stat with a configurable period, top pages, a sponsor summary) are a follow-up and should read the same cached panels.
- Once production has carried the `center` property for a full year the host match in `centerFilter` is redundant.

## Testing

[`__tests__/server/analyticsRange.server.test.ts`](../__tests__/server/analyticsRange.server.test.ts), [`analyticsQueries.server.test.ts`](../__tests__/server/analyticsQueries.server.test.ts) and [`analyticsEndpoint.server.test.ts`](../__tests__/server/analyticsEndpoint.server.test.ts) cover the range arithmetic, the query builders, the HogQL client and semaphore, dead-click labelling, the assembled panels via msw, and the endpoint's auth and validation.
