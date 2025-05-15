import { button } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonsBlock: Block = {
  slug: 'buttonsBlock',
  interfaceName: 'ButtonsBlock',
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
