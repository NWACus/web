'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { UnitSystem } from '@/services/snowobs/units'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { StationLatestObservation } from './StationLatestObservation'
import { StationNowTable } from './StationNowTable'
import type { DateRange } from './stationPeriods'
import {
  resolveTablePeriod,
  TABLE_MAX_CUSTOM_DAYS,
  TABLE_PERIODS,
  todayInZone,
} from './stationPeriods'
import { StationRangePicker } from './StationRangePicker'
import { StationViewBar } from './StationViewBar'
import { UnitToggle, useUnitSystem } from './UnitToggle'

const tableHref = (key: string) => `?range=table&period=${key}`

function TableRangePicker({
  activePeriodKey,
  customRange,
  timeZone,
}: {
  activePeriodKey: string
  customRange: DateRange | null
  timeZone: string
}) {
  const router = useRouter()
  return (
    <StationRangePicker
      periods={TABLE_PERIODS}
      activePeriod={resolveTablePeriod(activePeriodKey)}
      custom={customRange}
      periodHref={tableHref}
      onApplyCustom={({ from, to }) =>
        router.push(`?range=table&from=${from}&to=${to}`, { scroll: false })
      }
      maxDays={TABLE_MAX_CUSTOM_DAYS}
      timeZone={timeZone}
    />
  )
}

// A past range's last row is not the station's latest, so there is no staleness to flag.
function LatestObservation({
  table,
  customRange,
  timeZone,
}: {
  table: StationTable
  customRange: DateRange | null
  timeZone: string
}) {
  if (customRange && customRange.to < todayInZone(new Date(), timeZone)) return null
  return <StationLatestObservation table={table} />
}

export function StationTableView({
  tables,
  activePeriodKey,
  customRange,
  timeZone,
  tabs,
}: {
  /** Both systems, built server-side, so the unit toggle is instant. */
  tables: Record<UnitSystem, StationTable>
  /** The preset in force; a valid custom range overrides it. */
  activePeriodKey: string
  customRange: DateRange | null
  timeZone: string
  tabs?: ReactNode
}) {
  const [unitSystem, changeUnitSystem] = useUnitSystem()
  const table = tables[unitSystem]
  return (
    <div className="flex flex-col gap-2">
      {/* Not pinned: it would sit on top of the frozen table header. */}
      <StationViewBar pinned={false}>
        {tabs}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableRangePicker
            activePeriodKey={activePeriodKey}
            customRange={customRange}
            timeZone={timeZone}
          />
          <div className="flex flex-wrap items-center gap-3">
            <LatestObservation table={table} customRange={customRange} timeZone={timeZone} />
            <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
          </div>
        </div>
      </StationViewBar>
      <StationNowTable table={table} elevationUnit={unitSystem === 'metric' ? ' m' : undefined} />
    </div>
  )
}
