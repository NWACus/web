/**
 * What the archive tabs under the forecast list — danger over time, mountain weather — share
 * beyond `ArchiveRoute`: their route args, breadcrumb labels and metadata. Each page still renders
 * its own `<Breadcrumbs>`, which the breadcrumb route-coverage test reads from the page's source.
 */
import type { Metadata, ResolvedMetadata } from 'next/types'
import type { SearchParams } from 'nuqs/server'

import { ARCHIVE_CRUMB, ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { centerRouteMetadata, type CenterRouteArgs } from '@/utilities/centerRoutePage'

export type ArchiveTabArgs = CenterRouteArgs & {
  searchParams: Promise<SearchParams>
}

/** Names the archive crumb, which would otherwise read "archive" from its path segment. */
export const ARCHIVE_TAB_BREADCRUMB_LABELS = { [ARCHIVE_PATH]: ARCHIVE_CRUMB }

/** The tab's `generateMetadata`: "Forecast Archive: {title}" at the tab's path. */
export function archiveTabMetadata(title: string, path: string) {
  return async function generateMetadata(
    props: CenterRouteArgs,
    parent: Promise<ResolvedMetadata>,
  ): Promise<Metadata> {
    const { center } = await props.params

    return centerRouteMetadata({ parent, label: `Forecast Archive: ${title}`, path, center })
  }
}
