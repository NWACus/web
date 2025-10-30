import crypto from 'crypto'
import type { CollectionBeforeChangeHook } from 'payload'

export const setToken: CollectionBeforeChangeHook = async ({ data }) => {
  const token = crypto.randomBytes(20).toString('hex')
  data.token = token
  return data
}
