'use client'

/**
 * The danger scale's open/close, animated: a native `<details>` can't animate its closing, so this
 * is a one-item Radix accordion. `action` sits over the trigger's row rather than inside the button,
 * so following it never toggles the table.
 */
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import type { ReactNode } from 'react'

interface DangerScaleDisclosureProps {
  /** Always visible; clicking it opens and closes `children`. */
  trigger: ReactNode
  /** Pinned to the trigger's top-right corner, e.g. the "Learn more" link. */
  action: ReactNode
  children: ReactNode
}

export function DangerScaleDisclosure({ trigger, action, children }: DangerScaleDisclosureProps) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="text-xs">
      <AccordionPrimitive.Item value="definitions" className="group relative">
        <AccordionPrimitive.Header asChild>
          <div>
            <AccordionPrimitive.Trigger className="w-full cursor-pointer select-none space-y-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {trigger}
            </AccordionPrimitive.Trigger>
          </div>
        </AccordionPrimitive.Header>
        <div className="absolute right-0 top-0">{action}</div>
        <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
          {children}
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
