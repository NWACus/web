import { Navigation, Page, Post } from '@/payload-types'
import invariant from 'tiny-invariant'

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
function topLevelNavItem(
  tab: Navigation['weather' | 'education' | 'accidents' | 'about' | 'support'],
  label: string,
): TopLevelNavItem[] {
  if (!tab) {
    return []
  }

  const result: TopLevelNavItem = {
    label,
  }

  if (tab.items && tab.items.length > 0) {
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
    (link.reference.relationTo === 'pages' || link.reference.relationTo === 'posts')
  ) {
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

    let url =
      link.reference.relationTo === 'pages'
        ? `/${reference.value.slug}`
        : `/posts/${reference.value.slug}`

    if (parentItems?.length && parentItems.length > 0) {
      url = `/${parentItems.join('/')}${url}`
    }

    return {
      type: 'internal',
      label: linkLabel,
      url,
    }
  }

  if (link.url) {
    invariant(linkLabel, `Label not set for internal relative link with url ${link.url}`)

    let url = link.url

    if (parentItems?.length && parentItems.length > 0) {
      url = `/${parentItems.join('/')}${url.startsWith('/') ? url : `/${url}`}`
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
}: {
  navigation: Navigation
}): Promise<TopLevelNavItem[]> => [
  {
    link: {
      label: 'Forecasts',
      type: 'internal',
      url: '/forecasts/avalanche',
    },
  },
  ...topLevelNavItem(navigation.weather, 'Weather'),
  {
    link: {
      label: 'Observations',
      type: 'internal',
      url: '/observations',
    },
  },
  ...topLevelNavItem(navigation.education, 'Education'),
  ...topLevelNavItem(navigation.accidents, 'Accidents'),
  {
    link: {
      label: 'Blog',
      type: 'internal',
      url: '/posts',
    },
  },
  {
    link: {
      label: 'Events',
      type: 'internal',
      url: '/events',
    },
  },
  ...topLevelNavItem(navigation.about, 'About'),
  ...topLevelNavItem(navigation.support, 'Support'),
]

export function hasActiveDescendent(navItem: NavItem, pathname: string): boolean {
  if (navItem.link?.type === 'internal' && navItem.link?.url === pathname) {
    return true
  }
  if (navItem.items) {
    return navItem.items.some((item) => hasActiveDescendent(item, pathname))
  }
  return false
}

export function isActive(navItem: NavItem | TopLevelNavItem, pathname: string) {
  return navItem.link?.type === 'internal' && navItem.link?.url === pathname
}
