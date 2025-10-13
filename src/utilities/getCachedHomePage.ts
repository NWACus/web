import { HomePage } from '@/payload-types'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

export const getCachedHomePage = (center: string, draft: boolean = false) =>
  unstable_cache(
    async (): Promise<HomePage | undefined> => {
      const payload = await getPayload({ config: configPromise })

      const homePageRes = await payload.find({
        collection: 'homePages',
        draft,
        where: {
          'tenant.slug': {
            equals: center,
          },
        },
      })
      const homePage = homePageRes.docs[0]

      return homePage
    },
    [`homePage-${center}`],
    {
      tags: ['homePage', `homePage-${center}`],
    },
  )
