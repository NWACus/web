'use client'

import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import { cn } from '@/utilities/ui'
import { subHours } from 'date-fns'
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { buildChartOption } from './stationGraphOptions'
import type { GraphPreset } from './stationGraphPresets'
import { GRAPH_WINDOWS, seasonHours } from './stationGraphPresets'
import { StationOptGroups } from './StationPicker'
import { useChartArrangement } from './useChartArrangement'

// ECharts only loads when the Graphs tab actually renders.
const EChart = dynamic(() => import('./EChart').then((m) => m.EChart), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-md bg-muted" />,
})

function windowRange(key: string): { from: Date; to: Date } {
  const to = new Date()
  const window = GRAPH_WINDOWS.find((w) => w.key === key) ?? GRAPH_WINDOWS[1]
  const hours = window.key === 'season' ? seasonHours(to) : window.hours
  return { from: subHours(to, hours), to }
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

function WindowPicker({ active, onChange }: { active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1">
      {GRAPH_WINDOWS.map((w) => (
        <button
          key={w.key}
          type="button"
          onClick={() => onChange(w.key)}
          aria-pressed={w.key === active}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            w.key === active
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

// Fetches graph-data for one preset; re-fetches on window change, aborts stale
// requests. `loading` stays true through refetches so the UI can signal them.
function useGraphData(preset: GraphPreset, stids: string[], windowKey: string) {
  const [data, setData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { from, to } = windowRange(windowKey)
    const controller = new AbortController()
    setError(null)
    setLoading(true)
    fetch(graphDataUrl(stids, preset.variables, from, to), { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setData)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'failed')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [preset, stids, windowKey])

  return { data, error, loading }
}

// Dims the current chart and overlays a spinner while a refetch is in flight.
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

// Everything a chart renders before it's ready: error notice, hidden (absent
// sensor — most stations report a subset of the preset list), or skeleton.
const isEmpty = (data: GraphData | null) => data !== null && data.series.length === 0

function preChartState(
  title: string,
  error: string | null,
  data: GraphData | null,
  option: object | null,
): ReactNode | 'ready' {
  if (error) {
    return <p className="text-sm text-muted-foreground">{`Couldn't load ${title}: ${error}`}</p>
  }
  if (isEmpty(data)) return null
  if (!option) return <div className="h-80 animate-pulse rounded-md bg-muted" />
  return 'ready'
}

// Keeps every chart legible and total stids within the graph-data route's cap.
const MAX_COMPARE_STATIONS = 3

// Adds another station to overlay on every chart. Region-grouped like the
// StationPicker; the page's own station and already-selected stations are
// excluded.
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
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">
          {atCap ? `Up to ${MAX_COMPARE_STATIONS} stations` : 'Add a station…'}
        </option>
        <StationOptGroups excludeSlugs={[currentSlug, ...compareSlugs]} />
      </select>
    </label>
  )
}

// The selected comparison stations as removable chips.
function CompareChips({
  compareSlugs,
  onRemove,
}: {
  compareSlugs: string[]
  onRemove: (slug: string) => void
}) {
  const selected = compareSlugs.flatMap((slug) => {
    const group = NWAC_WEATHER_STATION_GROUPS.find((g) => g.slug === slug)
    return group ? [group] : []
  })

  return selected.map((group) => (
    <span
      key={group.slug}
      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
    >
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

// Move/hide controls for one rendered chart, top-right above the canvas.
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
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Move ${title} down`}
        disabled={!canDown}
        onClick={() => onMove(1)}
        className={buttonClass}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button type="button" aria-label={`Hide ${title}`} onClick={onHide} className={buttonClass}>
        <EyeOff className="h-4 w-4" />
      </button>
    </div>
  )
}

// Hidden charts as chips that restore on click.
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
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          {preset.title}
        </button>
      ))}
    </>
  )
}

function PresetChart({
  preset,
  stids,
  primaryStids,
  windowKey,
  controls,
  onEmptyChange,
}: {
  preset: GraphPreset
  stids: string[]
  primaryStids: string[]
  windowKey: string
  controls: ReactNode
  onEmptyChange: (key: string, empty: boolean) => void
}) {
  const { data, error, loading } = useGraphData(preset, stids, windowKey)
  const option = useMemo(
    () => (data ? buildChartOption(data, preset, primaryStids) : null),
    [data, preset, primaryStids],
  )

  // Report no-data charts so move up/down skips over them.
  useEffect(() => {
    onEmptyChange(preset.key, isEmpty(data))
    return () => onEmptyChange(preset.key, false)
  }, [data, preset.key, onEmptyChange])

  const state = preChartState(preset.title, error, data, option)
  if (state !== 'ready') return state
  if (!option) return null // unreachable: preChartState returns the skeleton
  return (
    // Controls overlay the canvas's top-right, level with the ECharts title.
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">{controls}</div>
      <ChartFrame loading={loading}>
        <EChart option={option} group="station-graphs" />
      </ChartFrame>
    </div>
  )
}

// Window picker, compare-station picker, and the chip row (comparison stations
// + hidden charts) above the charts.
function GraphsToolbar({
  windowKey,
  onWindowChange,
  currentSlug,
  compareSlugs,
  onCompareChange,
  hiddenPresets,
  onShowChart,
}: {
  windowKey: string
  onWindowChange: (key: string) => void
  currentSlug: string
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
  hiddenPresets: GraphPreset[]
  onShowChart: (key: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WindowPicker active={windowKey} onChange={onWindowChange} />
        <CompareStationPicker
          currentSlug={currentSlug}
          compareSlugs={compareSlugs}
          onAdd={(slug) => onCompareChange([...compareSlugs, slug])}
        />
      </div>
      {(compareSlugs.length > 0 || hiddenPresets.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <CompareChips
            compareSlugs={compareSlugs}
            onRemove={(slug) => onCompareChange(compareSlugs.filter((s) => s !== slug))}
          />
          <HiddenChartChips presets={hiddenPresets} onShow={onShowChart} />
        </div>
      )}
    </div>
  )
}

// The station page's Graphs tab: fixed preset charts for this station group,
// with a shared time-window picker and optional comparison stations whose
// series overlay every chart as dashed lines. The v2 self-serve builder renders
// the same charts from a user-built config instead of presets.
export function StationGraphs({
  stids,
  presets,
  currentSlug,
}: {
  stids: string[]
  presets: GraphPreset[]
  currentSlug: string
}) {
  const [windowKey, setWindowKey] = useState('7d')
  const [compareSlugs, setCompareSlugs] = useState<string[]>([])
  const arrangement = useChartArrangement(presets)

  // Base stids plus each comparison group's, deduped in selection order.
  const allStids = useMemo(() => {
    const combined = [...stids]
    for (const slug of compareSlugs) {
      const group = NWAC_WEATHER_STATION_GROUPS.find((g) => g.slug === slug)
      for (const stid of group?.stids ?? []) {
        if (!combined.includes(stid)) combined.push(stid)
      }
    }
    return combined
  }, [stids, compareSlugs])

  if (presets.length === 0) {
    return <p className="text-muted-foreground">This station has no graphable sensors.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <GraphsToolbar
        windowKey={windowKey}
        onWindowChange={setWindowKey}
        currentSlug={currentSlug}
        compareSlugs={compareSlugs}
        onCompareChange={setCompareSlugs}
        hiddenPresets={arrangement.hiddenPresets}
        onShowChart={arrangement.showChart}
      />
      {arrangement.visiblePresets.map((preset) => (
        <PresetChart
          key={preset.key}
          preset={preset}
          stids={allStids}
          primaryStids={stids}
          windowKey={windowKey}
          onEmptyChange={arrangement.onEmptyChange}
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
  )
}
