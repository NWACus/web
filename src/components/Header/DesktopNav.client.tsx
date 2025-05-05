'use client'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
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
import { TopLevelNavItem } from './utils'

export const DesktopNav = ({ topLevelNavItems }: { topLevelNavItems: TopLevelNavItem[] }) => {
  const [activeMenuItem, setActiveMenuItem] = useState<string>()
  const containerReference = useRef<HTMLElement>(null)

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
    <div className="hidden md:block">
      <NavigationMenu
        ref={containerReference}
        value={activeMenuItem}
        onValueChange={setActiveMenuItem}
      >
        <NavigationMenuList>
          {topLevelNavItems.slice(0, -1).map((navItem) => {
            const label = navItem.label || navItem.link?.label

            if (!label) return null

            if (!navItem.items) {
              return (
                <NavigationMenuItem key={label} value={label}>
                  <RenderNavLink link={navItem.link} className={navigationMenuTriggerStyle()} />
                </NavigationMenuItem>
              )
            }

            return (
              <NavigationMenuItem key={label} value={label}>
                <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid min-w-max p-6 gap-5">
                    {navItem.items.map((item) => {
                      const hasSubItems = item.items && item.items.length > 0

                      return (
                        <div key={item.id} className="flex flex-col">
                          {!hasSubItems && item.link && (
                            <NavigationMenuLink asChild>
                              <RenderNavLink link={item.link} />
                            </NavigationMenuLink>
                          )}
                          {hasSubItems && (
                            <>
                              <div className="border-b border-gray-200 pb-2">
                                <span className="text-base font-medium">
                                  {item.link?.label || (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                  )}
                                </span>
                              </div>
                              <ul className="space-y-2 pt-3 pl-4">
                                {item.items?.map((subItem) => (
                                  <li key={subItem.id}>
                                    <NavigationMenuLink asChild>
                                      <RenderNavLink link={subItem.link} className="text-sm" />
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
          <NavigationMenuItem>
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'py-0')} asChild>
              <RenderNavLink link={topLevelNavItems[topLevelNavItems.length - 1].link}>
                <Button variant="callout">Donate</Button>
              </RenderNavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  )
}
