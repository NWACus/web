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
      <NavigationMenuContent>
        <div className="min-w-max py-6 px-4">
          <div className="grid gap-6">
            {navItem.items.map((item) => {
              const hasSubItems = item.items && item.items.length > 0

              return (
                <div key={item.id} className="menu-column">
                  <div className="mb-3 border-b border-gray-200 pb-2">
                    {item.link ? (
                      <Link href={getUrl(item.link)} legacyBehavior={false}>
                        <span className="text-base font-medium hover:text-white">
                          {getLabel(item.link, 'Menu Item')}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-base font-medium">
                        {getLabel(item.link, 'Menu Item')}
                      </span>
                    )}
                  </div>

                  {hasSubItems && (
                    <ul className="space-y-2">
                      {item.items?.map((subItem) => (
                        <li key={subItem.id}>
                          {subItem.link ? (
                            <Link
                              href={getUrl(subItem.link)}
                              className="text-sm text-gray-200 hover:text-white block"
                              target={subItem.link?.newTab ? '_blank' : undefined}
                            >
                              {getLabel(subItem.link, 'Sub Menu Item')}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-200 block">
                              {getLabel(subItem.link, 'Sub Menu Item')}
                            </span>
                          )}

                          {subItem.items && subItem.items.length > 0 && (
                            <ul className="ml-4 mt-1 space-y-1">
                              {subItem.items.map((thirdLevelItem) => (
                                <li key={thirdLevelItem.id}>
                                  {thirdLevelItem.link ? (
                                    <Link
                                      href={getUrl(thirdLevelItem.link)}
                                      className="text-xs text-gray-300 hover:text-white block"
                                      target={thirdLevelItem.link?.newTab ? '_blank' : undefined}
                                    >
                                      {getLabel(thirdLevelItem.link, 'Third Level Item')}
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-gray-300 block">
                                      {getLabel(thirdLevelItem.link, 'Third Level Item')}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}
