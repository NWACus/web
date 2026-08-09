'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import { useMemo } from 'react'
import { ChipGroup } from './ChipGroup'
import { StationNowTable } from './StationNowTable'
import { TABLE_PERIODS } from './stationPeriods'
import { convertStationTable } from './stationTableUnits'
import { UnitToggle, useUnitSystem } from './UnitToggle'

const TABLE_PERIOD_CHIPS = TABLE_PERIODS.map((p) => ({
  key: p.key,
  label: p.label,
  href: `?range=table&period=${p.key}`,
}))

export function StationTableView({
  table,
  activePeriodKey,
}: {
  table: StationTable
  activePeriodKey: string
}) {
  const [unitSystem, changeUnitSystem] = useUnitSystem()
  const display = useMemo(() => convertStationTable(table, unitSystem), [table, unitSystem])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipGroup chips={TABLE_PERIOD_CHIPS} activeKey={activePeriodKey} />
        <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
      </div>
      <StationNowTable table={display} elevationUnit={unitSystem === 'metric' ? ' m' : undefined} />
    </div>
  )
}
