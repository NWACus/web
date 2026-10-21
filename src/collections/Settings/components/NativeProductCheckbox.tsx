'use client'

import { cn } from '@/utilities/ui'
import {
  Button,
  CheckboxInput,
  FieldDescription,
  Modal,
  useField,
  useFormFields,
  useModal,
} from '@payloadcms/ui'
import type { CheckboxFieldClientComponent } from 'payload'
import { useEffect, useId, useState } from 'react'

function useTenantName(tenantId: unknown) {
  const [tenantName, setTenantName] = useState<string | null>(null)

  useEffect(() => {
    if (typeof tenantId !== 'number') return
    const controller = new AbortController()
    fetch(`/api/tenants/${tenantId}?depth=0&select[name]=true`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((tenant) => setTenantName(typeof tenant?.name === 'string' ? tenant.name : null))
      .catch(() => undefined)
    return () => controller.abort()
  }, [tenantId])

  return tenantName
}

function ConfirmNameInput({
  tenantName,
  value,
  onChange,
}: {
  tenantName: string | null
  value: string
  onChange: (value: string) => void
}) {
  const inputId = useId()
  return (
    <div className="mt-4">
      {tenantName ? (
        <label htmlFor={inputId} className="block text-md mb-2">
          Type <strong>{tenantName}</strong> to confirm
        </label>
      ) : (
        <p className="text-md mb-2">Loading avalanche center name…</p>
      )}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-solid border-[var(--theme-border-color)] bg-[var(--theme-input-bg)] p-2 text-[var(--theme-text)]"
        autoComplete="off"
        disabled={!tenantName}
      />
    </div>
  )
}

function EnableNativeProductWarning({ tenantName }: { tenantName: string | null }) {
  return (
    <p className="text-lg">
      After you save, <strong>{tenantName ?? 'this center'}</strong>&rsquo;s public website will
      stop showing the NAC widget for this product and render the native page instead. Uncheck and
      save to roll back.
    </p>
  )
}

function ModalControls({
  confirmed,
  onCancel,
  onConfirm,
}: {
  confirmed: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="confirmation-modal__controls">
      <Button buttonStyle="secondary" onClick={onCancel} size="large">
        Cancel
      </Button>
      <Button disabled={!confirmed} onClick={onConfirm} size="large">
        Turn on
      </Button>
    </div>
  )
}

function EnableNativeProductModal({
  slug,
  productLabel,
  onConfirm,
}: {
  slug: string
  productLabel: string
  onConfirm: () => void
}) {
  const tenantId = useFormFields(([fields]) => fields.tenant?.value)
  const tenantName = useTenantName(tenantId)
  const { closeModal } = useModal()
  const [confirmInput, setConfirmInput] = useState('')

  const close = () => {
    setConfirmInput('')
    closeModal(slug)
  }

  const confirmed = Boolean(tenantName) && confirmInput === tenantName
  const turnOn = () => {
    onConfirm()
    close()
  }

  return (
    <Modal slug={slug} className="confirmation-modal">
      <div className="confirmation-modal__wrapper">
        <div className="confirmation-modal__content">
          <h1>Turn on native {productLabel}?</h1>
          <EnableNativeProductWarning tenantName={tenantName} />
          <ConfirmNameInput
            tenantName={tenantName}
            value={confirmInput}
            onChange={setConfirmInput}
          />
        </div>
        <ModalControls confirmed={confirmed} onCancel={close} onConfirm={turnOn} />
      </div>
    </Modal>
  )
}

/**
 * Turning a native product on replaces a live NAC widget on the center's public site, so it
 * requires typing the center's name. Turning one off (rollback) stays a single click.
 */
export const NativeProductCheckbox: CheckboxFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
}) => {
  const { disabled, path, setValue, value } = useField<boolean>({
    potentiallyStalePath: pathFromProps,
  })
  const { openModal } = useModal()

  const modalSlug = `enable-native-product-${path}`
  const isReadOnly = readOnly || disabled

  const onToggle = () => {
    if (isReadOnly) return
    if (value) setValue(false)
    else openModal(modalSlug)
  }

  return (
    <div className={cn('field-type checkbox', isReadOnly && 'checkbox--read-only')}>
      <CheckboxInput
        checked={Boolean(value)}
        // Matches Payload's field ID format: dots in the path become double underscores
        id={`field-${path.replace(/\./g, '__')}`}
        label={field.label}
        name={path}
        onToggle={onToggle}
        readOnly={isReadOnly}
      />
      <FieldDescription description={field.admin?.description} path={path} />
      <EnableNativeProductModal
        slug={modalSlug}
        productLabel={typeof field.label === 'string' ? field.label : field.name}
        onConfirm={() => setValue(true)}
      />
    </div>
  )
}
