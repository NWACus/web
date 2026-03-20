'use client'

import { LoadingOverlayToggle, useFormProcessing, useOperation } from '@payloadcms/ui'

/**
 * Invisible component in beforeDocumentControls that shows an
 * overlay when creating a new tenant.
 * The provisionAfterChange hook makes the create-save slow;
 * this tells the user what's happening.
 */
export const ProvisioningIndicator = () => {
  const processing = useFormProcessing()
  const operation = useOperation()

  return (
    <LoadingOverlayToggle
      name="provisioning-tenant"
      show={operation === 'create' && processing}
      loadingText="Building avy center..."
      type="withoutNav"
    />
  )
}
