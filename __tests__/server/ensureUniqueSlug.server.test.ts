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
}

const eventOptions = {
  generateFromField: 'title',
  dateField: 'startDate',
  autoSuffixOnDuplicate: true,
}

// ensureUniqueSlug only reads a handful of fields off its args, so the tests pass a minimal
// mock. This helper keeps the type suppression on a single line (prettier-safe) and keeps the
// call sites type-checked against the shape below.
function asHookArgs(args: {
  value: unknown
  data: Record<string, unknown>
  originalDoc: Record<string, unknown> | undefined
  req: { user: unknown; payload: { find: jest.Mock } }
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
  }: RunOptions = {},
) {
  const find = jest.fn(async ({ where }: { where: WhereClause }) => {
    const slugCondition = where.and.find((condition) => condition.slug)
    const candidate = slugCondition?.slug?.equals ?? ''
    return { docs: existing.has(candidate) ? [{ id: 'existing-doc' }] : [] }
  })

  const collection = {
    slug: 'events',
    labels: { singular: 'Event', plural: 'Events' },
    fields,
  }

  const hook = ensureUniqueSlug(options)
  const result = await hook(
    asHookArgs({ value, data, originalDoc, req: { user, payload: { find } }, collection }),
  )
  return { result, find }
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
})
