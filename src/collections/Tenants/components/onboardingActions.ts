'use server'

import { provision } from '@/collections/Tenants/endpoints/provisionTenant'
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

export type ProvisioningStatus = {
  builtInPages: { count: number; expected: number }
  pages: { count: number }
  homePage: boolean
  navigation: boolean
  settings: boolean
  hasTheme: boolean
}

export async function checkProvisioningStatusAction(
  tenantId: number,
): Promise<{ status: ProvisioningStatus } | { error: string }> {
  try {
    const payload = await getPayload({ config })

    const [builtInPages, pages, homePages, navigations, settings, tenant, colorsCSS] =
      await Promise.all([
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
        fs.readFile(path.join(process.cwd(), 'src/app/(frontend)/colors.css'), 'utf-8').catch(
          () => '', // Return empty string if file can't be read
        ),
      ])

    return {
      status: {
        builtInPages: { count: builtInPages.totalDocs, expected: 4 },
        pages: { count: pages.totalDocs },
        homePage: homePages.docs.length > 0,
        navigation: navigations.docs.length > 0,
        settings: settings.docs.length > 0,
        // Check if a CSS class matching the tenant slug exists in colors.css (e.g. ".nwac {")
        hasTheme: new RegExp(`\\.${tenant.slug}\\s*\\{`).test(colorsCSS),
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
