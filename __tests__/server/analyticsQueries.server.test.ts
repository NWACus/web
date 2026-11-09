import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { setupMswLifecycle } from '../helpers/mswLifecycle'

import { resolveRange, type ResolvedRange } from '@/services/posthog/analyticsRange'
import {
  breakdownQuery,
  centerFilter,
  centerHosts,
  deadClicksQuery,
  notFoundQuery,
  overviewCountsQuery,
  overviewVisitsQuery,
  timeseriesQuery,
} from '@/services/posthog/centerAnalyticsQueries'
import {
  labelDeadClick,
  mergeDeadClicks,
  type DeadClickQueryRow,
} from '@/services/posthog/deadClicks'
import {
  getPostHogQueryConfig,
  POSTHOG_MAX_CONCURRENT_QUERIES,
  PostHogQueryError,
  queryHogQL,
} from '@/services/posthog/hogql'
import { fetchPanel, fillTimeseries } from '@/services/posthog/panels'
import { ROOT_DOMAIN } from '@/utilities/domain'
import { z } from 'zod'

const config = { apiKey: 'phx_test', projectId: '123', host: 'https://posthog.test' }
const QUERY_URL = 'https://posthog.test/api/projects/123/query'

const server = setupServer()
setupMswLifecycle(server)

const hogqlBodySchema = z.object({
  query: z.object({ kind: z.string(), query: z.string() }),
  refresh: z.string(),
})
const readBody = async (request: Request) => hogqlBodySchema.parse(await request.json())
const hogqlResult = (columns: string[], results: unknown[][]) =>
  HttpResponse.json({ columns, results })

function rangeFor(from: string, to: string): ResolvedRange {
  const resolved = resolveRange(
    { from, to },
    'America/Los_Angeles',
    new Date('2026-11-09T20:10:00Z'),
  )
  if ('error' in resolved) throw new Error(resolved.error)
  return resolved
}

const scope = { slug: 'nwac' as const, range: rangeFor('2026-10-10', '2026-11-09') }

describe('getPostHogQueryConfig', () => {
  it('returns null unless both the key and project id are set', () => {
    expect(getPostHogQueryConfig({})).toBeNull()
    expect(getPostHogQueryConfig({ POSTHOG_PERSONAL_API_KEY: 'phx' })).toBeNull()
    expect(getPostHogQueryConfig({ POSTHOG_PROJECT_ID: '1' })).toBeNull()
  })

  it('defaults the host to the US app host', () => {
    expect(
      getPostHogQueryConfig({ POSTHOG_PERSONAL_API_KEY: 'phx', POSTHOG_PROJECT_ID: '1' }),
    ).toEqual({ apiKey: 'phx', projectId: '1', host: 'https://us.posthog.com' })
  })
})

describe('queryHogQL', () => {
  it('posts a HogQLQuery with the bearer key and maps columns onto rows', async () => {
    let received: { auth: string | null; body: z.infer<typeof hogqlBodySchema> } | undefined
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        received = { auth: request.headers.get('authorization'), body: await readBody(request) }
        return hogqlResult(['path', 'pageviews'], [['/a', 3]])
      }),
    )

    const rows = await queryHogQL(
      config,
      'SELECT 1',
      z.object({ path: z.string(), pageviews: z.number() }),
    )

    expect(rows).toEqual([{ path: '/a', pageviews: 3 }])
    expect(received?.auth).toBe('Bearer phx_test')
    expect(received?.body.query).toEqual({ kind: 'HogQLQuery', query: 'SELECT 1' })
    expect(received?.body.refresh).toBe('blocking')
  })

  it('passes force_blocking through for a forced refresh', async () => {
    let refresh: string | undefined
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        refresh = (await readBody(request)).refresh
        return hogqlResult([], [])
      }),
    )
    await queryHogQL(config, 'SELECT 1', z.object({}), 'force_blocking')
    expect(refresh).toBe('force_blocking')
  })

  it('throws PostHogQueryError on a non-OK response or a bad row', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.text('nope', { status: 401 })))
    await expect(queryHogQL(config, 'SELECT 1', z.object({}))).rejects.toBeInstanceOf(
      PostHogQueryError,
    )

    server.use(http.post(QUERY_URL, () => hogqlResult(['path'], [[null]])))
    await expect(
      queryHogQL(config, 'SELECT 1', z.object({ path: z.string() })),
    ).rejects.toBeInstanceOf(PostHogQueryError)
  })

  it("never has more than PostHog's concurrency limit in flight", async () => {
    let inFlight = 0
    let peak = 0
    server.use(
      http.post(QUERY_URL, async () => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 20))
        inFlight -= 1
        return hogqlResult([], [])
      }),
    )

    await Promise.all(Array.from({ length: 8 }, () => queryHogQL(config, 'SELECT 1', z.object({}))))

    expect(peak).toBe(POSTHOG_MAX_CONCURRENT_QUERIES)
  })
})

describe('center queries', () => {
  it('lists the bare, www and subdomain hosts for a center', () => {
    expect(centerHosts('nwac')).toEqual(['nwac.us', 'www.nwac.us', `nwac.${ROOT_DOMAIN}`])
    expect(centerHosts('sac')).toEqual([
      'sierraavalanchecenter.org',
      'www.sierraavalanchecenter.org',
      `sac.${ROOT_DOMAIN}`,
    ])
  })

  it('matches the center or its hosts and leaves out admin, non-production and bots', () => {
    const filter = centerFilter(scope)
    expect(filter).toContain("properties.center = 'NWAC'")
    expect(filter).toContain(
      `properties.$host IN ('nwac.us', 'www.nwac.us', 'nwac.${ROOT_DOMAIN}')`,
    )
    expect(filter).toContain("NOT IN ('preview', 'development')")
    expect(filter).toContain("NOT startsWith(coalesce(properties.$pathname, ''), '/admin')")
    expect(filter).toContain('NOT coalesce(properties.$virt_is_bot, false)')
  })

  it('scans one period per overview counts query', () => {
    const current = overviewCountsQuery(scope, 'current')
    expect(current).toContain("timestamp >= toDateTime('2026-10-10 07:00:00')")
    expect(current).toContain("timestamp < toDateTime('2026-11-09 21:00:00')")
    expect(current).toContain('uniq(person_id) AS visitors')

    // 31 inclusive days, so the previous period starts 31 days before Oct 10
    const previous = overviewCountsQuery(scope, 'previous')
    expect(previous).toContain("timestamp >= toDateTime('2026-09-09 07:00:00')")
    expect(previous).toContain("timestamp < toDateTime('2026-10-10 07:00:00')")
  })

  it('reads bounce rate and duration for both periods from the sessions table', () => {
    const sql = overviewVisitsQuery(scope)
    expect(sql).toContain('FROM sessions')
    expect(sql).toContain("$start_timestamp >= toDateTime('2026-09-09 07:00:00')")
    expect(sql).toContain(`$entry_hostname IN ('nwac.us', 'www.nwac.us', 'nwac.${ROOT_DOMAIN}')`)
    expect(sql).toContain('avgIf($is_bounce, NOT ($start_timestamp >= toDateTime')
    expect(sql).toContain("NOT startsWith($entry_pathname, '/admin')")
  })

  it('buckets the time series by day in the center timezone', () => {
    expect(timeseriesQuery(scope)).toContain("toDate(toTimeZone(timestamp, 'America/Los_Angeles'))")
  })

  it('builds each breakdown with its own label and secondary count', () => {
    expect(breakdownQuery(scope, 'pages')).toContain("coalesce(properties.$pathname, '') AS label")
    expect(breakdownQuery(scope, 'pages')).toContain('count() AS secondary')
    expect(breakdownQuery(scope, 'entryPages')).toContain('session.$entry_pathname')
    expect(breakdownQuery(scope, 'entryPages')).toContain('uniq($session_id) AS secondary')
    expect(breakdownQuery(scope, 'channels')).toContain('session.$channel_type')
    expect(breakdownQuery(scope, 'referrers')).toContain(
      `coalesce(properties.$referring_domain, '') NOT IN ('nwac.us', 'www.nwac.us', 'nwac.${ROOT_DOMAIN}')`,
    )
  })

  it('reads 404s with their most common referrer', () => {
    const sql = notFoundQuery(scope)
    expect(sql).toContain("event = 'page_not_found'")
    expect(sql).toContain('topK(1)(nullIf(properties.referrer')
  })

  it('excludes native selects and map surfaces from dead clicks', () => {
    const sql = deadClicksQuery(scope)
    expect(sql).toContain("NOT has(elements_chain_elements, 'select')")
    expect(sql).toContain("NOT match(elements_chain, 'mapboxgl|maplibregl|leaflet')")
  })
})

describe('fillTimeseries', () => {
  it('inserts zero days for gaps', () => {
    const filled = fillTimeseries([{ date: '2026-11-02', visitors: 5, visits: 6, pageviews: 7 }], {
      from: '2026-11-01',
      to: '2026-11-03',
      bucket: 'day',
    })
    expect(filled.map((point) => [point.date, point.visitors])).toEqual([
      ['2026-11-01', 0],
      ['2026-11-02', 5],
      ['2026-11-03', 0],
    ])
  })

  it('aligns weekly buckets to Mondays', () => {
    const filled = fillTimeseries([], { from: '2026-11-04', to: '2026-11-18', bucket: 'week' })
    expect(filled.map((point) => point.date)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16'])
  })
})

describe('labelDeadClick', () => {
  const row = (overrides: Partial<DeadClickQueryRow>) => ({
    tag: 'div',
    alt: null,
    aria_label: null,
    el_text: null,
    href: null,
    ...overrides,
  })

  it('prefers alt text, then element text, then aria-label, then href, then the element kind', () => {
    expect(labelDeadClick(row({ tag: 'img', alt: '2627 T-Shirt', el_text: 'x' }))).toBe(
      'Image “2627 T-Shirt”',
    )
    expect(labelDeadClick(row({ tag: 'p', el_text: 'Choose a helmet', aria_label: 'y' }))).toBe(
      'Paragraph “Choose a helmet”',
    )
    expect(labelDeadClick(row({ tag: 'span', aria_label: 'breadcrumb' }))).toBe('Text “breadcrumb”')
    expect(labelDeadClick(row({ tag: 'a', href: 'https://example.org/x' }))).toBe(
      'Link to https://example.org/x',
    )
    expect(labelDeadClick(row({ tag: 'div' }))).toBe('Page area')
    expect(labelDeadClick(row({ tag: null }))).toBe('Element')
  })

  it('collapses whitespace and clips long text', () => {
    const label = labelDeadClick(
      row({ tag: 'p', el_text: `Take a few\n minutes ${'gear '.repeat(30)}` }),
    )
    expect(label).not.toContain('\n')
    expect(label.endsWith('…”')).toBe(true)
  })

  it('merges rows that share a page and label and sorts by people', () => {
    const base = { tag: 'img', alt: 'Hat', aria_label: null, el_text: null, href: null }
    expect(
      mergeDeadClicks([
        { ...base, path: '/shop', clicks: 10, people: 4 },
        { ...base, path: '/shop', href: 'https://x', clicks: 5, people: 3 },
        { ...base, path: '/other', alt: 'Other', clicks: 2, people: 9 },
      ]),
    ).toEqual([
      { path: '/other', label: 'Image “Other”', clicks: 2, people: 9 },
      { path: '/shop', label: 'Image “Hat”', clicks: 15, people: 4 },
    ])
  })
})

describe('fetchPanel', () => {
  function respondByQuery(sql: string) {
    if (sql.includes('FROM sessions')) {
      return hogqlResult(
        ['bounce_rate', 'previous_bounce_rate', 'visit_duration', 'previous_visit_duration'],
        [[0.42, 0.5, 192.4, null]],
      )
    }
    if (sql.includes('AS date')) {
      return hogqlResult(['date', 'visitors', 'visits', 'pageviews'], [['2026-11-08', 3, 4, 5]])
    }
    if (sql.includes('count() AS pageviews\nFROM events')) {
      const current = sql.includes("timestamp >= toDateTime('2026-10-10 07:00:00')")
      return hogqlResult(
        ['visitors', 'visits', 'pageviews'],
        [current ? [120, 200, 500] : [100, 180, 400]],
      )
    }
    if (sql.includes('AS sponsor_id')) {
      return hogqlResult(
        ['sponsor_id', 'sponsor_name', 'impressions', 'clicks'],
        [
          ['7', 'Outdoor Research', 200, 5],
          ['8', null, 0, 0],
        ],
      )
    }
    if (sql.includes("event = 'page_not_found'")) {
      return hogqlResult(['path', 'referrer', 'hits', 'people'], [['/old', 'https://x.org/', 9, 7]])
    }
    if (sql.includes("event = '$dead_click'")) {
      return hogqlResult(
        ['path', 'tag', 'alt', 'aria_label', 'el_text', 'href', 'clicks', 'people'],
        [['/support', 'img', 'Wool Hat', null, null, null, 46, 41]],
      )
    }
    return hogqlResult(['label', 'visitors', 'secondary'], [['/forecasts', 90, 300]])
  }

  beforeEach(() => {
    server.use(
      http.post(QUERY_URL, async ({ request }) =>
        respondByQuery((await readBody(request)).query.query),
      ),
    )
  })

  it('assembles the overview with derived views per visit', async () => {
    const data = await fetchPanel(config, 'nwac', scope.range, 'overview')
    expect(data).toMatchObject({
      kind: 'overview',
      visitors: { current: 120, previous: 100 },
      viewsPerVisit: { current: 2.5, previous: 400 / 180 },
      bounceRate: { current: 0.42, previous: 0.5 },
      visitDuration: { current: 192.4, previous: 0 },
    })
  })

  it('fills the time series over the range', async () => {
    const data = await fetchPanel(
      config,
      'nwac',
      rangeFor('2026-11-07', '2026-11-09'),
      'timeseries',
    )
    if (data.kind !== 'timeseries') throw new Error('wrong kind')
    expect(data.points.map((point) => point.visitors)).toEqual([0, 3, 0])
  })

  it('returns breakdown, sponsor, 404 and dead click rows in their panel shapes', async () => {
    await expect(fetchPanel(config, 'nwac', scope.range, 'countries')).resolves.toEqual({
      kind: 'breakdown',
      rows: [{ label: '/forecasts', visitors: 90, secondary: 300 }],
    })
    await expect(fetchPanel(config, 'nwac', scope.range, 'sponsors')).resolves.toMatchObject({
      rows: [
        { name: 'Outdoor Research', clickThroughRate: 0.025 },
        { name: 'Sponsor 8', clickThroughRate: null },
      ],
    })
    await expect(fetchPanel(config, 'nwac', scope.range, 'notFound')).resolves.toEqual({
      kind: 'notFound',
      rows: [{ path: '/old', referrer: 'https://x.org/', hits: 9, people: 7 }],
    })
    await expect(fetchPanel(config, 'nwac', scope.range, 'deadClicks')).resolves.toEqual({
      kind: 'deadClicks',
      rows: [{ path: '/support', label: 'Image “Wool Hat”', clicks: 46, people: 41 }],
    })
  })

  it('surfaces a failed query', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.text('boom', { status: 500 })))
    await expect(fetchPanel(config, 'nwac', scope.range, 'pages')).rejects.toBeInstanceOf(
      PostHogQueryError,
    )
  })
})
