'use client'

/**
 * The forecast's ⓘ help marker — the native equivalent of the legacy widget's info popovers and
 * the weather table's "?" bubble. Opens on hover and on click/Enter, because it is read on both
 * desktop and touch and a `title` attribute reaches neither reliably.
 *
 * This is deliberately NOT the glossary tooltip system (issue 06) — it shows hardcoded/structural
 * help whose HTML the server has already sanitized.
 */
import { Info } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Long enough to cross the gap between the trigger and the panel without the panel vanishing. */
const CLOSE_DELAY_MS = 150

interface InfoPopoverProps {
  /** Sanitized help HTML. */
  html: string
  /** The trigger's accessible name, e.g. `What "Ridgeline Wind Speed" means`. */
  label: string
}

export function InfoPopover({ html, label }: InfoPopoverProps) {
  const [open, setOpen] = useState(false)
  // A pointer-opened panel must not steal focus; a click- or keyboard-opened one should take it.
  const focusOnOpen = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  useEffect(() => cancelClose, [cancelClose])

  const openFromPointer = useCallback(() => {
    cancelClose()
    focusOnOpen.current = false
    setOpen(true)
  }, [cancelClose])

  const closeFromPointer = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }, [cancelClose])

  // Radix's own trigger click, Escape and outside-click all arrive here.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      cancelClose()
      focusOnOpen.current = next
      setOpen(next)
    },
    [cancelClose],
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={label}
        /* `align-middle` centres on the x-height midpoint, ~0.11em below the centre of the cap band
           the eye reads a label by, so the marker sits visibly low. Lift it back. */
        className="ml-1 inline-flex -translate-y-[0.11em] align-middle text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        onMouseEnter={openFromPointer}
        onMouseLeave={closeFromPointer}
      >
        <Info aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[min(20rem,calc(100vw-2rem))] p-3 text-sm font-normal leading-snug [&_h5]:mb-1 [&_h5]:text-xs [&_h5]:font-semibold [&_h5]:uppercase [&_h5]:tracking-wide [&_h5]:text-muted-foreground [&_strong]:font-semibold"
        onMouseEnter={openFromPointer}
        onMouseLeave={closeFromPointer}
        onOpenAutoFocus={(event) => {
          if (!focusOnOpen.current) event.preventDefault()
        }}
        /* Sanitized on the server by every caller. */
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Popover>
  )
}
