'use client'

import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import * as React from 'react'

import { cn } from '@/utilities/ui'

/**
 * shadcn's Base UI drawer (https://ui.shadcn.com/docs/components/base/drawer), ported to Tailwind 3
 * and cut down to a modal bottom sheet.
 */
const DrawerContext = React.createContext({ showSwipeHandle: false })

function Drawer({
  showSwipeHandle = false,
  onOpenChange,
  ...props
}: DrawerPrimitive.Root.Props & { showSwipeHandle?: boolean }) {
  const context = React.useMemo(() => ({ showSwipeHandle }), [showSwipeHandle])

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (open, details) => {
    // Radix prevents default when Escape closes a popover opened from inside the drawer. Base UI
    // ignores that and would close the drawer too.
    if (details.reason === 'escape-key' && details.event.defaultPrevented) {
      details.cancel()
      return
    }
    onOpenChange?.(open, details)
  }

  return (
    <DrawerContext.Provider value={context}>
      <DrawerPrimitive.Root onOpenChange={handleOpenChange} {...props} />
    </DrawerContext.Provider>
  )
}

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerClose = DrawerPrimitive.Close

function DrawerOverlay() {
  return (
    <DrawerPrimitive.Backdrop className="fixed inset-0 z-[60] min-h-dvh select-none bg-black/50 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-300 ease-out data-[ending-style]:pointer-events-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0 motion-reduce:transition-none print:hidden" />
  )
}

function DrawerSwipeHandle() {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 cursor-grab justify-center pb-1 pt-2 after:block after:h-1 after:w-12 after:rounded-full after:bg-gray-300 active:cursor-grabbing"
    />
  )
}

type DrawerContentProps = Omit<DrawerPrimitive.Popup.Props, 'className'> & {
  className?: string
  keepMounted?: boolean
}

function DrawerContent({ className, children, keepMounted, ...props }: DrawerContentProps) {
  const { showSwipeHandle } = React.useContext(DrawerContext)

  return (
    <DrawerPrimitive.Portal keepMounted={keepMounted}>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-[60] print:hidden">
        <DrawerPrimitive.Popup
          className={cn(
            'fixed inset-x-0 bottom-0 flex max-h-[calc(100dvh-6rem)] min-h-0 flex-col rounded-t-2xl bg-background text-foreground shadow-lg outline-none',
            '[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-300 ease-out data-[swiping]:select-none data-[swiping]:duration-0 motion-reduce:transition-none',
            'data-[starting-style]:[transform:translateY(calc(100%+2px))] data-[ending-style]:[transform:translateY(calc(100%+2px))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]',
            // Covers the gap below the sheet when it is pulled up past its open position.
            'after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-background',
            className,
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('shrink-0 px-6 py-4', className)} {...props} />
}

function DrawerTitle({
  className,
  ...props
}: DrawerPrimitive.Title.Props & { className?: string }) {
  return <DrawerPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />
}

/** The scrolling middle of the drawer. Mouse drags here select text instead of moving the drawer. */
function DrawerBody({
  className,
  ...props
}: DrawerPrimitive.Content.Props & { className?: string }) {
  return (
    <DrawerPrimitive.Content
      className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('shrink-0 px-4 py-4', className)} {...props} />
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
}
