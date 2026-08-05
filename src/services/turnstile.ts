// Cloudflare Turnstile verification. Inert (always passes) until
// TURNSTILE_SECRET_KEY is configured, so the captcha ships dark.
export async function passesCaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
  })
  const result: unknown = await response.json()
  return (
    typeof result === 'object' && result !== null && 'success' in result && result.success === true
  )
}
