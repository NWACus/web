import { NWAC_DISPLAY_TIMEZONE } from '@/services/snowobs/constants'
import type { StationNote } from '@/services/snowobs/tableHelpers'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { Info, TriangleAlert } from 'lucide-react'

function noteDate(startDate: string | null): string | null {
  if (!startDate) return null
  const raised = new Date(startDate)
  if (Number.isNaN(raised.getTime())) return null
  return format(raised, 'MMM d, yyyy', { in: tz(NWAC_DISPLAY_TIMEZONE) })
}

export function NoteIcon({
  status,
  className,
}: {
  status: StationNote['status']
  className?: string
}) {
  return status === 'active' ? (
    <TriangleAlert className={`fill-warning ${className ?? ''}`} aria-hidden />
  ) : (
    <Info className={`text-muted-foreground ${className ?? ''}`} aria-hidden />
  )
}

export function StationNoteList({ notes }: { notes: StationNote[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {notes.map((note) => {
        const raised = noteDate(note.startDate)
        return (
          <li key={`${note.stid}-${note.note}`} className="flex items-start gap-2">
            <NoteIcon status={note.status} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {note.note}
              {raised && <span className="text-muted-foreground"> ({raised})</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function StationNotes({ notes }: { notes: StationNote[] }) {
  if (notes.length === 0) return null

  return (
    <aside className="rounded-md border-l-4 border-callout px-3 py-2">
      <h2 className="mb-1 text-sm font-semibold">Station notes</h2>
      <StationNoteList notes={notes} />
    </aside>
  )
}
