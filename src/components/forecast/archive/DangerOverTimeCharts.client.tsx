'use client'

/**
 * The archive's "Danger Over Time" tab: one card per zone, stacked, each a bar chart of the
 * zone's daily danger rating across the selected range, rebuilding the legacy widget's
 * `ArchiveVisual` (inventory row F8). A bar opens that zone-day's forecast, as the legacy bars
 * did, and the card's download menu saves the chart, as the legacy save button did.
 *
 * Two deliberate divergences. The legacy button wrote a fixed `chart.png`; here the menu offers
 * the chart as a PNG or its days as a CSV, each named for the zone and range so a reader saving
 * several can tell them apart. And the PNG carries the zone's name drawn into the image, which
 * the card's heading supplies on screen but a saved file would otherwise travel without.
 */
import type { ECElementEvent, ECharts } from 'echarts/core'
import { ChevronDown, Download, FileSpreadsheet, ImageIcon, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, type RefObject } from 'react'

import type { EChartOption } from '@/components/charts/EChart'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  archiveRowHref,
  type DangerOverTime,
  type ZoneDangerOverTime,
} from '@/services/nac/forecastArchive'

import { dangerCsv, dangerExportFilename } from './dangerOverTimeExport'
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

/** Save a URL as `filename`. */
function saveUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  // Firefox only follows a click on an anchor that is in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()
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
  const option = useMemo(
    () => buildDangerOverTimeOption(points, extent, { zoomable: true }),
    [points, extent],
  )

  const openForecast = (event: ECElementEvent) => {
    // A bar's category name is its `yyyy-MM-dd` day; the empty days between bars have no element
    // to click, so any click lands on a rated day.
    if (typeof event.name !== 'string') return
    router.push(archiveRowHref({ zoneSlug: zone.slug, date: event.name }))
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
        <ZoneExportMenu
          zoneData={zoneData}
          extent={extent}
          screenOption={option}
          chartRef={chartRef}
        />
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

/** The card's download control: the chart as an image, or the days behind it as data. */
function ZoneExportMenu({
  zoneData,
  extent,
  screenOption,
  chartRef,
}: {
  zoneData: ZoneDangerOverTime
  extent: { from: string; to: string }
  /** The option the chart is showing, to restore after the titled one has been rendered. */
  screenOption: EChartOption
  chartRef: RefObject<ECharts | null>
}) {
  const { zone, points } = zoneData

  const downloadPng = () => {
    const chart = chartRef.current
    if (!chart) return

    // Swap in the titled option, take the image, swap back. Both renders are synchronous because
    // the chart's animation is off, so the reader never sees the title appear on screen.
    chart.setOption(buildDangerOverTimeOption(points, extent, { title: zone.name }), {
      notMerge: true,
    })
    const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
    chart.setOption(screenOption, { notMerge: true })

    saveUrl(dataUrl, dangerExportFilename(zone.slug, extent, 'png'))
  }

  const downloadCsv = () => {
    const url = URL.createObjectURL(
      new Blob([dangerCsv(points, extent)], { type: 'text/csv;charset=utf-8' }),
    )
    saveUrl(url, dangerExportFilename(zone.slug, extent, 'csv'))
    // Revoking in the same tick can cancel the save.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="clear"
          // Quiet enough to sit beside the zone's name rather than compete with it.
          className="group h-8 gap-1 px-2"
          title="Download"
          aria-label={`Download ${zone.name} chart`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {/* The caret is what says "menu" rather than "saves a file on click". */}
          <ChevronDown
            className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={downloadPng}>
          <ImageIcon aria-hidden="true" />
          PNG image
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadCsv}>
          <FileSpreadsheet aria-hidden="true" />
          CSV data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
