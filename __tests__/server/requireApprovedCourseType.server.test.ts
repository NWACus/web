import {
  requireApprovedCourseType,
  unapprovedCourseTypeError,
} from '@/collections/Courses/hooks/requireApprovedCourseType'
import type { Course } from '@/payload-types'
import type { CollectionBeforeValidateHook } from 'payload'

const recOnly = { name: 'Snowbird Mountain Guides', courseTypes: ['rec-1', 'rescue'] }

describe('unapprovedCourseTypeError', () => {
  it('accepts an approved Course Type', () => {
    expect(unapprovedCourseTypeError('rec-1', recOnly)).toBeNull()
  })

  it('names the Provider and the Course Type it is not approved for', () => {
    expect(unapprovedCourseTypeError('pro-1', recOnly)).toBe(
      'Snowbird Mountain Guides is not approved to offer Pro 1 courses.',
    )
  })

  it('treats a Provider with no Approved Course Types as approved for nothing', () => {
    expect(unapprovedCourseTypeError('rec-1', { name: 'New Provider', courseTypes: null })).toBe(
      'New Provider is not approved to offer Rec 1 courses.',
    )
  })
})

describe('requireApprovedCourseType', () => {
  type HookArgs = Parameters<CollectionBeforeValidateHook<Course>>[0]

  const providers: Record<number, { name: string; courseTypes: string[] }> = {
    1: recOnly,
    2: { name: 'Pro Avalanche Training', courseTypes: ['pro-1', 'pro-2'] },
  }

  function run(args: Pick<HookArgs, 'data' | 'originalDoc'>) {
    const findByID = jest.fn(async ({ id }: { id: number }) => providers[id])
    const result = requireApprovedCourseType({
      ...args,
      // @ts-expect-error -- a partial request: the hook only reads payload.findByID and t
      req: { payload: { findByID }, t: (key: string) => key },
      // @ts-expect-error -- a partial collection config: the hook never reads it
      collection: { slug: 'courses' },
      context: {},
      operation: args.originalDoc ? 'update' : 'create',
    })
    return { result, findByID }
  }

  // @ts-expect-error -- only the fields the hook reads
  const legacyPro1AtRecProvider: Course = { id: 7, courseType: 'pro-1', provider: 1 }

  it('rejects creating a Course with an unapproved Course Type', async () => {
    const { result } = run({ data: { courseType: 'pro-1', provider: 1 } })
    await expect(result).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('allows creating a Course with an approved Course Type', async () => {
    const { result } = run({ data: { courseType: 'rec-1', provider: 1 } })
    await expect(result).resolves.toEqual({ courseType: 'rec-1', provider: 1 })
  })

  it('checks a change of Course Type', async () => {
    // @ts-expect-error -- only the fields the hook reads
    const original: Course = { id: 8, courseType: 'rec-1', provider: 1 }
    const { result } = run({ data: { courseType: 'pro-2' }, originalDoc: original })
    await expect(result).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('checks a change of Provider against the new Provider', async () => {
    // @ts-expect-error -- only the fields the hook reads
    const original: Course = { id: 9, courseType: 'rec-1', provider: 1 }
    const { result } = run({ data: { provider: 2 }, originalDoc: original })
    await expect(result).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('keeps an older violating Course editable when neither field changes', async () => {
    const { result, findByID } = run({
      data: { title: 'Renamed', courseType: 'pro-1', provider: 1 },
      originalDoc: legacyPro1AtRecProvider,
    })
    await expect(result).resolves.toEqual({ title: 'Renamed', courseType: 'pro-1', provider: 1 })
    expect(findByID).not.toHaveBeenCalled()
  })

  it('reads a populated Provider relationship by id', async () => {
    const { result } = run({
      // @ts-expect-error -- a populated relationship with only the id the hook reads
      data: { courseType: 'pro-1', provider: { id: 2 } },
    })
    await expect(result).resolves.toBeDefined()
  })
})
