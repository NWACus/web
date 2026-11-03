'use client'

import { colorName } from '@/components/ColorPicker'
import { useFormFields } from '@payloadcms/ui'
import type { ClientField, CollapsibleFieldLabelClientComponent } from 'payload'

type NamedField = Extract<ClientField, { name: string }>
type Summarize = (value: unknown, field: NamedField, values: Record<string, unknown>) => unknown

// Content block column layouts look like `2_21`; Gallery uses `layout` for grid or masonry
const isColumnLayout = (value: unknown): value is string =>
  typeof value === 'string' && /^\d_\d+$/.test(value)

const layoutName = (layout: string) => {
  const parts = layout.split('_')[1]
  return parts === '1' ? 'Full width' : parts.split('').join(':')
}

const optionLabel = (field: NamedField, value: unknown) => {
  if (!('options' in field)) return undefined
  const option = field.options.find((opt) =>
    typeof opt === 'string' ? opt === value : opt.value === value,
  )
  if (typeof option === 'string') return option
  return typeof option?.label === 'string' ? option.label : undefined
}

const spacingNames: Record<string, string> = { none: 'None', sm: 'Sm', md: 'Md', lg: 'Lg' }

const spacing =
  (prefix: string): Summarize =>
  (value) =>
    typeof value === 'string' && value in spacingNames && `${prefix}: ${spacingNames[value]}`

// Fields whose option labels would be vague on their own; anything else shows its option label
const summaries: Record<string, Summarize> = {
  backgroundColor: (value) => colorName(typeof value === 'string' && value ? value : 'transparent'),
  layout: (value, field) => (isColumnLayout(value) ? layoutName(value) : optionLabel(field, value)),
  verticalAlignment: (value, field, values) =>
    isColumnLayout(values.layout) &&
    !values.layout.startsWith('1_') &&
    (value === 'stretch' ? 'Stretched' : `${optionLabel(field, value) ?? 'Top'} aligned`),
  alignContent: (value) => typeof value === 'string' && `Aligned ${value}`,
  fullWidthColor: (value) => value === true && 'Full width',
  imageLayout: (value) => typeof value === 'string' && `Image ${value}`,
  textWrap: (value) => value === true && 'Text wraps',
  columns: (value) => value && `${value} columns`,
  spacingTop: spacing('Top'),
  spacingBottom: spacing('Btm'),
}

const namedFields = (fields: ClientField[]): NamedField[] =>
  fields.flatMap((field) => {
    if ('name' in field) return [field]
    return field.type === 'row' ? namedFields(field.fields) : []
  })

// Lists the group's settings in the order its fields appear
export const LayoutSummaryLabel: CollapsibleFieldLabelClientComponent = ({ field, path }) => {
  // The collapsible's own path ends in an `_index-N` segment; its fields live on the block
  const blockPath = path?.split('.').slice(0, -1).join('.')
  const fieldPath = (name: string) => (blockPath ? `${blockPath}.${name}` : name)
  const fields = namedFields(field?.fields ?? [])

  const state = useFormFields(([formFields]) =>
    Object.fromEntries(fields.map((f) => [f.name, formFields[fieldPath(f.name)]])),
  )
  const values = Object.fromEntries(fields.map((f) => [f.name, state[f.name]?.value]))

  const parts = fields
    .filter((f) => state[f.name] && state[f.name].passesCondition !== false)
    .map((f) =>
      (summaries[f.name] ?? ((value) => optionLabel(f, value)))(values[f.name], f, values),
    )
    .filter((part): part is string => typeof part === 'string' && part !== '')

  return (
    <span>
      Layout
      {parts.length > 0 && (
        <span className="text-[var(--theme-elevation-500)]"> · {parts.join(' · ')}</span>
      )}
    </span>
  )
}
