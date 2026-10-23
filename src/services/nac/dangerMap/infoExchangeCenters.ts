/**
 * Which of the danger map's centers are information exchanges, read from the avalanche-centers
 * platforms feed as the widget does (afp-public-widgets#308).
 *
 * Server-only, and kept out of `dangerMapZones.ts` on purpose: the map imports that module in the
 * browser, and this one pulls in the zod schemas.
 */
import { getAllAvalancheCenterCapabilities, logNacError } from '../nac'
import { isInfoExchange, type AvalancheCenterPlatforms } from '../types/schemas'

export type PlatformsByCenterId = ReadonlyMap<string, AvalancheCenterPlatforms>

/** The widget gives up on this feed after 5s and paints the zones regardless; so do we, sooner. */
export const PLATFORMS_TIMEOUT_MS = 4000

/**
 * There is no fallback on the `AIX` id suffix: the feed covers every such center, and the suffix
 * is wrong for EWYAIX, which now forecasts. Without the feed, no zone is an exchange.
 */
export function infoExchangeCenterIds(
  centerIds: Iterable<string>,
  platformsById: PlatformsByCenterId | null,
): Set<string> {
  const ids = new Set<string>()
  for (const id of centerIds) {
    const platforms = platformsById?.get(id)
    if (platforms && isInfoExchange(platforms)) ids.add(id)
  }
  return ids
}

async function fetchPlatformsByCenterId(): Promise<PlatformsByCenterId | null> {
  try {
    const { centers } = await getAllAvalancheCenterCapabilities()
    return new Map(centers.map((center) => [center.id, center.platforms]))
  } catch (err) {
    await logNacError(err, 'Danger map: platforms feed unavailable')
    return null
  }
}

/**
 * Every center's platforms, or null if the feed failed or took longer than the zones should wait.
 * Neither is fatal: every zone then gets the ordinary popup.
 */
export async function getPlatformsByCenterId(): Promise<PlatformsByCenterId | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), PLATFORMS_TIMEOUT_MS)
  })
  try {
    return await Promise.race([fetchPlatformsByCenterId(), timedOut])
  } finally {
    clearTimeout(timer)
  }
}
