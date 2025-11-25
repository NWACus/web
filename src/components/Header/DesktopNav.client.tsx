'use client'
import { cn } from '@/utilities/ui'
import { AccordionContent } from '@radix-ui/react-accordion'
import { Accordion, AccordionItem, AccordionTrigger } from '../ui/accordion'
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
    <NavigationMenu delayDuration={100} className="z-20">
      <NavigationMenuList>
        {topLevelNavItems.map((navItem) => {
          const label = navItem.label || navItem.link?.label

          if (!label) return null

          if (!navItem.items) {
            return (
              <NavigationMenuItem key={label} value={label}>
                <NavigationMenuLink asChild>
                  <RenderNavLink
                    link={navItem.link}
                    className={cn(navigationMenuTriggerStyle(), 'font-medium')}
                  />
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          }

          const firstNavItemWithSubItems = navItem.items.find(
            (item) => item.items && item.items.length > 0,
          )

          return (
            <NavigationMenuItem key={label} value={label}>
              <NavigationMenuTrigger
                onClick={(e) => {
                  // maintains accessibility via clicking space bar or enter with this trigger focused
                  // but disables mouse clicks or touch events
                  if ('pointerType' in e.nativeEvent && e.nativeEvent.pointerType !== '') {
                    e.preventDefault()
                  }
                }}
                className="data-[state=open]:text-header-foreground-highlight font-medium"
              >
                {label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <Accordion
                  type="single"
                  collapsible
                  className="grid min-w-max px-4 pt-2 pb-5 gap-2"
                  defaultValue={firstNavItemWithSubItems?.id}
                >
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
                          <AccordionItem value={item.id} className="border-0">
                            <AccordionTrigger
                              className="pl-2 py-1.5 hover:no-underline -mb-0.5 w-full group/accordion-trigger"
                              chevronClassName="h-6 w-6 text-inherit"
                            >
                              <div
                                className={cn(
                                  'text-base pb-0.5',
                                  underlineHoverClassName,
                                  'after:left-0 after:group-hover/accordion-trigger:w-full',
                                )}
                              >
                                {item.link?.label}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
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
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </div>
                    )
                  })}
                </Accordion>
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
