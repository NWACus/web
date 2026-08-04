'use client'

import { getStationGroup, MAX_COMPARE_STATIONS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import { cn } from '@/utilities/ui'
import { subHours } from 'date-fns'
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { buildChartOption } from './stationGraphOptions'
import type { GraphPreset, GraphWindow } from './stationGraphPresets'
import { DEFAULT_GRAPH_WINDOW, GRAPH_WINDOWS } from './stationGraphPresets'
import { clampNegativeValues, convertGraphData, convertPreset } from './stationGraphUnits'
import { StationOptGroups, stationSelectClass } from './StationPicker'
import type { UnitSystem } from './UnitToggle'
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

function windowRange(window: GraphWindow): { from: Date; to: Date } {
  const to = new Date(Math.floor(Date.now() / CACHE_BUCKET_MS) * CACHE_BUCKET_MS)
  return { from: subHours(to, window.hoursBack(to)), to }
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
function useGraphData(stids: string[], variables: string[], window: GraphWindow) {
  const [data, setData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { from, to } = windowRange(window)
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
  }, [stids, variables, window])

  return { data, error, loading }
}

function WindowPicker({
  active,
  onChange,
}: {
  active: GraphWindow
  onChange: (window: GraphWindow) => void
}) {
  return (
    <div className="flex gap-1">
      {GRAPH_WINDOWS.map((w) => (
        <button
          key={w.key}
          type="button"
          onClick={() => onChange(w)}
          aria-pressed={w === active}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            w === active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
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

const chipClass = 'inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm'

function CompareStationPicker({
  currentSlug,
  compareSlugs,
  onAdd,
}: {
  currentSlug: string
  compareSlugs: string[]
  onAdd: (slug: string) => void
}) {
  const atCap = compareSlugs.length >= MAX_COMPARE_STATIONS
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Compare with</span>
      <select
        value=""
        disabled={atCap}
        onChange={(event) => {
          if (event.target.value) onAdd(event.target.value)
        }}
        className={cn(stationSelectClass, 'px-3 py-1.5 disabled:opacity-50')}
      >
        <option value="">
          {atCap ? `Up to ${MAX_COMPARE_STATIONS} stations` : 'Add a station…'}
        </option>
        <StationOptGroups excludeSlugs={[currentSlug, ...compareSlugs]} />
      </select>
    </label>
  )
}

function CompareChips({
  compareSlugs,
  onRemove,
}: {
  compareSlugs: string[]
  onRemove: (slug: string) => void
}) {
  const selected = compareSlugs.flatMap((slug) => getStationGroup(slug) ?? [])

  return selected.map((group) => (
    <span key={group.slug} className={chipClass}>
      {group.displayName}
      <button
        type="button"
        aria-label={`Remove ${group.displayName}`}
        onClick={() => onRemove(group.slug)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  ))
}

function ChartControls({
  title,
  canUp,
  canDown,
  onMove,
  onHide,
}: {
  title: string
  canUp: boolean
  canDown: boolean
  onMove: (direction: -1 | 1) => void
  onHide: () => void
}) {
  const buttonClass =
    'rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground'
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        aria-label={`Move ${title} up`}
        disabled={!canUp}
        onClick={() => onMove(-1)}
        className={buttonClass}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Move ${title} down`}
        disabled={!canDown}
        onClick={() => onMove(1)}
        className={buttonClass}
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button type="button" aria-label={`Hide ${title}`} onClick={onHide} className={buttonClass}>
        <EyeOff className="h-4 w-4" />
      </button>
    </div>
  )
}

function HiddenChartChips({
  presets,
  onShow,
}: {
  presets: GraphPreset[]
  onShow: (key: string) => void
}) {
  if (presets.length === 0) return null
  return (
    <>
      <span className="text-sm text-muted-foreground">Hidden:</span>
      {presets.map((preset) => (
        <button
          key={preset.key}
          type="button"
          aria-label={`Show ${preset.title}`}
          onClick={() => onShow(preset.key)}
          className={cn(chipClass, 'text-muted-foreground hover:text-foreground')}
        >
          {preset.title}
          <Eye className="h-3.5 w-3.5" />
        </button>
      ))}
    </>
  )
}

function PresetChart({
  preset,
  data,
  primaryStids,
  unitSystem,
  controls,
}: {
  preset: GraphPreset
  data: GraphData
  primaryStids: string[]
  unitSystem: UnitSystem
  controls: ReactNode
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
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">{controls}</div>
      <EChart option={option} group="station-graphs" />
    </div>
  )
}

function GraphsChipRow({
  compareSlugs,
  onCompareChange,
  hiddenPresets,
  onShow,
}: {
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
  hiddenPresets: GraphPreset[]
  onShow: (key: string) => void
}) {
  if (compareSlugs.length === 0 && hiddenPresets.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CompareChips
        compareSlugs={compareSlugs}
        onRemove={(slug) => onCompareChange(compareSlugs.filter((s) => s !== slug))}
      />
      <HiddenChartChips presets={hiddenPresets} onShow={onShow} />
    </div>
  )
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
    return <p className="text-muted-foreground">No data reported for this window.</p>
  }
  return (
    <ChartFrame loading={loading}>
      <div className="flex flex-col gap-6">
        {arrangement.visiblePresets.map((preset) => (
          <PresetChart
            key={preset.key}
            preset={preset}
            data={data}
            primaryStids={primaryStids}
            unitSystem={unitSystem}
            controls={
              <ChartControls
                title={preset.title}
                canUp={arrangement.canMove(preset.key, -1)}
                canDown={arrangement.canMove(preset.key, 1)}
                onMove={(direction) => arrangement.moveChart(preset.key, direction)}
                onHide={() => arrangement.hideChart(preset.key)}
              />
            }
          />
        ))}
      </div>
    </ChartFrame>
  )
}

function GraphsToolbar({
  graphWindow,
  onWindowChange,
  unitSystem,
  onUnitChange,
  currentSlug,
  compareSlugs,
  onCompareChange,
  arrangement,
}: {
  graphWindow: GraphWindow
  onWindowChange: (window: GraphWindow) => void
  unitSystem: UnitSystem
  onUnitChange: (system: UnitSystem) => void
  currentSlug: string
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
  arrangement: ReturnType<typeof useChartArrangement>
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WindowPicker active={graphWindow} onChange={onWindowChange} />
        <CompareStationPicker
          currentSlug={currentSlug}
          compareSlugs={compareSlugs}
          onAdd={(slug) => onCompareChange([...compareSlugs, slug])}
        />
        <UnitToggle unit={unitSystem} onChange={onUnitChange} />
      </div>
      <GraphsChipRow
        compareSlugs={compareSlugs}
        onCompareChange={onCompareChange}
        hiddenPresets={arrangement.hiddenPresets}
        onShow={arrangement.showChart}
      />
    </div>
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
}: {
  stids: string[]
  presets: GraphPreset[]
  currentSlug: string
}) {
  const [graphWindow, setGraphWindow] = useState(DEFAULT_GRAPH_WINDOW)
  const [compareSlugs, setCompareSlugs] = useState<string[]>([])
  const [unitSystem, changeUnitSystem] = useUnitSystem()

  const allStids = useMemo(() => combinedStids(stids, compareSlugs), [stids, compareSlugs])
  const variables = useMemo(
    () => Array.from(new Set(presets.flatMap((p) => p.variables))),
    [presets],
  )

  const { data, error, loading } = useGraphData(allStids, variables, graphWindow)

  const emptyKeys = useMemo(() => emptyPresetKeys(data, presets), [data, presets])

  const arrangement = useChartArrangement(presets, emptyKeys)

  if (presets.length === 0) {
    return <p className="text-muted-foreground">This station has no graphable sensors.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <GraphsToolbar
        graphWindow={graphWindow}
        onWindowChange={setGraphWindow}
        unitSystem={unitSystem}
        onUnitChange={changeUnitSystem}
        currentSlug={currentSlug}
        compareSlugs={compareSlugs}
        onCompareChange={setCompareSlugs}
        arrangement={arrangement}
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
