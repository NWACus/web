'use client'

import type {
  BreakdownData,
  BreakdownPanel as BreakdownKey,
  PanelData,
} from '@/services/posthog/panelTypes'
import { useState } from 'react'
import { formatCompact } from '../format'
import { breakdownCsv } from '../panelExport'
import { usePanel, type PanelRequest } from '../usePanel'
import { BarList } from './BarList'
import { csvExportItems, ExportMenu } from './ExportMenu'
import { PanelBody, PanelFrame } from './Panel'

export type BreakdownTab = {
  key: BreakdownKey
  label: string
  rowLabel: string
  secondaryLabel: 'Visits' | 'Views'
  /** Rewrites a raw label for display, e.g. `$direct` → Direct. */
  display?: (label: string) => string
}

const pickBreakdown = (data: PanelData): BreakdownData | null =>
  data.kind === 'breakdown' ? data : null

/** One card with tabs, each tab its own lazily fetched breakdown. */
export function BreakdownPanel({
  tabs,
  request,
  totalVisitors,
}: {
  tabs: BreakdownTab[]
  request: PanelRequest
  totalVisitors?: number
}) {
  const [activeKey, setActiveKey] = useState<string>(tabs[0].key)
  const tab = tabs.find((candidate) => candidate.key === activeKey) ?? tabs[0]
  const state = usePanel(tab.key, request, pickBreakdown)
  const exportItems = csvExportItems(state, request.center, tab.label, (data) =>
    breakdownCsv(data.rows, tab),
  )

  return (
    <PanelFrame
      tabs={tabs}
      active={tab.key}
      onTab={setActiveKey}
      actions={<ExportMenu name={tab.label} items={exportItems} />}
    >
      <PanelBody state={state} empty="Nothing in this period.">
        {(data) =>
          data.rows.length === 0 ? null : (
            <BarList
              total={totalVisitors}
              headers={{ label: tab.rowLabel, value: 'Visitors', extra: [tab.secondaryLabel] }}
              rows={data.rows.map((row) => ({
                key: row.label,
                label: tab.display ? tab.display(row.label) : row.label,
                title: row.label,
                value: row.visitors,
                extra: [formatCompact(row.secondary)],
              }))}
            />
          )
        }
      </PanelBody>
    </PanelFrame>
  )
}
