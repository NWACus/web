'use client'

import type {
  BreakdownData,
  BreakdownPanel as BreakdownKey,
  PanelData,
} from '@/services/posthog/panelTypes'
import { useState } from 'react'
import { formatCompact } from '../format'
import { usePanel, type PanelRequest } from '../usePanel'
import { BarList } from './BarList'
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

function BreakdownTable({
  tab,
  request,
  totalVisitors,
}: {
  tab: BreakdownTab
  request: PanelRequest
  totalVisitors?: number
}) {
  const state = usePanel(tab.key, request, pickBreakdown)
  return (
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
  )
}

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
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[0]
  return (
    <PanelFrame tabs={tabs} active={active.key} onTab={setActiveKey}>
      <BreakdownTable
        key={active.key}
        tab={active}
        request={request}
        totalVisitors={totalVisitors}
      />
    </PanelFrame>
  )
}
