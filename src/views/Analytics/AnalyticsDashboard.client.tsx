'use client'

import {
  isIsoDate,
  isRangePreset,
  presetRange,
  rangeDays,
  todayIn,
  type DateRange,
} from '@/services/posthog/analyticsRange'
import { estimateColdSeconds, PROMPT_ABOVE_DAYS } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { Button, ConfirmationModal, useModal } from '@payloadcms/ui'
import { RefreshCw } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { formatDateRange } from './format'
import { describeSeconds, LongRangeGate } from './LongRangeGate'
import { BreakdownPanel, type BreakdownTab } from './panels/BreakdownPanel'
import { FixesPanel } from './panels/FixesPanel'
import { MUTED } from './panels/Panel'
import { SponsorsPanel } from './panels/SponsorsPanel'
import { pickOverview, StatsRow } from './panels/StatsRow'
import { TrendChart } from './panels/TrendChart'
import { defaultSelection, RangePicker, type RangeSelection } from './RangePicker'
import { usePanel, type PanelRequest } from './usePanel'

const PAGE_TABS: BreakdownTab[] = [
  { key: 'pages', label: 'Top pages', rowLabel: 'Page', secondaryLabel: 'Views' },
  { key: 'entryPages', label: 'Entry pages', rowLabel: 'Page', secondaryLabel: 'Visits' },
  { key: 'exitPages', label: 'Exit pages', rowLabel: 'Page', secondaryLabel: 'Visits' },
]
const SOURCE_TABS: BreakdownTab[] = [
  {
    key: 'referrers',
    label: 'Referrers',
    rowLabel: 'Source',
    secondaryLabel: 'Visits',
    display: (label) => (label === '$direct' ? 'Direct' : label),
  },
  { key: 'channels', label: 'Channels', rowLabel: 'Channel', secondaryLabel: 'Visits' },
]
const LOCATION_TABS: BreakdownTab[] = [
  { key: 'countries', label: 'Countries', rowLabel: 'Country', secondaryLabel: 'Views' },
  { key: 'regions', label: 'Regions', rowLabel: 'Region', secondaryLabel: 'Views' },
]
const DEVICE_TABS: BreakdownTab[] = [
  { key: 'deviceTypes', label: 'Device', rowLabel: 'Device', secondaryLabel: 'Views' },
  { key: 'browsers', label: 'Browser', rowLabel: 'Browser', secondaryLabel: 'Views' },
  { key: 'operatingSystems', label: 'OS', rowLabel: 'Operating system', secondaryLabel: 'Views' },
]

function customRangeFromParams(params: URLSearchParams): DateRange | null {
  const from = params.get('from')
  const to = params.get('to')
  return isIsoDate(from) && isIsoDate(to) && from <= to ? { from, to } : null
}

/** `?period=7d` or `?from=YYYY-MM-DD&to=YYYY-MM-DD`; anything else is the default preset. */
function selectionFromParams(params: URLSearchParams): RangeSelection {
  const range = customRangeFromParams(params)
  if (range) return { preset: 'custom', range }
  const period = params.get('period')
  return isRangePreset(period) ? { preset: period } : defaultSelection
}

function paramsFromSelection(selection: RangeSelection): URLSearchParams {
  return selection.preset === 'custom'
    ? new URLSearchParams(selection.range)
    : new URLSearchParams({ period: selection.preset })
}

function useRangeSelection(): [RangeSelection, (next: RangeSelection) => void] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selection = useMemo(() => selectionFromParams(params), [params])
  const setSelection = useCallback(
    (next: RangeSelection) => {
      router.replace(`${pathname}?${paramsFromSelection(next)}`, { scroll: false })
    },
    [router, pathname],
  )
  return [selection, setSelection]
}

const REFRESH_MODAL = 'site-analytics-refresh'

function Panels({ request, centerName }: { request: PanelRequest; centerName: string }) {
  const overview = usePanel('overview', request, pickOverview)
  const totalVisitors = overview.status === 'ready' ? overview.data.visitors.current : undefined
  return (
    <>
      <section className="card flex-col gap-8">
        <StatsRow state={overview} />
        <TrendChart request={request} centerName={centerName} overview={overview} />
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakdownPanel tabs={PAGE_TABS} request={request} totalVisitors={totalVisitors} />
        <BreakdownPanel tabs={SOURCE_TABS} request={request} totalVisitors={totalVisitors} />
        <BreakdownPanel tabs={LOCATION_TABS} request={request} totalVisitors={totalVisitors} />
        <BreakdownPanel tabs={DEVICE_TABS} request={request} totalVisitors={totalVisitors} />
        <SponsorsPanel request={request} />
        <FixesPanel request={request} />
      </div>
    </>
  )
}

type Props = {
  center: string
  centerName: string
  timezone: string
  timezoneLabel: string
  configured: boolean
}

export function AnalyticsDashboard({
  center,
  centerName,
  timezone,
  timezoneLabel,
  configured,
}: Props) {
  const [selection, setSelection] = useRangeSelection()
  const range: DateRange =
    selection.preset === 'custom'
      ? selection.range
      : presetRange(selection.preset, timezone, new Date())

  // The Refresh button forces one round of uncached fetches for the range it was pressed on.
  const [refresh, setRefresh] = useState({ generation: 0, forcedRange: '' })
  const rangeKey = `${range.from}|${range.to}`
  const { openModal } = useModal()
  const forceRefresh = () =>
    setRefresh(({ generation }) => ({ generation: generation + 1, forcedRange: rangeKey }))
  // A forced refresh recalculates everything on PostHog's side, so long ranges ask first
  const requestRefresh = () =>
    rangeDays(range) > PROMPT_ABOVE_DAYS ? openModal(REFRESH_MODAL) : forceRefresh()
  const request: PanelRequest = {
    center,
    from: range.from,
    to: range.to,
    generation: refresh.generation,
    force: refresh.forcedRange === rangeKey,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-xl font-semibold">{centerName}</h2>
          <p className={cn('m-0 text-sm', MUTED)}>
            Days follow {timezoneLabel}. PostHog itself reports in UTC, so daily totals can differ
            at the edges. Detected bots are left out of everything except bounce rate and visit
            duration.
          </p>
        </div>
        <Button
          buttonStyle="secondary"
          size="small"
          className="m-0"
          icon={<RefreshCw className="h-4 w-4" />}
          iconPosition="left"
          disabled={!configured}
          onClick={requestRefresh}
        >
          Refresh
        </Button>
        <ConfirmationModal
          modalSlug={REFRESH_MODAL}
          heading="Refresh from PostHog?"
          body={`This throws away the cached numbers for ${formatDateRange(range.from, range.to)} and recalculates them in PostHog, which takes ${describeSeconds(estimateColdSeconds(rangeDays(range)))}.`}
          confirmLabel="Refresh"
          onConfirm={forceRefresh}
        />
      </div>

      <RangePicker
        selection={selection}
        resolved={range}
        today={todayIn(timezone, new Date())}
        onChange={setSelection}
      />

      {!configured ? (
        <p className={cn('m-0 text-sm', MUTED)}>
          Site analytics are not connected in this environment.
        </p>
      ) : (
        <LongRangeGate
          key={rangeKey}
          center={center}
          range={range}
          onFallback={() => setSelection(defaultSelection)}
        >
          <Panels request={request} centerName={centerName} />
        </LongRangeGate>
      )}
    </div>
  )
}
