import { BuiltInPage, Navigation, Page, Post } from '@/payload-types'
import { normalizePath } from '@/utilities/path'
import invariant from 'tiny-invariant'
import type { DisplayMode, NavItem, NavLink, TopLevelNavItem } from './utils'

/**
 * Pure utility functions for navigation data processing.
 * These functions do not have a dependency on Payload which was causing an ESM-related error with Jest.
 * Putting them in their own file avoids this @payloadcms/drizzle import error.
 */

type NavTab = Navigation['weather' | 'education' | 'accidents' | 'about' | 'support']

// Payload-shaped nav item accepted by convertNavItem. Top-level items include
// `label`; nested items don't. Both have `id`, `link`, and optional children.
type PayloadNavItem = {
  id?: string | null
  label?: string | null
  link?: Parameters<typeof convertToNavLink>[0]
  items?: PayloadNavItem[] | null
}

/**
 * Convert a payload nav tab to a frontend TopLevelNavItem, branching on displayMode.
 *
 * - `'link'` or `'button'` mode: returns the tab's top-level link.
 * - `'dropdown'` mode (default): returns the tab's items as a dropdown.
 * - Returns an empty array if the tab is disabled, missing, or has no renderable content.
 */
export function topLevelNavItem({ tab, label }: { tab: NavTab; label: string }): TopLevelNavItem[] {
  if (!tab || tab.options?.enabled === false) return []

  const mode: DisplayMode = tab.options?.displayMode ?? 'dropdown'

  if (mode === 'link' || mode === 'button') {
    if (!tab.link) return []
    const link = convertToNavLink(tab.link)
    if (!link) return []
    return [{ displayMode: mode, link, label: link.label }]
  }

  // dropdown mode — recursively convert items using the tab label as the initial parent path
  const items = (tab.items ?? [])
    .map((item) => convertNavItem(item, [label.toLowerCase()]))
    .filter((item): item is NavItem => item !== null)

  if (items.length === 0) return []

  return [{ displayMode: 'dropdown', label, items }]
}

// Recursively converts a payload nav item into a frontend NavItem, or null if
// the item has no renderable content. `parentPath` is the sequence of parent
// labels used to build nested URLs (e.g. ['education', 'classes']).
function convertNavItem(item: PayloadNavItem, parentPath: string[]): NavItem | null {
  if (!item) return null
  invariant(item.id, `Nav item in [${parentPath.join('/')}] has no id.`)

  const navItem: NavItem = { id: item.id }

  if (typeof item.label === 'string') {
    navItem.label = item.label
  }

  if (item.link) {
    const link = convertToNavLink(item.link, parentPath)
    if (link) navItem.link = link
  }

  if (item.items && item.items.length > 0) {
    const ownLabel = navItem.label ?? navItem.link?.label
    const childPath = ownLabel ? [...parentPath, ownLabel.toLowerCase()] : parentPath
    const children = item.items
      .map((child) => convertNavItem(child, childPath))
      .filter((child): child is NavItem => child !== null)
    if (children.length > 0) navItem.items = children
  }

  return navItem.link || (navItem.items && navItem.items.length > 0) ? navItem : null
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

  // Missing page - internal hardcoded links
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

function isClickableInternalLink(
  item: NavItem | TopLevelNavItem,
): item is (NavItem | TopLevelNavItem) & { link: { type: 'internal'; url: string } } {
  const hasChildren = item.items && item.items.length > 0
  return item.link?.type === 'internal' && !hasChildren
}

export function extractAllInternalUrls(navItems: TopLevelNavItem[]): string[] {
  const urls: string[] = []

  function extractFromNavItem(item: NavItem | TopLevelNavItem): void {
    if (isClickableInternalLink(item)) {
      urls.push(item.link.url)
    }

    if (item.items) {
      item.items.forEach(extractFromNavItem)
    }
  }

  navItems.forEach(extractFromNavItem)

  return Array.from(new Set(urls)).sort()
}

export function findNavigationItemBySlug(
  navItems: TopLevelNavItem[],
  slug: string,
): NavItem | TopLevelNavItem | null {
  function searchInNavItem(item: NavItem | TopLevelNavItem): NavItem | TopLevelNavItem | null {
    if (isClickableInternalLink(item)) {
      const itemSlug = item.link.url.split('/').filter(Boolean).pop()
      if (itemSlug === slug) {
        return item
      }
    }

    if (item.items) {
      for (const childItem of item.items) {
        const found = searchInNavItem(childItem)
        if (found) return found
      }
    }

    return null
  }

  for (const navItem of navItems) {
    const found = searchInNavItem(navItem)
    if (found) return found
  }

  return null
}

export function getNavigationPathForSlug(navItems: TopLevelNavItem[], slug: string): string[] {
  function buildPath(item: NavItem | TopLevelNavItem, currentPath: string[] = []): string[] | null {
    const newPath = item.link ? [...currentPath, item.link.url] : currentPath

    if (isClickableInternalLink(item)) {
      const itemSlug = item.link.url.split('/').filter(Boolean).pop()
      if (itemSlug === slug) {
        return newPath
      }
    }

    if (item.items) {
      for (const childItem of item.items) {
        const found = buildPath(childItem, newPath)
        if (found) return found
      }
    }

    return null
  }

  for (const navItem of navItems) {
    const path = buildPath(navItem)
    if (path) return path
  }

  return []
}

export function getCanonicalUrlsFromNavigation(
  navigationUrls: string[],
  pages: Array<{ slug: string; updatedAt?: string }>,
): { canonicalUrls: string[]; excludedSlugs: string[] } {
  const navigationSlugs = new Set<string>()
  const excludedSlugs: string[] = []

  // Extract slugs from navigation URLs
  navigationUrls.forEach((url) => {
    const slug = url.split('/').filter(Boolean).pop()
    if (slug) {
      navigationSlugs.add(slug)
    }
  })

  // Check which page slugs are also in navigation
  pages.forEach((page) => {
    if (navigationSlugs.has(page.slug)) {
      excludedSlugs.push(page.slug)
    }
  })

  return {
    canonicalUrls: navigationUrls,
    excludedSlugs,
  }
}
