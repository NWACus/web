'use client'

/**
 * Tomorrow's outlook on a phone, as the widget shows it: a collapsed row labelled with the outlook's
 * date and a chevron, opening to the ratings beneath. Paper has no tap, so print always shows it.
 */
import { ChevronDown } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'

import { cn } from '@/utilities/ui'

interface CollapsibleOutlookProps {
  /** The outlook's date heading. */
  heading: string
  children: ReactNode
  className?: string
}

export function CollapsibleOutlook({ heading, children, className }: CollapsibleOutlookProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={cn('border-y-[5px] border-muted py-4', className)}>
      <h4 className="text-sm font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          className="flex w-full items-center justify-between gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {heading}
          <ChevronDown
            aria-hidden
            className={cn(
              'size-6 shrink-0 transition-transform print:hidden',
              open && 'rotate-180',
            )}
          />
        </button>
      </h4>
      <div id={panelId} className={cn(!open && 'hidden print:block')}>
        {children}
      </div>
    </div>
  )
}
