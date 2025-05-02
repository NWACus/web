import { button } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonBlock: Block = {
  slug: 'buttonBlock',
  interfaceName: 'ButtonBlock',
  fields: [
    {
      name: 'buttons',
      type: 'array',
      label: false,
      labels: {
        singular: 'Button',
        plural: 'Buttons',
      },
      fields: [button(['default', 'secondary'])],
      maxRows: 2,
      required: true,
    },
  ],
}
