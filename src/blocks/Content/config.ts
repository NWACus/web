import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import { richText } from '@/fields/richText'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    // Background color
    colorPickerField('Background color'),
    {
      name: 'columns',
      label: false,
      labels: {
        plural: 'Columns',
        singular: 'Column',
      },
      type: 'array',
      admin: {
        initCollapsed: false,
      },
      defaultValue: [
        {
          columns: [],
        },
      ],
      maxRows: 4,
      fields: [richText],
    },
  ],
}
