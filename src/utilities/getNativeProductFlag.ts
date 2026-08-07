import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Products with a per-tenant native-vs-widget rollout flag (Control 1). */
export type NativeProduct = 'forecast' | 'warning'

/**
 * Reads the per-tenant × per-product native rollout flag from Settings.
 * Returns false when the setting or product flag is not set (widget stays the default).
 */
export async function getNativeProductFlag(
  centerSlug: string,
  product: NativeProduct,
): Promise<boolean> {
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

  const settings = settingsRes.docs[0]
  return settings?.nativeProducts?.[product] ?? false
}
