export const inviteTokenExpirationMs =
  typeof process.env.INVITE_TOKEN_EXPIRATION_MS === 'string' &&
  process.env.INVITE_TOKEN_EXPIRATION_MS.trim() !== ''
    ? Number(process.env.INVITE_TOKEN_EXPIRATION_MS)
    : 864_000_000
