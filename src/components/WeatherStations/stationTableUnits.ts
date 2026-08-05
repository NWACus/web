import { metricConversionFor } from '@/services/snowobs/metricUnits'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { UnitSystem } from './UnitToggle'

const FEET_TO_METERS = 0.3048

// Converted readings round to one decimal so the table stays scannable;
// elevations round to whole meters.
export function convertStationTable(table: StationTable, system: UnitSystem): StationTable {
  if (system === 'imperial') return table
  const conversionByKey = new Map(
    table.columns.map((c) => [c.key, metricConversionFor(c.variable)]),
  )
  return {
    ...table,
    columns: table.columns.map((column) => {
      const conversion = conversionByKey.get(column.key)
      return {
        ...column,
        unit: conversion ? conversion.unit : column.unit,
        elevation: column.elevation === null ? null : Math.round(column.elevation * FEET_TO_METERS),
      }
    }),
    rows: table.rows.map((row) => ({
      ...row,
      values: Object.fromEntries(
        Object.entries(row.values).map(([key, value]) => {
          const conversion = conversionByKey.get(key)
          return [
            key,
            value === null || !conversion ? value : Number(conversion.convert(value).toFixed(1)),
          ]
        }),
      ),
    })),
  }
}
