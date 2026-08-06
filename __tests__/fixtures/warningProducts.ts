/**
 * Shared warning/watch/special fixtures. Lives outside `__tests__/client` and `__tests__/server`
 * so both jest projects can import it without jest collecting it as a suite.
 */
import type { WarningProduct } from '@/services/nac/model/forecast'
import { ProductType } from '@/services/nac/model/forecast'

export type AlertType = ProductType.Warning | ProductType.Watch | ProductType.Special

/** An active alert of the given type. The three are shape-identical apart from the discriminant. */
export function warningFixture(
  productType: AlertType,
  overrides: Partial<Omit<WarningProduct, 'product_type'>> = {},
): WarningProduct {
  const base = {
    id: 1,
    published_time: '2026-01-08T14:00:00+00:00',
    expires_time: '2026-01-09T02:00:00+00:00',
    created_at: '2026-01-08T14:00:00+00:00',
    updated_at: null,
    reason: 'Heavy snow and strong wind',
    affected_area: 'All elevations',
    bottom_line: 'Travel in avalanche terrain is not recommended.',
    hazard_discussion: '<p>Large avalanches are likely.</p>',
    avalanche_center: {
      id: 'NWAC',
      name: 'Northwest Avalanche Center',
      url: 'https://nwac.us/',
      city: 'Seattle',
      state: 'WA',
    },
    ...overrides,
  }

  switch (productType) {
    case ProductType.Watch:
      return { ...base, product_type: ProductType.Watch }
    case ProductType.Special:
      return { ...base, product_type: ProductType.Special }
    default:
      return { ...base, product_type: ProductType.Warning }
  }
}
