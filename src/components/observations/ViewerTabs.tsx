'use client'

/**
 * The widget's tabs — Observations, Avalanches and Charts — as links to their addresses carrying
 * the reader's filters. A plain click switches in place (the map and filters stay put); a modified
 * click opens the tab in a new one.
 */
import { tabPath, type ViewerTab } from '@/services/nac/observations/routes'
import { cn } from '@/utilities/ui'

import { isPlainClick } from './links'

const TABS: { kind: ViewerTab; label: string }[] = [
  { kind: 'observation', label: 'Observations' },
  { kind: 'avalanche', label: 'Avalanches' },
  { kind: 'charts', label: 'Charts' },
]

interface ViewerTabsProps {
  active: ViewerTab
  prefix: string
  search: string
  onSelect: (tab: ViewerTab) => void
}

export function ViewerTabs({ active, prefix, search, onSelect }: ViewerTabsProps) {
  return (
    <nav aria-label="Observation views" className="flex border-b">
      {TABS.map(({ kind, label }) => (
        <a
          key={kind}
          href={`${prefix}${tabPath(kind)}${search}`}
          aria-current={kind === active ? 'page' : undefined}
          onClick={(event) => {
            if (!isPlainClick(event)) return
            event.preventDefault()
            if (kind !== active) onSelect(kind)
          }}
          className={cn(
            '-mb-px flex-1 border-b-2 px-4 py-2 text-center text-sm font-medium lg:flex-none',
            kind === active
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
