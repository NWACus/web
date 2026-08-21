/**
 * The order station table columns appear in, site-wide.
 *
 * Column layout is derived rather than stored: for each variable below, one
 * column per station in the group that has it selected. Keeping the sequence
 * here rather than per-group means a page is defined by which readings it
 * shows, not by 275 hand-ordered rows.
 *
 * Reproduces 28 of the 32 legacy layouts exactly. The four that differ do so by
 * one or two columns: `mt-washington` listed wind direction before humidity,
 * and Alpental, Crystal Green Valley and Tumwater kept each station's snow
 * depth pair adjacent instead of interleaving them by variable.
 */
export const COLUMN_VARIABLE_ORDER = [
  'air_temp',
  'relative_humidity',
  'wind_speed_min',
  'wind_speed',
  'wind_gust',
  'wind_direction',
  'precip_accum_one_hour',
  'snow_depth_24h',
  'snow_depth',
  'intermittent_snow',
  'solar_radiation',
  'pressure',
  'equip_temperature',
] as const

export type ColumnVariable = (typeof COLUMN_VARIABLE_ORDER)[number]

type StationWithColumns = { stid: string; tableVariables?: (string | null)[] | null }

/**
 * Table columns for a group, left to right. The station list's order is what
 * interleaves readings across loggers -- Alpental reads Summit, Mid, Base -- so
 * callers must pass stations in the group's stored order.
 */
export function columnsFor(
  stations: StationWithColumns[],
): { stid: string; variable: ColumnVariable }[] {
  return COLUMN_VARIABLE_ORDER.flatMap((variable) =>
    stations
      .filter((station) => station.tableVariables?.includes(variable))
      .map((station) => ({ stid: station.stid, variable })),
  )
}
