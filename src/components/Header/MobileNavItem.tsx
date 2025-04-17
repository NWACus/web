import { cn } from '@/utilities/cn'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getLabel, getUrl, LinkType, NavItem } from './utils'

type MobileNavItemProps = {
  label: string
  navItem: NavItem
  setMobileNavOpen: (open: boolean) => void
  setSubNavPage?: () => void
}

export const MobileNavItem = ({
  label,
  navItem,
  setMobileNavOpen,
  setSubNavPage,
}: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) {
    return navItem.link ? (
      <MobileNavLink label={label} link={navItem.link} setMobileNavOpen={setMobileNavOpen} />
    ) : (
      <span>{label}</span>
    )
  }

  return (
    <NavDropdown
      label={label}
      navItem={navItem}
      setMobileNavOpen={setMobileNavOpen}
      setSubNavPage={setSubNavPage}
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
  setMobileNavOpen: (open: boolean) => void
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

const NavDropdown = ({ label, navItem, setMobileNavOpen, setSubNavPage }: MobileNavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) return <span>{label}</span>

  return (
    <div className="container">
      <button
        type="button"
        className="flex justify-between items-center py-3 w-full"
        onClick={setSubNavPage}
      >
        {label}
        <ChevronRight className="h-6 w-6 flex-shrink-0" />
      </button>
    </div>
  )

  // return (
  //   <AccordionItem value={label} className="border-0">
  //     <AccordionTrigger
  //       className="py-3 capitalize text-base hover:no-underline container"
  //       chevronClassName="h-6 w-6 text-white"
  //     >
  //       {getLabel(navItem.link, label)}
  //     </AccordionTrigger>
  //     <AccordionContent className="py-0">
  //       <Accordion type="single" collapsible className="w-full bg-[#1b355e]">
  //         <div className="">
  //           {navItem.items.map((item) => {
  //             if (!item.items || item.items.length === 0) {
  //               return item.link ? (
  //                 <MobileNavLink
  //                   label={getLabel(item.link, '')}
  //                   link={item.link}
  //                   setMobileNavOpen={setMobileNavOpen}
  //                   className="pl-8"
  //                 />
  //               ) : null
  //             }

  //             return (
  //               <AccordionItem value={getLabel(item.link, 'Menu Item')} className="border-0">
  //                 <AccordionTrigger
  //                   className="py-3 text-base hover:no-underline container pl-8"
  //                   chevronClassName="h-6 w-6 text-white"
  //                 >
  //                   {getLabel(item.link, 'Menu Item')}
  //                 </AccordionTrigger>
  //                 <AccordionContent className="py-0 w-full border-y-2 border-y-[#142D56] shadow-inner bg-[#1c355a]">
  //                   <div className="pl-8">
  //                     {item.items?.map((subItem) =>
  //                       subItem.link ? (
  //                         <MobileNavLink
  //                           label={getLabel(subItem.link, '')}
  //                           link={subItem.link}
  //                           setMobileNavOpen={setMobileNavOpen}
  //                         />
  //                       ) : null,
  //                     )}
  //                   </div>
  //                 </AccordionContent>
  //               </AccordionItem>
  //             )
  //           })}
  //         </div>
  //       </Accordion>
  //     </AccordionContent>
  //   </AccordionItem>
  // )
}
