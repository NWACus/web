export type BreadcrumbItemData = {
  name: string
  href: string | null
  isLast: boolean
  /** True when the name came from the URL segment rather than an explicit title or label. */
  isDerived: boolean
}

export type BuildBreadcrumbsArgs = {
  center: string
  /** URL path within the center, without the center prefix, e.g. `/blog/some-post`. */
  path: string
  /** Explicit label for the leaf crumb. Wins over a matching `labels` entry. */
  title?: string
  /** Explicit labels for any crumb, keyed by the crumb's cumulative path. */
  labels?: Record<string, string>
  /**
   * Paths with a page to link to (see `linkablePaths`). An intermediate crumb links only when its
   * path is one of these, so nav sections and dropdown tabs never do.
   */
  linkablePaths?: string[]
  /** Linkable paths the page knows have no live page, e.g. a retired zone. */
  pathsWithoutPages?: string[]
}

export function buildBreadcrumbs({
  path,
  title,
  labels = {},
  linkablePaths = [],
  pathsWithoutPages = [],
}: BuildBreadcrumbsArgs): BreadcrumbItemData[] {
  const segments = path
    .split('/')
    .filter((segment) => segment !== '')
    .map(decodeURIComponent)

  if (segments.length === 0) return []

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    const cumulativePath = '/' + segments.slice(0, index + 1).join('/')
    const isLinkable =
      !isLast &&
      linkablePaths.includes(cumulativePath) &&
      !pathsWithoutPages.includes(cumulativePath)

    const explicitName = (isLast && title) || labels[cumulativePath]

    return {
      // Derived names come from URL slugs, so dashes read as spaces.
      name: explicitName ?? segment.replace(/-/g, ' '),
      href: isLinkable ? cumulativePath : null,
      isLast,
      isDerived: explicitName === undefined,
    }
  })
}
