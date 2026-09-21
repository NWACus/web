import { Field } from 'payload'

const brandShades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export const BACKGROUND_COLOR_OPTIONS = [
  'transparent',
  'white',
  ...brandShades.map((n) => `brand-${n}`),
]

export const validateBackgroundColor = (value: unknown): true | string =>
  (typeof value === 'string' && BACKGROUND_COLOR_OPTIONS.includes(value)) ||
  'Pick a color from the palette'

const colorPickerField: (label: string) => Field = (label) => ({
  name: 'backgroundColor',
  type: 'text',
  label,
  required: true,
  defaultValue: 'transparent',
  validate: (value: unknown) => validateBackgroundColor(value),
  admin: {
    components: {
      Field: '@/components/ColorPicker',
    },
  },
})

export default colorPickerField
