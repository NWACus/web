import { TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { WIND_COMPASS } from '@/services/snowobs/constants'
import { windDirectionLabel } from '@/services/snowobs/stationMap/format'
import type { StationTable, TableColumn } from '@/services/snowobs/tableHelpers'
import { formatReading } from '@/services/snowobs/units'
import { cn } from '@/utilities/ui'
import { StationTableFrame } from './StationTableFrame'

function cellText(column: TableColumn, value: number | null | undefined): string {
  if (value == null) return '–'
  if (column.variable === WIND_COMPASS) return windDirectionLabel(value) ?? '–'
  return formatReading(value, column.decimals)
}

// Renders the last-24h weather-station table: newest-first hourly rows, one
// column per configured sensor (short label + unit + elevation), nulls as "–".
export function StationNowTable({
  table,
  elevationUnit = "'",
}: {
  table: StationTable
  elevationUnit?: string
}) {
  if (table.rows.length === 0) {
    return <p className="text-muted-foreground">No station observations in this period.</p>
  }

  const timeHeader = table.timezoneLabel ? `Time (${table.timezoneLabel})` : 'Time'

  return (
    <StationTableFrame
      label="Station observations"
      className="mx-auto w-auto text-xs sm:text-base"
      header={
        <TableRow>
          <TableHead className="sticky left-0 z-10 bg-background whitespace-nowrap px-1 align-bottom sm:px-2">
            {timeHeader}
          </TableHead>
          {table.columns.map((column) => (
            <TableHead
              key={column.key}
              title={column.longName}
              className="whitespace-nowrap px-1 text-right align-bottom sm:px-2"
            >
              <div className="font-semibold text-foreground">{column.label}</div>
              {/* A blank line keeps unitless labels level with the others, as headers align to the bottom. */}
              <div className="text-xs font-normal text-muted-foreground sm:text-sm">
                {column.unit || '\u00A0'}
              </div>
              {column.elevation != null && (
                <div className="text-xs font-normal text-muted-foreground sm:text-sm">
                  {column.elevation}
                  {elevationUnit}
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      }
    >
      <TableBody>
        {table.rows.map((row) => (
          <TableRow key={row.timestamp} className="bg-background even:bg-muted">
            <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-1 py-1 font-medium sm:px-2 sm:py-1.5">
              {row.display}
            </TableCell>
            {table.columns.map((column) => {
              const value = row.values[column.key]
              return (
                <TableCell
                  key={column.key}
                  className={cn(
                    'px-1 py-1 text-right sm:px-2 sm:py-1.5',
                    value == null && 'text-muted-foreground',
                  )}
                >
                  {cellText(column, value)}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </StationTableFrame>
  )
}
