import { validateFrom } from '@/collections/Redirects/hooks/validateFrom'

// Only reached for multi-segment From URLs; the tests use single-segment ones.
jest.mock('../../src/components/Header/utils', () => ({ getCanonicalUrlForPath: jest.fn() }))
jest.mock('../../src/utilities/tenancy/resolveTenant', () => ({ resolveTenant: jest.fn() }))

const TENANT_ID = 2

type FindArgs = { collection: string; where?: Record<string, unknown>; req?: unknown }

function setup(existingFroms: string[]) {
  const find = jest.fn(async ({ collection }: FindArgs) => ({
    docs: collection === 'redirects' ? existingFroms.map((from, i) => ({ id: i + 1, from })) : [],
  }))
  const req = { payload: { find } }
  return { find, req }
}

// validateFrom only reads value, data, originalDoc and req, so the tests pass a minimal shape.
function run(args: {
  value: string
  originalDoc?: { id: number }
  req: ReturnType<typeof setup>['req']
}) {
  // @ts-expect-error - intentionally minimal FieldHook args shape for testing
  return validateFrom({ ...args, data: { tenant: TENANT_ID } })
}

function redirectsQuery(find: jest.Mock): FindArgs {
  const call = find.mock.calls.find(([args]: [FindArgs]) => args.collection === 'redirects')
  return call[0]
}

describe('validateFrom', () => {
  it('rejects a From that matches an existing one only once decoded', async () => {
    const { req } = setup(['/%26'])
    await expect(run({ value: '/&', req })).rejects.toThrow(
      'It matches the existing From URL "/%26"',
    )

    const decoded = setup(['/&'])
    await expect(run({ value: '/%26', req: decoded.req })).rejects.toThrow(
      'It matches the existing From URL "/&"',
    )
  })

  it('accepts a From that differs once decoded', async () => {
    const { req } = setup(['/%2526'])
    await expect(run({ value: '/%26', req })).resolves.toBe('/%26')
  })

  it('excludes the redirect being edited from the uniqueness check', async () => {
    const { find, req } = setup([])
    await run({ value: '/&', originalDoc: { id: 7 }, req })

    const query = redirectsQuery(find)
    expect(query.where).toEqual({ tenant: { equals: TENANT_ID }, id: { not_equals: 7 } })
    expect(query.req).toBe(req)
  })

  it('checks every redirect in the tenant on create', async () => {
    const { find, req } = setup([])
    await run({ value: '/&', req })

    expect(redirectsQuery(find).where).toEqual({ tenant: { equals: TENANT_ID } })
  })

  it('rejects a stray "%" that no request could match', async () => {
    const { req } = setup([])
    await expect(run({ value: '/100%', req })).rejects.toThrow(/Write a literal/)
  })
})
