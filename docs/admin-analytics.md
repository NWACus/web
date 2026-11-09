# Admin site analytics widget

The **Site analytics** widget on the Payload admin dashboard shows a center's web usage for the last 30 days, compared with the 30 days before, without a PostHog login. It is the second widget in the default dashboard layout, after Getting Started ([`src/payload.config.ts`](../src/payload.config.ts)).

## What it shows

| Tile | Source | Definition |
| --- | --- | --- |
| Visitors, Sessions, Pageviews | `$pageview` | `uniq(person_id)`, `uniq($session_id)`, `count()`; each with the change against the prior 30 days |
| Top pages | `$pageview` | By `$pathname`, with pageviews and visitors |
| Top referrers | `$pageview` | By `$referring_domain`, the center's own hosts left out; `$direct` is shown as "Direct" |
| Devices | `$pageview` | By `$device_type` |
| Top regions | `$pageview` | `$geoip_subdivision_1_name, $geoip_country_code`, or the country when there is no subdivision |
| Sponsors | `sponsor_impression`, `sponsor_click` | Per `sponsor_id`: impressions, clicks and click-through rate. Impressions count the block rendering until #1486 ships viewport-based impressions |
| Dead clicks | `$dead_click` | Top page and element pairs by unique people, labelled from the element's `alt`, text or `aria-label`. Native `select` elements and map surfaces (`mapboxgl`, `maplibregl`, `leaflet` in the element chain) are left out because they respond without changing the DOM |

The window is PostHog's "Last 30 days": from the start of the UTC day 30 days ago until now, compared with the 30 days before that. The project timezone is UTC, so the boundaries match the PostHog UI.

## The per-center filter

Every tile shares one filter, built by `centerFilter` in [`src/services/posthog/centerAnalyticsQueries.ts`](../src/services/posthog/centerAnalyticsQueries.ts). To reproduce a number in PostHog, apply the same three conditions to the same event and window:

1. `center` equals the uppercased tenant slug, **or** `$host` is one of the center's production hostnames (the custom domain with and without `www.`, plus `<slug>.avy-fx.org`). The host match exists because production events before the `center` super property shipped (#1485) carry only `$host`.
2. `environment` is not `preview` or `development`. Those deployments register `center` too and would otherwise count.
3. `$pathname` does not start with `/admin`. Admin pages are site management, not readership.

Detected bots (`$virt_is_bot`) are **not** filtered, to match a plain insight in PostHog. Tick "exclude bots" there and the numbers will drop a little.

## How it loads

- [`AnalyticsWidget`](../src/components/dashboard-widgets/AnalyticsWidget.tsx) is a server component. [`resolveWidgetTenant`](../src/components/dashboard-widgets/resolveWidgetTenant.ts) mirrors the sidebar tenant selector: the `payload-tenant` cookie when it names a center the user can access, otherwise the user's only center. Users who can access several centers and have none selected are asked to pick one in the sidebar. Users with no center (for example, course provider managers) see no widget.
- The tiles render inside a `Suspense` boundary, so the rest of the dashboard does not wait for PostHog.
- [`getCachedCenterAnalytics`](../src/services/posthog/getCachedCenterAnalytics.ts) wraps [`fetchCenterAnalytics`](../src/services/posthog/centerAnalytics.ts) in `unstable_cache` for one hour per center, so repeated admin loads do not hit PostHog. A failed query throws out of the cached function, so nothing is stored and the next load retries.
- [`queryHogQL`](../src/services/posthog/hogql.ts) posts a `HogQLQuery` to `POST /api/projects/:id/query` and validates every row with zod. Seven queries run in parallel, one per tile, each a single scan of `events`.
- Any failure logs a warning through Payload's logger and renders a one-line empty state. The widget never produces an error page.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `POSTHOG_PERSONAL_API_KEY` | No | A PostHog **personal** API key with the `query:read` scope. HogQL cannot run with the project key the browser uses, which can only write events |
| `POSTHOG_PROJECT_ID` | No | The numeric PostHog project id (the Avy project is `40776`) |
| `POSTHOG_QUERY_HOST` | No | Defaults to `https://us.posthog.com`. This is the app host, not the `us.i.posthog.com` ingest host |

Without the key and project id the widget renders "Site analytics are not connected in this environment" and the dashboard otherwise works. Create the key under a service account or a maintainer's PostHog settings, scoped to the Avy project, and set it on Production in Vercel (Preview is optional). Rotate it there if it leaks: it can read every event in the project.

## Known limits

- Dashboard layouts are stored per user in `payload-preferences`. A user who has already customised their dashboard will not see the new widget until they add "Site Analytics" from the dashboard's edit mode.
- Sponsor impressions are mount counts until #1486 ships; the tile says so in its note.
- Choosing which tiles a center sees is a per-tenant setting for later.

## Testing locally

[`__tests__/server/centerAnalytics.server.test.ts`](../__tests__/server/centerAnalytics.server.test.ts) covers the query builders, the HogQL client, dead-click labelling and the assembled result with msw. To see the widget render without a PostHog key, point `POSTHOG_QUERY_HOST` at any local server that answers `POST /api/projects/<id>/query` with `{ columns, results }` and set the other two variables to anything non-empty.
