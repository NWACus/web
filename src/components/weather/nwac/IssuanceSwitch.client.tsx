'use client'

/**
 * Shows one of a day's issuances at a time, newest first, with a Morning / Afternoon switch when
 * there is more than one. The panels are rendered on the server; this only picks which is shown,
 * and print follows the pick.
 */
import { useState, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export interface IssuancePanel {
  key: string
  label: string
  /** Issue time, e.g. "3:03 PM". */
  time: string | null
  content: ReactNode
}

export function IssuanceSwitch({ panels }: { panels: IssuancePanel[] }) {
  const [active, setActive] = useState(panels[0]?.key)

  return (
    <div className="space-y-4">
      {panels.length > 1 && (
        <ToggleGroup
          type="single"
          value={active}
          // Radix clears the value when the pressed item is pressed again; keep one shown.
          onValueChange={(value) => value && setActive(value)}
          aria-label="Issuance"
          className="inline-flex rounded-md bg-muted p-1 print:hidden"
        >
          {panels.map((p) => (
            <ToggleGroupItem
              key={p.key}
              value={p.key}
              size="sm"
              className="font-semibold data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {p.label}
              {p.time && <span className="font-normal text-muted-foreground">{p.time}</span>}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {panels.map((p) => (
        <div key={p.key} hidden={p.key !== active}>
          {p.content}
        </div>
      ))}
    </div>
  )
}
