import type { Field, TextFieldValidation } from 'payload'

export const colorField: (name: string) => Field = (name) => {
  return {
    name: name,
    type: 'text',
    required: true,
    // TODO: admin config for custom view that shows off the color, picker or tailwind panels for choosing
    validate: validateHSLValue,
  }
}

const validateHSLValue: TextFieldValidation = (value: string): string | true => {
  const parts = value.split(' ')
  if (parts.length !== 3) {
    return `Expected three parts, got ${parts.length}: ${value}.`
  }
  const hue = Number.parseInt(parts[0], 10)
  if (hue < 0 || hue > 360) {
    return `Invalid hue angle, expected a value between 0 and 360: ${value}.`
  }

  const saturation = validatePercentage('saturation', parts[1])
  if (!saturation) {
    return saturation
  }

  return validatePercentage('lightness', parts[2])
}

const validatePercentage = (label: string, value: string): string | true => {
  if (!value.endsWith('%')) {
    return `Expected ${label} to be a percentage, got ${value}.`
  }

  const precentage = Number.parseFloat(value.slice(0, value.length - 2))
  if (precentage < 0 || precentage > 100) {
    return `${label} percentage out of range: ${value}.`
  }

  return true
}
