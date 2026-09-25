import { IssuanceSwitch } from '@/components/weather/nwac/IssuanceSwitch.client'
import { IssuedMeta } from '@/components/weather/nwac/Issued'
import { Overall, OverallSectionTabs } from '@/components/weather/nwac/Overall'
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
    render(<Overall issuance={afternoon} />)
    for (const title of [
      'Snow (in)',
      "5000' Temperatures (°F)",
      'Snow Level (ft)',
      'Snow Levels (ft)',
      'Ridgeline Winds (mph)',
      'Sensible Weather',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByText('Hurricane Ridge')).toBeInTheDocument()
    expect(screen.getAllByText('Olympics').length).toBeGreaterThan(0)
    // 53 / 47 °F for Olympics on Night 1, as entered.
    const temps = screen.getByRole('region', { name: "5000' Temperatures (°F)" })
    const olympics = within(temps).getByRole('rowheader', { name: 'Olympics' }).closest('tr')
    expect(olympics).toHaveTextContent('53 / 47')
  })

  it('leads with sensible weather and links each zone to its forecast page', () => {
    render(
      <Overall
        issuance={afternoon}
        zonePaths={{ 1645: '/forecasts/avalanche/olympics#mountain-weather' }}
      />,
    )
    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    expect(headings.indexOf('Sensible Weather')).toBeLessThan(headings.indexOf('Snow Level (ft)'))
    expect(screen.getByRole('link', { name: 'Olympics' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/olympics#mountain-weather',
    )
  })

  it('groups snow stations under their zones', () => {
    render(<Overall issuance={afternoon} />)
    const snow = screen.getByRole('region', { name: 'Snow (in)' })
    expect(within(snow).getByRole('rowheader', { name: 'Olympics' })).toBeInTheDocument()
    expect(within(snow).getByRole('rowheader', { name: 'Hurricane Ridge' })).toBeInTheDocument()
  })

  it('has no extended table on a morning issuance', () => {
    render(<Overall issuance={morning} />)
    expect(screen.queryByRole('heading', { name: 'Snow Levels (ft)' })).toBeNull()
  })
})

describe('Overall extended section', () => {
  it('shows the snow levels without an outlook when the forecaster wrote none', () => {
    render(<Overall issuance={{ ...afternoon, extendedOutlook: null }} />)
    expect(screen.getByRole('heading', { name: 'Extended' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Outlook' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Snow Levels (ft)' })).toBeInTheDocument()
  })
})

describe('OverallSectionTabs', () => {
  it('links each section the issuance has', () => {
    render(<OverallSectionTabs issuance={afternoon} />)
    const nav = screen.getByRole('navigation', { name: 'Forecast sections' })
    expect(within(nav).getByRole('link', { name: 'Sensible weather' })).toHaveAttribute(
      'href',
      '#afternoon-sensible',
    )
    expect(within(nav).getByRole('link', { name: 'Extended' })).toBeInTheDocument()
  })

  it('leaves out Extended on a morning issuance', () => {
    render(<OverallSectionTabs issuance={morning} />)
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

describe('IssuedMeta', () => {
  const TZ = 'America/Los_Angeles'

  it('names when and by whom the issuance went out', () => {
    render(<IssuedMeta issuance={morning} timezone={TZ} />)
    expect(screen.getByText(/Issued/)).toHaveTextContent(/Issued .+ · .+/)
  })

  it('shows the author alone when the issue time is unreadable', () => {
    render(
      <IssuedMeta
        issuance={{ ...morning, issuedAt: 'not a time', author: 'A Forecaster' }}
        timezone={TZ}
      />,
    )
    expect(screen.getByText('A Forecaster')).toBeInTheDocument()
    expect(screen.queryByText(/Issued/)).toBeNull()
  })

  it('renders nothing with neither', () => {
    const { container } = render(
      <IssuedMeta issuance={{ ...morning, issuedAt: 'not a time', author: null }} timezone={TZ} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
