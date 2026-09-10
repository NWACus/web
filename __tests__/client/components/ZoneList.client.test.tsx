import { ZoneList } from '@/components/dangerMap/ZoneList'
import type { ZoneRenderFeature } from '@/services/nac/dangerMap/dangerMapZones'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

function feature(
  overrides: Partial<ZoneRenderFeature['properties']>,
  id: number,
): ZoneRenderFeature {
  return {
    type: 'Feature',
    id,
    geometry: null,
    properties: {
      name: 'West Slopes Central',
      center: 'Northwest Avalanche Center',
      center_link: 'https://www.nwac.us/',
      center_id: 'NWAC',
      timezone: 'America/Los_Angeles',
      state: 'WA',
      off_season: false,
      travel_advice: 'Careful snowpack evaluation is essential.',
      danger: 'considerable',
      danger_level: 3,
      color: '#f7941e',
      stroke: '#104efb',
      font_color: '#ffffff',
      link: 'http://www.nwac.us/avalanche-forecast/#/west-slopes-central',
      start_date: '2026-01-14T01:30:00',
      end_date: '2026-01-15T01:30:00',
      warning: { product: null },
      fillColor: '#f7941e',
      fillOpacity: 0.6,
      strokeColor: '#104efb',
      hasWarning: false,
      ...overrides,
    },
  }
}

const forecastCenter = {
  advice: true,
  allCenters: false,
  centerId: 'NWAC',
  informationExchange: false,
}
const exchange = { advice: true, allCenters: false, centerId: 'EWYAIX', informationExchange: true }

const exchangeZone = feature(
  {
    name: 'Big Horns',
    center: 'Eastern Wyoming Avalanche Info Exchange',
    center_link: 'https://ewyoavalanche.org',
    center_id: 'EWYAIX',
    timezone: 'America/Denver',
    state: 'WY',
    danger: 'no rating',
    danger_level: -1,
    color: '#888888',
    link: 'https://ewyoavalanche.org',
    start_date: null,
    end_date: null,
  },
  2841,
)

describe('ZoneList', () => {
  it('lists each zone with its rating, linked to its forecast', () => {
    render(<ZoneList zones={{ features: [feature({}, 1655)] }} settings={forecastCenter} />)

    expect(
      screen.getByRole('heading', { name: 'Avalanche danger by forecast zone' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'West Slopes Central' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/west-slopes-central',
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('West Slopes Central: 3 - Considerable')
  })

  // The list is the map's only keyboard- and screen-reader-reachable form, so it has to pivot
  // with the popups: an exchange's zones are a way into observations, not a rating.
  it("frames an exchange's zones as observations, linked to the native observations page", () => {
    render(<ZoneList zones={{ features: [exchangeZone] }} settings={exchange} />)

    expect(screen.getByRole('heading', { name: 'Observations by zone' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Big Horns' })).toHaveAttribute('href', '/observations')
    expect(screen.getByRole('listitem')).toHaveTextContent('Big Horns: View Observations')
  })

  it('renders nothing before the zones arrive', () => {
    const { container } = render(<ZoneList zones={null} settings={forecastCenter} />)
    expect(container).toBeEmptyDOMElement()
  })
})
