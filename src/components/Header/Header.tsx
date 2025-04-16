import { HeaderClient } from './Header.client'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import { getTopLevelNavItems } from './utils'

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

  const navigationRes = await payload.find({
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

  const navigation = navigationRes.docs[0]

  if (!navigation) {
    payload.logger.error(`Navigation for tenant ${center} missing`)
    return <></>
  }

  const topLevelNavItems = await getTopLevelNavItems({ navigation })

  return (
    <HeaderClient
      topLevelNavItems={topLevelNavItems}
      banner={typeof banner !== 'number' ? banner : undefined}
    />
  )
}
