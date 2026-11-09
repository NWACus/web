// Shared between the endpoint and the admin page; keep this file free of server imports.

export const BREAKDOWN_PANELS = [
  'pages',
  'entryPages',
  'exitPages',
  'referrers',
  'channels',
  'countries',
  'regions',
  'deviceTypes',
  'browsers',
  'operatingSystems',
] as const
export type BreakdownPanel = (typeof BREAKDOWN_PANELS)[number]

export const ANALYTICS_PANELS = [
  'overview',
  'timeseries',
  ...BREAKDOWN_PANELS,
  'sponsors',
  'notFound',
  'deadClicks',
] as const
export type AnalyticsPanel = (typeof ANALYTICS_PANELS)[number]

export function isAnalyticsPanel(value: unknown): value is AnalyticsPanel {
  return typeof value === 'string' && ANALYTICS_PANELS.some((panel) => panel === value)
}

export type Comparison = { current: number; previous: number }

export type OverviewData = {
  kind: 'overview'
  visitors: Comparison
  visits: Comparison
  pageviews: Comparison
  viewsPerVisit: Comparison
  /** 0..1 */
  bounceRate: Comparison
  /** Seconds */
  visitDuration: Comparison
}

export type TimeseriesPoint = { date: string; visitors: number; visits: number; pageviews: number }
export type TimeseriesData = {
  kind: 'timeseries'
  bucket: 'day' | 'week'
  points: TimeseriesPoint[]
}

/** `secondary` is visits or pageviews depending on the panel; the page labels it. */
export type BreakdownRow = { label: string; visitors: number; secondary: number }
export type BreakdownData = { kind: 'breakdown'; rows: BreakdownRow[] }

export type SponsorRow = {
  sponsorId: string | null
  name: string
  impressions: number
  clicks: number
  clickThroughRate: number | null
}
export type SponsorsData = { kind: 'sponsors'; rows: SponsorRow[] }

export type NotFoundRow = { path: string; referrer: string | null; hits: number; people: number }
export type NotFoundData = { kind: 'notFound'; rows: NotFoundRow[] }

export type DeadClickRow = { path: string; label: string; clicks: number; people: number }
export type DeadClicksData = { kind: 'deadClicks'; rows: DeadClickRow[] }

export type PanelData =
  | OverviewData
  | TimeseriesData
  | BreakdownData
  | SponsorsData
  | NotFoundData
  | DeadClicksData

export type PanelResponse = {
  panel: AnalyticsPanel
  range: {
    from: string
    to: string
    previousFrom: string
    previousTo: string
    timezone: string
  }
  data: PanelData
}

/** Percentage change from `previous` to `current`, or null when there is no baseline. */
export function percentChange({ current, previous }: Comparison): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}
