'use client'

/**
 * The archive's "Danger Over Time" tab: one card per zone, stacked, each a bar chart of the
 * zone's daily danger rating across the selected range, rebuilding the legacy widget's
 * `ArchiveVisual` (inventory row F8). A bar opens that zone-day's forecast, as the legacy bars
 * did, and the card's download control saves the chart as a PNG, as the legacy save button did.
 *
 * One deliberate divergence: the PNG is named for the zone and range rather than the legacy
 * widget's fixed `chart.png`, so a reader saving several charts can tell them apart.
 */
import type { ECElementEvent, ECharts } from 'echarts/core'
import { Download, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  archiveRowHref,
  type DangerOverTime,
  type ZoneDangerOverTime,
} from '@/services/nac/forecastArchive'

import { buildDangerOverTimeOption, DANGER_CHART_HEIGHT } from './dangerOverTimeOptions'

function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-md bg-muted" style={{ height: DANGER_CHART_HEIGHT }} />
  )
}

const EChart = dynamic(() => import('@/components/charts/EChart').then((m) => m.EChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

interface DangerOverTimeChartsProps {
  data: DangerOverTime
}

export function DangerOverTimeCharts({ data }: DangerOverTimeChartsProps) {
  return (
    <ul className="list-none space-y-4 p-0" aria-label="Danger over time by zone">
      {data.zones.map((zoneData) => (
        <li key={zoneData.zone.id}>
          <ZoneDangerCard zoneData={zoneData} extent={data.extent} />
        </li>
      ))}
    </ul>
  )
}

/** The filename a zone's chart downloads as. */
export function dangerChartFilename(
  zoneSlug: string,
  extent: { from: string; to: string },
): string {
  return `${zoneSlug}-danger-over-time-${extent.from}-to-${extent.to}.png`
}

/** Save an `<a download>` of a data URL. */
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

function ZoneDangerCard({
  zoneData,
  extent,
}: {
  zoneData: ZoneDangerOverTime
  extent: { from: string; to: string }
}) {
  const { zone, points } = zoneData
  const router = useRouter()
  const chartRef = useRef<ECharts | null>(null)
  const option = useMemo(() => buildDangerOverTimeOption(points, extent), [points, extent])

  const openForecast = (event: ECElementEvent) => {
    // A bar's category name is its `yyyy-MM-dd` day; the empty days between bars have no element
    // to click, so any click lands on a rated day.
    if (typeof event.name !== 'string') return
    router.push(archiveRowHref({ zoneSlug: zone.slug, date: event.name }))
  }

  const download = () => {
    const dataUrl = chartRef.current?.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
    if (dataUrl) downloadDataUrl(dataUrl, dangerChartFilename(zone.slug, extent))
  }

  return (
    <section
      aria-labelledby={`danger-chart-${zone.id}`}
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 id={`danger-chart-${zone.id}`} className="grow text-lg font-semibold">
          {zone.name}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Download as PNG image"
          aria-label={`Download ${zone.name} chart as PNG image`}
          onClick={download}
        >
          <Download className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      <div className="p-2 sm:p-4">
        <EChart
          option={option}
          height={DANGER_CHART_HEIGHT}
          onClick={openForecast}
          chartRef={chartRef}
        />
      </div>
    </section>
  )
}
