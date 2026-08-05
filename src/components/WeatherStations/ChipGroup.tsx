'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'

export type ChipItem = {
  key: string
  label: string
  /** Link chips navigate; without an href the chip is a button using onSelect. */
  href?: string
}

function chipClass(active: boolean): string {
  return cn(
    'rounded-md px-3 py-1.5 text-sm',
    active
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground hover:text-foreground',
  )
}

export function ChipGroup({
  chips,
  activeKey,
  onSelect,
}: {
  chips: ChipItem[]
  activeKey: string
  onSelect?: (key: string) => void
}) {
  return (
    <div className="flex gap-1">
      {chips.map((chip) =>
        chip.href ? (
          <Link
            key={chip.key}
            href={chip.href}
            aria-current={chip.key === activeKey ? 'true' : undefined}
            className={chipClass(chip.key === activeKey)}
          >
            {chip.label}
          </Link>
        ) : (
          <button
            key={chip.key}
            type="button"
            onClick={() => onSelect?.(chip.key)}
            aria-pressed={chip.key === activeKey}
            className={chipClass(chip.key === activeKey)}
          >
            {chip.label}
          </button>
        ),
      )}
    </div>
  )
}
