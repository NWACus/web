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
    const obj = fieldValue as { id: unknown }
    if (typeof obj.id === 'number') {
      return obj.id
    }
  }

  return null
}

/**
 * Extract block references from Lexical editor content
 * Uses existing block mappings from getBlocksFromConfig for consistency
 */
async function extractBlockReferencesFromLexical(
  content: LexicalContent,
): Promise<BlockReference[]> {
  if (!content?.root?.children) {
    return []
  }

  // Get the pre-built block mappings that map collections to their block+field info
  const { postsBlockMappings } = await getBlocksFromConfig()
  const references: BlockReference[] = []

  function walkNodes(nodes: LexicalNode[]) {
    for (const node of nodes) {
      // Process block nodes
      if (node.type === 'block' && node.fields) {
        const blockType = node.fields.blockType

        if (typeof blockType === 'string') {
          // Check each collection mapping to see if this block type matches
          for (const [collection, mapping] of Object.entries(postsBlockMappings)) {
            if (mapping.blockType === blockType) {
              // Extract the ID from the field specified in the mapping
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
  if (data.content) {
    try {
      const blockReferences = await extractBlockReferencesFromLexical(data.content)

      // Update the blocksInContent field with extracted references
      data.blocksInContent = blockReferences

      req.payload.logger.info(
        `Extracted ${blockReferences.length} block references from post content`,
      )
    } catch (error) {
      req.payload.logger.warn(`Error extracting block references: ${error}`)
      // Set empty array on error to ensure field is always populated
      data.blocksInContent = []
    }
  } else {
    // No content, ensure field is empty
    data.blocksInContent = []
  }

  return data
}
