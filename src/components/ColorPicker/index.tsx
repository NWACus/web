'use client'

import { BRAND_SHADES } from '@/fields/color'
import { getSlugFromTenantId } from '@/utilities/getSlugFromTenantId'
import { cn } from '@/utilities/ui'
import { FieldLabel, useDocumentInfo, useField } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import { ChevronDown } from 'lucide-react'
import { TextFieldClientProps } from 'payload'
import { ReactNode, RefObject, useCallback, useEffect, useId, useRef, useState } from 'react'

const baseColors = ['transparent', 'white']
const brandColors = BRAND_SHADES.map((n) => `brand-${n}`)

const colorName = (color: string) => {
  if (color === 'transparent') return 'Transparent'
  if (color === 'white') return 'White'
  return `Brand ${color.replace('brand-', '')}`
}

const checkerboard =
  'bg-center bg-[length:10px_10px] bg-[image:repeating-conic-gradient(#ddd_0%_25%,white_0%_50%)]'

const swatchFill = (color: string) => (color === 'transparent' ? checkerboard : `bg-${color}`)

export const ColorPicker = (props: TextFieldClientProps) => {
  const { path, field } = props
  const { value, setValue } = useField<string>({ path })
  const tenantSlug = useTenantSlug()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])
  useDismiss(containerRef, open, close)

  const selected = value || 'transparent'

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col mb-6', tenantSlug)}
      style={mergeFieldStyles(field)}
    >
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <button
        id={path}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex items-center gap-2 w-44 max-w-full h-9 px-2.5 rounded border border-solid border-[var(--theme-elevation-250)] bg-[var(--theme-elevation-50)] text-[var(--theme-text)] cursor-pointer"
      >
        {tenantSlug && (
          <span
            className={cn(
              'size-5 shrink-0 rounded border border-solid border-gray-500',
              swatchFill(selected),
            )}
          />
        )}
        <span className="flex-1 text-left">{colorName(selected)}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>

      {open && tenantSlug && (
        <SwatchPanel
          id={panelId}
          label={typeof field.label === 'string' ? field.label : 'Background color'}
          selected={selected}
          onPick={(color) => {
            setValue(color)
            close()
          }}
        />
      )}
    </div>
  )
}

const useTenantSlug = () => {
  const { data } = useDocumentInfo()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  useEffect(() => {
    getSlugFromTenantId(data?.tenant).then(setTenantSlug)
  }, [data?.tenant])

  return tenantSlug
}

// Closes the panel on a click outside the field or on Escape
const useDismiss = (ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) => {
  useEffect(() => {
    if (!open) return

    const onMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onDismiss()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, open, onDismiss])
}

const SwatchPanel = ({
  id,
  label,
  selected,
  onPick,
}: {
  id: string
  label: string
  selected: string
  onPick: (color: string) => void
}) => (
  <div
    id={id}
    role="radiogroup"
    aria-label={label}
    className="absolute top-full z-10 mt-1 flex items-start gap-3 p-3 rounded border border-solid border-[var(--theme-elevation-250)] bg-[var(--theme-elevation-50)] shadow-lg"
  >
    {baseColors.map((color) => (
      <div key={color} className="flex flex-col items-center gap-1.5">
        <Swatch
          color={color}
          selected={color === selected}
          onPick={onPick}
          className="size-8 rounded border border-solid border-gray-500"
          selectedClassName="ring-2 ring-[var(--theme-text)] ring-offset-2 ring-offset-[var(--theme-elevation-50)]"
        />
        <SwatchLabel selected={color === selected}>
          {color === 'transparent' ? 'None' : 'White'}
        </SwatchLabel>
      </div>
    ))}
    <div className="flex flex-col gap-1.5">
      <div className="flex rounded overflow-hidden border border-solid border-gray-500">
        {brandColors.map((color) => (
          <Swatch
            key={color}
            color={color}
            selected={color === selected}
            onPick={onPick}
            className="w-9 h-8 border-0"
            selectedClassName="shadow-[inset_0_0_0_2px_var(--theme-elevation-50),inset_0_0_0_4px_var(--theme-text)]"
          />
        ))}
      </div>
      <div className="flex">
        {BRAND_SHADES.map((shade) => (
          <SwatchLabel key={shade} selected={`brand-${shade}` === selected} className="w-9">
            {shade}
          </SwatchLabel>
        ))}
      </div>
    </div>
  </div>
)

const Swatch = ({
  color,
  selected,
  onPick,
  className,
  selectedClassName,
}: {
  color: string
  selected: boolean
  onPick: (color: string) => void
  className: string
  selectedClassName: string
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={colorName(color)}
    title={colorName(color)}
    onClick={() => onPick(color)}
    className={cn(
      'p-0 cursor-pointer',
      className,
      swatchFill(color),
      selected && selectedClassName,
    )}
  />
)

const SwatchLabel = ({
  selected,
  className,
  children,
}: {
  selected: boolean
  className?: string
  children: ReactNode
}) => (
  <span
    className={cn(
      'text-center text-xs',
      selected ? 'font-semibold text-[var(--theme-text)]' : 'text-[var(--theme-elevation-500)]',
      className,
    )}
  >
    {children}
  </span>
)
