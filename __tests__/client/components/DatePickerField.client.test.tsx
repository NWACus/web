import { DatePickerField } from '@/components/DatePicker'
import type { StartDateBounds } from '@/utilities/queries/getStartDateBounds'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

// Pinned clock so "today" is always Nov 2026
const NOW = new Date(2026, 10, 25, 12)

const BOUNDS: StartDateBounds = {
  earliest: new Date(2024, 2, 10, 9).toISOString(),
  latest: new Date(2027, 5, 20, 9).toISOString(),
}

function openPicker({ value = '', dateBounds = BOUNDS } = {}) {
  render(
    <DatePickerField
      label="Start Date"
      id="start"
      value={value}
      onChange={jest.fn()}
      dateBounds={dateBounds}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Start Date' }))
}

function yearOptions() {
  fireEvent.click(screen.getByRole('combobox', { name: /year/i }))
  return screen.getAllByRole('option').map((option) => option.textContent)
}

function navButton(name: RegExp) {
  return screen.getByRole('button', { name })
}

describe('DatePickerField', () => {
  beforeAll(() => {
    // Radix Select scrolls the chosen item into view; jsdom has no layout.
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW, advanceTimers: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('offers years from the earliest to the latest start date', () => {
    openPicker()
    expect(yearOptions()).toEqual(['2024', '2025', '2026', '2027'])
  })

  it('stops next-month navigation at the month of the latest start date', () => {
    openPicker({ value: '06-15-2027' })
    expect(screen.getByRole('combobox', { name: /month/i })).toHaveTextContent('Jun')
    expect(navButton(/next month/i)).toHaveAttribute('aria-disabled', 'true')
  })

  it('stops previous-month navigation at the month of the earliest start date', () => {
    openPicker({ value: '03-15-2024' })
    expect(screen.getByRole('combobox', { name: /month/i })).toHaveTextContent('Mar')
    expect(navButton(/previous month/i)).toHaveAttribute('aria-disabled', 'true')
  })

  it('still reaches the current month when every start date is in the past', () => {
    openPicker({
      dateBounds: {
        earliest: new Date(2023, 0, 5).toISOString(),
        latest: new Date(2025, 4, 5).toISOString(),
      },
    })
    expect(yearOptions()).toEqual(['2023', '2024', '2025', '2026'])
  })

  it('limits the calendar to the current month when there are no start dates', () => {
    openPicker({ dateBounds: { earliest: null, latest: null } })
    expect(navButton(/previous month/i)).toHaveAttribute('aria-disabled', 'true')
    expect(navButton(/next month/i)).toHaveAttribute('aria-disabled', 'true')
  })

  it('navigates when a year is chosen from the dropdown', () => {
    openPicker()
    fireEvent.click(screen.getByRole('combobox', { name: /year/i }))
    fireEvent.click(screen.getByRole('option', { name: '2027' }))
    expect(screen.getByRole('combobox', { name: /year/i })).toHaveTextContent('2027')
  })
})
