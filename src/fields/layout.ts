import type { Field } from 'payload'

// A block's appearance options, collapsed at the bottom of its fields under a summary header
export const layoutField = (fields: Field[]): Field => ({
  type: 'collapsible',
  label: 'Layout',
  admin: {
    initCollapsed: true,
    components: {
      Label: '@/components/LayoutSummaryLabel#LayoutSummaryLabel',
    },
  },
  fields,
})
