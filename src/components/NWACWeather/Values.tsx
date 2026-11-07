/** How one Mountain Weather value draws in a table cell. */
import { Moon, Navigation2, Snowflake, Sun } from 'lucide-react'

import type { NWACWeatherTempCell, NWACWeatherWindCell } from '@/services/nac/model/nwacWeather'
import {
  DASH,
  SNOW_TIER_LABELS,
  snowTier,
  windBearing,
  windRange,
  windWording,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

/** Level fills: blue low, faint tints around a neutral 5,000', orange from 8,000', red 10,000'+. */
const LEVEL_FILLS: { below: number; fill: string; label: string }[] = [
  { below: 2000, fill: 'bg-blue-200 text-stone-900', label: "<2,000'" },
  { below: 3000, fill: 'bg-sky-100 text-stone-900', label: "2,000'" },
  { below: 4000, fill: 'bg-teal-50 text-stone-900', label: "3,000'" },
  { below: 5000, fill: 'bg-emerald-50 text-stone-900', label: "4,000'" },
  { below: 6000, fill: 'bg-stone-100 text-stone-900', label: "5,000'" },
  { below: 7000, fill: 'bg-yellow-50 text-stone-900', label: "6,000'" },
  { below: 8000, fill: 'bg-amber-50 text-stone-900', label: "7,000'" },
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

/** Wind fills, one step per strength: violet deepening to Strong, rose from there. */
const WIND_STEPS: { fill: string; name: string; wordings: string[]; label: string | null }[] = [
  { fill: 'bg-violet-50', name: 'Light', wordings: ['Light'], label: 'Light' },
  {
    fill: 'bg-violet-100',
    name: 'Light to Moderate',
    wordings: ['Light to occasionally Moderate', 'Light to Moderate'],
    label: null,
  },
  { fill: 'bg-violet-200', name: 'Moderate', wordings: ['Moderate'], label: 'Moderate' },
  {
    fill: 'bg-violet-300',
    name: 'Moderate to Strong',
    wordings: ['Moderate to Strong'],
    label: null,
  },
  { fill: 'bg-violet-400', name: 'Strong', wordings: ['Strong'], label: 'Strong' },
  { fill: 'bg-rose-300', name: 'Strong to Extreme', wordings: ['Strong to Extreme'], label: null },
  { fill: 'bg-rose-400', name: 'Extreme', wordings: ['Extreme'], label: 'Extreme' },
]

/** A wind cell's fill by its wording; none for calm or no wind. */
export function windFill(speed: number | null | undefined): string | undefined {
  const wording = windWording(speed)
  const step = WIND_STEPS.find((s) => wording && s.wordings.includes(wording))
  return step && `${step.fill} text-stone-900`
}

const LEVEL_KEY_LABELS = [null, "2k'", null, "4k'", null, "6k'", null, "8k'", null, "10k'+"]

/**
 * Fills as one bar, each segment labeled under it where `labels` has one. `names` gives every
 * segment its full name, as a hover title and as text for screen readers.
 */
function SegmentedBar({
  fills,
  names,
  labels,
  cols,
  centered = false,
  width = 'w-56',
}: {
  fills: string[]
  names: readonly string[]
  labels: readonly (string | null)[]
  /** The grid's column count as a static class (`grid-cols-4`), so Tailwind sees it. */
  cols: string
  /** Center each label under its segment, for labels that name the segment, not a tick. */
  centered?: boolean
  /** The bar's width as static classes, so Tailwind sees them. */
  width?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 flex-col gap-0.5', width)}>
      <span className="sr-only">{names.join(', ')}</span>
      <span aria-hidden="true" className={cn('grid h-2.5 overflow-hidden rounded-sm', cols)}>
        {fills.map((fill, i) => (
          <span key={i} title={names[i]} className={fill} />
        ))}
      </span>
      <span
        aria-hidden="true"
        className={cn('grid text-[10px] leading-none', centered && 'text-center', cols)}
      >
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </span>
    </span>
  )
}

// Labels sit level with their bars' tops, so the tick labels hang below the line.
const KEY_LINE =
  'flex flex-wrap items-start gap-3 whitespace-nowrap text-xs leading-3 text-muted-foreground'

function SnowFillKey({ width }: { width?: string }) {
  return (
    <>
      Snow
      <SegmentedBar
        fills={SNOW_FILLS}
        names={SNOW_TIER_LABELS}
        labels={SNOW_TIER_LABELS}
        cols="grid-cols-4"
        centered
        width={width}
      />
    </>
  )
}

function SnowLevelKey() {
  return (
    <>
      <span className="inline-flex items-center gap-1">
        <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
        Snow level; none, freezing level
      </span>
      <SegmentedBar
        fills={LEVEL_FILLS.map((f) => f.fill)}
        names={LEVEL_FILLS.map((f) => f.label)}
        labels={LEVEL_KEY_LABELS}
        cols="grid-cols-10"
      />
    </>
  )
}

/** The snow shading's key under a table. */
export function SnowFillLegend() {
  return (
    <p className={KEY_LINE}>
      {/* Narrower on a phone, to leave room for the hours toggle across from it. */}
      <SnowFillKey width="w-40 sm:w-56" />
    </p>
  )
}

/** Both snow keys, under a table that shows snow and snow levels together. */
export function SnowKeys() {
  return (
    <p className={cn(KEY_LINE, 'gap-x-6')}>
      <span className="inline-flex items-start gap-3">
        <SnowFillKey />
      </span>
      <span className="inline-flex items-start gap-3">
        <SnowLevelKey />
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
      <span>{cell.low}</span>
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
      <span
        className={cn(
          'grid grid-cols-[0.875rem_3.25rem] items-center gap-1.5',
          !pill && 'max-md:grid-cols-[0.875rem_2.75rem] max-md:gap-0.5 max-md:text-xs',
        )}
      >
        <span>{snow && <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />}</span>
        <span className="text-right">
          {level.toLocaleString('en-US')}&apos;
          <span className="sr-only">{snow ? ' snow level' : ' freezing level'}</span>
        </span>
      </span>
    </span>
  )
}

/** What the snow and freezing level cells mean, under a table. */
export function SnowLevelLegend() {
  return (
    <p className={KEY_LINE}>
      <SnowLevelKey />
    </p>
  )
}

/** How to read the temperature cells, under the table. */
export function TempLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">44</span> /{' '}
      <span className="text-foreground">35</span> is the high / low
    </p>
  )
}

/** How to read the wind cells, under the table. */
export function WindLegend() {
  return (
    <p className={cn(KEY_LINE, 'items-center gap-x-6')}>
      <span className="inline-flex items-center gap-1">
        <Navigation2 aria-hidden="true" className="size-3.5 text-primary" />
        Points the way the wind blows
      </span>
      <span>VAR: variable</span>
      <span className="inline-flex items-center gap-3">
        Wind
        <SegmentedBar
          fills={WIND_STEPS.map((s) => s.fill)}
          names={WIND_STEPS.map((s) => s.name)}
          labels={WIND_STEPS.map((s) => s.label)}
          cols="grid-cols-7"
        />
      </span>
    </p>
  )
}

export function WindValue({
  cell,
  compact = false,
}: {
  cell: NWACWeatherWindCell | undefined
  /** No wording, and the speed drops under the direction in a narrow column. */
  compact?: boolean
}) {
  if (cell?.speed == null) return <span className="text-muted-foreground">{DASH}</span>
  if (windWording(cell.speed) === 'Calm') {
    return (
      <span className="whitespace-nowrap">
        {cell.dir && `${cell.dir} `}
        <span className="font-semibold">Calm</span>
      </span>
    )
  }
  const bearing = windBearing(cell.dir)
  return (
    <span className={cn('flex-col items-center', compact ? 'flex' : 'inline-flex')}>
      <span
        className={cn(
          'inline-flex flex-wrap items-center justify-center gap-x-1.5 whitespace-nowrap tabular-nums',
          compact && 'max-md:gap-x-1',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          {bearing != null && (
            // Points the way the wind blows: a north wind points down.
            <Navigation2
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
              style={{ transform: `rotate(${bearing + 180}deg)` }}
            />
          )}
          <span>{cell.dir}</span>
        </span>
        <span className="font-semibold">{windRange(cell.speed)}</span>
      </span>
      <span
        className={cn(
          'text-center text-xs leading-tight text-muted-foreground',
          compact && 'sr-only',
        )}
      >
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
