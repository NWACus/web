'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

import type { GlossaryEntry } from '@/services/glossary/glossaryEntry'
import { useAnalytics } from '@/utilities/useAnalytics'

import { POPOVER_ATTR, TERM_ATTR } from './markGlossaryTerms'
import { listenForTermEvents, termFrom, type ActiveTerm, type TermControls } from './termEvents'

/** Grace period for the pointer to travel from a term into its popover before it closes. */
const HOVER_CLOSE_DELAY_MS = 150

/** Which term, if any, has its definition open, driven by events delegated from the document. */
function useActiveTerm(entries: GlossaryEntry[], contentRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<ActiveTerm | null>(null)
  const activeRef = useRef<ActiveTerm | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  // The listeners are registered once and read the current term through this.
  useLayoutEffect(() => {
    activeRef.current = active
  }, [active])

  const controls = useMemo<TermControls>(() => {
    const cancelClose = () => window.clearTimeout(closeTimer.current)
    return {
      // A corrected forecast rewrites the prose, taking the open term with it; that term is over.
      active: () => (activeRef.current?.element.isConnected ? activeRef.current : null),
      open: (element, via, focusContent = false) => {
        cancelClose()
        const index = Number(element.getAttribute(TERM_ATTR))
        if (entries[index]) setActive({ element, index, via, focusContent })
      },
      close: () => {
        cancelClose()
        setActive(null)
      },
      scheduleClose: () => {
        cancelClose()
        closeTimer.current = window.setTimeout(() => setActive(null), HOVER_CLOSE_DELAY_MS)
      },
      cancelClose,
      contentContains: (node) => contentRef.current?.contains(node) ?? false,
    }
  }, [entries, contentRef])

  useEffect(() => {
    const stopListening = listenForTermEvents(document, controls)
    return () => {
      stopListening()
      controls.cancelClose()
    }
  }, [controls])

  return { active, controls }
}

/**
 * The popover renders into a holder right after the term, so in the tab order and to a screen
 * reader its content follows the word it defines. The content is position: fixed, so the empty
 * holder takes no space.
 */
function usePopoverHolder(term: HTMLElement | null, contentId: string): HTMLElement | null {
  const [holder, setHolder] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!term) return
    const span = document.createElement('span')
    span.setAttribute(POPOVER_ATTR, '')
    term.after(span)
    setHolder(span)
    term.setAttribute('aria-expanded', 'true')
    term.setAttribute('aria-controls', contentId)
    return () => {
      span.remove()
      setHolder(null)
      term.setAttribute('aria-expanded', 'false')
      term.removeAttribute('aria-controls')
    }
  }, [term, contentId])

  return holder
}

/**
 * Keyboard activation moves focus into the popover so its link is reachable. An effect rather than
 * part of opening, because Enter on a term already previewed by focus does not reopen it.
 */
function useFocusOnKeyboardOpen(
  active: ActiveTerm | null,
  holder: HTMLElement | null,
  contentRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active?.focusContent || !holder) return
    const content = contentRef.current
    ;(content?.querySelector('a') ?? content)?.focus()
  }, [active, holder, contentRef])
}

/** Widget parity: the legacy widget reported every glossary hover and click. */
function useTrackOpenedTerm(active: ActiveTerm | null, entries: GlossaryEntry[]) {
  const { captureWithTenant } = useAnalytics()
  // useAnalytics hands back a new function every render; the event fires per opening, not render.
  const capture = useRef(captureWithTenant)
  useLayoutEffect(() => {
    capture.current = captureWithTenant
  })

  useEffect(() => {
    if (!active) return
    capture.current('forecast_glossary_term_opened', {
      term: entries[active.index].term,
      via: active.via,
    })
  }, [active, entries])
}

/** One popover for every marked term, anchored to whichever is active. */
export function GlossaryPopover({ entries }: { entries: GlossaryEntry[] }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()
  const { active, controls } = useActiveTerm(entries, contentRef)
  const holder = usePopoverHolder(active?.element ?? null, contentId)
  useFocusOnKeyboardOpen(active, holder, contentRef)
  useTrackOpenedTerm(active, entries)

  if (!active || !holder) return null
  return (
    <GlossaryDefinition
      active={active}
      entry={entries[active.index]}
      holder={holder}
      contentId={contentId}
      contentRef={contentRef}
      controls={controls}
    />
  )
}

function GlossaryDefinition({
  active,
  entry,
  holder,
  contentId,
  contentRef,
  controls,
}: {
  active: ActiveTerm
  entry: GlossaryEntry
  holder: HTMLElement
  contentId: string
  contentRef: RefObject<HTMLDivElement | null>
  controls: TermControls
}) {
  const anchorRef = useMemo(() => ({ current: active.element }), [active.element])

  return (
    <PopoverPrimitive.Root
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) controls.close()
      }}
    >
      <PopoverPrimitive.Anchor virtualRef={anchorRef} />
      <PopoverPrimitive.Portal container={holder}>
        <PopoverPrimitive.Content
          ref={contentRef}
          id={contentId}
          aria-label={entry.term}
          side="bottom"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={() => {
            if (contentRef.current?.contains(document.activeElement)) active.element.focus()
          }}
          // The term's own click handler decides whether a click on a term toggles or switches.
          onInteractOutside={(event) => {
            if (termFrom(event.target)) event.preventDefault()
          }}
          onPointerEnter={controls.cancelClose}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse' && active.via === 'hover') controls.scheduleClose()
          }}
          // The content sits inside the authored paragraph, so reset what it could inherit.
          className="not-prose z-50 block w-72 text-left font-sans normal-case not-italic leading-normal tracking-normal max-w-[calc(100vw-1rem)] rounded-md border bg-popover p-3 text-sm font-normal text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 print:hidden"
        >
          <span className="block">{entry.definition}</span>
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              // Tabbable only once pinned: every previewed term would otherwise add a second tab
              // stop, doubling the walk through a long discussion.
              tabIndex={active.via === 'pinned' ? undefined : -1}
              className="mt-2 block font-medium text-primary underline underline-offset-4"
            >
              Learn more on avalanche.org →
            </a>
          )}
          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
