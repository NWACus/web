'use server'
import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Collection = keyof Config['collections']

export async function getDocumentById(collection: Collection, id: number, depth = 1) {
  const payload = await getPayload({ config: configPromise })

  const doc = await payload.findByID({
    collection,
    depth,
    id,
  })

  return doc
}
