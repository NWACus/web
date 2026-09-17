/**
 * The archive browser's tabs — the forecast list and the danger-over-time charts — as the legacy
 * widget's tab bar offers them. Each tab is a route of its own, and every link carries the
 * reader's filters (all but the list's page number) so switching tabs keeps the selection.
 *
 * Links in a `nav` rather than the ARIA tabs pattern: a tab in that pattern reveals a panel in the
 * same document, where activating one of these navigates. `aria-current` is what marks the one a
 * reader is on. Below `sm` they stack, because side by side the two labels wrap mid-phrase.
 */
import { BarChart3, Mountain } from 'lucide-react'
import Link from 'next/link'

import {
  ARCHIVE_DANGER_PATH,
  ARCHIVE_PATH,
  type ArchiveQuery,
  type ArchiveView,
} from '@/services/nac/forecastArchive'
import { cn } from '@/utilities/ui'

import { serializeArchiveSearchParams } from './archiveSearchParams'

const TABS: { view: ArchiveView; label: string; path: string; Icon: typeof Mountain }[] = [
  { view: 'forecasts', label: 'Avalanche Forecasts', path: ARCHIVE_PATH, Icon: Mountain },
  { view: 'danger', label: 'Danger Over Time', path: ARCHIVE_DANGER_PATH, Icon: BarChart3 },
]

interface ArchiveTabsProps {
  active: ArchiveView
  /** The query as loaded from the URL, so the links carry the reader's filters verbatim. */
  query: ArchiveQuery
}

export function ArchiveTabs({ active, query }: ArchiveTabsProps) {
  const search = serializeArchiveSearchParams({ ...query, page: null })

  return (
    <nav
      // Stacked, the rule sits flush under the last tab and reads as its underline, so it is
      // pushed down to sit midway between the tabs and what follows.
      className="flex flex-col gap-1 border-b pb-5 sm:flex-row sm:pb-0"
      aria-label="Archive views"
    >
      {TABS.map(({ view, label, path, Icon }) => {
        const isActive = view === active
        return (
          <Link
            key={view}
            href={`${path}${search}`}
            prefetch={false}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-l-2 px-3 py-2 text-sm font-medium sm:-mb-px sm:border-b-2 sm:border-l-0',
              isActive
                ? 'border-primary bg-muted/40 text-foreground sm:bg-transparent'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
