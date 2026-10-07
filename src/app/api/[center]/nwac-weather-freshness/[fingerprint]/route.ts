// The same false positive the sibling freshness routes waive; see `weather-freshness`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { nwacWeatherPageFingerprint } from '@/services/nac/forecastFingerprint'
import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { getAvalancheCenterMetadata, nwacWeatherCacheTag } from '@/services/nac/nac'
import { currentNWACWeatherDay } from '@/services/nac/nwacWeatherCurrent'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { productDisabledResponse, unknownCenterResponse } from '@/utilities/apiResponses'
import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'
import { reportIndeterminate } from '@/utilities/freshnessTelemetry'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { revalidateTag } from 'next/cache'

// Keeps each answer's own `Cache-Control` reaching the CDN, as on the sibling freshness routes.
export const dynamic = 'force-dynamic'

interface Current {
  fresh: NWACWeatherForecastDay | null
  /** What the shared cache is serving. */
  cached: NWACWeatherForecastDay | null
}

/** What today's page shows, fresh and as cached, or `null` when a read (or the timezone) fails. */
async function readCurrent(center: string): Promise<Current | null> {
  try {
    const { timezone } = await getAvalancheCenterMetadata(center)
    const today = todayInTimezone(timezone)
    const source = getNWACWeatherSource()
    const [fresh, cached] = await Promise.all([source.getLatestFresh(), source.getLatest()])
    return {
      fresh: currentNWACWeatherDay(fresh, today),
      cached: currentNWACWeatherDay(cached, today),
    }
  } catch {
    return null
  }
}

/**
 * Revalidate-on-view freshness check for NWAC's Mountain Weather page (today's, not a dated one).
 * The same two independent decisions as the other freshness routes: purge the shared cache only
 * when the server sees it differ from the fresh read, and refresh this viewer when their
 * fingerprint is behind. See docs/afp-products/architecture.md, "Freshness".
 *
 * It asks about what today's page shows (`currentNWACWeatherDay`), never a date from the caller,
 * so the address cannot be used to fan requests out across dates. And because the v3 source
 * throws on failure, a fresh `null` is a real "nothing published": a withdrawn forecast is
 * reported like any other change.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; fingerprint: string }> },
) {
  const { center, fingerprint } = await params

  if (!isFingerprint(fingerprint)) return malformedFingerprintResponse()
  if (center !== 'nwac') return unknownCenterResponse()
  if (!(await getNativeProductFlag(center, 'weather'))) return productDisabledResponse()

  const current = await readCurrent(center)
  if (!current) {
    reportIndeterminate('nwac-weather-unreachable', center)
    return indeterminateResponse()
  }

  const freshEtag = nwacWeatherPageFingerprint(current.fresh)
  if (nwacWeatherPageFingerprint(current.cached) !== freshEtag) revalidateTag(nwacWeatherCacheTag)

  if (fingerprint !== freshEtag) return changedResponse(freshEtag)
  return unchangedResponse()
}
