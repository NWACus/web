import type { CollectionBeforeChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { getBlocksFromConfig } from '@/utilities/getBlocksFromConfig'

interface BlockReference {
  blockType: string
  collection: string
  blockId: number
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
function extractIdFromFieldValue(fieldValue: unknown): number | null {
  if (typeof fieldValue === 'number') {
    return fieldValue
  }

  if (typeof fieldValue === 'object' && fieldValue !== null && 'id' in fieldValue) {
    const obj = fieldValue
    if (typeof obj.id === 'number') {
      return obj.id
    }
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
          for (const [collection, mapping] of Object.entries(postsBlockMappings)) {
            if (mapping.blockType === blockType) {
              const fieldValue = node.fields[mapping.fieldName]
              const blockId = extractIdFromFieldValue(fieldValue)

              if (blockId !== null) {
                references.push({
                  blockType,
                  collection,
                  blockId,
                })
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

export const populateBlocksInContent: CollectionBeforeChangeHook<Post> = async ({ data, req }) => {
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
