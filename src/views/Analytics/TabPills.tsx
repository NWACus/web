'use client'

import { Button } from '@payloadcms/ui'

export type TabOption<K extends string> = { key: K; label: string }

/** One look for every tab group on the page: Payload's own pill buttons, the active one filled. */
export function TabPills<K extends string>({
  options,
  active,
  onChange,
}: {
  options: ReadonlyArray<TabOption<K>>
  active: K | null
  onChange: (key: K) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <Button
          key={option.key}
          buttonStyle={option.key === active ? 'primary' : 'secondary'}
          size="small"
          className="m-0"
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
