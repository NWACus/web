import { Navigation } from '@/payload-types'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { AvalancheCenterPlatforms } from '@/services/nac/types/schemas'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import {
  convertToNavLink,
  extractAllInternalUrls,
  findNavigationItemBySlug,
  topLevelNavItem,
} from './utils-pure'

export {
  convertToNavLink,
  extractAllInternalUrls,
  findNavigationItemBySlug,
  getCanonicalUrlsFromNavigation,
  getNavigationPathForSlug,
  topLevelNavItem,
} from './utils-pure'

export type NavLink =
  | {
      type: 'internal'
      label: string
      url: string
    }
  | {
      type: 'external'
      label: string
      url: string
      newTab: boolean
    }

export type NavItem = {
  id: string
  label?: string
  link?: NavLink
  items?: NavItem[]
}

export type DisplayMode = 'dropdown' | 'link' | 'button'

export type TopLevelNavItem =
  | {
      displayMode?: DisplayMode
      link: NavLink
      label?: string
      items?: NavItem[]
    }
  | {
      displayMode?: DisplayMode
      label: string
      link?: NavLink
      items?: NavItem[]
    }

export const getTopLevelNavItems = async ({
  navigation,
  avalancheCenterPlatforms,
  center,
}: {
  navigation: Navigation
  avalancheCenterPlatforms: AvalancheCenterPlatforms
  center: string
}): Promise<{ topLevelNavItems: TopLevelNavItem[] }> => {
  const forecastItems: NavItem[] = (navigation.forecasts?.items ?? []).flatMap((item, i) => {
    const itemId = item.id ?? String(i)

    // Section with sub-items (e.g., "Zones" accordion)
    if (item.items && item.items.length > 0) {
      const subItems: NavItem[] = item.items.flatMap((sub, subIndex) => {
        if (!sub.link) return []
        const subLink = convertToNavLink(sub.link)
        if (!subLink) return []
        return [{ id: sub.id ?? `${itemId}-${subIndex}`, link: subLink }]
      })
      if (subItems.length === 0) return []
      const navItem: NavItem = { id: itemId, items: subItems }
      if ('label' in item && typeof item.label === 'string') {
        navItem.label = item.label
      }
      return [navItem]
    }

    // Flat item with a direct link
    if (!item.link) return []
    const link = convertToNavLink(item.link)
    if (!link) return []
    return [{ id: itemId, link }]
  })

  const forecastsNavItem: TopLevelNavItem | undefined =
    forecastItems.length > 0 ? { label: 'Forecasts', items: forecastItems } : undefined

  const observationsItems: NavItem[] = (navigation.observations?.items ?? []).flatMap((item, i) => {
    if (!item.link) return []
    const link = convertToNavLink(item.link)
    if (!link) return []
    return [{ id: item.id ?? String(i), link }]
  })

  // SAC-specific observations archive link — revert this block when no longer needed
  if (center === 'sac') {
    observationsItems.push({
      id: 'archive',
      link: { type: 'internal', label: 'Observations Archive', url: '/observations-archive' },
    })
  }

  const observationsNavItem: TopLevelNavItem | undefined =
    observationsItems.length > 0 ? { label: 'Observations', items: observationsItems } : undefined

  const topLevelNavItems: TopLevelNavItem[] = [
    ...(avalancheCenterPlatforms.forecasts && forecastsNavItem ? [forecastsNavItem] : []),
    ...topLevelNavItem({ tab: navigation.weather, label: 'Weather' }),
    ...(avalancheCenterPlatforms.obs && observationsNavItem ? [observationsNavItem] : []),
    ...topLevelNavItem({ tab: navigation.education, label: 'Education' }),
    ...topLevelNavItem({ tab: navigation.accidents, label: 'Accidents' }),
    ...topLevelNavItem({ tab: navigation.blog, label: 'Blog' }),
    ...topLevelNavItem({ tab: navigation.events, label: 'Events' }),
    ...topLevelNavItem({ tab: navigation.about, label: 'About' }),
    ...topLevelNavItem({ tab: navigation.support, label: 'Support' }),
    ...topLevelNavItem({ tab: navigation.donate, label: 'Donate' }),
  ]

  // For button-mode internal links, resolve the canonical (navigation-nested) URL
  // to avoid a redirect from e.g. /donate -> /support/donate which Safari mishandles
  // see https://github.com/NWACus/web/pull/981 for more context
  for (const item of topLevelNavItems) {
    if (item.displayMode !== 'button' || item.link?.type !== 'internal') continue
    const slug = item.link.url.split('/').filter(Boolean).pop()
    if (!slug) continue
    const matchedNavItem = findNavigationItemBySlug(topLevelNavItems, slug)
    if (matchedNavItem?.link?.type === 'internal') {
      item.link.url = matchedNavItem.link.url
    }
  }

  return { topLevelNavItems }
}

export const getCachedTopLevelNavItems = (center: string, draft: boolean = false) =>
  unstable_cache(
    async (): Promise<{ topLevelNavItems: TopLevelNavItem[] }> => {
      const payload = await getPayload({ config: configPromise })

      const navigationRes = await payload.find({
        collection: 'navigations',
        depth: 99,
        draft,
        where: {
          'tenant.slug': {
            equals: center,
          },
        },
      })

      const navigation = navigationRes.docs[0]

      if (!navigation) {
        payload.logger.error(`Navigation for tenant ${center} missing`)
        return { topLevelNavItems: [] }
      }

      const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

      return await getTopLevelNavItems({
        navigation,
        avalancheCenterPlatforms,
        center,
      })
    },
    [`top-level-nav-items-${center}`],
    {
      tags: ['navigation', `navigation-${center}`],
    },
  )

export async function getCanonicalUrlForSlug(center: string, slug: string): Promise<string | null> {
  try {
    const { topLevelNavItems } = await getCachedTopLevelNavItems(center)()
    const navigationItem = findNavigationItemBySlug(topLevelNavItems, slug)

    if (navigationItem?.link?.type === 'internal') {
      return navigationItem.link.url
    }

    return null
  } catch (error) {
    console.warn(
      `Error in getCanonicalUrlForSlug for center ${center} and slug ${slug}. Returning null as a fallback. Error: `,
      error,
    )
    return null
  }
}

export async function getCanonicalUrlForPath(center: string, path: string): Promise<string | null> {
  try {
    const { topLevelNavItems } = await getCachedTopLevelNavItems(center)()
    const navigationUrls = extractAllInternalUrls(topLevelNavItems)

    // Check if this exact path exists in navigation
    if (navigationUrls.includes(path)) {
      return path
    }

    return null
  } catch (error) {
    console.warn(
      `Error in getCanonicalUrlForPath for center ${center} and path ${path}. Returning null as a fallback. Error: `,
      error,
    )
    return null
  }
}
