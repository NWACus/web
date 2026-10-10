import { resolveStationTab, toStationTabs } from '../../src/services/stations/stationTabs'

describe('toStationTabs', () => {
  it('shows every tab when the toggles are unset', () => {
    expect(toStationTabs(undefined)).toEqual(['table', 'graphs', 'csv'])
    expect(toStationTabs({ table: null })).toEqual(['table', 'graphs', 'csv'])
  })

  it('drops the tabs switched off, keeping tab order', () => {
    expect(toStationTabs({ table: true, graphs: false, csv: true })).toEqual(['table', 'csv'])
  })

  it('falls back to every tab rather than none', () => {
    expect(toStationTabs({ table: false, graphs: false, csv: false })).toEqual([
      'table',
      'graphs',
      'csv',
    ])
  })
})

describe('resolveStationTab', () => {
  const all = toStationTabs(undefined)

  it('opens on the table, or on Download for an archived page', () => {
    expect(resolveStationTab(all, false)).toEqual({ tab: 'table', period: undefined })
    expect(resolveStationTab(all, true)).toEqual({ tab: 'csv', period: undefined })
  })

  it('treats a legacy range as the table, carrying it as the period', () => {
    expect(resolveStationTab(all, false, '24h')).toEqual({ tab: 'table', period: '24h' })
  })

  it('sends a hidden tab to the default', () => {
    expect(resolveStationTab(['table', 'csv'], false, 'graphs')).toEqual({ tab: 'table' })
    expect(resolveStationTab(['graphs', 'csv'], false, '24h')).toEqual({ tab: 'graphs' })
  })

  it('opens an archived page without Download on its first tab', () => {
    expect(resolveStationTab(['table', 'graphs'], true)).toEqual({
      tab: 'table',
      period: undefined,
    })
  })
})
