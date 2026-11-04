import { EventsFilterMenus } from '@/app/(frontend)/[center]/events/EventsFilterBar'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'

const OPTIONS = {
  types: [
    { label: 'Event', value: 'event' },
    { label: 'Field Class', value: 'field-class' },
  ],
  modesOfTravel: [{ label: 'Ski', value: 'ski' }],
  groups: [],
  tags: [],
}

function quickDates(id: string) {
  const filter = QUICK_DATE_FILTERS_EVENTS.find((f) => f.id === id)
  if (!filter) throw new Error(`No quick date filter ${id}`)
  return { startDate: filter.startDate(), endDate: filter.endDate() ?? '' }
}

function renderMenus(searchParams: Record<string, string> = {}) {
  const onUrlUpdate = jest.fn((_event: UrlUpdateEvent) => {})
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <EventsFilterMenus options={OPTIONS} />
    </NuqsTestingAdapter>,
  )
  // nuqs writes the URL on the next tick.
  const lastUrl = async () => {
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    return onUrlUpdate.mock.calls.at(-1)?.[0].searchParams
  }
  return { lastUrl }
}

describe('EventsFilterMenus', () => {
  it('shows the dates in effect and how many of each filter are picked', () => {
    renderMenus({ ...quickDates('this-week'), types: 'field-class,event' })

    expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Type 2 selected' })).toBeInTheDocument()
  })

  it('hides a filter with nothing to pick', () => {
    renderMenus()

    expect(screen.queryByRole('button', { name: /^Group/ })).not.toBeInTheDocument()
  })

  it('closes the date menu once a date option is picked', async () => {
    const { lastUrl } = renderMenus()

    fireEvent.click(screen.getByRole('button', { name: 'Upcoming' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next Month' }))

    expect((await lastUrl())?.get('startDate')).toBe(quickDates('next-month').startDate)
    expect(screen.queryByRole('button', { name: 'This Week' })).not.toBeInTheDocument()
  })

  it('clears the dates back to upcoming', async () => {
    const { lastUrl } = renderMenus(quickDates('next-month'))

    fireEvent.click(screen.getByRole('button', { name: 'Next Month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    const params = await lastUrl()
    expect(params?.get('startDate')).toBe(quickDates('upcoming').startDate)
    expect(params?.get('endDate')).toBeNull()
  })

  it('keeps a checkbox menu open to pick several', async () => {
    const { lastUrl } = renderMenus()

    fireEvent.click(screen.getByRole('button', { name: 'Type' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Field Class' }))

    expect((await lastUrl())?.get('types')).toBe('field-class')
    expect(screen.getByRole('checkbox', { name: 'Event' })).toBeInTheDocument()
  })
})
