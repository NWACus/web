'use client'

import { saveCsv } from '@/utilities/export/saveFile'
import { Popup, PopupList } from '@payloadcms/ui'
import { ChevronDown, Download } from 'lucide-react'
import { analyticsExportFilename } from '../panelExport'
import type { ReportState } from '../useReport'

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

/** A panel's download control. Renders nothing until there is data to save. */
export function ExportMenu({ name, items }: { name: string; items: ExportItem[] | null }) {
  if (!items || items.length === 0) return null
  return (
    <Popup
      horizontalAlign="right"
      size="fit-content"
      button={
        <span className="flex items-center gap-1" title={`Download ${name}`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {/* The caret is what says "menu" rather than "saves a file on click". */}
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
