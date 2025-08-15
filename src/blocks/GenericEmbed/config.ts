import type { Block } from 'payload'

export const GenericEmbed: Block = {
  slug: 'genericEmbed',
  fields: [
    {
      name: 'html',
      label: 'HTML',
      type: 'textarea',
      required: true,
    },
  ],
  interfaceName: 'GenericEmbedBlock',
}
