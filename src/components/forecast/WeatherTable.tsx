/**
 * Columns/rows weather table (the format with a `columns` key), ported from the afp
 * WeatherTable.vue. A spanning zone-name title cell, one or more heading rows, then a body row per
 * `rows` entry with cells from `data[rowIndex]`. The prefix + unit are skipped when the value is
 * empty or "-", matching the widget. Center-specific adaptations (e.g. SAC's, BTAC's) are not
 * applied here — the raw table is rendered faithfully.
 */
import type { RowColumnWeatherData } from '@/services/nac/model/forecast'

import { WeatherInfoHint } from './WeatherInfoHint'

/** Coerce the wire colspan (string | number | undefined) to a positive integer. */
function colSpan(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? 1 : parsed
  }
  return 1
}

export function WeatherTable({ table }: { table: RowColumnWeatherData }) {
  const { columns, rows, data } = table
  if (!columns || !rows || !data) return null

  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          {columns.map((headingRow, rowIndex) => (
            <tr key={rowIndex}>
              {rowIndex === 0 && (
                <th
                  rowSpan={columns.length}
                  className="border bg-muted p-2 text-left align-middle font-semibold"
                >
                  {table.zone_name}
                </th>
              )}
              {headingRow.map((heading, i) => (
                <th
                  key={i}
                  colSpan={heading.colspan ?? 1}
                  style={{ width: `${heading.width}%` }}
                  className="border p-2 text-center align-middle"
                >
                  <span className="font-semibold">{heading.heading}</span>
                  {heading.subheading && (
                    <>
                      <br />
                      <span className="text-xs font-normal text-muted-foreground">
                        {heading.subheading}
                      </span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border p-2 text-left align-middle">
                <span className="font-medium">{row.heading}</span>
                {row.help && <WeatherInfoHint content={row.help} />}
              </td>
              {(data[rowIndex] ?? []).map((cell, colIndex) => {
                const show = cell.value != null && cell.value !== '' && cell.value !== '-'
                return (
                  <td
                    key={colIndex}
                    colSpan={colSpan(cell.colspan)}
                    className="border p-2 text-center align-middle"
                  >
                    {show && cell.prefix && <span className="font-medium">{cell.prefix} </span>}
                    {cell.value}
                    {show && row.unit && <span className="text-muted-foreground"> {row.unit}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
