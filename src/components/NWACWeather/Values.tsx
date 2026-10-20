/** How one Mountain Weather value draws in a table cell. */
import { ArrowUp, Moon, Snowflake, Sun, TrendingDown, TrendingUp } from 'lucide-react'

import type { NWACWeatherTempCell, NWACWeatherWindCell } from '@/services/nac/model/nwacWeather'
import {
  DASH,
  fmtWind,
  windBearing,
  windRange,
  windWording,
  type LevelTrend,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

/** A snow level's light blue, on its pill or its table cell. */
export const SNOW_LEVEL_FILL = 'bg-sky-100 text-sky-950'

/** Any snow in bold, so the few periods with some stand out from the muted zeros. */
export function SnowValue({ text, some }: { text: string; some: boolean }) {
  return (
    <span className={cn('tabular-nums', some ? 'font-semibold' : 'text-muted-foreground')}>
      {text}
    </span>
  )
}

export function TempValue({ cell }: { cell: NWACWeatherTempCell | undefined }) {
  if (cell?.high == null || cell?.low == null) {
    return <span className="text-muted-foreground">{DASH}</span>
  }
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className="font-semibold">{cell.high}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="font-semibold">{cell.low}</span>
    </span>
  )
}

/** A level's trend from the block before, as an icon; empty when unchanged or the first. */
function LevelTrendIcon({ trend }: { trend: LevelTrend }) {
  if (trend === null) return null
  const Icon = trend === 'up' ? TrendingUp : TrendingDown
  return <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
}

/** What a sighted reader takes from the icons, for a screen reader. */
function levelSpokenAs(snow: boolean, trend: LevelTrend) {
  const kind = snow ? ' snow level' : ' freezing level'
  if (trend === null) return kind
  return `${kind}, ${trend === 'up' ? 'rising' : 'falling'}`
}

/**
 * A block's snow or freezing level: a snow level on light blue with a snowflake, a freezing level
 * (a dry block) plain, and a trending arrow for the change from the block before. Fixed slots
 * (snowflake, number, arrow) line the numbers up down a column whether or not a cell has the icons.
 */
export function SnowLevelValue({
  level,
  snow,
  trend,
  pill = true,
}: {
  level: number | null
  snow: boolean
  trend: LevelTrend
  /** Off where the table fills the cell itself (`SNOW_LEVEL_FILL`). */
  pill?: boolean
}) {
  if (level == null) return <span className="block text-center text-muted-foreground">{DASH}</span>
  return (
    <span
      className={cn(
        'flex justify-center whitespace-nowrap rounded px-1 py-1 font-semibold tabular-nums',
        snow && pill && SNOW_LEVEL_FILL,
      )}
    >
      <span className="grid grid-cols-[0.875rem_3.25rem_1rem] items-center gap-1.5">
        <span>{snow && <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />}</span>
        <span className="text-right">
          {level.toLocaleString('en-US')}&apos;
          <span className="sr-only">{levelSpokenAs(snow, trend)}</span>
        </span>
        <span>
          <LevelTrendIcon trend={trend} />
        </span>
      </span>
    </span>
  )
}

/** What the snow and freezing level cells mean, over the table. */
export function SnowLevelLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5', SNOW_LEVEL_FILL)}>
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        Snow level
      </span>
      <span>Freezing level (dry)</span>
      <span className="inline-flex items-center gap-1">
        <TrendingUp aria-hidden="true" className="size-4" />
        <TrendingDown aria-hidden="true" className="size-4" />
        Higher or lower than the previous period
      </span>
    </p>
  )
}

/** How to read the temperature cells, over the table. */
export function TempLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">44</span> /{' '}
      <span className="font-semibold text-foreground">35</span> is the high / low
    </p>
  )
}

/** How to read the wind cells, over the table. */
export function WindLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <ArrowUp aria-hidden="true" className="size-4 text-primary" />
        Points to where the wind comes from
      </span>
      <span>VAR: variable</span>
    </p>
  )
}

export function WindValue({ cell }: { cell: NWACWeatherWindCell | undefined }) {
  if (!cell?.speed) return <span className="text-muted-foreground">{fmtWind(cell)}</span>
  const bearing = windBearing(cell.dir)
  return (
    <span className="inline-flex flex-col items-center">
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap tabular-nums">
        {bearing != null && (
          // Points to where the wind comes from: from the north is an up arrow.
          <ArrowUp
            aria-hidden="true"
            className="size-4 shrink-0 text-primary"
            style={{ transform: `rotate(${bearing}deg)` }}
          />
        )}
        <span className="text-xs text-muted-foreground">{cell.dir}</span>
        <span
          className={cn(cell.speed >= 25 ? 'font-bold' : cell.speed >= 15 ? 'font-semibold' : '')}
        >
          {windRange(cell.speed)}
        </span>
      </span>
      <span className="text-center text-xs leading-tight text-muted-foreground">
        {windWording(cell.speed)}
      </span>
    </span>
  )
}

/**
 * A date (or a Day / Night label) with a sun or moon; plain when the column has no day or night.
 * `label` adds "Day" / "Night" for screen readers; off when the text already says it.
 */
export function DayNightDate({
  date,
  night,
  label = true,
}: {
  date: string | null
  night?: boolean
  label?: boolean
}) {
  if (night === undefined) return <>{date}</>
  const Icon = night ? Moon : Sun
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      {date}
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      {label && <span className="sr-only">{night ? 'Night' : 'Day'}</span>}
    </span>
  )
}
