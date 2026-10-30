import { Field, TextFieldSingleValidation } from 'payload'

export const BRAND_SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export const BACKGROUND_COLOR_OPTIONS = [
  'transparent',
  'white',
  ...BRAND_SHADES.map((n) => `brand-${n}`),
]

export const isPaletteColor = (value: unknown): value is string =>
  typeof value === 'string' && BACKGROUND_COLOR_OPTIONS.includes(value)

// `white` counts as a color; `transparent` and values outside the palette paint nothing.
export const hasBackgroundColor = (value: unknown): boolean =>
  isPaletteColor(value) && value !== 'transparent'

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
