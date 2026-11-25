import type { Setting, Tenant } from '@/payload-types'
import { isValidRelationship } from '@/utilities/relationships'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'
import { centerSettingsTag } from './centerSettingsTag'

type CenterSettings = Omit<Setting, 'tenant'> & { tenant: Tenant }

class SettingsNotFoundError extends Error {}

// The data cache outlives a deployment, and a release can migrate settings without a save to clear it.
// Previews also share it, though each seeds its own database.
const deploymentKey = () => process.env.VERCEL_DEPLOYMENT_ID ?? 'local'

// Throws on a miss so the miss is never cached. See docs/revalidation.md.
const getCachedCenterSettings = (center: string) =>
  unstable_cache(
    async (): Promise<CenterSettings> => {
      const payload = await getPayload({ config: configPromise })

      const { docs } = await payload.find({
        collection: 'settings',
        depth: 1,
        limit: 1,
        pagination: false,
        populate: {
          pages: { slug: true, title: true },
          tenants: { slug: true, name: true },
        },
        where: {
          'tenant.slug': {
            equals: center,
          },
        },
      })

      const settings = docs[0]
      if (!settings || !isValidRelationship(settings.tenant)) {
        throw new SettingsNotFoundError(`Settings for center "${center}" not found.`)
      }

      return { ...settings, tenant: settings.tenant }
    },
    ['center-settings', center, deploymentKey()],
    { tags: [centerSettingsTag(center)] },
  )

/** A center's settings with its tenant, images, footer form and policy pages populated. */
export const getCenterSettings = cache(async (center: string): Promise<CenterSettings | null> => {
  try {
    return await getCachedCenterSettings(center)()
  } catch (error) {
    if (error instanceof SettingsNotFoundError) return null
    throw error
  }
})
