import type { Block } from 'payload'

export const InlineMediaBlock: Block = {
  slug: 'inlineMedia',
  interfaceName: 'InlineMediaBlock',
  imageURL: '/thumbnail/MediaThumbnail.jpg',
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
      defaultValue: 'original',
      options: [
        { label: 'Original (natural size)', value: 'original' },
        { label: '25% width', value: '25' },
        { label: '50% width', value: '50' },
        { label: '75% width', value: '75' },
        { label: '100% width', value: '100' },
        { label: 'Fixed height', value: 'fixed-height' },
      ],
      admin: {
        description:
          'Original uses the natural image size. Percentage widths are relative to the containing block. Fixed height lets you specify an exact pixel height.',
      },
    },
    {
      name: 'fixedHeight',
      type: 'number',
      min: 1,
      admin: {
        description: 'Height in pixels.',
        condition: (_, siblingData) => siblingData?.size === 'fixed-height',
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
