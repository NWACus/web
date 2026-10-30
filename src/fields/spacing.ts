import type { Condition, Field, FieldHook, SelectField } from 'payload'
import { hasBackgroundColor } from './color'

export const SPACING_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

// Blocks embedded in rich text sit inside a column, where page-level spacing doesn't apply
export const isLayoutBlock: Condition = (_data, _siblingData, { path }) => path[0] === 'layout'

// A colored block always keeps some space from its neighbors
const withoutNoneIfColored: SelectField['filterOptions'] = ({ options, siblingData }) =>
  hasBackgroundColor(siblingData?.backgroundColor)
    ? options.filter((opt) => (typeof opt === 'string' ? opt !== 'none' : opt.value !== 'none'))
    : options

const smallIfColored: FieldHook = ({ value, siblingData }) =>
  value === 'none' && hasBackgroundColor(siblingData?.backgroundColor) ? 'sm' : value

const spacingSelect = (name: string, label: string): SelectField => ({
  name,
  label,
  type: 'select',
  defaultValue: 'sm',
  options: SPACING_OPTIONS,
  filterOptions: withoutNoneIfColored,
  hooks: { beforeChange: [smallIfColored] },
  admin: {
    width: '50%',
    isClearable: false,
    condition: isLayoutBlock,
    components: { Field: '@/components/SpacingSelect#SpacingSelect' },
  },
})

export const spacingRow: Field = {
  type: 'row',
  fields: [
    spacingSelect('spacingTop', 'Space above'),
    spacingSelect('spacingBottom', 'Space below'),
  ],
}
