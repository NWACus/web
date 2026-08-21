import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { metricConversionFor } from '@/services/snowobs/metricUnits'
import type { StationTable } from '@/services/snowobs/tableHelpers'

const FEET_TO_METERS = 0.3048

// Display precision per sensor, matching the legacy NOW tables: precipitation
// reads to hundredths and the snow fields to tenths, everything else whole.
// Metric drops precipitation to one decimal — 0.01in is a quarter of a
// millimetre, so hundredths there would be precision the gauge doesn't have.
type Decimals = Record<UnitSystem, number>

const PRECIP: Decimals = { imperial: 2, metric: 1 }
const DEPTH: Decimals = { imperial: 1, metric: 1 }
const WHOLE: Decimals = { imperial: 0, metric: 0 }

const DECIMALS_BY_VARIABLE: Record<string, Decimals> = {
  precip_accum_one_hour: PRECIP,
  precip_accum_24hr: PRECIP,
  precip_accum: PRECIP,
  precip_cumsum: PRECIP,
  snow_water_equiv: PRECIP,
  snow_water_equiv_24hr: PRECIP,
  snow_depth: DEPTH,
  snow_depth_24h: DEPTH,
  snow_depth_24hr: DEPTH,
  intermittent_snow: DEPTH,
}

export function formatStationValue(variable: string, value: number, system: UnitSystem): string {
  return value.toFixed((DECIMALS_BY_VARIABLE[variable] ?? WHOLE)[system])
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
