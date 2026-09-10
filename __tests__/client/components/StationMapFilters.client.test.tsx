import { StationMapFilters } from '@/components/stationMap/StationMapFilters'
import {
  DEFAULT_FILTERS,
  type StationMapFilters as Filters,
  type MapPoint,
} from '@/services/snowobs/stationMap/filters'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const variables = [
  { variable: 'snow_depth', longName: 'Snow Depth' },
  { variable: 'air_temp', longName: 'Air Temperature' },
]

const points: MapPoint[] = [
  {
    kind: 'station',
    id: 'station-57',
    station: {
      stid: '57',
      name: 'White Chuck Mountain',
      source: 'nwac',
      coordinates: [-121, 48],
      elevation: null,
      observedAt: null,
      data: {},
      zone: 'Other',
      href: null,
    },
  },
  {
    kind: 'webcam',
    id: 'webcam-1',
    webcam: { id: 1, title: 'Dirtyface cam', coordinates: [-121, 48], images: [], zone: 'Other' },
  },
]

function renderFilters(
  filters: Filters = DEFAULT_FILTERS,
  zoneNames = ['Olympics', 'Mt Hood', 'Stevens Pass'],
) {
  const onChange = jest.fn()
  const onReset = jest.fn()
  const onSearchSelect = jest.fn()
  render(
    <StationMapFilters
      filters={filters}
      onChange={onChange}
      onReset={onReset}
      variables={variables}
      zoneNames={zoneNames}
      visibleCount={12}
      searchPoints={points}
      onSearchSelect={onSearchSelect}
      tableHref="/weather/stations"
    />,
  )
  return { onChange, onReset, onSearchSelect }
}

describe('StationMapFilters', () => {
  it('offers the marker labels in widget order behind the Station Labels menu', () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole('button', { name: /Station Labels/ }))

    const labels = screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)
    expect(labels).toEqual(['Show All', 'Air Temperature', 'Snow Depth'])

    fireEvent.click(screen.getByLabelText('Air Temperature'))
    expect(onChange).toHaveBeenCalledWith({ variable: 'air_temp' })
  })

  it('offers the recency choices', () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole('button', { name: /Last Updated/ }))
    fireEvent.click(screen.getByLabelText('3 hours'))
    expect(onChange).toHaveBeenCalledWith({ withinMinutes: 180 })
  })

  it('adds and removes zones', () => {
    const { onChange } = renderFilters({ ...DEFAULT_FILTERS, zones: ['Olympics'] })
    fireEvent.click(screen.getByRole('button', { name: /^Zone/ }))
    fireEvent.click(screen.getByLabelText('Mt Hood'))
    expect(onChange).toHaveBeenCalledWith({ zones: ['Olympics', 'Mt Hood'] })

    fireEvent.click(screen.getByLabelText('All Zones'))
    expect(onChange).toHaveBeenCalledWith({ zones: [] })
  })

  it('hides the zone menu when there is no real choice', () => {
    renderFilters(DEFAULT_FILTERS, ['Only', 'Two'])
    expect(screen.queryByRole('button', { name: /^Zone/ })).not.toBeInTheDocument()
  })

  it('shows active filters as removable chips with a reset', () => {
    const { onChange, onReset } = renderFilters({
      ...DEFAULT_FILTERS,
      variable: 'air_temp',
      withinMinutes: 60,
      source: 'synoptic-data',
      zones: ['Olympics'],
      type: 'stations',
    })

    expect(screen.getByText('Air Temperature')).toBeInTheDocument()
    expect(screen.getByText('Within 1 hour')).toBeInTheDocument()
    expect(screen.getByText('synoptic data')).toBeInTheDocument()
    expect(screen.getByText('Olympics')).toBeInTheDocument()
    expect(screen.getByText('stations')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove Olympics filter' }))
    expect(onChange).toHaveBeenCalledWith({ zones: [] })

    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(onReset).toHaveBeenCalled()
  })

  it('shows no chips when nothing is filtered', () => {
    renderFilters()
    expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument()
  })

  it('finds stations and webcams by name and hands the pick back', () => {
    const { onSearchSelect } = renderFilters()
    const [search] = screen.getAllByRole('searchbox', { name: 'Search for station' })
    fireEvent.change(search, { target: { value: 'white chuck' } })

    fireEvent.click(screen.getByRole('button', { name: /White Chuck Mountain/ }))
    expect(onSearchSelect).toHaveBeenCalledWith(points[0])
  })

  it('says so when a search finds nothing', () => {
    renderFilters()
    const [search] = screen.getAllByRole('searchbox', { name: 'Search for station' })
    fireEvent.change(search, { target: { value: 'zzzz' } })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('links to the table view', () => {
    renderFilters()
    expect(screen.getByRole('link', { name: /Table/ })).toHaveAttribute('href', '/weather/stations')
  })
})
