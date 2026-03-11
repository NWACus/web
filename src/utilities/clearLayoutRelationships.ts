import { NACMediaBlock } from '@/blocks/NACMedia/config'
import { DEFAULT_BLOCKS } from '@/constants/defaults'
import type { Field } from 'payload'

type DataObject = Record<string, unknown>

interface LexicalNode {
  type?: string
  children?: LexicalNode[]
  fields?: DataObject
}
const allBlocksMap = new Map([...DEFAULT_BLOCKS, NACMediaBlock].map((b) => [b.slug, b]))

function isDataObject(value: unknown): value is DataObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLexicalNode(value: unknown): value is LexicalNode {
  return typeof value === 'object' && value !== null
}

function clearFieldValues(data: DataObject, fields: Field[]): DataObject {
  const result = { ...data }

  // Strip the exact 'id' key (not fields like 'videoId') so new IDs are assigned on create
  Reflect.deleteProperty(result, 'id')

  for (const field of fields) {
    if (field.type === 'relationship' || field.type === 'upload') {
      Reflect.deleteProperty(result, field.name)
    } else if (field.type === 'group') {
      if ('name' in field) {
        const groupData = result[field.name]
        if (isDataObject(groupData)) {
          result[field.name] = clearFieldValues(groupData, field.fields)
        }
      } else {
        // Unnamed group: fields live at the same data level
        const updated = clearFieldValues(result, field.fields)
        Object.assign(result, updated)
      }
    } else if (field.type === 'array') {
      const arrayData = result[field.name]
      if (Array.isArray(arrayData)) {
        result[field.name] = arrayData.map((item) =>
          isDataObject(item) ? clearFieldValues(item, field.fields) : item,
        )
      }
    } else if (field.type === 'richText') {
      const richTextData = result[field.name]
      if (isDataObject(richTextData)) {
        result[field.name] = clearLexicalBlockRelationships(richTextData)
      }
    } else if (field.type === 'row' || field.type === 'collapsible') {
      // row/collapsible are layout-only containers — their sub-fields live at the same data level
      const updated = clearFieldValues(result, field.fields)
      Object.assign(result, updated)
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab) {
          // Named tab: data is nested under tab.name
          const tabData = result[tab.name]
          if (isDataObject(tabData)) {
            result[tab.name] = clearFieldValues(tabData, tab.fields)
          }
        } else {
          // Unnamed tab: data is at the same level as the parent
          const updated = clearFieldValues(result, tab.fields)
          Object.assign(result, updated)
        }
      }
    }
  }

  return result
}

function clearLexicalBlockRelationships(lexicalData: DataObject): DataObject {
  function walkNode(node: LexicalNode): LexicalNode {
    const result: LexicalNode = { ...node }

    if (node.type === 'block' && isDataObject(node.fields)) {
      const blockType = node.fields.blockType
      if (typeof blockType === 'string') {
        const blockConfig = allBlocksMap.get(blockType)
        if (blockConfig) {
          result.fields = clearFieldValues(node.fields, blockConfig.fields ?? [])
        }
      }
    }

    if (node.children) {
      result.children = node.children.map(walkNode)
    }

    return result
  }

  const root = lexicalData.root
  if (isLexicalNode(root)) {
    return { ...lexicalData, root: walkNode(root) }
  }

  return lexicalData
}

/**
 * Clears all relationship and upload field values from a page layout.
 * Used when duplicating a page to another tenant so that tenant-scoped
 * relationships must be repopulated by the user in the new page.
 */
export function clearLayoutRelationships(layout: unknown[]): DataObject[] {
  return layout.map((block) => {
    if (!isDataObject(block)) return {}
    const blockType = block.blockType
    if (typeof blockType !== 'string') return block

    const blockConfig = allBlocksMap.get(blockType)
    if (!blockConfig) return block

    return clearFieldValues(block, blockConfig.fields ?? [])
  })
}
