import type { NacWidgetsConfig } from 'src/payload-types'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

type Global = 'nacWidgetsConfig'

type GlobalReturnType = {
  nacWidgetsConfig: NacWidgetsConfig
}

async function getGlobal<T extends Global>(slug: T, depth = 0): Promise<GlobalReturnType[T]> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return global as GlobalReturnType[T]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  }) as () => Promise<GlobalReturnType[T]>
