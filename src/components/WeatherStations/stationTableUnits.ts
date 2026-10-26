import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { metricConversionFor } from '@/services/snowobs/metricUnits'
import type { StationTable } from '@/services/snowobs/tableHelpers'

const FEET_TO_METERS = 0.3048

// Display precision per sensor: precipitation reads to hundredths, everything else
// whole, snow included (forecasters read it to the nearest inch).
// Metric drops precipitation to one decimal — 0.01in is a quarter of a
// millimetre, so hundredths there would be precision the gauge doesn't have.
type Decimals = Record<UnitSystem, number>

const PRECIP: Decimals = { imperial: 2, metric: 1 }
const WHOLE: Decimals = { imperial: 0, metric: 0 }

const DECIMALS_BY_VARIABLE: Record<string, Decimals> = {
  precip_accum_one_hour: PRECIP,
  precip_accum_24hr: PRECIP,
  precip_accum: PRECIP,
  precip_cumsum: PRECIP,
  snow_water_equiv: PRECIP,
  snow_water_equiv_24hr: PRECIP,
}

export function formatStationValue(variable: string, value: number, system: UnitSystem): string {
  const text = value.toFixed((DECIMALS_BY_VARIABLE[variable] ?? WHOLE)[system])
  // A small negative (24-hour snow settling) rounds to "-0"; it reads as plain 0.
  return Number(text) === 0 ? text.replace('-', '') : text
}

// The table is fed unrounded SnowObs values and stays unrounded through the
// conversion — `formatStationValue` is the single place display precision is
// applied. Elevations round to whole meters.
export function convertStationTable(table: StationTable, system: UnitSystem): StationTable {
  const conversionByKey = new Map(
    table.columns.map((c) => [c.key, system === 'metric' ? metricConversionFor(c.variable) : null]),
  )
  return {
    ...table,
    columns: table.columns.map((column) => {
      const conversion = conversionByKey.get(column.key)
      return {
        ...column,
        unit: conversion ? conversion.unit : column.unit,
        elevation:
          column.elevation === null || system === 'imperial'
            ? column.elevation
            : Math.round(column.elevation * FEET_TO_METERS),
      }
    }),
    rows: table.rows.map((row) => ({
      ...row,
      values: Object.fromEntries(
        Object.entries(row.values).map(([key, value]) => {
          if (value === null) return [key, value]
          const conversion = conversionByKey.get(key)
          return [key, conversion ? conversion.convert(value) : value]
        }),
      ),
    })),
  }
}
