import type { StationNote } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { ChevronDown, Info, TriangleAlert } from 'lucide-react'

function noteDate(startDate: string | null, timeZone: string): string | null {
  if (!startDate) return null
  const raised = new Date(startDate)
  if (Number.isNaN(raised.getTime())) return null
  return format(raised, 'MMM d, yyyy', { in: tz(timeZone) })
}

function NoteText({ note, timeZone }: { note: StationNote; timeZone: string }) {
  const raised = noteDate(note.startDate, timeZone)
  return (
    <span>
      {note.note}
      {raised && <span className="ml-1.5 text-xs text-muted-foreground">{raised}</span>}
    </span>
  )
}

function NoteIcon({ status }: { status: StationNote['status'] }) {
  const Icon = status === 'active' ? TriangleAlert : Info
  return <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
}

function FoldedNotes({
  notes,
  hasActive,
  timeZone,
}: {
  notes: StationNote[]
  hasActive: boolean
  timeZone: string
}) {
  return (
    <ul>
      {notes.map((note) => (
        <li
          key={`${note.stid}-${note.note}`}
          className={cn(
            'flex items-start gap-2 border-t border-border px-3 py-2',
            hasActive && 'first:border-warning',
            note.status === 'static' && 'text-muted-foreground',
          )}
        >
          <NoteIcon status={note.status} />
          <NoteText note={note} timeZone={timeZone} />
        </li>
      ))}
    </ul>
  )
}

const frameClass = (hasActive: boolean) =>
  cn('overflow-hidden rounded-md border', hasActive ? 'border-warning' : 'border-border')

const barClass = (hasActive: boolean) =>
  cn('flex items-start gap-2 px-3 py-2', hasActive ? 'bg-warning' : 'bg-muted')

function LeadSummary({
  lead,
  folded,
  timeZone,
}: {
  lead: StationNote
  folded: number
  timeZone: string
}) {
  return (
    <summary
      className={cn(
        barClass(lead.status === 'active'),
        'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
      )}
    >
      <NoteIcon status={lead.status} />
      <span className="min-w-0 flex-1 truncate group-open:whitespace-normal">
        <NoteText note={lead} timeZone={timeZone} />
      </span>
      <span className="shrink-0 whitespace-nowrap text-muted-foreground group-open:hidden">
        +{folded} {folded === 1 ? 'note' : 'notes'}
      </span>
      <ChevronDown
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        aria-hidden
      />
    </summary>
  )
}

// One line so notes don't push the data down every visit; active notes lead and tint
// the bar amber so a current data problem is never the part that's folded away.
export function StationNotes({ notes, timeZone }: { notes: StationNote[]; timeZone: string }) {
  const [lead, ...rest] = [
    ...notes.filter((note) => note.status === 'active'),
    ...notes.filter((note) => note.status === 'static'),
  ]
  if (!lead) return null
  const hasActive = lead.status === 'active'

  // Nothing to fold away, so show the lone note in full.
  if (rest.length === 0) {
    return (
      <aside aria-label="Station notes" className={cn('w-fit text-sm', frameClass(hasActive))}>
        <p className={barClass(hasActive)}>
          <NoteIcon status={lead.status} />
          <NoteText note={lead} timeZone={timeZone} />
        </p>
      </aside>
    )
  }

  return (
    <aside aria-label="Station notes" className="text-sm">
      <details className={cn('group', frameClass(hasActive))}>
        <LeadSummary lead={lead} folded={rest.length} timeZone={timeZone} />
        <FoldedNotes notes={rest} hasActive={hasActive} timeZone={timeZone} />
      </details>
    </aside>
  )
}
