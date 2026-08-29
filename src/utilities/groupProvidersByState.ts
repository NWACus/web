import type { Provider } from '@/payload-types'

// The grouping logic only depends on a provider's name and serviced states
type GroupableProvider = Pick<Provider, 'name' | 'statesServiced'>

export type ProvidersByState = { [state: string]: Provider[] }

// Parse a comma-separated states filter param into trimmed, non-empty state codes
export function parseStatesFilter(states: string | null | undefined): string[] {
  if (!states) return []
  return states
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Groups published providers by the states they service and returns the sorted
 * list of states to render. When `statesFilter` (a comma-separated list of state
 * codes) is provided, the returned states are restricted to the selected set
 * (intersected with the states that actually have providers). States are sorted
 * alphabetically with `INTL` always last.
 */
export function groupProvidersByState<T extends GroupableProvider>(
  providers: T[],
  statesFilter?: string | null,
): { states: string[]; providersByState: { [state: string]: T[] } } {
  const providersByState: { [state: string]: T[] } = {}

  providers.forEach((provider) => {
    if (provider.statesServiced && provider.statesServiced.length > 0) {
      provider.statesServiced.forEach((state) => {
        if (!providersByState[state]) {
          providersByState[state] = []
        }
        providersByState[state].push(provider)
      })
    }
  })

  // Sort providers alphabetically by name within each state
  for (const state of Object.keys(providersByState)) {
    providersByState[state].sort((a, b) => a.name.localeCompare(b.name))
  }

  const selectedStates = new Set(parseStatesFilter(statesFilter))

  let states = Object.keys(providersByState)
  if (selectedStates.size > 0) {
    states = states.filter((state) => selectedStates.has(state))
  }

  // Sort states alphabetically, but always put International (INTL) last
  states.sort((a, b) => {
    if (a === 'INTL') return 1
    if (b === 'INTL') return -1
    return a.localeCompare(b)
  })

  return { states, providersByState }
}
