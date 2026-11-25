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
import colors from 'tailwindcss/colors'

/** Level fills: blue low, faint tints around a neutral 5,000', orange from 8,000', red 10,000'+. */
// Each `color` is its `fill` as a value, for the key's gradient.
const LEVEL_FILLS: { below: number; fill: string; color: string; label: string }[] = [
  { below: 2000, fill: 'bg-blue-200 text-stone-900', color: colors.blue[200], label: "<2,000'" },
  { below: 3000, fill: 'bg-sky-100 text-stone-900', color: colors.sky[100], label: "2,000'" },
  { below: 4000, fill: 'bg-teal-50 text-stone-900', color: colors.teal[50], label: "3,000'" },
  { below: 5000, fill: 'bg-emerald-50 text-stone-900', color: colors.emerald[50], label: "4,000'" },
  { below: 6000, fill: 'bg-stone-100 text-stone-900', color: colors.stone[100], label: "5,000'" },
  { below: 7000, fill: 'bg-yellow-50 text-stone-900', color: colors.yellow[50], label: "6,000'" },
  { below: 8000, fill: 'bg-amber-50 text-stone-900', color: colors.amber[50], label: "7,000'" },
  { below: 9000, fill: 'bg-orange-100 text-stone-900', color: colors.orange[100], label: "8,000'" },
  {
    below: 10000,
    fill: 'bg-orange-200 text-stone-900',
    color: colors.orange[200],
    label: "9,000'",
  },
  { below: Infinity, fill: 'bg-red-200 text-stone-900', color: colors.red[200], label: "10,000'+" },
]

/** A snow or freezing level's fill, on its pill or its table cell. */
export function levelFill(level: number): string {
  return LEVEL_FILLS.find((f) => level < f.below)?.fill ?? ''
}

/** Snow fills by `snowTier`, deepening with the amount; none without snow. */
const SNOW_FILLS = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300']
const SNOW_COLORS = [colors.blue[50], colors.blue[100], colors.blue[200], colors.blue[300]]

export function snowFill(snow: number | null): string | undefined {
  const tier = snowTier(snow)
  return tier == null ? undefined : SNOW_FILLS[tier]
}

/** Wind fills, one step per strength: one violet, deeper as it strengthens. */
const WIND_STEPS: {
  fill: string
  color: string
  name: string
  wordings: string[]
  label: string | null
}[] = [
  {
    fill: 'bg-[#f8f7ff]',
    color: '#f8f7ff',
    name: 'Light',
    wordings: ['Light'],
    label: 'Light',
  },
  {
    fill: 'bg-[#f0edff]',
    color: '#f0edff',
    name: 'Light to Moderate',
    wordings: ['Light to occasionally Moderate', 'Light to Moderate'],
    label: null,
  },
  {
    fill: 'bg-[#e6e0fe]',
    color: '#e6e0fe',
    name: 'Moderate',
    wordings: ['Moderate'],
    label: 'Moderate',
  },
  {
    fill: 'bg-[#dbd2fe]',
    color: '#dbd2fe',
    name: 'Moderate to Strong',
    wordings: ['Moderate to Strong'],
    label: null,
  },
  {
    fill: 'bg-[#cdbffd]',
    color: '#cdbffd',
    name: 'Strong',
    wordings: ['Strong'],
    label: 'Strong',
  },
  {
    fill: 'bg-[#bba8fb]',
    color: '#bba8fb',
    name: 'Strong to Extreme',
    wordings: ['Strong to Extreme'],
    label: null,
  },
  {
    fill: 'bg-[#a78bfa]',
    color: '#a78bfa',
    name: 'Extreme',
    wordings: ['Extreme'],
    label: 'Extreme',
  },
]

/** A wind cell's fill by its wording; none for calm or no wind. */
export function windFill(speed: number | null | undefined): string | undefined {
  const wording = windWording(speed)
  const step = WIND_STEPS.find((s) => wording && s.wordings.includes(wording))
  return step && `${step.fill} text-stone-900`
}

const LEVEL_KEY_LABELS = [null, "2k'", null, "4k'", null, "6k'", null, "8k'", null, "10k'+"]

/**
 * The steps as one smooth gradient, each label printed at its step: the blends between the named
 * steps read as in between without labels of their own. Labeled steps take twice the width of the
 * unlabeled ones between them, so the labels fit. `names` gives every step its full name, as a
 * hover title and as text for screen readers.
 */
function SegmentedBar({
  colors: stepColors,
  names,
  labels,
  width = 'w-full sm:w-80',
}: {
  colors: string[]
  names: readonly string[]
  labels: readonly (string | null)[]
  /** The bar's width as static classes, so Tailwind sees them. */
  width?: string
}) {
  const widths = labels.map((l) => (l ? 2 : 1))
  const total = widths.reduce((a, b) => a + b, 0)
  // Each color sits at the middle of its step, so a step's label is on its own color.
  let start = 0
  const stops = stepColors.map((color, i) => {
    const middle = ((start + widths[i] / 2) / total) * 100
    start += widths[i]
    return `${color} ${middle.toFixed(1)}%`
  })
  return (
    <span className={cn('inline-block shrink-0', width)}>
      <span className="sr-only">{names.join(', ')}</span>
      <span
        aria-hidden="true"
        className="grid h-7 overflow-hidden rounded-sm text-xs font-medium text-stone-900"
        style={{
          gridTemplateColumns: widths.map((w) => `${w}fr`).join(' '),
          backgroundImage: `linear-gradient(90deg, ${stops.join(', ')})`,
        }}
      >
        {labels.map((label, i) => (
          <span
            key={i}
            title={names[i]}
            className="flex items-center justify-center whitespace-nowrap px-0.5"
          >
            {label}
          </span>
        ))}
      </span>
    </span>
  )
}

const KEY_LINE = 'flex flex-wrap items-center gap-3 whitespace-nowrap text-sm text-muted-foreground'

function SnowFillKey({ width }: { width?: string }) {
  return (
    <SegmentedBar
      colors={SNOW_COLORS}
      names={SNOW_TIER_LABELS}
      labels={SNOW_TIER_LABELS}
      width={width}
    />
  )
}

/** A snow level's mark; a dry block's freezing level has none. */
function LevelMark({ snow }: { snow: boolean }) {
  return snow ? <Snowflake aria-hidden="true" className="size-3.5 shrink-0 text-sky-700" /> : null
}

function SnowLevelKey({ width }: { width?: string }) {
  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <LevelMark snow />
          Snow level
        </span>
        <span>No icon: freezing level</span>
      </span>
      <SegmentedBar
        colors={LEVEL_FILLS.map((f) => f.color)}
        names={LEVEL_FILLS.map((f) => f.label)}
        labels={LEVEL_KEY_LABELS}
        width={width}
      />
    </>
  )
}

/**
 * The precipitation table's key: the local hours a Day and Night cover, by their sun and moon,
 * then the snow shading when the forecast has snow amounts. Laid out like the wind key.
 */
export function PrecipLegend({
  day,
  night,
  snow,
}: {
  day: string | null
  night: string | null
  snow: boolean
}) {
  if (!day && !night && !snow) return null
  return (
    <p className={cn(KEY_LINE, 'items-center gap-x-6')}>
      {day && (
        <span className="inline-flex items-center gap-1">
          <Sun aria-hidden="true" className="size-3.5 shrink-0" />
          Day {day}
        </span>
      )}
      {night && (
        <span className="inline-flex items-center gap-1">
          <Moon aria-hidden="true" className="size-3.5 shrink-0" />
          Night {night}
        </span>
      )}
      {snow && (
        <span className="inline-flex items-center gap-3">
          {/* Narrower on a phone, to leave room for the hours toggle across from it. */}
          <SnowFillKey width="w-48 sm:w-60" />
        </span>
      )}
    </p>
  )
}

/** One key with its title above its bar. */
const STACKED_KEY = 'inline-flex flex-col items-start gap-1.5'

/**
 * The avalanche view's keys, the overview's all together: snow, snow level and wind, each titled
 * above its bar so the bars keep their full length on one row.
 */
export function ZoneKeys() {
  return (
    <p className={cn(KEY_LINE, 'items-end gap-x-12 gap-y-3')}>
      <span className={STACKED_KEY}>
        <SnowFillKey width="w-60" />
      </span>
      <span className={STACKED_KEY}>
        <SnowLevelKey width="w-80" />
      </span>
      <span className={STACKED_KEY}>
        <span className="inline-flex items-center gap-3">
          <WindNotes />
        </span>
        <WindKey width="w-80" />
      </span>
    </p>
  )
}

export type PhoneKeyKind = 'snow' | 'temp' | 'level' | 'wind'

/** One row's key in a phone card, opened from its label. */
export function PhoneKey({ kind }: { kind: PhoneKeyKind }) {
  return (
    <p className={cn(KEY_LINE, 'flex-col items-start gap-1.5')}>
      {kind === 'snow' && (
        <>
          <span>Inches of snow at 5000&apos;</span>
          <SegmentedBar
            colors={SNOW_COLORS}
            names={SNOW_TIER_LABELS}
            labels={SNOW_TIER_LABELS}
            width="w-full"
          />
        </>
      )}
      {kind === 'temp' && <LoHi />}
      {kind === 'level' && <SnowLevelKey width="w-full" />}
      {kind === 'wind' && (
        <>
          <span>mph · VAR: variable</span>
          <SegmentedBar
            colors={WIND_STEPS.map((s) => s.color)}
            names={WIND_STEPS.map((s) => s.name)}
            labels={WIND_STEPS.map((s) => s.label)}
            width="w-full"
          />
        </>
      )}
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
      <span>{cell.low}°</span>
      <span className="text-muted-foreground"> / </span>
      <span className="font-semibold">{cell.high}°</span>
    </span>
  )
}

/**
 * A block's snow or freezing level, filled by elevation, then its LevelMark. A fixed slot for
 * the mark lines the numbers up down a column.
 */
export function SnowLevelValue({
  level,
  snow,
  pill = true,
  tight = !pill,
}: {
  level: number | null
  snow: boolean
  /** Off where the table fills the cell itself (`levelFill`); tighter on a phone there. */
  pill?: boolean
  /** Narrower on a phone; on by default where the table fills the cell. */
  tight?: boolean
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
          'grid grid-cols-[3.25rem_0.875rem] items-center gap-1.5',
          tight && 'max-md:grid-cols-[2.75rem_0.875rem] max-md:gap-0.5 max-md:text-xs',
        )}
      >
        <span className="text-right">
          {level.toLocaleString('en-US')}&apos;
          <span className="sr-only">{snow ? ' snow level' : ' freezing level'}</span>
        </span>
        <span className="flex">
          <LevelMark snow={snow} />
        </span>
      </span>
    </span>
  )
}

/** How a temperature cell reads. */
function LoHi() {
  return (
    <span>
      Lo / <span className="font-semibold text-foreground">Hi</span>
    </span>
  )
}

/** How to read a temperature cell, under the table. */
export function TempLegend() {
  return (
    <p className={KEY_LINE}>
      <LoHi />
    </p>
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

/** How to read the wind cells, under the table. */
export function WindLegend() {
  return (
    <p className={cn(KEY_LINE, 'items-center gap-x-6')}>
      <WindNotes />
      <WindKey />
    </p>
  )
}

/** How to read a wind cell's direction. */
function WindNotes() {
  return <span>VAR: variable</span>
}

/** The wind fills, light to extreme. */
function WindKey({ width }: { width?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <SegmentedBar
        colors={WIND_STEPS.map((s) => s.color)}
        names={WIND_STEPS.map((s) => s.name)}
        labels={WIND_STEPS.map((s) => s.label)}
        width={width}
      />
    </span>
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
