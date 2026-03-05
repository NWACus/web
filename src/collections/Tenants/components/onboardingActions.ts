'use server'

import { provision } from '@/collections/Tenants/endpoints/provisionTenant'
import config from '@payload-config'
import { getPayload } from 'payload'

export type ProvisioningStatus = {
  builtInPages: { count: number; expected: number }
  pages: { count: number }
  homePage: boolean
  navigation: boolean
  settings: boolean
  hasCustomDomain: boolean
}

export async function checkProvisioningStatusAction(
  tenantId: number,
): Promise<{ status: ProvisioningStatus } | { error: string }> {
  try {
    const payload = await getPayload({ config })

    const [builtInPages, pages, homePages, navigations, settings, tenant] = await Promise.all([
      payload.find({
        collection: 'builtInPages',
        where: { tenant: { equals: tenantId } },
        limit: 0,
      }),
      payload.find({
        collection: 'pages',
        where: { tenant: { equals: tenantId } },
        limit: 0,
      }),
      payload.find({
        collection: 'homePages',
        where: { tenant: { equals: tenantId } },
        limit: 1,
      }),
      payload.find({
        collection: 'navigations',
        where: { tenant: { equals: tenantId } },
        limit: 1,
      }),
      payload.find({
        collection: 'settings',
        where: { tenant: { equals: tenantId } },
        limit: 1,
      }),
      payload.findByID({
        collection: 'tenants',
        id: tenantId,
      }),
    ])

    return {
      status: {
        builtInPages: { count: builtInPages.totalDocs, expected: 4 },
        pages: { count: pages.totalDocs },
        homePage: homePages.docs.length > 0,
        navigation: navigations.docs.length > 0,
        settings: settings.docs.length > 0,
        hasCustomDomain: Boolean(tenant.customDomain),
      },
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to check provisioning status' }
  }
}

export async function runProvisionAction(
  tenantId: number,
): Promise<{ success: true } | { error: string }> {
  try {
    const payload = await getPayload({ config })

    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    await provision(payload, tenant)

    return { success: true }
  } catch (err) {
    const payload = await getPayload({ config })
    payload.logger.error({ err }, 'Provisioning failed')
    return { error: err instanceof Error ? err.message : 'Failed to run provisioning' }
  }
}
