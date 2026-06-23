/**
 * Control 2 — data source (v2/v3), per product.
 *
 * Which backend a product is fetched from is **code/env config, uniform across tenants**,
 * NOT a center-admin Setting (that's Control 1, the native-vs-widget rollout flag). Keeping
 * the data source out of tenant content keeps the test matrix small and stops an admin from
 * pointing a live page at an unverified backend. Defaults to `v2`; a product flips to `v3`
 * with no presentation change once v3 is confirmed deployed.
 *
 * Env (all optional; default v2):
 * - `NAC_FORECAST_SOURCE` / `NAC_WARNING_SOURCE` — `v2` | `v3`, the uniform default per product.
 * - `NAC_FORECAST_V3_CANARY_CENTERS` / `NAC_WARNING_V3_CANARY_CENTERS` — comma-separated center
 *   slugs that use v3 regardless of the default (a per-center canary allowlist).
 */

export type ProductDataSource = 'v2' | 'v3'

/** Products fetched through the source adapter today (forecast + warning first). */
export type AdaptedProduct = 'forecast' | 'warning'

const DEFAULT_SOURCE: ProductDataSource = 'v2'

function parseSource(value: string | undefined): ProductDataSource {
  return value === 'v2' || value === 'v3' ? value : DEFAULT_SOURCE
}

function parseCanary(value: string | undefined): Set<string> {
  if (!value) return new Set()
  return new Set(
    value
      .split(',')
      .map((slug) => slug.trim().toLowerCase())
      .filter(Boolean),
  )
}

const config: Record<AdaptedProduct, { default: ProductDataSource; v3Canary: Set<string> }> = {
  forecast: {
    default: parseSource(process.env.NAC_FORECAST_SOURCE),
    v3Canary: parseCanary(process.env.NAC_FORECAST_V3_CANARY_CENTERS),
  },
  warning: {
    default: parseSource(process.env.NAC_WARNING_SOURCE),
    v3Canary: parseCanary(process.env.NAC_WARNING_V3_CANARY_CENTERS),
  },
}

/** Resolve which backend a product is fetched from for a given center. */
export function getProductDataSource(
  product: AdaptedProduct,
  centerSlug: string,
): ProductDataSource {
  const { default: defaultSource, v3Canary } = config[product]
  if (v3Canary.has(centerSlug.toLowerCase())) return 'v3'
  return defaultSource
}
