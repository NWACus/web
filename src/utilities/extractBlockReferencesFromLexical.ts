export interface BlockReference {
  blockType: string
  collection: string
  docId: number
}

interface LexicalNode {
  type?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
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
 * Walk Lexical AST nodes and extract block references based on provided mappings
 */
export function walkLexicalNodes(
  nodes: LexicalNode[],
  blockMappings: Record<
    string,
    Array<{ blockType: string; fieldName: string; isHasMany: boolean }>
  >,
): BlockReference[] {
  const references: BlockReference[] = []

  function walkNodes(nodesToWalk: LexicalNode[]) {
    for (const node of nodesToWalk) {
      if (node.type === 'block' && node.fields) {
        const blockType = node.fields.blockType

        if (typeof blockType === 'string') {
          for (const [collection, mappings] of Object.entries(blockMappings)) {
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

  walkNodes(nodes)
  return references
}
