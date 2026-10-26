import { InlineFiltersPanel } from '@/components/filters/InlineFiltersPanel'
import '@testing-library/jest-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

describe('InlineFiltersPanel', () => {
  const scrollIntoView = jest.fn()

  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    cleanup()
    scrollIntoView.mockClear()
  })

  const renderPanel = () =>
    render(
      <InlineFiltersPanel docLabel="courses" docCount={12} hasActiveFilters={false}>
        <label>
          <input type="checkbox" /> Level 1
        </label>
      </InlineFiltersPanel>,
    )

  it('starts closed, with the filters out of reach', () => {
    renderPanel()

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('region', { name: 'Filters' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('opens in place under the Filters button', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Filters' })).toBeVisible()
    expect(screen.getByRole('checkbox')).toBeVisible()
  })

  it('closes from the Show button and returns focus to the Filters button', () => {
    renderPanel()
    const filtersButton = screen.getByRole('button', { name: 'Filters' })
    const focus = jest.spyOn(filtersButton, 'focus')

    fireEvent.click(filtersButton)
    fireEvent.click(screen.getByRole('button', { name: 'Show 12 courses' }))

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false')
    expect(filtersButton).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    // Inside a content-height iframe, this is what brings the results back on the partner page.
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(screen.queryByRole('region', { name: 'Filters' })).not.toBeInTheDocument()
  })

  it('closes from the Filters button too', () => {
    renderPanel()
    const filtersButton = screen.getByRole('button', { name: 'Filters' })

    fireEvent.click(filtersButton)
    fireEvent.click(filtersButton)

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false')
  })
})
