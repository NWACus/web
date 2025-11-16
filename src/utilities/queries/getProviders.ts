import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetProvidersResult {
  providers: { label: string; value: string }[]
}

export async function getProviders(): Promise<GetProvidersResult> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'providers',
      sort: 'name',
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        name: true,
        slug: true,
      },
      pagination: false,
    })

    return {
      providers: result.docs.map((doc) => ({
        label: doc.name,
        value: doc.slug,
      })),
    }
  } catch (error) {
    Sentry.captureException(error)
    return { providers: [] }
  }
}
