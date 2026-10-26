/**
 * The native dated address of an archived forecast or summary, by product id: what an old widget
 * link (`#/forecast/<zone_id>/<id>`) hands over to on a native center (Forecast-244).
 */
import { validDateForProduct } from './archiveDates'
import { nacCenterId } from './centerSlug'
import type { ForecastResult } from './model/forecast'
import { fetchProductById, getAvalancheCenterMetadata } from './nac'
import { resolveDatedZoneFromSlug } from './resolveZone'
import { zoneSlugFromUrl } from './zoneSlug'

/**
 * `/forecasts/avalanche/<zone>/<valid date>` for the product, or null when this center has no
 * address for it: an unknown id, another center's product (ids are global), a stub the archive
 * hides, or a retired zone without an address of its own. `widgetZoneId` is the zone's short
 * `zone_id` from the link, which picks among a product's zones as the widget did.
 */
export async function forecastAddressForProduct(
  centerSlug: string,
  productId: number,
  widgetZoneId: string | null,
): Promise<string | null> {
  const [product, metadata] = await Promise.all([
    fetchProductById(productId),
    getAvalancheCenterMetadata(centerSlug),
  ])
  // A null `updated_at` marks the early stubs every archive view hides; their dated page 404s.
  if (!product || product.updated_at === null) return null
  if (product.avalanche_center.id.toUpperCase() !== nacCenterId(centerSlug)) return null

  const zone = productZone(product, widgetZoneId)
  const url = metadata.zones.find((z) => z.id === zone?.id)?.url
  const slug = url ? zoneSlugFromUrl(url) : undefined
  if (!zone || !slug) return null

  // The slug the dated route resolves, which a zone sharing its URL with another doesn't have.
  const dated = await resolveDatedZoneFromSlug(centerSlug, slug)
  if (dated?.zone.id !== zone.id) return null

  const date = validDateForProduct(product.published_time, metadata.timezone)
  return date ? `/forecasts/avalanche/${dated.slug}/${date}` : null
}

function productZone(product: ForecastResult, widgetZoneId: string | null) {
  const zones = product.forecast_zone
  return zones.find((zone) => zone.zone_id === widgetZoneId) ?? zones[0]
}
