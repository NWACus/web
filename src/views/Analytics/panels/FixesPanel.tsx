'use client'

import type { DeadClicksData, NotFoundData, PanelData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useState } from 'react'
import { formatInteger } from '../format'
import { usePanel, type PanelRequest } from '../usePanel'
import { BarList } from './BarList'
import { MUTED, PanelBody, PanelFrame } from './Panel'

const pickNotFound = (data: PanelData): NotFoundData | null =>
  data.kind === 'notFound' ? data : null
const pickDeadClicks = (data: PanelData): DeadClicksData | null =>
  data.kind === 'deadClicks' ? data : null

const TABS = [
  { key: 'notFound', label: 'Top 404s' },
  { key: 'deadClicks', label: 'Dead clicks' },
] as const

function Secondary({ children }: { children: string }) {
  return <span className={cn('block truncate text-xs', MUTED)}>{children}</span>
}

function NotFoundList({ request }: { request: PanelRequest }) {
  const state = usePanel('notFound', request, pickNotFound)
  return (
    <PanelBody state={state} empty="No 404s in this period.">
      {(data) =>
        data.rows.length === 0 ? null : (
          <BarList
            headers={{
              label: 'Missing page and where the link came from',
              value: 'People',
              extra: ['Hits'],
            }}
            rows={data.rows.map((row) => ({
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
    </PanelBody>
  )
}

function DeadClickList({ request }: { request: PanelRequest }) {
  const state = usePanel('deadClicks', request, pickDeadClicks)
  return (
    <PanelBody state={state} empty="No dead clicks in this period.">
      {(data) =>
        data.rows.length === 0 ? null : (
          <BarList
            headers={{ label: 'What was clicked, and where', value: 'People', extra: ['Clicks'] }}
            rows={data.rows.map((row) => ({
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
    </PanelBody>
  )
}

/** Things that are wrong and fixable: broken links and clicks that did nothing. */
export function FixesPanel({ request }: { request: PanelRequest }) {
  const [active, setActive] = useState<string>(TABS[0].key)
  return (
    <PanelFrame tabs={TABS} active={active} onTab={setActive}>
      {active === 'deadClicks' ? (
        <>
          <p className={cn('mb-3 mt-0 text-xs', MUTED)}>
            Dropdowns and maps are left out: they respond without changing the page.
          </p>
          <DeadClickList request={request} />
        </>
      ) : (
        <NotFoundList request={request} />
      )}
    </PanelFrame>
  )
}
