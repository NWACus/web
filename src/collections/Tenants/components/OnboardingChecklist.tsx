'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import { CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  checkProvisioningStatusAction,
  type ProvisioningStatus,
  runProvisionAction,
} from './onboardingActions'

function ChecklistItem({
  done,
  label,
  children,
  action,
}: {
  done: boolean
  label: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle2 size={20} className="shrink-0 text-success" />
        ) : (
          <Circle size={20} className="shrink-0 text-muted-foreground" />
        )}
        <span className={done ? 'opacity-70' : ''}>{label}</span>
        {children && <span className="text-sm opacity-50">{children}</span>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function OnboardingChecklist() {
  const { data } = useDocumentInfo()
  const [status, setStatus] = useState<ProvisioningStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const tenantId = data?.id

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
      <div className="mt-8 rounded border-solid border-[var(--theme-border-color)] p-6">
        <h3 className="mt-0 mb-4">Onboarding Checklist</h3>
        <p className="opacity-50">Loading...</p>
      </div>
    )
  }

  if (!status) return null

  const automatedComplete =
    status.builtInPages.count >= status.builtInPages.expected &&
    status.pages.count >= status.pages.expected &&
    status.pages.expected > 0 &&
    status.homePage &&
    status.navigation

  const allComplete = automatedComplete && status.settings && status.hasTheme

  return (
    <div className="mt-8 rounded-lg border-solid border-[var(--theme-border-color)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0">Onboarding Checklist</h3>
        {allComplete && <span className="text-sm text-success">All steps complete</span>}
      </div>

      <ChecklistItem
        done={status.builtInPages.count >= status.builtInPages.expected}
        label="Built-in pages"
      >
        ({status.builtInPages.count}/{status.builtInPages.expected})
      </ChecklistItem>
      <ChecklistItem
        done={status.pages.count >= status.pages.expected && status.pages.expected > 0}
        label="Template pages copied"
      >
        ({status.pages.count}/{status.pages.expected})
        {status.pages.failed.length > 0 && ` — failed: ${status.pages.failed.join(', ')}`}
      </ChecklistItem>

      <ChecklistItem done={status.homePage} label="Home page" />
      <ChecklistItem done={status.navigation} label="Navigation" />

      {!automatedComplete && (
        <div className="my-3">
          <Button onClick={handleProvision} disabled={isProvisioning} size="small">
            {isProvisioning ? 'Provisioning...' : 'Run Provisioning'}
          </Button>
        </div>
      )}

      <div className="mt-3 border-0 border-t border-solid border-t-[var(--theme-border-color)] pt-3">
        <ChecklistItem
          done={status.settings}
          label="Website Settings"
          action={
            !status.settings ? (
              <Link href="/admin/collections/settings/create" className="text-sm">
                Create
              </Link>
            ) : undefined
          }
        />
        <ChecklistItem done={status.hasTheme} label="Theme">
          {status.hasTheme ? '(found in colors.css)' : '(manual — see docs/onboarding.md)'}
        </ChecklistItem>
      </div>
    </div>
  )
}
