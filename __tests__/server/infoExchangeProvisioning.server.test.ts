jest.mock('../../src/payload.config', () => ({}))

import {
  defaultHomePageContent,
  INFO_EXCHANGE_PAGES_TO_PROVISION,
} from '@/collections/Tenants/endpoints/provisionTenant'
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
  it('provisions only About Us, Donate / Membership, and Volunteer', () => {
    expect(INFO_EXCHANGE_PAGES_TO_PROVISION).toEqual([
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
