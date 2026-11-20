'use client'

import { Info } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

import { PhoneKey, type PhoneKeyKind } from './Values'

type OpenKey = { kind: PhoneKeyKind; hit: number | null }

const CardKeyContext = createContext<{
  open: OpenKey | null
  toggle: (kind: PhoneKeyKind, hit?: number | null) => void
} | null>(null)

/** A phone card's keys: one open at a time, under its row, with the tapped value's step marked. */
export function CardKeys({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OpenKey | null>(null)
  const toggle = (kind: PhoneKeyKind, hit: number | null = null) =>
    setOpen((cur) => (cur?.kind === kind && cur.hit === hit ? null : { kind, hit }))
  return <CardKeyContext.Provider value={{ open, toggle }}>{children}</CardKeyContext.Provider>
}

function useCardKeys() {
  const ctx = useContext(CardKeyContext)
  if (!ctx) throw new Error('KeyButton and KeyRow belong inside CardKeys')
  return ctx
}

/** Opens `kind`'s key: a row label with a trailing info icon, or a value marking its `hit` step. */
export function KeyButton({
  kind,
  hit,
  className,
  children,
}: {
  kind: PhoneKeyKind
  hit?: number | null
  className?: string
  children: ReactNode
}) {
  const { open, toggle } = useCardKeys()
  const label = hit === undefined
  return (
    <button
      type="button"
      aria-expanded={open?.kind === kind}
      onClick={() => toggle(kind, hit)}
      className={cn(label ? 'text-left font-semibold' : 'block w-full', className)}
    >
      {children}
      {label && (
        <>
          <Info
            aria-hidden="true"
            className={cn(
              // Inline, so it trails the label's last word when the label wraps.
              'ml-1 inline-block size-3.5 align-[-0.125em]',
              open?.kind === kind ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          <span className="sr-only"> key</span>
        </>
      )}
    </button>
  )
}

/** `kind`'s key across the card, while it's open. */
export function KeyRow({ kind, colSpan }: { kind: PhoneKeyKind; colSpan: number }) {
  const { open } = useCardKeys()
  if (open?.kind !== kind) return null
  return (
    <tr>
      <td colSpan={colSpan} className="border-t bg-muted/40 px-3 py-2">
        <PhoneKey kind={kind} hit={open.hit} />
      </td>
    </tr>
  )
}
