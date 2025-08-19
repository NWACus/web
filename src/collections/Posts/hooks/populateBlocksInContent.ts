import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { getBlocksFromConfig } from '@/utilities/getBlocksFromConfig'

interface BlockReference {
  blockType: string
  collection: string
  docId: number
}

interface LexicalNode {
  type?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
}

interface LexicalContent {
  root?: {
    children?: LexicalNode[]
  }
}

/**
 * Extract ID from field value (handles both direct ID and populated object)
 */
function extractIdsFromFieldValue(fieldValue: unknown): number[] | null {
  if (typeof fieldValue === 'number') {
    return [fieldValue]
  }

  if (typeof fieldValue === 'object' && fieldValue !== null && 'id' in fieldValue) {
    const obj = fieldValue
    if (typeof obj.id === 'number') {
      return [obj.id]
    }
  }

  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    return fieldValue
      .flatMap((val) => extractIdsFromFieldValue(val))
      .filter((val): val is number => val !== null && typeof val === 'number')
  }

  return null
}

/**
 * Extract block references from Lexical editor content
 */
async function extractBlockReferencesFromLexical(
  content: LexicalContent,
): Promise<BlockReference[]> {
  if (!content?.root?.children) {
    return []
  }

  const { postsBlockMappings } = await getBlocksFromConfig()
  const references: BlockReference[] = []

  function walkNodes(nodes: LexicalNode[]) {
    for (const node of nodes) {
      if (node.type === 'block' && node.fields) {
        const blockType = node.fields.blockType

        if (typeof blockType === 'string') {
          for (const [collection, mappings] of Object.entries(postsBlockMappings)) {
            const blockTypeMappings = mappings.filter(
              ({ blockType: mappingBlockType }) => mappingBlockType === blockType,
            )

            for (const mapping of blockTypeMappings) {
              const fieldValue = node.fields[mapping.fieldName]
              const docIds = extractIdsFromFieldValue(fieldValue)

              if (docIds !== null) {
                for (const docId of docIds) {
                  references.push({
                    blockType,
                    collection,
                    docId,
                  })
                }
              }
            }
          }
        }
      }

      // Recursively process children
      if (node.children) {
        walkNodes(node.children)
      }
    }
  }

  walkNodes(content.root.children)
  return references
}

export const populateBlocksInContent: CollectionAfterChangeHook<Post> = async ({ data, req }) => {
  if (data._status === 'draft') return data

  if (data.content) {
    try {
      const blockReferences = await extractBlockReferencesFromLexical(data.content)

      data.blocksInContent = blockReferences
    } catch (error) {
      req.payload.logger.warn(`Error extracting block references: ${error}`)
      data.blocksInContent = []
    }
  } else {
    data.blocksInContent = []
  }

  return data
}
