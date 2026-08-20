import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UnitSystem } from '@/services/snowobs/metricUnits'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import { formatStationValue } from './stationTableUnits'

// Bounds the scroll box so the sticky header has something to stick to: the
// Table wrapper is the scroll container, not the viewport.
const scrollBox = 'max-h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-2rem)]'

// Renders the last-24h weather-station table: newest-first hourly rows, one
// column per configured sensor (short label + unit + elevation), nulls as "–".
export function StationNowTable({
  table,
  elevationUnit = "'",
  unitSystem = 'imperial',
}: {
  table: StationTable
  elevationUnit?: string
  unitSystem?: UnitSystem
}) {
  if (table.rows.length === 0) {
    return <p className="text-muted-foreground">No station observations in this period.</p>
  }

  const timeHeader = table.timezoneLabel ? `Time (${table.timezoneLabel})` : 'Time'

  return (
    <Table containerClassName={scrollBox} className="mx-auto w-auto text-xs sm:text-base">
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 top-0 z-20 bg-background whitespace-nowrap px-1 align-bottom sm:px-2">
            {timeHeader}
          </TableHead>
          {table.columns.map((column) => (
            <TableHead
              key={column.key}
              title={column.longName}
              className="sticky top-0 z-10 whitespace-nowrap bg-background px-1 text-right align-bottom sm:px-2"
            >
              <div className="font-semibold text-foreground">{column.label}</div>
              {column.unit && (
                <div className="text-xs font-normal text-muted-foreground sm:text-sm">
                  {column.unit}
                </div>
              )}
              {column.elevation != null && (
                <div className="text-xs font-normal text-muted-foreground sm:text-sm">
                  {column.elevation}
                  {elevationUnit}
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
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
                  {value == null ? '–' : formatStationValue(column.variable, value, unitSystem)}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
