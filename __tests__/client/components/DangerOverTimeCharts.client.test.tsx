import { ArchiveTabs } from '@/components/forecast/archive/ArchiveTabs'
import { DangerOverTimeCharts } from '@/components/forecast/archive/DangerOverTimeCharts.client'
import { dangerCsv, dangerExportFilename } from '@/components/forecast/archive/dangerOverTimeExport'
import {
  buildDangerOverTimeOption,
  chartDays,
  dangerTooltip,
} from '@/components/forecast/archive/dangerOverTimeOptions'
import type { DangerOverTime } from '@/services/nac/forecastArchive'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

// The ECharts canvas never mounts in these tests; the stub stands in for the live instance so
// the download menu has an export to save.
let mockChart: { setOption: jest.Mock; getDataURL: jest.Mock }

jest.mock('next/dynamic', () => () => {
  const Stub = ({ chartRef }: { chartRef?: { current: unknown } }) => {
    if (chartRef) chartRef.current = mockChart
    return null
  }
  return Stub
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const STUB_DATA_URL = 'data:image/png;base64,stub'

const EXTENT = { from: '2026-04-03', to: '2026-04-07' }

const DATA: DangerOverTime = {
  extent: EXTENT,
  zones: [
    {
      zone: { id: 1, slug: 'olympics', name: 'Olympics' },
      points: [
        { date: '2026-04-03', dangerLevel: 2 },
        { date: '2026-04-05', dangerLevel: 4 },
      ],
    },
    {
      zone: { id: 2, slug: 'west-slopes-north', name: 'West Slopes North' },
      points: [{ date: '2026-04-07', dangerLevel: 5 }],
    },
  ],
}

beforeEach(() => {
  mockChart = { setOption: jest.fn(), getDataURL: jest.fn(() => STUB_DATA_URL) }
})

type DataItem = { value: number; itemStyle: { color: string } } | null

function isDataItems(value: unknown): value is DataItem[] {
  return Array.isArray(value)
}

function seriesData(option: Record<string, unknown>): DataItem[] {
  const series = option.series
  if (!Array.isArray(series) || series.length !== 1) throw new Error('expected one series')
  const data = series[0].data
  if (!isDataItems(data)) throw new Error('expected a data array')
  return data
}

/** Anchors are the download mechanism; this records each one the moment it is clicked. */
function recordSavedFiles() {
  const saved: { inDocument: boolean; download: string; href: string }[] = []
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    // Firefox ignores a click on a detached anchor, so attachment is part of the contract.
    saved.push({
      inDocument: document.body.contains(this),
      download: this.download,
      href: this.href,
    })
  })
  return saved
}

// Opened from the keyboard: jsdom has no PointerEvent, and this is the path that proves the
// menu is reachable without a mouse.
function openDownloadMenu(zoneName: string) {
  fireEvent.keyDown(screen.getByRole('button', { name: `Download ${zoneName} chart` }), {
    key: 'Enter',
  })
}

describe('buildDangerOverTimeOption', () => {
  it('lays out one category per day of the extent, with a gap for an unrated day', () => {
    expect(chartDays(EXTENT)).toEqual([
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
    ])

    const option = buildDangerOverTimeOption(DATA.zones[0].points, EXTENT)

    expect(seriesData(option).map((item) => item?.value ?? null)).toEqual([2, null, 4, null, null])
  })

  it('colours each bar by the danger scale', () => {
    const option = buildDangerOverTimeOption(DATA.zones[0].points, EXTENT)
    const [moderate, , high] = seriesData(option)

    expect(moderate?.itemStyle.color).toBe('#fff200')
    expect(high?.itemStyle.color).toBe('#ed1c24')
  })

  it('holds the axis at 0–5 and names the tooltip as the legacy chart did', () => {
    const option = buildDangerOverTimeOption(DATA.zones[0].points, EXTENT)

    expect(option.yAxis).toMatchObject({ min: 0, max: 5, interval: 1, name: 'Danger Rating' })
    expect(dangerTooltip('2026-04-05', 4)).toBe('Apr 5 - High')
  })

  it('hides the title on screen, and leaves it headroom when one is asked for', () => {
    const plain = buildDangerOverTimeOption(DATA.zones[0].points, EXTENT)
    const titled = buildDangerOverTimeOption(DATA.zones[0].points, EXTENT, 'Olympics')

    expect(plain.title).toMatchObject({ show: false })
    expect(titled.title).toMatchObject({ show: true, text: 'Olympics' })
    // The plot has to start lower, or the title lands on top of it.
    expect(titled.grid).toMatchObject({ top: 44 })
    expect(plain.grid).toMatchObject({ top: 12 })
  })
})

describe('DangerOverTimeCharts', () => {
  it('renders a titled card with a download control per zone', () => {
    render(<DangerOverTimeCharts data={DATA} />)

    const list = screen.getByRole('list', { name: 'Danger over time by zone' })
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(2)

    expect(within(cards[0]).getByRole('heading', { name: 'Olympics' })).toBeInTheDocument()
    expect(
      within(cards[0]).getByRole('button', { name: 'Download Olympics chart' }),
    ).toBeInTheDocument()
    expect(within(cards[1]).getByRole('heading', { name: 'West Slopes North' })).toBeInTheDocument()
  })

  it('offers the chart as a PNG and its days as a CSV', () => {
    render(<DangerOverTimeCharts data={DATA} />)
    openDownloadMenu('Olympics')

    expect(screen.getByRole('menuitem', { name: 'PNG image' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'CSV data' })).toBeInTheDocument()
  })

  it("saves the PNG from an anchor that is in the document, titled with the zone's name", () => {
    const saved = recordSavedFiles()

    render(<DangerOverTimeCharts data={DATA} />)
    openDownloadMenu('Olympics')
    fireEvent.click(screen.getByRole('menuitem', { name: 'PNG image' }))

    expect(saved).toEqual([
      {
        inDocument: true,
        download: 'olympics-danger-over-time-2026-04-03-to-2026-04-07.png',
        href: STUB_DATA_URL,
      },
    ])
    // The anchor is a means, not a leftover.
    expect(document.querySelector('a[download]')).toBeNull()

    // Titled for the image, then put back, so the on-screen chart is never left carrying a
    // heading the card already shows.
    const titles = mockChart.setOption.mock.calls.map(([option]) => option.title)
    expect(titles).toMatchObject([{ show: true, text: 'Olympics' }, { show: false }])
  })

  it('saves the CSV from an anchor that is in the document', () => {
    const saved = recordSavedFiles()
    const objectUrl = 'blob:danger-csv'
    global.URL.createObjectURL = jest.fn().mockReturnValue(objectUrl)
    global.URL.revokeObjectURL = jest.fn()

    render(<DangerOverTimeCharts data={DATA} />)
    openDownloadMenu('Olympics')
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV data' }))

    expect(saved).toEqual([
      {
        inDocument: true,
        download: 'olympics-danger-over-time-2026-04-03-to-2026-04-07.csv',
        href: objectUrl,
      },
    ])
    // The chart is not touched for a CSV — the points are already on the client.
    expect(mockChart.setOption).not.toHaveBeenCalled()
  })
})

describe('danger-over-time export', () => {
  it('names each file for the zone, the range and its format', () => {
    expect(dangerExportFilename('olympics', EXTENT, 'png')).toBe(
      'olympics-danger-over-time-2026-04-03-to-2026-04-07.png',
    )
    expect(dangerExportFilename('olympics', EXTENT, 'csv')).toBe(
      'olympics-danger-over-time-2026-04-03-to-2026-04-07.csv',
    )
  })

  it('writes a header and one row per rated day, naming the rating', () => {
    expect(dangerCsv(DATA.zones[0].points)).toBe(
      ['date,danger_level,danger_rating', '2026-04-03,2,Moderate', '2026-04-05,4,High', ''].join(
        '\n',
      ),
    )
  })

  it('writes the header alone when there is nothing to export', () => {
    expect(dangerCsv([])).toBe('date,danger_level,danger_rating\n')
  })
})

describe('ArchiveTabs', () => {
  it('links both tabs with the filters carried over and the page number dropped', () => {
    render(
      <ArchiveTabs
        active="danger"
        query={{
          season: 2025,
          from: null,
          to: null,
          zone: ['olympics'],
          danger: [],
          type: [],
          page: 3,
        }}
      />,
    )

    const forecasts = screen.getByRole('link', { name: 'Avalanche Forecasts' })
    const danger = screen.getByRole('link', { name: 'Danger Over Time' })

    expect(forecasts).toHaveAttribute(
      'href',
      '/forecasts/avalanche/archive?season=2025&zone=olympics',
    )
    expect(danger).toHaveAttribute(
      'href',
      '/forecasts/avalanche/archive/danger-over-time?season=2025&zone=olympics',
    )
    expect(danger).toHaveAttribute('aria-current', 'page')
    expect(forecasts).not.toHaveAttribute('aria-current')
  })
})
