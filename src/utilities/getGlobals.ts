import type { Footer, NacWidgetsConfig } from 'src/payload-types' // adjust import if needed

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

type Global = 'footer' | 'nacWidgetsConfig'

type GlobalReturnType = {
  footer: Footer
  nacWidgetsConfig: NacWidgetsConfig
}

async function getGlobal<T extends Global>(slug: T, depth = 0): Promise<GlobalReturnType[T]> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global as GlobalReturnType[T]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  }) as () => Promise<GlobalReturnType[T]>
