import { HeaderClient } from './Component.client'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationSubMenu,
} from '@/components/ui/navigation-menu'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Header, Navigation, NavigationSection, Page } from '@/payload-types'

type navSection = {
  trigger: string
  items: navGroup[] | navItem[]
}
type navGroup = {
  trigger: string
  items: navItem[]
}
type navItem = {
  title: string
  href: string
  description?: string
}

export async function Header({ center }: { center?: string }) {
  const payload = await getPayload({ config: configPromise })
  const media = await payload.find({
    collection: 'brands',
    depth: 10,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })
  if (media.docs.length < 1 || typeof media.docs[0].logo !== 'object') {
    payload.logger.error(`brand for tenant ${center} missing, or logo missing from brand`)
    return <></>
  }

  const nav = await payload.find({
    collection: 'navigations',
    depth: 1000,
    overrideAccess: true,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  const generateNavItems: (
    weather: navSection | undefined,
    about: navItem[],
  ) => (navItem | navSection)[] = (
    weather: navGroup | undefined,
    about: navItem[],
  ): (navItem | navSection)[] => {
    const weatherSections: navGroup[] = [
      {
        trigger: 'Forecasts',
        items: [
          {
            title: 'Regional Weather Forecast',
            href: '/forecasts/weather',
          },
        ],
      },
      {
        trigger: 'Data',
        items: [
          {
            title: 'Station Map',
            href: '/weather/stations/map',
          },
          // TODO: weather station groups
        ],
      },
    ]
    if (weather) {
      weatherSections.push(weather)
    }
    return [
      {
        title: 'Forecasts',
        href: '/forecasts/avalanche',
      },
      {
        trigger: 'Weather',
        items: weatherSections,
      },
      {
        title: 'Observations',
        href: '/observations',
      },
      {
        title: 'Blog',
        href: '/blog',
      },
      {
        title: 'Events',
        href: '/events',
      },
      {
        trigger: 'About Us',
        items: [
          {
            trigger: 'Our Team',
            items: [],
          },
          {
            trigger: 'Our Mission',
            items: [...about], // TODO: maybe better factoring here?
          },
        ],
      },
    ]
  }

  let weather: navGroup | undefined = undefined
  if (
    nav.docs.length === 1 &&
    nav.docs[0].weather_extra &&
    typeof nav.docs[0].weather_extra.value === 'object'
  ) {
    const items: navItem[] = []
    for (const item of nav.docs[0].weather_extra.value.items) {
      if (typeof item === 'object' && typeof item.value === 'object') {
        items.push({
          title: item.value.title,
          href: `/weather/${nav.docs[0].weather_extra.value.slug}/${item.value.slug}`,
          description: item.value.meta?.description || undefined,
        })
      }
    }
    weather = {
      trigger: nav.docs[0].weather_extra.value.title,
      items: items,
    }
  }
  const about: navItem[] = []
  if (nav.docs.length === 1 && nav.docs[0].about_us_extra) {
    for (const item of nav.docs[0].about_us_extra) {
      if (typeof item.value === 'object') {
        about.push({
          title: item.value.title,
          href: `/weather/our-mission/${item.value.slug}`,
          description: item.value.meta?.description || undefined,
        })
      }
    }
  }
  const navItems = generateNavItems(weather, about)

  type pageRelation = {
    relationTo: 'pages'
    value: number | Page
  }
  const getNavItem: (root: string[], doc: pageRelation) => navItem = (
    root: string[],
    doc: pageRelation,
  ): navItem => {
    if (typeof doc.value !== 'object') {
      payload.logger.error(`group in nav for tenant ${center} not expanded in query`)
      throw new Error()
    }
    payload.logger.info(`handling page at /${root.join('/')}: ${doc.value.title}`)
    return {
      title: doc.value.title,
      href: '/' + [...root, doc.value.slug].join('/'),
      description: doc.value.meta?.description || undefined,
    }
  }
  const getNavChildren: (
    root: string[],
    doc: NavigationSection['items'][number],
  ) => navItem | navSection = (
    root: string[],
    doc: NavigationSection['items'][number],
  ): navItem | navSection => {
    if (doc.relationTo === 'navigationGroups') {
      if (typeof doc.value !== 'object') {
        payload.logger.error(`page in nav for tenant ${center} not expanded in query`)
        throw new Error()
      }
      payload.logger.info(`handling group at /${root.join('/')}: ${doc.value.title}`)
      const children: (navItem | navSection)[] = []
      for (const child of doc.value.items) {
        children.push(getNav([...root, doc.value.slug], child))
      }
      const slug = doc.value.slug
      return {
        trigger: doc.value.title,
        items: doc.value.items.map((item) => getNavItem([...root, slug], item)),
      }
    } else if (doc.relationTo === 'pages') {
      return getNavItem(root, doc)
    } else {
      throw new Error() // TODO: never
    }
  }
  const getNav: (root: string[], doc: Navigation['items'][number]) => navItem | navSection = (
    root: string[],
    doc: Navigation['items'][number],
  ): navItem | navSection => {
    if (doc.relationTo === 'navigationSections') {
      if (typeof doc.value !== 'object') {
        payload.logger.error(`page in nav for tenant ${center} not expanded in query`)
        throw new Error()
      }
      payload.logger.info(`handling group at /${root.join('/')}: ${doc.value.title}`)
      const children: (navItem | navSection)[] = []
      for (const child of doc.value.items) {
        children.push(getNavChildren([...root, doc.value.slug], child))
      }
      return {
        trigger: doc.value.title,
        items: children as navGroup[] | navItem[], // TODO: fix this typing
      }
    } else if (doc.relationTo === 'pages') {
      return getNavItem(root, doc)
    } else {
      throw new Error() // TODO: never
    }
  }

  payload.logger.info(`got ${nav.docs.length} navs for ${center}`)
  for (const topLevelNav of nav.docs) {
    payload.logger.info(`got ${topLevelNav.items.length} nav groups for ${center}`)
    const additional: (navItem | navSection)[] = []
    for (const item of topLevelNav.items) {
      additional.push(getNav([], item))
    }
    navItems.splice(3, 0, ...additional)
  }

  payload.logger.info(JSON.stringify(navItems))

  // TODO: reach out to nac for forecast zones

  return (
    <HeaderClient>
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map((navItem) =>
            'title' in navItem ? (
              <NavigationMenuItem key={navItem.href}>
                <Link href={navItem.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {navItem.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem key={navItem.trigger}>
                <NavigationMenuTrigger>{navItem.trigger}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {navItem.items.map((item) =>
                      'title' in item ? (
                        <ListItem key={item.href} title={item.title} href={item.href}>
                          {item.description}
                        </ListItem>
                      ) : (
                        <NavigationMenuGroupItem key={item.trigger} group={item} />
                      ),
                    )}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ),
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </HeaderClient>
  )
}

const NavigationMenuGroupItem: React.FC<{ group: navSection }> = ({ group }) => {
  return (
    <NavigationSubMenu defaultValue="sub1">
      <NavigationMenuList>
        {group.items.map((item) =>
          'title' in item ? (
            <NavigationMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {item.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.trigger}>
              <NavigationMenuTrigger>{item.trigger}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuGroupItem group={item} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationSubMenu>
  )
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = 'ListItem'
