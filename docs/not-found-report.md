# Post-launch 404 report

When a center switches DNS over to AvyWeb, old links, bookmarks and search results keep pointing at their previous site's URLs for months. `pnpm report:404s <tenant>` turns the center's production 404s into a spreadsheet of old URLs for center staff to fill in, and each filled-in row becomes a redirect. Fixing a 404 needs no code change or deploy.

## The process

1. **Run the report** for each newly launched center at cutover, about 1 week later, and about 1 month later, then in periodic all-center passes. Vercel keeps only **30 days** of data, so don't leave more than a month between runs.
2. **Review it.** Open `report.html`, then fill in the obvious `to` values in `redirects.csv` and check the suggested ones. Suggestions match by slug only, so `/events/annual-report` → `/about/annual-report` might be wrong.
3. **Send `report.html` and `redirects.csv` to the center's staff.** The report explains what to do: fill in `to` for each old address, or explain in `notes`, and send the spreadsheet back as a CSV.
4. **Add the redirects** from the returned CSV, one per row with a `to`, under **Settings → Redirects** in the admin panel:
   - **From URL**: the `from` value, exactly as written.
   - **To**: choose **Internal link** and pick the page, post, built-in page or station page at that path. Use **External link** with a full `https://` URL only for a destination that isn't one of those.
   - Resolve the `notes` rows with staff first.

   A script to load the CSV is planned for `NWACus/avy-scripts`. Until it exists, the rows are entered by hand.
5. **Skim the set-aside paths** at the bottom of the report. A high-traffic `dead-legacy-path` may deserve a real destination (#495 — Handle redirects at the middleware layer). A `built-in-route` path can't be redirected until its route checks Redirects.

## Setup

The script reads `VERCEL_TOKEN` from `.env`. Create it at [vercel.com/account/tokens](https://vercel.com/account/tokens) while signed in as `developer@nwac.us`, with the personal account selected in the scope switcher: **Scope** `nwac` → **All Projects**, with an expiration date.

Other tokens don't work. A project token from the `avy` project settings gets `403 Forbidden` from the Observability API, and a personal login such as `busbyk` can't see the `nwac` team at all.

If the script fails with a 403 that includes `"saml": true`, the token has expired or lost access to the team. Create a new one; signing in again doesn't revive the old token.

## Running it

```bash
pnpm report:404s nwac
```

| Option     | Default                        | Meaning |
| ---------- | ------------------------------ | ------- |
| `<tenant>` | —                              | Tenant slug; the hostname comes from `AVALANCHE_CENTERS` |
| `--days`   | `30`                           | Whole UTC days to look back, capped at the 30-day retention |
| `--limit`  | `200`                          | Top people-only 404 paths to fetch per week |
| `--out`    | `404-reports/<tenant>-<date>/` | Output directory (gitignored) |
| `--from`   | —                              | Re-render from an existing `report.json` instead of querying; writes next to it unless `--out` is set |

A 30-day run takes a few minutes. The script never overwrites an existing `redirects.csv`, so filled-in values survive a re-run; delete the file to regenerate it.

## What it writes

| File            | Contents |
| --------------- | -------- |
| `report.html`   | A standalone page for staff: totals, instructions, the old addresses with links to archived copies, bot traffic, and what was set aside. |
| `redirects.csv` | The spreadsheet staff fill in. Keep its columns stable. |
| `report.json`   | Everything the other two are rendered from (`notFoundReportSchema`); the input to `--from`. |

| `redirects.csv` column | Meaning |
| ---------------------- | ------- |
| `from`          | The old path, always a valid Redirects `from` value: a leading `/`, no trailing slash, no query string or hash. |
| `to`            | The new site-relative path, like `/forecasts/avalanche`. Starts as the suggestion, or empty. |
| `notes`         | Empty to start; for staff to explain rows they're unsure about. |
| `visits`        | People-only 404 requests over the report range. Rows are sorted by this. |
| `archived_page` | A Wayback Machine link to the old page, asking for a capture from a month before the report range. |

Paths are set aside, not listed in the CSV, when a redirect can't or shouldn't fix them:

- `dead-legacy-path`: known-dead WordPress-era paths (`isDeadLegacyPath`, shared with #1280 — Short-circuit dead legacy URLs (old WordPress paths, RSS feeds, icons) before they reach the page pipeline).
- `not-redirectable`: paths the middleware matcher skips, such as `/api/...` and root-level files like `/favicon.ico`.
- `probe`: dotfile paths such as `/.well-known/...`, which come from browsers and scanners.
- `live-path`: paths that exist now, so the 404 was temporary.
- `built-in-route`: paths on a built-in route, such as a forecast zone or weather station, that 404s without checking Redirects (`ROUTES_WITHOUT_REDIRECTS`, kept in step with the app's routes by a test).

## How it works

- Live URLs come from the center's public `sitemap.xml` (the home page, Pages and Posts), plus its active forecast zone routes from the NAC API when the center publishes forecasts. They're read first, so a bad domain fails fast. A path gets a suggested `to` when exactly one live URL has the same last segment.
- 404s come from the Vercel Observability API, the same one behind `vercel metrics`, on the apex and `www.` hostnames. "People" means requests with an empty `botName` and `botCategory`.
- Grouping by `requestPath` fails with `query_failed` on windows longer than about a week, so paths are fetched a week at a time and summed. A path that misses the top `--limit` in some weeks is undercounted.
- The API also fails intermittently under concurrent queries, so queries run one at a time and retry on 5xx, 429 and network errors.
- Most 404 traffic is bots, and most of that is `botCategory: unknown`: on NWAC in September 2026, 2.06M of 2.17M 404s, mostly clients of the old site's data portal and API. The report's bot section lists them.
- For ad-hoc queries, use `npx -y vercel@latest metrics vercel.request.count …`, since older CLIs lack `metrics`. Filters are KQL (`httpStatus:"404" AND requestHostname:"nwac.us"`), dimension names are camelCase, and only the `count` aggregation works. The same data answers other launch-week questions, such as 5xx, cache results or p75 duration by `route`.

## PostHog `page_not_found` event

Center 404 pages also send a `page_not_found` PostHog event with `tenant`, `path` and `referrer`. It's groundwork for #280 — Create dashboard widget that allows embedding a PostHog widget, and the fallback data source if Observability Plus is dropped in January 2027, since without Plus this script has no data. It's sent from the browser because the not-found render is ISR-cached: a server-side capture would fire once per revalidation, not once per visitor.
