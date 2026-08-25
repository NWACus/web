// Publish-gate behaviors: an incomplete forecast blocks publish with the
// grouped missing-field summary; a complete one publishes now or scheduled.
import {
  emptyForecast,
  extendedBlocksFor,
  periodsFor,
  type ForecastPoint,
  type MwfForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { PublishModal } from '@/views/MwfEditor/PublishModal'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const ZONES: Zone[] = [{ id: 'olympics', name: 'Olympics' }]
const POINTS: ForecastPoint[] = [
  { code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 47.9, lng: -123.4 },
]

function completeForecast(): MwfForecast {
  const fc = emptyForecast(ZONES, POINTS, 'morning', new Date(2026, 7, 25))
  fc.meta.initialDate = '2026-08-25'
  const periods = periodsFor('morning').map((p) => p.key)
  periods.forEach((k) => {
    fc.precip.HUR[k].qpf = 0.1
    fc.precip.HUR[k].density = 10
    fc.temps.olympics[k].high = 30
    fc.temps.olympics[k].low = 20
  })
  Object.keys(fc.snowLevel.olympics).forEach((bk) => {
    fc.snowLevel.olympics[bk].freezing = 5000
    fc.wind.olympics[bk].dir = 'SW'
    fc.wind.olympics[bk].speed = 15
  })
  fc.sensible.olympics.morning = 'Snow.'
  fc.sensible.olympics.afternoon = 'Clearing.'
  fc.discussion.synopsis = 'Synopsis.'
  fc.discussion.extended = 'Extended.'
  expect(extendedBlocksFor('morning')).toEqual([])
  return fc
}

function renderModal(fc: MwfForecast, onConfirm = jest.fn()) {
  render(
    <PublishModal
      forecast={fc}
      zones={ZONES}
      points={POINTS}
      extendedZones={[]}
      isCorrection={false}
      busy={false}
      onConfirm={onConfirm}
      onClose={jest.fn()}
    />,
  )
  return onConfirm
}

describe('PublishModal', () => {
  it('blocks publish and groups missing fields by section', () => {
    const fc = completeForecast()
    fc.precip.HUR.d1.qpf = null
    fc.discussion.synopsis = ''
    renderModal(fc)
    expect(screen.getByText(/Publish is blocked/)).toBeInTheDocument()
    expect(screen.getByText(/Precip: 1 missing \(HUR D1 QPF\)/)).toBeInTheDocument()
    expect(screen.getByText(/Discussion: 1 missing/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  })

  it('publishes a complete forecast immediately', () => {
    const onConfirm = renderModal(completeForecast())
    const button = screen.getByRole('button', { name: 'Publish' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('schedules a publish for the chosen time', () => {
    const onConfirm = renderModal(completeForecast())
    fireEvent.click(screen.getByLabelText(/Schedule for/))
    const timeInput = screen.getByLabelText('Scheduled publish time')
    fireEvent.change(timeInput, { target: { value: '2026-08-25T22:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule publish' }))
    expect(onConfirm).toHaveBeenCalledWith('2026-08-25T22:30')
  })

  it('labels a correction publish as such', () => {
    const fc = completeForecast()
    render(
      <PublishModal
        forecast={fc}
        zones={ZONES}
        points={POINTS}
        extendedZones={[]}
        isCorrection
        busy={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Publish correction' })).toBeInTheDocument()
  })
})
