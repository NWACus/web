import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateRedirect: CollectionAfterChangeHook = ({ req: { payload, context } }) => {
  if (context.disableRevalidate) return

  payload.logger.info(`Revalidating redirects`)
  revalidateTag('redirects')
}

export const revalidateRedirectDelete: CollectionAfterDeleteHook = ({
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  payload.logger.info(`Revalidating redirects`)
  revalidateTag('redirects')
}
