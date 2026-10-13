import { ZoneSensiblePicker } from '@/components/NWACWeather/ZoneSensiblePicker.client'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const days = [
  { key: 'today', label: 'Tonight', date: 'Mon Oct 5' },
  { key: 'tomorrow', label: 'Tomorrow', date: 'Tue Oct 6' },
]
const rows = [
  { key: 'olympics', zone: 'Olympics', text: { today: 'Rain', tomorrow: 'Showers' } },
  { key: 'snoqualmie-pass', zone: 'Snoqualmie Pass', text: { today: 'Snow', tomorrow: '' } },
]

describe('ZoneSensiblePicker', () => {
  it("opens on the page's zone and shows its sensible weather by day", () => {
    render(<ZoneSensiblePicker days={days} rows={rows} initialZone="snoqualmie-pass" />)

    expect(screen.getByLabelText('Use dropdown to select your zone')).toHaveDisplayValue(
      'Snoqualmie Pass',
    )
    expect(screen.getByRole('row', { name: /Tonight/ })).toHaveTextContent('Snow')
    // A day with no text for the zone reads as a dash, not an empty cell.
    expect(screen.getByRole('row', { name: /Tomorrow/ })).toHaveTextContent('—')
  })

  it('shows another zone when it is picked', () => {
    render(<ZoneSensiblePicker days={days} rows={rows} initialZone="snoqualmie-pass" />)

    fireEvent.change(screen.getByLabelText('Use dropdown to select your zone'), {
      target: { value: 'olympics' },
    })

    expect(screen.getByRole('row', { name: /Tonight/ })).toHaveTextContent('Rain')
  })
})
