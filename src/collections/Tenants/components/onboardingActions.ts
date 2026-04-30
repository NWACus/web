'use server'

import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { centerColorMap } from '@/app/api/[center]/og/centerColorMap'
import {
  provision,
  STALE_IN_PROGRESS_MS,
  type ProvisioningFailed,
} from '@/collections/Tenants/endpoints/provisionTenant'
import { isRecord } from '@/utilities/isRecord'
import config from '@payload-config'
import fs from 'fs/promises'
import { headers } from 'next/headers'
import path from 'path'
import { getPayload, type Payload, type PayloadRequest } from 'payload'

async function authorize(): Promise<{ payload: Payload } | { error: string }> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { error: 'Unauthorized' }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockedReq = { user, payload } as PayloadRequest
  const isSuperAdmin = await hasSuperAdminPermissions({ req: mockedReq })
  if (!isSuperAdmin) return { error: 'Super admin access required' }
  return { payload }
}

export type ProvisioningStatus = {
  status: 'not_started' | 'in_progress' | 'complete' | 'partial' | 'manual'
  lastRunAt: string | null
  failed: ProvisioningFailed
  theme: { brandColors: boolean; ogColors: boolean }
  tenantCreatedAt: string | null
  settings: { id?: number | string }
}

export async function checkProvisioningStatusAction(
  tenantId: number | string,
): Promise<{ status: ProvisioningStatus } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const { payload } = auth
  try {
    const [tenant, settings, brandColors] = await Promise.all([
      payload.findByID({
        collection: 'tenants',
        id: tenantId,
      }),
      payload.find({
        collection: 'settings',
        where: { tenant: { equals: tenantId } },
        limit: 1,
      }),
      fs
        .readFile(path.join(process.cwd(), 'src/app/(frontend)/colors.css'), 'utf-8')
        .catch((err) => {
          payload.logger.warn(
            `Failed to read colors.css: ${err instanceof Error ? err.message : err}`,
          )
          return ''
        }),
    ])

    const provisioning = tenant.provisioning

    // Recover from crashed runs: if we've been "in_progress" longer than the
    // grace window, treat it as a failed run so the UI shows a re-provision
    // button instead of a spinner that never stops.
    let status: ProvisioningStatus['status'] = provisioning?.status ?? 'not_started'
    let failed: ProvisioningFailed = isRecord(provisioning?.failed) ? provisioning.failed : {}
    if (status === 'in_progress' && provisioning?.lastRunAt) {
      const age = Date.now() - new Date(provisioning.lastRunAt).getTime()
      if (age > STALE_IN_PROGRESS_MS) {
        status = 'partial'
        failed = { ...failed, timedOut: 'Provisioning timed out. It may still be running.' }
      }
    }

    const theme = {
      // Check if a CSS class matching the tenant slug exists in colors.css (e.g. ".dvac {")
      brandColors: brandColors.includes(`.${tenant.slug} {`),
      // Check if the tenant slug exists as a key in centerColorMap in the OG route
      ogColors: tenant.slug in centerColorMap,
    }
    const themeComplete = theme.brandColors && theme.ogColors

    // Manual code-level items (brand colors in colors.css, OG colors in
    // centerColorMap) live outside the DB. Flip between 'complete' and
    // 'manual' based on the theme check, and persist it so the list-view
    // cell can render the same state without re-reading colors.css per row.
    let nextStatus: typeof status | undefined
    if (status === 'complete' && !themeComplete) nextStatus = 'manual'
    else if (status === 'manual' && themeComplete) nextStatus = 'complete'
    if (nextStatus) {
      await payload
        .update({
          collection: 'tenants',
          id: tenantId,
          data: { provisioning: { status: nextStatus } },
        })
        .catch((err) => {
          payload.logger.warn(
            `Failed to sync derived provisioning status for tenant ${tenantId}: ${err instanceof Error ? err.message : err}`,
          )
        })
      status = nextStatus
    }

    return {
      status: {
        status,
        lastRunAt: provisioning?.lastRunAt ?? null,
        failed,
        theme,
        tenantCreatedAt: tenant.createdAt ?? null,
        // Settings id is used to build the "Edit settings" link in the
        // checklist UI.
        settings: { id: settings.docs[0]?.id },
      },
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to check provisioning status' }
  }
}

export async function runProvisionAction(
  tenantId: number | string,
): Promise<{ success: true; failedPages: string[] } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const { payload } = auth
  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    const result = await provision(payload, tenant)

    return { success: true, failedPages: result.failedPages }
  } catch (err) {
    payload.logger.error({ err }, 'Provisioning failed')
    return { error: err instanceof Error ? err.message : 'Failed to run provisioning' }
  }
}

/**
 * Manually mark a tenant's provisioning as complete. Used when an admin has
 * fixed the items that failed during provisioning without re-running it.
 * Clears `failed` but leaves `lastRunAt` unchanged (that still reflects the
 * actual last provision run).
 */
export async function markProvisioningCompleteAction(
  tenantId: number | string,
): Promise<{ success: true } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const { payload } = auth
  try {
    await payload.update({
      collection: 'tenants',
      id: tenantId,
      data: {
        provisioning: {
          status: 'complete',
          failed: undefined,
        },
      },
    })
    return { success: true }
  } catch (err) {
    payload.logger.error({ err }, 'Failed to mark provisioning complete')
    return { error: err instanceof Error ? err.message : 'Failed to mark provisioning complete' }
  }
}
