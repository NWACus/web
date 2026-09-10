import { HomePage } from '@/payload-types'
import { publishedFilter } from '@/utilities/publishedFilter'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, Where } from 'payload'

/**
 * Throws on a miss rather than returning undefined. `unstable_cache` only writes an entry once
 * the callback resolves, so throwing avoids caching the miss for a year. See docs/revalidation.md.
 */
export const getCachedHomePage = (center: string, draft: boolean = false) =>
  unstable_cache(
    async (): Promise<HomePage> => {
      const payload = await getPayload({ config: configPromise })

      const conditions: Where[] = [
        {
          'tenant.slug': {
            equals: center,
          },
        },
      ]

      if (!draft) {
        conditions.push(publishedFilter())
      }

      const homePageRes = await payload.find({
        collection: 'homePages',
        draft,
        where: { and: conditions },
      })
      const homePage = homePageRes.docs[0]

      if (!homePage) {
        throw new Error(
          `No ${draft ? '' : 'published '}home page found for tenant "${center}". Refusing to cache the miss.`,
        )
      }

      return homePage
    },
    [`homePage-${center}`],
    {
      tags: ['homePage', `homePage-${center}`],
    },
  )
