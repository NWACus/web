'use client'

import { SPACING_OPTIONS } from '@/fields/spacing'
import { useFormFields } from '@payloadcms/ui'

const spacingName = (value: unknown) =>
  SPACING_OPTIONS.find((opt) => opt.value === value && value !== 'none')?.label

// The block's extra spacing as summary parts, e.g. ['Above: Small'], or none when unset
export const useSpacingSummary = (blockPath: string | undefined) => {
  const fieldPath = (name: string) => (blockPath ? `${blockPath}.${name}` : name)
  const { above, below } = useFormFields(([fields]) => ({
    above: spacingName(fields[fieldPath('spacingTop')]?.value),
    below: spacingName(fields[fieldPath('spacingBottom')]?.value),
  }))

  return [above && `Above: ${above}`, below && `Below: ${below}`].filter((part): part is string =>
    Boolean(part),
  )
}

// The collapsible's own path ends in an `_index-N` segment; its fields live on the block
export const SpacingSummaryLabel = ({ path }: { path?: string }) => {
  const parts = useSpacingSummary(path?.split('.').slice(0, -1).join('.'))

  return (
    <span>
      Spacing{' '}
      <span className="text-[var(--theme-elevation-500)]">
        · {parts.length ? parts.join(' · ') : 'None'}
      </span>
    </span>
  )
}
