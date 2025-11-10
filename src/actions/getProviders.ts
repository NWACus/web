'use server'

import config from '@/payload.config'
import { getPayload } from 'payload'

export interface GetProvidersResult {
  providers: { id: number; name: string }[]
}

export async function getProviders(): Promise<GetProvidersResult> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'providers',
    limit: 1000,
    sort: 'name',
    select: {
      id: true,
      name: true,
    },
  })

  return {
    providers: result.docs.map((doc) => ({
      id: Number(doc.id),
      name: doc.name,
    })),
  }
}
