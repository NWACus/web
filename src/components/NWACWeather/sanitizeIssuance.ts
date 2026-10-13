/**
 * An issuance with its forecaster-authored HTML (synopsis, extended outlook) sanitized. Done on the
 * server, before any component sees it, so the Mountain Weather components can render in the
 * browser too (the forecast widget's tabs) without `sanitize-html` reaching the client bundle.
 */
import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'
import type { NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'

export function sanitizeIssuance(issuance: NWACWeatherIssuance): NWACWeatherIssuance {
  return {
    ...issuance,
    synopsis: issuance.synopsis && sanitizeHtml(issuance.synopsis),
    extendedOutlook: issuance.extendedOutlook && sanitizeHtml(issuance.extendedOutlook),
  }
}
