import { BuiltInPage, Navigation, Page, Post } from '@/payload-types'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
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

// Structural type that matches any top-level nav tab from the Navigation type.
// The displayMode field is optional because dropdown-locked tabs (forecasts,
// observations) have a literal 'dropdown' type, while flexible tabs have a
// union. A plain optional string covers both.
type NavTab = Navigation['weather' | 'education' | 'accidents' | 'about' | 'support']

/**
 * Convert a payload nav tab to a frontend TopLevelNavItem, branching on displayMode.
 *
 * - `'link'` or `'button'` mode: returns the tab's top-level link.
 * - `'dropdown'` mode (default): returns the tab's items as a dropdown.
 * - Returns an empty array if the tab is disabled, missing, or has no renderable content.
 */
function topLevelNavItem({ tab, label }: { tab: NavTab; label: string }): TopLevelNavItem[] {
  if (!tab || tab.options?.enabled === false) {
    return []
  }

  const mode: DisplayMode = tab.options?.displayMode ?? 'dropdown'

  if (mode === 'link' || mode === 'button') {
    if (!tab.link) return []
    const link = convertToNavLink(tab.link)
    if (!link) return []
    return [{ displayMode: mode, link, label: link.label }]
  }

  // dropdown mode
  const result: TopLevelNavItem = { displayMode: 'dropdown', label }

  if (tab.items && tab.items.length > 0) {
    result.items = tab.items
      .map((item) => {
        if (!item) return null

        invariant(item.id, `Tab ${label} has an item without an id.`)

        const navItem: NavItem = {
          id: item.id,
        }

        // Capture standalone label for items that have sub-items but no link
        if ('label' in item && typeof item.label === 'string') {
          navItem.label = item.label
        }

        if (item.link) {
          const convertedLink = convertToNavLink(item.link, [label.toLowerCase()])
          if (convertedLink) {
            navItem.link = convertedLink
          }
        }

        if (item.items && item.items.length > 0) {
          navItem.items = item.items
            .map((nestedItem, index) => {
              if (!nestedItem) return null

              invariant(nestedItem.id, `Tab ${label}[${item.id}][${index}] has no id.`)

              const nestedNavItem: NavItem = {
                id: nestedItem.id,
              }

              if (nestedItem.link) {
                // Use standalone label (for accordion items) or link label for parent path segment
                const parentLabel = navItem.label || navItem.link?.label
                const convertedNestedLink = convertToNavLink(nestedItem.link, [
                  label.toLowerCase(),
                  ...(parentLabel ? [parentLabel.toLowerCase()] : []),
                ])
                if (convertedNestedLink) {
                  nestedNavItem.link = convertedNestedLink
                }
              }

              return nestedNavItem.link ? nestedNavItem : null
            })
            .filter((item): item is NavItem => item !== null)

          if (navItem.items && navItem.items.length === 0) {
            delete navItem.items
          }
        }

        return navItem.link || (navItem.items && navItem.items.length > 0) ? navItem : null
      })
      .filter((item): item is NavItem => item !== null)

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

  // external links
  if (link.type === 'external' && link.url) {
    invariant(linkLabel, `Label not set for external link with url ${link.url}`)

    return {
      type: 'external',
      label: linkLabel,
      url: link.url,
      newTab: !!link.newTab,
    }
  }

  // internal page/post/builtInPage reference links
  if (link.type === 'internal' && link.reference) {
    const reference = link.reference

    invariant(
      typeof reference.value !== 'number',
      `Link reference.value is a number. Depth not set correctly on navigations collection query.`,
    )

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

    if (reference.relationTo === 'pages' || reference.relationTo === 'posts') {
      // Do not render documents in draft state
      if ('_status' in reference.value && reference.value._status === 'draft') {
        return undefined
      }

      let url =
        link.reference.relationTo === 'pages'
          ? `/${reference.value.slug}`
          : `/blog/${reference.value.slug}`

      if (parentItems?.length && parentItems.length > 0) {
        url = normalizePath(`/${parentItems.join('/')}${url}`, { ensureLeadingSlash: true })
      }

      return {
        type: 'internal',
        label: linkLabel,
        url,
      }
    }

    if (reference.relationTo === 'builtInPages') {
      const url = normalizePath(reference.value.url, { ensureLeadingSlash: true })

      return {
        type: 'internal',
        label: linkLabel,
        url,
      }
    }
  }

  // internal hardcoded links
  if (link.type === 'internal' && link.url) {
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
  avalancheCenterPlatforms,
  center,
}: {
  navigation: Navigation
  avalancheCenterPlatforms: AvalancheCenterPlatforms
  center: string
}): Promise<{ topLevelNavItems: TopLevelNavItem[]; donateNavItem?: TopLevelNavItem }> => {
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
  ]

  const [donateNavItem] = topLevelNavItem({ tab: navigation.donate, label: 'Donate' })

  // For internal button links, resolve the canonical (navigation-nested) URL
  // to avoid a redirect from e.g. /donate -> /support/donate which Safari mishandles
  // see https://github.com/NWACus/web/pull/981 for more context
  if (donateNavItem?.link?.type === 'internal') {
    const slug = donateNavItem.link.url.split('/').filter(Boolean).pop()
    if (slug) {
      const matchedNavItem = findNavigationItemBySlug(topLevelNavItems, slug)
      if (matchedNavItem?.link?.type === 'internal') {
        donateNavItem.link.url = matchedNavItem.link.url
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
