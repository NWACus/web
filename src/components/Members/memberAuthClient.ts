/** Where to go after sign-in: same-origin only, so a hand-off URL can ride along but nothing else. */
export function safeReturnTo(returnTo: string | undefined): string {
  if (!returnTo) return '/members'
  try {
    const url = new URL(returnTo, window.location.origin)
    return url.origin === window.location.origin ? url.toString() : '/members'
  } catch {
    return '/members'
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? { ...value } : {}
}

function readString(json: unknown, key: string): string | undefined {
  const value = asRecord(json)[key]
  return typeof value === 'string' ? value : undefined
}

/** The signed-in Member from a `/get-session` body, or null when there is no session. */
export function readSessionUser(json: unknown): { email: string; isAnonymous: boolean } | null {
  const user = asRecord(asRecord(json).user)
  const email = readString(user, 'email')
  return email === undefined ? null : { email, isAnonymous: user.isAnonymous === true }
}

/** POSTs JSON to a Better Auth endpoint and throws its `message` on failure. */
export async function postAuth(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(readString(json, 'message') ?? `Request failed (${res.status})`)
  return json
}

/** The redirect URL Better Auth returns from `/sign-in/social`. */
export const socialRedirectUrl = (json: unknown) => readString(json, 'url')
