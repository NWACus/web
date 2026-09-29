import { avalancheCenterSchema } from '@/services/nac/types/schemas'
import aaicCenter from './fixtures/nac-center-aaic.json'
import cacCenter from './fixtures/nac-center-cac.json'
import ewyaixCenter from './fixtures/nac-center-ewyaix.json'
import nysacCenter from './fixtures/nac-center-nysac.json'

describe('avalancheCenterSchema', () => {
  it('parses a center registered without city or config (EWYAIX)', () => {
    const parsed = avalancheCenterSchema.safeParse(ewyaixCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.city).toBeNull()
    expect(parsed.data?.config).toBeNull()
    expect(parsed.data?.type).toBe('other')
  })

  it('parses a center without a url or full observation viewer config (NYSAC)', () => {
    const parsed = avalancheCenterSchema.safeParse(nysacCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.url).toBeNull()
  })

  it('parses a center with a partial config (CAC)', () => {
    const parsed = avalancheCenterSchema.safeParse(cacCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.config?.expires_time).toBe(0)
  })

  it('parses a center without an email or type (AAIC)', () => {
    const parsed = avalancheCenterSchema.safeParse(aaicCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.email).toBeNull()
    expect(parsed.data?.type).toBeNull()
  })

  it('still parses a fully configured center', () => {
    const parsed = avalancheCenterSchema.safeParse({
      ...ewyaixCenter,
      city: 'Seattle',
      type: 'usfs',
      config: {
        expires_time: 18,
        published_time: null,
        blog: true,
        blog_title: 'Blog',
        weather_table: [],
      },
    })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.config?.published_time).toBe(0)
  })
})
