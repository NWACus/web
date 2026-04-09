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

function isBlock(value: unknown): value is Block {
  return isDataObject(value) && typeof value.slug === 'string'
}

function extractId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (isDataObject(value) && typeof value.id === 'number') return value.id
  return null
}

function extractRefsFromRelationshipValue(
  value: unknown,
  relationTo: string | string[],
  blockType: string | null,
  fieldPath: string,
  refs: DocumentReference[],
): void {
  if (value == null) return

  const isPolymorphic = Array.isArray(relationTo)

  if (Array.isArray(value)) {
    for (const item of value) {
      extractRefsFromRelationshipValue(item, relationTo, blockType, fieldPath, refs)
    }
    return
  }

  if (isPolymorphic) {
    if (isDataObject(value) && typeof value.relationTo === 'string') {
      if (value.relationTo === 'tenants') return
      const id = extractId(value.value)
      if (id != null) {
        refs.push({ collection: value.relationTo, docId: id, blockType, fieldPath })
      }
    }
    return
  }

  if (typeof relationTo !== 'string') return
  // Skip tenant references
  if (relationTo === 'tenants') return
  const id = extractId(value)
  if (id != null) {
    refs.push({ collection: relationTo, docId: id, blockType, fieldPath })
  }
}

function getBlocksFromRichTextField(field: Field): Block[] {
  if (field.type !== 'richText') return []

  // These properties aren't on the Field type but exist at runtime on resolved richText fields.
  const fieldObj: DataObject = field
  const editor = fieldObj.editor
  if (!isDataObject(editor)) return []

  const features = editor.features
  if (!Array.isArray(features)) return []

  for (const feature of features) {
    if (!isDataObject(feature) || feature.key !== 'blocks') continue

    const props = feature.serverFeatureProps
    if (!isDataObject(props)) continue

    const allBlocks: Block[] = []

    if (Array.isArray(props.blocks)) {
      for (const b of props.blocks) {
        if (isBlock(b)) allBlocks.push(b)
      }
    }
    if (Array.isArray(props.inlineBlocks)) {
      for (const b of props.inlineBlocks) {
        if (isBlock(b)) allBlocks.push(b)
      }
    }

    if (allBlocks.length > 0) return allBlocks
  }

  return []
}

/** Walks a Payload field config tree and extracts all relationship/upload references. */
export function extractDocumentReferences(fields: Field[], data: DataObject): DocumentReference[] {
  const refs: DocumentReference[] = []
  walkFields(fields, data, '', null, refs)

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
            walkFields(tab.fields, data, pathPrefix, currentBlockType, refs)
          }
        }
        break
      }
    }
  }
}

/**
 * Walks a Lexical AST looking for block nodes and extracting their references.
 * All refs use the richText field's path as fieldPath regardless of nesting depth.
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
    if ((node.type === 'block' || node.type === 'inlineBlock') && isDataObject(node.fields)) {
      const blockType = node.fields.blockType
      if (typeof blockType === 'string') {
        const blockConfig = blockConfigMap.get(blockType)
        if (blockConfig?.fields) {
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

/** Like walkFields but uses a fixed fieldPath (the richText field's path) for all refs. */
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
