import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { getLabel, getUrl, hasItems, LinkType, NavItem } from './Header.client'

type MobileNavItemProps = {
  name: string
  navItem: NavItem
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>
}

export const MobileNavItem = ({ name, navItem, setMobileNavOpen }: MobileNavItemProps) => {
  if (!hasItems(navItem)) {
    return navItem.link ? (
      <MobileNavLink name={name} link={navItem.link} setMobileNavOpen={setMobileNavOpen} />
    ) : (
      <span>{name}</span>
    )
  }

  return <NavDropdown name={name} navItem={navItem} setMobileNavOpen={setMobileNavOpen} />
}

export const MobileNavLink = ({
  name,
  link,
  setMobileNavOpen,
  className,
}: {
  name: string
  link: LinkType
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
      {getLabel(link, name)}
    </Link>
  )
}

const NavDropdown = ({ name, navItem, setMobileNavOpen }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) return <span>{name}</span>

  return (
    <AccordionItem value={name} className="border-0">
      <AccordionTrigger
        className="py-3 capitalize text-base hover:no-underline container"
        chevronClassName="h-6 w-6 text-white"
      >
        {getLabel(navItem.link, name)}
      </AccordionTrigger>
      <AccordionContent className="py-0">
        <Accordion type="single" collapsible className="w-full bg-[#1b355e]">
          <div className="">
            {navItem.items.map((item) => {
              if (!item.items || item.items.length === 0) {
                return item.link ? (
                  <MobileNavLink
                    name={getLabel(item.link, '')}
                    link={item.link}
                    setMobileNavOpen={setMobileNavOpen}
                    className="pl-8"
                  />
                ) : null
              }

              return (
                <AccordionItem value={getLabel(item.link, 'Menu Item')} className="border-0">
                  <AccordionTrigger
                    className="py-3 text-base hover:no-underline container pl-8"
                    chevronClassName="h-6 w-6 text-white"
                  >
                    {getLabel(item.link, 'Menu Item')}
                  </AccordionTrigger>
                  <AccordionContent className="py-0 w-full border-y-2 border-y-[#142D56] shadow-inner bg-[#1c355a]">
                    <div className="pl-8">
                      {item.items?.map((subItem) =>
                        subItem.link ? (
                          <MobileNavLink
                            name={getLabel(subItem.link, '')}
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
