'use client'

import { Button } from '@/components/ui/button'
import { Filter, FilterX } from 'lucide-react'
import { useState } from 'react'

type MobileFiltersDrawerProps = {
  docLabel: string
  docCount: number
  hasActiveFilters: boolean
  children: React.ReactNode
}

export const MobileFiltersDrawer = ({
  docLabel,
  docCount,
  hasActiveFilters,
  children,
}: MobileFiltersDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        aria-label="Open filters"
        className="w-full sm:w-1/2"
      >
        <div className="flex items-center gap-2">
          <span>Filters</span>
          {hasActiveFilters ? <FilterX width={16} /> : <Filter width={16} />}
        </div>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-out h-[90vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
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
