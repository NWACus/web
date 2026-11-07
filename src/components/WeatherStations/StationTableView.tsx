'use client'

import type { StationTable, StationTables } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import { useRouter } from 'next/navigation'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { OlderTableRows, useOlderTableRows, type OlderRows } from './OlderTableRows'
import { TabsWithLatest } from './StationLatestObservation'
import { StationNowTable } from './StationNowTable'
import type { DateRange } from './stationPeriods'
import {
  isPastRange,
  resolveTablePeriod,
  TABLE_MAX_CUSTOM_DAYS,
  TABLE_PERIODS,
} from './stationPeriods'
import { StationRangePicker } from './StationRangePicker'
import { StationViewBar } from './StationViewBar'
import { UnitToggle, useStationUnits } from './UnitToggle'

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
      onSelectPeriod={(key) => router.push(`?range=table&period=${key}`, { scroll: false })}
      onApplyCustom={({ from, to }) =>
        router.push(`?range=table&from=${from}&to=${to}`, { scroll: false })
      }
      maxDays={TABLE_MAX_CUSTOM_DAYS}
      timeZone={timeZone}
      align="start"
    />
  )
}

// Publishes the pinned bar's height so the table's header pins just below it.
function useBarHeightVar(
  wrapperRef: RefObject<HTMLDivElement | null>,
  barRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const wrapper = wrapperRef.current
    const bar = barRef.current
    if (!wrapper || !bar) return
    const observer = new ResizeObserver(() => {
      wrapper.style.setProperty('--station-bar-h', `${bar.getBoundingClientRect().height}px`)
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [wrapperRef, barRef])
}

function shownTable(tables: StationTables, wanted: StationUnits): [StationTable, StationUnits] {
  return wanted === 'metric' && tables.metric
    ? [tables.metric, 'metric']
    : [tables.default, 'default']
}

export function StationTableView({
  tables,
  activePeriodKey,
  customRange,
  older = null,
  timeZone,
  tabs,
}: {
  /** Built server-side so the toggle is instant; metric is null if its read failed. */
  tables: StationTables
  /** The preset in force; a valid custom range overrides it. */
  activePeriodKey: string
  customRange: DateRange | null
  /** A long range's rows that weren't rendered with the page. */
  older?: OlderRows | null
  timeZone: string
  tabs?: ReactNode
}) {
  const [unitSystem, changeStationUnits] = useStationUnits()
  const olderRows = useOlderTableRows(older)
  const { merged } = olderRows
  const allTables = useMemo(() => merged(tables), [merged, tables])
  const [table, units] = shownTable(allTables, unitSystem)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  useBarHeightVar(wrapperRef, barRef)
  return (
    <div ref={wrapperRef} className="flex flex-col gap-2">
      <StationViewBar ref={barRef}>
        {/* A past range's last row is not the station's latest. */}
        <TabsWithLatest tabs={tabs} latest={isPastRange(customRange, timeZone) ? null : table} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <TableRangePicker
            activePeriodKey={activePeriodKey}
            customRange={customRange}
            timeZone={timeZone}
          />
          {allTables.metric && <UnitToggle unit={unitSystem} onChange={changeStationUnits} />}
        </div>
      </StationViewBar>
      <StationNowTable table={table} elevationUnit={units === 'metric' ? ' m' : undefined} />
      <OlderTableRows rows={olderRows} />
    </div>
  )
}
