/**
 * Validates the Weather tab structure produced by navigationSeed, covering:
 * - Mountain Weather appears as the first Weather item for weather-platform tenants
 * - NWAC gets "Weather Stations" → stations page, then "Weather Stations Map" → map
 * - Non-NWAC tenants get "Weather Stations" → map (no separate stations page)
 */

jest.mock('../../src/payload.config', () => ({}))

import { navigationSeed } from '@/endpoints/seed/navigation'
import type { BuiltInPage, Navigation, Page, Tenant } from '@/payload-types'
import type { Payload } from 'payload'
import { buildBuiltInPage, buildPage, buildTenant } from '../builders'

const mockPayload: Payload = {
  // @ts-expect-error - partial mock of pino Logger; navigationSeed only warns
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}

const makePage = (slug: string, title: string, id = 100) => buildPage({ id, slug, title })

const makeBuiltInPage = (url: string, title: string, id = 200) =>
  buildBuiltInPage({ id, url, title })

type NavItem = NonNullable<NonNullable<Navigation['weather']>['items']>[number]

function itemLabel(item: NavItem): string | undefined {
  return 'link' in item ? (item.link?.label ?? undefined) : (item.label ?? undefined)
}

function itemRefId(item: NavItem): number | undefined {
  if (!('link' in item) || !item.link || item.link.type !== 'internal') return undefined
  const ref = item.link.reference
  if (!ref || typeof ref.value !== 'number') return undefined
  return ref.value
}

describe('navigationSeed — Weather tab', () => {
  const weatherForecastBIP = makeBuiltInPage('/weather/forecast', 'Mountain Weather', 301)
  const stationMapBIP = makeBuiltInPage('/weather/stations/map', 'Weather Stations', 302)
  const stationsPage = makePage('stations', 'Weather Stations', 401)
  const weatherToolsPage = makePage('weather-tools', 'Weather Tools', 402)

  function buildNav(
    tenantSlug: Tenant['slug'],
    opts: { includeWeatherForecast?: boolean; includeStationsPage?: boolean } = {},
  ) {
    const tenant = buildTenant({ slug: tenantSlug, name: tenantSlug.toUpperCase() })
    const pages: Record<string, Record<string, Page>> = {
      [tenantSlug]: {
        'weather-tools': weatherToolsPage,
        ...(opts.includeStationsPage ? { stations: stationsPage } : {}),
        // Provisioned pages that other tabs reference — stubs so navigationSeed
        // doesn't warn about missing pages.
        learn: makePage('learn', 'Learn', 500),
        'field-classes': makePage('field-classes', 'Field Classes', 501),
        'avalanche-awareness-classes': makePage('avalanche-awareness-classes', 'AAC', 502),
        'courses-by-external-providers': makePage('courses-by-external-providers', 'CEP', 503),
        workshops: makePage('workshops', 'Workshops', 504),
        'request-a-class': makePage('request-a-class', 'Request a Class', 505),
        scholarships: makePage('scholarships', 'Scholarships', 506),
        mentorship: makePage('mentorship', 'Mentorship', 507),
        'beacon-parks': makePage('beacon-parks', 'Beacon Parks', 508),
        'about-us': makePage('about-us', 'About Us', 510),
        'agency-partners': makePage('agency-partners', 'Agency Partners', 511),
        'who-we-are': makePage('who-we-are', 'Who We Are', 512),
        'annual-report-minutes': makePage('annual-report-minutes', 'Annual Report', 513),
        employment: makePage('employment', 'Employment', 514),
        'donate-membership': makePage('donate-membership', 'Donate', 520),
        'workplace-giving': makePage('workplace-giving', 'Workplace Giving', 521),
        'other-ways-to-give': makePage('other-ways-to-give', 'Other Ways', 522),
        'corporate-sponsorship': makePage('corporate-sponsorship', 'Corporate', 523),
        volunteer: makePage('volunteer', 'Volunteer', 524),
        'local-accident-reports': makePage('local-accident-reports', 'Local', 530),
        'avalanche-accident-statistics': makePage('avalanche-accident-statistics', 'Stats', 531),
        'us-avalanche-accidents': makePage('us-avalanche-accidents', 'US', 532),
        'grief-and-loss-resources': makePage('grief-and-loss-resources', 'Grief', 533),
        'avalanche-accident-map': makePage('avalanche-accident-map', 'Map', 534),
      },
    }
    const builtInPages: Record<string, Record<string, BuiltInPage>> = {
      [tenantSlug]: {
        '/weather/stations/map': stationMapBIP,
        '/observations': makeBuiltInPage('/observations', 'Recent Observations', 310),
        '/observations/submit': makeBuiltInPage('/observations/submit', 'Submit Observations', 311),
        '/forecasts/avalanche': makeBuiltInPage('/forecasts/avalanche', 'All Forecasts', 312),
        '/forecasts/avalanche/archive': makeBuiltInPage(
          '/forecasts/avalanche/archive',
          'Forecast Archive',
          313,
        ),
        '/blog': makeBuiltInPage('/blog', 'Blog', 314),
        '/events': makeBuiltInPage('/events', 'Events', 315),
        ...(opts.includeWeatherForecast ? { '/weather/forecast': weatherForecastBIP } : {}),
      },
    }
    return navigationSeed(mockPayload, pages, builtInPages, tenant)
  }

  it('includes Mountain Weather as first Weather item for weather-platform tenant (sac)', () => {
    const nav = buildNav('sac', { includeWeatherForecast: true })
    const items = nav.weather?.items ?? []
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(itemLabel(items[0])).toBe('Mountain Weather')
    expect(itemRefId(items[0])).toBe(weatherForecastBIP.id)
  })

  it('omits Mountain Weather for non-weather-platform tenants', () => {
    const nav = buildNav('dvac')
    const items = nav.weather?.items ?? []
    const labels = items.map(itemLabel)
    expect(labels).not.toContain('Mountain Weather')
  })

  it('links Weather Stations to the stations page for NWAC', () => {
    const nav = buildNav('nwac', { includeStationsPage: true })
    const items = nav.weather?.items ?? []
    const wsItem = items.find((i) => itemLabel(i) === 'Weather Stations')
    expect(wsItem && itemRefId(wsItem)).toBe(stationsPage.id)
  })

  it('labels the station map "Weather Stations Map" for NWAC', () => {
    const nav = buildNav('nwac', { includeStationsPage: true })
    const items = nav.weather?.items ?? []
    const mapItem = items.find((i) => itemLabel(i) === 'Weather Stations Map')
    expect(mapItem && itemRefId(mapItem)).toBe(stationMapBIP.id)
  })

  it('links Weather Stations directly to the map for non-NWAC tenants', () => {
    const nav = buildNav('dvac')
    const items = nav.weather?.items ?? []
    const wsItem = items.find((i) => itemLabel(i) === 'Weather Stations')
    expect(wsItem && itemRefId(wsItem)).toBe(stationMapBIP.id)
  })

  it('does not include a "Weather Stations Map" item for non-NWAC tenants', () => {
    const nav = buildNav('dvac')
    const items = nav.weather?.items ?? []
    const labels = items.map(itemLabel)
    expect(labels).not.toContain('Weather Stations Map')
  })

  it('always includes Weather Tools as the last Weather item', () => {
    const nav = buildNav('sac', { includeWeatherForecast: true })
    const items = nav.weather?.items ?? []
    const last = items[items.length - 1]
    expect(itemLabel(last)).toBe('Weather Tools')
  })
})
