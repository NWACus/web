import type { Block } from 'payload'

export const InlineMediaBlock: Block = {
  slug: 'inlineMedia',
  interfaceName: 'InlineMediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'inline',
      options: [
        { label: 'Inline', value: 'inline' },
        { label: 'Float left', value: 'float-left' },
        { label: 'Float right', value: 'float-right' },
      ],
      admin: {
        description:
          'Inline renders the image within the text flow. Float positions the image to one side with text wrapping around it.',
      },
    },
    {
      name: 'verticalAlign',
      type: 'select',
      defaultValue: 'middle',
      options: [
        { label: 'Middle', value: 'middle' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
        { label: 'Baseline', value: 'baseline' },
      ],
      admin: {
        description: 'Vertical alignment relative to the surrounding text.',
        condition: (_, siblingData) => siblingData?.position === 'inline',
      },
    },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'small',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Full', value: 'full' },
      ],
      admin: {
        description:
          'Controls the maximum size of the image. When inline, this sets max height. When floating, this sets max width.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional text shown as a tooltip on hover.',
      },
    },
  ],
}
