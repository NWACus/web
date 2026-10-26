import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('ForecastHeader', () => {
  it('lists issued, expires and author in the widget order and date format, without a timezone', () => {
    render(
      <ForecastHeader
        forecast={{
          published_time: '2026-04-05T12:19:00Z',
          expires_time: '2026-04-06T10:00:00Z',
          author: 'Test Forecaster A',
        }}
        timezone="America/Denver"
      />,
    )

    const terms = screen.getAllByRole('term').map((el) => el.textContent)
    expect(terms).toEqual(['Issued', 'Expires', 'Author'])
    expect(screen.getByText('Sunday, April 5, 2026 - 6:19AM')).toBeInTheDocument()
    expect(screen.getByText('Monday, April 6, 2026 - 4:00AM')).toBeInTheDocument()
    expect(screen.getByText('Test Forecaster A')).toBeInTheDocument()
    expect(screen.queryByText(/MDT/)).not.toBeInTheDocument()
  })

  it('omits a field the product does not carry', () => {
    render(
      <ForecastHeader
        forecast={{ published_time: '2026-04-05T12:19:00Z', expires_time: null, author: '' }}
        timezone="America/Denver"
      />,
    )

    expect(screen.getAllByRole('term').map((el) => el.textContent)).toEqual(['Issued'])
  })
})
