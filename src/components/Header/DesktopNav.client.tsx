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

const underlineHoverClassName =
  "relative after:content-[''] after:absolute after:left-2 after:bottom-0 after:h-[1px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-[calc(100%-1rem)]"

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
              <NavigationMenuItem key={label} value={label} asChild>
                <RenderNavLink link={navItem.link} className={navigationMenuTriggerStyle()} />
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={label} value={label}>
              <NavigationMenuTrigger
                className={cn(activeMenuItem === label && 'text-white hover:text-white/90')}
              >
                {label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid min-w-max max-h-[calc(100vh-225px)] overflow-y-auto p-4 pt-3 gap-2">
                  {navItem.items.map((item) => {
                    const hasSubItems = item.items && item.items.length > 0

                    return (
                      <div key={item.id} className="flex flex-col">
                        {!hasSubItems && item.link && (
                          <NavigationMenuLink asChild>
                            <RenderNavLink
                              link={item.link}
                              className={cn('py-1.5 px-2', underlineHoverClassName)}
                            />
                          </NavigationMenuLink>
                        )}
                        {hasSubItems && (
                          <>
                            <div className="px-2 py-1.5">
                              <div className="text-base font-medium border-b border-b-accent/90 border-gray-200 pb-1 w-full">
                                {item.link?.label || (
                                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <ul className="flex flex-col gap-2.5 pt-3 pl-4">
                              {item.items?.map((subItem) => (
                                <li key={subItem.id}>
                                  <NavigationMenuLink asChild>
                                    <RenderNavLink
                                      link={subItem.link}
                                      className={cn('py-1.5 px-2', underlineHoverClassName)}
                                    />
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
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <RenderNavLink link={topLevelNavItems[topLevelNavItems.length - 1].link}>
              <Button variant="callout">Donate</Button>
            </RenderNavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuViewport />
    </NavigationMenu>
  )
}
