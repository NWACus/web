# Post-launch 404 report

When a center switches DNS over to AvyWeb, old links, bookmarks and search results keep pointing at their previous site's URLs for months. `pnpm report:404s` pulls a center's production 404s from Vercel Observability and turns them into a list of suggested redirects. Each redirect becomes a row in the center's Redirects collection, so fixing a 404 needs no code change or deploy.

## When to run it

Run it for each newly launched center **at cutover, about 1 week after, and about 1 month after**. After that, include the center in a periodic all-center pass. Observability Plus keeps **30 days** of data, so don't leave more than a month between runs or the gap is lost for good.

## Setup

The script reads `VERCEL_TOKEN` from `.env`. It must be a **personal access token created while signed in to Vercel as `developer@nwac.us`**, scoped to the `nwac` team, at [vercel.com/account/tokens](https://vercel.com/account/tokens). Give it an expiration date.

Project tokens from the `avy` project settings don't work. They can read deployments but get `403 Forbidden` from the Observability API. A personal login such as `busbyk` can't see the `nwac` team at all.

## Running it

```bash
pnpm report:404s nwac
```

| Option     | Default                        | Meaning                                                           |
| ---------- | ------------------------------ | ----------------------------------------------------------------- |
| `<tenant>` | —                              | Tenant slug; the hostname comes from `AVALANCHE_CENTERS`          |
| `--days`   | `30`                           | How many whole UTC days to look back; capped at 30, the retention limit    |
| `--limit`  | `200`                          | How many of the top non-bot 404 paths to fetch per week           |
| `--out`    | `404-reports/<tenant>-<date>/` | Directory to write the output files to (gitignored by default)    |
| `--from`   | —                              | Re-render the HTML (and the CSV, if missing) from an existing `report.json` instead of querying; writes next to it unless `--out` is set |

A 30-day run takes a few minutes; the terminal shows which step it's on. The script:

1. Reads the center's live URLs from its public `sitemap.xml` (the home page, Pages and Posts), plus its active forecast zone routes from the NAC API, since the sitemap doesn't list those. Zone routes count only if the center publishes forecasts on the AFP. This runs first so a bad domain fails fast.
2. Counts 404s on both the apex and `www.` hostnames of the center's `customDomain`, in total and excluding bots (requests with a `botName` or `botCategory`).
3. Fetches the top non-bot 404 paths one week at a time, because grouping by path over longer windows fails with `query_failed`. The weekly counts are then summed, so a path that misses the top `--limit` in some weeks is undercounted.
4. Breaks down the bot 404s by `botCategory` and `botName` over the whole range, and lists the paths bots requested most in the last 7 days.
5. Merges paths that differ only by a trailing slash or query string, then sets aside:
   - `dead-legacy-path`: known-dead WordPress-era paths (`isDeadLegacyPath`, shared with #1280 — Short-circuit dead legacy URLs (old WordPress paths, RSS feeds, icons) before they reach the page pipeline).
   - `not-redirectable`: paths the middleware matcher skips, such as `/api/...` and root-level files like `/favicon.ico`. A Redirects row can never catch these.
   - `probe`: dotfile paths such as `/.well-known/...` and `/.env`, which come from browsers and scanners, not people.
   - `live-path`: paths that exist now; the 404 was temporary.
   - `built-in-route`: paths that land on a built-in page route, such as a forecast zone, observation or weather station, which 404s without checking Redirects (`ROUTES_WITHOUT_REDIRECTS`). A test keeps that list in step with the app's routes.
6. Suggests a destination for each remaining path when exactly one live URL has the same last path segment (`/2024/01/meet-liz/` → `/blog/meet-liz`). Otherwise `to` is empty.

## Output files

| File            | For                | Contents |
| --------------- | ------------------ | -------- |
| `report.html`   | Center staff, us   | A standalone page: totals, instructions for staff, the old addresses with links to archived copies, bot traffic, and what was set aside. |
| `redirects.csv` | Center staff       | The spreadsheet staff fill in, and the input to the redirect importer. |
| `report.json`   | `--from`, scripts  | Everything the other two are rendered from; its shape is `notFoundReportSchema`. |

`redirects.csv` is the hand-off, so keep its columns stable. The script never overwrites an existing `redirects.csv`, so filled-in values survive a re-run or `--from`; delete the file to regenerate it.

| Column          | Meaning |
| --------------- | ------- |
| `from`          | The old path. Always a valid Redirects `from` value: it starts with `/`, has no trailing slash, and has no query string or hash. |
| `to`            | Where it should go, as a site-relative path like `/forecasts/avalanche`. Starts as the suggested destination, or empty. Staff fill in or correct it. |
| `notes`         | Empty to start. Staff explain rows they're unsure about. |
| `visits`        | Non-bot 404 requests over the report range. Rows are sorted by this, highest first. |
| `archived_page` | A Wayback Machine link to the old page, asking for a capture from a month before the report range so it shows the previous site. |

## Reviewing and handing off

1. Skim `report.html` yourself first. Fill in the obvious `to` values in `redirects.csv` and check the suggested ones: the match is by slug only, so `/events/annual-report` → `/about/annual-report` might be wrong.
2. Send the HTML and CSV to the center's staff. The HTML explains what to do with the spreadsheet: fill in `to`, or explain in `notes`, and send it back as CSV.
3. Resolve the `notes` rows with them, then load the CSV into the center's Redirects. The importer lives in `NWACus/avy-scripts` and creates a Redirects row for every row with a `to`. Entering rows by hand in the admin panel under **Settings → Redirects** also works.
4. Skim the set-aside paths. A high-traffic `dead-legacy-path` may deserve a real destination (tracked in #495 — Handle redirects at the middleware layer). A high-traffic `built-in-route` path can only be redirected once its route renders `<Redirects>`.

## PostHog `page_not_found` event

Center 404 pages also send a `page_not_found` PostHog event from the browser, with `tenant`, `path` and `referrer`. This is groundwork for letting centers see their own 404s (#280 — Create dashboard widget that allows embedding a PostHog widget). It's also the fallback data source if Observability Plus is turned off. That decision is due in January 2027, and without Plus this script has no data.

The event is sent from the browser on purpose. The not-found render is ISR-cached, so a server-side capture would fire once per revalidation, not once per visitor. Most scanners don't run JavaScript, so the event is also mostly free of bot traffic.

## Gotchas

- The script calls the same Observability API that `vercel metrics` uses. For ad-hoc queries, use `npx -y vercel@latest metrics vercel.request.count …` because older installed CLIs don't have `metrics`. Filters are KQL (`httpStatus:"404" AND requestHostname:"nwac.us"`); dimension names are camelCase.
- `vercel.request.count` only accepts the `count` aggregation, not `sum`.
- Grouping by `requestPath` fails with `query_failed` unless the query is narrowed: filter to 404s and keep the window to about a week. The API also fails intermittently when several queries run at once, so the script runs its queries one at a time and retries 5xx responses, 429s and network errors.
- Most 404 traffic is bots, and most of that is `botCategory: unknown`, meaning automated clients Vercel can't identify. On NWAC in September 2026 that was 2.06M of 2.17M 404s. Most were machine clients of the old site's data portal and API (`/data-portal/csv/q`, `/api/v3/...`), not people following links. The report's bot section lists them.
- The same data can answer other launch-week questions: 5xx by `route`, `cacheResult`/`cacheReason` by `route`, and p75 duration by `route`.
