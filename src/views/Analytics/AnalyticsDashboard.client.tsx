'use client'

import {
  defaultInterval,
  isIsoDate,
  isRangePreset,
  isTrendInterval,
  presetBaseline,
  presetRange,
  rangeDays,
  todayIn,
  trendIntervals,
  type DateRange,
  type TrendInterval,
} from '@/services/posthog/analyticsRange'
import { estimateColdSeconds, PROMPT_ABOVE_DAYS } from '@/services/posthog/reportTypes'
import { cn } from '@/utilities/ui'
import { Button, ConfirmationModal, useModal } from '@payloadcms/ui'
import { RefreshCw } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { formatDateRange } from './format'
import {
  BROWSERS,
  CHANNELS,
  CITIES,
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
import type { TrendGrouping } from './panels/TrendChart'
import { defaultSelection, RangePicker, type RangeSelection } from './RangePicker'
import type { ReportRequest } from './useReport'

const PAGE_TABS: [ListTab, ...ListTab[]] = [
  listTab(TOP_PAGES),
  listTab(ENTRY_PAGES),
  listTab(EXIT_PAGES),
]
const SOURCE_TABS: [ListTab, ...ListTab[]] = [listTab(REFERRERS), listTab(CHANNELS)]
const LOCATION_TABS: [ListTab, ...ListTab[]] = [
  listTab(CITIES),
  listTab(REGIONS),
  listTab(COUNTRIES),
]
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

/**
 * Updates the query string without a server round trip. Next keeps `useSearchParams` in sync with
 * native history calls; `router.replace` would re-render the admin page on the server, and that
 * request queues behind the page's in-flight report fetches for as long as they take.
 */
function replaceQuery(pathname: string, params: URLSearchParams) {
  window.history.replaceState(null, '', `${pathname}?${params}`)
}

function useRangeSelection(): [RangeSelection, (next: RangeSelection) => void] {
  const params = useSearchParams()
  const pathname = usePathname()
  const selection = useMemo(() => selectionFromParams(params), [params])
  const setSelection = useCallback(
    (next: RangeSelection) => replaceQuery(pathname, paramsFromSelection(next)),
    [pathname],
  )
  return [selection, setSelection]
}

/**
 * The trend's grouping, kept in the URL as `?interval=` only when it isn't the range's default. A
 * new range drops it, and a grouping the range is too short for falls back to the default.
 */
function useTrendGrouping(selection: RangeSelection, days: number): TrendGrouping {
  const params = useSearchParams()
  const pathname = usePathname()
  const intervals = trendIntervals(days)
  const fallback = defaultInterval(days)
  const requested = params.get('interval')
  const onInterval = (next: TrendInterval) => {
    const nextParams = paramsFromSelection(selection)
    if (next !== fallback) nextParams.set('interval', next)
    replaceQuery(pathname, nextParams)
  }
  const allowed = isTrendInterval(requested) && intervals.includes(requested)
  return { interval: allowed ? requested : fallback, intervals, onInterval }
}

const REFRESH_MODAL = 'web-analytics-refresh'

function Panels({
  request,
  centerName,
  trend,
  onViewPeriod,
}: {
  request: ReportRequest
  centerName: string
  trend: TrendGrouping
  onViewPeriod: (range: DateRange) => void
}) {
  const [totalVisitors, setTotalVisitors] = useState<number>()
  return (
    <>
      <OverviewCard
        request={request}
        centerName={centerName}
        trend={trend}
        onVisitors={setTotalVisitors}
        onViewPeriod={onViewPeriod}
      />
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
  const days = rangeDays(range)
  const trend = useTrendGrouping(selection, days)

  // Each Refresh reloads the reports on the page once past both caches; see useReport
  const [generation, setGeneration] = useState(0)
  const rangeKey = `${range.from}|${range.to}`
  const { openModal } = useModal()
  const forceRefresh = () => setGeneration((previous) => previous + 1)
  // A forced refresh recalculates everything on PostHog's side, so long ranges ask first
  const requestRefresh = () =>
    days > PROMPT_ABOVE_DAYS ? openModal(REFRESH_MODAL) : forceRefresh()
  const request: ReportRequest = {
    center,
    from: range.from,
    to: range.to,
    generation,
    baseline: presetBaseline(selection.preset),
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
          body={`This throws away the cached numbers for ${formatDateRange(range.from, range.to)} and recalculates them in PostHog, which takes ${describeSeconds(estimateColdSeconds(days))}.`}
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
          Web analytics are not connected in this environment.
        </p>
      ) : (
        <LongRangeGate
          key={rangeKey}
          center={center}
          range={range}
          onFallback={() => setSelection(defaultSelection)}
        >
          <Panels
            request={request}
            centerName={centerName}
            trend={trend}
            onViewPeriod={(range) => setSelection({ preset: 'custom', range })}
          />
        </LongRangeGate>
      )}
    </div>
  )
}
