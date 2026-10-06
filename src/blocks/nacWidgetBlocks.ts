import type { BlocksFieldValidation } from 'payload'
import { blocks } from 'payload/shared'

// Blocks that mount a NAC widget. The widget's DOM id and window controller are
// page-global, so each of these can appear at most once per document.
export const NAC_WIDGET_BLOCKS = [
  { slug: 'nacMediaBlock', label: 'NACMediaBlock' },
  { slug: 'observationsWidget', label: 'Observations Widget' },
] as const

// The first NAC widget block that appears more than once, as an error message.
export function repeatedNACWidgetBlockError(blockTypes: unknown[]): string | null {
  for (const { slug, label } of NAC_WIDGET_BLOCKS) {
    if (blockTypes.filter((blockType) => blockType === slug).length > 1) {
      return `Only one ${label} is allowed per page`
    }
  }
  return null
}

function blockTypeOf(block: unknown): unknown {
  return typeof block === 'object' && block !== null && 'blockType' in block
    ? block.blockType
    : undefined
}

export const validateLayoutBlocks: BlocksFieldValidation = (value, args) => {
  if (Array.isArray(value)) {
    const error = repeatedNACWidgetBlockError(value.map(blockTypeOf))
    if (error) throw Error(error)
  }
  return blocks(value, args)
}
