/**
 * Source adapter entry point: resolves the configured per-product source for a center.
 * Components/pages call these — they never touch a raw fetcher or a specific backend impl.
 */
import { getProductDataSource } from './config'
import type { ForecastSource, WarningSource, WeatherSource } from './types'
import { forecastSourceV2 } from './v2/forecastSourceV2'
import { warningSourceV2 } from './v2/warningSourceV2'
import { weatherSourceV2 } from './v2/weatherSourceV2'

export { getProductDataSource } from './config'
export type { ForecastSource, WarningSource, WeatherSource } from './types'

/** The configured forecast source for a center (defaults to v2; see Control 2 in `./config`). */
export function getForecastSource(centerSlug: string): ForecastSource {
  switch (getProductDataSource('forecast', centerSlug)) {
    case 'v2':
      return forecastSourceV2
    case 'v3':
      // The seam is in place; the v3 implementation is built when products-api v3 is confirmed
      // deployed (PRD risk: v3 deployment unverified). Selecting it before then is a misconfig.
      throw new Error('NAC v3 forecast source is not implemented yet')
  }
}

/** The configured warning source for a center (defaults to v2; see Control 2 in `./config`). */
export function getWarningSource(centerSlug: string): WarningSource {
  switch (getProductDataSource('warning', centerSlug)) {
    case 'v2':
      return warningSourceV2
    case 'v3':
      throw new Error('NAC v3 warning source is not implemented yet')
  }
}

/**
 * The configured weather source for a center. The weather product is part of the forecast product
 * family (fetched by the id a forecast points to), so it follows the forecast backend selection.
 */
export function getWeatherSource(centerSlug: string): WeatherSource {
  switch (getProductDataSource('forecast', centerSlug)) {
    case 'v2':
      return weatherSourceV2
    case 'v3':
      throw new Error('NAC v3 weather source is not implemented yet')
  }
}
