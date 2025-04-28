import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { getLabel, getUrl, LinkType, NavItem } from './utils'

type MobileNavItemProps = {
  label: string
  navItem: NavItem
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>
}

export const MobileNavItem = ({ label, navItem, setMobileNavOpen }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <MobileNavLink label={label} link={navItem.link} setMobileNavOpen={setMobileNavOpen} />
    ) : (
      <span>{label}</span>
    )
  }

  return <NavDropdown label={label} navItem={navItem} setMobileNavOpen={setMobileNavOpen} />
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
      className={cn('flex w-full items-center py-3 text-base container', className)}
      onClick={() => setMobileNavOpen(false)}
    >
      {getLabel(link, label)}
    </Link>
  )
}

const NavDropdown = ({ label, navItem, setMobileNavOpen }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) return <span>{label}</span>

  return (
    <AccordionItem value={label} className="border-0">
      <AccordionTrigger
        className="py-2.5 capitalize text-base hover:no-underline container"
        chevronClassName="h-6 w-6 text-[#A0CCD8]"
      >
        {getLabel(navItem.link, label)}
      </AccordionTrigger>
      <AccordionContent className="py-0">
        <Accordion type="single" collapsible className="w-full">
          <div className="">
            {navItem.items.map((item) => {
              if (!item.items || item.items.length === 0) {
                return item.link ? (
                  <MobileNavLink
                    label={getLabel(item.link, '')}
                    link={item.link}
                    setMobileNavOpen={setMobileNavOpen}
                    className="pl-8"
                  />
                ) : null
              }

              return (
                <AccordionItem value={getLabel(item.link, 'Menu Item')} className="border-0">
                  <AccordionTrigger
                    className="py-2 text-base hover:no-underline container pl-8 data-[state=open]:font-semibold"
                    chevronClassName="h-6 w-6 text-[#A0CCD8]"
                  >
                    {getLabel(item.link, 'Menu Item')}
                  </AccordionTrigger>
                  <AccordionContent className="py-0 w-full border-y-2 border-y-[#142D56] shadow-inner">
                    <div className="pl-10">
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
          </div>
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}
