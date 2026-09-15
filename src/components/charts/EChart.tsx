'use client'

import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import type { ComposeOption, ECElementEvent } from 'echarts/core'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef, type RefObject } from 'react'

// Tree-shaken ECharts: only what the site's charts use.
echarts.use([
  LineChart,
  BarChart,
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
  onClick,
  chartRef,
}: {
  option: EChartOption
  height?: number
  /** Charts sharing a group id zoom/pan together (echarts.connect). */
  group?: string
  /** Called with the ECharts event when a rendered element (a bar, a point) is clicked. */
  onClick?: (event: ECElementEvent) => void
  /** Receives the live instance, for callers that need it directly (an image export). */
  chartRef?: RefObject<echarts.ECharts | null>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)
  // Read through a ref so a new handler doesn't re-create the chart.
  const onClickRef = useRef(onClick)
  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const chart = echarts.init(container)
    instanceRef.current = chart
    if (chartRef) chartRef.current = chart
    if (group) {
      chart.group = group
      echarts.connect(group)
    }
    chart.on('click', (event) => onClickRef.current?.(event))
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(container)

    const gateWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) event.stopPropagation()
    }
    container.addEventListener('wheel', gateWheel, { capture: true, passive: true })

    return () => {
      container.removeEventListener('wheel', gateWheel, { capture: true })
      observer.disconnect()
      chart.dispose()
      instanceRef.current = null
      if (chartRef) chartRef.current = null
    }
  }, [group, chartRef])

  useEffect(() => {
    // notMerge so a range switch fully replaces series instead of layering.
    instanceRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={containerRef} style={{ height }} className="w-full" />
}
