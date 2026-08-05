'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import { useMemo } from 'react'
import { StationNowTable } from './StationNowTable'
import { convertStationTable } from './stationTableUnits'
import { UnitToggle, useUnitSystem } from './UnitToggle'

// The station table with the shared imperial/metric toggle; conversion happens
// client-side so the server-rendered table data stays single-variant.
export function StationTableView({ table }: { table: StationTable }) {
  const [unitSystem, changeUnitSystem] = useUnitSystem()
  const display = useMemo(() => convertStationTable(table, unitSystem), [table, unitSystem])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
      </div>
      <StationNowTable table={display} elevationUnit={unitSystem === 'metric' ? ' m' : undefined} />
    </div>
  )
}
