'use client'

import type { DeadClicksData, NotFoundData, PanelData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useState } from 'react'
import { formatInteger } from '../format'
import { deadClicksCsv, notFoundCsv } from '../panelExport'
import { usePanel, type PanelRequest } from '../usePanel'
import { BarList } from './BarList'
import { csvExportItems, ExportMenu } from './ExportMenu'
import { MUTED, PanelBody, PanelFrame } from './Panel'

const pickFixes = (data: PanelData): NotFoundData | DeadClicksData | null =>
  data.kind === 'notFound' || data.kind === 'deadClicks' ? data : null

const TABS = [
  { key: 'notFound', label: 'Top 404s', empty: 'No 404s in this period.' },
  { key: 'deadClicks', label: 'Dead clicks', empty: 'No dead clicks in this period.' },
] as const
type FixesTab = (typeof TABS)[number]

function Secondary({ children }: { children: string }) {
  return <span className={cn('block truncate text-xs', MUTED)}>{children}</span>
}

function NotFoundList({ rows }: { rows: NotFoundData['rows'] }) {
  return (
    <BarList
      headers={{
        label: 'Missing page and where the link came from',
        value: 'People',
        extra: ['Hits'],
      }}
      rows={rows.map((row) => ({
        key: row.path,
        title: `${row.path}${row.referrer ? ` from ${row.referrer}` : ''}`,
        label: (
          <>
            {row.path || '/'}
            <Secondary>{row.referrer ? `from ${row.referrer}` : 'no referrer'}</Secondary>
          </>
        ),
        value: row.people,
        extra: [formatInteger(row.hits)],
      }))}
    />
  )
}

function DeadClickList({ rows }: { rows: DeadClicksData['rows'] }) {
  return (
    <BarList
      headers={{ label: 'What was clicked, and where', value: 'People', extra: ['Clicks'] }}
      rows={rows.map((row) => ({
        key: `${row.path}|${row.label}`,
        title: `${row.label} on ${row.path}`,
        label: (
          <>
            {row.label}
            <Secondary>{row.path || '/'}</Secondary>
          </>
        ),
        value: row.people,
        extra: [formatInteger(row.clicks)],
      }))}
    />
  )
}

const fixesCsv = (data: NotFoundData | DeadClicksData) =>
  data.kind === 'notFound' ? notFoundCsv(data.rows) : deadClicksCsv(data.rows)

/** Things that are wrong and fixable: broken links and clicks that did nothing. */
export function FixesPanel({ request }: { request: PanelRequest }) {
  const [activeKey, setActiveKey] = useState<string>(TABS[0].key)
  const tab: FixesTab = TABS.find((candidate) => candidate.key === activeKey) ?? TABS[0]
  const state = usePanel(tab.key, request, pickFixes)
  const exportItems = csvExportItems(state, request.center, tab.label, fixesCsv)

  return (
    <PanelFrame
      tabs={TABS}
      active={tab.key}
      onTab={setActiveKey}
      actions={<ExportMenu name={tab.label} items={exportItems} />}
    >
      {tab.key === 'deadClicks' && (
        <p className={cn('mb-3 mt-0 text-xs', MUTED)}>
          Dropdowns and maps are left out: they respond without changing the page.
        </p>
      )}
      <PanelBody state={state} empty={tab.empty}>
        {(data) => {
          if (data.rows.length === 0) return null
          return data.kind === 'notFound' ? (
            <NotFoundList rows={data.rows} />
          ) : (
            <DeadClickList rows={data.rows} />
          )
        }}
      </PanelBody>
    </PanelFrame>
  )
}
