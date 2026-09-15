/**
 * The data-source legend: one coloured dot per source in the data, clickable to show only that
 * source. Shown when the center enabled `source_legend`, as the widget shows it.
 */
import { SOURCE_COLORS, sourceColor, sourceLabel } from '@/services/snowobs/stationMap/format'
import { cn } from '@/utilities/ui'

interface StationLegendProps {
  sources: string[]
  /** The source currently filtered to, or null for all. */
  active: string | null
  colorBySource: boolean
  onToggle: (source: string) => void
}

export function StationLegend({ sources, active, colorBySource, onToggle }: StationLegendProps) {
  if (sources.length === 0) return null

  return (
    <div
      className="absolute right-[52px] top-2.5 z-10 rounded bg-white px-2 py-1 text-xs leading-3 text-neutral-900 shadow-md"
      role="group"
      aria-label="Data sources"
    >
      {sources.map((source) => {
        const dimmed = active !== null && active !== source
        return (
          <button
            key={source}
            type="button"
            aria-pressed={active === source}
            onClick={() => onToggle(source)}
            className={cn(
              'flex w-full items-center gap-1.5 py-1 text-left uppercase',
              dimmed && 'text-neutral-400',
            )}
          >
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{
                backgroundColor: colorBySource
                  ? sourceColor(source, true)
                  : SOURCE_COLORS['synoptic-data'],
              }}
              aria-hidden="true"
            />
            {sourceLabel(source)}
          </button>
        )
      })}
    </div>
  )
}
