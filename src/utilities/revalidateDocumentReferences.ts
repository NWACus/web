import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findDocumentsWithReferences } from './findDocumentsWithReferences'
import { revalidateDocument, RevalidationReference } from './revalidateDocument'

/** Revalidate all routable documents that reference a specific document. */
export async function revalidateDocumentReferences(
  reference: RevalidationReference,
): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  payload.logger.info(
    `Starting document reference revalidation for ${reference.collection} ID ${reference.id}`,
  )

  try {
    const documentsToRevalidate = await findDocumentsWithReferences(reference)

    payload.logger.info(
      `Found ${documentsToRevalidate.length} documents referencing ${reference.collection} ID ${reference.id}`,
    )

    for (const doc of documentsToRevalidate) {
      try {
        await revalidateDocument(doc)
      } catch (error) {
        payload.logger.error(`Failed to revalidate ${doc.collection} ID ${doc.id}: ${error}`)
      }
    }

    payload.logger.info(
      `Completed document reference revalidation for ${reference.collection} ID ${reference.id}`,
    )
  } catch (error) {
    payload.logger.error(
      `Error during document reference revalidation for ${reference.collection} ID ${reference.id}: ${error}`,
    )
  }
}
