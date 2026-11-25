import {
  TenantSelectionProviderClient,
  useTenantSelection,
} from '@/providers/TenantSelectionProvider/index.client'
import { act, render } from '@testing-library/react'

const mockRouter = { refresh: jest.fn() }
jest.mock('next/navigation.js', () => ({ useRouter: () => mockRouter }))

let mockUser: { id: number } | null = null
const mockConfig = { serverURL: '', routes: { api: '/api' } }
jest.mock('@payloadcms/ui', () => ({
  toast: { error: jest.fn() },
  useAuth: () => ({ user: mockUser }),
  useConfig: () => ({ config: mockConfig }),
}))

const nwac = { label: 'NWAC', value: 'nwac' }
const sac = { label: 'SAC', value: 'sac' }

const originalFetch = global.fetch
const mockFetch = jest.fn()

const respondWith = (...options: { label: string; value: string }[]) =>
  mockFetch.mockImplementation(async () => ({
    json: async () => ({ docs: options.map(({ label, value }) => ({ name: label, slug: value })) }),
  }))

const setCookie = (slug: string) => {
  document.cookie = `payload-tenant=${slug}; path=/`
}

// Several separate flushes, so a fetch that schedules another fetch would keep counting up.
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
}

const Options = () => (
  <p>
    {useTenantSelection()
      .options.map((o) => o.value)
      .join(',')}
  </p>
)

const tree = (initialValue: string | undefined, options = [nwac, sac]) => (
  <TenantSelectionProviderClient
    initialTenantOptions={options}
    initialValue={initialValue}
    tenantsCollectionSlug="tenants"
  >
    <Options />
  </TenantSelectionProviderClient>
)

describe('TenantSelectionProviderClient', () => {
  beforeEach(() => {
    document.cookie = 'payload-tenant=; path=/; max-age=0'
    mockUser = { id: 1 }
    mockRouter.refresh.mockReset()
    mockFetch.mockReset()
    respondWith(nwac, sac)
    global.fetch = mockFetch
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('does not fetch when the cookie matches', async () => {
    setCookie('nwac')
    render(tree('nwac'))
    await settle()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['differs', 'sac'],
    ['is missing', ''],
  ])('fetches once when the cookie %s', async (_name, cookie) => {
    if (cookie) setCookie(cookie)
    render(tree('nwac'))
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockRouter.refresh).not.toHaveBeenCalled()
  })

  it('sets the cookie when the user has a single center', async () => {
    respondWith(nwac)
    render(tree('nwac', [nwac]))
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(document.cookie).toContain('payload-tenant=nwac')
  })

  it('fetches once on login, even with a mismatched cookie', async () => {
    mockUser = null
    setCookie('nwac')
    const { rerender, container } = render(tree('nwac', []))
    await settle()
    expect(mockFetch).not.toHaveBeenCalled()

    mockUser = { id: 1 }
    setCookie('sac')
    rerender(tree('nwac', []))
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(container.querySelector('p')?.textContent).toBe('nwac,sac')
  })

  it('clears the options and cookie and refreshes once on logout', async () => {
    setCookie('nwac')
    const { rerender, container } = render(tree('nwac'))
    await settle()

    mockUser = null
    rerender(tree('nwac'))
    await settle()

    expect(container.querySelector('p')?.textContent).toBe('')
    expect(document.cookie).not.toContain('payload-tenant')
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
