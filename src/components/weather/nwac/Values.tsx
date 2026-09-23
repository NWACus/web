/** How one Mountain Weather value draws in a table cell. */
import { ArrowDown, Moon, Sun } from 'lucide-react'

import type { NwacWeatherTempCell, NwacWeatherWindCell } from '@/services/nac/model/nwacWeather'
import { DASH, fmtWind, windBearing } from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

const TONES = [
  'bg-sky-50 text-sky-950',
  'bg-sky-100 text-sky-950',
  'bg-sky-300 text-sky-950',
  'bg-sky-700 text-white',
]

export function SnowValue({ text, some }: { text: string; some: boolean }) {
  return (
    <span className={cn('tabular-nums', some ? 'font-semibold' : 'text-muted-foreground')}>
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

/** A date with a sun or moon for day or night; plain when the column has no day or night. */
export function DayNightDate({ date, night }: { date: string | null; night?: boolean }) {
  if (night === undefined) return <>{date}</>
  const Icon = night ? Moon : Sun
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      {date}
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">{night ? 'Night' : 'Day'}</span>
    </span>
  )
}
