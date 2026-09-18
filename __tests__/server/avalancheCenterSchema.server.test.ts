import { avalancheCenterSchema } from '@/services/nac/types/schemas'
import ewyaixCenter from './fixtures/nac-center-ewyaix.json'

describe('avalancheCenterSchema', () => {
  it('parses a center registered without city or config (EWYAIX)', () => {
    const parsed = avalancheCenterSchema.safeParse(ewyaixCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.city).toBeNull()
    expect(parsed.data?.config).toBeNull()
    expect(parsed.data?.type).toBe('other')
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
