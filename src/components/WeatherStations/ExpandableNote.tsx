'use client'

import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

// Whether the text is clipped to one line, rechecked as the layout resizes. A callback ref,
// since the text moves between a plain line and a disclosure.
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

const textClass = 'min-w-0 flex-1 truncate group-open:whitespace-normal'

/** One line ending in an ellipsis, a disclosure only when the text doesn't fit. */
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

  // Open, the text wraps and no longer overflows, so stay a disclosure to let it close.
  if (!truncated && !open) {
    return (
      <p className={className}>
        {icon}
        <span ref={ref} className={textClass}>
          {children}
        </span>
      </p>
    )
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group">
      <summary
        className={cn(className, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}
      >
        {icon}
        <span ref={ref} className={textClass}>
          {children}
        </span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
    </details>
  )
}
