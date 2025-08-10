import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateRedirects: CollectionAfterChangeHook = ({ req: { payload, context } }) => {
  if (context.disableRevalidate) return

  payload.logger.info(`Revalidating redirects`)

  revalidateTag('redirects')
}
