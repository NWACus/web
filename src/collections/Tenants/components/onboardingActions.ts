'use server'

import { centerColorMap } from '@/app/api/[center]/og/centerColorMap'
import { provision, type ProvisioningFailed } from '@/collections/Tenants/endpoints/provisionTenant'
import { isRecord } from '@/utilities/isRecord'
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

export type ProvisioningStatus = {
  status: 'not_started' | 'in_progress' | 'complete' | 'partial'
  lastRunAt: string | null
  failed: ProvisioningFailed
  theme: { brandColors: boolean; ogColors: boolean }
  tenantCreatedAt: string | null
  settings: { id?: number | string }
}

// Provisioning is synchronous on the server, so anything longer than this is
// almost certainly a crashed run we should recover from rather than wait on.
const STALE_IN_PROGRESS_MS = 10 * 60 * 1000

export async function checkProvisioningStatusAction(
  tenantId: number | string,
): Promise<{ status: ProvisioningStatus } | { error: string }> {
  try {
    const payload = await getPayload({ config })

    const [tenant, settings, brandColors] = await Promise.all([
      payload.findByID({
        collection: 'tenants',
        id: tenantId,
      }),
      payload.find({
        collection: 'settings',
        where: { tenant: { equals: tenantId } },
        limit: 1,
        select: {},
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
    let status = provisioning?.status ?? 'not_started'
    let failed: ProvisioningFailed = isRecord(provisioning?.failed) ? provisioning.failed : {}
    if (status === 'in_progress' && provisioning?.lastRunAt) {
      const age = Date.now() - new Date(provisioning.lastRunAt).getTime()
      if (age > STALE_IN_PROGRESS_MS) {
        status = 'partial'
        failed = { ...failed, timedOut: 'Provisioning timed out. It may still be running.' }
      }
    }

    return {
      status: {
        status,
        lastRunAt: provisioning?.lastRunAt ?? null,
        failed,
        theme: {
          // Check if a CSS class matching the tenant slug exists in colors.css (e.g. ".dvac {")
          brandColors: brandColors.includes(`.${tenant.slug} {`),
          // Check if the tenant slug exists as a key in centerColorMap in the OG route
          ogColors: tenant.slug in centerColorMap,
        },
        tenantCreatedAt: tenant.createdAt ?? null,
        // Settings is only fetched for the id (used to build the "Update Brand
        // Assets" link in the checklist UI)
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
  const payload = await getPayload({ config })
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
  const payload = await getPayload({ config })
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
