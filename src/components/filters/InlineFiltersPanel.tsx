'use client'

import { Button } from '@/components/ui/button'
import { useId, useRef, useState } from 'react'
import { FiltersButton } from './FiltersButton'

type InlineFiltersPanelProps = {
  docLabel: string
  docCount: number
  hasActiveFilters: boolean
  children: React.ReactNode
}

/**
 * The phone-width filters for embeds: they open in place under the Filters button. A bottom sheet
 * can't work in an iframe sized to its content, where `fixed` and `vh` resolve against the whole
 * iframe rather than the reader's screen.
 */
export const InlineFiltersPanel = ({
  docLabel,
  docCount,
  hasActiveFilters,
  children,
}: InlineFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setIsOpen(false)
    // The panel's height leaves with it, so bring the results' top back into view.
    buttonRef.current?.focus({ preventScroll: true })
    buttonRef.current?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div>
      <FiltersButton
        ref={buttonRef}
        hasActiveFilters={hasActiveFilters}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls={panelId}
      />
      <div
        id={panelId}
        role="region"
        aria-label="Filters"
        hidden={!isOpen}
        className="mt-2 rounded border bg-background"
      >
        <div className="px-4">{children}</div>
        <div className="border-t p-3">
          <Button variant="callout" onClick={close} className="w-full">
            Show {docCount} {docLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
