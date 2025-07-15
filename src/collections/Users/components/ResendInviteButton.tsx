'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { checkExpiredInviteAction, resendInviteAction } from './resendInviteActions'

export function ResendInviteButton() {
  const { savedDocumentData, docConfig } = useDocumentInfo()
  const [hasExpiredInvite, setHasExpiredInvite] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkExpiredInvite = async () => {
      if (savedDocumentData?.id) {
        try {
          const result = await checkExpiredInviteAction(savedDocumentData.id)
          if (!result.error) {
            setHasExpiredInvite(result.hasExpiredInvite)
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to check invite status')
        }
      }
    }

    checkExpiredInvite()
  }, [savedDocumentData?.id])

  const handleResendInvite = async () => {
    if (!savedDocumentData?.id) return

    setIsLoading(true)

    try {
      const result = await resendInviteAction(savedDocumentData.id)
      if (result.success) {
        toast.success('Invite resent successfully')
        const checkResult = await checkExpiredInviteAction(savedDocumentData.id)
        setHasExpiredInvite(checkResult.hasExpiredInvite)
      } else {
        toast.error(result.error || 'Failed to resend invite')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite')
    } finally {
      setIsLoading(false)
    }
  }

  if (docConfig?.slug !== 'users') {
    return null
  }

  if (hasExpiredInvite !== true) {
    return null
  }

  return (
    <div className="flex items-end gap-2">
      <p className="text-error">Invite Expired</p>
      <Button onClick={handleResendInvite} disabled={isLoading}>
        {isLoading ? 'Resending...' : 'Resend Invite'}
      </Button>
    </div>
  )
}
