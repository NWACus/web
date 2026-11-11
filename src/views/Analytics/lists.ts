/**
 * Every ranked list on the page, one spec each. A spec drives both the card and its CSV, so the
 * headings and columns cannot drift apart. To add a list: add its report in reportTypes.ts and
 * reports.ts, write a spec here, and place it in AnalyticsDashboard.client.tsx.
 */
import type { BreakdownReport, ListReport, ListRowMap } from '@/services/posthog/reportTypes'
import { toCsv } from '@/utilities/export/csv'
import { formatInteger, formatPercentFine } from './format'

export type ListColumn<Row> = {
  /** Heading on the card. */
  header: string
  /** Heading in the CSV, when the card abbreviates it. */
  csvHeader?: string
  value: (row: Row) => number | null
  /** Card formatting; compact numbers by default. */
  format?: (value: number) => string
  /** CSV formatting; the plain number by default, so it sorts and sums in a spreadsheet. */
  csv?: (value: number) => string
}

type RowText<Row> = {
  header: string
  text: (row: Row) => string
  /** CSV value, when it differs from the card's text. */
  csv?: (row: Row) => string
}

export type ListSpec<K extends ListReport> = {
  report: K
  /** The tab label, also used in the export file name. */
  label: string
  empty: string
  /** What the list means or how to act on it, shown above the rows. */
  note?: string
  /** A link after the note, e.g. to where the fix is made. */
  noteLink?: { label: string; href: string }
  /** What each row is: the first column. */
  name: RowText<ListRowMap[K]>
  /** A second line under the name on the card, and its own column in the CSV. */
  detail?: RowText<ListRowMap[K]>
  /** The first column draws the bar. */
  columns: [ListColumn<ListRowMap[K]>, ...ListColumn<ListRowMap[K]>[]]
  /** Show each row's share of the period's visitors; only when the first column is visitors. */
  share?: boolean
  /** Rows on the card before "Show all"; the CSV always has every row. */
  limit?: number
  /** Unique per row. */
  key: (row: ListRowMap[K]) => string
}

/** `value` rounded to `digits` places, without trailing zeros. */
export const round = (value: number, digits: number) => String(Number(value.toFixed(digits)))

/** The list as CSV: the spec's headings and every row, with numbers left unformatted. */
export function listCsv<K extends ListReport>(spec: ListSpec<K>, rows: ListRowMap[K][]): string {
  const texts = spec.detail ? [spec.name, spec.detail] : [spec.name]
  const header = [
    ...texts.map((text) => text.header),
    ...spec.columns.map((column) => column.csvHeader ?? column.header),
  ]
  const cells = (row: ListRowMap[K]) => [
    ...texts.map((text) => (text.csv ?? text.text)(row)),
    ...spec.columns.map((column) => {
      const value = column.value(row)
      return value === null ? '' : (column.csv ?? String)(value)
    }),
  ]
  return toCsv([header, ...rows.map(cells)])
}

function breakdown(
  report: BreakdownReport,
  label: string,
  rowHeader: string,
  count: 'visits' | 'pageviews',
  display: (label: string) => string = (raw) => raw,
): ListSpec<BreakdownReport> {
  return {
    report,
    label,
    empty: 'Nothing in this period.',
    name: { header: rowHeader, text: (row) => display(row.label) },
    columns: [
      { header: 'Visitors', value: (row) => row.visitors },
      count === 'visits'
        ? { header: 'Visits', value: (row) => row.visits }
        : { header: 'Views', value: (row) => row.pageviews },
    ],
    share: true,
    limit: 10,
    key: (row) => row.label,
  }
}

export const TOP_PAGES = breakdown('pages', 'Top pages', 'Page', 'pageviews')
export const ENTRY_PAGES = breakdown('entryPages', 'Entry pages', 'Page', 'visits')
export const EXIT_PAGES = breakdown('exitPages', 'Exit pages', 'Page', 'visits')
export const REFERRERS = breakdown('referrers', 'Referrers', 'Source', 'visits', (label) =>
  label === '$direct' ? 'Direct' : label,
)
export const CHANNELS = breakdown('channels', 'Channels', 'Channel', 'visits')
export const CITIES = {
  ...breakdown('cities', 'Cities', 'City', 'pageviews'),
  note: 'Locations come from IP addresses, so they are approximate. A data-center town such as Council Bluffs, IA is usually crawlers or VPNs.',
}
export const REGIONS = breakdown('regions', 'Regions', 'Region', 'pageviews')
export const COUNTRIES = breakdown('countries', 'Countries', 'Country', 'pageviews')
export const DEVICE_TYPES = breakdown('deviceTypes', 'Device', 'Device', 'pageviews')
export const BROWSERS = breakdown('browsers', 'Browser', 'Browser', 'pageviews')
export const OPERATING_SYSTEMS = breakdown(
  'operatingSystems',
  'OS',
  'Operating system',
  'pageviews',
)

export const SPONSORS: ListSpec<'sponsors'> = {
  report: 'sponsors',
  label: 'Sponsors',
  empty: 'No sponsor impressions in this period.',
  note: 'Impressions count the sponsor block rendering, not scrolling into view.',
  name: { header: 'Sponsor', text: (row) => row.name },
  columns: [
    { header: 'Impr.', csvHeader: 'Impressions', value: (row) => row.impressions },
    { header: 'Clicks', value: (row) => row.clicks, format: formatInteger },
    {
      header: 'CTR',
      csvHeader: 'Click-through rate (%)',
      value: (row) => row.clickThroughRate,
      format: formatPercentFine,
      csv: (rate) => round(rate * 100, 2),
    },
  ],
  limit: 15,
  key: (row) => row.sponsorId ?? row.name,
}

export const NOT_FOUND: ListSpec<'notFound'> = {
  report: 'notFound',
  label: 'Top 404s',
  empty: 'No 404s in this period.',
  note: 'Addresses people tried that have no page, with the site that linked to them. Add a redirect to send each one somewhere useful.',
  noteLink: { label: 'Go to Redirects', href: '/admin/collections/redirects' },
  name: { header: 'Missing page', text: (row) => row.path || '/' },
  // The referrer is where the broken link lives
  detail: {
    header: 'Referrer',
    text: (row) => (row.referrer ? `from ${row.referrer}` : 'no referrer'),
    csv: (row) => row.referrer ?? '',
  },
  columns: [
    { header: 'People', value: (row) => row.people },
    { header: 'Hits', value: (row) => row.hits, format: formatInteger },
  ],
  limit: 10,
  key: (row) => row.path,
}

export const DEAD_CLICKS: ListSpec<'deadClicks'> = {
  report: 'deadClicks',
  label: 'Dead clicks',
  empty: 'No dead clicks in this period.',
  note: 'Clicks where nothing happened: no link opened and the page did not change. People usually click something because they expect it to be a link or button, such as an image, heading or icon. Make it a link, or style it so it does not look clickable. Dropdowns and maps are left out because they respond without changing the page.',
  name: { header: 'What was clicked', text: (row) => row.label },
  detail: { header: 'Page', text: (row) => row.path || '/' },
  columns: [
    { header: 'People', value: (row) => row.people },
    { header: 'Clicks', value: (row) => row.clicks, format: formatInteger },
  ],
  limit: 10,
  key: (row) => `${row.path}|${row.label}`,
}
