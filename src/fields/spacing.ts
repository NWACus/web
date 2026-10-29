import type { Condition, Field, SelectField } from 'payload'

export const SPACING_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

// Blocks embedded in rich text sit inside a column, where page-level spacing doesn't apply
export const isLayoutBlock: Condition = (_data, _siblingData, { path }) => path[0] === 'layout'

const spacingSelect = (name: string, label: string): SelectField => ({
  name,
  label,
  type: 'select',
  defaultValue: 'none',
  options: SPACING_OPTIONS,
  admin: { width: '50%', isClearable: false, condition: isLayoutBlock },
})

export const spacingRow: Field = {
  type: 'row',
  fields: [
    spacingSelect('spacingTop', 'Extra space above'),
    spacingSelect('spacingBottom', 'Extra space below'),
  ],
}
