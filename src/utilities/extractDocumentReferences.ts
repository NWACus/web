import type { Block, Field } from 'payload'

export interface DocumentReference {
  collection: string
  docId: number
  blockType: string | null
  fieldPath: string
}

type DataObject = Record<string, unknown>

function isDataObject(value: unknown): value is DataObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Extracts a numeric document ID from a relationship value.
 * Handles both unresolved IDs (number) and populated objects ({ id: number }).
 */
function extractId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (isDataObject(value) && typeof value.id === 'number') return value.id
  return null
}

/**
 * Extracts references from a single relationship or upload field value.
 * Handles: singular, hasMany (array), polymorphic ({ relationTo, value }), and
 * polymorphic hasMany (array of { relationTo, value }).
 */
function extractRefsFromRelationshipValue(
  value: unknown,
  /** The `relationTo` from the field config — string or string[] */
  relationTo: string | string[],
  blockType: string | null,
  fieldPath: string,
  refs: DocumentReference[],
): void {
  if (value == null) return

  const isPolymorphic = Array.isArray(relationTo)

  if (Array.isArray(value)) {
    // hasMany — array of IDs, populated objects, or polymorphic objects
    for (const item of value) {
      extractRefsFromRelationshipValue(item, relationTo, blockType, fieldPath, refs)
    }
    return
  }

  if (isPolymorphic) {
    // Polymorphic: { relationTo: 'collection', value: id | { id } }
    if (isDataObject(value) && typeof value.relationTo === 'string') {
      const id = extractId(value.value)
      if (id != null) {
        refs.push({ collection: value.relationTo, docId: id, blockType, fieldPath })
      }
    }
    return
  }

  // Non-polymorphic singular: ID or populated object
  if (typeof relationTo !== 'string') return
  const id = extractId(value)
  if (id != null) {
    refs.push({ collection: relationTo, docId: id, blockType, fieldPath })
  }
}

/**
 * Resolves the list of Block configs allowed in a richText field's BlocksFeature.
 * Works with the mock in tests (which stores blocks in serverFeatureProps.blocks)
 * and with the real Payload editor config.
 */
function getBlocksFromRichTextField(field: Field): Block[] {
  if (field.type !== 'richText') return []

  // The editor object has a `features` array (resolved by lexicalEditor or our test mock).
  // These properties aren't on the Field type but exist at runtime on resolved richText fields.
  const fieldObj: DataObject = field
  const editor = fieldObj.editor
  if (!isDataObject(editor)) return []

  const features = editor.features
  if (!Array.isArray(features)) return []

  for (const feature of features) {
    if (!isDataObject(feature) || feature.key !== 'blocks') continue

    const props = feature.serverFeatureProps
    if (!isDataObject(props) || !Array.isArray(props.blocks)) continue

    // Validate that entries look like Block objects (have a slug property)
    if (props.blocks.every((b: unknown) => isDataObject(b) && typeof b.slug === 'string')) {
      return props.blocks
    }
  }

  return []
}

/**
 * Walks a Payload field config tree and the corresponding document data,
 * extracting all relationship and upload references into a flat array.
 *
 * Handles: relationship, upload, blocks, richText (Lexical), group, array,
 * row, collapsible, and tabs fields at any nesting depth.
 */
export function extractDocumentReferences(fields: Field[], data: DataObject): DocumentReference[] {
  const refs: DocumentReference[] = []
  walkFields(fields, data, '', null, refs)

  // Deduplicate on collection + docId (keep first occurrence)
  const seen = new Set<string>()
  return refs.filter((ref) => {
    const key = `${ref.collection}:${ref.docId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function walkFields(
  fields: Field[],
  data: DataObject,
  pathPrefix: string,
  /** blockType slug when inside a block's fields, null at top level */
  currentBlockType: string | null,
  refs: DocumentReference[],
): void {
  for (const field of fields) {
    switch (field.type) {
      case 'relationship':
      case 'upload': {
        const value = data[field.name]
        const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
        extractRefsFromRelationshipValue(value, field.relationTo, currentBlockType, fieldPath, refs)
        break
      }

      case 'blocks': {
        const blocksData = data[field.name]
        if (!Array.isArray(blocksData)) break
        const blockConfigMap = new Map(field.blocks.map((b) => [b.slug, b]))

        blocksData.forEach((blockData, index) => {
          if (!isDataObject(blockData)) return
          const blockType = blockData.blockType
          if (typeof blockType !== 'string') return

          const blockConfig = blockConfigMap.get(blockType)
          if (!blockConfig?.fields) return

          const blockPath = pathPrefix
            ? `${pathPrefix}.${field.name}.${index}`
            : `${field.name}.${index}`
          walkFields(blockConfig.fields, blockData, blockPath, blockType, refs)
        })
        break
      }

      case 'richText': {
        const richTextData = data[field.name]
        if (!isDataObject(richTextData)) break

        const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
        const allowedBlocks = getBlocksFromRichTextField(field)
        const blockConfigMap = new Map(allowedBlocks.map((b) => [b.slug, b]))

        walkLexicalNodes(richTextData, blockConfigMap, fieldPath, refs)
        break
      }

      case 'group': {
        if ('name' in field && field.name) {
          const groupData = data[field.name]
          if (!isDataObject(groupData)) break
          const groupPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
          walkFields(field.fields, groupData, groupPath, currentBlockType, refs)
        } else {
          // Unnamed group — fields at same level
          walkFields(field.fields, data, pathPrefix, currentBlockType, refs)
        }
        break
      }

      case 'array': {
        const arrayData = data[field.name]
        if (!Array.isArray(arrayData)) break

        arrayData.forEach((item, index) => {
          if (!isDataObject(item)) return
          const itemPath = pathPrefix
            ? `${pathPrefix}.${field.name}.${index}`
            : `${field.name}.${index}`
          walkFields(field.fields, item, itemPath, currentBlockType, refs)
        })
        break
      }

      case 'row':
      case 'collapsible': {
        // Layout-only wrappers — fields are at the same data level
        walkFields(field.fields, data, pathPrefix, currentBlockType, refs)
        break
      }

      case 'tabs': {
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) {
            const tabData = data[tab.name]
            if (!isDataObject(tabData)) continue
            const tabPath = pathPrefix ? `${pathPrefix}.${tab.name}` : tab.name
            walkFields(tab.fields, tabData, tabPath, currentBlockType, refs)
          } else {
            // Unnamed tab — fields at same level
            walkFields(tab.fields, data, pathPrefix, currentBlockType, refs)
          }
        }
        break
      }

      // All other field types (text, number, checkbox, etc.) — skip
    }
  }
}

/**
 * Walks a Lexical AST looking for block nodes. For each block node found:
 * 1. Looks up the block config to find relationship/upload fields
 * 2. Extracts references from those fields
 * 3. Recursively walks any richText fields within the block (handling deep nesting)
 *
 * All references found within a Lexical AST use the richText field's path as
 * their fieldPath, regardless of nesting depth. This is because the Lexical
 * JSON structure is opaque — the useful location info is "which richText field".
 */
function walkLexicalNodes(
  lexicalData: DataObject,
  blockConfigMap: Map<string, Block>,
  fieldPath: string,
  refs: DocumentReference[],
): void {
  const root = lexicalData.root
  if (!isDataObject(root)) return

  function walkNode(node: DataObject): void {
    if (node.type === 'block' && isDataObject(node.fields)) {
      const blockType = node.fields.blockType
      if (typeof blockType === 'string') {
        const blockConfig = blockConfigMap.get(blockType)
        if (blockConfig?.fields) {
          // Extract refs from this block using fixed fieldPath (no path extension)
          walkFieldsInLexicalContext(blockConfig.fields, node.fields, blockType, fieldPath, refs)
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (isDataObject(child)) {
          walkNode(child)
        }
      }
    }
  }

  walkNode(root)
}

/**
 * Walks fields within a Lexical block context. Unlike walkFields, this uses a
 * fixed fieldPath (the richText field's path) for all extracted refs and does
 * not extend the path as it recurses into nested structures.
 */
function walkFieldsInLexicalContext(
  fields: Field[],
  data: DataObject,
  blockType: string,
  fieldPath: string,
  refs: DocumentReference[],
): void {
  for (const field of fields) {
    switch (field.type) {
      case 'relationship':
      case 'upload': {
        const value = data[field.name]
        extractRefsFromRelationshipValue(value, field.relationTo, blockType, fieldPath, refs)
        break
      }

      case 'richText': {
        // Nested richText within a Lexical block — recurse into its own AST
        const richTextData = data[field.name]
        if (!isDataObject(richTextData)) break
        const allowedBlocks = getBlocksFromRichTextField(field)
        const nestedBlockConfigMap = new Map(allowedBlocks.map((b) => [b.slug, b]))
        walkLexicalNodes(richTextData, nestedBlockConfigMap, fieldPath, refs)
        break
      }

      case 'group': {
        if ('name' in field && field.name) {
          const groupData = data[field.name]
          if (!isDataObject(groupData)) break
          walkFieldsInLexicalContext(field.fields, groupData, blockType, fieldPath, refs)
        } else {
          walkFieldsInLexicalContext(field.fields, data, blockType, fieldPath, refs)
        }
        break
      }

      case 'array': {
        const arrayData = data[field.name]
        if (!Array.isArray(arrayData)) break
        for (const item of arrayData) {
          if (isDataObject(item)) {
            walkFieldsInLexicalContext(field.fields, item, blockType, fieldPath, refs)
          }
        }
        break
      }

      case 'row':
      case 'collapsible': {
        walkFieldsInLexicalContext(field.fields, data, blockType, fieldPath, refs)
        break
      }

      case 'tabs': {
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) {
            const tabData = data[tab.name]
            if (!isDataObject(tabData)) continue
            walkFieldsInLexicalContext(tab.fields, tabData, blockType, fieldPath, refs)
          } else {
            walkFieldsInLexicalContext(tab.fields, data, blockType, fieldPath, refs)
          }
        }
        break
      }
    }
  }
}
