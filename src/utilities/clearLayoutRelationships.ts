import { NACMediaBlock } from '@/blocks/NACMedia/config'
import { DEFAULT_BLOCKS } from '@/constants/defaults'
import type { Page } from '@/payload-types'
import type { Field } from 'payload'

type DataObject = Record<string, unknown>

const allBlocksMap = new Map([...DEFAULT_BLOCKS, NACMediaBlock].map((b) => [b.slug, b]))

function isDataObject(value: unknown): value is DataObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clearFieldValuesInPlace(data: DataObject, fields: Field[]): void {
  // Strip 'id' (not fields like 'videoId') so new IDs are assigned on create
  Reflect.deleteProperty(data, 'id')

  for (const field of fields) {
    if (field.type === 'relationship' || field.type === 'upload') {
      Reflect.deleteProperty(data, field.name)
    } else if (field.type === 'group') {
      if ('name' in field) {
        const groupData = data[field.name]
        if (isDataObject(groupData)) {
          clearFieldValuesInPlace(groupData, field.fields)
        }
      } else {
        // Unnamed group — fields are at the same level
        clearFieldValuesInPlace(data, field.fields)
      }
    } else if (field.type === 'array') {
      const arrayData = data[field.name]
      if (Array.isArray(arrayData)) {
        arrayData.forEach((item) => {
          if (isDataObject(item)) {
            clearFieldValuesInPlace(item, field.fields)
          }
        })
      }
    } else if (field.type === 'richText') {
      const richTextData = data[field.name]
      if (isDataObject(richTextData)) {
        clearLexicalBlockRelationshipsInPlace(richTextData)
      }
    } else if (field.type === 'row' || field.type === 'collapsible') {
      // Layout-only containers — fields are at the same level
      clearFieldValuesInPlace(data, field.fields)
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab) {
          const tabData = data[tab.name]
          if (isDataObject(tabData)) {
            clearFieldValuesInPlace(tabData, tab.fields)
          }
        } else {
          clearFieldValuesInPlace(data, tab.fields)
        }
      }
    }
  }
}

function clearLexicalBlockRelationshipsInPlace(lexicalData: DataObject): void {
  function walkNode(node: DataObject): void {
    if (node.type === 'block' && isDataObject(node.fields)) {
      const blockType = node.fields.blockType
      if (typeof blockType === 'string') {
        const blockConfig = allBlocksMap.get(blockType)
        if (blockConfig) {
          clearFieldValuesInPlace(node.fields, blockConfig.fields ?? [])
        }
      }
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => {
        if (isDataObject(child)) {
          walkNode(child)
        }
      })
    }
  }

  if (isDataObject(lexicalData.root)) {
    walkNode(lexicalData.root)
  }
}

/**
 * Clears relationship and upload fields from a page layout so
 * tenant-scoped references can be repopulated after duplication.
 */
export function clearLayoutRelationships(layout: Page['layout']): Page['layout'] {
  if (!Array.isArray(layout)) return layout
  return layout.map((block) => {
    const result = { ...block }
    // Downcast for dynamic field access — specific → general is always valid without assertion
    const mutable: DataObject = result
    const blockConfig = allBlocksMap.get(block.blockType)
    if (blockConfig) {
      clearFieldValuesInPlace(mutable, blockConfig.fields ?? [])
    }
    return result
  })
}
