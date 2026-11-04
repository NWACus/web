import { PostHogCenterRegister } from '@/components/PostHogCenterRegister.client'
import { render } from '@testing-library/react'
import posthog from 'posthog-js'

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { register: jest.fn() },
}))

const mockUseTenant = jest.fn()
jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => mockUseTenant(),
}))

describe('PostHogCenterRegister', () => {
  it('registers the uppercased slug as center', () => {
    mockUseTenant.mockReturnValue({ tenant: { slug: 'nwac' } })

    render(<PostHogCenterRegister />)

    expect(posthog.register).toHaveBeenCalledTimes(1)
    expect(posthog.register).toHaveBeenCalledWith({ center: 'NWAC' })
  })

  it('registers nothing without a tenant', () => {
    mockUseTenant.mockReturnValue({ tenant: null })

    render(<PostHogCenterRegister />)

    expect(posthog.register).not.toHaveBeenCalled()
  })
})
