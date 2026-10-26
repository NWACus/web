'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Filter, FilterX } from 'lucide-react'
import { forwardRef } from 'react'

type FiltersButtonProps = Omit<ButtonProps, 'children' | 'variant' | 'className'> & {
  hasActiveFilters: boolean
}

/** The full-width "Filters" button that opens a list page's filters below its desktop breakpoint. */
export const FiltersButton = forwardRef<HTMLButtonElement, FiltersButtonProps>(
  ({ hasActiveFilters, ...props }, ref) => (
    <Button ref={ref} variant="outline" className="w-full" {...props}>
      <div className="flex items-center gap-2">
        <span>Filters</span>
        {hasActiveFilters ? <FilterX width={16} /> : <Filter width={16} />}
      </div>
    </Button>
  ),
)
FiltersButton.displayName = 'FiltersButton'
