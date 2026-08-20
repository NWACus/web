import { NWAC_DISPLAY_TIMEZONE } from '@/services/snowobs/constants'
import type { StationNote } from '@/services/snowobs/stationNotes'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { TriangleAlert } from 'lucide-react'

function noteDate(startDate: string | null): string | null {
  if (!startDate) return null
  const raised = new Date(startDate)
  if (Number.isNaN(raised.getTime())) return null
  return format(raised, 'MMM d, yyyy', { in: tz(NWAC_DISPLAY_TIMEZONE) })
}

// Current sensor issues for the station, straight from SnowObs. Someone
// reading a flood-level precipitation total should see the note saying the
// gauge is broken before they draw a conclusion from it.
export function StationNotes({ notes }: { notes: StationNote[] }) {
  if (notes.length === 0) return null

  // Only worth naming the logger when the group has more than one reporting.
  const multipleStations = new Set(notes.map((n) => n.stationName)).size > 1

  return (
    <aside className="rounded-md border-l-4 border-warning bg-warning/30 px-3 py-2">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <TriangleAlert className="h-4 w-4" aria-hidden />
        Station notes
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {notes.map((note) => {
          const raised = noteDate(note.startDate)
          return (
            <li key={`${note.stid}-${note.note}`}>
              {multipleStations && <span className="font-medium">{note.stationName}: </span>}
              {note.note}
              {raised && <span className="text-muted-foreground"> ({raised})</span>}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
