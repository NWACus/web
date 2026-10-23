import { notFoundReportSchema, type NotFoundReport } from '@/utilities/notFoundReport'
import { toRedirectsCsv } from '@/utilities/notFoundReportCsv'
import { toReportHtml } from '@/utilities/notFoundReportHtml'

const report: NotFoundReport = {
  tenant: 'nwac',
  centerName: 'Northwest Avalanche Center',
  domain: 'nwac.us',
  hostnames: ['nwac.us', 'www.nwac.us'],
  range: { start: '2026-08-31T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' },
  totals: { notFound: 1000, notFoundNonBot: 120 },
  redirects: [
    { from: '/weatherdata/alpental/now', to: null, hits: 90 },
    { from: '/avalanche-forecast/current/mt-hood', to: '/forecasts/avalanche/mt-hood', hits: 20 },
    { from: '/search,"q"=<script>', to: null, hits: 10 },
  ],
  excluded: [{ path: '/favicon.ico', hits: 50, reason: 'not-redirectable' }],
  bots: {
    byCategory: [
      { name: 'unknown', hits: 800 },
      { name: 'ai_crawler', hits: 80 },
    ],
    byName: [{ name: 'meta-webindexer', hits: 40 }],
    topPaths: [{ path: '/data-portal/csv/q', hits: 700 }],
  },
}

describe('toRedirectsCsv', () => {
  const lines = toRedirectsCsv(report).trimEnd().split('\r\n')

  it('writes a header and one row per redirect candidate, keeping suggestions in `to`', () => {
    expect(lines).toEqual([
      'from,to,notes,visits,archived_page',
      '/weatherdata/alpental/now,,,90,https://web.archive.org/web/20260801/https://nwac.us/weatherdata/alpental/now',
      '/avalanche-forecast/current/mt-hood,/forecasts/avalanche/mt-hood,,20,https://web.archive.org/web/20260801/https://nwac.us/avalanche-forecast/current/mt-hood',
      '"/search,""q""=<script>",,,10,"https://web.archive.org/web/20260801/https://nwac.us/search,""q""=<script>"',
    ])
  })
})

describe('toReportHtml', () => {
  const html = toReportHtml(report)

  it('links each old address to its archived copy and each suggestion to the live page', () => {
    expect(html).toContain(
      'href="https://web.archive.org/web/20260801/https://nwac.us/weatherdata/alpental/now"',
    )
    expect(html).toContain('href="https://nwac.us/forecasts/avalanche/mt-hood"')
  })

  it('escapes paths so a request path cannot inject markup', () => {
    expect(html).not.toContain('<script>')
    expect(html).toContain('/search,&quot;q&quot;=&lt;script&gt;')
  })

  it('shows the covered dates, bot categories and bot names', () => {
    expect(html).toContain('Aug 31, 2026 – Sep 29, 2026')
    expect(html).toContain('AI crawler')
    expect(html).toContain('meta-webindexer')
  })
})

describe('notFoundReportSchema', () => {
  it('round-trips a report through JSON, as --from reads it', () => {
    expect(notFoundReportSchema.parse(JSON.parse(JSON.stringify(report)))).toEqual(report)
  })
})
