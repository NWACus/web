import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findDocumentsWithRelationshipReferences } from './findDocumentsWithRelationshipReferences'
import { revalidateDocument, RevalidationReference } from './revalidateDocument'

/**
 * Revalidate all pages and posts that reference a specific document through relationship fields
 */
export async function revalidateRelationshipReferences(
  reference: RevalidationReference,
): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  payload.logger.info(
    `Starting relationship revalidation for ${reference.collection} ID ${reference.id}`,
  )

  try {
    const documentsToRevalidate = await findDocumentsWithRelationshipReferences(reference)

    payload.logger.info(
      `Found ${documentsToRevalidate.length} documents with relationship references to ${reference.collection} ID ${reference.id}`,
    )

    for (const doc of documentsToRevalidate) {
      await revalidateDocument(doc)
    }

    payload.logger.info(
      `Completed relationship revalidation for ${reference.collection} ID ${reference.id}`,
    )
  } catch (error) {
    payload.logger.error(
      `Error during relationship revalidation for ${reference.collection} ID ${reference.id}: ${error}`,
    )
  }
}
