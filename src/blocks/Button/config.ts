import { button } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonBlock: Block = {
  slug: 'buttons',
  interfaceName: 'ButtonBlock',
  fields: [
    {
      name: 'button',
      type: 'array',
      label: false,
      labels: {
        singular: 'Button',
        plural: 'Buttons',
      },
      fields: [button(['default', 'outline'])],
      maxRows: 2,
      required: true,
    },
  ],
}
