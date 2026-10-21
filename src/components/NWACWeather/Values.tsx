/** How one Mountain Weather value draws in a table cell. */
import { Moon, Navigation2, Snowflake, Sun } from 'lucide-react'

import type { NWACWeatherTempCell, NWACWeatherWindCell } from '@/services/nac/model/nwacWeather'
import {
  DASH,
  fmtWind,
  windBearing,
  windRange,
  windWording,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

/** Level fills by elevation: blue (colder) below 5000', red (warmer) above, 5000' neutral. */
const LEVEL_FILLS: { below: number; fill: string; label: string }[] = [
  { below: 2000, fill: 'bg-blue-300 text-blue-950', label: "<2,000'" },
  { below: 3000, fill: 'bg-blue-200 text-blue-950', label: "2,000'" },
  { below: 4000, fill: 'bg-blue-100 text-blue-950', label: "3,000'" },
  { below: 5000, fill: 'bg-blue-50 text-blue-950', label: "4,000'" },
  { below: 5500, fill: 'bg-stone-100 text-stone-900', label: "5,000'" },
  { below: 6500, fill: 'bg-red-50 text-red-950', label: "5,500'" },
  { below: 7500, fill: 'bg-red-100 text-red-950', label: "6,500'" },
  { below: 8500, fill: 'bg-red-200 text-red-950', label: "7,500'" },
  { below: Infinity, fill: 'bg-red-300 text-red-950', label: "8,500'+" },
]

/** A snow or freezing level's fill, on its pill or its table cell. */
export function levelFill(level: number): string {
  return LEVEL_FILLS.find((f) => level < f.below)?.fill ?? ''
}

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

/**
 * A block's snow or freezing level, filled by elevation; a snow level carries a snowflake, a
 * freezing level (a dry block) none. A fixed snowflake slot lines the numbers up down a column.
 */
export function SnowLevelValue({
  level,
  snow,
  pill = true,
}: {
  level: number | null
  snow: boolean
  /** Off where the table fills the cell itself (`levelFill`). */
  pill?: boolean
}) {
  if (level == null) return <span className="block text-center text-muted-foreground">{DASH}</span>
  return (
    <span
      className={cn(
        'flex justify-center whitespace-nowrap rounded px-1 py-1 font-semibold tabular-nums',
        pill && levelFill(level),
      )}
    >
      <span className="grid grid-cols-[0.875rem_3.25rem] items-center gap-1.5">
        <span>{snow && <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />}</span>
        <span className="text-right">
          {level.toLocaleString('en-US')}&apos;
          <span className="sr-only">{snow ? ' snow level' : ' freezing level'}</span>
        </span>
      </span>
    </span>
  )
}

/** What the snow and freezing level cells mean, over the table. */
export function SnowLevelLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        Snow level; without it, freezing level (dry)
      </span>
      <span className="inline-flex flex-wrap items-center gap-0.5">
        {LEVEL_FILLS.map((f) => (
          <span key={f.label} className={cn('rounded-sm px-1.5 py-0.5', f.fill)}>
            {f.label}
          </span>
        ))}
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
        <Navigation2 aria-hidden="true" className="size-4 text-primary" />
        Points the way the wind blows
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
          // Points the way the wind blows: a north wind points down.
          <Navigation2
            aria-hidden="true"
            className="size-4 shrink-0 text-primary"
            style={{ transform: `rotate(${bearing + 180}deg)` }}
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
