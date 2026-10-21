import {
  TenantSelectionProviderClient,
  useTenantSelection,
} from '@/providers/TenantSelectionProvider/index.client'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

let mockUser: { id: number } | null = null
jest.mock('@payloadcms/ui', () => ({
  toast: { error: jest.fn() },
  useAuth: () => ({ user: mockUser }),
  useConfig: () => ({ config: { serverURL: '', routes: { api: '/api' } } }),
}))

const mockRouter = { refresh: jest.fn() }
jest.mock('next/navigation.js', () => ({ useRouter: () => mockRouter }))

const TENANTS = [
  { slug: 'dvac', name: 'Destination Avalanche Center' },
  { slug: 'nwac', name: 'Northwest Avalanche Center' },
]

const SelectedTenant = () => {
  const { selectedTenantSlug } = useTenantSelection()
  return <div data-testid="selected">{selectedTenantSlug ?? 'none'}</div>
}

const renderProvider = () =>
  render(
    <TenantSelectionProviderClient initialTenantOptions={[]} tenantsCollectionSlug="tenants">
      <SelectedTenant />
    </TenantSelectionProviderClient>,
  )

const flushAsync = () => act(() => new Promise((r) => setTimeout(r, 0)))

beforeEach(() => {
  mockUser = null
  document.cookie = 'payload-tenant=; Max-Age=-1; Path=/'
  global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ docs: TENANTS }) })
})

describe('TenantSelectionProviderClient on login', () => {
  it('selects the tenant from the cookie the subdomain middleware set', async () => {
    const { rerender } = renderProvider()

    document.cookie = 'payload-tenant=nwac; Path=/'
    mockUser = { id: 1 }
    rerender(
      <TenantSelectionProviderClient initialTenantOptions={[]} tenantsCollectionSlug="tenants">
        <SelectedTenant />
      </TenantSelectionProviderClient>,
    )
    await flushAsync()

    expect(screen.getByTestId('selected')).toHaveTextContent('nwac')
  })

  it('leaves the selection empty when the cookie names a tenant the user cannot access', async () => {
    const { rerender } = renderProvider()

    document.cookie = 'payload-tenant=sac; Path=/'
    mockUser = { id: 1 }
    rerender(
      <TenantSelectionProviderClient initialTenantOptions={[]} tenantsCollectionSlug="tenants">
        <SelectedTenant />
      </TenantSelectionProviderClient>,
    )
    await flushAsync()

    expect(screen.getByTestId('selected')).toHaveTextContent('none')
  })
})
