/** How one Mountain Weather value draws in a table cell. */
import { ArrowDown, Moon, Snowflake, Sun, TrendingDown, TrendingUp } from 'lucide-react'

import type { NWACWeatherTempCell, NWACWeatherWindCell } from '@/services/nac/model/nwacWeather'
import { DASH, fmtWind, windBearing } from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

const TONES = [
  'bg-sky-50 text-sky-950',
  'bg-sky-100 text-sky-950',
  'bg-sky-300 text-sky-950',
  'bg-sky-700 text-white',
]

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

/** `tone` is the level's shade from `snowLevelTones`. */
export function LevelValue({ level, tone }: { level: number | null; tone: number | null }) {
  if (level == null) return <span className="block text-center text-muted-foreground">{DASH}</span>
  return (
    <span
      className={cn(
        'block whitespace-nowrap rounded px-1 py-1 text-center tabular-nums',
        TONES[tone ?? 0],
      )}
    >
      {level.toLocaleString('en-US')}&apos;
    </span>
  )
}

/**
 * A block's snow or freezing level: a snow level on light blue with a snowflake, a freezing level
 * (a dry block) plain, and a trending arrow for the change from the block before.
 */
export function SnowLevelValue({
  level,
  snow,
  trend,
}: {
  level: number | null
  snow: boolean
  trend: 'up' | 'down' | null
}) {
  if (level == null) return <span className="block text-center text-muted-foreground">{DASH}</span>
  const Trend = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  return (
    <span
      className={cn(
        'flex items-center justify-center gap-1 whitespace-nowrap rounded px-1 py-1 font-semibold tabular-nums',
        snow && 'bg-sky-100 text-sky-950',
      )}
    >
      {snow && <Snowflake aria-hidden="true" className="size-3.5 shrink-0 text-sky-700" />}
      {level.toLocaleString('en-US')}&apos;
      <span className="sr-only">
        {snow ? ' snow level' : ' freezing level'}
        {trend && (trend === 'up' ? ', rising' : ', falling')}
      </span>
      {Trend && <Trend aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
    </span>
  )
}

/** What the snow and freezing level cells mean, over the table. */
export function SnowLevelLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-sky-950">
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        Snow level
      </span>
      <span>Freezing level (dry)</span>
      <span className="inline-flex items-center gap-1">
        <TrendingUp aria-hidden="true" className="size-4" />
        <TrendingDown aria-hidden="true" className="size-4" />
        Higher or lower than the block before
      </span>
    </p>
  )
}

export function WindValue({ cell }: { cell: NWACWeatherWindCell | undefined }) {
  if (!cell?.speed) return <span className="text-muted-foreground">{fmtWind(cell)}</span>
  const bearing = windBearing(cell.dir)
  return (
    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap tabular-nums">
      {bearing != null && (
        // Points the way the wind blows: from the north is a down arrow.
        <ArrowDown
          aria-hidden="true"
          className="size-4 shrink-0 text-primary"
          style={{ transform: `rotate(${bearing}deg)` }}
        />
      )}
      <span className="text-xs text-muted-foreground">{cell.dir}</span>
      <span
        className={cn(cell.speed >= 25 ? 'font-bold' : cell.speed >= 15 ? 'font-semibold' : '')}
      >
        {cell.speed}
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
