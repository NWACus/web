// Mock modules that need a running Payload instance or execute at import time.
// These must be before any imports that trigger the module load chain.
jest.mock('../../src/payload.config', () => ({}))
jest.mock('payload', () => ({ getPayload: jest.fn() }))

// lexicalEditor and feature functions execute at module scope when block configs load.
// We stub them but make BlocksFeature capture its blocks arg so the extraction function
// can introspect which blocks each richText field allows (via feature.serverFeatureProps.blocks).
jest.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: ({ features }: { features?: unknown }) => {
    // Resolve the features array the same way the real lexicalEditor does
    const resolvedFeatures =
      typeof features === 'function' ? features({ rootFeatures: [] }) : (features ?? [])
    return { features: resolvedFeatures }
  },
  BlocksFeature: ({ blocks, inlineBlocks }: { blocks?: unknown[]; inlineBlocks?: unknown[] }) => ({
    key: 'blocks',
    serverFeatureProps: { blocks: blocks ?? [], inlineBlocks: inlineBlocks ?? [] },
  }),
  FixedToolbarFeature: () => ({ key: 'fixedToolbar' }),
  HeadingFeature: () => ({ key: 'heading' }),
  HorizontalRuleFeature: () => ({ key: 'horizontalRule' }),
  InlineToolbarFeature: () => ({ key: 'inlineToolbar' }),
  AlignFeature: () => ({ key: 'align' }),
  ParagraphFeature: () => ({ key: 'paragraph' }),
  UnderlineFeature: () => ({ key: 'underline' }),
  BoldFeature: () => ({ key: 'bold' }),
  ItalicFeature: () => ({ key: 'italic' }),
  LinkFeature: () => ({ key: 'link' }),
}))

import { BlogListBlock } from '@/blocks/BlogList/config'
import { ButtonBlock } from '@/blocks/Button/config'
import { CalloutBlock } from '@/blocks/Callout/config'
import { ContentBlock } from '@/blocks/Content/config'
import { DocumentBlock } from '@/blocks/Document/config'
import { FormBlock } from '@/blocks/Form/config'
import { MediaBlock } from '@/blocks/Media/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { SponsorsBlock } from '@/blocks/Sponsors/config'
import { TeamBlock } from '@/blocks/Team/config'
import { Events } from '@/collections/Events'
import { HomePages } from '@/collections/HomePages'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block, Field } from 'payload'

import pageAboutUsLayout from './fixtures/page-about-us-layout.json'
import pageSupportersLayout from './fixtures/page-supporters-layout.json'
import pageWhoWeAreLayout from './fixtures/page-who-we-are-layout.json'
import postWithMediaBlock from './fixtures/post-with-media-block.json'

function lexicalRoot(...children: Record<string, unknown>[]): Record<string, unknown> {
  return {
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function lexicalParagraph(text: string): Record<string, unknown> {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text,
        type: 'text',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}

function lexicalBlock(fields: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'block',
    version: 2,
    format: '',
    fields,
  }
}

function lexicalInlineBlock(fields: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'inlineBlock',
    version: 1,
    fields,
  }
}

import { extractDocumentReferences } from '@/utilities/extractDocumentReferences'

const pagesFields = Pages.fields
const postsFields = Posts.fields
const eventsFields = Events.fields
const homePagesFields = HomePages.fields

// Layout-only field wrappers (row, collapsible, unnamed/named tabs).
// These are synthetic because no single collection has all wrapper types together,
// and the behavior being tested is the walker's traversal logic, not specific configs.
const fieldsWithLayoutWrappers: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'headerImage', type: 'upload', relationTo: 'media' },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ],
  },
  {
    type: 'collapsible',
    label: 'Advanced',
    fields: [{ name: 'sponsor', type: 'relationship', relationTo: 'sponsors' }],
  },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Content', // unnamed tab — fields at same level
        fields: [{ name: 'author', type: 'relationship', relationTo: 'biographies' }],
      },
      {
        name: 'meta', // named tab — creates namespace
        label: 'SEO',
        fields: [{ name: 'metaImage', type: 'upload', relationTo: 'media' }],
      },
    ],
  },
]

describe('extractDocumentReferences', () => {
  describe('top-level relationship and upload fields', () => {
    it('extracts a relationship field (unpopulated ID)', () => {
      const data = { authors: [5, 12], tags: [3], featuredImage: 42, content: null }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'biographies', docId: 5, blockType: null, fieldPath: 'authors' },
          { collection: 'biographies', docId: 12, blockType: null, fieldPath: 'authors' },
          { collection: 'tags', docId: 3, blockType: null, fieldPath: 'tags' },
          { collection: 'media', docId: 42, blockType: null, fieldPath: 'featuredImage' },
        ]),
      )
      expect(result).toHaveLength(4)
    })

    it('extracts a relationship from a populated object (with id)', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: { id: 99, filename: 'photo.jpg', url: '/media/photo.jpg' },
        content: null,
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([
        { collection: 'media', docId: 99, blockType: null, fieldPath: 'featuredImage' },
      ])
    })

    it('handles null and undefined relationship values', () => {
      const data = { authors: null, tags: undefined, featuredImage: null, content: null }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([])
    })

    it('handles empty hasMany arrays', () => {
      const data = { authors: [], tags: [], featuredImage: null, content: null }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([])
    })

    it('handles hasMany with populated objects', () => {
      const data = {
        authors: [
          { id: 5, name: 'Alice' },
          { id: 12, name: 'Bob' },
        ],
        tags: [],
        featuredImage: null,
        content: null,
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'biographies', docId: 5, blockType: null, fieldPath: 'authors' },
          { collection: 'biographies', docId: 12, blockType: null, fieldPath: 'authors' },
        ]),
      )
      expect(result).toHaveLength(2)
    })

    it('extracts polymorphic relationship with relationship (unpopulated ID)', () => {
      const fields: Field[] = [
        {
          name: 'reference',
          type: 'relationship',
          relationTo: ['pages', 'builtInPages', 'posts'],
        },
      ]
      const data = { reference: { relationTo: 'pages', value: 57 } }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'pages', docId: 57, blockType: null, fieldPath: 'reference' },
      ])
    })

    it('extracts polymorphic relationship with populated value', () => {
      const fields: Field[] = [
        {
          name: 'reference',
          type: 'relationship',
          relationTo: ['pages', 'builtInPages', 'posts'],
        },
      ]
      const data = { reference: { relationTo: 'posts', value: { id: 23, title: 'A post' } } }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'posts', docId: 23, blockType: null, fieldPath: 'reference' },
      ])
    })

    it('extracts polymorphic relationship with hasMany relationships (unpopulated IDs)', () => {
      const fields: Field[] = [
        {
          name: 'references',
          type: 'relationship',
          hasMany: true,
          relationTo: ['pages', 'builtInPages', 'posts'],
        },
      ]
      const data = {
        references: [
          { relationTo: 'pages', value: 57 },
          { relationTo: 'builtInPages', value: 42 },
        ],
      }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'pages', docId: 57, blockType: null, fieldPath: 'references' },
        { collection: 'builtInPages', docId: 42, blockType: null, fieldPath: 'references' },
      ])
    })

    it('extracts polymorphic relationship with hasMany relationships with populated values', () => {
      const fields: Field[] = [
        {
          name: 'references',
          type: 'relationship',
          hasMany: true,
          relationTo: ['pages', 'builtInPages', 'posts'],
        },
      ]
      const data = {
        references: [
          {
            relationTo: 'pages',
            value: {
              id: 57,
              title: 'Contact',
              slug: 'contact',
            },
          },
          {
            relationTo: 'builtInPages',
            value: {
              id: 42,
              title: 'Mountain Weather',
              url: '/weather/forecast',
            },
          },
        ],
      }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'pages', docId: 57, blockType: null, fieldPath: 'references' },
        { collection: 'builtInPages', docId: 42, blockType: null, fieldPath: 'references' },
      ])
    })
  })

  describe('blocks type fields (page layout)', () => {
    it('extracts references from TeamBlock with direct relationship field', () => {
      const data = {
        layout: [
          { blockType: TeamBlock.slug, team: 16, id: 'block-1' },
          { blockType: TeamBlock.slug, team: 20, id: 'block-2' },
        ],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'teams', docId: 16, blockType: TeamBlock.slug, fieldPath: 'layout.0.team' },
          { collection: 'teams', docId: 20, blockType: TeamBlock.slug, fieldPath: 'layout.1.team' },
        ]),
      )
      expect(result).toHaveLength(2)
    })

    it('extracts hasMany references from SponsorsBlock', () => {
      const data = {
        layout: [{ blockType: SponsorsBlock.slug, sponsors: [42, 78], id: 'block-1' }],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          {
            collection: 'sponsors',
            docId: 42,
            blockType: SponsorsBlock.slug,
            fieldPath: 'layout.0.sponsors',
          },
          {
            collection: 'sponsors',
            docId: 78,
            blockType: SponsorsBlock.slug,
            fieldPath: 'layout.0.sponsors',
          },
        ]),
      )
      expect(result).toHaveLength(2)
    })

    it('extracts upload references from MediaBlock', () => {
      const data = {
        layout: [{ blockType: MediaBlock.slug, media: 91, id: 'block-1' }],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([
        { collection: 'media', docId: 91, blockType: MediaBlock.slug, fieldPath: 'layout.0.media' },
      ])
    })

    it('extracts references from BlogListBlock with nested groups (dynamicOptions, staticOptions)', () => {
      const data = {
        layout: [
          {
            blockType: BlogListBlock.slug,
            id: 'block-1',
            heading: 'Latest Posts',
            dynamicOptions: { filterByTags: [3, 7] },
            staticOptions: { staticPosts: [10, 15] },
          },
        ],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          {
            collection: 'tags',
            docId: 3,
            blockType: BlogListBlock.slug,
            fieldPath: 'layout.0.dynamicOptions.filterByTags',
          },
          {
            collection: 'tags',
            docId: 7,
            blockType: BlogListBlock.slug,
            fieldPath: 'layout.0.dynamicOptions.filterByTags',
          },
          {
            collection: 'posts',
            docId: 10,
            blockType: BlogListBlock.slug,
            fieldPath: 'layout.0.staticOptions.staticPosts',
          },
          {
            collection: 'posts',
            docId: 15,
            blockType: BlogListBlock.slug,
            fieldPath: 'layout.0.staticOptions.staticPosts',
          },
        ]),
      )
      expect(result).toHaveLength(4)
    })

    it('extracts relationship from FormBlock', () => {
      const data = {
        layout: [{ blockType: FormBlock.slug, form: 5, id: 'block-1' }],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([
        { collection: 'forms', docId: 5, blockType: FormBlock.slug, fieldPath: 'layout.0.form' },
      ])
    })
  })

  describe('richText fields with inline blocks (1 level)', () => {
    it('extracts block references from Lexical AST in post content', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: null,
        content: lexicalRoot(
          lexicalParagraph('Some text'),
          lexicalBlock({
            media: 499,
            imageSize: 'original',
            blockType: MediaBlock.slug,
            id: 'lex-block-1',
          }),
          lexicalParagraph('More text'),
        ),
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([
        { collection: 'media', docId: 499, blockType: MediaBlock.slug, fieldPath: 'content' },
      ])
    })

    it('extracts multiple block references from richText', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: null,
        content: lexicalRoot(
          lexicalBlock({
            media: 10,
            blockType: MediaBlock.slug,
            id: 'lex-1',
          }),
          lexicalBlock({
            document: 20,
            blockType: DocumentBlock.slug,
            id: 'lex-2',
          }),
          lexicalBlock({
            post: 30,
            blockType: SingleBlogPostBlock.slug,
            id: 'lex-3',
          }),
        ),
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'media', docId: 10, blockType: MediaBlock.slug, fieldPath: 'content' },
          {
            collection: 'documents',
            docId: 20,
            blockType: DocumentBlock.slug,
            fieldPath: 'content',
          },
          {
            collection: 'posts',
            docId: 30,
            blockType: SingleBlogPostBlock.slug,
            fieldPath: 'content',
          },
        ]),
      )
      expect(result).toHaveLength(3)
    })
  })

  describe('richText fields with Lexical inlineBlock nodes', () => {
    // Synthetic inline block config (mirrors InlineMedia from PR #968)
    const InlineMediaBlock: Block = {
      slug: 'inlineMedia',
      fields: [
        { name: 'media', type: 'upload', relationTo: 'media' },
        { name: 'caption', type: 'text' },
      ],
    }

    // Synthetic richText field using the mocked lexicalEditor/BlocksFeature.
    // The mock resolves features into { key, serverFeatureProps } objects that
    // the extraction function can introspect at runtime.
    const fieldsWithInlineBlocks: Field[] = [
      {
        name: 'content',
        type: 'richText',
        editor: lexicalEditor({
          features: [BlocksFeature({ blocks: [MediaBlock], inlineBlocks: [InlineMediaBlock] })],
        }),
      },
    ]

    it('extracts upload ref from an inlineBlock node', () => {
      const data = {
        content: lexicalRoot(
          lexicalParagraph('Text with an inline image'),
          // Inline blocks live inside paragraphs in real Lexical, but walkNode
          // traverses all children recursively, so placing at root level works too
          lexicalInlineBlock({
            media: 701,
            caption: 'A photo',
            blockType: 'inlineMedia',
            id: 'inline-1',
          }),
        ),
      }
      const result = extractDocumentReferences(fieldsWithInlineBlocks, data)

      expect(result).toEqual([
        { collection: 'media', docId: 701, blockType: 'inlineMedia', fieldPath: 'content' },
      ])
    })

    it('extracts refs from both regular blocks and inline blocks in same richText', () => {
      const data = {
        content: lexicalRoot(
          lexicalBlock({
            media: 100,
            imageSize: 'original',
            blockType: MediaBlock.slug,
            id: 'block-1',
          }),
          lexicalInlineBlock({
            media: 200,
            caption: 'Inline photo',
            blockType: 'inlineMedia',
            id: 'inline-1',
          }),
        ),
      }
      const result = extractDocumentReferences(fieldsWithInlineBlocks, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'media', docId: 100, blockType: MediaBlock.slug, fieldPath: 'content' },
          { collection: 'media', docId: 200, blockType: 'inlineMedia', fieldPath: 'content' },
        ]),
      )
      expect(result).toHaveLength(2)
    })

    it('extracts inline block refs nested inside a paragraph node', () => {
      // Realistic placement: inline blocks are children of paragraph nodes
      const data = {
        content: {
          root: {
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  { type: 'text', text: 'Check out ', version: 1 },
                  {
                    type: 'inlineBlock',
                    version: 1,
                    fields: {
                      media: 555,
                      blockType: 'inlineMedia',
                      id: 'inline-in-para',
                    },
                  },
                  { type: 'text', text: ' in context.', version: 1 },
                ],
              },
            ],
            type: 'root',
            version: 1,
          },
        },
      }
      const result = extractDocumentReferences(fieldsWithInlineBlocks, data)

      expect(result).toEqual([
        { collection: 'media', docId: 555, blockType: 'inlineMedia', fieldPath: 'content' },
      ])
    })
  })

  describe('deeply nested richText-in-block-in-richText (2+ levels)', () => {
    it('extracts references from ContentBlock > richText > MediaBlock', () => {
      // This is the Gap 1 scenario: block inside richText inside a layout block
      const data = {
        layout: [
          {
            blockType: ContentBlock.slug,
            id: 'content-block-1',
            layout: '1_1',
            columns: [
              {
                id: 'col-1',
                richText: lexicalRoot(
                  lexicalBlock({
                    media: 91,
                    imageSize: 'original',
                    blockType: MediaBlock.slug,
                    id: 'lex-media-1',
                  }),
                ),
              },
            ],
          },
        ],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([
        {
          collection: 'media',
          docId: 91,
          blockType: MediaBlock.slug,
          fieldPath: 'layout.0.columns.0.richText',
        },
      ])
    })

    it('extracts references from ContentBlock > richText > CalloutBlock > richText > ButtonBlock (3 levels deep)', () => {
      // This is the deepest nesting pattern found in real production data (about-us page)
      const data = {
        layout: [
          {
            blockType: ContentBlock.slug,
            id: 'content-block-1',
            layout: '2_12',
            columns: [
              {
                id: 'col-1',
                richText: lexicalRoot(
                  lexicalBlock({
                    callout: lexicalRoot(
                      lexicalParagraph('Callout text'),
                      lexicalBlock({
                        button: {
                          type: 'internal',
                          label: 'Meet the Team',
                          reference: { relationTo: 'pages', value: 57 },
                        },
                        blockType: ButtonBlock.slug,
                        id: 'lex-button-1',
                      }),
                    ),
                    backgroundColor: 'brand-200',
                    blockType: CalloutBlock.slug,
                    id: 'lex-callout-1',
                  }),
                ),
              },
            ],
          },
        ],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([
        {
          collection: 'pages',
          docId: 57,
          blockType: ButtonBlock.slug,
          fieldPath: 'layout.0.columns.0.richText',
        },
      ])
    })

    it('extracts references from multiple nesting levels simultaneously', () => {
      // A post with: top-level featuredImage + MediaBlock and SponsorsBlock inside richText content
      const data = {
        featuredImage: 100,
        authors: [],
        tags: [],
        relatedPosts: [],
        content: lexicalRoot(
          lexicalBlock({
            media: 91,
            blockType: MediaBlock.slug,
            id: 'lex-media-1',
          }),
          lexicalBlock({
            sponsors: [42, 78],
            blockType: SponsorsBlock.slug,
            id: 'lex-sponsors-1',
          }),
        ),
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'media', docId: 100, blockType: null, fieldPath: 'featuredImage' },
          { collection: 'media', docId: 91, blockType: MediaBlock.slug, fieldPath: 'content' },
          {
            collection: 'sponsors',
            docId: 42,
            blockType: SponsorsBlock.slug,
            fieldPath: 'content',
          },
          {
            collection: 'sponsors',
            docId: 78,
            blockType: SponsorsBlock.slug,
            fieldPath: 'content',
          },
        ]),
      )
      expect(result).toHaveLength(4)
    })
  })

  describe('layout-only field wrappers (row, collapsible, tabs)', () => {
    it('extracts references through row fields', () => {
      const data = { headerImage: 10, ogImage: 20 }
      const result = extractDocumentReferences(fieldsWithLayoutWrappers, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'media', docId: 10, blockType: null, fieldPath: 'headerImage' },
          { collection: 'media', docId: 20, blockType: null, fieldPath: 'ogImage' },
        ]),
      )
    })

    it('extracts references through collapsible fields', () => {
      const data = { sponsor: 5 }
      const result = extractDocumentReferences(fieldsWithLayoutWrappers, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'sponsors', docId: 5, blockType: null, fieldPath: 'sponsor' },
        ]),
      )
    })

    it('extracts references through unnamed tabs (fields at same level)', () => {
      const data = { author: 8 }
      const result = extractDocumentReferences(fieldsWithLayoutWrappers, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'biographies', docId: 8, blockType: null, fieldPath: 'author' },
        ]),
      )
    })

    it('extracts references through named tabs (creates namespace)', () => {
      const data = { meta: { metaImage: 15 } }
      const result = extractDocumentReferences(fieldsWithLayoutWrappers, data)

      expect(result).toEqual(
        expect.arrayContaining([
          { collection: 'media', docId: 15, blockType: null, fieldPath: 'meta.metaImage' },
        ]),
      )
    })
  })

  describe('group fields', () => {
    it('extracts references through unnamed groups (Events Landing Page Content)', () => {
      // The Events "Landing Page Content" group has no `name`, so its fields
      // (content, blocksInContent) sit at the same data level as other fields.
      const data = {
        featuredImage: null,
        thumbnailImage: null,
        eventGroups: [],
        eventTags: [],
        content: lexicalRoot(
          lexicalBlock({
            media: 300,
            blockType: MediaBlock.slug,
            id: 'lex-1',
          }),
        ),
      }
      const result = extractDocumentReferences(eventsFields, data)

      expect(result).toEqual([
        {
          collection: 'media',
          docId: 300,
          blockType: MediaBlock.slug,
          fieldPath: 'content',
        },
      ])
    })
  })

  describe('HomePages collection pattern', () => {
    it('extracts references from highlightedContent > columns > richText', () => {
      const data = {
        highlightedContent: {
          columns: [
            {
              id: 'col-1',
              richText: lexicalRoot(
                lexicalBlock({
                  media: 200,
                  blockType: MediaBlock.slug,
                  id: 'lex-1',
                }),
              ),
            },
            {
              id: 'col-2',
              richText: lexicalRoot(
                lexicalBlock({
                  post: 45,
                  blockType: SingleBlogPostBlock.slug,
                  id: 'lex-2',
                }),
              ),
            },
          ],
        },
        layout: [],
      }
      const result = extractDocumentReferences(homePagesFields, data)

      expect(result).toEqual(
        expect.arrayContaining([
          {
            collection: 'media',
            docId: 200,
            blockType: MediaBlock.slug,
            fieldPath: 'highlightedContent.columns.0.richText',
          },
          {
            collection: 'posts',
            docId: 45,
            blockType: SingleBlogPostBlock.slug,
            fieldPath: 'highlightedContent.columns.1.richText',
          },
        ]),
      )
      expect(result).toHaveLength(2)
    })
  })

  describe('deduplication', () => {
    it('deduplicates identical references (same collection + docId)', () => {
      // Same media referenced as featuredImage AND inside a content richText MediaBlock
      const data = {
        featuredImage: 91,
        authors: [],
        tags: [],
        relatedPosts: [],
        content: lexicalRoot(
          lexicalBlock({
            media: 91,
            blockType: MediaBlock.slug,
            id: 'lex-1',
          }),
        ),
      }
      const result = extractDocumentReferences(postsFields, data)

      // Deduplicated on collection+docId — should appear only once
      const mediaRefs = result.filter((r) => r.collection === 'media' && r.docId === 91)
      expect(mediaRefs).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('handles empty layout blocks array', () => {
      const data = { layout: [] }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([])
    })

    it('handles missing data fields gracefully', () => {
      const data = {}
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([])
    })

    it('handles richText with no block nodes', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: null,
        content: lexicalRoot(lexicalParagraph('Just text, no blocks')),
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([])
    })

    it('handles block with unknown blockType gracefully', () => {
      const data = {
        layout: [{ blockType: 'nonExistentBlock', someField: 42, id: 'block-1' }],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([])
    })

    it('handles Lexical block with unknown blockType in richText', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: null,
        content: lexicalRoot(
          lexicalBlock({
            blockType: 'unknownBlock',
            someField: 99,
            id: 'lex-1',
          }),
        ),
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([])
    })

    it('handles null richText data', () => {
      const data = {
        authors: [],
        tags: [],
        featuredImage: null,
        content: null,
      }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([])
    })

    it('handles block with null relationship value', () => {
      const data = {
        layout: [{ blockType: TeamBlock.slug, team: null, id: 'block-1' }],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([])
    })

    it('correctly extracts references from deeply nested blocks whose configs form a cycle', () => {
      // Regression test: ContentBlock allows CalloutBlock, and CalloutBlock's
      // richText could theoretically contain a ContentBlock — forming a cycle
      // in the config graph. This works because the walker follows the actual
      // data (which is always a finite tree), not the config definitions. This
      // test ensures no future refactor accidentally introduces config-graph
      // traversal that would loop.
      const data = {
        layout: [
          {
            blockType: ContentBlock.slug,
            id: 'content-1',
            layout: '1_1',
            columns: [
              {
                id: 'col-1',
                richText: lexicalRoot(
                  lexicalBlock({
                    callout: lexicalRoot(
                      lexicalBlock({
                        media: 42,
                        blockType: MediaBlock.slug,
                        id: 'lex-deep',
                      }),
                    ),
                    blockType: CalloutBlock.slug,
                    id: 'lex-callout',
                  }),
                ),
              },
            ],
          },
        ],
      }
      const result = extractDocumentReferences(pagesFields, data)

      expect(result).toEqual([
        {
          collection: 'media',
          docId: 42,
          blockType: MediaBlock.slug,
          fieldPath: 'layout.0.columns.0.richText',
        },
      ])
    })
  })

  describe('tenant relationship filtering', () => {
    it('excludes tenant relationship fields from output', () => {
      const fields: Field[] = [
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
        { name: 'featuredImage', type: 'upload', relationTo: 'media' },
        { name: 'author', type: 'relationship', relationTo: 'biographies' },
      ]
      const data = { tenant: 1, featuredImage: 10, author: 20 }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'media', docId: 10, blockType: null, fieldPath: 'featuredImage' },
        { collection: 'biographies', docId: 20, blockType: null, fieldPath: 'author' },
      ])
    })

    it('excludes tenant references from polymorphic relationship fields', () => {
      const fields: Field[] = [
        {
          name: 'related',
          type: 'relationship',
          relationTo: ['tenants', 'pages', 'posts'],
          hasMany: true,
        },
      ]
      const data = {
        related: [
          { relationTo: 'tenants', value: 1 },
          { relationTo: 'pages', value: 5 },
          { relationTo: 'posts', value: 8 },
        ],
      }
      const result = extractDocumentReferences(fields, data)

      expect(result).toEqual([
        { collection: 'pages', docId: 5, blockType: null, fieldPath: 'related' },
        { collection: 'posts', docId: 8, blockType: null, fieldPath: 'related' },
      ])
    })

    it('excludes tenant references from real collection fields', () => {
      const data = { tenant: 1, authors: [5], tags: [], featuredImage: null, content: null }
      const result = extractDocumentReferences(postsFields, data)

      expect(result).toEqual([
        { collection: 'biographies', docId: 5, blockType: null, fieldPath: 'authors' },
      ])
      expect(result.every((ref) => ref.collection !== 'tenants')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Fixture tests
  //
  // These use document structures modeled on real content pulled from the
  // dev database via Payload MCP server. IDs are randomized but the
  // structural patterns (nesting depth, field shapes, block types) are real.
  //
  // -----------------------------------------------------------------------

  describe('fixture: page "about-us" (deep nesting)', () => {
    // This page has ContentBlocks with richText containing CalloutBlocks
    // and MediaBlocks

    it('finds the ButtonBlock reference 3 levels deep (ContentBlock > CalloutBlock > ButtonBlock)', () => {
      const result = extractDocumentReferences(pagesFields, pageAboutUsLayout)

      // ButtonBlock inside CalloutBlock inside ContentBlock's richText
      // has an internal page reference: { relationTo: 'pages', value: 201 }
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'pages',
            docId: 201,
            blockType: ButtonBlock.slug,
          }),
        ]),
      )
    })

    it('finds MediaBlock references inside ContentBlock richText', () => {
      const result = extractDocumentReferences(pagesFields, pageAboutUsLayout)

      // Two MediaBlocks in the "Photos" ContentBlock's columns
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ collection: 'media', docId: 301, blockType: MediaBlock.slug }),
          expect.objectContaining({ collection: 'media', docId: 302, blockType: MediaBlock.slug }),
        ]),
      )
    })

    it('finds all 3 references total', () => {
      const result = extractDocumentReferences(pagesFields, pageAboutUsLayout)

      // page 201 (ButtonBlock), media 301 (MediaBlock), media 302 (MediaBlock)
      expect(result).toHaveLength(3)
    })
  })

  describe('fixture: page "who-we-are" (direct layout blocks)', () => {
    it('finds all TeamBlock references directly in layout', () => {
      const result = extractDocumentReferences(pagesFields, pageWhoWeAreLayout)

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ collection: 'teams', docId: 401, blockType: TeamBlock.slug }),
          expect.objectContaining({ collection: 'teams', docId: 402, blockType: TeamBlock.slug }),
          expect.objectContaining({ collection: 'teams', docId: 403, blockType: TeamBlock.slug }),
        ]),
      )
      expect(result).toHaveLength(3)
    })
  })

  describe('fixture: page "supporters" (hasMany sponsors)', () => {
    it('finds all sponsor references across multiple SponsorsBlocks', () => {
      const result = extractDocumentReferences(pagesFields, pageSupportersLayout)

      const sponsorRefs = result.filter((r) => r.collection === 'sponsors')

      // 5 SponsorsBlocks with 7 + 14 + 9 + 12 + 5 = 47 sponsor IDs total
      // After deduplication (all unique IDs), should still be 47
      expect(sponsorRefs).toHaveLength(47)
    })

    it('does not include headerBlock references (headerBlock has no relationship fields)', () => {
      const result = extractDocumentReferences(pagesFields, pageSupportersLayout)

      // Only sponsor references, no others
      expect(result.every((r) => r.collection === 'sponsors')).toBe(true)
    })
  })

  describe('fixture: post with media block', () => {
    it('finds the featuredImage upload reference (MediaBlock in content is deduplicated)', () => {
      const result = extractDocumentReferences(postsFields, postWithMediaBlock)

      // media 601 is referenced both as featuredImage and in a content MediaBlock,
      // but deduplication on collection+docId keeps only the first occurrence
      expect(result).toEqual([
        expect.objectContaining({
          collection: 'media',
          docId: 601,
          blockType: null,
          fieldPath: 'featuredImage',
        }),
      ])
    })

    it('deduplicates since featuredImage and content MediaBlock reference the same media', () => {
      const result = extractDocumentReferences(postsFields, postWithMediaBlock)

      // media 601 appears twice (featuredImage + content block) but should be deduplicated
      const mediaRefs = result.filter((r) => r.collection === 'media' && r.docId === 601)
      expect(mediaRefs).toHaveLength(1)
    })

    it('ignores empty relationship arrays (authors, tags, relatedPosts)', () => {
      const result = extractDocumentReferences(postsFields, postWithMediaBlock)

      expect(result.find((r) => r.collection === 'biographies')).toBeUndefined()
      expect(result.find((r) => r.collection === 'tags')).toBeUndefined()
      expect(result.find((r) => r.collection === 'posts')).toBeUndefined()
    })
  })
})
