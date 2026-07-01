/**
 * Per-product source adapter interfaces.
 *
 * Each product (forecast, warning, …) is fetched through a source that returns the
 * normalized model (see `../model/forecast`), never a raw API response. A v2 implementation
 * lives in `./v2`; a future v3 implementation drops in behind the same interface. The active
 * implementation per product is chosen by code/env config (see `./config`), not by tenant.
 */
import type { ForecastResult, WarningProduct, Weather } from '../model/forecast'

export interface ForecastSource {
  /** The zone's current forecast/summary, or `null` when none is published. */
  getForecast(centerId: string, zoneId: number): Promise<ForecastResult | null>
}

export interface WarningSource {
  /** The zone's active warning/watch/special bulletin, or `null` when none is active. */
  getWarning(centerId: string, zoneId: number): Promise<WarningProduct | null>
}

export interface WeatherSource {
  /** A weather product by id (from a forecast's `weather_data.weather_product_id`), or `null`. */
  getWeather(weatherProductId: number): Promise<Weather | null>
}
