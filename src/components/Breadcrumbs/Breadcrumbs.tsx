import { BreadcrumbsList } from './BreadcrumbsList.client'
import { buildBreadcrumbs, type BuildBreadcrumbsArgs } from './buildBreadcrumbs'
import { linkablePaths } from './linkablePaths'

/**
 * Server-rendered breadcrumb trail for a page within a center. The trail is derived
 * from `path`; `title` labels the leaf and `labels` relabels any crumb by its path, so
 * document titles are present in the first render. A crumb links only if it has a page.
 */
export async function Breadcrumbs(props: Omit<BuildBreadcrumbsArgs, 'linkablePaths'>) {
  const items = buildBreadcrumbs({ ...props, linkablePaths: await linkablePaths(props.center) })

  if (items.length === 0) return null

  return <BreadcrumbsList items={items} />
}
