import type { FieldHook } from 'payload'

// Valid layout values and their column counts
const VALID_LAYOUTS = ['1_1', '2_11', '2_12', '2_21', '3_111', '3_112', '3_121', '3_211', '4_1111']
const DEFAULT_LAYOUT = '1_1'

/**
 * Self-heals null or invalid layout values to a sensible default.
 * This fixes pages seeded with null layout values that would otherwise
 * fail validation with no way for editors to fix them in the UI.
 */
export const healColumnLayout: FieldHook = ({ value, siblingData }) => {
  // If value is already valid, pass through
  if (typeof value === 'string' && VALID_LAYOUTS.includes(value)) {
    return value
  }

  // Try to pick a layout matching the current column count
  if (
    siblingData &&
    typeof siblingData === 'object' &&
    'columns' in siblingData &&
    Array.isArray(siblingData.columns)
  ) {
    const numCols = siblingData.columns.length
    const match = VALID_LAYOUTS.find((l) => parseInt(l.split('_')[0]) === numCols)
    if (match) return match
  }

  return DEFAULT_LAYOUT
}
