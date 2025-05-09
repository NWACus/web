import { Field } from 'payload'

export const colorPickerField: (label: string) => Field = (label) => ({
  name: 'color',
  type: 'text',
  label,
  required: true,
  admin: {
    components: {
      Field: '@/components/ColorPicker',
    },
  },
})

export default colorPickerField
