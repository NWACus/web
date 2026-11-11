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
import {
  BROWSERS,
  CHANNELS,
  COUNTRIES,
  DEAD_CLICKS,
  DEVICE_TYPES,
  ENTRY_PAGES,
  EXIT_PAGES,
  NOT_FOUND,
  OPERATING_SYSTEMS,
  REFERRERS,
  REGIONS,
  SPONSORS,
  TOP_PAGES,
} from './lists'
import { describeSeconds, LongRangeGate } from './LongRangeGate'
import { ListPanel, listTab, type ListTab } from './panels/ListPanel'
import { OverviewCard } from './panels/OverviewCard'
import { MUTED } from './panels/Panel'
import { defaultSelection, RangePicker, type RangeSelection } from './RangePicker'
import type { PanelRequest } from './usePanel'

const PAGE_TABS: [ListTab, ...ListTab[]] = [
  listTab(TOP_PAGES),
  listTab(ENTRY_PAGES),
  listTab(EXIT_PAGES),
]
const SOURCE_TABS: [ListTab, ...ListTab[]] = [listTab(REFERRERS), listTab(CHANNELS)]
const LOCATION_TABS: [ListTab, ...ListTab[]] = [listTab(COUNTRIES), listTab(REGIONS)]
const DEVICE_TABS: [ListTab, ...ListTab[]] = [
  listTab(DEVICE_TYPES),
  listTab(BROWSERS),
  listTab(OPERATING_SYSTEMS),
]
const SPONSOR_TABS: [ListTab, ...ListTab[]] = [listTab(SPONSORS)]
// Things that are wrong and fixable: broken links and clicks that did nothing
const FIX_TABS: [ListTab, ...ListTab[]] = [listTab(NOT_FOUND), listTab(DEAD_CLICKS)]

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
  const [totalVisitors, setTotalVisitors] = useState<number>()
  return (
    <>
      <OverviewCard request={request} centerName={centerName} onVisitors={setTotalVisitors} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ListPanel title="Pages" tabs={PAGE_TABS} request={request} totalVisitors={totalVisitors} />
        <ListPanel
          title="Traffic sources"
          tabs={SOURCE_TABS}
          request={request}
          totalVisitors={totalVisitors}
        />
        <ListPanel
          title="Visitor locations"
          tabs={LOCATION_TABS}
          request={request}
          totalVisitors={totalVisitors}
        />
        <ListPanel
          title="Devices"
          tabs={DEVICE_TABS}
          request={request}
          totalVisitors={totalVisitors}
        />
        <ListPanel title="Sponsors" tabs={SPONSOR_TABS} request={request} />
        <ListPanel title="Things to fix" tabs={FIX_TABS} request={request} />
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
