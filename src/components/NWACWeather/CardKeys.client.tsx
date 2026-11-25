'use client'

import { Info } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

import { PhoneKey, type PhoneKeyKind } from './Values'

const CardKeyContext = createContext<{
  open: PhoneKeyKind | null
  toggle: (kind: PhoneKeyKind) => void
} | null>(null)

/** A phone card's keys: one open at a time, under the label that opened it. */
export function CardKeys({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<PhoneKeyKind | null>(null)
  const toggle = (kind: PhoneKeyKind) => setOpen((cur) => (cur === kind ? null : kind))
  return <CardKeyContext.Provider value={{ open, toggle }}>{children}</CardKeyContext.Provider>
}

function useCardKeys() {
  const ctx = useContext(CardKeyContext)
  if (!ctx) throw new Error('KeyButton and KeyRow belong inside CardKeys')
  return ctx
}

/** A label with a trailing info icon that toggles `kind`'s key; fills its cell (`h-px p-0`). */
export function KeyButton({
  kind,
  unit,
  unitBelow = false,
  className,
  children,
}: {
  kind: PhoneKeyKind
  /** On one line with the icon: the space before it is where a label wraps. */
  unit: string
  /** The unit and icon on their own centered line, as in a column head. */
  unitBelow?: boolean
  className?: string
  children: ReactNode
}) {
  const { open, toggle } = useCardKeys()
  return (
    <button
      type="button"
      aria-expanded={open === kind}
      onClick={() => toggle(kind)}
      className={cn(
        'flex h-full min-h-11 w-full items-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        unitBelow ? 'justify-center text-center' : 'text-left',
        className,
      )}
    >
      <span>
        {children}{' '}
        <span className={cn('whitespace-nowrap', unitBelow && 'block')}>
          <span className="font-normal text-muted-foreground">({unit})</span>
          <Info
            aria-hidden="true"
            className={cn(
              'ml-1 inline-block size-3.5 align-[-0.125em]',
              open === kind ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          <span className="sr-only"> key</span>
        </span>
      </span>
    </button>
  )
}

/** `kind`'s key across the card, while it's open. */
export function KeyRow({ kind, colSpan }: { kind: PhoneKeyKind; colSpan: number }) {
  const { open } = useCardKeys()
  if (open !== kind) return null
  return (
    <tr>
      <td colSpan={colSpan} className="border-t bg-muted px-3 py-2">
        <PhoneKey kind={kind} />
      </td>
    </tr>
  )
}
