'use client'

// Keyboard-first entry cells for the MWF grids. Typed entry commits on
// Tab/Enter/blur (never per keystroke); Escape restores the committed value.
// Levels step by 500 ft with the arrow keys and snap on commit; wind
// directions must be compass points (invalid entries clear rather than
// publish).
import { WIND_DIRECTIONS, type Entered } from '@/utilities/mwf/mwfData'
import { useEffect, useState } from 'react'

const display = (v: Entered): string => (v == null ? '' : String(v))

interface CommitInputProps {
  value: Entered
  onCommit: (raw: string) => void
  className?: string
  ariaLabel: string
  invalid?: boolean
  disabled?: boolean
  onArrow?: (direction: 1 | -1, current: string) => string | null
}

function CommitInput({
  value,
  onCommit,
  className,
  ariaLabel,
  invalid,
  disabled,
  onArrow,
}: CommitInputProps) {
  const [draft, setDraft] = useState(display(value))
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setDraft(display(value))
  }, [value, editing])

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      className={`w-full min-w-14 rounded border px-1.5 py-1 text-right text-sm ${
        invalid ? 'border-red-500 bg-red-50' : ''
      } ${className ?? ''}`}
      value={draft}
      onFocus={(e) => {
        setEditing(true)
        e.currentTarget.select()
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false)
        onCommit(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(display(value))
          setEditing(false)
          e.currentTarget.blur()
        } else if (onArrow && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault()
          const next = onArrow(e.key === 'ArrowUp' ? 1 : -1, draft)
          if (next != null) {
            setDraft(next)
            onCommit(next)
          }
        }
      }}
    />
  )
}

export function parseNumber(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Plain numeric entry (QPF, density, temps, wind speed).
export function NumberCell({
  value,
  onChange,
  ariaLabel,
  invalid,
  disabled,
}: {
  value: Entered
  onChange: (v: number | null) => void
  ariaLabel: string
  invalid?: boolean
  disabled?: boolean
}) {
  return (
    <CommitInput
      value={value}
      ariaLabel={ariaLabel}
      invalid={invalid}
      disabled={disabled}
      onCommit={(raw) => onChange(parseNumber(raw))}
    />
  )
}

// Freezing/snow levels: snap to 500 ft between 0 and 16,000; arrows step.
export function snapLevel(v: number | null): number | null {
  if (v == null) return null
  return Math.min(16000, Math.max(0, Math.round(v / 500) * 500))
}

export function LevelCell({
  value,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: Entered
  onChange: (v: number | null) => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <CommitInput
      value={value}
      ariaLabel={ariaLabel}
      disabled={disabled}
      onCommit={(raw) => onChange(snapLevel(parseNumber(raw)))}
      onArrow={(direction, current) => {
        const base = snapLevel(parseNumber(current)) ?? (direction === 1 ? -500 : 500)
        const next = snapLevel(base + direction * 500)
        return next == null ? null : String(next)
      }}
    />
  )
}

// Compass-point entry: uppercases as you type; a non-compass entry clears on
// commit rather than being stored.
export function WindDirCell({
  value,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  ariaLabel: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])
  return (
    <input
      type="text"
      aria-label={ariaLabel}
      disabled={disabled}
      className="w-full min-w-12 rounded border px-1.5 py-1 text-center text-sm uppercase"
      value={draft}
      maxLength={3}
      onFocus={(e) => {
        setEditing(true)
        e.currentTarget.select()
      }}
      onChange={(e) => setDraft(e.target.value.toUpperCase())}
      onBlur={() => {
        setEditing(false)
        const next = draft.toUpperCase().trim()
        onChange(WIND_DIRECTIONS.includes(next) ? next : '')
        if (!WIND_DIRECTIONS.includes(next)) setDraft('')
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
