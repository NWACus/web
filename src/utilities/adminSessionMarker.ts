const COOKIE_NAME = 'avy-admin-session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

// payload-token is httpOnly, so the public site can't see it. This readable cookie only hints that
// a login may exist on this host; /api/users/me still decides.
export const hasAdminSessionMarker = (): boolean =>
  document.cookie.split('; ').includes(`${COOKIE_NAME}=1`)

export const setAdminSessionMarker = (): void => {
  document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`
}

export const clearAdminSessionMarker = (): void => {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
}
