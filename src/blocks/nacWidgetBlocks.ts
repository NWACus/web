import { isRecord } from '@/utilities/isRecord'
import type { BlocksFieldValidation, RichTextFieldValidation } from 'payload'
import { blocks, richText } from 'payload/shared'

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
  return isRecord(block) ? block.blockType : undefined
}

export const validateLayoutBlocks: BlocksFieldValidation = (value, args) => {
  if (Array.isArray(value)) {
    const error = repeatedNACWidgetBlockError(value.map(blockTypeOf))
    if (error) throw Error(error)
  }
  return blocks(value, args)
}

// The blockType of every block node in a Lexical editor state, at any depth
export function lexicalBlockTypes(node: unknown): unknown[] {
  if (!isRecord(node)) return []
  const own = node.type === 'block' && isRecord(node.fields) ? [node.fields.blockType] : []
  const children = isRecord(node.root) ? [node.root] : node.children
  return [...own, ...(Array.isArray(children) ? children.flatMap(lexicalBlockTypes) : [])]
}

export const validateRichTextBlocks: RichTextFieldValidation = (value, args) => {
  const error = repeatedNACWidgetBlockError(lexicalBlockTypes(value))
  if (error) throw Error(error)
  return richText(value, args)
}
