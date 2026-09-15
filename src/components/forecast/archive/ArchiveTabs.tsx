/**
 * The archive browser's tabs — the forecast list and the danger-over-time charts — as the legacy
 * widget's tab bar offers them. Each tab is a route of its own, and every link carries the
 * reader's filters (all but the list's page number) so switching tabs keeps the selection.
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
    <nav className="flex gap-1 border-b" aria-label="Archive views">
      {TABS.map(({ view, label, path, Icon }) => {
        const isActive = view === active
        return (
          <Link
            key={view}
            href={`${path}${search}`}
            prefetch={false}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium',
              isActive
                ? 'border-primary text-foreground'
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
