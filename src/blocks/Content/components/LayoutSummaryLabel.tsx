'use client'

import { colorName } from '@/components/ColorPicker'
import { useSpacingSummary } from '@/components/SpacingSummaryLabel'
import { alignmentOptions } from '@/components/VerticalAlignmentPicker'
import { useFormFields } from '@payloadcms/ui'

const layoutName = (layout: string) => {
  const parts = layout.split('_')[1]
  return !parts || parts === '1' ? 'Full width' : parts.split('').join(':')
}

// The collapsible's own path ends in an `_index-N` segment; its fields live on the block
export const LayoutSummaryLabel = ({ path }: { path?: string }) => {
  const blockPath = path?.split('.').slice(0, -1).join('.')
  const fieldPath = (name: string) => (blockPath ? `${blockPath}.${name}` : name)

  const { layout, backgroundColor, verticalAlignment } = useFormFields(([fields]) => ({
    layout: fields[fieldPath('layout')]?.value,
    backgroundColor: fields[fieldPath('backgroundColor')]?.value,
    verticalAlignment: fields[fieldPath('verticalAlignment')]?.value,
  }))

  const layoutValue = typeof layout === 'string' ? layout : '1_1'
  const parts = [
    layoutName(layoutValue),
    colorName(
      typeof backgroundColor === 'string' && backgroundColor ? backgroundColor : 'transparent',
    ),
  ]
  if (!layoutValue.startsWith('1_')) {
    const alignment = alignmentOptions.find((opt) => opt.value === verticalAlignment)
    parts.push(alignment?.label ?? 'Top')
  }
  parts.push(...useSpacingSummary(blockPath))

  return (
    <span>
      Layout <span className="text-[var(--theme-elevation-500)]">· {parts.join(' · ')}</span>
    </span>
  )
}
