'use client'

/**
 * One chart's card: a heading, a PNG download, and a body that is visibly one of four things —
 * loading, failed, empty, or the chart. The widget drew only two of its charts' empty states and
 * none of their errors; here every card has both.
 */
import type { ECharts } from 'echarts/core'
import { Download } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

import type { EChartOption } from '@/components/charts/EChart'
import { saveUrl } from '@/components/charts/saveUrl'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

/**
 * The chart as a PNG with its title drawn in. Swap in the titled option, take the image, swap
 * back; both renders are synchronous because the charts' animation is off.
 */
export function downloadChartPng(
  chart: ECharts,
  options: { screen: EChartOption; titled: EChartOption; filename: string },
) {
  chart.setOption(options.titled, { notMerge: true })
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  chart.setOption(options.screen, { notMerge: true })
  saveUrl(url, options.filename)
}

export type ChartState = 'loading' | 'error' | 'empty' | 'ready'

interface ChartCardProps {
  id: string
  title: string
  state: ChartState
  /** What an empty chart says instead of itself. */
  emptyText: string
  height: number
  /** True while a newer answer is on its way and the chart shown is the last one. */
  stale?: boolean
  chartRef: RefObject<ECharts | null>
  onDownload: () => void
  /** Controls under the chart, such as the rose's circles / numbers switch. */
  footer?: ReactNode
  children: ReactNode
}

function ChartBody({
  state,
  emptyText,
  height,
  children,
}: Pick<ChartCardProps, 'state' | 'emptyText' | 'height' | 'children'>) {
  if (state === 'loading') {
    return <div className="animate-pulse rounded-md bg-muted" style={{ height }} />
  }
  if (state === 'error') {
    return (
      <p
        role="alert"
        className="flex items-center justify-center text-center text-sm text-destructive"
        style={{ height }}
      >
        Couldn’t load this chart. Try again in a minute.
      </p>
    )
  }
  if (state === 'empty') {
    return (
      <p
        role="status"
        className="flex items-center justify-center text-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {emptyText}
      </p>
    )
  }
  return <>{children}</>
}

export function ChartCard(props: ChartCardProps) {
  const { id, title, state, stale = false, onDownload, footer } = props
  return (
    <section
      aria-labelledby={id}
      aria-busy={stale || state === 'loading'}
      data-testid="observation-chart"
      data-chart-state={state}
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 id={id} className="grow text-base font-semibold">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="clear"
          className="h-8 px-2"
          title="Download as PNG image"
          aria-label={`Download ${title} chart`}
          disabled={state !== 'ready'}
          onClick={onDownload}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className={cn('p-2 transition-opacity sm:p-4', stale && 'opacity-50')}>
        <ChartBody {...props} />
        {state === 'ready' && footer}
      </div>
    </section>
  )
}
