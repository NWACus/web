import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findDocumentsWithBlockReferences } from './findDocumentsWithBlockReferences'
import { revalidateDocument, RevalidationReference } from './revalidateDocument'

/**
 * Revalidate all pages and posts that reference a specific document through blocks
 */
export async function revalidateBlockReferences(reference: RevalidationReference): Promise<void> {
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
