import { LEGACY_GLOSSARY_TERMS } from '@/services/glossary/legacyGlossaryTerms'
import type { GlossarySeedPayload, GlossaryTermSeed } from '@/services/glossary/seedGlossaryTerms'
import { seedGlossaryTerms } from '@/services/glossary/seedGlossaryTerms'

type Created = { data: GlossaryTermSeed; context: { disableRevalidate: boolean } }

// Enough of the local API for the seed: `find` answers with what exists, `create` records what the
// seed decided.
function fakePayload(existing: string[] = []) {
  const created: Created[] = []
  const payload: GlossarySeedPayload = {
    find: async () => ({ docs: existing.map((term) => ({ term })) }),
    create: async ({ data, context }) => {
      created.push({ data, context })
      return data
    },
  }
  return { payload, created }
}

describe('seedGlossaryTerms', () => {
  it('creates all 82 legacy terms without revalidating anything', async () => {
    const { payload, created } = fakePayload()
    expect(await seedGlossaryTerms(payload)).toEqual({ termsCreated: 82 })
    expect(created).toHaveLength(82)
    expect(created.every(({ context }) => context.disableRevalidate)).toBe(true)
  })

  it('leaves a term that already exists as an editor has it, whatever its case', async () => {
    const { payload, created } = fakePayload(['anchors'])
    expect(await seedGlossaryTerms(payload)).toEqual({ termsCreated: 81 })
    expect(created.some(({ data }) => data.term === 'Anchors')).toBe(false)
  })
})

describe('LEGACY_GLOSSARY_TERMS', () => {
  it('has one entry per legacy term, each unique, defined and linked', () => {
    const terms = LEGACY_GLOSSARY_TERMS.map(({ term }) => term.toLowerCase())
    expect(new Set(terms).size).toBe(82)
    for (const { definition, link, aliases, term } of LEGACY_GLOSSARY_TERMS) {
      expect(definition.trim()).toBe(definition)
      expect(definition).not.toMatch(/\\n/)
      expect(link).toMatch(/^https:\/\/avalanche\.org\//)
      expect(aliases.map((a) => a.toLowerCase())).not.toContain(term.toLowerCase())
    }
  })
})
