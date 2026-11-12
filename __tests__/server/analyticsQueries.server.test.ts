import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { setupMswLifecycle } from '../helpers/mswLifecycle'

import { resolveRange, type ResolvedRange } from '@/services/posthog/analyticsRange'
import {
  breakdownQuery,
  CENTER_FILTER,
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
  parseRetryAfter,
  PostHogQueryError,
  probeQueryCache,
  queryHogQL,
} from '@/services/posthog/hogql'
import { estimateColdSeconds, LIST_ROW_CAP } from '@/services/posthog/reportTypes'
import { fetchReport, fillTimeseries } from '@/services/posthog/reports'
import { ROOT_DOMAIN } from '@/utilities/domain'
import { z } from 'zod'

const config = { apiKey: 'phx_test', projectId: '123', host: 'https://posthog.test' }
const QUERY_URL = 'https://posthog.test/api/projects/123/query'

const server = setupServer()
setupMswLifecycle(server)

const hogqlBodySchema = z.object({
  query: z.object({
    kind: z.string(),
    query: z.string(),
    values: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  }),
  refresh: z.string(),
})
type SentQuery = z.infer<typeof hogqlBodySchema>['query']
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
const SELECT_ONE = { query: 'SELECT 1' }

describe('getPostHogQueryConfig', () => {
  it('returns null unless both the key and project id are set', () => {
    expect(getPostHogQueryConfig({})).toBeNull()
    expect(getPostHogQueryConfig({ POSTHOG_QUERY_API_KEY: 'phx' })).toBeNull()
    expect(getPostHogQueryConfig({ POSTHOG_PROJECT_ID: '1' })).toBeNull()
  })

  it('defaults the host to the US app host', () => {
    expect(
      getPostHogQueryConfig({ POSTHOG_QUERY_API_KEY: 'phx', POSTHOG_PROJECT_ID: '1' }),
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
      SELECT_ONE,
      z.object({ path: z.string(), pageviews: z.number() }),
    )

    expect(rows).toEqual([{ path: '/a', pageviews: 3 }])
    expect(received?.auth).toBe('Bearer phx_test')
    expect(received?.body.query).toEqual({ kind: 'HogQLQuery', query: 'SELECT 1' })
    expect(received?.body.refresh).toBe('async')
  })

  it('sends placeholder values alongside the query', async () => {
    let query: SentQuery | undefined
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        query = (await readBody(request)).query
        return hogqlResult([], [])
      }),
    )
    await queryHogQL(
      config,
      { query: 'SELECT 1 WHERE x IN {hosts}', values: { hosts: ['a', "b'c"] } },
      z.object({}),
    )
    expect(query?.values).toEqual({ hosts: ['a', "b'c"] })
  })

  it('passes force_blocking through for a forced refresh', async () => {
    let refresh: string | undefined
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        refresh = (await readBody(request)).refresh
        return hogqlResult([], [])
      }),
    )
    await queryHogQL(config, SELECT_ONE, z.object({}), 'force_blocking')
    expect(refresh).toBe('force_async')
  })

  it('throws PostHogQueryError on a non-OK response or a bad row', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.text('nope', { status: 401 })))
    await expect(queryHogQL(config, SELECT_ONE, z.object({}))).rejects.toBeInstanceOf(
      PostHogQueryError,
    )

    server.use(http.post(QUERY_URL, () => hogqlResult(['path'], [[null]])))
    await expect(
      queryHogQL(config, SELECT_ONE, z.object({ path: z.string() })),
    ).rejects.toBeInstanceOf(PostHogQueryError)
  })

  it('polls an asynchronous query until it completes', async () => {
    let polls = 0
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ query_status: { id: 'q1', complete: false } }),
      ),
      http.get(`${QUERY_URL}/q1/`, () => {
        polls += 1
        return HttpResponse.json({
          query_status: {
            id: 'q1',
            complete: polls >= 2,
            results: polls >= 2 ? { columns: ['n'], results: [[7]] } : undefined,
          },
        })
      }),
    )

    await expect(queryHogQL(config, SELECT_ONE, z.object({ n: z.number() }))).resolves.toEqual([
      { n: 7 },
    ])
    expect(polls).toBe(2)
  })

  it('surfaces an asynchronous failure with its message', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({
          query_status: { id: 'q2', complete: true, error: true, error_message: 'Out of memory' },
        }),
      ),
    )
    await expect(queryHogQL(config, SELECT_ONE, z.object({}))).rejects.toThrow('Out of memory')
  })

  it('reports a warm cache without starting work, and cancels a cold calculation', async () => {
    server.use(http.post(QUERY_URL, () => hogqlResult(['n'], [[1]])))
    await expect(probeQueryCache(config, SELECT_ONE)).resolves.toBe(true)

    let cancelled = false
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ query_status: { id: 'cold', complete: false } }),
      ),
      http.delete(`${QUERY_URL}/cold/`, () => {
        cancelled = true
        return HttpResponse.json({})
      }),
    )
    await expect(probeQueryCache(config, SELECT_ONE)).resolves.toBe(false)
    expect(cancelled).toBe(true)
  })
})

describe('queryHogQL rate limits and polling', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2026-11-11T18:00:00Z'),
      doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate'],
    })
    // Jitter at its midpoint: backoff waits three quarters of each step
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  const pending = (id: string) => HttpResponse.json({ query_status: { id, complete: false } })
  const done = (id: string) =>
    HttpResponse.json({
      query_status: { id, complete: true, results: { columns: ['n'], results: [[1]] } },
    })
  const tooMany = (headers?: Record<string, string>) =>
    HttpResponse.text('slow down', { status: 429, headers })

  /** Runs the query to completion while advancing fake time; resolves to its outcome. */
  async function settle<T>(promise: Promise<T>, maxMs = 200_000) {
    const outcome = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    )
    let finished = false
    void outcome.then(() => (finished = true))
    for (let elapsed = 0; !finished && elapsed < maxMs; elapsed += 250) {
      await jest.advanceTimersByTimeAsync(250)
    }
    return outcome
  }

  it('retries a 429 on submit with backoff, then succeeds', async () => {
    const attempts: number[] = []
    server.use(
      http.post(QUERY_URL, () => {
        attempts.push(Date.now())
        return attempts.length < 3 ? tooMany() : hogqlResult(['n'], [[1]])
      }),
    )

    const outcome = await settle(queryHogQL(config, SELECT_ONE, z.object({ n: z.number() })))

    expect(outcome).toEqual({ value: [{ n: 1 }] })
    const gaps = attempts.slice(1).map((at, i) => at - attempts[i])
    // 1 s then 2 s steps, each at three quarters with the mocked jitter
    expect(gaps).toEqual([750, 1_500])
  })

  it('retries a 429 on a poll without restarting the query', async () => {
    let submits = 0
    let polls = 0
    server.use(
      http.post(QUERY_URL, () => {
        submits += 1
        return pending('q429')
      }),
      http.get(`${QUERY_URL}/q429/`, () => {
        polls += 1
        return polls === 1 ? tooMany() : done('q429')
      }),
    )

    const outcome = await settle(queryHogQL(config, SELECT_ONE, z.object({ n: z.number() })))

    expect(outcome).toEqual({ value: [{ n: 1 }] })
    expect(submits).toBe(1)
    expect(polls).toBe(2)
  })

  it('honours Retry-After', async () => {
    const attempts: number[] = []
    server.use(
      http.post(QUERY_URL, () => {
        attempts.push(Date.now())
        return attempts.length === 1 ? tooMany({ 'Retry-After': '7' }) : hogqlResult([], [])
      }),
    )

    await settle(queryHogQL(config, SELECT_ONE, z.object({})))

    expect(attempts[1] - attempts[0]).toBe(7_000)
  })

  it('reads Retry-After as seconds or an HTTP date', () => {
    const now = Date.parse('2026-11-11T18:00:00Z')
    expect(parseRetryAfter('12', now)).toBe(12_000)
    expect(parseRetryAfter('Wed, 11 Nov 2026 18:00:30 GMT', now)).toBe(30_000)
    expect(parseRetryAfter('Wed, 11 Nov 2026 17:00:00 GMT', now)).toBe(0)
    expect(parseRetryAfter('soon', now)).toBeNull()
    expect(parseRetryAfter(null, now)).toBeNull()
  })

  it('gives up with a PostHogQueryError once 429s outlast the deadline', async () => {
    let attempts = 0
    server.use(
      http.post(QUERY_URL, () => {
        attempts += 1
        return tooMany()
      }),
    )

    const outcome = await settle(queryHogQL(config, SELECT_ONE, z.object({})))

    expect('error' in outcome && outcome.error).toBeInstanceOf(PostHogQueryError)
    expect('error' in outcome && outcome.error).toMatchObject({ context: { status: 429 } })
    expect(attempts).toBeGreaterThan(3)
    expect(Date.now() - Date.parse('2026-11-11T18:00:00Z')).toBeLessThanOrEqual(120_000)
  })

  it('does not wait out a Retry-After longer than the deadline', async () => {
    server.use(http.post(QUERY_URL, () => tooMany({ 'Retry-After': '600' })))

    const outcome = await settle(queryHogQL(config, SELECT_ONE, z.object({})), 1_000)

    expect('error' in outcome && outcome.error).toMatchObject({ context: { status: 429 } })
  })

  it('polls sooner at first and backs off to a four-second cap', async () => {
    const polls: number[] = []
    let submittedAt = 0
    server.use(
      http.post(QUERY_URL, () => {
        submittedAt = Date.now()
        return pending('slow')
      }),
      http.get(`${QUERY_URL}/slow/`, () => {
        polls.push(Date.now())
        return polls.length < 8 ? pending('slow') : done('slow')
      }),
    )

    await settle(queryHogQL(config, SELECT_ONE, z.object({ n: z.number() })))

    const gaps = polls.map((at, i) => at - (i === 0 ? submittedAt : polls[i - 1]))
    expect(gaps).toEqual([500, 750, 1_125, 1_688, 2_532, 3_798, 4_000, 4_000])
  })

  it('stops polling at the deadline', async () => {
    server.use(
      http.post(QUERY_URL, () => pending('never')),
      http.get(`${QUERY_URL}/never/`, () => pending('never')),
    )

    const outcome = await settle(queryHogQL(config, SELECT_ONE, z.object({})))

    expect('error' in outcome && outcome.error).toBeInstanceOf(PostHogQueryError)
    expect('error' in outcome && String(outcome.error)).toContain('did not finish in time')
  })

  it('treats a rate-limited cache probe as an error without retrying', async () => {
    let attempts = 0
    server.use(
      http.post(QUERY_URL, () => {
        attempts += 1
        return tooMany({ 'Retry-After': '1' })
      }),
    )

    const outcome = await settle(probeQueryCache(config, SELECT_ONE), 5_000)

    expect('error' in outcome && outcome.error).toBeInstanceOf(PostHogQueryError)
    expect(attempts).toBe(1)
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
    expect(CENTER_FILTER).toContain('properties.center = {center} OR properties.$host IN {hosts}')
    expect(CENTER_FILTER).toContain("NOT IN ('preview', 'development')")
    expect(CENTER_FILTER).toContain("NOT startsWith(coalesce(properties.$pathname, ''), '/admin')")
    expect(CENTER_FILTER).toContain('NOT coalesce(properties.$virt_is_bot, false)')
  })

  it('passes the center, hosts and UTC period bounds as values, never in the SQL', () => {
    const { query, values } = overviewCountsQuery(scope, 'current')
    expect(values).toEqual({
      center: 'NWAC',
      hosts: ['nwac.us', 'www.nwac.us', `nwac.${ROOT_DOMAIN}`],
      start: '2026-10-10 07:00:00',
      end: '2026-11-09 21:00:00',
    })
    expect(query).not.toContain('nwac.us')
    expect(query).not.toContain('2026-')

    // 31 inclusive days, so the previous period starts 31 days before Oct 10
    expect(overviewCountsQuery(scope, 'previous').values).toMatchObject({
      previousStart: '2026-09-09 07:00:00',
      previousEnd: '2026-10-10 07:00:00',
    })
    expect(timeseriesQuery(scope).values).toHaveProperty('timezone', 'America/Los_Angeles')
  })

  it('sends only the values a query references, so the cache probe ignores the baseline', () => {
    const range = { from: '2026-09-01', to: '2026-11-09' }
    const now = new Date('2026-11-09T20:10:00Z')
    const preceding = resolveRange(range, 'America/Los_Angeles', now, null, 'preceding')
    const yearEarlier = resolveRange(range, 'America/Los_Angeles', now, null, 'yearEarlier')
    if ('error' in preceding || 'error' in yearEarlier) throw new Error('unresolved range')

    const probe = (resolved: ResolvedRange) =>
      overviewCountsQuery({ slug: 'nwac', range: resolved }, 'current')
    expect(probe(yearEarlier)).toEqual(probe(preceding))
    expect(overviewCountsQuery({ slug: 'nwac', range: yearEarlier }, 'previous')).not.toEqual(
      overviewCountsQuery({ slug: 'nwac', range: preceding }, 'previous'),
    )
  })

  it('scans one period per overview counts query', () => {
    const current = overviewCountsQuery(scope, 'current').query
    expect(current).toContain('timestamp >= toDateTime({start}) AND timestamp < toDateTime({end})')
    expect(current).toContain('uniq(person_id) AS visitors')
    expect(current).toContain(CENTER_FILTER)

    const previous = overviewCountsQuery(scope, 'previous').query
    expect(previous).toContain(
      'timestamp >= toDateTime({previousStart}) AND timestamp < toDateTime({previousEnd})',
    )
  })

  it('reads bounce rate and duration for both periods from the sessions table', () => {
    const { query } = overviewVisitsQuery(scope)
    expect(query).toContain('FROM sessions')
    expect(query).toContain('$entry_hostname IN {hosts}')
    // Both periods are bounded on each side, so a year-earlier baseline skips the gap between them
    expect(query).toContain(
      'avgIf($is_bounce, $start_timestamp >= toDateTime({previousStart}) AND $start_timestamp < toDateTime({previousEnd}))',
    )
    expect(query).toContain(
      'avgIf($is_bounce, $start_timestamp >= toDateTime({start}) AND $start_timestamp < toDateTime({end}))',
    )
    expect(query).toContain("NOT startsWith($entry_pathname, '/admin')")
  })

  it('buckets the time series in the center timezone, weekly for long ranges', () => {
    expect(timeseriesQuery(scope).query).toContain('toDate(toTimeZone(timestamp, {timezone}))')
    const year = { ...scope, range: rangeFor('2025-11-09', '2026-11-09') }
    expect(timeseriesQuery(year).query).toContain(
      'toStartOfWeek(toTimeZone(timestamp, {timezone}), 1)',
    )
    const byMonth = { ...year, range: { ...year.range, bucket: 'month' as const } }
    expect(timeseriesQuery(byMonth).query).toContain(
      'toStartOfMonth(toTimeZone(timestamp, {timezone}))',
    )
  })

  it('builds each breakdown with its own label and both visits and pageviews', () => {
    const pages = breakdownQuery(scope, 'pages').query
    expect(pages).toContain("coalesce(properties.$pathname, '') AS label")
    expect(pages).toContain('uniq($session_id) AS visits')
    expect(pages).toContain('count() AS pageviews')
    expect(breakdownQuery(scope, 'entryPages').query).toContain('session.$entry_pathname')
    expect(breakdownQuery(scope, 'channels').query).toContain('session.$channel_type')
    expect(breakdownQuery(scope, 'referrers').query).toContain(
      "coalesce(properties.$referring_domain, '') NOT IN {hosts}",
    )
    expect(pages).toContain(`LIMIT ${LIST_ROW_CAP}`)
  })

  it('labels cities with their region and country codes', () => {
    const { query } = breakdownQuery(scope, 'cities')
    expect(query).toContain('properties.$geoip_city_name')
    expect(query).toContain('properties.$geoip_subdivision_1_code')
    expect(query).toContain("'Unknown'")
  })

  it('reads 404s with their most common referrer', () => {
    const { query } = notFoundQuery(scope)
    expect(query).toContain("event = 'page_not_found'")
    expect(query).toContain('topK(1)(nullIf(properties.referrer')
  })

  it('excludes native selects and map surfaces from dead clicks', () => {
    const { query } = deadClicksQuery(scope)
    expect(query).toContain("NOT has(elements_chain_elements, 'select')")
    expect(query).toContain("NOT match(elements_chain, 'mapboxgl|maplibregl|leaflet')")
  })
})

describe('estimateColdSeconds', () => {
  it('grows with the range and lands near twenty seconds for a year', () => {
    expect(estimateColdSeconds(30)).toBeLessThan(estimateColdSeconds(90))
    expect(estimateColdSeconds(365)).toBeGreaterThanOrEqual(15)
    expect(estimateColdSeconds(365)).toBeLessThanOrEqual(30)
  })
})

describe('fillTimeseries', () => {
  const past = { ongoing: false }

  it('inserts zero days for gaps', () => {
    const filled = fillTimeseries([{ date: '2026-11-02', visitors: 5, visits: 6, pageviews: 7 }], {
      ...past,
      from: '2026-11-01',
      to: '2026-11-03',
      bucket: 'day',
    })
    expect(filled.map((point) => [point.date, point.visitors, point.partial])).toEqual([
      ['2026-11-01', 0, false],
      ['2026-11-02', 5, false],
      ['2026-11-03', 0, false],
    ])
  })

  it('aligns weeks to Mondays and marks the ones the range cuts short', () => {
    const filled = fillTimeseries([], {
      ...past,
      from: '2026-11-04',
      to: '2026-11-18',
      bucket: 'week',
    })
    expect(filled.map(({ date, from, to, partial }) => [date, from, to, partial])).toEqual([
      ['2026-11-02', '2026-11-04', '2026-11-08', true],
      ['2026-11-09', '2026-11-09', '2026-11-15', false],
      ['2026-11-16', '2026-11-16', '2026-11-18', true],
    ])
  })

  it('groups by calendar month', () => {
    const filled = fillTimeseries([{ date: '2026-02-01', visitors: 3, visits: 4, pageviews: 5 }], {
      ...past,
      from: '2026-01-15',
      to: '2026-03-31',
      bucket: 'month',
    })
    expect(filled.map(({ date, to, partial, visitors }) => [date, to, partial, visitors])).toEqual([
      ['2026-01-01', '2026-01-31', true, 0],
      ['2026-02-01', '2026-02-28', false, 3],
      ['2026-03-01', '2026-03-31', false, 0],
    ])
  })

  it('marks the last bucket partial while today is under way', () => {
    const filled = fillTimeseries([], {
      ongoing: true,
      from: '2026-11-01',
      to: '2026-11-03',
      bucket: 'day',
    })
    expect(filled.map((point) => point.partial)).toEqual([false, false, true])
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

describe('fetchReport', () => {
  function respondByQuery({ query: sql, values }: SentQuery) {
    if (sql.includes('FROM sessions')) {
      return hogqlResult(
        ['bounce_rate', 'previous_bounce_rate', 'visit_duration', 'previous_visit_duration'],
        [[0.42, 0.5, 192.4, null]],
      )
    }
    if (sql.includes(' AS label,')) {
      return hogqlResult(
        ['label', 'visitors', 'visits', 'pageviews'],
        [['/forecasts', 90, 120, 300]],
      )
    }
    if (sql.includes('AS date')) {
      return hogqlResult(['date', 'visitors', 'visits', 'pageviews'], [['2026-11-08', 3, 4, 5]])
    }
    if (sql.includes('count() AS pageviews\nFROM events')) {
      const current = sql.includes('timestamp >= toDateTime({start}) AND')
      expect(values?.center).toBe('NWAC')
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
    throw new Error(`No mock for query: ${sql}`)
  }

  beforeEach(() => {
    server.use(
      http.post(QUERY_URL, async ({ request }) => respondByQuery((await readBody(request)).query)),
    )
  })

  it('assembles the overview with derived views per visit', async () => {
    const data = await fetchReport(config, 'nwac', scope.range, 'overview')
    expect(data).toMatchObject({
      visitors: { current: 120, previous: 100 },
      viewsPerVisit: { current: 2.5, previous: 400 / 180 },
      bounceRate: { current: 0.42, previous: 0.5 },
      visitDuration: { current: 192.4, previous: 0 },
    })
  })

  it('fills the time series over the range', async () => {
    const data = await fetchReport(
      config,
      'nwac',
      rangeFor('2026-11-07', '2026-11-09'),
      'timeseries',
    )
    expect(data.points.map((point) => point.visitors)).toEqual([0, 3, 0])
  })

  it('returns breakdown, sponsor, 404 and dead click rows in their report shapes', async () => {
    await expect(fetchReport(config, 'nwac', scope.range, 'countries')).resolves.toEqual({
      rows: [{ label: '/forecasts', visitors: 90, visits: 120, pageviews: 300 }],
    })
    await expect(fetchReport(config, 'nwac', scope.range, 'sponsors')).resolves.toMatchObject({
      rows: [
        { name: 'Outdoor Research', clickThroughRate: 0.025 },
        { name: 'Sponsor 8', clickThroughRate: null },
      ],
    })
    await expect(fetchReport(config, 'nwac', scope.range, 'notFound')).resolves.toEqual({
      rows: [{ path: '/old', referrer: 'https://x.org/', hits: 9, people: 7 }],
    })
    await expect(fetchReport(config, 'nwac', scope.range, 'deadClicks')).resolves.toEqual({
      rows: [{ path: '/support', label: 'Image “Wool Hat”', clicks: 46, people: 41 }],
    })
  })

  it('surfaces a failed query', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.text('boom', { status: 500 })))
    await expect(fetchReport(config, 'nwac', scope.range, 'pages')).rejects.toBeInstanceOf(
      PostHogQueryError,
    )
  })
})
