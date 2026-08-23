'use client'

import { getStationGroup } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { cn } from '@/utilities/ui'
import { subHours } from 'date-fns'
import { Loader2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { EditViewProps } from './EditViewDialog'
import { CompareChips, CompareSelect, EditViewDialog, PeriodSelect } from './EditViewDialog'
import { buildChartOption } from './stationGraphOptions'
import type { GraphPreset } from './stationGraphPresets'
import { clampNegativeValues, convertGraphData, convertPreset } from './stationGraphUnits'
import type { StationPeriod } from './stationPeriods'
import { DEFAULT_GRAPH_PERIOD } from './stationPeriods'
import { StationViewBar } from './StationViewBar'
import { UnitToggle, useUnitSystem } from './UnitToggle'
import { useChartArrangement } from './useChartArrangement'

function ChartSkeleton() {
  return <div className="h-80 animate-pulse rounded-md bg-muted" />
}

const EChart = dynamic(() => import('./EChart').then((m) => m.EChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

// "Now" is bucketed so request URLs stay stable across charts and users —
// a fresh Date per request would defeat the route's CDN caching.
const CACHE_BUCKET_MS = 5 * 60 * 1000

function periodRange(period: StationPeriod): { from: Date; to: Date } {
  const to = new Date(Math.floor(Date.now() / CACHE_BUCKET_MS) * CACHE_BUCKET_MS)
  return { from: subHours(to, period.hoursBack(to)), to }
}

function graphDataUrl(stids: string[], variables: string[], from: Date, to: Date): string {
  const params = new URLSearchParams({
    stids: stids.join(','),
    vars: variables.join(','),
    from: from.toISOString(),
    to: to.toISOString(),
  })
  return `/weather/graph-data?${params.toString()}`
}

// One fetch serves every chart: the union of all preset variables for all
// selected stations.
function useGraphData(stids: string[], variables: string[], period: StationPeriod) {
  const [data, setData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { from, to } = periodRange(period)
    const controller = new AbortController()
    setError(null)
    setLoading(true)
    fetch(graphDataUrl(stids, variables, from, to), { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setData)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'failed')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [stids, variables, period])

  return { data, error, loading }
}

function ChartFrame({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <div className="relative" aria-busy={loading}>
      <div className={cn('transition-opacity', loading && 'opacity-40')}>{children}</div>
      {loading && (
        <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}

function PresetChart({
  preset,
  data,
  primaryStids,
  unitSystem,
}: {
  preset: GraphPreset
  data: GraphData
  primaryStids: string[]
  unitSystem: UnitSystem
}) {
  const presetData = useMemo(() => {
    const filtered = {
      ...data,
      series: data.series.filter((s) => preset.variables.includes(s.variable)),
    }
    const clamped = preset.allowNegative ? filtered : clampNegativeValues(filtered)
    return convertGraphData(clamped, unitSystem)
  }, [data, preset, unitSystem])
  const option = useMemo(
    () => buildChartOption(presetData, convertPreset(preset, unitSystem), primaryStids),
    [presetData, preset, unitSystem, primaryStids],
  )
  return <EChart option={option} group="station-graphs" />
}

function emptyPresetKeys(data: GraphData | null, presets: GraphPreset[]): Set<string> {
  if (!data) return new Set()
  const reported = new Set(data.series.map((s) => s.variable))
  return new Set(presets.filter((p) => !p.variables.some((v) => reported.has(v))).map((p) => p.key))
}

function GraphsCharts({
  presets,
  primaryStids,
  arrangement,
  data,
  error,
  loading,
  unitSystem,
}: {
  presets: GraphPreset[]
  primaryStids: string[]
  arrangement: ReturnType<typeof useChartArrangement>
  data: GraphData | null
  error: string | null
  loading: boolean
  unitSystem: UnitSystem
}) {
  if (error) {
    return <p className="text-sm text-muted-foreground">{`Couldn't load station data: ${error}`}</p>
  }
  if (!data) {
    return presets.map((preset) => <ChartSkeleton key={preset.key} />)
  }
  if (data.series.length === 0) {
    return <p className="text-muted-foreground">No data reported for this period.</p>
  }
  return (
    <ChartFrame loading={loading}>
      <div className="flex flex-col gap-6">
        {arrangement.visiblePresets.map((preset) => (
          <div key={preset.key} className="relative">
            <button
              type="button"
              aria-label={`Hide ${preset.title} graph`}
              title={`Hide ${preset.title}`}
              onClick={() => arrangement.hideChart(preset.key)}
              className="absolute right-0 top-0 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <PresetChart
              preset={preset}
              data={data}
              primaryStids={primaryStids}
              unitSystem={unitSystem}
            />
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}

// On small screens the toolbar collapses to the Edit graphs button (plus any
// compare chips); the dialog then hosts the period/units/compare controls.
function GraphsToolbar(props: EditViewProps & { tabs?: ReactNode }) {
  const { compareSlugs, onCompareChange } = props
  return (
    <StationViewBar>
      {props.tabs}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="hidden sm:contents">
          <CompareSelect
            currentSlug={props.currentSlug}
            compareSlugs={compareSlugs}
            onCompareChange={onCompareChange}
          />
        </div>
        {compareSlugs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <CompareChips
              compareSlugs={compareSlugs}
              onRemove={(slug) => onCompareChange(compareSlugs.filter((s) => s !== slug))}
            />
          </div>
        )}
        <div className="hidden sm:contents">
          <PeriodSelect
            active={props.graphPeriod}
            onChange={props.onPeriodChange}
            className="sm:ml-auto"
          />
          <UnitToggle unit={props.unitSystem} onChange={props.onUnitChange} />
        </div>
        <EditViewDialog {...props} />
      </div>
    </StationViewBar>
  )
}

// The page's stids plus each comparison group's, deduped in selection order.
function combinedStids(stids: string[], compareSlugs: string[]): string[] {
  const combined = [...stids]
  for (const slug of compareSlugs) {
    for (const stid of getStationGroup(slug)?.stids ?? []) {
      if (!combined.includes(stid)) combined.push(stid)
    }
  }
  return combined
}

export function StationGraphs({
  stids,
  presets,
  currentSlug,
  tabs,
}: {
  stids: string[]
  presets: GraphPreset[]
  currentSlug: string
  tabs?: ReactNode
}) {
  const [graphPeriod, setStationPeriod] = useState(DEFAULT_GRAPH_PERIOD)
  const [compareSlugs, setCompareSlugs] = useState<string[]>([])
  const [unitSystem, changeUnitSystem] = useUnitSystem()

  const allStids = useMemo(() => combinedStids(stids, compareSlugs), [stids, compareSlugs])
  const variables = useMemo(
    () => Array.from(new Set(presets.flatMap((p) => p.variables))),
    [presets],
  )

  const { data, error, loading } = useGraphData(allStids, variables, graphPeriod)

  const emptyKeys = useMemo(() => emptyPresetKeys(data, presets), [data, presets])

  const arrangement = useChartArrangement(presets, emptyKeys)

  if (presets.length === 0) {
    return <p className="text-muted-foreground">This station has no graphable sensors.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <GraphsToolbar
        tabs={tabs}
        graphPeriod={graphPeriod}
        onPeriodChange={setStationPeriod}
        unitSystem={unitSystem}
        onUnitChange={changeUnitSystem}
        currentSlug={currentSlug}
        compareSlugs={compareSlugs}
        onCompareChange={setCompareSlugs}
        arrangement={arrangement}
        emptyKeys={emptyKeys}
      />
      <GraphsCharts
        presets={presets}
        primaryStids={stids}
        arrangement={arrangement}
        data={data}
        error={error}
        loading={loading}
        unitSystem={unitSystem}
      />
    </div>
  )
}
