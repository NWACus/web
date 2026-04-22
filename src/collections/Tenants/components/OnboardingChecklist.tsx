'use client'

import { Button, toast, useDocumentInfo, useForm } from '@payloadcms/ui'
import { AlertTriangle, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { formatDate } from 'date-fns/format'
import { useCallback, useEffect, useRef, useState } from 'react'
import { needsProvisioning } from './needsProvisioning'
import {
  checkProvisioningStatusAction,
  type ProvisioningStatus,
  runProvisionAction,
} from './onboardingActions'

const DEFAULT_STATUS: ProvisioningStatus = {
  status: 'not_started',
  lastRunAt: null,
  failed: {},
  theme: { brandColors: false, ogColors: false },
  tenantCreatedAt: null,
  settings: { id: undefined },
}

function ChecklistItem({
  loading,
  done,
  label,
  children,
}: {
  loading?: boolean
  done: boolean
  label: string
  children?: React.ReactNode
}) {
  const isRunning = loading && !done

  return (
    <div className="py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {isRunning ? (
            <Loader2
              data-testid="spinner"
              size={20}
              className="shrink-0"
              style={{ animation: 'spin 1s linear infinite', color: 'var(--theme-text)' }}
            />
          ) : done ? (
            <CheckCircle2 size={20} className="shrink-0 text-success" />
          ) : (
            <Circle size={20} className="shrink-0 text-muted-foreground" />
          )}
          <span className={done ? 'opacity-70' : ''}>{label}</span>
        </div>
      </div>
      {!isRunning && children && <div className="ml-9 mt-1 text-sm opacity-50">{children}</div>}
    </div>
  )
}

export function OnboardingChecklist() {
  const { data } = useDocumentInfo()
  const { setProcessing } = useForm()
  const { setTenant } = useTenantSelection()
  const [status, setStatus] = useState<ProvisioningStatus>(DEFAULT_STATUS)
  const [loaded, setLoaded] = useState(false)
  // Refs persist across React 18 StrictMode's double-mount, so we use them to
  // ensure the auto-provision path fires at most once per tenantId even if
  // the effect body runs twice in dev.
  const autoProvisionAttempted = useRef<number | string | null>(null)

  const tenantId = data?.id
  const isProvisioning = status.status === 'in_progress'

  const checkStatus = useCallback(async () => {
    if (!tenantId) return null
    try {
      const result = await checkProvisioningStatusAction(tenantId)
      if ('error' in result) {
        toast.error(result.error)
        return null
      }
      setStatus(result.status)
      setLoaded(true)
      return result.status
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check status')
      return null
    }
  }, [tenantId])

  const handleProvision = useCallback(async () => {
    if (!tenantId || isProvisioning) return

    // Optimistically mirror the in_progress state the server is about to write
    // so the UI flips to the spinner immediately instead of waiting for the
    // action to return.
    setStatus((s) => ({ ...s, status: 'in_progress' }))
    setProcessing(true)

    toast.promise(
      runProvisionAction(tenantId).then(async (result) => {
        await checkStatus()
        setProcessing(false)
        if ('error' in result) throw new Error(result.error)
        return result
      }),
      {
        loading: 'Building avy center...',
        success: 'Provisioning complete',
        error: 'Provisioning failed',
      },
    )
  }, [tenantId, isProvisioning, checkStatus, setProcessing])

  // On mount: check status and auto-provision only for brand new tenants.
  // The ref-based guard ensures the auto-provision call fires at most once
  // per tenantId
  useEffect(() => {
    if (!tenantId) return

    checkProvisioningStatusAction(tenantId).then((result) => {
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      setStatus(result.status)
      setLoaded(true)

      if (needsProvisioning(result.status) && autoProvisionAttempted.current !== tenantId) {
        autoProvisionAttempted.current = tenantId
        handleProvision()
      }
    })
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { theme } = status
  // On the create view there's no tenant yet — skip the initial load spinner
  // and render the placeholder checklist so users can see what will happen.
  const showInitialLoader = Boolean(tenantId) && !loaded
  const showChecklist = !tenantId || loaded
  const showPlaceholders = status.status === 'not_started' || status.status === 'in_progress'

  return (
    <div className="rounded-lg border-solid border-[var(--theme-border-color)] p-6">
      <h3 className="mb-4">Onboarding Checklist</h3>

      {/* Initial load — waiting for checkProvisioningStatusAction to return */}
      {showInitialLoader && (
        <div className="py-4 flex items-center gap-3">
          <Loader2
            data-testid="spinner"
            size={20}
            className="shrink-0"
            style={{ animation: 'spin 1s linear infinite', color: 'var(--theme-text)' }}
          />
          <span className="opacity-70">Loading...</span>
        </div>
      )}

      {/* Header section — shown once provisioning has run at least once */}
      {showChecklist && (status.status === 'complete' || status.status === 'partial') && (
        <div className="mb-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.status === 'complete' ? (
                <>
                  <CheckCircle2 size={20} className="shrink-0 text-success" />
                  <span>Complete</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={20} className="shrink-0 text-warning" />
                  <span>Failed</span>
                </>
              )}
            </div>
            <Button
              className="m-0"
              onClick={handleProvision}
              disabled={isProvisioning}
              size="medium"
              buttonStyle="secondary"
            >
              Rerun
            </Button>
          </div>
          {status.status === 'partial' && (
            <div className="text-sm ml-9 mb-4 space-y-2">
              {status.failed.timedOut && <div className="opacity-70">{status.failed.timedOut}</div>}
              {status.failed.websiteSettings && (
                <div className="opacity-70">Website settings failed to provision.</div>
              )}
              {status.failed.homePage && (
                <div className="opacity-70">Home page failed to provision.</div>
              )}
              {status.failed.navigation && (
                <div className="opacity-70">Navigation failed to provision.</div>
              )}
              {status.failed.pages && Object.keys(status.failed.pages).length > 0 && (
                <div>
                  <div className="font-semibold opacity-80">Missing pages:</div>
                  <ul className="list-disc pl-5 opacity-70">
                    {Object.keys(status.failed.pages).map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual steps — always visible as a nag until configured */}
      {showChecklist && (
        <div className="mt-3 border-0 border-t border-solid border-t-[var(--theme-border-color)] pt-3">
          <h4 className="mb-2">Needs action</h4>

          {showPlaceholders && (
            <>
              <ChecklistItem loading={isProvisioning} done={false} label="Home page" />
              <ChecklistItem loading={isProvisioning} done={false} label="Pages" />
              <ChecklistItem loading={isProvisioning} done={false} label="Navigation" />
              <ChecklistItem loading={isProvisioning} done={false} label="Website Settings" />
            </>
          )}
          {status.settings.id && (
            <ChecklistItem
              loading={isProvisioning}
              done={theme.brandColors}
              label="Update Brand Assets"
            >
              <div className="mt-2 text-md">
                Change avy center logo & info in{' '}
                <Link
                  href={`/admin/collections/settings/${status.settings.id}`}
                  onClick={() => {
                    setTenant({ slug: data?.slug }) // Switch selected tenant to avoid redirect
                  }}
                >
                  Settings
                </Link>
              </div>
            </ChecklistItem>
          )}

          <ChecklistItem loading={isProvisioning} done={theme.brandColors} label="Add brand colors">
            {!theme.brandColors && (
              <span>
                Add slug to <code>colors.css</code> — see{' '}
                <Link
                  href="https://github.com/NWACus/web/blob/main/docs/onboarding.md#theme"
                  target="_blank"
                >
                  docs/onboarding.md
                </Link>
              </span>
            )}
          </ChecklistItem>
          <ChecklistItem loading={isProvisioning} done={theme.ogColors} label="Add OG image colors">
            {!theme.ogColors && (
              <span>
                Add slug to <code>centerColorMap</code> — see{' '}
                <Link
                  href="https://github.com/NWACus/web/blob/main/docs/onboarding.md#theme"
                  target="_blank"
                >
                  docs/onboarding.md
                </Link>
              </span>
            )}
          </ChecklistItem>
          {(status.status === 'complete' || status.status === 'partial') && (
            <div className="mt-3 border-0 border-t border-solid border-t-[var(--theme-border-color)] pt-4 text-sm opacity-70">
              <strong>Last provisioned:</strong>&nbsp;
              {status.lastRunAt && formatDate(status.lastRunAt, 'PPpp')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
