'use client'

import { Info } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type OpenState = { open: boolean; setOpen: (open: boolean) => void }

const SharedOpenContext = createContext<OpenState | null>(null)

/** One open state for tables shown in turn (12 and 24 hours), so switching keeps it. */
export function SharedDescription({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SharedOpenContext.Provider value={{ open, setOpen }}>{children}</SharedOpenContext.Provider>
  )
}

/**
 * A table's title row, with an info icon after the title that shows the description under the row.
 * Closed by default; always printed.
 */
export function TableDescription({
  heading,
  title,
  panelId,
  control,
  className,
  children,
}: {
  /** Inline, so the icon follows its last word. */
  heading: ReactNode
  /** The table's name, for the icon's label. */
  title: string
  panelId: string
  /** At the right from md up; a phone has its own form beside the date. */
  control?: ReactNode
  className?: string
  children: ReactNode
}) {
  const own = useState(false)
  const shared = useContext(SharedOpenContext)
  const [open, setOpen] = shared ? [shared.open, shared.setOpen] : own
  return (
    <div className={className}>
      {/* The control sits at the right, level with the title's last line, just above the table. */}
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          {heading}
          {/* Keeps the icon on the line with the title's last word. */}
          {' '}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? 'Hide' : 'Show'} description: ${title}`}
            onClick={() => setOpen(!open)}
            className={cn(
              'relative inline-flex rounded-full align-[-0.125em] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 print:hidden',
              // The tap area, without adding to the row's height.
              "after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] md:after:size-8",
              open ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Info aria-hidden="true" className="size-[1.0625rem]" />
          </button>
        </div>
        {control && <div className="hidden shrink-0 md:block print:hidden">{control}</div>}
      </div>
      <div
        id={panelId}
        hidden={!open}
        className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground print:block print:bg-transparent print:p-0"
      >
        {children}
      </div>
    </div>
  )
}
