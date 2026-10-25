import { BottomLine } from '@/components/forecast/BottomLine'
import { DangerLevel } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

describe('BottomLine', () => {
  // Forecast-75
  it("opens the highest danger's travel advice from its icon", () => {
    render(<BottomLine html="<p>Careful out there.</p>" dangerLevel={DangerLevel.High} />)

    const trigger = screen.getByRole('button', { name: 'Travel advice for 4 - High' })
    expect(trigger.querySelector('img')).toHaveAttribute('alt', '')

    fireEvent.click(trigger)

    expect(screen.getByText('Very dangerous avalanche conditions.')).toBeInTheDocument()
  })
})
