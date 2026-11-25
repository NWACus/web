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
  /** Under the description on a phone, at the right from md up. */
  control?: ReactNode
  /** Text, with at most inline elements. */
  children: ReactNode
}) {
  const own = useState(false)
  const shared = useContext(SharedOpenContext)
  const [open, setOpen] = shared ? [shared.open, shared.setOpen] : own
  return (
    <div
      className={cn(
        control && 'md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4',
      )}
    >
      <div className="min-w-0">{heading}</div>
      <div
        className={cn(
          'py-2 text-sm text-muted-foreground md:py-1',
          !open && 'flex items-baseline gap-1 print:block',
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
      {control && (
        // From md up, beside both rows; the margin is the space above the title's capitals.
        <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:mt-2 print:hidden">
          {control}
        </div>
      )}
    </div>
  )
}
