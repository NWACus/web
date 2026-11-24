'use client'

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
 * A table's title row over its description: the first line, and More for the rest. Always
 * printed in full.
 */
export function TableDescription({
  heading,
  title,
  descriptionId,
  control,
  children,
}: {
  heading: ReactNode
  /** The table's name, for the button's label. */
  title: string
  descriptionId: string
  /** At the right of the title. */
  control?: ReactNode
  /** Text, with at most inline elements. */
  children: ReactNode
}) {
  const own = useState(false)
  const shared = useContext(SharedOpenContext)
  const [open, setOpen] = shared ? [shared.open, shared.setOpen] : own
  return (
    <div className={cn(control && 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4')}>
      <div className="min-w-0">{heading}</div>
      {control && (
        // Beside the title and description; a phone's wrapped title clears it on its own. The
        // margin is the space above the capitals in the title's first line.
        <div className="mt-2 sm:row-span-2 print:hidden">{control}</div>
      )}
      <div
        className={cn(
          'py-2 text-sm text-muted-foreground md:py-1',
          !open && 'flex items-baseline gap-1.5 print:block',
          control && 'col-span-2 sm:col-span-1',
        )}
      >
        <span
          id={descriptionId}
          className={cn(!open && 'min-w-0 truncate print:overflow-visible print:whitespace-normal')}
        >
          {children}
        </span>{' '}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={descriptionId}
          onClick={() => setOpen(!open)}
          className="relative shrink-0 rounded-sm font-semibold text-primary after:absolute after:-inset-x-2 after:-inset-y-2 after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        >
          {open ? 'Less' : 'More'}
          <span className="sr-only"> about {title}</span>
        </button>
      </div>
    </div>
  )
}
