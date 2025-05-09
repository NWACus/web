'use client'
import { cn } from '@/utilities/ui'
import { usePathname } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { RenderNavLink } from './RenderNavLink'
import { hasActiveDescendent, isActive, NavItem } from './utils'

const underlineHoverClassName =
  "relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-header-foreground-highlight after:transition-all after:duration-300 hover:after:w-full hover:text-header-foreground-highlight"

type MobileNavItemProps = {
  label: string
  navItem: NavItem
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>
  className?: string
}

export const MobileNavItem = ({
  label,
  navItem,
  setMobileNavOpen,
  className,
}: MobileNavItemProps) => {
  const pathname = usePathname()

  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <RenderNavLink
        link={navItem.link}
        className={cn(
          'flex items-center py-3 text-base px-2 hover:text-header-foreground-highlight',
          isActive(navItem, pathname) &&
            'text-header-foreground-highlight hover:text-header-foreground-highlight/90',
          className,
        )}
        onClick={() => setMobileNavOpen(false)}
      />
    ) : (
      <span className={className}>{label}</span>
    )
  }

  return (
    <AccordionItem value={label} className={cn('border-0 px-2', className)}>
      <AccordionTrigger
        className={cn(
          'py-3 capitalize text-base hover:no-underline hover:text-header-foreground-highlight',
          navItem.items.some((item) => hasActiveDescendent(item, pathname)) &&
            'text-header-foreground-highlight',
        )}
        chevronClassName="h-6 w-6 text-inherit"
      >
        {navItem.link ? navItem.link.label : label}
      </AccordionTrigger>
      <AccordionContent className="pt-0 pb-2">
        <Accordion type="single" collapsible className="pl-4">
          {navItem.items.map((item) => {
            if (!item.items || item.items.length === 0) {
              return item.link ? (
                <RenderNavLink
                  key={item.id}
                  link={item.link}
                  className={cn('flex items-center pt-3 pb-1.5 text-base')}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <div
                    className={cn(
                      underlineHoverClassName,
                      'pb-1.5',
                      isActive(item, pathname) && 'text-header-foreground-highlight after:w-full',
                    )}
                  >
                    {item.link.label}
                  </div>
                </RenderNavLink>
              ) : null
            }

            if (item.link?.label) {
              return (
                <AccordionItem key={item.id} value={item.link.label} className="border-0">
                  <AccordionTrigger
                    className={cn(
                      'py-2 text-base font-normal hover:no-underline',
                      item.items.some((item) => hasActiveDescendent(item, pathname)) &&
                        'text-header-foreground-highlight',
                    )}
                    chevronClassName="h-6 w-6 text-inherit"
                  >
                    <div
                      className={cn(
                        underlineHoverClassName,
                        'pb-1.5',
                        isActive(item, pathname) && 'text-header-foreground-highlight after:w-full',
                      )}
                    >
                      {item.link.label}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="py-0 w-full">
                    <div className="pl-4">
                      {item.items?.map((subItem) =>
                        subItem.link ? (
                          <RenderNavLink
                            key={subItem.id}
                            link={subItem.link}
                            className={cn('flex items-center pt-3 pb-1.5 text-base')}
                            onClick={() => setMobileNavOpen(false)}
                          >
                            <div
                              className={cn(
                                underlineHoverClassName,
                                'pb-1.5',
                                isActive(subItem, pathname) &&
                                  'text-header-foreground-highlight after:w-full',
                              )}
                            >
                              {subItem.link.label}
                            </div>
                          </RenderNavLink>
                        ) : null,
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            }
          })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}
