import type { CenterAnalytics, Comparison } from '@/services/posthog/centerAnalytics'
import { percentChange } from '@/services/posthog/centerAnalytics'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

const integer = new Intl.NumberFormat('en-US')
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 })

// NWAC alone has about 50 sponsors; the tile shows the busiest and says how many it left out.
const SPONSOR_ROWS = 20

const MUTED = 'text-[var(--theme-elevation-600)]'
const RULE = 'border-b border-[var(--theme-elevation-150)]'

function formatChange(comparison: Comparison): string {
  const change = percentChange(comparison)
  if (change === null) return 'no prior data'
  const rounded = Math.round(change)
  return `${rounded > 0 ? '+' : ''}${rounded}% vs prior 30 days`
}

function Stat({ label, comparison }: { label: string; comparison: Comparison }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn('text-sm', MUTED)}>{label}</span>
      <span className="text-3xl font-semibold leading-none">
        {integer.format(comparison.current)}
      </span>
      <span className={cn('text-xs', MUTED)}>{formatChange(comparison)}</span>
    </div>
  )
}

type Column<Row> = {
  header: string
  cell: (row: Row) => ReactNode
  align?: 'left' | 'right'
}

function Tile<Row>({
  title,
  note,
  rows,
  columns,
  empty,
}: {
  title: string
  note?: string
  rows: Row[]
  columns: Column<Row>[]
  empty: string
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div>
        <h4 className="m-0 text-base font-semibold">{title}</h4>
        {note && <p className={cn('m-0 text-xs', MUTED)}>{note}</p>}
      </div>
      {rows.length === 0 ? (
        <p className={cn('m-0 text-sm', MUTED)}>{empty}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={RULE}>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={cn(
                    'py-1 pr-3 text-left font-medium',
                    MUTED,
                    column.align === 'right' && 'pl-4 pr-0 text-right',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={RULE}>
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cn(
                      'max-w-0 truncate py-1 pr-3 align-top',
                      column.align === 'right' &&
                        'w-px max-w-none whitespace-nowrap pl-4 pr-0 text-right tabular-nums',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

const referrerLabel = (referrer: string) => (referrer === '$direct' ? 'Direct' : referrer)

type Breakdown = { visitors: number; pageviews: number }

function breakdownColumns<K extends string>(
  header: string,
  key: K,
): Column<Breakdown & Record<K, string>>[] {
  return [
    { header, cell: (row) => row[key] },
    { header: 'Visitors', align: 'right', cell: (row) => integer.format(row.visitors) },
    { header: 'Views', align: 'right', cell: (row) => integer.format(row.pageviews) },
  ]
}

function sponsorNote(total: number): string {
  const base = 'Impressions count the sponsor block rendering, not scrolling into view.'
  return total > SPONSOR_ROWS
    ? `${base} Showing ${SPONSOR_ROWS} of ${total} sponsors, by impressions.`
    : base
}

export function AnalyticsTiles({ data }: { data: CenterAnalytics }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat label="Visitors" comparison={data.overview.visitors} />
        <Stat label="Sessions" comparison={data.overview.sessions} />
        <Stat label="Pageviews" comparison={data.overview.pageviews} />
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
        <Tile
          title="Top pages"
          rows={data.topPages}
          empty="No pageviews in this window."
          columns={[
            { header: 'Page', cell: (row) => <span title={row.path}>{row.path || '/'}</span> },
            { header: 'Views', align: 'right', cell: (row) => integer.format(row.pageviews) },
            { header: 'Visitors', align: 'right', cell: (row) => integer.format(row.visitors) },
          ]}
        />
        <Tile
          title="Top referrers"
          rows={data.topReferrers}
          empty="No referrers in this window."
          columns={[
            { header: 'Source', cell: (row) => referrerLabel(row.referrer) },
            { header: 'Visitors', align: 'right', cell: (row) => integer.format(row.visitors) },
            { header: 'Sessions', align: 'right', cell: (row) => integer.format(row.sessions) },
          ]}
        />
        <Tile
          title="Devices"
          rows={data.devices}
          empty="No pageviews in this window."
          columns={breakdownColumns('Device', 'device')}
        />
        <Tile
          title="Top regions"
          rows={data.topRegions}
          empty="No pageviews in this window."
          columns={breakdownColumns('Region', 'region')}
        />
        <Tile
          title="Sponsors"
          note={sponsorNote(data.sponsors.length)}
          rows={data.sponsors.slice(0, SPONSOR_ROWS)}
          empty="No sponsor impressions in this window."
          columns={[
            { header: 'Sponsor', cell: (row) => row.name },
            {
              header: 'Impressions',
              align: 'right',
              cell: (row) => integer.format(row.impressions),
            },
            { header: 'Clicks', align: 'right', cell: (row) => integer.format(row.clicks) },
            {
              header: 'CTR',
              align: 'right',
              cell: (row) =>
                row.clickThroughRate === null ? '–' : percent.format(row.clickThroughRate),
            },
          ]}
        />
        <Tile
          title="Dead clicks"
          note="Where readers click and nothing happens. Dropdowns and maps are left out."
          rows={data.deadClicks}
          empty="No dead clicks in this window."
          columns={[
            {
              header: 'Target',
              cell: (row) => (
                <span className="flex flex-col" title={`${row.label} on ${row.path}`}>
                  <span className="truncate">{row.label}</span>
                  <span className={cn('truncate text-xs', MUTED)}>{row.path || '/'}</span>
                </span>
              ),
            },
            { header: 'People', align: 'right', cell: (row) => integer.format(row.people) },
            { header: 'Clicks', align: 'right', cell: (row) => integer.format(row.clicks) },
          ]}
        />
      </div>
    </div>
  )
}
