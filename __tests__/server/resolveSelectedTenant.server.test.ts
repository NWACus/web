import { resolveSelectedTenant } from '@/utilities/tenancy/resolveSelectedTenant'

const user = { id: 1, collection: 'users', email: 'staff@example.org' }

function requestWith(tenants: Array<{ slug: string; name: string }>, cookie?: string) {
  const find = jest.fn().mockResolvedValue({ docs: tenants })
  const headers = new Headers(cookie ? { cookie: `payload-tenant=${cookie}` } : {})
  const req = { user, payload: { find }, headers }
  return { req, find }
}

function resolve(req: Partial<ReturnType<typeof requestWith>['req']>) {
  // @ts-expect-error the resolver only reads user, payload.find and headers
  return resolveSelectedTenant(req)
}

describe('resolveSelectedTenant', () => {
  it('reports none without a user or without any accessible center', async () => {
    const { req } = requestWith([])
    await expect(resolve({ ...req, user: undefined })).resolves.toEqual({ kind: 'none' })
    await expect(resolve(req)).resolves.toEqual({ kind: 'none' })
  })

  it('queries tenants with the user and access control enforced', async () => {
    const { req, find } = requestWith([{ slug: 'nwac', name: 'NWAC' }])
    await resolve(req)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'tenants', user, overrideAccess: false }),
    )
  })

  it('selects the only accessible center without a cookie', async () => {
    const { req } = requestWith([{ slug: 'sac', name: 'Sierra' }])
    await expect(resolve(req)).resolves.toEqual({ kind: 'selected', slug: 'sac', name: 'Sierra' })
  })

  it('follows the tenant cookie when it names an accessible center', async () => {
    const { req } = requestWith(
      [
        { slug: 'nwac', name: 'NWAC' },
        { slug: 'sac', name: 'Sierra' },
      ],
      'sac',
    )
    await expect(resolve(req)).resolves.toMatchObject({ slug: 'sac' })
  })

  it('reports unselected when several centers are accessible and the cookie does not match', async () => {
    const { req } = requestWith(
      [
        { slug: 'nwac', name: 'NWAC' },
        { slug: 'sac', name: 'Sierra' },
      ],
      'snfac',
    )
    await expect(resolve(req)).resolves.toEqual({ kind: 'unselected' })
  })
})
