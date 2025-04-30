import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { getLabel, getUrl, LinkType, NavItem } from './utils'

type MobileNavItemProps = {
  label: string
  navItem: NavItem
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>
  className?: string
}

export const MobileNavItem = ({ label, navItem, setMobileNavOpen }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <MobileNavLink
        label={label}
        link={navItem.link}
        setMobileNavOpen={setMobileNavOpen}
        className="px-2"
      />
    ) : (
      <span>{label}</span>
    )
  }

  return (
    <NavDropdown
      label={label}
      navItem={navItem}
      setMobileNavOpen={setMobileNavOpen}
      className="px-2"
    />
  )
}

export const MobileNavLink = ({
  label,
  link,
  setMobileNavOpen,
  className,
}: {
  label: string
  link?: LinkType | null
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>
  className?: string
}) => {
  return (
    <Link
      href={getUrl(link)}
      target={link?.newTab ? '_blank' : undefined}
      className={cn('flex items-center py-3 text-base', className)}
      onClick={() => setMobileNavOpen(false)}
    >
      {getLabel(link, label)}
    </Link>
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
        {getLabel(navItem.link, label)}
      </AccordionTrigger>
      <AccordionContent className="pt-0 pb-2">
        <Accordion type="single" collapsible className="pl-4">
          {navItem.items.map((item) => {
            if (!item.items || item.items.length === 0) {
              return item.link ? (
                <MobileNavLink
                  label={getLabel(item.link, '')}
                  link={item.link}
                  setMobileNavOpen={setMobileNavOpen}
                />
              ) : null
            }

            return (
              <AccordionItem value={getLabel(item.link, 'Menu Item')} className="border-0">
                <AccordionTrigger
                  className="py-2 text-base font-normal hover:no-underline data-[state=open]:font-semibold"
                  chevronClassName="h-6 w-6 text-header-foreground"
                >
                  {getLabel(item.link, 'Menu Item')}
                </AccordionTrigger>
                <AccordionContent className="py-0 w-full shadow-inner">
                  <div className="pl-4">
                    {item.items?.map((subItem) =>
                      subItem.link ? (
                        <MobileNavLink
                          label={getLabel(subItem.link, '')}
                          link={subItem.link}
                          setMobileNavOpen={setMobileNavOpen}
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
