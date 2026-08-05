import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { metricConversionFor } from '@/services/snowobs/metricUnits'
import type { StationTable } from '@/services/snowobs/tableHelpers'

const FEET_TO_METERS = 0.3048

// The table is fed unrounded SnowObs values; readings round to one decimal in
// either system so the table stays scannable. Elevations round to whole meters.
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
          return [key, Number((conversion ? conversion.convert(value) : value).toFixed(1))]
        }),
      ),
    })),
  }
}
