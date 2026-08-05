import { cn } from '@/utilities/ui'
import Link from 'next/link'
import type { GraphWindow } from './stationGraphPresets'
import { GRAPH_WINDOWS } from './stationGraphPresets'

// The table shares the graphs' window picker, capped at 30 days: longer graph
// windows aggregate to daily rows, which a row-per-observation table can't do.
const TABLE_WINDOW_KEYS = ['24h', '7d', '30d']

export const TABLE_WINDOWS: GraphWindow[] = GRAPH_WINDOWS.filter((w) =>
  TABLE_WINDOW_KEYS.includes(w.key),
)

export function resolveTableWindow(param: string | undefined): GraphWindow {
  return TABLE_WINDOWS.find((w) => w.key === param) ?? TABLE_WINDOWS[0]
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
      <TabLink tabKey="table" label="Table" activeKey={activeKey} />
      <TabLink tabKey="graphs" label="Graphs" activeKey={activeKey} />
      <TabLink tabKey="csv" label="Download" activeKey={activeKey} />
    </nav>
  )
}
