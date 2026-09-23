/**
 * How one Mountain Weather value draws in a table cell, shared by the zone and region-wide views:
 * snow as a chip that lights up when there is any, highs and lows in warm and cool colors, snow
 * levels shaded, and wind as an arrow plus speed.
 */
import { ArrowDown } from 'lucide-react'

import type { NwacWeatherTempCell, NwacWeatherWindCell } from '@/services/nac/model/nwacWeather'
import { DASH, fmtWind, windBearing } from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

const TONES = [
  'bg-sky-50 text-sky-950',
  'bg-sky-100 text-sky-950',
  'bg-sky-300 text-sky-950',
  'bg-sky-700 text-white',
]

/** Night columns and night period headers. */
export const NIGHT = 'bg-muted'

export function SnowValue({ text, some }: { text: string; some: boolean }) {
  return (
    <span
      className={cn(
        'inline-block min-w-12 rounded-full px-2.5 py-0.5 text-center font-semibold tabular-nums',
        some ? 'bg-sky-100 text-sky-900' : 'text-muted-foreground',
      )}
    >
      {text}
    </span>
  )
}

export function TempValue({ cell }: { cell: NwacWeatherTempCell | undefined }) {
  if (cell?.high == null || cell?.low == null) {
    return <span className="text-muted-foreground">{DASH}</span>
  }
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className="font-semibold text-red-700 dark:text-red-400">{cell.high}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="font-semibold text-blue-700 dark:text-blue-400">{cell.low}</span>
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

export function WindValue({ cell }: { cell: NwacWeatherWindCell | undefined }) {
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
