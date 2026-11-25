import { DatePickerField } from '@/components/DatePicker'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

// Pinned clock so the year bounds don't depend on the real date
const NOW = new Date(2026, 10, 25, 12)

function openPicker(value = '') {
  render(<DatePickerField label="Start Date" id="start" value={value} onChange={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Date' }))
}

function yearOptions() {
  fireEvent.click(screen.getByRole('combobox', { name: /year/i }))
  return screen.getAllByRole('option').map((option) => option.textContent)
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

  it('offers years from five years back through next year', () => {
    openPicker()
    expect(yearOptions()).toEqual(['2021', '2022', '2023', '2024', '2025', '2026', '2027'])
  })

  it('stops next-month navigation at December of next year', () => {
    openPicker('12-15-2027')
    expect(screen.getByRole('combobox', { name: /year/i })).toHaveTextContent('2027')
    expect(screen.getByRole('combobox', { name: /month/i })).toHaveTextContent('Dec')
    expect(screen.getByRole('button', { name: /next month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('stops previous-month navigation at January of the earliest year', () => {
    openPicker('01-10-2021')
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('navigates when a year is chosen from the dropdown', () => {
    openPicker()
    fireEvent.click(screen.getByRole('combobox', { name: /year/i }))
    fireEvent.click(screen.getByRole('option', { name: '2027' }))
    expect(screen.getByRole('combobox', { name: /year/i })).toHaveTextContent('2027')
  })
})
