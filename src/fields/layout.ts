import type { Field } from 'payload'
import { isLayoutBlock, spacingRow } from './spacing'

// A block's appearance options, collapsed at the bottom of its fields under a summary header
export const layoutField = (fields: Field[] = []): Field => ({
  type: 'collapsible',
  label: 'Layout',
  admin: {
    initCollapsed: true,
    // With only spacing inside, there's nothing to show when the block sits in rich text
    condition: fields.length ? undefined : isLayoutBlock,
    components: {
      Label: '@/components/LayoutSummaryLabel#LayoutSummaryLabel',
    },
  },
  fields: [...fields, spacingRow],
})
