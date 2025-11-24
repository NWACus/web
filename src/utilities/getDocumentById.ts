'use server'
import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { DataFromCollectionSlug, getPayload } from 'payload'

type Collection = keyof Config['collections']

export async function getDocumentById<T extends Collection>(
  collection: T,
  id: number,
  depth = 1,
): Promise<DataFromCollectionSlug<T>> {
  const payload = await getPayload({ config: configPromise })

  const doc = await payload.findByID({
    collection,
    depth,
    id,
  })

  return doc
}
