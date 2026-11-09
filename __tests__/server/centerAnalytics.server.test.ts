import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { setupMswLifecycle } from '../helpers/mswLifecycle'

import { fetchCenterAnalytics, percentChange } from '@/services/posthog/centerAnalytics'
import {
  analyticsWindow,
  centerFilter,
  centerHosts,
  deadClicksQuery,
  overviewQuery,
  topReferrersQuery,
} from '@/services/posthog/centerAnalyticsQueries'
import { labelDeadClick, mergeDeadClicks, type DeadClickRow } from '@/services/posthog/deadClicks'
import { getPostHogQueryConfig, PostHogQueryError, queryHogQL } from '@/services/posthog/hogql'
import { ROOT_DOMAIN } from '@/utilities/domain'
import { z } from 'zod'

const config = { apiKey: 'phx_test', projectId: '123', host: 'https://posthog.test' }
const QUERY_URL = 'https://posthog.test/api/projects/123/query'

const server = setupServer()
setupMswLifecycle(server)

const hogqlBodySchema = z.object({ query: z.object({ kind: z.string(), query: z.string() }) })

async function readBody(request: Request) {
  return hogqlBodySchema.parse(await request.json())
}

function hogqlResult(columns: string[], results: unknown[][]) {
  return HttpResponse.json({ columns, results })
}

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
    expect(
      getPostHogQueryConfig({
        POSTHOG_PERSONAL_API_KEY: 'phx',
        POSTHOG_PROJECT_ID: '1',
        POSTHOG_QUERY_HOST: 'https://eu.posthog.com',
      })?.host,
    ).toBe('https://eu.posthog.com')
  })
})

describe('queryHogQL', () => {
  it('posts a HogQLQuery with the bearer key and maps columns onto rows', async () => {
    let received: { auth: string | null; body: z.infer<typeof hogqlBodySchema> } | undefined
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        received = {
          auth: request.headers.get('authorization'),
          body: await readBody(request),
        }
        return hogqlResult(
          ['path', 'pageviews'],
          [
            ['/a', 3],
            ['/b', 1],
          ],
        )
      }),
    )

    const rows = await queryHogQL(
      config,
      'SELECT 1',
      z.object({ path: z.string(), pageviews: z.number() }),
    )

    expect(rows).toEqual([
      { path: '/a', pageviews: 3 },
      { path: '/b', pageviews: 1 },
    ])
    expect(received?.auth).toBe('Bearer phx_test')
    expect(received?.body.query).toEqual({ kind: 'HogQLQuery', query: 'SELECT 1' })
  })

  it('throws PostHogQueryError on a non-OK response', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.text('nope', { status: 401 })))

    await expect(queryHogQL(config, 'SELECT 1', z.object({}))).rejects.toBeInstanceOf(
      PostHogQueryError,
    )
  })

  it('throws PostHogQueryError when a row does not match the schema', async () => {
    server.use(http.post(QUERY_URL, () => hogqlResult(['path'], [[null]])))

    await expect(
      queryHogQL(config, 'SELECT 1', z.object({ path: z.string() })),
    ).rejects.toBeInstanceOf(PostHogQueryError)
  })
})

describe('analyticsWindow', () => {
  it('starts at the UTC day boundary 30 days ago and compares with the 30 days before', () => {
    const now = new Date('2026-11-09T19:45:12Z')
    const window = analyticsWindow(now)

    expect(window.start.toISOString()).toBe('2026-10-10T00:00:00.000Z')
    expect(window.previousStart.toISOString()).toBe('2026-09-10T00:00:00.000Z')
    expect(window.end).toBe(now)
  })
})

describe('center queries', () => {
  const scope = { slug: 'nwac' as const, window: analyticsWindow(new Date('2026-11-09T19:45:12Z')) }

  it('lists the bare, www and subdomain hosts for a center', () => {
    expect(centerHosts('nwac')).toEqual(['nwac.us', 'www.nwac.us', `nwac.${ROOT_DOMAIN}`])
    expect(centerHosts('sac')).toEqual([
      'sierraavalanchecenter.org',
      'www.sierraavalanchecenter.org',
      `sac.${ROOT_DOMAIN}`,
    ])
  })

  it('matches the center super property or its hosts, and leaves out admin and non-production', () => {
    const filter = centerFilter(scope)

    expect(filter).toContain("properties.center = 'NWAC'")
    expect(filter).toContain(
      `properties.$host IN ('nwac.us', 'www.nwac.us', 'nwac.${ROOT_DOMAIN}')`,
    )
    expect(filter).toContain("NOT IN ('preview', 'development')")
    expect(filter).toContain("NOT startsWith(coalesce(properties.$pathname, ''), '/admin')")
  })

  it('splits the overview into current and previous periods inside one scan', () => {
    const sql = overviewQuery(scope)

    expect(sql).toContain("timestamp >= toDateTime('2026-09-10 00:00:00')")
    expect(sql).toContain("timestamp < toDateTime('2026-11-09 19:45:12')")
    expect(sql).toContain(
      "uniqIf(person_id, timestamp >= toDateTime('2026-10-10 00:00:00')) AS visitors",
    )
    expect(sql).toContain('AS previous_pageviews')
  })

  it("leaves the center's own hosts out of the referrer list", () => {
    expect(topReferrersQuery(scope)).toContain(
      `coalesce(properties.$referring_domain, '') NOT IN ('nwac.us', 'www.nwac.us', 'nwac.${ROOT_DOMAIN}')`,
    )
  })

  it('excludes native selects and map surfaces from dead clicks', () => {
    const sql = deadClicksQuery(scope)

    expect(sql).toContain("NOT has(elements_chain_elements, 'select')")
    expect(sql).toContain("NOT match(elements_chain, 'mapboxgl|maplibregl|leaflet')")
    expect(sql).toContain("event = '$dead_click'")
  })
})

describe('labelDeadClick', () => {
  const row = (overrides: Partial<DeadClickRow>) => ({
    tag: 'div',
    alt: null,
    aria_label: null,
    el_text: null,
    href: null,
    ...overrides,
  })

  it('prefers alt text, then element text, then aria-label', () => {
    expect(labelDeadClick(row({ tag: 'img', alt: '2627 T-Shirt', el_text: 'x' }))).toBe(
      'Image “2627 T-Shirt”',
    )
    expect(labelDeadClick(row({ tag: 'p', el_text: 'Choose a helmet', aria_label: 'y' }))).toBe(
      'Paragraph “Choose a helmet”',
    )
    expect(labelDeadClick(row({ tag: 'span', aria_label: 'breadcrumb' }))).toBe('Text “breadcrumb”')
  })

  it('falls back to the href, then the element kind', () => {
    expect(labelDeadClick(row({ tag: 'a', href: 'https://example.org/x' }))).toBe(
      'Link to https://example.org/x',
    )
    expect(labelDeadClick(row({ tag: 'div' }))).toBe('Page area')
    expect(labelDeadClick(row({ tag: 'marquee' }))).toBe('<marquee>')
    expect(labelDeadClick(row({ tag: null }))).toBe('Element')
  })

  it('collapses whitespace and clips long text', () => {
    const long = `Take a few minutes to\n look over your ${'gear '.repeat(30)}`
    const label = labelDeadClick(row({ tag: 'p', el_text: long }))

    expect(label).not.toContain('\n')
    expect(label.length).toBeLessThanOrEqual('Paragraph “”'.length + 80)
    expect(label.endsWith('…”')).toBe(true)
  })
})

describe('mergeDeadClicks', () => {
  const base = { tag: 'img', alt: 'Hat', aria_label: null, el_text: null, href: null }

  it('adds clicks for the same page and label, keeps the largest people count, sorts by people', () => {
    const merged = mergeDeadClicks([
      { ...base, path: '/shop', clicks: 10, people: 4 },
      { ...base, path: '/shop', href: 'https://x', clicks: 5, people: 3 },
      { ...base, path: '/other', alt: 'Other', clicks: 2, people: 9 },
    ])

    expect(merged).toEqual([
      { path: '/other', label: 'Image “Other”', clicks: 2, people: 9 },
      { path: '/shop', label: 'Image “Hat”', clicks: 15, people: 4 },
    ])
  })

  it('caps the list', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({
      ...base,
      path: `/p${i}`,
      clicks: 1,
      people: 1,
    }))
    expect(mergeDeadClicks(rows, 10)).toHaveLength(10)
  })
})

describe('percentChange', () => {
  it('returns the change as a percentage, or null without a baseline', () => {
    expect(percentChange({ current: 150, previous: 100 })).toBe(50)
    expect(percentChange({ current: 50, previous: 100 })).toBe(-50)
    expect(percentChange({ current: 10, previous: 0 })).toBeNull()
  })
})

describe('fetchCenterAnalytics', () => {
  function respondByQuery(sql: string) {
    if (sql.includes('AS previous_visitors')) {
      return hogqlResult(
        [
          'visitors',
          'previous_visitors',
          'sessions',
          'previous_sessions',
          'pageviews',
          'previous_pageviews',
        ],
        [[120, 100, 200, 180, 500, 400]],
      )
    }
    if (sql.includes('AS referrer')) {
      return hogqlResult(['referrer', 'visitors', 'sessions'], [['$direct', 80, 90]])
    }
    if (sql.includes('AS device')) {
      return hogqlResult(['device', 'visitors', 'pageviews'], [['Desktop', 70, 300]])
    }
    if (sql.includes('AS region')) {
      return hogqlResult(['region', 'visitors', 'pageviews'], [['Washington, US', 60, 250]])
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
    if (sql.includes("event = '$dead_click'")) {
      return hogqlResult(
        ['path', 'tag', 'alt', 'aria_label', 'el_text', 'href', 'clicks', 'people'],
        [['/support', 'img', 'Wool Hat', null, null, null, 46, 41]],
      )
    }
    return hogqlResult(['path', 'pageviews', 'visitors'], [['/forecasts', 300, 90]])
  }

  it('runs every tile query and assembles a typed result', async () => {
    const queries: string[] = []
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        const body = await readBody(request)
        queries.push(body.query.query)
        return respondByQuery(body.query.query)
      }),
    )

    const result = await fetchCenterAnalytics(config, 'nwac', new Date('2026-11-09T19:45:12Z'))

    expect(queries).toHaveLength(7)
    expect(result.window.start).toBe('2026-10-10T00:00:00.000Z')
    expect(result.overview.visitors).toEqual({ current: 120, previous: 100 })
    expect(result.overview.pageviews).toEqual({ current: 500, previous: 400 })
    expect(result.topPages).toEqual([{ path: '/forecasts', pageviews: 300, visitors: 90 }])
    expect(result.topReferrers[0]?.referrer).toBe('$direct')
    expect(result.devices[0]?.device).toBe('Desktop')
    expect(result.topRegions[0]?.region).toBe('Washington, US')
    expect(result.sponsors).toEqual([
      {
        sponsorId: '7',
        name: 'Outdoor Research',
        impressions: 200,
        clicks: 5,
        clickThroughRate: 0.025,
      },
      { sponsorId: '8', name: 'Sponsor 8', impressions: 0, clicks: 0, clickThroughRate: null },
    ])
    expect(result.deadClicks).toEqual([
      { path: '/support', label: 'Image “Wool Hat”', clicks: 46, people: 41 },
    ])
  })

  it('fails as a whole when one query fails', async () => {
    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        const body = await readBody(request)
        if (body.query.query.includes("event = '$dead_click'")) {
          return HttpResponse.text('boom', { status: 500 })
        }
        return respondByQuery(body.query.query)
      }),
    )

    await expect(fetchCenterAnalytics(config, 'nwac')).rejects.toBeInstanceOf(PostHogQueryError)
  })
})
