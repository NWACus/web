// Cloudflare Turnstile verification on the station CSV download, replacing the
// legacy nwac.us data-portal reCAPTCHA. Only enforced when BOTH env keys are
// configured: a secret without the public site key would demand a token no widget
// ever issues, bricking downloads; without a secret there is nothing to verify against.
export async function passesCaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true
  if (!token) return false
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
    })
    const result: unknown = await response.json()
    return (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      result.success === true
    )
  } catch {
    // Fail closed, but as a 403 rather than an unhandled 500.
    return false
  }
}
