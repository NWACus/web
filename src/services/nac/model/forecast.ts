/**
 * Normalized, API-shape-agnostic forecast/warning model.
 *
 * This is the model every native product page consumes — components depend on these
 * types, never on a raw API response. A per-product source adapter (see `../sources/`)
 * maps each backend's response into this model, so swapping a product from legacy v2
 * to NAC v3 is a config change behind the adapter, not a change to presentation.
 *
 * Design (per ADR 018, "Native product page architecture"):
 * - **Top-level product types are owned here** (`Forecast`, `Summary`, `Warning`, …).
 *   This is where v2↔v3 deviations get absorbed by the mappers — e.g. v2 represents a
 *   "no active warning" as a null-object, which the model represents as plain `null`.
 * - **Leaf domain types/enums are reused** from the shared domain vocabulary in
 *   `../types/forecastSchemas` (a danger level, an avalanche problem, a media item are
 *   the same concepts across backends). Re-exported here so the model is the single
 *   import surface for consumers.
 */

// ─── Reused leaf domain enums (values) ──────────────────────────────────────
export {
  AvalancheProblemLikelihood,
  AvalancheProblemLocation,
  AvalancheProblemName,
  AvalancheProblemSize,
  AvalancheProblemType,
  DangerLevel,
  ExternalMediaType,
  ForecastPeriod,
  MediaType,
  ProductStatus,
  ProductType,
} from '../types/forecastSchemas'

// ─── Reused leaf domain types ───────────────────────────────────────────────
export type {
  AvalancheCenterMetadata,
  AvalancheDangerForecast,
  AvalancheForecastZoneSummary,
  AvalancheProblem,
  ExternalMediaItem,
  ImageMediaItem,
  InlineWeatherData,
  MediaItem,
  PhotoMediaItem,
  RowColumnWeatherData,
  VideoMediaItem,
  WeatherDataLabel,
  WeatherDatum,
  WeatherPeriodLabel,
} from '../types/forecastSchemas'

import type {
  AvalancheCenterMetadata,
  AvalancheDangerForecast,
  AvalancheForecastZoneSummary,
  AvalancheProblem,
  InlineWeatherData,
  MediaItem,
  RowColumnWeatherData,
} from '../types/forecastSchemas'
import { ProductStatus, ProductType } from '../types/forecastSchemas'

// ─── Owned top-level product types ──────────────────────────────────────────

/** A full single-zone avalanche forecast. */
export interface Forecast {
  id: number
  product_type: ProductType.Forecast
  status: ProductStatus
  author: string | null
  published_time: string
  expires_time: string
  created_at: string
  updated_at: string | null
  announcement?: string | null
  bottom_line: string | null
  forecast_avalanche_problems: AvalancheProblem[]
  hazard_discussion: string | null
  danger: AvalancheDangerForecast[]
  danger_level_text?: string | null
  weather_discussion?: string | null
  weather_data: { weather_product_id: number } | null
  media: MediaItem[] | null
  avalanche_center: AvalancheCenterMetadata
  forecast_zone: AvalancheForecastZoneSummary[]
}

/**
 * An off-season / non-daily statement (e.g. NWAC's "Spring Statement"). Same shape as a
 * forecast minus the per-elevation danger ratings and avalanche problems; expiry is optional.
 */
export interface Summary
  extends Omit<
    Forecast,
    'product_type' | 'danger' | 'forecast_avalanche_problems' | 'expires_time'
  > {
  product_type: ProductType.Summary
  expires_time: string | null
}

/** The product served on a zone's current/dated forecast view. */
export type ForecastResult = Forecast | Summary

/**
 * A mountain-weather product, issued separately from the forecast and pointed to by
 * `Forecast.weather_data.weather_product_id`. Its `weather_data` is an array of per-zone tables,
 * each in one of two shapes (columns/rows or inline/periods) detected by a `periods` key.
 */
export interface Weather {
  id: number
  product_type: ProductType.Weather
  status: ProductStatus
  author: string | null
  published_time: string
  created_at: string
  updated_at: string | null
  announcement?: string | null
  danger_level_text?: string | null
  weather_discussion?: string | null
  weather_data: (RowColumnWeatherData | InlineWeatherData)[]
  avalanche_center: AvalancheCenterMetadata
  forecast_zone: AvalancheForecastZoneSummary[]
}

/** An active avalanche warning. */
export interface Warning {
  id: number
  product_type: ProductType.Warning
  published_time: string
  expires_time: string
  created_at: string
  updated_at: string | null
  reason: string
  affected_area: string
  bottom_line: string
  hazard_discussion: string
  avalanche_center: AvalancheCenterMetadata
}

/** An avalanche watch (same shape as a warning). */
export interface Watch extends Omit<Warning, 'product_type'> {
  product_type: ProductType.Watch
}

/** A special avalanche bulletin (same shape as a warning). */
export interface Special extends Omit<Warning, 'product_type'> {
  product_type: ProductType.Special
}

/**
 * An active alert of any severity, or `null` when none is active. Unlike the v2 wire
 * response (which returns a null-object on miss), the model uses plain `null` for "no
 * active alert", so consumers never special-case a backend's miss representation.
 */
export type WarningProduct = Warning | Watch | Special
