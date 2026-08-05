'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { useMemo } from 'react'
import { StationNowTable } from './StationNowTable'
import { TABLE_WINDOWS } from './StationRangeTabs'
import { convertStationTable } from './stationTableUnits'
import { UnitToggle, useUnitSystem } from './UnitToggle'

// Window changes navigate (the table is server-built per window); unit changes
// convert client-side.
function TableWindowPicker({ activeKey }: { activeKey: string }) {
  return (
    <div className="flex gap-1">
      {TABLE_WINDOWS.map((w) => (
        <Link
          key={w.key}
          href={`?range=table&window=${w.key}`}
          aria-current={w.key === activeKey ? 'true' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            w.key === activeKey
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {w.label}
        </Link>
      ))}
    </div>
  )
}

export function StationTableView({
  table,
  activeWindowKey,
}: {
  table: StationTable
  activeWindowKey: string
}) {
  const [unitSystem, changeUnitSystem] = useUnitSystem()
  const display = useMemo(() => convertStationTable(table, unitSystem), [table, unitSystem])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableWindowPicker activeKey={activeWindowKey} />
        <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
      </div>
      <StationNowTable table={display} elevationUnit={unitSystem === 'metric' ? ' m' : undefined} />
    </div>
  )
}
