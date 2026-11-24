'use client'

import { ChevronDown } from 'lucide-react'
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
 * A table's title row over its description: the first line, which opens to the rest. Always
 * printed in full.
 */
export function TableDescription({
  heading,
  title,
  descriptionId,
  control,
  className,
  children,
}: {
  heading: ReactNode
  /** The table's name, for the button's label. */
  title: string
  descriptionId: string
  /** At the right of the title. */
  control?: ReactNode
  className?: string
  /** Text, with at most inline elements. */
  children: ReactNode
}) {
  const own = useState(false)
  const shared = useContext(SharedOpenContext)
  const [open, setOpen] = shared ? [shared.open, shared.setOpen] : own
  return (
    <div className={className}>
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">{heading}</div>
        {control && <div className="shrink-0 print:hidden">{control}</div>}
      </div>
      <div
        className={cn(
          'relative flex min-h-11 gap-2 py-2 text-sm text-muted-foreground md:min-h-8 md:py-1',
          open ? 'items-start' : 'items-center',
        )}
      >
        <p
          id={descriptionId}
          className={cn(
            'min-w-0 flex-1',
            !open && 'truncate print:overflow-visible print:whitespace-normal',
          )}
        >
          {children}
        </p>
        {/* Its overlay makes the whole line the tap area, with a label shorter than the text. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={descriptionId}
          aria-label={`${open ? 'Hide' : 'Show'} full description: ${title}`}
          onClick={() => setOpen(!open)}
          className="shrink-0 after:absolute after:inset-0 after:rounded-md after:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring print:hidden"
        >
          <ChevronDown aria-hidden="true" className={cn('size-5', open && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}
