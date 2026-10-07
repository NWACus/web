import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { StationPageSummary } from '@/services/stations/getStationPages'

const page = (slug: string, displayName: string, archived = false): StationPageSummary => ({
  slug,
  displayName,
  archived,
  stations: [],
})

// Radix Select scrolls the chosen item into view; jsdom has no layout.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn()
})

describe('StationPicker', () => {
  it('lists retired pages last, under a Retired label', () => {
    render(
      <StationPicker
        pages={[
          page('alpental', 'Alpental Ski Area'),
          page('helens', 'Mt. St. Helens', true),
          page('paradise', 'Paradise'),
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('combobox', { name: 'Jump to a weather station' }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Alpental Ski Area',
      'Paradise',
      'Mt. St. Helens',
    ])
    const retired = screen.getByRole('group')
    expect(within(retired).getByText('Retired')).toBeInTheDocument()
    expect(within(retired).getByRole('option', { name: 'Mt. St. Helens' })).toBeInTheDocument()
  })

  it('has no Retired group when nothing is retired', () => {
    render(<StationPicker pages={[page('alpental', 'Alpental Ski Area')]} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Jump to a weather station' }))
    expect(screen.queryByText('Retired')).not.toBeInTheDocument()
  })
})
