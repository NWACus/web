import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Payload } from 'payload'

jest.mock('../../src/payload.config', () => ({}))

// nac.ts calls getPayload({ config }) for logging
jest.mock('payload', () => ({
  getPayload: jest.fn().mockResolvedValue({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }),
}))

import {
  defaultHomePageContent,
  INFO_EXCHANGE_PAGES_TO_PROVISION,
  provision,
} from '@/collections/Tenants/endpoints/provisionTenant'
import type { Tenant } from '@/payload-types'
import { isInfoExchange } from '@/services/nac/types/schemas'

const platforms = {
  warnings: false,
  forecasts: false,
  stations: false,
  obs: false,
  weather: false,
}

describe('isInfoExchange', () => {
  it('is true for a center with obs but no forecasts', () => {
    expect(isInfoExchange({ ...platforms, obs: true, stations: true })).toBe(true)
  })

  it('is false for a forecast center', () => {
    expect(isInfoExchange({ ...platforms, forecasts: true, obs: true })).toBe(false)
  })

  it('is false for a center with no platforms', () => {
    expect(isInfoExchange(platforms)).toBe(false)
  })
})

describe('INFO_EXCHANGE_PAGES_TO_PROVISION', () => {
  it('provisions only Weather Tools, About Us, Donate / Membership, and Volunteer', () => {
    expect(INFO_EXCHANGE_PAGES_TO_PROVISION).toEqual([
      { slug: 'weather-tools', title: 'Weather Tools' },
      { slug: 'about-us', title: 'About Us' },
      { slug: 'donate-membership', title: 'Donate / Membership' },
      { slug: 'volunteer', title: 'Volunteer' },
    ])
  })
})

describe('defaultHomePageContent', () => {
  it('gives info exchanges an observations widget and no forecast copy', () => {
    const { highlightedContent, layout } = defaultHomePageContent('Test Info Exchange', true)

    expect(layout).toEqual([{ blockType: 'observationsWidget' }])
    expect(highlightedContent?.heading).toBe('Welcome to Test Info Exchange')
    expect(JSON.stringify(highlightedContent)).not.toMatch(/avalanche forecasts, mountain weather/)
  })

  it('gives forecast centers the upcoming events list', () => {
    const { highlightedContent, layout } = defaultHomePageContent('Test Center', false)

    expect(layout).toEqual([expect.objectContaining({ blockType: 'eventList' })])
    expect(JSON.stringify(highlightedContent)).toMatch(/avalanche forecasts, mountain weather/)
  })
})

describe('provision (info exchange)', () => {
  const server = setupServer(
    http.get('https://forecasts.avalanche.org/', () =>
      HttpResponse.json({
        centers: [
          {
            id: 'SAC',
            display_id: 'SAC',
            platforms: { ...platforms, obs: true, stations: true },
          },
        ],
      }),
    ),
  )

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())

  type NavItemData = { link?: unknown; items?: NavItemData[] }

  // An item with neither a link nor sub-items fails Payload's navigation validation
  const itemsWithoutLinkOrChildren = (items: NavItemData[] = []): NavItemData[] =>
    items.flatMap((item) =>
      item.items && item.items.length > 0
        ? itemsWithoutLinkOrChildren(item.items)
        : item.link
          ? []
          : [item],
    )

  it('creates a navigation with no empty groups', async () => {
    const created: Array<{ collection: string; data: Record<string, unknown> }> = []
    let nextId = 1
    const fakePayload = {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      update: jest.fn().mockResolvedValue({ docs: [{}] }),
      // Existing settings skip the placeholder media uploads
      find: jest.fn(async ({ collection }: { collection: string }) => ({
        docs: collection === 'settings' ? [{ id: 1 }] : [],
      })),
      create: jest.fn(
        async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
          created.push({ collection, data })
          return { id: nextId++, ...data }
        },
      ),
    }
    const tenant: Pick<Tenant, 'id' | 'slug' | 'name'> = { id: 1, slug: 'sac', name: 'Test' }

    // @ts-expect-error - partial Payload and Tenant; provision() only uses the methods above
    const result = await provision(fakePayload satisfies Partial<Payload>, tenant)

    expect(result.navigationCreated).toBe(true)
    const navigation = created.find((c) => c.collection === 'navigations')?.data
    expect(navigation).toBeDefined()

    for (const tab of Object.values(navigation ?? {})) {
      if (tab && typeof tab === 'object' && 'items' in tab && Array.isArray(tab.items)) {
        expect(itemsWithoutLinkOrChildren(tab.items)).toEqual([])
      }
    }
  })
})
