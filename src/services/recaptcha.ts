// Google reCAPTCHA v2 verification, matching the legacy nwac.us data-portal
// captcha. Inert (always passes) until RECAPTCHA_SECRET_KEY is configured, so
// the captcha ships dark.
export async function passesCaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
  })
  const result: unknown = await response.json()
  return (
    typeof result === 'object' && result !== null && 'success' in result && result.success === true
  )
}
