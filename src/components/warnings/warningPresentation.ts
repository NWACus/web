/**
 * Shared presentation for warning/watch/special products.
 *
 * Two surfaces render alerts — the center-level banner on the home page and the per-zone banner
 * on the forecast page — and they must not drift apart: the same product type has to look the
 * same wherever a reader meets it. Both import from here.
 *
 * Colors follow the legacy widget: warnings and watches take the danger scale's High red, special
 * bulletins take blue. Reusing `dangerColor` keeps the red bound to the scale rather than to a
 * literal that could drift from it.
 */
import { dangerColor } from '@/services/nac/dangerScale'
import { DangerLevel, ProductType } from '@/services/nac/model/forecast'

/** Legacy blue for a special bulletin, which sits outside the danger scale. */
const SPECIAL_BULLETIN_COLOR = '#0000ff'

/** Solid banner fill for an alert type. Banner text is always white against it. */
export function warningBannerColor(productType: ProductType): string {
  return productType === ProductType.Special
    ? SPECIAL_BULLETIN_COLOR
    : dangerColor(DangerLevel.High)
}

// Matches the legacy afp warnings widget ("Avalanche Warning in Effect", etc.).
export function warningBannerHeading(productType: ProductType): string {
  switch (productType) {
    case ProductType.Watch:
      return 'Avalanche Watch in Effect'
    case ProductType.Special:
      return 'Special Avalanche Bulletin in Effect'
    default:
      return 'Avalanche Warning in Effect'
  }
}
