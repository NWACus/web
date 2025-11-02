import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Provider } from '@/payload-types'

const revalidate = async ({ payload }: { payload: BasePayload }) => {
  const paths = ['/providers']

  payload.logger.info(`Revalidating paths: ${paths.join(', ')}`)

  paths.forEach((path) => revalidatePath(path))
}

export const revalidateProvider: CollectionAfterChangeHook<Provider> = async ({
  doc,
  previousDoc,
  req: { payload, context, query },
}) => {
  if (context.disableRevalidate) return

  if (query && query.autosave === 'true') return

  // If the provider is published, revalidate the providers list page
  if (doc._status === 'published') {
    revalidate({ payload })
  }

  // If the provider was previously published, and it is no longer published
  // we need to revalidate the list page to remove it
  if (previousDoc._status === 'published' && doc._status !== 'published') {
    payload.logger.info('Revalidating providers list after unpublishing')
    revalidate({ payload })
  }
}

export const revalidateProviderDelete: CollectionAfterDeleteHook<Provider> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  // If the deleted provider was published, revalidate the list page
  if (doc._status === 'published') {
    revalidate({ payload })
  }
}
