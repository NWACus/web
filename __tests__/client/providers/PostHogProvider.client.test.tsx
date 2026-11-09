import { PostHogProvider } from '@/providers/PostHogProvider'
import { render } from '@testing-library/react'
import posthog from 'posthog-js'
import { useEffect } from 'react'

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { init: jest.fn(), register: jest.fn(), capture: jest.fn() },
}))

jest.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../src/utilities/getURL', () => ({
  getRootDomainURL: () => 'http://localhost:3000',
}))

const mockedInit = jest.mocked(posthog.init)
const mockedRegister = jest.mocked(posthog.register)

function RegistersCenterInEffect() {
  useEffect(() => {
    posthog.register({ center: 'NWAC' })
  }, [])
  return null
}

describe('PostHogProvider', () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey
  })

  it('initializes and registers super properties before a descendant registers in its effect', () => {
    render(
      <PostHogProvider>
        <RegistersCenterInEffect />
      </PostHogProvider>,
    )

    expect(mockedInit).toHaveBeenCalledTimes(1)
    expect(mockedRegister).toHaveBeenCalledTimes(2)
    expect(mockedRegister).toHaveBeenNthCalledWith(1, {
      source: 'nwacus/web',
      environment: 'local',
    })
    expect(mockedRegister).toHaveBeenNthCalledWith(2, { center: 'NWAC' })

    const [initOrder] = mockedInit.mock.invocationCallOrder
    const [superOrder, centerOrder] = mockedRegister.mock.invocationCallOrder
    expect(initOrder).toBeLessThan(superOrder)
    expect(superOrder).toBeLessThan(centerOrder)
  })

  it('pins web capture settings without blocking the remote config replay depends on', () => {
    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>,
    )

    const config = mockedInit.mock.calls[0][1]
    expect(config).toMatchObject({
      advanced_disable_feature_flags: true,
      capture_exceptions: false,
      capture_heatmaps: true,
      capture_dead_clicks: true,
      disable_product_tours: true,
      disable_conversations: true,
    })
    expect(config).not.toHaveProperty('advanced_disable_flags')
  })

  it('does nothing without a PostHog key', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY

    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>,
    )

    expect(mockedInit).not.toHaveBeenCalled()
    expect(mockedRegister).not.toHaveBeenCalled()
  })
})
