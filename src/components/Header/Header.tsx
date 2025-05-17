import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import invariant from 'tiny-invariant'
import { ImageMedia } from '../Media/ImageMedia'
import { DesktopNav } from './DesktopNav.client'
import { MobileNav } from './MobileNav.client'
import { convertToNavLink, getTopLevelNavItems, TopLevelNavItem } from './utils'

export async function Header({ center }: { center: string }) {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const brands = await payload.find({
    collection: 'brands',
    depth: 99,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  if (brands.docs.length < 1) {
    payload.logger.error(`Brand for tenant ${center} missing`)
  }

  const banner = brands.docs[0]?.banner

  invariant(
    typeof banner === 'object',
    `Depth not set correctly when querying brands. Banner for tenant ${center} not an object.`,
  )

  const navigationRes = await payload.find({
    collection: 'navigations',
    depth: 99,
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

  const avalancheCenterMetadata = await getAvalancheCenterMetadata(center)

  const topLevelNavItems = await getTopLevelNavItems({ navigation, avalancheCenterMetadata })

  let donateNavItem: TopLevelNavItem | undefined = undefined

  if (navigation.donate?.link) {
    const link = convertToNavLink(navigation.donate.link)

    if (link) {
      donateNavItem = {
        label: link.label,
        link,
      }
    }
  }

  return (
    <header className="bg-header lg:shadow-sm lg:border-b">
      <MobileNav
        topLevelNavItems={topLevelNavItems}
        donateNavItem={donateNavItem}
        banner={typeof banner !== 'number' ? banner : undefined}
      />
      {/* content padding since mobile nav is fixed */}
      <div className="lg:hidden h-[64px] bg-background" />

      <div className="hidden lg:flex container pt-8 flex-col justify-center items-center gap-8">
        {banner && (
          <Link href="/" className="w-fit">
            <ImageMedia
              resource={banner}
              loading="eager"
              priority={true}
              imgClassName="h-[90px] object-contain w-fit"
            />
          </Link>
        )}
        <DesktopNav topLevelNavItems={topLevelNavItems} donateNavItem={donateNavItem} />
      </div>
    </header>
  )
}
