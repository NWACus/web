'use client'

import type { PanelData, SponsorsData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useState } from 'react'
import { formatInteger, formatPercentFine } from '../format'
import { sponsorsCsv } from '../panelExport'
import { usePanel, type PanelRequest } from '../usePanel'
import { BarList } from './BarList'
import { csvExportItems, ExportMenu } from './ExportMenu'
import { MUTED, PanelBody, PanelFrame } from './Panel'

const pickSponsors = (data: PanelData): SponsorsData | null =>
  data.kind === 'sponsors' ? data : null

const ROWS = 15

const formatRate = (rate: number | null) => (rate === null ? '–' : formatPercentFine(rate))

function SponsorList({ rows }: { rows: SponsorsData['rows'] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.slice(0, ROWS)
  return (
    <>
      <BarList
        headers={{ label: 'Sponsor', value: 'Impr.', extra: ['Clicks', 'CTR'] }}
        rows={visible.map((row) => ({
          key: row.sponsorId ?? row.name,
          label: row.name,
          value: row.impressions,
          extra: [formatInteger(row.clicks), formatRate(row.clickThroughRate)],
        }))}
      />
      {rows.length > ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className={cn('mt-3 self-start text-xs underline', MUTED)}
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length} sponsors`}
        </button>
      )}
    </>
  )
}

export function SponsorsPanel({ request }: { request: PanelRequest }) {
  const state = usePanel('sponsors', request, pickSponsors)
  const exportItems = csvExportItems(state, request.center, 'Sponsors', (data) =>
    sponsorsCsv(data.rows),
  )
  return (
    <PanelFrame
      tabs={[{ key: 'sponsors', label: 'Sponsors' }]}
      active="sponsors"
      onTab={() => {}}
      actions={<ExportMenu name="Sponsors" items={exportItems} />}
    >
      <p className={cn('mb-3 mt-0 text-xs', MUTED)}>
        Impressions count the sponsor block rendering, not scrolling into view.
      </p>
      <PanelBody state={state} empty="No sponsor impressions in this period.">
        {(data) => (data.rows.length === 0 ? null : <SponsorList rows={data.rows} />)}
      </PanelBody>
    </PanelFrame>
  )
}
