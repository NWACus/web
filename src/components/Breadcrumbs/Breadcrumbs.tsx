import { BreadcrumbsList } from './BreadcrumbsList.client'
import { buildBreadcrumbs, type BuildBreadcrumbsArgs } from './buildBreadcrumbs'

/**
 * Server-rendered breadcrumb trail for a page within a center. The trail is derived
 * from `path`; `title` labels the leaf and `labels` relabels any crumb by its path, so
 * document titles are present in the first render.
 */
export function Breadcrumbs(props: BuildBreadcrumbsArgs) {
  const items = buildBreadcrumbs(props)

  if (items.length === 0) return null

  return <BreadcrumbsList items={items} />
}
