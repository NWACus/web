import { findCenterByHost, isApexHost, memberAuthAllowedHosts } from '@/auth/members/hosts'
import { silentReSignInRedirect } from '@/auth/members/silentReSignIn'
import {
  isAccountPath,
  isSiteSafePath,
  safeLocalPath,
  validateReturnTo,
} from '@/auth/members/siteSessionPolicy'

// Jest loads .env.test, which sets the root domain
const APEX = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'

describe('member auth hosts', () => {
  it('knows the apex', () => {
    expect(isApexHost(APEX)).toBe(true)
    expect(isApexHost(`nwac.${APEX}`)).toBe(false)
    expect(isApexHost(null)).toBe(false)
  })

  it('resolves center subdomains and custom domains, not the apex or strangers', () => {
    expect(findCenterByHost(`nwac.${APEX}`)).toBe('nwac')
    expect(findCenterByHost('nwac.us')).toBe('nwac')
    expect(findCenterByHost('www.sierraavalanchecenter.org')).toBe('sac')
    expect(findCenterByHost(APEX)).toBeUndefined()
    expect(findCenterByHost(`evil.${APEX}`)).toBeUndefined()
    expect(findCenterByHost('evil.example')).toBeUndefined()
  })

  it('allows the apex, every center subdomain and every custom domain', () => {
    const hosts = memberAuthAllowedHosts()
    expect(hosts).toContain(APEX)
    expect(hosts).toContain(`nwac.${APEX}`)
    expect(hosts).toContain('nwac.us')
    expect(new Set(hosts).size).toBe(hosts.length)
  })
})

describe('site session policy', () => {
  it('only lets a hand-off return to a center host over the expected protocol', () => {
    expect(validateReturnTo(`http://nwac.${APEX}/forecasts?x=1`, 'http')?.host).toBe(`nwac.${APEX}`)
    expect(validateReturnTo(`http://${APEX}/`, 'http')).toBeNull()
    expect(validateReturnTo('http://evil.example/', 'http')).toBeNull()
    expect(validateReturnTo(`https://nwac.${APEX}/`, 'http')).toBeNull()
    expect(validateReturnTo(`http://user:pw@nwac.${APEX}/`, 'http')).toBeNull()
    expect(validateReturnTo('javascript:alert(1)', 'http')).toBeNull()
    expect(validateReturnTo('/relative', 'http')).toBeNull()
    expect(validateReturnTo(undefined, 'http')).toBeNull()
  })

  it('keeps post-exchange redirects on the same host', () => {
    expect(safeLocalPath('/forecasts/olympics?x=1')).toBe('/forecasts/olympics?x=1')
    expect(safeLocalPath('//evil.example/')).toBe('/')
    expect(safeLocalPath('/\\evil.example')).toBe('/')
    expect(safeLocalPath('https://evil.example')).toBe('/')
    expect(safeLocalPath(undefined)).toBe('/')
  })

  it('keeps account endpoints off center hosts and site sessions', () => {
    for (const path of [
      '/get-session',
      '/sign-out',
      '/site-session/exchange',
      '/member-preferences/set',
    ]) {
      expect(isSiteSafePath(path)).toBe(true)
    }
    for (const path of [
      '/delete-user',
      '/change-email',
      '/link-social',
      '/list-sessions',
      '/sign-in/anonymous',
    ]) {
      expect(isSiteSafePath(path)).toBe(false)
    }
    expect(isAccountPath('/delete-user')).toBe(true)
    expect(isAccountPath('/get-session')).toBe(false)
  })
})

describe('silent re-sign-in', () => {
  const base = {
    host: `nwac.${APEX}`,
    method: 'GET',
    url: `http://nwac.${APEX}/forecasts`,
    cookieHeader: 'avy.site_member=1',
    isPrefetch: false,
  }

  it('redirects a marked browser without a session through the apex, silently', () => {
    const url = silentReSignInRedirect(base)
    expect(url?.host).toBe(APEX)
    expect(url?.pathname).toBe('/api/auth/site-session/handoff')
    expect(url?.searchParams.get('returnTo')).toBe(base.url)
    expect(url?.searchParams.get('silent')).toBe('1')
  })

  it('never redirects without the marker, with a live session, off center hosts, or for prefetches and writes', () => {
    expect(silentReSignInRedirect({ ...base, cookieHeader: null })).toBeNull()
    expect(silentReSignInRedirect({ ...base, cookieHeader: 'payload-tenant=nwac' })).toBeNull()
    expect(
      silentReSignInRedirect({ ...base, cookieHeader: 'avy.site_member=1; avy.session_token=abc' }),
    ).toBeNull()
    expect(
      silentReSignInRedirect({
        ...base,
        cookieHeader: 'avy.site_member=1; __Secure-avy.session_token=abc',
      }),
    ).toBeNull()
    expect(silentReSignInRedirect({ ...base, host: APEX })).toBeNull()
    expect(silentReSignInRedirect({ ...base, host: 'evil.example' })).toBeNull()
    expect(silentReSignInRedirect({ ...base, method: 'POST' })).toBeNull()
    expect(silentReSignInRedirect({ ...base, isPrefetch: true })).toBeNull()
  })
})
