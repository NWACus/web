import type { ReportRange } from '@/services/posthog/reportTypes'
import {
  DEAD_CLICKS,
  listCsv,
  NOT_FOUND,
  REFERRERS,
  SPONSORS,
  TOP_PAGES,
} from '@/views/Analytics/lists'
import { analyticsExportFilename, overviewCsv, timeseriesCsv } from '@/views/Analytics/panelExport'

const RANGE: ReportRange = {
  from: '2026-10-01',
  to: '2026-10-31',
  previousFrom: '2026-08-31',
  previousTo: '2026-09-30',
  baseline: 'preceding',
  timezone: 'America/Los_Angeles',
}

const lines = (csv: string) => csv.trimEnd().split('\n')

describe('analytics panel export', () => {
  it('names a file for the center, panel and range', () => {
    expect(analyticsExportFilename('nwac', 'Top pages', RANGE, 'csv')).toBe(
      'nwac-top-pages-2026-10-01-to-2026-10-31.csv',
    )
    expect(analyticsExportFilename('sac', 'Top 404s', RANGE, 'csv')).toBe(
      'sac-top-404s-2026-10-01-to-2026-10-31.csv',
    )
    expect(analyticsExportFilename('dvac', 'visitors trend', RANGE, 'png')).toBe(
      'dvac-visitors-trend-2026-10-01-to-2026-10-31.png',
    )
  })

  it('writes the stats row with both periods as columns and spreadsheet-ready units', () => {
    const csv = overviewCsv(
      {
        visitors: { current: 1200, previous: 1000 },
        visits: { current: 1500, previous: 1300 },
        pageviews: { current: 4000, previous: 3500 },
        viewsPerVisit: { current: 2.666666, previous: 2.692307 },
        bounceRate: { current: 0.4523, previous: 0.5 },
        visitDuration: { current: 251.6, previous: 200.2 },
      },
      RANGE,
    )
    expect(lines(csv)).toEqual([
      'Metric,2026-10-01 to 2026-10-31,2026-08-31 to 2026-09-30',
      'Unique visitors,1200,1000',
      'Total visits,1500,1300',
      'Total pageviews,4000,3500',
      'Views per visit,2.67,2.69',
      'Bounce rate (%),45.2,50',
      'Visit duration (seconds),252,200',
    ])
    expect(csv.endsWith('\n')).toBe(true)
  })

  it('writes every series of the trend, with the days each week covers', () => {
    const point = { visitors: 10, visits: 12, pageviews: 30 }
    const csv = timeseriesCsv({
      bucket: 'week',
      points: [
        { ...point, date: '2025-12-29', from: '2026-01-01', to: '2026-01-04', partial: true },
        { ...point, date: '2026-01-05', from: '2026-01-05', to: '2026-01-11', partial: false },
      ],
    })
    expect(lines(csv)).toEqual([
      'From,To,Visitors,Visits,Pageviews',
      '2026-01-01,2026-01-04,10,12,30',
      '2026-01-05,2026-01-11,10,12,30',
    ])
    const daily = timeseriesCsv({
      bucket: 'day',
      points: [
        { ...point, date: '2026-01-05', from: '2026-01-05', to: '2026-01-05', partial: false },
      ],
    })
    expect(lines(daily)[0]).toBe('Date,Visitors,Visits,Pageviews')
  })

  it('uses the spec headings and display labels for a breakdown, quoting commas', () => {
    const rows = [
      { label: '$direct', visitors: 50, visits: 70, pageviews: 90 },
      { label: 'Washington, US', visitors: 20, visits: 25, pageviews: 40 },
    ]
    expect(lines(listCsv(REFERRERS, rows))).toEqual([
      'Source,Visitors,Visits',
      'Direct,50,70',
      '"Washington, US",20,25',
    ])
    expect(lines(listCsv(TOP_PAGES, rows))[0]).toBe('Page,Visitors,Views')
  })

  it('leaves the click-through rate blank when a sponsor had no impressions', () => {
    const csv = listCsv(SPONSORS, [
      { sponsorId: '1', name: 'Acme', impressions: 1000, clicks: 12, clickThroughRate: 0.012 },
      { sponsorId: null, name: 'Ghost', impressions: 0, clicks: 1, clickThroughRate: null },
    ])
    expect(lines(csv)).toEqual([
      'Sponsor,Impressions,Clicks,Click-through rate (%)',
      'Acme,1000,12,1.2',
      'Ghost,0,1,',
    ])
  })

  it('writes 404s and dead clicks with the root path spelled out', () => {
    expect(lines(listCsv(NOT_FOUND, [{ path: '', referrer: null, hits: 3, people: 2 }]))).toEqual([
      'Missing page,Referrer,People,Hits',
      '/,,2,3',
    ])
    expect(
      lines(listCsv(DEAD_CLICKS, [{ path: '/weather', label: 'Say "hi"', clicks: 9, people: 4 }])),
    ).toEqual(['What was clicked,Page,People,Clicks', '"Say ""hi""",/weather,4,9'])
  })

  it('opens a visitor-supplied formula as text but leaves numbers alone', () => {
    const rows = [
      { path: '/a', referrer: '=HYPERLINK("https://x.test","y")', hits: 3, people: 2 },
      { path: '/b', referrer: '@SUM(1)', hits: 1, people: 1 },
      { path: '/c', referrer: '-5', hits: 1, people: 1 },
    ]
    expect(lines(listCsv(NOT_FOUND, rows)).slice(1)).toEqual([
      '/a,"\'=HYPERLINK(""https://x.test"",""y"")",2,3',
      "/b,'@SUM(1),1,1",
      '/c,-5,1,1',
    ])
  })
})
