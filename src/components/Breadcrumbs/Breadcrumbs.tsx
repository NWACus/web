import { extractAllInternalUrls, getCachedTopLevelNavItems } from '@/components/Header/utils'
import { BreadcrumbsList } from './BreadcrumbsList.client'
import { buildBreadcrumbs, type BuildBreadcrumbsArgs } from './buildBreadcrumbs'

// The paths the center's nav links to, including tabs hidden from the menu, whose pages stay
// live; with no nav to read, no intermediate crumb links
const navPathsFor = async (center: string) => {
  try {
    // Defaulted: nav cached before hiddenTabUrls existed doesn't carry it
    const { topLevelNavItems, hiddenTabUrls = [] } = await getCachedTopLevelNavItems(center)()
    return [...extractAllInternalUrls(topLevelNavItems), ...hiddenTabUrls]
  } catch (error) {
    console.warn(`Breadcrumbs couldn't read the navigation for ${center}:`, error)
    return []
  }
}

/**
 * Server-rendered breadcrumb trail for a page within a center. The trail is derived
 * from `path`; `title` labels the leaf and `labels` relabels any crumb by its path, so
 * document titles are present in the first render. A crumb links only if the nav does.
 */
export async function Breadcrumbs(props: Omit<BuildBreadcrumbsArgs, 'navPaths'>) {
  const items = buildBreadcrumbs({ ...props, navPaths: await navPathsFor(props.center) })

  if (items.length === 0) return null

  return <BreadcrumbsList items={items} />
}
