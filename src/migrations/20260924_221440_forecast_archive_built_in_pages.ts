import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

/**
 * Gives every tenant that already has a forecast built-in page the forecast
 * archive's built-in pages, so admins can pick them in the nav and link
 * fields. The Mountain Weather tab 404s without a NAC weather product, so it
 * only goes to centers the AFP reports one for; if that call fails, the tab is
 * skipped rather than blocking the deploy. Navigation is left to each center.
 * Idempotent: a page a tenant already has is skipped.
 *
 * Doesn't import app code, so it stays stable if those modules are refactored.
 */

const AFP_HOST = process.env.AFP_HOST || 'https://forecasts.avalanche.org'

const FORECASTS_PATH = '/forecasts/avalanche'

const ARCHIVE_PAGES = [
  { title: 'Forecast Archive', url: '/forecasts/avalanche/archive' },
  { title: 'Danger Over Time', url: '/forecasts/avalanche/archive/danger-over-time' },
]

const WEATHER_ARCHIVE_PAGE = {
  title: 'Mountain Weather Archive',
  url: '/forecasts/avalanche/archive/mountain-weather',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// dvac shares NWAC's upstream center
const centerId = (tenantSlug: string) => (tenantSlug === 'dvac' ? 'nwac' : tenantSlug).toUpperCase()

/** Upstream ids of the centers whose AFP capabilities include forecasts and weather. */
const fetchWeatherCenters = async (): Promise<Set<string>> => {
  const res = await fetch(`${AFP_HOST}?rest_route=/v1/public/avalanche-centers`)
  if (!res.ok) throw new Error(`AFP fetch failed: ${res.status}`)
  const data: unknown = await res.json()
  if (!isRecord(data) || !Array.isArray(data.centers)) throw new Error('Unexpected AFP response')

  const ids = new Set<string>()
  for (const center of data.centers) {
    if (!isRecord(center) || typeof center.id !== 'string' || !isRecord(center.platforms)) continue
    if (center.platforms.forecasts === true && center.platforms.weather === true) ids.add(center.id)
  }
  return ids
}

const isForecastUrl = (url: string) =>
  url === FORECASTS_PATH || url.startsWith(`${FORECASTS_PATH}/`)

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    pagination: false,
    depth: 0,
    req,
  })
  const { docs: builtInPages } = await payload.find({
    collection: 'builtInPages',
    pagination: false,
    depth: 0,
    req,
  })

  const urlsByTenant = new Map<number, Set<string>>()
  for (const { url, tenant } of builtInPages) {
    const id = typeof tenant === 'object' ? tenant.id : tenant
    urlsByTenant.set(id, (urlsByTenant.get(id) ?? new Set()).add(url))
  }

  let weatherCenters = new Set<string>()
  try {
    weatherCenters = await fetchWeatherCenters()
  } catch (err) {
    payload.logger.warn(
      { err },
      'AFP capabilities unavailable; skipping the Mountain Weather Archive built-in page. Create it by hand for weather centers.',
    )
  }

  for (const tenant of tenants) {
    const urls = urlsByTenant.get(tenant.id) ?? new Set<string>()
    if (![...urls].some(isForecastUrl)) continue

    const pages = weatherCenters.has(centerId(tenant.slug))
      ? [...ARCHIVE_PAGES, WEATHER_ARCHIVE_PAGE]
      : ARCHIVE_PAGES
    for (const page of pages.filter(({ url }) => !urls.has(url))) {
      await payload.create({
        collection: 'builtInPages',
        data: { tenant: tenant.id, ...page },
        context: { disableRevalidate: true },
        req,
      })
      payload.logger.info(`Created "${page.title}" built-in page for ${tenant.slug}`)
    }
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op: the pages may already be referenced from navigation or content.
  payload.logger.info('No rollback for forecast archive built-in pages backfill')
}
