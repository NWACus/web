import { TableHeader } from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import type { ComponentProps, ReactNode } from 'react'

// shadcn's Table wraps every table in an `overflow-auto` div, which is what a
// sticky header resolves against, and it exposes no way to reach that div. This
// is the same wrapper with the frozen-header layout on it, so ui/table.tsx can
// stay as upstream ships it.
//
// Below xl the wrapper is capped at the viewport so it scrolls vertically too
// and the header sticks inside it, under the 4rem sticky site header on phones.
// From xl every station table fits its container (the widest, accumulated
// precipitation, is ~1140px in a 1216px container), so the wrapper stops
// scrolling and the header sticks to the viewport as the page scrolls instead.
//
// A table of plain text has nothing tabbable inside, so a wrapper that scrolls
// can't be reached by keyboard without being a focusable region (WCAG 2.1.1).
export function StationTableFrame({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="relative w-full max-h-[calc(100dvh-5rem)] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-h-[calc(100dvh-2rem)] xl:max-h-none xl:overflow-visible"
    >
      <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
    </div>
  )
}

// Collapsed row borders don't travel with a stuck header, so the cells draw
// their own bottom rule.
export function StationTableHeader({ className, ...props }: ComponentProps<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn(
        'sticky top-0 z-20 bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)]',
        className,
      )}
      {...props}
    />
  )
}
