import { STATION_PERIODS } from '@/components/WeatherStations/stationPeriods'
import { StationRangePicker } from '@/components/WeatherStations/StationRangePicker'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const TZ = 'America/Los_Angeles'
const WEEK = STATION_PERIODS.find((p) => p.key === '7d') ?? STATION_PERIODS[0]

function renderPicker() {
  const onApplyCustom = jest.fn()
  const onSelectPeriod = jest.fn()
  render(
    <StationRangePicker
      periods={STATION_PERIODS}
      activePeriod={WEEK}
      custom={null}
      onSelectPeriod={onSelectPeriod}
      onApplyCustom={onApplyCustom}
      maxDays={30}
      timeZone={TZ}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Date range: 7 days' }))
  return { onApplyCustom, onSelectPeriod }
}

function typeInto(label: string, text: string) {
  const field = screen.getByRole('textbox', { name: label })
  fireEvent.change(field, { target: { value: text } })
  return field
}

beforeAll(() => {
  jest.useFakeTimers({ now: new Date('2026-10-18T19:00:00Z'), doNotFake: ['queueMicrotask'] })
})

afterAll(() => {
  jest.useRealTimers()
})

describe('StationRangePicker', () => {
  it('names the preset in view', () => {
    renderPicker()
    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue('Oct 11, 2026')
    expect(screen.getByRole('textbox', { name: 'End date' })).toHaveValue('Oct 18, 2026')
  })

  it('keeps the picker open when a typed start date is tabbed away from', () => {
    const { onApplyCustom } = renderPicker()
    fireEvent.blur(typeInto('Start date', '9/1/26'))
    expect(onApplyCustom).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue('Sep 1, 2026')
    expect(screen.getByRole('textbox', { name: 'End date' })).toBeInTheDocument()
  })

  it('applies typed dates on Enter', () => {
    const { onApplyCustom } = renderPicker()
    fireEvent.blur(typeInto('Start date', '9/1/26'))
    fireEvent.keyDown(typeInto('End date', 'Sep 30, 2026'), { key: 'Enter' })
    expect(onApplyCustom).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('does not apply a typed range past the cap, and says why', () => {
    const { onApplyCustom } = renderPicker()
    fireEvent.keyDown(typeInto('Start date', '9/1/26'), { key: 'Enter' })
    expect(onApplyCustom).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a range of up to 30 days.')
  })

  it('reverts text that is not a date', () => {
    renderPicker()
    fireEvent.blur(typeInto('Start date', 'soon'))
    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue('Oct 11, 2026')
  })

  it('picks a preset from the list', () => {
    const { onSelectPeriod, onApplyCustom } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: '30 days' }))
    expect(onSelectPeriod).toHaveBeenCalledWith('30d')
    expect(onApplyCustom).not.toHaveBeenCalled()
  })

  it('applies a whole season, up to today for the current one', () => {
    const { onApplyCustom } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: '2026–27' }))
    expect(onApplyCustom).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-10-18' })
  })

  it('offers the current season and last season only', () => {
    const { onApplyCustom } = renderPicker()
    expect(screen.queryByRole('button', { name: '2024–25' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '2025–26' }))
    expect(onApplyCustom).toHaveBeenCalledWith({ from: '2025-09-01', to: '2026-08-31' })
  })

  it('reverts a typed date outside the season in view', () => {
    renderPicker()
    fireEvent.blur(typeInto('Start date', '8/15/26'))
    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue('Oct 11, 2026')
  })

  it('opens on the month a range ends in', () => {
    render(
      <StationRangePicker
        periods={STATION_PERIODS}
        activePeriod={WEEK}
        custom={{ from: '2026-09-28', to: '2026-10-05' }}
        onSelectPeriod={jest.fn()}
        onApplyCustom={jest.fn()}
        maxDays={30}
        timeZone={TZ}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Date range/ }))

    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
  })

  it('reopens on the range in view after browsing elsewhere', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: 'Date range: 7 days' })
    fireEvent.click(trigger)
    fireEvent.click(trigger)

    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
  })

  it('names a range that matches a season', () => {
    render(
      <StationRangePicker
        periods={STATION_PERIODS}
        activePeriod={WEEK}
        custom={{ from: '2025-09-01', to: '2026-08-31' }}
        onSelectPeriod={jest.fn()}
        onApplyCustom={jest.fn()}
        maxDays={366}
        timeZone={TZ}
      />,
    )
    expect(screen.getByRole('button', { name: 'Date range: 2025–26' })).toBeInTheDocument()
  })
})
