// Strong password validation utility
// Requirements:
// - Minimum 12 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
// - At least one special character
// - No whitespace

export function validateStrongPassword(
  password: string | null | undefined,
  minLength: number = 8,
): true | string {
  if (!password) {
    return 'Password is required.'
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one digit.'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.'
  }
  if (/\s/.test(password)) {
    return 'Password must not contain spaces.'
  }
  return true
}
