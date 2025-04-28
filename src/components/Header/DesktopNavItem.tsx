import { cn } from '@/utilities/ui'
import Link from 'next/link'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu'
import { getLabel, getUrl, NavItem } from './utils'

type NavItemProps = {
  label: string
  navItem: NavItem
}

export const DesktopNavItem = ({ label, navItem }: NavItemProps) => {
  if (!navItem.items || navItem.items.length === 0) {
    return (
      <NavigationMenuItem>
        <Link href={getUrl(navItem.link)} legacyBehavior passHref>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            target={navItem.link?.newTab ? '_blank' : undefined}
          >
            {getLabel(navItem.link, label)}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{getLabel(navItem.link, label)}</NavigationMenuTrigger>
      <NavigationMenuContent
        className={cn((label === 'About' || label === 'Support') && 'right-0')}
      >
        <ul className="grid gap-3 p-4 w-[400px]">
          {navItem.items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0

            if (!hasSubItems) {
              return (
                <li key={item.id}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrl(item.link)}
                      target={item.link?.newTab ? '_blank' : undefined}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">
                        {getLabel(item.link, 'Menu Item')}
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              )
            }

            return <li key={item.id}>sub items would go here</li>
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}
