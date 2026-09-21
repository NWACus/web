import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from '@payloadcms/richtext-lexical/lexical'

const BLANK_TYPES = new Set(['paragraph', 'heading'])

function childrenOf(node: SerializedLexicalNode): SerializedLexicalNode[] {
  return 'children' in node && Array.isArray(node.children) ? node.children : []
}

function isBlank(node: SerializedLexicalNode): boolean {
  if (!BLANK_TYPES.has(node.type)) return false
  return childrenOf(node).every(
    (child) =>
      child.type === 'linebreak' ||
      (child.type === 'text' &&
        'text' in child &&
        typeof child.text === 'string' &&
        !child.text.trim()),
  )
}

// Editors leave empty paragraphs and headings after the last block in a rich text field, and each
// one renders as a blank line of prose spacing. Drop them from the end so the field's real spacing
// comes from the block rule.
export function trimTrailingEmptyNodes(data: SerializedEditorState): SerializedEditorState {
  const children = data?.root?.children
  if (!children?.length) return data
  let end = children.length
  while (end > 0 && isBlank(children[end - 1])) end--
  if (end === children.length) return data
  return { ...data, root: { ...data.root, children: children.slice(0, end) } }
}
