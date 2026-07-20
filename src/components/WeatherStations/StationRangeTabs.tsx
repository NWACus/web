import { cn } from '@/utilities/ui'
import Link from 'next/link'

export const STATION_RANGES = [
  { key: '24h', label: 'Last 24 Hours', hours: 24 },
  { key: '7d', label: 'Last 7 Days', hours: 24 * 7 },
] as const

export type StationRange = (typeof STATION_RANGES)[number]

export function resolveStationRange(param: string | undefined): StationRange {
  return STATION_RANGES.find((range) => range.key === param) ?? STATION_RANGES[0]
}

export function StationRangeTabs({ activeKey }: { activeKey: string }) {
  return (
    <nav className="flex gap-1 border-b" aria-label="Station views">
      <>
        {STATION_RANGES.map((range) => (
          <Link
            key={range.key}
            href={`?range=${range.key}`}
            aria-current={range.key === activeKey ? 'true' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              range.key === activeKey
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {range.label}
          </Link>
        ))}
      </>
      <Link
        href={`?range=csv`}
        aria-current={'csv' === activeKey ? 'true' : undefined}
        className={cn(
          '-mb-px ml-auto border-b-2 px-3 py-2 text-sm font-medium',
          'csv' === activeKey
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        Download CSV
      </Link>
    </nav>
  )
}
