'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'
import {
  checkProvisioningStatusAction,
  type ProvisioningStatus,
  runProvisionAction,
} from './onboardingActions'

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="var(--theme-success-500)" />
      <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function EmptyCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="var(--theme-elevation-400)" strokeWidth="2" />
    </svg>
  )
}

function ChecklistItem({
  done,
  label,
  detail,
  action,
}: {
  done: boolean
  label: string
  detail?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        {done ? <CheckIcon /> : <EmptyCircle />}
        <span style={{ opacity: done ? 0.7 : 1 }}>{label}</span>
        {detail && <span style={{ fontSize: '0.85em', opacity: 0.5 }}>{detail}</span>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function OnboardingChecklist() {
  const { savedDocumentData } = useDocumentInfo()
  const [status, setStatus] = useState<ProvisioningStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const tenantId = savedDocumentData?.id

  const checkStatus = useCallback(async () => {
    if (!tenantId) return
    setIsLoading(true)
    try {
      const result = await checkProvisioningStatusAction(tenantId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setStatus(result.status)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check status')
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handleProvision = async () => {
    if (!tenantId) return
    setIsProvisioning(true)
    try {
      const result = await runProvisionAction(tenantId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Provisioning complete')
        await checkStatus()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to provision')
    } finally {
      setIsProvisioning(false)
    }
  }

  // Only show on edit (existing document), not create
  if (!tenantId) return null

  if (isLoading && !status) {
    return (
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Onboarding Checklist</h3>
        <p style={{ opacity: 0.5 }}>Loading...</p>
      </div>
    )
  }

  if (!status) return null

  const automatedComplete =
    status.builtInPages.count >= status.builtInPages.expected &&
    status.pages.count > 0 &&
    status.homePage &&
    status.navigation

  const allComplete = automatedComplete && status.settings

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Onboarding Checklist</h3>
        {allComplete && (
          <span style={{ color: 'var(--theme-success-500)', fontSize: '0.9em' }}>
            All steps complete
          </span>
        )}
      </div>

      <ChecklistItem
        done={status.builtInPages.count >= status.builtInPages.expected}
        label="Built-in pages"
        detail={`(${status.builtInPages.count}/${status.builtInPages.expected})`}
      />
      <ChecklistItem
        done={status.pages.count > 0}
        label="Template pages copied"
        detail={`(${status.pages.count} pages)`}
      />
      <ChecklistItem done={status.homePage} label="Home page" />
      <ChecklistItem done={status.navigation} label="Navigation" />

      {!automatedComplete && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
          <Button onClick={handleProvision} disabled={isProvisioning} size="small">
            {isProvisioning ? 'Provisioning...' : 'Run Provisioning'}
          </Button>
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid var(--theme-elevation-150)',
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
        }}
      >
        <ChecklistItem
          done={status.settings}
          label="Website Settings"
          action={
            !status.settings ? (
              <a href={`/admin/collections/settings/create`} style={{ fontSize: '0.85em' }}>
                Create
              </a>
            ) : undefined
          }
        />
        <ChecklistItem done={false} label="Theme" detail="(manual — see docs/onboarding.md)" />
        <ChecklistItem
          done={status.hasCustomDomain}
          label="Custom domain"
          detail={
            status.hasCustomDomain
              ? `(${savedDocumentData?.customDomain})`
              : '(manual — see docs/onboarding.md)'
          }
        />
      </div>
    </div>
  )
}
