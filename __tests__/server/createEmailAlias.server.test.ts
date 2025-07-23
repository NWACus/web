import { createEmailAlias } from '../../src/utilities/createEmailAlias'

describe('createEmailAlias', () => {
  it('creates a basic email alias', () => {
    const result = createEmailAlias('user@example.com')
    expect(result).toBe('developer+user-example-com@nwac.us')
  })

  it('handles special characters in username', () => {
    const result = createEmailAlias('user.name+test@example.com')
    expect(result).toBe('developer+user-name-test-example-com@nwac.us')
  })

  it('handles special characters in domain', () => {
    const result = createEmailAlias('user@sub.example.com')
    expect(result).toBe('developer+user-sub-example-com@nwac.us')
  })

  it('converts to lowercase', () => {
    const result = createEmailAlias('USER@EXAMPLE.COM')
    expect(result).toBe('developer+user-example-com@nwac.us')
  })

  it('handles multiple consecutive special characters', () => {
    const result = createEmailAlias('user..name@example...com')
    expect(result).toBe('developer+user-name-example-com@nwac.us')
  })

  it('removes leading and trailing dashes', () => {
    const result = createEmailAlias('.user.@.example.')
    expect(result).toBe('developer+user-example@nwac.us')
  })

  it('handles underscores and other special characters', () => {
    const result = createEmailAlias('user_name#123@example-site.org')
    expect(result).toBe('developer+user-name-123-example-site-org@nwac.us')
  })

  it('handles numbers in email addresses', () => {
    const result = createEmailAlias('user123@example123.com')
    expect(result).toBe('developer+user123-example123-com@nwac.us')
  })

  it('handles complex email addresses', () => {
    const result = createEmailAlias('test.user+category@subdomain.example-site.co.uk')
    expect(result).toBe('developer+test-user-category-subdomain-example-site-co-uk@nwac.us')
  })

  it('handles emails with only special characters (edge case)', () => {
    const result = createEmailAlias('...@...')
    expect(result).toBe('developer+@nwac.us')
  })
})
