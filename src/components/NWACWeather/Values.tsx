/** How one Mountain Weather value draws in a table cell. */
import { Moon, Navigation2, Snowflake, Sun } from 'lucide-react'

import type { NWACWeatherTempCell, NWACWeatherWindCell } from '@/services/nac/model/nwacWeather'
import {
  DASH,
  fmtWind,
  SNOW_TIER_LABELS,
  snowTier,
  windBearing,
  windRange,
  windWording,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

/** Muted level fills: blue low through green and yellow, orange from 8,000', red at 10,000'+. */
const LEVEL_FILLS: { below: number; fill: string; label: string }[] = [
  { below: 2000, fill: 'bg-blue-200 text-stone-900', label: "<2,000'" },
  { below: 3000, fill: 'bg-sky-100 text-stone-900', label: "2,000'" },
  { below: 4000, fill: 'bg-teal-100 text-stone-900', label: "3,000'" },
  { below: 5000, fill: 'bg-emerald-100 text-stone-900', label: "4,000'" },
  { below: 6000, fill: 'bg-lime-100 text-stone-900', label: "5,000'" },
  { below: 7000, fill: 'bg-yellow-100 text-stone-900', label: "6,000'" },
  { below: 8000, fill: 'bg-amber-100 text-stone-900', label: "7,000'" },
  { below: 9000, fill: 'bg-orange-200 text-stone-900', label: "8,000'" },
  { below: 10000, fill: 'bg-orange-300 text-stone-900', label: "9,000'" },
  { below: Infinity, fill: 'bg-red-300 text-stone-900', label: "10,000'+" },
]

/** A snow or freezing level's fill, on its pill or its table cell. */
export function levelFill(level: number): string {
  return LEVEL_FILLS.find((f) => level < f.below)?.fill ?? ''
}

/** Snow fills by `snowTier`, deepening with the amount; none without snow. */
const SNOW_FILLS = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300']

export function snowFill(snow: number | null): string | undefined {
  const tier = snowTier(snow)
  return tier == null ? undefined : SNOW_FILLS[tier]
}

const LEVEL_KEY_LABELS = [null, '2k', null, '4k', null, '6k', null, '8k', null, "10k+'"]

/** Fills as one bar, each segment labeled under it where `labels` has one. */
function SegmentedBar({
  fills,
  labels,
  cols,
}: {
  fills: string[]
  labels: (string | null)[]
  /** The grid's column count as a static class (`grid-cols-4`), so Tailwind sees it. */
  cols: string
}) {
  return (
    <span className="inline-flex w-56 shrink-0 flex-col gap-0.5">
      <span className={cn('grid h-2.5 overflow-hidden rounded-sm', cols)}>
        {fills.map((fill, i) => (
          <span key={i} className={fill} />
        ))}
      </span>
      <span className={cn('grid text-[10px] leading-none', cols)}>
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </span>
    </span>
  )
}

/** A scale's fills as a short unlabeled strip. */
function Strip({ fills, className }: { fills: string[]; className: string }) {
  return (
    <span className={cn('inline-flex h-2 overflow-hidden rounded-sm', className)}>
      {fills.map((fill, i) => (
        <span key={i} className={cn('flex-1', fill)} />
      ))}
    </span>
  )
}

const KEY_LINE = 'flex flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap text-xs'

/** The snow shading's key under the Overall view's precipitation table, on one line. */
export function SnowFillLegend() {
  return (
    <p className={cn(KEY_LINE, 'text-muted-foreground')}>
      Snow
      <SegmentedBar fills={SNOW_FILLS} labels={SNOW_TIER_LABELS} cols="grid-cols-4" />
    </p>
  )
}

/** The zone table's one-line key: both scales as strips, and the snowflake. */
export function ZoneKey() {
  return (
    <p className={cn(KEY_LINE, 'text-muted-foreground')}>
      <span className="inline-flex items-center gap-1">
        Snow <Strip fills={SNOW_FILLS} className="w-12" /> more
      </span>
      <span className="inline-flex items-center gap-1">
        Snow level <Strip fills={LEVEL_FILLS.map((f) => f.fill)} className="w-20" /> higher
      </span>
      <span className="inline-flex items-center gap-1">
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        snow level, none freezing
      </span>
    </p>
  )
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

/** What the snow and freezing level cells mean, under the Overall table, on one line. */
export function SnowLevelLegend() {
  return (
    <p className={cn(KEY_LINE, 'items-start text-muted-foreground')}>
      <span className="inline-flex items-center gap-1">
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        Snow level; none, freezing level
      </span>
      <SegmentedBar
        fills={LEVEL_FILLS.map((f) => f.fill)}
        labels={LEVEL_KEY_LABELS}
        cols="grid-cols-10"
      />
    </p>
  )
}

/** How to read the temperature cells, under the table. */
export function TempLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">44</span> /{' '}
      <span className="font-semibold text-foreground">35</span> is the high / low
    </p>
  )
}

/** How to read the wind cells, under the table. */
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
  // The forecasters' calm band (0–4 mph) reads as Calm alone, as 0 does.
  if (windWording(cell.speed) === 'Calm') return <span className="text-muted-foreground">Calm</span>
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
