'use client'

import { colorName } from '@/components/ColorPicker'
import { alignmentOptions } from '@/components/VerticalAlignmentPicker'
import { SPACING_OPTIONS } from '@/fields/spacing'
import { useFormFields } from '@payloadcms/ui'

// Content block column layouts look like `2_21`; other blocks use `layout` for their own options
const isColumnLayout = (value: unknown): value is string =>
  typeof value === 'string' && /^\d_\d+$/.test(value)

const layoutName = (layout: string) => {
  const parts = layout.split('_')[1]
  return parts === '1' ? 'Full width' : parts.split('').join(':')
}

const spacingName = (value: unknown) =>
  SPACING_OPTIONS.find((opt) => opt.value === value && value !== 'sm')?.label

// The collapsible's own path ends in an `_index-N` segment; its fields live on the block
export const LayoutSummaryLabel = ({ path }: { path?: string }) => {
  const blockPath = path?.split('.').slice(0, -1).join('.')
  const fieldPath = (name: string) => (blockPath ? `${blockPath}.${name}` : name)

  const values = useFormFields(([fields]) => ({
    layout: fields[fieldPath('layout')]?.value,
    backgroundColor: fields[fieldPath('backgroundColor')],
    alignContent: fields[fieldPath('alignContent')]?.value,
    verticalAlignment: fields[fieldPath('verticalAlignment')]?.value,
    spacingTop: fields[fieldPath('spacingTop')]?.value,
    spacingBottom: fields[fieldPath('spacingBottom')]?.value,
  }))

  const parts: string[] = []
  if (isColumnLayout(values.layout)) parts.push(layoutName(values.layout))
  if (values.backgroundColor) {
    const color = values.backgroundColor.value
    parts.push(colorName(typeof color === 'string' && color ? color : 'transparent'))
  }
  if (typeof values.alignContent === 'string') parts.push(`Aligned ${values.alignContent}`)
  if (isColumnLayout(values.layout) && !values.layout.startsWith('1_')) {
    const alignment = alignmentOptions.find((opt) => opt.value === values.verticalAlignment)
    parts.push(alignment?.label ?? 'Top')
  }
  const above = spacingName(values.spacingTop)
  const below = spacingName(values.spacingBottom)
  if (above) parts.push(`Above: ${above}`)
  if (below) parts.push(`Below: ${below}`)

  return (
    <span>
      Layout
      {parts.length > 0 && (
        <span className="text-[var(--theme-elevation-500)]"> · {parts.join(' · ')}</span>
      )}
    </span>
  )
}
