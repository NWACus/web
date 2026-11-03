import type { Provider } from '@/payload-types'
import {
  filterProvidersByCurriculum,
  parseCurriculumFilter,
} from '@/utilities/filterProvidersByCurriculum'
import { groupProvidersByState } from '@/utilities/groupProvidersByState'

type TestProvider = Pick<Provider, 'curriculum' | 'name' | 'statesServiced'>

function makeProvider(
  name: string,
  curriculum: Provider['curriculum'],
  statesServiced: Provider['statesServiced'] = [],
): TestProvider {
  return { name, curriculum, statesServiced }
}

describe('parseCurriculumFilter', () => {
  it('returns an empty array for null/undefined/empty', () => {
    expect(parseCurriculumFilter(null)).toEqual([])
    expect(parseCurriculumFilter(undefined)).toEqual([])
    expect(parseCurriculumFilter('')).toEqual([])
  })

  it('splits, trims, lowercases, and drops empty entries', () => {
    expect(parseCurriculumFilter('AIARE, aai ,,sas')).toEqual(['aiare', 'aai', 'sas'])
  })

  it('handles a single value', () => {
    expect(parseCurriculumFilter('aiare')).toEqual(['aiare'])
  })
})

describe('filterProvidersByCurriculum', () => {
  const providers: TestProvider[] = [
    makeProvider('Provider A', ['aiare'], ['WA']),
    makeProvider('Provider B', ['aiare', 'provider-developed'], ['CA']),
    makeProvider('Provider C', ['aai'], ['CO']),
    makeProvider('Provider D', null, ['WY']),
    makeProvider('Provider E', [], ['OR']),
  ]

  it('returns all providers when no filter is given', () => {
    expect(filterProvidersByCurriculum(providers)).toEqual(providers)
    expect(filterProvidersByCurriculum(providers, null)).toEqual(providers)
    expect(filterProvidersByCurriculum(providers, '')).toEqual(providers)
  })

  it('filters providers by a single curriculum', () => {
    const result = filterProvidersByCurriculum(providers, 'aiare')
    expect(result.map((p) => p.name)).toEqual(['Provider A', 'Provider B'])
  })

  it('filters providers by multiple curricula (OR logic)', () => {
    const result = filterProvidersByCurriculum(providers, 'aiare,aai')
    expect(result.map((p) => p.name)).toEqual(['Provider A', 'Provider B', 'Provider C'])
  })

  it('matches case-insensitively', () => {
    const result = filterProvidersByCurriculum(providers, 'AIARE')
    expect(result.map((p) => p.name)).toEqual(['Provider A', 'Provider B'])
  })

  it('excludes providers with null or empty curriculum', () => {
    const result = filterProvidersByCurriculum(providers, 'aiare')
    expect(result.map((p) => p.name)).not.toContain('Provider D')
    expect(result.map((p) => p.name)).not.toContain('Provider E')
  })

  it('returns empty array when filter matches no providers', () => {
    const result = filterProvidersByCurriculum(providers, 'mtc')
    expect(result).toEqual([])
  })

  it('finds providers with provider-developed curriculum', () => {
    const result = filterProvidersByCurriculum(providers, 'provider-developed')
    expect(result.map((p) => p.name)).toEqual(['Provider B'])
  })

  it('works together with state filtering via groupProvidersByState', () => {
    const filtered = filterProvidersByCurriculum(providers, 'aiare,aai')
    const { states, providersByState } = groupProvidersByState(filtered, 'WA,CA')
    expect(states).toEqual(['CA', 'WA'])
    expect(providersByState['WA'].map((p) => p.name)).toEqual(['Provider A'])
    expect(providersByState['CA'].map((p) => p.name)).toEqual(['Provider B'])
  })
})
