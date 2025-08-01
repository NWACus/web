import { Field } from 'payload'

export const colorPickerField: (label: string) => Field = (label) => ({
  name: 'backgroundColor',
  type: 'text',
  label,
  required: true,
  defaultValue: 'white',
  admin: {
    components: {
      Field: '@/components/ColorPicker',
    },
  },
})

export default colorPickerField
