import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Provider } from '@/payload-types'
import { revalidatePath } from 'next/cache'

async function revalidate() {
  revalidatePath('/embeds/providers')
}

export const revalidateProvider: CollectionAfterChangeHook<Provider> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  if (doc._status === 'published') await revalidate()
}

export const revalidateProviderDelete: CollectionAfterDeleteHook<Provider> = async ({
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate()
}
