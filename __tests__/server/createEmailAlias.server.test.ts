import { createEmailAlias } from '../../src/utilities/createEmailAlias'

describe('createEmailAlias', () => {
  it('creates a basic email alias', () => {
    const result = createEmailAlias({ plusAddress: 'user@example.com' })
    expect(result).toBe('developer+user-example-com@nwac.us')
  })

  it('handles special characters in username', () => {
    const result = createEmailAlias({ plusAddress: 'user.name+test@example.com' })
    expect(result).toBe('developer+user-name-test-example-com@nwac.us')
  })

  it('handles special characters in domain', () => {
    const result = createEmailAlias({ plusAddress: 'user@sub.example.com' })
    expect(result).toBe('developer+user-sub-example-com@nwac.us')
  })

  it('converts to lowercase', () => {
    const result = createEmailAlias({ plusAddress: 'USER@EXAMPLE.COM' })
    expect(result).toBe('developer+user-example-com@nwac.us')
  })

  it('handles multiple consecutive special characters', () => {
    const result = createEmailAlias({ plusAddress: 'user..name@example...com' })
    expect(result).toBe('developer+user-name-example-com@nwac.us')
  })

  it('removes leading and trailing dashes', () => {
    const result = createEmailAlias({ plusAddress: '.user.@.example.' })
    expect(result).toBe('developer+user-example@nwac.us')
  })

  it('handles underscores and other special characters', () => {
    const result = createEmailAlias({ plusAddress: 'user_name#123@example-site.org' })
    expect(result).toBe('developer+user-name-123-example-site-org@nwac.us')
  })

  it('handles numbers in email addresses', () => {
    const result = createEmailAlias({ plusAddress: 'user123@example123.com' })
    expect(result).toBe('developer+user123-example123-com@nwac.us')
  })

  it('handles complex email addresses', () => {
    const result = createEmailAlias({
      plusAddress: 'test.user+category@subdomain.example-site.co.uk',
    })
    expect(result).toBe('developer+test-user-category-subdomain-example-site-co-uk@nwac.us')
  })

  it('handles emails with only special characters (edge case)', () => {
    const result = createEmailAlias({ plusAddress: '...@...' })
    expect(result).toBe('developer+@nwac.us')
  })

  it('uses custom baseAddress when provided', () => {
    const result = createEmailAlias({
      plusAddress: 'user@example.com',
      baseAddress: 'custom@myorg.com',
    })
    expect(result).toBe('custom+user-example-com@myorg.com')
  })

  it('uses plusAddressPrefix when provided', () => {
    const result = createEmailAlias({
      plusAddress: 'user@example.com',
      plusAddressPrefix: 'dev',
    })
    expect(result).toBe('developer+dev-user-example-com@nwac.us')
  })

  it('combines all options correctly', () => {
    const result = createEmailAlias({
      plusAddress: 'user@example.com',
      plusAddressPrefix: 'staging',
      baseAddress: 'team@company.org',
    })
    expect(result).toBe('team+staging-user-example-com@company.org')
  })

  it('handles integer input', () => {
    const result = createEmailAlias({ plusAddress: 12345 })
    expect(result).toBe('developer+12345@nwac.us')
  })

  it('handles string input without @ symbol', () => {
    const result = createEmailAlias({ plusAddress: 'user123' })
    expect(result).toBe('developer+user123@nwac.us')
  })

  it('handles integer with prefix', () => {
    const result = createEmailAlias({
      plusAddress: 98765,
      plusAddressPrefix: 'dev',
    })
    expect(result).toBe('developer+dev-98765@nwac.us')
  })

  it('handles string with special characters but no @', () => {
    const result = createEmailAlias({ plusAddress: 'user.name_123!' })
    expect(result).toBe('developer+user-name-123@nwac.us')
  })

  it('handles integer with all options', () => {
    const result = createEmailAlias({
      plusAddress: 555,
      plusAddressPrefix: 'test',
      baseAddress: 'custom@example.org',
    })
    expect(result).toBe('custom+test-555@example.org')
  })
})
