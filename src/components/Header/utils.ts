import { Navigation, Page, Post } from '@/payload-types'

export type NavLink =
  | {
      type: 'internal-reference'
      label: string
      reference:
        | { relationTo: 'pages'; value: number | Page }
        | { relationTo: 'posts'; value: number | Post }
      url?: undefined
      newTab?: undefined
    }
  | {
      type: 'internal-relative'
      label: string
      url: string
      reference?: undefined
      newTab?: undefined
    }
  | {
      type: 'external'
      label: string
      url: string
      newTab: boolean
      reference?: undefined
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
  // If tab doesn't exist, return empty array
  if (!tab) {
    return []
  }

  const result: TopLevelNavItem = {
    label,
  }

  // Process link if it exists and is valid
  if (tab.link) {
    const navLink = convertToNavLink(tab.link)
    if (navLink) {
      result.link = navLink
    }
  }

  // Process dropdown items if they exist
  if (tab.items && tab.items.length > 0) {
    result.items = tab.items
      .map((item) => {
        if (!item) return null

        const navItem: NavItem = {
          id: item.id || generateRandomId(),
        }

        // Add link if it exists and is valid
        if (item.link) {
          const convertedLink = convertToNavLink(item.link)
          if (convertedLink) {
            navItem.link = convertedLink
          }
        }

        // Process nested items if they exist
        if (item.items && item.items.length > 0) {
          navItem.items = item.items
            .map((nestedItem) => {
              if (!nestedItem) return null

              const nestedNavItem: NavItem = {
                id: nestedItem.id || generateRandomId(),
              }

              if (nestedItem.link) {
                const convertedNestedLink = convertToNavLink(nestedItem.link)
                if (convertedNestedLink) {
                  nestedNavItem.link = convertedNestedLink
                }
              }

              return nestedNavItem.link ? nestedNavItem : null
            })
            .filter(Boolean) as NavItem[]

          // Only include items array if it has elements
          if (navItem.items && navItem.items.length === 0) {
            delete navItem.items
          }
        }

        return navItem.link || (navItem.items && navItem.items.length > 0) ? navItem : null
      })
      .filter(Boolean) as NavItem[]

    // Only include items if they exist
    if (result.items && result.items.length === 0) {
      delete result.items
    }
  }

  // Only return the result if it has a link or items
  return result.link || (result.items && result.items.length > 0) ? [result] : []
}

/**
 * Helper function to convert a payload navLink (@/fields/navLinks) to a frontend NavLink
 * Returns undefined if the link is invalid
 */
function convertToNavLink(link: {
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
}): NavLink | undefined {
  // Extract label from link or reference
  let linkLabel: string | undefined = link.label || undefined

  // Handle external links
  if (link.type === 'external' && link.url) {
    if (!linkLabel) {
      return undefined // External links must have a label
    }

    return {
      type: 'external',
      label: linkLabel,
      url: link.url,
      newTab: !!link.newTab,
    }
  }

  // Handle internal links with references
  if (
    link.type === 'internal' &&
    link.reference &&
    (link.reference.relationTo === 'pages' || link.reference.relationTo === 'posts')
  ) {
    const reference = link.reference

    // If reference.value is a number, don't render this nav item
    if (typeof reference.value === 'number') {
      return undefined
    }

    // Try to get title from reference value if it exists
    if (
      !linkLabel &&
      typeof reference.value === 'object' &&
      reference.value &&
      'title' in reference.value
    ) {
      linkLabel = (reference.value as any).title
    }

    // If we still don't have a label, don't render this nav item
    if (!linkLabel) {
      return undefined
    }

    return {
      type: 'internal-reference',
      label: linkLabel,
      reference: reference,
    }
  }

  // Handle internal links with URLs (relative paths)
  if (link.url) {
    if (!linkLabel) {
      return undefined // Internal relative links must have a label
    }

    return {
      type: 'internal-relative',
      label: linkLabel,
      url: link.url,
    }
  }

  // Return undefined for invalid links
  return undefined
}

/**
 * Helper function to generate a random ID for items that don't have one
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export const getTopLevelNavItems = async ({
  navigation,
}: {
  navigation: Navigation
}): Promise<TopLevelNavItem[]> => [
  {
    link: {
      label: 'Forecasts',
      type: 'internal-relative',
      url: '/forecasts/avalanche',
    },
  },
  ...topLevelNavItem(navigation.weather, 'Weather'),
  {
    link: {
      label: 'Observations',
      type: 'internal-relative',
      url: '/observations',
    },
  },
  ...topLevelNavItem(navigation.education, 'Education'),
  ...topLevelNavItem(navigation.accidents, 'Accidents'),
  {
    link: {
      label: 'Blog',
      type: 'internal-relative',
      url: '/posts',
    },
  },
  {
    link: {
      label: 'Events',
      type: 'internal-relative',
      url: '/events',
    },
  },
  ...topLevelNavItem(navigation.about, 'About'),
  ...topLevelNavItem(navigation.support, 'Support'),
  ...topLevelNavItem(navigation.donate, 'Donate'),
]
