import { Field, TextFieldSingleValidation } from 'payload'

const brandShades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export const BACKGROUND_COLOR_OPTIONS = [
  'transparent',
  'white',
  ...brandShades.map((n) => `brand-${n}`),
]

export const isPaletteColor = (value: unknown): value is string =>
  typeof value === 'string' && BACKGROUND_COLOR_OPTIONS.includes(value)

// An unchanged off-palette value passes so older content can still be published.
export const validateBackgroundColor = (value: unknown, previousValue?: unknown): true | string =>
  isPaletteColor(value) ||
  (value !== undefined && value === previousValue) ||
  'Pick a color from the palette'

const validate: TextFieldSingleValidation = (value, { previousValue }) =>
  validateBackgroundColor(value, previousValue)

const colorPickerField: (label: string) => Field = (label) => ({
  name: 'backgroundColor',
  type: 'text',
  label,
  required: true,
  defaultValue: 'transparent',
  validate,
  admin: {
    components: {
      Field: '@/components/ColorPicker#ColorPicker',
    },
  },
})

export default colorPickerField
