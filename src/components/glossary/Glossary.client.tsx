'use client'

import {
  Component,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import { isGlossaryEntryList, type GlossaryEntry } from '@/services/glossary/glossaryEntry'

import { GlossaryPopover } from './GlossaryPopover.client'
import {
  buildGlossaryMatcher,
  markGlossaryTerms,
  READY_ATTR,
  TERM_ATTR,
  type GlossaryMatcher,
} from './markGlossaryTerms'

type Glossary = { entries: GlossaryEntry[]; matcher: GlossaryMatcher }

const GlossaryContext = createContext<Glossary | null>(null)

async function loadGlossary(signal: AbortSignal): Promise<Glossary | null> {
  const response = await fetch('/api/glossary', { signal })
  if (!response.ok) return null
  const data: unknown = await response.json()
  if (!isGlossaryEntryList(data)) return null
  const matcher = buildGlossaryMatcher(data)
  return matcher ? { entries: data, matcher } : null
}

/**
 * The forecast glossary for everything inside it: fetches the national term list once and shows
 * the definition popover. Mounted only for centers with the glossary turned on. The terms come
 * from `/api/glossary`, never from a prop, so they stay out of the page's cached payload (ADR 018).
 */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [glossary, setGlossary] = useState<Glossary | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadGlossary(controller.signal)
      .then(setGlossary)
      // Without the glossary the prose is still all there, just unmarked.
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <GlossaryContext.Provider value={glossary}>
      {children}
      {glossary && (
        <GlossaryErrorBoundary>
          <GlossaryPopover entries={glossary.entries} />
        </GlossaryErrorBoundary>
      )}
    </GlossaryContext.Provider>
  )
}

/**
 * Marks glossary terms in the authored HTML under `rootRef`, again whenever `html` changes (which
 * rewrites the subtree). A no-op outside a GlossaryProvider or before the terms arrive.
 */
export function useGlossaryMarks(rootRef: RefObject<HTMLElement | null>, html: string): void {
  const glossary = useContext(GlossaryContext)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !glossary) return

    try {
      markGlossaryTerms(root, glossary.matcher)
    } catch {
      // Authored HTML arrives from outside; a surprise in it costs the glossary, not the prose.
      return
    }

    // The first frame paints the transparent underline, so the second is a change the transition
    // can animate.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        root
          .querySelectorAll(`[${TERM_ATTR}]:not([${READY_ATTR}])`)
          .forEach((term) => term.setAttribute(READY_ATTR, ''))
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [glossary, html, rootRef])
}

/**
 * Sits above every forecast section, so a failure in the popover must not reach the page's error
 * page. The prose is untouched by the popover; losing it costs only the definitions.
 */
class GlossaryErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error('[GlossaryErrorBoundary] Glossary definitions unavailable:', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
