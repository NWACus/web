'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

import { ExternalLink } from '@/components/forecast/ExternalLink'
import type { GlossaryEntry } from '@/services/glossary/glossaryEntry'

import { POPOVER_ATTR, TERM_ATTR } from './markGlossaryTerms'
import { listenForTermEvents, termFrom, type ActiveTerm, type TermControls } from './termEvents'

/** Grace period for the pointer to travel from a term into its popover before it closes. */
const HOVER_CLOSE_DELAY_MS = 300
/**
 * How long the pointer must rest on another term before a hover preview switches to it. The popover
 * covers the lines below its term, so the way into it often crosses other terms.
 */
const HOVER_SWITCH_DELAY_MS = 250

/** Which term, if any, has its definition open, driven by events delegated from the document. */
function useActiveTerm(entries: GlossaryEntry[], contentRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<ActiveTerm | null>(null)
  const activeRef = useRef<ActiveTerm | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const switchTimer = useRef<number | undefined>(undefined)

  // The listeners are registered once and read the current term through this.
  useLayoutEffect(() => {
    activeRef.current = active
  }, [active])

  const controls = useMemo<TermControls>(() => {
    const hold = () => {
      window.clearTimeout(closeTimer.current)
      window.clearTimeout(switchTimer.current)
    }
    const open: TermControls['open'] = (element, via, focusContent = false) => {
      hold()
      const index = Number(element.getAttribute(TERM_ATTR))
      if (entries[index]) setActive({ element, index, via, focusContent })
    }
    return {
      // A corrected forecast rewrites the prose, taking the open term with it; that term is over.
      active: () => (activeRef.current?.element.isConnected ? activeRef.current : null),
      open,
      close: () => {
        hold()
        setActive(null)
      },
      scheduleClose: () => {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = window.setTimeout(() => setActive(null), HOVER_CLOSE_DELAY_MS)
      },
      scheduleSwitch: (element) => {
        window.clearTimeout(switchTimer.current)
        switchTimer.current = window.setTimeout(() => open(element, 'hover'), HOVER_SWITCH_DELAY_MS)
      },
      cancelSwitch: () => window.clearTimeout(switchTimer.current),
      hold,
      contentContains: (node) => contentRef.current?.contains(node) ?? false,
    }
  }, [entries, contentRef])

  useEffect(() => {
    const stopListening = listenForTermEvents(document, controls)
    return () => {
      stopListening()
      controls.hold()
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

/** One popover for every marked term, anchored to whichever is active. */
export function GlossaryPopover({ entries }: { entries: GlossaryEntry[] }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()
  const { active, controls } = useActiveTerm(entries, contentRef)
  const holder = usePopoverHolder(active?.element ?? null, contentId)
  useFocusOnKeyboardOpen(active, holder, contentRef)

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
          onPointerEnter={controls.hold}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse' && active.via === 'hover') controls.scheduleClose()
          }}
          // The content sits inside the authored paragraph, so reset what it could inherit. The
          // `before:` strip bridges the gap to the term (sideOffset plus the 5px arrow), so the
          // pointer never leaves both the term and the popover on its way across.
          className="not-prose relative z-50 block w-72 before:absolute before:inset-x-0 before:h-3 before:content-[''] data-[side=bottom]:before:bottom-full data-[side=top]:before:top-full text-left font-sans normal-case not-italic leading-normal tracking-normal max-w-[calc(100vw-1rem)] rounded-md border bg-popover p-3 text-sm font-normal text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 print:hidden"
        >
          <Definition entry={entry} linkTabbable={active.via === 'pinned'} />
          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function Definition({ entry, linkTabbable }: { entry: GlossaryEntry; linkTabbable: boolean }) {
  return (
    <span className="block">
      {entry.definition}
      {entry.link && ' '}
      {entry.link && (
        <ExternalLink
          href={entry.link}
          // Tabbable only once pinned: every previewed term would otherwise add a second tab stop,
          // doubling the walk through a long discussion.
          tabIndex={linkTabbable ? undefined : -1}
          className="font-medium text-primary underline hover:underline"
        >
          Learn more
          <span className="sr-only"> about {entry.term} (opens in a new tab)</span>
        </ExternalLink>
      )}
    </span>
  )
}
