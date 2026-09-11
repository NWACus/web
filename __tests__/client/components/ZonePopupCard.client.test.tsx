import { ZonePopupCard } from '@/components/dangerMap/ZonePopupCard'
import { zonePopup } from '@/services/nac/dangerMap/dangerMapZones'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { exchangeZone, zone } from '../../fixtures/dangerMapZones'

const forecastCenter = {
  advice: true,
  allCenters: false,
  centerId: 'NWAC',
  informationExchange: false,
}
const exchange = { advice: true, allCenters: false, centerId: 'EWYAIX', informationExchange: true }

describe('ZonePopupCard', () => {
  it('names the rating in the header and its icon', () => {
    render(<ZonePopupCard popup={zonePopup(zone(), forecastCenter)} />)

    expect(screen.getByText('3 - Considerable')).toBeInTheDocument()
    expect(screen.getByText('Avalanche Danger')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Considerable' })).toBeInTheDocument()
    expect(screen.getByText('Travel Advice')).toBeInTheDocument()
  })

  // The widget shows the no-rating icon beside "View Observations"; keeping the picture is
  // parity, but announcing it as "No Rating" would contradict the headline for a screen reader.
  it('headlines observations on an exchange, with a decorative icon and no advice', () => {
    render(<ZonePopupCard popup={zonePopup(exchangeZone(), exchange)} />)

    expect(screen.getByText('View Observations')).toBeInTheDocument()
    expect(screen.getByText('Avalanche Info Exchange')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'No Rating' })).not.toBeInTheDocument()
    expect(screen.queryByText('Travel Advice')).not.toBeInTheDocument()
  })

  it('replaces the header with the season-ended notice off-season', () => {
    render(<ZonePopupCard popup={zonePopup(zone({ off_season: true }), forecastCenter)} />)

    expect(screen.getByText('Forecasts ended for the season')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
