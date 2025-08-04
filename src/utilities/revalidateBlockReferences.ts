import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import {
  DocumentWithBlockReference,
  findDocumentsWithBlockReferences,
  type BlockReference,
} from './findDocumentsWithBlockReferences'

/**
 * Revalidate all pages and posts that reference a specific document through blocks
 */
export async function revalidateBlockReferences(reference: BlockReference): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  payload.logger.info(`Starting revalidation for ${reference.collection} ID ${reference.id}`)

  try {
    const documentsToRevalidate = await findDocumentsWithBlockReferences(reference)

    payload.logger.info(
      `Found ${documentsToRevalidate.length} documents referencing ${reference.collection} ID ${reference.id}`,
    )

    for (const doc of documentsToRevalidate) {
      await revalidateDocument(doc)
    }

    payload.logger.info(`Completed revalidation for ${reference.collection} ID ${reference.id}`)
  } catch (error) {
    payload.logger.error(
      `Error during revalidation for ${reference.collection} ID ${reference.id}: ${error}`,
    )
  }
}

export async function revalidateDocument(doc: DocumentWithBlockReference): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  let tenant = doc.tenant

  if (typeof tenant === 'number') {
    try {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 0,
      })
    } catch (error) {
      payload.logger.warn(
        `Failed to resolve tenant ${tenant} for ${doc.collection} ${doc.id}: ${error}`,
      )
      return
    }
  }

  const basePaths = [`/${doc.slug}`, `/${tenant.slug}/${doc.slug}`]

  try {
    const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
    const navigationPaths = getNavigationPathForSlug(topLevelNavItems, doc.slug)

    const allPaths = [
      ...basePaths,
      ...navigationPaths.flatMap((path) => [path, `/${tenant.slug}${path}`]),
    ]

    payload.logger.info(
      `Revalidating ${doc.collection} ${doc.slug} at paths: ${allPaths.join(', ')}`,
    )

    allPaths.forEach((path) => revalidatePath(path))
  } catch (error) {
    payload.logger.warn(
      `Failed to get navigation paths for ${doc.collection} ${doc.slug}, falling back to basic paths: ${error}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
  }
}
