'use client'

import type { StationNote } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { ChevronDown, Info, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

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

// Whether the text is clipped to one line, rechecked as the layout resizes. A callback ref,
// since the text moves between a plain bar and a disclosure.
function useIsTruncated() {
  const [el, ref] = useState<HTMLSpanElement | null>(null)
  const [truncated, setTruncated] = useState(false)
  useEffect(() => {
    if (!el) return
    const check = () => setTruncated(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])
  return { ref, truncated }
}

function LeadLine({
  lead,
  folded,
  expandable,
  textRef,
  timeZone,
}: {
  lead: StationNote
  folded: number
  expandable: boolean
  textRef: (el: HTMLSpanElement | null) => void
  timeZone: string
}) {
  return (
    <>
      <NoteIcon status={lead.status} />
      <span ref={textRef} className="min-w-0 flex-1 truncate group-open:whitespace-normal">
        <NoteText note={lead} timeZone={timeZone} />
      </span>
      {folded > 0 && (
        <span className="shrink-0 whitespace-nowrap text-muted-foreground group-open:hidden">
          +{folded} {folded === 1 ? 'note' : 'notes'}
        </span>
      )}
      {expandable && (
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      )}
    </>
  )
}

// One line so notes don't push the data down every visit; active notes lead and tint the bar
// amber so a current data problem is never the part that's folded away. The bar is a disclosure
// when it folds other notes away or the lead note doesn't fit on the line.
export function StationNotes({ notes, timeZone }: { notes: StationNote[]; timeZone: string }) {
  const { ref, truncated } = useIsTruncated()
  const [open, setOpen] = useState(false)
  const [lead, ...rest] = [
    ...notes.filter((note) => note.status === 'active'),
    ...notes.filter((note) => note.status === 'static'),
  ]
  if (!lead) return null
  const hasActive = lead.status === 'active'
  // Open, the lead wraps and no longer overflows, so stay a disclosure to let it close.
  const expandable = rest.length > 0 || truncated || open
  const line = (
    <LeadLine
      lead={lead}
      folded={rest.length}
      expandable={expandable}
      textRef={ref}
      timeZone={timeZone}
    />
  )

  return (
    <aside
      aria-label="Station notes"
      className={cn('w-fit max-w-full text-sm', frameClass(hasActive))}
    >
      {expandable ? (
        <details
          open={open}
          onToggle={(event) => setOpen(event.currentTarget.open)}
          className="group"
        >
          <summary
            className={cn(
              barClass(hasActive),
              'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
            )}
          >
            {line}
          </summary>
          {rest.length > 0 && (
            <FoldedNotes notes={rest} hasActive={hasActive} timeZone={timeZone} />
          )}
        </details>
      ) : (
        <p className={barClass(hasActive)}>{line}</p>
      )}
    </aside>
  )
}
