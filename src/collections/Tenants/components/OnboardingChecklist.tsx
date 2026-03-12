'use client'

import { Button, toast, useDocumentInfo, useForm } from '@payloadcms/ui'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { useCallback, useEffect, useState } from 'react'
import { needsProvisioning } from './needsProvisioning'
import {
  checkProvisioningStatusAction,
  type ProvisioningStatus,
  runProvisionAction,
} from './onboardingActions'

const DEFAULT_STATUS: ProvisioningStatus = {
  builtInPages: { count: 0, expected: 0 },
  pages: { copied: 0, expected: 0, missing: [], skipped: [] },
  homePage: false,
  navigation: false,
  settings: { exists: false, id: undefined },
  theme: { brandColors: false, ogColors: false },
}

function ChecklistItem({
  loading,
  done,
  label,
  details,
  children,
  action,
}: {
  loading?: boolean
  done: boolean
  label: string
  details?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
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
          {!isRunning && details && <span className="text-sm opacity-50">{details}</span>}
        </div>
        {!isRunning && action && <div>{action}</div>}
      </div>
      {!isRunning && children && <div className="ml-9 mt-1 text-sm opacity-50">{children}</div>}
    </div>
  )
}

export function OnboardingChecklist() {
  const { data } = useDocumentInfo()
  const { setProcessing } = useForm()
  const [status, setStatus] = useState<ProvisioningStatus>(DEFAULT_STATUS)
  const [loaded, setLoaded] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const tenantId = data?.id

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

    setIsProvisioning(true)
    setProcessing(true)

    toast.promise(
      new Promise((resolve, reject) => {
        runProvisionAction(tenantId)
          .then(async (result) => {
            if ('error' in result) {
              setIsProvisioning(false)
              setProcessing(false)
              reject(result.error)
              return
            }
            await checkStatus()
            setIsProvisioning(false)
            setProcessing(false)
            resolve(result)
          })
          .catch((err) => {
            setIsProvisioning(false)
            setProcessing(false)
            reject(err)
          })
      }),
      {
        loading: 'Building avy center...',
        success: 'Provisioning complete',
        error: 'Provisioning failed',
      },
    )
  }, [tenantId, isProvisioning, checkStatus, setProcessing])

  // On mount: check status and auto-provision only for brand new tenants
  useEffect(() => {
    if (!tenantId) return

    checkProvisioningStatusAction(tenantId).then((result) => {
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      if (needsProvisioning(result.status)) {
        setIsProvisioning(true)
        handleProvision()
      } else {
        setStatus(result.status)
        setLoaded(true)
      }
    })
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { builtInPages, pages, homePage, navigation, settings, theme } = status

  const automatedComplete =
    builtInPages.count >= builtInPages.expected &&
    pages.copied >= pages.expected &&
    pages.expected > 0 &&
    homePage &&
    navigation &&
    settings.exists

  return (
    <div className="rounded-lg border-solid border-[var(--theme-border-color)] p-6">
      <h3 className="mb-4">Onboarding Checklist</h3>

      <div className="flex items-center justify-between mb-2">
        <h4>Automated</h4>
        {loaded && !automatedComplete && (
          <Button className="m-0" onClick={handleProvision} disabled={isProvisioning} size="medium">
            {isProvisioning ? 'Provisioning...' : 'Rerun Provisioning'}
          </Button>
        )}
      </div>

      {automatedComplete && (
        <p className="mt-2 text-sm opacity-70">
          Pages and navigation are saved as drafts — review and publish.
        </p>
      )}

      <ChecklistItem
        loading={isProvisioning}
        done={loaded && builtInPages.count >= builtInPages.expected}
        label="Built-in pages"
        details={loaded && `(${builtInPages.count}/${builtInPages.expected})`}
      />
      <ChecklistItem
        loading={isProvisioning}
        done={pages.copied >= pages.expected && pages.expected > 0}
        label="Pages - copied from DVAC"
        details={loaded && `(${pages.copied}/${pages.expected})`}
      >
        {pages.missing.length > 0 && <div>Missing: {pages.missing.join(', ')}</div>}
        {pages.skipped.length > 0 && <div>Skipped (demo pages): {pages.skipped.join(', ')}</div>}
        <div>Copied as drafts — review and publish</div>
      </ChecklistItem>

      <ChecklistItem loading={isProvisioning} done={homePage} label="Home page" />
      <ChecklistItem loading={isProvisioning} done={navigation} label="Navigation">
        {navigation && <div>Created as a draft — review and publish</div>}
      </ChecklistItem>
      <ChecklistItem
        loading={isProvisioning}
        done={settings.exists}
        label="Website Settings"
        action={
          settings.id && (
            <Link href={`/admin/collections/settings/${settings.id}`} className="text-sm">
              Update Brand Assets
            </Link>
          )
        }
      />

      <div className="mt-3 border-0 border-t border-solid border-t-[var(--theme-border-color)] pt-3">
        <h4 className="mb-2">Needs action</h4>

        <ChecklistItem loading={isProvisioning} done={theme.brandColors} label="Add brand colors">
          {loaded && !theme.brandColors && (
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
          {loaded && !theme.ogColors && (
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
      </div>
    </div>
  )
}
