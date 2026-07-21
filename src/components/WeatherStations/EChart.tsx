'use client'

import { LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'

// Thin tree-shaken ECharts wrapper: line charts + grid/tooltip/legend/dataZoom
// only, canvas renderer. Register once at module load.
echarts.use([
  LineChart,
  GridComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export type EChartOption = ComposeOption<never> & Record<string, unknown>

export function EChart({
  option,
  height = 380,
  group,
}: {
  option: EChartOption
  height?: number
  /** Charts sharing a group id zoom/pan together (echarts.connect). */
  group?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const chart = echarts.init(container)
    chartRef.current = chart
    if (group) {
      chart.group = group
      echarts.connect(group)
    }
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(container)
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [group])

  useEffect(() => {
    // notMerge so a range switch fully replaces series instead of layering.
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={containerRef} style={{ height }} className="w-full" />
}
