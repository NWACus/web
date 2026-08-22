import { syncTargetFrom } from '../../src/services/snowobs/syncTargets'

const tenant = { id: 7, slug: 'nwac' }

// The cron skips half-configured centers rather than failing the whole run, so
// the skipping has to be right: a center left out here silently stops syncing.
describe('syncTargetFrom', () => {
  it('reads a complete config', () => {
    expect(syncTargetFrom({ tenant, snowobs: { source: 'nwac', token: 'secret' } })).toEqual({
      tenantId: 7,
      tenantSlug: 'nwac',
      source: 'nwac',
      token: 'secret',
    })
  })

  it('skips a center with no token yet', () => {
    expect(syncTargetFrom({ tenant, snowobs: { source: 'nwac', token: null } })).toBeNull()
  })

  it('skips a center with no source yet', () => {
    expect(syncTargetFrom({ tenant, snowobs: { source: '', token: 'secret' } })).toBeNull()
  })

  it('skips a center with no snowobs config at all', () => {
    expect(syncTargetFrom({ tenant })).toBeNull()
  })

  it('skips an unpopulated tenant, which carries no slug to sync against', () => {
    expect(syncTargetFrom({ tenant: 7, snowobs: { source: 'nwac', token: 'secret' } })).toBeNull()
  })
})
