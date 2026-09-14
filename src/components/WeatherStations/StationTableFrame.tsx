import { TableHeader } from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import type { ComponentProps, ReactNode } from 'react'

// A sticky header sticks to the nearest scroll container. Below xl that's this
// wrapper, capped at the viewport so it scrolls vertically too; from xl every
// station table fits its container (the widest is ~1140px in 1216px), so the
// wrapper stops scrolling and the header sticks to the page. The region makes
// the box reachable by keyboard.
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

// Sticky lives on the cells: a sticky thead lags behind a fling on iOS. The
// corner cell stacks above the rest so the other headers slide under it.
// Collapsed row borders don't move with a stuck header, so cells draw their own.
export function StationTableHeader({ className, ...props }: ComponentProps<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn(
        '[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)] [&_th:first-child]:z-30',
        className,
      )}
      {...props}
    />
  )
}
