'use client'

import { FieldError, useField } from '@payloadcms/ui'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import type { CheckboxFieldClientProps } from 'payload'

// A checkbox field drawn as a switch, in Payload's theme colors so it follows
// the admin's light and dark modes. Position and color are inline styles:
// Payload's button CSS overrides Tailwind's transform and background utilities.
export const ToggleField = ({ path, field }: CheckboxFieldClientProps) => {
  const { value, setValue, showError, errorMessage } = useField<boolean>({ path })
  const id = `field-${path.replace(/\./g, '__')}`
  const on = value === true

  return (
    <div className="mb-3 flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <SwitchPrimitives.Root
          id={id}
          checked={on}
          onCheckedChange={(checked) => setValue(checked)}
          className="relative h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-elevation-800)]"
          style={{
            background: on ? 'var(--theme-success-800)' : 'var(--theme-elevation-200)',
          }}
        >
          <SwitchPrimitives.Thumb
            className="absolute top-[2px] block h-[16px] w-[16px] rounded-full shadow"
            style={{ left: on ? 18 : 2, background: 'var(--theme-bg)', transition: 'left 150ms' }}
          />
        </SwitchPrimitives.Root>
        <label htmlFor={id} className="cursor-pointer text-[15px]">
          {typeof field.label === 'string' ? field.label : field.name}
        </label>
      </div>
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
