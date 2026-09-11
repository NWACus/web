import { ZoneList } from '@/components/dangerMap/ZoneList'
import { decorateZoneFeatures } from '@/services/nac/dangerMap/dangerMapZones'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { exchangeZone, zone, zoneFeature } from '../../fixtures/dangerMapZones'

const forecastCenter = {
  advice: true,
  allCenters: false,
  centerId: 'NWAC',
  informationExchange: false,
}
const exchange = { advice: true, allCenters: false, centerId: 'EWYAIX', informationExchange: true }

// Styled the way the danger-map route styles them, so the list sees what the map sees.
const nwacZones = { features: decorateZoneFeatures([zoneFeature(zone(), 1655)]) }
const exchangeZones = { features: decorateZoneFeatures([zoneFeature(exchangeZone(), 2841)]) }

describe('ZoneList', () => {
  it('lists each zone with its rating, linked to its forecast', () => {
    render(<ZoneList zones={nwacZones} settings={forecastCenter} />)

    expect(
      screen.getByRole('heading', { name: 'Avalanche danger by forecast zone' }),
    ).toBeInTheDocument()
    // The whole row is one link, so its accessible name carries the zone and what opening it gets
    // you, rather than the zone alone.
    expect(
      screen.getByRole('link', { name: 'West Slopes Central 3 - Considerable' }),
    ).toHaveAttribute('href', '/forecasts/avalanche/west-slopes-central')
  })

  // The list is the map's only keyboard- and screen-reader-reachable form, so it has to pivot
  // with the popups: an exchange's zones are a way into observations, not a rating.
  it("frames an exchange's zones as observations, linked to the native observations page", () => {
    render(<ZoneList zones={exchangeZones} settings={exchange} />)

    expect(screen.getByRole('heading', { name: 'Observations by zone' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Big Horns View Observations' })).toHaveAttribute(
      'href',
      '/observations',
    )
  })

  // Items pivot per zone, so an exchange's all-centers list mixes observations with neighbors'
  // ratings; the heading has to be true of both.
  it("uses a neutral heading over an exchange's all-centers list", () => {
    const mixed = {
      features: decorateZoneFeatures([
        zoneFeature(exchangeZone(), 2841),
        zoneFeature(zone(), 1655),
      ]),
    }
    render(<ZoneList zones={mixed} settings={{ ...exchange, allCenters: true }} />)

    expect(screen.getByRole('heading', { name: 'Forecast zones on the map' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('View Observations')
    expect(items[1]).toHaveTextContent('3 - Considerable')
  })

  it('carries an active warning into the row', () => {
    const warned = {
      features: decorateZoneFeatures([
        zoneFeature(zone({ warning: { product: 'warning' } }), 1655),
      ]),
    }
    render(<ZoneList zones={warned} settings={forecastCenter} />)

    expect(screen.getByRole('listitem')).toHaveTextContent('Avalanche Warning in effect')
  })

  it('renders nothing before the zones arrive', () => {
    const { container } = render(<ZoneList zones={null} settings={forecastCenter} />)
    expect(container).toBeEmptyDOMElement()
  })
})
