'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { FiltersButton } from './FiltersButton'

/**
 * The bottom filter drawer the list pages share below their desktop breakpoint. It doesn't hide
 * itself at any width: each caller wraps it in the `hidden` class of its own breakpoint.
 */
type MobileFiltersDrawerProps = {
  docLabel: string
  docCount: number
  hasActiveFilters: boolean
  /** Drive the drawer from outside, e.g. to close it once a pick inside it is made. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const MobileFiltersDrawer = ({
  docLabel,
  docCount,
  hasActiveFilters,
  open,
  onOpenChange,
  children,
}: MobileFiltersDrawerProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = open ?? uncontrolledOpen
  const setIsOpen = (next: boolean) => {
    setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <>
      <FiltersButton
        hasActiveFilters={hasActiveFilters}
        onClick={() => setIsOpen(true)}
        aria-label="Open filters"
      />

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer: it stays mounted off-screen so it can slide, so keep it out of reach while closed. */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-out h-[90vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-12 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6">{children}</div>

        <div className="sticky bottom-0 px-4 py-4 border-t bg-white">
          <Button variant="callout" onClick={() => setIsOpen(false)} className="w-full px-4 py-3">
            Show {docCount} {docLabel}
          </Button>
        </div>
      </div>
    </>
  )
}
