import { Field } from 'payload'

export const colorPickerField: (label: string) => Field = (label) => ({
  name: 'color',
  type: 'text',
  label,
  required: true,
  defaultValue: '#fffff',
  admin: {
    components: {
      Field: '@/components/ColorPicker',
    },
  },
})

export default colorPickerField
