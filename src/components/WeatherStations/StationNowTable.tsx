import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StationTable } from '@/services/snowobs'
import { cn } from '@/utilities/ui'

// Renders the last-24h weather-station table: newest-first hourly rows, one
// column per configured sensor (short label + unit + elevation), nulls as "–".
export function StationNowTable({ table }: { table: StationTable }) {
  if (table.rows.length === 0) {
    return <p className="text-muted-foreground">No station observations in the last 24 hours.</p>
  }

  const timeHeader = table.timezoneLabel ? `Time (${table.timezoneLabel})` : 'Time'

  return (
    <Table className="mx-auto w-auto text-base">
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-10 bg-background whitespace-nowrap px-2 align-bottom">
            {timeHeader}
          </TableHead>
          {table.columns.map((column) => (
            <TableHead
              key={column.key}
              title={column.longName}
              className="whitespace-nowrap px-2 text-right align-bottom"
            >
              <div className="font-semibold text-foreground">{column.label}</div>
              {column.unit && (
                <div className="text-sm font-normal text-muted-foreground">{column.unit}</div>
              )}
              {column.elevation != null && (
                <div className="text-sm font-normal text-muted-foreground">
                  {column.elevation}&apos;
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.rows.map((row) => (
          <TableRow key={row.timestamp} className="bg-background even:bg-muted">
            <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-2 py-1.5 font-medium">
              {row.display}
            </TableCell>
            {table.columns.map((column) => {
              const value = row.values[column.key]
              return (
                <TableCell
                  key={column.key}
                  className={cn(
                    'px-2 py-1.5 text-right font-light',
                    value == null && 'text-muted-foreground',
                  )}
                >
                  {value == null ? '–' : value}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
