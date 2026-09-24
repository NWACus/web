import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/utilities/ui'
import { ChartLine, Table2 } from 'lucide-react'
import Link from 'next/link'

// The widget modal's "Area Tables" and "Area Plots": the station page that shows this station
// alongside its neighbours, with the editor's columns.
export function StationAreaLinks({
  href,
  compact = false,
  className,
}: {
  href: string
  /** The map card's size, which opens in a new tab so the map keeps its selection. */
  compact?: boolean
  className?: string
}) {
  const linkProps = compact ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const buttonClass = cn(compact && 'h-7 px-2.5 text-xs')
  const iconClass = cn('mr-1.5 h-4 w-4', compact && 'mr-1 h-3 w-3')
  return (
    <ButtonGroup aria-label="Open the area's station page" className={className}>
      <Button asChild size="sm" variant="outline" className={buttonClass}>
        <Link href={href} {...linkProps}>
          <Table2 className={iconClass} aria-hidden="true" />
          Area Tables
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className={buttonClass}>
        <Link href={`${href}?range=graphs`} {...linkProps}>
          <ChartLine className={iconClass} aria-hidden="true" />
          Area Graphs
        </Link>
      </Button>
    </ButtonGroup>
  )
}
