/**
 * Whether a center is an avalanche information exchange: it collects observations but issues no
 * forecasts, so a product that frames its zones in terms of danger has nothing true to say there.
 *
 * Upstream has no discriminator — the legacy widget keys on the `AIX` id suffix. This is #269's
 * capability rule, which reaches the same two centers (EWYAIX, SOAIX) plus the obs-only ones the
 * suffix misses. `stations` is out of the test deliberately: both exchanges run them, but nothing
 * on the map is a station, and requiring it would un-classify an obs-only center that runs none.
 */
import type { AvalancheCenterPlatforms } from './types/schemas'

export function isInformationExchange(
  platforms: Pick<AvalancheCenterPlatforms, 'forecasts' | 'obs'>,
): boolean {
  return !platforms.forecasts && platforms.obs
}
