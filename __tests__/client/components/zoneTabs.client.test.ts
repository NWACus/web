import {
  cardDate,
  forecastTabLabel,
  parseZoneTab,
  sizeTone,
  triggerLabel,
  zoneObservationsEndpoint,
} from '@/components/forecast/zoneObservations/zoneTabs'
import { ProductType } from '@/services/nac/types/forecastSchemas'

describe('zone tab vocabulary', () => {
  it('reads only the two zone tabs from the query', () => {
    expect(parseZoneTab('observations')).toBe('observations')
    expect(parseZoneTab('avalanches')).toBe('avalanches')
    expect(parseZoneTab('weather')).toBe('forecast')
    expect(parseZoneTab(null)).toBe('forecast')
  })

  it('labels the first tab as the widget does', () => {
    expect(forecastTabLabel(ProductType.Forecast)).toBe('Avalanche Forecast')
    expect(forecastTabLabel(ProductType.Summary)).toBe('Avalanche Information')
  })

  it('formats card dates as MMM D, YYYY', () => {
    expect(cardDate('2026-03-02')).toBe('Mar 2, 2026')
  })

  it('groups trigger codes as the widget’s triggerSimple does', () => {
    expect(triggerLabel('AM')).toBe('Human')
    expect(triggerLabel('N')).toBe('Natural')
    expect(triggerLabel('AE')).toBe('Explosive')
    expect(triggerLabel('AW')).toBe('Wildlife')
    expect(triggerLabel('U')).toBe('Unknown')
    expect(triggerLabel(null)).toBe('')
  })

  it('tints D-size by whole size', () => {
    expect(sizeTone('1.5')).toBe('yellow')
    expect(sizeTone('2.5')).toBe('orange')
    expect(sizeTone('3')).toBe('red')
    expect(sizeTone('4')).toBe('black')
  })

  it('encodes the zone slug in the endpoint', () => {
    expect(zoneObservationsEndpoint('snfac', 'galena-summit-&-eastern-mtns')).toBe(
      '/api/snfac/zone-observations?zone=galena-summit-%26-eastern-mtns',
    )
  })
})
