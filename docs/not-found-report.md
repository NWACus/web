# Post-launch 404 report

When a center switches DNS over to AvyWeb, old links, bookmarks and search results keep pointing at their previous site's URLs for months. `pnpm report:404s` pulls a center's production 404s from Vercel Observability and turns them into a list of suggested redirects. Each redirect becomes a row in the center's Redirects collection, so fixing a 404 needs no code change or deploy.

## When to run it

Run it for each newly launched center **at cutover, about 1 week after, and about 1 month after**. After that, include the center in a periodic all-center pass. Observability Plus keeps **30 days** of data, so don't leave more than a month between runs or the gap is lost for good.

## Setup

The script reads `VERCEL_TOKEN` from `.env`. It must be a **personal access token created while signed in to Vercel as `developer@nwac.us`**, scoped to the `nwac` team, at [vercel.com/account/tokens](https://vercel.com/account/tokens). Give it an expiration date.

Project tokens from the `avy` project settings don't work. They can read deployments but get `403 Forbidden` from the Observability API. A personal login such as `busbyk` can't see the `nwac` team at all.

## Running it

```bash
pnpm report:404s nwac --out nwac-404s.json
```

| Option    | Default | Meaning                                                      |
| --------- | ------- | ------------------------------------------------------------ |
| `<tenant>` | —      | Tenant slug; the hostname comes from `AVALANCHE_CENTERS`     |
| `--days`  | `30`    | How many whole UTC days to look back (30 is the retention cap) |
| `--limit` | `200`   | How many of the top non-bot 404 paths to fetch per week      |
| `--out`   | —       | Write the JSON report to this file                           |

A 30-day run takes about two minutes. The script:

1. Counts 404s on both the apex and `www.` hostnames of the center's `customDomain`, in total and excluding bots (requests with a `botName` or `botCategory`).
2. Fetches the top non-bot 404 paths one week at a time, because grouping by path over longer windows fails with `query_failed`. The weekly counts are then summed, so a path that misses the top `--limit` in some weeks is undercounted.
3. Reads the center's live URLs from its public `sitemap.xml`.
4. Merges paths that differ only by a trailing slash or query string, then sets aside:
   - `dead-legacy-path`: known-dead WordPress-era paths (`isDeadLegacyPath`, shared with #1280 — Short-circuit dead legacy URLs (old WordPress paths, RSS feeds, icons) before they reach the page pipeline).
   - `not-redirectable`: paths the middleware matcher skips, such as `/api/...` and root-level files like `/favicon.ico`. A Redirects row can never catch these.
   - `probe`: dotfile paths such as `/.well-known/...` and `/.env`, which come from browsers and scanners, not people.
   - `live-path`: paths that exist now; the 404 was temporary.
5. Suggests a destination for each remaining path when exactly one live URL has the same last path segment (`/2024/01/meet-liz/` → `/blog/meet-liz`). Otherwise `to` is `null`.

## Output format

The `--out` file is the hand-off to the script that creates Redirects rows, so keep this shape stable:

```json
{
  "tenant": "nwac",
  "hostnames": ["nwac.us", "www.nwac.us"],
  "range": { "start": "2026-08-30T00:00:00.000Z", "end": "2026-09-29T00:00:00.000Z" },
  "totals": { "notFound": 1234, "notFoundNonBot": 567 },
  "redirects": [
    { "from": "/2024/01/meet-liz", "to": "/blog/meet-liz", "hits": 40 },
    { "from": "/old-thing", "to": null, "hits": 12 }
  ],
  "excluded": [{ "path": "/feeds", "hits": 90, "reason": "dead-legacy-path" }]
}
```

- `from` is always a valid Redirects `from` value: it starts with `/`, has no trailing slash, and has no query string or hash.
- `to` is a site-relative path on the center's own domain, or `null`.
- `redirects` is sorted by `hits`, highest first.

## Reviewing and handing off

1. Read the `redirects` list top-down. Fill in `to` where you (or the center) know where the old URL should go, and delete rows that shouldn't redirect anywhere. A low-hit `null` row is usually fine to drop.
2. Check the suggested `to` values. The match is by slug only, so `/events/annual-report` → `/about/annual-report` might be wrong.
3. Load the reviewed file into the center's Redirects. The importer that does this lives in `NWACus/avy-scripts`. Entering the rows by hand in the admin panel under **Settings → Redirects** also works.
4. Skim `excluded`. A high-traffic `dead-legacy-path` may deserve a real destination (tracked in #495 — Handle redirects at the middleware layer).

## PostHog `page_not_found` event

Center 404 pages also send a `page_not_found` PostHog event from the browser, with `tenant`, `path` and `referrer`. This is groundwork for letting centers see their own 404s (#280 — Create dashboard widget that allows embedding a PostHog widget). It's also the fallback data source if Observability Plus is turned off. That decision is due in January 2027, and without Plus this script has no data.

The event is sent from the browser on purpose. The not-found render is ISR-cached, so a server-side capture would fire once per revalidation, not once per visitor. Most scanners don't run JavaScript, so the event is also mostly free of bot traffic.

## Gotchas

- The script calls the same Observability API that `vercel metrics` uses. For ad-hoc queries, use `npx -y vercel@latest metrics vercel.request.count …` because older installed CLIs don't have `metrics`. Filters are KQL (`httpStatus:"404" AND requestHostname:"nwac.us"`); dimension names are camelCase.
- `vercel.request.count` only accepts the `count` aggregation, not `sum`.
- Grouping by `requestPath` fails with `query_failed` unless the query is narrowed: filter to 404s and keep the window to about a week. The API also fails intermittently when several queries run at once, so the script runs its queries one at a time and retries 5xx responses.
- Most 404 traffic is bots, and most of that is `botCategory: unknown`, meaning automated clients Vercel can't identify. On NWAC in September 2026 that was 2.06M of 2.17M 404s. Most were machine clients of the old site's data portal and API (`/data-portal/csv/q`, `/api/v3/...`), not people following links. Group by `requestPath` with `botCategory:"unknown"` to see them.
- The same data can answer other launch-week questions: 5xx by `route`, `cacheResult`/`cacheReason` by `route`, and p75 duration by `route`.
