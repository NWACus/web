'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
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
    <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
      <DrawerTrigger
        render={<FiltersButton hasActiveFilters={hasActiveFilters} aria-label="Open filters" />}
      />

      {/* The filters stay mounted while closed so they keep their state. */}
      <DrawerContent keepMounted className="h-[90dvh] max-h-none">
        <DrawerHeader className="cursor-grab select-none border-b border-gray-200 active:cursor-grabbing">
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="px-6">{children}</DrawerBody>

        <DrawerFooter className="border-t">
          <DrawerClose render={<Button variant="callout" className="w-full px-4 py-3" />}>
            Show {docCount} {docLabel}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
