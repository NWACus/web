'use client'

import { FieldError, useField, useFormFields } from '@payloadcms/ui'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import type { CheckboxFieldClientProps } from 'payload'
import { useEffect } from 'react'

type LockedBy = { field: string; value: boolean }

export type ToggleFieldClientProps = {
  /** While the named top-level checkbox is on, hold this toggle at `value`, read-only. */
  lockedBy?: LockedBy
}

// The lock's value while its field is on, else null. Written through, so what
// saves matches what the toggle shows.
function useLockedValue(
  lockedBy: LockedBy | undefined,
  value: boolean | null | undefined,
  setValue: (value: boolean) => void,
): boolean | null {
  const locked = useFormFields(([fields]) =>
    lockedBy ? fields[lockedBy.field]?.value === true : false,
  )
  const lockedValue = locked && lockedBy ? lockedBy.value : null
  useEffect(() => {
    if (lockedValue !== null && value !== lockedValue) setValue(lockedValue)
  }, [lockedValue, value, setValue])
  return lockedValue
}

// Position and color are inline styles: Payload's button CSS overrides
// Tailwind's transform and background utilities.
function Switch({
  id,
  on,
  disabled,
  onChange,
}: {
  id: string
  on: boolean
  disabled: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <SwitchPrimitives.Root
      id={id}
      checked={on}
      disabled={disabled}
      onCheckedChange={onChange}
      className="relative h-[16px] w-[28px] shrink-0 rounded-full border-0 p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-elevation-800)]"
      style={{
        background: on ? 'var(--theme-success-800)' : 'var(--theme-elevation-200)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <SwitchPrimitives.Thumb
        className="absolute top-[2px] block h-[12px] w-[12px] rounded-full shadow"
        style={{ left: on ? 14 : 2, background: 'var(--theme-bg)', transition: 'left 150ms' }}
      />
    </SwitchPrimitives.Root>
  )
}

// A checkbox field drawn as a switch, in Payload's theme colors so it follows
// the admin's light and dark modes.
export const ToggleField = ({
  path,
  field,
  readOnly,
  lockedBy,
}: CheckboxFieldClientProps & ToggleFieldClientProps) => {
  const { value, setValue, showError, errorMessage } = useField<boolean>({ path })
  const lockedValue = useLockedValue(lockedBy, value, setValue)
  const id = `field-${path.replace(/\./g, '__')}`
  const disabled = Boolean(readOnly) || lockedValue !== null

  return (
    <div className="mb-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          on={lockedValue ?? value === true}
          disabled={disabled}
          onChange={setValue}
        />
        <label htmlFor={id} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {typeof field.label === 'string' ? field.label : field.name}
        </label>
      </div>
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
