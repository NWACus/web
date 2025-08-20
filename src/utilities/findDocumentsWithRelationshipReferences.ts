import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getRelationshipsFromConfig } from './getRelationshipsFromConfig'
import { DocumentForRevalidation, RevalidationReference } from './revalidateDocument'

/**
 * Find all pages, posts, and homePages that contain relationship fields referencing a specific document
 * This is used for revalidation when reference collections change
 */
export async function findDocumentsWithRelationshipReferences(
  reference: RevalidationReference,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  const { pagesRelationshipMappings, postsRelationshipMappings, homePagesRelationshipMappings } =
    await getRelationshipsFromConfig()

  const pagesMappings = pagesRelationshipMappings[reference.collection]

  if (pagesMappings) {
    for (const mapping of pagesMappings) {
      try {
        const pagesWithRelationsRes = await payload.find({
          collection: 'pages',
          where: {
            and: [
              {
                _status: { equals: 'published' },
              },
              {
                [mapping.fieldPath]: { equals: reference.id },
              },
            ],
          },
          select: {
            id: true,
            slug: true,
            tenant: true,
          },
          depth: 1,
        })

        const pagesWithRelations: DocumentForRevalidation[] = pagesWithRelationsRes.docs.map(
          (doc) => ({
            collection: 'pages',
            id: doc.id,
            slug: doc.slug,
            tenant: doc.tenant,
          }),
        )

        results.push(...pagesWithRelations)
      } catch (error) {
        payload.logger.warn(
          `Error querying pages for ${reference.collection} reference ${reference.id} at ${mapping.fieldPath}: ${error}`,
        )
      }
    }
  }

  const postsMappings = postsRelationshipMappings[reference.collection]

  if (postsMappings) {
    for (const mapping of postsMappings) {
      try {
        const postsWithRelationsRes = await payload.find({
          collection: 'posts',
          where: {
            and: [
              {
                _status: { equals: 'published' },
              },
              {
                [mapping.fieldPath]: { equals: reference.id },
              },
            ],
          },
          select: {
            id: true,
            slug: true,
            tenant: true,
          },
          depth: 1,
        })

        const postsWithRelations: DocumentForRevalidation[] = postsWithRelationsRes.docs.map(
          (doc) => ({
            collection: 'posts',
            id: doc.id,
            slug: doc.slug,
            tenant: doc.tenant,
          }),
        )

        results.push(...postsWithRelations)
      } catch (error) {
        payload.logger.warn(
          `Error querying posts for ${reference.collection} reference ${reference.id} at ${mapping.fieldPath}: ${error}`,
        )
      }
    }
  }

  const homePagesMappings = homePagesRelationshipMappings[reference.collection]

  if (homePagesMappings) {
    for (const mapping of homePagesMappings) {
      try {
        const homePagesWithRelationsRes = await payload.find({
          collection: 'homePages',
          where: {
            [mapping.fieldPath]: { equals: reference.id },
          },
          select: {
            id: true,
            tenant: true,
          },
          depth: 1,
        })

        const homePagesWithRelations: DocumentForRevalidation[] =
          homePagesWithRelationsRes.docs.map((doc) => ({
            collection: 'homePages',
            id: doc.id,
            slug: '',
            tenant: doc.tenant,
          }))

        results.push(...homePagesWithRelations)
      } catch (error) {
        payload.logger.warn(
          `Error querying homePages for ${reference.collection} reference ${reference.id} at ${mapping.fieldPath}: ${error}`,
        )
      }
    }
  }

  return results
}
