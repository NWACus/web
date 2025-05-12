'use client'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu'
import { RenderNavLink } from './RenderNavLink'
import { TopLevelNavItem } from './utils'

const underlineHoverClassName =
  "relative w-fit after:content-[''] after:absolute after:left-2 after:bottom-0 after:h-[1px] after:w-0 after:bg-secondary after:transition-all after:duration-300 hover:after:w-[calc(100%-1rem)] hover:text-header-foreground-highlight"

export const DesktopNav = ({
  topLevelNavItems,
  donateNavItem,
}: {
  topLevelNavItems: TopLevelNavItem[]
  donateNavItem?: TopLevelNavItem
}) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {topLevelNavItems.map((navItem) => {
          const label = navItem.label || navItem.link?.label

          if (!label) return null

          if (!navItem.items) {
            return (
              <NavigationMenuItem key={label} value={label}>
                <NavigationMenuLink asChild>
                  <RenderNavLink link={navItem.link} className={navigationMenuTriggerStyle()} />
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={label} value={label}>
              <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid min-w-max px-4 pt-2 pb-5 gap-2">
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
                              <div
                                className={cn(
                                  'text-base w-full inline-flex items-center justify-between',
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
                                  className={cn('py-1.5', underlineHoverClassName)}
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
    </NavigationMenu>
  )
}
