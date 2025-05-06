'use client'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
import { RenderNavLink } from './RenderNavLink'
import { NavItem, TopLevelNavItem } from './utils'

const underlineHoverClassName =
  "relative after:content-[''] after:absolute after:left-2 after:bottom-0 after:h-[1px] after:w-0 after:bg-header-foreground after:transition-all after:duration-300 hover:after:w-[calc(100%-1rem)]"

export const DesktopNav = ({
  topLevelNavItems,
  donateNavItem,
}: {
  topLevelNavItems: TopLevelNavItem[]
  donateNavItem?: TopLevelNavItem
}) => {
  const [activeMenuItem, setActiveMenuItem] = useState<string>()
  const containerReference = useRef<HTMLElement>(null)

  const pathname = usePathname()

  function hasActiveDescendent(navItem: NavItem) {
    if (navItem.link?.type === 'internal' && navItem.link?.url === pathname) {
      return true
    }
    if (navItem.items) {
      return navItem.items.some(hasActiveDescendent)
    }
    return false
  }

  useEffect(function positionDropdownUnderActiveMenuItem() {
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
    <NavigationMenu
      ref={containerReference}
      value={activeMenuItem}
      onValueChange={setActiveMenuItem}
    >
      <NavigationMenuList>
        {topLevelNavItems.map((navItem) => {
          const label = navItem.label || navItem.link?.label

          if (!label) return null

          if (!navItem.items) {
            return (
              <NavigationMenuItem key={label} value={label}>
                <NavigationMenuLink
                  asChild
                  active={navItem.link?.type === 'internal' && navItem.link?.url === pathname}
                >
                  <RenderNavLink
                    link={navItem.link}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      navItem.link?.type === 'internal' &&
                        navItem.link?.url === pathname &&
                        'text-white hover:text-white/90',
                    )}
                  />
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={label} value={label}>
              <NavigationMenuTrigger
                className={cn(
                  activeMenuItem === label && 'text-white hover:text-white/90',
                  navItem.items.some(hasActiveDescendent) && 'text-white hover:text-white/90',
                )}
              >
                {label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid min-w-max max-h-[calc(100vh-225px)] overflow-y-auto px-4 pt-2 pb-5 gap-2">
                  {navItem.items.map((item) => {
                    const hasSubItems = item.items && item.items.length > 0

                    return (
                      <div key={item.id} className="flex flex-col">
                        {!hasSubItems && item.link && (
                          <NavigationMenuLink asChild>
                            <RenderNavLink
                              link={item.link}
                              className={cn(
                                'py-1.5 px-2',
                                underlineHoverClassName,
                                item.link.type === 'internal' &&
                                  item.link.url === pathname &&
                                  'after:w-[calc(100%-1rem)]',
                              )}
                            />
                          </NavigationMenuLink>
                        )}
                        {hasSubItems && (
                          <>
                            <div className="px-2 py-1.5">
                              <div
                                className={cn(
                                  'text-base w-full inline-flex items-center justify-between',
                                  item.items?.some(hasActiveDescendent) && 'font-bold',
                                )}
                              >
                                {item.link?.label}{' '}
                                <ChevronDown
                                  className="relative top-[1px] ml-0.5 h-6 w-6 transition duration-300 group-data-[state=open]:rotate-180"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                            <ul className="flex flex-col gap-1 py-1 pl-4 w-full">
                              {item.items?.map((subItem) => (
                                <li
                                  key={subItem.id}
                                  className={cn(
                                    'py-1.5',
                                    underlineHoverClassName,
                                    subItem.link?.type === 'internal' &&
                                      subItem.link?.url === pathname &&
                                      'after:w-[calc(100%-1rem)]',
                                  )}
                                >
                                  <NavigationMenuLink asChild>
                                    <RenderNavLink link={subItem.link} className="px-2" />
                                  </NavigationMenuLink>
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
        {donateNavItem && (
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
              <RenderNavLink link={donateNavItem.link}>
                <Button variant="callout">{donateNavItem.label}</Button>
              </RenderNavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
      <NavigationMenuViewport />
    </NavigationMenu>
  )
}
