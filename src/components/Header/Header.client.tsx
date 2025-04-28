'use client'
import { Media } from '@/payload-types'
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
import { TopLevelNavItemDefinition } from './utils'

export const HeaderClient = ({
  topLevelNavItems,
  banner,
}: {
  topLevelNavItems: TopLevelNavItemDefinition[]
  banner?: Media
}) => {
  return (
    <header className="bg-[#142D56]">
      <MobileNav topLevelNavItems={topLevelNavItems} banner={banner} />

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
