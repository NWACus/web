import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import Link from 'next/link'
import invariant from 'tiny-invariant'
import { ImageMedia } from '../Media/ImageMedia'
import { DesktopNav } from './DesktopNav.client'
import { MobileNav } from './MobileNav.client'
import { convertToNavLink, getCachedTopLevelNavItems, TopLevelNavItem } from './utils'

export async function Header({ center }: { center: string }) {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const settingsRes = await payload.find({
    collection: 'settings',
    depth: 99,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  const settings = settingsRes.docs[0]

  invariant(settings, `Settings for center value ${center} not found.`)

  const banner = settings.banner

  invariant(
    typeof banner === 'object',
    `Depth not set correctly when querying settings. Banner for tenant ${center} not an object.`,
  )

  const usfsLogo = settings.usfsLogo

  invariant(
    usfsLogo === undefined || typeof usfsLogo === 'object',
    `Depth not set correctly when querying settings. USFS Logo for tenant ${center} exists but is not an object.`,
  )

  const navigationRes = await payload.find({
    collection: 'navigations',
    depth: 99,
    draft,
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

  const topLevelNavItems = await getCachedTopLevelNavItems(center)(center)

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
        banner={banner}
        usfsLogo={usfsLogo}
      />
      {/* content padding since mobile nav is position: fixed */}
      <div className="lg:hidden h-[64px] bg-background" />

      <div className="hidden lg:flex container pt-8 flex-col justify-center items-center gap-8">
        {banner && (
          <Link href="/" className="w-fit flex gap-10">
            <ImageMedia
              resource={banner}
              loading="eager"
              priority={true}
              imgClassName="h-[90px] object-contain w-fit"
            />
            {usfsLogo && (
              <ImageMedia
                resource={usfsLogo}
                loading="eager"
                priority={true}
                imgClassName="h-[90px] object-contain w-fit"
              />
            )}
          </Link>
        )}
        <DesktopNav topLevelNavItems={topLevelNavItems} donateNavItem={donateNavItem} />
      </div>
    </header>
  )
}
