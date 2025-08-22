import configPromise from '@payload-config'
import type { Block, Field } from 'payload'

/**
 * Dynamically extract block configurations from Payload collections
 */
export async function getBlocksFromConfig() {
  const config = await configPromise

  // Find blocks used in Pages collection
  const pagesCollection = config.collections?.find((collection) => collection.slug === 'pages')
  const pagesBlocks = extractBlocksFromFields(pagesCollection?.fields || [])
  const pagesBlockMappings = extractBlockMappings(pagesBlocks)

  // Find blocks used in Posts collection (in richText lexical editor)
  const postsCollection = config.collections?.find((collection) => collection.slug === 'posts')
  const postsBlocks = extractBlocksFromRichTextBlocksFeature(postsCollection?.fields || [])
  const postsBlockMappings = extractBlockMappings(postsBlocks)

  // Find blocks used in HomePages collection
  const homePagesCollection = config.collections?.find(
    (collection) => collection.slug === 'homePages',
  )
  const homePagesBlocks = extractBlocksFromFields(homePagesCollection?.fields || [])
  const homePagesBlockMappings = extractBlockMappings(homePagesBlocks)

  return {
    pagesBlocks,
    pagesBlockMappings,
    postsBlocks,
    postsBlockMappings,
    homePagesBlocks,
    homePagesBlockMappings,
  }
}

/**
 * Extract blocks from field configurations (for Pages-style blocks fields)
 */
function extractBlocksFromFields(fields: Field[]): Block[] {
  const blocks: Block[] = []

  function searchFields(fieldArray: Field[]) {
    for (const field of fieldArray) {
      if (field.type === 'blocks' && field.blocks) {
        blocks.push(...field.blocks)
      }

      // Recursively search nested fields (tabs, groups, arrays)
      if ((field.type === 'array' || field.type === 'group') && field.fields) {
        searchFields(field.fields)
      }
      if (field.type === 'tabs' && field.tabs) {
        for (const tab of field.tabs) {
          if (tab.fields) {
            searchFields(tab.fields)
          }
        }
      }
    }
  }

  searchFields(fields)
  return blocks
}

/**
 * Extract blocks from lexical editor features (for Posts-style rich text blocks)
 */
function extractBlocksFromRichTextBlocksFeature(fields: Field[]): Block[] {
  const blocks: Block[] = []

  function searchForRichTextBlocks(fieldArray: Field[]) {
    for (const field of fieldArray) {
      if (field.type === 'richText' && field.editor) {
        if ('features' in field.editor && Array.isArray(field.editor.features)) {
          for (const feature of field.editor.features) {
            if (feature.key === 'blocks' && feature.serverFeatureProps?.blocks) {
              blocks.push(...feature.serverFeatureProps.blocks)
            }
          }
        }
      }

      // Recursively search nested fields (tabs, groups, arrays)
      if ((field.type === 'array' || field.type === 'group') && field.fields) {
        searchForRichTextBlocks(field.fields)
      }
      if (field.type === 'tabs' && field.tabs) {
        for (const tab of field.tabs) {
          if (tab.fields) {
            searchForRichTextBlocks(tab.fields)
          }
        }
      }
    }
  }

  searchForRichTextBlocks(fields)
  return blocks
}

type BlockMapping = Record<
  string,
  Array<{ blockType: string; fieldName: string; isHasMany: boolean }>
>

/**
 * Extract block mappings for reference collections by analyzing block configs
 */
function extractBlockMappings(blocks: Block[]) {
  const mappings: BlockMapping = {}

  for (const block of blocks) {
    const relationshipFields = extractRelationshipFields(block.fields || [])

    for (const field of relationshipFields) {
      if (typeof field.relationTo === 'string') {
        if (!mappings[field.relationTo]) {
          mappings[field.relationTo] = []
        }

        if (
          !mappings[field.relationTo].find(
            ({ blockType, fieldName }) => blockType === block.slug && fieldName === field.name,
          )
        ) {
          mappings[field.relationTo].push({
            blockType: block.slug,
            fieldName: field.name,
            isHasMany: field.hasMany ?? false,
          })
        }
      }
    }
  }

  return mappings
}

/**
 * Extract relationship fields from a field array
 */
function extractRelationshipFields(fields: Field[]) {
  const relationshipFields: Extract<Field, { type: 'relationship' | 'upload' }>[] = []

  function searchFields(fieldArray: Field[]) {
    for (const field of fieldArray) {
      if (field.type === 'relationship' || field.type === 'upload') {
        relationshipFields.push(field)
      }

      // Recursively search nested fields (tabs, groups, arrays)
      if ((field.type === 'array' || field.type === 'group') && field.fields) {
        searchFields(field.fields)
      }
      if (field.type === 'tabs' && field.tabs) {
        for (const tab of field.tabs) {
          if (tab.fields) {
            searchFields(tab.fields)
          }
        }
      }
    }
  }

  searchFields(fields)
  return relationshipFields
}
