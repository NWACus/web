import { BuiltInPage, Navigation, Page, Post } from '@/payload-types'
import {
  ActiveForecastZoneWithSlug,
  getActiveForecastZones,
  getAvalancheCenterPlatforms,
} from '@/services/nac/nac'
import { AvalancheCenterPlatforms } from '@/services/nac/types/schemas'
import { normalizePath } from '@/utilities/path'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import invariant from 'tiny-invariant'
import { extractAllInternalUrls, findNavigationItemBySlug } from './utils-pure'

export {
  extractAllInternalUrls,
  findNavigationItemBySlug,
  getCanonicalUrlsFromNavigation,
  getNavigationPathForSlug,
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
  link?: NavLink
  items?: NavItem[]
}

export type TopLevelNavItem =
  | {
      link: NavLink
      label?: string
      items?: NavItem[]
    }
  | {
      label: string
      link?: NavLink
      items?: NavItem[]
    }

/**
 * Convenience function to validate and convert a payload topLevelNavTab to a frontend TopLevelNavItem.
 *
 * @returns TopLevelNavItem in an array if the topLevelNavTab is valid or an empty array if invalid.
 */
function topLevelNavItem({
  tab,
  label,
}: {
  tab: Navigation['weather' | 'education' | 'accidents' | 'about' | 'support']
  label: string
}): TopLevelNavItem[] {
  if (!tab || tab.options?.enabled === false) {
    return []
  }

  const result: TopLevelNavItem = {
    label,
  }

  if (tab.items && tab.items.length > 0) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    result.items = tab.items
      .map((item) => {
        if (!item) return null

        invariant(item.id, `Tab ${label} has an item without an id.`)

        const navItem: NavItem = {
          id: item.id,
        }

        if (item.link) {
          const convertedLink = convertToNavLink(item.link, [label.toLowerCase()])
          if (convertedLink) {
            navItem.link = convertedLink
          }
        }

        if (item.items && item.items.length > 0) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          navItem.items = item.items
            .map((nestedItem, index) => {
              if (!nestedItem) return null

              invariant(nestedItem.id, `Tab ${label}[${item.id}][${index}] has no id.`)

              const nestedNavItem: NavItem = {
                id: nestedItem.id,
              }

              if (nestedItem.link) {
                const convertedNestedLink = convertToNavLink(nestedItem.link, [
                  label.toLowerCase(),
                  ...(navItem.link ? [navItem.link.label.toLowerCase()] : []),
                ])
                if (convertedNestedLink) {
                  nestedNavItem.link = convertedNestedLink
                }
              }

              return nestedNavItem.link ? nestedNavItem : null
            })
            .filter(Boolean) as NavItem[]

          if (navItem.items && navItem.items.length === 0) {
            delete navItem.items
          }
        }

        return navItem.link || (navItem.items && navItem.items.length > 0) ? navItem : null
      })
      .filter(Boolean) as NavItem[]

    if (result.items && result.items.length === 0) {
      delete result.items
    }
  }

  // Only return the result if it has a link or items
  return result.link || (result.items && result.items.length > 0) ? [result] : []
}

/**
 * Helper function to convert a payload navLink (@/fields/navLinks) to a frontend NavLink
 * Throws if the link is missing expected data.
 * Returns undefined if the link is invalid.
 */
export function convertToNavLink(
  link: {
    type?: ('internal' | 'external') | null
    reference?:
      | ({
          relationTo: 'builtInPages'
          value: number | BuiltInPage
        } | null)
      | ({
          relationTo: 'pages'
          value: number | Page
        } | null)
      | ({
          relationTo: 'posts'
          value: number | Post
        } | null)

    url?: string | null
    label?: string | null
    newTab?: boolean | null
  },
  parentItems?: string[],
): NavLink | undefined {
  let linkLabel: string | undefined = link.label || undefined

  if (link.type === 'external' && link.url) {
    invariant(linkLabel, `Label not set for external link with url ${link.url}`)

    return {
      type: 'external',
      label: linkLabel,
      url: link.url,
      newTab: !!link.newTab,
    }
  }

  if (
    link.type === 'internal' &&
    link.reference &&
    (link.reference.relationTo === 'pages' ||
      link.reference.relationTo === 'posts' ||
      link.reference.relationTo === 'builtInPages')
  ) {
    const reference = link.reference

    invariant(
      typeof reference.value !== 'number',
      `Link reference.value is a number. Depth not set correctly on navigations collection query.`,
    )

    // Do not render documents in draft state (builtInPages don't have _status)
    if ('_status' in reference.value && reference.value._status === 'draft') {
      return undefined
    }

    if (
      !linkLabel &&
      typeof reference.value === 'object' &&
      reference.value &&
      'title' in reference.value
    ) {
      linkLabel = reference.value.title
    }

    invariant(
      linkLabel,
      `Could not determine label for link with reference ${JSON.stringify(reference)}`,
    )

    let url: string
    if (link.reference.relationTo === 'builtInPages' && 'url' in reference.value) {
      url = normalizePath(reference.value.url, { ensureLeadingSlash: true })
    } else if (link.reference.relationTo === 'posts' && 'slug' in reference.value) {
      url = `/blog/${reference.value.slug}`
    } else if ('slug' in reference.value) {
      url = `/${reference.value.slug}`
    } else {
      return undefined
    }

    // Only apply parent items prefix for pages and posts, not builtInPages
    if (
      link.reference.relationTo !== 'builtInPages' &&
      parentItems?.length &&
      parentItems.length > 0
    ) {
      url = normalizePath(`/${parentItems.join('/')}${url}`, { ensureLeadingSlash: true })
    }

    return {
      type: 'internal',
      label: linkLabel,
      url,
    }
  }

  if (link.url) {
    invariant(linkLabel, `Label not set for internal relative link with url ${link.url}`)

    let url = normalizePath(link.url, { ensureLeadingSlash: true })

    if (parentItems?.length && parentItems.length > 0) {
      url = normalizePath(`/${parentItems.join('/')}${url}`, { ensureLeadingSlash: true })
    }

    return {
      type: 'internal',
      label: linkLabel,
      url,
    }
  }

  return undefined
}

export const getTopLevelNavItems = async ({
  navigation,
  activeForecastZones,
  avalancheCenterPlatforms,
}: {
  navigation: Navigation
  activeForecastZones?: ActiveForecastZoneWithSlug[]
  avalancheCenterPlatforms: AvalancheCenterPlatforms
}): Promise<{ topLevelNavItems: TopLevelNavItem[]; donateNavItem?: TopLevelNavItem }> => {
  let forecastsNavItem: TopLevelNavItem = {
    link: {
      label: 'Forecasts',
      type: 'internal',
      url: '/forecasts/avalanche',
    },
  }

  if (activeForecastZones && activeForecastZones.length > 0 && avalancheCenterPlatforms.forecasts) {
    if (activeForecastZones.length === 1) {
      forecastsNavItem = {
        link: {
          label: 'Avalanche Forecast',
          type: 'internal',
          url: `/forecasts/avalanche/${activeForecastZones[0].slug}`,
        },
      }
    } else {
      const zoneLinks: NavItem[] = activeForecastZones
        .sort((zoneA, zoneB) => (zoneA.zone.rank ?? Infinity) - (zoneB.zone.rank ?? Infinity))
        .map(({ zone, slug }) => {
          return {
            id: slug || zone.name,
            link: {
              type: 'internal',
              label: zone.name,
              url: slug ? `/forecasts/avalanche/${slug}` : '/forecasts/avalanche',
            },
          }
        })

      forecastsNavItem = {
        label: 'Forecasts',
        items: [
          {
            id: 'all',
            link: {
              type: 'internal',
              label: 'All Forecasts',
              url: '/forecasts/avalanche',
            },
          },
          {
            id: 'zones',
            items: zoneLinks,
            link: {
              type: 'internal',
              label: 'Zones',
              url: '/forecasts/avalanche',
            },
          },
        ],
      }
    }
  }

  const observationsNavItem: TopLevelNavItem = {
    label: 'Observations',
    items: [
      {
        id: 'recent',
        link: {
          type: 'internal',
          label: 'Recent Observations',
          url: '/observations',
        },
      },
      {
        id: 'submit',
        link: {
          type: 'internal',
          label: 'Submit Observation',
          url: '/observations/submit',
        },
      },
    ],
  }

  const blogNavItem: TopLevelNavItem = {
    label: 'Blog',
    link: {
      label: 'Blog',
      type: 'internal',
      url: '/blog',
    },
  }

  const eventsNavItem: TopLevelNavItem = {
    label: 'Events',
    link: {
      label: 'Events',
      type: 'internal',
      url: '/events',
    },
  }

  const topLevelNavItems: TopLevelNavItem[] = [
    ...(avalancheCenterPlatforms.forecasts ? [forecastsNavItem] : []),
    ...topLevelNavItem({
      tab: navigation.weather,
      label: 'Weather',
    }),
    ...(avalancheCenterPlatforms.obs ? [observationsNavItem] : []),
    ...topLevelNavItem({ tab: navigation.education, label: 'Education' }),
    ...topLevelNavItem({ tab: navigation.accidents, label: 'Accidents' }),
    ...(navigation.blog?.options?.enabled ? [blogNavItem] : []),
    ...(navigation.events?.options?.enabled ? [eventsNavItem] : []),
    ...topLevelNavItem({ tab: navigation.about, label: 'About' }),
    ...topLevelNavItem({ tab: navigation.support, label: 'Support' }),
  ]

  let donateNavItem: TopLevelNavItem | undefined = undefined

  if (navigation.donate?.link && navigation.donate.options?.enabled) {
    const link = convertToNavLink(navigation.donate.link)

    if (link) {
      donateNavItem = {
        label: link.label,
        link,
      }
    }
  }

  return { topLevelNavItems, donateNavItem }
}

export const getCachedTopLevelNavItems = (center: string, draft: boolean = false) =>
  unstable_cache(
    async (): Promise<{ topLevelNavItems: TopLevelNavItem[]; donateNavItem?: TopLevelNavItem }> => {
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

      const activeForecastZones = await getActiveForecastZones(center)
      const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

      return await getTopLevelNavItems({
        navigation,
        activeForecastZones,
        avalancheCenterPlatforms,
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
