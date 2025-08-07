import type { Setting } from '@/payload-types'
import { removeNonDeterministicKeys } from '@/utilities/removeNonDeterministicKeys'
import crypto from 'crypto'
import stringify from 'json-stable-stringify'
import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook } from 'payload'

export const revalidateSettings: CollectionAfterChangeHook<Setting> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const docRepresentation = stringify(removeNonDeterministicKeys(JSON.parse(JSON.stringify(doc))))
  const previousDocRepresentation = stringify(
    removeNonDeterministicKeys(JSON.parse(JSON.stringify(previousDoc))),
  )

  if (docRepresentation && previousDocRepresentation) {
    const docHash = crypto.createHash('sha256').update(docRepresentation).digest('hex')
    const previousDocHash = crypto
      .createHash('sha256')
      .update(previousDocRepresentation)
      .digest('hex')

    if (docHash === previousDocHash) {
      payload.logger.info(
        'Skipping settings revalidation because the current doc and previous doc have no change to their deterministic fields.',
      )

      return doc
    }
  }

  let tenant = doc.tenant

  if (typeof tenant === 'number') {
    tenant = await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
    })
  }

  // Settings affect all pages since they appear in global components (header/footer)
  payload.logger.info(`Revalidating all paths for tenant ${tenant.slug} due to settings change`)

  // Revalidate the tenant's root path and all nested paths
  revalidatePath(`/${tenant.slug}`, 'layout')

  // Some tenant settings might be used in the avalanche centers listing (like logo and banner)
  revalidatePath('/', 'layout')
}
