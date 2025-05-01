import { cn } from '@/utilities/ui'
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
  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <RenderNavLink
        link={navItem.link}
        className={cn('flex items-center py-3 text-base px-2', className)}
        onClick={() => setMobileNavOpen(false)}
      />
    ) : (
      <span className={className}>{label}</span>
    )
  }

  return (
    <NavDropdown
      label={label}
      navItem={navItem}
      setMobileNavOpen={setMobileNavOpen}
      className={cn('px-2', className)}
    />
  )
}

const NavDropdown = ({ label, navItem, setMobileNavOpen, className }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) return <span>{label}</span>

  return (
    <AccordionItem value={label} className={cn('border-0 data-[state=open]:text-white', className)}>
      <AccordionTrigger
        className="py-3 capitalize text-base hover:no-underline"
        chevronClassName="h-6 w-6 text-header-foreground"
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
                  className="flex items-center py-3 text-base"
                  onClick={() => setMobileNavOpen(false)}
                />
              ) : null
            }

            return (
              <AccordionItem
                key={item.id}
                value={item.link?.label || 'Menu Item'}
                className="border-0"
              >
                <AccordionTrigger
                  className="py-2 text-base font-normal hover:no-underline data-[state=open]:font-semibold"
                  chevronClassName="h-6 w-6 text-header-foreground"
                >
                  {item.link?.label || 'Menu Item'}
                </AccordionTrigger>
                <AccordionContent className="py-0 w-full shadow-inner">
                  <div className="pl-4">
                    {item.items?.map((subItem) =>
                      subItem.link ? (
                        <RenderNavLink
                          key={subItem.id}
                          link={subItem.link}
                          className="flex items-center py-3 text-base"
                          onClick={() => setMobileNavOpen(false)}
                        />
                      ) : null,
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}
