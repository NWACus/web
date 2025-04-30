'use client'
import { Brand } from '@/payload-types'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ImageMedia } from '../Media/ImageMedia'
import { Button } from '../ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from '../ui/navigation-menu'
import { MobileNav } from './MobileNav'
import { getLabel, getUrl, TopLevelNavItemDefinition } from './utils'

export function HeaderClient({
  topLevelNavItems,
  banner,
}: {
  topLevelNavItems: TopLevelNavItemDefinition[]
  banner: Brand['banner']
}) {
  const [activeMenuItem, setActiveMenuItem] = useState<string>()
  const containerReference = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerReference.current

    if (!container) return

    const updatePosition = (item: HTMLElement) => {
      const menuItemRect = item.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const left = menuItemRect.left - containerRect.left

      container.style.setProperty('--radix-navigation-menu-item-active-left', `${left}px`)
    }

    const mutationCallback = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-state' &&
          mutation.target instanceof HTMLElement &&
          mutation.target.hasAttribute('aria-expanded') &&
          mutation.target.dataset.state === 'open'
        ) {
          updatePosition(mutation.target)
        }
      }
    }

    const observer = new MutationObserver(mutationCallback)

    observer.observe(container, {
      childList: true,
      attributes: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <header className="bg-header">
      <MobileNav
        topLevelNavItems={topLevelNavItems}
        banner={typeof banner !== 'number' ? banner : undefined}
      />

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
        <div className="hidden md:block">
          <NavigationMenu
            ref={containerReference}
            value={activeMenuItem}
            onValueChange={setActiveMenuItem}
          >
            <NavigationMenuList>
              {topLevelNavItems.map((navItem) => {
                if (!navItem.item?.items || navItem.item.items.length === 0) {
                  return (
                    <NavigationMenuItem key={navItem.label} value={navItem.label}>
                      <Link href={navItem.item?.link?.url ?? '#'} legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          {navItem.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )
                }

                const label = getLabel(navItem.item.link, navItem.label)
                return (
                  <NavigationMenuItem key={label} value={label}>
                    <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid min-w-max p-6 gap-5">
                        {navItem.item.items.map((item) => {
                          const hasSubItems = item.items && item.items.length > 0

                          return (
                            <div key={item.id} className="flex flex-col">
                              {!hasSubItems && navItem.item.link && (
                                <div className="">
                                  <Link
                                    href={getUrl(item.link)}
                                    target={item.link?.newTab ? '_blank' : undefined}
                                  >
                                    {getLabel(item.link, 'Menu Item')}
                                  </Link>
                                </div>
                              )}
                              {hasSubItems && (
                                <>
                                  <div className=" border-b border-gray-200 pb-2">
                                    <span className="text-base font-medium">
                                      {getLabel(item.link, 'Menu Item')}
                                    </span>
                                  </div>
                                  <ul className="space-y-2 pt-3 pl-4">
                                    {item.items?.map((subItem) => (
                                      <li key={subItem.id}>
                                        {subItem.link ? (
                                          <Link
                                            href={getUrl(subItem.link)}
                                            className="text-sm"
                                            target={subItem.link?.newTab ? '_blank' : undefined}
                                          >
                                            {getLabel(subItem.link, 'Sub Menu Item')}
                                          </Link>
                                        ) : (
                                          <span className="text-sm block">
                                            {getLabel(subItem.link, 'Sub Menu Item')}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
              <NavigationMenuItem>
                <Link href="/donate" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'py-0')}>
                    <Button variant="callout">Donate</Button>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuViewport />
          </NavigationMenu>
        </div>
      </div>
    </header>
  )
}
