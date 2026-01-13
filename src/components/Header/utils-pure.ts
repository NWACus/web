import type { NavItem, TopLevelNavItem } from './utils'

/**
 * Pure utility functions for navigation data processing.
 * These functions do not have a dependency on Payload which was causing an ESM-related error with Jest.
 * Putting them in their own file avoids this @payloadcms/drizzle import error.
 */

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
