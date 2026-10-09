'use client'

/**
 * The forecast's help popover — the native equivalent of the legacy widget's ⓘ popovers, its
 * "Click to learn more" problem-type icon, and the weather table's "?" bubble. A real button, so it
 * opens on click, Enter and Space, closes on Escape and hands focus back to the trigger.
 *
 * The plain ⓘ also opens on hover, because it is read on both desktop and touch and a `title`
 * attribute reaches neither reliably; it is screen furniture, so it does not print. A custom
 * trigger (a problem-type icon) prints, and opens on click only: hovering it shows its hint.
 *
 * This is deliberately NOT the glossary tooltip system (issue 06) — it shows hardcoded/structural
 * help, or API text, whose HTML the server has already sanitized.
 */
import { Info } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Long enough to cross the gap between the trigger and the panel without the panel vanishing. */
const CLOSE_DELAY_MS = 150

interface InfoPopoverProps {
  /** Sanitized help HTML. */
  html: string
  /** The trigger's accessible name, e.g. `What "Ridgeline Wind Speed" means`. */
  label: string
  /** Trigger content in place of the ⓘ, e.g. a problem-type icon. */
  children?: ReactNode
  /** Shown over a custom trigger on hover or focus, e.g. "Click to learn more". */
  hint?: string
}

export function InfoPopover({ html, label, children, hint }: InfoPopoverProps) {
  const custom = children != null
  const { open, onOpenChange, hoverHandlers, onOpenAutoFocus } = useHoverPopover(!custom)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={label}
        className={custom ? customTriggerClass : infoTriggerClass}
        {...hoverHandlers}
      >
        {custom ? children : <Info aria-hidden className="size-4" />}
        {hint && <TriggerHint text={hint} />}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[min(20rem,calc(100vw-2rem))] p-3 text-left text-sm font-normal leading-snug [&_a]:font-medium [&_a]:underline [&_h5]:mb-1 [&_h5]:text-xs [&_h5]:font-semibold [&_h5]:uppercase [&_h5]:tracking-wide [&_h5]:text-muted-foreground [&_p:not(:last-child)]:mb-2 [&_strong]:font-semibold"
        {...hoverHandlers}
        onOpenAutoFocus={onOpenAutoFocus}
        /* Sanitized on the server by every caller. */
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Popover>
  )
}

/* `align-middle` centres on the x-height midpoint, ~0.11em below the centre of the cap band the eye
   reads a label by, so the marker sits visibly low. Lift it back. */
const infoTriggerClass =
  'ml-1 inline-flex -translate-y-[0.11em] align-middle text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 print:hidden'

const customTriggerClass =
  'group relative inline-block cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

/** A small label under the trigger while it is hovered or focused, and gone once the panel opens. */
function TriggerHint({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-normal text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[state=open]:hidden print:hidden"
    >
      {text}
    </span>
  )
}

/**
 * Open/close state for a popover that may also open on hover. A pointer-opened panel must not
 * steal focus; a click- or keyboard-opened one should take it.
 */
function useHoverPopover(opensOnHover: boolean) {
  const [open, setOpen] = useState(false)
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
  const onOpenChange = useCallback(
    (next: boolean) => {
      cancelClose()
      focusOnOpen.current = next
      setOpen(next)
    },
    [cancelClose],
  )

  const onOpenAutoFocus = useCallback((event: Event) => {
    if (!focusOnOpen.current) event.preventDefault()
  }, [])

  const hoverHandlers = opensOnHover
    ? { onMouseEnter: openFromPointer, onMouseLeave: closeFromPointer }
    : {}

  return { open, onOpenChange, hoverHandlers, onOpenAutoFocus }
}
