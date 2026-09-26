const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

import {
  claimedMatchErrors,
  rejectClaimedMatches,
} from '@/collections/GlossaryTerms/hooks/rejectClaimedMatches'
import {
  revalidateGlossary,
  revalidateGlossaryDelete,
} from '@/collections/GlossaryTerms/hooks/revalidateGlossary'
import type { GlossaryTerm } from '@/payload-types'
import type { CollectionBeforeValidateHook } from 'payload'

describe('claimedMatchErrors', () => {
  const others = [{ term: 'Wind Slab', aliases: ['wind slabs'] }, { term: 'Cornice' }]

  it('refuses a term or alias another term already matches, ignoring case and spacing', () => {
    expect(
      claimedMatchErrors({ term: 'cornice', aliases: ['Wind  Slabs', 'drift'] }, others),
    ).toEqual([
      { path: 'term', message: '"cornice" already shows the definition of "Cornice".' },
      { path: 'aliases', message: '"Wind  Slabs" already shows the definition of "Wind Slab".' },
    ])
  })

  it('accepts text nobody else matches', () => {
    expect(claimedMatchErrors({ term: 'Wind Loading', aliases: ['wind loaded'] }, others)).toEqual(
      [],
    )
  })
})

describe('rejectClaimedMatches', () => {
  type HookArgs = Parameters<CollectionBeforeValidateHook<GlossaryTerm>>[0]

  function run(args: Pick<HookArgs, 'data' | 'originalDoc'>, existing: GlossaryTerm[]) {
    const find = jest.fn().mockResolvedValue({ docs: existing })
    const result = rejectClaimedMatches({
      ...args,
      // @ts-expect-error -- a partial request: the hook only reads payload.find and t
      req: { payload: { find }, t: (key: string) => key },
      // @ts-expect-error -- a partial collection config: the hook never reads it
      collection: { slug: 'glossaryTerms' },
      context: {},
      operation: args.originalDoc ? 'update' : 'create',
    })
    return { result, find }
  }

  const cornice: GlossaryTerm = {
    id: 2,
    term: 'Cornice',
    aliases: [],
    definition: 'Overhanging snow.',
    updatedAt: '',
    createdAt: '',
  }

  it('throws a validation error naming the clashing field', async () => {
    const { result } = run({ data: { term: 'CORNICE' } }, [cornice])
    await expect(result).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('compares against every term on create, when originalDoc has no id yet', async () => {
    // @ts-expect-error -- what Payload passes on create: an originalDoc with no id
    const { result, find } = run({ data: { term: 'Graupel' }, originalDoc: {} }, [cornice])
    await expect(result).resolves.toEqual({ term: 'Graupel' })
    expect(find.mock.calls[0][0].where).toEqual({})
  })

  it('leaves the document being edited out of the comparison', async () => {
    const { result, find } = run({ data: { definition: 'New text.' }, originalDoc: cornice }, [])
    await expect(result).resolves.toEqual({ definition: 'New text.' })
    expect(find.mock.calls[0][0].where).toEqual({ id: { not_equals: 2 } })
  })
})

describe('revalidateGlossary', () => {
  beforeEach(() => mockRevalidateTag.mockReset())

  const args = (disableRevalidate: boolean) => ({ req: { context: { disableRevalidate } } })

  it('purges only the glossary tag on change and delete', () => {
    // @ts-expect-error -- the hooks only read req.context
    revalidateGlossary(args(false))
    // @ts-expect-error -- the hooks only read req.context
    revalidateGlossaryDelete(args(false))
    expect(mockRevalidateTag.mock.calls).toEqual([['glossary'], ['glossary']])
  })

  it('does nothing when a seed or migration disables revalidation', () => {
    // @ts-expect-error -- the hooks only read req.context
    revalidateGlossary(args(true))
    // @ts-expect-error -- the hooks only read req.context
    revalidateGlossaryDelete(args(true))
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })
})
