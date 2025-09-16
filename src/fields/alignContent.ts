import { Field } from 'payload'

export const alignContentField: (label: string) => Field = (label) => ({
  name: 'alignContent',
  type: 'select',
  label,
  required: false,
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  admin: {
    components: {
      Field: '@/components/AlignContentPicker',
    },
  },
})

export default alignContentField
