import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'

// Minimal shape of the `where` clause ensureUniqueSlug builds, so the find mock can
// resolve the candidate slug it's querying for.
type WhereClause = {
  and: Array<{
    slug?: { equals?: string }
    id?: { not_in?: string[] }
    tenant?: { equals?: string }
  }>
}

type CollectionField = { name: string; type: string; required?: boolean }

type RunOptions = {
  value?: unknown
  data?: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  existing?: Set<string>
  user?: unknown
  fields?: CollectionField[]
  // Slugs of related documents findByID can resolve, keyed by ID.
  relatedSlugs?: Record<string, string>
}

const eventOptions = {
  generateFromField: 'title',
  dateField: 'startDate',
  autoSuffixOnDuplicate: true,
}

const courseOptions: Parameters<typeof ensureUniqueSlug>[0] = {
  ...eventOptions,
  prefixFrom: { field: 'provider', collection: 'providers' },
}

const rec1 = { title: 'Recreational Level 1', startDate: '2026-01-10T16:00:00.000Z' }

// ensureUniqueSlug only reads a handful of fields off its args, so the tests pass a minimal
// mock. This helper keeps the type suppression on a single line (prettier-safe) and keeps the
// call sites type-checked against the shape below.
function asHookArgs(args: {
  value: unknown
  data: Record<string, unknown>
  originalDoc: Record<string, unknown> | undefined
  req: { user: unknown; payload: { find: jest.Mock; findByID: jest.Mock } }
  collection: {
    slug: string
    labels: { singular: string; plural: string }
    fields: CollectionField[]
  }
}): Parameters<ReturnType<typeof ensureUniqueSlug>>[0] {
  // @ts-expect-error - intentionally minimal FieldHook args shape for testing
  return args
}

async function run(
  options: Parameters<typeof ensureUniqueSlug>[0],
  {
    value = '',
    data = {},
    originalDoc = undefined,
    existing = new Set<string>(),
    user = { id: 'user-1' },
    fields = [],
    relatedSlugs = {},
  }: RunOptions = {},
) {
  const find = jest.fn(async ({ where }: { where: WhereClause }) => {
    const slugCondition = where.and.find((condition) => condition.slug)
    const candidate = slugCondition?.slug?.equals ?? ''
    return { docs: existing.has(candidate) ? [{ id: 'existing-doc' }] : [] }
  })
  const findByID = jest.fn(async ({ id }: { id: string | number }) => {
    const slug = relatedSlugs[String(id)]
    return slug ? { id, slug } : null
  })

  const collection = {
    slug: 'events',
    labels: { singular: 'Event', plural: 'Events' },
    fields,
  }

  const hook = ensureUniqueSlug(options)
  const result = await hook(
    asHookArgs({
      value,
      data,
      originalDoc,
      req: { user, payload: { find, findByID } },
      collection,
    }),
  )
  return { result, find, findByID }
}

describe('ensureUniqueSlug', () => {
  it('auto-generates the slug from the source field and date when left blank', async () => {
    const { result } = await run(eventOptions, {
      value: '',
      data: { title: 'Avalanche Awareness Class', startDate: '2025-11-13T18:00:00.000Z' },
    })
    expect(result).toBe('avalanche-awareness-class-2025-11-13')
  })

  it('appends a numbered suffix when the generated slug already exists', async () => {
    const { result } = await run(eventOptions, {
      data: { title: 'Avalanche Awareness Class', startDate: '2025-11-13T18:00:00.000Z' },
      existing: new Set(['avalanche-awareness-class-2025-11-13']),
    })
    expect(result).toBe('avalanche-awareness-class-2025-11-13-2')
  })

  it('increments past consecutive existing suffixes', async () => {
    const { result } = await run(eventOptions, {
      data: { title: 'Avalanche Awareness Class', startDate: '2025-11-13T18:00:00.000Z' },
      existing: new Set([
        'avalanche-awareness-class-2025-11-13',
        'avalanche-awareness-class-2025-11-13-2',
      ]),
    })
    expect(result).toBe('avalanche-awareness-class-2025-11-13-3')
  })

  it('numbers an explicitly entered slug that collides (the duplicate-document case)', async () => {
    const { result } = await run(eventOptions, {
      value: 'avalanche-awareness-class-2025-11-13',
      existing: new Set(['avalanche-awareness-class-2025-11-13']),
    })
    expect(result).toBe('avalanche-awareness-class-2025-11-13-2')
  })

  it('keeps an explicitly entered slug when it is unique', async () => {
    const { result } = await run(eventOptions, { value: 'custom-slug' })
    expect(result).toBe('custom-slug')
  })

  it('returns the value unchanged when blank and there is nothing to generate from', async () => {
    const { result } = await run({}, { value: '' })
    expect(result).toBe('')
  })

  it('throws on collision when auto-suffixing is disabled and a user is present', async () => {
    await expect(
      run(
        { autoSuffixOnDuplicate: false },
        { value: 'taken-slug', existing: new Set(['taken-slug']) },
      ),
    ).rejects.toThrow('Slug must be unique')
  })

  it('excludes the current document from the uniqueness check', async () => {
    const { find } = await run(eventOptions, {
      value: 'my-slug',
      data: { id: 'doc-1' },
    })
    const where: WhereClause = find.mock.calls[0][0].where
    expect(where.and).toContainEqual({ id: { not_in: ['doc-1'] } })
  })

  it('scopes the uniqueness check to the tenant when the collection requires one', async () => {
    const { find } = await run(eventOptions, {
      value: 'my-slug',
      data: { tenant: 'tenant-1' },
      fields: [{ name: 'tenant', type: 'relationship', required: true }],
    })
    const where: WhereClause = find.mock.calls[0][0].where
    expect(where.and).toContainEqual({ tenant: { equals: 'tenant-1' } })
  })

  describe('with a relationship prefix', () => {
    it('prefixes the generated slug with the related document slug', async () => {
      const { result } = await run(courseOptions, {
        data: { ...rec1, provider: 7 },
        relatedSlugs: { '7': 'alpine-skills-international' },
      })
      expect(result).toBe('alpine-skills-international-recreational-level-1-2026-01-10')
    })

    it('looks up the slug by ID when the relationship arrives populated', async () => {
      const { result, findByID } = await run(courseOptions, {
        data: { ...rec1, provider: { id: 7, name: 'Alpine Skills International' } },
        relatedSlugs: { '7': 'alpine-skills-international' },
      })
      expect(result).toBe('alpine-skills-international-recreational-level-1-2026-01-10')
      expect(findByID).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'providers', id: 7, disableErrors: true }),
      )
    })

    it('falls back to the saved relationship when the update omits it', async () => {
      const { result } = await run(courseOptions, {
        data: rec1,
        originalDoc: { id: 'course-1', provider: 7 },
        relatedSlugs: { '7': 'alpine-skills-international' },
      })
      expect(result).toBe('alpine-skills-international-recreational-level-1-2026-01-10')
    })

    it('leaves the prefix off when there is no relationship (e.g. a draft)', async () => {
      const { result, findByID } = await run(courseOptions, { data: rec1 })
      expect(result).toBe('recreational-level-1-2026-01-10')
      expect(findByID).not.toHaveBeenCalled()
    })

    it('leaves the prefix off when the related document is gone', async () => {
      const { result } = await run(courseOptions, { data: { ...rec1, provider: 99 } })
      expect(result).toBe('recreational-level-1-2026-01-10')
    })

    it('numbers a collision between two courses from the same provider on the same day', async () => {
      const { result } = await run(courseOptions, {
        data: { ...rec1, provider: 7 },
        relatedSlugs: { '7': 'alpine-skills-international' },
        existing: new Set(['alpine-skills-international-recreational-level-1-2026-01-10']),
      })
      expect(result).toBe('alpine-skills-international-recreational-level-1-2026-01-10-2')
    })

    it('keeps a typed slug without looking up the prefix', async () => {
      const { result, findByID } = await run(courseOptions, {
        value: 'my-custom-course',
        data: { ...rec1, provider: 7 },
      })
      expect(result).toBe('my-custom-course')
      expect(findByID).not.toHaveBeenCalled()
    })

    it('does not generate a prefix-only slug when the title is blank', async () => {
      const { result } = await run(courseOptions, {
        data: { provider: 7 },
        relatedSlugs: { '7': 'alpine-skills-international' },
      })
      expect(result).toBe('')
    })
  })
})
