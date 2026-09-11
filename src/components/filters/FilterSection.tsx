'use client'

import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

type FilterSectionProps = {
  title: string
  titleClassName?: string
  defaultOpen?: boolean
  showBottomBorder?: boolean
  /** Controls beside the chevron, such as a "Clear" button. */
  actions?: React.ReactNode
  children: React.ReactNode
}

/** A collapsible, titled section of a filter sidebar: the shell every filter shares. */
export const FilterSection = ({
  title,
  titleClassName,
  defaultOpen = false,
  showBottomBorder = true,
  actions,
  children,
}: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={showBottomBorder ? 'border-b' : ''}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
      >
        <h3 className={cn('font-semibold', titleClassName)}>{title}</h3>
        <div className="flex items-center gap-2">
          {actions}
          <ChevronDown className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </div>
      {isOpen && children}
    </div>
  )
}
