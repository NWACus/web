'use client'
import { Media } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
  }, [setHeaderTheme, pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [theme, setTheme, headerTheme])

  return (
    <header className="bg-[#142D56]" {...(theme ? { 'data-theme': theme } : {})}>
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
