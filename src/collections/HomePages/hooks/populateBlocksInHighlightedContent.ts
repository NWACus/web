import type { CollectionBeforeChangeHook } from 'payload'

import type { HomePage } from '@/payload-types'
import {
  type BlockReference,
  walkLexicalNodes,
} from '@/utilities/extractBlockReferencesFromLexical'
import { getBlocksFromConfig } from '@/utilities/getBlocksFromConfig'

export const populateBlocksInHighlightedContent: CollectionBeforeChangeHook<HomePage> = async ({
  data,
  req,
}) => {
  let blocksInHighlightedContent: BlockReference[] = []

  if (data.highlightedContent?.columns && Array.isArray(data.highlightedContent.columns)) {
    try {
      const { homePagesHighlightedContentBlockMappings } = await getBlocksFromConfig()

      // Extract block references from all richText fields in columns
      for (const column of data.highlightedContent.columns) {
        if (column.richText?.root?.children) {
          const blockReferences = walkLexicalNodes(
            column.richText.root.children,
            homePagesHighlightedContentBlockMappings,
          )
          blocksInHighlightedContent.push(...blockReferences)
        }
      }
    } catch (error) {
      req.payload.logger.warn(`Error extracting block references from highlightedContent: ${error}`)
      blocksInHighlightedContent = []
    }
  }

  return {
    ...data,
    blocksInHighlightedContent,
  }
}
