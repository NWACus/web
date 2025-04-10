import { HeaderClient } from './Component.client'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'

export async function Header({ center }: { center?: string }) {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const media = await payload.find({
    collection: 'brands',
    depth: 10,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })
  if (media.docs.length < 1 || typeof media.docs[0].logo !== 'object') {
    payload.logger.error(`brand for tenant ${center} missing, or logo missing from brand`)
    return <></>
  }

  const nav = await payload.find({
    collection: 'navigations',
    depth: 1000,
    draft,
    overrideAccess: true,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  return (
    <HeaderClient>
      <></>
    </HeaderClient>
  )
}
