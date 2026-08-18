import type { Provider } from '@/payload-types'
import { groupProvidersByState, parseStatesFilter } from '@/utilities/groupProvidersByState'

// Minimal provider factory: only the fields the grouping logic reads
function makeProvider(name: string, statesServiced: Provider['statesServiced'], id = name) {
  return { id, name, statesServiced }
}

describe('parseStatesFilter', () => {
  it('returns an empty array for null/undefined/empty', () => {
    expect(parseStatesFilter(null)).toEqual([])
    expect(parseStatesFilter(undefined)).toEqual([])
    expect(parseStatesFilter('')).toEqual([])
  })

  it('splits, trims, and drops empty entries', () => {
    expect(parseStatesFilter('WA, OR ,,CA')).toEqual(['WA', 'OR', 'CA'])
  })
})

describe('groupProvidersByState', () => {
  const providers = [
    makeProvider('Zeta', ['WA']),
    makeProvider('Alpha', ['WA', 'OR']),
    makeProvider('Beta', ['CA']),
    makeProvider('Intl Co', ['INTL']),
  ]

  it('groups providers by each serviced state', () => {
    const { providersByState } = groupProvidersByState(providers)
    expect(providersByState['WA'].map((p) => p.name)).toEqual(['Alpha', 'Zeta'])
    expect(providersByState['OR'].map((p) => p.name)).toEqual(['Alpha'])
    expect(providersByState['CA'].map((p) => p.name)).toEqual(['Beta'])
  })

  it('sorts states alphabetically with INTL last when no filter is given', () => {
    const { states } = groupProvidersByState(providers)
    expect(states).toEqual(['CA', 'OR', 'WA', 'INTL'])
  })

  it('restricts states to the selected filter set', () => {
    const { states, providersByState } = groupProvidersByState(providers, 'WA,OR')
    expect(states).toEqual(['OR', 'WA'])
    // A provider serving multiple states appears under each selected state
    expect(providersByState['WA'].map((p) => p.name)).toEqual(['Alpha', 'Zeta'])
    expect(providersByState['OR'].map((p) => p.name)).toEqual(['Alpha'])
  })

  it('ignores selected states that have no providers', () => {
    const { states } = groupProvidersByState(providers, 'WA,NY')
    expect(states).toEqual(['WA'])
  })

  it('keeps INTL last even when filtered', () => {
    const { states } = groupProvidersByState(providers, 'INTL,WA')
    expect(states).toEqual(['WA', 'INTL'])
  })

  it('shows all states when the filter is empty', () => {
    const { states } = groupProvidersByState(providers, '')
    expect(states).toEqual(['CA', 'OR', 'WA', 'INTL'])
  })
})
