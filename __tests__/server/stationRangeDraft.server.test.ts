import {
  applicableRange,
  nextDraft,
  parseTyped,
  selectableBounds,
} from '../../src/components/WeatherStations/stationRangeDraft'

const day = (iso: string) => new Date(`${iso}T00:00:00`)

describe('nextDraft', () => {
  it('picks a start, then an end in either order', () => {
    const start = nextDraft(undefined, day('2026-10-05'))
    expect(start).toEqual({ from: day('2026-10-05'), to: undefined })
    expect(nextDraft(start, day('2026-10-09'))).toEqual({
      from: day('2026-10-05'),
      to: day('2026-10-09'),
    })
    expect(nextDraft(start, day('2026-10-01'))).toEqual({
      from: day('2026-10-01'),
      to: day('2026-10-05'),
    })
  })

  it('takes a second click on the start as a one-day range', () => {
    const start = nextDraft(undefined, day('2026-10-05'))
    expect(nextDraft(start, day('2026-10-05'))).toEqual({
      from: day('2026-10-05'),
      to: day('2026-10-05'),
    })
  })

  it('starts over after a complete range', () => {
    const complete = { from: day('2026-10-01'), to: day('2026-10-07') }
    expect(nextDraft(complete, day('2026-09-15'))).toEqual({
      from: day('2026-09-15'),
      to: undefined,
    })
  })
})

describe('selectableBounds', () => {
  const today = day('2026-10-18')

  it('allows the whole history up to today until a start is picked', () => {
    expect(selectableBounds(undefined, today, 92)).toEqual({
      earliest: day('2015-10-01'),
      latest: today,
    })
  })

  it('limits the other end to the cap around a picked start', () => {
    expect(selectableBounds({ from: day('2026-06-01') }, today, 10)).toEqual({
      earliest: day('2026-05-23'),
      latest: day('2026-06-10'),
    })
  })
})

describe('applicableRange', () => {
  it('reads an incomplete draft as a one-day range', () => {
    expect(applicableRange({ from: day('2026-10-05') }, 92, '2026-10-18')).toEqual({
      from: '2026-10-05',
      to: '2026-10-05',
    })
  })

  it('rejects ranges past the cap, in the future or before the records', () => {
    const span = (from: string, to: string) => ({ from: day(from), to: day(to) })
    expect(applicableRange(span('2026-01-01', '2026-04-02'), 92, '2026-10-18')).not.toBeNull()
    expect(applicableRange(span('2026-01-01', '2026-04-03'), 92, '2026-10-18')).toBeNull()
    expect(applicableRange(span('2026-10-10', '2026-10-19'), 92, '2026-10-18')).toBeNull()
    expect(applicableRange(span('2015-09-30', '2015-10-05'), 92, '2026-10-18')).toBeNull()
  })
})

describe('parseTyped', () => {
  it.each([
    ['Oct 1, 2026', '2026-10-01'],
    ['oct 1 2026', '2026-10-01'],
    ['10/1/2026', '2026-10-01'],
    ['10/1/26', '2026-10-01'],
    ['Oct 1, 26', '2026-10-01'],
    ['2026-10-01', '2026-10-01'],
  ])('reads %s', (text, iso) => {
    expect(parseTyped(text)).toEqual(day(iso))
  })

  it('returns null for text that is not a date', () => {
    expect(parseTyped('next tuesday')).toBeNull()
    expect(parseTyped('13/40/2026')).toBeNull()
  })
})
