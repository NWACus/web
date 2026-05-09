import { HomePage } from '@/payload-types'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, Where } from 'payload'

export const getCachedHomePage = (center: string, draft: boolean = false) =>
  unstable_cache(
    async (): Promise<HomePage | undefined> => {
      const payload = await getPayload({ config: configPromise })

      const conditions: Where[] = [
        {
          'tenant.slug': {
            equals: center,
          },
        },
      ]

      if (!draft) {
        conditions.push({
          _status: {
            equals: 'published',
          },
        })
      }

      const homePageRes = await payload.find({
        collection: 'homePages',
        draft,
        where: { and: conditions },
      })
      const homePage = homePageRes.docs[0]

      return homePage
    },
    [`homePage-${center}`],
    {
      tags: ['homePage', `homePage-${center}`],
    },
  )
