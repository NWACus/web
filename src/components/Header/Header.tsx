import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import Link from 'next/link'
import { ImageMedia } from '../Media/ImageMedia'
import { Button } from '../ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu'
import { DesktopNavItem } from './DesktopNavItem'
import { MobileNav } from './MobileNav'
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
    <header className="bg-[#142D56]">
      <MobileNav
        topLevelNavItems={topLevelNavItems}
        banner={typeof banner !== 'number' ? banner : undefined}
      />

      <div className="hidden lg:flex container pt-8 pb-5 flex-col justify-center items-center gap-8">
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
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              {topLevelNavItems.map((navItem) => {
                if (!navItem.item?.items || navItem.item.items.length === 0) {
                  return (
                    <NavigationMenuItem key={navItem.label}>
                      <Link href={navItem.item?.link?.url ?? '#'} legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          {navItem.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )
                }

                if (navItem.item) {
                  return (
                    <DesktopNavItem
                      label={navItem.label}
                      navItem={navItem.item}
                      key={navItem.label}
                    />
                  )
                }

                return null
              })}
              <NavigationMenuItem>
                <Link href="/donate" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Button className="bg-[#E0F94B] text-black">Donate</Button>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  )
}
