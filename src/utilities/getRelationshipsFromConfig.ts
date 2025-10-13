import configPromise from '@payload-config'
import type { Field } from 'payload'

type RelationshipMapping = Record<string, { fieldPath: string }[]>

/**
 * Dynamically extract relationship field configurations from Payload collections
 */
export async function getRelationshipsFromConfig() {
  const config = await configPromise

  // Find relationship fields used in Pages collection
  const pagesCollection = config.collections?.find((collection) => collection.slug === 'pages')
  const pagesRelationshipMappings = extractRelationshipMappings(pagesCollection?.fields || [])

  // Find relationship fields used in Posts collection
  const postsCollection = config.collections?.find((collection) => collection.slug === 'posts')
  const postsRelationshipMappings = extractRelationshipMappings(postsCollection?.fields || [])

  // Find relationship fields used in HomePages collection
  const homePagesCollection = config.collections?.find(
    (collection) => collection.slug === 'homePages',
  )
  const homePagesRelationshipMappings = extractRelationshipMappings(
    homePagesCollection?.fields || [],
  )

  return {
    pagesRelationshipMappings,
    postsRelationshipMappings,
    homePagesRelationshipMappings,
  }
}

/**
 * Extract relationship mappings for reference collections by analyzing field configs
 */
function extractRelationshipMappings(fields: Field[], basePath: string = ''): RelationshipMapping {
  const mappings: RelationshipMapping = {}

  function searchFields(fieldArray: Field[], currentPath: string) {
    for (const field of fieldArray) {
      // Calculate fieldPath only for fields that have names
      const fieldPath =
        'name' in field && field.name
          ? currentPath !== ''
            ? `${currentPath}.${field.name}`
            : field.name
          : currentPath

      if (field.type === 'relationship' || field.type === 'upload') {
        const relationTo =
          typeof field.relationTo === 'string' ? field.relationTo : field.relationTo?.[0]
        if (relationTo && relationTo !== 'tenants') {
          if (!mappings[relationTo]) {
            mappings[relationTo] = []
          }
          mappings[relationTo].push({
            fieldPath,
          })
        }
      }

      // Recursively search nested fields (tabs, groups, arrays)
      if ((field.type === 'array' || field.type === 'group') && field.fields) {
        searchFields(field.fields, fieldPath)
      }
      if (field.type === 'tabs' && field.tabs) {
        for (const tab of field.tabs) {
          if (tab.fields) {
            searchFields(
              tab.fields,
              'name' in tab
                ? currentPath !== ''
                  ? `${currentPath}.${tab.name}`
                  : tab.name
                : currentPath,
            )
          }
        }
      }
    }
  }

  searchFields(fields, basePath)
  return mappings
}
