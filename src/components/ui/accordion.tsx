'use client'

import { cn } from '@/utilities/ui'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown, PlusCircleIcon } from 'lucide-react'
import * as React from 'react'

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
))
AccordionItem.displayName = 'AccordionItem'

const iconMap = {
  'chevron-down': ChevronDown,
  plus: PlusCircleIcon,
} as const

export type AccordionIconType = keyof typeof iconMap

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    chevronClassName?: string
    icon?: AccordionIconType
    iconPosition?: 'left' | 'right'
  }
>(
  (
    {
      className,
      chevronClassName,
      icon = 'chevron-down',
      iconPosition = 'right',
      children,
      ...props
    },
    ref,
  ) => {
    const IconComponent = iconMap[icon]
    const IconElement = (
      <IconComponent
        className={cn(
          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
          chevronClassName,
        )}
      />
    )

    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180',
            className,
          )}
          {...props}
        >
          {iconPosition === 'left' && IconElement}
          {children}
          {iconPosition === 'right' && IconElement}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    )
  },
)
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
