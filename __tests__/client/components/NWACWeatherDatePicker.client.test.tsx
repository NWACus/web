import { DatePicker, dateHref } from '@/components/NWACWeather/DatePicker.client'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const DATES = ['2026-09-15', '2026-09-17', '2026-09-22', '2026-09-23']
const TODAY = '2026-09-23'

describe('dateHref', () => {
  it('keeps today on the plain weather page', () => {
    expect(dateHref(TODAY, TODAY)).toBe('/weather/forecast')
    expect(dateHref('2026-09-17', TODAY)).toBe('/weather/forecast/2026-09-17')
  })
})

describe('DatePicker', () => {
  it('steps to the neighboring published dates, skipping days with none', () => {
    render(<DatePicker date="2026-09-17" dates={DATES} today={TODAY} />)
    expect(screen.getByRole('link', { name: 'Older forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast/2026-09-15',
    )
    expect(screen.getByRole('link', { name: 'Newer forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast/2026-09-22',
    )
    expect(screen.getByRole('button', { name: /Sep 17, 2026/ })).toBeInTheDocument()
  })

  it('links the next step back to today at the plain page', () => {
    render(<DatePicker date="2026-09-22" dates={DATES} today={TODAY} />)
    expect(screen.getByRole('link', { name: 'Newer forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast',
    )
  })

  it('disables a step with nowhere to go', () => {
    render(<DatePicker date={TODAY} dates={DATES} today={TODAY} />)
    expect(screen.queryByRole('link', { name: 'Newer forecast' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Newer forecast' })).toBeDisabled()
  })
})
