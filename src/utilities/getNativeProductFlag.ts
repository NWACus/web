import { isNativeProductAllowed } from '@/utilities/nativeProductCenters'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

/** Products with a per-tenant native-vs-widget rollout flag (Control 1). */
export type NativeProduct = 'forecast' | 'warning' | 'dangerMap' | 'weather' | 'stationMap'

/** One Settings read per center per render, however many products and components ask. */
const getNativeProducts = cache(async (centerSlug: string) => {
  const payload = await getPayload({ config: configPromise })

  const settingsRes = await payload.find({
    collection: 'settings',
    depth: 0,
    where: {
      'tenant.slug': {
        equals: centerSlug,
      },
    },
    select: {
      nativeProducts: true,
    },
  })

  return settingsRes.docs[0]?.nativeProducts
})

/**
 * Reads the per-tenant × per-product native rollout flag from Settings.
 * Returns false when the setting or product flag is not set (widget stays the default), or when the
 * product is limited to other centers.
 */
export async function getNativeProductFlag(
  centerSlug: string,
  product: NativeProduct,
): Promise<boolean> {
  if (!isNativeProductAllowed(centerSlug, product)) return false
  const nativeProducts = await getNativeProducts(centerSlug)
  return nativeProducts?.[product] ?? false
}
