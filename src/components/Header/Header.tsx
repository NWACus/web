import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import Link from 'next/link'
import invariant from 'tiny-invariant'
import { ImageMedia } from '../Media/ImageMedia'
import { DesktopNav } from './DesktopNav.client'
import { MobileNav } from './MobileNav.client'
import { getCachedTopLevelNavItems } from './utils'

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

  const { topLevelNavItems, donateNavItem } = await getCachedTopLevelNavItems(center, draft)()

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

      <div className="hidden lg:flex container pt-8 flex-col justify-center items-center gap-4">
        {banner && (
          <Link href="/" className="w-fit flex gap-10">
            <ImageMedia
              resource={banner}
              loading="eager"
              priority={true}
              imgClassName="h-[80px] object-contain w-fit"
              size="200px"
            />
            {usfsLogo && (
              <ImageMedia
                resource={usfsLogo}
                loading="eager"
                priority={true}
                imgClassName="h-[80px] object-contain w-fit"
                size="200px"
              />
            )}
          </Link>
        )}
        <DesktopNav topLevelNavItems={topLevelNavItems} donateNavItem={donateNavItem} />
      </div>
    </header>
  )
}
