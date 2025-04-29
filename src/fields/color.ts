import { Field } from 'payload'

export const colorPickerField: Field = {
  name: 'color',
  type: 'text',
  label: 'Background color',
  required: true,
  admin: {
    components: {
      Field: '@/components/ColorPicker',
    },
  },
}

export default colorPickerField
