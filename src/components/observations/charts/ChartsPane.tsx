'use client'

/**
 * The charts tab (inventory row O3): the legacy widget's "Visual" view, seven charts over the
 * avalanches in the map area for the current filters, in place of the list. The data is one
 * stats read (`useAvalancheStats`); the options are pure builders (`chartOptions.ts`); each card
 * handles its own loading, empty and error states and saves itself as a PNG.
 *
 * While a newer answer is on its way the last charts stay up, dimmed, rather than collapsing to
 * a loader on every pan: seven charts rebuilding is a lot of movement for a 400ms debounce.
 */
import type { ECharts } from 'echarts/core'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { EChartOption } from '@/components/charts/EChart'
import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { AvalancheStats } from '@/services/nac/model/observation'

import type { CountScope } from '../list/countScope'
import { ChartCard, downloadChartPng, type ChartState } from './ChartCard'
import {
  BAR_CHART_HEIGHT,
  DONUT_CHART_HEIGHT,
  INSTABILITY_SERIES,
  ROSE_CHART_HEIGHT,
  ROSE_CHART_HEIGHT_NARROW,
  SIZE_COLORS,
  SIZE_SERIES,
  TRIGGER_COLORS,
  donutChartOption,
  hasBucketCounts,
  hasCounts,
  problemChartOption,
  roseChartOption,
  statsCountLine,
  timeSeriesOption,
  zoneChartOption,
  type RoseMode,
} from './chartOptions'
import type { StatsStatus } from './useAvalancheStats'

const EChart = dynamic(() => import('@/components/charts/EChart').then((m) => m.EChart), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded-md bg-muted" style={{ height: 300 }} />,
})

const NO_AVALANCHES = 'No avalanches'
const NO_AVALANCHE_DATA = 'No avalanche data for selected period'
const NO_OBSERVATION_DATA = 'No observation data for selected period'

interface ChartsPaneProps {
  status: StatsStatus
  /** The dates charted, for the saved files' names. */
  dates: { from: string; to: string }
  scope: CountScope
}

/** The last stats answered, kept up while a newer answer loads. */
function useShownStats(status: StatsStatus): AvalancheStats | null {
  const [shown, setShown] = useState<AvalancheStats | null>(null)
  useEffect(() => {
    if (status.state === 'ready') setShown(status.data)
    if (status.state === 'error') setShown(null)
  }, [status])
  return status.state === 'ready' ? status.data : shown
}

interface ChartSpec {
  id: string
  title: string
  emptyText: string
  height: number
  empty: boolean
  /** The option for the screen, and the same with the title drawn in for the PNG. */
  option: EChartOption
  titled: EChartOption
}

function cardState(spec: ChartSpec, status: StatsStatus, shown: AvalancheStats | null): ChartState {
  if (status.state === 'error') return 'error'
  if (!shown) return 'loading'
  return spec.empty ? 'empty' : 'ready'
}

/** The seven charts' options for these stats, built once per answer and viewport width. */
function useChartSpecs(stats: AvalancheStats | null, narrow: boolean, roseMode: RoseMode) {
  return useMemo(
    () => (stats ? chartSpecs(stats, narrow, roseMode) : []),
    [stats, narrow, roseMode],
  )
}

function chartSpecs(stats: AvalancheStats, narrow: boolean, roseMode: RoseMode): ChartSpec[] {
  const roseHeight = narrow ? ROSE_CHART_HEIGHT_NARROW : ROSE_CHART_HEIGHT
  const zoneTitle = stats.groupedBy === 'center' ? 'Avalanches by Center' : 'Avalanches by Zone'
  const overTime = {
    buckets: stats.avalanchesOverTime,
    aggregation: stats.aggregation,
    series: SIZE_SERIES,
    yName: 'Number of Avalanches',
  }
  const instability = {
    buckets: stats.instabilityOverTime,
    aggregation: stats.aggregation,
    series: INSTABILITY_SERIES,
    yName: 'Number of Observations',
  }
  return [
    {
      id: 'by-zone',
      title: zoneTitle,
      emptyText: NO_AVALANCHES,
      height: BAR_CHART_HEIGHT,
      empty: !hasCounts(stats.zones),
      option: zoneChartOption(stats.zones, { narrow }),
      titled: zoneChartOption(stats.zones, { title: zoneTitle }),
    },
    {
      id: 'trigger',
      title: 'Trigger',
      emptyText: NO_AVALANCHES,
      height: DONUT_CHART_HEIGHT,
      empty: !hasCounts(stats.triggers),
      option: donutChartOption(stats.triggers, TRIGGER_COLORS, { narrow }),
      titled: donutChartOption(stats.triggers, TRIGGER_COLORS, { title: 'Trigger' }),
    },
    {
      id: 'size',
      title: 'Size',
      emptyText: NO_AVALANCHES,
      height: DONUT_CHART_HEIGHT,
      empty: !hasCounts(stats.sizes),
      option: donutChartOption(stats.sizes, SIZE_COLORS, { narrow }),
      titled: donutChartOption(stats.sizes, SIZE_COLORS, { title: 'Size' }),
    },
    {
      id: 'aspect-elevation',
      title: 'Aspect & Elevation',
      emptyText: NO_AVALANCHES,
      height: roseHeight,
      empty: !hasCounts(stats.rose.cells),
      option: roseChartOption(stats.rose, { mode: roseMode, height: roseHeight }),
      titled: roseChartOption(stats.rose, {
        mode: roseMode,
        height: roseHeight,
        title: 'Aspect & Elevation',
      }),
    },
    {
      id: 'problem',
      title: 'Avalanche Problem',
      emptyText: NO_AVALANCHES,
      height: BAR_CHART_HEIGHT,
      empty: !hasCounts(stats.problems),
      option: problemChartOption(stats.problems, { narrow }),
      titled: problemChartOption(stats.problems, { title: 'Avalanche Problem' }),
    },
    {
      id: 'over-time',
      title: 'Avalanches Over Time',
      emptyText: NO_AVALANCHE_DATA,
      height: BAR_CHART_HEIGHT,
      empty: !hasBucketCounts(stats.avalanchesOverTime),
      option: timeSeriesOption(overTime, { narrow }),
      titled: timeSeriesOption(overTime, { title: 'Avalanches Over Time' }),
    },
    {
      id: 'instability',
      title: 'Instability Over Time',
      emptyText: NO_OBSERVATION_DATA,
      height: BAR_CHART_HEIGHT,
      empty: !hasBucketCounts(stats.instabilityOverTime),
      option: timeSeriesOption(instability, { narrow }),
      titled: timeSeriesOption(instability, { title: 'Instability Over Time' }),
    },
  ]
}

/** The seven cards before any data: so the tab has its shape while the first answer loads. */
const PLACEHOLDERS: Pick<ChartSpec, 'id' | 'title' | 'height'>[] = [
  { id: 'by-zone', title: 'Avalanches by Zone', height: BAR_CHART_HEIGHT },
  { id: 'trigger', title: 'Trigger', height: DONUT_CHART_HEIGHT },
  { id: 'size', title: 'Size', height: DONUT_CHART_HEIGHT },
  { id: 'aspect-elevation', title: 'Aspect & Elevation', height: ROSE_CHART_HEIGHT },
  { id: 'problem', title: 'Avalanche Problem', height: BAR_CHART_HEIGHT },
  { id: 'over-time', title: 'Avalanches Over Time', height: BAR_CHART_HEIGHT },
  { id: 'instability', title: 'Instability Over Time', height: BAR_CHART_HEIGHT },
]

function RoseModeSwitch({
  mode,
  onChange,
}: {
  mode: RoseMode
  onChange: (mode: RoseMode) => void
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={mode}
      onValueChange={(value) => {
        if (value === 'circles' || value === 'numbers') onChange(value)
      }}
      aria-label="Show counts as"
      className="justify-center pt-2"
    >
      <ToggleGroupItem value="circles">Circles</ToggleGroupItem>
      <ToggleGroupItem value="numbers">Numbers</ToggleGroupItem>
    </ToggleGroup>
  )
}

function Chart({
  spec,
  state,
  stale,
  dates,
  footer,
}: {
  spec: ChartSpec
  state: ChartState
  stale: boolean
  dates: { from: string; to: string }
  footer?: React.ReactNode
}) {
  const chartRef = useRef<ECharts | null>(null)
  const download = () => {
    const chart = chartRef.current
    if (!chart) return
    downloadChartPng(chart, {
      screen: spec.option,
      titled: spec.titled,
      filename: `avalanches-${spec.id}-${dates.from}-to-${dates.to}.png`,
    })
  }
  return (
    <ChartCard
      id={`chart-${spec.id}`}
      title={spec.title}
      state={state}
      stale={stale}
      emptyText={spec.emptyText}
      height={spec.height}
      chartRef={chartRef}
      onDownload={download}
      footer={footer}
    >
      <EChart option={spec.option} height={spec.height} chartRef={chartRef} />
    </ChartCard>
  )
}

function CountLine({ status, shown, scope }: ChartsPaneProps & { shown: AvalancheStats | null }) {
  if (status.state === 'error') {
    return (
      <p role="alert" className="text-sm font-semibold text-destructive">
        Couldn’t load avalanche statistics. Try again in a minute.
      </p>
    )
  }
  if (!shown) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading avalanche statistics…
      </p>
    )
  }
  return (
    <p role="status" className="flex items-center gap-2 text-sm font-semibold">
      {statsCountLine(shown.totalAvalanches, scope)}
      {status.state === 'loading' && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
      )}
    </p>
  )
}

/** Full width, except the two donuts, which sit side by side from `sm`. */
function cellClass(id: string): string | undefined {
  return id === 'trigger' || id === 'size' ? undefined : 'sm:col-span-2'
}

function PlaceholderCards({ failed }: { failed: boolean }) {
  return PLACEHOLDERS.map((spec) => (
    <div key={spec.id} className={cellClass(spec.id)}>
      <ChartCard
        id={`chart-${spec.id}`}
        title={spec.title}
        state={failed ? 'error' : 'loading'}
        emptyText=""
        height={spec.height}
        chartRef={{ current: null }}
        onDownload={() => undefined}
      >
        {null}
      </ChartCard>
    </div>
  ))
}

export function ChartsPane(props: ChartsPaneProps) {
  const { status, dates } = props
  const narrow = useIsNarrowViewport()
  const [roseMode, setRoseMode] = useState<RoseMode>('circles')
  const shown = useShownStats(status)
  const specs = useChartSpecs(shown, narrow, roseMode)
  const stale = status.state === 'loading' && shown !== null

  return (
    <div className="flex flex-col gap-3" data-testid="observation-charts">
      <CountLine {...props} shown={shown} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {specs.length === 0 && <PlaceholderCards failed={status.state === 'error'} />}
        {specs.map((spec) => (
          <div key={spec.id} className={cellClass(spec.id)}>
            <Chart
              spec={spec}
              state={cardState(spec, status, shown)}
              stale={stale}
              dates={dates}
              footer={
                spec.id === 'aspect-elevation' ? (
                  <RoseModeSwitch mode={roseMode} onChange={setRoseMode} />
                ) : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
