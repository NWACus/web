'use client'

/**
 * One of a day's issuances at a time, newest first, with a Morning / Afternoon switch beside the
 * heading when there are two, and the shown issuance's `meta` in a full-width row beneath.
 */
import { useEffect, useState, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export interface IssuancePanel {
  key: string
  label: string
  /** Issue time, e.g. "3:03 PM". */
  time: string | null
  /** Shown under the `heading` while this issuance is. */
  meta?: ReactNode
  /** The prefix of this issuance's section anchors (`afternoon` in `#afternoon-snow`). */
  anchor?: string
  content: ReactNode
}

function Switch({
  panels,
  active,
  onPick,
}: {
  panels: IssuancePanel[]
  active: string | undefined
  onPick: (key: string) => void
}) {
  if (panels.length < 2) return null
  return (
    <ToggleGroup
      type="single"
      value={active}
      // Radix clears the value when the pressed item is pressed again; keep one shown.
      onValueChange={(value) => value && onPick(value)}
      aria-label="Issuance"
      className="grid grid-cols-2 rounded-md bg-muted p-1 print:hidden sm:inline-flex"
    >
      {/* Panels come newest first; the buttons read in time order, Morning before Afternoon. */}
      {[...panels].reverse().map((p) => (
        <ToggleGroupItem
          key={p.key}
          value={p.key}
          size="sm"
          className="whitespace-nowrap font-semibold data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {p.label}
          {p.time && (
            // No room beside Latest on a phone; the issued line has the time.
            <span className="hidden font-normal text-muted-foreground sm:inline">{p.time}</span>
          )}
          {p.key === panels[0].key && (
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-900">
              Latest
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Opens the issuance a `#morning-…` anchor points into, then scrolls to it. */
function useAnchoredPanel(panels: IssuancePanel[], setActive: (key: string) => void) {
  const anchors = panels.map((p) => `${p.key}:${p.anchor ?? ''}`).join(' ')
  useEffect(() => {
    const open = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1))
      const panel = panels.find((p) => p.anchor && hash.startsWith(`${p.anchor}-`))
      if (!panel) return
      setActive(panel.key)
      // The target was hidden when the browser tried to scroll to it.
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView())
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
    // `anchors` stands in for `panels`, which is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchors, setActive])
}

export function IssuanceSwitch({
  panels,
  heading,
}: {
  panels: IssuancePanel[]
  heading: ReactNode
}) {
  const [active, setActive] = useState(panels[0]?.key)
  const shown = (p: IssuancePanel) => p.key === active
  useAnchoredPanel(panels, setActive)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        {heading}
        <Switch panels={panels} active={active} onPick={setActive} />
      </header>
      {panels.map(
        (p) =>
          p.meta && (
            <div key={p.key} hidden={!shown(p)}>
              {p.meta}
            </div>
          ),
      )}
      {panels.map((p) => (
        <div key={p.key} hidden={!shown(p)}>
          {p.content}
        </div>
      ))}
    </div>
  )
}
