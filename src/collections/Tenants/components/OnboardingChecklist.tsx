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

const DEFAULT_STATUS: ProvisioningStatus = {
  builtInPages: { count: 0, expected: 0 },
  pages: { copied: 0, expected: 0, missing: [], skipped: [] },
  homePage: false,
  navigation: false,
  settings: { exists: false, id: undefined },
  theme: { brandColors: false, ogColors: false },
}

function ChecklistItem({
  done,
  label,
  details,
  children,
  action,
}: {
  done: boolean
  label: string
  details?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {done ? (
            <CheckCircle2 size={20} className="shrink-0 text-success" />
          ) : (
            <Circle size={20} className="shrink-0 text-muted-foreground" />
          )}
          <span className={done ? 'opacity-70' : ''}>{label}</span>
          {details && <span className="text-sm opacity-50">{details}</span>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children && <div className="ml-9 mt-1 text-sm opacity-50">{children}</div>}
    </div>
  )
}

export function OnboardingChecklist() {
  const { data } = useDocumentInfo()
  const [status, setStatus] = useState<ProvisioningStatus>(DEFAULT_STATUS)
  const [loaded, setLoaded] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const tenantId = data?.id

  const checkStatus = useCallback(async () => {
    if (!tenantId) return
    try {
      const result = await checkProvisioningStatusAction(tenantId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setStatus(result.status)
        setLoaded(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check status')
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
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to provision')
    } finally {
      await checkStatus()
      setIsProvisioning(false)
    }
  }

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

      <ChecklistItem
        done={loaded && builtInPages.count >= builtInPages.expected}
        label="Built-in pages"
        details={loaded && `(${builtInPages.count}/${builtInPages.expected})`}
      />
      <ChecklistItem
        done={loaded && pages.copied >= pages.expected && pages.expected > 0}
        label="Pages - copied from DVAC"
        details={loaded && `(${pages.copied}/${pages.expected})`}
      >
        {pages.missing.length > 0 && <div>Missing: {pages.missing.join(', ')}</div>}
        {pages.skipped.length > 0 && <div>Skipped (demo pages): {pages.skipped.join(', ')}</div>}
      </ChecklistItem>

      <ChecklistItem done={homePage} label="Home page" />
      <ChecklistItem done={navigation} label="Navigation" />
      <ChecklistItem
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

        <ChecklistItem done={theme.brandColors} label="Add brand colors">
          {loaded && !theme.brandColors && (
            <span>
              Add slug to <code>colors.css</code> — see{' '}
              <Link
                href="https://github.com/NWACus/web/blob/main/docs/onboarding.md"
                target="_blank"
              >
                docs/onboarding.md
              </Link>
            </span>
          )}
        </ChecklistItem>
        <ChecklistItem done={theme.ogColors} label="Add OG image colors">
          {loaded && !theme.ogColors && (
            <span>
              Add slug to <code>centerColorMap</code> — see{' '}
              <Link
                href="https://github.com/NWACus/web/blob/main/docs/onboarding.md"
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
