import { ArchiveTabs } from '@/components/forecast/archive/ArchiveTabs'
import {
  DangerOverTimeCharts,
  dangerChartFilename,
} from '@/components/forecast/archive/DangerOverTimeCharts.client'
import {
  buildDangerOverTimeOption,
  chartDays,
  dangerTooltip,
} from '@/components/forecast/archive/dangerOverTimeOptions'
import type { DangerOverTime } from '@/services/nac/forecastArchive'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

// The ECharts canvas never mounts in these tests; the stub stands in for the live instance so
// the download control has an export to save.
jest.mock('next/dynamic', () => () => {
  const Stub = ({ chartRef }: { chartRef?: { current: unknown } }) => {
    if (chartRef) chartRef.current = { getDataURL: () => STUB_DATA_URL }
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
})

describe('DangerOverTimeCharts', () => {
  it('renders a titled card with a download control per zone', () => {
    render(<DangerOverTimeCharts data={DATA} />)

    const list = screen.getByRole('list', { name: 'Danger over time by zone' })
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(2)

    expect(within(cards[0]).getByRole('heading', { name: 'Olympics' })).toBeInTheDocument()
    expect(
      within(cards[0]).getByRole('button', { name: 'Download Olympics chart as PNG image' }),
    ).toBeInTheDocument()
    expect(within(cards[1]).getByRole('heading', { name: 'West Slopes North' })).toBeInTheDocument()
  })

  it('names the download for the zone and range', () => {
    expect(dangerChartFilename('olympics', EXTENT)).toBe(
      'olympics-danger-over-time-2026-04-03-to-2026-04-07.png',
    )
  })

  it("saves the zone's chart from an anchor that is in the document", () => {
    const clicked: { inDocument: boolean; download: string; href: string }[] = []
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      // Firefox ignores a click on a detached anchor, so attachment is part of the contract.
      clicked.push({
        inDocument: document.body.contains(this),
        download: this.download,
        href: this.href,
      })
    })

    render(<DangerOverTimeCharts data={DATA} />)
    fireEvent.click(screen.getByRole('button', { name: 'Download Olympics chart as PNG image' }))

    expect(clicked).toEqual([
      {
        inDocument: true,
        download: 'olympics-danger-over-time-2026-04-03-to-2026-04-07.png',
        href: STUB_DATA_URL,
      },
    ])
    // The anchor is a means, not a leftover.
    expect(document.querySelector('a[download]')).toBeNull()
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
