'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import { useRouter } from 'next/navigation'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useRef } from 'react'
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
import { UnitToggle, useStationUnits } from './UnitToggle'

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

// A past range's last row is not the station's latest, so there is no staleness to flag.
function LatestObservation({
  table,
  customRange,
  timeZone,
  className,
}: {
  table: StationTable
  customRange: DateRange | null
  timeZone: string
  className?: string
}) {
  if (customRange && customRange.to < todayInZone(new Date(), timeZone)) return null
  return <StationLatestObservation table={table} className={className} />
}

type StationTables = { default: StationTable; metric: StationTable | null }

function shownTable(tables: StationTables, wanted: StationUnits): [StationTable, StationUnits] {
  return wanted === 'metric' && tables.metric
    ? [tables.metric, 'metric']
    : [tables.default, 'default']
}

export function StationTableView({
  tables,
  activePeriodKey,
  customRange,
  timeZone,
  tabs,
}: {
  /** Built server-side so the toggle is instant; metric is null if its read failed. */
  tables: StationTables
  /** The preset in force; a valid custom range overrides it. */
  activePeriodKey: string
  customRange: DateRange | null
  timeZone: string
  tabs?: ReactNode
}) {
  const [unitSystem, changeStationUnits] = useStationUnits()
  const [table, units] = shownTable(tables, unitSystem)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  useBarHeightVar(wrapperRef, barRef)
  return (
    <div ref={wrapperRef} className="flex flex-col gap-2">
      <StationViewBar ref={barRef}>
        {tabs}
        {/* On a phone the picker and units share a line, with the latest
            observation under them; wider, it sits between the two. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <TableRangePicker
            activePeriodKey={activePeriodKey}
            customRange={customRange}
            timeZone={timeZone}
          />
          <LatestObservation
            table={table}
            customRange={customRange}
            timeZone={timeZone}
            className="order-last basis-full sm:order-none sm:ml-auto sm:basis-auto"
          />
          {tables.metric && <UnitToggle unit={unitSystem} onChange={changeStationUnits} />}
        </div>
      </StationViewBar>
      <StationNowTable table={table} elevationUnit={units === 'metric' ? ' m' : undefined} />
    </div>
  )
}
