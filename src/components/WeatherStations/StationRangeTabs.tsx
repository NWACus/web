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

function TabLink({
  tabKey,
  label,
  activeKey,
  className,
}: {
  tabKey: string
  label: string
  activeKey: string
  className?: string
}) {
  const active = tabKey === activeKey
  return (
    <Link
      href={`?range=${tabKey}`}
      aria-current={active ? 'true' : undefined}
      className={cn(
        '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {label}
    </Link>
  )
}

export function StationRangeTabs({ activeKey }: { activeKey: string }) {
  return (
    <nav className="flex gap-1 border-b" aria-label="Station views">
      {STATION_RANGES.map((range) => (
        <TabLink key={range.key} tabKey={range.key} label={range.label} activeKey={activeKey} />
      ))}
      <TabLink tabKey="graphs" label="Graphs" activeKey={activeKey} />
      <TabLink tabKey="csv" label="Download CSV" activeKey={activeKey} className="ml-auto" />
    </nav>
  )
}
