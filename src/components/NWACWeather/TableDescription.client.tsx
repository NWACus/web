'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utilities/ui'
import { useIsTruncated } from '@/utilities/useIsTruncated'

/**
 * A table's description on one line, so the tables line up whatever its length; a disclosure that
 * opens to the whole text when it doesn't fit. Print shows it whole.
 */
export function TableDescription({ text }: { text: string }) {
  const { ref, truncated } = useIsTruncated()
  const [open, setOpen] = useState(false)
  // Open, the text wraps and no longer overflows, so stay a disclosure to let it close.
  const expandable = truncated || open
  const line = (
    <>
      <span
        ref={ref}
        className="min-w-0 flex-1 truncate group-open:whitespace-normal print:whitespace-normal"
      >
        {text}
      </span>
      {expandable && (
        <ChevronDown
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180 print:hidden"
        />
      )}
    </>
  )
  const lineClass = 'flex items-start gap-1 text-sm text-muted-foreground'
  if (!expandable) return <p className={lineClass}>{line}</p>
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group">
      <summary
        className={cn(lineClass, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}
      >
        {line}
      </summary>
    </details>
  )
}
