'use client'

import { Button, Modal, toast, useConfig, useDocumentInfo, useForm, useModal } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Intercepts Payload's built-in delete confirmation for tenants and replaces it
 * with a type-to-confirm modal.
 *
 * Registered as a beforeDocumentControls component on the Tenants collection.
 * When the admin clicks "Delete" from the actions menu, Payload opens a modal
 * with slug `delete-{id}`. This component detects that, closes it, and opens
 * a custom modal requiring the user to type the tenant name to confirm.
 *
 * Uses Modal + Button directly instead of ConfirmationModal so we can
 * control the button's loading/disabled state on name mismatch.
 */
export function DeleteTenantModal() {
  const { data } = useDocumentInfo()
  const { setModified } = useForm()
  const { openModal, closeModal, isModalOpen } = useModal()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const [confirmInput, setConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const tenantId = data?.id
  const tenantName = typeof data?.name === 'string' ? data.name : ''

  const payloadDeleteSlug = `delete-${tenantId}`
  const customModalSlug = `delete-tenant-confirm-${tenantId}`

  const interceptingRef = useRef(false)

  // Intercept Payload's delete modal — close it and open ours instead
  const payloadDeleteOpen = isModalOpen(payloadDeleteSlug)
  useEffect(() => {
    if (!tenantId || !payloadDeleteOpen || interceptingRef.current) return

    interceptingRef.current = true
    closeModal(payloadDeleteSlug)
    setConfirmInput('')
    setIsDeleting(false)
    openModal(customModalSlug)
    interceptingRef.current = false
  }, [payloadDeleteOpen, tenantId, payloadDeleteSlug, customModalSlug, closeModal, openModal])

  const handleConfirmDelete = useCallback(async () => {
    if (!tenantId || isDeleting) return

    if (confirmInput !== tenantName) {
      toast.error('Name does not match. Please type the exact name to confirm.')
      return
    }

    setIsDeleting(true)
    setModified(false)

    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        toast.success('Avalanche center deleted')
        window.location.href = formatAdminURL({
          adminRoute,
          path: '/collections/tenants',
        })
      } else {
        const json = await res.json()
        toast.error(json.message || 'Failed to delete avalanche center')
        setIsDeleting(false)
      }
    } catch {
      toast.error('Failed to delete avalanche center')
      setIsDeleting(false)
    }
  }, [tenantId, isDeleting, confirmInput, tenantName, setModified, adminRoute])

  if (!tenantId) return null

  return (
    <Modal slug={customModalSlug} className="confirmation-modal">
      <div className="confirmation-modal__wrapper">
        <div className="confirmation-modal__content">
          <h1>Delete {tenantName}?</h1>
          <p className="text-lg">
            This will <strong>permanently delete</strong> this avalanche center and all its data.
            This action cannot be undone.
          </p>
          <div className="mt-4">
            <label className="block text-md mb-2">
              Type <strong>{tenantName}</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full rounded border border-solid border-[var(--theme-border-color)] bg-[var(--theme-input-bg)] p-2 text-[var(--theme-text)]"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="confirmation-modal__controls">
          <Button
            buttonStyle="secondary"
            disabled={isDeleting}
            onClick={() => closeModal(customModalSlug)}
            size="large"
          >
            Cancel
          </Button>
          <Button disabled={isDeleting} onClick={handleConfirmDelete} size="large">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
