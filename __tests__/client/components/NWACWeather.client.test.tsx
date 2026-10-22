import { IssuanceSwitch } from '@/components/NWACWeather/IssuanceSwitch.client'
import { Overall, OverallSectionTabs, overallParts } from '@/components/NWACWeather/Overall'
import { levelFill } from '@/components/NWACWeather/Values'
import { fmtQpf } from '@/services/nac/nwacWeatherFormat'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
const [afternoon, morning] = day.issuances

describe('Overall', () => {
  it('renders one table per variable, stations and zones down the rows', () => {
    render(<Overall parts={overallParts(afternoon)} />)
    for (const title of [
      'Precipitation and Snow (in)',
      "5000' Temperatures (°F)",
      'Snow and Freezing Level (ft)',
      'Snow Levels (ft)',
      'Ridgeline Winds (mph)',
      'Weather Summary by Zone',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Hurricane Ridge').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Olympics').length).toBeGreaterThan(0)
    // 53 / 47 °F for Olympics on Night 1, as entered.
    const temps = screen.getByRole('region', { name: "5000' Temperatures (°F)" })
    const olympics = within(temps).getByRole('rowheader', { name: 'Olympics' }).closest('tr')
    expect(olympics).toHaveTextContent('53 / 47')
  })

  it('puts the weather summary beside the synopsis, then precipitation and snow, the zone links last, and links each zone to its forecast page', () => {
    render(
      <Overall
        parts={overallParts(afternoon)}
        zonePaths={{ 1645: '/forecasts/avalanche/olympics#mountain-weather' }}
      />,
    )
    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    const at = (name: string) => headings.indexOf(name)
    expect(at('Weather Synopsis')).toBeLessThan(at('Weather Summary by Zone'))
    expect(at('Weather Summary by Zone')).toBeLessThan(at('Precipitation and Snow (in)'))
    expect(at('Extended')).toBeLessThan(at('Looking for weather by zone?'))
    expect(screen.getByRole('link', { name: 'Olympics' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/olympics#mountain-weather',
    )
    // The picked zone's summary links to its forecast too.
    const summary = screen.getByRole('region', { name: 'Weather Summary by Zone' })
    expect(
      within(summary).getByRole('link', {
        name: 'avalanche forecast',
      }),
    ).toHaveAttribute('href', '/forecasts/avalanche/olympics#mountain-weather')
  })

  it('puts the weather summary beside the synopsis, and leaves out the zone links when no zone has a page', () => {
    render(<Overall parts={overallParts(afternoon)} />)

    expect(screen.queryByRole('complementary', { name: 'Looking for weather by zone?' })).toBeNull()
    const synopsis = screen.getByRole('heading', { name: 'Weather Synopsis' }).closest('section')
    const summary = screen.getByRole('region', { name: 'Weather Summary by Zone' })
    expect(synopsis?.parentElement).toHaveClass('grid')
    expect(summary.parentElement).toBe(synopsis?.parentElement)
  })

  it('gives the synopsis the full width when there is no weather summary', () => {
    render(<Overall parts={overallParts({ ...afternoon, sensible: {} })} />)
    const synopsis = screen.getByRole('heading', { name: 'Weather Synopsis' }).closest('section')
    expect(synopsis?.parentElement).not.toHaveClass('grid')
  })

  it('groups snow stations under their zones: a zone column, and heading rows for a phone', () => {
    render(<Overall parts={overallParts(afternoon)} />)
    const snow = screen.getByRole('region', { name: 'Precipitation and Snow (in)' })
    const [wide, phone] = within(snow).getAllByRole('table')
    expect(within(wide).getByRole('columnheader', { name: 'Zone' })).toBeInTheDocument()
    expect(within(phone).queryByRole('columnheader', { name: 'Zone' })).toBeNull()
    for (const table of [wide, phone]) {
      expect(within(table).getByRole('rowheader', { name: 'Olympics' })).toBeInTheDocument()
      expect(within(table).getByRole('rowheader', { name: 'Hurricane Ridge' })).toBeInTheDocument()
    }
  })

  it('splits each period into water equivalent then snow, and ends on the total', () => {
    render(<Overall parts={overallParts(afternoon)} />)
    const region = screen.getByRole('region', { name: 'Precipitation and Snow (in)' })
    const [wide] = within(region).getAllByRole('table')
    const parts = within(wide)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
      .filter((text) => text === 'Precip' || text === 'Snow')
    expect(parts.slice(0, 2)).toEqual(['Precip', 'Snow'])
    expect(within(wide).getByRole('columnheader', { name: 'Total' })).toBeInTheDocument()
    const row = within(wide).getByRole('rowheader', { name: 'Hurricane Ridge' }).closest('tr')
    // A WE and a snow cell per period, plus the total's two.
    expect(row?.querySelectorAll('td')).toHaveLength(parts.length)
  })

  it('switches precipitation and snow between 12 and 24 hours', () => {
    render(<Overall parts={overallParts(afternoon)} />)
    const twelve = screen.getByRole('button', { name: '12 hours' })
    const twentyFour = screen.getByRole('button', { name: '24 hours' })
    expect(twelve).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('columnheader', { name: 'Night + Day' })).toBeNull()

    fireEvent.click(twentyFour)
    expect(twentyFour).toHaveAttribute('aria-pressed', 'true')
    // An afternoon issuance's nights pair with the days after them.
    expect(screen.getAllByRole('columnheader', { name: 'Night + Day' }).length).toBeGreaterThan(0)
  })

  it('has no extended table on a morning issuance', () => {
    render(<Overall parts={overallParts(morning)} />)
    expect(screen.queryByRole('heading', { name: 'Snow Levels (ft)' })).toBeNull()
  })
})

describe('Overall weather summary', () => {
  it('lists the zones beside the picked zone’s two days, arrow keys moving down the list', () => {
    render(<Overall parts={overallParts(afternoon)} />)
    const summary = screen.getByRole('region', { name: 'Weather Summary by Zone' })
    const list = within(summary).getByRole('tablist', { name: 'Zone' })
    const tabs = within(list).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(afternoon.zones.map((z) => z.name))
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    // An afternoon issuance opens on a night, so its first day is Tonight.
    expect(within(summary).getByRole('heading', { name: /^Tonight/ })).toBeInTheDocument()
    expect(within(summary).getByRole('heading', { name: /^Tomorrow/ })).toBeInTheDocument()

    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' })
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
  })
})

describe('fmtQpf', () => {
  it('prints water equivalent exactly as entered', () => {
    expect(fmtQpf(0)).toBe('0')
    expect(fmtQpf(0.05)).toBe('0.05')
    expect(fmtQpf(0.4)).toBe('0.4')
    expect(fmtQpf(null)).toBe('—')
  })
})

describe('Overall extended section', () => {
  it('shows the snow levels without an outlook when the forecaster wrote none', () => {
    render(<Overall parts={overallParts({ ...afternoon, extendedOutlook: null })} />)
    expect(screen.getByRole('heading', { name: 'Extended' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Outlook' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Snow Levels (ft)' })).toBeInTheDocument()
  })
})

describe('Overall table descriptions', () => {
  it('explains each table, with a legend where its cells need one', () => {
    render(<Overall parts={overallParts(afternoon)} />)

    // The main and extended snow level tables share their explanation.
    expect(screen.getAllByText(/^The general snow level over each 6 hours/)).toHaveLength(2)
    expect(screen.getByText(/^The high and low at 5000’ within each 12 hours/)).toBeInTheDocument()
    expect(
      screen.getByText(/^The average speed and direction over each 6 hours/),
    ).toBeInTheDocument()
    // The 12 and 24 hour tables both carry it; one is hidden.
    expect(
      screen.getAllByText(
        /^Precipitation \(liquid, in\) and new snow by station; .* \(light, dry snow\)\.$/,
      ),
    ).toHaveLength(2)
    expect(screen.getByText(/is the high \/ low$/)).toBeInTheDocument()
    expect(screen.getByText('Points the way the wind blows')).toBeInTheDocument()
  })
})

describe('OverallSectionTabs', () => {
  it('links each section the issuance has', () => {
    render(<OverallSectionTabs parts={overallParts(afternoon)} />)
    const nav = screen.getByRole('navigation', { name: 'Forecast sections' })
    expect(within(nav).getByRole('link', { name: 'Weather summary' })).toHaveAttribute(
      'href',
      '#afternoon-sensible',
    )
    expect(within(nav).getByRole('link', { name: 'Extended' })).toBeInTheDocument()
  })

  it('leaves out Extended on a morning issuance', () => {
    render(<OverallSectionTabs parts={overallParts(morning)} />)
    expect(screen.queryByRole('link', { name: 'Extended' })).toBeNull()
  })
})

describe('IssuanceSwitch with a heading', () => {
  it('puts the switch beside the heading and swaps the issued line with the panel', () => {
    render(
      <IssuanceSwitch
        heading={<h1>Mountain Weather</h1>}
        panels={[
          {
            key: 'pm',
            label: 'Afternoon',
            time: '3:03 PM',
            meta: 'Issued at 3:03',
            content: 'PM body',
          },
          {
            key: 'am',
            label: 'Morning',
            time: '7:00 AM',
            meta: 'Issued at 7:00',
            content: 'AM body',
          },
        ]}
      />,
    )
    // Morning before Afternoon, with the newer Afternoon shown first.
    const radios = screen.getAllByRole('radio')
    expect(radios.map((r) => r.textContent)).toEqual(['Morning7:00 AM', 'Afternoon3:03 PMLatest'])
    expect(screen.getByRole('radio', { name: /Afternoon.*Latest/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Issued at 3:03')).toBeVisible()
    expect(screen.getByText('Issued at 7:00')).not.toBeVisible()

    fireEvent.click(screen.getByRole('radio', { name: /Morning/ }))
    expect(screen.getByText('Issued at 7:00')).toBeVisible()
    expect(screen.getByText('AM body')).toBeVisible()
    expect(screen.getByText('PM body')).not.toBeVisible()
  })
})

describe('IssuanceSwitch anchors', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('opens the issuance a section link points into', () => {
    window.history.replaceState(null, '', '/#morning-snow')
    render(
      <IssuanceSwitch
        heading={<h1>Mountain Weather</h1>}
        panels={[
          { key: 'pm', label: 'Afternoon', time: null, anchor: 'afternoon', content: 'PM body' },
          { key: 'am', label: 'Morning', time: null, anchor: 'morning', content: 'AM body' },
        ]}
      />,
    )
    expect(screen.getByText('AM body')).toBeVisible()
    expect(screen.getByText('PM body')).not.toBeVisible()
  })
})

describe('levelFill', () => {
  it('is blue below 5000 ft, neutral at 5000 ft and red above', () => {
    expect(levelFill(1500)).toContain('bg-blue-300')
    expect(levelFill(4500)).toContain('bg-blue-50')
    expect(levelFill(5000)).toContain('bg-stone-100')
    expect(levelFill(5500)).toContain('bg-red-50')
    expect(levelFill(9000)).toContain('bg-red-300')
  })
})
