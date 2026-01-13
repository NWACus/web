'use client'
import { cn } from '@/utilities/ui'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { RenderNavLink } from './RenderNavLink'
import { NavItem } from './utils'

const underlineHoverClassName =
  "relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full hover:text-header-foreground-highlight"

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
  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <RenderNavLink
        link={navItem.link}
        className={cn(
          'flex items-center py-3 text-base px-2 hover:text-header-foreground-highlight font-medium',
          className,
        )}
        onClick={() => setMobileNavOpen(false)}
      />
    ) : (
      <span className={className}>{label}</span>
    )
  }

  const firstNavItemWithSubItems = navItem.items.find((item) => item.items && item.items.length > 0)

  return (
    <AccordionItem
      value={label}
      className={cn('border-0 px-2 data-[state=open]:text-header-foreground-highlight', className)}
    >
      <AccordionTrigger
        className={cn(
          'py-3 capitalize text-base hover:no-underline hover:text-header-foreground-highlight font-medium',
        )}
        chevronClassName="h-6 w-6 text-inherit"
      >
        {navItem.link ? navItem.link.label : label}
      </AccordionTrigger>
      <AccordionContent className="pt-0 pb-2">
        <Accordion
          type="single"
          collapsible
          defaultValue={firstNavItemWithSubItems?.id}
          className="pl-4"
        >
          {navItem.items.map((item) => {
            if (!item.items || item.items.length === 0) {
              return item.link ? (
                <RenderNavLink
                  key={item.id}
                  link={item.link}
                  className={cn('flex items-center pt-3 pb-1.5 text-base')}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <div className={cn(underlineHoverClassName, 'pb-1.5')}>{item.link.label}</div>
                </RenderNavLink>
              ) : null
            }

            const itemLabel = item.label || item.link?.label
            if (itemLabel) {
              return (
                <AccordionItem key={item.id} value={item.id} className="border-0">
                  <AccordionTrigger
                    className="py-2 text-base font-normal hover:no-underline -mb-1.5"
                    chevronClassName="h-6 w-6 text-inherit"
                  >
                    <div className={cn(underlineHoverClassName, 'pb-1.5')}>{itemLabel}</div>
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
                            <div className={cn(underlineHoverClassName, 'pb-1.5')}>
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
