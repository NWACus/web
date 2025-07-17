import { validateStrongPassword } from '@/utilities/passwordValidation'

describe('validateStrongPassword', () => {
  const minLength = 8

  it('accepts a strong password', () => {
    const result = validateStrongPassword('Str0ng!Passw0rd', minLength)
    expect(result).toBe(true)
  })

  it('rejects empty password', () => {
    const result = validateStrongPassword('', minLength)
    expect(result).toBe('Password is required.')
  })

  it('rejects short password', () => {
    const result = validateStrongPassword('Ab1!', minLength)
    expect(result).toBe(`Password must be at least ${minLength} characters.`)
  })

  it('rejects missing uppercase', () => {
    const result = validateStrongPassword('str0ng!pass', minLength)
    expect(result).toBe('Password must include at least one uppercase letter.')
  })

  it('rejects missing lowercase', () => {
    const result = validateStrongPassword('STR0NG!PASS', minLength)
    expect(result).toBe('Password must include at least one lowercase letter.')
  })

  it('rejects missing digit', () => {
    const result = validateStrongPassword('Strong!Pass', minLength)
    expect(result).toBe('Password must include at least one digit.')
  })

  it('rejects missing special character', () => {
    const result = validateStrongPassword('Strong1Pass', minLength)
    expect(result).toBe('Password must include at least one special character.')
  })

  it('rejects whitespace', () => {
    const result = validateStrongPassword('Strong1! Pass', minLength)
    expect(result).toBe('Password must not contain spaces.')
  })

  it('accepts password with all requirements and min length', () => {
    const result = validateStrongPassword('A1!bcdef', minLength)
    expect(result).toBe(true)
  })
})
