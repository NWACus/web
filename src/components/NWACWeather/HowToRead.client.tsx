'use client'

import { CircleHelp } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type OpenState = { open: boolean; setOpen: (open: boolean) => void }

const SharedOpenContext = createContext<OpenState | null>(null)

/** One open state for tables shown in turn (12 and 24 hours), so switching keeps the help open. */
export function SharedHowToRead({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SharedOpenContext.Provider value={{ open, setOpen }}>{children}</SharedOpenContext.Provider>
  )
}

/**
 * A table's title row with a "How to read" button at its right (after any `control`), opening its
 * help in a panel under the row. Closed by default; printed open.
 */
export function HowToRead({
  heading,
  label,
  panelId,
  control,
  className,
  children,
}: {
  heading: ReactNode
  /** The table's name, for screen readers telling the page's buttons apart. */
  label: string
  panelId: string
  /** At the right beside the button from md up; a phone has its own form elsewhere. */
  control?: ReactNode
  className?: string
  children: ReactNode
}) {
  const shared = useContext(SharedOpenContext)
  const [ownOpen, setOwnOpen] = useState(false)
  const open = shared ? shared.open : ownOpen
  const setOpen = shared ? shared.setOpen : setOwnOpen
  return (
    <div className={className}>
      {/* The controls sit level with the title's last line, just above the table. */}
      <div className="flex items-end gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">{heading}</div>
        <div className="flex shrink-0 items-center gap-2">
          {control && <div className="hidden md:block print:hidden">{control}</div>}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
            // As tall as the 12 / 24 hour toggle beside it: h-8 items inside a border.
            className={cn(
              'inline-flex h-[2.125rem] items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden',
              open ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground',
            )}
          >
            <CircleHelp aria-hidden="true" className="size-4 shrink-0" />
            How to read
            <span className="sr-only"> {label}</span>
          </button>
        </div>
      </div>
      <div
        id={panelId}
        hidden={!open}
        className="mt-2 space-y-3 rounded-md bg-muted p-3 text-sm text-muted-foreground print:block print:bg-transparent print:p-0"
      >
        {children}
      </div>
    </div>
  )
}
