/**
 * The ECharts option for one zone's danger-over-time chart, reproducing the legacy widget's
 * Vega-Lite spec (`vega_danger_time.json`): a bar per rated day, coloured by the danger scale, on
 * a 0–5 axis titled "Danger Rating", with a "Apr 5 - Moderate" tooltip. Pure, so it is
 * unit-testable without a canvas.
 */
import { eachDayOfInterval, format, parseISO } from 'date-fns'

import type { EChartOption } from '@/components/charts/EChart'
import { dangerColor, dangerLevelFromRating, dangerName } from '@/services/nac/dangerScale'
import type { DangerOverTimePoint } from '@/services/nac/forecastArchive'

/** The chart's pixel height: the legacy plot area plus room for the angled date labels. */
export const DANGER_CHART_HEIGHT = 260

/** Headroom above the plot, and the taller value that clears a drawn-in chart title. */
const GRID_TOP = 12
const GRID_TOP_WITH_TITLE = 44

/**
 * Every `yyyy-MM-dd` day of the extent, inclusive. The x-axis is these days as categories rather
 * than a time axis, so a bar is always one day wide and a day without a rating is a gap, however
 * sparse the data.
 */
export function chartDays(extent: { from: string; to: string }): string[] {
  return eachDayOfInterval({ start: parseISO(extent.from), end: parseISO(extent.to) }).map((day) =>
    format(day, 'yyyy-MM-dd'),
  )
}

/** "Apr 5 - Moderate", the legacy chart's tooltip. */
export function dangerTooltip(date: string, dangerLevel: number): string {
  return `${format(parseISO(date), 'MMM d')} - ${dangerName(dangerLevelFromRating(dangerLevel))}`
}

/** A bar's data item: its level, coloured by the danger scale. */
function barItem(dangerLevel: number) {
  return {
    value: dangerLevel,
    itemStyle: { color: dangerColor(dangerLevelFromRating(dangerLevel)) },
  }
}

function isDataItem(value: unknown): value is { name?: unknown; value?: unknown } {
  return typeof value === 'object' && value !== null
}

/**
 * `title` draws the zone's name into the chart itself. On screen the card's heading already says
 * it, so the title is only asked for when exporting — a saved PNG travels without the card.
 */
export function buildDangerOverTimeOption(
  points: DangerOverTimePoint[],
  extent: { from: string; to: string },
  title?: string,
): EChartOption {
  const levelByDate = new Map(points.map((point) => [point.date, point.dangerLevel]))
  const days = chartDays(extent)

  return {
    // No grow-in: the legacy chart drew at once, and the export should too.
    animation: false,
    title: {
      show: title !== undefined,
      text: title ?? '',
      left: 'center',
      top: GRID_TOP,
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    grid: {
      left: 48,
      right: 16,
      top: title === undefined ? GRID_TOP : GRID_TOP_WITH_TITLE,
      bottom: 56,
    },
    tooltip: {
      trigger: 'item',
      // ECharts hard-codes z-index:9999999 on its tooltip div, which floats it over the site
      // header and dialogs. extraCssText lands after that default.
      extraCssText: 'z-index: 10;',
      formatter: (params: unknown) =>
        isDataItem(params) && typeof params.name === 'string' && typeof params.value === 'number'
          ? dangerTooltip(params.name, params.value)
          : '',
    },
    xAxis: {
      type: 'category',
      data: days,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        rotate: 60,
        fontSize: 12,
        hideOverlap: true,
        formatter: (day: string) => format(parseISO(day), 'M/d'),
      },
    },
    yAxis: {
      type: 'value',
      name: 'Danger Rating',
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: { fontSize: 14 },
      min: 0,
      max: 5,
      interval: 1,
    },
    series: [
      {
        type: 'bar',
        // The legacy chart's 10% band padding.
        barCategoryGap: '10%',
        cursor: 'pointer',
        emphasis: { itemStyle: { opacity: 0.5 } },
        data: days.map((day) => {
          const level = levelByDate.get(day)
          return level === undefined ? null : barItem(level)
        }),
      },
    ],
  }
}
