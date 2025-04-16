import { HeaderClient } from './Header.client'

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

  if (media.docs.length < 1) {
    payload.logger.error(`Brand for tenant ${center} missing`)
  }

  const banner = media.docs[0]?.banner

  if (media.docs.length > 0 && typeof banner !== 'object') {
    payload.logger.error(`Banner for tenant ${center} missing`)
  }

  const navRes = await payload.find({
    collection: 'navigations',
    depth: 10,
    draft,
    overrideAccess: true,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  const nav = navRes.docs[0]

  if (!nav) {
    payload.logger.error(`Navigation for tenant ${center} missing`)
    return <></>
  }

  return <HeaderClient nav={nav} banner={typeof banner !== 'number' ? banner : undefined} />
}
