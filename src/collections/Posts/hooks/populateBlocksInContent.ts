import type { CollectionBeforeChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import {
  type BlockReference,
  walkLexicalNodes,
} from '@/utilities/extractBlockReferencesFromLexical'
import { getBlocksFromConfig } from '@/utilities/getBlocksFromConfig'

export const populateBlocksInContent: CollectionBeforeChangeHook<Post> = async ({ data, req }) => {
  if (data._status === 'draft') return data

  let blocksInContent: BlockReference[] = []

  if (data.content?.root?.children) {
    try {
      const { postsBlockMappings } = await getBlocksFromConfig()
      blocksInContent = walkLexicalNodes(data.content.root.children, postsBlockMappings)
    } catch (error) {
      req.payload.logger.warn(`Error extracting block references: ${error}`)
      blocksInContent = []
    }
  }

  return {
    ...data,
    blocksInContent,
  }
}
