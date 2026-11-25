'use client'

import { FieldLabel } from '@payloadcms/ui'
import type { LucideIcon } from 'lucide-react'

export type IconRadioOption<Value extends string> = {
  value: Value
  label: string
  icon: LucideIcon
}

/** Payload's radio look, with an icon in front of each label. */
export const IconRadioGroup = <Value extends string>({
  name,
  label,
  options,
  value,
  readOnly,
  onChange,
}: {
  name: string
  label: string
  options: IconRadioOption<Value>[]
  value: Value
  readOnly?: boolean
  onChange: (next: Value) => void
}) => (
  <div role="radiogroup" aria-label={label}>
    <FieldLabel label={label} />
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {options.map(({ value: option, label: optionLabel, icon: Icon }) => {
        const isSelected = option === value
        return (
          <label key={option} className={readOnly ? undefined : 'cursor-pointer'}>
            <span className={`radio-input ${isSelected ? 'radio-input--is-selected' : ''}`}>
              <input
                type="radio"
                name={name}
                aria-label={optionLabel}
                checked={isSelected}
                disabled={readOnly}
                onChange={() => onChange(option)}
              />
              <span
                className={`radio-input__styled-radio ${readOnly ? 'radio-input__styled-radio--disabled' : ''}`}
              />
              <span className="radio-input__label flex items-center gap-1.5">
                <Icon aria-hidden style={{ width: '16px', height: '16px' }} />
                {optionLabel}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  </div>
)
