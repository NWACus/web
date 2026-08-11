/**
 * Per-product source adapter interfaces.
 *
 * Each product (forecast, warning, …) is fetched through a source that returns the
 * normalized model (see `../model/forecast`), never a raw API response. A v2 implementation
 * lives in `./v2`; a future v3 implementation drops in behind the same interface. The active
 * implementation per product is chosen by code/env config (see `./config`), not by tenant.
 */
import type { ForecastResult, WarningProduct, Weather } from '../model/forecast'
import type { ZoneMapLayer } from '../model/mapLayer'

export interface ForecastSource {
  /** The zone's current forecast/summary, or `null` when none is published. */
  getForecast(centerId: string, zoneId: number): Promise<ForecastResult | null>
  /**
   * The zone's current forecast fetched fresh (short-cached), for the revalidate-on-view freshness
   * check — so a correction/retraction is caught faster than the page's ISR window.
   */
  getForecastFresh(centerId: string, zoneId: number): Promise<ForecastResult | null>
}

export interface WarningSource {
  /** The zone's active warning/watch/special bulletin, or `null` when none is active. */
  getWarning(centerId: string, zoneId: number): Promise<WarningProduct | null>
  /**
   * The zone's active alert fetched fresh (short-cached), for the revalidate-on-view freshness
   * check — so an alert issued or lifted after the page was rendered is caught faster than the
   * page's ISR window.
   */
  getWarningFresh(centerId: string, zoneId: number): Promise<WarningProduct | null>
}

export interface MapLayerQuery {
  /** Historical danger for a past day (`YYYY-MM-DD`); omit for today's. */
  day?: string
  /** Draw every NAC center's zones rather than just this center's. */
  allCenters?: boolean
}

export interface MapLayerSource {
  /**
   * The center's forecast zones with their danger overlay — geometry, ratings, colors, popup
   * copy and warning flags in one response. This is the danger map's only data dependency.
   */
  getMapLayer(centerSlug: string, query?: MapLayerQuery): Promise<ZoneMapLayer>
}

export interface WeatherSource {
  /** A weather product by id (from a forecast's `weather_data.weather_product_id`), or `null`. */
  getWeather(weatherProductId: number): Promise<Weather | null>
}
