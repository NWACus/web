jest.mock('../../src/payload.config', () => ({}))

import {
  lexicalBlockTypes,
  NAC_WIDGET_BLOCKS,
  repeatedNACWidgetBlockError,
  validateLayoutBlocks,
  validateRichTextBlocks,
} from '@/blocks/nacWidgetBlocks'
import { isRecord } from '@/utilities/isRecord'
import { readdirSync } from 'fs'
import path from 'path'
import type { Block, CollectionConfig, Field } from 'payload'

const COLLECTIONS_DIR = path.join(process.cwd(), 'src/collections')
const NAC_WIDGET_SLUGS: string[] = NAC_WIDGET_BLOCKS.map(({ slug }) => slug)

const isCollectionConfig = (value: unknown): value is CollectionConfig =>
  isRecord(value) && typeof value.slug === 'string' && Array.isArray(value.fields)

async function loadCollections(): Promise<CollectionConfig[]> {
  const dirs = readdirSync(COLLECTIONS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  const configs = await Promise.all(
    dirs.map(async (dir) => {
      const mod: Record<string, unknown> = await import(path.join(COLLECTIONS_DIR, dir.name))
      return Object.values(mod).filter(isCollectionConfig)
    }),
  )
  return configs.flat()
}

type BlocksFieldAt = { path: string; blocks: Block[]; validate: unknown }

// Every blocks field, including ones nested in tabs, groups, arrays and other blocks
function blocksFields(fields: Field[], at: string): BlocksFieldAt[] {
  return fields.flatMap((field): BlocksFieldAt[] => {
    const here = 'name' in field ? `${at}.${field.name}` : at
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) =>
        blocksFields(tab.fields, 'name' in tab && tab.name ? `${at}.${tab.name}` : at),
      )
    }
    if (field.type === 'blocks') {
      const blocks = field.blocks.filter((block) => typeof block !== 'string')
      return [
        { path: here, blocks, validate: field.validate },
        ...blocks.flatMap((block) => blocksFields(block.fields, `${here}.${block.slug}`)),
      ]
    }
    if ('fields' in field) return blocksFields(field.fields, here)
    return []
  })
}

describe('repeatedNACWidgetBlockError', () => {
  it('allows one of each NAC widget block', () => {
    expect(repeatedNACWidgetBlockError(['content', ...NAC_WIDGET_SLUGS, 'content'])).toBeNull()
  })

  it.each(NAC_WIDGET_BLOCKS)('rejects a second $slug', ({ slug, label }) => {
    expect(repeatedNACWidgetBlockError([slug, 'content', slug])).toBe(
      `Only one ${label} is allowed per page`,
    )
  })
})

const blockNode = (blockType: string) => ({ type: 'block', fields: { blockType }, version: 2 })

describe('lexicalBlockTypes', () => {
  it('finds block nodes at any depth', () => {
    const editorState = {
      root: {
        type: 'root',
        children: [
          blockNode('observationsWidget'),
          { type: 'paragraph', children: [{ type: 'text', text: 'hi' }] },
          { type: 'list', children: [{ type: 'listitem', children: [blockNode('mediaBlock')] }] },
        ],
      },
    }
    expect(lexicalBlockTypes(editorState)).toEqual(['observationsWidget', 'mediaBlock'])
  })

  it('reads nothing from an empty or missing value', () => {
    expect(lexicalBlockTypes(null)).toEqual([])
    expect(lexicalBlockTypes({ root: { type: 'root', children: [] } })).toEqual([])
  })
})

describe('validateRichTextBlocks', () => {
  it('rejects a second observations widget before the editor validates', () => {
    const editorState = {
      root: {
        type: 'root',
        children: [blockNode('observationsWidget'), blockNode('observationsWidget')],
      },
    }
    // Returns before reaching the editor's own validation, so no editor args are needed
    expect(validateRichTextBlocks(editorState, Object.create(null))).toBe(
      'Only one Observations Widget is allowed per page',
    )
  })
})

describe('validateLayoutBlocks', () => {
  it('rejects a second observations widget before the default blocks validation', () => {
    const layout = [{ blockType: 'observationsWidget' }, { blockType: 'observationsWidget' }]
    expect(validateLayoutBlocks(layout, Object.create(null))).toBe(
      'Only one Observations Widget is allowed per page',
    )
  })
})

describe('NAC widget block coverage', () => {
  it('every blocks field offering a NAC widget block limits it to one per document', async () => {
    const collections = await loadCollections()
    const offering = collections
      .flatMap((collection) => blocksFields(collection.fields, collection.slug))
      .filter((field) => field.blocks.some((block) => NAC_WIDGET_SLUGS.includes(block.slug)))

    expect(offering.map((field) => field.path)).toEqual(
      expect.arrayContaining(['homePages.layout', 'pages.layout']),
    )
    for (const field of offering) {
      expect({ path: field.path, validate: field.validate }).toEqual({
        path: field.path,
        validate: validateLayoutBlocks,
      })
    }
  })
})
