// The same false positive the sibling freshness routes waive; see `weather-freshness`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { nwacWeatherPageFingerprint } from '@/services/nac/forecastFingerprint'
import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { getAvalancheCenterMetadata, nwacWeatherCacheTag } from '@/services/nac/nac'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { unknownCenterResponse } from '@/utilities/apiResponses'
import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'
import { reportIndeterminate } from '@/utilities/freshnessTelemetry'
import { revalidateTag } from 'next/cache'

// Keeps each answer's own `Cache-Control` reaching the CDN, as on the sibling freshness routes.
export const dynamic = 'force-dynamic'

interface Today {
  fresh: NWACWeatherForecastDay | null
  /** What the shared cache is serving. */
  cached: NWACWeatherForecastDay | null
}

/** Today's forecast, fresh and as cached, or `null` when either read (or the timezone) fails. */
async function readToday(center: string): Promise<Today | null> {
  try {
    const { timezone } = await getAvalancheCenterMetadata(center)
    const today = todayInTimezone(timezone)
    const source = getNWACWeatherSource()
    const [fresh, cached] = await Promise.all([source.getDayFresh(today), source.getDay(today)])
    return { fresh, cached }
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
 * The date is the server's own "today", never the caller's, so the address cannot be used to fan
 * requests out across dates. And because the v3 source throws on failure, a fresh `null` is a real
 * "nothing published": a withdrawn forecast is reported like any other change.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; fingerprint: string }> },
) {
  const { center, fingerprint } = await params

  if (!isFingerprint(fingerprint)) return malformedFingerprintResponse()
  if (center !== 'nwac') return unknownCenterResponse()

  const today = await readToday(center)
  if (!today) {
    reportIndeterminate('nwac-weather-unreachable', center)
    return indeterminateResponse()
  }

  const freshEtag = nwacWeatherPageFingerprint(today.fresh)
  if (nwacWeatherPageFingerprint(today.cached) !== freshEtag) revalidateTag(nwacWeatherCacheTag)

  if (fingerprint !== freshEtag) return changedResponse(freshEtag)
  return unchangedResponse()
}
