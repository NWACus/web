import { Field } from 'payload'

export const imageSizeField: (label: string) => Field = (label) => ({
  name: 'imageSize',
  type: 'select',
  label,
  required: false,
  defaultValue: 'original',
  options: [
    { label: 'Original (Natural size)', value: 'original' },
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'Full width', value: 'full' },
  ],
  admin: {
    description:
      "Controls the maximum width of the image with responsive behavior. Original uses the image's natural size. Sizes automatically adapt for different screen sizes.",
  },
})

export default imageSizeField
