'use client'

import { saveCsv } from '@/utilities/export/saveFile'
import { cn } from '@/utilities/ui'
import { Popup, PopupList } from '@payloadcms/ui'
import { ChevronDown, Download } from 'lucide-react'
import { analyticsExportFilename } from '../panelExport'
import type { ReportState } from '../useReport'

// Outlined so the download icon and the menu's caret read as one control.
const OUTLINED =
  'flex items-center rounded border border-solid border-[var(--theme-elevation-150)] px-1.5 py-1 hover:bg-[var(--theme-elevation-100)]'

export type ExportItem = { label: string; onSelect: () => void }

/** The CSV item for a list panel, once it has rows to save. */
export function csvExportItems<T extends { rows: unknown[] }>(
  state: ReportState<T>,
  center: string,
  panelLabel: string,
  csv: (data: T) => string,
): ExportItem[] | null {
  if (state.status !== 'ready' || state.data.rows.length === 0) return null
  const { data, range } = state
  const filename = analyticsExportFilename(center, panelLabel, range, 'csv')
  return [{ label: 'CSV data', onSelect: () => saveCsv(csv(data), filename) }]
}

/** A panel's download control: a button for one format, a menu for several. Nothing until there is data. */
export function ExportMenu({ name, items }: { name: string; items: ExportItem[] | null }) {
  if (!items || items.length === 0) return null
  if (items.length === 1) {
    const [item] = items
    const label = `Download ${name} (${item.label})`
    return (
      <button
        type="button"
        title={label}
        onClick={item.onSelect}
        className={cn(OUTLINED, 'cursor-pointer bg-transparent text-inherit')}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </button>
    )
  }
  return (
    <Popup
      horizontalAlign="right"
      size="fit-content"
      button={
        // The caret is what says "menu" rather than "saves a file on click".
        <span className={cn(OUTLINED, 'gap-1')} title={`Download ${name}`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Download {name}</span>
        </span>
      }
      render={({ close }) => (
        <PopupList.ButtonGroup>
          {items.map((item) => (
            <PopupList.Button
              key={item.label}
              onClick={() => {
                close()
                item.onSelect()
              }}
            >
              {item.label}
            </PopupList.Button>
          ))}
        </PopupList.ButtonGroup>
      )}
    />
  )
}
