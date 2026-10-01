import { IssuanceSwitch } from '@/components/NWACWeather/IssuanceSwitch.client'
import { Overall, OverallSectionTabs } from '@/components/NWACWeather/Overall'
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

describe('Overall sensible weather', () => {
  it('shows one day at a time and switches to the other', () => {
    render(<Overall issuance={afternoon} />)
    const sensible = screen.getByRole('region', { name: 'Sensible Weather' })
    // An afternoon issuance opens on a night, so its first day is Tonight; each carries its date.
    const [today, tomorrow] = within(sensible).getAllByRole('radio')
    expect(today).toHaveTextContent(/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+Tonight$/)
    expect(tomorrow).toHaveTextContent(/Tomorrow$/)
    expect(today).toHaveAttribute('aria-checked', 'true')
    expect(within(sensible).getByRole('rowheader', { name: 'Olympics' })).toBeInTheDocument()

    fireEvent.click(tomorrow)
    expect(tomorrow).toHaveAttribute('aria-checked', 'true')
    expect(today).toHaveAttribute('aria-checked', 'false')
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

describe('Overall table descriptions', () => {
  it('continues each short note with the legacy page’s explanation', () => {
    render(<Overall issuance={afternoon} />)

    expect(
      screen.getByText(/^Where rain turns to snow\. Darker is higher\. The snow level forecast/),
    ).toBeInTheDocument()
    expect(screen.getByText(/^High \/ low\. The 5000’ temperature forecast/)).toBeInTheDocument()
    expect(
      screen.getByText(/^Arrows point the way the wind blows\. Ridgeline winds are the average/),
    ).toBeInTheDocument()
    expect(screen.getByText(/16-point compass rose\.$/)).toBeInTheDocument()
    // The extended snow levels have no note of their own, only the explanation.
    expect(screen.getByText(/^The snow level forecast represents/)).toBeInTheDocument()
    // The snow table has only its note.
    expect(screen.getByText('New snow by station.')).toBeInTheDocument()
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
