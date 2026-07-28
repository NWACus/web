'use client'

import { NWAC_STATION_REGIONS, NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import { cn } from '@/utilities/ui'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { buildChartOption } from './stationGraphOptions'
import type { GraphPreset } from './stationGraphPresets'
import { GRAPH_WINDOWS, seasonHours } from './stationGraphPresets'

// ECharts only loads when the Graphs tab actually renders.
const EChart = dynamic(() => import('./EChart').then((m) => m.EChart), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-md bg-muted" />,
})

function windowRange(key: string): { from: Date; to: Date } {
  const to = new Date()
  const window = GRAPH_WINDOWS.find((w) => w.key === key) ?? GRAPH_WINDOWS[1]
  const hours = window.key === 'season' ? seasonHours(to) : window.hours
  return { from: new Date(to.getTime() - hours * 60 * 60 * 1000), to }
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

// Overlays another station's series on every chart. Region-grouped like the
// StationPicker; the page's own station is excluded.
function CompareStationPicker({
  currentSlug,
  compareSlug,
  onChange,
}: {
  currentSlug: string
  compareSlug: string
  onChange: (slug: string) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Compare with</span>
      <select
        value={compareSlug}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">None</option>
        {NWAC_STATION_REGIONS.map((region) => {
          const groups = NWAC_WEATHER_STATION_GROUPS.filter(
            (group) => group.region === region && group.slug !== currentSlug,
          )
          if (groups.length === 0) return null
          return (
            <optgroup key={region} label={region}>
              {groups.map((group) => (
                <option key={group.slug} value={group.slug}>
                  {group.displayName}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
    </label>
  )
}

function PresetChart({
  preset,
  stids,
  primaryStids,
  windowKey,
}: {
  preset: GraphPreset
  stids: string[]
  primaryStids: string[]
  windowKey: string
}) {
  const { data, error, loading } = useGraphData(preset, stids, windowKey)
  const option = useMemo(
    () => (data ? buildChartOption(data, preset, primaryStids) : null),
    [data, preset, primaryStids],
  )

  const state = preChartState(preset.title, error, data, option)
  if (state !== 'ready') return state
  if (!option) return null // unreachable: preChartState returns the skeleton
  return (
    <ChartFrame loading={loading}>
      <EChart option={option} group="station-graphs" />
    </ChartFrame>
  )
}

// The station page's Graphs tab: fixed preset charts for this station group,
// with a shared time-window picker and an optional comparison station whose
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
  const [compareSlug, setCompareSlug] = useState('')

  // The comparison group's stids, minus any the page's own group already plots.
  const allStids = useMemo(() => {
    const compareGroup = NWAC_WEATHER_STATION_GROUPS.find((g) => g.slug === compareSlug)
    if (!compareGroup) return stids
    return [...stids, ...compareGroup.stids.filter((stid) => !stids.includes(stid))]
  }, [stids, compareSlug])

  if (presets.length === 0) {
    return <p className="text-muted-foreground">This station has no graphable sensors.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WindowPicker active={windowKey} onChange={setWindowKey} />
        <CompareStationPicker
          currentSlug={currentSlug}
          compareSlug={compareSlug}
          onChange={setCompareSlug}
        />
      </div>
      {presets.map((preset) => (
        <PresetChart
          key={preset.key}
          preset={preset}
          stids={allStids}
          primaryStids={stids}
          windowKey={windowKey}
        />
      ))}
    </div>
  )
}
