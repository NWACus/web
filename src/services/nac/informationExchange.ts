/**
 * Whether a center is an avalanche information exchange.
 *
 * An information exchange — EWYAIX, SOAIX — collects observations and hosts weather stations but
 * issues no forecasts, so a product that frames its zones in terms of danger has nothing true to
 * say there. Upstream carries no discriminator for this: the legacy danger-map widget recognizes
 * one by its id ending in `AIX`. AvyWeb reads it off the capability feed instead (the rule #269
 * records — no `kind` field, `platforms.*` drives everything): no forecasts platform and an
 * observations platform.
 *
 * That agrees with the suffix on both exchanges and additionally classifies the observation-only
 * centers the suffix misses (CAC, EARAC — not tenants), for which the answer is equally right. A
 * center with neither platform (CAIC) or warnings-only (UAC) is not an exchange: it has nothing to
 * pivot *to*.
 */
import type { AvalancheCenterPlatforms } from './types/schemas'

export function isInformationExchange(
  platforms: Pick<AvalancheCenterPlatforms, 'forecasts' | 'obs'>,
): boolean {
  return !platforms.forecasts && platforms.obs
}
