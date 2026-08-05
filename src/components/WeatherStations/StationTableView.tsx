'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import { useMemo } from 'react'
import { ChipGroup } from './ChipGroup'
import { StationNowTable } from './StationNowTable'
import { TABLE_WINDOWS } from './StationRangeTabs'
import { convertStationTable } from './stationTableUnits'
import { UnitToggle, useUnitSystem } from './UnitToggle'

// Window chips navigate (the table is server-built per window); unit changes
// convert client-side.
const TABLE_WINDOW_CHIPS = TABLE_WINDOWS.map((w) => ({
  key: w.key,
  label: w.label,
  href: `?range=table&window=${w.key}`,
}))

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
        <ChipGroup chips={TABLE_WINDOW_CHIPS} activeKey={activeWindowKey} />
        <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
      </div>
      <StationNowTable table={display} elevationUnit={unitSystem === 'metric' ? ' m' : undefined} />
    </div>
  )
}
