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

/** The chart's pixel height: the legacy plot area, the angled date labels, and the zoom slider. */
export const DANGER_CHART_HEIGHT = 300

/** Headroom above the plot, and the taller value that clears a drawn-in chart title. */
const GRID_TOP = 12
const GRID_TOP_WITH_TITLE = 44
const GRID_TOP_NARROW = 34

/** Room below the plot for the angled date labels, and the extra a zoom slider needs under them. */
const GRID_BOTTOM = 56
const GRID_BOTTOM_WITH_ZOOM = 92

/**
 * Room to the left of the plot for the 0–5 ticks, and for the rotated axis name beside them. A
 * phone cannot spare the wider gutter, so there the name goes above the plot instead.
 */
const GRID_LEFT = 48
const GRID_LEFT_NARROW = 14

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

/** Headroom the plot needs: for a drawn-in title, or for the axis name when it sits flat on top. */
function gridTop({ title, narrow }: { title?: string; narrow: boolean }): number {
  if (title !== undefined) return GRID_TOP_WITH_TITLE
  return narrow ? GRID_TOP_NARROW : GRID_TOP
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

interface DangerChartOptions {
  /**
   * Draws the zone's name into the chart itself. On screen the card's heading already says it, so
   * the title is only asked for when exporting — a saved PNG travels without the card.
   */
  title?: string
  /**
   * Adds the zoom slider. A season is more days than a phone has pixels, so the whole-season view
   * that makes this chart worth reading leaves each bar about two pixels wide — too thin to read
   * or to tap. The slider narrows the window without taking the overview away, which is ECharts'
   * own answer for small screens. Off for an export, which should be the season and no chrome.
   */
  zoomable?: boolean
  /**
   * Lays the chart out for a phone: the axis name goes flat above the plot rather than rotated
   * beside it, which hands its gutter back to the bars. Never set for an export, which is rendered
   * at the card's full width whatever the reader is holding.
   */
  narrow?: boolean
}

export function buildDangerOverTimeOption(
  points: DangerOverTimePoint[],
  extent: { from: string; to: string },
  { title, zoomable = false, narrow = false }: DangerChartOptions = {},
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
    // Opens on the whole season; the reader zooms in from there rather than out.
    dataZoom: zoomable
      ? [
          // `preventDefaultMouseMove: false` is what keeps a vertical swipe scrolling the page:
          // ECharts otherwise swallows every touchmove over the plot, which traps a reader
          // mid-scroll whether or not the chart pans. Matches the station graphs otherwise.
          { type: 'inside', zoomOnMouseWheel: 'ctrl', preventDefaultMouseMove: false },
          { type: 'slider', height: 20, bottom: 8, brushSelect: false },
        ]
      : [],
    grid: {
      left: narrow ? GRID_LEFT_NARROW : GRID_LEFT,
      right: 16,
      top: gridTop({ title, narrow }),
      bottom: zoomable ? GRID_BOTTOM_WITH_ZOOM : GRID_BOTTOM,
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
      // Narrow: sat flat above the plot, where it costs height rather than the width the bars need.
      ...(narrow
        ? {
            nameLocation: 'end',
            nameRotate: 0,
            nameGap: 12,
            nameTextStyle: { fontSize: 12, align: 'left' },
            // 0-5 is one digit wide, so the ticks sit close to the axis rather than a gutter away.
            axisLabel: { margin: 4 },
          }
        : { nameLocation: 'middle', nameGap: 32, nameTextStyle: { fontSize: 14 } }),
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
