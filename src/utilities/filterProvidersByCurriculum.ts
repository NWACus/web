import type { Provider } from '@/payload-types'

type CurriculumProvider = Pick<Provider, 'curriculum'>

// Parse a comma-separated curriculum filter param into trimmed, lowercased values
export function parseCurriculumFilter(curriculum: string | null | undefined): string[] {
  if (!curriculum) return []
  return curriculum
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.length > 0)
}

/**
 * Filters providers to those that have at least one of the selected curricula.
 * When no curriculum filter is given, returns all providers unchanged.
 */
export function filterProvidersByCurriculum<T extends CurriculumProvider>(
  providers: T[],
  curriculumFilter?: string | null,
): T[] {
  const selected = parseCurriculumFilter(curriculumFilter)
  if (selected.length === 0) return providers
  return providers.filter(
    (provider) =>
      provider.curriculum && provider.curriculum.some((c) => selected.includes(c.toLowerCase())),
  )
}
