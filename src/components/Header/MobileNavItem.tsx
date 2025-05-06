'use client'
import { cn } from '@/utilities/ui'
import { usePathname } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { RenderNavLink } from './RenderNavLink'
import { NavItem } from './utils'

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

  function hasActiveDescendent(navItem: NavItem) {
    if (navItem.link?.type === 'internal' && navItem.link?.url === pathname) {
      return true
    }
    if (navItem.items) {
      return navItem.items.some(hasActiveDescendent)
    }
    return false
  }

  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <RenderNavLink
        link={navItem.link}
        className={cn(
          'flex items-center py-3 text-base px-2',
          navItem.link?.type === 'internal' &&
            navItem.link?.url === pathname &&
            'text-white hover:text-white/90',
          className,
        )}
        onClick={() => setMobileNavOpen(false)}
      />
    ) : (
      <span className={className}>{label}</span>
    )
  }

  if (!navItem.items || navItem.items.length === 0) return <span>{label}</span>

  return (
    <AccordionItem
      value={label}
      className={cn('border-0 data-[state=open]:text-white px-2', className)}
    >
      <AccordionTrigger
        className={cn(
          'py-3 capitalize text-base hover:no-underline',
          navItem.items.some(hasActiveDescendent) && 'underline underline-offset-8 hover:underline',
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
                  className={cn(
                    'flex items-center py-3 text-base',
                    item.link.type === 'internal' &&
                      item.link.url === pathname &&
                      'underline underline-offset-8 hover:underline',
                  )}
                  onClick={() => setMobileNavOpen(false)}
                />
              ) : null
            }

            if (item.link?.label) {
              return (
                <AccordionItem key={item.id} value={item.link.label} className="border-0">
                  <AccordionTrigger
                    className={cn(
                      'py-2 text-base font-normal hover:no-underline data-[state=open]:font-semibold',
                      item.items.some(hasActiveDescendent) &&
                        'underline underline-offset-8 hover:underline',
                    )}
                    chevronClassName="h-6 w-6 text-inherit"
                  >
                    {item.link.label}
                  </AccordionTrigger>
                  <AccordionContent className="py-0 w-full shadow-inner">
                    <div className="pl-4">
                      {item.items?.map((subItem) =>
                        subItem.link ? (
                          <RenderNavLink
                            key={subItem.id}
                            link={subItem.link}
                            className={cn(
                              'flex items-center py-3 text-base',
                              subItem.link.type === 'internal' &&
                                subItem.link.url === pathname &&
                                'underline underline-offset-8 hover:underline',
                            )}
                            onClick={() => setMobileNavOpen(false)}
                          />
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
