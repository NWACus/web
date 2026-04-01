import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Reads the useNativeForecasts feature flag for a given tenant slug.
 * Returns false if the setting is not found or the flag is not set.
 */
export async function getUseNativeForecasts(centerSlug: string): Promise<boolean> {
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
      useNativeForecasts: true,
    },
  })

  const settings = settingsRes.docs[0]
  if (!settings) {
    return false
  }

  return settings.useNativeForecasts ?? false
}
