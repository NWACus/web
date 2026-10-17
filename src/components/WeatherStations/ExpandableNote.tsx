'use client'

import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// Whether the text is clipped to one line, rechecked as the layout resizes.
function useIsTruncated() {
  const ref = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setTruncated(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, truncated }
}

/** One line ending in an ellipsis, expandable only when the text doesn't fit. */
export function ExpandableNote({
  icon,
  className,
  children,
}: {
  icon: ReactNode
  className?: string
  children: ReactNode
}) {
  const { ref, truncated } = useIsTruncated()
  const [open, setOpen] = useState(false)
  // Open, the text wraps and no longer overflows, so stay expandable to let it close.
  const expandable = truncated || open
  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group">
      <summary
        onClick={(event) => {
          if (!expandable) event.preventDefault()
        }}
        className={cn(
          className,
          'list-none [&::-webkit-details-marker]:hidden',
          expandable ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {icon}
        <span ref={ref} className="min-w-0 flex-1 truncate group-open:whitespace-normal">
          {children}
        </span>
        {expandable && (
          <ChevronDown
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        )}
      </summary>
    </details>
  )
}
