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
import type { NwacWeatherForecastDay } from '../model/nwacWeather'

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
  /**
   * The center's current weather product — what the standalone Mountain Weather page shows. One
   * product covers every zone, so any zone id of the center's finds it; pages pass the first.
   */
  getCurrentWeather(centerId: string, zoneId: number): Promise<Weather | null>
  /**
   * The center's current weather product fetched fresh (short-cached), for the weather page's
   * revalidate-on-view freshness check.
   */
  getCurrentWeatherFresh(centerId: string, zoneId: number): Promise<Weather | null>
  /**
   * The weather product that was current on a calendar day (`YYYY-MM-DD`), for forecasts that
   * predate the weather pointer (inventory row F26). Historical, so cached long.
   */
  getWeatherForDate(centerId: string, zoneId: number, date: string): Promise<Weather | null>
}

export interface NwacWeatherQuery {
  /** `YYYY-MM-DD`; omit for the latest date with content. */
  date?: string
  /** A weather zone id, avalanche zone id, or zone name; omit for every zone. */
  zone?: string | number
}

/**
 * NWAC's in-house Mountain Weather Forecast. Read from products-api only — the product never
 * had a v2 shape — so there is one implementation and no data-source control for it.
 */
export interface NwacWeatherSource {
  /** Every issuance published for a date (the latest date with content when omitted). */
  getForecastDay(query?: NwacWeatherQuery): Promise<NwacWeatherForecastDay | null>
}
