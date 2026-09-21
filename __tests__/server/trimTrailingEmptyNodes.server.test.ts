import { trimTrailingEmptyNodes } from '@/utilities/trimTrailingEmptyNodes'
import type {
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from '@payloadcms/richtext-lexical/lexical'

const text = (t: string): SerializedTextNode => ({
  type: 'text',
  version: 1,
  text: t,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
})
const element = (type: string, children: SerializedLexicalNode[]): SerializedElementNode => ({
  type,
  version: 1,
  children,
  direction: null,
  format: '',
  indent: 0,
})
const paragraph = (...children: SerializedLexicalNode[]) => element('paragraph', children)
const heading = (...children: SerializedLexicalNode[]) => element('heading', children)
const block = (): SerializedLexicalNode => ({ type: 'block', version: 2 })
const state = (...children: SerializedLexicalNode[]): SerializedEditorState => ({
  root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children },
})
const types = (s: SerializedEditorState) => s.root.children.map((c) => c.type)

describe('trimTrailingEmptyNodes', () => {
  it('drops empty paragraphs and headings after the last real node', () => {
    const s = state(paragraph(text('hi')), block(), paragraph(), heading(), paragraph(text('  ')))
    expect(types(trimTrailingEmptyNodes(s))).toEqual(['paragraph', 'block'])
  })

  it('keeps blank nodes that sit between content', () => {
    const s = state(paragraph(text('a')), paragraph(), paragraph(text('b')))
    expect(types(trimTrailingEmptyNodes(s))).toEqual(['paragraph', 'paragraph', 'paragraph'])
  })

  it('returns the same object when nothing trails', () => {
    const s = state(paragraph(text('a')))
    expect(trimTrailingEmptyNodes(s)).toBe(s)
  })
})
